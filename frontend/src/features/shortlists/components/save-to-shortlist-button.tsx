"use client";

import * as React from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";

import {
  SearchableDropdown,
  type DropdownOption,
} from "@/components/ui/searchable-dropdown";
import {
  shortlistService,
  ShortlistServiceError,
} from "@/features/shortlists/services/shortlist.service";
import type { ShortlistSummary } from "@/features/shortlists/schemas/shortlist.schema";
import { capitalizeWords } from "@/features/shortlists/utils";
import { toast } from "@/lib/toast";

interface SaveToShortlistButtonProps {
  candidateId: string;
  candidateName?: string;
  className?: string;
}

export function SaveToShortlistButton({
  candidateId,
  candidateName = "Candidate",
  className,
}: SaveToShortlistButtonProps) {
  const [shortlists, setShortlists] = React.useState<ShortlistSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [operatingId, setOperatingId] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [hasAdded, setHasAdded] = React.useState(false);

  const fetchShortlists = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      const list = await shortlistService.getShortlists(candidateId);
      setShortlists(list);
      setHasAdded(list.some((s) => Boolean(s.hasCandidate)));
    } catch {
      toast.error("Failed to load shortlists.");
    } finally {
      setIsLoading(false);
    }
  };

  const options: DropdownOption[] = React.useMemo(() => {
    return shortlists.map((s) => ({
      id: s.id,
      label: s.name,
      candidateCount: s.candidateCount,
      isSelected: Boolean(s.hasCandidate),
    }));
  }, [shortlists]);

  const handleSelect = async (option: DropdownOption) => {
    const target = shortlists.find((s) => s.id === option.id);
    if (target?.hasCandidate) {
      await handleRemove(option);
      return;
    }

    try {
      setOperatingId(option.id);
      await shortlistService.addCandidate(option.id, candidateId);
      setShortlists((prev) => {
        const next = prev.map((s) =>
          s.id === option.id
            ? { ...s, candidateCount: s.candidateCount + 1, hasCandidate: true }
            : s,
        );
        setHasAdded(next.some((s) => Boolean(s.hasCandidate)));
        return next;
      });
      toast.success(`Added ${candidateName} to "${option.label}".`);
    } catch (err: unknown) {
      if (err instanceof ShortlistServiceError) {
        if (err.code === "DUPLICATE_CANDIDATE" || err.statusCode === 409) {
          toast.info(`${candidateName} is already in "${option.label}".`);
          return;
        }
        toast.error(err.message);
      } else {
        toast.error("Failed to add candidate to shortlist.");
      }
    } finally {
      setOperatingId(null);
    }
  };

  const handleRemove = async (option: DropdownOption) => {
    try {
      setOperatingId(option.id);
      await shortlistService.removeCandidate(option.id, candidateId);
      setShortlists((prev) => {
        const next = prev.map((s) =>
          s.id === option.id
            ? { ...s, candidateCount: Math.max(0, s.candidateCount - 1), hasCandidate: false }
            : s,
        );
        setHasAdded(next.some((s) => Boolean(s.hasCandidate)));
        return next;
      });
      toast.success(`Removed ${candidateName} from "${option.label}".`);
    } catch (err: unknown) {
      if (err instanceof ShortlistServiceError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to remove candidate from shortlist.");
      }
    } finally {
      setOperatingId(null);
    }
  };

  const handleCreate = async (newShortlistName: string) => {
    try {
      setIsCreating(true);
      const formatted = capitalizeWords(newShortlistName);
      const created = await shortlistService.createShortlist(formatted);

      setShortlists((prev) => {
        const next = [
          {
            id: created.id,
            name: created.name,
            candidateCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            hasCandidate: false,
          },
          ...prev,
        ];
        return next.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
        );
      });
      toast.success(`Shortlist "${created.name}" created.`);
    } catch (err: unknown) {
      if (err instanceof ShortlistServiceError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to create shortlist.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const isBusy = Boolean(operatingId) || isCreating;

  return (
    <div className={className} onClick={(e) => e.stopPropagation()}>
      <SearchableDropdown
        variant="searchable-add"
        options={options}
        isLoading={isLoading}
        operatingId={operatingId}
        isCreating={isCreating}
        isBusy={isBusy}
        searchPlaceholder="Find or create shortlist..."
        emptyText="No existing shortlists. Type above to create one."
        headerTitle="Shortlists"
        align="end"
        onSelect={handleSelect}
        onRemove={handleRemove}
        onCreate={handleCreate}
        trigger={
          <button
            type="button"
            onClick={fetchShortlists}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground shadow-2xs transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            title="Save or remove candidate from shortlists"
          >
            {hasAdded ? (
              <BookmarkCheck className="size-3.5 text-primary" />
            ) : (
              <Bookmark className="size-3.5 text-muted-foreground" />
            )}
            <span>{hasAdded ? "Shortlisted" : "Shortlist"}</span>
          </button>
        }
      />
    </div>
  );
}
