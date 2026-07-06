# 电商商品价格自动化采集与对比系统 — 设计文档

## 1. 项目概述

### 1.1 项目目标
构建一个电商商品价格采集与对比的询价系统，支持从主流电商平台批量抓取商品信息，自动清洗去重，提供价格对比、趋势分析和性价比推荐。

### 1.2 核心功能
- 按关键词搜索，多平台（京东/淘宝/拼多多）批量采集
- 数据自动清洗去重，价格从低到高排序
- 商品横向对比表格
- 价格趋势图表
- 性价比推荐标注（同品类最低价优先）
- 命令行工具 + Web 演示页面双入口

---

## 2. 整体架构

### 2.1 架构选型
采用 **轻量级单体架构**：Python Flask + SQLite + ECharts

**选型理由**：
- 部署简单，一条命令启动
- 资源占用低，适合单机运行
- 维护成本低，代码结构清晰
- 模块化设计，未来可平滑升级

### 2.2 分层架构

```
┌─────────────────────────────────────────────────────┐
│ 表示层 (Presentation)                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Web 页面  │  │ CLI 工具 │  │ RESTful API 接口 │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
└──────────────────────────┬──────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────┐
│ 业务逻辑层 (Business Logic)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ 采集引擎  │  │ 数据清洗  │  │ 对比分析  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                           ┌──────────┐              │
│                           │ 趋势分析  │              │
│                           └──────────┘              │
└──────────────────────────┬──────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────┐
│ 数据持久层 (Data Persistence)                        │
│  ┌────────────────────┐  ┌──────────────────────┐   │
│  │ SQLite 数据库       │  │ JSON/CSV 数据导出     │   │
│  └────────────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 3. 目录结构

```
price-compare/
├── cli.py                        # CLI 入口
├── app.py                        # Flask Web 入口
├── requirements.txt              # Python 依赖
├── README.md                     # 项目说明
│
├── core/                         # 核心业务逻辑
│   ├── __init__.py
│   ├── engine.py                 # 采集引擎 (调度器)
│   ├── cleaner.py                # 数据清洗 & 去重
│   ├── analyzer.py               # 对比分析 & 性价比计算
│   └── trend.py                  # 价格趋势分析
│
├── collectors/                   # 采集器 (适配器模式)
│   ├── __init__.py
│   ├── base.py                   # 采集器基类
│   ├── jd_collector.py           # 京东采集器
│   ├── taobao_collector.py       # 淘宝采集器
│   ├── pinduoduo_collector.py    # 拼多多采集器
│   └── mock_collector.py         # 模拟数据采集器
│
├── storage/                      # 数据持久层
│   ├── __init__.py
│   ├── database.py               # SQLite 数据库操作
│   └── models.py                 # 数据模型
│
├── web/                          # Web 前端
│   ├── static/
│   │   ├── css/style.css
│   │   └── js/app.js
│   └── templates/index.html
│
├── utils/                        # 工具函数
│   ├── __init__.py
│   ├── logger.py
│   └── exporters.py
│
└── data/                         # 数据目录
    ├── price_compare.db
    └── exports/
