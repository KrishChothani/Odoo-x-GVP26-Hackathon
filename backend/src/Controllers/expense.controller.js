import { FuelLog } from "../Models/fuelLog.model.js";
import { Trip } from "../Models/trip.model.js";
import { Vehicle } from "../Models/vehicle.model.js";
import { ServiceLog } from "../Models/serviceLog.model.js";
import { User } from "../Models/user.model.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { AsyncHandler } from "../Utils/AsyncHandler.js";
import mongoose from "mongoose";

/**
 * @desc    Create a new fuel log entry
 * @route   POST /api/v1/expenses/fuel
 * @access  Private (DISPATCHER, FLEET_MANAGER, DRIVER)
 */
export const createFuelLog = AsyncHandler(async (req, res) => {
  const {
    tripId,
    vehicleId,
    driverId,
    fuelType,
    liters,
    costPerLiter,
    totalCost,
    fuelDate,
    fuelStation,
    location,
    odometerReading,
    receiptImage,
    notes,
    paymentMethod,
    distanceCovered,
    expenseCategory,
    miscExpenseType,
    miscDescription,
  } = req.body;

  // Validate required fields based on expense category
  const category = expenseCategory || 'FUEL';
  
  if (!vehicleId || !driverId || !odometerReading) {
    throw new ApiError(400, "Vehicle, driver, and odometer reading are required");
  }

  if (category === 'FUEL') {
    if (!liters || !costPerLiter) {
      throw new ApiError(400, "Liters and cost per liter are required for fuel expenses");
    }
  } else if (category === 'MISC') {
    if (!miscExpenseType || !totalCost) {
      throw new ApiError(400, "Expense type and total cost are required for miscellaneous expenses");
    }
  }

  // Verify trip exists and is completed (if trip is provided)
  let trip = null;
  if (tripId) {
    trip = await Trip.findById(tripId);
    if (!trip) {
      throw new ApiError(404, "Trip not found");
    }
    if (trip.status !== "COMPLETED") {
      throw new ApiError(400, "Fuel logs can only be added for completed trips");
    }
  }

  // Verify vehicle exists
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  // Verify driver exists and is a driver
  const driver = await User.findById(driverId);
  if (!driver || driver.role !== "DRIVER") {
    throw new ApiError(404, "Driver not found or invalid role");
  }

  // Validate odometer reading is greater than vehicle's current odometer
  if (odometerReading < vehicle.odometer) {
    throw new ApiError(400, `Odometer reading (${odometerReading} km) cannot be less than vehicle's current odometer (${vehicle.odometer} km)`);
  }

  // Calculate total cost if not provided
  const calculatedTotalCost = category === 'FUEL' 
    ? (totalCost || liters * costPerLiter)
    : totalCost;

  // Prepare fuel log data based on expense category
  const fuelLogData = {
    trip: tripId || null,
    vehicle: vehicleId,
    driver: driverId,
    expenseCategory: category,
    totalCost: calculatedTotalCost,
    fuelDate: fuelDate || new Date(),
    location,
    odometerReading,
    receiptImage,
    notes,
    paymentMethod: paymentMethod || "CASH",
    createdBy: req.user._id,
  };

  // Add fuel-specific fields
  if (category === 'FUEL') {
    fuelLogData.fuelType = fuelType || "DIESEL";
    fuelLogData.liters = liters;
    fuelLogData.costPerLiter = costPerLiter;
    fuelLogData.fuelStation = fuelStation;
    fuelLogData.distanceCovered = distanceCovered || (trip ? trip.distance : 0);
  }

  // Add misc-specific fields
  if (category === 'MISC') {
    fuelLogData.miscExpenseType = miscExpenseType;
    fuelLogData.miscDescription = miscDescription;
  }

  // Create fuel log
  const fuelLog = await FuelLog.create(fuelLogData);

  // Update vehicle odometer and fuel efficiency
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update vehicle odometer
    vehicle.odometer = odometerReading;
    
    // Calculate and update fuel efficiency if we have distance data (only for FUEL expenses)
    if (category === 'FUEL' && distanceCovered && liters > 0) {
      const efficiency = Number((distanceCovered / liters).toFixed(2));
      vehicle.fuelEfficiency = efficiency;
    }
    
    await vehicle.save({ session });

    // Update trip fuel data (only if trip is provided and it's a FUEL expense)
    if (trip && category === 'FUEL') {
      trip.fuelConsumed = (trip.fuelConsumed || 0) + liters;
      trip.fuelCost = (trip.fuelCost || 0) + calculatedTotalCost;
      await trip.save({ session });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw new ApiError(500, `Failed to update vehicle/trip data: ${error.message}`);
  } finally {
    session.endSession();
  }

  // Populate the fuel log before returning
  const populatedFuelLog = await FuelLog.findById(fuelLog._id)
    .populate("vehicle", "name licensePlate vehicleType odometer")
    .populate("driver", "name email phone")
    .populate("trip", "tripNumber status distance origin destination")
    .populate("createdBy", "name email role");

  res.status(201).json(
    new ApiResponse(201, populatedFuelLog, "Fuel log created successfully! Vehicle odometer and fuel efficiency updated.")
  );
});

