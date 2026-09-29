import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (typeof body.questionId !== "string") return NextResponse.json({ error: "Question is required." }, { status: 400 });

  const { data, error } = await supabase.rpc("save_answer", {
    p_attempt_id: id,
    p_question_id: body.questionId,
    p_selected_option: body.selectedOption ?? null,
    p_marked_for_review: Boolean(body.markedForReview)
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
