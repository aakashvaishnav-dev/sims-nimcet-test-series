import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please login first." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const examId = typeof body.examId === "string" ? body.examId : "";
  if (!examId) return NextResponse.json({ error: "Exam is required." }, { status: 400 });

  const { data, error } = await supabase.rpc("start_exam", { p_exam_id: examId });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
