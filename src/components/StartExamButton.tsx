"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StartExamButton({ examId, disabled = false, label = "Start Test" }: { examId: string; disabled?: boolean; label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/attempts/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to start test.");
      router.push(`/test/${data.attemptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start test.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="btn btn-primary" disabled={disabled || loading} onClick={start}>
        {loading ? "Starting..." : label}
      </button>
      {error && <div className="error mt-16">{error}</div>}
    </div>
  );
}
