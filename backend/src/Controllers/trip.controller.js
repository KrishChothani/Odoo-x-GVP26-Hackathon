import { AsyncHandler } from "../Utils/AsyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { Trip } from "../Models/trip.model.js";
import { Vehicle } from "../Models/vehicle.model.js";
import { User } from "../Models/user.model.js";
import mongoose from "mongoose";

// ─────────────────────────────────────────────
// CREATE TRIP
// ─────────────────────────────────────────────
/**
 * POST /api/v1/trips
 * Create a new trip with validations
 * Access: DISPATCHER, FLEET_MANAGER
 */
const createTrip = AsyncHandler(async (req, res) => {
  const {
    vehicleId,
    driverId,
    origin,
    destination,
    cargoWeight,
    distance,
    estimatedDuration,
    scheduledStartTime,
    notes,
  } = req.body;

  // Validate required fields
  if (!vehicleId || !driverId || !origin?.address || !destination?.address || !cargoWeight || !scheduledStartTime) {
    throw new ApiError(400, "Vehicle, driver, origin, destination, cargo weight, and scheduled start time are required");
  }

  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
    throw new ApiError(400, "Invalid vehicle ID");
  }
  if (!mongoose.Types.ObjectId.isValid(driverId)) {
    throw new ApiError(400, "Invalid driver ID");
  }

  // Fetch vehicle
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }
  if (!vehicle.isActive) {
    throw new ApiError(400, "Vehicle is not active");
  }
  if (vehicle.status !== "AVAILABLE") {
    throw new ApiError(400, `Vehicle is not available. Current status: ${vehicle.status}`);
  }

  // Fetch driver
  const driver = await User.findById(driverId);
  if (!driver) {
    throw new ApiError(404, "Driver not found");
  }
  if (driver.role !== "DRIVER") {
    throw new ApiError(400, "Selected user is not a driver");
  }
  if (!driver.isActive) {
    throw new ApiError(400, "Driver account is not active");
  }
  if (driver.dutyStatus !== "ON_DUTY") {
    throw new ApiError(400, `Driver is not on duty. Current status: ${driver.dutyStatus || 'OFF_DUTY'}`);
  }

  // Validate licence expiry
  if (driver.licenceExpiry && new Date(driver.licenceExpiry) < new Date()) {
    throw new ApiError(400, "Driver's licence has expired");
  }

  // Validate cargo weight against vehicle capacity
  if (cargoWeight > vehicle.maxLoadCapacity) {
    throw new ApiError(
      400,
      `Cargo weight (${cargoWeight}kg) exceeds vehicle capacity (${vehicle.maxLoadCapacity}kg)`
    );
  }

  // Create trip
  const trip = await Trip.create({
    vehicle: vehicleId,
    driver: driverId,
    origin,
    destination,
    cargoWeight,
    distance: distance || 0,
    estimatedDuration: estimatedDuration || 0,
    scheduledStartTime: new Date(scheduledStartTime),
    notes,
    status: "DRAFT",
    createdBy: req.user._id,
  });

  const populatedTrip = await Trip.findById(trip._id)
    .populate("vehicle", "name model licensePlate vehicleType maxLoadCapacity status")
    .populate("driver", "name email phone licenceNumber licenceType dutyStatus")
    .populate("createdBy", "name email");

  return res
    .status(201)
    .json(new ApiResponse(201, populatedTrip, "Trip created successfully"));
});

// ─────────────────────────────────────────────
// GET ALL TRIPS
// ─────────────────────────────────────────────
/**
 * GET /api/v1/trips
 * Fetch all trips with filters, search, and pagination
 * Access: DISPATCHER, FLEET_MANAGER, DRIVER
 */
