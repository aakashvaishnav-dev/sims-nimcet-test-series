import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizeExpiredAttempts } from "@/lib/finalize";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await finalizeExpiredAttempts();
  const db = createAdminClient();
  const [students, exams, attempts, inProgress] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    db.from("exams").select("id", { count: "exact", head: true }),
    db.from("attempts").select("id", { count: "exact", head: true }).in("status", ["submitted", "auto_submitted"]),
    db.from("attempts").select("id", { count: "exact", head: true }).eq("status", "in_progress")
  ]);

  return (
    <div>
      <div className="eyebrow">SIMS Administration</div>
      <h1 className="page-title" style={{ marginTop: 8 }}>NIMCET Test Series Dashboard</h1>
      <p className="page-lead">Create tests, import questions and monitor student attempts from one place.</p>
      <section className="stats">
        <div className="card stat"><div className="stat-label">Students</div><div className="stat-value">{students.count || 0}</div></div>
        <div className="card stat"><div className="stat-label">Tests</div><div className="stat-value">{exams.count || 0}</div></div>
        <div className="card stat"><div className="stat-label">Submitted</div><div className="stat-value">{attempts.count || 0}</div></div>
        <div className="card stat"><div className="stat-label">In Progress</div><div className="stat-value">{inProgress.count || 0}</div></div>
      </section>
      <div className="grid-3">
        <Link href="/admin/exams" className="card feature-card"><div className="feature-icon">↥</div><h3>Import Questions</h3><p>Upload XLSX, CSV or DOCX and automatically attach questions to a selected test.</p></Link>
        <Link href="/admin/results" className="card feature-card"><div className="feature-icon">▤</div><h3>Student Results</h3><p>Check score, status, time taken and completed attempts.</p></Link>
        <Link href="/admin/students" className="card feature-card"><div className="feature-icon">◎</div><h3>Students</h3><p>View registered student accounts and contact details.</p></Link>
      </div>
    </div>
  );
}
