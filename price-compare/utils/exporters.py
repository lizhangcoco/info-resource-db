import json
import csv
import os
from datetime import datetime
from typing import List, Dict

from storage.models import Product


EXPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "exports")


def ensure_export_dir():
    os.makedirs(EXPORT_DIR, exist_ok=True)


def export_to_json(products: List[Product], filepath: str = None) -> str:
    ensure_export_dir()
    if not filepath:
        filepath = os.path.join(EXPORT_DIR, f"products_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    data = [p.to_dict() for p in products]
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return filepath


def export_to_csv(products: List[Product], filepath: str = None) -> str:
    ensure_export_dir()
    if not filepath:
        filepath = os.path.join(EXPORT_DIR, f"products_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")
    fieldnames = [
        "platform", "title", "price", "shop_name", "shop_rating",
        "sales", "url", "image_url", "keyword", "is_recommended"
    ]
    with open(filepath, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for p in products:
            row = p.to_dict()
            writer.writerow({k: row.get(k, "") for k in fieldnames})
    return filepath


def export_products(products: List[Product], filepath: str, fmt: str = "json") -> str:
    fmt = fmt.lower()
    if fmt == "json":
        return export_to_json(products, filepath)
    elif fmt == "csv":
        return export_to_csv(products, filepath)
    else:
        raise ValueError(f"不支持的导出格式: {fmt}")


def format_price(price: float) -> str:
    return f"¥{price:,.2f}"


def format_sales(sales: int) -> str:
    if sales >= 10000:
        return f"{sales / 10000:.1f}万"
    return str(sales)


def get_platform_name(platform: str) -> str:
    names = {
        "jd": "京东",
        "taobao": "淘宝",
        "pinduoduo": "拼多多",
    }
    return names.get(platform, platform)


def get_platform_color(platform: str) -> str:
    colors = {
        "jd": "#e1251b",
        "taobao": "#ff5000",
        "pinduoduo": "#e02e24",
    }
    return colors.get(platform, "#666")
