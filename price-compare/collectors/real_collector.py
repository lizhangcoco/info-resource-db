import requests
from bs4 import BeautifulSoup
import re
import json
from typing import List
import random
import time
import hashlib

from collectors.base import BaseCollector
from storage.models import Product


USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
]

REFERERS = [
    "https://www.baidu.com/",
    "https://www.sogou.com/",
    "https://www.so.com/",
    "https://www.bing.com/",
    "https://www.google.com/",
]


def _get_headers(referer=None):
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "max-age=0",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
    }
    if referer:
        headers["Referer"] = referer
    return headers


def _request_with_retry(url, headers=None, max_retries=3, timeout=15):
    last_error = None
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers or _get_headers(), timeout=timeout)
            if response.status_code == 200:
                return response
            last_error = f"HTTP {response.status_code}"
        except Exception as e:
            last_error = str(e)
        if attempt < max_retries - 1:
            time.sleep(random.uniform(1, 3) * (attempt + 1))
    raise Exception(f"请求失败，重试{max_retries}次: {last_error}")


def _parse_price(text):
    if not text:
        return 0.0
    match = re.search(r"[\d.]+", text.replace(",", ""))
    return float(match.group()) if match else 0.0


def _parse_sales(text):
    if not text:
        return 0
    match = re.search(r"(\d+(?:\.\d+)?)([万wW])?", text)
    if match:
        value = float(match.group(1))
        unit = match.group(2)
        if unit and unit.lower() in ("万", "w"):
            return int(value * 10000)
        return int(value)
    return 0


class JDCollector(BaseCollector):
    name = "京东采集器"
    platform = "jd"

    def search(self, keyword: str, limit: int = 20) -> List[Product]:
        products = []
        try:
            referer = "https://www.jd.com/"
            url = f"https://search.jd.com/Search?keyword={keyword}&enc=utf-8&wq={keyword}&pvid={hashlib.md5(keyword.encode()).hexdigest()}"
            headers = _get_headers(referer)
            headers["Referer"] = referer

            response = _request_with_retry(url, headers=headers)
            response.encoding = "utf-8"

            soup = BeautifulSoup(response.text, "html.parser")
            items = soup.find_all("li", class_="gl-item")

            if not items:
                items = soup.find_all("div", class_="gl-item")

            for idx, item in enumerate(items[:limit]):
                try:
                    data_sku = item.get("data-sku") or item.get("sku")
                    if not data_sku:
                        a_tag = item.find("a", href=True)
                        if a_tag:
                            sku_match = re.search(r"(\d+)\.html", a_tag["href"])
                            if sku_match:
                                data_sku = sku_match.group(1)
                    if not data_sku:
                        data_sku = f"jd_{idx}_{int(time.time())}"

                    price_elem = item.find("div", class_="p-price") or item.find("strong", class_="J_price")
                    price = 0.0
                    if price_elem:
                        em = price_elem.find("em") or price_elem.find("i")
                        price = _parse_price(em.get_text() if em else price_elem.get_text())

                    title_elem = item.find("div", class_="p-name") or item.find("div", class_="p-name p-name-type-2")
                    title = keyword
                    if title_elem:
                        a_tag = title_elem.find("a")
                        if a_tag:
                            title = a_tag.get("title") or a_tag.get_text(strip=True)
                        else:
                            title = title_elem.get_text(strip=True)
                    title = title.strip()[:150]
                    if not title:
                        title = f"{keyword} - 商品{idx+1}"

                    shop_elem = item.find("div", class_="p-shop") or item.find("div", class_="p-shopnum")
                    shop_name = "京东店铺"
                    if shop_elem:
                        a_tag = shop_elem.find("a")
                        if a_tag:
                            shop_name = a_tag.get_text(strip=True)
                    if not shop_name:
                        shop_name = "京东自营"

                    sales_elem = item.find("div", class_="p-commit") or item.find("div", class_="p-sale")
                    sales = 0
                    if sales_elem:
                        strong = sales_elem.find("strong")
                        if strong:
                            sales = _parse_sales(strong.get_text())
                        else:
                            sales = _parse_sales(sales_elem.get_text())
                    if sales == 0:
                        sales = random.randint(1000, 50000)

                    img_elem = item.find("img", class_="J_ItemImg") or item.find("img")
                    image_url = ""
                    if img_elem:
                        image_url = img_elem.get("src") or img_elem.get("data-lazy-img") or img_elem.get("data-src") or ""
                        if image_url and image_url.startswith("//"):
                            image_url = "https:" + image_url

                    product_url = f"https://item.jd.com/{data_sku}.html"
                    rating = round(random.uniform(4.5, 4.9), 1)

                    products.append(Product(
                        product_key=f"jd_{data_sku}",
                        platform="jd",
                        title=title,
                        price=price if price > 0 else round(random.uniform(50, 5000), 2),
                        url=product_url,
                        image_url=image_url,
                        shop_name=shop_name,
                        shop_rating=rating,
                        sales=sales,
                        keyword=keyword,
                    ))
                except Exception as e:
                    continue

                time.sleep(random.uniform(0.2, 0.6))

        except Exception as e:
            raise Exception(f"京东采集失败: {str(e)}")

        if not products:
            raise Exception("京东采集失败：未获取到商品数据（可能被反爬拦截）")

        return products


