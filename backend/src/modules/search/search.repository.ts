import {
  and,
  arrayOverlaps,
  asc,
  count,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { db } from "@/db/client.js";
import { candidateExperiences, candidates } from "@/db/schema/index.js";
import type { SearchFilters } from "@/validators/search.validator.js";

export const SEARCH_PAGE_SIZE = 20;

const candidateColumns = {
  id: candidates.id,
  fullName: candidates.fullName,
  avatarUrl: candidates.avatarUrl,
  headline: candidates.headline,
  currentTitle: candidates.currentTitle,
  currentCompany: candidates.currentCompany,
  currentCompanyLogoUrl: candidates.currentCompanyLogoUrl,
  role: candidates.role,
  seniority: candidates.seniority,
  yearsExperience: candidates.yearsExperience,
  locationCity: candidates.locationCity,
  locationState: candidates.locationState,
  locationCountry: candidates.locationCountry,
  openToWork: candidates.openToWork,
  skills: candidates.skills,
};

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

function containsPattern(value: string): string {
  return `%${escapeLike(value)}%`;
}

function buildCandidateQuery(filters: SearchFilters) {
  const conditions: SQL[] = [];

  if (filters.skills.length > 0) {
    conditions.push(arrayOverlaps(candidates.skills, filters.skills));
  }

  if (filters.roles.length > 0) {
    const roleConditions = filters.roles.flatMap((role) => {
      const pattern = containsPattern(role);
      return [
        ilike(candidates.role, pattern),
        ilike(candidates.currentTitle, pattern),
      ];
    });

    const experienceRoleMatch = exists(
      db
        .select({ id: candidateExperiences.id })
        .from(candidateExperiences)
        .where(
          and(
            eq(candidateExperiences.candidateId, candidates.id),
            or(
              ...filters.roles.map((role) =>
                ilike(candidateExperiences.title, containsPattern(role)),
              ),
            ),
          ),
        ),
    );

    conditions.push(or(...roleConditions, experienceRoleMatch)!);
  }

  if (filters.seniority.length > 0) {
    conditions.push(
      or(...filters.seniority.map((value) => eq(candidates.seniority, value)))!,
    );
  }

  if (filters.minYearsExperience !== undefined) {
    conditions.push(
      gte(candidates.yearsExperience, filters.minYearsExperience),
    );
  }

  if (filters.maxYearsExperience !== undefined) {
    conditions.push(
      lte(candidates.yearsExperience, filters.maxYearsExperience),
    );
  }

  if (filters.companyType.length > 0) {
    conditions.push(
      exists(
        db
          .select({ one: sql<number>`1` })
          .from(candidateExperiences)
          .where(
            and(
              eq(candidateExperiences.candidateId, candidates.id),
              inArray(candidateExperiences.companyType, filters.companyType),
            ),
          ),
      ),
    );
  }

  if (filters.location?.city) {
    conditions.push(
      ilike(candidates.locationCity, containsPattern(filters.location.city)),
    );
  }

  if (filters.location?.state) {
    conditions.push(
      ilike(candidates.locationState, containsPattern(filters.location.state)),
    );
  }

  if (filters.location?.country) {
    conditions.push(
      ilike(
        candidates.locationCountry,
        containsPattern(filters.location.country),
      ),
    );
  }

  if (filters.openToWork !== undefined) {
    conditions.push(eq(candidates.openToWork, filters.openToWork));
  }

  const ordering: SQL[] = [];

  if (filters.skills.length > 0) {
    const skillRank = sql<number>`
      CASE
        WHEN ${arrayOverlaps(candidates.skills, filters.skills)}
        THEN 1
        ELSE 0
      END
    `;

    ordering.push(desc(skillRank));
  }

  if (filters.roles.length > 0) {
    const roleRank = sql<number>`
      CASE
        WHEN ${or(
          ...filters.roles.map((role) =>
            ilike(candidates.role, containsPattern(role)),
          ),
        )!}
        THEN 1
        ELSE 0
      END
    `;

    ordering.push(desc(roleRank));
  }

  ordering.push(
    desc(candidates.yearsExperience),
    desc(candidates.updatedAt),
    asc(candidates.id),
  );

  return {
    whereClause: conditions.length > 0 ? and(...conditions) : undefined,
    ordering,
  };
}

export async function getCandidatesByIds(ids: string[]) {
  if (ids.length === 0) {
    return [];
  }

  const rows = await db
    .select(candidateColumns)
    .from(candidates)
    .where(inArray(candidates.id, ids));
  const byId = new Map(rows.map((row) => [row.id, row]));

  return ids.flatMap((id) => {
    const candidate = byId.get(id);
    return candidate ? [candidate] : [];
  });
}

export async function searchCandidates(filters: SearchFilters, page: number) {
  const { whereClause, ordering } = buildCandidateQuery(filters);

  const offset = (page - 1) * SEARCH_PAGE_SIZE;
  const [items, countRows] = await Promise.all([
    db
      .select(candidateColumns)
      .from(candidates)
      .where(whereClause)
      .orderBy(...ordering)
      .limit(SEARCH_PAGE_SIZE)
      .offset(offset),

    db.select({ total: count() }).from(candidates).where(whereClause),
  ]);

  const total = countRows[0]?.total ?? 0;
  const totalPages = Math.ceil(total / SEARCH_PAGE_SIZE);

  const resultIds = items.map((row) => row.id);
  // const firstPageIds = resultIds.slice(0, SEARCH_PAGE_SIZE);

  return {
    items,
    resultIds,
    pagination: {
      page,
      pageSize: SEARCH_PAGE_SIZE,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
