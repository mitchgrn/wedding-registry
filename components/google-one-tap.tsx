"use client";

import Script from "next/script";
import { LoaderCircle } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getClientEnv } from "@/lib/env";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            nonce?: string;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: number;
              logo_alignment?: "left" | "center";
            },
          ) => void;
          prompt: (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

function createNonce() {
  return crypto.randomUUID().replace(/-/g, "");
}

async function hashNonce(value: string) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function GoogleOneTap() {
  const buttonId = useId();
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const nonceRef = useRef("");
  const clientId = getClientEnv().NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!scriptReady || !clientId || initializedRef.current || !window.google?.accounts.id) {
      return;
    }

    const button = document.getElementById(buttonId);

    if (!(button instanceof HTMLElement)) {
      return;
    }

    let cancelled = false;

    const initializeGoogle = async () => {
      const rawNonce = createNonce();
      const hashedNonce = await hashNonce(rawNonce);

      if (cancelled) {
        return;
      }

      nonceRef.current = rawNonce;

      window.google?.accounts.id.initialize({
        client_id: clientId,
        nonce: hashedNonce,
        auto_select: false,
        cancel_on_tap_outside: false,
        use_fedcm_for_prompt: true,
        callback: ({ credential }) => {
          if (!credential) {
            setError("Google sign-in did not return a credential.");
            setMessage(null);
            setLoading(false);
            return;
          }

          void completeSignIn(credential);
        },
      });

      button.innerHTML = "";
      window.google?.accounts.id.renderButton(button, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "left",
        width: Math.min(button.clientWidth || 360, 360),
      });
      window.google?.accounts.id.prompt();
      initializedRef.current = true;
    };

    void initializeGoogle().catch(() => {
      setError("Unable to initialize Google sign-in.");
    });

    return () => {
      cancelled = true;
      window.google?.accounts.id.cancel();
      initializedRef.current = false;
    };
  }, [buttonId, clientId, scriptReady]);

  async function completeSignIn(credential: string) {
    setLoading(true);
    setError(null);
    setMessage("Signing you in...");

    const response = await fetch("/auth/google/onetap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        credential,
        nonce: nonceRef.current,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setLoading(false);
      setError(payload.error ?? "Unable to complete Google sign-in.");
      setMessage(null);
      return;
    }

    window.location.assign("/admin");
  }

  if (!clientId) {
    return <p className="text-sm text-[var(--ink-black)]/58">Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to enable Google sign-in.</p>;
  }

  return (
    <div className="space-y-4">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => setError("Unable to load Google sign-in.")}
      />

      <div
        id={buttonId}
        className="min-h-[44px] rounded-full border border-[var(--border)] bg-white/95 p-0.5 shadow-[0_10px_24px_rgba(0,23,31,0.06)]"
      />

      {message ? <p className="text-sm text-[var(--ink-black)]/58">{message}</p> : null}
      {error ? <p className="text-sm text-[var(--warning)]">{error}</p> : null}

      {loading ? (
        <Button type="button" className="w-full" disabled>
          <LoaderCircle className="size-4 animate-spin" />
          Signing in...
        </Button>
      ) : null}
    </div>
  );
}
