import type { TrainingPlan } from "./claude";

const DAY_OFFSETS: Record<string, number> = {
  Monday: 0, Tuesday: 1, Wednesday: 2,
  Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6,
};

export const TYPE_COLORS: Record<string, string> = {
  "Easy Run":       "#16a34a",
  "Long Run":       "#2563eb",
  "Tempo Run":      "#ea580c",
  "Intervals":      "#dc2626",
  "Cross Training": "#9333ea",
  "Rest":           "#374151",
};

export function getNextMonday(from: Date = new Date()): string {
  const d = new Date(from);
  const daysToAdd = (8 - d.getDay()) % 7; // 0 if already Monday
  d.setDate(d.getDate() + daysToAdd);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

export function planToEvents(plan: TrainingPlan & { start_date?: string }) {
  const startStr = plan.start_date ?? getNextMonday();
  const start = new Date(startStr);

  return plan.weeks.flatMap((week) =>
    week.workouts
      .filter((w) => w.type !== "Rest")
      .map((workout) => {
        const offset = (week.week - 1) * 7 + (DAY_OFFSETS[workout.day] ?? 0);
        const date = new Date(start);
        date.setDate(start.getDate() + offset);
        return {
          id: `w${week.week}-${workout.day}`,
          title: workout.distance_km
            ? `${workout.type} · ${workout.distance_km}km`
            : workout.type,
          date: date.toISOString().split("T")[0],
          backgroundColor: TYPE_COLORS[workout.type] ?? "#374151",
          borderColor: "transparent",
          extendedProps: { workout, weekTheme: week.theme },
        };
      })
  );
}
