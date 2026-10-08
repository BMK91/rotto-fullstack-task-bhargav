import { seedAuth } from "./seed-auth.js";
import { seedCandidates } from "./seed-candidates.js";

async function seed() {
 console.log("=================================");
  console.log("Starting Rotto database seed");
  console.log("=================================");

  console.log("\n[1/2] Seeding authentication data...");
  await seedAuth();

  console.log("\n[2/2] Seeding candidate data...");
  await seedCandidates();

  console.log("\n=================================");
  console.log("Rotto database seed completed");
  console.log("=================================");
}

seed().catch((error: unknown) => {
  console.error("Database seed failed:", error);
  process.exitCode = 1;
});
