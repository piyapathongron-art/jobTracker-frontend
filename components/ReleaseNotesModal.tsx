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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

// IMPORTANT: Prepend a new entry to RELEASES every time a feature or hotfix
// ships. CURRENT_APP_VERSION is derived from RELEASES[0].
type ChangeType = "feat" | "fix" | "hotfix" | "refactor";

interface Release {
  version: string;
  date: string;
  title?: string;
  changes: { type: ChangeType; text: string }[];
}

const RELEASES: Release[] = [
  {
    version: "v1.12.1",
    date: "2026-05-31",
    title: "Visual Brand Identity & Mascot Update",
    changes: [
      { type: "hotfix", text: "Replaced generic BriefcaseBusiness placeholder icons with the cute Jobjab red panda mascot avatar in the LINE Bot chat mockup and header for a premium, custom-branded experience." }
    ],
  },
  {
    version: "v1.12.0",
    date: "2026-05-31",
    title: "Premium Landing Page & Jobjab LINE Bot",
    changes: [
      { type: "feat", text: "Redesigned landing page with a modern Social Proof-focused aesthetic using the brand typeface." },
      { type: "feat", text: "Created an interactive CSS LINE Bot preview showcasing our smart 'Jobjab' companion with step-by-step visuals." },
      { type: "feat", text: "Fully localized all landing page copy into Thai and English dictionaries (zero hardcoded strings)." }
    ],
  },
  {
    version: "v1.11.0",
    date: "2026-05-31",
    title: "Edit Mode UX & Layout Enhancements",
    changes: [
      { type: "fix", text: "Relocated Save and Cancel buttons to the sheet header during edit mode to prevent scrolling to the bottom." },
      { type: "fix", text: "Hides the default close (X) button and blocks background interaction / backdrop clicks during editing to prevent accidental data loss." },
      { type: "refactor", text: "Reorganized and aligned job form field order to match overview viewing layout." },
    ],
  },
  {
    version: "v1.10.0",
    date: "2026-05-31",
    title: "HR Contact Tracking",
    changes: [
      { type: "feat", text: "New 'HR Contact' field on all job applications — store email, LINE ID, phone, or Facebook of the recruiter." },
      { type: "feat", text: "AI JD Parser (URL, image, LINE Bot) now automatically extracts HR contact info from job postings." },
      { type: "feat", text: "LINE Bot (Jobjab) now warns you when no HR contact info was found, so you remember to fill it in." },
    ],
  },
  {
    version: "v1.9.0",
    date: "2026-05-30",
    changes: [
      {
        type: "feat",
        text: "GDPR/PDPA compliance: Export all your data as a JSON file from the Profile page (Danger Zone).",
      },
      {
        type: "feat",
        text: "Hard Delete Account: Permanently erase your account and all data via a confirmation modal that requires typing your first name.",
      },
      {
        type: "feat",
        text: "API Rate Limiting: Added express-rate-limit protection — 100 req/15 min globally, 10 req/15 min for auth, 30 req/15 min for AI endpoints.",
      },
      {
        type: "feat",
        text: "Prompt Injection Defense: All 9 AI system prompts now contain explicit security instructions to reject hidden user commands.",
      },
    ],
  },
  {
    version: "v1.8.0",
    date: "2026-05-29",
    changes: [
      {
        type: "feat",
        text: "Meet น้องจ๊อบแจ๊บ (Jobjab)! The LINE bot now has a cute Thai persona and can save jobs straight from chat — just describe a role and it logs it for you.",
      },
      {
        type: "feat",
        text: "Smarter screenshot/URL parser: the bot now detects when an image or link isn't a job posting and politely tells you instead of saving junk.",
      },
    ],
  },
  {
    version: "v1.7.0",
    date: "2026-05-29",
    changes: [
      {
        type: "feat",
        text: "Upgraded the LINE bot: send a screenshot of any JD and AI will save it as a job, and the career advisor now sees your active applications for personalized advice.",
      },
      {
        type: "feat",
        text: "LINE bot now enforces weekly AI token and scraper quotas, matching the limits on the web app.",
      },
    ],
  },
  {
    version: "v1.6.0",
    date: "2026-05-29",
    changes: [
      {
        type: "feat",
        text: "Added LINE Official Account bot! Link your account, save jobs by sharing a URL in chat, ask the AI career advisor, and get push reminders the day before interviews.",
      },
    ],
  },
  {
    version: "v1.5.0",
    date: "2026-05-28",
    changes: [
      {
        type: "feat",
        text: "Turned the app into an installable Mobile PWA! You can now 'Share' job links directly from your browser into the app.",
      },
    ],
  },
  {
    version: "v1.4.1",
    date: "2026-05-28",
    changes: [
      {
        type: "feat",
        text: "Added automated Database Seeding to quickly populate Dev and Staging environments with rich test data.",
      },
    ],
  },
  {
    version: "v1.4.0",
    date: "2026-05-28",
    changes: [
      {
        type: "feat",
        text: "Added Community Insights! See which companies are trending and highly competitive across the platform.",
      },
    ],
  },
  {
    version: "v1.3.0",
    date: "2026-05-28",
    changes: [
      {
        type: "feat",
        text: "Added Weekly Auto-Resetting Quotas for AI Tokens and Smart Scraper to keep your usage healthy.",
      },
    ],
  },
  {
    version: "v1.2.3",
    date: "2026-05-27",
    changes: [
      {
        type: "fix",
        text: "Fixed UI bug where Firecrawl scraper wasn't showing up on the real Dashboard.",
      },
      {
        type: "feat",
        text: "Added Tabbed UI for Job parsing and integrated Firecrawl V1 API for precise web scraping.",
      },
      {
        type: "fix",
        text: "Fixed AI Scraper accuracy by migrating to Firecrawl and patched Source detection.",
      },
      { type: "feat", text: "Added Smart URL Scraper and Job Source tracking." },
    ],
  },
  {
    version: "v1.1.0",
    date: "2026-05-26",
    changes: [
      { type: "feat", text: "Added What's New release notes modal." },
      { type: "feat", text: "Added Google OAuth integration." },
      {
        type: "fix",
        text: "Refactored dashboard, dialogs, and forms for mobile responsiveness.",
      },
      {
        type: "feat",
        text: "Added AI iterative refinement for cover letters, interview questions, and email drafts.",
      },
    ],
  },
];

