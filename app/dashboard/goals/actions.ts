"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function saveGoal(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("goals").upsert({
    user_id: user.id,
    race_type: formData.get("race_type") as string,
    race_date: formData.get("race_date") as string,
    target_time: (formData.get("target_time") as string) || null,
    days_per_week: parseInt(formData.get("days_per_week") as string),
    experience_level: formData.get("experience_level") as string,
    notes: (formData.get("notes") as string) || null,
    long_run_day: formData.get("long_run_day") as string,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  redirect("/dashboard");
}
