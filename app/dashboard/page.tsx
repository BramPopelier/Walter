import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SyncButton from "./SyncButton";
import GeneratePlanButton from "./GeneratePlanButton";
import TrainingCalendar from "@/components/TrainingCalendar";
import type { TrainingPlan } from "@/lib/claude";

const WALTER_QUOTES = [
  "Pain is temporary. Strava data is forever.",
  "Hills are just flat roads that got ambitious.",
  "Easy runs should feel embarrassingly slow. That's the point.",
  "The taper is not a reward. It is a test of character.",
  "Rest days exist. Walter insists.",
  "That runner you pass every morning? They think the same about you.",
  "If your easy pace doesn't embarrass you, it's not easy enough.",
  "The only bad run is the one that didn't happen. And the one where you forgot your shoes.",
  "Consistency beats heroics. Every. Single. Time.",
  "Your future self is watching you through memories. Don't disappoint them.",
];

function runCommentary(count: number): string {
  if (count === 0) return "Let's get started";
  if (count < 20) return "Building the habit";
  if (count < 50) return "Finding the rhythm";
  if (count < 100) return "Getting serious";
  if (count < 200) return "Solid commitment";
  return "You absolute machine";
}

function kmCommentary(km: number): string {
  if (km === 0) return "The journey awaits";
  if (km < 200) return "Nice start";
  if (km < 500) return "Earning it";
  if (km < 1000) return "Respectable";
  if (km < 2000) return "Impressive";
  return "Are you even human";
}

function weeksUntil(dateStr: string): number {
  return Math.max(0, Math.round((new Date(dateStr).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)));
}

function stravaAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: process.env.STRAVA_REDIRECT_URI!,
    response_type: "code",
    scope: "activity:read_all",
  });
  return `https://www.strava.com/oauth/authorize?${params}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ strava?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: stravaConn }, { data: runStats }, { data: goal }, { data: latestPlan }] =
    await Promise.all([
      supabase.from("strava_connections").select("strava_athlete_id").eq("user_id", user.id).maybeSingle(),
      supabase.from("runs").select("distance").eq("user_id", user.id),
      supabase.from("goals").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("plans").select("id, plan, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

  const { strava } = await searchParams;
  const isConnected = !!stravaConn;
  const runCount = runStats?.length ?? 0;
  const totalKm = runStats
    ? Math.round(runStats.reduce((s, r) => s + (r.distance ?? 0), 0) / 1000)
    : 0;
  const plan = latestPlan?.plan as (TrainingPlan & { start_date?: string }) | null;
  const canGenerate = !!goal && runCount > 0;
  const quote = WALTER_QUOTES[Math.floor(Math.random() * WALTER_QUOTES.length)];
  const firstName = user.email?.split("@")[0].split(".")[0] ?? "champ";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Top bar */}
      <header className="border-b border-white/5 bg-[#0d0d14] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-sm font-black shadow-lg shadow-orange-500/30">W</div>
          <div>
            <span className="font-bold tracking-tight">Walter</span>
            <span className="ml-2 text-xs text-gray-600 hidden sm:inline">your brutally honest coach</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
          <form action="/api/auth/signout" method="POST">
            <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-3 py-1.5 border border-white/5 rounded-lg hover:border-white/10">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-5">
        {strava === "error" && (
          <div className="p-4 bg-red-950/50 border border-red-800/50 rounded-xl text-red-400 text-sm">
            Something went wrong connecting to Strava. Try again.
          </div>
        )}

        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-3xl mb-6 shadow-xl shadow-orange-500/10">🏃</div>
            <h2 className="text-2xl font-bold mb-2">Connect Strava to meet Walter</h2>
            <p className="text-gray-500 mb-8 max-w-xs text-sm leading-relaxed">
              Walter needs your training history before he can tell you what you&apos;ve been doing wrong.
            </p>
            <a href={stravaAuthUrl()} className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-orange-500/20">
              Connect Strava
            </a>
          </div>
        ) : (
          <>
            {/* Greeting + quote */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-white">
                  Hey {firstName.charAt(0).toUpperCase() + firstName.slice(1)} 👋
                </h1>
                <p className="text-gray-500 text-sm mt-0.5 italic">&ldquo;{quote}&rdquo; — Walter</p>
              </div>
              {goal && (
                <div className="shrink-0 text-right hidden sm:block">
                  <p className="text-xs text-gray-600 uppercase tracking-wider">Race countdown</p>
                  <p className="text-2xl font-black text-orange-400">{weeksUntil(goal.race_date)}<span className="text-sm font-normal text-gray-500 ml-1">weeks</span></p>
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0d0d14] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Runs · 365d</p>
                <p className="text-2xl font-black">{runCount}</p>
                <p className="text-xs text-orange-400/80 mt-1">{runCommentary(runCount)}</p>
              </div>
              <div className="bg-[#0d0d14] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Distance · 365d</p>
                <p className="text-2xl font-black">{totalKm}<span className="text-sm font-normal text-gray-500 ml-1">km</span></p>
                <p className="text-xs text-orange-400/80 mt-1">{kmCommentary(totalKm)}</p>
              </div>
              <div className="bg-[#0d0d14] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Goal</p>
                {goal ? (
                  <>
                    <p className="text-lg font-black truncate">{goal.race_type}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(goal.race_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      {goal.target_time && ` · ${goal.target_time}`}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-black text-gray-700">—</p>
                    <a href="/dashboard/goals" className="text-xs text-orange-400/80 mt-1 block hover:text-orange-400">Set one →</a>
                  </>
                )}
              </div>
              <div className="bg-[#0d0d14] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Active plan</p>
                {plan ? (
                  <>
                    <p className="text-lg font-black">{plan.total_weeks}<span className="text-sm font-normal text-gray-500 ml-1">weeks</span></p>
                    <p className="text-xs text-gray-600 mt-1">
                      Since {new Date(latestPlan!.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-black text-gray-700">—</p>
                    <p className="text-xs text-gray-600 mt-1">None generated yet</p>
                  </>
                )}
              </div>
            </div>

            {/* Calendar or empty state */}
            {plan ? (
              <div className="bg-[#0d0d14] border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold">Training calendar</h2>
                    <p className="text-gray-500 text-xs mt-0.5">{plan.summary}</p>
                  </div>
                  <a href={`/dashboard/plan/${latestPlan!.id}`} className="text-xs text-gray-600 hover:text-orange-400 transition-colors border border-white/5 px-3 py-1.5 rounded-lg hover:border-orange-400/20">
                    List view →
                  </a>
                </div>
                <div className="p-6">
                  <TrainingCalendar plan={plan} />
                  <div className="flex flex-wrap gap-4 mt-5 pt-5 border-t border-white/5">
                    {[
                      ["Easy Run", "#16a34a"],
                      ["Long Run", "#2563eb"],
                      ["Tempo Run", "#ea580c"],
                      ["Intervals", "#dc2626"],
                      ["Cross Training", "#9333ea"],
                    ].map(([type, color]) => (
                      <div key={type} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm" style={{ background: color }} />
                        <span className="text-xs text-gray-500">{type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#0d0d14] border border-white/5 border-dashed rounded-2xl p-14 text-center">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="font-bold mb-1">
                  {!goal ? "Walter needs a target" : "Walter is ready when you are"}
                </h3>
                <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                  {!goal
                    ? "Set a goal and Walter will craft a plan tailored to your Strava history."
                    : "Your data is loaded. Your goal is set. There are no more excuses."}
                </p>
                <GeneratePlanButton disabled={!canGenerate} />
              </div>
            )}

            {/* Actions bar */}
            <div className="flex items-center justify-between py-3 px-5 bg-[#0d0d14] border border-white/5 rounded-xl">
              <div className="flex items-center gap-5">
                <SyncButton />
                <span className="text-white/10">|</span>
                <a href="/dashboard/goals" className="text-sm text-gray-500 hover:text-white transition-colors">
                  {goal ? "Edit goal" : "Set goal"}
                </a>
              </div>
              {plan && (
                <GeneratePlanButton disabled={!canGenerate} label="Regenerate" />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
