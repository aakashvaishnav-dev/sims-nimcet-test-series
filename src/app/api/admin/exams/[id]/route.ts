import { NextResponse } from "next/server";
import { getApiAdmin } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

function parseDate(value: unknown) {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getApiAdmin())) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Test title is required." }, { status: 400 });

  const startsAt = parseDate(body.startsAt);
  const endsAt = parseDate(body.endsAt);
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
    return NextResponse.json({ error: "Close time must be after start time." }, { status: 400 });
  }

  const db = createAdminClient();
  const { error } = await db.from("exams").update({
    title,
    description: String(body.description || "").trim(),
    duration_minutes: Math.max(1, Number(body.durationMinutes || 120)),
    max_attempts: Math.max(1, Number(body.maxAttempts || 1)),
    default_marks: Math.max(0, Number(body.defaultMarks || 4)),
    default_negative_marks: Math.max(0, Number(body.defaultNegativeMarks || 1)),
    starts_at: startsAt,
    ends_at: endsAt,
    updated_at: new Date().toISOString()
  }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getApiAdmin())) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const { id } = await params;
  const db = createAdminClient();
  const { count } = await db.from("attempts").select("id", { count: "exact", head: true }).eq("exam_id", id);
  if ((count || 0) > 0) {
    return NextResponse.json({ error: "This test has student attempts and cannot be deleted. Unpublish it instead." }, { status: 409 });
  }
  const { error } = await db.from("exams").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
