import { SignInButton } from "@clerk/clerk-react";
import { isOnlineBackendConfigured } from "@/components/ConvexClientProvider";

function CubeLogo() {
  return (
    <svg
      className="h-12 w-12 text-black"
      viewBox="0 0 32 32"
      fill="currentColor"
    >
      <path d="M16 2.5L3.5 9.7V22.3L16 29.5L28.5 22.3V9.7L16 2.5ZM16 5.6L25.3 11L16 16.4L6.7 11L16 5.6ZM5.5 12.8L14.5 18V26.8L5.5 21.6V12.8ZM17.5 26.8V18L26.5 12.8V21.6L17.5 26.8Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function WelcomeScreen() {
  return (
    <div className="animate-fadeIn flex min-h-[calc(100vh-2.5rem)] w-full flex-col items-center justify-center bg-black px-6 py-12 text-white selection:bg-white selection:text-black">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        {/* Branding Icon Squircle */}
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-2xl transition-transform hover:scale-105 sm:h-28 sm:w-28 sm:rounded-[28px]">
          <CubeLogo />
        </div>

        {/* Title */}
        <h1 className="mb-3 text-3xl font-black tracking-wider uppercase sm:text-4xl">
          POCKET<span className="text-zinc-500">CHECKER</span>
        </h1>

        {/* Subtitle */}
        <p className="mb-10 text-sm leading-relaxed font-semibold text-zinc-400 sm:text-base">
          Double-check your pockets before you step out!
          <br />
          Never forget your keys, wallet, or phone again.
        </p>

        {/* Auth / Action Button Section */}
        <div className="flex w-full flex-col gap-3">
          {isOnlineBackendConfigured ? (
            <SignInButton mode="modal">
              <button
                type="button"
                className="flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-white font-black text-sm tracking-wider text-black uppercase shadow-lg transition-all hover:bg-zinc-100 active:scale-[0.98]"
              >
                <GoogleIcon />
                <span>CONTINUE WITH GOOGLE</span>
              </button>
            </SignInButton>
          ) : (
            <button
              type="button"
              className="flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-white font-black text-sm tracking-wider text-black uppercase shadow-lg transition-all hover:bg-zinc-100 active:scale-[0.98]"
            >
              <span>OPEN POCKETCHECK</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
