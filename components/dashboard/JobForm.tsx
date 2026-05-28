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
import { Loader2, Sparkles } from "lucide-react";
import { api } from "@/lib/axios";
import { useState } from "react";

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

  // AI Parser state
  const [jdText, setJdText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  async function handleAIParse() {
    if (!jdText.trim()) return;
    setIsParsing(true);
    setParseError(null);
    try {
      const res = await api.post("/api/ai/parse-jd", { text: jdText });
      const data = res.data;
      if (data.company)        form.setValue("company",  data.company,  { shouldValidate: true });
      if (data.role)           form.setValue("role",      data.role,     { shouldValidate: true });
      if (data.location)       form.setValue("location",  data.location, { shouldValidate: true });
      if (data.workMode)       form.setValue("workMode",  data.workMode, { shouldValidate: true });
      if (data.salaryMin)      form.setValue("salaryMin", data.salaryMin.toString(), { shouldValidate: true });
      if (data.salaryMax)      form.setValue("salaryMax", data.salaryMax.toString(), { shouldValidate: true });
      if (data.jobDescription) form.setValue("jobDescription", data.jobDescription, { shouldValidate: true });
      if (data.notes)          form.setValue("notes",     data.notes,    { shouldValidate: true });
      if (data.source)         form.setValue("source",    data.source,   { shouldValidate: true });
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setParseError(err.response?.data?.error || "AI parsing failed.");
    } finally {
      setIsParsing(false);
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
          <div className="space-y-1.5 p-3 bg-muted/50 rounded-lg border border-dashed border-border mb-4">
            <p className="text-xs font-semibold flex items-center gap-1.5 text-primary">
              <Sparkles className="h-3 w-3" />
              AI Auto-Fill
            </p>
            <Textarea
              placeholder="Paste Job Description here..."
              className="text-xs min-h-[80px] bg-background"
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              disabled={isParsing || isSubmitting}
            />
            {parseError && (
              <p className="text-xs text-red-600">{parseError}</p>
            )}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="w-full mt-2 h-8 text-xs gap-1.5"
              onClick={handleAIParse}
              disabled={isParsing || !jdText.trim() || isSubmitting}
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analyzing JD...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  Parse with Gemini
                </>
              )}
            </Button>
          </div>
        )}

        {/* ── Company + Role ── */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company *</FormLabel>
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
