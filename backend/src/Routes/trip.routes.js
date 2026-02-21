import { Router } from "express";
import {
  createTrip,
  getAllTrips,
  getTripById,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  updateTrip,
  deleteTrip,
  getTripStatistics,
} from "../Controllers/trip.controller.js";
import { verifyJWT } from "../Middlewares/auth.middleware.js";
import { requireAnyRole } from "../Middlewares/roleAuth.middleware.js";

const router = Router();

// ─────────────────────────────────────────────
// TRIP ROUTES
// ─────────────────────────────────────────────

// All routes require authentication
router.use(verifyJWT);

// Statistics - DISPATCHER and FLEET_MANAGER only
router.route("/stats")
  .get(requireAnyRole(["FLEET_MANAGER", "DISPATCHER"]), getTripStatistics);

// Create trip - DISPATCHER and FLEET_MANAGER only
router.route("/")
  .post(requireAnyRole(["FLEET_MANAGER", "DISPATCHER"]), createTrip)
  .get(requireAnyRole(["FLEET_MANAGER", "DISPATCHER", "DRIVER"]), getAllTrips);

// Trip actions
router.route("/:id/dispatch")
  .patch(requireAnyRole(["FLEET_MANAGER", "DISPATCHER"]), dispatchTrip);

router.route("/:id/complete")
  .patch(requireAnyRole(["FLEET_MANAGER", "DISPATCHER", "DRIVER"]), completeTrip);

router.route("/:id/cancel")
  .patch(requireAnyRole(["FLEET_MANAGER", "DISPATCHER"]), cancelTrip);

// Single trip operations
router.route("/:id")
  .get(requireAnyRole(["FLEET_MANAGER", "DISPATCHER", "DRIVER"]), getTripById)
  .put(requireAnyRole(["FLEET_MANAGER", "DISPATCHER"]), updateTrip)
  .delete(requireAnyRole(["FLEET_MANAGER", "DISPATCHER"]), deleteTrip);

export default router;
