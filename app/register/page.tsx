"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BriefcaseBusiness, Loader2 } from "lucide-react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import type { AuthUser } from "@/lib/types";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Full name is required."),
  email: z.string().trim().toLowerCase().email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

interface RegisterResponse {
  token: string;
  user: AuthUser;
}

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  async function handleGoogleSuccess(credentialResponse: CredentialResponse) {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post<RegisterResponse>("/api/auth/google", {
        token: credentialResponse.credential,
      });
      setAuth(data.token, data.user);
      router.push("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Google sign up failed.");
      } else {
        setError("Google sign up failed.");
      }
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    const parsed = registerSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (!errors[path]) {
          errors[path] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post<RegisterResponse>("/api/auth/register", parsed.data);
      setAuth(data.token, data.user);
      router.push("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Registration failed. Please try again.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <BriefcaseBusiness className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg text-foreground tracking-tight">JobTracker</span>
        </div>

        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Create an account</CardTitle>
            <CardDescription>Start tracking your job search today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google sign up failed.")}
                  useOneTap
                  theme="outline"
                  shape="rectangular"
                  width="336"
                />
              </div>

              <div className="relative w-full flex items-center gap-4 py-2">
                <div className="h-px bg-border flex-1" />
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest bg-background px-2">
                  OR
                </span>
                <div className="h-px bg-border flex-1" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
                {fieldErrors.name && (
                  <p className="text-xs font-semibold text-red-600 mt-1">{fieldErrors.name}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                {fieldErrors.email && (
                  <p className="text-xs font-semibold text-red-600 mt-1">{fieldErrors.email}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                {fieldErrors.password && (
                  <p className="text-xs font-semibold text-red-600 mt-1">{fieldErrors.password}</p>
                )}
              </div>
              <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create account
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground pt-1">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
