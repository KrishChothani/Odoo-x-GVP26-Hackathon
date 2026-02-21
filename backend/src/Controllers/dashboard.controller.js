import { Vehicle } from "../Models/vehicle.model.js";
import { Trip } from "../Models/trip.model.js";
import { Cargo } from "../Models/cargo.model.js";
import { User } from "../Models/user.model.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { AsyncHandler } from "../Utils/AsyncHandler.js";

/**
 * Get Dashboard KPIs
 * Returns key metrics for the fleet management dashboard
 */
const getDashboardKPIs = AsyncHandler(async (req, res) => {
  // Get filter parameters from query
  const { vehicleType, status, region } = req.query;

  // Build filter object for vehicles
  const vehicleFilter = {};
  if (vehicleType) vehicleFilter.vehicleType = vehicleType;
  if (status) vehicleFilter.status = status;
  if (region) vehicleFilter.region = region;

  // 1. Active Fleet - Vehicles currently on trip
  const activeFleetCount = await Vehicle.countDocuments({
    ...vehicleFilter,
    status: "ON_TRIP",
  });

  // 2. Maintenance Alerts - Vehicles in maintenance
  const maintenanceAlertCount = await Vehicle.countDocuments({
    ...vehicleFilter,
    status: "IN_SHOP",
  });

  // 3. Total vehicles for utilization calculation
  const totalVehicles = await Vehicle.countDocuments(vehicleFilter);

  // 4. Vehicles in use (ON_TRIP or IN_SHOP)
  const vehiclesInUse = await Vehicle.countDocuments({
    ...vehicleFilter,
    status: { $in: ["ON_TRIP", "IN_SHOP"] },
  });

  // 5. Utilization Rate percentage
  const utilizationRate =
    totalVehicles > 0 ? ((vehiclesInUse / totalVehicles) * 100).toFixed(2) : 0;

  // 6. Pending Cargo - Cargo awaiting assignment
  const pendingCargoCount = await Cargo.countDocuments({
    status: "PENDING",
  });

  // 7. Additional stats
  const totalTrips = await Trip.countDocuments();
  const activeTrips = await Trip.countDocuments({
    status: { $in: ["DISPATCHED", "DRAFT"] },
  });
  const completedTrips = await Trip.countDocuments({ status: "COMPLETED" });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        kpis: {
          activeFleet: activeFleetCount,
          maintenanceAlerts: maintenanceAlertCount,
          utilizationRate: parseFloat(utilizationRate),
          pendingCargo: pendingCargoCount,
        },
        stats: {
          totalVehicles,
          totalTrips,
          activeTrips,
          completedTrips,
        },
      },
      "Dashboard KPIs fetched successfully"
    )
  );
});

/**
 * Get Dashboard Table Data
 * Returns trip data for the dashboard table view
 */
const getDashboardTableData = AsyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    vehicleType,
    status,
    region,
    search,
  } = req.query;

  // Build aggregation pipeline
  const matchStage = {};
  if (status) matchStage.status = status;

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "vehicles",
        localField: "vehicle",
        foreignField: "_id",
        as: "vehicleData",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "driver",
        foreignField: "_id",
        as: "driverData",
      },
    },
    {
      $lookup: {
        from: "cargos",
        localField: "cargo",
        foreignField: "_id",
        as: "cargoData",
      },
    },
    { $unwind: { path: "$vehicleData", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$driverData", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$cargoData", preserveNullAndEmptyArrays: true } },
  ];

  // Apply vehicle filters
  if (vehicleType || region) {
    const vehicleMatch = {};
    if (vehicleType) vehicleMatch["vehicleData.vehicleType"] = vehicleType;
    if (region) vehicleMatch["vehicleData.region"] = region;
    pipeline.push({ $match: vehicleMatch });
  }

  // Apply search filter
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { tripNumber: { $regex: search, $options: "i" } },
          { "vehicleData.name": { $regex: search, $options: "i" } },
          { "driverData.name": { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  // Project final shape
  pipeline.push({
    $project: {
      tripNumber: 1,
      vehicle: {
        _id: "$vehicleData._id",
        name: "$vehicleData.name",
        model: "$vehicleData.model",
        licensePlate: "$vehicleData.licensePlate",
        vehicleType: "$vehicleData.vehicleType",
      },
      driver: {
        _id: "$driverData._id",
        name: "$driverData.name",
        phone: "$driverData.phone",
      },
      cargo: {
        _id: "$cargoData._id",
        cargoNumber: "$cargoData.cargoNumber",
        weight: "$cargoData.weight",
      },
      status: 1,
      origin: 1,
      destination: 1,
      scheduledStartTime: 1,
      actualStartTime: 1,
      actualEndTime: 1,
      createdAt: 1,
    },
  });

  // Sort by most recent
  pipeline.push({ $sort: { createdAt: -1 } });

  // Execute aggregation
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const trips = await Trip.aggregate([
    ...pipeline,
    { $skip: skip },
    { $limit: parseInt(limit) },
  ]);

  // Get total count
  const totalCount = await Trip.aggregate([
    ...pipeline,
    { $count: "total" },
  ]);

  const total = totalCount[0]?.total || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        trips,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Dashboard table data fetched successfully"
    )
  );
});

/**
 * Get Filter Options
 * Returns available options for dashboard filters
 */
const getFilterOptions = AsyncHandler(async (req, res) => {
  // Get unique vehicle types
  const vehicleTypes = await Vehicle.distinct("vehicleType");

  // Get unique regions
  const regions = await Vehicle.distinct("region");

  // Status options (from Vehicle schema)
  const statusOptions = ["AVAILABLE", "ON_TRIP", "IN_SHOP", "OUT_OF_SERVICE"];

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        vehicleTypes,
        regions: regions.filter((r) => r), // Remove null/empty values
        statusOptions,
      },
      "Filter options fetched successfully"
    )
  );
});

export { getDashboardKPIs, getDashboardTableData, getFilterOptions };
