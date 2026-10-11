import * as XLSX from "xlsx";
import mammoth from "mammoth";

export type ImportedQuestion = {
  question_number?: number;
  subject: string;
  question_en: string;
  question_hi?: string | null;
  option_a_en: string;
  option_a_hi?: string | null;
  option_b_en: string;
  option_b_hi?: string | null;
  option_c_en: string;
  option_c_hi?: string | null;
  option_d_en: string;
  option_d_hi?: string | null;
  correct_option: "A" | "B" | "C" | "D";
  explanation_en?: string | null;
  explanation_hi?: string | null;
  marks?: number;
  negative_marks?: number;
};

export type ParseResult = {
  questions: ImportedQuestion[];
  errors: string[];
  warnings: string[];
};

function clean(value: unknown): string {
  return String(value ?? "").replace(/\u00a0/g, " ").trim();
}

function key(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function nullable(value: unknown) {
  const text = clean(value);
  return text || null;
}

function numberOrUndefined(value: unknown) {
  const text = clean(value);
  if (!text) return undefined;
  const n = Number(text);
  return Number.isFinite(n) ? n : undefined;
}

function pick(row: Record<string, unknown>, aliases: string[]) {
  const normalized = new Map(Object.entries(row).map(([k, v]) => [key(k), v]));
  for (const alias of aliases) {
    const found = normalized.get(key(alias));
    if (found !== undefined && clean(found) !== "") return found;
  }
  return undefined;
}

const aliases = {
  number: ["question_number", "question no", "question no.", "qno", "q no", "no", "number", "serial no"],
  subject: ["subject", "section", "topic"],
  questionEn: ["question_english", "question english", "question_en", "question en", "question", "english question"],
  questionHi: ["question_hindi", "question hindi", "question_hi", "question hi", "hindi question"],
  aEn: ["option_a_english", "option a english", "option_a_en", "option a en", "option_a", "option a", "a english", "a"],
  aHi: ["option_a_hindi", "option a hindi", "option_a_hi", "option a hi", "a hindi"],
  bEn: ["option_b_english", "option b english", "option_b_en", "option b en", "option_b", "option b", "b english", "b"],
  bHi: ["option_b_hindi", "option b hindi", "option_b_hi", "option b hi", "b hindi"],
  cEn: ["option_c_english", "option c english", "option_c_en", "option c en", "option_c", "option c", "c english", "c"],
  cHi: ["option_c_hindi", "option c hindi", "option_c_hi", "option c hi", "c hindi"],
  dEn: ["option_d_english", "option d english", "option_d_en", "option d en", "option_d", "option d", "d english", "d"],
  dHi: ["option_d_hindi", "option d hindi", "option_d_hi", "option d hi", "d hindi"],
  answer: ["answer", "correct answer", "correct_answer", "correct option", "correct_option"],
  explanationEn: ["explanation_english", "explanation english", "explanation_en", "explanation", "solution english", "solution"],
  explanationHi: ["explanation_hindi", "explanation hindi", "explanation_hi", "solution hindi"],
  marks: ["marks", "mark", "positive marks", "positive_marks"],
  negative: ["negative_marks", "negative marks", "negative", "negative marking", "negative_marking"]
};

function normalizeAnswer(value: unknown): "A" | "B" | "C" | "D" | null {
  const text = clean(value).toUpperCase();
  if (/\b(?:AND|OR)\b|[,;+]/.test(text) && /[A-D]/.test(text)) return null;
  const match = text.match(/^\(?([ABCD])\)?(?:\s|$)/);
  if (/^[1-4]$/.test(text.replace(/[().\s]/g, ""))) return "ABCD"[Number(text.replace(/[().\s]/g, "")) - 1] as "A" | "B" | "C" | "D";
  return match ? (match[1] as "A" | "B" | "C" | "D") : null;
}

function validateQuestion(q: Partial<ImportedQuestion>, index: number, errors: string[]) {
  const label = q.question_number ? `Question ${q.question_number}` : `Row ${index + 1}`;
  if (!clean(q.question_en)) errors.push(`${label}: English question is missing.`);
  if (!clean(q.option_a_en)) errors.push(`${label}: Option A is missing.`);
  if (!clean(q.option_b_en)) errors.push(`${label}: Option B is missing.`);
  if (!clean(q.option_c_en)) errors.push(`${label}: Option C is missing.`);
  if (!clean(q.option_d_en)) errors.push(`${label}: Option D is missing.`);
  if (!q.correct_option) errors.push(`${label}: Correct answer (A/B/C/D) is missing or invalid.`);
}

function rowsToQuestions(rows: Record<string, unknown>[]): ParseResult {
  const errors: string[] = [];
  const questions: ImportedQuestion[] = [];

  rows.forEach((row, index) => {
    const answer = normalizeAnswer(pick(row, aliases.answer));
    const draft: Partial<ImportedQuestion> = {
      question_number: numberOrUndefined(pick(row, aliases.number)),
      subject: clean(pick(row, aliases.subject)) || "General",
      question_en: clean(pick(row, aliases.questionEn)),
      question_hi: nullable(pick(row, aliases.questionHi)),
      option_a_en: clean(pick(row, aliases.aEn)),
      option_a_hi: nullable(pick(row, aliases.aHi)),
      option_b_en: clean(pick(row, aliases.bEn)),
      option_b_hi: nullable(pick(row, aliases.bHi)),
      option_c_en: clean(pick(row, aliases.cEn)),
      option_c_hi: nullable(pick(row, aliases.cHi)),
      option_d_en: clean(pick(row, aliases.dEn)),
      option_d_hi: nullable(pick(row, aliases.dHi)),
      correct_option: answer ?? undefined,
      explanation_en: nullable(pick(row, aliases.explanationEn)),
      explanation_hi: nullable(pick(row, aliases.explanationHi)),
      marks: numberOrUndefined(pick(row, aliases.marks)),
      negative_marks: numberOrUndefined(pick(row, aliases.negative))
    };

    validateQuestion(draft, index, errors);
    if (
      draft.question_en && draft.option_a_en && draft.option_b_en &&
      draft.option_c_en && draft.option_d_en && draft.correct_option
    ) {
      questions.push(draft as ImportedQuestion);
    }
  });

  return { questions, errors, warnings: [] };
}

function appendField(target: Record<string, string>, field: string, value: string) {
  if (!value) return;
  target[field] = target[field] ? `${target[field]}\n${value}` : value;
}

// DOCX question-paper format: Q1. ..., (1)-(4), Answer: (3), Explanation: ...
// Also supports template-style question/option labels.
function parseDocxText(text: string): ParseResult {
  const records: Record<string, string>[] = [];
  const warnings: string[] = [];
  let current: Record<string, string> | null = null;
  let field = "question_en";
  let inExplanation = false;
  const add = (value: string) => {
    if (!current || !value.trim()) return;
    appendField(current, field, value.trim());
  };
  const finish = () => {
    if (current?.question_en) records.push(current);
    current = null;
    field = "question_en";
    inExplanation = false;
  };
  const fields: Array<[RegExp, string]> = [
    [/^question\s*(?:english|en)\s*:\s*/i, "question_en"],
    [/^question\s*(?:hindi|hi)\s*:\s*/i, "question_hi"],
    [/^subject\s*:\s*/i, "subject"],
    [/^(?:option\s*)?([A-D])\s*(?:english|en)\s*:\s*/i, ""],
    [/^(?:expected\s*answer|correct\s*(?:option|answer)|answer|उत्तर)\s*:\s*/i, "answer"],
    [/^(?:explanation|solution)(?:\s*(?:english|en))?\s*:\s*/i, "explanation_en"],
    [/^(?:explanation|solution)\s*(?:hindi|hi)\s*:\s*/i, "explanation_hi"],
    [/^marks\s*:\s*/i, "marks"],
    [/^negative\s*(?:marks|marking)?\s*:\s*/i, "negative_marks"]
  ];
  for (const original of text.replace(/\r/g, "").split("\n")) {
    const line = original.trim();
    if (!line) continue;
    const question = line.match(/^(?:Q(?:uestion)?\s*)?(\d{1,4})[.)]\s+(.+)$/i);
    if (question && (line.toLowerCase().startsWith("q") || !current || Boolean(current.answer))) {
      finish();
      current = { question_number: question[1], subject: "Life Science", question_en: question[2] };
      continue;
    }
    if (!current) continue; // Ignore title, subtitle, headers and front matter.
    // Source session/year tags are metadata rather than a separate question.
    if (/^(?:JAN|FEB|MAR|APR|MAY|JUNE?|JULY?|AUG|SEPT?|OCT|NOV|DEC)\s+20\d\d(?:[-\s].*)?$/i.test(line)) continue;
    // Recognize BOTH (1)-(4) and A.-D. choices without confusing Q numbering.
    const option = line.match(/^\(?([1-4])\)[.)]?\s*(.+)$/) || line.match(/^([A-D])[.)]\s+(.+)$/i);
    if (option && !inExplanation) {
      field = `option_${/^[1-4]$/.test(option[1]) ? "abcd"[Number(option[1])-1] : option[1].toLowerCase()}_en`;
      add(option[2]);
      continue;
    }
    let matched = false;
    const labelledOption = line.match(/^(?:option\s*)?([A-D])\s*(?:english|en|hindi|hi)\s*:\s*(.*)$/i);
    if (labelledOption) {
      field = `option_${labelledOption[1].toLowerCase()}_${/hindi|hi/i.test(line.split(":")[0]) ? "hi" : "en"}`;
      add(labelledOption[2]);
      continue;
    }
    for (const [pattern, destination] of fields) {
      if (destination && pattern.test(line)) {
        field = destination;
        add(line.replace(pattern, ""));
        if (destination === "explanation_en" || destination === "explanation_hi") inExplanation = true;
        matched = true;
        break;
      }
    }
    if (!matched) add(line);
  }
  finish();
  const usable = records.filter((r) => {
    const missing = ["option_a_en","option_b_en","option_c_en","option_d_en"].filter((k) => !r[k]);
    if (missing.length) {
      warnings.push(`Question ${r.question_number}: ${missing.join(", ")} unavailable. Image-only options or non-MCQ questions need manual conversion before import; skipped.`);
      return false;
    }
    if (!normalizeAnswer(r.answer)) {
      warnings.push(`Question ${r.question_number}: unsupported answer '${r.answer || "missing"}' (single A-D answer required); skipped.`);
      return false;
    }
    return true;
  });
  const parsed = rowsToQuestions(usable.map((r) => ({
    question_number: r.question_number, subject: r.subject,
    question_en: r.question_en, question_hi: r.question_hi,
    option_a_en: r.option_a_en, option_b_en: r.option_b_en,
    option_c_en: r.option_c_en, option_d_en: r.option_d_en,
    option_a_hi: r.option_a_hi, option_b_hi: r.option_b_hi,
    option_c_hi: r.option_c_hi, option_d_hi: r.option_d_hi,
    answer: r.answer, explanation_en: r.explanation_en,
    explanation_hi: r.explanation_hi, marks: r.marks,
    negative_marks: r.negative_marks
  })));
  // Database requires consecutive question numbers after unsupported entries are omitted.
  parsed.questions.forEach((q, index) => { q.question_number = index + 1; });
  parsed.warnings.push(...warnings);
  if (!records.length) parsed.errors.push("No Q1./Q2. question blocks detected. Check DOCX contents.");
  return parsed;
}

