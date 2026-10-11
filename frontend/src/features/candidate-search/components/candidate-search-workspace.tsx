"use client";

import { LoaderCircle, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { WorkspaceNavigation } from "@/components/layout/workspace-navigation";
import { CandidateResults } from "@/features/candidate-search/components/candidate-results";
import { SearchFiltersTabs } from "@/features/candidate-search/components/search-filters-tabs";
import {
  CandidateSearchError,
  candidateSearchService,
} from "@/features/candidate-search/services/candidate-search.service";
import type {
  Candidate,
  SearchFilters,
  SearchPagination,
} from "@/features/candidate-search/schemas/search.schema";

function getActionableError(error: unknown): string {
  if (!(error instanceof CandidateSearchError)) {
    return "Something went wrong while searching. Please try again.";
  }
  if (error.statusCode === 401 || error.statusCode === 403) {
    return "Your session is no longer authorized. Sign in again to continue.";
  }
  if (error.statusCode === 402) {
    return error.message || "Your company has used its free search. Contact your administrator to upgrade.";
  }
  return error.message;
}

export function CandidateSearchWorkspace() {
  const [brief, setBrief] = useState("");
  const [filters, setFilters] = useState<SearchFilters | null>(null);
  const [total, setTotal] = useState(0);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<SearchPagination | null>(null);
  const [searchesRemaining, setSearchesRemaining] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [paginationError, setPaginationError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInFlight = useRef(false);
  const pageInFlight = useRef(false);
  const activeRequestId = useRef(0);
  const activeController = useRef<AbortController | null>(null);
  const currentSearchId = useRef<string | null>(null);
  const currentPagination = useRef<SearchPagination | null>(null);
  const nextPage = useRef(1);
  const retryPage = useRef<number | null>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const maxHeight = 144;
    const minHeight = 96;
    textarea.style.height = "auto";
    const desiredHeight = Math.min(maxHeight, Math.max(minHeight, textarea.scrollHeight));
    textarea.style.height = `${desiredHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [brief]);

  const requestPage = useCallback(async (page: number, requestId: number) => {
    const id = currentSearchId.current;
    const controller = activeController.current;
    if (!id || !controller || pageInFlight.current) return;

    pageInFlight.current = true;
    setIsLoadingPage(true);
    setPaginationError(null);
    retryPage.current = page;

    try {
      const response = await candidateSearchService.getPage(id, page, controller.signal);
      if (requestId !== activeRequestId.current) return;

      setCandidates((current) => {
        if (page === 1) return response.results;
        const seen = new Set(current.map((candidate) => candidate.id));
        return [...current, ...response.results.filter((candidate) => !seen.has(candidate.id))];
      });
      setTotal(response.total);
      setPagination(response.pagination);
      currentPagination.current = response.pagination;
      nextPage.current = page + 1;
      retryPage.current = null;
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (requestId === activeRequestId.current) {
        setPaginationError(getActionableError(error));
      }
    } finally {
      pageInFlight.current = false;
      if (requestId === activeRequestId.current) setIsLoadingPage(false);
    }
  }, []);

  async function submitSearch(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const query = brief.trim();
    if (!query || searchInFlight.current) return;

    searchInFlight.current = true;
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    const requestId = activeRequestId.current + 1;
    activeRequestId.current = requestId;
    currentSearchId.current = null;
    currentPagination.current = null;
    nextPage.current = 1;
    retryPage.current = null;

    setIsSearching(true);
    setIsLoadingPage(false);
    setSearchError(null);
    setPaginationError(null);
    setFilters(null);
    setTotal(0);
    setCandidates([]);
    setSearchId(null);
    setPagination(null);
    setSearchesRemaining(null);

    try {
      const response = await candidateSearchService.submit(query, controller.signal);
      if (requestId !== activeRequestId.current) return;

      currentSearchId.current = response.search_id;
      currentPagination.current = response.pagination;
      setSearchId(response.search_id);
      setFilters(response.filters);
      setTotal(response.total);
      setPagination(response.pagination);
      setSearchesRemaining(response.searches_remaining);
      setCandidates(response.items);
      nextPage.current = response.pagination.page + 1;
      retryPage.current = null;
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (requestId === activeRequestId.current) setSearchError(getActionableError(error));
    } finally {
      if (requestId === activeRequestId.current) {
        searchInFlight.current = false;
        setIsSearching(false);
      }
    }
  }

  const loadNextPage = useCallback(() => {
    if (pageInFlight.current || isSearching || !currentPagination.current?.hasNextPage) return;
    void requestPage(nextPage.current, activeRequestId.current);
  }, [isSearching, requestPage]);

  const retryFailedPage = useCallback(() => {
    const page = retryPage.current;
    if (page === null || pageInFlight.current) return;
    void requestPage(page, activeRequestId.current);
  }, [requestPage]);

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      if (brief.trim() && !isSearching) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  }

  return (
    <section className="space-y-6">
      <WorkspaceNavigation active="candidate-search" />
      <header className="space-y-1">
        <p className="text-sm font-medium text-primary">Candidate discovery</p>
        <h1 className="text-2xl font-semibold tracking-tight">Find your next great hire</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Describe the person you need. The search service extracts supported criteria and ranks matching profiles.
        </p>
      </header>

      <form onSubmit={(event) => void submitSearch(event)} className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <label htmlFor="candidate-search-brief" className="mb-2 block text-sm font-medium">
          What kind of candidate are you looking for?
        </label>
        <textarea
          ref={textareaRef}
          id="candidate-search-brief"
          name="brief"
          rows={3}
          value={brief}
          onChange={(event) => setBrief(event.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="For example: Senior backend engineers with Python experience in New York…"
          aria-describedby="search-brief-hint"
          aria-invalid={Boolean(searchError)}
          disabled={isSearching || isLoadingPage}
          className="max-h-36 min-h-24 w-full resize-y overflow-y-auto rounded-xl border border-input bg-background px-3.5 py-3 text-sm leading-6 outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-70"
        />
        <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p id="search-brief-hint" className="text-xs leading-5 text-muted-foreground">
            Enter to search · Shift + Enter for a new line. Supported criteria include skills, roles, seniority, experience, company type, location, and availability.
          </p>
          <Button type="submit" disabled={!brief.trim() || isSearching || isLoadingPage} className="min-h-10 gap-2 self-start sm:self-auto">
            {isSearching ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
            {isSearching ? "Searching…" : "Search candidates"}
          </Button>
        </div>
      </form>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isSearching ? "Searching for candidates." : searchId ? `Search complete. ${total} candidates found.` : ""}
      </div>

      {searchError && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">{searchError}</p>
          {(searchError.includes("session") || searchError.includes("authorized")) && (
            <Link href="/login" className="text-sm font-medium text-primary underline underline-offset-4">Sign in again</Link>
          )}
        </div>
      )}

      {isSearching && !filters && (
        <div role="status" className="flex items-center gap-3 rounded-xl border bg-card p-5 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Understanding your brief and searching candidate profiles…
        </div>
      )}

      {filters && searchId && (
        <div className="space-y-5">
          {searchesRemaining !== null && (
            <p className="text-sm text-muted-foreground" role="status">
              {searchesRemaining === 0 ? "Your company’s free search has been used." : `${searchesRemaining} free search remaining.`}
            </p>
          )}
          <SearchFiltersTabs filters={filters} />
          <CandidateResults
            candidates={candidates}
            total={total}
            isLoadingMore={isLoadingPage}
            hasMore={Boolean(pagination?.hasNextPage)}
            paginationError={paginationError}
            onLoadMore={loadNextPage}
            onRetryPage={retryFailedPage}
          />
          {candidates.length > 0 && (
            <p className="text-xs leading-5 text-muted-foreground">
              Profiles show the fields available from candidate search. Full work history, education, certifications, and résumé links are not exposed by the current candidate API.
            </p>
          )}
        </div>
      )}

      {!filters && !isSearching && !searchError && (
        <div className="rounded-xl border border-dashed bg-card/50 px-5 py-8 text-center sm:py-10">
          <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Search className="size-5" aria-hidden="true" />
          </div>
          <h2 className="mt-3 font-semibold">Start with a brief</h2>
          <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-muted-foreground">
            Describe skills, experience, role, company type, or location. You can review the criteria the search service understands before exploring results.
          </p>
        </div>
      )}
    </section>
  );
}
