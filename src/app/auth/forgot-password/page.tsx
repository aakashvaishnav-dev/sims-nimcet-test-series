import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return <><Header /><main className="page"><div className="container"><div className="form-shell card form-card"><div className="eyebrow">Account Recovery</div><h1 className="page-title" style={{ margin: "10px 0 8px" }}>Reset Password</h1><p className="page-lead">We will send a secure reset link to your registered email.</p><div className="mt-24"><ForgotPasswordForm /></div><p className="help" style={{ textAlign: "center", marginTop: 16 }}><Link className="gold" href="/auth/login">Back to login</Link></p></div></div></main><Footer /></>;
}
