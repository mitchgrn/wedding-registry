import { redirect } from "next/navigation";
import { getServerEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  const env = getServerEnv();

  if (!user || user.email?.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) {
    redirect("/admin/login");
  }

  return user;
}
