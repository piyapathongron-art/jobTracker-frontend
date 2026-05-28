"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/axios";
import type { JobApplication, Status } from "@/lib/types";
import {
  Loader2,
  Sparkles,
  Building2,
  MapPin,
  DollarSign,
  Briefcase,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Navigation,
  BrainCircuit,
  TrendingUp,
} from "lucide-react";

interface Props {
  jobs: JobApplication[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ComparisonData {
  comparisons: {
    jobId: string;
    commuteEstimationEn: string;
    commuteEstimationTh: string;
    prosEn: string[];
    prosTh: string[];
    consEn: string[];
    consTh: string[];
    overallScore: number;
  }[];
  recommendationEn: string;
  recommendationTh: string;
}

const STATUS_VARIANT: Record<Status, string> = {
  WISHLIST:     "bg-slate-100 text-slate-700 border-slate-200",
  APPLIED:      "bg-blue-50 text-blue-700 border-blue-200",
  INTERVIEWING: "bg-violet-50 text-violet-700 border-violet-200",
  OFFERED:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED:     "bg-red-50 text-red-700 border-red-200",
  GHOSTED:      "bg-orange-50 text-orange-700 border-orange-200",
};

export function CompareJobsModal({ jobs, open, onOpenChange }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ComparisonData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset results when modal closes or jobs change
  useEffect(() => {
    if (!open) {
      const reset = () => {
        setData(null);
        setError(null);
      };
      reset();
    }
  }, [open, jobs]);

  async function handleCompare() {
    if (jobs.length < 2) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post("/api/ai/compare-jobs", {
        jobIds: jobs.map((j) => j.id),
      });
      setData(res.data);
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || "Failed to compare jobs.");
    } finally {
      setIsLoading(false);
    }
  }

  function fmtSalary(job: JobApplication) {
    const sym = job.salaryCurrency === "USD" ? "$" : "฿";
    const f = (n: number) => n >= 1000 ? `${sym}${(n / 1000).toFixed(0)}k` : `${sym}${n}`;
    if (!job.salaryMin && !job.salaryMax) return "N/A";
    return job.salaryMin && job.salaryMax
      ? `${f(job.salaryMin)}-${f(job.salaryMax)}`
      : job.salaryMin ? `${f(job.salaryMin)}+` : `<${f(job.salaryMax!)}`;
  }

