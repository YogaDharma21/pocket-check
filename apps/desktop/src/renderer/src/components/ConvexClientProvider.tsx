import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { dark } from "@clerk/themes";
import { InMemoryConvexDB, Item, Routine } from "@/lib/db";

const clerkPublishableKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "";

const convexUrl =
  import.meta.env.VITE_CONVEX_URL ||
  import.meta.env.NEXT_PUBLIC_CONVEX_URL ||
  "";

export const isOnlineBackendConfigured = Boolean(
  clerkPublishableKey &&
  typeof clerkPublishableKey === "string" &&
  clerkPublishableKey.startsWith("pk_") &&
  convexUrl &&
  typeof convexUrl === "string" &&
  convexUrl.startsWith("http")
);

// Offline Context for Standalone Mode
export interface OfflineDataContextType {
  db: InMemoryConvexDB;
  userId: string;
  isOfflineMode: boolean;
  routines: Routine[];
  items: Item[];
  activeRoutine: string;
  setActiveRoutine: (routine: string) => void;
  refresh: () => void;
}

const OfflineDataContext = createContext<OfflineDataContextType | null>(null);

export function useOfflineData() {
  const ctx = useContext(OfflineDataContext);
  if (!ctx) {
    const fallbackDb = new InMemoryConvexDB("pocketcheck_desktop");
    return {
      db: fallbackDb,
      userId: "local_desktop_user",
      isOfflineMode: true,
      routines: [],
      items: [],
      activeRoutine: "Kampus",
      setActiveRoutine: () => {},
      refresh: () => {},
    };
  }
  return ctx;
}

export function OfflineDataProvider({ children }: { children: ReactNode }) {
  const [db] = useState(() => new InMemoryConvexDB("pocketcheck_desktop"));
  const userId = "local_desktop_user";
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [activeRoutine, setActiveRoutine] = useState<string>("Kampus");

  const reloadData = () => {
    db.listRoutines(userId).then((rList) => {
      setRoutines(rList);
      if (rList.length > 0) {
        if (!rList.some((r) => r.name.toLowerCase() === activeRoutine.toLowerCase())) {
          setActiveRoutine(rList[0].name);
        }
      }
    });
  };

  useEffect(() => {
    reloadData();
    const unsub = db.subscribe(() => {
      reloadData();
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (activeRoutine) {
      db.listItems(userId, activeRoutine).then((iList) => {
        setItems(iList);
      });
    }
  }, [activeRoutine, routines]);

  return (
    <OfflineDataContext.Provider
      value={{
        db,
        userId,
        isOfflineMode: true,
        routines,
        items,
        activeRoutine,
        setActiveRoutine,
        refresh: reloadData,
      }}
    >
      {children}
    </OfflineDataContext.Provider>
  );
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convexClient = useMemo(() => {
    if (isOnlineBackendConfigured) {
      return new ConvexReactClient(convexUrl);
    }
    return null;
  }, []);

  if (isOnlineBackendConfigured && convexClient) {
    return (
      <ClerkProvider publishableKey={clerkPublishableKey} appearance={{ baseTheme: dark }}>
        <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
          <OfflineDataProvider>{children}</OfflineDataProvider>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    );
  }

  // Standalone Offline Mode with Persistent LocalStorage & reactive DB
  return <OfflineDataProvider>{children}</OfflineDataProvider>;
}
