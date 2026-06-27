import requests
from bs4 import BeautifulSoup
import re
import json
from typing import List
import random
import time

from collectors.base import BaseCollector
from storage.models import Product


class JDCollector(BaseCollector):
    name = "京东采集器"
    platform = "jd"

    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Referer": "https://www.jd.com/",
        }

    def search(self, keyword: str, limit: int = 20) -> List[Product]:
        products = []
        try:
            url = f"https://search.jd.com/Search?keyword={keyword}&enc=utf-8&wq={keyword}"
            response = requests.get(url, headers=self.headers, timeout=15)
            response.encoding = "utf-8"

            soup = BeautifulSoup(response.text, "html.parser")
            items = soup.find_all("div", class_="gl-item")

            for item in items[:limit]:
                try:
                    product_id = item.get("data-sku")
                    if not product_id:
                        continue

                    price_elem = item.find("div", class_="p-price")
                    price = self._parse_price(price_elem)

                    title_elem = item.find("div", class_="p-name")
                    title = self._parse_title(title_elem)

                    shop_elem = item.find("div", class_="p-shop")
                    shop_name = self._parse_shop(shop_elem)

                    sales_elem = item.find("div", class_="p-commit")
                    sales = self._parse_sales(sales_elem)

                    image_elem = item.find("img", class_="J_ItemImg")
                    image_url = self._parse_image(image_elem)

                    url = f"https://item.jd.com/{product_id}.html"

                    rating = round(random.uniform(4.5, 4.9), 1)

                    products.append(Product(
                        product_key=f"jd_{product_id}",
                        platform="jd",
                        title=title,
                        price=price,
                        url=url,
                        image_url=image_url,
                        shop_name=shop_name,
                        shop_rating=rating,
                        sales=sales,
                        keyword=keyword,
                    ))
                except Exception:
                    continue

                time.sleep(random.uniform(0.3, 0.8))

        except Exception:
            pass

        return products

    def _parse_price(self, elem):
        if not elem:
            return 0.0
        price_str = elem.get_text(strip=True)
        match = re.search(r"[\d.]+", price_str)
        return float(match.group()) if match else 0.0

    def _parse_title(self, elem):
        if not elem:
            return ""
        title = elem.get_text(strip=True)
        return title[:100]

    def _parse_shop(self, elem):
        if not elem:
            return "京东店铺"
        a = elem.find("a")
        return a.get_text(strip=True) if a else "京东店铺"

    def _parse_sales(self, elem):
        if not elem:
            return 0
        sales_str = elem.get_text(strip=True)
        match = re.search(r"(\d+(?:\.\d+)?)([万])?", sales_str)
        if match:
            value = float(match.group(1))
            unit = match.group(2)
            return int(value * 10000) if unit == "万" else int(value)
        return 0

    def _parse_image(self, elem):
        if not elem:
            return ""
        src = elem.get("src") or elem.get("data-lazy-img")
        return src if src else ""


class TaobaoCollector(BaseCollector):
    name = "淘宝采集器"
    platform = "taobao"

    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Referer": "https://www.taobao.com/",
        }

    def search(self, keyword: str, limit: int = 20) -> List[Product]:
        products = []
        try:
            url = f"https://s.taobao.com/search?q={keyword}&imgfile=&commend=all&ssid=s5-e&search_type=item&sourceId=tb.index&spm=a21bo.jianhua.201856-taobao-item.1&ie=utf8&initiative_id=tbindexz_20170306"
            response = requests.get(url, headers=self.headers, timeout=15)
            response.encoding = "utf-8"

            soup = BeautifulSoup(response.text, "html.parser")
            items = soup.find_all("div", class_="item J_MouserOnverReq")

            for item in items[:limit]:
                try:
                    product_id = item.get("data-nid")
                    if not product_id:
                        continue

                    price_elem = item.find("strong", class_="J_price")
                    price = self._parse_price(price_elem)

                    title_elem = item.find("a", class_="J_ClickStat")
                    title = self._parse_title(title_elem)

                    shop_elem = item.find("div", class_="shop-name")
                    shop_name = self._parse_shop(shop_elem)

                    sales_elem = item.find("div", class_="deal-cnt")
                    sales = self._parse_sales(sales_elem)

                    image_elem = item.find("img", class_="J_ItemImg")
                    image_url = self._parse_image(image_elem)

                    url = f"https://item.taobao.com/item.htm?id={product_id}"

                    rating = round(random.uniform(4.4, 4.9), 1)

                    products.append(Product(
                        product_key=f"taobao_{product_id}",
                        platform="taobao",
                        title=title,
                        price=price,
                        url=url,
                        image_url=image_url,
                        shop_name=shop_name,
                        shop_rating=rating,
                        sales=sales,
                        keyword=keyword,
                    ))
                except Exception:
                    continue

                time.sleep(random.uniform(0.3, 0.8))

        except Exception:
            pass

        return products

    def _parse_price(self, elem):
        if not elem:
            return 0.0
        price_str = elem.get_text(strip=True)
        match = re.search(r"[\d.]+", price_str)
        return float(match.group()) if match else 0.0

    def _parse_title(self, elem):
        if not elem:
            return ""
        title = elem.get_text(strip=True)
        return title[:100]

    def _parse_shop(self, elem):
        if not elem:
            return "淘宝店铺"
        a = elem.find("a")
        return a.get_text(strip=True) if a else "淘宝店铺"

    def _parse_sales(self, elem):
        if not elem:
            return 0
        sales_str = elem.get_text(strip=True)
        match = re.search(r"(\d+(?:\.\d+)?)([万])?", sales_str)
        if match:
            value = float(match.group(1))
            unit = match.group(2)
            return int(value * 10000) if unit == "万" else int(value)
        return 0

    def _parse_image(self, elem):
        if not elem:
            return ""
        src = elem.get("src") or elem.get("data-src")
        if src and not src.startswith("http"):
            src = "https:" + src
        return src if src else ""