const getAllTrips = AsyncHandler(async (req, res) => {
  const {
    status,
    vehicleId,
    driverId,
    search,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const filter = {};

  // Status filter
  if (status) {
    filter.status = status.toUpperCase();
  }

  // Vehicle filter
  if (vehicleId && mongoose.Types.ObjectId.isValid(vehicleId)) {
    filter.vehicle = vehicleId;
  }

  // Driver filter
  if (driverId && mongoose.Types.ObjectId.isValid(driverId)) {
    filter.driver = driverId;
  }

  // If user is a DRIVER, only show their trips
  if (req.user.role === "DRIVER") {
    filter.driver = req.user._id;
  }

  // Search
  if (search) {
    filter.$or = [
      { tripNumber: { $regex: search, $options: "i" } },
      { "origin.address": { $regex: search, $options: "i" } },
      { "destination.address": { $regex: search, $options: "i" } },
    ];
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

  const trips = await Trip.find(filter)
    .populate("vehicle", "name model licensePlate vehicleType maxLoadCapacity status odometer")
    .populate("driver", "name email phone licenceNumber licenceType dutyStatus")
    .populate("createdBy", "name email")
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum);

  const totalCount = await Trip.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(200, {
      trips,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        limit: limitNum,
      },
    }, "Trips fetched successfully")
  );
});

// ─────────────────────────────────────────────
// GET TRIP BY ID
// ─────────────────────────────────────────────
/**
 * GET /api/v1/trips/:id
 * Fetch a single trip by ID
 * Access: DISPATCHER, FLEET_MANAGER, DRIVER
 */
const getTripById = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid trip ID");
  }

  const trip = await Trip.findById(id)
    .populate("vehicle", "name model licensePlate vehicleType maxLoadCapacity status odometer region")
    .populate("driver", "name email phone licenceNumber licenceType licenceExpiry dutyStatus")
    .populate("createdBy", "name email role")
    .populate("cargo");

  if (!trip) {
    throw new ApiError(404, "Trip not found");
  }

  // If user is a DRIVER, only allow viewing their own trips
  if (req.user.role === "DRIVER" && trip.driver._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only view your own trips");
  }

  return res.status(200).json(new ApiResponse(200, trip, "Trip fetched successfully"));
});

// ─────────────────────────────────────────────
// DISPATCH TRIP
// ─────────────────────────────────────────────
/**
 * PATCH /api/v1/trips/:id/dispatch
 * Change trip status from DRAFT to DISPATCHED
 * Updates: Vehicle status → ON_TRIP, Driver status → ON_TRIP
 * Access: DISPATCHER, FLEET_MANAGER
 */
