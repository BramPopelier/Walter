Debug a Vercel deployment issue for the Walter app.

Issue: $ARGUMENTS

Work through these checks in order:

**1. Environment variables**
The most common cause of Vercel failures. Verify in the Vercel dashboard (Settings → Environment Variables):
- `NEXT_PUBLIC_SUPABASE_URL` — must be `https://xxxx.supabase.co` with NO `/rest/v1/` suffix
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — should start with `eyJ`
- `STRAVA_CLIENT_ID` — numbers only
- `STRAVA_CLIENT_SECRET` — long hex string
- `STRAVA_REDIRECT_URI` — must be `https://walter-lemon.vercel.app/api/strava/callback`
- `ANTHROPIC_API_KEY` — starts with `sk-ant-`

**2. Common errors and fixes**
- `"An unexpected response was received from the server"` → wrong Supabase URL in env vars
- `"database error saving new user"` → profiles trigger broken, run `/project:fix-trigger`
- `"number of athletes reached"` → Strava API app limited to 1 athlete, must apply for expanded access at strava.com/settings/api
- White background → CSS variable override, check globals.css still has `html, body { background: #0a0a0f }`
- Plan generation timeout → Claude route missing `export const maxDuration = 60`

**3. Check Vercel function logs**
Tell the user: in the Vercel dashboard, go to the failing deployment → Functions tab → click the failing function to see the actual error.

**4. Local reproduction**
If the issue is unclear, ask the user to run `npm run build` locally — it catches type errors and missing env vars before deploying.
