import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const WALTER_WAITING = [
  "Walter is reviewing your application. He's very thorough.",
  "Walter is checking if you can handle his training plans.",
  "Walter is Googling your Strava profile as we speak.",
  "Walter has seen your recent splits. He's... considering.",
  "Walter is deciding if you deserve his wisdom.",
];

export default async function PendingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // If somehow already approved, send to dashboard
  const { data: profile } = await supabase
    .from("profiles")
    .select("approved")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.approved) redirect("/dashboard");

  const msg = WALTER_WAITING[Math.floor(Math.random() * WALTER_WAITING.length)];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-3xl mx-auto mb-6">
          ⏳
        </div>
        <h1 className="text-2xl font-bold mb-2">Pending approval</h1>
        <p className="text-gray-500 text-sm mb-8 italic leading-relaxed">
          &ldquo;{msg}&rdquo;
        </p>
        <p className="text-gray-600 text-xs">
          Signed in as {user.email}
        </p>
        <form action="/api/auth/signout" method="POST" className="mt-4">
          <button className="text-xs text-gray-600 hover:text-gray-400 transition-colors underline">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
