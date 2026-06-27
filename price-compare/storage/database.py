import sqlite3
import json
import os
from datetime import datetime
from typing import List, Optional, Tuple
from contextlib import contextmanager

from storage.models import Product, PricePoint, SearchRecord, TrendData, StatsData


DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "price_compare.db")


def get_db_path():
    return DB_PATH


@contextmanager
def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_key VARCHAR(64) UNIQUE NOT NULL,
                platform VARCHAR(20) NOT NULL,
                title VARCHAR(500) NOT NULL,
                price DECIMAL(10,2) NOT NULL DEFAULT 0,
                url VARCHAR(1000) NOT NULL,
                image_url VARCHAR(1000) DEFAULT '',
                shop_name VARCHAR(200) DEFAULT '',
                shop_rating FLOAT DEFAULT 0.0,
                sales INTEGER DEFAULT 0,
                keyword VARCHAR(100) DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS price_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_key VARCHAR(64) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                collected_at DATETIME NOT NULL,
                keyword VARCHAR(100) DEFAULT ''
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS search_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                keyword VARCHAR(100) NOT NULL,
                platforms VARCHAR(100) DEFAULT '[]',
                product_count INTEGER DEFAULT 0,
                status VARCHAR(20) DEFAULT 'running',
                error_msg TEXT DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_products_keyword ON products(keyword)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_products_platform ON products(platform)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_price_history_key ON price_history(product_key)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_price_history_keyword ON price_history(keyword)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_search_keyword ON search_records(keyword)")

        try:
            cursor.execute("ALTER TABLE search_records ADD COLUMN error_msg TEXT DEFAULT NULL")
        except Exception:
            pass


def is_db_initialized() -> bool:
    if not os.path.exists(DB_PATH):
        return False
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as cnt FROM products")
            row = cursor.fetchone()
            return row["cnt"] > 0
    except Exception:
        return False


def upsert_product(product: Product) -> int:
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM products WHERE product_key = ?", (product.product_key,))
        row = cursor.fetchone()
        if row:
            cursor.execute("""
                UPDATE products SET
                    title = ?, price = ?, url = ?, image_url = ?,
                    shop_name = ?, shop_rating = ?, sales = ?,
                    keyword = ?, updated_at = ?
                WHERE product_key = ?
            """, (
                product.title, product.price, product.url, product.image_url,
                product.shop_name, product.shop_rating, product.sales,
                product.keyword, now, product.product_key
            ))
            return row["id"]
        else:
            cursor.execute("""
                INSERT INTO products (
                    product_key, platform, title, price, url, image_url,
                    shop_name, shop_rating, sales, keyword, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                product.product_key, product.platform, product.title, product.price,
                product.url, product.image_url, product.shop_name, product.shop_rating,
                product.sales, product.keyword, now, now
            ))
            return cursor.lastrowid


def insert_price_history(point: PricePoint):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO price_history (product_key, price, collected_at, keyword)
            VALUES (?, ?, ?, ?)
        """, (point.product_key, point.price, point.collected_at, point.keyword))


def batch_insert_products(products: List[Product]):
    for p in products:
        upsert_product(p)


def batch_insert_price_history(points: List[PricePoint]):
    with get_db() as conn:
        cursor = conn.cursor()
        for point in points:
            cursor.execute("""
                INSERT INTO price_history (product_key, price, collected_at, keyword)
                VALUES (?, ?, ?, ?)
            """, (point.product_key, point.price, point.collected_at, point.keyword))


def get_products_by_keyword(keyword: str, platform: str = None, order_by: str = "price",
                            sort: str = "asc", limit: int = 100) -> List[Product]:
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM products WHERE keyword = ?"
        params = [keyword]
        if platform:
            query += " AND platform = ?"
            params.append(platform)
        if order_by in ("price", "sales", "shop_rating"):
            sort_dir = "ASC" if sort.lower() == "asc" else "DESC"
            query += f" ORDER BY {order_by} {sort_dir}"
        query += " LIMIT ?"
        params.append(limit)
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [_row_to_product(row) for row in rows]


