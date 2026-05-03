import { createClient } from "@/lib/supabase/server";
import { generateTrainingPlan } from "@/lib/claude";
import { getNextMonday } from "@/lib/planUtils";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch goal
  const { data: goal } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!goal) return NextResponse.json({ error: "No goal set" }, { status: 400 });

  // Fetch runs and compute stats
  const { data: runs } = await supabase
    .from("runs")
    .select("distance, moving_time, average_heartrate, average_speed, start_date")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false });

  if (!runs || runs.length === 0) {
    return NextResponse.json({ error: "No runs synced" }, { status: 400 });
  }

  // Weekly breakdown for last 12 weeks
  const now = Date.now();
  const recentWeeks = Array.from({ length: 12 }, (_, i) => {
    const weekStart = new Date(now - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now - i * 7 * 24 * 60 * 60 * 1000);
    const weekRuns = runs.filter(r => {
      const d = new Date(r.start_date).getTime();
      return d >= weekStart.getTime() && d < weekEnd.getTime();
    });
    return {
      week: `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
      km: Math.round(weekRuns.reduce((s, r) => s + r.distance, 0) / 1000),
      runs: weekRuns.length,
    };
  }).reverse();

  const totalKm = runs.reduce((s, r) => s + r.distance, 0) / 1000;
  const avgWeeklyKm = Math.round(totalKm / 52);
  const longestRun = Math.round(Math.max(...runs.map(r => r.distance)) / 1000);

  const avgSpeed = runs
    .filter(r => r.average_speed)
    .reduce((s, r, _, a) => s + r.average_speed / a.length, 0);
  const avgPace = avgSpeed > 0
    ? (() => {
        const secPerKm = 1000 / avgSpeed;
        const min = Math.floor(secPerKm / 60);
        const sec = Math.round(secPerKm % 60).toString().padStart(2, "0");
        return `${min}:${sec}`;
      })()
    : "unknown";

  const avgHr = runs.filter(r => r.average_heartrate).length > 0
    ? Math.round(runs.filter(r => r.average_heartrate).reduce((s, r, _, a) => s + r.average_heartrate / a.length, 0))
    : null;

  const plan = await generateTrainingPlan(goal, {
    run_count: runs.length,
    avg_weekly_km: avgWeeklyKm,
    longest_run_km: longestRun,
    avg_pace_min_per_km: avgPace,
    avg_heartrate: avgHr,
    recent_weeks: recentWeeks,
  });

  // Attach start date so calendar dates are fixed at generation time
  const planWithDates = { ...plan, start_date: getNextMonday() };

  // Store plan
  const { data: saved } = await supabase
    .from("plans")
    .insert({ user_id: user.id, plan: planWithDates })
    .select("id")
    .single();

  return NextResponse.json({ planId: saved?.id });
}
