"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { useJobStore } from "@/store/useJobStore";
import { useKanbanStore } from "@/store/useKanbanStore";
import { Column } from "./Column";
import { JobDetailsSheet } from "../dashboard/JobDetailsSheet";
import type { Status, JobApplication } from "@/lib/types";

export function Board() {
  const [isMounted, setIsMounted] = useState(false);
  const jobs = useJobStore((s) => s.jobs);
  const updateJobStatus = useJobStore((s) => s.updateJobStatus);
  const kanbanColumns = useKanbanStore((s) => s.kanbanColumns);
  const reorderColumns = useKanbanStore((s) => s.reorderColumns);

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const selectedJob = selectedJobId ? jobs.find((j) => j.id === selectedJobId) ?? null : null;

  useEffect(() => {
    let mounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (mounted) setIsMounted(true);
    return () => { mounted = false; };
  }, []);

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;

    // Column reorder
    if (result.type === "column") {
      if (result.source.index === result.destination.index) return;
      reorderColumns(result.source.index, result.destination.index);
      return;
    }

    // Card move between columns
    if (result.source.droppableId !== result.destination.droppableId) {
      updateJobStatus(result.draggableId, result.destination.droppableId as Status);
    }
  }

  function handleJobClick(job: JobApplication) {
    setSelectedJobId(job.id);
    setSheetOpen(true);
  }

  // SSR-safe skeleton — uses static column count so it matches persisted order length
  if (!isMounted) {
    return (
      <div className="flex gap-4 overflow-x-auto px-4 sm:px-6 pb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-[272px] h-48 rounded-xl border border-t-4 border-t-muted bg-muted/20 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <JobDetailsSheet
        job={selectedJob}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable
          droppableId="board-columns"
          type="column"
          direction="horizontal"
        >
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex gap-4 overflow-x-auto px-4 sm:px-6 pb-6 min-h-[calc(100vh-320px)]"
            >
              {kanbanColumns.map((col, index) => (
                <Column
                  key={col.status}
                  index={index}
                  droppableId={col.status}
                  label={col.label}
                  color={col.color}
                  dot={col.dot}
                  jobs={jobs.filter((j) => j.status === col.status)}
                  onJobClick={handleJobClick}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
}
