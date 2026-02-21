import { ApiError } from "../Utils/ApiError.js";

/**
 * FleetFlow Role-Based Access Control (RBAC) Middleware
 *
 * Roles:
 *  - MANAGER    : Full administrative access
 *  - DISPATCHER : Restricted operational access
 *
 * Usage (after verifyJWT):
 *   router.get("/admin-route", verifyJWT, requireManager, handler);
 *   router.get("/ops-route",   verifyJWT, requireDispatcher, handler);
 *   router.get("/any-route",   verifyJWT, requireAnyRole(["MANAGER","DISPATCHER"]), handler);
 */

// Only MANAGER can access
export const requireManager = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Unauthorized — not authenticated"));
  }
  if (req.user.role !== "MANAGER") {
    return next(
      new ApiError(403, "Access denied — Manager role required")
    );
  }
  next();
};

// Only DISPATCHER can access
export const requireDispatcher = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Unauthorized — not authenticated"));
  }
  if (req.user.role !== "DISPATCHER") {
    return next(
      new ApiError(403, "Access denied — Dispatcher role required")
    );
  }
  next();
};

// Either MANAGER or DISPATCHER — just needs to be authenticated with a valid role
export const requireAnyRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized — not authenticated"));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access denied — required role: ${roles.join(" or ")}`
        )
      );
    }
    next();
  };
};
