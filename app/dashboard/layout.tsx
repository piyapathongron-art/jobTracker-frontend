"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, LogOut, Settings, Languages, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useLangStore } from "@/store/useLangStore";
import { useInsightsStore } from "@/store/useInsightsStore";
import { getDictionary } from "@/locales";
import { CURRENT_APP_VERSION } from "@/components/ReleaseNotesModal";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const fetchTrending = useInsightsStore((s) => s.fetchTrending);
  const t = getDictionary(lang);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  function handleSignOut() {
    clearAuth();
    router.replace("/");
  }

  function toggleLang() {
    setLang(lang === "en" ? "th" : "en");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <BriefcaseBusiness className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground tracking-tight flex items-center gap-2">
              JobTracker
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {user && user.hasResume === false && (
              <Link href="/dashboard/profile" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-200 animate-pulse hover:bg-amber-100 transition-colors" title="Upload your master resume in Profile to unlock AI features">
                <AlertCircle className="h-3.5 w-3.5" />
                Missing Resume
              </Link>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 rounded-full flex items-center gap-2 pl-2 pr-4 hover:bg-muted/50 border border-transparent hover:border-border transition-colors">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {(user?.name?.[0] ?? user?.email?.[0] ?? "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user?.name ?? user?.email ?? "User"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name ?? "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/dashboard/profile" className="w-full flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t.nav.profile}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer flex items-center justify-between" onClick={toggleLang}>
                  <div className="flex items-center">
                    <Languages className="mr-2 h-4 w-4" />
                    <span>{t.nav.language}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-semibold uppercase">{lang}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t.nav.logout}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="p-2 text-center">
                  <span className="text-[10px] text-muted-foreground">Version {CURRENT_APP_VERSION}</span>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
