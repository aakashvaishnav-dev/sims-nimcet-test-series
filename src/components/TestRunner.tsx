"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AttemptSession, OptionKey, SafeQuestion } from "@/lib/types";
import { MathText } from "@/components/MathText";

const optionKeys: OptionKey[] = ["A", "B", "C", "D"];

function formatTime(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
}

function getOption(q: SafeQuestion, key: OptionKey) {
  const en = q[`option${key}En` as keyof SafeQuestion] as string;
  const hi = q[`option${key}Hi` as keyof SafeQuestion] as string | null | undefined;
  return { en, hi };
}

export function TestRunner({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [session, setSession] = useState<AttemptSession | null>(null);
  const [questions, setQuestions] = useState<SafeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const submittingRef = useRef(false);
  const deadlineRef = useRef(0);
  const hiddenAtRef = useRef<number | null>(null);
  const violationRef = useRef(false);

  const submit = useCallback(async (automatic = false) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSaving(true);
    try {
      const response = await fetch(`/api/attempts/${attemptId}/submit`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not submit test.");
      router.replace(`/result/${attemptId}${automatic ? "?auto=1" : ""}`);
    } catch (err) {
      submittingRef.current = false;
      setError(err instanceof Error ? err.message : "Could not submit test.");
      setSaving(false);
    }
  }, [attemptId, router]);

  useEffect(() => {
    if (!session || session.attempt.status !== "in_progress") return;
    const report = async (event: "hidden" | "visible") => {
      try {
        const r = await fetch(`/api/attempts/${attemptId}/integrity`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event }), cache: "no-store", keepalive: true
        });
        const result = await r.json();
        if (result.terminated) {
          violationRef.current = true;
          router.replace(`/result/${attemptId}?integrity=1`);
        }
      } catch { /* Network problems must not falsely accuse a student. */ }
    };
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        void report("hidden");
      } else if (hiddenAtRef.current !== null) {
        const elapsed = Date.now() - hiddenAtRef.current;
        hiddenAtRef.current = null;
        void report("visible");
        if (elapsed > 2000 && !violationRef.current) {
          violationRef.current = true;
          void submit(true);
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [attemptId, router, session, submit]);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const response = await fetch(`/api/attempts/${attemptId}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load test.");
        if (!alive) return;
        if (data.attempt.status !== "in_progress") {
          router.replace(`/result/${attemptId}`);
          return;
        }
        const serverNow = new Date(data.attempt.serverNow).getTime();
        const expires = new Date(data.attempt.expiresAt).getTime();
        deadlineRef.current = Date.now() + (expires - serverNow);
        setSession(data);
        setQuestions(data.questions || []);
        setRemaining(Math.max(0, Math.floor((deadlineRef.current - Date.now()) / 1000)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load test.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [attemptId, router]);

  useEffect(() => {
    if (!session) return;
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, Math.floor((deadlineRef.current - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds <= 0) {
        window.clearInterval(timer);
        void submit(true);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session, submit]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (session?.attempt.status === "in_progress" && !submittingRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [session]);

  const current = questions[index];
  const progress = questions.length ? ((index + 1) / questions.length) * 100 : 0;
  const counts = useMemo(() => ({
    answered: questions.filter((q) => q.selectedOption).length,
    review: questions.filter((q) => q.markedForReview).length,
    unanswered: questions.filter((q) => !q.selectedOption).length
  }), [questions]);

  async function save(question: SafeQuestion, selectedOption: OptionKey | null, markedForReview: boolean): Promise<boolean> {
    const previous = questions.find((q) => q.id === question.id);
    setSaving(true);
    setError("");
    setQuestions((old) => old.map((q) => q.id === question.id ? { ...q, selectedOption, markedForReview } : q));
    try {
      const response = await fetch(`/api/attempts/${attemptId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, selectedOption, markedForReview })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save answer.");
      if (data.status === "expired" || data.status === "submitted") {
        await submit(true);
        return false;
      }
      return true;
    } catch (err) {
      if (previous) {
        setQuestions((old) => old.map((q) => q.id === question.id ? {
          ...q,
          selectedOption: previous.selectedOption ?? null,
          markedForReview: Boolean(previous.markedForReview)
        } : q));
      }
      setError(err instanceof Error ? err.message : "Could not save answer.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveAndNext() {
    if (!current) return;
    const saved = await save(current, current.selectedOption ?? null, Boolean(current.markedForReview));
    if (saved) setIndex((i) => Math.min(questions.length - 1, i + 1));
  }

  if (loading) return <div className="test-page"><div className="empty">Loading secure test session...</div></div>;
  if (error && !session) return <div className="test-page"><div className="container page"><div className="error">{error}</div></div></div>;
  if (!session || !current) return <div className="test-page"><div className="empty">No questions found for this test.</div></div>;

  return (
    <main className="test-page">
      <header className="test-topbar">
        <div className="test-topbar-brand">
          <span className="test-logo-wrap">
            <Image src="/sims-raipur-logo.png" alt="SIMS Raipur" width={58} height={58} priority />
          </span>
          <div className="test-title-wrap">
            <div className="test-exam-title" title={session.exam.title}>{session.exam.title}</div>
            <div className="test-exam-meta">SIMS RAIPUR • Question {current.number}/{questions.length}</div>
          </div>
        </div>

        <div className="test-topbar-status">
          <div className={`save-indicator ${saving ? "saving" : ""}`}>
            <span className="save-dot" />{saving ? "Saving" : "Saved"}
          </div>
          <div className="test-time-box">
            <div className="test-time-label">Time Left</div>
            <div className={`test-timer ${remaining <= 300 ? "danger" : ""}`}>{formatTime(remaining)}</div>
          </div>
        </div>
      </header>

      <div className="test-progress" aria-label={`Question ${current.number} of ${questions.length}`}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="mobile-test-actions" aria-label="Test actions">
        <button className="btn btn-secondary" disabled={saving} onClick={() => setPaletteOpen(true)}>
          <span aria-hidden="true">▦</span> Questions
        </button>
        <button
          className="btn btn-danger"
          disabled={saving}
          onClick={() => {
            if (window.confirm("Submit the test now? You cannot change answers after submission.")) {
              void submit(false);
            }
          }}
        >
          Submit Test
        </button>
      </div>

      <div className="test-layout">
        <section className="card question-card">
          <div className="question-head">
            <div className="question-label">QUESTION {current.number} OF {questions.length}</div>
            <span className="subject-chip">{current.subject || "NIMCET"}</span>
          </div>
          {error && <div className="error mb-24">{error}</div>}
          <div className="question-text"><MathText text={current.questionEn} /></div>
          {current.questionHi && <div className="question-text hindi"><MathText text={current.questionHi} /></div>}

          <div className="options">
            {optionKeys.map((key) => {
              const value = getOption(current, key);
              const selected = current.selectedOption === key;
              const showHindi = Boolean(value.hi && value.hi.trim() !== value.en.trim());
              return (
                <button
                  key={key}
                  className={`option ${selected ? "selected" : ""}`}
                  disabled={saving}
                  onClick={() => void save(current, key, Boolean(current.markedForReview))}
                >
                  <span className="option-key">{key}</span>
                  <span className="option-content">
                    <MathText text={value.en} />
                    {showHindi && <span className="hindi option-hindi"><MathText text={value.hi} /></span>}
                  </span>
                  <span className="option-check" aria-hidden="true">✓</span>
                </button>
              );
            })}
          </div>

          <div className="question-actions">
            <div className="question-actions-secondary">
              <button className="btn btn-secondary" disabled={saving} onClick={() => void save(current, null, Boolean(current.markedForReview))}>Clear Response</button>
              <button className="btn btn-ghost" disabled={saving} onClick={() => void save(current, current.selectedOption ?? null, !current.markedForReview)}>
                {current.markedForReview ? "Remove Review" : "Mark for Review"}
              </button>
            </div>
            <div className="question-actions-primary">
              <button className="btn btn-secondary" disabled={saving || index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>Previous</button>
              <button className="btn btn-primary" disabled={saving} onClick={() => void saveAndNext()}>{index === questions.length - 1 ? "Save Answer" : "Save & Next"}</button>
            </div>
          </div>
        </section>

        {paletteOpen && <button className="palette-backdrop" aria-label="Close question palette" onClick={() => setPaletteOpen(false)} />}
        <aside className={`card palette ${paletteOpen ? "open" : ""}`}>
          <div className="palette-head">
            <div>
              <strong>Question Palette</strong>
              <div className="help">{counts.answered} answered • {counts.unanswered} unanswered</div>
            </div>
            <button className="palette-close" onClick={() => setPaletteOpen(false)} aria-label="Close question palette">×</button>
          </div>
          <div className="palette-grid">
            {questions.map((q, i) => {
              const status = q.selectedOption && q.markedForReview ? "answered-review" : q.markedForReview ? "review" : q.selectedOption ? "answered" : "";
              return <button key={q.id} className={`palette-btn ${status} ${i === index ? "current" : ""}`} disabled={saving} onClick={() => { setIndex(i); setPaletteOpen(false); }}>{q.number}</button>;
            })}
          </div>
          <div className="palette-legend">
            <div><span className="legend-dot green" />Answered</div>
            <div><span className="legend-dot blue" />Marked for review</div>
            <div><span className="legend-dot gold" />Answered + review</div>
            <div><span className="legend-dot" />Not answered</div>
          </div>
          <div className="palette-submit">
            <button className="btn btn-danger" disabled={saving} onClick={() => { if (window.confirm("Submit the test now? You cannot change answers after submission.")) void submit(false); }}>Submit Test</button>
          </div>
        </aside>
      </div>
    </main>
  );
}
