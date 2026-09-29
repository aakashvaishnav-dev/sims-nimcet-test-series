import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { requireUser } from "@/lib/auth";
import { MathText } from "@/components/MathText";

function timeText(seconds: number) {
  const s = Math.max(0, seconds || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h ? `${h}h ` : ""}${m}m ${sec}s`;
}

export const dynamic = "force-dynamic";

export default async function ResultPage({ params, searchParams }: { params: Promise<{ attemptId: string }>; searchParams: Promise<{ auto?: string }> }) {
  const { supabase } = await requireUser();
  const { attemptId } = await params;
  const query = await searchParams;
  const { data, error } = await supabase.rpc("get_attempt_result", { p_attempt_id: attemptId });

  if (error || !data) {
    return <><Header /><main className="page"><div className="container"><div className="error">{error?.message || "Result is not available."}</div><Link className="btn btn-secondary mt-24" href="/dashboard">Back to Dashboard</Link></div></main><Footer /></>;
  }

  const result = data as any;
  const attempt = result.attempt;
  const questions = (result.questions || []) as any[];
  const subjectMap = new Map<string, { total: number; correct: number; wrong: number; unanswered: number; score: number; maxMarks: number }>();
  for (const q of questions) {
    const key = q.subject || "General";
    const row = subjectMap.get(key) || { total: 0, correct: 0, wrong: 0, unanswered: 0, score: 0, maxMarks: 0 };
    row.total += 1;
    row.maxMarks += Number(q.marks || 0);
    if (!q.selectedOption) row.unanswered += 1;
    else if (q.selectedOption === q.correctOption) { row.correct += 1; row.score += Number(q.marks || 0); }
    else { row.wrong += 1; row.score -= Number(q.negativeMarks || 0); }
    subjectMap.set(key, row);
  }
  const subjectRows = [...subjectMap.entries()];

  return (
    <>
      <Header />
      <main className="page">
        <div className="container">
          {query.auto === "1" && <div className="success mb-24">Time ended and your test was submitted automatically.</div>}
          <section className="card result-hero">
            <div>
              <div className="eyebrow">Test Result</div>
              <h1 className="page-title" style={{ marginTop: 8 }}>{result.exam.title}</h1>
              <p className="page-lead">Completed in {timeText(attempt.timeTakenSeconds)} • Rank {attempt.rank} of {attempt.participants}</p>
            </div>
            <div><div className="help">Score</div><div className="score">{Number(attempt.score || 0).toFixed(2)}</div><div className="help">out of {Number(result.exam.totalMarks || 0).toFixed(2)}</div></div>
          </section>

          <section className="stats">
            <div className="card stat"><div className="stat-label">Correct</div><div className="stat-value">{attempt.correctCount}</div></div>
            <div className="card stat"><div className="stat-label">Wrong</div><div className="stat-value">{attempt.wrongCount}</div></div>
            <div className="card stat"><div className="stat-label">Unanswered</div><div className="stat-value">{attempt.unansweredCount}</div></div>
            <div className="card stat"><div className="stat-label">Percentage</div><div className="stat-value">{Number(attempt.percentage || 0).toFixed(2)}%</div></div>
          </section>

          <div className="flex gap-12 mb-24" style={{ flexWrap: "wrap" }}>
            <Link className="btn btn-primary" href="/dashboard">Back to Tests</Link>
          </div>

          {subjectRows.length > 1 && (
            <section className="card card-pad mb-24">
              <div className="section-title" style={{ marginBottom: 18 }}><div><h2 style={{ fontSize: 26 }}>Subject-wise Analysis</h2><p>Score and accuracy breakdown by imported subject/section.</p></div></div>
              <div className="table-wrap"><table><thead><tr><th>Subject</th><th>Questions</th><th>Correct</th><th>Wrong</th><th>Unanswered</th><th>Score</th></tr></thead><tbody>
                {subjectRows.map(([subject, row]) => <tr key={subject}><td><strong>{subject}</strong></td><td>{row.total}</td><td>{row.correct}</td><td>{row.wrong}</td><td>{row.unanswered}</td><td>{row.score.toFixed(2)} / {row.maxMarks.toFixed(2)}</td></tr>)}
              </tbody></table></div>
            </section>
          )}

          <div className="section-title"><div><h2>Answer Review</h2><p>Correct answers are shown only after the attempt has been submitted.</p></div></div>
          {questions.map((q) => {
            const isCorrect = q.selectedOption && q.selectedOption === q.correctOption;
            return (
              <article className="card result-question" key={q.id}>
                <div className="question-label">QUESTION {q.number} • {q.subject}</div>
                <div style={{ lineHeight: 1.65 }}><MathText text={q.questionEn} /></div>
                {q.questionHi && <div className="hindi" style={{ lineHeight: 1.65 }}><MathText text={q.questionHi} /></div>}
                <div className="answer-row">
                  <span className={`answer-chip ${q.selectedOption ? (isCorrect ? "correct" : "wrong") : ""}`}>Your Answer: {q.selectedOption || "Not Answered"}</span>
                  <span className="answer-chip correct">Correct: {q.correctOption}</span>
                </div>
                {(q.explanationEn || q.explanationHi) && <div className="muted" style={{ marginTop: 12, lineHeight: 1.65 }}><strong className="gold">Explanation:</strong> <MathText text={q.explanationEn} />{q.explanationHi && <><br /><MathText text={q.explanationHi} /></>}</div>}
              </article>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
