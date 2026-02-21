/** @format */

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed for this origin"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(cookieParser());

// ─────────────────────────────────────────────
// Import Routes
// ─────────────────────────────────────────────
import userRouter from "./Routes/user.routes.js";

// ─────────────────────────────────────────────
// Route Declarations
// ─────────────────────────────────────────────
app.use("/api/v1/users", userRouter);

// ─────────────────────────────────────────────
// Root Health Check
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to FleetFlow API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      users: "/api/v1/users",
    },
  });
});

export { app };
