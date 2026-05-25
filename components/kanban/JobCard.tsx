"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { JobApplication } from "@/lib/types";
import { MapPin, DollarSign, Calendar } from "lucide-react";

function fmt(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;
}

function salary(min?: number | null, max?: number | null) {
  if (!min && !max) return null;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `up to ${fmt(max!)}`;
}

interface Props {
  job: JobApplication;
  index: number;
}

export function JobCard({ job, index }: Props) {
  const sal = salary(job.salaryMin, job.salaryMax);
  const applied = job.appliedAt
    ? new Date(job.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <Draggable draggableId={job.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <Card
            className={`cursor-grab active:cursor-grabbing transition-shadow duration-150 ${
              snapshot.isDragging ? "shadow-lg rotate-1" : "hover:shadow-md"
            }`}
          >
            <CardHeader className="pb-2 pt-4 px-4">
              <p className="font-semibold text-sm leading-tight truncate">{job.role}</p>
              <p className="text-muted-foreground text-xs mt-0.5 truncate">{job.company}</p>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1.5">
              {job.location && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
              )}
              {sal && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <DollarSign className="h-3 w-3 shrink-0" />
                  <span>{sal}</span>
                </div>
              )}
              {applied && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>{applied}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}
