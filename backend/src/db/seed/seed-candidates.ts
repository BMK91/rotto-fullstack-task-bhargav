import fs from "node:fs/promises";
import path from "node:path";

import { sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "../client.js";
import {
  candidateEducation,
  candidateExperiences,
  candidates,
} from "../schema/index.js";

const candidateSchema = z.object({
  id: z.string().min(1),

  full_name: z.string().min(1),
  avatar_url: z.string().url().nullable().optional(),
  headline: z.string().nullable().optional(),

  current_title: z.string().min(1),
  current_company: z.string().min(1),
  current_company_logo_url: z.string().url().nullable().optional(),

  role: z.string().min(1),
  seniority: z.enum(["junior", "mid", "senior", "staff"]),
  years_experience: z.number().int().nonnegative(),

  location: z.object({
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().min(1),
  }),

  open_to_work: z.boolean(),

  skills: z.array(z.string()),

  experiences: z.array(
    z.object({
      title: z.string().min(1),
      company: z.string().min(1),
      company_logo_url: z.string().url().nullable().optional(),
      company_type: z.string().nullable().optional(),
      start_year: z.number().int().nullable().optional(),
      end_year: z.number().int().nullable().optional(),
      description: z.string().nullable().optional(),
    }),
  ),

  education: z.array(
    z.object({
      school: z.string().min(1),
      degree: z.string().nullable().optional(),
      field: z.string().nullable().optional(),
      graduation_year: z.number().int().nullable().optional(),
    }),
  ),
});

const candidatesFileSchema = z.array(candidateSchema);

type CandidateSeed = z.infer<typeof candidateSchema>;

const BATCH_SIZE = 500;

async function loadCandidates(): Promise<CandidateSeed[]> {
  const filePath = path.resolve(process.cwd(), "./data/candidates.json");

  const file = await fs.readFile(filePath, "utf8");

  const parsed: unknown = JSON.parse(file);

  const result = candidatesFileSchema.safeParse(parsed);

  if (!result.success) {
    console.error("Invalid candidates.json:");

    console.error(z.prettifyError(result.error));

    throw new Error("Candidate seed validation failed");
  }

  return result.data;
}

export async function seedCandidates() {
  console.log("Loading candidates.json...");

  const candidateData = await loadCandidates();

  console.log(`Validated ${candidateData.length} candidates.`);

  const candidateIds = new Set<string>();

  for (const candidate of candidateData) {
    if (candidateIds.has(candidate.id)) {
      throw new Error(`Duplicate candidate ID: ${candidate.id}`);
    }

    candidateIds.add(candidate.id);
  }

  await db.transaction(async (tx) => {
    /*
     * Seed is the source-of-truth import.
     * Clear previous candidate data so rerunning the seed
     * cannot leave stale experiences or education records.
     */
    await tx.execute(
      sql`TRUNCATE TABLE
        candidate_experiences,
        candidate_education,
        candidates
        RESTART IDENTITY CASCADE`,
    );

    for (let offset = 0; offset < candidateData.length; offset += BATCH_SIZE) {
      const batch = candidateData.slice(offset, offset + BATCH_SIZE);

      await tx.insert(candidates).values(
        batch.map((candidate) => ({
          id: candidate.id,

          fullName: candidate.full_name,
          avatarUrl: candidate.avatar_url ?? null,
          headline: candidate.headline ?? null,

          currentTitle: candidate.current_title,
          currentCompany: candidate.current_company,
          currentCompanyLogoUrl: candidate.current_company_logo_url ?? null,

          role: candidate.role,
          seniority: candidate.seniority,
          yearsExperience: candidate.years_experience,

          locationCity: candidate.location.city,
          locationState: candidate.location.state,
          locationCountry: candidate.location.country,

          openToWork: candidate.open_to_work,

          skills: candidate.skills,
        })),
      );

      console.log(
        `Imported candidates: ${Math.min(
          offset + batch.length,
          candidateData.length,
        )}/${candidateData.length}`,
      );
    }

    const experiences = candidateData.flatMap((candidate) =>
      candidate.experiences.map((experience) => ({
        candidateId: candidate.id,

        title: experience.title,
        company: experience.company,
        companyLogoUrl: experience.company_logo_url ?? null,
        companyType: experience.company_type ?? null,

        startYear: experience.start_year ?? null,
        endYear: experience.end_year ?? null,

        description: experience.description ?? null,
      })),
    );

    for (let offset = 0; offset < experiences.length; offset += BATCH_SIZE) {
      const batch = experiences.slice(offset, offset + BATCH_SIZE);

      await tx.insert(candidateExperiences).values(batch);
    }

    const education = candidateData.flatMap((candidate) =>
      candidate.education.map((educationItem) => ({
        candidateId: candidate.id,

        school: educationItem.school,
        degree: educationItem.degree ?? null,
        field: educationItem.field ?? null,

        graduationYear: educationItem.graduation_year ?? null,
      })),
    );

    for (let offset = 0; offset < education.length; offset += BATCH_SIZE) {
      const batch = education.slice(offset, offset + BATCH_SIZE);

      await tx.insert(candidateEducation).values(batch);
    }
  });

  console.log(
    `Candidate import completed: ${candidateData.length} candidates.`,
  );
}
