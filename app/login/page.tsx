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

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

interface LoginResponse {
  token: string;
  user: AuthUser;
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogleSuccess(credentialResponse: CredentialResponse) {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post<LoginResponse>("/api/auth/google", {
        token: credentialResponse.credential,
      });
      setAuth(data.token, data.user);
      router.push("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Google sign in failed.");
      } else {
        setError("Google sign in failed.");
      }
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post<LoginResponse>("/api/auth/login", parsed.data);
      setAuth(data.token, data.user);
      router.push("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Sign in failed. Please try again.");
      } else {
        setError("Sign in failed. Please try again.");
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
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
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
                  onError={() => setError("Google sign in failed.")}
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

            <form onSubmit={handleSubmit} className="space-y-3">
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
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Sign in
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground pt-1">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
