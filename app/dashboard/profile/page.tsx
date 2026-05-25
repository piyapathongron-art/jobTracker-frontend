"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Loader2,
  Save,
  FileText,
  CheckCircle2,
  Upload,
  AlertCircle,
  ArrowLeft,
  User,
} from "lucide-react";

export default function ProfilePage() {
  const token = useAuthStore((s) => s.token);
  const storeUser = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);

  // Name state
  const [name, setName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Resume state
  const [resume, setResume] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingResume, setIsSavingResume] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeMessage, setResumeMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get("/api/users/profile");
        setName(res.data.name || "");
        setResume(res.data.baseResume || "");
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, []);

  async function handleSaveName() {
    if (!name.trim()) return;
    setIsSavingName(true);
    setNameMessage(null);
    try {
      const res = await api.put("/api/users/profile", { name: name.trim() });
      // Sync the updated name into global auth state so navbar updates instantly
      if (token && res.data) {
        setAuth(token, { id: res.data.id, name: res.data.name, email: res.data.email });
      }
      setNameMessage({ type: "success", text: "Display name updated!" });
    } catch (err: any) {
      setNameMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to save name.",
      });
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleSaveResume() {
    setIsSavingResume(true);
    setResumeMessage(null);
    try {
      await api.put("/api/users/profile", { baseResume: resume });
      setResumeMessage({
        type: "success",
        text: "Master resume updated successfully!",
      });
    } catch (err: any) {
      setResumeMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to save resume.",
      });
    } finally {
      setIsSavingResume(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setResumeMessage({ type: "error", text: "Please upload a PDF file." });
      return;
    }

    setIsUploading(true);
    setResumeMessage(null);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await api.post("/api/users/profile/upload-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResume(res.data.baseResume);
      setResumeMessage({
        type: "success",
        text: "Resume extracted and updated successfully!",
      });
    } catch (err: any) {
      setResumeMessage({
        type: "error",
        text:
          err.response?.data?.error || "Failed to upload and parse PDF.",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading profile…
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Back navigation ── */}
      <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      {/* ── Page heading + upload button ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your career profile and master resume for AI tailoring.
          </p>
        </div>
        <div className="shrink-0 flex gap-2">
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
            disabled={isUploading || isSavingResume}
          />
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isSavingResume}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload PDF Resume
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Display Name card ── */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Display Name</CardTitle>
          </div>
          <CardDescription>
            This is the name shown in the navigation bar and used in AI-generated emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {nameMessage && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                nameMessage.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {nameMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              {nameMessage.text}
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Your display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSavingName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                }}
              />
            </div>
            <Button
              onClick={handleSaveName}
              disabled={isSavingName || !name.trim() || name.trim() === storeUser?.name}
              className="gap-1.5 shrink-0"
            >
              {isSavingName ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Name
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Master Resume card ── */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Master Resume (Markdown)</CardTitle>
          </div>
          <CardDescription>
            Your AI-optimized master resume. Edit directly or upload a PDF to have
            Gemini extract the content for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resumeMessage && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                resumeMessage.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {resumeMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              {resumeMessage.text}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="resume">Resume Content</Label>
            <Textarea
              id="resume"
              placeholder="Paste your resume content or upload a PDF..."
              className="min-h-[500px] font-mono text-sm leading-relaxed"
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              disabled={isSavingResume || isUploading}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveResume}
              disabled={isSavingResume || isUploading || !resume.trim()}
              className="gap-1.5"
            >
              {isSavingResume ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Resume
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
