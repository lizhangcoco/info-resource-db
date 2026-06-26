from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List


@dataclass
class Product:
    product_key: str
    platform: str
    title: str
    price: float
    url: str
    image_url: str = ""
    shop_name: str = ""
    shop_rating: float = 0.0
    sales: int = 0
    keyword: str = ""
    is_recommended: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    def to_dict(self):
        return {
            "product_key": self.product_key,
            "platform": self.platform,
            "title": self.title,
            "price": self.price,
            "url": self.url,
            "image_url": self.image_url,
            "shop_name": self.shop_name,
            "shop_rating": self.shop_rating,
            "sales": self.sales,
            "keyword": self.keyword,
            "is_recommended": self.is_recommended,
        }


@dataclass
class PricePoint:
    product_key: str
    price: float
    collected_at: str
    keyword: str = ""

    def to_dict(self):
        return {
            "product_key": self.product_key,
            "price": self.price,
            "collected_at": self.collected_at,
            "keyword": self.keyword,
        }


@dataclass
class SearchRecord:
    keyword: str
    platforms: List[str]
    product_count: int = 0
    status: str = "running"
    id: Optional[int] = None
    created_at: Optional[str] = None

    def to_dict(self):
        return {
            "id": self.id,
            "keyword": self.keyword,
            "platforms": self.platforms,
            "product_count": self.product_count,
            "status": self.status,
            "created_at": self.created_at,
        }


@dataclass
class TrendData:
    product_key: str
    title: str
    platform: str
    points: List[PricePoint] = field(default_factory=list)
    min_price: float = 0.0
    max_price: float = 0.0
    current_price: float = 0.0
    change_percent: float = 0.0

    def to_dict(self):
        return {
            "product_key": self.product_key,
            "title": self.title,
            "platform": self.platform,
            "points": [p.to_dict() for p in self.points],
            "min_price": self.min_price,
            "max_price": self.max_price,
            "current_price": self.current_price,
            "change_percent": self.change_percent,
        }


@dataclass
class StatsData:
    total_products: int = 0
    min_price: float = 0.0
    max_price: float = 0.0
    avg_price: float = 0.0
    platform_stats: dict = field(default_factory=dict)
    recommended_count: int = 0

    def to_dict(self):
        return {
            "total_products": self.total_products,
            "min_price": self.min_price,
            "max_price": self.max_price,
            "avg_price": self.avg_price,
            "platform_stats": self.platform_stats,
            "recommended_count": self.recommended_count,
        }
