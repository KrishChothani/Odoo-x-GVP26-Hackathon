import { Router } from "express";
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  toggleOutOfService,
  deleteVehicle,
  getVehicleStatistics,
} from "../Controllers/vehicle.controller.js";
import { verifyJWT } from "../Middlewares/auth.middleware.js";
import { requireAnyRole } from "../Middlewares/roleAuth.middleware.js";

const router = Router();

// ─────────────────────────────────────────────
// VEHICLE ROUTES
// ─────────────────────────────────────────────

// Public routes (none for vehicles)

// Protected routes - FLEET_MANAGER only for write operations
router.route("/")
  .post(verifyJWT, requireAnyRole(["FLEET_MANAGER"]), createVehicle)
  .get(verifyJWT, requireAnyRole(["FLEET_MANAGER", "DISPATCHER"]), getAllVehicles);

router.route("/stats")
  .get(verifyJWT, requireAnyRole(["FLEET_MANAGER"]), getVehicleStatistics);

router.route("/:id")
  .get(verifyJWT, requireAnyRole(["FLEET_MANAGER", "DISPATCHER"]), getVehicleById)
  .put(verifyJWT, requireAnyRole(["FLEET_MANAGER"]), updateVehicle)
  .delete(verifyJWT, requireAnyRole(["FLEET_MANAGER"]), deleteVehicle);

router.route("/:id/toggle-service")
  .patch(verifyJWT, requireAnyRole(["FLEET_MANAGER"]), toggleOutOfService);

export default router;
