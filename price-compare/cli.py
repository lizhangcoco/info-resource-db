#!/usr/bin/env python3
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import click
from tabulate import tabulate

from storage import database, models
from core.engine import get_engine
from core.analyzer import full_analysis, sort_by_price, mark_recommendations
from core.trend import get_keyword_trends
from utils.exporters import export_products, format_price, format_sales, get_platform_name


@click.group()
@click.version_option("1.0.0", prog_name="price-scraper")
def cli():
    """电商商品价格采集对比系统"""
    database.init_db()


@cli.command()
@click.argument("keyword")
@click.option("--platforms", "-p", default="jd,taobao,pinduoduo", help="采集平台，逗号分隔")
@click.option("--limit", "-l", default=15, help="每个平台采集数量")
@click.option("--export", "-e", "export_file", default=None, help="导出文件路径")
@click.option("--format", "-f", "fmt", default="json", help="导出格式: json/csv")
@click.option("--sort", default="price", help="排序方式: price/sales/rating")
def search(keyword, platforms, limit, export_file, fmt, sort):
    """按关键词搜索并对比商品价格"""
    platform_list = [p.strip() for p in platforms.split(",") if p.strip()]

    click.echo()
    click.echo(click.style(f"🔍 正在搜索: {keyword}", fg="blue", bold=True))
    click.echo(click.style(f"   平台: {', '.join(platform_list)}", fg="cyan"))
    click.echo()

    def _progress(platform, status, count):
        name = get_platform_name(platform)
        if status == "collecting":
            click.echo(f"   ⏳ {name}: 采集中...")
        elif status == "done":
            click.echo(f"   ✅ {name}: 采集完成 ({count} 件商品)")
        elif status == "error":
            click.echo(f"   ❌ {name}: 采集失败")

    engine = get_engine()
    result = engine.search(keyword, platform_list, limit, progress_callback=_progress)

    products = [models.Product(**p) for p in result["products"]]

    if sort == "sales":
        products = sorted(products, key=lambda x: x.sales, reverse=True)
    elif sort == "rating":
        products = sorted(products, key=lambda x: x.shop_rating, reverse=True)
    else:
        products = sorted(products, key=lambda x: x.price)

    click.echo()
    click.echo(click.style("=" * 80, fg="yellow"))
    click.echo(click.style(f"📊 搜索结果 — 共 {len(products)} 件商品", fg="yellow", bold=True))
    click.echo(click.style("=" * 80, fg="yellow"))
    click.echo()

    stats = result["stats"]
    click.echo(f"   最低价: {click.style(format_price(stats['min_price']), fg='green', bold=True)}")
    click.echo(f"   最高价: {format_price(stats['max_price'])}")
    click.echo(f"   均价:   {format_price(stats['avg_price'])}")
    click.echo()

    click.echo(click.style("📋 商品列表（价格从低到高）", fg="cyan", bold=True))
    click.echo()

    table_data = []
    for i, p in enumerate(products[:20], 1):
        rec = "⭐" if p.is_recommended else "  "
        platform = get_platform_name(p.platform)
        title = p.title[:30] + "..." if len(p.title) > 30 else p.title
        price = format_price(p.price)
        sales = format_sales(p.sales)
        rating = f"{p.shop_rating:.1f}"
        table_data.append([
            f"{rec} {i}",
            platform,
            title,
            price,
            sales,
            rating,
        ])

    headers = ["#", "平台", "商品名称", "价格", "销量", "评分"]
    click.echo(tabulate(table_data, headers=headers, tablefmt="simple"))
    click.echo()

    if len(products) > 20:
        click.echo(click.style(f"   ... 还有 {len(products) - 20} 件商品，使用 --export 导出完整列表", fg="yellow"))
        click.echo()

    click.echo(click.style("🏆 性价比推荐（最低价优先）", fg="green", bold=True))
    click.echo()
    recommended = [p for p in products if p.is_recommended][:3]
    for i, p in enumerate(recommended, 1):
        click.echo(f"   {i}. {click.style(p.title[:40], fg='white')}")
        click.echo(f"      {get_platform_name(p.platform)} | {click.style(format_price(p.price), fg='red', bold=True)} | 销量{format_sales(p.sales)} | 评分{p.shop_rating:.1f}")
        click.echo()

    if export_file:
        filepath = export_products(products, export_file, fmt)
        click.echo(click.style(f"✅ 已导出到: {filepath}", fg="green"))
        click.echo()


