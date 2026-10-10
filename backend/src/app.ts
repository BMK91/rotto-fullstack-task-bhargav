import cors from "cors";
import { sql } from "drizzle-orm";
import express from "express";

import { env } from "./config/env.js";
import { db } from "./db/client.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import routes from "./routes/index.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));

app.use(env.API_PREFIX, routes);

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy and running.",
  });
});

app.get("/health/db", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);

    res.status(200).json({
      success: true,
      message: "Database connection is healthy",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// Must be registered after all routes.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
