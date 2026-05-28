"use client";

import { useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, Link as LinkIcon } from "lucide-react";
import { api } from "@/lib/axios";

interface ParsedJD {
  company?: string;
  role?: string;
  location?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  url?: string;
  source?: string;
}

interface FormState {
  company: string;
  role: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  url: string;
  source: string;
}

const emptyForm: FormState = {
  company: "",
  role: "",
  location: "",
  salaryMin: "",
  salaryMax: "",
  url: "",
  source: "",
};

const SOURCE_OPTIONS = [
  "LinkedIn",
  "JobsDB",
  "Indeed",
  "Glassdoor",
  "Workday",
  "Greenhouse",
  "Lever",
  "Ashby",
  "Wellfound",
  "Seek",
  "Company Site",
  "Referral",
  "Other",
];

interface AddApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function AddApplicationDialog({ open, onOpenChange, onCreated }: AddApplicationDialogProps) {
  const [jdText, setJdText] = useState("");
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isParsing, setIsParsing] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setJdText("");
      setScrapeUrl("");
      setForm(emptyForm);
      setParseError(null);
      setScrapeError(null);
      setSaveError(null);
    }
    onOpenChange(nextOpen);
  }

  function setField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function applyParsedData(data: ParsedJD, fallbackUrl?: string) {
    setForm((prev) => ({
      company:   data.company  ?? prev.company,
      role:      data.role     ?? prev.role,
      location:  data.location ?? prev.location,
      salaryMin: data.salaryMin != null ? String(data.salaryMin) : prev.salaryMin,
      salaryMax: data.salaryMax != null ? String(data.salaryMax) : prev.salaryMax,
      url:       data.url ?? fallbackUrl ?? prev.url,
      source:    data.source ?? prev.source,
    }));
  }

  async function handleAutofill() {
    if (!jdText.trim()) return;
    setIsParsing(true);
    setParseError(null);

    try {
      const { data } = await api.post<ParsedJD>("/api/ai/parse-jd", { text: jdText });
      applyParsedData(data);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? "Failed to parse. Try again."
        : "Failed to parse. Try again.";
      setParseError(msg);
    } finally {
      setIsParsing(false);
    }
  }

  async function handleScrapeUrl() {
    const url = scrapeUrl.trim();
    if (!url) return;
    setIsScraping(true);
    setScrapeError(null);

    try {
      const { data } = await api.post<ParsedJD>("/api/ai/scrape-url", { url });
      applyParsedData(data, url);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? "Failed to scrape. Try again."
        : "Failed to scrape. Try again.";
      setScrapeError(msg);
    } finally {
      setIsScraping(false);
    }
  }

  async function handleSave() {
    if (!form.company.trim() || !form.role.trim()) {
      setSaveError("Company and Role are required.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await api.post("/api/applications", {
        company: form.company.trim(),
        role: form.role.trim(),
        location: form.location.trim() || undefined,
        salaryMin: form.salaryMin ? parseInt(form.salaryMin, 10) : undefined,
        salaryMax: form.salaryMax ? parseInt(form.salaryMax, 10) : undefined,
        url: form.url.trim() || undefined,
        source: form.source.trim() || undefined,
      });

      handleClose(false);
      onCreated?.();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? "Failed to save. Try again."
        : "Failed to save. Try again.";
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  }

  const isBusy = isParsing || isScraping || isSaving;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Application</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4 space-y-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              AI Auto-fill
            </p>

            <div className="space-y-2">
              <Label htmlFor="scrape-url" className="text-xs text-muted-foreground">
                Scrape from URL
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="scrape-url"
                    type="url"
                    placeholder="https://linkedin.com/jobs/view/..."
                    className="pl-8 text-sm"
                    value={scrapeUrl}
                    onChange={(e) => setScrapeUrl(e.target.value)}
                    disabled={isBusy}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="cursor-pointer gap-1.5 w-full sm:w-auto min-h-[40px]"
                  onClick={handleScrapeUrl}
                  disabled={isBusy || !scrapeUrl.trim()}
                >
                  {isScraping ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Scraping…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Scrape & Auto-fill
                    </>
                  )}
                </Button>
              </div>
              {scrapeError && <p className="text-xs text-destructive">{scrapeError}</p>}
            </div>

            <div className="relative flex items-center py-1">
              <div className="flex-1 border-t border-primary/15" />
              <span className="px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                or paste JD
              </span>
              <div className="flex-1 border-t border-primary/15" />
            </div>

            <div className="space-y-2">
              <Textarea
                placeholder="Paste the job description here…"
                className="min-h-[90px] text-sm resize-none"
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                disabled={isBusy}
              />
              {parseError && <p className="text-xs text-destructive">{parseError}</p>}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="cursor-pointer gap-1.5 w-full min-h-[40px]"
                onClick={handleAutofill}
                disabled={isBusy || !jdText.trim()}
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Parsing…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Auto-fill with AI
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="company">
                Company <span className="text-destructive">*</span>
              </Label>
              <Input
                id="company"
                placeholder="Acme Corp"
                value={form.company}
                onChange={(e) => setField("company", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">
                Role <span className="text-destructive">*</span>
              </Label>
              <Input
                id="role"
                placeholder="Software Engineer"
                value={form.role}
                onChange={(e) => setField("role", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="San Francisco, CA or Remote"
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="salaryMin">Salary Min</Label>
              <Input
                id="salaryMin"
                type="number"
                placeholder="100000"
                value={form.salaryMin}
                onChange={(e) => setField("salaryMin", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salaryMax">Salary Max</Label>
              <Input
                id="salaryMax"
                type="number"
                placeholder="140000"
                value={form.salaryMax}
                onChange={(e) => setField("salaryMax", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="url">Job Posting URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://..."
              value={form.url}
              onChange={(e) => setField("url", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="source">Source</Label>
            <Select value={form.source} onValueChange={(v) => setField("source", v)}>
              <SelectTrigger id="source" className="w-full">
                <SelectValue placeholder="Where did you find this job?" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {saveError && <p className="text-xs text-destructive -mt-1">{saveError}</p>}

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer w-full sm:w-auto"
            onClick={() => handleClose(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="cursor-pointer w-full sm:w-auto"
            onClick={handleSave}
            disabled={isSaving || !form.company.trim() || !form.role.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving…
              </>
            ) : (
              "Save Application"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
