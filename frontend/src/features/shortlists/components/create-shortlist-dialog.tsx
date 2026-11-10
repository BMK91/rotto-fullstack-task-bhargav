"use client";

import * as React from "react";
import { LoaderCircle, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { shortlistService, ShortlistServiceError } from "@/features/shortlists/services/shortlist.service";
import { capitalizeWords } from "@/features/shortlists/utils";
import { toast } from "@/lib/toast";

interface CreateShortlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (shortlist: { id: string; name: string }) => void;
}

export function CreateShortlistDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateShortlistDialogProps) {
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleClose = () => {
    setName("");
    setError(null);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError("Please enter a shortlist name.");
      return;
    }

    if (trimmed.length > 100) {
      setError("Name must not exceed 100 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const formatted = capitalizeWords(trimmed);
      const created = await shortlistService.createShortlist(formatted);
      toast.success(`Shortlist "${created.name}" created successfully.`);
      setName("");
      setError(null);
      onOpenChange(false);
      onSuccess?.(created);
    } catch (err: unknown) {
      if (err instanceof ShortlistServiceError) {
        setError(err.message);
      } else {
        setError("Failed to create shortlist. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogTitle>Create New Shortlist</DialogTitle>
        <DialogDescription className="mt-1.5">
          Give your shortlist a descriptive name to organize matching candidates.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="shortlist-name-input"
              className="block text-sm font-medium text-foreground"
            >
              Shortlist Name
            </label>
            <input
              id="shortlist-name-input"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Senior Backend Engineers, React Specialists"
              maxLength={100}
              disabled={isSubmitting}
              className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            />
            <div className="mt-1 flex items-center justify-between text-xs">
              {error ? (
                <span className="text-destructive font-medium">{error}</span>
              ) : (
                <span className="text-muted-foreground">Up to 100 characters</span>
              )}
              <span className="text-muted-foreground">{name.trim().length}/100</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 size-4" />
                  Create Shortlist
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
