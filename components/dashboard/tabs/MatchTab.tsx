"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Target,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { api } from "@/lib/axios";
import { useLangStore } from "@/store/useLangStore";
import { getDictionary } from "@/locales";
import { useAiCacheStore } from "@/store/useAiCacheStore";
import type { JobApplication } from "@/lib/types";

interface MatchTabProps {
  job: JobApplication;
}

export function MatchTab({ job }: MatchTabProps) {
  const lang = useLangStore((s) => s.lang);
  const t = getDictionary(lang);

  const jobCache = useAiCacheStore((s) => s.cache[job.id]);
  const setResumeScoreCache = useAiCacheStore((s) => s.setResumeScore);
  const setOptimizedResumeCache = useAiCacheStore((s) => s.setOptimizedResume);

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

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setScoreData(jobCache?.resumeScore ?? null);
    setOptimizedData(jobCache?.optimizedResume ?? null);
    setScoreError(null);
    setOptimizeError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [job.id, jobCache?.resumeScore, jobCache?.optimizedResume]);

  async function handleScoreResume() {
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
        err.response?.data?.error ||
          "Failed to analyze resume match. Please try again."
      );
    } finally {
      setIsScoring(false);
    }
  }

  async function handleOptimizeResume() {
    if (!scoreData) return;
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
        err.response?.data?.error ||
          "Failed to optimize resume. Please try again."
      );
    } finally {
      setIsOptimizing(false);
    }
  }

  function handleCopyOptimized(which: "en" | "th") {
    if (!optimizedData) return;
    const text =
      which === "th"
        ? optimizedData.optimizedResumeTh
        : optimizedData.optimizedResumeEn;
    navigator.clipboard.writeText(text);
    setOptimizeCopied(which);
    setTimeout(() => setOptimizeCopied(null), 2000);
  }

  return (
    <div className="mt-6 space-y-5">
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
            const color =
              s >= 80 ? "#22c55e" : s >= 50 ? "#eab308" : "#ef4444";
            const textColor =
              s >= 80
                ? "text-green-600"
                : s >= 50
                ? "text-yellow-600"
                : "text-red-500";
            const label =
              s >= 80
                ? "Strong Match"
                : s >= 50
                ? "Partial Match"
                : "Weak Match";
            // SVG circle dial: circumference = 2π×40 ≈ 251.2
            const circ = 251.2;
            const offset = circ - (s / 100) * circ;
            return (
              <div className="flex flex-col items-center gap-2 py-4">
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 100 100"
                  className="-rotate-90"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-muted/30"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={color}
                    strokeWidth="10"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.8s ease" }}
                  />
                </svg>
                <div className="-mt-[88px] flex flex-col items-center z-10">
                  <span className={`text-4xl font-bold ${textColor}`}>
                    {s}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    / 100
                  </span>
                </div>
                <div className="mt-10" />
                <span className={`text-sm font-semibold ${textColor}`}>
                  {label}
                </span>
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
              <TabsTrigger value="en" className="text-xs">
                {t.ai.english}
              </TabsTrigger>
              <TabsTrigger value="th" className="text-xs">
                {t.ai.thai}
              </TabsTrigger>
            </TabsList>

            {(["en", "th"] as const).map((tab) => {
              const strengths =
                tab === "th"
                  ? scoreData.strengthsTh
                  : scoreData.strengthsEn;
              const weaknesses =
                tab === "th"
                  ? scoreData.weaknessesTh
                  : scoreData.weaknessesEn;
              const advice =
                tab === "th" ? scoreData.adviceTh : scoreData.adviceEn;
              return (
                <TabsContent key={tab} value={tab} className="mt-3">
                  <Accordion type="multiple" className="space-y-2">
                    {/* Strengths */}
                    <AccordionItem
                      value="strengths"
                      className="border border-green-200 rounded-lg px-4 data-[state=open]:bg-green-50/50 transition-colors"
                    >
                      <AccordionTrigger className="text-sm font-semibold text-green-700 hover:no-underline py-3 gap-2">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                          {tab === "th" ? "จุดแข็ง" : "Strengths"} (
                          {strengths.length})
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-3">
                        <ul className="space-y-2">
                          {strengths.map((item, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-foreground"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Weaknesses */}
                    <AccordionItem
                      value="weaknesses"
                      className="border border-red-200 rounded-lg px-4 data-[state=open]:bg-red-50/50 transition-colors"
                    >
                      <AccordionTrigger className="text-sm font-semibold text-red-700 hover:no-underline py-3 gap-2">
                        <span className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                          {tab === "th" ? "จุดอ่อน" : "Weaknesses"} (
                          {weaknesses.length})
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-3">
                        <ul className="space-y-2">
                          {weaknesses.map((item, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-foreground"
                            >
                              <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-400" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Advice */}
                    <AccordionItem
                      value="advice"
                      className="border border-amber-200 rounded-lg px-4 data-[state=open]:bg-amber-50/50 transition-colors"
                    >
                      <AccordionTrigger className="text-sm font-semibold text-amber-700 hover:no-underline py-3 gap-2">
                        <span className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" />
                          {tab === "th" ? "คำแนะนำ" : "Advice"} (
                          {advice.length})
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-3">
                        <ul className="space-y-2">
                          {advice.map((item, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-foreground"
                            >
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
                  Rewrites your master resume specifically for this role, in EN
                  &amp; TH.
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
                      onClick={() => handleCopyOptimized(activeOptimizeTab)}
                    >
                      {optimizeCopied === activeOptimizeTab ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-green-600">
                            {t.buttons.copied}
                          </span>
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
            Click <span className="font-medium">Analyze Match</span> to get a
            compatibility score between your master resume and this role.
          </p>
          <p className="text-xs opacity-70">
            Requires a master resume saved in your Profile settings.
          </p>
        </div>
      )}
    </div>
  );
}
