import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserRole, syncUserProfile } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { credential, nonce } = (await request.json()) as { credential?: string; nonce?: string };
    if (!credential || !nonce) {
      return NextResponse.json({ error: "Missing Google credential." }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: credential,
      nonce,
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? "Unable to sign in." }, { status: 401 });
    }

    await syncUserProfile(data.user);
    const role = await getUserRole(data.user.id);

    if (role !== "admin") {
      await supabase.auth.signOut();
      return NextResponse.json({ error: "That Google account is not authorized." }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to complete Google sign-in." }, { status: 500 });
  }
}