const dispatchTrip = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid trip ID");
  }

  const trip = await Trip.findById(id).populate("vehicle driver");

  if (!trip) {
    throw new ApiError(404, "Trip not found");
  }

  if (trip.status !== "DRAFT") {
    throw new ApiError(400, `Cannot dispatch trip with status: ${trip.status}`);
  }

  // Verify vehicle is still available
  if (trip.vehicle.status !== "AVAILABLE") {
    throw new ApiError(400, "Vehicle is no longer available");
  }

  // Verify driver is still on duty
  if (trip.driver.dutyStatus !== "ON_DUTY") {
    throw new ApiError(400, "Driver is no longer on duty");
  }

  // Start transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update trip status
    trip.status = "DISPATCHED";
    trip.actualStartTime = new Date();
    await trip.save({ session });

    // Update vehicle status
    await Vehicle.findByIdAndUpdate(
      trip.vehicle._id,
      { 
        status: "ON_TRIP",
        currentTrip: trip._id,
        assignedDriver: trip.driver._id,
      },
      { session }
    );

    // Update driver status
    await User.findByIdAndUpdate(
      trip.driver._id,
      { dutyStatus: "ON_TRIP" },
      { session }
    );

    await session.commitTransaction();

    const updatedTrip = await Trip.findById(trip._id)
      .populate("vehicle", "name model licensePlate status")
      .populate("driver", "name email dutyStatus");

    return res.status(200).json(
      new ApiResponse(200, updatedTrip, "Trip dispatched successfully")
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// ─────────────────────────────────────────────
// COMPLETE TRIP
// ─────────────────────────────────────────────
/**
 * PATCH /api/v1/trips/:id/complete
 * Mark trip as completed
 * Updates: Vehicle status → AVAILABLE, Driver status → ON_DUTY, Odometer
 * Access: DRIVER, DISPATCHER, FLEET_MANAGER
 */
const completeTrip = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { finalOdometer, fuelConsumed, fuelCost, revenue, notes } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid trip ID");
  }

  const trip = await Trip.findById(id).populate("vehicle driver");

  if (!trip) {
    throw new ApiError(404, "Trip not found");
  }

  // If user is DRIVER, verify they're assigned to this trip
  if (req.user.role === "DRIVER" && trip.driver._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only complete your own trips");
  }

  if (trip.status !== "DISPATCHED") {
    throw new ApiError(400, `Cannot complete trip with status: ${trip.status}`);
  }

  if (finalOdometer && finalOdometer < trip.vehicle.odometer) {
    throw new ApiError(400, "Final odometer cannot be less than starting odometer");
  }

  // Start transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update trip
    trip.status = "COMPLETED";
    trip.actualEndTime = new Date();
    if (fuelConsumed) trip.fuelConsumed = fuelConsumed;
    if (fuelCost) trip.fuelCost = fuelCost;
    if (revenue) trip.revenue = revenue;
    if (notes) trip.notes = notes;
    await trip.save({ session });

    // Update vehicle
    const vehicleUpdate = {
      status: "AVAILABLE",
      currentTrip: null,
      assignedDriver: null,
    };
    if (finalOdometer) {
      vehicleUpdate.odometer = finalOdometer;
    }
    await Vehicle.findByIdAndUpdate(trip.vehicle._id, vehicleUpdate, { session });

    // Update driver status and statistics
    await User.findByIdAndUpdate(
      trip.driver._id,
      {
        dutyStatus: "ON_DUTY",
        $inc: {
          "tripStats.totalTrips": 1,
          "tripStats.completedTrips": 1,
        },
      },
      { session }
    );

    await session.commitTransaction();

    const updatedTrip = await Trip.findById(trip._id)
      .populate("vehicle", "name model licensePlate status odometer")
      .populate("driver", "name email dutyStatus tripStats");

    return res.status(200).json(
      new ApiResponse(200, updatedTrip, "Trip completed successfully")
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// ─────────────────────────────────────────────
// CANCEL TRIP
// ─────────────────────────────────────────────
/**
 * PATCH /api/v1/trips/:id/cancel
 * Cancel a trip
 * Access: DISPATCHER, FLEET_MANAGER
 */
const cancelTrip = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid trip ID");
  }

  const trip = await Trip.findById(id).populate("vehicle driver");

  if (!trip) {
    throw new ApiError(404, "Trip not found");
  }

  if (trip.status === "COMPLETED" || trip.status === "CANCELLED") {
    throw new ApiError(400, `Cannot cancel trip with status: ${trip.status}`);
  }

  // Start transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update trip
    trip.status = "CANCELLED";
    if (reason) trip.notes = reason;
    await trip.save({ session });

    // If trip was dispatched, reset vehicle and driver status
    if (trip.status === "DISPATCHED" || trip.vehicle.status === "ON_TRIP") {
      await Vehicle.findByIdAndUpdate(
        trip.vehicle._id,
        {
          status: "AVAILABLE",
          currentTrip: null,
          assignedDriver: null,
        },
        { session }
      );

      await User.findByIdAndUpdate(
        trip.driver._id,
        {
          dutyStatus: "ON_DUTY",
          $inc: { "tripStats.cancelledTrips": 1 },
        },
        { session }
      );
    }

    await session.commitTransaction();

    const updatedTrip = await Trip.findById(trip._id)
      .populate("vehicle", "name model licensePlate status")
      .populate("driver", "name email dutyStatus");

    return res.status(200).json(
      new ApiResponse(200, updatedTrip, "Trip cancelled successfully")
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// ─────────────────────────────────────────────
// UPDATE TRIP
// ─────────────────────────────────────────────
/**
 * PUT /api/v1/trips/:id
 * Update trip details (only for DRAFT trips)
 * Access: DISPATCHER, FLEET_MANAGER
 */
const updateTrip = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    vehicleId,
    driverId,
    origin,
    destination,
    cargoWeight,
    distance,
    estimatedDuration,
    scheduledStartTime,
    notes,
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid trip ID");
  }

  const trip = await Trip.findById(id);

  if (!trip) {
    throw new ApiError(404, "Trip not found");
  }

  if (trip.status !== "DRAFT") {
    throw new ApiError(400, "Can only update trips in DRAFT status");
  }

  // If changing vehicle, validate it
  if (vehicleId && vehicleId !== trip.vehicle.toString()) {
    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      throw new ApiError(400, "Invalid vehicle ID");
    }
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle || !vehicle.isActive || vehicle.status !== "AVAILABLE") {
      throw new ApiError(400, "Vehicle is not available");
    }
    
    // Validate cargo weight if provided
    const weight = cargoWeight || trip.cargoWeight;
    if (weight > vehicle.maxLoadCapacity) {
      throw new ApiError(
        400,
        `Cargo weight (${weight}kg) exceeds vehicle capacity (${vehicle.maxLoadCapacity}kg)`
      );
    }
    trip.vehicle = vehicleId;
  }

  // If changing driver, validate them
  if (driverId && driverId !== trip.driver.toString()) {
    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      throw new ApiError(400, "Invalid driver ID");
    }
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== "DRIVER" || !driver.isActive) {
      throw new ApiError(400, "Driver is not valid");
    }
    if (driver.dutyStatus !== "ON_DUTY") {
      throw new ApiError(400, "Driver is not on duty");
    }
    trip.driver = driverId;
  }

  // Update other fields
  if (origin) trip.origin = origin;
  if (destination) trip.destination = destination;
  if (cargoWeight !== undefined) {
    // Validate against vehicle capacity
    const vehicle = await Vehicle.findById(trip.vehicle);
    if (cargoWeight > vehicle.maxLoadCapacity) {
      throw new ApiError(
        400,
        `Cargo weight (${cargoWeight}kg) exceeds vehicle capacity (${vehicle.maxLoadCapacity}kg)`
      );
    }
    trip.cargoWeight = cargoWeight;
  }
  if (distance !== undefined) trip.distance = distance;
  if (estimatedDuration !== undefined) trip.estimatedDuration = estimatedDuration;
  if (scheduledStartTime) trip.scheduledStartTime = new Date(scheduledStartTime);
  if (notes !== undefined) trip.notes = notes;

  await trip.save();

  const updatedTrip = await Trip.findById(trip._id)
    .populate("vehicle", "name model licensePlate vehicleType maxLoadCapacity status")
    .populate("driver", "name email phone licenceNumber licenceType dutyStatus")
    .populate("createdBy", "name email");

  return res.status(200).json(
    new ApiResponse(200, updatedTrip, "Trip updated successfully")
  );
});

