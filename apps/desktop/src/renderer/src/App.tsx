import { useState } from "react";
import { TitleBar } from "@/components/TitleBar";
import { Dashboard } from "@/components/Dashboard";

export default function App() {
  const [activeRoutine, setActiveRoutine] = useState<string>("Kampus");
  const [packedRatio, setPackedRatio] = useState<string>("0/0");

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
        <Dashboard onStatusChange={handleStatusChange} />
      </div>
    </div>
  );
}