@cli.command()
@click.argument("keyword")
@click.option("--days", default=30, help="查看最近多少天的趋势")
def history(keyword, days):
    """查看关键词的价格历史趋势"""
    click.echo()
    click.echo(click.style(f"📈 价格趋势分析: {keyword}", fg="blue", bold=True))
    click.echo(click.style(f"   时间范围: 最近 {days} 天", fg="cyan"))
    click.echo()

    trends = get_keyword_trends(keyword, days, limit=5)
    if not trends:
        products = database.get_products_by_keyword(keyword)
        if not products:
            click.echo(click.style("   ❌ 未找到该关键词的商品数据", fg="red"))
            click.echo(f"   请先运行: price-scraper search \"{keyword}\"")
            click.echo()
            return
        click.echo(click.style("   ℹ️  暂无历史数据，首次采集后开始记录", fg="yellow"))
        click.echo()
        return

    click.echo(click.style("   商品价格趋势 TOP 5:", fg="cyan", bold=True))
    click.echo()

    for i, t in enumerate(trends, 1):
        change_icon = "📉" if t.change_percent < 0 else "📈"
        change_color = "green" if t.change_percent < 0 else "red"
        change_text = f"{t.change_percent:+.2f}%"
        click.echo(f"   {i}. {t.title[:35]}")
        click.echo(f"      {get_platform_name(t.platform)} | 当前: {format_price(t.current_price)}")
        click.echo(f"      最低: {format_price(t.min_price)} | 最高: {format_price(t.max_price)} | 涨跌: {click.style(change_text, fg=change_color)} {change_icon}")
        click.echo()


@cli.command()
@click.option("--port", "-p", default=5000, help="Web服务端口")
@click.option("--host", default="0.0.0.0", help="监听地址")
def web(port, host):
    """启动 Web 演示页面"""
    click.echo()
    click.echo(click.style("🌐 启动 Web 演示页面...", fg="blue", bold=True))
    click.echo(f"   地址: http://{host}:{port}")
    click.echo()
    click.echo(click.style("   按 Ctrl+C 停止服务", fg="yellow"))
    click.echo()

    from app import create_app
    app = create_app()
    app.run(host=host, port=port, debug=False)


@cli.command()
def initdemo():
    """初始化演示数据"""
    click.echo()
    click.echo(click.style("📦 正在初始化演示数据...", fg="blue", bold=True))
    click.echo()

    from collectors.mock_collector import generate_history_price
    from collectors import get_collectors

    demo_keywords = ["iPhone 15 Pro", "AirPods Pro 2", "戴森吹风机 HD15"]
    collectors = get_collectors()

    for keyword in demo_keywords:
        click.echo(f"   🔍 处理关键词: {keyword}")
        all_products = []

        for collector in collectors:
            products = collector.search(keyword, limit=12)
            all_products.extend(products)
            click.echo(f"      ✅ {get_platform_name(collector.platform)}: {len(products)} 件")

        from core.cleaner import clean_products
        all_products = clean_products(all_products)
        database.batch_insert_products(all_products)

        for p in all_products:
            history = generate_history_price(p, days=30)
            database.batch_insert_price_history(history)

        click.echo(f"      📊 共 {len(all_products)} 件商品，已写入历史价格")
        click.echo()

    click.echo(click.style("✅ 演示数据初始化完成！", fg="green", bold=True))
    click.echo(f"   共 {len(demo_keywords)} 个关键词")
    click.echo(f"   启动 Web: python cli.py web")
    click.echo()


if __name__ == "__main__":
    cli()
