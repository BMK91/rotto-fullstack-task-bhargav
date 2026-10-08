import { supabaseAdmin } from "@/lib/supabase/admin.js";

import { db } from "../client.js";
import { companies, recruiters } from "../schema/index.js";

const seedRecruiters = [
  {
    companySlug: "acme",
    companyName: "Acme",
    email: "recruiter@acme.test",
    password: "rotto-assessment",
  },
  {
    companySlug: "globex",
    companyName: "Globex",
    email: "recruiter@globex.test",
    password: "rotto-assessment",
  },
] as const;

async function findAuthUserByEmail(email: string) {
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      throw new Error(`Failed to list Supabase Auth users: ${error.message}`);
    }

    const user = data.users.find((candidate) => candidate.email === email);

    if (user) {
      return user;
    }

    if (data.users.length < 100) {
      return null;
    }

    page += 1;
  }
}

async function getOrCreateAuthUser(email: string, password: string) {
  const existingUser = await findAuthUserByEmail(email);

  if (existingUser) {
    return existingUser;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(
      `Failed to create Supabase Auth user ${email}: ${
        error?.message ?? "Unknown error"
      }`,
    );
  }

  return data.user;
}

export async function seedAuth() {
  console.log("Seeding companies and recruiters...");

  for (const recruiterSeed of seedRecruiters) {
    const [company] = await db
      .insert(companies)
      .values({
        slug: recruiterSeed.companySlug,
        name: recruiterSeed.companyName,
      })
      .onConflictDoUpdate({
        target: companies.slug,
        set: {
          name: recruiterSeed.companyName,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!company) {
      throw new Error(`Failed to create company ${recruiterSeed.companySlug}`);
    }

    const authUser = await getOrCreateAuthUser(
      recruiterSeed.email,
      recruiterSeed.password,
    );

    await db
      .insert(recruiters)
      .values({
        authUserId: authUser.id,
        companyId: company.id,
        email: recruiterSeed.email,
      })
      .onConflictDoUpdate({
        target: recruiters.email,
        set: {
          authUserId: authUser.id,
          companyId: company.id,
          updatedAt: new Date(),
        },
      });

    console.log(`Seeded ${recruiterSeed.companySlug}: ${recruiterSeed.email}`);
  }

  console.log("Companies and recruiters seed completed.");
}
