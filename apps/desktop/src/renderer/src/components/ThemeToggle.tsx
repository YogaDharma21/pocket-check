import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={`Switch to ${isDark ? "Light" : "Dark"} mode (D)`}
      className="w-8 h-8 rounded-lg text-foreground hover:bg-muted"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-foreground transition-transform duration-200 rotate-0 scale-100" />
      ) : (
        <Moon className="w-4 h-4 text-foreground transition-transform duration-200 rotate-0 scale-100" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
