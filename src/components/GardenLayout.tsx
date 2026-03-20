import { GardenSidebar } from "./GardenSidebar";

interface GardenLayoutProps {
  children: React.ReactNode;
}

export function GardenLayout({ children }: GardenLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <GardenSidebar />
      <main className="flex-1 overflow-y-auto scroll-thin">
        {children}
      </main>
    </div>
  );
}
