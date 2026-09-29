import { NextResponse } from "next/server";
import { finalizeExpiredAttempts } from "@/lib/finalize";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await finalizeExpiredAttempts(500);
  return NextResponse.json(result);
}
