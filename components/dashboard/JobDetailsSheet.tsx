"use client";

import { useEffect, useState } from "react";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { NewJob } from "@/store/useJobStore";
import type { JobApplication } from "@/lib/types";
import { api } from "@/lib/axios";
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
  CheckCircle2,
  BrainCircuit,
  FileText,
  LayoutDashboard,
  Lightbulb,
  Mail,
  Copy,
  Check,
  Target,
  XCircle,
} from "lucide-react";
import { JobForm } from "./JobForm";
import { useJobStore } from "@/store/useJobStore";
import { useLangStore } from "@/store/useLangStore";
import { useAiCacheStore } from "@/store/useAiCacheStore";
import { getDictionary } from "@/locales";

interface Props {
  job: JobApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface InterviewQuestion {
  questionEn: string;
  starHintEn: string;
  questionTh: string;
  starHintTh: string;
}

interface DraftedEmail {
  subjectEn: string;
  bodyEn: string;
  subjectTh: string;
  bodyTh: string;
}

interface TailoredData {
  coverLetterEn: string;
  coverLetterTh: string;
  missingKeywords: string[];
}

const EMAIL_TYPES = [
  "Initial Application Outreach",
  "Follow-up on Application",
  "Thank You (Post-Interview)",
  "Offer Negotiation",
  "Decline Offer",
] as const;

type EmailType = (typeof EMAIL_TYPES)[number];

export function JobDetailsSheet({ job, open, onOpenChange }: Props) {
  const updateJobDetails = useJobStore((s) => s.updateJobDetails);
  const lang = useLangStore((s) => s.lang);
  const t = getDictionary(lang);
  const jobCache = useAiCacheStore((s) => (job ? s.cache[job.id] : undefined));
  const setCoverLetterCache = useAiCacheStore((s) => s.setCoverLetter);
  const setInterviewCache = useAiCacheStore((s) => s.setInterview);
  const setEmailCache = useAiCacheStore((s) => s.setEmail);
  const setResumeScoreCache = useAiCacheStore((s) => s.setResumeScore);
  const setOptimizedResumeCache = useAiCacheStore((s) => s.setOptimizedResume);
  const [isEditing, setIsEditing] = useState(false);

  // Cover Letter state
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailoredData, setTailoredData] = useState<TailoredData | null>(null);
  const [tailorError, setTailorError] = useState<string | null>(null);
  const [coverCopied, setCoverCopied] = useState<"en" | "th" | null>(null);
  const [activeCoverTab, setActiveCoverTab] = useState<"en" | "th">("en");
  const [activeEmailTab, setActiveEmailTab] = useState<"en" | "th">("en");
  const [activeInterviewTab, setActiveInterviewTab] = useState<"en" | "th">("en");

  // Interview Prep state
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState<
    InterviewQuestion[] | null
  >(null);
  const [interviewError, setInterviewError] = useState<string | null>(null);

  // Email Drafter state
  const [selectedEmailType, setSelectedEmailType] = useState<EmailType>(
    "Initial Application Outreach"
  );
  const [isDraftingEmail, setIsDraftingEmail] = useState(false);
  const [draftedEmail, setDraftedEmail] = useState<DraftedEmail | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [bodyCopied, setBodyCopied] = useState(false);

  // Refinement feedback state
  const [tailorFeedback, setTailorFeedback] = useState("");
  const [interviewFeedback, setInterviewFeedback] = useState("");
  const [emailFeedback, setEmailFeedback] = useState("");

  // Resume Match / Score state
  const [isScoring, setIsScoring] = useState(false);
  const [scoreData, setScoreData] = useState<{
    score: number;
    strengthsEn: string[];
    weaknessesEn: string[];
    adviceEn: string[];
    strengthsTh: string[];
    weaknessesTh: string[];
    adviceTh: string[];
  } | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [scoreFeedback, setScoreFeedback] = useState("");
  const [activeScoreTab, setActiveScoreTab] = useState<"en" | "th">("en");