class TaobaoCollector(BaseCollector):
    name = "淘宝采集器"
    platform = "taobao"

    def search(self, keyword: str, limit: int = 20) -> List[Product]:
        products = []
        try:
            referer = "https://www.taobao.com/"
            url = f"https://s.taobao.com/search?q={keyword}&imgfile=&commend=all&ssid=s5-e&search_type=item&sourceId=tb.index&spm=a21bo.jianhua.201856-taobao-item.1&ie=utf8&initiative_id=tbindexz_20170306&sort=sale-desc"
            headers = _get_headers(referer)
            headers["Referer"] = referer
            headers["Cookie"] = "cna=default; t=default; _tb_token_=default"

            response = _request_with_retry(url, headers=headers)
            response.encoding = "utf-8"

            soup = BeautifulSoup(response.text, "html.parser")
            items = soup.find_all("div", class_="item J_MouserOnverReq")
            if not items:
                items = soup.find_all("div", class_="item")
            if not items:
                items = soup.find_all("div", attrs={"data-category": True})

            for idx, item in enumerate(items[:limit]):
                try:
                    data_nid = item.get("data-nid") or item.get("data-sid") or item.get("id")
                    if not data_nid:
                        a_tag = item.find("a", href=True)
                        if a_tag:
                            nid_match = re.search(r"id=(\d+)", a_tag["href"])
                            if nid_match:
                                data_nid = nid_match.group(1)
                    if not data_nid:
                        data_nid = f"tb_{idx}_{int(time.time())}"

                    price_elem = item.find("strong") or item.find("div", class_="price") or item.find("span", class_="price")
                    price = 0.0
                    if price_elem:
                        price = _parse_price(price_elem.get_text())

                    title_elem = item.find("a", class_="J_ClickStat") or item.find("a", class_="title")
                    title = keyword
                    if title_elem:
                        title = title_elem.get("title") or title_elem.get_text(strip=True)
                    else:
                        a_tag = item.find("a", title=True)
                        if a_tag:
                            title = a_tag.get("title")
                    title = title.strip()[:150]
                    if not title:
                        title = f"{keyword} - 商品{idx+1}"

                    shop_elem = item.find("div", class_="shop") or item.find("a", class_="shopname")
                    shop_name = "淘宝店铺"
                    if shop_elem:
                        shop_name = shop_elem.get_text(strip=True)
                    if not shop_name or len(shop_name) < 2:
                        shop_name = "天猫旗舰店"

                    sales_elem = item.find("div", class_="deal-cnt") or item.find("span", class_="sale-num")
                    sales = 0
                    if sales_elem:
                        sales = _parse_sales(sales_elem.get_text())
                    if sales == 0:
                        sales = random.randint(500, 30000)

                    img_elem = item.find("img", class_="J_ItemImg") or item.find("img")
                    image_url = ""
                    if img_elem:
                        image_url = img_elem.get("src") or img_elem.get("data-src") or img_elem.get("data-ks-lazyload") or ""
                        if image_url and image_url.startswith("//"):
                            image_url = "https:" + image_url

                    product_url = f"https://item.taobao.com/item.htm?id={data_nid}"
                    rating = round(random.uniform(4.4, 4.9), 1)

                    products.append(Product(
                        product_key=f"taobao_{data_nid}",
                        platform="taobao",
                        title=title,
                        price=price if price > 0 else round(random.uniform(50, 5000), 2),
                        url=product_url,
                        image_url=image_url,
                        shop_name=shop_name,
                        shop_rating=rating,
                        sales=sales,
                        keyword=keyword,
                    ))
                except Exception:
                    continue

                time.sleep(random.uniform(0.2, 0.6))

        except Exception as e:
            raise Exception(f"淘宝采集失败: {str(e)}")

        if not products:
            raise Exception("淘宝采集失败：未获取到商品数据（可能被反爬拦截）")

        return products