// ─────────────────────────────────────────────
// DELETE TRIP
// ─────────────────────────────────────────────
/**
 * DELETE /api/v1/trips/:id
 * Delete a trip (only DRAFT trips)
 * Access: DISPATCHER, FLEET_MANAGER
 */
const deleteTrip = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid trip ID");
  }

  const trip = await Trip.findById(id);

  if (!trip) {
    throw new ApiError(404, "Trip not found");
  }

  if (trip.status !== "DRAFT") {
    throw new ApiError(400, "Can only delete trips in DRAFT status");
  }

  await Trip.findByIdAndDelete(id);

  return res.status(200).json(
    new ApiResponse(200, null, "Trip deleted successfully")
  );
});

// ─────────────────────────────────────────────
// GET TRIP STATISTICS
// ─────────────────────────────────────────────
/**
 * GET /api/v1/trips/stats
 * Get trip statistics
 * Access: DISPATCHER, FLEET_MANAGER
 */
const getTripStatistics = AsyncHandler(async (req, res) => {
  const stats = await Trip.aggregate([
    {
      $facet: {
        statusBreakdown: [
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ],
        totalStats: [
          {
            $group: {
              _id: null,
              totalTrips: { $sum: 1 },
              totalCargoWeight: { $sum: "$cargoWeight" },
              totalDistance: { $sum: "$distance" },
              totalRevenue: { $sum: "$revenue" },
              totalFuelCost: { $sum: "$fuelCost" },
              totalFuelConsumed: { $sum: "$fuelConsumed" },
            },
          },
        ],
        completedTrips: [
          {
            $match: { status: "COMPLETED" },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              avgDistance: { $avg: "$distance" },
              avgRevenue: { $avg: "$revenue" },
            },
          },
        ],
      },
    },
  ]);

  // Calculate cost per km
  const result = stats[0];
  if (result.totalStats.length > 0 && result.totalStats[0].totalDistance > 0) {
    result.costPerKm = result.totalStats[0].totalFuelCost / result.totalStats[0].totalDistance;
  } else {
    result.costPerKm = 0;
  }

  return res.status(200).json(
    new ApiResponse(200, result, "Trip statistics fetched successfully")
  );
});

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
export {
  createTrip,
  getAllTrips,
  getTripById,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  updateTrip,
  deleteTrip,
  getTripStatistics,
};
