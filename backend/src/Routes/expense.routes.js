import { Router } from "express";
import { verifyJWT } from "../Middlewares/auth.middleware.js";
import { requireAnyRole } from "../Middlewares/roleAuth.middleware.js";
import {
  createFuelLog,
  getAllFuelLogs,
  getFuelLogById,
  updateFuelLog,
  deleteFuelLog,
  getVehicleOperationalCosts,
  getVehicleAnalytics,
  getTripExpenseSummary,
  getExpenseStats,
  getAllVehiclesCosts,
} from "../Controllers/expense.controller.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

/**
 * Fuel Log Management Routes
 */

// Create fuel log - DISPATCHER, FLEET_MANAGER, DRIVER can log fuel
router.post(
  "/fuel",
  requireAnyRole(["DISPATCHER", "FLEET_MANAGER", "DRIVER"]),
  createFuelLog
);

// Get all fuel logs - DISPATCHER, FLEET_MANAGER, FINANCIAL_ANALYST
router.get(
  "/fuel",
  requireAnyRole(["DISPATCHER", "FLEET_MANAGER", "FINANCIAL_ANALYST"]),
  getAllFuelLogs
);

// Get fuel log by ID - All roles can view
router.get(
  "/fuel/:id",
  requireAnyRole(["DISPATCHER", "FLEET_MANAGER", "FINANCIAL_ANALYST", "DRIVER", "SAFETY_OFFICER"]),
  getFuelLogById
);

// Update fuel log - DISPATCHER, FLEET_MANAGER only
router.put(
  "/fuel/:id",
  requireAnyRole(["DISPATCHER", "FLEET_MANAGER"]),
  updateFuelLog
);

// Delete fuel log - FLEET_MANAGER only
router.delete(
  "/fuel/:id",
  requireAnyRole(["FLEET_MANAGER"]),
  deleteFuelLog
);

/**
 * Vehicle Cost & Analytics Routes
 */

// Get all vehicles with aggregated costs
router.get(
  "/vehicles/all-costs",
  requireAnyRole(["FLEET_MANAGER", "DISPATCHER", "FINANCIAL_ANALYST"]),
  getAllVehiclesCosts
);

// Get vehicle operational costs (Fuel + Maintenance)
router.get(
  "/vehicle/:vehicleId/costs",
  requireAnyRole(["FLEET_MANAGER", "FINANCIAL_ANALYST"]),
  getVehicleOperationalCosts
);

// Get vehicle analytics and trends
router.get(
  "/vehicle/:vehicleId/analytics",
  requireAnyRole(["FLEET_MANAGER", "FINANCIAL_ANALYST"]),
  getVehicleAnalytics
);

/**
 * Trip Expense Routes
 */

// Get trip expense summary
router.get(
  "/trip/:tripId/summary",
  requireAnyRole(["DISPATCHER", "FLEET_MANAGER", "FINANCIAL_ANALYST"]),
  getTripExpenseSummary
);

/**
 * Statistics & Dashboard Routes
 */

// Get overall expense statistics
router.get(
  "/stats",
  requireAnyRole(["FLEET_MANAGER", "FINANCIAL_ANALYST"]),
  getExpenseStats
);

export default router;
