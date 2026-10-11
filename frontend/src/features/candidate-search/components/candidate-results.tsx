"use client";

import { ChevronDown, ChevronUp, LoaderCircle, MapPin, BriefcaseBusiness } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Candidate } from "@/features/candidate-search/schemas/search.schema";

interface CandidateResultsProps {
  candidates: Candidate[];
  total: number;
  isLoadingMore: boolean;
  hasMore: boolean;
  paginationError: string | null;
  onLoadMore: () => void;
  onRetryPage: () => void;
}

function CandidateResultItem({ candidate }: { candidate: Candidate }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const location = [
    candidate.locationCity,
    candidate.locationState,
    candidate.locationCountry,
  ]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(", ");
  const skills = (candidate.skills ?? []).filter(Boolean);
  const primarySkills = skills.slice(0, 4);
  const title = candidate.currentTitle?.trim();
  const company = candidate.currentCompany?.trim();
  const currentRole = [title, company].filter(Boolean).join(" at ");
  const name = candidate.fullName?.trim() || "Candidate profile";

  return (
    <article className="overflow-hidden rounded-xl border bg-card">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={() => setExpanded((value) => !value)}
        className="flex min-h-24 w-full items-start justify-between gap-4 p-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:items-center sm:px-5"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{name}</span>
          {currentRole && (
            <span className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
              <BriefcaseBusiness className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{currentRole}</span>
            </span>
          )}
          <span className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {typeof candidate.yearsExperience === "number" && (
              <span>{candidate.yearsExperience} years of experience</span>
            )}
            {location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden="true" />
                {location}
              </span>
            )}
          </span>
          {primarySkills.length > 0 && (
            <span className="mt-2 flex flex-wrap gap-1.5">
              {primarySkills.map((skill) => (
                <span key={skill} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                  {skill}
                </span>
              ))}
              {skills.length > primarySkills.length && (
                <span className="self-center text-xs text-muted-foreground">
                  +{skills.length - primarySkills.length} more
                </span>
              )}
            </span>
          )}
        </span>
        <span className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground" aria-hidden="true">
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </span>
      </button>

      {expanded && (
        <div id={detailsId} className="space-y-4 border-t bg-muted/20 px-4 py-4 sm:px-5">
          {candidate.headline && (
            <p className="text-sm leading-6 text-foreground">{candidate.headline}</p>
          )}
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {candidate.role && <CandidateFact label="Role" value={candidate.role} />}
            {candidate.seniority && <CandidateFact label="Seniority" value={candidate.seniority} />}
            {currentRole && <CandidateFact label="Current position" value={currentRole} />}
            {location && <CandidateFact label="Location" value={location} />}
            {typeof candidate.yearsExperience === "number" && (
              <CandidateFact label="Experience" value={`${candidate.yearsExperience} years`} />
            )}
            {typeof candidate.openToWork === "boolean" && (
              <CandidateFact label="Availability" value={candidate.openToWork ? "Open to work" : "Not marked open to work"} />
            )}
          </dl>
          {skills.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills</h3>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <li key={skill} className="rounded-md border bg-background px-2.5 py-1 text-xs">{skill}</li>
                ))}
              </ul>
            </div>
          )}
          {!candidate.headline && !currentRole && !location && skills.length === 0 && (
            <p className="text-sm text-muted-foreground">No additional profile details are available.</p>
          )}
        </div>
      )}
    </article>
  );
}

function CandidateFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words font-medium">{value}</dd>
    </div>
  );
}

export function CandidateResults({
  candidates,
  total,
  isLoadingMore,
  hasMore,
  paginationError,
  onLoadMore,
  onRetryPage,
}: CandidateResultsProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoadingMore || paginationError) return;
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
      },
      { rootMargin: "280px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore, paginationError]);

  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <h2 className="font-semibold">No candidates found</h2>
        <p className="mt-1 text-sm text-muted-foreground">Try a broader brief or remove a requirement.</p>
      </div>
    );
  }

  return (
    <section aria-labelledby="candidate-results-heading" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="candidate-results-heading" className="text-lg font-semibold">Candidates</h2>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Showing {candidates.length} of {total}
        </p>
      </div>
      <ul className="space-y-3">
        {candidates.map((candidate) => (
          <li key={candidate.id}><CandidateResultItem candidate={candidate} /></li>
        ))}
      </ul>
      <div ref={sentinelRef} aria-hidden="true" className="h-1" />
      {paginationError ? (
        <div role="alert" className="flex flex-col items-start justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center">
          <p className="text-sm">{paginationError}</p>
          <Button type="button" variant="outline" onClick={onRetryPage}>Retry loading candidates</Button>
        </div>
      ) : isLoadingMore ? (
        <p className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground" role="status">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Loading more candidates…
        </p>
      ) : hasMore ? (
        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={onLoadMore}>Load more candidates</Button>
        </div>
      ) : (
        <p className="py-3 text-center text-sm text-muted-foreground">You’ve reached the end of the results.</p>
      )}
    </section>
  );
}