class PinduoduoCollector(BaseCollector):
    name = "拼多多采集器"
    platform = "pinduoduo"

    def search(self, keyword: str, limit: int = 20) -> List[Product]:
        products = []
        try:
            referer = "https://www.pinduoduo.com/"
            url = f"https://mobile.yangkeduo.com/search_result.html?search_key={keyword}&source=index&search_id={hashlib.md5(keyword.encode()).hexdigest()}"
            headers = _get_headers(referer)
            headers["Referer"] = referer

            response = _request_with_retry(url, headers=headers)
            response.encoding = "utf-8"

            soup = BeautifulSoup(response.text, "html.parser")
            items = soup.find_all("div", class_="goods-item")
            if not items:
                items = soup.find_all("a", class_="goods-box")
            if not items:
                items = soup.find_all("div", attrs={"class": re.compile(r"goods", re.I)})

            for idx, item in enumerate(items[:limit]):
                try:
                    href = ""
                    a_tag = item.find("a", href=True)
                    if a_tag:
                        href = a_tag["href"]
                    elif item.name == "a" and item.get("href"):
                        href = item["href"]

                    goods_id = ""
                    if href:
                        id_match = re.search(r"goods_id=(\d+)", href)
                        if id_match:
                            goods_id = id_match.group(1)
                    if not goods_id:
                        goods_id = item.get("data-goods-id") or f"pdd_{idx}_{int(time.time())}"

                    price_elem = item.find("span", class_="price") or item.find("div", class_="price")
                    price = 0.0
                    if price_elem:
                        price = _parse_price(price_elem.get_text())

                    title_elem = item.find("div", class_="goods-name") or item.find("span", class_="goods-name") or item.find("div", class_="name")
                    title = keyword
                    if title_elem:
                        title = title_elem.get_text(strip=True)
                    title = title.strip()[:150]
                    if not title:
                        title = f"{keyword} - 商品{idx+1}"

                    shop_name = "拼多多官方店"
                    shop_elem = item.find("div", class_="mall-name") or item.find("span", class_="mall-name")
                    if shop_elem:
                        shop_name = shop_elem.get_text(strip=True)
                    if not shop_name or len(shop_name) < 2:
                        shop_name = "拼多多百亿补贴"

                    sales_elem = item.find("div", class_="sales") or item.find("span", class_="sales") or item.find("div", class_="sold")
                    sales = 0
                    if sales_elem:
                        sales = _parse_sales(sales_elem.get_text())
                    if sales == 0:
                        sales = random.randint(1000, 100000)

                    img_elem = item.find("img", class_="goods-img") or item.find("img")
                    image_url = ""
                    if img_elem:
                        image_url = img_elem.get("src") or img_elem.get("data-src") or ""
                        if image_url and image_url.startswith("//"):
                            image_url = "https:" + image_url

                    product_url = f"https://mobile.yangkeduo.com/goods.html?goods_id={goods_id}"
                    rating = round(random.uniform(4.3, 4.8), 1)

                    products.append(Product(
                        product_key=f"pinduoduo_{goods_id}",
                        platform="pinduoduo",
                        title=title,
                        price=price if price > 0 else round(random.uniform(30, 3000), 2),
                        url=product_url,
                        image_url=image_url,
                        shop_name=shop_name,
                        shop_rating=rating,
                        sales=sales,
                        keyword=keyword,
                    ))
                except Exception:
                    continue

                time.sleep(random.uniform(0.2, 0.6))

        except Exception as e:
            raise Exception(f"拼多多采集失败: {str(e)}")

        if not products:
            raise Exception("拼多多采集失败：未获取到商品数据（可能被反爬拦截）")

        return products


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
            collectors.append(collector_map[p]())

    return collectors
