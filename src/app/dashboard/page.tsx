import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StartExamButton } from "@/components/StartExamButton";
import { requireUser } from "@/lib/auth";

function formatDate(value: string | null) {
  if (!value) return "Open access";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));
}

export default async function DashboardPage() {
  const { user, supabase } = await requireUser();

  const [{ data: profile }, { data: exams }, { data: attempts }] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
    supabase.from("exams").select("id,title,description,duration_minutes,max_attempts,total_questions,total_marks,starts_at,ends_at,is_published").eq("is_published", true).order("created_at", { ascending: false }),
    supabase.from("attempts").select("id,exam_id,status,score,percentage,started_at,submitted_at").eq("student_id", user.id).order("created_at", { ascending: false })
  ]);

  const completed = (attempts || []).filter((a) => a.status !== "in_progress");
  const bestScore = completed.length ? Math.max(...completed.map((a) => Number(a.score || 0))) : 0;
  const avg = completed.length ? completed.reduce((s, a) => s + Number(a.percentage || 0), 0) / completed.length : 0;
  const inProgress = new Map((attempts || []).filter((a) => a.status === "in_progress").map((a) => [a.exam_id, a]));
  const submittedByExam = new Map<string, number>();
  completed.forEach((a) => submittedByExam.set(a.exam_id, (submittedByExam.get(a.exam_id) || 0) + 1));
  const now = Date.now();

  return (
    <>
      <Header />
      <main className="page">
        <div className="container">
          <div className="flex justify-between items-center gap-12" style={{ flexWrap: "wrap" }}>
            <div>
              <div className="eyebrow">Student Dashboard</div>
              <h1 className="page-title" style={{ marginTop: 8 }}>Welcome, {profile?.full_name || "Student"}</h1>
              <p className="page-lead">Choose a test, complete it within the server timer and receive your result instantly.</p>
            </div>
            {profile?.role === "admin" && <Link className="btn btn-secondary" href="/admin">Open Admin Panel</Link>}
          </div>

          <section className="stats">
            <div className="card stat"><div className="stat-label">Tests Completed</div><div className="stat-value">{completed.length}</div></div>
            <div className="card stat"><div className="stat-label">Average Percentage</div><div className="stat-value">{avg.toFixed(1)}%</div></div>
            <div className="card stat"><div className="stat-label">Best Score</div><div className="stat-value">{bestScore.toFixed(0)}</div></div>
            <div className="card stat"><div className="stat-label">Available Tests</div><div className="stat-value">{exams?.length || 0}</div></div>
          </section>

          <div className="section-title">
            <div><h2>Available NIMCET Tests</h2><p>Tests automatically lock when their time window closes.</p></div>
          </div>

          <div className="exam-grid">
            {(exams || []).map((exam) => {
              const active = inProgress.get(exam.id);
              const usedAttempts = submittedByExam.get(exam.id) || 0;
              const notStarted = exam.starts_at && new Date(exam.starts_at).getTime() > now;
              const ended = exam.ends_at && new Date(exam.ends_at).getTime() <= now;
              const maxed = usedAttempts >= exam.max_attempts && !active;
              const disabled = Boolean(notStarted || ended || maxed || exam.total_questions === 0);
              let label = active ? "Resume Test" : "Start Test";
              if (notStarted) label = "Upcoming";
              if (ended) label = "Closed";
              if (maxed) label = "Attempts Used";

              return (
                <article className="card exam-card" key={exam.id}>
                  <div className="flex justify-between gap-12" style={{ alignItems: "start" }}>
                    <div><h3>{exam.title}</h3><p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>{exam.description || "SIMS Raipur NIMCET mock test."}</p></div>
                    {active && <span className="badge badge-gold">In Progress</span>}
                  </div>
                  <div className="exam-meta">
                    <span className="badge">{exam.total_questions} Questions</span>
                    <span className="badge">{exam.duration_minutes} Minutes</span>
                    <span className="badge">{Number(exam.total_marks || 0)} Marks</span>
                    <span className="badge">Attempts {usedAttempts}/{exam.max_attempts}</span>
                  </div>
                  <p className="help">Starts: {formatDate(exam.starts_at)}<br />Closes: {formatDate(exam.ends_at)}</p>
                  <div className="mt-16">
                    <StartExamButton examId={exam.id} disabled={disabled} label={label} />
                  </div>
                </article>
              );
            })}
            {!exams?.length && <div className="card empty">No published tests are available yet.</div>}
          </div>

          {completed.length > 0 && (
            <section className="section" style={{ paddingBottom: 0 }}>
              <div className="section-title"><div><h2>Recent Results</h2><p>Your latest submitted attempts.</p></div></div>
              <div className="table-wrap"><table><thead><tr><th>Test Attempt</th><th>Status</th><th>Score</th><th>Percentage</th><th>Action</th></tr></thead><tbody>
                {completed.slice(0, 10).map((a, i) => <tr key={a.id}><td>Attempt {completed.length - i}</td><td><span className="badge badge-success">{a.status.replace("_", " ")}</span></td><td>{Number(a.score || 0).toFixed(2)}</td><td>{Number(a.percentage || 0).toFixed(2)}%</td><td><Link className="gold" href={`/result/${a.id}`}>View Result</Link></td></tr>)}
              </tbody></table></div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
