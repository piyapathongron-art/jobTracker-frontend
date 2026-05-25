# Personal AI Job Tracker — Agent Instructions (Codex / OpenAI Agents)

> This is NOT the standard Next.js you know from training data.
> This project uses **Next.js 16 (App Router)** — APIs, conventions, and file structure may differ from your training data.
> Read `node_modules/next/dist/docs/` if unsure. Heed deprecation notices.
>
> For Claude Code: see CLAUDE.md. For Gemini CLI: see GEMINI.md.

---

## Repository Context

- **What it is:** Next.js 16 (App Router) frontend for a personal job application tracker with Gemini AI features.
- **Working directory:** `client/` — all paths below are relative to this directory.
- **Package manager:** `pnpm` only. Do not run `npm install` or `yarn`.

## Environment

```bash
node --version   # Expect 20+
pnpm --version   # Expect 9+
```

Required env vars in `.env.local` (never read, print, or commit these):
- `GEMINI_API_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_API_URL` (optional)

## Allowed Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Verify build — run this to confirm changes work
pnpm lint             # Lint check
pnpm add <pkg>        # Add runtime dependency
pnpm add -D <pkg>     # Add dev dependency
pnpm dlx shadcn@latest add <component>   # Install shadcn component
npx prisma migrate dev --name <name>     # Run DB migration (R0 — confirm first)
npx prisma generate                      # Regenerate Prisma client
```

## Prohibited Actions

- Do NOT run `npm install`, `yarn`, or `bun` — pnpm only.
- Do NOT commit `.env.local` or any file containing API keys or secrets.
- Do NOT run `prisma migrate reset` or `prisma db push` without explicit user instruction (destructive).
- Do NOT install a package that already has an equivalent in the project.
- Do NOT `git push --force`.
- Do NOT infer that a package is installed unless it appears in `package.json`.
- Do NOT add any AI (Claude, Gemini, Copilot, GPT, etc.) as a commit co-author (`Co-Authored-By:` trailers are prohibited) or as a GitHub repository contributor.

## Task Execution Rules

1. **Read before writing.** Check the target file before editing it.
2. **One logical change per step.** Don't batch unrelated edits.
3. **Verify after every change** — run `pnpm build` for code changes, `pnpm lint` for style-only.
4. **Report what you did** — state file paths changed, commands run, and output received.
5. **Schema changes are R0** — stop and ask before running any Prisma migration.

## Tech Stack

| Layer | Package | Notes |
|---|---|---|
| Framework | `next` 16 | App Router only — no `pages/` directory |
| Styling | `tailwindcss` v4 | Utility classes only |
| UI Primitives | `shadcn/ui` (Radix UI) | Install: `pnpm dlx shadcn@latest add <name>` |
| ORM | `prisma` + `@prisma/client` | May need to be installed |
| AI | `@google/generative-ai` | Gemini 2.0 Flash model |

> Before importing any package, verify it exists in `package.json`. If not, install it first.

## Code Conventions

### Components
- Functional components with TypeScript
- shadcn/ui for all UI primitives — no raw `<div>`-based custom buttons/inputs/modals
- Tailwind CSS classes only — no inline styles, no CSS modules
- `"use client"` only when needed (hooks, event listeners)
- Default: Server Components

### API Routes
```
app/api/<resource>/route.ts
```
- Use named exports: `GET`, `POST`, `PUT`, `DELETE`
- Return `NextResponse.json(data)` or `NextResponse.json({ error }, { status: N })`
- Server-side only — never expose `GEMINI_API_KEY` to the client bundle

### Prisma
```typescript
import { prisma } from "@/lib/prisma";  // singleton client
```
- Use `.findUnique`, `.findMany`, `.create`, `.update`, `.delete`
- Always handle `null` from `findUnique`

### Gemini AI
```typescript
import { geminiFlash } from "@/lib/gemini";
const result = await geminiFlash.generateContent(prompt);
```
- Prompts requesting structured data must end with: `"Return ONLY valid JSON, no markdown fences."`
- Wrap in `try/catch` — never surface Gemini errors as unhandled 500s

## Data Model Reference

```
JobApplication: id, company, role, status (WISHLIST|APPLIED|INTERVIEWING|OFFERED|REJECTED|GHOSTED),
                url?, salaryMin?, salaryMax?, location?, notes?, appliedAt?, createdAt, updatedAt
```

Do not invent fields not in this schema.

## Output Format

For each task, report:
```
Files changed: [list with paths]
Commands run:  [list with output]
Result:        [pass/fail + one-line summary]
```
