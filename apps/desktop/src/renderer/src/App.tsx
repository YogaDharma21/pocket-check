import { useState } from "react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { TitleBar } from "@/components/TitleBar";
import { Dashboard } from "@/components/Dashboard";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { isOnlineBackendConfigured } from "@/components/ConvexClientProvider";

export default function App() {
  const [activeRoutine, setActiveRoutine] = useState<string>("Kampus");
  const [packedRatio, setPackedRatio] = useState<string>("0/0");
  const [guestMode, setGuestMode] = useState<boolean>(false);

  const handleStatusChange = (routine: string, ratio: string) => {
    setActiveRoutine(routine);
    setPackedRatio(ratio);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground select-none">
      {/* Frameless Desktop TitleBar with dynamic status breadcrumb & window controls */}
      <TitleBar currentRoutine={activeRoutine} packedRatio={packedRatio} />

      {/* Main Content Viewport */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {isOnlineBackendConfigured && !guestMode ? (
          <>
            <AuthLoading>
              <div className="flex h-full w-full items-center justify-center p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            </AuthLoading>
            <Unauthenticated>
              <WelcomeScreen onContinueAsGuest={() => setGuestMode(true)} />
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
