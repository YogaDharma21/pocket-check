import { SignInButton, SignUpButton } from "@clerk/nextjs"
import {
  PackageCheck,
  ShieldCheck,
  Smartphone,
  Check,
  Layers,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export function WelcomeScreen() {
  return (
    <div className="animate-fadeIn mx-auto flex w-full max-w-6xl flex-1 items-center justify-center p-4 sm:p-6 lg:p-12">
      <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Left / Hero Column */}
        <div className="space-y-6 text-center lg:col-span-7 lg:text-left">
          <div className="flex items-center justify-center gap-3 lg:justify-start">
            <div className="shrink-0 rounded-2xl bg-primary p-2.5 text-primary-foreground shadow-md sm:p-3">
              <PackageCheck className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
              POCKET<span className="text-primary">CHECK</span>
            </h1>
          </div>

          <p className="text-base leading-snug font-extrabold text-foreground/90 sm:text-xl">
            Never leave home without your essential items again.
          </p>

          <p className="mx-auto max-w-xl text-sm leading-relaxed font-bold text-muted-foreground sm:text-base lg:mx-0">
            Double-check your pockets before stepping out. Organize custom
            checklists for work, the gym, travel, or your daily adventures.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 gap-3 pt-2 text-left sm:grid-cols-3">
            <div className="space-y-1 rounded-2xl border border-border bg-card/60 p-3.5 shadow-xs">
              <div className="w-fit rounded-lg bg-primary/10 p-1.5 text-primary">
                <Layers className="h-4 w-4" />
              </div>
              <p className="text-xs font-black text-foreground">
                Custom Routines
              </p>
              <p className="text-[11px] font-bold text-muted-foreground">
                Work, Gym, Trips & custom lists
              </p>
            </div>

            <div className="space-y-1 rounded-2xl border border-border bg-card/60 p-3.5 shadow-xs">
              <div className="w-fit rounded-lg bg-primary/10 p-1.5 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="text-xs font-black text-foreground">
                1-Tap Verification
              </p>
              <p className="text-[11px] font-bold text-muted-foreground">
                Fast pocket check before leaving
              </p>
            </div>

            <div className="space-y-1 rounded-2xl border border-border bg-card/60 p-3.5 shadow-xs">
              <div className="w-fit rounded-lg bg-primary/10 p-1.5 text-primary">
                <Smartphone className="h-4 w-4" />
              </div>
              <p className="text-xs font-black text-foreground">
                Live Cloud Sync
              </p>
              <p className="text-[11px] font-bold text-muted-foreground">
                Always in sync across all devices
              </p>
            </div>
          </div>

          {/* Auth Action Buttons */}
          <div className="mx-auto flex max-w-md flex-col gap-3 pt-4 sm:flex-row lg:mx-0">
            <SignInButton mode="modal">
              <Button className="flex-1 cursor-pointer rounded-2xl py-6 text-base font-black tracking-wider uppercase shadow-md">
                Log In <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button
                variant="outline"
                className="flex-1 cursor-pointer rounded-2xl py-6 text-base font-black tracking-wider uppercase"
              >
                Create Account
              </Button>
            </SignUpButton>
          </div>
        </div>

        {/* Right / Interactive Preview Card (Visible on all screens, especially tablet & desktop) */}
        <div className="mx-auto w-full max-w-md lg:col-span-5">
          <Card className="overflow-hidden border-2 border-primary/20 shadow-xl backdrop-blur-xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/40 p-4 sm:p-5">
              <div className="flex items-center gap-2.5">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-chart-4/60" />
                <div className="h-3 w-3 rounded-full bg-chart-1/60" />
                <span className="ml-1 text-xs font-black tracking-wider text-muted-foreground uppercase">
                  Work Routine Preview
                </span>
              </div>
              <Badge variant="default" className="px-2 text-[10px] font-black">
                3/4 Packed
              </Badge>
            </CardHeader>

            <CardContent className="space-y-4 p-4 sm:p-5">
              {/* Progress Box */}
              <div className="space-y-2 rounded-xl border border-border bg-card p-3.5">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-foreground">75% Ready to leave</span>
                  <span className="font-bold text-primary">
                    1 item remaining
                  </span>
                </div>
                <Progress value={75} />
              </div>

              {/* Sample Checklist Items */}
              <div className="space-y-2 select-none">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                    <span className="text-sm font-black text-muted-foreground line-through">
                      House & Car Keys
                    </span>
                  </div>
                  <Badge
                    variant="default"
                    className="px-1.5 py-0 text-[9px] font-black"
                  >
                    Packed
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                    <span className="text-sm font-black text-muted-foreground line-through">
                      Wallet & Transit Card
                    </span>
                  </div>
                  <Badge
                    variant="default"
                    className="px-1.5 py-0 text-[9px] font-black"
                  >
                    Packed
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                    <span className="text-sm font-black text-muted-foreground line-through">
                      Smartphone & Earbuds
                    </span>
                  </div>
                  <Badge
                    variant="default"
                    className="px-1.5 py-0 text-[9px] font-black"
                  >
                    Packed
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-lg border-2 border-primary bg-card" />
                    <span className="text-sm font-black text-foreground">
                      Work ID & Office Badge
                    </span>
                  </div>
                  <Badge
                    variant="destructive"
                    className="px-1.5 py-0 text-[9px] font-black"
                  >
                    Missing
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
