import { Router } from "express";
import {
  createServiceLog,
  getAllServiceLogs,
  getServiceLogById,
  updateServiceLog,
  startService,
  completeService,
  cancelService,
  deleteServiceLog,
  getMaintenanceStats,
} from "../Controllers/maintenance.controller.js";
import { verifyJWT } from "../Middlewares/auth.middleware.js";
import { requireAnyRole } from "../Middlewares/roleAuth.middleware.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// ─────────────────────────────────────────────
// Service Log CRUD Operations
// ─────────────────────────────────────────────

/**
 * POST /api/v1/maintenance
 * Create new service log (auto sets vehicle to IN_SHOP)
 * Access: FLEET_MANAGER, DISPATCHER
 */
router.post("/", requireAnyRole(["FLEET_MANAGER", "DISPATCHER"]), createServiceLog);

/**
 * GET /api/v1/maintenance
 * Get all service logs with filters
 * Access: FLEET_MANAGER, DISPATCHER, SAFETY_OFFICER
 */
router.get(
  "/",
  requireAnyRole(["FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER"]),
  getAllServiceLogs
);

/**
 * GET /api/v1/maintenance/stats
 * Get maintenance statistics
 * Access: FLEET_MANAGER, FINANCIAL_ANALYST
 */
router.get(
  "/stats",
  requireAnyRole(["FLEET_MANAGER", "FINANCIAL_ANALYST"]),
  getMaintenanceStats
);

/**
 * GET /api/v1/maintenance/:id
 * Get single service log
 * Access: FLEET_MANAGER, DISPATCHER, SAFETY_OFFICER
 */
router.get(
  "/:id",
  requireAnyRole(["FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER"]),
  getServiceLogById
);

/**
 * PUT /api/v1/maintenance/:id
 * Update service log details
 * Access: FLEET_MANAGER, DISPATCHER
 */
router.put("/:id", requireAnyRole(["FLEET_MANAGER", "DISPATCHER"]), updateServiceLog);

/**
 * PATCH /api/v1/maintenance/:id/start
 * Start service (NEW -> IN_PROGRESS)
 * Access: FLEET_MANAGER, DISPATCHER
 */
router.patch("/:id/start", requireAnyRole(["FLEET_MANAGER", "DISPATCHER"]), startService);

/**
 * PATCH /api/v1/maintenance/:id/complete
 * Complete service (returns vehicle to AVAILABLE)
 * Access: FLEET_MANAGER, DISPATCHER
 */
router.patch("/:id/complete", requireAnyRole(["FLEET_MANAGER", "DISPATCHER"]), completeService);

/**
 * PATCH /api/v1/maintenance/:id/cancel
 * Cancel service (returns vehicle to AVAILABLE)
 * Access: FLEET_MANAGER, DISPATCHER
 */
router.patch("/:id/cancel", requireAnyRole(["FLEET_MANAGER", "DISPATCHER"]), cancelService);

/**
 * DELETE /api/v1/maintenance/:id
 * Delete service log (NEW only, returns vehicle to AVAILABLE)
 * Access: FLEET_MANAGER
 */
router.delete("/:id", requireAnyRole(["FLEET_MANAGER"]), deleteServiceLog);

export default router;
