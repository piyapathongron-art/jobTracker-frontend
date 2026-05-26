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
import type { JobApplication } from "@/lib/types";
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

export function CompareJobsModal({ jobs, open, onOpenChange }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ComparisonData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && jobs.length >= 2) {
      handleCompare();
    } else if (!open) {
      setData(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleCompare() {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Job Comparison
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6 space-y-8">
          {/* Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {jobs.map((job) => {
              const aiData = data?.comparisons.find((c) => c.jobId === job.id);
              return (
                <div key={job.id} className="p-4 rounded-xl border border-border bg-muted/20 space-y-4 flex flex-col">
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{job.role}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Building2 className="h-3.5 w-3.5" /> {job.company}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm flex-1">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{fmtSalary(job)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{job.location || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="text-[10px] font-bold py-0 h-5">
                        {job.workMode}
                      </Badge>
                    </div>
                  </div>

                  {isLoading && (
                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground italic text-xs border-t border-dashed border-border mt-4">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      Evaluating with AI...
                    </div>
                  )}

                  {aiData && (
                    <div className="pt-4 border-t border-border space-y-4 animate-in fade-in duration-500">
                      <div className="p-2 rounded bg-primary/5 border border-primary/10">
                        <p className="text-[10px] font-bold uppercase text-primary mb-1 flex items-center gap-1">
                          <Navigation className="h-3 w-3" /> Commute
                        </p>
                        <p className="text-xs font-medium leading-relaxed">
                          {aiData.commuteEstimationEn}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase text-green-600">Pros</p>
                        <ul className="space-y-1">
                          {aiData.prosEn.map((p, i) => (
                            <li key={i} className="text-[11px] flex items-start gap-1.5 leading-tight">
                              <CheckCircle2 className="h-3 w-3 shrink-0 text-green-500 mt-0.5" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase text-red-600">Cons</p>
                        <ul className="space-y-1">
                          {aiData.consEn.map((c, i) => (
                            <li key={i} className="text-[11px] flex items-start gap-1.5 leading-tight">
                              <XCircle className="h-3 w-3 shrink-0 text-red-400 mt-0.5" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Score</span>
                        <span className={`text-lg font-black ${
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

          {error && (
            <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm flex items-start gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          {data && (
            <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 space-y-4 animate-in zoom-in-95 duration-500">
              <h3 className="font-bold flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                Final Recommendation
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-background border border-border text-sm leading-relaxed whitespace-pre-wrap shadow-sm">
                  <p className="font-bold text-xs uppercase text-primary mb-2">English</p>
                  {data.recommendationEn}
                </div>
                <div className="p-4 rounded-lg bg-background border border-border text-sm leading-relaxed whitespace-pre-wrap shadow-sm">
                  <p className="font-bold text-xs uppercase text-primary mb-2">ภาษาไทย</p>
                  {data.recommendationTh}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!data && !isLoading && (
            <Button onClick={handleCompare} className="gap-1.5">
              <Sparkles className="h-4 w-4" /> Try Again
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Small helper for icons used above but not imported correctly in thought
import { BrainCircuit } from "lucide-react";
