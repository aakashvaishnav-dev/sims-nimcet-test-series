import Link from "next/link";
import { Header } from "@/components/Header";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <Header />
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <nav>
            <Link href="/admin">Overview</Link>
            <Link href="/admin/exams">Tests & Import</Link>
            <Link href="/admin/results">Results</Link>
            <Link href="/admin/students">Students</Link>
            <Link href="/dashboard">Student View</Link>
          </nav>
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    </>
  );
}
