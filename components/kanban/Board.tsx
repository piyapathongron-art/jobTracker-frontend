"use client";

import { useEffect, useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { useJobStore } from "@/store/useJobStore";
import { Column } from "./Column";
import type { Status } from "@/lib/types";

const COLUMNS: { status: Status; label: string; color: string; dot: string }[] = [
  { status: "WISHLIST",     label: "Wishlist",     color: "border-t-slate-400",   dot: "bg-slate-400"   },
  { status: "APPLIED",      label: "Applied",      color: "border-t-blue-500",    dot: "bg-blue-500"    },
  { status: "INTERVIEWING", label: "Interviewing", color: "border-t-violet-500",  dot: "bg-violet-500"  },
  { status: "OFFERED",      label: "Offered",      color: "border-t-emerald-500", dot: "bg-emerald-500" },
  { status: "REJECTED",     label: "Rejected",     color: "border-t-red-500",     dot: "bg-red-500"     },
  { status: "GHOSTED",      label: "Ghosted",      color: "border-t-orange-400",  dot: "bg-orange-400"  },
];

export function Board() {
  const [isMounted, setIsMounted] = useState(false);
  const jobs = useJobStore((s) => s.jobs);
  const updateJobStatus = useJobStore((s) => s.updateJobStatus);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    updateJobStatus(result.draggableId, result.destination.droppableId as Status);
  }

  if (!isMounted) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div key={col.status} className="shrink-0 w-64 h-48 rounded-xl border border-t-4 border-t-muted bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-320px)]">
        {COLUMNS.map((col) => (
          <Column
            key={col.status}
            droppableId={col.status}
            label={col.label}
            color={col.color}
            dot={col.dot}
            jobs={jobs.filter((j) => j.status === col.status)}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
