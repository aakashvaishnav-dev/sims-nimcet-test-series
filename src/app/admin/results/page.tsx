import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizeExpiredAttempts } from "@/lib/finalize";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));
}

export default async function AdminResultsPage() {
  await finalizeExpiredAttempts();
  const db = createAdminClient();
  const { data: attempts } = await db.from("attempts").select("id,exam_id,student_id,status,score,percentage,correct_count,wrong_count,unanswered_count,started_at,submitted_at,time_taken_seconds").order("created_at", { ascending: false }).limit(500);
  const studentIds = [...new Set((attempts || []).map((a) => a.student_id))];
  const examIds = [...new Set((attempts || []).map((a) => a.exam_id))];
  const [{ data: students }, { data: exams }] = await Promise.all([
    studentIds.length ? db.from("profiles").select("id,full_name,email,phone").in("id", studentIds) : Promise.resolve({ data: [] as any[] }),
    examIds.length ? db.from("exams").select("id,title").in("id", examIds) : Promise.resolve({ data: [] as any[] })
  ]);
  const studentMap = new Map((students || []).map((s: any) => [s.id, s]));
  const examMap = new Map((exams || []).map((e: any) => [e.id, e.title]));

  return (
    <div>
      <div className="flex justify-between gap-12" style={{ alignItems: "end", flexWrap: "wrap" }}><div><div className="eyebrow">Student Performance</div><h1 className="page-title" style={{ marginTop: 8 }}>All Test Attempts</h1><p className="page-lead">Live and submitted attempts are visible here. Open a submitted result for full answer review.</p></div><a className="btn btn-secondary" href="/api/admin/results/export">Export CSV</a></div>
      <div className="table-wrap mt-24"><table><thead><tr><th>Student</th><th>Test</th><th>Status</th><th>Score</th><th>Correct / Wrong</th><th>Submitted</th><th>Result</th></tr></thead><tbody>
        {(attempts || []).map((a) => {
          const student: any = studentMap.get(a.student_id);
          return <tr key={a.id}><td><strong>{student?.full_name || "Student"}</strong><div className="help">{student?.email || ""}{student?.phone ? ` • ${student.phone}` : ""}</div></td><td>{examMap.get(a.exam_id) || "Test"}</td><td><span className={`badge ${a.status === "in_progress" ? "badge-gold" : "badge-success"}`}>{a.status.replace("_", " ")}</span></td><td>{a.status === "in_progress" ? "—" : Number(a.score || 0).toFixed(2)}</td><td>{a.status === "in_progress" ? "—" : `${a.correct_count || 0} / ${a.wrong_count || 0}`}</td><td>{formatDate(a.submitted_at)}</td><td>{a.status === "in_progress" ? <span className="muted">Live</span> : <Link className="gold" href={`/result/${a.id}`}>View</Link>}</td></tr>;
        })}
        {!attempts?.length && <tr><td colSpan={7}>No attempts yet.</td></tr>}
      </tbody></table></div>
    </div>
  );
}
