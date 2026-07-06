import re
from typing import List, Set

from storage.models import Product


def clean_products(products: List[Product]) -> List[Product]:
    cleaned = []
    seen_keys: Set[str] = set()

    for p in products:
        p.title = clean_title(p.title)
        p.price = clean_price(p.price)
        p.sales = clean_sales(p.sales)
        p.shop_rating = clean_rating(p.shop_rating)
        p.shop_name = p.shop_name.strip() if p.shop_name else ""
        p.url = p.url.strip() if p.url else ""
        p.image_url = p.image_url.strip() if p.image_url else ""

        if p.price <= 0:
            continue
        if not p.title:
            continue
        if p.product_key in seen_keys:
            continue

        seen_keys.add(p.product_key)
        cleaned.append(p)

    return cleaned


def clean_title(title: str) -> str:
    if not title:
        return ""
    title = re.sub(r'\s+', ' ', title).strip()
    title = re.sub(r'[【\[].*?[】\]]', '', title).strip()
    return title


def clean_price(price) -> float:
    if isinstance(price, (int, float)):
        return round(float(price), 2)
    if isinstance(price, str):
        price = price.replace('¥', '').replace('￥', '').replace(',', '')
        price = price.replace('元', '').replace('块', '').strip()
        try:
            return round(float(price), 2)
        except ValueError:
            return 0.0
    return 0.0


def clean_sales(sales) -> int:
    if isinstance(sales, int):
        return max(0, sales)
    if isinstance(sales, str):
        sales = sales.strip()
        if '万' in sales:
            num = sales.replace('万', '').strip()
            try:
                return int(float(num) * 10000)
            except ValueError:
                return 0
        sales = sales.replace(',', '').replace('+', '').replace('已售', '').replace('月销', '').strip()
        try:
            return int(float(sales))
        except ValueError:
            return 0
    return 0


def clean_rating(rating) -> float:
    if isinstance(rating, (int, float)):
        r = float(rating)
        return max(0.0, min(5.0, r))
    if isinstance(rating, str):
        rating = rating.replace('分', '').replace('星', '').strip()
        try:
            r = float(rating)
            return max(0.0, min(5.0, r))
        except ValueError:
            return 0.0
    return 0.0


def deduplicate_by_title(products: List[Product], threshold: float = 0.85) -> List[Product]:
    if len(products) <= 1:
        return products

    unique = []
    for p in products:
        is_dup = False
        for u in unique:
            if _title_similarity(p.title, u.title) > threshold and abs(p.price - u.price) / max(u.price, 1) < 0.1:
                is_dup = True
                break
        if not is_dup:
            unique.append(p)
    return unique


def _title_similarity(title1: str, title2: str) -> float:
    if not title1 or not title2:
        return 0.0
    set1 = set(title1)
    set2 = set(title2)
    if not set1 or not set2:
        return 0.0
    intersection = set1 & set2
    union = set1 | set2
    return len(intersection) / len(union)
