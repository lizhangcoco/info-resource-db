export interface BusinessItem {
  id: string;
  name: string;
  enName: string;
  desc: string;
  icon: string;
  projectCount: number;
  unit: string;
  link: string;
  no: string;
}

export const businessList: BusinessItem[] = [
  {
    id: "b1",
    name: "四川省农村产权综合交易平台",
    enName: "Comprehensive Exchange",
    desc: "覆盖土地经营权、林权、集体资产、涉农资产等全品类农村产权流转交易一站式服务，阳光规范、公开竞价。",
    icon: "Sprout",
    projectCount: 1286,
    unit: "个在售项目",
    link: "#",
    no: "01",
  },
  {
    id: "b2",
    name: "粮油购销平台",
    enName: "Grain & Oil Trade",
    desc: "粮食、油料等大宗农产品线上购销服务，连接产区与销区，保障粮油流通安全与价格稳定。",
    icon: "Wheat",
    projectCount: 542,
    unit: "个在售项目",
    link: "#",
    no: "02",
  },
  {
    id: "b3",
    name: "国企采购平台",
    enName: "SOE Procurement",
    desc: "国有企业采购公开透明、阳光运行，涵盖工程、货物、服务全流程电子化招投标与采购。",
    icon: "Building2",
    projectCount: 873,
    unit: "个在售项目",
    link: "#",
    no: "03",
  },
  {
    id: "b4",
    name: "四川省土地指标交易平台",
    enName: "Land Quota Exchange",
    desc: "城乡建设用地增减挂钩、耕地占补平衡等土地指标市场化配置服务，盘活存量、优化供给。",
    icon: "Layers",
    projectCount: 318,
    unit: "个在售项目",
    link: "#",
    no: "04",
  },
];
