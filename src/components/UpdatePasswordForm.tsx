"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError("");
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    if (password.length < 6) { setError("Password must be at least 6 characters."); setLoading(false); return; }
    if (password !== confirm) { setError("Passwords do not match."); setLoading(false); return; }
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.replace("/dashboard"); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update password."); setLoading(false); }
  }

  return <form onSubmit={submit}><div className="form-group"><label className="label">New Password</label><input className="input" type="password" name="password" minLength={6} required autoComplete="new-password" /></div><div className="form-group"><label className="label">Confirm Password</label><input className="input" type="password" name="confirm" minLength={6} required autoComplete="new-password" /></div>{error && <div className="error mb-24">{error}</div>}<button className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>{loading ? "Updating..." : "Update Password"}</button></form>;
}
