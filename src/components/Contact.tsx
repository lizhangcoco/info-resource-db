import { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
} from "lucide-react";
import SectionHeading from "./SectionHeading";

const contactInfo = [
  {
    icon: MapPin,
    label: "办公地址",
    value: "成都市高新区天府大道北段 1666 号",
    sub: "成都农村产权交易所",
  },
  {
    icon: Phone,
    label: "咨询电话",
    value: "028 - 8888 8888",
    sub: "工作日 09:00 - 17:00",
  },
  {
    icon: Mail,
    label: "电子邮箱",
    value: "service@cdexchange.com.cn",
    sub: "业务咨询 / 投诉建议",
  },
  {
    icon: Clock,
    label: "服务时间",
    value: "周一至周五 09:00 - 17:00",
    sub: "法定节假日除外",
  },
];

export default function Contact() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <section
      id="contact"
      className="relative bg-ink-900 py-28 lg:py-36 overflow-hidden grain"
    >
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute bottom-0 left-1/3 h-[500px] w-[500px] rounded-full bg-sage/10 blur-[120px]" />

      <div className="relative mx-auto max-w-[1440px] px-6 lg:px-10">
        <SectionHeading
          eyebrow="Contact Us"
          title="联系我们"
          subtitle="如有业务咨询或合作意向，欢迎随时与我们取得联系，专业团队为您提供优质服务。"
        />

        <div className="mt-16 grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* 左侧信息 */}
          <div className="space-y-px">
            {contactInfo.map((c, i) => (
              <div
                key={c.label}
                className="group flex items-start gap-6 border border-ivory/8 border-b-0 last:border-b bg-ink-700/20 p-7 hover:bg-ink-700/40 transition-colors"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="shrink-0 flex h-12 w-12 items-center justify-center border border-gold/40 text-gold group-hover:bg-gold group-hover:text-ink-800 transition-colors">
                  <c.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="eyebrow text-[10px] text-gold/70 mb-1.5">
                    {c.label}
                  </div>
                  <div className="font-serif text-base text-ivory leading-snug">
                    {c.value}
                  </div>
                  <div className="text-[12px] text-ivory/45 mt-1">
                    {c.sub}
                  </div>
                </div>
                <span className="num-tag text-[10px] text-ivory/20">
                  0{i + 1}
                </span>
              </div>
            ))}
          </div>

          {/* 右侧表单 */}
          <div className="relative">
            <div className="absolute -top-6 -right-6 font-display italic text-[8rem] leading-none text-gold/10 select-none">
              02
            </div>
            <form
              onSubmit={handleSubmit}
              className="relative border border-gold/20 bg-ink-800/60 backdrop-blur-sm p-8 lg:p-10"
            >
              <div className="absolute top-0 left-0 h-3 w-3 border-t border-l border-gold" />
              <div className="absolute top-0 right-0 h-3 w-3 border-t border-r border-gold" />
              <div className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-gold" />
              <div className="absolute bottom-0 right-0 h-3 w-3 border-b border-r border-gold" />

              <h3 className="font-serif text-xl text-ivory mb-2">
                在线留言
              </h3>
              <p className="text-[12px] text-ivory/45 mb-8">
                我们将在 1 个工作日内与您联系
              </p>

              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] text-ivory/50 mb-2 tracking-wide">
                      姓名 <span className="text-gold">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="请输入您的姓名"
                      className="w-full bg-ink-900/50 border border-ivory/10 px-4 py-3 text-[13px] text-ivory placeholder:text-ivory/25 focus:outline-none focus:border-gold/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-ivory/50 mb-2 tracking-wide">
                      电话 <span className="text-gold">*</span>
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="请输入联系电话"
                      className="w-full bg-ink-900/50 border border-ivory/10 px-4 py-3 text-[13px] text-ivory placeholder:text-ivory/25 focus:outline-none focus:border-gold/50 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-ivory/50 mb-2 tracking-wide">
                    邮箱
                  </label>
                  <input
                    type="email"
                    placeholder="请输入电子邮箱"
                    className="w-full bg-ink-900/50 border border-ivory/10 px-4 py-3 text-[13px] text-ivory placeholder:text-ivory/25 focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-ivory/50 mb-2 tracking-wide">
                    留言内容 <span className="text-gold">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="请简要描述您的咨询或合作意向"
                    className="w-full bg-ink-900/50 border border-ivory/10 px-4 py-3 text-[13px] text-ivory placeholder:text-ivory/25 focus:outline-none focus:border-gold/50 transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sent}
                  className="btn-gold-solid w-full justify-center disabled:opacity-70"
                >
                  {sent ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      提交成功，感谢您的留言
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      提交留言
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
