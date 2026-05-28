"use client";

import { useState, useSyncExternalStore } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

// IMPORTANT: Bump CURRENT_APP_VERSION and append a new entry to RELEASE_NOTES
// every time a new feature or hotfix ships. Other agents MUST update both
// constants below so users see the "What's New" modal once per release.
const CURRENT_APP_VERSION = "v1.4.1";

const RELEASE_NOTES: string[] = [
  "🌱 Added automated Database Seeding to quickly populate Dev and Staging environments with rich test data.",
  "🔥 Added Community Insights! See which companies are trending and highly competitive across the platform.",
  "✨ Added Weekly Auto-Resetting Quotas for AI Tokens and Smart Scraper to keep your usage healthy",
  "🐛 Fixed UI bug where Firecrawl scraper wasn't showing up on the real Dashboard",
  "✨ Added Tabbed UI for Job parsing and integrated Firecrawl V1 API for precise web scraping",
  "🐛 Fixed AI Scraper accuracy by migrating to Firecrawl and patched Source detection",
  "✨ Added Smart URL Scraper and Job Source tracking",
  "✨ Added What's New release notes modal",
  "✨ Added Google OAuth integration",
  "📱 Refactored dashboard, dialogs, and forms for mobile (iPhone 14) responsiveness",
  "♻️ Refactored job form with react-hook-form, salary currency/period, and smart applied-at logic",
  "🤖 Added AI iterative refinement for cover letters, interview questions, and email drafts",
];

const STORAGE_KEY = "lastSeenVersion";

function subscribeToStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getLastSeen(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

function getServerLastSeen(): string | null {
  return null;
}

export function ReleaseNotesModal() {
  const lastSeen = useSyncExternalStore(subscribeToStorage, getLastSeen, getServerLastSeen);
  const [dismissed, setDismissed] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const isOpen = !dismissed && lastSeen !== CURRENT_APP_VERSION;

  const handleClose = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, CURRENT_APP_VERSION);
    }
    setDismissed(true);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>What&apos;s new in {CURRENT_APP_VERSION}</DialogTitle>
          <DialogDescription>
            A quick look at what&apos;s shipped since your last visit.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 py-2 text-sm text-foreground">
          {RELEASE_NOTES.map((note) => (
            <li key={note} className="leading-relaxed">
              {note}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 pt-2">
          <Checkbox
            id="release-notes-dont-show"
            checked={dontShowAgain}
            onCheckedChange={(checked) => setDontShowAgain(checked === true)}
          />
          <label
            htmlFor="release-notes-dont-show"
            className="text-sm text-muted-foreground cursor-pointer select-none"
          >
            Don&apos;t show this again
          </label>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full sm:w-auto">
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ReleaseNotesModal;
