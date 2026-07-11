import {
  Sprout,
  Wheat,
  Building2,
  Layers,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import SectionHeading from "./SectionHeading";
import { useReveal } from "@/hooks/useReveal";
import { businessList } from "@/data/business";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  Sprout,
  Wheat,
  Building2,
  Layers,
};

export default function Business() {
  const { ref, visible } = useReveal();

  return (
    <section
      id="business"
      className="relative bg-ink-800 py-28 lg:py-36 overflow-hidden grain"
    >
      {/* 装饰 */}
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute top-0 left-1/4 h-px w-1/2 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="absolute -left-32 bottom-32 h-96 w-96 rounded-full bg-sage/10 blur-[120px]" />

      <div className="relative mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
          <SectionHeading
            eyebrow="Core Business"
            title="核心业务平台"
            subtitle="四大业务平台协同联动，覆盖农村产权流转交易全品类、全流程，提供权威、透明、高效的综合性服务。"
          />
          <div className="hidden lg:flex items-center gap-3 text-ivory/40">
            <span className="num-tag text-[11px] tracking-widest">
              04 PLATFORMS
            </span>
            <span className="h-px w-16 bg-ivory/20" />
          </div>
        </div>

        <div
          ref={ref}
          className={cn("reveal grid md:grid-cols-2 gap-6", visible && "is-visible")}
        >
          {businessList.map((b, idx) => {
            const Icon = iconMap[b.icon] ?? Sprout;
            return (
              <a
                key={b.id}
                href={b.link}
                className="glow-card group relative block bg-ink-700/40 backdrop-blur-sm border border-ivory/5 p-8 lg:p-10"
              >
                {/* 编号 */}
                <span className="absolute top-8 right-8 font-display italic text-5xl text-ivory/5 group-hover:text-gold/20 transition-colors">
                  {b.no}
                </span>

                {/* 图标 */}
                <div className="relative mb-8">
                  <div className="flex h-14 w-14 items-center justify-center border border-gold/40 text-gold group-hover:bg-gold group-hover:text-ink-800 transition-all duration-500">
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="absolute -bottom-1 left-0 h-px w-0 bg-gold group-hover:w-14 transition-all duration-500" />
                </div>

                {/* 英文 */}
                <div className="eyebrow text-[10px] text-gold/70 mb-2">
                  {b.enName}
                </div>

                {/* 名称 */}
                <h3 className="font-serif text-xl lg:text-2xl font-semibold text-ivory mb-4 leading-snug">
                  {b.name}
                </h3>

                {/* 描述 */}
                <p className="text-[13px] text-ivory/55 leading-relaxed mb-8 min-h-[3.5rem]">
                  {b.desc}
                </p>

                {/* 底部 */}
                <div className="flex items-end justify-between pt-6 border-t border-ivory/10">
                  <div>
                    <div className="font-mono text-2xl text-gold font-light">
                      {b.projectCount.toLocaleString("zh-CN")}
                    </div>
                    <div className="num-tag text-[10px] text-ivory/40 mt-1">
                      {b.unit}
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[12px] text-ivory/50 group-hover:text-gold transition-colors">
                    进入平台
                    <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </div>

                {/* 边角装饰 */}
                <span className="absolute top-0 left-0 h-2 w-2 border-t border-l border-gold/0 group-hover:border-gold/60 transition-colors" />
                <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-gold/0 group-hover:border-gold/60 transition-colors" />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