  // Resume Optimizer state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedData, setOptimizedData] = useState<{
    optimizedResumeEn: string;
    optimizedResumeTh: string;
  } | null>(null);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [optimizeFeedback, setOptimizeFeedback] = useState("");
  const [activeOptimizeTab, setActiveOptimizeTab] = useState<"en" | "th">("en");
  const [optimizeCopied, setOptimizeCopied] = useState<"en" | "th" | null>(null);

  // Edit state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!job) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setTailoredData(jobCache?.coverLetter ?? null);
    setInterviewQuestions(jobCache?.interview?.questions ?? null);
    const cachedEmail = jobCache?.emails?.[selectedEmailType];
    setDraftedEmail(cachedEmail ?? null);
    setScoreData(jobCache?.resumeScore ?? null);
    setOptimizedData(jobCache?.optimizedResume ?? null);
    setTailorError(null);
    setInterviewError(null);
    setEmailError(null);
    setScoreError(null);
    setBodyCopied(false);
    setCoverCopied(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id]);

  if (!job) return null;

  function handleSheetClose(v: boolean) {
    onOpenChange(v);
    if (!v) {
      setIsEditing(false);
      setSuccessMessage(null);
      setTailorError(null);
      setInterviewError(null);
      setEmailError(null);
      setScoreError(null);
      setOptimizeError(null);
      setBodyCopied(false);
    }
  }

  async function handleTailor() {
    if (!job) return;
    setIsTailoring(true);
    setTailorError(null);
    try {
      const payload: Record<string, string> = { jobId: job.id };
      if (tailorFeedback.trim()) payload.feedback = tailorFeedback.trim();
      const res = await api.post("/api/ai/tailor", payload);
      setTailoredData(res.data);
      setCoverLetterCache(job.id, res.data);
      setTailorFeedback("");
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setTailorError(
        err.response?.data?.error || "Failed to generate tailored content."
      );
    } finally {
      setIsTailoring(false);
    }
  }

  async function handleGenerateQuestions() {
    if (!job) return;
    setIsGeneratingQuestions(true);
    setInterviewError(null);
    try {
      const payload: Record<string, string> = { jobId: job.id };
      if (interviewFeedback.trim()) payload.feedback = interviewFeedback.trim();
      const res = await api.post("/api/ai/interview", payload);
      setInterviewQuestions(res.data.questions);
      setInterviewCache(job.id, { questions: res.data.questions });
      setInterviewFeedback("");
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setInterviewError(
        err.response?.data?.error ||
          "Failed to generate interview questions. Please try again."
      );
    } finally {
      setIsGeneratingQuestions(false);
    }
  }

  async function handleDraftEmail() {
    if (!job) return;
    setIsDraftingEmail(true);
    setEmailError(null);
    setDraftedEmail(null);
    setBodyCopied(false);
    try {
      const payload: Record<string, string> = { jobId: job.id, emailType: selectedEmailType };
      if (emailFeedback.trim()) payload.feedback = emailFeedback.trim();
      const res = await api.post("/api/ai/email", payload);
      setDraftedEmail(res.data);
      setEmailCache(job.id, selectedEmailType, res.data);
      setEmailFeedback("");
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setEmailError(
        err.response?.data?.error ||
          "Failed to draft the email. Please try again."
      );
    } finally {
      setIsDraftingEmail(false);
    }
  }

  async function handleScoreResume() {
    if (!job) return;
    setIsScoring(true);
    setScoreError(null);
    try {
      const payload: Record<string, string> = { jobId: job.id };
      if (scoreFeedback.trim()) payload.feedback = scoreFeedback.trim();
      const res = await api.post("/api/ai/score-resume", payload);
      setScoreData(res.data);
      setResumeScoreCache(job.id, res.data);
      setScoreFeedback("");
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setScoreError(
        err.response?.data?.error || "Failed to analyze resume match. Please try again."
      );
    } finally {
      setIsScoring(false);
    }
  }

  async function handleOptimizeResume() {
    if (!job || !scoreData) return;
    setIsOptimizing(true);
    setOptimizeError(null);
    try {
      const payload: Record<string, unknown> = { jobId: job.id, scoreData };
      if (optimizeFeedback.trim()) payload.feedback = optimizeFeedback.trim();
      const res = await api.post("/api/ai/optimize-resume", payload);
      setOptimizedData(res.data);
      setOptimizedResumeCache(job.id, res.data);
      setOptimizeFeedback("");
      setOptimizeCopied(null);
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setOptimizeError(
        err.response?.data?.error || "Failed to optimize resume. Please try again."
      );
    } finally {
      setIsOptimizing(false);
    }
  }

  function handleCopyOptimized(which: "en" | "th") {
    if (!optimizedData) return;
    const text = which === "th" ? optimizedData.optimizedResumeTh : optimizedData.optimizedResumeEn;
    navigator.clipboard.writeText(text);
    setOptimizeCopied(which);
    setTimeout(() => setOptimizeCopied(null), 2000);
  }

  function handleCopyBody() {
    if (!draftedEmail) return;
    const body = activeEmailTab === "th" ? draftedEmail.bodyTh : draftedEmail.bodyEn;
    navigator.clipboard.writeText(body);
    setBodyCopied(true);
    setTimeout(() => setBodyCopied(false), 2000);
  }

  function handleCopyCover(which: "en" | "th") {
    if (!tailoredData) return;
    const text = which === "th" ? tailoredData.coverLetterTh : tailoredData.coverLetterEn;
    navigator.clipboard.writeText(text);
    setCoverCopied(which);
    setTimeout(() => setCoverCopied(null), 2000);
  }

  async function handleEditSubmit(data: NewJob) {
    if (!job) return;
    await updateJobDetails(job.id, data);
    setIsEditing(false);
    setSuccessMessage("Changes saved!");
    setTimeout(() => setSuccessMessage(null), 3000);
  }

  function getStatusBadgeStyle(status: string) {
    switch (status) {
      case "WISHLIST": return "bg-slate-100 text-slate-700 border-slate-200";
      case "APPLIED": return "bg-blue-50 text-blue-700 border-blue-200";
      case "INTERVIEWING": return "bg-violet-50 text-violet-700 border-violet-200";
      case "OFFERED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "REJECTED": return "bg-red-50 text-red-700 border-red-200";
      case "GHOSTED": return "bg-orange-50 text-orange-700 border-orange-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleSheetClose}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeStyle(job.status)}`}
            >
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

        <div className="mt-6">
          {isEditing ? (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <JobForm
                initialData={job}
                onSubmit={handleEditSubmit}
                onCancel={() => setIsEditing(false)}
              />
            </div>
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

              {/* ── Overview Tab ── */}
              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Location
                    </p>
                    <p className="text-sm font-semibold">
                      {job.location || "Not specified"}
                    </p>
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
                        const fmt = (n: number) => n >= 1000 ? `${sym}${(n / 1000).toFixed(0)}k` : `${sym}${n}`;
                        const periodLabel = job.salaryPeriod === "HOURLY" ? "/hr" : job.salaryPeriod === "MONTHLY" ? "/mo" : "/yr";
                        if (!job.salaryMin && !job.salaryMax) return "Not specified";
                        const range = job.salaryMin && job.salaryMax
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
              </TabsContent>

              {/* ── Cover Letter Tab ── */}
              <TabsContent value="cover-letter" className="mt-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 text-sm">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Resume & Cover Letter Tailor
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Compares your master resume against this job&apos;s details.
                    </p>
                  </div>
                  <Button
                    onClick={handleTailor}
                    disabled={isTailoring}
                    size="sm"
                    className="gap-1.5 shrink-0"
                  >
                    {isTailoring ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Tailoring...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        {tailoredData ? "Regenerate" : "Generate"}
                      </>
                    )}
                  </Button>
                </div>

                {tailorError && (
                  <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    {tailorError}
                  </div>
                )}

                {tailoredData && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase text-primary">
                        Keyword Gaps
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {tailoredData.missingKeywords.map((gap, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="bg-orange-50 text-orange-700 border-orange-100 px-2 py-1"
                          >
                            {gap}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase text-primary">
                        Tailored Cover Letter
                      </p>
                      <Tabs
                        value={activeCoverTab}
                        onValueChange={(v) => setActiveCoverTab(v as "en" | "th")}
                        defaultValue="en"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <TabsList className="grid w-full max-w-[260px] grid-cols-2">
                            <TabsTrigger value="en" className="text-xs">{t.ai.english}</TabsTrigger>
                            <TabsTrigger value="th" className="text-xs">{t.ai.thai}</TabsTrigger>
                          </TabsList>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1.5 text-xs"
                            onClick={() => handleCopyCover(activeCoverTab)}
                          >
                            {coverCopied === activeCoverTab ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-green-600" />
                                <span className="text-green-600">{t.buttons.copied}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                {t.buttons.copy}
                              </>
                            )}
                          </Button>
                        </div>
                        <TabsContent value="en" className="mt-3">
                          <div className="p-5 rounded-lg border border-border bg-background text-sm leading-loose whitespace-pre-wrap shadow-sm">
                            {tailoredData.coverLetterEn}
                          </div>
                        </TabsContent>
                        <TabsContent value="th" className="mt-3">
                          <div className="p-5 rounded-lg border border-border bg-background text-sm leading-loose whitespace-pre-wrap shadow-sm">
                            {tailoredData.coverLetterTh}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                )}

                {tailoredData && (
                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="Want to change something? (e.g. 'Make it shorter')"
                      value={tailorFeedback}
                      onChange={(e) => setTailorFeedback(e.target.value)}
                      disabled={isTailoring}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleTailor}
                      disabled={isTailoring}
                      className="shrink-0"
                    >
                      {isTailoring ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          Refining...
                        </>
                      ) : (
                        "✨ Refine"
                      )}
                    </Button>
                  </div>
                )}

                {!tailoredData && !isTailoring && (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-2">
                    <FileText className="h-10 w-10 opacity-20" />
                    <p className="text-sm">
                      Click <span className="font-medium">Generate</span> to
                      tailor your resume and create a cover letter for this
                      role.
                    </p>
                    <p className="text-xs opacity-70">
                      Requires a master resume saved in your Profile settings.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* ── Interview Prep Tab ── */}
              <TabsContent value="interview-prep" className="mt-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 text-sm">
                      <BrainCircuit className="h-4 w-4 text-primary" />
                      Interview Simulator
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      AI-generated practice questions with STAR-method hints.
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerateQuestions}
                    disabled={isGeneratingQuestions}
                    size="sm"
                    className="gap-1.5 shrink-0"
                  >
                    {isGeneratingQuestions ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <BrainCircuit className="h-4 w-4" />
                        {interviewQuestions
                          ? "Regenerate"
                          : "Generate Practice Questions"}
                      </>
                    )}
                  </Button>
                </div>

                {interviewError && (
                  <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    {interviewError}
                  </div>
                )}

                {interviewQuestions && interviewQuestions.length > 0 && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3">
                    <p className="text-xs font-semibold uppercase text-primary">
                      Practice Questions
                    </p>
                    <Tabs
                      value={activeInterviewTab}
                      onValueChange={(v) => setActiveInterviewTab(v as "en" | "th")}
                      defaultValue="en"
                    >
                      <TabsList className="grid w-full max-w-[260px] grid-cols-2">
                        <TabsTrigger value="en" className="text-xs">{t.ai.english}</TabsTrigger>
                        <TabsTrigger value="th" className="text-xs">{t.ai.thai}</TabsTrigger>
                      </TabsList>
                      {(["en", "th"] as const).map((tab) => (
                        <TabsContent key={tab} value={tab} className="mt-3">
                          <Accordion type="single" collapsible className="space-y-2">
                            {interviewQuestions.map((item, index) => (
                              <AccordionItem
                                key={index}
                                value={`question-${index}`}
                                className="border border-border rounded-lg px-4 data-[state=open]:bg-muted/30 transition-colors"
                              >
                                <AccordionTrigger className="text-sm font-medium text-left hover:no-underline py-4 gap-3">
                                  <span className="flex items-start gap-3">
                                    <span className="shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                                      {index + 1}
                                    </span>
                                    {tab === "th" ? item.questionTh : item.questionEn}
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                  <div className="mt-1 p-3 rounded-md bg-primary/5 border border-primary/10 space-y-1.5">
                                    <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                                      <Lightbulb className="h-3.5 w-3.5" />
                                      STAR Hint
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {tab === "th" ? item.starHintTh : item.starHintEn}
                                    </p>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </TabsContent>
                      ))}
                    </Tabs>
                    <p className="text-[10px] text-muted-foreground text-center pt-1">
                      Click each question to reveal the STAR-method hint.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <Input
                        placeholder="Want to change something? (e.g. 'Focus on React')"
                        value={interviewFeedback}
                        onChange={(e) => setInterviewFeedback(e.target.value)}
                        disabled={isGeneratingQuestions}
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleGenerateQuestions}
                        disabled={isGeneratingQuestions}
                        className="shrink-0"
                      >
                        {isGeneratingQuestions ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            Refining...
                          </>
                        ) : (
                          "✨ Refine"
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {!interviewQuestions && !isGeneratingQuestions && (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-2">
                    <BrainCircuit className="h-10 w-10 opacity-20" />
                    <p className="text-sm">
                      Click{" "}
                      <span className="font-medium">
                        Generate Practice Questions
                      </span>{" "}
                      to get tailored interview questions for this role.
                    </p>
                    <p className="text-xs opacity-70">
                      Uses the role, company, and tech stack from your notes.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* ── Email Drafter Tab ── */}
              <TabsContent value="email-drafter" className="mt-6 space-y-5">
                <div>
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-primary" />
                    Smart Email Drafter
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Generate a professional, ready-to-send email for this application.
                  </p>
                </div>

                {/* Email type selector + action button */}
                <div className="flex items-center gap-3">
                  <Select
                    value={selectedEmailType}
                    onValueChange={(v) => {
                      const next = v as EmailType;
                      setSelectedEmailType(next);
                      setDraftedEmail(jobCache?.emails?.[next] ?? null);
                      setEmailError(null);
                      setBodyCopied(false);
                    }}
                  >
                    <SelectTrigger className="flex-1 text-sm">
                      <SelectValue placeholder="Select email type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleDraftEmail}
                    disabled={isDraftingEmail}
                    size="sm"
                    className="gap-1.5 shrink-0"
                  >
                    {isDraftingEmail ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Drafting...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        {draftedEmail ? "Redraft" : "Draft Email"}
                      </>
                    )}
                  </Button>
                </div>

                {emailError && (
                  <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    {emailError}
                  </div>
                )}

                {draftedEmail && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3">
                    <Tabs
                      value={activeEmailTab}
                      onValueChange={(v) => {
                        setActiveEmailTab(v as "en" | "th");
                        setBodyCopied(false);
                      }}
                      defaultValue="en"
                    >
                      <TabsList className="grid w-full max-w-[260px] grid-cols-2">
                        <TabsTrigger value="en" className="text-xs">{t.ai.english}</TabsTrigger>
                        <TabsTrigger value="th" className="text-xs">{t.ai.thai}</TabsTrigger>
                      </TabsList>

                      {(["en", "th"] as const).map((tab) => {
                        const subject = tab === "th" ? draftedEmail.subjectTh : draftedEmail.subjectEn;
                        const body = tab === "th" ? draftedEmail.bodyTh : draftedEmail.bodyEn;
                        return (
                          <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold uppercase text-primary">
                                Subject
                              </p>
                              <div className="px-4 py-2.5 rounded-lg border border-border bg-muted/40 text-sm font-medium">
                                {subject}
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase text-primary">
                                  Email Body
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 gap-1.5 text-xs"
                                  onClick={handleCopyBody}
                                >
                                  {bodyCopied ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 text-green-600" />
                                      <span className="text-green-600">{t.buttons.copied}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5" />
                                      {t.buttons.copy}
                                    </>
                                  )}
                                </Button>
                              </div>
                              <div className="p-5 rounded-lg border border-border bg-background text-sm leading-loose whitespace-pre-wrap shadow-sm">
                                {body}
                              </div>
                            </div>
                          </TabsContent>
                        );
                      })}
                    </Tabs>
                  </div>
                )}

                {draftedEmail && (
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Want to change something? (e.g. 'Make it shorter')"
                      value={emailFeedback}
                      onChange={(e) => setEmailFeedback(e.target.value)}
                      disabled={isDraftingEmail}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleDraftEmail}
                      disabled={isDraftingEmail}
                      className="shrink-0"
                    >
                      {isDraftingEmail ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          Refining...
                        </>
                      ) : (
                        "✨ Refine"
                      )}
                    </Button>
                  </div>
                )}

                {!draftedEmail && !isDraftingEmail && (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-2">
                    <Mail className="h-10 w-10 opacity-20" />
                    <p className="text-sm">
                      Select an email type and click{" "}
                      <span className="font-medium">Draft Email</span> to
                      generate a professional message.
                    </p>
                    <p className="text-xs opacity-70">
                      Uses your name, the role, and company to personalize the draft.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* ── Resume Match Tab ── */}
              <TabsContent value="resume-match" className="mt-6 space-y-5">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4 text-primary" />
                      Resume Match &amp; Score
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Analyzes your master resume against this role&apos;s requirements.
                    </p>
                  </div>
                  <Button
                    onClick={handleScoreResume}
                    disabled={isScoring}
                    size="sm"
                    className="gap-1.5 shrink-0"
                  >
                    {isScoring ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4" />
                        {scoreData ? "Re-analyze" : "Analyze Match"}
                      </>
                    )}
                  </Button>
                </div>

                {scoreError && (
                  <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    {scoreError}
                  </div>
                )}

                {scoreData && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-5">
                    {/* Score dial */}
                    {(() => {
                      const s = scoreData.score;
                      const color = s >= 80 ? "#22c55e" : s >= 50 ? "#eab308" : "#ef4444";
                      const textColor = s >= 80 ? "text-green-600" : s >= 50 ? "text-yellow-600" : "text-red-500";
                      const label = s >= 80 ? "Strong Match" : s >= 50 ? "Partial Match" : "Weak Match";
                      // SVG circle dial: circumference = 2π×40 ≈ 251.2
                      const circ = 251.2;
                      const offset = circ - (s / 100) * circ;
                      return (
                        <div className="flex flex-col items-center gap-2 py-4">
                          <svg width="120" height="120" viewBox="0 0 100 100" className="-rotate-90">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/30" />
                            <circle
                              cx="50" cy="50" r="40" fill="none"
                              stroke={color} strokeWidth="10"
                              strokeDasharray={circ}
                              strokeDashoffset={offset}
                              strokeLinecap="round"
                              style={{ transition: "stroke-dashoffset 0.8s ease" }}
                            />
                          </svg>
                          <div className="-mt-[88px] flex flex-col items-center z-10">
                            <span className={`text-4xl font-bold ${textColor}`}>{s}</span>
                            <span className="text-xs text-muted-foreground font-medium">/ 100</span>
                          </div>
                          <div className="mt-10" />
                          <span className={`text-sm font-semibold ${textColor}`}>{label}</span>
                        </div>
                      );
                    })()}

                    {/* EN / TH toggle */}
                    <Tabs
                      value={activeScoreTab}
                      onValueChange={(v) => setActiveScoreTab(v as "en" | "th")}
                      defaultValue="en"
                    >
                      <TabsList className="grid w-full max-w-[260px] grid-cols-2">
                        <TabsTrigger value="en" className="text-xs">{t.ai.english}</TabsTrigger>
                        <TabsTrigger value="th" className="text-xs">{t.ai.thai}</TabsTrigger>
                      </TabsList>

                      {(["en", "th"] as const).map((tab) => {
                        const strengths = tab === "th" ? scoreData.strengthsTh : scoreData.strengthsEn;
                        const weaknesses = tab === "th" ? scoreData.weaknessesTh : scoreData.weaknessesEn;
                        const advice = tab === "th" ? scoreData.adviceTh : scoreData.adviceEn;
                        return (
                          <TabsContent key={tab} value={tab} className="mt-3">
                            <Accordion type="multiple" className="space-y-2">
                              {/* Strengths */}
                              <AccordionItem value="strengths" className="border border-green-200 rounded-lg px-4 data-[state=open]:bg-green-50/50 transition-colors">
                                <AccordionTrigger className="text-sm font-semibold text-green-700 hover:no-underline py-3 gap-2">
                                  <span className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                                    {tab === "th" ? "จุดแข็ง" : "Strengths"} ({strengths.length})
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent className="pb-3">
                                  <ul className="space-y-2">
                                    {strengths.map((item, i) => (
                                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-500" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </AccordionContent>
                              </AccordionItem>

                              {/* Weaknesses */}
                              <AccordionItem value="weaknesses" className="border border-red-200 rounded-lg px-4 data-[state=open]:bg-red-50/50 transition-colors">
                                <AccordionTrigger className="text-sm font-semibold text-red-700 hover:no-underline py-3 gap-2">
                                  <span className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                                    {tab === "th" ? "จุดอ่อน" : "Weaknesses"} ({weaknesses.length})
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent className="pb-3">
                                  <ul className="space-y-2">
                                    {weaknesses.map((item, i) => (
                                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                                        <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-400" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </AccordionContent>
                              </AccordionItem>

                              {/* Advice */}
                              <AccordionItem value="advice" className="border border-amber-200 rounded-lg px-4 data-[state=open]:bg-amber-50/50 transition-colors">
                                <AccordionTrigger className="text-sm font-semibold text-amber-700 hover:no-underline py-3 gap-2">
                                  <span className="flex items-center gap-2">
                                    <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" />
                                    {tab === "th" ? "คำแนะนำ" : "Advice"} ({advice.length})
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent className="pb-3">
                                  <ul className="space-y-2">
                                    {advice.map((item, i) => (
                                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                                        <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </TabsContent>
                        );
                      })}
                    </Tabs>

                    {/* ── Auto-Improve Divider ── */}
                    <div className="border-t border-border pt-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Auto-Improve My Resume
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Rewrites your master resume specifically for this role, in EN &amp; TH.
                          </p>
                        </div>
                        <Button
                          onClick={handleOptimizeResume}
                          disabled={isOptimizing}
                          size="sm"
                          className="gap-1.5 shrink-0"
                        >
                          {isOptimizing ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Rewriting...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              {optimizedData ? "Re-optimize" : "Auto-Improve"}
                            </>
                          )}
                        </Button>
                      </div>

                      {optimizeError && (
                        <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm flex items-start gap-2 mb-3">
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          {optimizeError}
                        </div>
                      )}

                      {optimizedData && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3">
                          <Tabs
                            value={activeOptimizeTab}
                            onValueChange={(v) => {
                              setActiveOptimizeTab(v as "en" | "th");
                              setOptimizeCopied(null);
                            }}
                            defaultValue="en"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <TabsList className="grid w-full max-w-[260px] grid-cols-2">
                                <TabsTrigger value="en" className="text-xs">{t.ai.english}</TabsTrigger>
                                <TabsTrigger value="th" className="text-xs">{t.ai.thai}</TabsTrigger>
                              </TabsList>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1.5 text-xs"
                                onClick={() => handleCopyOptimized(activeOptimizeTab)}
                              >
                                {optimizeCopied === activeOptimizeTab ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-green-600" />
                                    <span className="text-green-600">{t.buttons.copied}</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" />
                                    {t.buttons.copy}
                                  </>
                                )}
                              </Button>
                            </div>
                            <TabsContent value="en" className="mt-3">
                              <div className="p-5 rounded-lg border border-border bg-background text-sm leading-loose whitespace-pre-wrap shadow-sm font-mono max-h-[500px] overflow-y-auto">
                                {optimizedData.optimizedResumeEn}
                              </div>
                            </TabsContent>
                            <TabsContent value="th" className="mt-3">
                              <div className="p-5 rounded-lg border border-border bg-background text-sm leading-loose whitespace-pre-wrap shadow-sm font-mono max-h-[500px] overflow-y-auto">
                                {optimizedData.optimizedResumeTh}
                              </div>
                            </TabsContent>
                          </Tabs>

                          {/* Optimizer refinement input */}
                          <div className="flex gap-2 pt-1">
                            <Input
                              placeholder="Want changes? (e.g. 'Add more leadership bullet points')"
                              value={optimizeFeedback}
                              onChange={(e) => setOptimizeFeedback(e.target.value)}
                              disabled={isOptimizing}
                              className="text-sm"
                            />
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={handleOptimizeResume}
                              disabled={isOptimizing}
                              className="shrink-0"
                            >
                              {isOptimizing ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                  Refining...
                                </>
                              ) : (
                                "✨ Refine"
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Score Refinement input */}
                    <div className="flex gap-2 pt-1">
                      <Input
                        placeholder="Want different feedback? (e.g. 'Focus on DevOps gaps')"
                        value={scoreFeedback}
                        onChange={(e) => setScoreFeedback(e.target.value)}
                        disabled={isScoring}
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleScoreResume}
                        disabled={isScoring}
                        className="shrink-0"
                      >
                        {isScoring ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            Refining...
                          </>
                        ) : (
                          "✨ Refine"
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {!scoreData && !isScoring && (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-2">
                    <Target className="h-10 w-10 opacity-20" />
                    <p className="text-sm">
                      Click <span className="font-medium">Analyze Match</span> to get a compatibility
                      score between your master resume and this role.
                    </p>
                    <p className="text-xs opacity-70">
                      Requires a master resume saved in your Profile settings.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
