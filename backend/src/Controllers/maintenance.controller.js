import { AsyncHandler } from "../Utils/AsyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { ServiceLog } from "../Models/serviceLog.model.js";
import { Vehicle } from "../Models/vehicle.model.js";
import mongoose from "mongoose";

/**
 * POST /api/v1/maintenance
 * Create a new service log
 * CRITICAL: Automatically sets vehicle status to IN_SHOP
 */
const createServiceLog = AsyncHandler(async (req, res) => {
  const {
    vehicleId,
    issueOrService,
    description,
    serviceType,
    scheduledDate,
    estimatedCost,
    odometerReading,
    serviceProvider,
    mechanicName,
    partsReplaced,
    notes,
    priority,
  } = req.body;

  // Validation
  if (!vehicleId || !issueOrService || !scheduledDate) {
    throw new ApiError(400, "Vehicle, issue/service, and scheduled date are required");
  }

  // Check if vehicle exists and is not already IN_SHOP or ON_TRIP
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  if (vehicle.status === "IN_SHOP") {
    throw new ApiError(400, "Vehicle is already in shop for service");
  }

  if (vehicle.status === "ON_TRIP") {
    throw new ApiError(400, "Cannot send vehicle to shop while it's on a trip");
  }

  // Use transaction to ensure atomic update
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create service log
    const serviceLog = await ServiceLog.create(
      [
        {
          vehicle: vehicleId,
          issueOrService,
          description,
          serviceType: serviceType || "REPAIR",
          scheduledDate: new Date(scheduledDate),
          estimatedCost: estimatedCost || 0,
          odometerReading,
          serviceProvider: serviceProvider || "In-House",
          mechanicName,
          partsReplaced: partsReplaced || [],
          notes,
          priority: priority || "MEDIUM",
          createdBy: req.user._id,
          status: "NEW",
        },
      ],
      { session }
    );

    // CRITICAL: Update vehicle status to IN_SHOP
    await Vehicle.findByIdAndUpdate(
      vehicleId,
      {
        status: "IN_SHOP",
        lastMaintenanceDate: new Date(),
        assignedDriver: null, // Clear assigned driver
        currentTrip: null, // Clear current trip
      },
      { session }
    );

    await session.commitTransaction();

    const populatedServiceLog = await ServiceLog.findById(serviceLog[0]._id)
      .populate("vehicle", "name model licensePlate vehicleType status")
      .populate("createdBy", "name email");

    return res.status(201).json(
      new ApiResponse(
        201,
        { serviceLog: populatedServiceLog },
        "Service log created and vehicle moved to IN_SHOP"
      )
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * GET /api/v1/maintenance
 * Get all service logs with filters
 */
const getAllServiceLogs = AsyncHandler(async (req, res) => {
  const {
    status,
    vehicleId,
    serviceType,
    priority,
    search,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build filter
  const filter = {};
  if (status) filter.status = status;
  if (vehicleId) filter.vehicle = vehicleId;
  if (serviceType) filter.serviceType = serviceType;
  if (priority) filter.priority = priority;

  // Search by log number, issue, or notes
  if (search) {
    filter.$or = [
      { logNumber: { $regex: search, $options: "i" } },
      { issueOrService: { $regex: search, $options: "i" } },
      { notes: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [serviceLogs, totalCount] = await Promise.all([
    ServiceLog.find(filter)
      .populate("vehicle", "name model licensePlate vehicleType status region")
      .populate("createdBy", "name email role")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit)),
    ServiceLog.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        serviceLogs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit),
        },
      },
      "Service logs retrieved successfully"
    )
  );
});

/**
 * GET /api/v1/maintenance/:id
 * Get single service log by ID
 */
const getServiceLogById = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const serviceLog = await ServiceLog.findById(id)
    .populate("vehicle", "name model licensePlate vehicleType status region odometer")
    .populate("createdBy", "name email phone role");

  if (!serviceLog) {
    throw new ApiError(404, "Service log not found");
  }

  return res.status(200).json(
    new ApiResponse(200, { serviceLog }, "Service log retrieved successfully")
  );
});

/**
 * PUT /api/v1/maintenance/:id
 * Update service log (only for NEW or IN_PROGRESS status)
 */
