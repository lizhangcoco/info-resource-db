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
    error_msg: Optional[str] = None
    created_at: Optional[str] = None

    def to_dict(self):
        return {
            "id": self.id,
            "keyword": self.keyword,
            "platforms": self.platforms,
            "product_count": self.product_count,
            "status": self.status,
            "error_msg": self.error_msg,
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


@dataclass
class User:
    id: Optional[int] = None
    username: str = ""
    password_hash: str = ""
    email: str = ""
    phone: str = ""
    role: str = "buyer"
    company_name: str = ""
    supplier_id: Optional[int] = None
    member_expire_at: Optional[str] = None
    status: str = "active"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "company_name": self.company_name,
            "supplier_id": self.supplier_id,
            "member_expire_at": self.member_expire_at,
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


@dataclass
class Supplier:
    id: Optional[int] = None
    name: str = ""
    contact_name: str = ""
    contact_phone: str = ""
    contact_email: str = ""
    address: str = ""
    business_license: str = ""
    qualifications: str = ""
    credit_rating: str = "A"
    price_valid_days: int = 30
    payment_terms: str = ""
    delivery_cycle: str = ""
    after_sales: str = ""
    warranty_days: int = 0
    status: str = "pending"
    remark: str = ""
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "contact_name": self.contact_name,
            "contact_phone": self.contact_phone,
            "contact_email": self.contact_email,
            "address": self.address,
            "business_license": self.business_license,
            "qualifications": self.qualifications,
            "credit_rating": self.credit_rating,
            "price_valid_days": self.price_valid_days,
            "payment_terms": self.payment_terms,
            "delivery_cycle": self.delivery_cycle,
            "after_sales": self.after_sales,
            "warranty_days": self.warranty_days,
            "status": self.status,
            "remark": self.remark,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


@dataclass
class SupplierProduct:
    id: Optional[int] = None
    supplier_id: int = 0
    product_type: str = "goods"
    main_category: str = ""
    sub_category: str = ""
    title: str = ""
    spec: str = ""
    unit: str = ""
    price: float = 0.0
    min_order: int = 1
    bulk_discount: str = ""
    delivery_cycle: str = ""
    warranty_days: int = 0
    description: str = ""
    image_url: str = ""
    status: str = "active"
    keyword: str = ""
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    def to_dict(self):
        return {
            "id": self.id,
            "supplier_id": self.supplier_id,
            "product_type": self.product_type,
            "main_category": self.main_category,
            "sub_category": self.sub_category,
            "title": self.title,
            "spec": self.spec,
            "unit": self.unit,
            "price": self.price,
            "min_order": self.min_order,
            "bulk_discount": self.bulk_discount,
            "delivery_cycle": self.delivery_cycle,
            "warranty_days": self.warranty_days,
            "description": self.description,
            "image_url": self.image_url,
            "status": self.status,
            "keyword": self.keyword,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


@dataclass
class RFQRecord:
    id: Optional[int] = None
    user_id: int = 0
    product_type: str = "goods"
    title: str = ""
    spec: str = ""
    quantity: int = 1
    unit: str = ""
    expected_price: float = 0.0
    delivery_requirement: str = ""
    status: str = "draft"
    assigned_supplier_id: Optional[int] = None
    supplier_quote: float = 0.0
    quote_response: str = ""
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "product_type": self.product_type,
            "title": self.title,
            "spec": self.spec,
            "quantity": self.quantity,
            "unit": self.unit,
            "expected_price": self.expected_price,
            "delivery_requirement": self.delivery_requirement,
            "status": self.status,
            "assigned_supplier_id": self.assigned_supplier_id,
            "supplier_quote": self.supplier_quote,
            "quote_response": self.quote_response,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