/**
 * @desc    Get all fuel logs with filters
 * @route   GET /api/v1/expenses/fuel
 * @access  Private (DISPATCHER, FLEET_MANAGER, FINANCIAL_ANALYST)
 */
export const getAllFuelLogs = AsyncHandler(async (req, res) => {
  const {
    vehicleId,
    tripId,
    driverId,
    fuelType,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 15,
    sortBy = "fuelDate",
    sortOrder = "desc",
  } = req.query;

  // Build filter object
  const filter = {};

  if (vehicleId) filter.vehicle = vehicleId;
  if (tripId) filter.trip = tripId;
  if (driverId) filter.driver = driverId;
  if (fuelType) filter.fuelType = fuelType;

  // Date range filter
  if (startDate || endDate) {
    filter.fuelDate = {};
    if (startDate) filter.fuelDate.$gte = new Date(startDate);
    if (endDate) filter.fuelDate.$lte = new Date(endDate);
  }

  // Search filter (log number, fuel station, location, notes)
  if (search) {
    filter.$or = [
      { logNumber: { $regex: search, $options: "i" } },
      { fuelStation: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
      { notes: { $regex: search, $options: "i" } },
    ];
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  // Execute query
  const fuelLogs = await FuelLog.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .populate("vehicle", "name licensePlate vehicleType odometer fuelEfficiency")
    .populate("driver", "name email phone")
    .populate("trip", "tripNumber status distance origin destination")
    .populate("createdBy", "name email role");

  const totalCount = await FuelLog.countDocuments(filter);

  res.status(200).json(
    new ApiResponse(200, {
      fuelLogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        limit: parseInt(limit),
      },
    }, "Fuel logs retrieved successfully")
  );
});

/**
 * @desc    Get fuel log by ID
 * @route   GET /api/v1/expenses/fuel/:id
 * @access  Private (DISPATCHER, FLEET_MANAGER, FINANCIAL_ANALYST, DRIVER)
 */
export const getFuelLogById = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const fuelLog = await FuelLog.findById(id)
    .populate("vehicle", "name licensePlate vehicleType odometer fuelEfficiency maxLoadCapacity region")
    .populate("driver", "name email phone licenceNumber licenceType dutyStatus")
    .populate("trip", "tripNumber status distance origin destination actualStartTime actualEndTime cargoWeight")
    .populate("createdBy", "name email role phone");

  if (!fuelLog) {
    throw new ApiError(404, "Fuel log not found");
  }

  res.status(200).json(
    new ApiResponse(200, fuelLog, "Fuel log retrieved successfully")
  );
});

/**
 * @desc    Update fuel log
 * @route   PUT /api/v1/expenses/fuel/:id
 * @access  Private (DISPATCHER, FLEET_MANAGER)
 */
