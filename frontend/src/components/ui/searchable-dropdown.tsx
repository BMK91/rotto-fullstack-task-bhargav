"use client";

import * as React from "react";
import { ChevronDown, LoaderCircle, Plus, Search, Trash2 } from "lucide-react";
import { cn } from "cn";

export interface DropdownOption {
  id: string;
  label: string;
  candidateCount?: number;
  description?: string;
  badge?: string | number;
  disabled?: boolean;
  isSelected?: boolean;
}

export interface SearchableDropdownProps {
  variant?: "simple" | "searchable" | "searchable-add";
  trigger?: React.ReactNode;
  triggerLabel?: string;
  options: DropdownOption[];
  selectedId?: string;
  operatingId?: string | null;
  isCreating?: boolean;
  onSelect?: (option: DropdownOption) => void | Promise<void>;
  onRemove?: (option: DropdownOption) => void | Promise<void>;
  onCreate?: (name: string) => void | Promise<void>;
  searchPlaceholder?: string;
  emptyText?: string;
  headerTitle?: string;
  isLoading?: boolean;
  isBusy?: boolean;
  align?: "start" | "end" | "center";
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
}

export function SearchableDropdown({
  variant = "searchable",
  trigger,
  triggerLabel = "Select option",
  options,
  selectedId,
  operatingId,
  isCreating = false,
  onSelect,
  onRemove,
  onCreate,
  searchPlaceholder = "Search...",
  emptyText = "No options found",
  headerTitle,
  isLoading = false,
  isBusy = false,
  align = "end",
  className,
  contentClassName,
  disabled = false,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(trimmed),
    );
  }, [options, searchQuery]);

  const canCreate =
    variant === "searchable-add" &&
    Boolean(onCreate) &&
    searchQuery.trim().length > 0 &&
    !options.some(
      (opt) => opt.label.toLowerCase() === searchQuery.trim().toLowerCase(),
    );

  // Auto focus search input when opening
  React.useEffect(() => {
    if (isOpen && variant !== "simple") {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, variant]);

  // Handle outside click
  React.useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectOption = async (option: DropdownOption) => {
    if (option.disabled || isSubmitting || isBusy) return;
    try {
      setIsSubmitting(true);
      await onSelect?.(option);
      // Keep dropdown open on select/add
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveOption = async (option: DropdownOption) => {
    if (option.disabled || isSubmitting || isBusy) return;
    try {
      setIsSubmitting(true);
      await onRemove?.(option);
      // Keep dropdown open on remove/delete
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateOption = async () => {
    const trimmed = searchQuery.trim();
    if (!trimmed || isSubmitting || isBusy || !onCreate) return;
    try {
      setIsSubmitting(true);
      await onCreate(trimmed);
      setSearchQuery("");
      setHighlightedIndex(-1);
      // Keep dropdown open on create
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = filteredOptions.length + (canCreate ? 1 : 0);
    if (totalItems === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (canCreate && (highlightedIndex === 0 || highlightedIndex === -1)) {
        void handleCreateOption();
      } else if (canCreate && highlightedIndex > 0 && filteredOptions[highlightedIndex - 1]) {
        void handleSelectOption(filteredOptions[highlightedIndex - 1]);
      } else if (!canCreate && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
        void handleSelectOption(filteredOptions[highlightedIndex]);
      }
    }
  };

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setSearchQuery("");
        setHighlightedIndex(-1);
      }
      return next;
    });
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block text-left", className)}
    >
      {/* Trigger */}
      <div onClick={toggleOpen}>
        {trigger ? (
          trigger
        ) : (
          <button
            type="button"
            disabled={disabled}
            className="inline-flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            <span>{triggerLabel}</span>
            <ChevronDown className="size-4 opacity-50" />
          </button>
        )}
      </div>

      {/* Popover Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1 min-w-72 max-w-md w-80 sm:w-96 rounded-xl border bg-card p-1.5 text-card-foreground shadow-lg ring-1 ring-black/5 dark:ring-white/10 animate-in fade-in-0 zoom-in-95",
            align === "end" && "right-0 origin-top-right",
            align === "start" && "left-0 origin-top-left",
            align === "center" && "left-1/2 -translate-x-1/2 origin-top",
            contentClassName,
          )}
        >
          {/* Disabling overlay over whole DD view during operation */}
          {(isBusy || isSubmitting) && (
            <div
              className="absolute inset-0 z-20 rounded-xl bg-background/50 backdrop-blur-[0.5px] cursor-wait"
              aria-hidden="true"
            />
          )}

          {headerTitle && (
            <div className="border-b px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {headerTitle}
            </div>
          )}

          {/* Search Input for searchable & searchable-add */}
          {variant !== "simple" && (
            <div className="p-1.5">
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* On-the-fly Create Option - FIXED AT FIRST PLACE ONLY */}
          {canCreate && (
            <div className={cn("px-1.5 pb-1.5 border-b", (isCreating || isSubmitting) && "relative z-30")}>
              <button
                type="button"
                role="option"
                aria-selected={highlightedIndex === 0}
                disabled={isSubmitting || isBusy}
                onClick={() => void handleCreateOption()}
                onMouseEnter={() => setHighlightedIndex(0)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 px-3 py-2 text-left font-medium transition-colors cursor-pointer",
                  highlightedIndex === 0 && "bg-primary/20 border-primary/45",
                  (isSubmitting || isBusy) && "cursor-wait opacity-80",
                )}
              >
                {isCreating || isSubmitting ? (
                  <LoaderCircle className="size-4 animate-spin shrink-0 text-primary" />
                ) : (
                  <Plus className="size-4 shrink-0 text-primary" />
                )}
                <span className="truncate text-xs sm:text-sm font-semibold">
                  Create &quot;{searchQuery.trim()}&quot;
                </span>
              </button>
            </div>
          )}

          {/* Options List */}
          <div
            className={cn(
              "max-h-64 overflow-y-auto p-1 text-sm space-y-1.5 pr-1.5 [scrollbar-width:thin] [scrollbar-color:oklch(0.6_0.02_260)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-muted/30 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/60",
              (isBusy || isSubmitting) && "cursor-wait",
            )}
            role="listbox"
            onMouseLeave={() => setHighlightedIndex(-1)}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <LoaderCircle className="mr-2 size-4 animate-spin" />
                Loading options...
              </div>
            ) : filteredOptions.length === 0 && !canCreate ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              <>
                {filteredOptions.map((option, index) => {
                  const isSelected = option.isSelected ?? selectedId === option.id;
                  const itemHighlightIndex = canCreate ? index + 1 : index;
                  const isHighlighted = highlightedIndex === itemHighlightIndex;
                  const isOperatingThis = operatingId === option.id;

                  const candidateCount = option.candidateCount;
                  const chipText =
                    candidateCount !== undefined
                      ? `${candidateCount} ${candidateCount === 1 ? "candidate" : "candidates"}`
                      : option.badge !== undefined
                        ? String(option.badge)
                        : null;

                  return (
                    <div
                      key={option.id}
                      role="option"
                      tabIndex={0}
                      aria-selected={isSelected}
                      onClick={() => {
                        if (option.disabled || isSubmitting || isBusy) return;
                        if (isSelected && onRemove) {
                          void handleRemoveOption(option);
                        } else {
                          void handleSelectOption(option);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (option.disabled || isSubmitting || isBusy) return;
                          if (isSelected && onRemove) {
                            void handleRemoveOption(option);
                          } else {
                            void handleSelectOption(option);
                          }
                        }
                      }}
                      onMouseEnter={() => setHighlightedIndex(itemHighlightIndex)}
                      className={cn(
                        "group relative flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors cursor-pointer select-none",
                        isOperatingThis && "relative z-30",
                        isSelected
                          ? cn(
                              "bg-emerald-50 text-emerald-950 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800/50",
                              isHighlighted
                                ? "bg-emerald-100/90 border-emerald-300 dark:bg-emerald-900/60 dark:border-emerald-700 shadow-2xs"
                                : "hover:bg-emerald-100/80 hover:border-emerald-300 dark:hover:bg-emerald-900/50 hover:shadow-2xs",
                            )
                          : cn(
                              "text-foreground border border-transparent",
                              isHighlighted
                                ? "bg-muted text-foreground border-border/80 shadow-2xs"
                                : "hover:bg-muted hover:text-foreground hover:border-border/60 hover:shadow-2xs",
                            ),
                        option.disabled && "cursor-not-allowed opacity-50",
                        (isBusy || isSubmitting) && "cursor-wait",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="truncate font-medium text-xs sm:text-sm block">
                          {option.label}
                        </span>
                        {option.description && (
                          <span className="truncate text-xs text-muted-foreground block">
                            {option.description}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {chipText && (
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors select-none",
                              isSelected
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-700/60"
                                : "bg-secondary text-secondary-foreground border border-border/50",
                            )}
                          >
                            {chipText}
                          </span>
                        )}

                        {isOperatingThis ? (
                          <span className="p-1 flex items-center justify-center">
                            <LoaderCircle className="size-4 animate-spin text-primary" />
                          </span>
                        ) : isSelected ? (
                          <button
                            type="button"
                            title={`Remove from ${option.label}`}
                            disabled={isSubmitting || isBusy}
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleRemoveOption(option);
                            }}
                            className="rounded p-1 text-emerald-800 hover:text-destructive hover:bg-destructive/10 dark:text-emerald-300 dark:hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">Remove from {option.label}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            title={`Add to ${option.label}`}
                            disabled={isSubmitting || isBusy}
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleSelectOption(option);
                            }}
                            className="rounded p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Plus className="size-4" />
                            <span className="sr-only">Add to {option.label}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
