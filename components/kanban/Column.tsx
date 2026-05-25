"use client";

import { Draggable, Droppable } from "@hello-pangea/dnd";
import type { JobApplication } from "@/lib/types";
import { JobCard } from "./JobCard";
import { GripVertical } from "lucide-react";

interface Props {
  droppableId: string;
  index: number;
  label: string;
  color: string;
  dot: string;
  jobs: JobApplication[];
  onJobClick?: (job: JobApplication) => void;
}

export function Column({ droppableId, index, label, color, dot, jobs, onJobClick }: Props) {
  return (
    <Draggable draggableId={droppableId} index={index}>
      {(dragProvided, dragSnapshot) => (
        <div
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
          className="shrink-0 w-[272px]"
        >
          <div
            className={`rounded-xl border border-t-4 ${color} bg-card h-full flex flex-col transition-shadow duration-150 ${
              dragSnapshot.isDragging ? "shadow-2xl rotate-1 ring-2 ring-primary/20" : ""
            }`}
          >
            {/* ── Column header — drag handle lives here only ── */}
            <div
              {...dragProvided.dragHandleProps}
              className="flex items-center justify-between px-4 py-3 border-b border-border cursor-grab active:cursor-grabbing select-none rounded-t-xl"
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${dot}`} />
                <span className="text-sm font-semibold text-foreground">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                  {jobs.length}
                </span>
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
              </div>
            </div>

            {/* ── Card drop zone ── */}
            <Droppable droppableId={droppableId} type="card">
              {(cardProvided, cardSnapshot) => (
                <div
                  ref={cardProvided.innerRef}
                  {...cardProvided.droppableProps}
                  className={`flex-1 overflow-y-auto p-3 space-y-3 min-h-[120px] rounded-b-xl transition-colors duration-150 ${
                    cardSnapshot.isDraggingOver ? "bg-primary/5" : ""
                  }`}
                >
                  {jobs.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      No applications
                    </p>
                  ) : (
                    jobs.map((job, i) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        index={i}
                        onClick={onJobClick}
                      />
                    ))
                  )}
                  {cardProvided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      )}
    </Draggable>
  );
}
