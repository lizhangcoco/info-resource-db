import { ArrowDown, ArrowUpRight, Building2 } from "lucide-react";
import Ticker from "./Ticker";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-ink-900 grain"
    >
      {/* 背景氛围 */}
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="absolute inset-0 bg-radial-gold" />
      <div className="absolute -top-1/4 -right-1/4 h-[800px] w-[800px] rounded-full bg-sage/10 blur-[120px]" />
      <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-gold/5 blur-[100px]" />

      {/* 顶部装饰线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div className="relative mx-auto max-w-[1440px] w-full px-6 lg:px-10 pt-32 pb-24">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* 左侧主标题 */}
          <div className="lg:col-span-8">
            {/* 英文小标签 */}
            <div className="flex items-center gap-4 mb-8 animate-fade-in">
              <span className="h-px w-12 bg-gold" />
              <span className="eyebrow text-[11px] text-gold">
                Chengdu Rural Property Rights Exchange
              </span>
            </div>

            {/* 主标题 */}
            <h1 className="font-serif text-ivory leading-[1.05] tracking-tight">
              <span className="block text-[clamp(2.5rem,7vw,6rem)] font-bold animate-fade-up">
                成都农村产权交易所
              </span>
              <span
                className="block mt-3 text-[clamp(1.5rem,4vw,3.25rem)] font-light text-gold/90 animate-fade-up"
                style={{ animationDelay: "0.15s" }}
              >
                让农村资源 <span className="italic font-display">流动</span>{" "}
                让产权价值 <span className="italic font-display">显现</span>
              </span>
            </h1>

            {/* 金线 */}
            <div
              className="my-10 h-px w-32 bg-gradient-to-r from-gold to-transparent animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            />

            {/* 副标语 */}
            <p
              className="max-w-2xl text-[15px] lg:text-base text-ivory/65 leading-relaxed animate-fade-up"
              style={{ animationDelay: "0.4s" }}
            >
              西南地区农村产权交易核心平台。依法规范、阳光运行，为农村产权流转交易、粮油购销、国企采购、土地指标交易提供权威、透明、高效的综合性服务，助力乡村振兴与城乡融合发展。
            </p>

            {/* CTA */}
            <div
              className="mt-12 flex flex-wrap items-center gap-4 animate-fade-up"
              style={{ animationDelay: "0.55s" }}
            >
              <button
                onClick={() =>
                  document
                    .querySelector("#about")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="btn-gold-solid"
              >
                了解更多
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <button
                onClick={() =>
                  document
                    .querySelector("#business")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="btn-gold-outline"
              >
                核心业务
              </button>
            </div>
          </div>

          {/* 右侧装饰数据卡 */}
          <div className="lg:col-span-4 hidden lg:block">
            <div
              className="relative animate-fade-up"
              style={{ animationDelay: "0.7s" }}
            >
              {/* 角标 */}
              <div className="absolute -top-6 -left-6 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gold" />
                <span className="eyebrow text-[10px] text-gold/80">
                  Established 2008
                </span>
              </div>

              <div className="relative border border-gold/20 bg-ink-800/60 backdrop-blur-sm p-8">
                <div className="absolute top-0 left-0 h-3 w-3 border-t border-l border-gold" />
                <div className="absolute top-0 right-0 h-3 w-3 border-t border-r border-gold" />
                <div className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-gold" />
                <div className="absolute bottom-0 right-0 h-3 w-3 border-b border-r border-gold" />

                <div className="space-y-6">
                  <div>
                    <div className="num-tag text-[10px] text-ivory/40 tracking-widest mb-1">
                      CUMULATIVE VOLUME
                    </div>
                    <div className="font-mono text-4xl text-gold font-light">
                      ¥1,286<span className="text-xl text-ivory/60">.5亿</span>
                    </div>
                  </div>
                  <div className="gold-line" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="num-tag text-[10px] text-ivory/40 mb-1">
                        PROJECTS
                      </div>
                      <div className="font-mono text-2xl text-ivory font-light">
                        85,432
                      </div>
                    </div>
                    <div>
                      <div className="num-tag text-[10px] text-ivory/40 mb-1">
                        FARMERS
                      </div>
                      <div className="font-mono text-2xl text-ivory font-light">
                        38.6<span className="text-sm text-ivory/60">万户</span>
                      </div>
                    </div>
                  </div>
                  <div className="gold-line" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-ivory/50">
                      国家级农村产权流转交易规范化试点
                    </span>
                    <span className="num-tag text-[10px] text-sage-light">
                      AAAAA
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 行情滚动条 */}
      <div className="relative z-10 mt-auto">
        <Ticker />
      </div>

      {/* 滚动指示 */}
      <button
        onClick={() =>
          document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" })
        }
        className="absolute bottom-24 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-ivory/40 hover:text-gold transition-colors group"
      >
        <span className="eyebrow text-[9px]">Scroll</span>
        <span className="relative h-12 w-px bg-ivory/20 overflow-hidden">
          <span className="absolute top-0 left-0 right-0 h-1/2 bg-gold animate-[fade-in_1.5s_ease-in-out_infinite_alternate]" />
        </span>
        <ArrowDown className="h-3 w-3 animate-bounce" />
      </button>
    </section>
  );
}
