import sqlite3
import json
import os
from datetime import datetime
from typing import List, Optional, Tuple
from contextlib import contextmanager

from storage.models import Product, PricePoint, SearchRecord, TrendData, StatsData, User, Supplier, SupplierProduct, RFQRecord


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
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                email VARCHAR(100) DEFAULT '',
                phone VARCHAR(20) DEFAULT '',
                role VARCHAR(20) DEFAULT 'buyer',
                company_name VARCHAR(200) DEFAULT '',
                supplier_id INTEGER DEFAULT NULL,
                member_expire_at DATETIME DEFAULT NULL,
                status VARCHAR(20) DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS suppliers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(200) NOT NULL,
                contact_name VARCHAR(50) DEFAULT '',
                contact_phone VARCHAR(20) DEFAULT '',
                contact_email VARCHAR(100) DEFAULT '',
                address VARCHAR(500) DEFAULT '',
                business_license VARCHAR(100) DEFAULT '',
                qualifications TEXT DEFAULT '',
                credit_rating VARCHAR(10) DEFAULT 'A',
                price_valid_days INTEGER DEFAULT 30,
                payment_terms VARCHAR(200) DEFAULT '',
                delivery_cycle VARCHAR(100) DEFAULT '',
                after_sales VARCHAR(500) DEFAULT '',
                warranty_days INTEGER DEFAULT 0,
                status VARCHAR(20) DEFAULT 'pending',
                remark TEXT DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS supplier_products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                supplier_id INTEGER NOT NULL,
                product_type VARCHAR(20) DEFAULT 'goods',
                main_category VARCHAR(100) DEFAULT '',
                sub_category VARCHAR(100) DEFAULT '',
                title VARCHAR(500) NOT NULL,
                spec VARCHAR(500) DEFAULT '',
                unit VARCHAR(20) DEFAULT '',
                price DECIMAL(12,2) NOT NULL DEFAULT 0,
                min_order INTEGER DEFAULT 1,
                bulk_discount VARCHAR(200) DEFAULT '',
                delivery_cycle VARCHAR(100) DEFAULT '',
                warranty_days INTEGER DEFAULT 0,
                description TEXT DEFAULT '',
                image_url VARCHAR(1000) DEFAULT '',
                status VARCHAR(20) DEFAULT 'active',
                keyword VARCHAR(100) DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS rfq_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                product_type VARCHAR(20) DEFAULT 'goods',
                title VARCHAR(500) NOT NULL,
                spec VARCHAR(500) DEFAULT '',
                quantity INTEGER DEFAULT 1,
                unit VARCHAR(20) DEFAULT '',
                expected_price DECIMAL(12,2) DEFAULT 0,
                delivery_requirement VARCHAR(500) DEFAULT '',
                status VARCHAR(20) DEFAULT 'draft',
                assigned_supplier_id INTEGER DEFAULT NULL,
                supplier_quote DECIMAL(12,2) DEFAULT 0,
                quote_response TEXT DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (assigned_supplier_id) REFERENCES suppliers(id)
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_products_keyword ON products(keyword)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_products_platform ON products(platform)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_price_history_key ON price_history(product_key)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_price_history_keyword ON price_history(keyword)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_search_keyword ON search_records(keyword)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier ON supplier_products(supplier_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_supplier_products_keyword ON supplier_products(keyword)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_rfq_user ON rfq_records(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_rfq_status ON rfq_records(status)")

        try:
            cursor.execute("ALTER TABLE search_records ADD COLUMN error_msg TEXT DEFAULT NULL")
        except Exception:
            pass

        cursor.execute("SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'")
        admin_count = cursor.fetchone()["cnt"]
        if admin_count == 0:
            import bcrypt
            from datetime import datetime
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            password_hash = bcrypt.hashpw("admin123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            cursor.execute("""
                INSERT INTO users (username, password_hash, email, phone, role, company_name, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "admin", password_hash, "admin@bijia.com", "13800138000",
                "admin", "系统管理员", "active", now, now
            ))

        cursor.execute("SELECT COUNT(*) as cnt FROM suppliers")
        supplier_count = cursor.fetchone()["cnt"]
        if supplier_count == 0:
            from datetime import datetime
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            sample_suppliers = [
                ("深圳华强电子有限公司", "张经理", "13800138001", "zhang@huaqiang.com",
                 "深圳市福田区华强北路", "91440300MA5D8XXXXX", "ISO9001, CE, RoHS",
                 "A", 30, "月结30天", "3-5工作日", "7天无理由退换", 365, "approved", "长期合作供应商"),
                ("广州办公用品批发中心", "李主任", "13800138002", "li@gzbangong.com",
                 "广州市天河区珠江新城", "91440100MA59GXXXXX", "ISO9001",
                 "A", 15, "货到付款", "1-2工作日", "质量问题包换", 180, "approved", "办公耗材定点供应商"),
                ("上海工业设备制造有限公司", "王总", "13800138003", "wang@shanghai-industry.com",
                 "上海市浦东新区张江高科", "91310000MA1FLXXXXX", "ISO9001, ISO14001",
                 "B", 45, "预付30%发货前付清", "15-30工作日", "质保一年", 365, "approved", "大型设备供应商"),
            ]

            supplier_ids = []
            for s in sample_suppliers:
                cursor.execute("""
                    INSERT INTO suppliers (name, contact_name, contact_phone, contact_email, address,
                        business_license, qualifications, credit_rating, price_valid_days,
                        payment_terms, delivery_cycle, after_sales, warranty_days, status, remark,
                        created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, s + (now, now))
                supplier_ids.append(cursor.lastrowid)

            sample_products = [
                dict(supplier_id=supplier_ids[0], product_type="goods",
                     title="iPhone 15 Pro 256G 钛金属原色", spec="256GB 钛金属原色 美版无锁", unit="台",
                     price=7999.00, min_order=1, bulk_discount="10台以上95折",
                     delivery_cycle="2-3工作日", warranty_days=365,
                     description="全新原装正品，全国联保", image_url="", keyword="iPhone 15 Pro"),
                dict(supplier_id=supplier_ids[0], product_type="goods",
                     title="华为 Mate 60 Pro 12+512G", spec="12GB+512GB 雅川青 全网通", unit="台",
                     price=6999.00, min_order=1, bulk_discount="5台以上98折",
                     delivery_cycle="1-2工作日", warranty_days=365,
                     description="全新国行，官方联保", image_url="", keyword="华为 Mate 60 Pro"),
                dict(supplier_id=supplier_ids[0], product_type="goods",
                     title="小米14 Ultra 16+512G", spec="16GB+512GB 黑色 徕卡光学", unit="台",
                     price=6499.00, min_order=1, bulk_discount="10台以上95折",
                     delivery_cycle="2-3工作日", warranty_days=365,
                     description="全新正品，官方保修", image_url="", keyword="小米14 Ultra"),
                dict(supplier_id=supplier_ids[1], product_type="goods",
                     title="A4打印纸 70g 500张/包", spec="70g 500张/包 10包/箱", unit="箱",
                     price=198.00, min_order=1, bulk_discount="10箱以上9折",
                     delivery_cycle="当日达", warranty_days=0,
                     description="高白度复印纸，办公专用", image_url="", keyword="A4打印纸"),
                dict(supplier_id=supplier_ids[1], product_type="goods",
                     title="得力中性笔 0.5mm 黑色 12支装", spec="0.5mm 黑色 12支/盒", unit="盒",
                     price=15.80, min_order=1, bulk_discount="50盒以上85折",
                     delivery_cycle="当日达", warranty_days=0,
                     description="顺滑书写，办公首选", image_url="", keyword="中性笔"),
                dict(supplier_id=supplier_ids[2], product_type="goods",
                     title="工业级3D打印机 FDM高精度", spec="打印尺寸300*300*400mm 精度±0.1mm", unit="台",
                     price=15800.00, min_order=1, bulk_discount="2台以上9折",
                     delivery_cycle="20-25工作日", warranty_days=730,
                     description="工业级高精度，支持多种材料", image_url="", keyword="3D打印机"),
            ]

            for p in sample_products:
                cursor.execute("""
                    INSERT INTO supplier_products (supplier_id, product_type, title, spec, unit, price,
                        min_order, bulk_discount, delivery_cycle, warranty_days, description,
                        image_url, status, keyword, created_at, updated_at)
                    VALUES (:supplier_id, :product_type, :title, :spec, :unit, :price,
                        :min_order, :bulk_discount, :delivery_cycle, :warranty_days, :description,
                        :image_url, 'active', :keyword, :created_at, :updated_at)
                """, {**p, "created_at": now, "updated_at": now})


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


def get_supplier_by_name(name: str) -> Optional[Supplier]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM suppliers WHERE name = ?", (name,))
        row = cursor.fetchone()
        if not row:
            return None
        return Supplier(
            id=row["id"],
            name=row["name"],
            contact_name=row["contact_name"],
            contact_phone=row["contact_phone"],
            contact_email=row["contact_email"],
            address=row["address"],
            business_license=row["business_license"],
            qualifications=row["qualifications"],
            credit_rating=row["credit_rating"],
            price_valid_days=row["price_valid_days"],
            payment_terms=row["payment_terms"],
            delivery_cycle=row["delivery_cycle"],
            after_sales=row["after_sales"],
            warranty_days=row["warranty_days"],
            status=row["status"],
            remark=row["remark"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )


def batch_insert_supplier_products(products: List[SupplierProduct]) -> Tuple[int, List[str]]:
    success_count = 0
    errors = []
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_db() as conn:
        cursor = conn.cursor()
        for idx, product in enumerate(products, 1):
            try:
                cursor.execute("""
                    INSERT INTO supplier_products (
                        supplier_id, product_type, main_category, sub_category,
                        title, spec, unit, price, min_order,
                        bulk_discount, delivery_cycle, warranty_days, description, image_url,
                        status, keyword, created_at, updated_at
                    ) VALUES (
                        ?, ?, ?, ?,
                        ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?,
                        ?, ?, ?, ?
                    )
                """, (
                    product.supplier_id,
                    product.product_type,
                    product.main_category,
                    product.sub_category,
                    product.title,
                    product.spec,
                    product.unit,
                    product.price,
                    product.min_order,
                    product.bulk_discount,
                    product.delivery_cycle,
                    product.warranty_days,
                    product.description,
                    product.image_url,
                    product.status,
                    product.keyword,
                    now,
                    now,
                ))
                success_count += 1
            except Exception as e:
                errors.append(f"第{idx}行: {str(e)}")
    return success_count, errors


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


def create_user(user: User) -> int:
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (username, password_hash, email, phone, role, company_name, supplier_id, member_expire_at, status, created_at, updated_at)
            VALUES (:username, :password_hash, :email, :phone, :role, :company_name, :supplier_id, :member_expire_at, :status, :created_at, :updated_at)
        """, {
            "username": user.username,
            "password_hash": user.password_hash,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "company_name": user.company_name,
            "supplier_id": user.supplier_id,
            "member_expire_at": user.member_expire_at,
            "status": user.status,
            "created_at": now,
            "updated_at": now,
        })
        return cursor.lastrowid


def get_user_by_username(username: str) -> Optional[User]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        if not row:
            return None
        return User(
            id=row["id"],
            username=row["username"],
            password_hash=row["password_hash"],
            email=row["email"],
            phone=row["phone"],
            role=row["role"],
            company_name=row["company_name"],
            supplier_id=row["supplier_id"],
            member_expire_at=row["member_expire_at"],
            status=row["status"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )


def get_user_by_id(user_id: int) -> Optional[User]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return User(
            id=row["id"],
            username=row["username"],
            password_hash=row["password_hash"],
            email=row["email"],
            phone=row["phone"],
            role=row["role"],
            company_name=row["company_name"],
            supplier_id=row["supplier_id"],
            member_expire_at=row["member_expire_at"],
            status=row["status"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )


def update_user(user_id: int, **kwargs):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_db() as conn:
        cursor = conn.cursor()
        updates = ["updated_at = ?"]
        params = [now]
        for key, value in kwargs.items():
            if key in ("username", "password_hash", "email", "phone", "role", "company_name", "supplier_id", "member_expire_at", "status"):
                updates.append(f"{key} = ?")
                params.append(value)
        params.append(user_id)
        cursor.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)


def get_users(role: str = None, status: str = None, limit: int = 50) -> List[User]:
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM users"
        params = []
        conditions = []
        if role:
            conditions.append("role = ?")
            params.append(role)
        if status:
            conditions.append("status = ?")
            params.append(status)
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [User(
            id=row["id"],
            username=row["username"],
            password_hash=row["password_hash"],
            email=row["email"],
            phone=row["phone"],
            role=row["role"],
            company_name=row["company_name"],
            supplier_id=row["supplier_id"],
            member_expire_at=row["member_expire_at"],
            status=row["status"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        ) for row in rows]


def create_supplier(supplier: Supplier) -> int:
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO suppliers (
                name, contact_name, contact_phone, contact_email, address,
                business_license, qualifications, credit_rating, price_valid_days,
                payment_terms, delivery_cycle, after_sales, warranty_days,
                status, remark, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            supplier.name, supplier.contact_name, supplier.contact_phone,
            supplier.contact_email, supplier.address, supplier.business_license,
            supplier.qualifications, supplier.credit_rating, supplier.price_valid_days,
            supplier.payment_terms, supplier.delivery_cycle, supplier.after_sales,
            supplier.warranty_days, supplier.status, supplier.remark, now, now
        ))
        return cursor.lastrowid


def get_supplier_by_id(supplier_id: int) -> Optional[Supplier]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM suppliers WHERE id = ?", (supplier_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return Supplier(
            id=row["id"],
            name=row["name"],
            contact_name=row["contact_name"],
            contact_phone=row["contact_phone"],
            contact_email=row["contact_email"],
            address=row["address"],
            business_license=row["business_license"],
            qualifications=row["qualifications"],
            credit_rating=row["credit_rating"],
            price_valid_days=row["price_valid_days"],
            payment_terms=row["payment_terms"],
            delivery_cycle=row["delivery_cycle"],
            after_sales=row["after_sales"],
            warranty_days=row["warranty_days"],
            status=row["status"],
            remark=row["remark"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )


def update_supplier(supplier_id: int, **kwargs):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_db() as conn:
        cursor = conn.cursor()
        updates = ["updated_at = ?"]
        params = [now]
        for key, value in kwargs.items():
            if key in ("name", "contact_name", "contact_phone", "contact_email", "address",
                       "business_license", "qualifications", "credit_rating", "price_valid_days",
                       "payment_terms", "delivery_cycle", "after_sales", "warranty_days", "status", "remark"):
                updates.append(f"{key} = ?")
                params.append(value)
        params.append(supplier_id)
        cursor.execute(f"UPDATE suppliers SET {', '.join(updates)} WHERE id = ?", params)


def get_suppliers(status: str = None, limit: int = 50) -> List[Supplier]:
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM suppliers"
        params = []
        if status:
            query += " WHERE status = ?"
            params.append(status)
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [Supplier(
            id=row["id"],
            name=row["name"],
            contact_name=row["contact_name"],
            contact_phone=row["contact_phone"],
            contact_email=row["contact_email"],
            address=row["address"],
            business_license=row["business_license"],
            qualifications=row["qualifications"],
            credit_rating=row["credit_rating"],
            price_valid_days=row["price_valid_days"],
            payment_terms=row["payment_terms"],
            delivery_cycle=row["delivery_cycle"],
            after_sales=row["after_sales"],
            warranty_days=row["warranty_days"],
            status=row["status"],
            remark=row["remark"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        ) for row in rows]


def create_supplier_product(product: SupplierProduct) -> int:
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO supplier_products (
                supplier_id, product_type, main_category, sub_category,
                title, spec, unit, price, min_order,
                bulk_discount, delivery_cycle, warranty_days, description, image_url,
                status, keyword, created_at, updated_at
            ) VALUES (
                :supplier_id, :product_type, :main_category, :sub_category,
                :title, :spec, :unit, :price, :min_order,
                :bulk_discount, :delivery_cycle, :warranty_days, :description, :image_url,
                :status, :keyword, :created_at, :updated_at
            )
        """, {
            "supplier_id": product.supplier_id,
            "product_type": product.product_type,
            "main_category": product.main_category,
            "sub_category": product.sub_category,
            "title": product.title,
            "spec": product.spec,
            "unit": product.unit,
            "price": product.price,
            "min_order": product.min_order,
            "bulk_discount": product.bulk_discount,
            "delivery_cycle": product.delivery_cycle,
            "warranty_days": product.warranty_days,
            "description": product.description,
            "image_url": product.image_url,
            "status": product.status,
            "keyword": product.keyword,
            "created_at": now,
            "updated_at": now,
        })
        return cursor.lastrowid


def get_supplier_product_by_id(product_id: int) -> Optional[SupplierProduct]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM supplier_products WHERE id = ?", (product_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return SupplierProduct(
            id=row["id"],
            supplier_id=row["supplier_id"],
            product_type=row["product_type"],
            main_category=row["main_category"],
            sub_category=row["sub_category"],
            title=row["title"],
            spec=row["spec"],
            unit=row["unit"],
            price=row["price"],
            min_order=row["min_order"],
            bulk_discount=row["bulk_discount"],
            delivery_cycle=row["delivery_cycle"],
            warranty_days=row["warranty_days"],
            description=row["description"],
            image_url=row["image_url"],
            status=row["status"],
            keyword=row["keyword"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )


def update_supplier_product(product_id: int, **kwargs):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_db() as conn:
        cursor = conn.cursor()
        updates = ["updated_at = ?"]
        params = [now]
        for key, value in kwargs.items():
            if key in ("supplier_id", "product_type", "main_category", "sub_category",
                       "title", "spec", "unit", "price", "min_order",
                       "bulk_discount", "delivery_cycle", "warranty_days", "description",
                       "image_url", "status", "keyword"):
                updates.append(f"{key} = ?")
                params.append(value)
        params.append(product_id)
        cursor.execute(f"UPDATE supplier_products SET {', '.join(updates)} WHERE id = ?", params)


def get_supplier_products(supplier_id: int = None, product_type: str = None,
                          main_category: str = None, sub_category: str = None,
                          keyword: str = None, limit: int = 100,
                          include_inactive: bool = False) -> List[SupplierProduct]:
    with get_db() as conn:
        cursor = conn.cursor()
        if include_inactive:
            query = "SELECT * FROM supplier_products WHERE status != 'deleted'"
        else:
            query = "SELECT * FROM supplier_products WHERE status = 'active'"
        params = []
        if supplier_id:
            query += " AND supplier_id = ?"
            params.append(supplier_id)
        if product_type:
            query += " AND product_type = ?"
            params.append(product_type)
        if main_category:
            query += " AND main_category = ?"
            params.append(main_category)
        if sub_category:
            query += " AND sub_category = ?"
            params.append(sub_category)
        if keyword:
            query += " AND (title LIKE ? OR spec LIKE ? OR keyword LIKE ?)"
            params.extend([f"%{keyword}%", f"%{keyword}%", f"%{keyword}%"])
        query += " ORDER BY price ASC LIMIT ?"
        params.append(limit)
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [SupplierProduct(
            id=row["id"],
            supplier_id=row["supplier_id"],
            product_type=row["product_type"],
            main_category=row["main_category"],
            sub_category=row["sub_category"],
            title=row["title"],
            spec=row["spec"],
            unit=row["unit"],
            price=row["price"],
            min_order=row["min_order"],
            bulk_discount=row["bulk_discount"],
            delivery_cycle=row["delivery_cycle"],
            warranty_days=row["warranty_days"],
            description=row["description"],
            image_url=row["image_url"],
            status=row["status"],
            keyword=row["keyword"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        ) for row in rows]


def create_rfq(rfq: RFQRecord) -> int:
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO rfq_records (
                user_id, product_type, title, spec, quantity, unit, expected_price,
                delivery_requirement, status, assigned_supplier_id, supplier_quote,
                quote_response, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            rfq.user_id, rfq.product_type, rfq.title, rfq.spec, rfq.quantity,
            rfq.unit, rfq.expected_price, rfq.delivery_requirement, rfq.status,
            rfq.assigned_supplier_id, rfq.supplier_quote, rfq.quote_response, now, now
        ))
        return cursor.lastrowid


def get_rfq_by_id(rfq_id: int) -> Optional[RFQRecord]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM rfq_records WHERE id = ?", (rfq_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return RFQRecord(
            id=row["id"],
            user_id=row["user_id"],
            product_type=row["product_type"],
            title=row["title"],
            spec=row["spec"],
            quantity=row["quantity"],
            unit=row["unit"],
            expected_price=row["expected_price"],
            delivery_requirement=row["delivery_requirement"],
            status=row["status"],
            assigned_supplier_id=row["assigned_supplier_id"],
            supplier_quote=row["supplier_quote"],
            quote_response=row["quote_response"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )


def update_rfq(rfq_id: int, **kwargs):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_db() as conn:
        cursor = conn.cursor()
        updates = ["updated_at = ?"]
        params = [now]
        for key, value in kwargs.items():
            if key in ("product_type", "title", "spec", "quantity", "unit", "expected_price",
                       "delivery_requirement", "status", "assigned_supplier_id",
                       "supplier_quote", "quote_response"):
                updates.append(f"{key} = ?")
                params.append(value)
        params.append(rfq_id)
        cursor.execute(f"UPDATE rfq_records SET {', '.join(updates)} WHERE id = ?", params)


def get_rfq_records(user_id: int = None, status: str = None, limit: int = 50) -> List[RFQRecord]:
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM rfq_records"
        params = []
        conditions = []
        if user_id:
            conditions.append("user_id = ?")
            params.append(user_id)
        if status:
            conditions.append("status = ?")
            params.append(status)
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [RFQRecord(
            id=row["id"],
            user_id=row["user_id"],
            product_type=row["product_type"],
            title=row["title"],
            spec=row["spec"],
            quantity=row["quantity"],
            unit=row["unit"],
            expected_price=row["expected_price"],
            delivery_requirement=row["delivery_requirement"],
            status=row["status"],
            assigned_supplier_id=row["assigned_supplier_id"],
            supplier_quote=row["supplier_quote"],
            quote_response=row["quote_response"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        ) for row in rows]
