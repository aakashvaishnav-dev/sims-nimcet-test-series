export type OptionKey = "A" | "B" | "C" | "D";

export type SafeQuestion = {
  id: string;
  number: number;
  subject: string;
  questionEn: string;
  questionHi?: string | null;
  optionAEn: string;
  optionAHi?: string | null;
  optionBEn: string;
  optionBHi?: string | null;
  optionCEn: string;
  optionCHi?: string | null;
  optionDEn: string;
  optionDHi?: string | null;
  selectedOption?: OptionKey | null;
  markedForReview?: boolean;
};

export type AttemptSession = {
  attempt: {
    id: string;
    status: "in_progress" | "submitted" | "auto_submitted";
    startedAt: string;
    expiresAt: string;
    serverNow: string;
  };
  exam: {
    id: string;
    title: string;
    durationMinutes: number;
    totalQuestions: number;
    totalMarks: number;
  };
  questions: SafeQuestion[];
};
