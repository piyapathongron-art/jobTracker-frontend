"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useJobStore } from "@/store/useJobStore";
import { JobForm } from "./JobForm";
import type { NewJob } from "@/store/useJobStore";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialScrapeUrl?: string;
}

export function AddJobDialog({ open, onOpenChange, initialScrapeUrl }: Props) {
  const addJob = useJobStore((s) => s.addJob);

  async function handleSubmit(data: NewJob) {
    await addJob(data);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Job</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <JobForm
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            submitLabel="Add Job"
            initialScrapeUrl={initialScrapeUrl}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
