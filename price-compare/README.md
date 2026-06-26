# price-compare 电商商品价格采集对比系统

## 项目简介

一个支持多平台电商商品价格采集、清洗、对比和趋势分析的询价系统。

## 功能特性

- 🔍 支持京东、淘宝、拼多多多平台关键词搜索采集
- 🧹 自动数据清洗去重，价格从低到高排序
- 📊 商品横向对比，性价比推荐标注
- 📈 价格趋势图表，历史价格追踪
- 💻 命令行工具 + Web 演示页面双入口

## 快速开始

### 安装依赖

```bash
pip install -r requirements.txt
```

### CLI 使用

```bash
# 搜索并对比商品
python cli.py search "iPhone 15 Pro"

# 指定平台和数量
python cli.py search "AirPods Pro" --platforms jd,taobao --limit 20

# 导出结果
python cli.py search "戴森吹风机" --export result.json

# 查看价格历史
python cli.py history "iPhone 15 Pro"
```

### Web 页面

```bash
python app.py
```

然后访问 http://localhost:5000

## 项目结构

```
price-compare/
├── cli.py              # CLI 入口
├── app.py              # Flask Web 入口
├── core/               # 核心业务逻辑
├── collectors/         # 采集器 (适配器模式)
├── storage/            # 数据持久层
├── web/                # Web 前端
└── utils/              # 工具函数
```
