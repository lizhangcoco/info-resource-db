import { useState } from "react";
import { ArrowUpRight, Calendar, Eye } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { useReveal } from "@/hooks/useReveal";
import { featuredNews, newsList, type NewsItem } from "@/data/news";
import { cn } from "@/lib/utils";

const tabs = ["本所新闻", "业界动态", "通知公告"] as const;

function FeaturedCard({
  item,
  index,
}: {
  item: (typeof featuredNews)[number];
  index: number;
}) {
  return (
    <a
      href="#"
      className="group relative block overflow-hidden bg-ink-800"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/30 to-transparent" />
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="num-tag text-[10px] text-gold bg-ink-900/70 backdrop-blur px-2 py-1 border border-gold/30">
            0{index + 1}
          </span>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-center gap-3 text-[11px] text-ivory/60 mb-3">
          <Calendar className="h-3 w-3" />
          <span className="num-tag">{item.date}</span>
        </div>
        <h3 className="font-serif text-base lg:text-lg font-semibold text-ivory leading-snug group-hover:text-gold transition-colors line-clamp-2">
          {item.title}
        </h3>
        <p className="mt-2 text-[12px] text-ivory/55 line-clamp-2 leading-relaxed">
          {item.excerpt}
        </p>
      </div>
      <span className="absolute top-0 right-0 h-0 w-0 border-t border-gold/0 border-r border-gold/0 group-hover:border-t-gold/60 group-hover:border-r-gold/60 transition-all duration-500" style={{borderTopWidth: 0, borderRightWidth: 0}} />
    </a>
  );
}

function NewsRow({ item }: { item: NewsItem }) {
  return (
    <a
      href="#"
      className="group flex items-center gap-6 py-5 border-b border-ink-800/10 hover:bg-ivory-50/50 transition-colors -mx-4 px-4"
    >
      <div className="shrink-0 text-center w-16">
        <div className="font-mono text-2xl text-gold font-light leading-none">
          {item.date.slice(8)}
        </div>
        <div className="num-tag text-[10px] text-ink-700/40 mt-1">
          {item.date.slice(0, 7)}
        </div>
      </div>
      <div className="h-10 w-px bg-ink-800/10" />
      <div className="flex-1 min-w-0">
        <h4 className="font-serif text-[15px] text-ink-800 group-hover:text-gold transition-colors truncate">
          {item.title}
        </h4>
        <p className="text-[12px] text-ink-700/50 mt-1 line-clamp-1">
          {item.excerpt}
        </p>
      </div>
      <div className="hidden sm:flex items-center gap-4 text-[11px] text-ink-700/40 shrink-0">
        <span className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          <span className="num-tag">{item.views}</span>
        </span>
      </div>
      <ArrowUpRight className="h-4 w-4 text-ink-700/30 group-hover:text-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
    </a>
  );
}

export default function NewsCenter() {
  const [active, setActive] = useState<(typeof tabs)[number]>("本所新闻");
  const { ref, visible } = useReveal();
  const filtered = newsList.filter((n) => n.category === active);

  return (
    <section
      id="news"
      className="relative bg-ivory text-ink-800 py-28 lg:py-36 overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
          <SectionHeading
            eyebrow="News Center"
            title="新闻中心"
            dark
            subtitle="聚焦行业动态，发布权威信息，传递交易所价值。"
          />
          <a
            href="#"
            className="hidden lg:inline-flex items-center gap-2 text-[12px] text-ink-700/60 hover:text-gold transition-colors group"
          >
            <span>查看全部</span>
            <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

        {/* 特色新闻 */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {featuredNews.map((item, i) => (
            <FeaturedCard key={item.id} item={item} index={i} />
          ))}
        </div>

        {/* Tab 列表 */}
        <div ref={ref} className={cn("reveal", visible && "is-visible")}>
          <div className="flex items-center gap-2 mb-2 border-b border-ink-800/10">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActive(t)}
                className={cn(
                  "relative px-5 py-3 text-[13px] tracking-wide transition-colors",
                  active === t
                    ? "text-gold"
                    : "text-ink-700/50 hover:text-ink-800"
                )}
              >
                {t}
                <span
                  className={cn(
                    "absolute left-0 right-0 -bottom-px h-0.5 bg-gold transition-transform duration-300 origin-left",
                    active === t ? "scale-x-100" : "scale-x-0"
                  )}
                />
              </button>
            ))}
          </div>

          <div className="mt-4">
            {filtered.map((item) => (
              <NewsRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
