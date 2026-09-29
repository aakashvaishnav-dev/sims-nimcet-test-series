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
  const match = text.match(/\b([ABCD])\b/);
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

  return { questions, errors };
}

function appendField(target: Record<string, string>, field: string, value: string) {
  if (!value) return;
  target[field] = target[field] ? `${target[field]}\n${value}` : value;
}

function parseDocxText(text: string): ParseResult {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const records: Record<string, string>[] = [];
  let current: Record<string, string> | null = null;
  let currentField = "question_en";

  const ensure = () => {
    if (!current) current = { subject: "General" };
    return current;
  };

  const push = () => {
    if (current && Object.keys(current).length > 1) records.push(current);
    current = null;
    currentField = "question_en";
  };

  const labelMap: Array<[RegExp, string]> = [
    [/^question\s*english\s*:\s*/i, "question_en"],
    [/^question\s*hindi\s*:\s*/i, "question_hi"],
    [/^subject\s*:\s*/i, "subject"],
    [/^(?:a|option\s*a)\s*english\s*:\s*/i, "option_a_en"],
    [/^(?:a|option\s*a)\s*hindi\s*:\s*/i, "option_a_hi"],
    [/^(?:b|option\s*b)\s*english\s*:\s*/i, "option_b_en"],
    [/^(?:b|option\s*b)\s*hindi\s*:\s*/i, "option_b_hi"],
    [/^(?:c|option\s*c)\s*english\s*:\s*/i, "option_c_en"],
    [/^(?:c|option\s*c)\s*hindi\s*:\s*/i, "option_c_hi"],
    [/^(?:d|option\s*d)\s*english\s*:\s*/i, "option_d_en"],
    [/^(?:d|option\s*d)\s*hindi\s*:\s*/i, "option_d_hi"],
    [/^(?:answer(?:\s*\/\s*उत्तर)?|correct\s*answer|correct\s*option)\s*:\s*/i, "answer"],
    [/^(?:explanation|solution)\s*english\s*:\s*/i, "explanation_en"],
    [/^(?:explanation|solution)\s*hindi\s*:\s*/i, "explanation_hi"],
    [/^marks\s*:\s*/i, "marks"],
    [/^negative\s*(?:marks|marking)?\s*:\s*/i, "negative_marks"]
  ];

  for (const line of lines) {
    const numbered = line.match(/^(\d{1,4})[.)]\s*(.*)$/);
    if (numbered) {
      push();
      current = { question_number: numbered[1], subject: "General" };
      currentField = "question_en";
      if (numbered[2]) appendField(current, currentField, numbered[2]);
      continue;
    }

    let matched = false;
    for (const [regex, field] of labelMap) {
      if (regex.test(line)) {
        const rec = ensure();
        currentField = field;
        appendField(rec, field, line.replace(regex, "").trim());
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const simpleOption = line.match(/^([ABCD])[.)]\s*(.*)$/i);
    if (simpleOption) {
      const rec = ensure();
      currentField = `option_${simpleOption[1].toLowerCase()}_en`;
      appendField(rec, currentField, simpleOption[2]);
      continue;
    }

    const hindiQuestion = line.match(/^प्रश्न\s*(?:हिंदी)?\s*:\s*(.*)$/i);
    if (hindiQuestion) {
      currentField = "question_hi";
      appendField(ensure(), currentField, hindiQuestion[1]);
      continue;
    }

    const hindiAnswer = line.match(/^उत्तर\s*:\s*(.*)$/i);
    if (hindiAnswer) {
      currentField = "answer";
      appendField(ensure(), currentField, hindiAnswer[1]);
      continue;
    }

    if (current) appendField(current, currentField, line);
  }
  push();

  const rows = records.map((r) => ({
    "question number": r.question_number,
    subject: r.subject,
    "question english": r.question_en,
    "question hindi": r.question_hi,
    "a english": r.option_a_en,
    "a hindi": r.option_a_hi,
    "b english": r.option_b_en,
    "b hindi": r.option_b_hi,
    "c english": r.option_c_en,
    "c hindi": r.option_c_hi,
    "d english": r.option_d_en,
    "d hindi": r.option_d_hi,
    answer: r.answer,
    "explanation english": r.explanation_en,
    "explanation hindi": r.explanation_hi,
    marks: r.marks,
    "negative marks": r.negative_marks
  }));

  return rowsToQuestions(rows);
}

export async function parseQuestionFile(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer });
    return parseDocxText(value);
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) return { questions: [], errors: ["The file has no readable worksheet."] };
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
    return rowsToQuestions(rows);
  }

  return {
    questions: [],
    errors: ["Unsupported file. Please upload .xlsx, .xls, .csv, or .docx."]
  };
}
