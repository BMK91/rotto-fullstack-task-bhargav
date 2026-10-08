import { seedAuth } from "./seed-auth.js";

seedAuth()
  .then(() => {
    console.log("Auth seed completed successfully.");
  })
  .catch((error: unknown) => {
    console.error("Auth seed failed:", error);
    process.exitCode = 1;
  });
