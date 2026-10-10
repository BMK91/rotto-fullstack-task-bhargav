import { sql } from "drizzle-orm";

import app from "./app.js";
import { env } from "./config/env.js";
import { db } from "./db/client.js";

let server: ReturnType<typeof app.listen> | undefined;
let isShuttingDown = false;

async function startServer(): Promise<void> {
  try {
    // Verify PostgreSQL connectivity before accepting requests.
    await db.execute(sql`SELECT 1`);

    server = app.listen(env.PORT, () => {
      console.log("========================================");
      console.log("Rotto Recruiter API");
      console.log("========================================");
      console.log(`Environment : ${process.env.NODE_ENV ?? "development"}`);
      console.log(`Port        : ${env.PORT}`);
      console.log(`URL         : http://localhost:${env.PORT}`);
      console.log(`API Prefix  : ${env.API_PREFIX}`);
      console.log("Database    : Connected");
      console.log("========================================");
    });

    server.on("error", (error: Error) => {
      console.error("HTTP server failed:", error);
      process.exitCode = 1;
      void shutdown("SERVER_ERROR");
    });
  } catch (error) {
    console.error("Failed to start Rotto Recruiter API:", error);
    process.exitCode = 1;
  }
}

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`\n${signal} received. Shutting down gracefully...`);

  if (!server) {
    return;
  }

  server.close((error) => {
    if (error) {
      console.error("Error while closing HTTP server:", error);
      process.exitCode = 1;
      return;
    }

    console.log("HTTP server closed successfully.");
  });
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error("Unhandled promise rejection:", reason);
  process.exitCode = 1;
  void shutdown("UNHANDLED_REJECTION");
});

process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught exception:", error);
  process.exitCode = 1;
  void shutdown("UNCAUGHT_EXCEPTION");
});

void startServer();
