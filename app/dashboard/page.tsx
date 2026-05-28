"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Board } from "@/components/kanban/Board";
import { JobTable } from "@/components/dashboard/JobTable";
import { AddJobDialog } from "@/components/dashboard/AddJobDialog";
import { useJobStore } from "@/store/useJobStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useLangStore } from "@/store/useLangStore";
import { getDictionary } from "@/locales";
import {
  BriefcaseBusiness,
  LayoutDashboard,
  Table2,
  Plus,
  Trophy,
  Loader2,
  X,
} from "lucide-react";
import type { Status } from "@/lib/types";

export const dynamic = "force-dynamic";

const ACTIVE: Status[] = ["APPLIED", "INTERVIEWING", "OFFERED"];

function extractUrl(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const match = trimmed.match(/https?:\/\/\S+/i);
  return match ? match[0] : undefined;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageContent />
    </Suspense>
  );
}

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useAuthStore((s) => s.token);
  const lang = useLangStore((s) => s.lang);
  const t = getDictionary(lang);

  const [initialShared] = useState(() =>
    extractUrl(searchParams.get("url")) ??
    extractUrl(searchParams.get("text")) ??
    extractUrl(searchParams.get("title"))
  );
  const [dialogOpen, setDialogOpen] = useState(!!initialShared);
  const [sharedUrl, setSharedUrl] = useState<string | undefined>(initialShared);

  const jobs = useJobStore((s) => s.jobs);
  const isLoading = useJobStore((s) => s.isLoading);
  const error = useJobStore((s) => s.error);
  const fetchJobs = useJobStore((s) => s.fetchJobs);
  const clearError = useJobStore((s) => s.clearError);

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? window.localStorage.getItem("jt_token") : null;
    if (!stored && !token) {
      router.replace("/login");
      return;
    }
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialShared) router.replace("/dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = jobs.length;
  const active = jobs.filter((j) => ACTIVE.includes(j.status)).length;
  const offers = jobs.filter((j) => j.status === "OFFERED").length;

  return (
    <>
      <AddJobDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSharedUrl(undefined);
        }}
        initialScrapeUrl={sharedUrl}
      />

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={clearError} className="ml-4 text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { 
            label: t.dashboard.statsTotal,  
            value: total,  
            icon: LayoutDashboard,
            colorClass: "text-white",
            bgClass: "bg-blue-500",
            borderClass: "border-blue-500 border-l-4 border-l-blue-500"
          },
          { 
            label: t.dashboard.statsActive, 
            value: active, 
            icon: BriefcaseBusiness,
            colorClass: "text-white",
            bgClass: "bg-amber-500",
            borderClass: "border-amber-500 border-l-4 border-l-amber-500"
          },
          { 
            label: t.dashboard.statsOffers, 
            value: offers, 
            icon: Trophy,
            colorClass: "text-white",
            bgClass: "bg-emerald-500",
            borderClass: "border-emerald-500 border-l-4 border-l-emerald-500"
          },
        ].map(({ label, value, icon: Icon, colorClass, bgClass, borderClass }) => (
          <Card key={label} className={`border ${borderClass} shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                    {label}
                  </p>
                  <p className="text-3xl font-black text-foreground">{value}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl ${bgClass} flex items-center justify-center shadow-inner`}>
                  <Icon className={`h-6 w-6 ${colorClass}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          {t.dashboard.loading}
        </div>
      ) : (
        <Tabs defaultValue="kanban">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h1 className="text-xl font-bold text-foreground tracking-tight">{t.dashboard.title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <TabsList>
                <TabsTrigger value="kanban" className="gap-1.5 cursor-pointer">
                  <LayoutDashboard className="h-4 w-4" />
                  {t.dashboard.tabKanban}
                </TabsTrigger>
                <TabsTrigger value="table" className="gap-1.5 cursor-pointer">
                  <Table2 className="h-4 w-4" />
                  {t.dashboard.tabTable}
                </TabsTrigger>
              </TabsList>
              <Button
                size="sm"
                className="cursor-pointer gap-1.5"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                {t.dashboard.addJob}
              </Button>
            </div>
          </div>

          <TabsContent value="kanban">
            <div className="-mx-4 sm:-mx-6">
              <Board />
            </div>
          </TabsContent>

          <TabsContent value="table">
            <JobTable />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}
