import { Router } from "express";
import {
  getDashboardKPIs,
  getDashboardTableData,
  getFilterOptions,
} from "../Controllers/dashboard.controller.js";
import { verifyJWT } from "../Middlewares/auth.middleware.js";

const router = Router();

// All dashboard routes require authentication
router.use(verifyJWT);

/**
 * @route   GET /api/dashboard/kpis
 * @desc    Get dashboard KPI metrics
 * @access  Private (Manager, Dispatcher)
 * @query   vehicleType, status, region (optional filters)
 */
router.route("/kpis").get(getDashboardKPIs);

/**
 * @route   GET /api/dashboard/table
 * @desc    Get dashboard table data with trips
 * @access  Private (Manager, Dispatcher)
 * @query   page, limit, vehicleType, status, region, search (optional)
 */
router.route("/table").get(getDashboardTableData);

/**
 * @route   GET /api/dashboard/filters
 * @desc    Get available filter options
 * @access  Private (Manager, Dispatcher)
 */
router.route("/filters").get(getFilterOptions);

export default router;
