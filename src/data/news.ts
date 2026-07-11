export interface NewsItem {
  id: string;
  category: "本所新闻" | "业界动态" | "通知公告";
  title: string;
  date: string;
  views: number;
  excerpt: string;
  image: string;
}

export interface FeaturedNews {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
}

export const featuredNews: FeaturedNews[] = [
  {
    id: "f1",
    title: "成都农村产权交易所2026年度工作会议圆满召开",
    date: "2026-03-20",
    excerpt: "回顾年度成果，部署新一年的战略方向与重点任务，凝聚全员共识。",
    image:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Aerial%20view%20of%20modern%20Chengdu%20rural%20property%20exchange%20conference%20hall%2C%20golden%20light%2C%20professional%20delegates%2C%20editorial%20photography%2C%20dark%20navy%20and%20gold%20tones&image_size=landscape_16_9",
  },
  {
    id: "f2",
    title: "全省农村产权交易市场建设推进会成功举办",
    date: "2026-03-15",
    excerpt: "汇聚全省力量，推动农村产权交易市场体系标准化、规范化建设。",
    image:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Modern%20rural%20land%20rights%20exchange%20signing%20ceremony%2C%20golden%20wheat%20fields%20in%20background%2C%20professional%20editorial%20photography%2C%20warm%20tone&image_size=landscape_16_9",
  },
  {
    id: "f3",
    title: "土地经营权流转交易额突破历史新高",
    date: "2026-03-10",
    excerpt: "本年度累计交易规模再创新高，服务覆盖面积与农户数稳步增长。",
    image:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Lush%20green%20agricultural%20terraced%20fields%20in%20Sichuan%20at%20dawn%2C%20mist%20over%20mountains%2C%20cinematic%20editorial%20landscape%20photography&image_size=landscape_16_9",
  },
];

export const newsList: NewsItem[] = [
  {
    id: "n1",
    category: "本所新闻",
    title: "成都农村产权交易所2026年度工作会议圆满召开",
    date: "2026-03-20",
    views: 256,
    excerpt: "回顾年度成果，部署新一年战略方向与重点任务。",
    image: "",
  },
  {
    id: "n2",
    category: "本所新闻",
    title: "我所组织开展农村产权交易业务培训会",
    date: "2026-03-18",
    views: 189,
    excerpt: "提升业务人员专业能力，规范交易服务流程。",
    image: "",
  },
  {
    id: "n3",
    category: "本所新闻",
    title: "与西南财经大学共建农村产权交易研究基地",
    date: "2026-03-12",
    views: 203,
    excerpt: "深化产学研合作，推动交易理论与实务创新。",
    image: "",
  },
  {
    id: "n4",
    category: "本所新闻",
    title: "我所获评2025年度农村产权交易工作先进单位",
    date: "2026-03-05",
    views: 312,
    excerpt: "深耕农村产权交易领域，再获行业权威认可。",
    image: "",
  },
  {
    id: "i1",
    category: "业界动态",
    title: "四川省农村产权交易市场体系建设工作推进会召开",
    date: "2026-03-15",
    views: 298,
    excerpt: "全面推进市场体系标准化、规范化建设。",
    image: "",
  },
  {
    id: "i2",
    category: "业界动态",
    title: "农业农村部发布农村产权流转交易规范化试点方案",
    date: "2026-03-19",
    views: 421,
    excerpt: "明确试点目标与实施路径，强化制度保障。",
    image: "",
  },
  {
    id: "i3",
    category: "业界动态",
    title: "全国农村产权交易市场建设现场会在成都召开",
    date: "2026-03-16",
    views: 356,
    excerpt: "成都经验获全国推广，行业同仁莅临交流。",
    image: "",
  },
  {
    id: "i4",
    category: "业界动态",
    title: "农村土地经营权流转价格形成机制研究取得新进展",
    date: "2026-03-14",
    views: 187,
    excerpt: "完善价格发现机制，提升市场化配置效率。",
    image: "",
  },
  {
    id: "a1",
    category: "通知公告",
    title: "关于开展2026年度农村产权交易服务机构年检的通知",
    date: "2026-03-21",
    views: 145,
    excerpt: "请各服务机构按要求提交年检材料。",
    image: "",
  },
  {
    id: "a2",
    category: "通知公告",
    title: "关于规范农村产权交易信息披露工作的公告",
    date: "2026-03-17",
    views: 167,
    excerpt: "进一步规范信息披露流程与内容标准。",
    image: "",
  },
  {
    id: "a3",
    category: "通知公告",
    title: "清明节期间交易服务安排",
    date: "2026-03-13",
    views: 98,
    excerpt: "节假日期间服务窗口及线上平台运行安排。",
    image: "",
  },
  {
    id: "a4",
    category: "通知公告",
    title: "关于启用新版电子交易系统的公告",
    date: "2026-03-08",
    views: 234,
    excerpt: "新版系统上线，提供更便捷的交易体验。",
    image: "",
  },
];
