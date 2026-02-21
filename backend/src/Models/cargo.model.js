import mongoose, { Schema } from "mongoose";

/**
 * Cargo Status:
 *  - PENDING  : Awaiting assignment to a trip
 *  - ASSIGNED : Assigned to a trip
 *  - IN_TRANSIT : Currently being transported
 *  - DELIVERED : Successfully delivered
 *  - CANCELLED : Cargo cancelled
 */
const cargoSchema = new Schema(
  {
    cargoNumber: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    weight: {
      type: Number, // in kg
      required: true,
      min: 0,
    },
    volume: {
      type: Number, // in cubic meters
      default: 0,
    },
    status: {
      type: String,
      enum: ["PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"],
      default: "PENDING",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },
    origin: {
      address: { type: String, required: true },
      contactName: String,
      contactPhone: String,
    },
    destination: {
      address: { type: String, required: true },
      contactName: String,
      contactPhone: String,
    },
    pickupDate: {
      type: Date,
      required: true,
    },
    deliveryDate: {
      type: Date,
      required: true,
    },
    specialInstructions: {
      type: String,
      trim: true,
    },
    assignedTrip: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },
    isFragile: {
      type: Boolean,
      default: false,
    },
    requiresRefrigeration: {
      type: Boolean,
      default: false,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    estimatedValue: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate cargo number before saving
cargoSchema.pre("save", async function (next) {
  if (!this.cargoNumber) {
    const count = await mongoose.model("Cargo").countDocuments();
    this.cargoNumber = `CRG${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

// Indexes for better query performance
cargoSchema.index({ status: 1, priority: -1 });
cargoSchema.index({ pickupDate: 1 });
cargoSchema.index({ customerName: 1 });

export const Cargo = mongoose.model("Cargo", cargoSchema);
