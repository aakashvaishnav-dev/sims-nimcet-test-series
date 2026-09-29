import { createAdminClient } from "@/lib/supabase/admin";

export async function finalizeExpiredAttempts(limit = 200) {
  const db = createAdminClient();
  const { data: expired, error } = await db
    .from("attempts")
    .select("id")
    .eq("status", "in_progress")
    .lte("expires_at", new Date().toISOString())
    .limit(limit);

  if (error || !expired?.length) return { found: expired?.length || 0, completed: 0 };

  const results = await Promise.allSettled(
    expired.map((a) => db.rpc("submit_attempt", { p_attempt_id: a.id, p_auto: true }))
  );
  const completed = results.filter((r) => r.status === "fulfilled" && !r.value.error).length;
  return { found: expired.length, completed };
}
