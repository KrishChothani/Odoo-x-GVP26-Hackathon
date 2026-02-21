import mongoose, { Schema } from "mongoose";

/**
 * Vehicle Types for FleetFlow:
 *  - TRUCK  : Heavy cargo transport
 *  - VAN    : Medium cargo transport
 *  - BIKE   : Small/Quick deliveries
 */
const vehicleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    licensePlate: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    vehicleType: {
      type: String,
      enum: ["TRUCK", "VAN", "BIKE"],
      required: true,
      default: "VAN",
    },
    maxLoadCapacity: {
      type: Number, // in kg
      required: true,
      min: 0,
    },
    odometer: {
      type: Number, // in km
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "ON_TRIP", "IN_SHOP", "OUT_OF_SERVICE"],
      default: "AVAILABLE",
    },
    region: {
      type: String,
      trim: true,
      default: "Central",
    },
    assignedDriver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    currentTrip: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },
    fuelEfficiency: {
      type: Number, // km/L
      default: 0,
    },
    acquisitionCost: {
      type: Number,
      default: 0,
    },
    insuranceExpiry: {
      type: Date,
    },
    lastMaintenanceDate: {
      type: Date,
    },
    nextMaintenanceDue: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
vehicleSchema.index({ status: 1, vehicleType: 1 });
vehicleSchema.index({ region: 1 });

export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
