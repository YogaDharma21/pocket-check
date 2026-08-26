import { useState, useEffect, useRef, useCallback } from "react";
import { useSignIn, useClerk } from "@clerk/clerk-react";
import { Sparkles, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 mr-3 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function WelcomeScreen() {
  const { signIn, isLoaded } = useSignIn();
  const { client, setActive, handleRedirectCallback } = useClerk();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const completeAuth = useCallback(
    async (fullUrl?: string) => {
      if (!isLoaded) return false;
      try {
        if (fullUrl && handleRedirectCallback) {
          try {
            await handleRedirectCallback({
              redirectUrl: fullUrl,
            });
          } catch (err) {
            console.debug("handleRedirectCallback caught", err);
          }
        }

        if (signIn) {
          try {
            const reloaded = await signIn.reload();
            if (reloaded.status === "complete" && reloaded.createdSessionId) {
              await setActive({ session: reloaded.createdSessionId });
              setLoading(false);
              return true;
            }
          } catch (e) {
            console.debug("signIn.reload caught", e);
          }
        }

        if (client?.sessions && client.sessions.length > 0) {
          const activeSession = client.sessions[0];
          if (activeSession?.id) {
            await setActive({ session: activeSession.id });
            setLoading(false);
            return true;
          }
        }
      } catch (err) {
        console.error("Redirect completion error", err);
      }
      return false;
    },
    [isLoaded, signIn, client, setActive, handleRedirectCallback]
  );

  // Listen to IPC redirect broadcast from local loopback server
  useEffect(() => {
    if (!window.electronAPI?.onAuthCallback) return;

    const unsubscribe = window.electronAPI.onAuthCallback(async (fullUrl) => {
      setLoading(true);
      await completeAuth(fullUrl);
    });

    return () => {
      unsubscribe?.();
    };
  }, [completeAuth]);

  // Window focus listener to immediately check authentication when returning to app
  useEffect(() => {
    const onFocus = () => {
      if (loading || !signIn) {
        void completeAuth();
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loading, signIn, completeAuth]);

  // Rapid polling loop while waiting for browser auth
  useEffect(() => {
    if (loading) {
      pollIntervalRef.current = setInterval(async () => {
        const success = await completeAuth();
        if (success) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
      }, 500);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [loading, completeAuth]);

  const handleGoogleAuth = async () => {
    if (!isLoaded || !signIn) return;
    try {
      setLoading(true);
      setErrorMsg("");

      const port = (await window.electronAPI?.getAuthPort?.()) || 49152;
      const redirectUrl = `http://127.0.0.1:${port}/sso-callback`;

      const res = await signIn.create({
        strategy: "oauth_google",
        redirectUrl,
      });

      const externalUrl = res.firstFactorVerification?.externalVerificationRedirectURL;
      if (externalUrl) {
        await window.electronAPI?.openExternal?.(externalUrl.toString());
      } else {
        throw new Error("Unable to generate Google sign-in URL.");
      }
    } catch (err: unknown) {
      console.error("Google Auth failed", err);
      const msg = err instanceof Error ? err.message : "Authentication error occurred.";
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-2.25rem)] w-full flex-col items-center justify-between bg-black text-white px-6 py-10 selection:bg-zinc-800">
      {/* Top Branding */}
      <div className="flex flex-col items-center text-center space-y-4 max-w-sm mt-4">
        {/* Modern 3D/Isometric Cube Icon */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-linear-to-b from-zinc-800 to-zinc-950 border border-zinc-700/60 shadow-2xl shadow-black/80">
          <div className="absolute inset-0 rounded-3xl bg-radial from-zinc-700/20 to-transparent pointer-events-none" />
          <svg
            className="h-12 w-12 text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.2)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m21.12 6.4-8.62-5a2 2 0 0 0-2 0l-8.62 5A2 2 0 0 0 1 8.13v7.74a2 2 0 0 0 1 1.73l8.62 5a2 2 0 0 0 2 0l8.62-5a2 2 0 0 0 1-1.73V8.13a2 2 0 0 0-1-1.73Z" />
            <path d="M12 22.5V12" />
            <path d="m21.4 7.6-9.4 5.4-9.4-5.4" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 12 3.3 7" />
            <path d="m12 12 8.7-5" />
          </svg>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            PocketCheck
          </h1>
          <p className="text-sm font-semibold text-zinc-400">
            Never forget your daily essentials again.
          </p>
        </div>

        {/* Feature Pill Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-1 text-xs font-bold text-zinc-300">
            <Sparkles className="h-3.5 w-3.5 text-zinc-400" /> Smart Presets
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-1 text-xs font-bold text-zinc-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-zinc-400" /> Departure Check
          </span>
        </div>
      </div>

      {/* Auth Action Card */}
      <div className="w-full max-w-sm space-y-4 my-auto">
        {errorMsg && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-xs font-bold text-red-400">
            {errorMsg}
          </div>
        )}

        <div className="space-y-3">
          <Button
            type="button"
            disabled={loading || !isLoaded}
            onClick={handleGoogleAuth}
            className="relative flex h-13 w-full items-center justify-center rounded-xl bg-white px-4 text-sm font-black text-black transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-lg shadow-white/5"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-black" />
                <span>Authenticating in browser...</span>
              </div>
            ) : (
              <>
                <GoogleIcon />
                <span>Continue with Google</span>
              </>
            )}
          </Button>

          {loading && (
            <p className="text-center text-xs font-semibold text-zinc-500 animate-pulse">
              Complete sign in on your browser window. PocketCheck will resume automatically.
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 text-center text-xs font-semibold text-zinc-600">
        <ShieldCheck className="h-4 w-4" />
        <span>Secure authentication powered by Clerk</span>
      </div>
    </div>
  );
}
