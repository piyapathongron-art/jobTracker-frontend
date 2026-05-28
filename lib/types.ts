export type Status =
  | "WISHLIST"
  | "APPLIED"
  | "INTERVIEWING"
  | "OFFERED"
  | "REJECTED"
  | "GHOSTED";

export interface JobApplication {
  id: string;
  userId: string;
  company: string;
  role: string;
  status: Status;
  url: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryPeriod: string;
  location: string | null;
  workMode: string;
  jobDescription: string | null;
  notes: string | null;
  source: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  homeLocation?: string;
  hasResume?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  baseResume: string | null;
  homeLocation: string | null;
  tokenUsageTotal: number;
  tokenUsageWindow: number;
  tokenLimit: number;
  scrapeUsageTotal: number;
  scrapeUsageWindow: number;
  scrapeLimit: number;
  nextQuotaReset: string;
}
