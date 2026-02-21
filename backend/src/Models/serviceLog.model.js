import mongoose, { Schema } from "mongoose";

/**
 * ServiceLog Model for FleetFlow Maintenance & Service Tracking
 * Purpose: Preventative and reactive health tracking for vehicles
 * 
 * Status Lifecycle:
 *  - NEW          : Service log created, vehicle moved to IN_SHOP
 *  - IN_PROGRESS  : Work is actively being done
 *  - COMPLETED    : Service finished, vehicle returned to AVAILABLE
 *  - CANCELLED    : Service cancelled, vehicle returned to AVAILABLE
 */
const serviceLogSchema = new Schema(
  {
    logNumber: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      index: true,
    },
    issueOrService: {
      type: String,
      required: true,
      trim: true,
      // Examples: "Engine Issue", "Oil Change", "Brake Replacement", "Tire Rotation"
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    serviceType: {
      type: String,
      enum: ["PREVENTATIVE", "REPAIR", "INSPECTION", "EMERGENCY"],
      default: "REPAIR",
    },
    status: {
      type: String,
      enum: ["NEW", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "NEW",
      index: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    odometerReading: {
      type: Number, // Vehicle odometer at service time
      min: 0,
    },
    serviceProvider: {
      type: String,
      trim: true,
      default: "In-House", // Can be "In-House" or external garage name
    },
    mechanicName: {
      type: String,
      trim: true,
    },
    partsReplaced: [
      {
        partName: String,
        partCost: Number,
        quantity: { type: Number, default: 1 },
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate service log number before saving
serviceLogSchema.pre("save", async function (next) {
  if (!this.logNumber) {
    const count = await mongoose.model("ServiceLog").countDocuments();
    this.logNumber = `SL${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

// Indexes for performance
serviceLogSchema.index({ status: 1, scheduledDate: -1 });
serviceLogSchema.index({ vehicle: 1, createdAt: -1 });

export const ServiceLog = mongoose.model("ServiceLog", serviceLogSchema);
