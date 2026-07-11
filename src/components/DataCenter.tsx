import { TrendingUp, ArrowUpRight } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { useCountUp } from "@/hooks/useCountUp";
import { useReveal } from "@/hooks/useReveal";
import { stats, trendData, distributionData } from "@/data/stats";
import { cn } from "@/lib/utils";

function StatCard({
  stat,
  index,
}: {
  stat: (typeof stats)[number];
  index: number;
}) {
  const { ref, formatted } = useCountUp({
    end: stat.value,
    decimals: stat.decimals ?? 0,
    duration: 2200,
  });

  return (
    <div
      className="reveal is-visible relative border border-ivory/10 bg-ink-700/30 p-8 group hover:border-gold/30 transition-colors"
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <span className="absolute top-4 right-4 num-tag text-[10px] text-ivory/30">
        0{index + 1}
      </span>
      <div className="eyebrow text-[10px] text-gold/70 mb-6">
        {stat.label}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          ref={ref}
          className="font-mono text-[clamp(2rem,4vw,3.5rem)] font-light text-ivory leading-none"
        >
          {formatted}
        </span>
        <span className="text-sm text-ivory/50">{stat.unit}</span>
      </div>
      <div className="mt-5 flex items-center gap-2 text-sage-light">
        <TrendingUp className="h-3.5 w-3.5" />
        <span className="num-tag text-[11px]">较上月 {stat.change}</span>
      </div>
      <span className="absolute bottom-0 left-0 h-px w-0 bg-gold group-hover:w-full transition-all duration-700" />
    </div>
  );
}

function TrendChart() {
  const { ref, visible } = useReveal();
  const max = Math.max(...trendData.map((d) => d.value));
  const width = 720;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const points = trendData.map((d, i) => {
    const x = padding.left + (i / (trendData.length - 1)) * innerW;
    const y = padding.top + innerH - (d.value / max) * innerH;
    return { x, y, ...d };
  });

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${
    padding.top + innerH
  } L ${points[0].x} ${padding.top + innerH} Z`;

  return (
    <div
      ref={ref}
      className={cn("reveal", visible && "is-visible")}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="eyebrow text-[10px] text-gold/70 mb-1">
            Monthly Trend
          </div>
          <h4 className="font-serif text-lg text-ivory">月度交易趋势</h4>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-ivory/50">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 bg-gold" />
            交易金额（亿元）
          </span>
        </div>
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9A961" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#C9A961" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="trendLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#D9BD7E" />
              <stop offset="100%" stopColor="#C9A961" />
            </linearGradient>
          </defs>

          {/* 网格线 */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <line
              key={t}
              x1={padding.left}
              x2={width - padding.right}
              y1={padding.top + innerH * t}
              y2={padding.top + innerH * t}
              stroke="rgba(245,240,230,0.06)"
              strokeWidth="1"
            />
          ))}

          {/* 面积 */}
          <path d={areaD} fill="url(#trendArea)" />

          {/* 折线 */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#trendLine)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* 数据点 */}
          {points.map((p) => (
            <g key={p.month}>
              <circle
                cx={p.x}
                cy={p.y}
                r="3"
                fill="#0E1116"
                stroke="#C9A961"
                strokeWidth="1.5"
              />
              <title>{`${p.month}: ${p.value}亿`}</title>
            </g>
          ))}

          {/* X 轴 */}
          {points.map((p, i) =>
            i % 2 === 0 ? (
              <text
                key={p.month}
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                className="fill-ivory/40"
                style={{ fontSize: "10px", fontFamily: "JetBrains Mono" }}
              >
                {p.month}
              </text>
            ) : null
          )}

          {/* Y 轴 */}
          {[0, 0.5, 1].map((t) => (
            <text
              key={t}
              x={padding.left - 8}
              y={padding.top + innerH * (1 - t) + 3}
              textAnchor="end"
              className="fill-ivory/40"
              style={{ fontSize: "10px", fontFamily: "JetBrains Mono" }}
            >
              {Math.round(max * t)}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

function DonutChart() {
  const { ref, visible } = useReveal();
  const total = distributionData.reduce((s, d) => s + d.value, 0);
  const radius = 70;
  const stroke = 22;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = distributionData.map((d) => {
    const fraction = d.value / total;
    const dash = fraction * circumference;
    const seg = { ...d, dash, offset, fraction };
    offset += dash;
    return seg;
  });

  return (
    <div ref={ref} className={cn("reveal", visible && "is-visible")}>
      <div className="mb-6">
        <div className="eyebrow text-[10px] text-gold/70 mb-1">
          Distribution
        </div>
        <h4 className="font-serif text-lg text-ivory">交易类型分布</h4>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-8">
        <div className="relative shrink-0">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="rgba(245,240,230,0.05)"
              strokeWidth={stroke}
            />
            {segments.map((s) => (
              <circle
                key={s.name}
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${s.dash} ${circumference - s.dash}`}
                strokeDashoffset={-s.offset}
                transform="rotate(-90 90 90)"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-2xl text-gold font-light">100%</span>
            <span className="num-tag text-[9px] text-ivory/40 mt-0.5">
              TOTAL
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-3 w-full">
          {segments.map((s) => (
            <div key={s.name} className="flex items-center gap-3">
              <span
                className="h-3 w-3 shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-[13px] text-ivory/80 flex-1">
                {s.name}
              </span>
              <span className="num-tag text-[13px] text-ivory">
                {s.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DataCenter() {
  return (
    <section
      id="data"
      className="relative bg-ink-900 py-28 lg:py-36 overflow-hidden grain"
    >
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/3 right-0 h-[500px] w-[500px] rounded-full bg-gold/5 blur-[120px]" />

      <div className="relative mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
          <SectionHeading
            eyebrow="Data Center"
            title="数据中心"
            subtitle="实时数据统计 · 权威信息发布。以数据见证成长，以透明构建信任。"
          />
          <div className="flex items-center gap-2 text-ivory/40">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-light opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sage-light" />
            </span>
            <span className="num-tag text-[11px] tracking-widest">
              UPDATED 2026.03.21
            </span>
          </div>
        </div>

        {/* 4 个统计指标 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((s, i) => (
            <StatCard key={s.id} stat={s} index={i} />
          ))}
        </div>

        {/* 双图表 */}
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 border border-ivory/10 bg-ink-700/20 p-8">
            <TrendChart />
          </div>
          <div className="lg:col-span-2 border border-ivory/10 bg-ink-700/20 p-8">
            <DonutChart />
          </div>
        </div>

        {/* 数据声明 */}
        <div className="mt-10 flex items-center justify-center gap-2 text-[11px] text-ivory/30">
          <ArrowUpRight className="h-3 w-3" />
          <span>以上数据为示例展示，最终以本所官方披露为准</span>
        </div>
      </div>
    </section>
  );
}
