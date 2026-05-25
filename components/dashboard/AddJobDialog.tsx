"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useJobStore } from "@/store/useJobStore";
import type { Status } from "@/lib/types";
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddJobDialog({ open, onOpenChange }: Props) {
  const addJob = useJobStore((s) => s.addJob);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<Status>("WISHLIST");
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
      const res = await api.post("/ai/parse-jd", { text: jdText });
      const data = res.data;
      if (data.company) setCompany(data.company);
      if (data.role) setRole(data.role);
      // Notes field can be added later if needed, but for now we auto-fill the basics
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
      await addJob({
        company: company.trim(),
        role: role.trim(),
        status,
        url: null,
        salaryMin: null,
        salaryMax: null,
        location: null,
        appliedAt: status === "APPLIED" ? new Date().toISOString() : null,
      });
      setCompany("");
      setRole("");
      setJdText("");
      setStatus("WISHLIST");
      onOpenChange(false);
    } catch {
      setError("Failed to add job. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!submitting) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {/* AI Parser Section */}
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
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
                "Add Job"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
