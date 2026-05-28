# Client Deployment

Frontend (Next.js 16) deployment reference for the Personal AI Job Tracker.

## Environments

| Tier | Branch | URL | Vercel Deploy Type |
|---|---|---|---|
| Production | `main` | `<prod-domain>` (TODO: fill in) | Production |
| Staging | `dev` | `https://job-tracker-git-dev-piyapathongron-3507s-projects.vercel.app` | Preview (branch-scoped) |
| Local | working tree | `http://localhost:3000` | — |

The Vercel project auto-deploys every push:
- `main` → Production
- `dev` → Preview (stable alias `*-git-dev-*`)

## Environment Variables

Set in **Vercel → Project → Settings → Environment Variables**. Each variable below has two entries scoped by environment.

| Key | Production scope | Preview (`dev` branch) scope |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `<prod-render-url>` | `https://jobtracker-staging.onrender.com` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | shared Google OAuth client | shared Google OAuth client |

**Local:** mirror these in `client/.env.local` (not committed).

After changing any env var, **redeploy** the affected branch with cache disabled — Next.js bakes env vars in at build time.

## Google OAuth Authorized Origins

The Google OAuth client (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`) must list every frontend origin under **Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs**:

- `http://localhost:3000` (local)
- `https://job-tracker-git-dev-piyapathongron-3507s-projects.vercel.app` (staging)
- `<prod-domain>` (production)

Changes can take 5–10 min to propagate.

## Deployment Flow

```
feature branch  →  PR into dev  →  auto-deploys to Staging  →  manual QA
                                                                    ↓
                                                          PR dev → main
                                                                    ↓
                                                          auto-deploys to Production
```

Hotfixes: branch off `main`, PR into `main`, then immediately back-merge `main → dev` so staging doesn't drift behind.

## CI

`.github/workflows/ci.yml` runs on push/PR to `main` and `dev`:
1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm build`

If CI fails on `--frozen-lockfile`, the lockfile is out of sync — run `pnpm install` locally and commit the updated lockfile.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| CORS error in DevTools | Backend `CLIENT_ORIGIN` doesn't match this frontend URL exactly (trailing slash, http vs https). |
| Login fails with `redirect_uri_mismatch` | Staging URL not added to Google OAuth origins, or Google's cache hasn't propagated (wait 10 min). |
| Staging shows stale prod data after env var change | Vercel build cache. Redeploy with **"Use existing Build Cache"** unchecked. |
| First API call takes 30–60 s | Render Free tier cold-start on the backend — expected. |
