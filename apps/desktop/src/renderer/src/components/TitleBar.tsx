import { useEffect, useState } from "react";
import { Minus, Square, Copy, X, User, LogIn } from "lucide-react";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isOnlineBackendConfigured } from "@/components/ConvexClientProvider";
import { Button } from "@/components/ui/button";

export function UserAuthMenu() {
  if (isOnlineBackendConfigured) {
    return (
      <div className="flex items-center gap-1.5 app-no-drag">
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "h-6 w-6 rounded-md",
                userButtonTrigger: "focus:shadow-none focus:outline-none cursor-pointer",
              },
            }}
          />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs font-bold gap-1 cursor-pointer"
            >
              <LogIn className="h-3 w-3" /> Log In
            </Button>
          </SignInButton>
        </SignedOut>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md select-none"
      title="Offline Desktop Mode"
    >
      <User className="h-3 w-3" />
      <span>Guest</span>
    </div>
  );
}

interface TitleBarProps {
  currentRoutine?: string;
  packedRatio?: string;
}

export function TitleBar({ currentRoutine, packedRatio }: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const isMac = typeof window !== "undefined" && window.electronAPI?.platform === "darwin";

  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI.isMaximized().then(setIsMaximized).catch(() => {});
    const unsubscribe = window.electronAPI.onMaximizeChange((maximized) => {
      setIsMaximized(maximized);
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => {
    window.electronAPI?.maximize().then(setIsMaximized).catch(() => {});
  };
  const handleClose = () => window.electronAPI?.close();

  return (
    <header
      className={`sticky top-0 z-50 flex h-10 w-full select-none items-center justify-between border-b border-border bg-card/85 backdrop-blur-md app-drag-region ${
        isMac ? "pl-20 pr-3" : "px-3"
      }`}
    >
      {/* Left: App Brand & Breadcrumb */}
      <div className="flex items-center gap-2 app-no-drag">
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary text-primary-foreground font-black text-xs shadow-xs">
          P
        </div>
        <span className="text-xs font-black tracking-tight text-foreground">PocketCheck</span>
        {currentRoutine && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
            <span className="text-border">/</span>
            <span className="text-foreground/90">{currentRoutine}</span>
            {packedRatio && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-extrabold text-foreground border border-border/50">
                {packedRatio}
              </span>
            )}
          </span>
        )}
      </div>

      {/* Center: Draggable Window Spacer */}
      <div className="flex-1 h-full min-w-4" />

      {/* Right: Actions & Window Controls */}
      <div className="flex items-center gap-1.5 app-no-drag">
        <UserAuthMenu />
        <ThemeToggle />

        {!isMac && (
          <div className="flex items-center ml-1 gap-0.5">
            <button
              type="button"
              onClick={handleMinimize}
              className="flex h-7 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Minimize"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleMaximize}
              className="flex h-7 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? (
                <Copy className="h-3 w-3 rotate-180" />
              ) : (
                <Square className="h-3 w-3" />
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-7 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
