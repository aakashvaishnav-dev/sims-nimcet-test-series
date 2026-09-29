import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  return { user, supabase };
}

export async function requireAdmin() {
  const { user, supabase } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");
  return { user, profile, supabase };
}
