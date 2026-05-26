"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useJobStore } from "@/store/useJobStore";
import { JobDetailsSheet } from "./JobDetailsSheet";
import { CompareJobsModal } from "./CompareJobsModal";
import type { Status, JobApplication } from "@/lib/types";
import { Trash2, Eye, Sparkles, X } from "lucide-react";

const STATUS_LABEL: Record<Status, string> = {
  WISHLIST:     "Wishlist",
  APPLIED:      "Applied",
  INTERVIEWING: "Interviewing",
  OFFERED:      "Offered",
  REJECTED:     "Rejected",
  GHOSTED:      "Ghosted",
};

const STATUS_VARIANT: Record<Status, string> = {
  WISHLIST:     "bg-slate-100 text-slate-700 border-slate-200",
  APPLIED:      "bg-blue-50 text-blue-700 border-blue-200",
  INTERVIEWING: "bg-violet-50 text-violet-700 border-violet-200",
  OFFERED:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED:     "bg-red-50 text-red-700 border-red-200",
  GHOSTED:      "bg-orange-50 text-orange-700 border-orange-200",
};

function fmt(n: number, currency: string) {
  const sym = currency === "USD" ? "$" : "฿";
  return n >= 1000 ? `${sym}${(n / 1000).toFixed(0)}k` : `${sym}${n}`;
}

function salary(min: number | null, max: number | null, currency: string, period: string) {
  if (!min && !max) return "—";
  const periodLabel = period === "HOURLY" ? "/hr" : period === "MONTHLY" ? "/mo" : "/yr";
  const range = min && max
    ? `${fmt(min, currency)} – ${fmt(max, currency)}`
    : min
    ? `${fmt(min, currency)}+`
    : `up to ${fmt(max!, currency)}`;
  return `${range} ${periodLabel}`;
}

export function JobTable() {
  const jobs = useJobStore((s) => s.jobs);
  const deleteJob = useJobStore((s) => s.deleteJob);

  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Comparison state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareJobsModalOpen] = useState(false);

  function handleRowClick(job: JobApplication) {
    setSelectedJob(job);
    setSheetOpen(true);
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectedJobs = jobs.filter((j) => selectedIds.includes(j.id));

  return (
    <>
      <JobDetailsSheet 
        job={selectedJob} 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
      />

      <CompareJobsModal
        jobs={selectedJobs}
        open={compareModalOpen}
        onOpenChange={setCompareJobsModalOpen}
      />

      <div className="rounded-xl border border-border overflow-hidden relative">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10"></TableHead>
              <TableHead className="font-semibold text-foreground">Company</TableHead>
              <TableHead className="font-semibold text-foreground">Role</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="font-semibold text-foreground">Location</TableHead>
              <TableHead className="font-semibold text-foreground">Salary</TableHead>
              <TableHead className="font-semibold text-foreground">Applied</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                  No applications yet. Add your first one!
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow 
                  key={job.id} 
                  className={`hover:bg-muted/40 transition-colors group cursor-pointer ${
                    selectedIds.includes(job.id) ? "bg-primary/5" : ""
                  }`}
                  onClick={() => handleRowClick(job)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(job.id)}
                      onCheckedChange={() => toggleSelect(job.id)}
                      disabled={!selectedIds.includes(job.id) && selectedIds.length >= 3}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{job.company}</TableCell>
                  <TableCell className="text-muted-foreground">{job.role}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_VARIANT[job.status]}>
                      {STATUS_LABEL[job.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{job.location ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {salary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {job.appliedAt
                      ? new Date(job.appliedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all"
                        onClick={() => handleRowClick(job)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 transition-all"
                        onClick={() => deleteJob(job.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Floating Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-300">
          <div className="bg-foreground text-background px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 border border-border/10">
            <p className="text-sm font-semibold">
              {selectedIds.length} job{selectedIds.length > 1 ? "s" : ""} selected
              <span className="text-muted ml-1.5 opacity-50 font-normal">(Max 3)</span>
            </p>
            <div className="h-4 w-px bg-background/20" />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 gap-1.5 rounded-full px-4"
                disabled={selectedIds.length < 2}
                onClick={() => setCompareJobsModalOpen(true)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Compare Jobs
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 hover:bg-background/10 rounded-full"
                onClick={() => setSelectedIds([])}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
