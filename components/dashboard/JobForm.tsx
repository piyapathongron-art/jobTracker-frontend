"use client";

import { useState } from "react";
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
import type { Status, JobApplication } from "@/lib/types";
import { Loader2, Sparkles } from "lucide-react";
import { api } from "@/lib/axios";

const STATUSES: { value: Status; label: string }[] = [
  { value: "WISHLIST",     label: "Wishlist"     },
  { value: "APPLIED",      label: "Applied"      },
  { value: "INTERVIEWING", label: "Interviewing" },
  { value: "OFFERED",      label: "Offered"      },
  { value: "REJECTED",     label: "Rejected"     },
  { value: "GHOSTED",      label: "Ghosted"      },
];

interface JobFormProps {
  initialData?: Partial<JobApplication>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function JobForm({ initialData, onSubmit, onCancel, submitLabel = "Save" }: JobFormProps) {
  const [company, setCompany] = useState(initialData?.company || "");
  const [role, setRole] = useState(initialData?.role || "");
  const [status, setStatus] = useState<Status>(initialData?.status || "WISHLIST");
  const [url, setUrl] = useState(initialData?.url || "");
  const [salaryMin, setSalaryMin] = useState(initialData?.salaryMin?.toString() || "");
  const [salaryMax, setSalaryMax] = useState(initialData?.salaryMax?.toString() || "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [appliedAt, setAppliedAt] = useState(
    initialData?.appliedAt ? new Date(initialData.appliedAt).toISOString().split("T")[0] : ""
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Parser state
  const [jdText, setJdText] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  async function handleAIParse() {
    if (!jdText.trim()) return;
    setIsParsing(true);
    setError(null);
    try {
      const res = await api.post("/api/ai/parse-jd", { text: jdText });
      const data = res.data;
      if (data.company) setCompany(data.company);
      if (data.role) setRole(data.role);
      if (data.location) setLocation(data.location);
      if (data.salaryMin) setSalaryMin(data.salaryMin.toString());
      if (data.salaryMax) setSalaryMax(data.salaryMax.toString());
      if (data.notes) setNotes(data.notes);
    } catch (err: any) {
      setError(err.response?.data?.error || "AI parsing failed.");
    } finally {
      setIsParsing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        company: company.trim(),
        role: role.trim(),
        status,
        url: url.trim() || null,
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        location: location.trim() || null,
        notes: notes.trim() || null,
        appliedAt: appliedAt ? new Date(appliedAt).toISOString() : null,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save job.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!initialData && (
        <div className="space-y-1.5 p-3 bg-muted/50 rounded-lg border border-dashed border-border mb-4">
          <Label htmlFor="jdText" className="text-xs font-semibold flex items-center gap-1.5 text-primary">
            <Sparkles className="h-3 w-3" />
            AI Auto-Fill
          </Label>
          <Textarea
            id="jdText"
            placeholder="Paste Job Description here..."
            className="text-xs min-h-[80px] bg-background"
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            disabled={isParsing || submitting}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="w-full mt-2 h-8 text-xs gap-1.5"
            onClick={handleAIParse}
            disabled={isParsing || !jdText.trim() || submitting}
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="company">Company *</Label>
          <Input
            id="company"
            placeholder="e.g. Stripe"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            disabled={submitting}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Role *</Label>
          <Input
            id="role"
            placeholder="e.g. Senior Engineer"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={submitting}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as Status)}
            disabled={submitting}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="e.g. Remote / NYC"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={submitting}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="url">Job URL</Label>
        <Input
          id="url"
          type="url"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={submitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="salaryMin">Min Salary (Annual)</Label>
          <Input
            id="salaryMin"
            type="number"
            placeholder="e.g. 120000"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="salaryMax">Max Salary (Annual)</Label>
          <Input
            id="salaryMax"
            type="number"
            placeholder="e.g. 150000"
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            disabled={submitting}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="appliedAt">Applied Date</Label>
        <Input
          id="appliedAt"
          type="date"
          value={appliedAt}
          onChange={(e) => setAppliedAt(e.target.value)}
          disabled={submitting}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes / Tech Stack</Label>
        <Textarea
          id="notes"
          placeholder="Key requirements, interview notes..."
          className="min-h-[100px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={submitting}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={submitting || !company.trim() || !role.trim()}
        >
          {submitting ? (
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
  );
}