def get_all_products(keyword: str = None, limit: int = 200) -> List[Product]:
    with get_db() as conn:
        cursor = conn.cursor()
        if keyword:
            cursor.execute("SELECT * FROM products WHERE keyword = ? ORDER BY price ASC LIMIT ?",
                           (keyword, limit))
        else:
            cursor.execute("SELECT * FROM products ORDER BY price ASC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        return [_row_to_product(row) for row in rows]


def get_product_by_key(product_key: str) -> Optional[Product]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM products WHERE product_key = ?", (product_key,))
        row = cursor.fetchone()
        return _row_to_product(row) if row else None


def get_price_history(product_key: str, days: int = 30) -> List[PricePoint]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM price_history
            WHERE product_key = ?
            ORDER BY collected_at ASC
            LIMIT ?
        """, (product_key, days * 3))
        rows = cursor.fetchall()
        return [PricePoint(
            product_key=row["product_key"],
            price=row["price"],
            collected_at=row["collected_at"],
            keyword=row["keyword"],
        ) for row in rows]


def get_price_history_by_keyword(keyword: str, days: int = 30) -> List[TrendData]:
    products = get_products_by_keyword(keyword, limit=10)
    result = []
    for product in products:
        points = get_price_history(product.product_key, days)
        if not points:
            continue
        prices = [p.price for p in points]
        min_price = min(prices)
        max_price = max(prices)
        current_price = prices[-1]
        first_price = prices[0]
        change_percent = round((current_price - first_price) / first_price * 100, 2) if first_price else 0
        result.append(TrendData(
            product_key=product.product_key,
            title=product.title,
            platform=product.platform,
            points=points,
            min_price=min_price,
            max_price=max_price,
            current_price=current_price,
            change_percent=change_percent,
        ))
    return result


def get_stats(keyword: str) -> StatsData:
    products = get_products_by_keyword(keyword, limit=500)
    if not products:
        return StatsData()
    prices = [p.price for p in products]
    platform_stats = {}
    for p in products:
        if p.platform not in platform_stats:
            platform_stats[p.platform] = {"count": 0, "total_price": 0.0, "avg_price": 0.0}
        platform_stats[p.platform]["count"] += 1
        platform_stats[p.platform]["total_price"] += p.price
    for plat in platform_stats.values():
        plat["avg_price"] = round(plat["total_price"] / plat["count"], 2)
        del plat["total_price"]
    sorted_products = sorted(products, key=lambda x: x.price)
    recommended_count = min(3, len(sorted_products))
    return StatsData(
        total_products=len(products),
        min_price=min(prices),
        max_price=max(prices),
        avg_price=round(sum(prices) / len(prices), 2),
        platform_stats=platform_stats,
        recommended_count=recommended_count,
    )


def create_search_record(keyword: str, platforms: List[str]) -> int:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO search_records (keyword, platforms, status)
            VALUES (?, ?, 'running')
        """, (keyword, json.dumps(platforms)))
        return cursor.lastrowid


def update_search_record(record_id: int, product_count: int = None, status: str = None, error_msg: str = None):
    with get_db() as conn:
        cursor = conn.cursor()
        updates = []
        params = []
        if product_count is not None:
            updates.append("product_count = ?")
            params.append(product_count)
        if status:
            updates.append("status = ?")
            params.append(status)
        if error_msg is not None:
            updates.append("error_msg = ?")
            params.append(error_msg)
        if not updates:
            return
        params.append(record_id)
        cursor.execute(f"UPDATE search_records SET {', '.join(updates)} WHERE id = ?", params)


def get_search_records(keyword: str = None, limit: int = 20) -> List[SearchRecord]:
    with get_db() as conn:
        cursor = conn.cursor()
        if keyword:
            cursor.execute("""
                SELECT * FROM search_records WHERE keyword = ?
                ORDER BY created_at DESC LIMIT ?
            """, (keyword, limit))
        else:
            cursor.execute("""
                SELECT * FROM search_records
                ORDER BY created_at DESC LIMIT ?
            """, (limit,))
        rows = cursor.fetchall()
        return [SearchRecord(
            id=row["id"],
            keyword=row["keyword"],
            platforms=json.loads(row["platforms"]) if row["platforms"] else [],
            product_count=row["product_count"],
            status=row["status"],
            error_msg=row["error_msg"] if "error_msg" in row.keys() else None,
            created_at=row["created_at"],
        ) for row in rows]


def get_keywords() -> List[str]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT keyword FROM products ORDER BY keyword")
        rows = cursor.fetchall()
        return [row["keyword"] for row in rows]


def _row_to_product(row: sqlite3.Row) -> Product:
    return Product(
        product_key=row["product_key"],
        platform=row["platform"],
        title=row["title"],
        price=row["price"],
        url=row["url"],
        image_url=row["image_url"] or "",
        shop_name=row["shop_name"] or "",
        shop_rating=row["shop_rating"] or 0.0,
        sales=row["sales"] or 0,
        keyword=row["keyword"] or "",
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )
