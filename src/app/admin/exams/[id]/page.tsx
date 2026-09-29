import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ImportQuestions } from "@/components/ImportQuestions";
import { ExamPublishButton } from "@/components/ExamPublishButton";
import { EditExamForm } from "@/components/EditExamForm";
import { DeleteExamButton } from "@/components/DeleteExamButton";

export const dynamic = "force-dynamic";

export default async function AdminExamDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createAdminClient();
  const [{ data: exam }, { data: questions }] = await Promise.all([
    db.from("exams").select("*").eq("id", id).single(),
    db.from("questions").select("id,question_number,subject,question_en,correct_option,marks,negative_marks").eq("exam_id", id).order("question_number").limit(25)
  ]);

  if (!exam) return <div className="error">Test not found.</div>;

  return (
    <div>
      <Link className="gold" href="/admin/exams">← Back to Tests</Link>
      <div className="flex justify-between gap-12 mt-16" style={{ alignItems: "start", flexWrap: "wrap" }}>
        <div><div className="eyebrow">Test Management</div><h1 className="page-title" style={{ marginTop: 8 }}>{exam.title}</h1><p className="page-lead">{exam.description || "No description"}</p></div>
        <span className={`badge ${exam.is_published ? "badge-success" : "badge-gold"}`}>{exam.is_published ? "Published" : "Draft"}</span>
      </div>

      <section className="stats">
        <div className="card stat"><div className="stat-label">Questions</div><div className="stat-value">{exam.total_questions}</div></div>
        <div className="card stat"><div className="stat-label">Total Marks</div><div className="stat-value">{Number(exam.total_marks || 0).toFixed(0)}</div></div>
        <div className="card stat"><div className="stat-label">Duration</div><div className="stat-value">{exam.duration_minutes}m</div></div>
        <div className="card stat"><div className="stat-label">Attempts Allowed</div><div className="stat-value">{exam.max_attempts}</div></div>
      </section>

      <div className="admin-detail-grid mt-24">
        <EditExamForm exam={exam} />
        <div className="card card-pad">
          <h3 style={{ marginTop: 0 }}>Publishing & Safety</h3>
          <p className="page-lead">Publish only after validating the imported questions. Tests with student attempts cannot be deleted, so old tests should be unpublished instead.</p>
          <div className="flex gap-12 mt-24" style={{ flexWrap: "wrap" }}>
            <ExamPublishButton examId={exam.id} published={exam.is_published} />
            <DeleteExamButton examId={exam.id} />
          </div>
        </div>
      </div>

      <ImportQuestions examId={exam.id} />

      <section className="card card-pad mt-24">
        <div className="flex justify-between items-center gap-12"><h3 style={{ margin: 0 }}>Imported Questions</h3><span className="help">Showing first 25</span></div>
        <div className="table-wrap mt-24"><table><thead><tr><th>No.</th><th>Subject</th><th>Question</th><th>Answer</th><th>Marks</th></tr></thead><tbody>
          {(questions || []).map((q) => <tr key={q.id}><td>{q.question_number}</td><td>{q.subject}</td><td>{q.question_en}</td><td><span className="badge badge-gold">{q.correct_option}</span></td><td>{Number(q.marks)} / -{Number(q.negative_marks)}</td></tr>)}
          {!questions?.length && <tr><td colSpan={5}>No questions imported yet.</td></tr>}
        </tbody></table></div>
      </section>
    </div>
  );
}
