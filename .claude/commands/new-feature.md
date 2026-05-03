Plan and implement a new feature for the Walter app.

Feature request: $ARGUMENTS

Before writing any code:

1. Read CLAUDE.md for the full architecture and DB schema
2. Identify which files need to change
3. Check if any new DB tables or columns are needed
4. Consider whether this needs a new API route, page, or component

Implementation checklist:
- [ ] New pages use `bg-[#0a0a0f]` background and dark theme throughout
- [ ] New API routes check auth and return 401 if no user
- [ ] New DB tables have RLS enabled and a user-scoped policy
- [ ] Any route calling Claude has `export const maxDuration = 60`
- [ ] Server Components are the default — only add `"use client"` if needed
- [ ] No third-party UI components that could inject their own CSS
- [ ] CLAUDE.md updated if DB schema changed

Present a brief plan (what files change and why) before writing any code.
