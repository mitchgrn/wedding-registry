import Link from "next/link";
import { redirect } from "next/navigation";
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
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(0,168,232,0.12),transparent_28%),linear-gradient(180deg,rgba(234,245,251,0.42),rgba(255,255,255,1)_24%)] px-4 py-10 sm:px-6 sm:py-12">
      <Card className="card-floating w-full max-w-md overflow-hidden border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(234,245,251,0.62))] shadow-[0_20px_60px_rgba(0,23,31,0.08)]">
        <CardHeader className="border-b border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.72))] pb-7">
          <CardTitle className="text-4xl italic text-[var(--ink-black)]">Sign in</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {error === "unauthorized" ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {attemptedEmail ? `${attemptedEmail} is signed in, but does not have the admin role.` : "That Google account is not authorized for admin access."}
            </div>
          ) : null}
          {error === "session" ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Google sign-in completed, but the session was not created.
            </div>
          ) : null}

          {hasClientEnv() && serverEnv.success ? (
            <GoogleOneTap />
          ) : (
            <p className="text-sm text-[var(--ink-black)]/55">Add env vars before enabling admin login.</p>
          )}

          {user ? (
            <form action={signOutAction}>
              <button
                type="submit"
                className="w-full text-sm text-[var(--ink-black)]/55 underline underline-offset-2 hover:text-[var(--cerulean)]"
              >
                Sign out {user.email ? `(${user.email})` : ""}
              </button>
            </form>
          ) : null}

          <div className="border-t border-[var(--border)] pt-4 text-center">
            <Link
              href="/"
              className="text-xs text-[var(--ink-black)]/55 underline-offset-2 hover:text-[var(--cerulean)] hover:underline"
            >
              Back to registry
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
