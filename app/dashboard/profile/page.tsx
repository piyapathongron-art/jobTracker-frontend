"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/axios";
import { Loader2, Save, FileText, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const [resume, setResume] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get("/api/users/profile");
        setResume(res.data.baseResume || "");
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, []);

  async function handleSave() {
    setIsSaving(true);
    setMessage(null);
    try {
      await api.put("/api/users/profile", { baseResume: resume });
      setMessage({ type: "success", text: "Master resume updated successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to save profile." });
    } finally {
      setIsSaving(false);
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your career profile and master resume for AI tailoring.
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Master Resume</CardTitle>
          </div>
          <CardDescription>
            Paste your full master resume here. Gemini will use this as the foundation for tailoring applications, generating cover letters, and identifying keyword gaps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
              message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {message.type === "success" && <CheckCircle2 className="h-4 w-4" />}
              {message.text}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="resume">Full Resume Text</Label>
            <Textarea
              id="resume"
              placeholder="Paste your resume content (Experience, Skills, Education...)"
              className="min-h-[400px] font-mono text-sm leading-relaxed"
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !resume.trim()}
              className="gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
