import { Router } from "express";
import {
  getCurrentUser,
  getUserProfile,
  healthCheck,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendEmailVerification,
  resetPassword,
  sendResetPasswordEmail,
  updateaccountDetails,
  verifyEmail,
  getAllLawyers,
  getMyId,
  getUsersByRole,
  getFarmersByFPO,
  updateUserRole,
  deactivateUser
} from "../Controllers/user.controller.js";
import { verifyJWT } from "../Middlewares/auth.middleware.js";
import { requireAdmin, requireAdminOrFpoAdmin } from "../Middlewares/roleAuth.middleware.js";

const router = Router();

// Public routes
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/verify-email").get(verifyEmail);
router.route("/resend-email-verification").post(resendEmailVerification);
router.route("/send-reset-password-link").post(sendResetPasswordEmail);
router.route("/reset-password").post(resetPassword);

// Secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateaccountDetails);
router.route("/healthcheck").get(verifyJWT, healthCheck);
router.route("/profile/:userId").get(verifyJWT, getUserProfile);
router.route("/getMyId").post(verifyJWT, getMyId);

export default router;
