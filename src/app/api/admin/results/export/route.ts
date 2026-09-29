import { getApiAdmin } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

function csv(value: unknown) {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await getApiAdmin())) return new Response("Admin access required", { status: 403 });
  const db = createAdminClient();
  const { data: attempts } = await db.from("attempts").select("id,exam_id,student_id,status,score,percentage,correct_count,wrong_count,unanswered_count,started_at,submitted_at,time_taken_seconds").order("created_at", { ascending: false });
  const studentIds = [...new Set((attempts || []).map((a) => a.student_id))];
  const examIds = [...new Set((attempts || []).map((a) => a.exam_id))];
  const { data: students } = studentIds.length ? await db.from("profiles").select("id,full_name,email,phone").in("id", studentIds) : { data: [] as any[] };
  const { data: exams } = examIds.length ? await db.from("exams").select("id,title").in("id", examIds) : { data: [] as any[] };
  const sm = new Map((students || []).map((s: any) => [s.id, s]));
  const em = new Map((exams || []).map((e: any) => [e.id, e.title]));
  const header = ["Student","Email","Phone","Test","Status","Score","Percentage","Correct","Wrong","Unanswered","Started At","Submitted At","Time Taken Seconds"];
  const rows = (attempts || []).map((a) => {
    const s: any = sm.get(a.student_id);
    return [s?.full_name || "Student", s?.email || "", s?.phone || "", em.get(a.exam_id) || "Test", a.status, a.score ?? "", a.percentage ?? "", a.correct_count ?? "", a.wrong_count ?? "", a.unanswered_count ?? "", a.started_at, a.submitted_at ?? "", a.time_taken_seconds ?? ""].map(csv).join(",");
  });
  const body = "\uFEFF" + [header.map(csv).join(","), ...rows].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="sims-nimcet-results-${new Date().toISOString().slice(0,10)}.csv"`, "Cache-Control": "no-store" } });
}