export const updateFuelLog = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Remove fields that shouldn't be updated
  delete updateData.logNumber;
  delete updateData.trip;
  delete updateData.vehicle;
  delete updateData.driver;
  delete updateData.createdBy;

  const fuelLog = await FuelLog.findById(id);
  if (!fuelLog) {
    throw new ApiError(404, "Fuel log not found");
  }

  // Recalculate total cost if liters or cost per liter changed
  if (updateData.liters || updateData.costPerLiter) {
    const liters = updateData.liters || fuelLog.liters;
    const costPerLiter = updateData.costPerLiter || fuelLog.costPerLiter;
    updateData.totalCost = liters * costPerLiter;
  }

  // Recalculate fuel efficiency if distance or liters changed
  if (updateData.distanceCovered || updateData.liters) {
    const distance = updateData.distanceCovered || fuelLog.distanceCovered;
    const liters = updateData.liters || fuelLog.liters;
    if (distance && liters > 0) {
      updateData.fuelEfficiency = Number((distance / liters).toFixed(2));
    }
  }

  Object.assign(fuelLog, updateData);
  await fuelLog.save();

  const updatedFuelLog = await FuelLog.findById(id)
    .populate("vehicle", "name licensePlate vehicleType")
    .populate("driver", "name email")
    .populate("trip", "tripNumber status distance")
    .populate("createdBy", "name email role");

  res.status(200).json(
    new ApiResponse(200, updatedFuelLog, "Fuel log updated successfully")
  );
});

/**
 * @desc    Delete fuel log
 * @route   DELETE /api/v1/expenses/fuel/:id
 * @access  Private (FLEET_MANAGER only)
 */
export const deleteFuelLog = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const fuelLog = await FuelLog.findById(id);
  if (!fuelLog) {
    throw new ApiError(404, "Fuel log not found");
  }

  await FuelLog.findByIdAndDelete(id);

  res.status(200).json(
    new ApiResponse(200, null, "Fuel log deleted successfully")
  );
});

/**
 * @desc    Get vehicle operational costs (Fuel + Maintenance)
 * @route   GET /api/v1/expenses/vehicle/:vehicleId/costs
 * @access  Private (FLEET_MANAGER, FINANCIAL_ANALYST)
 */
export const getVehicleOperationalCosts = AsyncHandler(async (req, res) => {
  const { vehicleId } = req.params;
  const { startDate, endDate } = req.query;

  // Verify vehicle exists
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  // Build date filter
  const dateFilter = {};
  if (startDate || endDate) {
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
  }

  // Get fuel costs
  const fuelFilter = { vehicle: vehicleId };
  if (startDate || endDate) fuelFilter.fuelDate = dateFilter;

  const fuelCosts = await FuelLog.aggregate([
    { $match: fuelFilter },
    {
      $group: {
        _id: null,
        totalFuelCost: { $sum: "$totalCost" },
        totalLiters: { $sum: "$liters" },
        totalDistance: { $sum: "$distanceCovered" },
        fuelLogCount: { $sum: 1 },
        avgCostPerLiter: { $avg: "$costPerLiter" },
        avgFuelEfficiency: { $avg: "$fuelEfficiency" },
      },
    },
  ]);

  // Get maintenance costs
  const maintenanceFilter = { vehicle: vehicleId, status: "COMPLETED" };
  if (startDate || endDate) maintenanceFilter.completedAt = dateFilter;

  const maintenanceCosts = await ServiceLog.aggregate([
    { $match: maintenanceFilter },
    {
      $group: {
        _id: null,
        totalMaintenanceCost: { $sum: "$cost" },
        maintenanceCount: { $sum: 1 },
        avgMaintenanceCost: { $avg: "$cost" },
      },
    },
  ]);

  const fuelData = fuelCosts[0] || {
    totalFuelCost: 0,
    totalLiters: 0,
    totalDistance: 0,
    fuelLogCount: 0,
    avgCostPerLiter: 0,
    avgFuelEfficiency: 0,
  };

  const maintenanceData = maintenanceCosts[0] || {
    totalMaintenanceCost: 0,
    maintenanceCount: 0,
    avgMaintenanceCost: 0,
  };

  const totalOperationalCost = fuelData.totalFuelCost + maintenanceData.totalMaintenanceCost;
  const costPerKm = fuelData.totalDistance > 0 ? (totalOperationalCost / fuelData.totalDistance).toFixed(2) : 0;

  res.status(200).json(
    new ApiResponse(200, {
      vehicle: {
        id: vehicle._id,
        name: vehicle.name,
        licensePlate: vehicle.licensePlate,
        vehicleType: vehicle.vehicleType,
        currentOdometer: vehicle.odometer,
      },
      dateRange: {
        startDate: startDate || "All time",
        endDate: endDate || "Present",
      },
      fuelCosts: {
        totalCost: Number(fuelData.totalFuelCost.toFixed(2)),
        totalLiters: Number(fuelData.totalLiters.toFixed(2)),
        totalDistance: Number(fuelData.totalDistance.toFixed(2)),
        logCount: fuelData.fuelLogCount,
        avgCostPerLiter: Number(fuelData.avgCostPerLiter.toFixed(2)),
        avgFuelEfficiency: Number(fuelData.avgFuelEfficiency.toFixed(2)),
      },
      maintenanceCosts: {
        totalCost: Number(maintenanceData.totalMaintenanceCost.toFixed(2)),
        serviceCount: maintenanceData.maintenanceCount,
        avgCost: Number(maintenanceData.avgMaintenanceCost.toFixed(2)),
      },
      totalOperationalCost: Number(totalOperationalCost.toFixed(2)),
      costPerKm: Number(costPerKm),
    }, "Vehicle operational costs calculated successfully")
  );
});

