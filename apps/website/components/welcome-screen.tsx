import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WelcomeScreen() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 max-w-md mx-auto w-full space-y-8 animate-fadeIn">
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 rounded-2xl bg-primary text-primary-foreground shadow-md">
          <PackageCheck className="w-16 h-16" />
        </div>
        <h1 className="text-4xl font-black tracking-wide text-foreground">
          POCKET<span className="text-primary">CHECK</span>
        </h1>
        <p className="text-muted-foreground font-bold text-base leading-relaxed">
          Double-check your pockets before you step out! Create packing lists for work, the gym, or your custom routines.
        </p>
      </div>

      <div className="w-full space-y-4 pt-4">
        <SignInButton mode="modal">
          <Button className="w-full py-6 rounded-2xl text-lg uppercase tracking-wider font-black">
            Log In
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button
            variant="outline"
            className="w-full py-6 rounded-2xl text-lg uppercase tracking-wider font-black"
          >
            Create Account
          </Button>
        </SignUpButton>
      </div>
    </div>
  );
}
