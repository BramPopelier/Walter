Add a new workout type to the Walter app.

New type name: $ARGUMENTS

A workout type appears in multiple places. Update ALL of them:

1. **`lib/claude.ts`** — add to the `Workout.type` union type
2. **`lib/planUtils.ts`** — add a colour to `TYPE_COLORS` (hex value)
3. **`components/TrainingCalendar.tsx`** — add a matching entry to `TYPE_BG` (Tailwind bg class)
4. **`app/dashboard/page.tsx`** — add to the legend array at the bottom of the calendar section

Also update the system prompt in `lib/claude.ts` to mention the new type so Claude knows it can use it.

The colour should fit the existing palette:
- Easy Run: green (`#16a34a` / `bg-green-700/80`)
- Long Run: blue (`#2563eb` / `bg-blue-700/80`)
- Tempo Run: orange (`#ea580c` / `bg-orange-600/80`)
- Intervals: red (`#dc2626` / `bg-red-700/80`)
- Cross Training: purple (`#9333ea` / `bg-purple-700/80`)
