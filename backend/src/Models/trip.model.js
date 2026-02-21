import mongoose, { Schema } from "mongoose";

/**
 * Trip Lifecycle States:
 *  - DRAFT      : Created but not dispatched
 *  - DISPATCHED : Driver is en route
 *  - COMPLETED  : Successfully delivered
 *  - CANCELLED  : Trip cancelled
 */
const tripSchema = new Schema(
  {
    tripNumber: {
      type: String,
      unique: true,
      index: true,
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: "User", // Dispatcher role
      required: true,
    },
    cargo: {
      type: Schema.Types.ObjectId,
      ref: "Cargo",
      default: null,
    },
    status: {
      type: String,
      enum: ["DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"],
      default: "DRAFT",
    },
    origin: {
      address: { type: String, required: true },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    destination: {
      address: { type: String, required: true },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    cargoWeight: {
      type: Number, // in kg
      required: true,
      min: 0,
    },
    distance: {
      type: Number, // in km
      default: 0,
    },
    estimatedDuration: {
      type: Number, // in hours
      default: 0,
    },
    scheduledStartTime: {
      type: Date,
      required: true,
    },
    actualStartTime: {
      type: Date,
    },
    actualEndTime: {
      type: Date,
    },
    fuelConsumed: {
      type: Number, // in liters
      default: 0,
    },
    fuelCost: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // Manager who created the trip
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate trip number before saving
tripSchema.pre("save", async function (next) {
  if (!this.tripNumber) {
    const count = await mongoose.model("Trip").countDocuments();
    this.tripNumber = `TRP${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

// Indexes for better query performance
tripSchema.index({ status: 1, createdAt: -1 });
tripSchema.index({ vehicle: 1 });
tripSchema.index({ driver: 1 });

export const Trip = mongoose.model("Trip", tripSchema);
