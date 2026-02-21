import { AsyncHandler } from "../Utils/AsyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { User } from "../Models/user.model.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import { uploadOnCloudinary } from "../Utils/Cloudinary.js";
import fs from "fs";

// ─────────────────────────────────────────────
//  Email Templates
// ─────────────────────────────────────────────

const LOGIN_USER_MAIL_TEMPLATE = (link) => ({
  subject: "Verify Your Email - Welcome to FleetFlow!",
  text: "Welcome to FleetFlow! Please verify your email.",
  html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
  <div style="text-align: center;">
    <h2 style="color: #333;">Welcome to <span style="color: #1A73E8;">FleetFlow</span> 🚛</h2>
  </div>
  <p style="color: #555; font-size: 16px;">
    Thank you for joining FleetFlow. Please verify your email address to activate your account.
  </p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${link}" style="display: inline-block; background-color: #1A73E8; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
      Verify My Email
    </a>
  </div>
  <p style="color: #777; font-size: 13px; text-align: center;">If you did not sign up for FleetFlow, please ignore this email.</p>
</div>
`,
});

const RESET_PASSWORD_MAIL_TEMPLATE = (link) => ({
  subject: "FleetFlow Password Reset Instructions",
  text: `We received a password reset request. Use this link within 15 minutes:\n${link}\n\nIf you didn't request this, please ignore this email.`,
  html: `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
  </head>
  <body style="margin:0;padding:30px 0;background:#f9f9f9;">
    <div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;padding:30px;">
      <div style="text-align:center;margin-bottom:20px;">
        <h2 style="color: #333;">FleetFlow 🚛</h2>
      </div>
      <p style="color:#555;line-height:1.6;font-size:16px;">
        Please click the button below to reset your password:
      </p>
      <div style="text-align:center;margin:25px 0;">
        <a href="${link}"
           style="background:#1A73E8;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color:#777;font-size:14px;">
        This link expires in 15 minutes. If you didn't request this, no action is needed.
      </p>
      <div style="color:#666;font-size:12px;text-align:center;margin-top:30px;">
        <p>FleetFlow Team</p>
      </div>
    </div>
  </body>
  </html>
  `,
});

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

const VALID_ROLES = ["FLEET_MANAGER", "DISPATCHER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"];

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const sendMail = async (emailId, htmlContent) => {
  // console.log("emailId", emailId, htmlContent);
  try {
    const auth = nodemailer.createTransport({
      host: "smtp.zoho.in",
      port: 465,
      secure: true,
      auth: {
        user: "verify@matterassist.com",
        pass: "SVEzd6tcBWKQ",
      },
    });
    const receiver = {
      from: '"MatterAssist" <verify@matterassist.com>',
      to: emailId,
      ...htmlContent,
    };

    return new Promise((resolve, reject) => {
      auth.sendMail(receiver, (err, email_res) => {
        if (err) {
          // console.log("Error:", err);
          reject(new Error("Email sending failed"));
        } else {
          // console.log("Email Sent:", email_res);
          resolve(email_res);
        }
      });
    });
  } catch (error) {
    throw new ApiError(500, "Something went wrong while sending the email");
  }
};

// ─────────────────────────────────────────────
//  Auth Controllers
// ─────────────────────────────────────────────

/**
 * POST /api/v1/users/register
 * Public — Register a new user (Manager or Dispatcher)
 * Supports multipart/form-data for dispatcher licence image
 */