```

---

## 4. 数据模型

### 4.1 products 商品信息表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键自增 |
| product_key | VARCHAR(64) UNIQUE | 商品唯一标识 (平台+商品ID) |
| platform | VARCHAR(20) | 平台: jd/taobao/pinduoduo |
| title | VARCHAR(500) | 商品标题 |
| url | VARCHAR(1000) | 商品链接 |
| image_url | VARCHAR(1000) | 商品图片链接 |
| shop_name | VARCHAR(200) | 店铺名称 |
| shop_rating | FLOAT | 店铺评分 (0-5) |
| sales | INTEGER | 销量 |
| keyword | VARCHAR(100) | 搜索关键词 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 4.2 price_history 价格历史表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键自增 |
| product_key | VARCHAR(64) | 关联商品唯一标识 |
| price | DECIMAL(10,2) | 价格 |
| collected_at | DATETIME | 采集时间 |
| keyword | VARCHAR(100) | 搜索关键词 |

### 4.3 search_records 采集记录表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键自增 |
| keyword | VARCHAR(100) | 搜索关键词 |
| platforms | VARCHAR(100) | 采集的平台列表 (JSON) |
| product_count | INTEGER | 采集商品数量 |
| status | VARCHAR(20) | 状态: running/completed/failed |
| created_at | DATETIME | 采集时间 |

---

## 5. 核心模块设计

### 5.1 采集引擎 (engine.py)
- 采用适配器模式，统一管理各平台采集器
- 支持多线程并发采集多个平台
- 统一的错误处理和重试机制
- 采集进度回调通知

### 5.2 数据清洗 (cleaner.py)
- 价格格式化（去除"¥"、","、空白字符）
- 销量标准化（"万"单位转换）
- 去重（基于 product_key + 标题相似度）
- 缺失数据处理和异常值过滤
- 字段统一映射

### 5.3 对比分析 (analyzer.py)
- 价格从低到高排序
- 同品类最低价标注为性价比推荐
- 平台均价统计
- 价格区间分布计算
- 销量与评分综合排序

### 5.4 趋势分析 (trend.py)
- 按商品维度追踪历史价格
- 生成指定时间范围内的趋势数据
- 识别最高价、最低价及出现时间
- 计算价格涨跌幅

---

## 6. 采集器设计

### 6.1 基类接口 (base.py)
```python
class BaseCollector:
    name: str                    # 平台名称
    platform: str                # 平台标识
    
    def search(self, keyword: str, limit: int = 20) -> List[Product]:
        """按关键词搜索商品"""
        pass
```

### 6.2 各平台采集器
- **JDCollector**: 京东采集器（预留真实爬取接口）
- **TaobaoCollector**: 淘宝采集器（预留真实爬取接口）
- **PinduoduoCollector**: 拼多多采集器（预留真实爬取接口）
- **MockCollector**: 模拟数据采集器（演示用，生成真实感的模拟数据）

### 6.3 扩展性
新增平台只需继承 `BaseCollector` 并实现 `search` 方法，在 `collectors/__init__.py` 中注册即可。

---

## 7. Web API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | / | 首页 |
| POST | /api/search | 发起采集任务 |
| GET | /api/search/{id} | 查询采集任务状态 |
| GET | /api/products | 获取商品列表 |
| GET | /api/products/{key}/trend | 获取商品价格趋势 |
| GET | /api/stats | 获取统计数据 |
| GET | /api/history | 获取历史采集记录 |

---

## 8. CLI 命令设计

```bash
# 按关键词搜索采集
price-scraper search "iPhone 15 Pro"
price-scraper search "AirPods Pro" --platforms jd,taobao --limit 20

# 导出结果
price-scraper search "戴森吹风机" --export result.json
price-scraper search "戴森吹风机" --export result.csv --format csv

# 查看历史
price-scraper history "iPhone 15 Pro"

# 启动 Web
price-scraper web --port 5000
```

---

## 9. 初始化演示数据

系统首次启动时自动预置：
- **3个关键词**：iPhone 15 Pro、AirPods Pro 2、戴森吹风机 HD15
- **每个关键词 30+ 商品**：覆盖京东/淘宝/拼多多三大平台
- **30天历史价格**：每个商品有最近30天的价格波动记录
- 完整字段：名称、价格、销量、评分、店铺、链接等

---

## 10. 技术栈

| 层级 | 技术选型 |
|------|----------|
| 后端语言 | Python 3.8+ |
| Web框架 | Flask |
| 数据库 | SQLite |
| CLI框架 | Click |
| 数据验证 | Pydantic |
| 前端 | HTML5 + CSS3 + 原生 JS |
| 图表 | ECharts 5 |
| HTTP请求 | Requests |
| HTML解析 | BeautifulSoup4 |
