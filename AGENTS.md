# Agent rules for Walter

## Next.js version warning

This project runs **Next.js 16** with **React 19**. APIs, conventions, and file structure differ from your training data. Before writing any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices.

Key differences from older Next.js:
- Middleware is `proxy.ts` (not `middleware.ts`) and exports `proxy` (not `middleware`)
- `searchParams` in page components is a `Promise` — must be `await`ed
- `cookies()` is async — must be `await`ed
- Server Actions must be in files marked `"use server"` at the top
- `createClient()` from `lib/supabase/server.ts` is async — must be `await`ed

## How to work on this project

### Before writing any code
1. Read `CLAUDE.md` — it has the full architecture, DB schema, and gotchas
2. Read the file(s) you're about to change
3. If touching the DB, check existing RLS policies in Supabase before assuming they exist

### Adding a new database table
1. Create table in Supabase SQL editor
2. Enable RLS: `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`
3. Add user-scoped policy: `CREATE POLICY "user owns own rows" ON <table> FOR ALL USING (auth.uid() = user_id);`
4. Update the schema section in `CLAUDE.md`

### Adding a new page
1. Create `app/<route>/page.tsx` as an async Server Component
2. Add auth check at the top: fetch user from `createClient()` and `redirect("/login")` if null
3. Use `bg-[#0a0a0f]` for page background — never `bg-white` or `bg-gray-50`
4. If the page should only be accessible to approved users, `proxy.ts` handles this automatically for all `/dashboard/*` routes. For new top-level routes, add them to the matcher in `proxy.ts`

### Adding a new API route
1. Create `app/api/<path>/route.ts`
2. Check auth at the top via `supabase.auth.getUser()` and return 401 if no user
3. Return `NextResponse.json(...)` for all responses

### Calling Claude
1. Use `generateTrainingPlan()` in `lib/claude.ts` as the pattern
2. Always strip markdown fences from the response before `JSON.parse`
3. Set `maxDuration = 60` on any route that calls Claude (Vercel default is 10s)
4. Use `cache_control: { type: "ephemeral" }` on the system prompt for prompt caching

### Touching the calendar
Do NOT replace `components/TrainingCalendar.tsx` with a third-party library. FullCalendar was tried and removed — it injected CSS that broke the dark theme permanently.

### Touching auth
Use Server Actions (`"use server"`) for sign in/up/out. Do not call Supabase auth from client components — it causes SSR prerender errors.

## Code style

- TypeScript strict — no `any` without a comment explaining why
- No comments explaining what code does — only why (non-obvious constraints, workarounds)
- Dark theme only — `#0a0a0f` background, white/gray text, orange (`orange-500`) accents
- Tailwind classes for all styling — no inline style objects except for dynamic colours (e.g. workout type colours)
- Server Components by default — add `"use client"` only when you need interactivity or browser APIs