/**
 * @desc    Get vehicle analytics and trends
 * @route   GET /api/v1/expenses/vehicle/:vehicleId/analytics
 * @access  Private (FLEET_MANAGER, FINANCIAL_ANALYST)
 */
export const getVehicleAnalytics = AsyncHandler(async (req, res) => {
  const { vehicleId } = req.params;
  const { months = 6 } = req.query;

  // Verify vehicle exists
  const vehicle = await Vehicle.findById(vehicleId).populate("assignedDriver", "name email phone");
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  const monthsAgo = new Date();
  monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months));

  // Monthly fuel cost trends
  const fuelTrends = await FuelLog.aggregate([
    {
      $match: {
        vehicle: new mongoose.Types.ObjectId(vehicleId),
        fuelDate: { $gte: monthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$fuelDate" },
          month: { $month: "$fuelDate" },
        },
        totalCost: { $sum: "$totalCost" },
        totalLiters: { $sum: "$liters" },
        totalDistance: { $sum: "$distanceCovered" },
        avgEfficiency: { $avg: "$fuelEfficiency" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Monthly maintenance cost trends
  const maintenanceTrends = await ServiceLog.aggregate([
    {
      $match: {
        vehicle: new mongoose.Types.ObjectId(vehicleId),
        status: "COMPLETED",
        completedAt: { $gte: monthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$completedAt" },
          month: { $month: "$completedAt" },
        },
        totalCost: { $sum: "$cost" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Total trips completed
  const tripStats = await Trip.aggregate([
    {
      $match: {
        vehicle: new mongoose.Types.ObjectId(vehicleId),
        status: "COMPLETED",
        actualEndTime: { $gte: monthsAgo },
      },
    },
    {
      $group: {
        _id: null,
        totalTrips: { $sum: 1 },
        totalDistance: { $sum: "$distance" },
        totalRevenue: { $sum: "$revenue" },
        avgDistance: { $avg: "$distance" },
      },
    },
  ]);

  // Recent fuel logs
  const recentFuelLogs = await FuelLog.find({ vehicle: vehicleId })
    .sort({ fuelDate: -1 })
    .limit(5)
    .populate("driver", "name")
    .populate("trip", "tripNumber distance");

  // Recent maintenance logs
  const recentMaintenance = await ServiceLog.find({ vehicle: vehicleId, status: "COMPLETED" })
    .sort({ completedAt: -1 })
    .limit(5)
    .select("logNumber issueOrService cost completedAt serviceType");

  res.status(200).json(
    new ApiResponse(200, {
      vehicle: {
        id: vehicle._id,
        name: vehicle.name,
        licensePlate: vehicle.licensePlate,
        vehicleType: vehicle.vehicleType,
        status: vehicle.status,
        currentOdometer: vehicle.odometer,
        fuelEfficiency: vehicle.fuelEfficiency,
        assignedDriver: vehicle.assignedDriver,
      },
      periodMonths: parseInt(months),
      fuelTrends,
      maintenanceTrends,
      tripStats: tripStats[0] || {
        totalTrips: 0,
        totalDistance: 0,
        totalRevenue: 0,
        avgDistance: 0,
      },
      recentFuelLogs,
      recentMaintenance,
    }, "Vehicle analytics retrieved successfully")
  );
});

/**
 * @desc    Get trip expense summary
 * @route   GET /api/v1/expenses/trip/:tripId/summary
 * @access  Private (DISPATCHER, FLEET_MANAGER, FINANCIAL_ANALYST)
 */
export const getTripExpenseSummary = AsyncHandler(async (req, res) => {
  const { tripId } = req.params;

  // Verify trip exists
  const trip = await Trip.findById(tripId)
    .populate("vehicle", "name licensePlate vehicleType")
    .populate("driver", "name email phone")
    .populate("cargo", "description category weight");

  if (!trip) {
    throw new ApiError(404, "Trip not found");
  }

  // Get all fuel logs for this trip
  const fuelLogs = await FuelLog.find({ trip: tripId })
    .sort({ fuelDate: -1 })
    .populate("createdBy", "name role");

  // Calculate totals
  const totalFuelCost = fuelLogs.reduce((sum, log) => sum + log.totalCost, 0);
  const totalLiters = fuelLogs.reduce((sum, log) => sum + log.liters, 0);

  res.status(200).json(
    new ApiResponse(200, {
      trip: {
        id: trip._id,
        tripNumber: trip.tripNumber,
        status: trip.status,
        distance: trip.distance,
        origin: trip.origin,
        destination: trip.destination,
        vehicle: trip.vehicle,
        driver: trip.driver,
        cargo: trip.cargo,
        revenue: trip.revenue,
        actualStartTime: trip.actualStartTime,
        actualEndTime: trip.actualEndTime,
      },
      fuelExpenses: {
        logs: fuelLogs,
        totalCost: Number(totalFuelCost.toFixed(2)),
        totalLiters: Number(totalLiters.toFixed(2)),
        logCount: fuelLogs.length,
      },
      profitability: {
        revenue: trip.revenue || 0,
        fuelCost: Number(totalFuelCost.toFixed(2)),
        netProfit: Number(((trip.revenue || 0) - totalFuelCost).toFixed(2)),
      },
    }, "Trip expense summary retrieved successfully")
  );
});

/**
 * @desc    Get expense statistics dashboard
 * @route   GET /api/v1/expenses/stats
 * @access  Private (FLEET_MANAGER, FINANCIAL_ANALYST)
 */
export const getExpenseStats = AsyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  // Build date filter
  const dateFilter = {};
  if (startDate || endDate) {
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
  }

  // Overall fuel statistics
  const fuelStatsQuery = {};
  if (startDate || endDate) fuelStatsQuery.fuelDate = dateFilter;

  const fuelStats = await FuelLog.aggregate([
    { $match: fuelStatsQuery },
    {
      $group: {
        _id: null,
        totalFuelCost: { $sum: "$totalCost" },
        totalLiters: { $sum: "$liters" },
        totalLogs: { $sum: 1 },
        avgCostPerLog: { $avg: "$totalCost" },
        avgLitersPerLog: { $avg: "$liters" },
      },
    },
  ]);

  // Fuel type breakdown
  const fuelTypeBreakdown = await FuelLog.aggregate([
    { $match: fuelStatsQuery },
    {
      $group: {
        _id: "$fuelType",
        totalCost: { $sum: "$totalCost" },
        totalLiters: { $sum: "$liters" },
        count: { $sum: 1 },
      },
    },
  ]);

  // Top spending vehicles
  const topSpendingVehicles = await FuelLog.aggregate([
    { $match: fuelStatsQuery },
    {
      $group: {
        _id: "$vehicle",
        totalCost: { $sum: "$totalCost" },
        totalLiters: { $sum: "$liters" },
        logCount: { $sum: 1 },
      },
    },
    { $sort: { totalCost: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "vehicles",
        localField: "_id",
        foreignField: "_id",
        as: "vehicleDetails",
      },
    },
    { $unwind: "$vehicleDetails" },
    {
      $project: {
        vehicleId: "$_id",
        vehicleName: "$vehicleDetails.name",
        licensePlate: "$vehicleDetails.licensePlate",
        vehicleType: "$vehicleDetails.vehicleType",
        totalCost: 1,
        totalLiters: 1,
        logCount: 1,
      },
    },
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      dateRange: {
        startDate: startDate || "All time",
        endDate: endDate || "Present",
      },
      fuelStats: fuelStats[0] || {
        totalFuelCost: 0,
        totalLiters: 0,
        totalLogs: 0,
        avgCostPerLog: 0,
        avgLitersPerLog: 0,
      },
      fuelTypeBreakdown,
      topSpendingVehicles,
    }, "Expense statistics retrieved successfully")
  );
});

/**
 * @desc    Get all vehicles with their aggregated costs (Fuel + Misc + Maintenance)
 * @route   GET /api/v1/expenses/vehicles/all-costs
 * @access  Private (FLEET_MANAGER, DISPATCHER, FINANCIAL_ANALYST)
 */
export const getAllVehiclesCosts = AsyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  // Build date filter
  const dateFilter = {};
  if (startDate || endDate) {
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
  }

  // Get all active vehicles
  const vehicles = await Vehicle.find({ isActive: true }).sort({ licensePlate: 1 });

  // Build aggregated costs for each vehicle
  const vehicleCostsPromises = vehicles.map(async (vehicle) => {
    // Get fuel costs
    const fuelFilter = { vehicle: vehicle._id, expenseCategory: "FUEL" };
    if (startDate || endDate) fuelFilter.fuelDate = dateFilter;

    const fuelCosts = await FuelLog.aggregate([
      { $match: fuelFilter },
      {
        $group: {
          _id: null,
          totalFuelCost: { $sum: "$totalCost" },
        },
      },
    ]);

    // Get misc costs
    const miscFilter = { vehicle: vehicle._id, expenseCategory: "MISC" };
    if (startDate || endDate) miscFilter.fuelDate = dateFilter;

    const miscCosts = await FuelLog.aggregate([
      { $match: miscFilter },
      {
        $group: {
          _id: null,
          totalMiscCost: { $sum: "$totalCost" },
        },
      },
    ]);

    // Get maintenance costs
    const maintenanceFilter = { vehicle: vehicle._id, status: "COMPLETED" };
    if (startDate || endDate) maintenanceFilter.completedAt = dateFilter;

    const maintenanceCosts = await ServiceLog.aggregate([
      { $match: maintenanceFilter },
      {
        $group: {
          _id: null,
          totalMaintenanceCost: { $sum: "$cost" },
        },
      },
    ]);

    const fuelCost = fuelCosts[0]?.totalFuelCost || 0;
    const miscCost = miscCosts[0]?.totalMiscCost || 0;
    const maintenanceCost = maintenanceCosts[0]?.totalMaintenanceCost || 0;
    const totalCost = fuelCost + miscCost + maintenanceCost;

    return {
      vehicleId: vehicle._id,
      licensePlate: vehicle.licensePlate,
      name: vehicle.name,
      vehicleType: vehicle.vehicleType,
      fuelCost: Number(fuelCost.toFixed(2)),
      miscCost: Number(miscCost.toFixed(2)),
      maintenanceCost: Number(maintenanceCost.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
    };
  });

  const vehicleCosts = await Promise.all(vehicleCostsPromises);

  // Calculate summary totals
  const summary = {
    totalVehicles: vehicleCosts.length,
    totalFuelCost: vehicleCosts.reduce((sum, v) => sum + v.fuelCost, 0),
    totalMiscCost: vehicleCosts.reduce((sum, v) => sum + v.miscCost, 0),
    totalMaintenanceCost: vehicleCosts.reduce((sum, v) => sum + v.maintenanceCost, 0),
    grandTotal: vehicleCosts.reduce((sum, v) => sum + v.totalCost, 0),
  };

  res.status(200).json(
    new ApiResponse(200, {
      dateRange: {
        startDate: startDate || "All time",
        endDate: endDate || "Present",
      },
      summary,
      vehicles: vehicleCosts,
    }, "All vehicles costs retrieved successfully")
  );
});