const updateServiceLog = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    issueOrService,
    description,
    serviceType,
    scheduledDate,
    estimatedCost,
    cost,
    odometerReading,
    serviceProvider,
    mechanicName,
    partsReplaced,
    notes,
    priority,
  } = req.body;

  const serviceLog = await ServiceLog.findById(id);
  if (!serviceLog) {
    throw new ApiError(404, "Service log not found");
  }

  // Only allow updates for NEW and IN_PROGRESS status
  if (serviceLog.status === "COMPLETED" || serviceLog.status === "CANCELLED") {
    throw new ApiError(400, `Cannot update service log with status: ${serviceLog.status}`);
  }

  // Update fields
  if (issueOrService) serviceLog.issueOrService = issueOrService;
  if (description !== undefined) serviceLog.description = description;
  if (serviceType) serviceLog.serviceType = serviceType;
  if (scheduledDate) serviceLog.scheduledDate = new Date(scheduledDate);
  if (estimatedCost !== undefined) serviceLog.estimatedCost = estimatedCost;
  if (cost !== undefined) serviceLog.cost = cost;
  if (odometerReading) serviceLog.odometerReading = odometerReading;
  if (serviceProvider) serviceLog.serviceProvider = serviceProvider;
  if (mechanicName !== undefined) serviceLog.mechanicName = mechanicName;
  if (partsReplaced) serviceLog.partsReplaced = partsReplaced;
  if (notes !== undefined) serviceLog.notes = notes;
  if (priority) serviceLog.priority = priority;

  await serviceLog.save();

  const updatedServiceLog = await ServiceLog.findById(id)
    .populate("vehicle", "name model licensePlate vehicleType status")
    .populate("createdBy", "name email");

  return res.status(200).json(
    new ApiResponse(200, { serviceLog: updatedServiceLog }, "Service log updated successfully")
  );
});

/**
 * PATCH /api/v1/maintenance/:id/start
 * Start service (NEW -> IN_PROGRESS)
 */
const startService = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const serviceLog = await ServiceLog.findById(id);
  if (!serviceLog) {
    throw new ApiError(404, "Service log not found");
  }

  if (serviceLog.status !== "NEW") {
    throw new ApiError(400, `Cannot start service with status: ${serviceLog.status}`);
  }

  serviceLog.status = "IN_PROGRESS";
  serviceLog.startedAt = new Date();
  await serviceLog.save();

  const updatedServiceLog = await ServiceLog.findById(id)
    .populate("vehicle", "name model licensePlate vehicleType status")
    .populate("createdBy", "name email");

  return res.status(200).json(
    new ApiResponse(200, { serviceLog: updatedServiceLog }, "Service started successfully")
  );
});

/**
 * PATCH /api/v1/maintenance/:id/complete
 * Complete service (NEW/IN_PROGRESS -> COMPLETED)
 * CRITICAL: Sets vehicle status back to AVAILABLE
 */
