"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    try {
      if (mode === "register") {
        const fullName = String(form.get("fullName") || "").trim();
        const phone = String(form.get("phone") || "").trim();
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, phone }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` }
        });
        if (error) throw error;
        setMessage("Registration successful. If email confirmation is enabled, confirm your email and then login.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit}>
      {mode === "register" && (
        <>
          <div className="form-group">
            <label className="label" htmlFor="fullName">Full Name</label>
            <input className="input" id="fullName" name="fullName" required autoComplete="name" />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="phone">Mobile Number</label>
            <input className="input" id="phone" name="phone" inputMode="tel" placeholder="10-digit mobile number" />
          </div>
        </>
      )}
      <div className="form-group">
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="form-group">
        <label className="label" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" minLength={6} required autoComplete={mode === "login" ? "current-password" : "new-password"} />
      </div>
      {error && <div className="error" style={{ marginBottom: 14 }}>{error}</div>}
      {message && <div className="success" style={{ marginBottom: 14 }}>{message}</div>}
      <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
        {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Student Account"}
      </button>
      <p className="help" style={{ textAlign: "center", marginTop: 16 }}>
        {mode === "login" ? <>New student? <Link className="gold" href="/auth/register">Create account</Link> · <Link className="gold" href="/auth/forgot-password">Forgot password?</Link></> : <>Already registered? <Link className="gold" href="/auth/login">Login</Link></>}
      </p>
    </form>
  );
}
