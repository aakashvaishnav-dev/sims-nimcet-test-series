"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setMessage(""); setError("");
    const email = String(new FormData(e.currentTarget).get("email") || "").trim();
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`
      });
      if (error) throw error;
      setMessage("Password reset link sent. Please check your email.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not send reset link."); }
    finally { setLoading(false); }
  }

  return <form onSubmit={submit}><div className="form-group"><label className="label">Registered Email</label><input className="input" type="email" name="email" required autoComplete="email" /></div>{error && <div className="error mb-24">{error}</div>}{message && <div className="success mb-24">{message}</div>}<button className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</button></form>;
}
