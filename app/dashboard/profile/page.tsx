"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { LineConnectCard } from "@/components/LineConnectCard";
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
  Link as LinkIcon,
  MapPin,
  Sparkles,
  MessageCircle,
  Copy,
  Unlink,
  Download,
  Trash2,
  ShieldAlert,
} from "lucide-react";

interface QuotaState {
  tokenUsageTotal: number;
  tokenUsageWindow: number;
  tokenLimit: number;
  scrapeUsageTotal: number;
  scrapeUsageWindow: number;
  scrapeLimit: number;
  nextQuotaReset: string;
}

const LINE_BOT_HANDLE = process.env.NEXT_PUBLIC_LINE_BOT_HANDLE ?? "@745mozkj";

export default function ProfilePage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const storeUser = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

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
  const [quota, setQuota] = useState<QuotaState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingResume, setIsSavingResume] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeMessage, setResumeMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // LINE state
  const [lineLinked, setLineLinked] = useState(false);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [lineMessage, setLineMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Danger Zone state
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [dangerMessage, setDangerMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get("/api/users/profile");
        setName(res.data.name || "");
        setHomeLocation(res.data.homeLocation || "");
        setResume(res.data.baseResume || "");
        setLineLinked(!!res.data.lineUserId);
        setLinkCode(res.data.lineLinkCode ?? null);
        setQuota({
          tokenUsageTotal:   res.data.tokenUsageTotal   ?? 0,
          tokenUsageWindow:  res.data.tokenUsageWindow  ?? 0,
          tokenLimit:        res.data.tokenLimit        ?? 50_000,
          scrapeUsageTotal:  res.data.scrapeUsageTotal  ?? 0,
          scrapeUsageWindow: res.data.scrapeUsageWindow ?? 0,
          scrapeLimit:       res.data.scrapeLimit       ?? 10,
          nextQuotaReset:    res.data.nextQuotaReset    ?? new Date().toISOString(),
        });
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
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
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
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setLocationMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to save location.",
      });
    } finally {
      setIsSavingLocation(false);
    }
  }

  async function handleGenerateLinkCode() {
    setIsGeneratingCode(true);
    setLineMessage(null);
    try {
      const res = await api.post<{ code: string }>("/api/users/line-code");
      setLinkCode(res.data.code);
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setLineMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to generate link code.",
      });
    } finally {
      setIsGeneratingCode(false);
    }
  }

  async function handleCopyLinkCode() {
    if (!linkCode || typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(linkCode);
      setLineMessage({ type: "success", text: "Code copied to clipboard." });
    } catch {
      setLineMessage({ type: "error", text: "Couldn't copy automatically — select and copy manually." });
    }
  }

  async function handleUnlinkLine() {
    setIsUnlinking(true);
    setLineMessage(null);
    try {
      await api.delete("/api/users/line-link");
      setLineLinked(false);
      setLinkCode(null);
      setLineMessage({ type: "success", text: "LINE account unlinked." });
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setLineMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to unlink LINE account.",
      });
    } finally {
      setIsUnlinking(false);
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
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
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
        setQuota({
          tokenUsageTotal:   profile.data.tokenUsageTotal   ?? 0,
          tokenUsageWindow:  profile.data.tokenUsageWindow  ?? 0,
          tokenLimit:        profile.data.tokenLimit        ?? 50_000,
          scrapeUsageTotal:  profile.data.scrapeUsageTotal  ?? 0,
          scrapeUsageWindow: profile.data.scrapeUsageWindow ?? 0,
          scrapeLimit:       profile.data.scrapeLimit       ?? 10,
          nextQuotaReset:    profile.data.nextQuotaReset    ?? new Date().toISOString(),
        });
      } catch {}
      setResumeMessage({
        type: "success",
        text: "Resume extracted and updated successfully!",
      });
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
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

  async function handleExportData() {
    setIsExporting(true);
    setDangerMessage(null);
    try {
      const res = await api.get("/api/users/profile/export");
      const json = JSON.stringify(res.data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my_data.json";
      a.click();
      URL.revokeObjectURL(url);
      setDangerMessage({ type: "success", text: "Your data has been downloaded as my_data.json." });
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setDangerMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to export data. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    try {
      await api.delete("/api/users/profile/me");
      // Purge all client-side state and localStorage
      localStorage.clear();
      clearAuth();
      // Redirect to login
      router.push("/login");
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setDangerMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to delete account. Please try again.",
      });
      setIsDeleting(false);
      setShowDeleteModal(false);
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

          {/* ── LINE Notification card ── */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <CardTitle>LINE Notification</CardTitle>
              </div>
              <CardDescription>
                Link your LINE account to save jobs by sharing a URL and get interview reminders.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lineMessage && (
                <div
                  className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                    lineMessage.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {lineMessage.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  {lineMessage.text}
                </div>
              )}

              {lineLinked ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    LINE account linked. You&apos;ll receive interview reminders here.
                  </div>
                  <Button
                    onClick={handleUnlinkLine}
                    disabled={isUnlinking}
                    variant="outline"
                    className="w-full gap-1.5 min-h-[44px]"
                  >
                    {isUnlinking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Unlink className="h-4 w-4" />
                    )}
                    Unlink LINE account
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkCode ? (
                    <>
                      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                          Your 6-digit pairing code
                        </p>
                        <p className="text-3xl font-black tabular-nums tracking-[0.4em] text-primary">
                          {linkCode}
                        </p>
                      </div>
                      <div className="flex justify-center my-2">
                        <LineConnectCard botHandle={LINE_BOT_HANDLE} />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={handleCopyLinkCode}
                          variant="outline"
                          className="gap-1.5 w-full sm:w-auto min-h-[44px]"
                        >
                          <Copy className="h-4 w-4" />
                          Copy code
                        </Button>
                        <Button
                          onClick={handleGenerateLinkCode}
                          disabled={isGeneratingCode}
                          variant="ghost"
                          className="gap-1.5 w-full sm:w-auto min-h-[44px]"
                        >
                          {isGeneratingCode ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MessageCircle className="h-4 w-4" />
                          )}
                          Regenerate
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button
                      onClick={handleGenerateLinkCode}
                      disabled={isGeneratingCode}
                      className="w-full gap-1.5 min-h-[44px]"
                    >
                      {isGeneratingCode ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageCircle className="h-4 w-4" />
                      )}
                      Generate LINE Link Code
                    </Button>
                  )}
                </div>
              )}
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

        {/* ── Quota cards ── */}
        {quota && (
          <div className="space-y-6">
            {(() => {
              const tokenPct = Math.min(100, (quota.tokenUsageWindow / quota.tokenLimit) * 100);
              const tokenWarn = tokenPct >= 80 && tokenPct < 100;
              const tokenCritical = tokenPct >= 100;
              const tokenAccent = tokenCritical ? "text-red-600" : tokenWarn ? "text-amber-600" : "text-primary";
              const tokenIndicator = tokenCritical
                ? "[&>div]:bg-red-500"
                : tokenWarn
                ? "[&>div]:bg-amber-500"
                : "[&>div]:bg-primary";

              const scrapePct = Math.min(100, (quota.scrapeUsageWindow / quota.scrapeLimit) * 100);
              const scrapeWarn = scrapePct >= 80 && scrapePct < 100;
              const scrapeCritical = scrapePct >= 100;
              const scrapeAccent = scrapeCritical ? "text-red-600" : scrapeWarn ? "text-amber-600" : "text-primary";
              const scrapeIndicator = scrapeCritical
                ? "[&>div]:bg-red-500"
                : scrapeWarn
                ? "[&>div]:bg-amber-500"
                : "[&>div]:bg-primary";

              const resetDate = new Date(quota.nextQuotaReset);
              const resetLabel = resetDate.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <>
                  <Card className="border-border">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Zap className={`h-5 w-5 ${tokenAccent}`} />
                        <CardTitle>AI Token Usage</CardTitle>
                      </div>
                      <CardDescription>Tokens used this week — resets {resetLabel}.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-baseline justify-between">
                        <p className={`text-2xl font-bold tabular-nums ${tokenAccent}`}>
                          {quota.tokenUsageWindow.toLocaleString()}
                          <span className="text-sm font-medium text-muted-foreground ml-1.5">
                            / {quota.tokenLimit.toLocaleString()}
                          </span>
                        </p>
                        <p className={`text-sm font-semibold tabular-nums ${tokenAccent}`}>
                          {tokenPct.toFixed(1)}%
                        </p>
                      </div>
                      <Progress value={tokenPct} className={tokenIndicator} />
                      {tokenCritical && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          Weekly token quota reached. AI features paused until {resetLabel}.
                        </div>
                      )}
                      {tokenWarn && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          Over 80% of weekly tokens used.
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Lifetime: <span className="font-medium tabular-nums">{quota.tokenUsageTotal.toLocaleString()}</span> tokens
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-border">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <LinkIcon className={`h-5 w-5 ${scrapeAccent}`} />
                        <CardTitle>URL Scrape Usage</CardTitle>
                      </div>
                      <CardDescription>Scrapes used this week — resets {resetLabel}.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-baseline justify-between">
                        <p className={`text-2xl font-bold tabular-nums ${scrapeAccent}`}>
                          {quota.scrapeUsageWindow}
                          <span className="text-sm font-medium text-muted-foreground ml-1.5">
                            / {quota.scrapeLimit}
                          </span>
                        </p>
                        <p className={`text-sm font-semibold tabular-nums ${scrapeAccent}`}>
                          {scrapePct.toFixed(0)}%
                        </p>
                      </div>
                      <Progress value={scrapePct} className={scrapeIndicator} />
                      {scrapeCritical && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          Weekly scrape quota reached. Resets {resetLabel}.
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Lifetime: <span className="font-medium tabular-nums">{quota.scrapeUsageTotal.toLocaleString()}</span> scrapes
                      </p>
                    </CardContent>
                  </Card>

                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Powered by Gemini & Firecrawl</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                      Quotas reset weekly. Tokens fuel AI features; scrapes are used by the URL Auto-fill tool.
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        )}
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

      {/* ── Danger Zone ── */}
      <Card className="border-2 border-red-600 ">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
            <CardTitle className="text-red-700 dark:text-red-400">Danger Zone</CardTitle>
          </div>
          <CardDescription className="text-red-600/80 dark:text-red-400/80">
            Actions here are irreversible. Please proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {dangerMessage && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                dangerMessage.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-100 text-red-700 border border-red-300"
              }`}
            >
              {dangerMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              {dangerMessage.text}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Export My Data */}
            <div className="flex-1 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-background p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="font-semibold text-sm text-foreground">Export My Data</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Download all your profile information and job applications as a JSON file.
              </p>
              <Button
                id="export-data-btn"
                variant="outline"
                size="sm"
                onClick={handleExportData}
                disabled={isExporting}
                className="w-full gap-1.5 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950"
              >
                {isExporting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Exporting...</>
                ) : (
                  <><Download className="h-4 w-4" />Download my_data.json</>
                )}
              </Button>
            </div>

            {/* Delete Account */}
            <div className="flex-1 rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-background p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="font-semibold text-sm text-foreground">Delete Account</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all associated data. This cannot be undone.
              </p>
              <Button
                id="delete-account-btn"
                variant="destructive"
                size="sm"
                onClick={() => {
                  setDeleteConfirmName("");
                  setShowDeleteModal(true);
                }}
                className="w-full gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                Delete My Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Delete Account Confirmation Modal ── */}
      <Dialog open={showDeleteModal} onOpenChange={(open) => {
        if (!isDeleting) {
          setShowDeleteModal(open);
          if (!open) setDeleteConfirmName("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Trash2 className="h-5 w-5 text-destructive" />
              <DialogTitle className="text-destructive">Delete Account</DialogTitle>
            </div>
            <DialogDescription asChild>
              <div className="space-y-2 text-left pt-1 text-sm text-muted-foreground">
                <span className="block">
                  This action is <strong>permanent and irreversible</strong>. All your data will be
                  erased from our servers, including:
                </span>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Your profile and resume</li>
                  <li>All job applications and their history</li>
                  <li>AI-generated content and caches</li>
                  <li>LINE account link</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2  dark:border-red-800 dark:text-red-400">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                To confirm, type your first name{" "}
                <strong>&quot;{storeUser?.name?.split(" ")[0] ?? "your name"}&quot;</strong> below:
              </span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="delete-confirm-input">First Name Confirmation</Label>
              <Input
                id="delete-confirm-input"
                placeholder={storeUser?.name?.split(" ")[0] ?? "Enter your first name"}
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                disabled={isDeleting}
                className="border-destructive/30 focus-visible:ring-destructive/30"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              id="delete-cancel-btn"
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmName("");
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              id="delete-confirm-btn"
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={
                isDeleting ||
                deleteConfirmName !== (storeUser?.name?.split(" ")[0] ?? "")
              }
              className="gap-1.5"
            >
              {isDeleting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Deleting...</>
              ) : (
                <><Trash2 className="h-4 w-4" />Confirm Delete</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
