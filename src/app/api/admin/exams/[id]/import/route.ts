import { NextResponse } from "next/server";
import { getApiAdmin } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseQuestionFile, type ImportedQuestion } from "@/lib/import/parse";

export const runtime = "nodejs";

function fingerprint(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9\u0900-\u097f ]/g, "").trim();
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getApiAdmin())) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const { id } = await params;
  const form = await request.formData();
  const file = form.get("file");
  const action = form.get("action") === "import" ? "import" : "preview";
  const mode = form.get("mode") === "append" ? "append" : "replace";

  if (!(file instanceof File)) return NextResponse.json({ error: "Question file is required." }, { status: 400 });
  if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: "File is larger than 4 MB." }, { status: 400 });

  const parsed = await parseQuestionFile(file);
  const warnings: string[] = [];

  const seen = new Set<string>();
  const unique: ImportedQuestion[] = [];
  let duplicateInFile = 0;
  for (const q of parsed.questions) {
    const fp = fingerprint(q.question_en);
    if (seen.has(fp)) { duplicateInFile++; continue; }
    seen.add(fp); unique.push(q);
  }
  if (duplicateInFile) warnings.push(`${duplicateInFile} duplicate question(s) inside the uploaded file will be skipped.`);

  if (action === "preview") {
    return NextResponse.json({ questionCount: unique.length, errors: parsed.errors, warnings, sample: unique.slice(0, 10) });
  }

  if (parsed.errors.length) {
    return NextResponse.json({ error: `Import stopped because validation found ${parsed.errors.length} error(s). Preview the file and correct them first.` }, { status: 400 });
  }
  if (!unique.length) return NextResponse.json({ error: "No valid questions were found." }, { status: 400 });

  const db = createAdminClient();
  const { data: exam, error: examError } = await db.from("exams").select("id").eq("id", id).single();
  if (examError || !exam) return NextResponse.json({ error: "Test not found." }, { status: 404 });

  let filtered = unique;
  let skippedExisting = 0;
  if (mode === "append") {
    const { data: existing } = await db.from("questions").select("question_en").eq("exam_id", id);
    const existingSet = new Set((existing || []).map((q) => fingerprint(q.question_en)));
    filtered = unique.filter((q) => {
      if (existingSet.has(fingerprint(q.question_en))) { skippedExisting++; return false; }
      return true;
    });
  }

  if (!filtered.length) return NextResponse.json({ inserted: 0, skippedDuplicates: duplicateInFile + skippedExisting });

  const payload = filtered.map((q, index) => ({ ...q, question_number: index + 1 }));
  const { data, error } = await db.rpc("admin_import_questions", {
    p_exam_id: id,
    p_questions: payload,
    p_replace: mode === "replace"
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ inserted: Number((data as any)?.inserted || filtered.length), skippedDuplicates: duplicateInFile + skippedExisting, mode });
}
