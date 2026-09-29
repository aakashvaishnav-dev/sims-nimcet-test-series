import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.rpc("get_attempt_session", { p_attempt_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
