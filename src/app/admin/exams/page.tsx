import Link from "next/link";
import { AdminCreateExamForm } from "@/components/AdminCreateExamForm";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminExamsPage() {
  const db = createAdminClient();
  const { data: exams } = await db.from("exams").select("id,title,duration_minutes,total_questions,total_marks,is_published,created_at").order("created_at", { ascending: false });
  return (
    <div>
      <div className="eyebrow">Tests & Import</div><h1 className="page-title" style={{ marginTop: 8 }}>Manage NIMCET Tests</h1><p className="page-lead">Create the test first, then open it and import the question file.</p>
      <div className="admin-exams-grid">
        <div>
          <div className="card card-pad">
            <div className="flex justify-between items-center gap-12"><h3 style={{ margin: 0 }}>Existing Tests</h3><a className="btn btn-secondary btn-sm" href="/question-import-template.csv" download>Download CSV Template</a></div>
            <div className="table-wrap mt-24"><table><thead><tr><th>Test</th><th>Questions</th><th>Duration</th><th>Status</th><th></th></tr></thead><tbody>
              {(exams || []).map((exam) => <tr key={exam.id}><td><strong>{exam.title}</strong></td><td>{exam.total_questions}</td><td>{exam.duration_minutes} min</td><td><span className={`badge ${exam.is_published ? "badge-success" : ""}`}>{exam.is_published ? "Published" : "Draft"}</span></td><td><Link className="gold" href={`/admin/exams/${exam.id}`}>Open</Link></td></tr>)}
              {!exams?.length && <tr><td colSpan={5}>No tests created yet.</td></tr>}
            </tbody></table></div>
          </div>
        </div>
        <AdminCreateExamForm />
      </div>
    </div>
  );
}
