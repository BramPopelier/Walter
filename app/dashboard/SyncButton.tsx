"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function sync() {
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/strava/sync", { method: "POST" });
    const data = await res.json();
    if (data.synced !== undefined) {
      setResult(`${data.synced} runs synced`);
      router.refresh();
    } else {
      setResult("Sync failed");
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      {result && <span className="text-sm text-gray-400">{result}</span>}
      <button
        onClick={sync}
        disabled={loading}
        className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
      >
        {loading ? "Syncing..." : "Sync runs"}
      </button>
    </div>
  );
}
