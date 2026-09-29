import { NextResponse } from "next/server";
import { getApiAdmin } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "nimcet-test";
}

export async function POST(request: Request) {
  const admin = await getApiAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Test title is required." }, { status: 400 });

  const db = createAdminClient();
  let slug = slugify(title);
  const { data: existing } = await db.from("exams").select("id").eq("slug", slug).maybeSingle();
  if (existing) slug = `${slug}-${Date.now().toString().slice(-6)}`;

  const parseDate = (value: unknown) => {
    if (!value) return null;
    const d = new Date(String(value));
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  };

  const row = {
    title,
    slug,
    description: String(body.description || "").trim(),
    duration_minutes: Math.max(1, Number(body.durationMinutes || 120)),
    max_attempts: Math.max(1, Number(body.maxAttempts || 1)),
    default_marks: Math.max(0, Number(body.defaultMarks || 4)),
    default_negative_marks: Math.max(0, Number(body.defaultNegativeMarks || 1)),
    starts_at: parseDate(body.startsAt),
    ends_at: parseDate(body.endsAt),
    is_published: body.isPublished === "true" || body.isPublished === true,
    created_by: admin.user.id
  };

  if (row.starts_at && row.ends_at && new Date(row.ends_at) <= new Date(row.starts_at)) {
    return NextResponse.json({ error: "Close time must be after start time." }, { status: 400 });
  }

  const { data, error } = await db.from("exams").insert(row).select("id,title,slug").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
