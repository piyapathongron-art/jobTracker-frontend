import { en } from "./en";
import { th } from "./th";
import type { Lang } from "@/store/useLangStore";

export const dictionaries = { en, th } as const;

export function getDictionary(lang: Lang) {
  return dictionaries[lang];
}

export type { Dictionary } from "./en";
