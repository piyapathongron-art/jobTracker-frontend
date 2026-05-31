"use client";

import { useState, useMemo } from "react";
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
import { useInsightsStore } from "@/store/useInsightsStore";
import { JobDetailsSheet } from "./JobDetailsSheet";
import { CompareJobsModal } from "./CompareJobsModal";
import type { Status, JobApplication } from "@/lib/types";
import { Trash2, Eye, Sparkles, X, Flame, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

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

const STATUS_WEIGHT: Record<Status, number> = {
  WISHLIST: 1,
  APPLIED: 2,
  INTERVIEWING: 3,
  OFFERED: 4,
  REJECTED: 5,
  GHOSTED: 6,
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

type SortKey = "status" | "salary" | "appliedAt" | null;
type SortDirection = "asc" | "desc";

export function JobTable() {
  const jobs = useJobStore((s) => s.jobs);
  const deleteJob = useJobStore((s) => s.deleteJob);
  const isTrending = useInsightsStore((s) => s.isTrending);

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const selectedJob = selectedJobId ? jobs.find((j) => j.id === selectedJobId) ?? null : null;

  // Comparison state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareJobsModalOpen] = useState(false);

  // Sorting state
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  function handleRowClick(job: JobApplication) {
    setSelectedJobId(job.id);
    setSheetOpen(true);
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDirection === "asc") setSortDirection("desc");
      else setSortKey(null); // cycle to no sort
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground/50" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="ml-2 h-3.5 w-3.5 text-foreground" />
      : <ArrowDown className="ml-2 h-3.5 w-3.5 text-foreground" />;
  };

  const sortedJobs = useMemo(() => {
    if (!sortKey) return jobs;
    return [...jobs].sort((a, b) => {
      let valA, valB;
      
      switch (sortKey) {
        case "status":
          valA = STATUS_WEIGHT[a.status];
          valB = STATUS_WEIGHT[b.status];
          break;
        case "salary":
          valA = a.salaryMax || a.salaryMin || 0;
          valB = b.salaryMax || b.salaryMin || 0;
          break;
        case "appliedAt":
          valA = a.appliedAt ? new Date(a.appliedAt).getTime() : 0;
          valB = b.appliedAt ? new Date(b.appliedAt).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [jobs, sortKey, sortDirection]);

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

      <div className="rounded-xl border border-border overflow-x-auto relative w-full shadow-sm">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10"></TableHead>
              <TableHead className="font-semibold text-foreground">Company</TableHead>
              <TableHead className="font-semibold text-foreground">Role</TableHead>
              <TableHead 
                className="font-semibold text-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">Status {getSortIcon("status")}</div>
              </TableHead>
              <TableHead className="font-semibold text-foreground">Location</TableHead>
              <TableHead 
                className="font-semibold text-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none"
                onClick={() => handleSort("salary")}
              >
                <div className="flex items-center">Salary {getSortIcon("salary")}</div>
              </TableHead>
              <TableHead 
                className="font-semibold text-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none"
                onClick={() => handleSort("appliedAt")}
              >
                <div className="flex items-center">Applied {getSortIcon("appliedAt")}</div>
              </TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                  No applications yet. Add your first one!
                </TableCell>
              </TableRow>
            ) : (
              sortedJobs.map((job) => (
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
                  <TableCell className="font-medium text-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      {job.company}
                      {isTrending(job.company) && (
                        <Flame
                          className="h-3.5 w-3.5 text-orange-500 fill-orange-200"
                          aria-label="Highly competitive"
                        />
                      )}
                    </span>
                  </TableCell>
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
                        className="h-7 w-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all"
                        onClick={() => handleRowClick(job)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-muted-foreground hover:text-red-600 transition-all"
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
        <div className="fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-300 w-full max-w-[calc(100vw-2rem)] sm:max-w-max">
          <div className="bg-foreground text-background px-4 py-2 sm:px-6 sm:py-3 rounded-full shadow-2xl flex items-center justify-between sm:justify-start gap-3 sm:gap-6 border border-border/10 whitespace-nowrap">
            <p className="text-xs sm:text-sm font-semibold flex items-center">
              {selectedIds.length} <span className="hidden sm:inline ml-1">job{selectedIds.length > 1 ? "s" : ""}</span>
              <span className="sm:hidden ml-1">selected</span>
              <span className="hidden sm:inline text-muted ml-1.5 opacity-50 font-normal">(Max 3)</span>
            </p>
            <div className="h-4 w-px bg-background/20 shrink-0" />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-7 sm:h-8 gap-1 sm:gap-1.5 rounded-full px-3 sm:px-4 text-xs font-bold"
                disabled={selectedIds.length < 2}
                onClick={() => setCompareJobsModalOpen(true)}
              >
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Compare Jobs</span>
                <span className="sm:hidden">Compare</span>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-background/10 rounded-full shrink-0"
                onClick={() => setSelectedIds([])}
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
