import { ShieldCheck, Award, Leaf, Network } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";

const credentials = [
  {
    icon: ShieldCheck,
    label: "国家级试点",
    sub: "农村产权流转交易规范化试点单位",
  },
  {
    icon: Award,
    label: "AAAAA 级交易所",
    sub: "全国农村产权交易市场信用评级最高等级",
  },
  {
    icon: Leaf,
    label: "乡村振兴赋能",
    sub: "服务三农、促进城乡要素双向流动",
  },
  {
    icon: Network,
    label: "全省市场龙头",
    sub: "构建省域农村产权交易市场体系核心枢纽",
  },
];

export default function About() {
  const { ref, visible } = useReveal();

  return (
    <section
      id="about"
      className="relative bg-ivory text-ink-800 py-28 lg:py-36 overflow-hidden"
    >
      {/* 装饰 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="absolute -right-32 top-20 h-96 w-96 rounded-full bg-sage/5 blur-3xl" />

      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* 左侧 */}
          <div className="lg:col-span-7">
            <SectionHeading
              eyebrow="About the Exchange"
              title="立足天府 服务三农"
              dark
            />

            <div
              ref={ref}
              className={cn(
                "reveal mt-10 space-y-6",
                visible && "is-visible"
              )}
            >
              <p className="font-serif text-[clamp(1.5rem,2.8vw,2.25rem)] leading-snug text-ink-800 text-balance">
                成都农村产权交易所是经{" "}
                <span className="text-gold">成都市人民政府批准设立</span>{" "}
                的综合性农村产权交易服务机构，依法为各类农村产权流转交易提供场所、设施、信息发布、组织交易及鉴证等服务。
              </p>

              <p className="text-[15px] leading-relaxed text-ink-700/70 max-w-2xl">
                自成立以来，本所始终秉持"公开、公平、公正、阳光"的原则，构建覆盖全市、辐射全省的农村产权交易市场服务体系，累计服务农户逾38万户、交易规模突破1286亿元，已成为西南地区最具影响力的农村资源要素市场化配置平台之一。
              </p>

              {/* 资质标签 */}
              <div className="grid sm:grid-cols-2 gap-px bg-ink-800/10 mt-10">
                {credentials.map((c) => (
                  <div
                    key={c.label}
                    className="group bg-ivory p-6 transition-colors hover:bg-ivory-50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 flex h-10 w-10 items-center justify-center border border-gold/40 text-gold group-hover:bg-gold group-hover:text-ink-800 transition-colors">
                        <c.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-serif text-base font-semibold text-ink-800">
                          {c.label}
                        </div>
                        <div className="text-[12px] text-ink-700/55 mt-1 leading-relaxed">
                          {c.sub}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧 */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="relative">
              {/* 序号 */}
              <div className="absolute -top-8 right-0 font-display italic text-[10rem] leading-none text-gold/15 select-none">
                01
              </div>

              <div className="relative border-l-2 border-gold/40 pl-8 space-y-8">
                <div>
                  <div className="eyebrow text-[10px] text-gold mb-2">
                    Our Mission
                  </div>
                  <p className="font-serif text-xl text-ink-800 leading-relaxed">
                    让农村资源要素自由流动，让产权价值在阳光下充分显现。
                  </p>
                </div>

                <div className="gold-line !bg-gradient-to-r !from-gold/40 !to-transparent" />

                <div>
                  <div className="eyebrow text-[10px] text-gold mb-2">
                    Core Values
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["公开", "公平", "公正", "阳光", "规范", "高效"].map(
                      (v) => (
                        <span
                          key={v}
                          className="px-3 py-1 text-[12px] border border-ink-800/15 text-ink-700/70 tracking-widest"
                        >
                          {v}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="gold-line !bg-gradient-to-r !from-gold/40 !to-transparent" />

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="font-mono text-3xl text-gold font-light">
                      18<span className="text-sm text-ink-700/50">年</span>
                    </div>
                    <div className="text-[11px] text-ink-700/50 mt-1">
                      深耕历程
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-3xl text-gold font-light">
                      23<span className="text-sm text-ink-700/50">区市县</span>
                    </div>
                    <div className="text-[11px] text-ink-700/50 mt-1">
                      全域覆盖
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-3xl text-gold font-light">
                      4<span className="text-sm text-ink-700/50">大</span>
                    </div>
                    <div className="text-[11px] text-ink-700/50 mt-1">
                      业务平台
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