// Convert the sanitized HTML emitted by Mammoth into a loss-minimizing text stream.
// Images are embedded in their question blocks rather than discarded.
function htmlToQuestionText(html: string): string {
  let content = html.replace(/<img\b[^>]*src="(data:image\/(?:png|jpeg|gif|webp);base64,[^"]+)"[^>]*\/?\s*>/gi,
    (_m, src: string) => `\n[[IMAGE:${src}]]\n`);
  content = content.replace(/<\/t[dh]>/gi, " | ").replace(/<\/tr>/gi, "\n")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|div|h[1-6]|table|ul|ol)>/gi, "\n");
  content = content.replace(/<[^>]+>/g, "");
  return content.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

export async function parseQuestionFile(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".docx")) {
    // Mammoth retains embedded diagrams and Word tables in HTML, unlike extractRawText.
    const { value, messages } = await mammoth.convertToHtml({ buffer }, {
      convertImage: mammoth.images.imgElement(async (image) => ({
        src: `data:${image.contentType};base64,${(await image.read("base64"))}`
      }))
    });
    const text = htmlToQuestionText(value);
    const parsed = parseDocxText(text);
    parsed.warnings.push(...messages.filter((m) => m.type === "warning").map((m) => m.message));
    return parsed;
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) return { questions: [], errors: ["The file has no readable worksheet."], warnings: [] };
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
    return rowsToQuestions(rows);
  }

  return {
    questions: [],
    errors: ["Unsupported file. Please upload .xlsx, .xls, .csv, or .docx."], warnings: []
  };
}
