import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CoverLetterCache {
  coverLetterEn: string;
  coverLetterTh: string;
  missingKeywords: string[];
}

export interface InterviewCache {
  questions: { questionEn: string; starHintEn: string; questionTh: string; starHintTh: string }[];
}

export interface EmailCache {
  subjectEn: string;
  bodyEn: string;
  subjectTh: string;
  bodyTh: string;
}

export interface ResumeScoreCache {
  score: number;
  strengthsEn: string[];
  weaknessesEn: string[];
  adviceEn: string[];
  strengthsTh: string[];
  weaknessesTh: string[];
  adviceTh: string[];
}

export interface JobAiCache {
  coverLetter?: CoverLetterCache;
  interview?: InterviewCache;
  emails?: Record<string, EmailCache>;
  resumeScore?: ResumeScoreCache;
}

interface AiCacheState {
  cache: Record<string, JobAiCache>;
  setCoverLetter: (jobId: string, data: CoverLetterCache) => void;
  setInterview: (jobId: string, data: InterviewCache) => void;
  setEmail: (jobId: string, emailType: string, data: EmailCache) => void;
  setResumeScore: (jobId: string, data: ResumeScoreCache) => void;
  clearJob: (jobId: string) => void;
}

export const useAiCacheStore = create<AiCacheState>()(
  persist(
    (set) => ({
      cache: {},
      setCoverLetter: (jobId, data) =>
        set((state) => ({
          cache: {
            ...state.cache,
            [jobId]: { ...state.cache[jobId], coverLetter: data },
          },
        })),
      setInterview: (jobId, data) =>
        set((state) => ({
          cache: {
            ...state.cache,
            [jobId]: { ...state.cache[jobId], interview: data },
          },
        })),
      setEmail: (jobId, emailType, data) =>
        set((state) => ({
          cache: {
            ...state.cache,
            [jobId]: {
              ...state.cache[jobId],
              emails: {
                ...(state.cache[jobId]?.emails ?? {}),
                [emailType]: data,
              },
            },
          },
        })),
      setResumeScore: (jobId, data) =>
        set((state) => ({
          cache: {
            ...state.cache,
            [jobId]: { ...state.cache[jobId], resumeScore: data },
          },
        })),
      clearJob: (jobId) =>
        set((state) => {
          const next = { ...state.cache };
          delete next[jobId];
          return { cache: next };
        }),
    }),
    {
      name: "jt_ai_cache",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as unknown as Storage)
      ),
    }
  )
);
