import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

/**
 * FleetFlow User Roles:
 *  - FLEET_MANAGER     : Oversee vehicle health, asset lifecycle, and scheduling
 *  - DISPATCHER        : Create trips, assign drivers, validate cargo loads
 *  - SAFETY_OFFICER    : Monitor driver compliance, license expirations, safety scores
 *  - FINANCIAL_ANALYST : Audit fuel spend, maintenance ROI, operational costs
 *  - DRIVER            : Accept trip, complete trip, cancel trip, toggle duty status
 */
const userSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST", "DRIVER"],
      required: true,
      default: "DRIVER",
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    
    // Driver-specific fields
    licenceNumber: {
      type: String,
      trim: true,
      sparse: true, // Allows multiple null values
    },
    licenceType: {
      type: String,
      enum: ["BIKE", "TRUCK", "VAN_TEMPO"],
      sparse: true,
    },
    licenceExpiry: {
      type: Date,
    },
    licenceImage: {
      type: String, // Cloudinary URL
      trim: true,
    },
    dutyStatus: {
      type: String,
      enum: ["ON_DUTY", "OFF_DUTY", "ON_TRIP"],
      default: "OFF_DUTY",
    },
    
    // Trip statistics for reliability tracking
    tripStats: {
      totalTrips: { type: Number, default: 0 },
      completedTrips: { type: Number, default: 0 },
      cancelledTrips: { type: Number, default: 0 },
      acceptedTrips: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

// Compare password
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.passwordHash);
};

// Generate Access Token (includes role for RBAC)
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
