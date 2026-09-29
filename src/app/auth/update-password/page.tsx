import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { UpdatePasswordForm } from "@/components/UpdatePasswordForm";
import { requireUser } from "@/lib/auth";

export default async function UpdatePasswordPage() {
  await requireUser();
  return <><Header /><main className="page"><div className="container"><div className="form-shell card form-card"><div className="eyebrow">Secure Account</div><h1 className="page-title" style={{ margin: "10px 0 8px" }}>Choose New Password</h1><div className="mt-24"><UpdatePasswordForm /></div></div></div></main><Footer /></>;
}
