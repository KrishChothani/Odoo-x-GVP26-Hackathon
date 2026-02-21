import { AsyncHandler } from "../Utils/AsyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { Vehicle } from "../Models/vehicle.model.js";
import { FuelLog } from "../Models/fuelLog.model.js";
import { ServiceLog } from "../Models/serviceLog.model.js";
import { Trip } from "../Models/trip.model.js";
import { User } from "../Models/user.model.js";

/**
 * Get comprehensive operational analytics and financial reports
 * Includes:
 * - Fuel Efficiency (km/L per vehicle and fleet-wide)
 * - Vehicle ROI: (Revenue - (Maintenance + Fuel)) / Acquisition Cost
 * - Cost-per-km based on fuel logs from last trip
 * - Total expenses breakdown
 */
const getOperationalAnalytics = AsyncHandler(async (req, res) => {
  const { startDate, endDate, vehicleId } = req.query;

  // Date filter setup
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // Vehicle filter
  const vehicleFilter = vehicleId ? { _id: vehicleId } : {};

  // 1. Get all vehicles with their data
  const vehicles = await Vehicle.find(vehicleFilter).lean();

  // 2. Calculate analytics per vehicle
  const vehicleAnalytics = await Promise.all(
    vehicles.map(async (vehicle) => {
      // Get all fuel logs for this vehicle
      const fuelLogs = await FuelLog.find({
        vehicle: vehicle._id,
        expenseCategory: "FUEL",
        ...dateFilter,
      }).lean();

      // Get all trips for this vehicle
      const trips = await Trip.find({
        vehicle: vehicle._id,
        status: "COMPLETED",
        ...dateFilter,
      }).lean();

      // Get all service logs (maintenance) for this vehicle
      const serviceLogs = await ServiceLog.find({
        vehicle: vehicle._id,
        status: "COMPLETED",
        ...dateFilter,
      }).lean();

      // Get all misc expenses
      const miscExpenses = await FuelLog.find({
        vehicle: vehicle._id,
        expenseCategory: "MISC",
        ...dateFilter,
      }).lean();

      // Calculate total fuel cost
      const totalFuelCost = fuelLogs.reduce((sum, log) => sum + (log.totalCost || 0), 0);

      // Calculate total maintenance cost
      const totalMaintenanceCost = serviceLogs.reduce((sum, log) => sum + (log.cost || 0), 0);

      // Calculate total misc expenses
      const totalMiscCost = miscExpenses.reduce((sum, log) => sum + (log.totalCost || 0), 0);

      // Calculate total liters consumed
      const totalLiters = fuelLogs.reduce((sum, log) => sum + (log.liters || 0), 0);

      // Calculate total distance from trips
      const totalDistance = trips.reduce((sum, trip) => sum + (trip.distance || 0), 0);

      // Calculate fuel efficiency (km/L)
      const fuelEfficiency = totalLiters > 0 ? (totalDistance / totalLiters).toFixed(2) : 0;

      // Calculate revenue (assuming each trip has a revenue field, or use a default pricing model)
      // For now, let's assume revenue is based on distance * rate
      const revenuePerKm = 15; // ₹15 per km (adjust as needed)
      const totalRevenue = totalDistance * revenuePerKm;

      // Calculate total operating cost
      const totalOperatingCost = totalFuelCost + totalMaintenanceCost + totalMiscCost;

      // Calculate ROI: (Revenue - Operating Cost) / Acquisition Cost
      const roi =
        vehicle.acquisitionCost > 0
          ? (((totalRevenue - totalOperatingCost) / vehicle.acquisitionCost) * 100).toFixed(2)
          : 0;

      // Calculate cost per km
      const costPerKm = totalDistance > 0 ? (totalOperatingCost / totalDistance).toFixed(2) : 0;

      // Get last trip fuel log for cost-per-km update
      const lastTripFuelLog = await FuelLog.findOne({
        vehicle: vehicle._id,
        expenseCategory: "FUEL",
      })
        .sort({ fuelDate: -1 })
        .lean();

      const lastTripCostPerKm = lastTripFuelLog
        ? (lastTripFuelLog.totalCost / (lastTripFuelLog.odometerReading - (vehicle.odometer - (trips[trips.length - 1]?.distance || 0)))).toFixed(2)
        : 0;

      return {
        vehicleId: vehicle._id,
        vehicleName: vehicle.name,
        licensePlate: vehicle.licensePlate,
        vehicleType: vehicle.vehicleType,
        fuelEfficiency: parseFloat(fuelEfficiency),
        totalDistance,
        totalFuelCost,
        totalMaintenanceCost,
        totalMiscCost,
        totalOperatingCost,
        totalRevenue,
        roi: parseFloat(roi),
        costPerKm: parseFloat(costPerKm),
        lastTripCostPerKm: parseFloat(lastTripCostPerKm) || 0,
        totalTrips: trips.length,
        acquisitionCost: vehicle.acquisitionCost,
      };
    })
  );

  // 3. Calculate fleet-wide analytics
  const fleetTotals = vehicleAnalytics.reduce(
    (acc, vehicle) => ({
      totalDistance: acc.totalDistance + vehicle.totalDistance,
      totalFuelCost: acc.totalFuelCost + vehicle.totalFuelCost,
      totalMaintenanceCost: acc.totalMaintenanceCost + vehicle.totalMaintenanceCost,
      totalMiscCost: acc.totalMiscCost + vehicle.totalMiscCost,
      totalOperatingCost: acc.totalOperatingCost + vehicle.totalOperatingCost,
      totalRevenue: acc.totalRevenue + vehicle.totalRevenue,
      totalTrips: acc.totalTrips + vehicle.totalTrips,
      totalAcquisitionCost: acc.totalAcquisitionCost + vehicle.acquisitionCost,
    }),
    {
      totalDistance: 0,
      totalFuelCost: 0,
      totalMaintenanceCost: 0,
      totalMiscCost: 0,
      totalOperatingCost: 0,
      totalRevenue: 0,
      totalTrips: 0,
      totalAcquisitionCost: 0,
    }
  );

  // Calculate fleet-wide metrics
  const fleetFuelLogs = await FuelLog.find({
    expenseCategory: "FUEL",
    ...dateFilter,
  }).lean();
  const fleetTotalLiters = fleetFuelLogs.reduce((sum, log) => sum + (log.liters || 0), 0);
  const fleetFuelEfficiency =
    fleetTotalLiters > 0 ? (fleetTotals.totalDistance / fleetTotalLiters).toFixed(2) : 0;

  const fleetCostPerKm =
    fleetTotals.totalDistance > 0
      ? (fleetTotals.totalOperatingCost / fleetTotals.totalDistance).toFixed(2)
      : 0;

  const fleetROI =
    fleetTotals.totalAcquisitionCost > 0
      ? (
          ((fleetTotals.totalRevenue - fleetTotals.totalOperatingCost) /
            fleetTotals.totalAcquisitionCost) *
          100
        ).toFixed(2)
      : 0;

  // 4. Get top performers and underperformers
  const sortedByROI = [...vehicleAnalytics].sort((a, b) => b.roi - a.roi);
  const topPerformers = sortedByROI.slice(0, 5);
  const underPerformers = sortedByROI.slice(-5).reverse();

  // 5. Expense breakdown
  const expenseBreakdown = {
    fuel: fleetTotals.totalFuelCost,
    maintenance: fleetTotals.totalMaintenanceCost,
    miscellaneous: fleetTotals.totalMiscCost,
    total: fleetTotals.totalOperatingCost,
  };

  // 6. Monthly trends (if no date filter, get last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyData = await FuelLog.aggregate([
    {
      $match: {
        fuelDate: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$fuelDate" },
          month: { $month: "$fuelDate" },
        },
        totalFuelCost: {
          $sum: {
            $cond: [{ $eq: ["$expenseCategory", "FUEL"] }, "$totalCost", 0],
          },
        },
        totalMiscCost: {
          $sum: {
            $cond: [{ $eq: ["$expenseCategory", "MISC"] }, "$totalCost", 0],
          },
        },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  const monthlyMaintenanceData = await ServiceLog.aggregate([
    {
      $match: {
        completedAt: { $gte: sixMonthsAgo },
        status: "COMPLETED",
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$completedAt" },
          month: { $month: "$completedAt" },
        },
        totalMaintenanceCost: { $sum: "$cost" },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  // Combine monthly data
  const monthlyTrends = monthlyData.map((month) => {
    const maintenanceMonth = monthlyMaintenanceData.find(
      (m) => m._id.year === month._id.year && m._id.month === month._id.month
    );
    return {
      month: `${month._id.year}-${String(month._id.month).padStart(2, "0")}`,
      fuelCost: month.totalFuelCost || 0,
      miscCost: month.totalMiscCost || 0,
      maintenanceCost: maintenanceMonth?.totalMaintenanceCost || 0,
      totalCost: (month.totalFuelCost || 0) + (month.totalMiscCost || 0) + (maintenanceMonth?.totalMaintenanceCost || 0),
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        fleetSummary: {
          totalVehicles: vehicles.length,
          totalDistance: fleetTotals.totalDistance,
          totalRevenue: fleetTotals.totalRevenue,
          totalOperatingCost: fleetTotals.totalOperatingCost,
          totalProfit: fleetTotals.totalRevenue - fleetTotals.totalOperatingCost,
          fleetFuelEfficiency: parseFloat(fleetFuelEfficiency),
          fleetCostPerKm: parseFloat(fleetCostPerKm),
          fleetROI: parseFloat(fleetROI),
          totalTrips: fleetTotals.totalTrips,
        },
        expenseBreakdown,
        vehicleAnalytics,
        topPerformers,
        underPerformers,
        monthlyTrends,
      },
      "Operational analytics fetched successfully"
    )
  );
});

/**
 * Export monthly report data for CSV/PDF generation
 * Returns comprehensive data for a specific month
 */
const getMonthlyReportData = AsyncHandler(async (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    throw new ApiError(400, "Month and year are required");
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Get all vehicles
  const vehicles = await Vehicle.find({}).populate("assignedDriver", "fullName email").lean();

  // Get all fuel logs for the month
  const fuelLogs = await FuelLog.find({
    fuelDate: { $gte: startDate, $lte: endDate },
  })
    .populate("vehicle", "name licensePlate")
    .populate("driver", "fullName")
    .lean();

  // Get all service logs for the month
  const serviceLogs = await ServiceLog.find({
    completedAt: { $gte: startDate, $lte: endDate },
    status: "COMPLETED",
  })
    .populate("vehicle", "name licensePlate")
    .lean();

  // Get all trips for the month
  const trips = await Trip.find({
    updatedAt: { $gte: startDate, $lte: endDate },
    status: "COMPLETED",
  })
    .populate("vehicle", "name licensePlate")
    .populate("driver", "fullName")
    .lean();

  // Get all drivers with payroll info
  const drivers = await User.find({
    role: "DRIVER",
    isActive: true,
  }).lean();

  const driverPayroll = drivers.map((driver) => {
    const driverTrips = trips.filter((trip) => trip.driver._id.toString() === driver._id.toString());
    const completedTrips = driverTrips.filter((trip) => trip.status === "COMPLETED");

    return {
      driverId: driver._id,
      driverName: driver.fullName,
      email: driver.email,
      licenceNumber: driver.licenceNumber,
      totalTrips: driverTrips.length,
      completedTrips: completedTrips.length,
      baseSalary: 25000, // Base salary (adjust as needed)
      tripBonus: completedTrips.length * 500, // ₹500 per completed trip
      totalPay: 25000 + completedTrips.length * 500,
    };
  });

  // Vehicle health audit
  const vehicleHealthAudit = await Promise.all(
    vehicles.map(async (vehicle) => {
      const vehicleServices = serviceLogs.filter((log) => log.vehicle._id.toString() === vehicle._id.toString());
      const vehicleFuelLogs = fuelLogs.filter((log) => log.vehicle._id.toString() === vehicle._id.toString());

      const totalMaintenanceCost = vehicleServices.reduce((sum, log) => sum + (log.cost || 0), 0);
      const totalFuelCost = vehicleFuelLogs.reduce((sum, log) => sum + (log.totalCost || 0), 0);

      return {
        vehicleId: vehicle._id,
        vehicleName: vehicle.name,
        licensePlate: vehicle.licensePlate,
        status: vehicle.status,
        odometer: vehicle.odometer,
        lastMaintenanceDate: vehicle.lastMaintenanceDate,
        nextMaintenanceDue: vehicle.nextMaintenanceDue,
        insuranceExpiry: vehicle.insuranceExpiry,
        serviceCount: vehicleServices.length,
        totalMaintenanceCost,
        totalFuelCost,
        healthStatus:
          vehicle.status === "IN_SHOP" || vehicle.status === "OUT_OF_SERVICE"
            ? "NEEDS_ATTENTION"
            : "HEALTHY",
      };
    })
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reportPeriod: {
          month,
          year,
          startDate,
          endDate,
        },
        summary: {
          totalVehicles: vehicles.length,
          totalTrips: trips.length,
          totalDrivers: drivers.length,
          totalFuelCost: fuelLogs.reduce((sum, log) => sum + (log.totalCost || 0), 0),
          totalMaintenanceCost: serviceLogs.reduce((sum, log) => sum + (log.cost || 0), 0),
          totalPayroll: driverPayroll.reduce((sum, driver) => sum + driver.totalPay, 0),
        },
        driverPayroll,
        vehicleHealthAudit,
        fuelLogs: fuelLogs.map((log) => ({
          date: log.fuelDate,
          vehicle: log.vehicle.name,
          licensePlate: log.vehicle.licensePlate,
          driver: log.driver.fullName,
          category: log.expenseCategory,
          fuelType: log.fuelType,
          liters: log.liters,
          costPerLiter: log.costPerLiter,
          totalCost: log.totalCost,
          miscType: log.miscExpenseType,
          description: log.miscDescription,
        })),
        serviceLogs: serviceLogs.map((log) => ({
          date: log.completedAt,
          vehicle: log.vehicle.name,
          licensePlate: log.vehicle.licensePlate,
          service: log.issueOrService,
          type: log.serviceType,
          cost: log.cost,
          provider: log.serviceProvider,
        })),
      },
      "Monthly report data fetched successfully"
    )
  );
});

export { getOperationalAnalytics, getMonthlyReportData };
