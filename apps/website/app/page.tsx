"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";
import { WelcomeScreen } from "@/components/welcome-screen";
import { Dashboard } from "@/components/dashboard";

export default function Page() {
  return (
    <div className="bg-background text-foreground antialiased min-h-screen flex flex-col justify-between selection:bg-primary selection:text-primary-foreground">
      {/* Loading State */}
      <AuthLoading>
        <DashboardSkeleton />
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
