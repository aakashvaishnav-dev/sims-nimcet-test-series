import { NextResponse } from "next/server";
import { getApiAdmin } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getApiAdmin())) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const { id } = await params; const db = createAdminClient();
  const { data: exam, error } = await db.from("exams").select("is_published,total_questions").eq("id", id).single();
  if (error || !exam) return NextResponse.json({ error: "Test not found." }, { status: 404 });
  if (!exam.is_published && exam.total_questions < 1) return NextResponse.json({ error: "Import questions before publishing the test." }, { status: 400 });
  const { error: updateError } = await db.from("exams").update({ is_published: !exam.is_published, updated_at: new Date().toISOString() }).eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
  return NextResponse.json({ published: !exam.is_published });
}
