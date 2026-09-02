import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[260px] shrink-0 border-r border-border bg-card">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[280px]">
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto scroll-thin">
          <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 lg:px-8 py-4 md:py-6 animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
