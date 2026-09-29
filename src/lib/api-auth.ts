import { createClient } from "@/lib/supabase/server";

export async function getApiAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("id,role,full_name").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return { user, profile };
}
