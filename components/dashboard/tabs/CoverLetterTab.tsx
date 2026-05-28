"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  FileText,
  Check,
  Copy,
} from "lucide-react";
import { api } from "@/lib/axios";
import { useLangStore } from "@/store/useLangStore";
import { getDictionary } from "@/locales";
import { useAiCacheStore } from "@/store/useAiCacheStore";
import type { JobApplication } from "@/lib/types";

interface TailoredData {
  coverLetterEn: string;
  coverLetterTh: string;
  missingKeywords: string[];
}

interface CoverLetterTabProps {
  job: JobApplication;
}

export function CoverLetterTab({ job }: CoverLetterTabProps) {
  const lang = useLangStore((s) => s.lang);
  const t = getDictionary(lang);
  
  const jobCache = useAiCacheStore((s) => s.cache[job.id]);
  const setCoverLetterCache = useAiCacheStore((s) => s.setCoverLetter);

  const [isTailoring, setIsTailoring] = useState(false);
  const [tailoredData, setTailoredData] = useState<TailoredData | null>(null);
  const [tailorError, setTailorError] = useState<string | null>(null);
  const [coverCopied, setCoverCopied] = useState<"en" | "th" | null>(null);
  const [activeCoverTab, setActiveCoverTab] = useState<"en" | "th">("en");
  const [tailorFeedback, setTailorFeedback] = useState("");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setTailoredData(jobCache?.coverLetter ?? null);
    setTailorError(null);
    setCoverCopied(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [job.id, jobCache?.coverLetter]);

  async function handleTailor() {
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

  function handleCopyCover(which: "en" | "th") {
    if (!tailoredData) return;
    const text =
      which === "th"
        ? tailoredData.coverLetterTh
        : tailoredData.coverLetterEn;
    navigator.clipboard.writeText(text);
    setCoverCopied(which);
    setTimeout(() => setCoverCopied(null), 2000);
  }

  return (
    <div className="mt-6 space-y-5">
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
                  <TabsTrigger value="en" className="text-xs">
                    {t.ai.english}
                  </TabsTrigger>
                  <TabsTrigger value="th" className="text-xs">
                    {t.ai.thai}
                  </TabsTrigger>
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
            Click <span className="font-medium">Generate</span> to tailor your
            resume and create a cover letter for this role.
          </p>
          <p className="text-xs opacity-70">
            Requires a master resume saved in your Profile settings.
          </p>
        </div>
      )}
    </div>
  );
}
