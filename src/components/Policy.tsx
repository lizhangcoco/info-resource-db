import { useState } from "react";
import { FileText, ArrowUpRight, Landmark } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { useReveal } from "@/hooks/useReveal";
import { policyList, type PolicyItem } from "@/data/policy";
import { cn } from "@/lib/utils";

const levels = ["全部", "国家级", "省级", "市级"] as const;

const levelColor: Record<string, string> = {
  国家级: "bg-gold text-ink-800",
  省级: "bg-sage text-ivory",
  市级: "border border-ink-800/30 text-ink-700/70",
};

function PolicyCard({ item, index }: { item: PolicyItem; index: number }) {
  return (
    <a
      href="#"
      className="group relative block bg-ivory-50 border border-ink-800/8 p-7 hover:border-gold/40 hover:bg-ivory transition-all duration-500"
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <span
          className={cn(
            "px-2.5 py-1 text-[10px] tracking-widest",
            levelColor[item.level]
          )}
        >
          {item.level}
        </span>
        <FileText className="h-4 w-4 text-ink-700/30 group-hover:text-gold transition-colors" />
      </div>

      <h3 className="font-serif text-base font-semibold text-ink-800 leading-snug mb-3 group-hover:text-gold transition-colors line-clamp-2 min-h-[3rem]">
        {item.title}
      </h3>

      <p className="text-[12px] text-ink-700/55 leading-relaxed line-clamp-2 mb-6">
        {item.summary}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-ink-800/8">
        <div className="flex items-center gap-1.5 text-[11px] text-ink-700/50">
          <Landmark className="h-3 w-3" />
          <span>{item.org}</span>
        </div>
        <span className="num-tag text-[10px] text-ink-700/40">
          {item.date}
        </span>
      </div>

      <span className="absolute top-0 left-0 h-0 w-0.5 bg-gold group-hover:h-full transition-all duration-500" />
    </a>
  );
}

export default function Policy() {
  const [active, setActive] = useState<(typeof levels)[number]>("全部");
  const { ref, visible } = useReveal();
  const filtered =
    active === "全部"
      ? policyList
      : policyList.filter((p) => p.level === active);

  return (
    <section
      id="policy"
      className="relative bg-ivory-50 text-ink-800 py-28 lg:py-36 overflow-hidden"
    >
      <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-gold/5 blur-3xl" />

      <div className="relative mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
          <SectionHeading
            eyebrow="Policies & Regulations"
            title="政策法规"
            dark
            subtitle="权威政策文件库，为您解读最新农村产权相关法规，保障交易合规、阳光运行。"
          />
          <div className="flex flex-wrap items-center gap-2">
            {levels.map((l) => (
              <button
                key={l}
                onClick={() => setActive(l)}
                className={cn(
                  "px-4 py-2 text-[12px] tracking-wide border transition-all duration-300",
                  active === l
                    ? "border-gold bg-gold text-ink-800"
                    : "border-ink-800/15 text-ink-700/60 hover:border-gold/50 hover:text-ink-800"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={ref}
          className={cn(
            "reveal grid md:grid-cols-2 lg:grid-cols-3 gap-6",
            visible && "is-visible"
          )}
        >
          {filtered.map((item, i) => (
            <PolicyCard key={item.id} item={item} index={i} />
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <a href="#" className="btn-gold-outline !text-ink-800 !border-ink-800/40 hover:!text-ivory hover:!border-ink-800">
            查看更多法规
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
