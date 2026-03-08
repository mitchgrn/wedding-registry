"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            nonce?: string;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

async function generateNoncePair() {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const encodedNonce = new TextEncoder().encode(nonce);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedNonce);
  const hashedNonce = Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return { nonce, hashedNonce };
}

export function GoogleOneTap({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("Waiting for Google One Tap.");
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!loaded || !window.google || initialized.current) {
      return;
    }

    initialized.current = true;
    void (async () => {
      const { nonce, hashedNonce } = await generateNoncePair();
      const google = window.google;

      if (!google) {
        return;
      }

      google.accounts.id.initialize({
        client_id: clientId,
        auto_select: false,
        cancel_on_tap_outside: false,
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
        callback: async ({ credential }) => {
          setMessage("Signing you in...");
          setError(null);

          const response = await fetch("/auth/google/onetap", {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({ credential, nonce }),
          });

          const payload = (await response.json()) as { error?: string };
          if (!response.ok) {
            setError(payload.error ?? "Sign-in failed.");
            setMessage("Google sign-in unavailable.");
            return;
          }

          router.push("/admin");
          router.refresh();
        },
      });

      google.accounts.id.prompt();
    })();
  }, [clientId, loaded, router]);

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setLoaded(true)} />
      <div className="space-y-4">
        <Badge>{message}</Badge>
        {error ? <Badge tone="warning">{error}</Badge> : null}
        <Button
          variant="secondary"
          onClick={() => {
            window.google?.accounts.id.cancel();
            window.google?.accounts.id.prompt();
          }}
          type="button"
        >
          Retry Google One Tap
        </Button>
      </div>
    </>
  );
}
