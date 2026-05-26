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
      setData(null);
      setError(null);
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
    } catch (err: any) {
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
      <DialogContent className="sm:max-w-[95vw] lg:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="h-6 w-6 text-primary" />
            Job Comparison
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6 space-y-8">
          {/* Comparison Grid */}
          <div className={`grid grid-cols-1 ${jobs.length === 3 ? "lg:grid-cols-3" : "md:grid-cols-2"} gap-4`}>
            {jobs.map((job) => {
              const aiData = data?.comparisons.find((c) => c.jobId === job.id);
              const isHighest = highestSalary > 0 && (job.salaryMax === highestSalary || (!job.salaryMax && job.salaryMin === highestSalary));
              
              return (
                <div key={job.id} className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-5 flex flex-col">
                  {/* Header: Role & Company */}
                  <div>
                    <h3 className="font-bold text-lg leading-tight min-h-[2.5rem]">{job.role}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1.5 font-medium">
                      <Building2 className="h-4 w-4" /> {job.company}
                    </p>
                  </div>

                  {/* Core Data List */}
                  <div className="space-y-3.5 text-sm flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span>Status</span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] font-bold h-5 ${STATUS_VARIANT[job.status]}`}>
                        {job.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-muted-foreground">
                        <Navigation className="h-4 w-4" />
                        <span>Work Mode</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-bold h-5">
                        {job.workMode}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>Location</span>
                      </div>
                      <span className="font-medium">{job.location || "N/A"}</span>
                    </div>

                    <div className="pt-2 mt-2 border-t border-dashed border-border flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>Salary</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold ${isHighest ? "text-green-600" : ""}`}>
                          {fmtSalary(job)}
                        </span>
                        {isHighest && (
                          <div className="flex items-center bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-black border border-green-200">
                            <TrendingUp className="h-3 w-3 mr-0.5" />
                            BEST
                          </div>
                        )}
                      </div>
                    </div>

                    {job.notes && (
                      <div className="pt-3 mt-3 border-t border-solid border-border/50">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1.5">Personal Notes</p>
                        <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap p-2 rounded-md bg-muted/30 border border-muted">
                          {job.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* AI Results Section within each card */}
                  {aiData && (
                    <div className="pt-5 border-t border-border space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <p className="text-[10px] font-black uppercase text-primary mb-1.5 flex items-center gap-1.5">
                          <Navigation className="h-3 w-3" /> Commute Estimation
                        </p>
                        <p className="text-xs font-semibold leading-relaxed">
                          {aiData.commuteEstimationEn}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-green-600 tracking-wider">Pros</p>
                        <ul className="space-y-1.5">
                          {aiData.prosEn.map((p, i) => (
                            <li key={i} className="text-[11px] font-medium flex items-start gap-2 leading-tight">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500 mt-0" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-red-600 tracking-wider">Cons</p>
                        <ul className="space-y-1.5">
                          {aiData.consEn.map((c, i) => (
                            <li key={i} className="text-[11px] font-medium flex items-start gap-2 leading-tight">
                              <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400 mt-0" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-muted">
                        <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Job Score</span>
                        <span className={`text-xl font-black ${
                          aiData.overallScore >= 80 ? "text-green-600" : aiData.overallScore >= 50 ? "text-amber-500" : "text-red-500"
                        }`}>
                          {aiData.overallScore}%
                        </span>
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
