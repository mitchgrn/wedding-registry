import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export type AppRole = "user" | "admin";

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function syncUserProfile(user: User) {
  const supabase = createServiceRoleClient();
  const email = user.email?.toLowerCase() ?? null;

  const { error } = await supabase.from("users").upsert(
    {
      id: user.id,
      email,
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    throw new Error(`Unable to sync user profile: ${error.message}`);
  }
}

export async function getUserRole(userId: string): Promise<AppRole | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("users").select("role").eq("id", userId).maybeSingle();

  if (error) {
    throw new Error(`Unable to load user role: ${error.message}`);
  }

  return data?.role === "admin" ? "admin" : data?.role === "user" ? "user" : null;
}

export async function isCurrentUserAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    return false;
  }

  const role = await getUserRole(user.id);
  return role === "admin";
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  const role = await getUserRole(user.id);
  if (role !== "admin") {
    redirect("/admin/login");
  }

  return user;
}
