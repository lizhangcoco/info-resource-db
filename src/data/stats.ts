export interface StatItem {
  id: string;
  value: number;
  unit: string;
  label: string;
  change: string;
  decimals?: number;
}

export const stats: StatItem[] = [
  {
    id: "s1",
    value: 1286.5,
    unit: "亿元",
    label: "累计交易金额",
    change: "+12.5%",
    decimals: 1,
  },
  {
    id: "s2",
    value: 85432,
    unit: "个",
    label: "累计交易项目",
    change: "+8.3%",
    decimals: 0,
  },
  {
    id: "s3",
    value: 642.8,
    unit: "万亩",
    label: "服务面积",
    change: "+15.2%",
    decimals: 1,
  },
  {
    id: "s4",
    value: 38.6,
    unit: "万户",
    label: "服务农户数",
    change: "+5.7%",
    decimals: 1,
  },
];

// 月度交易趋势（单位：亿元）
export const trendData: { month: string; value: number }[] = [
  { month: "4月", value: 12.5 },
  { month: "5月", value: 18.8 },
  { month: "6月", value: 25.2 },
  { month: "7月", value: 21.0 },
  { month: "8月", value: 27.3 },
  { month: "9月", value: 33.6 },
  { month: "10月", value: 42.8 },
  { month: "11月", value: 31.5 },
  { month: "12月", value: 35.7 },
  { month: "1月", value: 37.8 },
  { month: "2月", value: 41.2 },
  { month: "3月", value: 45.6 },
];

// 交易类型分布
export const distributionData: {
  name: string;
  value: number;
  color: string;
}[] = [
  { name: "土地经营权", value: 50, color: "#C9A961" },
  { name: "林权", value: 30, color: "#2D4A35" },
  { name: "集体资产", value: 15, color: "#D9BD7E" },
  { name: "涉农资产", value: 5, color: "#6B7A5A" },
];

// 行情滚动条数据
export interface TickerItem {
  name: string;
  code: string;
  price: string;
  change: string;
  up: boolean;
}

export const tickerData: TickerItem[] = [
  { name: "土地经营权流转指数", code: "LRI", price: "102.36", change: "+1.28%", up: true },
  { name: "林权流转指数", code: "FRI", price: "88.74", change: "+0.86%", up: true },
  { name: "粮油购销价格指数", code: "GPI", price: "115.92", change: "-0.34%", up: false },
  { name: "集体资产交易指数", code: "CAI", price: "97.45", change: "+2.15%", up: true },
  { name: "土地指标交易指数", code: "LQI", price: "121.08", change: "+0.92%", up: true },
  { name: "涉农资产流转指数", code: "AAI", price: "76.23", change: "-0.18%", up: false },
];
