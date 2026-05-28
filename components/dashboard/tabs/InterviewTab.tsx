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
import { BrainCircuit, Loader2, AlertCircle, Lightbulb } from "lucide-react";
import { api } from "@/lib/axios";
import { useLangStore } from "@/store/useLangStore";
import { getDictionary } from "@/locales";
import { useAiCacheStore } from "@/store/useAiCacheStore";
import type { JobApplication } from "@/lib/types";

interface InterviewQuestion {
  questionEn: string;
  starHintEn: string;
  questionTh: string;
  starHintTh: string;
}

interface InterviewTabProps {
  job: JobApplication;
}

export function InterviewTab({ job }: InterviewTabProps) {
  const lang = useLangStore((s) => s.lang);
  const t = getDictionary(lang);

  const jobCache = useAiCacheStore((s) => s.cache[job.id]);
  const setInterviewCache = useAiCacheStore((s) => s.setInterview);

  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState<
    InterviewQuestion[] | null
  >(null);
  const [interviewError, setInterviewError] = useState<string | null>(null);
  const [activeInterviewTab, setActiveInterviewTab] = useState<"en" | "th">("en");
  const [interviewFeedback, setInterviewFeedback] = useState("");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setInterviewQuestions(jobCache?.interview?.questions ?? null);
    setInterviewError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [job.id, jobCache?.interview?.questions]);

  async function handleGenerateQuestions() {
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

  return (
    <div className="mt-6 space-y-5">
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
              {interviewQuestions ? "Regenerate" : "Generate Practice Questions"}
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
              <TabsTrigger value="en" className="text-xs">
                {t.ai.english}
              </TabsTrigger>
              <TabsTrigger value="th" className="text-xs">
                {t.ai.thai}
              </TabsTrigger>
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
            Click <span className="font-medium">Generate Practice Questions</span>{" "}
            to get tailored interview questions for this role.
          </p>
          <p className="text-xs opacity-70">
            Uses the role, company, and tech stack from your notes.
          </p>
        </div>
      )}
    </div>
  );
}
