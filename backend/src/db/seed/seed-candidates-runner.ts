import { seedCandidates } from "./seed-candidates.js";

seedCandidates()
  .then(() => {
    console.log("Candidate seed completed successfully.");
  })
  .catch((error: unknown) => {
    console.error("Candidate seed failed:", error);
    process.exitCode = 1;
  });
