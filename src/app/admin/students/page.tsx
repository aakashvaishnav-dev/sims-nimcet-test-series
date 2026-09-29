import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  const db = createAdminClient();
  const { data: students } = await db.from("profiles").select("id,full_name,email,phone,created_at").eq("role", "student").order("created_at", { ascending: false }).limit(1000);
  const { data: attempts } = await db.from("attempts").select("student_id,status");
  const counts = new Map<string, { total: number; completed: number }>();
  (attempts || []).forEach((a) => {
    const c = counts.get(a.student_id) || { total: 0, completed: 0 };
    c.total++;
    if (a.status !== "in_progress") c.completed++;
    counts.set(a.student_id, c);
  });

  return (
    <div>
      <div className="eyebrow">Registered Users</div><h1 className="page-title" style={{ marginTop: 8 }}>Students</h1><p className="page-lead">Student accounts created through the SIMS NIMCET portal.</p>
      <div className="table-wrap mt-24"><table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Completed Tests</th><th>Total Attempts</th><th>Joined</th></tr></thead><tbody>
        {(students || []).map((s) => { const c = counts.get(s.id) || { total: 0, completed: 0 }; return <tr key={s.id}><td><strong>{s.full_name || "Student"}</strong></td><td>{s.email || "—"}</td><td>{s.phone || "—"}</td><td>{c.completed}</td><td>{c.total}</td><td>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(s.created_at))}</td></tr>; })}
        {!students?.length && <tr><td colSpan={6}>No students registered yet.</td></tr>}
      </tbody></table></div>
    </div>
  );
}
