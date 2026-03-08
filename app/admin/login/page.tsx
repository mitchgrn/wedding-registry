import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleOneTap } from "@/components/google-one-tap";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getClientEnv, hasClientEnv, serverEnv } from "@/lib/env";

export default async function AdminLoginPage() {
  const user = await getCurrentUser().catch(() => null);

  if (user && serverEnv.success && user.email?.toLowerCase() === serverEnv.data.ADMIN_EMAIL.toLowerCase()) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,rgba(234,245,251,0.35),rgba(255,255,255,1)_20%)] px-6 py-12">
      <Card className="card-floating w-full max-w-md border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(234,245,251,0.45))] shadow-[0_20px_60px_rgba(0,23,31,0.06)]">
        <CardHeader className="mb-0 pb-6">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--cerulean)]">
            Admin Access
          </span>
          <h1 className="mt-3 text-4xl italic text-[var(--ink-black)]">Sign in</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-black)]/58">
            Only the configured admin Google account can access registry management.
          </p>
        </CardHeader>

        <CardContent>
          <div className="border-t border-[var(--border)] pt-6">
            {hasClientEnv() && serverEnv.success ? (
              <GoogleOneTap clientId={getClientEnv().NEXT_PUBLIC_GOOGLE_CLIENT_ID} />
            ) : (
              <p className="text-sm text-[var(--ink-black)]/55">Add env vars before enabling admin login.</p>
            )}
          </div>

          <div className="mt-6 border-t border-[var(--border)] pt-4 text-center">
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
