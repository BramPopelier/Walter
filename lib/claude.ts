import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type Workout = {
  day: string;
  type: "Easy Run" | "Tempo Run" | "Intervals" | "Long Run" | "Rest" | "Cross Training";
  distance_km?: number;
  pace_min_per_km?: string;
  description: string;
};

export type WeekPlan = {
  week: number;
  theme: string;
  total_km: number;
  workouts: Workout[];
};

export type TrainingPlan = {
  summary: string;
  total_weeks: number;
  weeks: WeekPlan[];
};

type GoalInput = {
  race_type: string;
  race_date: string;
  target_time: string | null;
  days_per_week: number;
  experience_level: string;
  long_run_day: string;
  notes: string | null;
};

type StravaStats = {
  run_count: number;
  avg_weekly_km: number;
  longest_run_km: number;
  avg_pace_min_per_km: string;
  avg_heartrate: number | null;
  recent_weeks: { week: string; km: number; runs: number }[];
};

export async function generateTrainingPlan(
  goal: GoalInput,
  stats: StravaStats
): Promise<TrainingPlan> {
  const weeksUntilRace = Math.round(
    (new Date(goal.race_date).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)
  );

  const systemPrompt = `You are Walter, an experienced running coach. You create structured,
realistic training plans based on the athlete's current fitness and goals.
You always respond with valid JSON matching the exact schema provided. No markdown, no explanation — only JSON.`;

  const userPrompt = `Create a ${weeksUntilRace}-week training plan for this athlete.

GOAL:
- Race: ${goal.race_type}
- Race date: ${goal.race_date} (${weeksUntilRace} weeks away)
- Target time: ${goal.target_time ?? "not specified — focus on completion"}
- Training days per week: ${goal.days_per_week}
- Experience: ${goal.experience_level}
- Preferred long run day: ${goal.long_run_day}
- Athlete notes: ${goal.notes ?? "none"}

CURRENT FITNESS (from Strava, last 365 days):
- Runs in last year: ${stats.run_count}
- Average weekly volume: ${stats.avg_weekly_km} km/week
- Longest recent run: ${stats.longest_run_km} km
- Average pace: ${stats.avg_pace_min_per_km} min/km
- Average heart rate: ${stats.avg_heartrate ? `${stats.avg_heartrate} bpm` : "not available"}
- Recent weeks: ${stats.recent_weeks.map(w => `${w.week}: ${w.km}km (${w.runs} runs)`).join(", ")}

Respond ONLY with JSON matching this exact schema:
{
  "summary": "one sentence describing the plan",
  "total_weeks": ${weeksUntilRace},
  "weeks": [
    {
      "week": 1,
      "theme": "Base building",
      "total_km": 32,
      "workouts": [
        {
          "day": "Monday",
          "type": "Rest",
          "description": "Rest day"
        },
        {
          "day": "Tuesday",
          "type": "Easy Run",
          "distance_km": 8,
          "pace_min_per_km": "6:00",
          "description": "Easy aerobic run at conversational pace"
        }
      ]
    }
  ]
}

Rules:
- Include all 7 days for each week, mark non-training days as Rest
- Use the athlete's long run day for the long run each week
- Respect the days_per_week limit for actual training sessions
- Build volume progressively with a cutback week every 4th week
- Include a 2-3 week taper before the race
- Pace targets should be realistic based on current fitness
- Take the athlete notes seriously (injuries, preferences)`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";
  const text = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(text) as TrainingPlan;
}
