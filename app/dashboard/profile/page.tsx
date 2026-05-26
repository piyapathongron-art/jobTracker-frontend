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
import { Progress } from "@/components/ui/progress";
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
  Zap,
  MapPin,
  Sparkles,
} from "lucide-react";

const MAX_TOKENS = 100_000;

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

  // Home Location state
  const [homeLocation, setHomeLocation] = useState("");
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Resume state
  const [resume, setResume] = useState("");
  const [tokenUsage, setTokenUsage] = useState(0);
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
        setHomeLocation(res.data.homeLocation || "");
        setResume(res.data.baseResume || "");
        setTokenUsage(res.data.tokenUsage ?? 0);
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

  async function handleSaveLocation() {
    setIsSavingLocation(true);
    setLocationMessage(null);
    try {
      await api.put("/api/users/profile", { homeLocation: homeLocation.trim() });
      setLocationMessage({ type: "success", text: "Home location updated!" });
    } catch (err: any) {
      setLocationMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to save location.",
      });
    } finally {
      setIsSavingLocation(false);
    }
  }

  async function handleSaveResume() {
    setIsSavingResume(true);
    setResumeMessage(null);
    try {
      await api.put("/api/users/profile", { baseResume: resume });
      if (storeUser && token) {
        setAuth(token, { ...storeUser, hasResume: !!resume.trim() });
      }
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
      if (storeUser && token) {
        setAuth(token, { ...storeUser, hasResume: !!res.data.baseResume });
      }
      try {
        const profile = await api.get("/api/users/profile");
        setTokenUsage(profile.data.tokenUsage ?? 0);
      } catch {}
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
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
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          {/* ── Display Name card ── */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Display Name</CardTitle>
              </div>
              <CardDescription>
                Your name used in AI-generated emails.
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

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="name"
                    placeholder="Your display name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSavingName}
                  />
                  <Button
                    onClick={handleSaveName}
                    disabled={isSavingName || !name.trim() || name.trim() === storeUser?.name}
                    className="gap-1.5 shrink-0"
                  >
                    {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Home Location card ── */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle>Home Location</CardTitle>
              </div>
              <CardDescription>
                Used by AI to estimate commute times for job comparisons.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {locationMessage && (
                <div
                  className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                    locationMessage.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {locationMessage.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  {locationMessage.text}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="location">Your Address / Area</Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    placeholder="e.g. Chatuchak, Bangkok"
                    value={homeLocation}
                    onChange={(e) => setHomeLocation(e.target.value)}
                    disabled={isSavingLocation}
                  />
                  <Button
                    onClick={handleSaveLocation}
                    disabled={isSavingLocation}
                    className="gap-1.5 shrink-0"
                  >
                    {isSavingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Token Usage card ── */}
        {(() => {
          const pct = Math.min(100, (tokenUsage / MAX_TOKENS) * 100);
          const isWarn = tokenUsage >= 80_000 && tokenUsage < MAX_TOKENS;
          const isCritical = tokenUsage >= MAX_TOKENS;
          const accent = isCritical
            ? "text-red-600"
            : isWarn
            ? "text-amber-600"
            : "text-primary";
          const indicator = isCritical
            ? "[&>div]:bg-red-500"
            : isWarn
            ? "[&>div]:bg-amber-500"
            : "[&>div]:bg-primary";
          return (
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className={`h-5 w-5 ${accent}`} />
                  <CardTitle>AI Token Usage</CardTitle>
                </div>
                <CardDescription>
                  Monthly cap of {MAX_TOKENS.toLocaleString()} tokens.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <p className={`text-2xl font-bold tabular-nums ${accent}`}>
                    {tokenUsage.toLocaleString()}
                    <span className="text-sm font-medium text-muted-foreground ml-1.5">
                      / {MAX_TOKENS.toLocaleString()}
                    </span>
                  </p>
                  <p className={`text-sm font-semibold tabular-nums ${accent}`}>
                    {pct.toFixed(1)}%
                  </p>
                </div>
                <Progress value={pct} className={indicator} />
                {isCritical && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    Quota reached. AI features paused.
                  </div>
                )}
                {isWarn && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    Over 80% used.
                  </div>
                )}

                <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Powered by Gemini 3.1 Flash Lite</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    Your AI assistant consumes tokens when extracting job details, analyzing commute times, tailoring resumes, simulating interviews, and drafting emails.
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </div>

      {/* ── Master Resume card ── */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-start sm:items-center justify-between space-y-0 pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Master Resume (Markdown)</CardTitle>
            </div>
            <CardDescription>
              Your AI-optimized master resume. Gemini uses this to tailor applications.
            </CardDescription>
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
              size="sm"
              className="gap-1.5 shrink-0"
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
                  Upload PDF
                </>
              )}
            </Button>
          </div>
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
