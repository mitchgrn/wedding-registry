import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getServerEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/admin";
  const loginUrl = new URL("/admin/login", requestUrl.origin);
  const response = NextResponse.redirect(new URL(next, requestUrl.origin));
  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<typeof response.cookies.set>[2];
  };

  if (code) {
    const env = getServerEnv();
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: CookieToSet[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      loginUrl.searchParams.set("error", "session");
      return NextResponse.redirect(loginUrl);
    }

    if (user.email?.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) {
      await supabase.auth.signOut();
      loginUrl.searchParams.set("error", "unauthorized");
      loginUrl.searchParams.set("email", user.email ?? "");
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}
