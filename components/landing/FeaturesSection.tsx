import { FileSearch, Crosshair, MessageSquareText, Scale, type LucideIcon } from "lucide-react";
import type { Dictionary } from "@/locales/en";

interface FeaturesSectionProps {
  t: Dictionary;
}

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

function getFeatures(t: Dictionary): Feature[] {
  return [
    { icon: FileSearch, title: t.landing.feat1Title, description: t.landing.feat1Desc },
    { icon: Crosshair, title: t.landing.feat2Title, description: t.landing.feat2Desc },
    { icon: MessageSquareText, title: t.landing.feat3Title, description: t.landing.feat3Desc },
    { icon: Scale, title: t.landing.feat4Title, description: t.landing.feat4Desc },
  ];
}

export function FeaturesSection({ t }: FeaturesSectionProps) {
  const features = getFeatures(t);

  return (
    <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0C4A6E] tracking-tight">
          {t.landing.featuresTitle}
        </h2>
        <p className="text-lg text-[#0C4A6E]/70 font-semibold max-w-xl mx-auto">
          {t.landing.featuresSub}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="bg-white p-8 rounded-[2rem] border border-[#0EA5E9]/10 shadow-sm hover:shadow-xl hover:border-[#0EA5E9]/30 transition-all duration-300 group flex flex-col sm:flex-row gap-6 items-start"
            >
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-[#F0F9FF] border border-[#0EA5E9]/20 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-inner">
                <Icon className="h-7 w-7 text-[#0EA5E9]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-[#0C4A6E] tracking-tight">{feature.title}</h3>
                <p className="text-[#0C4A6E]/70 font-semibold leading-relaxed text-sm">{feature.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