const registerUser = AsyncHandler(async (req, res) => {
  const { name, email, phone, passwordHash, role = "DRIVER", licenceNumber, licenceType, licenceExpiry } = req.body;

  // Validate required fields
  if ([name, email, phone, passwordHash].some((f) => !f?.trim())) {
    throw new ApiError(400, "Name, email, phone, and password are required");
  }

  // Validate role
  const upperRole = role.toUpperCase();
  if (!VALID_ROLES.includes(upperRole)) {
    throw new ApiError(400, `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`);
  }

  // Validate driver-specific fields
  if (upperRole === "DRIVER") {
    if (!licenceNumber || !licenceType || !licenceExpiry) {
      throw new ApiError(400, "Licence number, type, and expiry date are required for drivers");
    }
    if (!req.file) {
      throw new ApiError(400, "Licence image is required for drivers");
    }
    
    // Validate licence type
    const validLicenceTypes = ["BIKE", "TRUCK", "VAN_TEMPO"];
    if (!validLicenceTypes.includes(licenceType.toUpperCase())) {
      throw new ApiError(400, `Invalid licence type. Must be one of: ${validLicenceTypes.join(", ")}`);
    }
  }

  // Check if user already exists
  const existedUser = await User.findOne({ $or: [{ phone }, { email }] });
  if (existedUser) {
    // Clean up uploaded file if exists
    if (req.file?.path) {
      fs.unlinkSync(req.file.path);
    }
    throw new ApiError(409, "User with this phone or email already exists");
  }

  // Upload licence image to Cloudinary if driver
  let licenceImageUrl = null;
  if (upperRole === "DRIVER" && req.file) {
    const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
    if (!cloudinaryResponse) {
      throw new ApiError(500, "Failed to upload licence image");
    }
    licenceImageUrl = cloudinaryResponse.secure_url;
  }

  const userData = {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    passwordHash,
    role: upperRole,
    isActive: true,
    isVerified: false,
  };

  // Add driver-specific fields
  if (upperRole === "DRIVER") {
    userData.licenceNumber = licenceNumber.trim();
    userData.licenceType = licenceType.toUpperCase();
    userData.licenceExpiry = new Date(licenceExpiry);
    userData.licenceImage = licenceImageUrl;
  }

  const user = await User.create(userData);

  const createdUser = await User.findById(user._id).select(
    "-passwordHash -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // Send verification email
  const token = jwt.sign(
    { email: user.email, userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "30m" }
  );
  const backendUrl = process.env.BACKEND_URL || "http://localhost:2590";
  const verifyLink = `${backendUrl}/api/v1/users/verify-email?token=${token}`;
  await sendMail(email, LOGIN_USER_MAIL_TEMPLATE(verifyLink));

  return res.status(201).json(
    new ApiResponse(
      201,
      createdUser,
      "User registered successfully. Please verify your email."
    )
  );
});

/**
 * POST /api/v1/users/login
 * Public — Login with email/phone + password
 */
const loginUser = AsyncHandler(async (req, res) => {
  const { email, phone, passwordHash } = req.body;

  if (!email && !phone) {
    throw new ApiError(400, "Email or phone number is required");
  }
  if (!passwordHash) {
    throw new ApiError(400, "Password is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { phone }],
    isActive: true,
  });

  if (!user) {
    throw new ApiError(404, "User does not exist or account is inactive");
  }

  // Check if email is verified
  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email before logging in. Check your inbox for the verification link.");
  }

  const isPasswordValid = await user.isPasswordCorrect(passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-passwordHash -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        `Logged in successfully as ${loggedInUser.role}`
      )
    );
});

/**
 * POST /api/v1/users/logout
 * Secured
 */
const logoutUser = AsyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );

  const options = { httpOnly: true, secure: true, sameSite: "None" };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

/**
 * POST /api/v1/users/refresh-token
 * Public
 */
const refreshAccessToken = AsyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);

    if (!user) throw new ApiError(401, "Invalid refresh token");
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = { httpOnly: true, secure: true, sameSite: "None" };
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

// ─────────────────────────────────────────────
//  Password Reset
// ─────────────────────────────────────────────

/**
 * POST /api/v1/users/send-reset-password-link
 * Public
 */
const sendResetPasswordEmail = AsyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found with this email");

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
  const resetLink = `https://www.fleetflow.com/reset-password?token=${token}`;
  const send_email = await sendMail(email, RESET_PASSWORD_MAIL_TEMPLATE(resetLink));

  if (!send_email) {
    throw new ApiError(401, "Failed to send password reset email");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset email sent"));
});

/**
 * POST /api/v1/users/reset-password
 * Public
 */
