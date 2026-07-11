import { ArrowUp, QrCode } from "lucide-react";

const footerNav = [
  {
    title: "业务平台",
    links: [
      "农村产权综合交易",
      "粮油购销",
      "国企采购",
      "土地指标交易",
    ],
  },
  {
    title: "资讯中心",
    links: ["本所新闻", "业界动态", "通知公告", "政策法规"],
  },
  {
    title: "关于我们",
    links: ["交易所简介", "组织架构", "资质荣誉", "人才招聘"],
  },
  {
    title: "快速通道",
    links: ["交易指南", "常见问题", "资料下载", "网上办事"],
  },
];

export default function Footer() {
  return (
    <footer className="relative bg-ink-900 border-t border-gold/15 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-16">
        <div className="grid lg:grid-cols-12 gap-12">
          {/* 品牌 */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-6">
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
                <span className="font-serif text-ivory text-[15px] font-semibold">
                  成都农村产权交易所
                </span>
                <span className="eyebrow text-[9px] text-gold/70 mt-0.5">
                  Chengdu Rural Property Rights Exchange
                </span>
              </div>
            </div>
            <p className="text-[12px] text-ivory/45 leading-relaxed max-w-sm mb-6">
              西南地区农村产权交易核心平台。依法规范、阳光运行，为农村资源要素市场化配置提供综合性服务。
            </p>

            {/* 二维码 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 border border-ivory/10 p-3">
                <div className="flex h-16 w-16 items-center justify-center bg-ivory">
                  <QrCode className="h-12 w-12 text-ink-800" />
                </div>
                <div>
                  <div className="text-[12px] text-ivory/70">官方公众号</div>
                  <div className="num-tag text-[10px] text-ivory/40 mt-1">
                    扫码关注
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 导航 */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {footerNav.map((col) => (
              <div key={col.title}>
                <h4 className="font-serif text-[13px] text-gold mb-4">
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-[12px] text-ivory/50 hover:text-ivory hover:translate-x-0.5 inline-block transition-all"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* 联系 */}
          <div className="lg:col-span-2">
            <h4 className="font-serif text-[13px] text-gold mb-4">
              联系方式
            </h4>
            <div className="space-y-3 text-[12px] text-ivory/50">
              <div>
                <div className="text-ivory/40 text-[10px] mb-0.5">地址</div>
                成都市高新区天府大道北段 1666 号
              </div>
              <div>
                <div className="text-ivory/40 text-[10px] mb-0.5">电话</div>
                <span className="num-tag text-ivory/70">028-8888 8888</span>
              </div>
              <div>
                <div className="text-ivory/40 text-[10px] mb-0.5">邮箱</div>
                service@cdexchange.com.cn
              </div>
            </div>
          </div>
        </div>

        {/* 友情链接 */}
        <div className="mt-12 pt-8 border-t border-ivory/8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-ivory/35">
            <span className="text-ivory/50">友情链接：</span>
            {[
              "四川省农业农村厅",
              "成都市人民政府",
              "农业农村部",
              "全国农村产权交易信息服务平台",
              "四川省公共资源交易中心",
            ].map((l) => (
              <a key={l} href="#" className="hover:text-gold transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>

        {/* 底部版权 */}
        <div className="mt-8 pt-8 border-t border-ivory/8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-ivory/35">
            <span>© 2008-2026 成都农村产权交易所 版权所有</span>
            <a href="#" className="hover:text-gold transition-colors">
              蜀ICP备 2026000000 号
            </a>
            <a href="#" className="hover:text-gold transition-colors">
              蜀公网安备 51010002000000 号
            </a>
          </div>
          <button
            onClick={() =>
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
            className="group flex items-center gap-2 text-[11px] text-ivory/50 hover:text-gold transition-colors"
          >
            <span>返回顶部</span>
            <span className="flex h-7 w-7 items-center justify-center border border-ivory/20 group-hover:border-gold transition-colors">
              <ArrowUp className="h-3.5 w-3.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
