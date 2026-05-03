"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const thinkingMessages = [
  "Walter is reviewing your Strava...",
  "Walter is judging your easy pace...",
  "Walter is calculating your pain threshold...",
  "Walter is consulting the ancient scrolls...",
  "Walter is questioning your life choices...",
  "Walter is building something beautiful...",
];

export default function GeneratePlanButton({ disabled, label }: { disabled: boolean; label?: string }) {
  const [loading, setLoading] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % thinkingMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  async function generate() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/plan/generate", { method: "POST" });
    const data = await res.json();
    if (data.planId) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-sm text-red-400">{error}</span>}
      <button
        onClick={generate}
        disabled={disabled || loading}
        className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm whitespace-nowrap"
      >
        {loading ? thinkingMessages[msgIndex] : (label ?? "Generate plan")}
      </button>
    </div>
  );
}
