from typing import List, Dict

from storage.models import Product, StatsData


def sort_by_price(products: List[Product], ascending: bool = True) -> List[Product]:
    return sorted(products, key=lambda p: p.price, reverse=not ascending)


def sort_by_sales(products: List[Product], descending: bool = True) -> List[Product]:
    return sorted(products, key=lambda p: p.sales, reverse=descending)


def sort_by_rating(products: List[Product], descending: bool = True) -> List[Product]:
    return sorted(products, key=lambda p: p.shop_rating, reverse=descending)


def mark_recommendations(products: List[Product]) -> List[Product]:
    if not products:
        return products

    sorted_by_price = sort_by_price(products, ascending=True)
    top_n = min(3, len(sorted_by_price))

    recommended_keys = set()
    for i in range(top_n):
        recommended_keys.add(sorted_by_price[i].product_key)

    for p in products:
        p.is_recommended = p.product_key in recommended_keys

    return products


def analyze_by_platform(products: List[Product]) -> Dict[str, Dict]:
    result = {}
    for p in products:
        if p.platform not in result:
            result[p.platform] = {
                "count": 0,
                "prices": [],
                "min_price": 0.0,
                "max_price": 0.0,
                "avg_price": 0.0,
            }
        result[p.platform]["count"] += 1
        result[p.platform]["prices"].append(p.price)

    for plat in result.values():
        prices = plat["prices"]
        plat["min_price"] = min(prices)
        plat["max_price"] = max(prices)
        plat["avg_price"] = round(sum(prices) / len(prices), 2)
        del plat["prices"]

    return result


def price_distribution(products: List[Product], bins: int = 5) -> Dict:
    if not products:
        return {"bins": [], "counts": []}

    prices = [p.price for p in products]
    min_p = min(prices)
    max_p = max(prices)
    if min_p == max_p:
        return {"bins": [f"{min_p:.0f}"], "counts": [len(prices)]}

    step = (max_p - min_p) / bins
    bin_labels = []
    bin_counts = [0] * bins

    for i in range(bins):
        low = min_p + i * step
        high = min_p + (i + 1) * step
        bin_labels.append(f"{low:.0f}-{high:.0f}")

    for price in prices:
        idx = int((price - min_p) / step)
        if idx >= bins:
            idx = bins - 1
        if idx < 0:
            idx = 0
        bin_counts[idx] += 1

    return {"bins": bin_labels, "counts": bin_counts}


def get_overall_stats(products: List[Product]) -> StatsData:
    if not products:
        return StatsData()

    prices = [p.price for p in products]
    platform_stats = analyze_by_platform(products)
    recommended = sum(1 for p in products if p.is_recommended)

    return StatsData(
        total_products=len(products),
        min_price=min(prices),
        max_price=max(prices),
        avg_price=round(sum(prices) / len(prices), 2),
        platform_stats=platform_stats,
        recommended_count=recommended or min(3, len(products)),
    )


def full_analysis(products: List[Product]) -> Dict:
    products = sort_by_price(products, ascending=True)
    products = mark_recommendations(products)
    stats = get_overall_stats(products)
    distribution = price_distribution(products)
    platform_analysis = analyze_by_platform(products)

    return {
        "products": [p.to_dict() for p in products],
        "stats": stats.to_dict(),
        "price_distribution": distribution,
        "platform_analysis": platform_analysis,
    }