export const CURRENT_APP_VERSION = RELEASES[0]!.version;

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

function badgeVariantFor(type: ChangeType): "default" | "destructive" | "secondary" {
  if (type === "feat") return "default";
  if (type === "fix" || type === "hotfix") return "destructive";
  return "secondary";
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

  const latestRelease = RELEASES[0]!;
  const historyReleases = RELEASES.slice(1);

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

        <Tabs defaultValue="latest" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="latest" className="cursor-pointer">
              Latest Update
            </TabsTrigger>
            <TabsTrigger value="history" className="cursor-pointer">
              History Update
            </TabsTrigger>
          </TabsList>

          <TabsContent value="latest" className="space-y-4 py-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-semibold text-base">{latestRelease.version}</span>
              <span className="text-xs text-muted-foreground">{latestRelease.date}</span>
            </div>
            <ul className="space-y-3">
              {latestRelease.changes.map((change, i) => (
                <li key={i} className="flex gap-2 items-start text-sm">
                  <Badge variant={badgeVariantFor(change.type)}>{change.type}</Badge>
                  <span className="leading-relaxed">{change.text}</span>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent
            value="history"
            className="max-h-[300px] overflow-y-auto space-y-6 py-4 pr-2"
          >
            {historyReleases.map((release) => (
              <div key={release.version} className="space-y-2">
                <div className="flex justify-between items-center border-b pb-1">
                  <span className="font-semibold text-sm">{release.version}</span>
                  <span className="text-xs text-muted-foreground">{release.date}</span>
                </div>
                <ul className="space-y-2">
                  {release.changes.map((change, i) => (
                    <li key={i} className="flex gap-2 items-start text-sm">
                      <span className="font-mono text-xs uppercase text-muted-foreground w-12 shrink-0">
                        [{change.type}]
                      </span>
                      <span className="leading-tight text-muted-foreground">{change.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </TabsContent>
        </Tabs>

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
