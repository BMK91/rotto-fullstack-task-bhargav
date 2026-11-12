"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Calendar,
  FolderPlus,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CreateShortlistDialog } from "@/features/shortlists/components/create-shortlist-dialog";
import {
  shortlistService,
  ShortlistServiceError,
} from "@/features/shortlists/services/shortlist.service";
import type { ShortlistSummary } from "@/features/shortlists/schemas/shortlist.schema";
import { toast } from "@/lib/toast";

export default function ShortlistsPage() {
  const [shortlists, setShortlists] = React.useState<ShortlistSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [shortlistToDelete, setShortlistToDelete] = React.useState<ShortlistSummary | null>(null);

  const fetchShortlists = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await shortlistService.getShortlists();
      setShortlists(data);
    } catch (err: unknown) {
      if (err instanceof ShortlistServiceError) {
        setError(err.message);
      } else {
        setError("Failed to load shortlists. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let ignore = false;
    shortlistService.getShortlists().then(
      (data) => {
        if (!ignore) {
          setShortlists(data);
          setIsLoading(false);
        }
      },
      (err: unknown) => {
        if (!ignore) {
          setError(
            err instanceof ShortlistServiceError
              ? err.message
              : "Failed to load shortlists. Please try again.",
          );
          setIsLoading(false);
        }
      },
    );

    return () => {
      ignore = true;
    };
  }, []);

  const handleConfirmDelete = async () => {
    if (!shortlistToDelete) return;

    try {
      setDeletingId(shortlistToDelete.id);
      await shortlistService.deleteShortlist(shortlistToDelete.id);
      setShortlists((prev) => prev.filter((s) => s.id !== shortlistToDelete.id));
      toast.success(`Shortlist "${shortlistToDelete.name}" deleted successfully.`);
      setShortlistToDelete(null);
    } catch (err: unknown) {
      if (err instanceof ShortlistServiceError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete shortlist.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filteredShortlists = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return shortlists;
    return shortlists.filter((s) => s.name.toLowerCase().includes(q));
  }, [shortlists, searchQuery]);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Shortlists
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize, manage, and review candidate shortlists for your company.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="size-4" />
          <span>New Shortlist</span>
        </Button>
      </div>

      {/* Search / Filter Bar */}
      {shortlists.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shortlists by name..."
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      )}

      {/* Content State */}
      {isLoading ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border bg-card p-12 text-center">
          <LoaderCircle className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading shortlists...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchShortlists}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      ) : shortlists.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bookmark className="size-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-foreground">
            No shortlists created yet
          </h2>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            Shortlists help you group candidates for specific job openings or hiring pipelines.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5"
            >
              <FolderPlus className="size-4" />
              <span>Create your first shortlist</span>
            </Button>
            <Link
              href="/candidate-search"
              className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <Search className="size-4" />
              <span>Search Candidates</span>
            </Link>
          </div>
        </div>
      ) : filteredShortlists.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No shortlists match &quot;{searchQuery}&quot;.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="mt-2 text-xs cursor-pointer"
          >
            Clear search
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredShortlists.map((shortlist) => {
            const isDeleting = deletingId === shortlist.id;
            const updatedDate = new Date(shortlist.updatedAt).toLocaleDateString(
              undefined,
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              },
            );

            return (
              <div
                key={shortlist.id}
                className="group relative flex flex-col justify-between rounded-xl border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted/20"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      <Users className="size-3" />
                      <span>
                        {shortlist.candidateCount}{" "}
                        {shortlist.candidateCount === 1
                          ? "candidate"
                          : "candidates"}
                      </span>
                    </span>

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => setShortlistToDelete(shortlist)}
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                      title="Delete shortlist"
                    >
                      {isDeleting ? (
                        <LoaderCircle className="size-4 animate-spin text-destructive" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                      <span className="sr-only">Delete {shortlist.name}</span>
                    </button>
                  </div>

                  <h2 className="mt-3 font-semibold text-foreground group-hover:text-primary transition-colors">
                    {shortlist.name}
                  </h2>

                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span>Updated {updatedDate}</span>
                  </div>
                </div>

                <div className="mt-6 border-t pt-4">
                  <Link
                    href={`/shortlists/${shortlist.id}`}
                    className="inline-flex w-full items-center justify-between rounded-lg bg-secondary/80 px-3 py-2 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                  >
                    <span>View Candidates</span>
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog to Delete Shortlist */}
      <ConfirmDialog
        open={Boolean(shortlistToDelete)}
        onOpenChange={(open) => {
          if (!open) setShortlistToDelete(null);
        }}
        title="Delete Shortlist"
        description={
          shortlistToDelete ? (
            <span>
              Are you sure you want to delete the shortlist{" "}
              <strong className="text-foreground">
                &ldquo;{shortlistToDelete.name}&rdquo;
              </strong>
              ? All candidate associations in this shortlist will be permanently
              removed.
            </span>
          ) : null
        }
        confirmText="Delete Shortlist"
        variant="destructive"
        isLoading={Boolean(deletingId)}
        onConfirm={handleConfirmDelete}
      />

      {/* Modal Dialog to Create Shortlist */}
      <CreateShortlistDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={(created) => {
          setShortlists((prev) => [
            {
              id: created.id,
              name: created.name,
              candidateCount: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...prev,
          ]);
        }}
      />
    </section>
  );
}
