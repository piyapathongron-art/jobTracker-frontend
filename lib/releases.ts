// IMPORTANT: Prepend a new entry to RELEASES every time a feature ships.
// - Use patch version (x.y.Z) for hotfixes — these do NOT trigger the What's New popup.
// - Use minor/major version (x.N.0) for real features — these DO trigger the popup.
// - Write 'text' in user language (benefits, not implementation details).
// - CURRENT_APP_VERSION is derived from RELEASES[0] automatically.

export type ChangeType = "feat" | "fix" | "hotfix" | "refactor";

export interface Release {
  version: string;
  date: string;
  title?: string;
  changes: { type: ChangeType; text: string }[];
}

export const RELEASES: Release[] = [
  {
    version: "v1.12.1",
    date: "2026-05-31",
    title: "Visual Brand Identity & Mascot Update",
    changes: [
      { type: "hotfix", text: "Replaced generic placeholder icons with the Jobjab red panda mascot avatar in the LINE Bot preview and header." }
    ],
  },
  {
    version: "v1.12.0",
    date: "2026-05-31",
    title: "Premium Landing Page & Jobjab LINE Bot",
    changes: [
      { type: "feat", text: "Redesigned landing page with a modern Social Proof-focused aesthetic using the brand typeface." },
      { type: "feat", text: "Created an interactive LINE Bot preview showcasing our smart 'Jobjab' companion with step-by-step visuals." },
      { type: "feat", text: "Fully localized all landing page copy into Thai and English (zero hardcoded strings)." }
    ],
  },
  {
    version: "v1.11.0",
    date: "2026-05-31",
    title: "Edit Mode UX & Layout Enhancements",
    changes: [
      { type: "fix", text: "Save and Cancel buttons now stay visible at the top of the sheet — no more scrolling to the bottom to confirm changes." },
      { type: "fix", text: "Editing mode now blocks accidental closes and backdrop clicks, so you can't lose unsaved work." },
      { type: "refactor", text: "Job form fields reordered to match the overview layout for a more consistent experience." },
    ],
  },
  {
    version: "v1.10.0",
    date: "2026-05-31",
    title: "HR Contact Tracking",
    changes: [
      { type: "feat", text: "New 'HR Contact' field on all job applications — store the recruiter's email, LINE ID, phone, or Facebook." },
      { type: "feat", text: "AI parser (URL, image, LINE Bot) now automatically extracts HR contact info from job postings." },
      { type: "feat", text: "Jobjab will warn you when no HR contact info was found, so you remember to fill it in." },
    ],
  },
  {
    version: "v1.9.0",
    date: "2026-05-30",
    changes: [
      { type: "feat", text: "Export all your data as a JSON file from the Profile page (GDPR/PDPA compliant)." },
      { type: "feat", text: "Permanently delete your account and all data via a confirmation modal." },
      { type: "feat", text: "Added request rate limiting and AI prompt injection defenses for a more secure experience." },
    ],
  },
  {
    version: "v1.8.0",
    date: "2026-05-29",
    changes: [
      { type: "feat", text: "Meet น้องจ๊อบแจ๊บ (Jobjab)! The LINE bot now has a cute Thai persona and can save jobs straight from chat — just describe a role and it logs it for you." },
      { type: "feat", text: "Smarter screenshot/URL parser: the bot now detects when an image or link isn't a job posting and politely tells you instead of saving junk." },
    ],
  },
  {
    version: "v1.7.0",
    date: "2026-05-29",
    changes: [
      { type: "feat", text: "Send a screenshot of any job posting to the LINE bot and AI will save it as a job automatically." },
      { type: "feat", text: "Career advisor in LINE bot now sees your active applications for more personalized advice." },
      { type: "feat", text: "LINE bot now enforces weekly AI quotas, matching the limits on the web app." },
    ],
  },
  {
    version: "v1.6.0",
    date: "2026-05-29",
    changes: [
      { type: "feat", text: "Added LINE Official Account bot! Link your account, save jobs by sharing a URL in chat, ask the AI career advisor, and get push reminders the day before interviews." },
    ],
  },
  {
    version: "v1.5.0",
    date: "2026-05-28",
    changes: [
      { type: "feat", text: "Turned the app into an installable Mobile PWA! You can now 'Share' job links directly from your browser into the app." },
    ],
  },
  {
    version: "v1.4.1",
    date: "2026-05-28",
    changes: [
      { type: "hotfix", text: "Added automated database seeding for Dev and Staging environments." },
    ],
  },
  {
    version: "v1.4.0",
    date: "2026-05-28",
    changes: [
      { type: "feat", text: "Added Community Insights! See which companies are trending and highly competitive across the platform." },
    ],
  },
  {
    version: "v1.3.0",
    date: "2026-05-28",
    changes: [
      { type: "feat", text: "Added weekly auto-resetting quotas for AI tokens and Smart Scraper to keep your usage healthy." },
    ],
  },
  {
    version: "v1.2.3",
    date: "2026-05-27",
    changes: [
      { type: "fix", text: "Fixed UI bug where Smart Scraper wasn't showing up on the Dashboard." },
      { type: "feat", text: "Added tabbed UI for job parsing with a more accurate web scraper." },
      { type: "feat", text: "Added Smart URL Scraper and Job Source tracking." },
    ],
  },
  {
    version: "v1.1.0",
    date: "2026-05-26",
    changes: [
      { type: "feat", text: "Added What's New release notes modal." },
      { type: "feat", text: "Added Google OAuth integration." },
      { type: "fix", text: "Refactored dashboard, dialogs, and forms for mobile responsiveness." },
      { type: "feat", text: "Added AI iterative refinement for cover letters, interview questions, and email drafts." },
    ],
  },
];

export const CURRENT_APP_VERSION = RELEASES[0]!.version;
