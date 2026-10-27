"use client";

import { ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { dark } from "@clerk/themes";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  process.env.VITE_CONVEX_URL ||
  "https://placeholder.convex.cloud";

const convex = new ConvexReactClient(convexUrl);

const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  process.env.VITE_CLERK_PUBLISHABLE_KEY ||
  "";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      appearance={dark}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
