"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/axios";
import type { JobApplication } from "@/lib/types";
import { 
  Loader2, 
  Sparkles, 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Link as LinkIcon,
  AlertCircle,
  Pencil,
  CheckCircle2
} from "lucide-react";
import { JobForm } from "./JobForm";
import { useJobStore } from "@/store/useJobStore";

interface Props {
  job: JobApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobDetailsSheet({ job, open, onOpenChange }: Props) {
  const updateJobDetails = useJobStore((s) => s.updateJobDetails);
  const [isEditing, setIsEditing] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailoredData, setTailoredData] = useState<{ coverLetter: string; keywordGaps: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!job) return null;

  async function handleTailor() {
    if (!job) return;
    setIsTailoring(true);
    setError(null);
    try {
      const res = await api.post("/api/ai/tailor", { jobId: job.id });
      setTailoredData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to generate tailored content.");
    } finally {
      setIsTailoring(false);
    }
  }

  async function handleEditSubmit(data: any) {
    if (!job) return;
    await updateJobDetails(job.id, data);
    setIsEditing(false);
    setSuccessMessage("Changes saved!");
    setTimeout(() => setSuccessMessage(null), 3000);
  }

  return (
    <Sheet open={open} onOpenChange={(v) => {
      onOpenChange(v);
      if (!v) {
        setIsEditing(false);
        setTailoredData(null);
        setSuccessMessage(null);
      }
    }}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              {job.status}
            </Badge>
            <div className="flex items-center gap-2">
              {successMessage && (
                <span className="text-xs text-green-600 flex items-center gap-1 animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 className="h-3 w-3" /> {successMessage}
                </span>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Pencil className="h-3.5 w-3.5" />
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            </div>
          </div>
          {!isEditing && (
            <div>
              <SheetTitle className="text-2xl font-bold">{job.role}</SheetTitle>
              <SheetDescription className="flex items-center gap-1.5 text-base mt-1">
                <Building2 className="h-4 w-4" />
                {job.company}
              </SheetDescription>
            </div>
          )}
        </SheetHeader>

        <div className="mt-8 space-y-8">
          {isEditing ? (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <JobForm 
                initialData={job} 
                onSubmit={handleEditSubmit} 
                onCancel={() => setIsEditing(false)} 
              />
            </div>
          ) : (
            <>
              {/* Job Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Location
                  </p>
                  <p className="text-sm font-semibold">{job.location || "Not specified"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> Salary
                  </p>
                  <p className="text-sm font-semibold">
                    {job.salaryMin ? `$${(job.salaryMin/1000).toFixed(0)}k` : ""}
                    {job.salaryMin && job.salaryMax ? " - " : ""}
                    {job.salaryMax ? `$${(job.salaryMax/1000).toFixed(0)}k` : ""}
                    {!job.salaryMin && !job.salaryMax ? "Not specified" : ""}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Applied On
                  </p>
                  <p className="text-sm font-semibold">
                    {job.appliedAt ? new Date(job.appliedAt).toLocaleDateString() : "Not applied yet"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" /> Job Link
                  </p>
                  {job.url ? (
                    <a href={job.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                      View Posting <LinkIcon className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-sm font-semibold">No link</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Notes / Tech Stack</p>
                <div className="p-4 rounded-lg bg-muted/50 border border-border text-sm whitespace-pre-wrap leading-relaxed">
                  {job.notes || "No additional details provided."}
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Assistant
                  </h3>
                  <Button 
                    onClick={handleTailor} 
                    disabled={isTailoring}
                    size="sm"
                    className="gap-1.5"
                  >
                    {isTailoring ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Tailoring...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Tailor Resume & Cover Letter
                      </>
                    )}
                  </Button>
                </div>

                {error && (
                  <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}

                {tailoredData && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase text-primary">Keyword Gaps</p>
                      <div className="flex flex-wrap gap-2">
                        {tailoredData.keywordGaps.map((gap, i) => (
                          <Badge key={i} variant="secondary" className="bg-orange-50 text-orange-700 border-orange-100 px-2 py-1">
                            {gap}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase text-primary">Tailored Cover Letter</p>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {
                          navigator.clipboard.writeText(tailoredData.coverLetter);
                        }}>
                          Copy text
                        </Button>
                      </div>
                      <div className="p-5 rounded-lg border border-border bg-background text-sm leading-loose whitespace-pre-wrap shadow-sm">
                        {tailoredData.coverLetter}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
