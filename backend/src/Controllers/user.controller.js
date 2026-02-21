import { AsyncHandler } from '../Utils/AsyncHandler.js';
import { ApiError } from "../Utils/ApiError.js";
import { User } from "../Models/user.model.js";
import { Fpo } from '../Models/fpo.model.js';
import { ApiResponse } from "../Utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import mongoose from 'mongoose';
// import { User } from '../Models/user.model.js';
const LOGIN_USER_MAIL_TEMPLET = (link) => ({
  subject: "Verify Your Email - Welcome to FleetFlow!",
  text: "Welcome to FleetFlow! Please verify your email.",
  html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
  <div style="text-align: center;">
    <h2 style="color: #333;">Welcome to <span style="color: #4CAF50;">FleetFlow</span> 🌱</h2>
  </div>
  <p style="color: #555; font-size: 16px;">
    Thank you for joining our sustainable agriculture platform. Please verify your email address to get started with carbon credit tracking.
  </p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${link}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
      Verify My Email
    </a>
  </div>
</div>
`
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
        <h2 style="color: #333;">FleetFlow 🌱</h2>
      </div>
      <p style="color:#555;line-height:1.6;font-size:16px;">
        Please click the button below to reset your password:
      </p>
      <div style="text-align:center;margin:25px 0;">
        <a href="${link}" 
           style="background:#4CAF50;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
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

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(
      500,
      "Something went wrong while generating access token and refresh token"
    );
  }
};

const registerUser = AsyncHandler (async (req, res) => {

  const { name, email, phone, passwordHash, role = "FARMER", fpoId = null } = req.body;

  // Validate required fields
  if (
    [name, email, phone, passwordHash].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Name, email, phone, and password are required");
  }

  // Validate role
  if (!["FARMER", "FPO_ADMIN", "ADMIN"].includes(role)) {
    throw new ApiError(400, "Invalid role. Must be FARMER, FPO_ADMIN, or ADMIN");
  }

  // Check if user already exists
  const existedUser = await User.findOne({
    $or: [{ phone }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with this phone or email already exists");
  }

  // If FPO_ADMIN or user has fpoId, validate FPO exists
  if (fpoId) {
    const fpoExists = await Fpo.findById(fpoId);
    if (!fpoExists) {
      throw new ApiError(404, "FPO not found");
    }
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    passwordHash,
    role,
    fpoId: fpoId || null,
    isActive: true
  });

  const createdUser = await User.findById(user._id)
    .select("-passwordHash -refreshToken")
    .populate('fpoId', 'name region');

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // Generate verification token
  const token = jwt.sign({ email: user.email, userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30m",
  });
  
  // Update email template for FleetFlow
  const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  const emailTemplate = {
    subject: "Verify Your Email - Welcome to FleetFlow!",
    text: "Welcome to FleetFlow! Please verify your email.",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
      <div style="text-align: center;">
        <h2 style="color: #333;">Welcome to <span style="color: #4CAF50;">FleetFlow</span> 🌱</h2>
      </div>
      <p style="color: #555; font-size: 16px;">
        Thank you for joining our sustainable agriculture platform. Please verify your email address to get started with carbon credit tracking.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          Verify My Email
        </a>
      </div>
      <p style="color: #777; font-size: 14px;">
        Role: ${role}<br>
        ${fpoId ? 'You are associated with an FPO organization.' : ''}
      </p>
    </div>
    `
  };

  const send_email = await sendMail(email, emailTemplate);

  // if (!send_email) {
  //   throw new ApiError(500, "Something went wrong while sending the verification email");
  // }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        createdUser,
        "User registration completed successfully. Please check your email for verification."
      )
    );
});

const loginUser = AsyncHandler(async (req, res) => {
  const { email, phone, passwordHash } = req.body;
  
  // Either email or phone is required
  if (!email && !phone) {
    throw new ApiError(400, "Email or phone number is required");
  }

  if (!passwordHash) {
    throw new ApiError(400, "Password is required");
  }

  // Find user by email or phone
  const user = await User.findOne({
    $or: [{ email }, { phone }],
    isActive: true
  }).populate('fpoId', 'name region membersCount');

  if (!user) {
    throw new ApiError(404, "User does not exist or account is inactive");
  }

  const isPasswordValid = await user.isPasswordCorrect(passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Check if email is verified (you might want to add a verified field to the schema)
  // For now, we'll assume all users are verified after registration
  
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id)
    .select("-passwordHash -refreshToken")
    .populate('fpoId', 'name region membersCount');

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: "None",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});


const logoutUser = AsyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

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

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

