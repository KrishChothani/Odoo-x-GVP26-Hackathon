import { Router } from "express";
import {
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
} from "../Controllers/user.controller.js";

import { verifyJWT } from "../Middlewares/auth.middleware.js";
import { requireManager } from "../Middlewares/roleAuth.middleware.js";

const router = Router();

// ─────────────────────────────────────────────
// Public Routes (No auth required)
// ─────────────────────────────────────────────
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/verify-email", verifyEmail);
router.post("/resend-email-verification", resendEmailVerification);
router.post("/send-reset-password-link", sendResetPasswordEmail);
router.post("/reset-password", resetPassword);
router.post("/refresh-token", refreshAccessToken);

// ─────────────────────────────────────────────
// Secured Routes (Any authenticated user)
// ─────────────────────────────────────────────
router.post("/logout", verifyJWT, logoutUser);
router.get("/current-user", verifyJWT, getCurrentUser);
router.patch("/update-account", verifyJWT, updateaccountDetails);
router.get("/healthcheck", verifyJWT, healthCheck);
router.get("/profile/:userId", verifyJWT, getUserProfile);
router.post("/getMyId", verifyJWT, getMyId);

// ─────────────────────────────────────────────
// Manager-Only Routes (RBAC: MANAGER role)
// ─────────────────────────────────────────────
router.get("/all", verifyJWT, requireManager, getAllUsers);
router.get("/by-role/:role", verifyJWT, requireManager, getUsersByRole);
router.patch("/update-role/:userId", verifyJWT, requireManager, updateUserRole);
router.patch("/deactivate/:userId", verifyJWT, requireManager, deactivateUser);
router.patch("/activate/:userId", verifyJWT, requireManager, activateUser);

export default router;
