"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { JobApplication } from "@/lib/types";
import type { NewJob } from "@/store/useJobStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Link as LinkIcon, FileText, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/axios";
import { useState } from "react";
import { useInsightsStore } from "@/store/useInsightsStore";

const STATUS_OPTIONS = [
  { value: "WISHLIST",     label: "Wishlist",     dot: "bg-slate-400"  },
  { value: "APPLIED",      label: "Applied",      dot: "bg-blue-500"   },
  { value: "INTERVIEWING", label: "Interviewing", dot: "bg-amber-400"  },
  { value: "OFFERED",      label: "Offered",      dot: "bg-green-500"  },
  { value: "REJECTED",     label: "Rejected"     },
  { value: "GHOSTED",      label: "Ghosted"      },
] as const;

const WORK_MODE_OPTIONS = [
  { value: "ONSITE",  label: "On-site" },
  { value: "HYBRID",  label: "Hybrid"  },
  { value: "REMOTE",  label: "Remote"  },
] as const;

const CURRENCY_OPTIONS = [
  { value: "THB", label: "THB ฿" },
  { value: "USD", label: "USD $" },
] as const;

const PERIOD_OPTIONS = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY",  label: "Yearly"  },
  { value: "HOURLY",  label: "Hourly"  },
] as const;

const jobFormSchema = z.object({
  company: z.string().trim().min(1, "Company is required"),
  role: z.string().trim().min(1, "Role is required"),
  status: z.enum(["WISHLIST", "APPLIED", "INTERVIEWING", "OFFERED", "REJECTED", "GHOSTED"]),
  url: z
    .string()
    .refine((v) => v === "" || /^https?:\/\/.+/.test(v), {
      message: "Must be a valid URL starting with http(s)://",
    })
    .optional(),
  salaryMin: z
    .string()
    .refine((v) => v === "" || (/^\d+$/.test(v) && parseInt(v, 10) >= 0), {
      message: "Must be a non-negative whole number",
    })
    .optional(),
  salaryMax: z
    .string()
    .refine((v) => v === "" || (/^\d+$/.test(v) && parseInt(v, 10) >= 0), {
      message: "Must be a non-negative whole number",
    })
    .optional(),
  salaryCurrency: z.enum(["THB", "USD"]),
  salaryPeriod: z.enum(["MONTHLY", "YEARLY", "HOURLY"]),
  location: z.string().optional(),
  workMode: z.enum(["ONSITE", "HYBRID", "REMOTE"]),
  jobDescription: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
  appliedAt: z.string().optional(),
});

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
] as const;

type JobFormValues = z.infer<typeof jobFormSchema>;

interface JobFormProps {
  initialData?: Partial<JobApplication>;
  onSubmit: (data: NewJob) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function JobForm({ initialData, onSubmit, onCancel, submitLabel = "Save" }: JobFormProps) {
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      company:        initialData?.company  ?? "",
      role:           initialData?.role     ?? "",
      status:         (initialData?.status as JobFormValues["status"]) ?? "WISHLIST",
      url:            initialData?.url      ?? "",
      salaryMin:      initialData?.salaryMin?.toString() ?? "",
      salaryMax:      initialData?.salaryMax?.toString() ?? "",
      salaryCurrency: (initialData?.salaryCurrency as "THB" | "USD") ?? "THB",
      salaryPeriod:   (initialData?.salaryPeriod as "MONTHLY" | "YEARLY" | "HOURLY") ?? "MONTHLY",
      location:       initialData?.location ?? "",
      workMode:       (initialData?.workMode as JobFormValues["workMode"]) ?? "ONSITE",
      jobDescription: initialData?.jobDescription ?? "",
      notes:          initialData?.notes    ?? "",
      source:         initialData?.source   ?? "",
      appliedAt:      initialData?.appliedAt
        ? new Date(initialData.appliedAt).toISOString().split("T")[0]
        : "",
    },
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  const isTrending = useInsightsStore((s) => s.isTrending);
  const watchedCompany = form.watch("company");
  const companyIsTrending = isTrending(watchedCompany);

