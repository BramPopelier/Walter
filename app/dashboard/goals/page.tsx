import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { saveGoal } from "./actions";

export default async function GoalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <a href="/dashboard" className="text-gray-400 hover:text-white text-sm">← Back</a>
          <h1 className="text-3xl font-bold mt-3">Your goal</h1>
          <p className="text-gray-400 mt-1">Tell Walter what you&apos;re training for.</p>
        </div>

        <form action={saveGoal} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">What are you training for?</label>
            <select
              name="race_type"
              defaultValue={existing?.race_type ?? ""}
              required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
            >
              <option value="" disabled>Select race type</option>
              <option value="5K">5K</option>
              <option value="10K">10K</option>
              <option value="Half Marathon">Half Marathon</option>
              <option value="Marathon">Marathon</option>
              <option value="Duathlon">Duathlon</option>
              <option value="Triathlon">Triathlon</option>
              <option value="Trail Run">Trail Run</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Race date</label>
            <input
              name="race_date"
              type="date"
              defaultValue={existing?.race_date ?? ""}
              required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Target time <span className="text-gray-600">(optional)</span></label>
            <input
              name="target_time"
              type="text"
              defaultValue={existing?.target_time ?? ""}
              placeholder="e.g. 1:45:00"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Training days per week</label>
            <select
              name="days_per_week"
              defaultValue={existing?.days_per_week ?? ""}
              required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
            >
              <option value="" disabled>Select days</option>
              {[2,3,4,5,6].map(d => (
                <option key={d} value={d}>{d} days</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Experience level</label>
            <select
              name="experience_level"
              defaultValue={existing?.experience_level ?? ""}
              required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
            >
              <option value="" disabled>Select level</option>
              <option value="Beginner">Beginner — new to structured training</option>
              <option value="Intermediate">Intermediate — some race experience</option>
              <option value="Experienced">Experienced — regular competitor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Preferred long run day</label>
            <select
              name="long_run_day"
              defaultValue={existing?.long_run_day ?? ""}
              required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
            >
              <option value="" disabled>Select day</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Notes for Walter <span className="text-gray-600">(optional)</span></label>
            <textarea
              name="notes"
              defaultValue={existing?.notes ?? ""}
              rows={3}
              placeholder="e.g. prone to knee injury, prefer gradual volume increases, work night shifts on Tuesdays..."
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
          >
            Save goal
          </button>
        </form>
      </div>
    </div>
  );
}
