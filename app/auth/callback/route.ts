import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getServerEnv } from "@/lib/env";
import { getUserRole, syncUserProfile } from "@/lib/auth";

function getSafeNextPath(next: string | null) {
  if (!next) {
    return "/admin";
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/admin";
  }

  return next;
}

function redirectWithCookies(
  response: NextResponse,
  location: URL,
) {
  const redirectResponse = NextResponse.redirect(location);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));
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
      return redirectWithCookies(response, loginUrl);
    }

    await syncUserProfile(user);
    const role = await getUserRole(user.id);

    if (role !== "admin") {
      await supabase.auth.signOut();
      loginUrl.searchParams.set("error", "unauthorized");
      loginUrl.searchParams.set("email", user.email ?? "");
      return redirectWithCookies(response, loginUrl);
    }
  }

  return response;
}
