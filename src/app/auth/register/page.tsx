import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthForm } from "@/components/AuthForm";

export default function RegisterPage() {
  return <><Header /><main className="page"><div className="container"><div className="form-shell card form-card"><div className="eyebrow">SIMS Raipur</div><h1 className="page-title" style={{ margin: "10px 0 8px" }}>Student Registration</h1><p className="page-lead">Create one account for your tests and result history.</p><div className="mt-24"><AuthForm mode="register" /></div></div></div></main><Footer /></>;
}
