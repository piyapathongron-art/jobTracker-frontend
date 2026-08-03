// Must return values that exactly match SOURCE_OPTIONS in
// client/components/add-application-dialog.tsx
export function detectSourceFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname
      .toLowerCase()
      .replace(/^www\./, "")
      .replace(/\.(com|org|net|io|co|app)(\.[a-z]{2,3})?$/, "");

    if (hostname.includes("linkedin")) return "LinkedIn";
    if (hostname.includes("jobsdb")) return "JobsDB";
    if (hostname.includes("indeed")) return "Indeed";
    if (hostname.includes("glassdoor")) return "Glassdoor";
    if (hostname.includes("workday") || hostname.includes("myworkdayjobs")) return "Workday";
    if (hostname.includes("greenhouse")) return "Greenhouse";
    if (hostname.includes("lever")) return "Lever";
    if (hostname.includes("ashbyhq") || hostname.includes("ashby")) return "Ashby";
    if (hostname.includes("wellfound") || hostname.includes("angel")) return "Wellfound";
    if (hostname.includes("seek")) return "Seek";
    return "Company Site";
  } catch {
    return "Other";
  }
}
