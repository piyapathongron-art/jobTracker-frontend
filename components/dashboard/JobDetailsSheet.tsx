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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Pencil,
  CheckCircle2,
  BrainCircuit,
  FileText,
  LayoutDashboard,
  Mail,
  Target,
} from "lucide-react";
import type { JobApplication } from "@/lib/types";
import type { NewJob } from "@/store/useJobStore";
import { useJobStore } from "@/store/useJobStore";

// Import Extracted Tabs
import { OverviewTab } from "./tabs/OverviewTab";
import { CoverLetterTab } from "./tabs/CoverLetterTab";
import { InterviewTab } from "./tabs/InterviewTab";
import { EmailTab } from "./tabs/EmailTab";
import { MatchTab } from "./tabs/MatchTab";

interface Props {
  job: JobApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobDetailsSheet({ job, open, onOpenChange }: Props) {
  const updateJobDetails = useJobStore((s) => s.updateJobDetails);
  const deleteJob = useJobStore((s) => s.deleteJob);

  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!job) return null;

  function handleSheetClose(v: boolean) {
    onOpenChange(v);
    if (!v) {
      setIsEditing(false);
      setSuccessMessage(null);
    }
  }

  async function handleEditSubmit(data: NewJob) {
    if (!job) return;
    await updateJobDetails(job.id, data);
    setIsEditing(false);
    setSuccessMessage("Changes saved!");
    setTimeout(() => setSuccessMessage(null), 3000);
  }

  async function handleDeleteJob() {
    if (!job) return;
    await deleteJob(job.id);
    onOpenChange(false);
  }

  function getStatusBadgeStyle(status: string) {
    switch (status) {
      case "WISHLIST":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "APPLIED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "INTERVIEWING":
        return "bg-violet-50 text-violet-700 border-violet-200";
      case "OFFERED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "REJECTED":
        return "bg-red-50 text-red-700 border-red-200";
      case "GHOSTED":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleSheetClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeStyle(
                job.status
              )}`}
            >
              {job.status}
            </Badge>
            <div className="flex items-center gap-2">
              {successMessage && (
                <span className="text-xs text-green-600 flex items-center gap-1 animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 className="h-3 w-3" /> {successMessage}
                </span>
              )}
            </div>
          </div>

          {!isEditing && (
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <SheetTitle className="text-2xl font-bold leading-tight">
                  {job.role}
                </SheetTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0 border border-muted"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
              </div>
              <SheetDescription className="flex items-center gap-1.5 text-base mt-1">
                <Building2 className="h-4 w-4" />
                {job.company}
              </SheetDescription>
            </div>
          )}
        </SheetHeader>

        <div className="mt-6">
          {isEditing ? (
            <OverviewTab
              job={job}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              onEditSubmit={handleEditSubmit}
              onDeleteJob={handleDeleteJob}
            />
          ) : (
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" className="gap-1 text-xs px-1">
                  <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="cover-letter" className="gap-1 text-xs px-1">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">Cover Letter</span>
                </TabsTrigger>
                <TabsTrigger value="interview-prep" className="gap-1 text-xs px-1">
                  <BrainCircuit className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">Interview</span>
                </TabsTrigger>
                <TabsTrigger value="email-drafter" className="gap-1 text-xs px-1">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">Email</span>
                </TabsTrigger>
                <TabsTrigger value="resume-match" className="gap-1 text-xs px-1">
                  <Target className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">Match</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <OverviewTab
                  job={job}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  onEditSubmit={handleEditSubmit}
                  onDeleteJob={handleDeleteJob}
                />
              </TabsContent>

              <TabsContent value="cover-letter">
                <CoverLetterTab job={job} />
              </TabsContent>

              <TabsContent value="interview-prep">
                <InterviewTab job={job} />
              </TabsContent>

              <TabsContent value="email-drafter">
                <EmailTab job={job} />
              </TabsContent>

              <TabsContent value="resume-match">
                <MatchTab job={job} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
