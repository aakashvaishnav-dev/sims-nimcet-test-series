"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminCreateExamForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    const form = new FormData(e.currentTarget);
    const payload: Record<string, FormDataEntryValue> = Object.fromEntries(form.entries());
    for (const field of ["startsAt", "endsAt"]) {
      const raw = String(payload[field] || "");
      payload[field] = raw ? new Date(raw).toISOString() : "";
    }
    try {
      const response = await fetch("/api/admin/exams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create test.");
      setSuccess("Test created. You can now import questions.");
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create test.");
    } finally { setLoading(false); }
  }

  return (
    <form className="card card-pad" onSubmit={submit}>
      <h3 style={{ marginTop: 0 }}>Create New Test</h3>
      <div className="form-group"><label className="label">Test Title</label><input className="input" name="title" placeholder="NIMCET Mock Test 01" required /></div>
      <div className="form-group"><label className="label">Description</label><textarea className="textarea" name="description" placeholder="Full-length NIMCET practice test" /></div>
      <div className="form-row">
        <div className="form-group"><label className="label">Duration (minutes)</label><input className="input" name="durationMinutes" type="number" min="1" defaultValue="120" required /></div>
        <div className="form-group"><label className="label">Maximum Attempts</label><input className="input" name="maxAttempts" type="number" min="1" defaultValue="1" required /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="label">Default Marks / Question</label><input className="input" name="defaultMarks" type="number" min="0" step="0.01" defaultValue="4" required /></div>
        <div className="form-group"><label className="label">Default Negative Marks</label><input className="input" name="defaultNegativeMarks" type="number" min="0" step="0.01" defaultValue="1" required /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="label">Start Date/Time (optional)</label><input className="input" name="startsAt" type="datetime-local" /></div>
        <div className="form-group"><label className="label">Close Date/Time (optional)</label><input className="input" name="endsAt" type="datetime-local" /></div>
      </div>
      <label className="flex items-center gap-8" style={{ marginBottom: 16 }}><input type="checkbox" name="isPublished" value="true" /> Publish immediately</label>
      {error && <div className="error mb-24">{error}</div>}{success && <div className="success mb-24">{success}</div>}
      <button className="btn btn-primary" disabled={loading}>{loading ? "Creating..." : "Create Test"}</button>
    </form>
  );
}
