import { redirect } from "next/navigation";
import { GoogleOneTap } from "@/components/google-one-tap";
import { getCurrentUser } from "@/lib/auth";
import { getClientEnv, hasClientEnv, serverEnv } from "@/lib/env";

export default async function AdminLoginPage() {
  const user = await getCurrentUser().catch(() => null);

  if (user && serverEnv.success && user.email?.toLowerCase() === serverEnv.data.ADMIN_EMAIL.toLowerCase()) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <div className="card-floating w-full max-w-md rounded-2xl p-8">
        <div className="mb-6">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Admin Access
          </span>
          <h1 className="mt-3 text-4xl">Sign in</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Only the configured admin Google account can access registry management.
          </p>
        </div>

        <div className="border-t border-border pt-6">
          {hasClientEnv() && serverEnv.success ? (
            <GoogleOneTap clientId={getClientEnv().NEXT_PUBLIC_GOOGLE_CLIENT_ID} />
          ) : (
            <p className="text-sm text-muted-foreground">Add env vars before enabling admin login.</p>
          )}
        </div>

        <div className="mt-6 border-t border-border pt-4 text-center">
          <a href="/" className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
            Back to registry
          </a>
        </div>
      </div>
    </main>
  );
}
