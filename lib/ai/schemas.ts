import { z } from "zod";

export const parseSchema = z.object({
  text: z.string().trim().min(1, "Job description text is required"),
});

export const tailorSchema = z.object({
  jobId: z.string().trim().min(1, "jobId is required"),
  feedback: z.string().optional(),
});

export const interviewSchema = z.object({
  jobId: z.string().trim().min(1, "jobId is required"),
  feedback: z.string().optional(),
});

export const EMAIL_TYPES = [
  "Initial Application Outreach",
  "Follow-up on Application",
  "Thank You (Post-Interview)",
  "Offer Negotiation",
  "Decline Offer",
] as const;

export const emailSchema = z.object({
  jobId: z.string().trim().min(1, "jobId is required"),
  emailType: z.enum(EMAIL_TYPES, { error: "Invalid email type selected" }),
  feedback: z.string().optional(),
});

export const scoreSchema = z.object({
  jobId: z.string().trim().min(1, "jobId is required"),
  feedback: z.string().optional(),
});

export const optimizeSchema = z.object({
  jobId: z.string().trim().min(1, "jobId is required"),
  scoreData: z.any(),
  feedback: z.string().optional(),
});

export const compareSchema = z.object({
  jobIds: z.array(z.string()).min(2, "Select at least 2 jobs to compare").max(3, "Maximum 3 jobs can be compared at once"),
});

export const scrapeUrlSchema = z.object({
  url: z.string().trim().min(1, "URL is required").refine(
    (v) => /^https?:\/\/.+/i.test(v),
    { message: "Must be a valid URL starting with http(s)://" }
  ),
});
