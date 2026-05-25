"use client";

import { Droppable } from "@hello-pangea/dnd";
import type { JobApplication } from "@/lib/types";
import { JobCard } from "./JobCard";

interface Props {
  droppableId: string;
  label: string;
  color: string;
  dot: string;
  jobs: JobApplication[];
  onJobClick?: (job: JobApplication) => void;
}

export function Column({ droppableId, label, color, dot, jobs, onJobClick }: Props) {
  return (
    <div className="shrink-0 w-64">
      <div className={`rounded-xl border border-t-4 ${color} bg-card h-full flex flex-col`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${dot}`} />
            <span className="text-sm font-semibold text-foreground">{label}</span>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
            {jobs.length}
          </span>
        </div>

        <Droppable droppableId={droppableId}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex-1 overflow-y-auto p-3 space-y-3 min-h-[120px] rounded-b-xl transition-colors duration-150 ${
                snapshot.isDraggingOver ? "bg-primary/5" : ""
              }`}
            >
              {jobs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No applications</p>
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
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
}
