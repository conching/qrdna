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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/stores/ui-store";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useUser } from "@/hooks/use-user";
import { useAuth } from "@/hooks/use-auth";
import {
  QrCode,
  LayoutDashboard,
  CreditCard,
  FolderOpen,
  BarChart3,
  Settings,
  Menu,
  Plus,
  LogOut,
  ChevronsUpDown,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/create", label: "Create QR", icon: Plus },
  { href: "/cards", label: "Business Cards", icon: CreditCard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

function getInitials(email?: string, displayName?: string | null): string {
  if (displayName) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }
  if (email) {
    const local = email.split("@")[0];
    return local.slice(0, 2).toUpperCase();
  }
  return "??";
}

function UserMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { user, loading } = useUser();
  const { signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const displayLabel = user.display_name || user.email || "User";
  const initials = getInitials(user.email, user.display_name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
            "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <Avatar className="h-8 w-8">
            {user.avatar_url && (
              <AvatarImage src={user.avatar_url} alt={displayLabel} />
            )}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="flex items-center gap-1.5 truncate font-medium">
              <span className="truncate">
                {user.display_name || user.email}
              </span>
              {user.isPro && (
                <Badge
                  variant="default"
                  className="shrink-0 px-1.5 py-0 text-[10px]"
                >
                  <Sparkles className="mr-0.5 h-2.5 w-2.5" />
                  Pro
                </Badge>
              )}
            </span>
            {user.display_name && user.email && (
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.display_name || "My Account"}
            </p>
            {user.email && (
              <p className="truncate text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/settings"
            onClick={onNavigate}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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

      {/* User profile section */}
      <div className="border-t px-1 py-2">
        <UserMenu onNavigate={onNavigate} />
      </div>

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
