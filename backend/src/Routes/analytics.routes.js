import { Router } from "express";
import { getOperationalAnalytics, getMonthlyReportData } from "../Controllers/analytics.controller.js";
import { verifyJWT } from "../Middlewares/auth.middleware.js";
import { requireAnyRole } from "../Middlewares/roleAuth.middleware.js";

const router = Router();

// All analytics routes require authentication
router.use(verifyJWT);

/**
 * @route   GET /api/v1/analytics/operational
 * @desc    Get comprehensive operational analytics and financial metrics
 * @access  FLEET_MANAGER, FINANCIAL_ANALYST
 * @query   startDate, endDate, vehicleId (optional filters)
 */
router.get(
  "/operational",
  requireAnyRole(["FLEET_MANAGER", "FINANCIAL_ANALYST"]),
  getOperationalAnalytics
);

/**
 * @route   GET /api/v1/analytics/monthly-report
 * @desc    Get monthly report data for export (CSV/PDF)
 * @access  FLEET_MANAGER, FINANCIAL_ANALYST
 * @query   month, year (required)
 */
router.get(
  "/monthly-report",
  requireAnyRole(["FLEET_MANAGER", "FINANCIAL_ANALYST"]),
  getMonthlyReportData
);

export default router;
