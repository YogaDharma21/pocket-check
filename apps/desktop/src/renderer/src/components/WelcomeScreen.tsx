import { useState, useEffect, useRef, useCallback } from "react";
import { useSignIn, useClerk } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // Listen to IPC redirect broadcast from local loopback server or pocketcheck:// deep link
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

  // Window focus listener to immediately check authentication
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
    <div className="flex min-h-[calc(100vh-2.25rem)] w-full flex-col items-center justify-center bg-black text-white px-6 selection:bg-zinc-800">
      <div className="flex w-full max-w-sm flex-col items-center text-center space-y-8">
        {/* White Rounded Container with 3D Isometric Cube */}
        <div className="flex h-28 w-28 items-center justify-center rounded-lg bg-white shadow-2xl">
          <svg
            className="h-16 w-16 text-black"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            {/* Top Rhombus Face */}
            <path d="M12 2.8L19.4 6.8L12 10.8L4.6 6.8L12 2.8Z" />
            {/* Left Rhombus Face */}
            <path d="M3.8 8.4L11.2 12.4V20.8L3.8 16.8V8.4Z" />
            {/* Right Rhombus Face */}
            <path d="M20.2 8.4V16.8L12.8 20.8V12.4L20.2 8.4Z" />
          </svg>
        </div>

        {/* Title & Subtitle Matching Image */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider uppercase">
            <span className="text-white">POCKET</span>
            <span className="text-zinc-500">CHECKER</span>
          </h1>
          <div className="text-xs sm:text-sm font-semibold text-zinc-400 leading-relaxed max-w-xs mx-auto">
            <p>Double-check your pockets before you step out!</p>
            <p>Never forget your keys, wallet, or phone again.</p>
          </div>
        </div>

        {/* Auth Button */}
        <div className="w-full space-y-3 pt-2">
          {errorMsg && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center text-xs font-bold text-red-400">
              {errorMsg}
            </div>
          )}

          <Button
            type="button"
            disabled={loading || !isLoaded}
            onClick={handleGoogleAuth}
            className="flex h-14 w-full items-center justify-center rounded-lg bg-white px-6 font-black text-xs sm:text-sm tracking-wider text-black uppercase transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-lg"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-black" />
                <span>Authenticating in browser...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <svg className="h-5 w-5 fill-current text-black shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>CONTINUE WITH GOOGLE</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
