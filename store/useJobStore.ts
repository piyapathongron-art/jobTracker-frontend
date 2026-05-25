import { create } from "zustand";
import type { Status, JobApplication } from "@/lib/types";
import { api } from "@/lib/axios";

export type NewJob = Omit<JobApplication, "id" | "userId" | "createdAt" | "updatedAt">;

interface JobState {
  jobs: JobApplication[];
  isLoading: boolean;
  error: string | null;
  fetchJobs: () => Promise<void>;
  addJob: (job: NewJob) => Promise<void>;
  updateJobStatus: (id: string, newStatus: Status) => Promise<void>;
  updateJobDetails: (id: string, updates: Partial<JobApplication>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useJobStore = create<JobState>((set, get) => ({
  jobs: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchJobs: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<JobApplication[]>("/api/applications");
      set({ jobs: data, isLoading: false });
    } catch {
      set({ isLoading: false, error: "Failed to load applications. Please refresh." });
    }
  },

  // Throws on failure so the dialog can show a local error.
  addJob: async (job) => {
    const { data } = await api.post<JobApplication>("/api/applications", job);
    set((state) => ({ jobs: [data, ...state.jobs] }));
  },

  // Optimistic: update UI immediately, revert + set error on API failure.
  updateJobStatus: async (id, newStatus) => {
    const prev = get().jobs.find((j) => j.id === id)?.status;
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === id ? { ...j, status: newStatus, updatedAt: new Date().toISOString() } : j
      ),
    }));
    try {
      await api.patch(`/api/applications/${id}`, { status: newStatus });
    } catch {
      if (prev !== undefined) {
        set((state) => ({
          jobs: state.jobs.map((j) => (j.id === id ? { ...j, status: prev } : j)),
          error: "Failed to move card — change reverted.",
        }));
      }
    }
  },

  updateJobDetails: async (id, updates) => {
    const prevJob = get().jobs.find((j) => j.id === id);
    if (!prevJob) return;

    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === id ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j
      ),
    }));

    try {
      await api.patch(`/api/applications/${id}`, updates);
    } catch {
      set((state) => ({
        jobs: state.jobs.map((j) => (j.id === id ? prevJob : j)),
        error: "Failed to update job details — changes reverted.",
      }));
    }
  },

  // Optimistic: remove immediately, restore + set error on API failure.
  deleteJob: async (id) => {
    const prevJobs = get().jobs;
    set((state) => ({ jobs: state.jobs.filter((j) => j.id !== id) }));
    try {
      await api.delete(`/api/applications/${id}`);
    } catch {
      set({ jobs: prevJobs, error: "Failed to delete application." });
    }
  },
}));
