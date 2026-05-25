"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Board } from "@/components/kanban/Board";
import { JobTable } from "@/components/dashboard/JobTable";
import { AddJobDialog } from "@/components/dashboard/AddJobDialog";
import { useJobStore } from "@/store/useJobStore";
import { useAuthStore } from "@/store/useAuthStore";
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

const ACTIVE: Status[] = ["APPLIED", "INTERVIEWING", "OFFERED"];

export default function DashboardPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const total = jobs.length;
  const active = jobs.filter((j) => ACTIVE.includes(j.status)).length;
  const offers = jobs.filter((j) => j.status === "OFFERED").length;

  return (
    <>
      <AddJobDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={clearError} className="ml-4 text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Applications", value: total,  icon: LayoutDashboard  },
          { label: "Active Pipelines",   value: active, icon: BriefcaseBusiness },
          { label: "Offers Received",    value: offers, icon: Trophy            },
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

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading applications…
        </div>
      ) : (
        <Tabs defaultValue="kanban">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-foreground tracking-tight">My Applications</h1>
            <div className="flex items-center gap-2">
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
              <Button
                size="sm"
                className="cursor-pointer gap-1.5"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add New Job
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
