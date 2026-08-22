"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { WelcomeScreen } from "@/components/welcome-screen";
import { Dashboard } from "@/components/dashboard";

export default function HomePage() {
  return (
    <div className="bg-background text-foreground antialiased min-h-screen flex flex-col justify-between selection:bg-primary selection:text-primary-foreground">
      {/* Loading State - clean background without flashing internal app skeleton */}
      <AuthLoading>
        <div className="flex-1 min-h-screen" />
      </AuthLoading>

      {/* Unauthenticated State */}
      <Unauthenticated>
        <WelcomeScreen />
      </Unauthenticated>

      {/* Authenticated State */}
      <Authenticated>
        <Dashboard />
      </Authenticated>
    </div>
  );
}
