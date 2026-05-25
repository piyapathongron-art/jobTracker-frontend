"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  function handleSignOut() {
    clearAuth();
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <BriefcaseBusiness className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground tracking-tight">JobTracker</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="hidden sm:inline">{user?.name ?? user?.email ?? "User"}</span>
            </div>
            
            <Link href="/dashboard/profile" passHref>
              <Button size="sm" variant="ghost" className="cursor-pointer gap-1.5 text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
            </Link>

            <Button
              size="sm"
              variant="ghost"
              className="cursor-pointer gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
