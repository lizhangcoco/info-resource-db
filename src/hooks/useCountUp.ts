import { useEffect, useRef, useState } from "react";

interface CountUpOptions {
  end: number;
  duration?: number;
  decimals?: number;
  start?: number;
}

/**
 * 数字滚动动画 hook，当元素进入视口时触发
 */
export function useCountUp({
  end,
  duration = 2000,
  decimals = 0,
  start = 0,
}: CountUpOptions) {
  const [value, setValue] = useState(start);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const startTime = performance.now();

            const tick = (now: number) => {
              const elapsed = now - startTime;
              const progress = Math.min(elapsed / duration, 1);
              // easeOutExpo
              const eased =
                progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
              setValue(start + (end - start) * eased);
              if (progress < 1) {
                requestAnimationFrame(tick);
              } else {
                setValue(end);
              }
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [end, duration, start]);

  const formatted =
    decimals > 0
      ? value.toLocaleString("zh-CN", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Math.round(value).toLocaleString("zh-CN");

  return { ref, formatted };
}
