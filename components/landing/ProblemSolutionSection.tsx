import { Sparkles, Clock, CheckCircle2 } from "lucide-react";
import type { Dictionary } from "@/locales/en";

interface ProblemSolutionSectionProps {
  t: Dictionary;
}

export function ProblemSolutionSection({ t }: ProblemSolutionSectionProps) {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-stretch">

          {/* Problem */}
          <div className="bg-white/60 backdrop-blur-sm p-8 sm:p-10 rounded-[2.5rem] border border-red-200 flex flex-col justify-between shadow-sm group hover:border-red-300 transition-all duration-300">
            <div className="space-y-6">
              <div className="h-14 w-14 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100 shadow-inner group-hover:scale-105 transition-transform duration-300">
                <Clock className="h-7 w-7 text-red-500" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-[#0C4A6E] tracking-tight">{t.landing.probTitle}</h3>
                <p className="text-[#0C4A6E]/80 font-semibold leading-relaxed">{t.landing.probDesc}</p>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-red-100 text-xs font-bold text-red-500/80 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Inability to scale your job hunt manually
            </div>
          </div>

          {/* Solution */}
          <div className="bg-[#0EA5E9] text-white p-8 sm:p-10 rounded-[2.5rem] border border-[#0EA5E9] shadow-[0_20px_50px_rgba(14,165,233,0.35)] flex flex-col justify-between transform md:-translate-y-6 transition-all duration-500 hover:-translate-y-8 group">
            <div className="space-y-6">
              <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/25 shadow-inner group-hover:scale-110 group-hover:rotate-2 transition-transform duration-300">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-white tracking-tight">{t.landing.solTitle}</h3>
                <p className="text-white/95 font-semibold leading-relaxed">{t.landing.solDesc}</p>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/20 text-xs font-bold text-white/90 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Instant pipeline tracking &amp; AI-optimized deliverables
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