// const changeCurrentPassword = AsyncHandler(async (req, res) => {
//   const { oldPassword, newPassword } = req.body;

//   const user = await User.findById(req.user?._id);

//   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

//   if (!isPasswordCorrect) {
//     throw new ApiError(400, "Invalid Old Password");
//   }

//   user.password = newPassword;
//   await user.save({ validateBeforeSave: false });

//   return res
//     .status(200)
//     .json(new ApiResponse(200, {}, "Password changed successfully"));
// });


const sendResetPasswordEmail = AsyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found with this email");
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
  const resetLink = `https://www.fleetflow.com/reset-password?token=${token}`;
  const resetEmailTemplate = RESET_PASSWORD_MAIL_TEMPLATE(resetLink);
  // Use your sendMail utility here
  const send_email = await sendMail(email, resetEmailTemplate);
  if (!send_email) {
    throw new ApiError(401, "Failed to send email for reset password");
  }
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Password reset email sent"));
});
const resetPassword = AsyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new ApiError(400, "Token and new password are required");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    user.passwordHash = newPassword;
    await user.save({ validateBeforeSave: true });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Password has been reset successfully"));
  } catch (error) {
    throw new ApiError(401, "Invalid or expired token");
  }
});

const getCurrentUser = AsyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetch successfully"));
});

const updateaccountDetails = AsyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name && !email && !phone) {
    throw new ApiError(400, "At least one field (name, email, or phone) is required");
  }

  // Check if email or phone already exists for other users
  if (email || phone) {
    const existingUser = await User.findOne({
      _id: { $ne: req.user._id },
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : [])
      ]
    });

    if (existingUser) {
      throw new ApiError(409, "Email or phone number already exists");
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
  )
  .select("-passwordHash -refreshToken")
  .populate('fpoId', 'name region');

  return res.status(200).json(
    new ApiResponse(200, user, "Account details updated successfully")
  );
});

const resendEmailVerification = AsyncHandler(async(req,res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Please enter the email address.")
  }
  
  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if(!user){
    throw new ApiError(404, "Email address not found.");
  }

  // Generate new verification token
  const token = jwt.sign({ email: user.email, userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30m",
  });
  
  const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  const loginEmailTemplate = LOGIN_USER_MAIL_TEMPLET(verifyLink);
  const send_email = await sendMail(email, loginEmailTemplate);

  if (!send_email) {
    throw new ApiError(500, "Something went wrong while sending the verification email");
  }

  return res.status(200).json(
    new ApiResponse(200, { emailSent: true }, "Verification email sent successfully")
  )
})

const sendMail = async (emailId, htmlContent) => {
  try {
    // const auth = nodemailer.createTransporter({
    //   host: "smtp.gmail.in",
    //   port: 465,
    //   secure: true,
    //   auth: {
    //     user: "krishchothani259@gmail.com",
    //     pass: "dofsbprmfxdfljbe",
    //   },
    // });

    // const receiver = {
    //   from: `"FleetFlow" <${process.env.SMTP_USER || 'verify@fleetflow.com'}>`,,
    //   to: emailId,
    //   ...htmlContent,
    // };

    // return new Promise((resolve, reject) => {
    //   auth.sendMail(receiver, (err, email_res) => {
    //     if (err) {
    //       console.error("Email sending error:", err);
    //       reject(new Error("Email sending failed"));
    //     } else {
    //       console.log("Email sent successfully:", email_res.messageId);
    //       resolve(email_res);
    //     }
    //   });
    // });
  } catch (error) {
    throw new ApiError(500, "Something went wrong while sending the email");
  }
};

const verifyEmail = AsyncHandler(async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findOneAndUpdate(
      { email: decoded.email },
      { $set: { isActive: true } }, // Using isActive instead of verified
      { new: true }
    ).select("-passwordHash -refreshToken");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
      new ApiResponse(200, { user }, "Email verified successfully")
    );
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(400, "Invalid verification token");
    }
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(400, "Verification token has expired");
    }
    throw new ApiError(500, "Something went wrong while verifying email address");
  }
});

const healthCheck = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId)
    .select("-passwordHash -refreshToken")
    .populate('fpoId', 'name region'); 

  if (!user) {
    return res.status(404).json(new ApiResponse(404, null, "User not found"));
  }
  
  const showstatus = {
    status: "OK",
    user,
    message: "FleetFlow server is up and running"
  }
  
  return res
    .status(200)
    .json(new ApiResponse(200, showstatus, "Health check successful"));
});

