import { create } from "zustand";
import { api } from "@/lib/axios";

interface InsightsState {
  trendingCompanies: string[];
  trendingSet: Set<string>;
  isLoading: boolean;
  hasFetched: boolean;
  fetchTrending: () => Promise<void>;
  isTrending: (company: string | null | undefined) => boolean;
}

export const useInsightsStore = create<InsightsState>((set, get) => ({
  trendingCompanies: [],
  trendingSet: new Set<string>(),
  isLoading: false,
  hasFetched: false,

  fetchTrending: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const { data } = await api.get<string[]>("/api/insights/trending");
      const list = Array.isArray(data) ? data : [];
      set({
        trendingCompanies: list,
        trendingSet: new Set(list.map((c) => c.toLowerCase().trim())),
        isLoading: false,
        hasFetched: true,
      });
    } catch {
      set({ isLoading: false, hasFetched: true });
    }
  },

  isTrending: (company) => {
    if (!company) return false;
    return get().trendingSet.has(company.toLowerCase().trim());
  },
}));
