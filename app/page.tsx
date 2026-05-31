"use client";

import { useSyncExternalStore } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useLangStore } from "@/store/useLangStore";
import { getDictionary } from "@/locales";

import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { LineBotSection } from "@/components/landing/LineBotSection";
import { ProblemSolutionSection } from "@/components/landing/ProblemSolutionSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const t = getDictionary(lang);

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isLoggedIn = isMounted && !!user;
  const toggleLanguage = () => setLang(lang === "en" ? "th" : "en");

  return (
    <div className="flex flex-col min-h-full font-sans bg-[#F0F9FF] text-[#0C4A6E]">
      <LandingNavbar lang={lang} isLoggedIn={isLoggedIn} t={t} onToggleLanguage={toggleLanguage} />

      <main className="flex-1">
        <HeroSection isLoggedIn={isLoggedIn} t={t} />
        <LineBotSection t={t} />
        <ProblemSolutionSection t={t} />
        <FeaturesSection t={t} />
        {/* <TestimonialsSection t={t} /> */}
        <CtaSection isLoggedIn={isLoggedIn} t={t} />
      </main>

      <LandingFooter />
    </div>
  );
}
