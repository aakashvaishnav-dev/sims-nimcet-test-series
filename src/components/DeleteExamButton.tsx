"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteExamButton({ examId }: { examId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    if (!window.confirm("Delete this test and all imported questions? This is allowed only before students have attempts.")) return;
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/admin/exams/${examId}`, { method: "DELETE" });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Could not delete test.");
      router.replace("/admin/exams"); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not delete test."); setLoading(false); }
  }
  return <div><button className="btn btn-danger" disabled={loading} onClick={remove}>{loading ? "Deleting..." : "Delete Empty Test"}</button>{error && <div className="error mt-16">{error}</div>}</div>;
}
