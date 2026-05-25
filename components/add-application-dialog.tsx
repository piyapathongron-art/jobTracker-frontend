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
import { Sparkles, Loader2 } from "lucide-react";
import { api } from "@/lib/axios";

interface ParsedJD {
  company?: string;
  role?: string;
  location?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
}

interface FormState {
  company: string;
  role: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  url: string;
}

const emptyForm: FormState = {
  company: "",
  role: "",
  location: "",
  salaryMin: "",
  salaryMax: "",
  url: "",
};

interface AddApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function AddApplicationDialog({ open, onOpenChange, onCreated }: AddApplicationDialogProps) {
  const [jdText, setJdText] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setJdText("");
      setForm(emptyForm);
      setParseError(null);
      setSaveError(null);
    }
    onOpenChange(nextOpen);
  }

  function setField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAutofill() {
    if (!jdText.trim()) return;
    setIsParsing(true);
    setParseError(null);

    try {
      const { data } = await api.post<ParsedJD>("/api/ai/parse-jd", { jdText });
      setForm({
        company: data.company ?? "",
        role: data.role ?? "",
        location: data.location ?? "",
        salaryMin: data.salaryMin != null ? String(data.salaryMin) : "",
        salaryMax: data.salaryMax != null ? String(data.salaryMax) : "",
        url: "",
      });
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? "Failed to parse. Try again."
        : "Failed to parse. Try again.";
      setParseError(msg);
    } finally {
      setIsParsing(false);
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Application</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              AI Auto-fill
            </p>
            <Textarea
              placeholder="Paste the job description here…"
              className="min-h-[100px] text-sm resize-none"
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              disabled={isParsing}
            />
            {parseError && <p className="text-xs text-destructive">{parseError}</p>}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="cursor-pointer gap-1.5 w-full"
              onClick={handleAutofill}
              disabled={isParsing || !jdText.trim()}
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

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
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
        </div>

        {saveError && <p className="text-xs text-destructive -mt-1">{saveError}</p>}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => handleClose(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="cursor-pointer"
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
