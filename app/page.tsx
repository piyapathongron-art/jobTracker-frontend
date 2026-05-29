"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useLangStore } from "@/store/useLangStore";
import { getDictionary } from "@/locales";
import {
  BriefcaseBusiness,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  Globe,
  FileSearch,
  Crosshair,
  MessageSquareText,
  Scale
} from "lucide-react";

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

  const toggleLanguage = () => {
    setLang(lang === "en" ? "th" : "en");
  };

  const features = [
    {
      icon: FileSearch,
      title: t.landing.feat1Title,
      description: t.landing.feat1Desc,
    },
    {
      icon: Crosshair,
      title: t.landing.feat2Title,
      description: t.landing.feat2Desc,
    },
    {
      icon: MessageSquareText,
      title: t.landing.feat3Title,
      description: t.landing.feat3Desc,
    },
    {
      icon: Scale,
      title: t.landing.feat4Title,
      description: t.landing.feat4Desc,
    },
  ];

  return (
    <div className="flex flex-col min-h-full font-sans bg-[#F0F9FF]">
      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 bg-[#F0F9FF]/80 backdrop-blur-md border-b border-[#0EA5E9]/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#0EA5E9] p-1.5 rounded-lg shadow-sm">
              <BriefcaseBusiness className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <span className="font-bold text-[#0C4A6E] tracking-tight text-xl">
              JobTracker
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="sm" onClick={toggleLanguage} className="text-[#0C4A6E] hover:bg-[#0EA5E9]/10 font-bold">
              <Globe className="h-4 w-4 mr-1.5" />
              {lang === "en" ? "TH" : "EN"}
            </Button>
            {isLoggedIn ? (
              <Button asChild size="sm" className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white font-semibold">
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="text-[#0C4A6E] hover:bg-[#0EA5E9]/10 hidden sm:flex font-bold">
                  <Link href="/login">{t.landing.login}</Link>
                </Button>
                <Button asChild size="sm" className="bg-[#F97316] hover:bg-[#ea580c] text-white font-bold shadow-md hover:shadow-lg transition-all">
                  <Link href="/register">{t.landing.getStarted}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ─── Section 1: Hero (The Hook) ─── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 px-4 py-1.5 text-xs font-bold text-[#0EA5E9] mb-8 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered by Gemini
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#0C4A6E] tracking-tight leading-[1.1] mb-6">
            {t.landing.heroTitle.split(". ")[0]}.<br className="hidden sm:block"/>{" "}
            <span className="text-[#0EA5E9]">{t.landing.heroTitle.split(". ")[1]}</span>
          </h1>

          <p className="text-lg sm:text-xl text-[#0C4A6E]/70 max-w-2xl mx-auto leading-relaxed font-medium mb-10">
            {t.landing.heroSub}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isLoggedIn ? (
              <Button asChild size="lg" className="bg-[#F97316] hover:bg-[#ea580c] text-white font-bold px-8 h-14 rounded-xl shadow-lg hover:-translate-y-1 transition-all">
                <Link href="/dashboard">
                  <LayoutDashboard className="h-5 w-5 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="bg-[#F97316] hover:bg-[#ea580c] text-white font-bold px-8 h-14 rounded-xl shadow-[0_8px_30px_rgb(249,115,22,0.3)] hover:-translate-y-1 transition-all text-lg">
                <Link href="/register">
                  {t.landing.getStarted}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            )}
          </div>
        </section>

        {/* ─── Section 2: Problem vs Solution ─── */}
        <section className="bg-white border-y border-[#0EA5E9]/10 py-20 relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="bg-[#F0F9FF] p-8 rounded-3xl border border-[#0EA5E9]/20 shadow-sm">
                <div className="h-12 w-12 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-2xl">😫</span>
                </div>
                <h3 className="text-2xl font-black text-[#0C4A6E] mb-3">{t.landing.probTitle}</h3>
                <p className="text-[#0C4A6E]/70 font-medium leading-relaxed">{t.landing.probDesc}</p>
              </div>
              <div className="bg-[#0EA5E9] p-8 rounded-3xl border border-[#0EA5E9] shadow-[0_20px_50px_rgb(14,165,233,0.3)] text-white transform md:-translate-y-6 transition-transform hover:-translate-y-8 duration-500">
                <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3">{t.landing.solTitle}</h3>
                <p className="text-white/90 font-medium leading-relaxed">{t.landing.solDesc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Section 3: Feature Highlights ─── */}
        <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-[#0C4A6E] mb-4">AI does the heavy lifting</h2>
            <p className="text-lg text-[#0C4A6E]/70 font-medium max-w-xl mx-auto">Four tools that turn your raw job hunt into a focused, strategic campaign.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="bg-white p-8 rounded-3xl border border-[#0EA5E9]/10 shadow-sm hover:shadow-xl hover:border-[#0EA5E9]/30 transition-all duration-300 group flex flex-col sm:flex-row gap-6 items-start">
                  <div className="h-14 w-14 shrink-0 rounded-2xl bg-[#F0F9FF] border border-[#0EA5E9]/20 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-inner">
                    <Icon className="h-7 w-7 text-[#0EA5E9]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0C4A6E] mb-2">{feature.title}</h3>
                    <p className="text-[#0C4A6E]/70 font-medium leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── Section 4: Climax CTA ─── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 pt-10">
          <div className="bg-gradient-to-br from-[#0C4A6E] to-[#0369A1] rounded-[2.5rem] p-10 sm:p-16 text-center shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
              <BriefcaseBusiness className="w-64 h-64 text-white" />
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">
                {t.landing.climaxTitle}
              </h2>
              <p className="text-lg sm:text-xl text-white/80 font-medium max-w-2xl mx-auto mb-10">
                {t.landing.climaxSub}
              </p>
              {isLoggedIn ? (
                <Button asChild size="lg" className="bg-[#F97316] hover:bg-[#ea580c] text-white font-bold px-10 h-16 rounded-2xl text-lg shadow-[0_8px_30px_rgb(249,115,22,0.4)] hover:-translate-y-1 transition-all">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="bg-[#F97316] hover:bg-[#ea580c] text-white font-bold px-10 h-16 rounded-2xl text-lg shadow-[0_8px_30px_rgb(249,115,22,0.4)] hover:-translate-y-1 transition-all">
                  <Link href="/register">{t.landing.getStarted} <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="bg-white border-t border-[#0EA5E9]/10 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-medium text-[#0C4A6E]/60">
          <div className="flex items-center gap-2">
            <div className="bg-[#0EA5E9] p-1.5 rounded-md">
              <BriefcaseBusiness className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-[#0C4A6E]">JobTracker</span>
          </div>
          <p>Personal AI Job Tracker — built with Next.js & Gemini</p>
        </div>
      </footer>
    </div>
  );
}
