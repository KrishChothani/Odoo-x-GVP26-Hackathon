import { AsyncHandler } from "../Utils/AsyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { Vehicle } from "../Models/vehicle.model.js";
import { ApiResponse } from "../Utils/ApiResponse.js";

// ─────────────────────────────────────────────
// CREATE VEHICLE
// ─────────────────────────────────────────────

/**
 * POST /api/v1/vehicles
 * Create a new vehicle
 * Protected - FLEET_MANAGER only
 */
const createVehicle = AsyncHandler(async (req, res) => {
  const { name, model, licensePlate, vehicleType, maxLoadCapacity, odometer, region } = req.body;

  // Validate required fields
  if (!name || !model || !licensePlate || !maxLoadCapacity) {
    throw new ApiError(400, "Name, model, license plate, and max load capacity are required");
  }

  // Validate vehicle type
  const validVehicleTypes = ["TRUCK", "VAN", "BIKE"];
  if (vehicleType && !validVehicleTypes.includes(vehicleType.toUpperCase())) {
    throw new ApiError(400, `Invalid vehicle type. Must be one of: ${validVehicleTypes.join(", ")}`);
  }

  // Validate max load capacity
  if (maxLoadCapacity <= 0) {
    throw new ApiError(400, "Max load capacity must be greater than 0");
  }

  // Check if license plate already exists
  const existingVehicle = await Vehicle.findOne({ 
    licensePlate: licensePlate.toUpperCase().trim() 
  });
  
  if (existingVehicle) {
    throw new ApiError(409, "Vehicle with this license plate already exists");
  }

  // Create vehicle
  const vehicle = await Vehicle.create({
    name: name.trim(),
    model: model.trim(),
    licensePlate: licensePlate.toUpperCase().trim(),
    vehicleType: vehicleType ? vehicleType.toUpperCase() : "VAN",
    maxLoadCapacity: Number(maxLoadCapacity),
    odometer: odometer ? Number(odometer) : 0,
    region: region ? region.trim() : "Central",
    status: "AVAILABLE",
    isActive: true,
  });

  return res.status(201).json(
    new ApiResponse(201, vehicle, "Vehicle registered successfully")
  );
});

// ─────────────────────────────────────────────
// GET ALL VEHICLES
// ─────────────────────────────────────────────

/**
 * GET /api/v1/vehicles
 * Get all vehicles with optional filters
 * Protected - FLEET_MANAGER, DISPATCHER
 */
const getAllVehicles = AsyncHandler(async (req, res) => {
  const { 
    status, 
    vehicleType, 
    region, 
    isActive,
    search,
    page = 1, 
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc"
  } = req.query;

  // Build filter object
  const filter = {};
  
  if (status) filter.status = status.toUpperCase();
  if (vehicleType) filter.vehicleType = vehicleType.toUpperCase();
  if (region) filter.region = region;
  if (isActive !== undefined) filter.isActive = isActive === "true";

  // Search by name, model, or license plate
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { model: { $regex: search, $options: "i" } },
      { licensePlate: { $regex: search, $options: "i" } },
    ];
  }

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  // Execute query with pagination
  const [vehicles, totalCount] = await Promise.all([
    Vehicle.find(filter)
      .populate("assignedDriver", "name email phone licenceNumber")
      .populate("currentTrip", "origin destination status")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Vehicle.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      vehicles,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / Number(limit)),
        totalCount,
        limit: Number(limit),
      },
    }, "Vehicles retrieved successfully")
  );
});

// ─────────────────────────────────────────────
// GET VEHICLE BY ID
// ─────────────────────────────────────────────

/**
 * GET /api/v1/vehicles/:id
 * Get a specific vehicle by ID
 * Protected - FLEET_MANAGER, DISPATCHER
 */
const getVehicleById = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const vehicle = await Vehicle.findById(id)
    .populate("assignedDriver", "name email phone licenceNumber licenceType dutyStatus")
    .populate("currentTrip", "origin destination status startTime estimatedEndTime");

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  return res.status(200).json(
    new ApiResponse(200, vehicle, "Vehicle retrieved successfully")
  );
});

// ─────────────────────────────────────────────
// UPDATE VEHICLE
// ─────────────────────────────────────────────

/**
 * PUT /api/v1/vehicles/:id
 * Update vehicle details
 * Protected - FLEET_MANAGER only
 */
