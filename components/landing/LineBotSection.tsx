import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BriefcaseBusiness, Sparkles, QrCode, ArrowRight, Check } from "lucide-react";
import type { Dictionary } from "@/locales/en";

interface LineBotSectionProps {
  t: Dictionary;
}

const STEPS = (t: Dictionary) => [
  { title: t.landing.lineStep1Title, desc: t.landing.lineStep1Desc },
  { title: t.landing.lineStep2Title, desc: t.landing.lineStep2Desc },
  { title: t.landing.lineStep3Title, desc: t.landing.lineStep3Desc },
];

export function LineBotSection({ t }: LineBotSectionProps) {
  return (
    <section id="line-bot" className="bg-white border-y border-[#0EA5E9]/10 py-24 relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[#00B900]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* ── Left Column ── */}
          <div className="lg:col-span-7 space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-[#00B900]/10 border border-[#00B900]/25 px-4 py-1.5 text-xs font-extrabold text-[#00B900]">
              <Sparkles className="h-3.5 w-3.5 fill-[#00B900]/20" />
              {t.landing.heroBadge}
            </div>

            {/* Copy */}
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0C4A6E] tracking-tight leading-tight">
                {t.landing.lineTitle}
              </h2>
              <p className="text-xl font-bold text-[#0EA5E9] leading-snug">{t.landing.lineSubtitle}</p>
              <p className="text-base text-[#0C4A6E]/80 font-semibold leading-relaxed">{t.landing.lineDesc}</p>
            </div>

            {/* Step Timeline */}
            <div className="relative pl-6 border-l-2 border-[#0EA5E9]/20 space-y-6">
              {STEPS(t).map((step, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-[35px] top-1 h-6 w-6 rounded-full bg-white border-2 border-[#0EA5E9] flex items-center justify-center text-xs font-black text-[#0EA5E9] group-hover:bg-[#0EA5E9] group-hover:text-white transition-all duration-300 shadow-sm">
                    {idx + 1}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg text-[#0C4A6E]">{step.title}</h4>
                    <p className="text-sm font-medium text-[#0C4A6E]/70">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* LINE CTA */}
            <Button
              asChild
              size="lg"
              className="bg-[#00B900] hover:bg-[#009E00] text-white font-black px-8 h-14 rounded-2xl shadow-[0_8px_30px_rgb(0,185,0,0.3)] hover:-translate-y-1 hover:shadow-[0_12px_35px_rgb(0,185,0,0.45)] transition-all duration-200 cursor-pointer text-lg w-full sm:w-auto"
            >
              <Link href="https://lin.ee/R0D9RyY" target="_blank">
                <QrCode className="h-5 w-5 mr-2" />
                {t.landing.lineCta}
              </Link>
            </Button>
          </div>

          {/* ── Right Column: CSS Phone Mockup ── */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[340px] aspect-[9/18.5] rounded-[48px] border-8 border-slate-900 bg-slate-900 shadow-[0_25px_60px_-15px_rgba(12,74,110,0.35)] overflow-hidden flex flex-col hover:scale-[1.01] transition-transform duration-300">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-30 flex items-center justify-center">
                <div className="w-12 h-1 bg-slate-800 rounded-full mb-1" />
              </div>

              {/* LINE Header */}
              <div className="bg-[#00B900] text-white pt-7 pb-3 px-4 flex items-center gap-3.5 shadow-sm z-20 shrink-0">
                <span className="text-white font-black text-sm shrink-0">〈</span>
                <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center border border-white/10 relative shrink-0">
                  <BriefcaseBusiness className="h-4 w-4 text-white" />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#22C55E] border-2 border-[#00B900] animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-[13px] leading-tight flex items-center gap-1">
                    น้องจ๊อบแจ๊บ
                    <span className="bg-white/20 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">Bot</span>
                  </span>
                  <span className="text-[10px] text-white/80 font-bold">Active now</span>
                </div>
              </div>

              {/* Chat Screen */}
              <div className="flex-1 bg-[#8C9EB3] p-3 space-y-4 overflow-y-auto text-xs min-h-[440px] flex flex-col justify-end z-10">
                <div className="self-center bg-black/10 text-white font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
                  Today
                </div>

                {/* User bubble */}
                <div className="flex flex-col items-end space-y-1 self-end max-w-[85%]">
                  <div className="bg-[#85E249] text-slate-800 p-2.5 rounded-2xl rounded-tr-none shadow-sm font-semibold break-all text-[11px] leading-relaxed">
                    https://techcorp.jobs/senior-frontend
                  </div>
                  <span className="text-[9px] text-slate-200 font-bold self-end pr-1">Read 17:21</span>
                </div>

                {/* Bot scanning bubble */}
                <div className="flex gap-2 items-start max-w-[85%] self-start">
                  <div className="h-7 w-7 rounded-full bg-[#00B900] flex items-center justify-center shrink-0 shadow-sm">
                    <BriefcaseBusiness className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <div className="bg-white text-slate-800 p-2.5 rounded-2xl rounded-tl-none shadow-sm font-semibold text-[11px] leading-relaxed">
                      ✨ ได้เลย! น้องจ๊อบแจ๊บกำลังสแกนหน้าเว็บและเซฟลง Dashboard ให้คุณนะ...
                    </div>
                    <span className="text-[9px] text-slate-200 font-bold pl-1">17:21</span>
                  </div>
                </div>

                {/* Bot parsed card bubble */}
                <div className="flex gap-2 items-start max-w-[90%] self-start">
                  <div className="h-7 w-7 rounded-full bg-[#00B900] flex items-center justify-center shrink-0 shadow-sm">
                    <BriefcaseBusiness className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="space-y-1 w-full">
                    <div className="bg-white text-slate-800 p-3.5 rounded-2xl rounded-tl-none shadow-md border-t-4 border-[#0EA5E9] space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-[#0EA5E9]" />
                          <span className="font-extrabold text-[9px] text-[#0C4A6E] tracking-wider uppercase">Jobjab Saved</span>
                        </div>
                        <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">WISHLIST</span>
                      </div>
                      <div className="space-y-1">
                        <h5 className="font-black text-[12px] text-[#0C4A6E] leading-tight">Senior Frontend Developer</h5>
                        <p className="font-bold text-[10px] text-slate-600">TechCorp Co., Ltd.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[9px] bg-slate-50 p-2 rounded-lg font-bold text-[#0C4A6E]">
                        <div>
                          <span className="text-slate-400 block text-[8px]">Location</span>
                          Bangkok (Hybrid)
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[8px]">Salary</span>
                          80k - 120k THB
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[9.5px] font-extrabold text-emerald-600 pt-1">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                        <span>บันทึกสำเร็จ! 🎉</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-200 font-bold pl-1">17:22</span>
                  </div>
                </div>
              </div>

              {/* Chat Input Mock */}
              <div className="bg-white p-3 border-t border-slate-100 flex items-center gap-2 z-20 shrink-0">
                <div className="flex-1 bg-slate-100 rounded-full h-8 px-4 flex items-center text-slate-400 text-[10px] font-medium">
                  Type a message or paste URL...
                </div>
                <div className="h-8 w-8 rounded-full bg-[#00B900] flex items-center justify-center cursor-pointer shadow-inner">
                  <ArrowRight className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
