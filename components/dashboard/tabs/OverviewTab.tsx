"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  MapPin,
  LayoutDashboard,
  DollarSign,
  Calendar,
  Link as LinkIcon,
  Trash2,
  Contact,
} from "lucide-react";
import type { JobApplication } from "@/lib/types";
import type { NewJob } from "@/store/useJobStore";
import { JobForm } from "../JobForm";

interface OverviewTabProps {
  job: JobApplication;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  onEditSubmit: (data: NewJob) => Promise<void>;
  onDeleteJob: () => Promise<void>;
}

export function OverviewTab({
  job,
  isEditing,
  setIsEditing,
  onEditSubmit,
  onDeleteJob,
}: OverviewTabProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (isEditing) {
    return (
      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
        <JobForm
          initialData={job}
          onSubmit={onEditSubmit}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Location
          </p>
          <p className="text-sm font-semibold">{job.location || "Not specified"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
            <LayoutDashboard className="h-3 w-3" /> Work Mode
          </p>
          <Badge variant="secondary" className="text-xs font-semibold">
            {job.workMode}
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
            <DollarSign className="h-3 w-3" /> Salary
          </p>
          <p className="text-sm font-semibold">
            {(() => {
              const sym = job.salaryCurrency === "USD" ? "$" : "฿";
              const fmt = (n: number) =>
                n >= 1000 ? `${sym}${(n / 1000).toFixed(0)}k` : `${sym}${n}`;
              const periodLabel =
                job.salaryPeriod === "HOURLY"
                  ? "/hr"
                  : job.salaryPeriod === "MONTHLY"
                  ? "/mo"
                  : "/yr";
              if (!job.salaryMin && !job.salaryMax) return "Not specified";
              const range =
                job.salaryMin && job.salaryMax
                  ? `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`
                  : job.salaryMin
                  ? `${fmt(job.salaryMin)}+`
                  : `up to ${fmt(job.salaryMax!)}`;
              return `${range} ${periodLabel}`;
            })()}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Applied On
          </p>
          <p className="text-sm font-semibold">
            {job.appliedAt
              ? new Date(job.appliedAt).toLocaleDateString()
              : "Not applied yet"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
            <Calendar className="h-3 w-3 text-violet-500" /> Interview Date
          </p>
          <p className="text-sm font-semibold text-violet-700">
            {job.interviewDate
              ? new Date(job.interviewDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
              : "Not scheduled"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
            <Contact className="h-3 w-3 text-blue-500" /> HR Contact Info
          </p>
          <p className="text-sm font-semibold text-blue-700">
            {job.hrContact || "No contact info"}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
          <LinkIcon className="h-3 w-3" /> Job Link
        </p>
        {job.url ? (
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            View Posting <LinkIcon className="h-3 w-3" />
          </a>
        ) : (
          <p className="text-sm font-semibold">No link</p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase">
          Job Description
        </p>
        <div className="p-4 rounded-lg bg-muted/30 border border-border text-xs whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto">
          {job.jobDescription || "No job description provided."}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase">
          Personal Notes / Tech Stack
        </p>
        <div className="p-4 rounded-lg bg-muted/50 border border-border text-sm whitespace-pre-wrap leading-relaxed">
          {job.notes || "No personal notes provided."}
        </div>
      </div>

      <div className="flex justify-end pt-4 mt-6 border-t border-border">
        <Button
          variant="destructive"
          size="sm"
          className="gap-1.5"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          Delete Job
        </Button>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete this job application and all associated data
              (AI tailored content, emails, notes). This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                onDeleteJob();
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
