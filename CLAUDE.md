# Walter — AI Coach App

Personal running training plan app. Named after the trainer from the duathlon club. Connects Strava → analyses run history → Claude API generates personalised week-by-week training plans → displayed on a custom calendar.

Live: https://walter-lemon.vercel.app  
Repo: https://github.com/BramPopelier/Walter

---

## Architecture at a glance

```
Browser → proxy.ts (auth + approval gate) → Next.js App Router → Supabase (DB)
                                                               → Strava API
                                                               → Anthropic API
```

Every request passes through `proxy.ts` (NOT `middleware.ts` — this project renamed it). It:
1. Redirects unauthenticated users to `/login`
2. Redirects unapproved users to `/pending`
3. Redirects already-approved users away from `/pending`

---

## Database schema

All tables live in Supabase Postgres. RLS is enabled on all of them.

**`profiles`** — created by trigger on every new auth.users insert
| column | type | notes |
|---|---|---|
| user_id | uuid PK/FK | references auth.users.id |
| approved | boolean | default false — gates dashboard access |
| created_at | timestamptz | |

**`strava_connections`** — one row per user
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | UNIQUE constraint |
| strava_athlete_id | bigint | |
| access_token | text | refreshed automatically |
| refresh_token | text | |
| expires_at | int | unix timestamp |

**`runs`** — synced from Strava, last 365 days only
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| strava_activity_id | bigint | UNIQUE — used for upsert |
| name | text | |
| distance | float | metres |
| moving_time | int | seconds |
| average_speed | float | m/s |
| average_heartrate | float | nullable |
| max_heartrate | float | nullable |
| total_elevation_gain | float | nullable |
| start_date | timestamptz | |

**`goals`** — one row per user (upserted)
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| race_type | text | 5K / 10K / Half Marathon / Marathon / Duathlon / Triathlon / Trail Run / Other |
| race_date | date | |
| target_time | text | nullable, e.g. "1:45:00" |
| days_per_week | int | 2–6 |
| experience_level | text | Beginner / Intermediate / Experienced |
| long_run_day | text | Saturday / Sunday |
| notes | text | nullable, free text for Walter |

**`plans`** — append-only, latest plan wins on dashboard
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| plan | jsonb | full TrainingPlan object (see lib/claude.ts for type) |
| created_at | timestamptz | |

The `plan` JSONB shape:
```ts
{
  summary: string
  total_weeks: number
  start_date: string        // "YYYY-MM-DD", set at generation time
  weeks: Array<{
    week: number
    theme: string
    total_km: number
    workouts: Array<{
      day: "Monday"|"Tuesday"|...|"Sunday"
      type: "Easy Run"|"Tempo Run"|"Intervals"|"Long Run"|"Rest"|"Cross Training"
      distance_km?: number
      pace_min_per_km?: string   // e.g. "5:30"
      description: string
    }>
  }>
}
```

---

## Key files

| File | Purpose |
|---|---|
| `proxy.ts` | Auth + approval middleware — NOT middleware.ts |
| `lib/claude.ts` | `generateTrainingPlan()` — calls Anthropic API |
| `lib/planUtils.ts` | `planToEvents()` — maps plan weeks to calendar dates using `start_date` |
| `lib/strava.ts` | `getValidStravaToken()` — handles token refresh transparently |
| `lib/supabase/server.ts` | `createClient()` for Server Components and Server Actions |
| `lib/supabase/client.ts` | `createClient()` for Client Components |
| `components/TrainingCalendar.tsx` | Custom monthly calendar — do NOT replace with FullCalendar |
| `app/api/strava/sync/route.ts` | Syncs last 365d of runs with pagination |
| `app/api/plan/generate/route.ts` | Computes stats, calls Claude, stores plan |
| `app/api/strava/callback/route.ts` | Strava OAuth callback |
| `app/dashboard/page.tsx` | Main dashboard — stats row, Walter quotes, calendar |
| `app/dashboard/goals/` | Set / edit race goal |
| `app/pending/page.tsx` | Waiting room for unapproved users |

---

## Critical conventions

### proxy.ts not middleware.ts
Next.js 16 renamed the middleware file AND the exported function. This project uses `proxy.ts` at the root with `export async function proxy(...)`. Do not create or rename to `middleware.ts`.

### Server Actions for auth
Auth (signIn, signUp) uses Server Actions in `app/login/actions.ts`. Do NOT use client-side Supabase auth calls — they cause SSR prerender errors with this setup.

### Dark theme — never change background
`globals.css` hardcodes `html, body { background: #0a0a0f }`. Do not introduce CSS variables or conditional theming that might override this. The entire app is dark-only.

### TrainingCalendar is custom-built
FullCalendar was removed because it injected its own white CSS that could not be overridden. The current `components/TrainingCalendar.tsx` is a bespoke component. Do not replace it with any third-party calendar library.

### plan.start_date is frozen at generation time
When a plan is generated, `start_date` is set to the next Monday from the generation date and stored in the plan JSONB. This ensures the calendar dates are stable — they do not shift as days pass. `planToEvents()` in `lib/planUtils.ts` reads this value.

### Strava token refresh
`getValidStravaToken()` in `lib/strava.ts` handles expiry automatically. Always use this function — never read access_token from the DB directly.

### Approval system
New signups get `profiles.approved = false`. The proxy redirects them to `/pending`. To approve a user:
```sql
UPDATE profiles SET approved = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

---

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co      # NO /rest/v1/ suffix
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
STRAVA_CLIENT_ID=12345
STRAVA_CLIENT_SECRET=abc...
STRAVA_REDIRECT_URI=https://walter-lemon.vercel.app/api/strava/callback
ANTHROPIC_API_KEY=sk-ant-...
```

The `NEXT_PUBLIC_SUPABASE_URL` must be the bare project URL. Adding `/rest/v1/` causes silent auth failures.

---

## Local dev

```bash
npm run dev        # starts on localhost:3000
npm run build      # production build (run before pushing if touching core logic)
npm run lint       # ESLint
```

---

## Deployment

GitHub → Vercel, automatic on every push to `main`. Vercel project: walter-lemon.vercel.app. Environment variables are set in Vercel dashboard (not committed).

---

## Known issues / past bugs

- **"database error saving new user"** — profiles trigger missing or broken. Fix: recreate trigger (see `/project:fix-trigger` command).
- **"unexpected response from server" on login** — usually wrong `NEXT_PUBLIC_SUPABASE_URL` in Vercel env vars (has `/rest/v1/` appended).
- **White background** — caused by any CSS that sets `background: var(--background)` without the hardcoded override in globals.css.
- **Strava "number of athletes reached"** — Strava limits new apps to 1 connected athlete. Must apply for expanded access at strava.com/settings/api.
- **Calendar dates shifting** — would happen if `start_date` was computed on each render instead of stored. It is stored in the plan JSONB — do not change this.
