import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BriefcaseBusiness,
  FileSearch,
  FilePen,
  MessageSquareText,
  Mail,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  CircleDot,
} from "lucide-react";

const statusStages = [
  { label: "Wishlist", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { label: "Applied", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { label: "Interviewing", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { label: "Offered", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200" },
  { label: "Ghosted", color: "bg-orange-50 text-orange-700 border-orange-200" },
];

const aiFeatures = [
  {
    icon: FileSearch,
    title: "JD Parser",
    description:
      "Paste any job description and extract company, role, tech stack, and salary range in seconds.",
  },
  {
    icon: FilePen,
    title: "Resume Tailor",
    description:
      "Get keyword gap analysis and a personalized cover letter draft matched to each role.",
  },
  {
    icon: MessageSquareText,
    title: "Interview Sim",
    description:
      "Practice with AI-generated STAR-format technical and behavioral questions for your specific role.",
  },
  {
    icon: Mail,
    title: "Email Drafter",
    description:
      "Draft polished follow-up, thank-you, or offer-decline emails with one click.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-full">
      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BriefcaseBusiness className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="font-semibold text-foreground tracking-tight">
              JobTracker
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="cursor-pointer hover:text-foreground transition-colors duration-200">
              Features
            </a>
            <a href="#pipeline" className="cursor-pointer hover:text-foreground transition-colors duration-200">
              Pipeline
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="cursor-pointer">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="cursor-pointer">
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ─── Hero ─── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-medium text-primary mb-8">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            AI-powered by Gemini
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight max-w-3xl mx-auto">
            Your job search,{" "}
            <span className="text-primary">finally organized</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Track every application, tailor your resume with AI, and walk into
            every interview fully prepared — all from one clean dashboard.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="cursor-pointer gap-2 text-base px-8">
              <Link href="/register">
                Start tracking
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="cursor-pointer text-base px-8">
              <Link href="/login">
                <LayoutDashboard className="h-4 w-4 mr-2" aria-hidden="true" />
                View dashboard
              </Link>
            </Button>
          </div>

          {/* Pipeline preview */}
          <div
            id="pipeline"
            className="mt-16 flex flex-wrap justify-center gap-2"
            aria-label="Application pipeline stages"
          >
            {statusStages.map((stage) => (
              <span
                key={stage.label}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-medium ${stage.color}`}
              >
                <CircleDot className="h-3 w-3" aria-hidden="true" />
                {stage.label}
              </span>
            ))}
          </div>
        </section>

        {/* ─── AI Features ─── */}
        <section
          id="features"
          className="max-w-6xl mx-auto px-4 sm:px-6 py-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              AI does the heavy lifting
            </h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Four tools that turn your raw job hunt into a focused, strategic
              campaign.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="cursor-pointer group border-border hover:border-primary/40 hover:shadow-md transition-all duration-200"
                >
                  <CardHeader className="pb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors duration-200">
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="rounded-2xl bg-primary px-8 py-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground tracking-tight">
              Ready to take control?
            </h2>
            <p className="mt-3 text-primary-foreground/80 max-w-sm mx-auto">
              Stop losing track of applications in spreadsheets. Start your
              tracker in under a minute.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8 cursor-pointer gap-2 text-base px-8">
              <Link href="/register">
                Add your first job
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="font-medium text-foreground">JobTracker</span>
          </div>
          <p>Personal AI Job Tracker — built with Next.js &amp; Gemini</p>
        </div>
      </footer>
    </div>
  );
}
