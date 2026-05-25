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
  location: string | null;
  notes: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}
