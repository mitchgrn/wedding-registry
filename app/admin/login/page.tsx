import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { GoogleOneTap } from "@/components/google-one-tap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth";
import { hasClientEnv, serverEnv } from "@/lib/env";
import { signOutAction } from "@/app/actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser().catch(() => null);
  const params = searchParams ? await searchParams : undefined;
  const error = typeof params?.error === "string" ? params.error : undefined;
  const attemptedEmail = typeof params?.email === "string" ? params.email : undefined;

  if (user && serverEnv.success && (await isCurrentUserAdmin())) {
    redirect("/admin");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#eef8fb_0%,#ffffff_28%,#ffffff_100%)] px-4 py-6 sm:px-6 sm:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,168,232,0.16),transparent_26%),radial-gradient(circle_at_85%_12%,rgba(0,52,89,0.08),transparent_20%),linear-gradient(135deg,rgba(255,255,255,0)_0%,rgba(0,168,232,0.04)_100%)]"
      />

      <Card className="relative w-full max-w-md overflow-hidden rounded-[1.5rem] border-[rgba(0,52,89,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,250,253,0.9))] shadow-[0_28px_90px_rgba(0,23,31,0.12)] sm:rounded-[2rem]">
        <CardHeader className="border-b border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.68))] pb-6 pt-6 sm:pb-7 sm:pt-7">
          <CardTitle className="font-[family-name:var(--font-display)] text-[2.2rem] italic leading-none text-ink-black sm:text-5xl">
            Sign in
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5 px-4 pb-5 pt-5 sm:space-y-6 sm:px-5 sm:pt-6">
          {error === "unauthorized" ? (
            <div className="rounded-[1rem] border border-red-200 bg-red-50/90 px-4 py-3 text-sm leading-6 text-red-700">
              {attemptedEmail ? `${attemptedEmail} is signed in, but does not have the admin role.` : "That Google account is not authorized for admin access."}
            </div>
          ) : null}
          {error === "session" ? (
            <div className="rounded-[1rem] border border-red-200 bg-red-50/90 px-4 py-3 text-sm leading-6 text-red-700">
              Google sign-in completed, but the session was not created.
            </div>
          ) : null}

          <div className="rounded-[1.25rem] border border-cerulean/10 bg-white/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:rounded-[1.4rem] sm:p-5">
            {hasClientEnv() && serverEnv.success ? (
              <GoogleOneTap />
            ) : (
              <p className="text-sm leading-6 text-ink-black/55">Add the required Supabase and Google environment variables before enabling admin login.</p>
            )}
          </div>

          {user ? (
            <form action={signOutAction}>
              <button
                type="submit"
                className="w-full text-sm text-ink-black/55 underline underline-offset-2 hover:text-cerulean"
              >
                Sign out {user.email ? `(${user.email})` : ""}
              </button>
            </form>
          ) : null}

          <div className="border-t border-border pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-ink-black/55 transition hover:text-cerulean"
            >
              <ArrowLeft className="size-4" />
              Back to registry
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
