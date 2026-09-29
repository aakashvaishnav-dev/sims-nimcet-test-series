import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const user = await getCurrentUser();
  let isAdmin = false;
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    isAdmin = data?.role === "admin";
  }

  return (
    <header className="site-header">
      <div className="container navbar">
        <BrandLogo compact />

        <nav className="nav-links" aria-label="Primary navigation">
          <Link href="/">Home</Link>
          <Link href="/dashboard">Tests</Link>
          <Link href="/contact">Contact</Link>
          {isAdmin && <Link href="/admin">Admin</Link>}
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <Link className="btn btn-secondary btn-sm mobile-hide" href={isAdmin ? "/admin" : "/dashboard"}>
                {isAdmin ? "Admin" : "Dashboard"}
              </Link>
              <form action="/api/auth/logout" method="post">
                <button className="btn btn-ghost btn-sm" type="submit">Logout</button>
              </form>
            </>
          ) : (
            <>
              <Link className="btn btn-secondary btn-sm mobile-hide" href="/auth/login">Login</Link>
              <Link className="btn btn-primary btn-sm" href="/auth/register">Register</Link>
            </>
          )}

          <details className="mobile-nav-menu">
            <summary aria-label="Open navigation menu" title="Menu">
              <span></span><span></span><span></span>
            </summary>
            <nav className="mobile-nav-panel" aria-label="Mobile navigation">
              <Link href="/">Home</Link>
              <Link href="/dashboard">Tests</Link>
              <Link href="/contact">Contact</Link>
              {isAdmin && <Link href="/admin">Admin Dashboard</Link>}
              {!user && <Link href="/auth/login">Student Login</Link>}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
