import { BriefcaseBusiness, ShieldCheck } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="bg-white border-t border-[#0EA5E9]/10 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm font-semibold text-[#0C4A6E]/60">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#0EA5E9] p-1.5 rounded-lg shadow-sm">
            <BriefcaseBusiness className="h-4 w-4 text-white" />
          </div>
          <span className="font-extrabold text-[#0C4A6E]">JobTracker</span>
        </div>

        <p className="text-center font-medium">
          &copy; {new Date().getFullYear()} Personal AI Job Tracker — built with Next.js &amp; Gemini
        </p>

        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#0EA5E9]" />
          <span className="font-bold text-xs uppercase tracking-wider">Secure Data Privacy</span>
        </div>
      </div>
    </footer>
  );
}
