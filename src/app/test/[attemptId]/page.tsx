import { requireUser } from "@/lib/auth";
import { TestRunner } from "@/components/TestRunner";

export const dynamic = "force-dynamic";

export default async function TestPage({ params }: { params: Promise<{ attemptId: string }> }) {
  await requireUser();
  const { attemptId } = await params;
  return <TestRunner attemptId={attemptId} />;
}
