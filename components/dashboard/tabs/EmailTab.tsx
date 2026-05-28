"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Loader2, AlertCircle, Copy, Check } from "lucide-react";
import { api } from "@/lib/axios";
import { useLangStore } from "@/store/useLangStore";
import { getDictionary } from "@/locales";
import { useAiCacheStore } from "@/store/useAiCacheStore";
import type { JobApplication } from "@/lib/types";

interface DraftedEmail {
  subjectEn: string;
  bodyEn: string;
  subjectTh: string;
  bodyTh: string;
}

const EMAIL_TYPES = [
  "Initial Application Outreach",
  "Follow-up on Application",
  "Thank You (Post-Interview)",
  "Offer Negotiation",
  "Decline Offer",
] as const;

type EmailType = (typeof EMAIL_TYPES)[number];

interface EmailTabProps {
  job: JobApplication;
}

export function EmailTab({ job }: EmailTabProps) {
  const lang = useLangStore((s) => s.lang);
  const t = getDictionary(lang);

  const jobCache = useAiCacheStore((s) => s.cache[job.id]);
  const setEmailCache = useAiCacheStore((s) => s.setEmail);

  const [selectedEmailType, setSelectedEmailType] = useState<EmailType>(
    "Initial Application Outreach"
  );
  const [isDraftingEmail, setIsDraftingEmail] = useState(false);
  const [draftedEmail, setDraftedEmail] = useState<DraftedEmail | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [bodyCopied, setBodyCopied] = useState(false);
  const [activeEmailTab, setActiveEmailTab] = useState<"en" | "th">("en");
  const [emailFeedback, setEmailFeedback] = useState("");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const cachedEmail = jobCache?.emails?.[selectedEmailType];
    setDraftedEmail(cachedEmail ?? null);
    setEmailError(null);
    setBodyCopied(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [job.id, jobCache?.emails, selectedEmailType]);

  async function handleDraftEmail() {
    setIsDraftingEmail(true);
    setEmailError(null);
    setDraftedEmail(null);
    setBodyCopied(false);
    try {
      const payload: Record<string, string> = {
        jobId: job.id,
        emailType: selectedEmailType,
      };
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

  function handleCopyBody() {
    if (!draftedEmail) return;
    const body =
      activeEmailTab === "th" ? draftedEmail.bodyTh : draftedEmail.bodyEn;
    navigator.clipboard.writeText(body);
    setBodyCopied(true);
    setTimeout(() => setBodyCopied(false), 2000);
  }

  return (
    <div className="mt-6 space-y-5">
      <div>
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-primary" />
          Smart Email Drafter
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Generate a professional, ready-to-send email for this application.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={selectedEmailType}
          onValueChange={(v) => setSelectedEmailType(v as EmailType)}
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
              <TabsTrigger value="en" className="text-xs">
                {t.ai.english}
              </TabsTrigger>
              <TabsTrigger value="th" className="text-xs">
                {t.ai.thai}
              </TabsTrigger>
            </TabsList>

            {(["en", "th"] as const).map((tab) => {
              const subject =
                tab === "th" ? draftedEmail.subjectTh : draftedEmail.subjectEn;
              const body =
                tab === "th" ? draftedEmail.bodyTh : draftedEmail.bodyEn;
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
            <span className="font-medium">Draft Email</span> to generate a
            professional message.
          </p>
          <p className="text-xs opacity-70">
            Uses your name, the role, and company to personalize the draft.
          </p>
        </div>
      )}
    </div>
  );
}
