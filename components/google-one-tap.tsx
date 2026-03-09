"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getClientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
export function GoogleOneTap() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);

  async function handleGoogleSignIn() {
    setOauthLoading(true);
    setError(null);
    setMessage("Redirecting to Google...");

    const supabase = createClient();
    const siteUrl = getClientEnv().NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const redirectTo = `${siteUrl}/auth/callback?next=/admin`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (oauthError) {
      setOauthLoading(false);
      setError(oauthError.message);
      setMessage("Google sign-in unavailable.");
    }
  }

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-[var(--ink-black)]/58">{message}</p> : null}
      {error ? <p className="text-sm text-[var(--warning)]">{error}</p> : null}
      <Button className="w-full" onClick={() => void handleGoogleSignIn()} type="button" disabled={oauthLoading}>
        {oauthLoading ? "Opening Google..." : "Continue with Google"}
      </Button>
    </div>
  );
}
