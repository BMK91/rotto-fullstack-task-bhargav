import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db/client.js";
import {
  candidates,
  shortlistCandidates,
  shortlists,
} from "@/db/schema/index.js";

import type {
  Shortlist,
  ShortlistCandidateAssociation,
  ShortlistCandidateItem,
  ShortlistSummary,
} from "./shortlist.types.js";

export async function createShortlistRecord(data: {
  name: string;
  companyId: string;
  recruiterId: string;
}): Promise<Shortlist> {
  const [record] = await db
    .insert(shortlists)
    .values({
      name: data.name,
      companyId: data.companyId,
      recruiterId: data.recruiterId,
    })
    .returning();

  if (!record) {
    throw new Error("Failed to insert shortlist record");
  }

  return record;
}

export async function getCompanyShortlists(
  companyId: string,
  candidateId?: string,
): Promise<ShortlistSummary[]> {
  const rows = await db
    .select({
      id: shortlists.id,
      name: shortlists.name,
      candidateCount: sql<number>`cast(count(${shortlistCandidates.id}) as integer)`,
      createdAt: shortlists.createdAt,
      updatedAt: shortlists.updatedAt,
      hasCandidate: candidateId
        ? sql<boolean>`coalesce(bool_or(${shortlistCandidates.candidateId} = ${candidateId}), false)`
        : sql<boolean>`false`,
    })
    .from(shortlists)
    .leftJoin(
      shortlistCandidates,
      eq(shortlists.id, shortlistCandidates.shortlistId),
    )
    .where(eq(shortlists.companyId, companyId))
    .groupBy(shortlists.id)
    .orderBy(asc(sql`lower(${shortlists.name})`));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    candidateCount: r.candidateCount,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    ...(candidateId ? { hasCandidate: Boolean(r.hasCandidate) } : {}),
  }));
}

export async function findShortlistByNameAndCompany(
  name: string,
  companyId: string,
): Promise<Shortlist | null> {
  const [record] = await db
    .select()
    .from(shortlists)
    .where(
      and(
        sql`lower(${shortlists.name}) = lower(${name.trim()})`,
        eq(shortlists.companyId, companyId),
      ),
    )
    .limit(1);

  return record ?? null;
}

export async function findShortlistByIdAndCompany(
  id: string,
  companyId: string,
): Promise<Shortlist | null> {
  const [record] = await db
    .select()
    .from(shortlists)
    .where(and(eq(shortlists.id, id), eq(shortlists.companyId, companyId)))
    .limit(1);

  return record ?? null;
}

export async function findCandidateById(
  candidateId: string,
): Promise<{ id: string } | null> {
  const [candidate] = await db
    .select({ id: candidates.id })
    .from(candidates)
    .where(eq(candidates.id, candidateId))
    .limit(1);

  return candidate ?? null;
}

export async function findShortlistCandidateAssociation(
  shortlistId: string,
  candidateId: string,
): Promise<ShortlistCandidateAssociation | null> {
  const [association] = await db
    .select()
    .from(shortlistCandidates)
    .where(
      and(
        eq(shortlistCandidates.shortlistId, shortlistId),
        eq(shortlistCandidates.candidateId, candidateId),
      ),
    )
    .limit(1);

  return association ?? null;
}

export async function getShortlistCandidatesPaginated(
  shortlistId: string,
  page: number,
  pageSize: number,
): Promise<{ candidates: ShortlistCandidateItem[]; total: number }> {
  const offset = (page - 1) * pageSize;

  const [items, countRow] = await Promise.all([
    db
      .select({
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
        addedAt: shortlistCandidates.createdAt,
      })
      .from(shortlistCandidates)
      .innerJoin(candidates, eq(shortlistCandidates.candidateId, candidates.id))
      .where(eq(shortlistCandidates.shortlistId, shortlistId))
      .orderBy(desc(shortlistCandidates.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ total: sql<number>`cast(count(*) as integer)` })
      .from(shortlistCandidates)
      .where(eq(shortlistCandidates.shortlistId, shortlistId)),
  ]);

  const total = countRow[0]?.total ?? 0;

  return {
    candidates: items,
    total,
  };
}

export async function insertCandidateToShortlist(
  shortlistId: string,
  candidateId: string,
): Promise<ShortlistCandidateAssociation> {
  return await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(shortlistCandidates)
      .values({
        shortlistId,
        candidateId,
      })
      .returning();

    if (!inserted) {
      throw new Error("Failed to insert candidate to shortlist");
    }

    await tx
      .update(shortlists)
      .set({ updatedAt: sql`now()` })
      .where(eq(shortlists.id, shortlistId));

    return inserted;
  });
}

export async function deleteCandidateFromShortlist(
  shortlistId: string,
  candidateId: string,
): Promise<boolean> {
  return await db.transaction(async (tx) => {
    const deleted = await tx
      .delete(shortlistCandidates)
      .where(
        and(
          eq(shortlistCandidates.shortlistId, shortlistId),
          eq(shortlistCandidates.candidateId, candidateId),
        ),
      )
      .returning({ id: shortlistCandidates.id });

    if (deleted.length > 0) {
      await tx
        .update(shortlists)
        .set({ updatedAt: sql`now()` })
        .where(eq(shortlists.id, shortlistId));

      return true;
    }

    return false;
  });
}

export async function deleteShortlistRecord(
  id: string,
  companyId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(shortlists)
    .where(and(eq(shortlists.id, id), eq(shortlists.companyId, companyId)))
    .returning({ id: shortlists.id });

  return deleted.length > 0;
}
