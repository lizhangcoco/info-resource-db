import SectionHeading from "./SectionHeading";
import { useReveal } from "@/hooks/useReveal";
import { partners } from "@/data/partners";
import { cn } from "@/lib/utils";

export default function Partners() {
  const { ref, visible } = useReveal();
  const doubled = [...partners, ...partners];

  return (
    <section
      id="partners"
      className="relative bg-ink-800 py-24 lg:py-28 overflow-hidden grain"
    >
      <div className="absolute inset-0 bg-grid opacity-30" />

      <div className="relative mx-auto max-w-[1440px] px-6 lg:px-10 mb-12">
        <SectionHeading
          eyebrow="Strategic Partners"
          title="合作伙伴与生态"
          subtitle="携手政府、高校、金融机构与科研院所，共建农村产权交易健康生态。"
          align="center"
        />
      </div>

      <div
        ref={ref}
        className={cn(
          "reveal relative overflow-hidden",
          visible && "is-visible"
        )}
      >
        {/* 边缘渐隐 */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-ink-800 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-ink-800 to-transparent z-10 pointer-events-none" />

        <div className="flex w-max animate-ticker-scroll" style={{ animationDuration: "60s" }}>
          {doubled.map((p, idx) => (
            <div
              key={`${p.id}-${idx}`}
              className="shrink-0 mx-3 flex flex-col items-center justify-center gap-2 border border-ivory/8 bg-ink-700/30 px-8 py-6 min-w-[200px] hover:border-gold/40 transition-colors group"
            >
              <div className="flex h-10 w-10 items-center justify-center border border-gold/30 text-gold group-hover:bg-gold group-hover:text-ink-800 transition-colors">
                <span className="font-serif text-sm font-bold">
                  {p.name.slice(0, 1)}
                </span>
              </div>
              <div className="text-center">
                <div className="text-[12px] text-ivory/80 leading-tight">
                  {p.name}
                </div>
                <div className="eyebrow text-[9px] text-ivory/30 mt-1">
                  {p.enName}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto max-w-[1440px] px-6 lg:px-10 mt-12">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] text-ivory/40">
          {partners.slice(0, 6).map((p) => (
            <span key={p.id} className="flex items-center gap-2">
              <span className="h-1 w-1 bg-gold/60" />
              {p.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
