"use client";

import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Preview = {
  questionCount: number;
  errors: string[];
  warnings: string[];
  sample: Array<Record<string, unknown>>;
};

export function ImportQuestions({ examId }: { examId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"append" | "replace">("replace");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function chooseFile(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] || null);
    setPreview(null); setMessage(""); setError("");
  }

  async function request(action: "preview" | "import") {
    if (!file) { setError("Select a question file first."); return; }
    if (action === "import" && !preview) { setError("Validate & Preview your file before importing."); return; }
    if (action === "import" && preview?.warnings.length && !window.confirm(`There are ${preview.warnings.length} warning(s). Some questions may be skipped. Import ${preview.questionCount} supported questions?`)) return;
    if (action === "import" && mode === "replace" && !window.confirm("Replace will delete this test's existing questions. Continue?")) return;
    setLoading(true); setError(""); setMessage("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("action", action);
      form.append("mode", mode);
      const response = await fetch(`/api/admin/exams/${examId}/import`, { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Import request failed.");
      if (action === "preview") setPreview(data);
      else {
        setMessage(`${data.inserted} questions imported successfully${data.skippedDuplicates ? ` • ${data.skippedDuplicates} duplicate(s) skipped` : ""}.`);
        setPreview(null); setFile(null);
        const input = document.getElementById("question-file") as HTMLInputElement | null;
        if (input) input.value = "";
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally { setLoading(false); }
  }

  return (
    <section className="card card-pad">
      <div className="flex justify-between items-center gap-12" style={{ flexWrap: "wrap" }}>
        <div><h3 style={{ margin: 0 }}>Import Questions</h3><p className="help">Supported: XLSX, XLS, CSV and DOCX (Q1., (1)-(4), Answer, Explanation). Maximum file size: 4 MB. Validate first; image-only and multi-answer questions are flagged.</p></div>
        <a className="btn btn-secondary btn-sm" href="/question-import-template.csv" download>Download Template</a>
      </div>

      <div className="dropzone mt-24">
        <input id="question-file" type="file" accept=".xlsx,.xls,.csv,.docx" onChange={chooseFile} />
        <p className="help">{file ? `Selected: ${file.name}` : "Choose your prepared question file."}</p>
      </div>

      <div className="form-row mt-16">
        <label className="card card-pad" style={{ padding: 14 }}><input type="radio" checked={mode === "replace"} onChange={() => { setMode("replace"); setPreview(null); }} /> <strong>Replace</strong><div className="help">Delete old questions and make this file the complete test.</div></label>
        <label className="card card-pad" style={{ padding: 14 }}><input type="radio" checked={mode === "append"} onChange={() => { setMode("append"); setPreview(null); }} /> <strong>Append</strong><div className="help">Keep existing questions and add new unique questions at the end.</div></label>
      </div>

      {error && <div className="error mt-16">{error}</div>}
      {message && <div className="success mt-16">{message}</div>}

      <div className="flex gap-8 mt-16" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-secondary" disabled={!file || loading} onClick={() => void request("preview")}>{loading ? "Reading..." : "Validate & Preview"}</button>
        <button className="btn btn-primary" disabled={!file || loading || !preview || preview.questionCount === 0 || Boolean(preview.errors.length)} onClick={() => void request("import")}>{loading ? "Importing..." : "Import to Test"}</button>
      </div>

      {preview && (
        <div className="mt-24">
          <div className="flex gap-8" style={{ flexWrap: "wrap" }}><span className="badge badge-gold">{preview.questionCount} valid questions</span><span className={`badge ${preview.errors.length ? "badge-danger" : "badge-success"}`}>{preview.errors.length} errors</span><span className="badge">{preview.warnings.length} warnings</span></div>
          {preview.errors.length > 0 && <div className="error mt-16">{preview.errors.slice(0, 20).map((e) => <div key={e}>• {e}</div>)}</div>}
          {preview.warnings.length > 0 && <div className="card card-pad mt-16" style={{ padding: 14 }}>{preview.warnings.slice(0, 20).map((w) => <div className="help" key={w}>• {w}</div>)}</div>}
          <div className="preview-list">
            {preview.sample.map((q, i) => <div className="preview-item" key={i}><strong>Q{i + 1}.</strong> {String(q.question_en || "").replace(/\[\[IMAGE:[^\]]+\]\]/g, "[Diagram attached]").slice(0, 450)}<div className="help mt-16">A. {String(q.option_a_en || "")} &nbsp; B. {String(q.option_b_en || "")} &nbsp; C. {String(q.option_c_en || "")} &nbsp; D. {String(q.option_d_en || "")}</div><div className="help">Correct: {String(q.correct_option || "")}</div></div>)}
          </div>
        </div>
      )}
    </section>
  );
}
