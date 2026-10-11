"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";

import type { SearchFilters } from "@/features/candidate-search/schemas/search.schema";

interface FilterGroup {
  id: string;
  label: string;
  keys: string[];
}

const knownGroups: FilterGroup[] = [
  { id: "skills-roles", label: "Skills & roles", keys: ["skills", "roles"] },
  {
    id: "experience",
    label: "Experience",
    keys: ["seniority", "minYearsExperience", "maxYearsExperience"],
  },
  { id: "company", label: "Company", keys: ["companyType"] },
  { id: "location", label: "Location", keys: ["location"] },
  { id: "availability", label: "Availability", keys: ["openToWork"] },
];

const knownKeys = new Set(knownGroups.flatMap((group) => group.keys));

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.values(value).some(hasValue);
  return true;
}

function formatLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^./, (character) => character.toUpperCase());
}

function formatValue(key: string, value: unknown): string[] {
  if (key === "openToWork" && typeof value === "boolean") {
    return [value ? "Open to work" : "Not marked open to work"];
  }
  if (key === "minYearsExperience" && typeof value === "number") {
    return [`${value}+ years`];
  }
  if (key === "maxYearsExperience" && typeof value === "number") {
    return [`Up to ${value} years`];
  }
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "object" && value !== null) {
    return Object.entries(value)
      .filter(([, item]) => hasValue(item))
      .map(([childKey, item]) => `${formatLabel(childKey)}: ${String(item)}`);
  }
  return hasValue(value) ? [String(value)] : [];
}

interface SearchFiltersTabsProps {
  filters: SearchFilters;
}

export function SearchFiltersTabs({ filters }: SearchFiltersTabsProps) {
  const baseId = useId().replaceAll(":", "");
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const groups = [...knownGroups];
  const additionalKeys = Object.keys(filters).filter(
    (key) => !knownKeys.has(key) && hasValue(filters[key]),
  );
  if (additionalKeys.length > 0) {
    groups.push({ id: "additional", label: "Additional", keys: additionalKeys });
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLElement>) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (activeIndex + 1) % groups.length;
    if (event.key === "ArrowLeft") nextIndex = (activeIndex - 1 + groups.length) % groups.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = groups.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    setActiveIndex(nextIndex);
    tabRefs.current[nextIndex]?.focus();
  }

  const activeGroup = groups[activeIndex] ?? groups[0];
  const activeValues = activeGroup.keys.flatMap((key) => {
    const value = filters[key];
    return formatValue(key, value).map((text) => ({ key, text }));
  });

  return (
    <section aria-labelledby={`${baseId}-heading`} className="rounded-xl border bg-card">
      <div className="border-b px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id={`${baseId}-heading`} className="font-semibold">Extracted criteria</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Read-only filters understood from your brief. Edit the brief to change them.
            </p>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            From your brief
          </span>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Extracted criteria categories"
        className="flex gap-1 overflow-x-auto border-b px-3"
        onKeyDown={(event) => {
          if (event.target instanceof HTMLButtonElement) handleTabKeyDown(event);
        }}
      >
        {groups.map((group, index) => {
          const selected = index === activeIndex;
          const tabId = `${baseId}-tab-${group.id}`;
          return (
            <button
              key={group.id}
              ref={(element) => { tabRefs.current[index] = element; }}
              type="button"
              role="tab"
              id={tabId}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveIndex(index)}
              className={`min-h-11 shrink-0 border-b-2 px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                selected
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {group.label}
            </button>
          );
        })}
      </div>

      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${activeGroup.id}`}
        tabIndex={0}
        className="min-h-20 p-4 sm:p-5"
      >
        {activeValues.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {activeValues.map(({ key, text }, index) => (
              <li
                key={`${key}-${index}`}
                className="max-w-full rounded-lg border bg-muted/50 px-3 py-1.5 text-sm"
              >
                <span className="font-medium">{formatLabel(key)}:</span>{" "}
                <span className="break-words">{text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No {activeGroup.label.toLowerCase()} criteria were extracted.
          </p>
        )}
      </div>
    </section>
  );
}
