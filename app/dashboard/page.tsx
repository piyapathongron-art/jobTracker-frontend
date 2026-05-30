"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Board } from "@/components/kanban/Board";
import { JobTable } from "@/components/dashboard/JobTable";
import { AddJobDialog } from "@/components/dashboard/AddJobDialog";
import { useJobStore } from "@/store/useJobStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useAiCacheStore } from "@/store/useAiCacheStore";
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
  Search,
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

  // Search state
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const jobs = useJobStore((s) => s.jobs);
  const isLoading = useJobStore((s) => s.isLoading);
  const error = useJobStore((s) => s.error);
  const fetchJobs = useJobStore((s) => s.fetchJobs);
  const clearError = useJobStore((s) => s.clearError);
  const cleanupUnusedCaches = useAiCacheStore((s) => s.cleanupUnusedCaches);

  // Initial load + cache cleanup
  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? window.localStorage.getItem("jt_token") : null;
    if (!stored && !token) {
      router.replace("/login");
      return;
    }
    fetchJobs().then(() => {
      // Prune AI caches for jobs that no longer exist in the fetched list
      const activeIds = useJobStore.getState().jobs.map((j) => j.id);
      cleanupUnusedCaches(activeIds);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Replace shared URL param after dialog opens
  useEffect(() => {
    if (initialShared) router.replace("/dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce search input — 350ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  // Fetch when debounced search term changes (skip initial mount — handled above)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchJobs(searchTerm || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

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

      {isLoading && !searchTerm ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          {t.dashboard.loading}
        </div>
      ) : (
        <Tabs defaultValue="kanban">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

            {/* ── Search Bar ── */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="dashboard-search"
                type="search"
                placeholder="Search by company or role…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-8"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Search result count */}
            {searchTerm && (
              <p className="text-xs text-muted-foreground">
                {isLoading ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" /> Searching…
                  </span>
                ) : (
                  <>
                    {jobs.length === 0
                      ? `No results for "${searchTerm}"`
                      : `${jobs.length} result${jobs.length !== 1 ? "s" : ""} for "${searchTerm}"`}
                  </>
                )}
              </p>
            )}
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
