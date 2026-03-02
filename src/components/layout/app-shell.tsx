"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ProjectSidebar } from "@/components/layout/project-sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useUIStore } from "@/stores/ui-store";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  QrCode,
  LayoutDashboard,
  CreditCard,
  FolderOpen,
  BarChart3,
  Settings,
  Menu,
  Plus,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/create", label: "Create QR", icon: Plus },
  { href: "/cards", label: "Business Cards", icon: CreditCard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

function SidebarContent({
  selectedProjectId,
  onSelectProject,
  onNavigate,
}: {
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-4">
        <QrCode className="h-6 w-6 text-primary" />
        <Logo size="md" />
      </div>

      <ScrollArea className="flex-1 px-2">
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Projects section */}
        <div className="mt-6 border-t pt-4">
          <ProjectSidebar
            selectedProjectId={selectedProjectId}
            onSelectProject={onSelectProject}
          />
        </div>
      </ScrollArea>

      <div className="border-t px-4 py-3">
        <ThemeToggle />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const selectedProjectId = searchParams.get("projectId") ?? null;

  const handleSelectProject = useCallback(
    (projectId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (projectId) {
        params.set("projectId", projectId);
      } else {
        params.delete("projectId");
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      {isDesktop && (
        <aside className="hidden w-60 shrink-0 border-r bg-sidebar md:block">
          <SidebarContent
            selectedProjectId={selectedProjectId}
            onSelectProject={handleSelectProject}
          />
        </aside>
      )}

      {/* Mobile sidebar (sheet) */}
      {!isDesktop && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-60 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent
              selectedProjectId={selectedProjectId}
              onSelectProject={handleSelectProject}
              onNavigate={() => setSidebarOpen(false)}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile top bar */}
        {!isDesktop && (
          <header className="flex items-center gap-3 border-b px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Logo size="sm" />
          </header>
        )}

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
