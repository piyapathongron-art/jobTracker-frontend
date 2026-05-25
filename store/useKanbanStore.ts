import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Status } from "@/lib/types";

export interface KanbanColumn {
  status: Status;
  label: string;
  color: string;
  dot: string;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { status: "WISHLIST",     label: "Wishlist",     color: "border-t-slate-400",   dot: "bg-slate-400"   },
  { status: "APPLIED",      label: "Applied",      color: "border-t-blue-500",    dot: "bg-blue-500"    },
  { status: "INTERVIEWING", label: "Interviewing", color: "border-t-violet-500",  dot: "bg-violet-500"  },
  { status: "OFFERED",      label: "Offered",      color: "border-t-emerald-500", dot: "bg-emerald-500" },
  { status: "REJECTED",     label: "Rejected",     color: "border-t-red-500",     dot: "bg-red-500"     },
  { status: "GHOSTED",      label: "Ghosted",      color: "border-t-orange-400",  dot: "bg-orange-400"  },
];

interface KanbanState {
  kanbanColumns: KanbanColumn[];
  reorderColumns: (startIndex: number, endIndex: number) => void;
}

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set, get) => ({
      kanbanColumns: DEFAULT_COLUMNS,

      reorderColumns: (startIndex, endIndex) => {
        const cols = [...get().kanbanColumns];
        const [moved] = cols.splice(startIndex, 1);
        cols.splice(endIndex, 0, moved);
        set({ kanbanColumns: cols });
      },
    }),
    {
      name: "jt_kanban_columns",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : (undefined as unknown as Storage)
      ),
      // Only persist the column order, not any transient state
      partialize: (state) => ({ kanbanColumns: state.kanbanColumns }),
    }
  )
);
