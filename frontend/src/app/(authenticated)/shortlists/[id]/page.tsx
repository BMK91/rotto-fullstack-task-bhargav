"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  LoaderCircle,
  MapPin,
  Search,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  shortlistService,
  ShortlistServiceError,
} from "@/features/shortlists/services/shortlist.service";
import type {
  ShortlistCandidateItem,
  ShortlistDetails,
} from "@/features/shortlists/schemas/shortlist.schema";
import { toast } from "@/lib/toast";

function CandidateFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
    </div>
  );
}

function ShortlistCandidateCard({
  candidate,
  onRemove,
  isRemoving,
}: {
  candidate: ShortlistCandidateItem;
  onRemove: (id: string, name: string) => void;
  isRemoving: boolean;
}) {
  const [expanded, setExpanded] = React.useState(false);
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
  const addedDate = candidate.addedAt
    ? new Date(candidate.addedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <article className="overflow-hidden rounded-xl border bg-card">
      <div className="flex min-h-24 w-full items-start justify-between gap-4 p-4 transition-colors hover:bg-muted/30 sm:items-center sm:px-5">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg cursor-pointer"
        >
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
            {addedDate && (
              <span className="text-muted-foreground/75">
                Added {addedDate}
              </span>
            )}
          </span>
          {primarySkills.length > 0 && (
            <span className="mt-2 flex flex-wrap gap-1.5">
              {primarySkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                >
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
        </button>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            disabled={isRemoving}
            onClick={() => onRemove(candidate.id, name)}
            className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 cursor-pointer"
            title="Remove candidate from shortlist"
          >
            {isRemoving ? (
              <LoaderCircle className="size-3.5 animate-spin mr-1.5" />
            ) : (
              <UserMinus className="size-3.5 mr-1.5" />
            )}
            <span>Remove</span>
          </Button>

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            aria-label={expanded ? "Collapse details" : "Expand details"}
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 border-t bg-muted/20 px-4 py-4 sm:px-5">
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
              <CandidateFact
                label="Availability"
                value={candidate.openToWork ? "Open to work" : "Not marked open to work"}
              />
            )}
          </dl>

          {skills.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Skills
              </h3>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-md border bg-background px-2.5 py-1 text-xs"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function ShortlistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shortlistId = typeof params?.id === "string" ? params.id : "";

  const [details, setDetails] = React.useState<ShortlistDetails | null>(null);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const [isDeletingShortlist, setIsDeletingShortlist] = React.useState(false);
  const [isConfirmingDeleteShortlist, setIsConfirmingDeleteShortlist] = React.useState(false);
  const [candidateToRemove, setCandidateToRemove] = React.useState<{
    id: string;
    name: string;
  } | null>(null);

  const fetchDetails = React.useCallback(
    async (targetPage: number) => {
      if (!shortlistId) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await shortlistService.getShortlistDetails(shortlistId, targetPage);
        setDetails(data);
        setPage(targetPage);
      } catch (err: unknown) {
        if (err instanceof ShortlistServiceError) {
          setError(err.message);
        } else {
          setError("Failed to load shortlist details.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [shortlistId],
  );

  React.useEffect(() => {
    let ignore = false;
    if (!shortlistId) return;

    shortlistService.getShortlistDetails(shortlistId, page).then(
      (data) => {
        if (!ignore) {
          setDetails(data);
          setIsLoading(false);
        }
      },
      (err: unknown) => {
        if (!ignore) {
          setError(
            err instanceof ShortlistServiceError
              ? err.message
              : "Failed to load shortlist details.",
          );
          setIsLoading(false);
        }
      },
    );

    return () => {
      ignore = true;
    };
  }, [shortlistId, page]);

  const handleConfirmRemoveCandidate = async () => {
    if (!candidateToRemove) return;
    try {
      setRemovingId(candidateToRemove.id);
      await shortlistService.removeCandidate(shortlistId, candidateToRemove.id);
      toast.success(`Removed ${candidateToRemove.name} from shortlist.`);
      setCandidateToRemove(null);

      // Refresh list
      await fetchDetails(page);
    } catch (err: unknown) {
      if (err instanceof ShortlistServiceError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to remove candidate.");
      }
    } finally {
      setRemovingId(null);
    }
  };

  const handleConfirmDeleteShortlist = async () => {
    if (!details) return;

    try {
      setIsDeletingShortlist(true);
      await shortlistService.deleteShortlist(shortlistId);
      toast.success(`Shortlist "${details.name}" deleted.`);
      router.push("/shortlists");
    } catch (err: unknown) {
      if (err instanceof ShortlistServiceError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete shortlist.");
      }
      setIsDeletingShortlist(false);
    }
  };

  return (
    <section className="space-y-6">
      {/* Back button & Title bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/shortlists"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Shortlists</span>
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {details?.name ?? "Shortlist Details"}
            </h1>

            {details && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <Users className="size-3" />
                <span>
                  {details.candidateCount}{" "}
                  {details.candidateCount === 1 ? "candidate" : "candidates"}
                </span>
              </span>
            )}
          </div>
        </div>

        {details && (
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Link
              href="/candidate-search"
              className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors shadow-2xs cursor-pointer"
            >
              <Search className="size-3.5" />
              <span>Search & Add Candidates</span>
            </Link>

            <Button
              variant="outline"
              size="sm"
              disabled={isDeletingShortlist}
              onClick={() => setIsConfirmingDeleteShortlist(true)}
              className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 cursor-pointer"
            >
              {isDeletingShortlist ? (
                <LoaderCircle className="size-3.5 animate-spin mr-1.5" />
              ) : (
                <Trash2 className="size-3.5 mr-1.5" />
              )}
              <span>Delete Shortlist</span>
            </Button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border bg-card p-12 text-center">
          <LoaderCircle className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading candidates...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchDetails(page)}
            className="mt-4 cursor-pointer"
          >
            Retry
          </Button>
        </div>
      ) : !details || details.candidates.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="size-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-foreground">
            No candidates in this shortlist yet
          </h2>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            Use candidate search to find matching candidates and save them directly into this shortlist.
          </p>
          <Link
            href="/candidate-search"
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Search className="size-4" />
            <span>Search Candidates</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {details.candidates.map((candidate) => {
              const candidateName =
                candidate.fullName?.trim() || "Candidate profile";
              return (
                <ShortlistCandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onRemove={(id) =>
                    setCandidateToRemove({ id, name: candidateName })
                  }
                  isRemoving={removingId === candidate.id}
                />
              );
            })}
          </div>

          {/* Pagination Controls */}
          {details.pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
              <span>
                Page {details.pagination.page} of {details.pagination.totalPages} ({details.pagination.total} total)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!details.pagination.hasPreviousPage || isLoading}
                  onClick={() => void fetchDetails(page - 1)}
                  className="gap-1 cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!details.pagination.hasNextPage || isLoading}
                  onClick={() => void fetchDetails(page + 1)}
                  className="gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog to Delete Shortlist */}
      <ConfirmDialog
        open={isConfirmingDeleteShortlist}
        onOpenChange={setIsConfirmingDeleteShortlist}
        title="Delete Shortlist"
        description={
          details ? (
            <span>
              Are you sure you want to delete the shortlist{" "}
              <strong className="text-foreground">
                &ldquo;{details.name}&rdquo;
              </strong>
              ? This action will permanently remove the shortlist and all candidate
              mappings.
            </span>
          ) : null
        }
        confirmText="Delete Shortlist"
        variant="destructive"
        isLoading={isDeletingShortlist}
        onConfirm={handleConfirmDeleteShortlist}
      />

      {/* Confirmation Dialog to Remove Candidate */}
      <ConfirmDialog
        open={Boolean(candidateToRemove)}
        onOpenChange={(open) => {
          if (!open) setCandidateToRemove(null);
        }}
        title="Remove Candidate"
        description={
          candidateToRemove ? (
            <span>
              Are you sure you want to remove{" "}
              <strong className="text-foreground">
                {candidateToRemove.name}
              </strong>{" "}
              from this shortlist?
            </span>
          ) : null
        }
        confirmText="Remove Candidate"
        variant="destructive"
        isLoading={Boolean(removingId)}
        onConfirm={handleConfirmRemoveCandidate}
      />
    </section>
  );
}