  // Calculate highest salary for highlighting
  const maxSalaries = jobs.map(j => j.salaryMax || j.salaryMin || 0);
  const highestSalary = Math.max(...maxSalaries, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-[100dvh] max-w-none max-h-none rounded-none p-4 sm:p-6 sm:h-auto sm:max-h-[90vh] sm:max-w-[95vw] lg:max-w-6xl sm:rounded-xl overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="h-6 w-6 text-primary" />
            Job Comparison
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6 space-y-8">
          {/* Comparison Grid */}
          <div className={`grid grid-cols-1 ${jobs.length === 3 ? "lg:grid-cols-3" : "md:grid-cols-2"} gap-6 lg:gap-8`}>
            {jobs.map((job) => {
              const aiData = data?.comparisons.find((c) => c.jobId === job.id);
              const isHighestSalary = highestSalary > 0 && (job.salaryMax === highestSalary || (!job.salaryMax && job.salaryMin === highestSalary));
              const maxScore = data ? Math.max(...data.comparisons.map((c) => c.overallScore)) : 0;
              const isRecommended = data && aiData?.overallScore === maxScore && maxScore > 0;
              
              return (
                <div 
                  key={job.id} 
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col bg-card ${
                    isRecommended 
                      ? "border-primary shadow-[4px_4px_0_0_rgba(37,99,235,0.3)] md:scale-105 z-10" 
                      : "border-border/60 hover:border-primary/50 shadow-[4px_4px_0_0_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]"
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase shadow-md flex items-center gap-1.5 whitespace-nowrap">
                      <Sparkles className="h-3.5 w-3.5" />
                      AI Recommended
                    </div>
                  )}

                  {/* Header: Role & Company */}
                  <div className={`pb-4 border-b-2 border-dashed ${isRecommended ? "border-primary/20" : "border-border/50"}`}>
                    <h3 className="font-bold text-xl leading-tight min-h-[3rem] text-foreground tracking-tight">{job.role}</h3>
                    <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-2 font-medium">
                      <div className={`p-1.5 rounded-md ${isRecommended ? "bg-primary/10 text-primary" : "bg-muted"}`}>
                        <Building2 className="h-3.5 w-3.5" />
                      </div>
                      {job.company}
                    </div>
                  </div>

                  {/* Core Data List */}
                  <div className="space-y-4 text-sm flex-1 pt-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-muted-foreground font-medium">
                        <Briefcase className="h-4 w-4" />
                        <span>Status</span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] font-black tracking-wider uppercase h-6 px-2.5 ${STATUS_VARIANT[job.status]}`}>
                        {job.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-muted-foreground font-medium">
                        <Navigation className="h-4 w-4" />
                        <span>Work Mode</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-black tracking-wider uppercase h-6 px-2.5">
                        {job.workMode}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-muted-foreground font-medium">
                        <MapPin className="h-4 w-4" />
                        <span>Location</span>
                      </div>
                      <span className="font-semibold text-right max-w-[140px] truncate" title={job.location || "N/A"}>{job.location || "N/A"}</span>
                    </div>

                    <div className={`p-3 mt-4 rounded-xl flex items-center justify-between ${isHighestSalary ? "bg-green-50 border-2 border-green-200" : "bg-muted/30 border border-muted"}`}>
                      <div className={`flex items-center gap-2.5 font-bold ${isHighestSalary ? "text-green-700" : "text-muted-foreground"}`}>
                        <DollarSign className="h-4 w-4" />
                        <span>Salary</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`font-black text-base ${isHighestSalary ? "text-green-700" : "text-foreground"}`}>
                          {fmtSalary(job)}
                        </span>
                        {isHighestSalary && (
                          <div className="flex items-center text-green-600 text-[9px] font-black uppercase tracking-widest mt-0.5">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Top Offer
                          </div>
                        )}
                      </div>
                    </div>

                    {job.notes && (
                      <div className="pt-4 mt-4 border-t-2 border-dashed border-border/50">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                          Personal Notes
                        </p>
                        <p className="text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap p-3 rounded-xl bg-muted/20 border border-muted/50 italic">
                          &quot;{job.notes}&quot;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* AI Results Section within each card */}
                  {aiData && (
                    <div className={`mt-6 pt-6 border-t-2 ${isRecommended ? "border-primary/20" : "border-border/50"} space-y-5 animate-in fade-in slide-in-from-top-4 duration-500`}>
                      <div className={`p-4 rounded-xl border-2 ${isRecommended ? "bg-primary/5 border-primary/20 text-primary" : "bg-muted/30 border-muted text-foreground/80"}`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 ${isRecommended ? "text-primary" : "text-muted-foreground"}`}>
                          <Navigation className="h-3.5 w-3.5" /> Commute
                        </p>
                        <p className="text-xs font-semibold leading-relaxed">
                          {aiData.commuteEstimationEn}
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <p className="text-[10px] font-black uppercase text-green-600 tracking-widest flex items-center gap-1.5">
                          <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
                            <TrendingUp className="h-2.5 w-2.5" />
                          </div>
                          Pros
                        </p>
                        <ul className="space-y-2">
                          {aiData.prosEn.map((p, i) => (
                            <li key={i} className="text-xs font-medium flex items-start gap-2.5 leading-snug">
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                              <span className="text-foreground/90">{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2.5">
                        <p className="text-[10px] font-black uppercase text-red-600 tracking-widest flex items-center gap-1.5">
                          <div className="h-4 w-4 rounded-full bg-red-100 flex items-center justify-center">
                            <XCircle className="h-2.5 w-2.5" />
                          </div>
                          Cons
                        </p>
                        <ul className="space-y-2">
                          {aiData.consEn.map((c, i) => (
                            <li key={i} className="text-xs font-medium flex items-start gap-2.5 leading-snug">
                              <XCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                              <span className="text-foreground/90">{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                        aiData.overallScore >= 80 ? "bg-green-50 border-green-200" : aiData.overallScore >= 50 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"
                      }`}>
                        <span className={`text-xs font-black uppercase tracking-widest ${
                           aiData.overallScore >= 80 ? "text-green-700" : aiData.overallScore >= 50 ? "text-amber-700" : "text-red-700"
                        }`}>
                          Job Match Score
                        </span>
                        <div className={`flex items-baseline gap-1 ${
                          aiData.overallScore >= 80 ? "text-green-600" : aiData.overallScore >= 50 ? "text-amber-600" : "text-red-600"
                        }`}>
                          <span className="text-3xl font-black tracking-tighter">{aiData.overallScore}</span>
                          <span className="text-sm font-bold opacity-50">%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* AI Trigger Button */}
          {!data && !isLoading && (
            <div className="flex flex-col items-center py-4 space-y-4">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <Button 
                onClick={handleCompare} 
                className="rounded-full px-8 h-12 gap-2.5 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-primary"
              >
                <Sparkles className="h-5 w-5" />
                Ask AI to Analyze Pros/Cons & Commute
              </Button>
              <p className="text-xs text-muted-foreground italic">
                Gemini will use its geographic knowledge to estimate your commute and evaluate role quality.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-primary animate-pulse">
              <Loader2 className="h-10 w-10 animate-spin" />
              <p className="font-bold text-sm">Gemini is analyzing your future options...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div className="space-y-1">
                <p className="font-bold">Analysis Failed</p>
                <p className="opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Recommendation Section */}
          {data && (
            <div className="p-8 rounded-2xl bg-primary/5 border border-primary/20 space-y-6 animate-in zoom-in-95 duration-500 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <BrainCircuit className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-black tracking-tight">Final Recommendation</h3>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="p-5 rounded-xl bg-background border border-border shadow-sm space-y-3">
                  <p className="font-black text-xs uppercase text-primary tracking-widest flex items-center gap-2">
                    <span className="h-1 w-4 bg-primary rounded-full" />
                    English Analysis
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium text-foreground/90">
                    {data.recommendationEn}
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-background border border-border shadow-sm space-y-3">
                  <p className="font-black text-xs uppercase text-primary tracking-widest flex items-center gap-2">
                    <span className="h-1 w-4 bg-primary rounded-full" />
                    บทวิเคราะห์ภาษาไทย
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium text-foreground/90">
                    {data.recommendationTh}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full px-6">
            Close
          </Button>
          {data && (
            <Button onClick={handleCompare} variant="secondary" className="rounded-full px-6 gap-2">
              <Sparkles className="h-4 w-4" /> Re-analyze
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
