"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, LogOut, User, Settings, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useLangStore } from "@/store/useLangStore";
import { getDictionary } from "@/locales";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const t = getDictionary(lang);

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
            <span className="font-semibold text-foreground tracking-tight">JobTracker</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="hidden sm:inline">{user?.name ?? user?.email ?? "User"}</span>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              className="cursor-pointer gap-1.5 text-muted-foreground hover:text-foreground font-semibold"
              onClick={toggleLang}
              aria-label={t.nav.language}
              title={t.nav.language}
            >
              <Languages className="h-4 w-4" />
              <span className="text-xs">
                <span className={lang === "en" ? "text-primary" : ""}>EN</span>
                <span className="mx-1 opacity-40">|</span>
                <span className={lang === "th" ? "text-primary" : ""}>TH</span>
              </span>
            </Button>

            <Link href="/dashboard/profile" passHref>
              <Button size="sm" variant="ghost" className="cursor-pointer gap-1.5 text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">{t.nav.profile}</span>
              </Button>
            </Link>

            <Button
              size="sm"
              variant="ghost"
              className="cursor-pointer gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t.nav.logout}</span>
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
