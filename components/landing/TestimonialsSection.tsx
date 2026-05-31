import { Star } from "lucide-react";
import type { Dictionary } from "@/locales/en";

interface TestimonialsSectionProps {
  t: Dictionary;
}

function StarRating() {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-[#F97316] text-[#F97316] shrink-0" />
      ))}
    </div>
  );
}

export function TestimonialsSection({ t }: TestimonialsSectionProps) {
  const testimonials = [
    {
      text: t.landing.testimonial1Text,
      author: t.landing.testimonial1Author,
      role: t.landing.testimonial1Role,
    },
    {
      text: t.landing.testimonial2Text,
      author: t.landing.testimonial2Author,
      role: t.landing.testimonial2Role,
    },
    {
      text: t.landing.testimonial3Text,
      author: t.landing.testimonial3Author,
      role: t.landing.testimonial3Role,
    },
  ];

  return (
    <section className="bg-gradient-to-b from-white/40 to-transparent py-24 border-t border-[#0EA5E9]/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0C4A6E] tracking-tight">
            {t.landing.testimonialTitle}
          </h2>
          <p className="text-lg text-[#0C4A6E]/70 font-semibold max-w-xl mx-auto">
            {t.landing.testimonialSub}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item) => (
            <div
              key={item.author}
              className="bg-white p-8 rounded-[2rem] border border-[#0EA5E9]/10 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <StarRating />
                <p className="text-[#0C4A6E]/80 font-semibold text-sm leading-relaxed italic">
                  &ldquo;{item.text}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="h-10 w-10 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 flex items-center justify-center font-black text-[#0EA5E9] text-sm shrink-0">
                  {item.author.slice(0, 2)}
                </div>
                <div>
                  <h5 className="font-extrabold text-sm text-[#0C4A6E]">{item.author}</h5>
                  <p className="text-[11px] text-slate-500 font-bold">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