const completeService = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cost, notes, odometerReading, partsReplaced } = req.body;

  const serviceLog = await ServiceLog.findById(id);
  if (!serviceLog) {
    throw new ApiError(404, "Service log not found");
  }

  if (serviceLog.status === "COMPLETED") {
    throw new ApiError(400, "Service is already completed");
  }

  if (serviceLog.status === "CANCELLED") {
    throw new ApiError(400, "Cannot complete a cancelled service");
  }

  // Use transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update service log
    serviceLog.status = "COMPLETED";
    serviceLog.completedAt = new Date();
    if (cost !== undefined) serviceLog.cost = cost;
    if (notes) serviceLog.notes = notes;
    if (odometerReading) serviceLog.odometerReading = odometerReading;
    if (partsReplaced) serviceLog.partsReplaced = partsReplaced;
    await serviceLog.save({ session });

    // CRITICAL: Return vehicle to AVAILABLE status
    const vehicle = await Vehicle.findByIdAndUpdate(
      serviceLog.vehicle,
      {
        status: "AVAILABLE",
        lastMaintenanceDate: new Date(),
        nextMaintenanceDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      },
      { session, new: true }
    );

    await session.commitTransaction();

    const updatedServiceLog = await ServiceLog.findById(id)
      .populate("vehicle", "name model licensePlate vehicleType status")
      .populate("createdBy", "name email");

    return res.status(200).json(
      new ApiResponse(
        200,
        { serviceLog: updatedServiceLog, vehicle },
        "Service completed and vehicle returned to AVAILABLE"
      )
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * PATCH /api/v1/maintenance/:id/cancel
 * Cancel service
 * CRITICAL: Sets vehicle status back to AVAILABLE
 */
const cancelService = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const serviceLog = await ServiceLog.findById(id);
  if (!serviceLog) {
    throw new ApiError(404, "Service log not found");
  }

  if (serviceLog.status === "COMPLETED") {
    throw new ApiError(400, "Cannot cancel a completed service");
  }

  if (serviceLog.status === "CANCELLED") {
    throw new ApiError(400, "Service is already cancelled");
  }

  // Use transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update service log
    serviceLog.status = "CANCELLED";
    if (reason) serviceLog.notes = `CANCELLED: ${reason}. ${serviceLog.notes || ""}`;
    await serviceLog.save({ session });

    // CRITICAL: Return vehicle to AVAILABLE status
    const vehicle = await Vehicle.findByIdAndUpdate(
      serviceLog.vehicle,
      { status: "AVAILABLE" },
      { session, new: true }
    );

    await session.commitTransaction();

    const updatedServiceLog = await ServiceLog.findById(id)
      .populate("vehicle", "name model licensePlate vehicleType status")
      .populate("createdBy", "name email");

    return res.status(200).json(
      new ApiResponse(
        200,
        { serviceLog: updatedServiceLog, vehicle },
        "Service cancelled and vehicle returned to AVAILABLE"
      )
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * DELETE /api/v1/maintenance/:id
 * Delete service log (only NEW status, and restores vehicle to AVAILABLE)
 */
const deleteServiceLog = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const serviceLog = await ServiceLog.findById(id);
  if (!serviceLog) {
    throw new ApiError(404, "Service log not found");
  }

  // Only allow deletion of NEW status
  if (serviceLog.status !== "NEW") {
    throw new ApiError(400, "Can only delete service logs with NEW status");
  }

  // Use transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Delete service log
    await ServiceLog.findByIdAndDelete(id, { session });

    // CRITICAL: Return vehicle to AVAILABLE
    await Vehicle.findByIdAndUpdate(
      serviceLog.vehicle,
      { status: "AVAILABLE" },
      { session }
    );

    await session.commitTransaction();

    return res.status(200).json(
      new ApiResponse(200, null, "Service log deleted and vehicle returned to AVAILABLE")
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * GET /api/v1/maintenance/stats
 * Get maintenance statistics
 */
const getMaintenanceStats = AsyncHandler(async (req, res) => {
  const stats = await ServiceLog.aggregate([
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
        priorityBreakdown: [
          {
            $group: {
              _id: "$priority",
              count: { $sum: 1 },
            },
          },
        ],
        costAnalysis: [
          {
            $group: {
              _id: null,
              totalCost: { $sum: "$cost" },
              totalEstimatedCost: { $sum: "$estimatedCost" },
              avgCost: { $avg: "$cost" },
              maxCost: { $max: "$cost" },
            },
          },
        ],
        recentServices: [
          { $sort: { createdAt: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: "vehicles",
              localField: "vehicle",
              foreignField: "_id",
              as: "vehicleInfo",
            },
          },
          { $unwind: "$vehicleInfo" },
          {
            $project: {
              logNumber: 1,
              issueOrService: 1,
              status: 1,
              cost: 1,
              scheduledDate: 1,
              "vehicleInfo.name": 1,
              "vehicleInfo.licensePlate": 1,
            },
          },
        ],
        vehiclesInShop: [
          { $match: { status: { $in: ["NEW", "IN_PROGRESS"] } } },
          {
            $lookup: {
              from: "vehicles",
              localField: "vehicle",
              foreignField: "_id",
              as: "vehicleInfo",
            },
          },
          { $unwind: "$vehicleInfo" },
          {
            $project: {
              logNumber: 1,
              issueOrService: 1,
              status: 1,
              scheduledDate: 1,
              "vehicleInfo.name": 1,
              "vehicleInfo.licensePlate": 1,
            },
          },
        ],
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, { stats: stats[0] }, "Maintenance statistics retrieved successfully")
  );
});

export {
  createServiceLog,
  getAllServiceLogs,
  getServiceLogById,
  updateServiceLog,
  startService,
  completeService,
  cancelService,
  deleteServiceLog,
  getMaintenanceStats,
};
