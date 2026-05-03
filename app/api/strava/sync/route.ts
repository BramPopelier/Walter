import { createClient } from "@/lib/supabase/server";
import { getValidStravaToken } from "@/lib/strava";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = await getValidStravaToken(user.id);
  if (!token) return NextResponse.json({ error: "No Strava connection" }, { status: 400 });

  // Remove runs older than 365 days from the database
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("runs").delete().eq("user_id", user.id).lt("start_date", cutoff);

  // Fetch last 365 days of activities with pagination
  const after = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60;
  const activities = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=200&after=${after}&page=${page}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return NextResponse.json({ error: "Strava fetch failed" }, { status: 500 });
    const batch = await res.json();
    if (!batch.length) break;
    activities.push(...batch);
    if (batch.length < 200) break;
    page++;
  }

  // Filter to runs only and map to our schema
  const runs = activities
    .filter((a: { type: string }) => a.type === "Run")
    .map((a: {
      id: number;
      name: string;
      distance: number;
      moving_time: number;
      average_heartrate?: number;
      start_date: string;
      type: string;
      average_speed?: number;
      max_heartrate?: number;
      total_elevation_gain?: number;
    }) => ({
      user_id: user.id,
      strava_activity_id: a.id,
      name: a.name,
      distance: a.distance,
      moving_time: a.moving_time,
      average_heartrate: a.average_heartrate ?? null,
      max_heartrate: a.max_heartrate ?? null,
      average_speed: a.average_speed ?? null,
      total_elevation_gain: a.total_elevation_gain ?? null,
      start_date: a.start_date,
      type: a.type,
    }));

  if (runs.length > 0) {
    await supabase
      .from("runs")
      .upsert(runs, { onConflict: "strava_activity_id" });
  }

  return NextResponse.json({ synced: runs.length });
}
