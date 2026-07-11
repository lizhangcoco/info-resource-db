import { TrendingUp, TrendingDown } from "lucide-react";
import { tickerData } from "@/data/stats";

export default function Ticker() {
  const items = [...tickerData, ...tickerData];

  return (
    <div className="relative overflow-hidden border-y border-gold/15 bg-ink-900/80 backdrop-blur-sm">
      <div className="flex items-center">
        <div className="hidden sm:flex shrink-0 items-center gap-2 border-r border-gold/15 px-5 py-3 bg-ink-800">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
          </span>
          <span className="num-tag text-[10px] tracking-widest text-gold/80">
            LIVE
          </span>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div className="flex w-max animate-ticker-scroll">
            {items.map((item, idx) => (
              <div
                key={`${item.code}-${idx}`}
                className="flex items-center gap-3 border-r border-ivory/5 px-6 py-3 whitespace-nowrap"
              >
                <span className="num-tag text-[10px] text-ivory/40">
                  {item.code}
                </span>
                <span className="text-[12px] text-ivory/80">{item.name}</span>
                <span className="num-tag text-[13px] text-ivory font-medium">
                  {item.price}
                </span>
                <span
                  className={`flex items-center gap-0.5 num-tag text-[11px] ${
                    item.up ? "text-sage-light" : "text-red-400"
                  }`}
                >
                  {item.up ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {item.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