const updateVehicle = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    model, 
    licensePlate, 
    vehicleType, 
    maxLoadCapacity, 
    odometer,
    status,
    region,
    fuelEfficiency,
    acquisitionCost,
    insuranceExpiry,
    lastMaintenanceDate,
    nextMaintenanceDue
  } = req.body;

  // Find vehicle
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  // If updating license plate, check for duplicates
  if (licensePlate && licensePlate.toUpperCase().trim() !== vehicle.licensePlate) {
    const existingVehicle = await Vehicle.findOne({ 
      licensePlate: licensePlate.toUpperCase().trim(),
      _id: { $ne: id }
    });
    
    if (existingVehicle) {
      throw new ApiError(409, "Another vehicle with this license plate already exists");
    }
  }

  // Validate vehicle type if provided
  if (vehicleType) {
    const validVehicleTypes = ["TRUCK", "VAN", "BIKE"];
    if (!validVehicleTypes.includes(vehicleType.toUpperCase())) {
      throw new ApiError(400, `Invalid vehicle type. Must be one of: ${validVehicleTypes.join(", ")}`);
    }
  }

  // Validate status if provided
  if (status) {
    const validStatuses = ["AVAILABLE", "ON_TRIP", "IN_SHOP", "OUT_OF_SERVICE"];
    if (!validStatuses.includes(status.toUpperCase())) {
      throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }
  }

  // Validate max load capacity if provided
  if (maxLoadCapacity !== undefined && maxLoadCapacity <= 0) {
    throw new ApiError(400, "Max load capacity must be greater than 0");
  }

  // Validate odometer if provided
  if (odometer !== undefined && odometer < 0) {
    throw new ApiError(400, "Odometer cannot be negative");
  }

  // Update fields
  if (name) vehicle.name = name.trim();
  if (model) vehicle.model = model.trim();
  if (licensePlate) vehicle.licensePlate = licensePlate.toUpperCase().trim();
  if (vehicleType) vehicle.vehicleType = vehicleType.toUpperCase();
  if (maxLoadCapacity !== undefined) vehicle.maxLoadCapacity = Number(maxLoadCapacity);
  if (odometer !== undefined) vehicle.odometer = Number(odometer);
  if (status) vehicle.status = status.toUpperCase();
  if (region) vehicle.region = region.trim();
  if (fuelEfficiency !== undefined) vehicle.fuelEfficiency = Number(fuelEfficiency);
  if (acquisitionCost !== undefined) vehicle.acquisitionCost = Number(acquisitionCost);
  if (insuranceExpiry) vehicle.insuranceExpiry = new Date(insuranceExpiry);
  if (lastMaintenanceDate) vehicle.lastMaintenanceDate = new Date(lastMaintenanceDate);
  if (nextMaintenanceDue) vehicle.nextMaintenanceDue = new Date(nextMaintenanceDue);

  await vehicle.save();

  return res.status(200).json(
    new ApiResponse(200, vehicle, "Vehicle updated successfully")
  );
});

// ─────────────────────────────────────────────
// TOGGLE OUT OF SERVICE
// ─────────────────────────────────────────────

/**
 * PATCH /api/v1/vehicles/:id/toggle-service
 * Toggle vehicle out of service status
 * Protected - FLEET_MANAGER only
 */
const toggleOutOfService = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  // Toggle between OUT_OF_SERVICE and AVAILABLE
  if (vehicle.status === "OUT_OF_SERVICE") {
    vehicle.status = "AVAILABLE";
    vehicle.isActive = true;
  } else {
    // Can only retire if not on a trip
    if (vehicle.status === "ON_TRIP") {
      throw new ApiError(400, "Cannot retire vehicle while on trip");
    }
    vehicle.status = "OUT_OF_SERVICE";
    vehicle.isActive = false;
    vehicle.assignedDriver = null;
  }

  await vehicle.save();

  return res.status(200).json(
    new ApiResponse(200, vehicle, `Vehicle ${vehicle.isActive ? "activated" : "retired"} successfully`)
  );
});

// ─────────────────────────────────────────────
// DELETE VEHICLE
// ─────────────────────────────────────────────

/**
 * DELETE /api/v1/vehicles/:id
 * Soft delete a vehicle (set isActive to false)
 * Protected - FLEET_MANAGER only
 */
const deleteVehicle = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  // Cannot delete vehicle on trip
  if (vehicle.status === "ON_TRIP") {
    throw new ApiError(400, "Cannot delete vehicle while on trip");
  }

  // Soft delete
  vehicle.isActive = false;
  vehicle.status = "OUT_OF_SERVICE";
  vehicle.assignedDriver = null;
  await vehicle.save();

  return res.status(200).json(
    new ApiResponse(200, vehicle, "Vehicle deleted successfully")
  );
});

// ─────────────────────────────────────────────
// GET VEHICLE STATISTICS
// ─────────────────────────────────────────────

/**
 * GET /api/v1/vehicles/stats
 * Get vehicle statistics
 * Protected - FLEET_MANAGER
 */
const getVehicleStatistics = AsyncHandler(async (req, res) => {
  const stats = await Vehicle.aggregate([
    {
      $facet: {
        statusBreakdown: [
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ],
        typeBreakdown: [
          { $group: { _id: "$vehicleType", count: { $sum: 1 } } },
        ],
        totalStats: [
          {
            $group: {
              _id: null,
              totalVehicles: { $sum: 1 },
              activeVehicles: {
                $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
              },
              totalCapacity: { $sum: "$maxLoadCapacity" },
              averageOdometer: { $avg: "$odometer" },
            },
          },
        ],
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, stats[0], "Vehicle statistics retrieved successfully")
  );
});

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────

export {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  toggleOutOfService,
  deleteVehicle,
  getVehicleStatistics,
};
