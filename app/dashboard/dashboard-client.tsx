"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import type { JobApplication, Status } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddApplicationDialog } from "@/components/add-application-dialog";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import {
  BriefcaseBusiness,
  LayoutDashboard,
  Table2,
  Plus,
  MapPin,
  DollarSign,
  Calendar,
  Link2,
  LogOut,
  Loader2,
} from "lucide-react";

const STATUS_COLUMNS: { status: Status; label: string; color: string; dot: string }[] = [
  { status: "WISHLIST", label: "Wishlist", color: "border-t-slate-400", dot: "bg-slate-400" },
  { status: "APPLIED", label: "Applied", color: "border-t-blue-500", dot: "bg-blue-500" },
  { status: "INTERVIEWING", label: "Interviewing", color: "border-t-violet-500", dot: "bg-violet-500" },
  { status: "OFFERED", label: "Offered", color: "border-t-emerald-500", dot: "bg-emerald-500" },
  { status: "REJECTED", label: "Rejected", color: "border-t-red-500", dot: "bg-red-500" },
  { status: "GHOSTED", label: "Ghosted", color: "border-t-orange-400", dot: "bg-orange-400" },
];

const STATUS_BADGE: Record<Status, string> = {
  WISHLIST: "bg-slate-100 text-slate-700 border-slate-200",
  APPLIED: "bg-blue-50 text-blue-700 border-blue-200",
  INTERVIEWING: "bg-violet-50 text-violet-700 border-violet-200",
  OFFERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  GHOSTED: "bg-orange-50 text-orange-700 border-orange-200",
};

function formatSalary(min?: number | null, max?: number | null) {
  if (!min && !max) return null;
  const fmt = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `up to ${fmt(max!)}`;
}

function formatDate(date: string | null | undefined) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ApplicationCard({ app }: { app: JobApplication }) {
  const salary = formatSalary(app.salaryMin, app.salaryMax);
  const applied = formatDate(app.appliedAt);

  return (
    <Card className="group cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="min-w-0">
          <p className="font-semibold text-foreground text-sm leading-tight truncate">{app.role}</p>
          <p className="text-muted-foreground text-xs mt-0.5 truncate">{app.company}</p>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-1.5">
        {app.location && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{app.location}</span>
          </div>
        )}
        {salary && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <DollarSign className="h-3 w-3 shrink-0" />
            <span>{salary}</span>
          </div>
        )}
        {applied && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>{applied}</span>
          </div>
        )}
        {app.url && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link2 className="h-3 w-3 shrink-0" />
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              View posting
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KanbanView({ applications }: { applications: JobApplication[] }) {
  const byStatus = (status: Status) => applications.filter((a) => a.status === status);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-260px)]">
      {STATUS_COLUMNS.map(({ status, label, color, dot }) => {
        const cards = byStatus(status);
        return (
          <div key={status} className="shrink-0 w-64">
            <div className={`rounded-xl border border-t-4 ${color} bg-card h-full flex flex-col`}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                  {cards.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {cards.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No applications</p>
                ) : (
                  cards.map((app) => <ApplicationCard key={app.id} app={app} />)
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TableView({ applications }: { applications: JobApplication[] }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-3 font-semibold text-foreground">Company</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Location</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Salary</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Applied</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-muted-foreground">
                  No applications yet. Add your first one!
                </td>
              </tr>
            ) : (
              applications.map((app, i) => (
                <tr
                  key={app.id}
                  className={`cursor-pointer hover:bg-muted/40 transition-colors duration-150 border-b border-border last:border-0 ${
                    i % 2 === 0 ? "" : "bg-muted/20"
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-foreground">{app.company}</td>
                  <td className="px-4 py-3 text-muted-foreground">{app.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        STATUS_BADGE[app.status]
                      }`}
                    >
                      {STATUS_COLUMNS.find((c) => c.status === app.status)?.label ?? app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{app.location ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatSalary(app.salaryMin, app.salaryMax) ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(app.appliedAt) ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DashboardClient() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("jt_token");
    if (!stored && !token) {
      router.replace("/login");
      return;
    }
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchApplications() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<JobApplication[]>("/api/applications");
      setApplications(data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        clearAuth();
        router.replace("/login");
        return;
      }
      setError("Failed to load applications. Please refresh.");
    } finally {
      setLoading(false);
    }
  }

  function handleSignOut() {
    clearAuth();
    router.replace("/");
  }

  const total = applications.length;
  const active = applications.filter((a) =>
    (["APPLIED", "INTERVIEWING", "OFFERED"] as Status[]).includes(a.status)
  ).length;
  const offers = applications.filter((a) => a.status === "OFFERED").length;

  return (
    <div className="min-h-screen bg-background">
      <AddApplicationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={fetchApplications}
      />

      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BriefcaseBusiness className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground tracking-tight">JobTracker</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="cursor-pointer gap-1.5" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Application
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="cursor-pointer gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Applications", value: total, icon: LayoutDashboard },
            { label: "Active Pipelines", value: active, icon: BriefcaseBusiness },
            { label: "Offers Received", value: offers, icon: Table2 },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="border-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      {label}
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading applications…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        ) : (
          <Tabs defaultValue="kanban">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-foreground tracking-tight">My Applications</h1>
              <TabsList>
                <TabsTrigger value="kanban" className="gap-1.5 cursor-pointer">
                  <LayoutDashboard className="h-4 w-4" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="table" className="gap-1.5 cursor-pointer">
                  <Table2 className="h-4 w-4" />
                  Table
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="kanban">
              <KanbanView applications={applications} />
            </TabsContent>

            <TabsContent value="table">
              <TableView applications={applications} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}