import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { TrainingPlan, Workout } from "@/lib/claude";

const typeColors: Record<string, string> = {
  "Easy Run":      "bg-green-900/50 border-green-700 text-green-300",
  "Long Run":      "bg-blue-900/50 border-blue-700 text-blue-300",
  "Tempo Run":     "bg-orange-900/50 border-orange-700 text-orange-300",
  "Intervals":     "bg-red-900/50 border-red-700 text-red-300",
  "Cross Training":"bg-purple-900/50 border-purple-700 text-purple-300",
  "Rest":          "bg-gray-800/50 border-gray-700 text-gray-500",
};

function WorkoutCard({ workout }: { workout: Workout }) {
  const colors = typeColors[workout.type] ?? typeColors["Rest"];
  return (
    <div className={`border rounded-lg p-3 ${colors}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold uppercase tracking-wide">{workout.day}</span>
        {workout.distance_km && (
          <span className="text-xs font-bold">{workout.distance_km} km</span>
        )}
      </div>
      <p className="text-sm font-medium">{workout.type}</p>
      {workout.pace_min_per_km && (
        <p className="text-xs opacity-75 mt-0.5">@ {workout.pace_min_per_km} /km</p>
      )}
      <p className="text-xs opacity-75 mt-1 leading-relaxed">{workout.description}</p>
    </div>
  );
}

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: record } = await supabase
    .from("plans")
    .select("plan, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!record) redirect("/dashboard");

  const plan = record.plan as TrainingPlan;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <a href="/dashboard" className="text-gray-400 hover:text-white text-sm">← Dashboard</a>
          <h1 className="text-3xl font-bold mt-3">Your training plan</h1>
          <p className="text-gray-400 mt-1">{plan.summary}</p>
          <p className="text-gray-600 text-xs mt-1">
            Generated {new Date(record.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            · {plan.total_weeks} weeks
          </p>
        </div>

        <div className="space-y-8">
          {plan.weeks.map((week) => (
            <div key={week.week}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-bold text-orange-400">Week {week.week}</span>
                <span className="text-sm text-gray-400">{week.theme}</span>
                <span className="ml-auto text-sm text-gray-500">{week.total_km} km</span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {week.workouts.map((workout) => (
                  <WorkoutCard key={workout.day} workout={workout} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
