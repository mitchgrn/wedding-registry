import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { credential, nonce } = (await request.json()) as { credential?: string; nonce?: string };
    if (!credential || !nonce) {
      return NextResponse.json({ error: "Missing Google credential." }, { status: 400 });
    }

    const env = getServerEnv();
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: credential,
      nonce,
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? "Unable to sign in." }, { status: 401 });
    }

    if (data.user.email?.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: "That Google account is not authorized." }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to complete Google sign-in." }, { status: 500 });
  }
}