  // AI Parser state
  const [jdText, setJdText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // URL Scraper state
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  type ParsedJD = {
    company?: string;
    role?: string;
    location?: string;
    workMode?: "ONSITE" | "HYBRID" | "REMOTE";
    salaryMin?: number | string | null;
    salaryMax?: number | string | null;
    jobDescription?: string;
    notes?: string;
    source?: string;
    url?: string;
  };

  function applyParsedToForm(data: ParsedJD, urlOverride?: string) {
    if (data.company)        form.setValue("company",  data.company,  { shouldValidate: true });
    if (data.role)           form.setValue("role",      data.role,     { shouldValidate: true });
    if (data.location)       form.setValue("location",  data.location, { shouldValidate: true });
    if (data.workMode)       form.setValue("workMode",  data.workMode, { shouldValidate: true });
    if (data.salaryMin != null) form.setValue("salaryMin", String(data.salaryMin), { shouldValidate: true });
    if (data.salaryMax != null) form.setValue("salaryMax", String(data.salaryMax), { shouldValidate: true });
    if (data.jobDescription) form.setValue("jobDescription", data.jobDescription, { shouldValidate: true });
    if (data.notes)          form.setValue("notes",     data.notes,    { shouldValidate: true });

    const finalUrl = data.url ?? urlOverride;
    if (finalUrl) form.setValue("url", finalUrl, { shouldValidate: true });

    if (data.source) {
      const finalSource = (SOURCE_OPTIONS as readonly string[]).includes(data.source) ? data.source : "Other";
      form.setValue("source", finalSource, { shouldValidate: true });
    }
  }

  async function handleAIParse() {
    if (!jdText.trim()) return;
    setIsParsing(true);
    setParseError(null);
    try {
      const res = await api.post<ParsedJD>("/api/ai/parse-jd", { text: jdText });
      applyParsedToForm(res.data);
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setParseError(err.response?.data?.error || "AI parsing failed.");
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
      const res = await api.post<ParsedJD>("/api/ai/scrape-url", { url });
      applyParsedToForm(res.data, url);
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setScrapeError(err.response?.data?.error || "AI scrape failed.");
    } finally {
      setIsScraping(false);
    }
  }

  async function handleSubmit(values: JobFormValues) {
    setSubmitError(null);
    try {
      await onSubmit({
        company:        values.company.trim(),
        role:           values.role.trim(),
        status:         values.status,
        url:            values.url?.trim()      || null,
        salaryMin:      values.salaryMin        ? parseInt(values.salaryMin, 10) : null,
        salaryMax:      values.salaryMax        ? parseInt(values.salaryMax, 10) : null,
        salaryCurrency: values.salaryCurrency,
        salaryPeriod:   values.salaryPeriod,
        location:       values.location?.trim() || null,
        workMode:       values.workMode,
        jobDescription: values.jobDescription?.trim() || null,
        notes:          values.notes?.trim()    || null,
        source:         values.source?.trim()   || null,
        appliedAt:      values.appliedAt        ? new Date(values.appliedAt).toISOString() : null,
      });
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setSubmitError(err.response?.data?.error || "Failed to save job.");
    }
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {submitError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </p>
        )}

        {/* ── AI Auto-Fill (add mode only) ── */}
        {!initialData && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4 space-y-3 mb-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              AI Auto-fill
            </p>

            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url" className="gap-1.5 cursor-pointer">
                  <LinkIcon className="h-3.5 w-3.5" />
                  Scrape URL
                </TabsTrigger>
                <TabsTrigger value="paste" className="gap-1.5 cursor-pointer">
                  <FileText className="h-3.5 w-3.5" />
                  Paste JD
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-2 mt-3">
                <Label htmlFor="scrape-url" className="text-xs text-muted-foreground">
                  Paste a job posting URL — we&apos;ll fetch and parse it
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="scrape-url"
                      type="url"
                      placeholder="https://linkedin.com/jobs/view/..."
                      className="pl-8 text-sm bg-background"
                      value={scrapeUrl}
                      onChange={(e) => setScrapeUrl(e.target.value)}
                      disabled={isScraping || isParsing || isSubmitting}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="cursor-pointer gap-1.5 w-full sm:w-auto min-h-[40px]"
                    onClick={handleScrapeUrl}
                    disabled={isScraping || isParsing || isSubmitting || !scrapeUrl.trim()}
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
              </TabsContent>

              <TabsContent value="paste" className="space-y-2 mt-3">
                <Label htmlFor="jd-text" className="text-xs text-muted-foreground">
                  Paste the full job description text
                </Label>
                <Textarea
                  id="jd-text"
                  placeholder="Paste the job description here…"
                  className="min-h-[110px] text-sm resize-none bg-background"
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  disabled={isParsing || isScraping || isSubmitting}
                />
                {parseError && <p className="text-xs text-destructive">{parseError}</p>}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="cursor-pointer gap-1.5 w-full min-h-[40px]"
                  onClick={handleAIParse}
                  disabled={isParsing || isScraping || isSubmitting || !jdText.trim()}
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
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* ── Company + Role ── */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <FormLabel>Company *</FormLabel>
                  {companyIsTrending && (
                    <Badge
                      variant="outline"
                      className="gap-1 border-orange-300 bg-orange-50 text-orange-700 px-2 py-0.5"
                      title="3+ other users have applied here recently"
                    >
                      <Flame className="h-3 w-3" />
                      <span className="text-[10px] font-bold uppercase tracking-wide">
                        Highly Competitive
                      </span>
                    </Badge>
                  )}
                </div>
                <FormControl>
                  <Input placeholder="e.g. Stripe" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Senior Engineer" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ── Status + Work Mode ── */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <span className="flex items-center gap-2">
                          {"dot" in s && <span className={`h-2 w-2 rounded-full shrink-0 ${s.dot}`} />}
                          {s.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="workMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Mode</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {WORK_MODE_OPTIONS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ── Location + Job URL ── */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. NYC / Bangkok" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job URL</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://..." {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ── Source ── */}
        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source</FormLabel>
              <Select value={field.value || ""} onValueChange={field.onChange} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Where did you find this job?" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SOURCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Salary Min + Max ── */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="salaryMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Salary</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 80000" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="salaryMax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Salary</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 120000" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ── Currency + Period ── */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="salaryCurrency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="salaryPeriod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Period</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ── Applied Date ── */}
        <FormField
          control={form.control}
          name="appliedAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Applied Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Job Description ── */}
        <FormField
          control={form.control}
          name="jobDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Description (Full text)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Paste the full job description here..."
                  className="min-h-[150px]"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Personal Notes ── */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Personal Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tech stack, interview notes, etc."
                  className="min-h-[100px]"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                Saving…
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
