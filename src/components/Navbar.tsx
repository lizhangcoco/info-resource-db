import { useEffect, useState } from "react";
import { Menu, X, Globe, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrolled, useScrollProgress } from "@/hooks/useScroll";

const navItems = [
  { label: "首页", href: "#hero", en: "Home" },
  { label: "交易所简介", href: "#about", en: "About" },
  { label: "核心业务", href: "#business", en: "Business" },
  { label: "数据中心", href: "#data", en: "Data" },
  { label: "新闻中心", href: "#news", en: "News" },
  { label: "政策法规", href: "#policy", en: "Policy" },
  { label: "联系我们", href: "#contact", en: "Contact" },
];

export default function Navbar() {
  const scrolled = useScrolled(60);
  const progress = useScrollProgress();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#hero");

  useEffect(() => {
    const ids = navItems.map((i) => i.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleNav = (href: string) => {
    setOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-ink-900/85 backdrop-blur-xl border-b border-gold/15"
            : "bg-transparent border-b border-transparent"
        )}
      >
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
          <div className="flex h-20 items-center justify-between">
            {/* 品牌 */}
            <a
              href="#hero"
              onClick={(e) => {
                e.preventDefault();
                handleNav("#hero");
              }}
              className="flex items-center gap-3 group"
            >
              <div className="relative flex h-11 w-11 items-center justify-center border border-gold/60">
                <span className="font-serif text-gold text-xl font-bold leading-none">
                  农
                </span>
                <span className="absolute -top-px -left-px h-2 w-2 border-t border-l border-gold" />
                <span className="absolute -top-px -right-px h-2 w-2 border-t border-r border-gold" />
                <span className="absolute -bottom-px -left-px h-2 w-2 border-b border-l border-gold" />
                <span className="absolute -bottom-px -right-px h-2 w-2 border-b border-r border-gold" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-serif text-ivory text-[15px] font-semibold tracking-wide">
                  成都农村产权交易所
                </span>
                <span className="eyebrow text-[9px] text-gold/70 mt-0.5">
                  Chengdu Rural Property Rights Exchange
                </span>
              </div>
            </a>

            {/* 桌面导航 */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav(item.href);
                  }}
                  className={cn(
                    "relative px-4 py-2 text-[13px] tracking-wide transition-colors duration-300 group",
                    active === item.href
                      ? "text-gold"
                      : "text-ivory/70 hover:text-ivory"
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "absolute left-4 right-4 -bottom-0.5 h-px bg-gold transition-transform duration-300 origin-left",
                      active === item.href ? "scale-x-100" : "scale-x-0"
                    )}
                  />
                </a>
              ))}
            </nav>

            {/* 右侧操作 */}
            <div className="hidden lg:flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-[12px] text-ivory/60 hover:text-gold transition-colors">
                <Globe className="h-3.5 w-3.5" />
                <span>EN</span>
              </button>
              <span className="h-4 w-px bg-ivory/15" />
              <button
                onClick={() => handleNav("#business")}
                className="btn-gold-solid !py-2 !px-4 !text-[12px]"
              >
                交易入口
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 移动菜单按钮 */}
            <button
              className="lg:hidden text-ivory p-2"
              onClick={() => setOpen(!open)}
              aria-label="菜单"
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* 滚动进度条 */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-ivory/5">
          <div
            className="h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* 移动端菜单 */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden transition-all duration-500",
          open ? "visible opacity-100" : "invisible opacity-0"
        )}
      >
        <div
          className="absolute inset-0 bg-ink-900/95 backdrop-blur-xl"
          onClick={() => setOpen(false)}
        />
        <nav className="relative flex flex-col items-center justify-center h-full gap-2 px-8">
          {navItems.map((item, idx) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                handleNav(item.href);
              }}
              className={cn(
                "flex items-center gap-4 py-3 transition-all duration-500",
                open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              )}
              style={{ transitionDelay: open ? `${idx * 60 + 100}ms` : "0ms" }}
            >
              <span className="num-tag text-[10px] text-gold/50">
                0{idx + 1}
              </span>
              <span className="font-serif text-2xl text-ivory">
                {item.label}
              </span>
            </a>
          ))}
        </nav>
      </div>
    </>
  );
}
