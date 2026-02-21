import mongoose, { Schema } from "mongoose";

/**
 * FuelLog Model
 * Tracks fuel consumption and costs per trip/vehicle for operational expense analysis
 * Supports cost-per-km calculations and fuel efficiency tracking
 */
const fuelLogSchema = new Schema(
  {
    logNumber: {
      type: String,
      unique: true,
      trim: true,
      // Auto-generated: FL000001, FL000002, etc.
    },
    trip: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: false,
      index: true,
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      index: true,
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    
    // Expense category
    expenseCategory: {
      type: String,
      enum: ["FUEL", "MISC"],
      required: true,
      default: "FUEL",
    },
    
    // Fuel details
    fuelType: {
      type: String,
      enum: ["DIESEL", "PETROL", "CNG", "ELECTRIC"],
      required: function() { return this.expenseCategory === "FUEL"; },
    },
    liters: {
      type: Number,
      required: function() { return this.expenseCategory === "FUEL"; },
      min: [0, "Liters cannot be negative"],
    },
    costPerLiter: {
      type: Number,
      required: function() { return this.expenseCategory === "FUEL"; },
      min: [0, "Cost per liter cannot be negative"],
    },
    totalCost: {
      type: Number,
      required: true,
      min: [0, "Total cost cannot be negative"],
    },
    
    // Misc expense details (when expenseCategory is MISC)
    miscExpenseType: {
      type: String,
      enum: ["TOLL", "PARKING", "CLEANING", "PERMITS", "FINES", "OTHER"],
      required: function() { return this.expenseCategory === "MISC"; },
    },
    miscDescription: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    
    // Location & timing
    fuelDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    fuelStation: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    
    // Odometer tracking
    odometerReading: {
      type: Number,
      required: true,
      min: [0, "Odometer reading cannot be negative"],
    },
    
    // Documentation
    receiptImage: {
      type: String, // Cloudinary URL
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    
    // Audit trail
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Payment details
    paymentMethod: {
      type: String,
      enum: ["CASH", "CARD", "UPI", "COMPANY_CARD", "FUEL_CARD"],
      default: "CASH",
    },
    
    // Efficiency metrics (calculated)
    distanceCovered: {
      type: Number, // km covered since last fuel log
      min: 0,
    },
    fuelEfficiency: {
      type: Number, // km per liter
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to auto-generate logNumber
fuelLogSchema.pre("save", async function (next) {
  if (!this.logNumber) {
    const count = await mongoose.model("FuelLog").countDocuments();
    this.logNumber = `FL${String(count + 1).padStart(6, "0")}`;
  }
  
  // Calculate total cost if not provided
  if (this.liters && this.costPerLiter && !this.totalCost) {
    this.totalCost = this.liters * this.costPerLiter;
  }
  
  // Calculate fuel efficiency if distance is provided
  if (this.distanceCovered && this.liters && this.distanceCovered > 0 && this.liters > 0) {
    this.fuelEfficiency = Number((this.distanceCovered / this.liters).toFixed(2));
  }
  
  next();
});

// Indexes for common queries
fuelLogSchema.index({ vehicle: 1, fuelDate: -1 });
fuelLogSchema.index({ trip: 1, createdAt: -1 });
fuelLogSchema.index({ driver: 1, fuelDate: -1 });
fuelLogSchema.index({ fuelDate: -1 });

export const FuelLog = mongoose.model("FuelLog", fuelLogSchema);
