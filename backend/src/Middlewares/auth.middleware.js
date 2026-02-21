import { User } from "../Models/user.model.js";
import { ApiError } from "../Utils/ApiError.js";
import jwt from "jsonwebtoken";
import { AsyncHandler } from "../Utils/AsyncHandler.js";

export const verifyJWT = AsyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-passwordHash -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError(401, "Account is deactivated. Please contact your Manager.");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
