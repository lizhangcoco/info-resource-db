import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  dark?: boolean;
}

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  dark = false,
}: SectionHeadingProps) {
  const { ref, visible } = useReveal();

  return (
    <div
      ref={ref}
      className={cn(
        "reveal",
        visible && "is-visible",
        align === "center" ? "text-center" : "text-left"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-4 mb-5",
          align === "center" && "justify-center"
        )}
      >
        <span className="h-px w-10 bg-gold" />
        <span className="eyebrow text-[11px] text-gold">{eyebrow}</span>
        <span className="h-px w-10 bg-gold/40" />
      </div>
      <h2
        className={cn(
          "section-title text-[clamp(1.75rem,4vw,3rem)] leading-tight",
          dark ? "text-ink-800" : "text-ivory"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-4 max-w-2xl text-[14px] leading-relaxed",
            align === "center" && "mx-auto",
            dark ? "text-ink-700/60" : "text-ivory/55"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
