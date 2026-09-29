"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ExamForEdit = {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  max_attempts: number;
  default_marks: number;
  default_negative_marks: number;
  starts_at: string | null;
  ends_at: string | null;
};

function localDateTime(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditExamForm({ exam }: { exam: ExamForEdit }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setMessage(""); setError("");
    const payload: Record<string, FormDataEntryValue> = Object.fromEntries(new FormData(e.currentTarget).entries());
    for (const field of ["startsAt", "endsAt"]) {
      const raw = String(payload[field] || "");
      payload[field] = raw ? new Date(raw).toISOString() : "";
    }
    try {
      const r = await fetch(`/api/admin/exams/${exam.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Could not update test.");
      setMessage("Test settings updated."); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update test."); }
    finally { setLoading(false); }
  }

  return (
    <form className="card card-pad" onSubmit={submit}>
      <h3 style={{ marginTop: 0 }}>Test Settings</h3>
      <div className="form-group"><label className="label">Title</label><input className="input" name="title" defaultValue={exam.title} required /></div>
      <div className="form-group"><label className="label">Description</label><textarea className="textarea" name="description" defaultValue={exam.description || ""} /></div>
      <div className="form-row">
        <div className="form-group"><label className="label">Duration (minutes)</label><input className="input" type="number" min="1" name="durationMinutes" defaultValue={exam.duration_minutes} required /></div>
        <div className="form-group"><label className="label">Max Attempts</label><input className="input" type="number" min="1" name="maxAttempts" defaultValue={exam.max_attempts} required /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="label">Default Marks</label><input className="input" type="number" min="0" step="0.01" name="defaultMarks" defaultValue={Number(exam.default_marks)} required /></div>
        <div className="form-group"><label className="label">Default Negative</label><input className="input" type="number" min="0" step="0.01" name="defaultNegativeMarks" defaultValue={Number(exam.default_negative_marks)} required /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="label">Start</label><input className="input" type="datetime-local" name="startsAt" defaultValue={localDateTime(exam.starts_at)} /></div>
        <div className="form-group"><label className="label">Close</label><input className="input" type="datetime-local" name="endsAt" defaultValue={localDateTime(exam.ends_at)} /></div>
      </div>
      {message && <div className="success mb-24">{message}</div>}{error && <div className="error mb-24">{error}</div>}
      <button className="btn btn-secondary" disabled={loading}>{loading ? "Saving..." : "Save Settings"}</button>
    </form>
  );
}
