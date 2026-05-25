# Personal AI Job Tracker — Claude Code Instructions

## Project Overview

A personal job tracking platform replacing spreadsheet trackers. Users manage their application pipeline and get AI assistance for resume tailoring, interview prep, and email drafting.

## Repository Layout

```
jobTracking/
├── client/          ← Next.js frontend (THIS repo — you are here)
│   ├── app/         ← App Router pages & layouts
│   ├── components/  ← Shared UI components (shadcn/ui + custom)
│   ├── lib/         ← Utilities, API clients, helpers
│   ├── prisma/      ← Schema + migrations (if DB lives here)
│   └── .env.local   ← Secret keys (never commit)
└── server/          ← Node/Express backend (separate package, may not exist yet)
```

> If `server/` does not exist, the backend has not been scaffolded yet. Do not invent it.

## Commands

Package manager: **pnpm** — never introduce `npm`/`yarn` lockfiles.

```bash
pnpm dev        # Next.js dev server → http://localhost:3000
pnpm build      # Production build
pnpm start      # Run production build
pnpm lint       # ESLint (flat config, eslint.config.mjs)
```

No test runner is configured. Verification = `pnpm build` passing + visual check in browser.

## Tech Stack (Authoritative)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | Not Vite |
| Styling | Tailwind CSS v4 | Utility-first only |
| UI Components | **shadcn/ui** (Radix UI primitives) | Install via `pnpm dlx shadcn@latest add <component>` |
| Backend API | Next.js Route Handlers (`app/api/`) | Express in `server/` only if explicitly scaffolded |
| Database | PostgreSQL via **Prisma ORM** | Install: `pnpm add prisma @prisma/client` |
| AI | **Google Generative AI** (`@google/generative-ai`) | Gemini 2.0 Flash preferred |
| Auth | TBD — do not add auth until specified | |
| Deployment | Vercel (frontend) / Render (backend) | |

> **Before importing any package, verify it exists in `package.json`.** If it doesn't, install it first and state the install command.

## Environment Variables

```bash
# .env.local (never committed)
GEMINI_API_KEY=             # Google AI Studio key
DATABASE_URL=               # PostgreSQL connection string (Prisma)
NEXT_PUBLIC_API_URL=        # Backend URL if server/ is separate
```

Validation: access env vars server-side only unless prefixed `NEXT_PUBLIC_`.

## File & Naming Conventions

- **Components:** `components/ui/` (shadcn primitives), `components/` (app-level)
- **File names:** `kebab-case.tsx` for components, `camelCase.ts` for utilities
- **API routes:** `app/api/<resource>/route.ts`
- **Server Actions:** `app/actions/<feature>.ts`
- Use `"use client"` directive only when needed (event handlers, hooks)
- Default all pages/layouts to **Server Components**

## Prisma Data Model (Canonical Fields)

```prisma
model JobApplication {
  id            String   @id @default(cuid())
  company       String
  role          String
  status        Status   @default(WISHLIST)
  url           String?
  salaryMin     Int?
  salaryMax     Int?
  location      String?
  notes         String?
  appliedAt     DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum Status {
  WISHLIST
  APPLIED
  INTERVIEWING
  OFFERED
  REJECTED
  GHOSTED
}
```

Extend this model, do not redefine it from scratch.

## Gemini AI Integration Rules

1. Always use `gemini-2.0-flash` as the default model.
2. Every prompt that needs structured data **must** end with: `"Return ONLY valid JSON with no markdown fences."`
3. Wrap all Gemini calls in `try/catch`; never let AI errors surface as 500s to the user.
4. Keep prompts in `lib/prompts/` as named exports — no inline prompt strings in route handlers.

```typescript
// lib/gemini.ts — singleton client
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
export const geminiFlash = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
```

## shadcn/ui Usage

- Install components: `pnpm dlx shadcn@latest add button card input dialog`
- Never build raw `<div>` button/input/modal equivalents when a shadcn component exists
- Tailwind classes go on the component's `className`, not wrapper divs
- Dark mode: use CSS variables from shadcn's theming system (`bg-background`, `text-foreground`, etc.)

## Core Mandates

### 1. NO MAGIC — ห้ามเดา

- All assumptions must be explicit.
- If a package isn't in `package.json`, do not import it.
- If a schema field doesn't exist, do not query it.
- If an env var isn't documented above, do not use it without asking.

### 2. VERIFY BEFORE DONE — ห้ามบอกว่าเสร็จถ้ายังไม่เช็ค

- Run `pnpm build` (or `pnpm lint` for small changes) and paste the output.
- "I edited the file" is **NOT** done. "Build passed, here's output" **IS** done.
- No "should work now." Evidence required.

### 3. SCOPE DRIFT DETECTION — จับ scope creep

- Track stated goal vs. actual execution.
- Stop and flag when a bugfix becomes a refactor, or a feature sneaks in extra features.

### 4. Change Risk Classification

| Level | Description | Protocol |
|---|---|---|
| **R0** | Irreversible — DB migration, delete data, change public API contract | **STOP. Get explicit approval first.** |
| **R1** | Costly to reverse — major refactor, new dependencies, schema changes | Proceed but **state the reason** clearly |
| **R2** | Low risk — UI tweak, copy change, new isolated component | Just do it |

### 5. Dependency Policy

- Use `pnpm add` (runtime) or `pnpm add -D` (dev-only).
- Do not install packages that duplicate existing ones (e.g., axios when `fetch` is available).
- Prefer packages already in the ecosystem: Radix UI via shadcn, not standalone Radix installs.

## AI Features — Scope Reference

| Feature | Input | AI Output |
|---|---|---|
| JD Parser | Raw JD text | JSON matching `JobApplication` fields |
| Resume Tailor | Base resume + JD | Keyword gaps + cover letter draft |
| Interview Sim | Role + tech stack | Technical + behavioral questions (STAR format) |
| Email Drafter | Context (follow-up, offer decline, etc.) | Professional email copy |

## GitHub Contribution Policy

- Do NOT add Claude, Gemini, Copilot, or any other AI as a co-author or contributor in commits (`Co-Authored-By:` trailers are prohibited).
- Do NOT add AI bot accounts to the repository's GitHub Contributors list.
- All commits must be attributed solely to the human developer.

## Tone & UX

- Copy: friendly, encouraging, concise.
- Error states: explain what went wrong + what the user can do.
- Loading states: always show a skeleton or spinner; never leave UI frozen.
