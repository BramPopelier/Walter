import { createClient } from "@/lib/supabase/server";

export async function getValidStravaToken(userId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data: conn } = await supabase
    .from("strava_connections")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single();

  if (!conn) return null;

  // If token is still valid (with 5 min buffer), return it
  if (conn.expires_at > Math.floor(Date.now() / 1000) + 300) {
    return conn.access_token;
  }

  // Refresh the token
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: conn.refresh_token,
    }),
  });

  if (!res.ok) return null;

  const refreshed = await res.json();

  await supabase
    .from("strava_connections")
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: refreshed.expires_at,
    })
    .eq("user_id", userId);

  return refreshed.access_token;
}