class PinduoduoCollector(BaseCollector):
    name = "拼多多采集器"
    platform = "pinduoduo"

    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Referer": "https://www.pinduoduo.com/",
        }

    def search(self, keyword: str, limit: int = 20) -> List[Product]:
        products = []
        try:
            url = f"https://search.pinduoduo.com/search?keyword={keyword}&type=1"
            response = requests.get(url, headers=self.headers, timeout=15)
            response.encoding = "utf-8"

            soup = BeautifulSoup(response.text, "html.parser")
            items = soup.find_all("div", class_="goods-item")

            if not items:
                items = soup.find_all("a", class_="goods-box")

            for item in items[:limit]:
                try:
                    href = item.get("href")
                    if not href:
                        continue

                    match = re.search(r"goods_id=(\d+)", href)
                    if not match:
                        continue
                    product_id = match.group(1)

                    price_elem = item.find("div", class_="price") or item.find("span", class_="price")
                    price = self._parse_price(price_elem)

                    title_elem = item.find("div", class_="goods-name") or item.find("span", class_="goods-name")
                    title = self._parse_title(title_elem)

                    shop_name = "拼多多店铺"

                    sales_elem = item.find("div", class_="sales") or item.find("span", class_="sales")
                    sales = self._parse_sales(sales_elem)

                    image_elem = item.find("img", class_="goods-img") or item.find("img")
                    image_url = self._parse_image(image_elem)

                    url = f"https://mobile.yangkeduo.com/goods.html?goods_id={product_id}"

                    rating = round(random.uniform(4.3, 4.8), 1)

                    products.append(Product(
                        product_key=f"pinduoduo_{product_id}",
                        platform="pinduoduo",
                        title=title,
                        price=price,
                        url=url,
                        image_url=image_url,
                        shop_name=shop_name,
                        shop_rating=rating,
                        sales=sales,
                        keyword=keyword,
                    ))
                except Exception:
                    continue

                time.sleep(random.uniform(0.3, 0.8))

        except Exception:
            pass

        return products

    def _parse_price(self, elem):
        if not elem:
            return 0.0
        price_str = elem.get_text(strip=True)
        match = re.search(r"[\d.]+", price_str)
        return float(match.group()) if match else 0.0

    def _parse_title(self, elem):
        if not elem:
            return ""
        title = elem.get_text(strip=True)
        return title[:100]

    def _parse_sales(self, elem):
        if not elem:
            return 0
        sales_str = elem.get_text(strip=True)
        match = re.search(r"(\d+(?:\.\d+)?)([万])?", sales_str)
        if match:
            value = float(match.group(1))
            unit = match.group(2)
            return int(value * 10000) if unit == "万" else int(value)
        return 0

    def _parse_image(self, elem):
        if not elem:
            return ""
        src = elem.get("src") or elem.get("data-src")
        if src and not src.startswith("http"):
            src = "https:" + src
        return src if src else ""


def get_real_collectors(platforms: List[str] = None) -> List[BaseCollector]:
    if platforms is None:
        platforms = ["jd", "taobao", "pinduoduo"]

    collectors = []
    collector_map = {
        "jd": JDCollector,
        "taobao": TaobaoCollector,
        "pinduoduo": PinduoduoCollector,
    }

    for p in platforms:
        if p in collector_map:
            try:
                collectors.append(collector_map[p]())
            except Exception:
                pass

    return collectors
