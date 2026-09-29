import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthForm } from "@/components/AuthForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  return <><Header /><main className="page"><div className="container"><div className="form-shell card form-card"><div className="eyebrow">Student access</div><h1 className="page-title" style={{ margin: "10px 0 8px" }}>Login</h1><p className="page-lead">Continue to your NIMCET test dashboard.</p>{query.error && <div className="error mt-16">{query.error}</div>}<div className="mt-24"><AuthForm mode="login" /></div></div></div></main><Footer /></>;
}
