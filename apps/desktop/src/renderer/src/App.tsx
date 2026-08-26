import { useState } from "react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { TitleBar } from "@/components/TitleBar";
import { Dashboard } from "@/components/Dashboard";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { isOnlineBackendConfigured } from "@/components/ConvexClientProvider";

export default function App() {
  const [activeRoutine, setActiveRoutine] = useState<string>("Kampus");
  const [packedRatio, setPackedRatio] = useState<string>("0/0");

  const handleStatusChange = (routine: string, ratio: string) => {
    setActiveRoutine(routine);
    setPackedRatio(ratio);
  };

  const isCallback =
    typeof window !== "undefined" &&
    (window.location.pathname === "/sso-callback" ||
      window.location.pathname.startsWith("/sso-callback"));

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground select-none">
      {/* Frameless Desktop TitleBar with dynamic status breadcrumb & window controls */}
      <TitleBar currentRoutine={activeRoutine} packedRatio={packedRatio} />

      {/* Main Content Viewport */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {isCallback ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-black p-12 text-white">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent mb-4" />
            <p className="text-xs font-bold text-zinc-400">Authenticating with Google...</p>
            <div className="hidden">
              <AuthenticateWithRedirectCallback
                afterSignInUrl="/"
                afterSignUpUrl="/"
              />
            </div>
          </div>
        ) : isOnlineBackendConfigured ? (
          <>
            <AuthLoading>
              <div className="flex h-full w-full items-center justify-center p-12 bg-black">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            </AuthLoading>
            <Unauthenticated>
              <WelcomeScreen />
            </Unauthenticated>
            <Authenticated>
              <Dashboard onStatusChange={handleStatusChange} />
            </Authenticated>
          </>
        ) : (
          <Dashboard onStatusChange={handleStatusChange} />
        )}
      </div>
    </div>
  );
}