const resetPassword = AsyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new ApiError(400, "Token and new password are required");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) throw new ApiError(404, "User not found");

    user.passwordHash = newPassword;
    await user.save({ validateBeforeSave: true });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Password has been reset successfully"));
  } catch (error) {
    throw new ApiError(401, "Invalid or expired token");
  }
});

// ─────────────────────────────────────────────
//  Email Verification
// ─────────────────────────────────────────────

/**
 * GET /api/v1/users/verify-email?token=...
 * Public
 */
const verifyEmail = AsyncHandler(async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.redirect(`${frontendUrl}/email-verified?success=false&error=missing_token`);
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOneAndUpdate(
      { email: decoded.email },
      { $set: { isVerified: true } },
      { new: true }
    ).select("-passwordHash -refreshToken");

    if (!user) {
      return res.redirect(`${frontendUrl}/email-verified?success=false&error=user_not_found`);
    }

    // Redirect to frontend success page
    return res.redirect(`${frontendUrl}/email-verified?success=true&email=${encodeURIComponent(user.email)}`);
  } catch (error) {
    let errorType = "unknown_error";
    
    if (error.name === "JsonWebTokenError") {
      errorType = "invalid_token";
    } else if (error.name === "TokenExpiredError") {
      errorType = "token_expired";
    }
    
    return res.redirect(`${frontendUrl}/email-verified?success=false&error=${errorType}`);
  }
});

/**
 * POST /api/v1/users/resend-email-verification
 * Public
 */
const resendEmailVerification = AsyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) throw new ApiError(400, "Please enter your email address.");

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw new ApiError(404, "Email address not found.");

  const token = jwt.sign(
    { email: user.email, userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "30m" }
  );
  const backendUrl = process.env.BACKEND_URL || "http://localhost:2590";
  const verifyLink = `${backendUrl}/api/v1/users/verify-email?token=${token}`;
  const send_email = await sendMail(email, LOGIN_USER_MAIL_TEMPLATE(verifyLink));

  if (!send_email) {
    throw new ApiError(500, "Something went wrong while sending the verification email");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { emailSent: true }, "Verification email sent successfully"));
});

// ─────────────────────────────────────────────
//  User Profile & Management
// ─────────────────────────────────────────────

/**
 * GET /api/v1/users/current-user
 * Secured
 */
const getCurrentUser = AsyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

/**
 * PATCH /api/v1/users/update-account
 * Secured
 */
const updateaccountDetails = AsyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name && !email && !phone) {
    throw new ApiError(400, "At least one field (name, email, or phone) is required");
  }

  if (email || phone) {
    const existingUser = await User.findOne({
      _id: { $ne: req.user._id },
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    });
    if (existingUser) {
      throw new ApiError(409, "Email or phone number already in use");
    }
  }

  const updateFields = {};
  if (name) updateFields.name = name.trim();
  if (email) updateFields.email = email.toLowerCase().trim();
  if (phone) updateFields.phone = phone.trim();

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateFields },
    { new: true }
  ).select("-passwordHash -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

/**
 * GET /api/v1/users/healthcheck
 * Secured
 */
const healthCheck = AsyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-passwordHash -refreshToken"
  );

  if (!user) {
    return res.status(404).json(new ApiResponse(404, null, "User not found"));
  }

  return res.status(200).json(
    new ApiResponse(200, {
      status: "OK",
      user,
      message: "FleetFlow server is up and running",
    }, "Health check successful")
  );
});

/**
 * GET /api/v1/users/profile/:userId
 * Secured
 */
const getUserProfile = AsyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await User.findOne({ _id: userId, isActive: true }).select(
    "-passwordHash -refreshToken"
  );

  if (!user) throw new ApiError(404, "User not found");

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "User profile retrieved successfully"));
});

/**
 * POST /api/v1/users/getMyId
 * Secured
 */
const getMyId = AsyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user._id, "User ID sent"));
});

// ─────────────────────────────────────────────
//  Manager-Only: User Administration
// ─────────────────────────────────────────────

/**
 * GET /api/v1/users/all
 * Secured (Manager only)
 * Returns all users with pagination
 */
