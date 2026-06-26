from typing import List, Dict
from datetime import datetime

from storage.models import Product, PricePoint, TrendData
from storage import database


def get_product_trend(product_key: str, days: int = 30) -> TrendData:
    product = database.get_product_by_key(product_key)
    if not product:
        return TrendData(product_key=product_key, title="", platform="")

    points = database.get_price_history(product_key, days)
    if not points:
        return TrendData(
            product_key=product_key,
            title=product.title,
            platform=product.platform,
            current_price=product.price,
            min_price=product.price,
            max_price=product.price,
        )

    prices = [p.price for p in points]
    min_price = min(prices)
    max_price = max(prices)
    current_price = prices[-1]
    first_price = prices[0]
    change_percent = round((current_price - first_price) / first_price * 100, 2) if first_price else 0.0

    return TrendData(
        product_key=product_key,
        title=product.title,
        platform=product.platform,
        points=points,
        min_price=min_price,
        max_price=max_price,
        current_price=current_price,
        change_percent=change_percent,
    )


def get_keyword_trends(keyword: str, days: int = 30, limit: int = 5) -> List[TrendData]:
    products = database.get_products_by_keyword(keyword, order_by="price", sort="asc", limit=limit)
    if not products:
        return []

    trends = []
    for product in products:
        trend = get_product_trend(product.product_key, days)
        if trend.points:
            trends.append(trend)

    return trends


def trend_to_echarts(trend: TrendData) -> Dict:
    dates = [p.collected_at.split(" ")[0] for p in trend.points]
    prices = [p.price for p in trend.points]

    return {
        "product_key": trend.product_key,
        "title": trend.title,
        "platform": trend.platform,
        "dates": dates,
        "prices": prices,
        "min_price": trend.min_price,
        "max_price": trend.max_price,
        "current_price": trend.current_price,
        "change_percent": trend.change_percent,
    }


def batch_trends_to_echarts(trends: List[TrendData]) -> List[Dict]:
    return [trend_to_echarts(t) for t in trends]
