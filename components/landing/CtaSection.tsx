import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BriefcaseBusiness, ArrowRight } from "lucide-react";
import type { Dictionary } from "@/locales/en";

interface CtaSectionProps {
  isLoggedIn: boolean;
  t: Dictionary;
}

export function CtaSection({ isLoggedIn, t }: CtaSectionProps) {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 pt-10">
      <div className="bg-gradient-to-br from-[#0C4A6E] to-[#0369A1] rounded-[3rem] p-10 sm:p-16 text-center shadow-2xl relative overflow-hidden group border border-white/10">
        {/* Decorative icon */}
        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
          <BriefcaseBusiness className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 space-y-8">
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            {t.landing.climaxTitle}
          </h2>
          <p className="text-lg sm:text-xl text-white/85 font-semibold max-w-2xl mx-auto leading-relaxed">
            {t.landing.climaxSub}
          </p>

          {isLoggedIn ? (
            <Button asChild size="lg" className="bg-[#F97316] hover:bg-[#ea580c] text-white font-black px-10 h-16 rounded-2xl text-lg shadow-[0_8px_30px_rgb(249,115,22,0.45)] hover:-translate-y-1 transition-all duration-200 cursor-pointer">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="bg-[#F97316] hover:bg-[#ea580c] text-white font-black px-10 h-16 rounded-2xl text-lg shadow-[0_8px_30px_rgb(249,115,22,0.45)] hover:-translate-y-1 transition-all duration-200 cursor-pointer">
              <Link href="/register">
                {t.landing.getStarted}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
