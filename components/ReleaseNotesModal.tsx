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
import { RELEASES, CURRENT_APP_VERSION } from "@/lib/releases";

// Re-export so existing imports (e.g. dashboard/layout.tsx) continue to work
export { CURRENT_APP_VERSION };

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

// Hotfixes (x.y.Z where Z > 0) don't warrant interrupting the user
function isMinorOrMajor(version: string): boolean {
  return version.endsWith(".0");
}

export function ReleaseNotesModal() {
  const lastSeen = useSyncExternalStore(subscribeToStorage, getLastSeen, getServerLastSeen);
  const [dismissed, setDismissed] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const isOpen =
    !dismissed &&
    lastSeen !== CURRENT_APP_VERSION &&
    isMinorOrMajor(CURRENT_APP_VERSION);

  const handleClose = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, CURRENT_APP_VERSION);
    }
    setDismissed(true);
  };

  const latestRelease = RELEASES[0]!;

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

        <div className="py-4 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="font-semibold text-base">
              {latestRelease.title ?? latestRelease.version}
            </span>
            <span className="text-xs text-muted-foreground">{latestRelease.date}</span>
          </div>
          <ul className="space-y-3">
            {latestRelease.changes.map((change, i) => (
              <li key={i} className="flex gap-2 items-start text-sm">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span className="leading-relaxed">{change.text}</span>
              </li>
            ))}
          </ul>
        </div>

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
          <Button onClick={handleClose} className="w-full sm:w-auto cursor-pointer">
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ReleaseNotesModal;
