"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BriefcaseBusiness, LayoutDashboard, Globe } from "lucide-react";
import type { Dictionary } from "@/locales/en";

interface LandingNavbarProps {
  lang: string;
  isLoggedIn: boolean;
  t: Dictionary;
  onToggleLanguage: () => void;
}

export function LandingNavbar({ lang, isLoggedIn, t, onToggleLanguage }: LandingNavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#F0F9FF]/85 backdrop-blur-md border-b border-[#0EA5E9]/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="bg-[#0EA5E9] p-2 rounded-xl shadow-sm hover:scale-105 transition-transform duration-200">
            <BriefcaseBusiness className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <span className="font-extrabold text-[#0C4A6E] tracking-tight text-xl">JobTracker</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleLanguage}
            className="text-[#0C4A6E] hover:bg-[#0EA5E9]/10 font-bold cursor-pointer rounded-xl"
          >
            <Globe className="h-4 w-4 mr-1.5" />
            {lang === "en" ? "TH" : "EN"}
          </Button>

          {isLoggedIn ? (
            <Button asChild size="sm" className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white font-bold cursor-pointer rounded-xl shadow-sm transition-all duration-200">
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                <span>Dashboard</span>
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="text-[#0C4A6E] hover:bg-[#0EA5E9]/10 hidden sm:flex font-bold cursor-pointer rounded-xl">
                <Link href="/login">{t.landing.login}</Link>
              </Button>
              <Button asChild size="sm" className="bg-[#F97316] hover:bg-[#ea580c] text-white font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer rounded-xl hover:-translate-y-0.5">
                <Link href="/register">{t.landing.getStarted}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
