import random
import hashlib
from typing import List
from datetime import datetime, timedelta

from collectors.base import BaseCollector
from storage.models import Product, PricePoint


PLATFORM_CONFIG = {
    "jd": {
        "name": "京东",
        "color": "#e1251b",
        "shop_prefixes": ["京东自营", "京东官方旗舰店", "京东超市", "京东家电"],
        "shop_names": ["Apple产品京东自营旗舰店", "小米京东自营旗舰店", "华为京东自营旗舰店",
                       "戴森京东自营旗舰店", "Nike京东自营旗舰店", "索尼京东自营旗舰店"],
        "url_prefix": "https://item.jd.com/",
        "image_prefix": "https://img14.360buyimg.com/n1/",
    },
    "taobao": {
        "name": "淘宝",
        "color": "#ff5000",
        "shop_prefixes": ["天猫旗舰店", "淘宝官方店", "天猫超市"],
        "shop_names": ["天猫国际官方直营", "Apple Store官方旗舰店", "小米官方旗舰店",
                       "戴森官方旗舰店", "Nike官方旗舰店", "淘宝心选"],
        "url_prefix": "https://item.taobao.com/item.htm?id=",
        "image_prefix": "https://img.alicdn.com/imgextra/i3/",
    },
    "pinduoduo": {
        "name": "拼多多",
        "color": "#e02e24",
        "shop_prefixes": ["百亿补贴", "品牌黑标", "多多买菜"],
        "shop_names": ["拼多多百亿补贴", "品牌官方旗舰店", "拼多多电器城",
                       "多多超市自营", "品牌专营店", "官方授权店"],
        "url_prefix": "https://mobile.yangkeduo.com/goods.html?goods_id=",
        "image_prefix": "https://p0.picimg.com/remote/",
    },
}


class MockCollector(BaseCollector):
    name = "模拟数据采集器"
    platform = "mock"

    def __init__(self, platform: str = "jd"):
        self.platform = platform
        self.config = PLATFORM_CONFIG.get(platform, PLATFORM_CONFIG["jd"])

    def search(self, keyword: str, limit: int = 20) -> List[Product]:
        products = []
        base_price = self._get_base_price(keyword)
        variations = self._generate_variations(keyword, limit)

        for i, (suffix, price_offset, sales, rating) in enumerate(variations):
            product_id = self._make_id(keyword, self.platform, i)
            title = f"{keyword} {suffix}"
            price = round(base_price * (1 + price_offset), 2)
            shop_name = self.config["shop_names"][i % len(self.config["shop_names"])]
            image_url = f"{self.config['image_prefix']}{product_id}.jpg"
            url = f"{self.config['url_prefix']}{product_id}.html" if self.platform == "jd" \
                else f"{self.config['url_prefix']}{product_id}"

            products.append(Product(
                product_key=f"{self.platform}_{product_id}",
                platform=self.platform,
                title=title,
                price=price,
                url=url,
                image_url=image_url,
                shop_name=shop_name,
                shop_rating=round(rating, 1),
                sales=sales,
                keyword=keyword,
            ))

        return products

    def _get_base_price(self, keyword: str) -> float:
        keyword_lower = keyword.lower()
        price_map = {
            "iphone": 6999,
            "airpods": 1399,
            "macbook": 12999,
            "ipad": 3599,
            "戴森": 2990,
            "dyson": 2990,
            "nike": 899,
            "耐克": 899,
            "小米": 2999,
            "huawei": 4999,
            "华为": 4999,
            "索尼": 3599,
            "sony": 3599,
            "switch": 2099,
            "ps5": 3899,
        }
        for key, base in price_map.items():
            if key in keyword_lower:
                return base
        return 599.0

    def _generate_variations(self, keyword: str, count: int):
        random.seed(hash(keyword + self.platform) % 10000)
        suffixes = [
            "官方标配 全新正品",
            "128GB 深空灰色",
            "256GB 银色",
            "512GB 金色",
            "Pro版 旗舰款",
            "标准版 入门款",
            "套装版 含配件大礼包",
            "二手99新 官方认证",
            "海外版 全新未激活",
            "国行正品 全国联保",
            "百亿补贴 限量特惠",
            "学生专享 优惠价",
            "企业采购 批量优惠",
            "以旧换新 立减500",
            "分期免息 12期0利息",
        ]
        results = []
        for i in range(min(count, len(suffixes) * 2)):
            suffix = suffixes[i % len(suffixes)]
            if i >= len(suffixes):
                suffix = f"{suffix} 新款"
            price_offset = random.uniform(-0.25, 0.35)
            sales = random.randint(100, 50000)
            rating = random.uniform(4.2, 4.9)
            results.append((suffix, price_offset, sales, rating))
        return results

    def _make_id(self, keyword: str, platform: str, index: int) -> str:
        raw = f"{keyword}_{platform}_{index}_{datetime.now().strftime('%Y%m%d')}"
        return hashlib.md5(raw.encode()).hexdigest()[:16]


def generate_history_price(product: Product, days: int = 30) -> List[PricePoint]:
    random.seed(hash(product.product_key) % 10000)
    points = []
    base_price = product.price
    now = datetime.now()
    current_price = base_price * random.uniform(1.05, 1.25)

    for i in range(days, -1, -1):
        dt = now - timedelta(days=i)
        drift = (days - i) / days * (base_price - current_price) / base_price
        noise = random.uniform(-0.03, 0.03)
        price = round(base_price * (1 + drift + noise), 2)
        price = max(price, base_price * 0.6)
        points.append(PricePoint(
            product_key=product.product_key,
            price=price,
            collected_at=dt.strftime("%Y-%m-%d %H:%M:%S"),
            keyword=product.keyword,
        ))

    points[-1].price = round(product.price, 2)
    return points


def get_all_collectors(platforms: List[str] = None) -> List[BaseCollector]:
    if platforms is None:
        platforms = ["jd", "taobao", "pinduoduo"]
    collectors = []
    for p in platforms:
        if p in PLATFORM_CONFIG:
            collectors.append(MockCollector(platform=p))
    return collectors
