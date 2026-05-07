import { GardenSidebar } from "./GardenSidebar";
import { TrialBanner } from "./TrialBanner";
import { CompostoFAB } from "./CompostoFAB";

interface GardenLayoutProps {
  children: React.ReactNode;
}

export function GardenLayout({ children }: GardenLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <GardenSidebar />
      <main className="flex-1 overflow-y-auto scroll-thin pt-14 md:pt-0">
        <TrialBanner />
        {children}
      </main>
      <CompostoFAB />
    </div>
  );
}