const getAllLawyers = AsyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { page = 1, limit = 100, role, fpoId } = req.query;

  // Build filter query
  const filter = {
    _id: { $ne: currentUserId }, // Exclude current user
    isActive: true
  };

  // Filter by role if specified
  if (role && ["FARMER", "FPO_ADMIN", "ADMIN"].includes(role)) {
    filter.role = role;
  }

  // Filter by FPO if specified
  if (fpoId) {
    filter.fpoId = fpoId;
  }

  // Fetch users with pagination
  const users = await User.find(filter)
    .select('name email phone role fpoId createdAt')
    .populate('fpoId', 'name region')
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
        totalUsers: total
      }
    }, "Users retrieved successfully")
  );
});
// Get user profile by ID (for profile view)
const getUserProfile = AsyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await User.findOne({
    _id: userId,
    isActive: true
  })
  .select('-passwordHash -refreshToken')
  .populate('fpoId', 'name region membersCount');

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Get additional profile statistics for farmers
  let profileStats = {};
  if (user.role === 'FARMER') {
    const { Farm, CarbonCredit } = await import('../Models/index.js');
    
    const farmCount = await Farm.countDocuments({ farmerId: userId });
    const totalCredits = await CarbonCredit.aggregate([
      { $match: { farmerId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: '$creditsIssued' } } }
    ]);

    profileStats = {
      farmCount,
      totalCarbonCredits: totalCredits[0]?.total || 0
    };
  }

  return res.status(200).json(
    new ApiResponse(200, { user, profileStats }, "User profile retrieved successfully")
  );
});

const getMyId = AsyncHandler(async (req, res) => {
  // console.log("wdskds")
  const  userId = req.user._id;

  return res.status(200).json(
    new ApiResponse(200, userId, "User id sent")
  );
});


// FleetFlow specific functions
const getUsersByRole = AsyncHandler(async (req, res) => {
  const { role } = req.params;
  const { page = 1, limit = 50 } = req.query;

  if (!["FARMER", "FPO_ADMIN", "ADMIN"].includes(role)) {
    throw new ApiError(400, "Invalid role specified");
  }

  const users = await User.find({ role, isActive: true })
    .select('name email phone fpoId createdAt')
    .populate('fpoId', 'name region')
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
        totalUsers: total
      }
    }, `${role}s retrieved successfully`)
  );
});

const getFarmersByFPO = AsyncHandler(async (req, res) => {
  const { fpoId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  if (!mongoose.isValidObjectId(fpoId)) {
    throw new ApiError(400, "Invalid FPO ID");
  }

  const farmers = await User.find({ 
    fpoId, 
    role: "FARMER", 
    isActive: true 
  })
    .select('name email phone createdAt')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ name: 1 });

  const total = await User.countDocuments({ 
    fpoId, 
    role: "FARMER", 
    isActive: true 
  });

  return res.status(200).json(
    new ApiResponse(200, {
      farmers,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
        totalFarmers: total
      }
    }, "Farmers retrieved successfully")
  );
});

const updateUserRole = AsyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role, fpoId } = req.body;

  // Only ADMIN can change roles
  if (req.user.role !== "ADMIN") {
    throw new ApiError(403, "Only administrators can update user roles");
  }

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  if (!["FARMER", "FPO_ADMIN", "ADMIN"].includes(role)) {
    throw new ApiError(400, "Invalid role specified");
  }

  const updateData = { role };
  
  // If assigning to FPO, validate FPO exists
  if (fpoId) {
    const { Fpo } = await import('../Models/fpo.model.js');
    const fpoExists = await Fpo.findById(fpoId);
    if (!fpoExists) {
      throw new ApiError(404, "FPO not found");
    }
    updateData.fpoId = fpoId;
  } else if (role === "FARMER") {
    // Farmers should have an FPO
    updateData.fpoId = null;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true }
  )
    .select("-passwordHash -refreshToken")
    .populate('fpoId', 'name region');

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(200, user, "User role updated successfully")
  );
});

const deactivateUser = AsyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Only ADMIN can deactivate users
  if (req.user.role !== "ADMIN") {
    throw new ApiError(403, "Only administrators can deactivate users");
  }

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // Cannot deactivate self
  if (userId === req.user._id.toString()) {
    throw new ApiError(400, "Cannot deactivate your own account");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: false },
    { new: true }
  ).select("-passwordHash -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(200, user, "User deactivated successfully")
  );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateaccountDetails,
  verifyEmail,
  healthCheck,
  resendEmailVerification,
  sendResetPasswordEmail,
  resetPassword,
  getAllLawyers,
  getUserProfile,
  getMyId,
  // FleetFlow specific functions
  getUsersByRole,
  getFarmersByFPO,
  updateUserRole,
  deactivateUser
};
