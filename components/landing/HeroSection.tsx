"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, ArrowRight, Users, ChevronRight } from "lucide-react";
import type { Dictionary } from "@/locales/en";

interface HeroSectionProps {
  isLoggedIn: boolean;
  t: Dictionary;
}

export function HeroSection({ isLoggedIn, t }: HeroSectionProps) {
  return (
    <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-20 text-center overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#38BDF8]/20 to-[#0EA5E9]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Social Proof Badge */}
      <div className="inline-flex items-center gap-2 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 px-4 py-1.5 text-xs font-extrabold text-[#0EA5E9] mb-8 shadow-sm">
        <Users className="h-3.5 w-3.5" />
        {t.landing.socialProofBadge}
      </div>

      {/* Headline */}
      <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#0C4A6E] tracking-tight leading-[1.15] mb-6 drop-shadow-sm">
        {t.landing.heroTitlePart1}
        <br className="hidden sm:block" />{" "}
        <span className="bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] bg-clip-text text-transparent">
          {t.landing.heroTitlePart2}
        </span>
      </h1>

      {/* Sub-headline */}
      <p className="text-lg sm:text-xl text-[#0C4A6E]/80 max-w-3xl mx-auto leading-relaxed font-semibold mb-10">
        {t.landing.heroSub}
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
        {isLoggedIn ? (
          <Button asChild size="lg" className="bg-[#F97316] hover:bg-[#ea580c] text-white font-black px-8 h-14 rounded-2xl shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer text-lg">
            <Link href="/dashboard">
              <LayoutDashboard className="h-5 w-5 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
        ) : (
          <>
            <Button asChild size="lg" className="bg-[#F97316] hover:bg-[#ea580c] text-white font-black px-8 h-14 rounded-2xl shadow-[0_8px_30px_rgb(249,115,22,0.35)] hover:-translate-y-1 transition-all duration-200 cursor-pointer text-lg">
              <Link href="/register">
                {t.landing.getStarted}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Link href="#line-bot" className="flex items-center gap-1 text-sm font-bold text-[#0EA5E9] px-4 py-2 hover:underline cursor-pointer">
              <span>Explore LINE Bot</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-[#0EA5E9]/15">
        {[
          { value: t.landing.metric1Value, label: t.landing.metric1Label },
          { value: t.landing.metric2Value, label: t.landing.metric2Label },
          { value: t.landing.metric3Value, label: t.landing.metric3Label },
          { value: t.landing.metric4Value, label: t.landing.metric4Label },
        ].map((m) => (
          <div key={m.label} className="bg-white/40 backdrop-blur-sm p-4 rounded-2xl border border-[#0EA5E9]/10 text-center shadow-inner">
            <div className="text-2xl sm:text-3xl font-black text-[#0EA5E9] mb-1">{m.value}</div>
            <div className="text-xs font-extrabold text-[#0C4A6E]/70 uppercase tracking-wider">{m.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