const getAllUsers = AsyncHandler(async (req, res) => {
  const { page = 1, limit = 50, role } = req.query;

  const filter = { _id: { $ne: req.user._id }, isActive: true };
  if (role && VALID_ROLES.includes(role)) filter.role = role;

  const users = await User.find(filter)
    .select("name email phone role createdAt")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ name: 1 });

  const total = await User.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(200, {
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
        totalUsers: total,
      },
    }, "Users retrieved successfully")
  );
});

/**
 * GET /api/v1/users/by-role/:role
 * Secured (Manager only)
 */
const getUsersByRole = AsyncHandler(async (req, res) => {
  const { role } = req.params;
  const { page = 1, limit = 50 } = req.query;

  if (!VALID_ROLES.includes(role)) {
    throw new ApiError(400, `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`);
  }

  const users = await User.find({ role, isActive: true })
    .select("name email phone createdAt")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ name: 1 });

  const total = await User.countDocuments({ role, isActive: true });

  return res.status(200).json(
    new ApiResponse(200, {
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
        totalUsers: total,
      },
    }, `${role}s retrieved successfully`)
  );
});

/**
 * PATCH /api/v1/users/update-role/:userId
 * Secured (Manager only)
 */
const updateUserRole = AsyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (req.user.role !== "MANAGER") {
    throw new ApiError(403, "Only Managers can update user roles");
  }
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }
  if (!VALID_ROLES.includes(role)) {
    throw new ApiError(400, `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true }
  ).select("-passwordHash -refreshToken");

  if (!user) throw new ApiError(404, "User not found");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User role updated successfully"));
});

/**
 * PATCH /api/v1/users/deactivate/:userId
 * Secured (Manager only)
 */
const deactivateUser = AsyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (req.user.role !== "MANAGER") {
    throw new ApiError(403, "Only Managers can deactivate users");
  }
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }
  if (userId === req.user._id.toString()) {
    throw new ApiError(400, "Cannot deactivate your own account");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: false },
    { new: true }
  ).select("-passwordHash -refreshToken");

  if (!user) throw new ApiError(404, "User not found");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User deactivated successfully"));
});

/**
 * PATCH /api/v1/users/activate/:userId
 * Secured (Manager only)
 */
const activateUser = AsyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (req.user.role !== "MANAGER") {
    throw new ApiError(403, "Only Managers can activate users");
  }
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: true },
    { new: true }
  ).select("-passwordHash -refreshToken");

  if (!user) throw new ApiError(404, "User not found");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User activated successfully"));
});

/**
 * GET /api/v1/users/available-drivers
 * Get all drivers who are ON_DUTY (not ON_TRIP, not OFF_DUTY)
 * For trip creation - shows drivers available to be assigned
 */
const getAvailableDrivers = AsyncHandler(async (req, res) => {
  const drivers = await User.find({
    role: "DRIVER",
    isActive: true,
    dutyStatus: "ON_DUTY" // Only drivers who are ON_DUTY (not ON_TRIP or OFF_DUTY)
  })
    .select("name email phone licenceNumber licenceType licenceExpiry dutyStatus tripStats")
    .sort({ name: 1 });

  // Filter out drivers with expired licences
  const now = new Date();
  const availableDrivers = drivers.filter(driver => {
    if (!driver.licenceExpiry) return true; // No expiry date set
    return new Date(driver.licenceExpiry) > now;
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { drivers: availableDrivers, count: availableDrivers.length },
      "Available drivers retrieved successfully"
    )
  );
});

export {
  // Auth
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  // Password
  sendResetPasswordEmail,
  resetPassword,
  // Email verification
  verifyEmail,
  resendEmailVerification,
  // Profile
  getCurrentUser,
  updateaccountDetails,
  healthCheck,
  getUserProfile,
  getMyId,
  // FleetFlow Admin (Manager only)
  getAllUsers,
  getUsersByRole,
  updateUserRole,
  deactivateUser,
  activateUser,
  // Driver availability (for trip assignment)
  getAvailableDrivers,
};
