"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ExamPublishButton({ examId, published }: { examId: string; published: boolean }) {
  const router = useRouter(); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function toggle() {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/admin/exams/${examId}/toggle`, { method: "POST" });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Could not update test."); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update test."); } finally { setLoading(false); }
  }
  return <div><button className={`btn ${published ? "btn-secondary" : "btn-primary"}`} onClick={toggle} disabled={loading}>{loading ? "Updating..." : published ? "Unpublish" : "Publish Test"}</button>{error && <div className="error mt-16">{error}</div>}</div>;
}
