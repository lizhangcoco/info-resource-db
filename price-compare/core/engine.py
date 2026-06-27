import threading
from datetime import datetime
from typing import List, Callable, Optional

from collectors.mock_collector import get_all_collectors as get_mock_collectors, generate_history_price
from collectors.real_collector import get_real_collectors
from core.cleaner import clean_products
from core.analyzer import full_analysis
from storage import database
from storage.models import Product, PricePoint


class CollectEngine:
    def __init__(self):
        self._active_tasks = {}

    def search(self, keyword: str, platforms: List[str] = None, limit: int = 20,
               progress_callback: Optional[Callable] = None) -> dict:
        record_id = database.create_search_record(keyword, platforms or [])
        all_products = []

        real_collectors = get_real_collectors(platforms)
        for collector in real_collectors:
            try:
                if progress_callback:
                    progress_callback(collector.platform, "collecting", 0)
                products = collector.search(keyword, limit)
                if products:
                    all_products.extend(products)
                if progress_callback:
                    progress_callback(collector.platform, "done", len(products))
            except Exception as e:
                if progress_callback:
                    progress_callback(collector.platform, "error", 0)

        if not all_products:
            if progress_callback:
                progress_callback("system", "fallback", 0)
            mock_collectors = get_mock_collectors(platforms)
            for collector in mock_collectors:
                try:
                    if progress_callback:
                        progress_callback(collector.platform, "collecting", 0)
                    products = collector.search(keyword, limit)
                    if products:
                        all_products.extend(products)
                    if progress_callback:
                        progress_callback(collector.platform, "done", len(products))
                except Exception:
                    if progress_callback:
                        progress_callback(collector.platform, "error", 0)

        all_products = clean_products(all_products)
        database.batch_insert_products(all_products)

        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        price_points = []
        for p in all_products:
            price_points.append(PricePoint(
                product_key=p.product_key,
                price=p.price,
                collected_at=now,
                keyword=keyword,
            ))
        database.batch_insert_price_history(price_points)

        database.update_search_record(record_id, product_count=len(all_products), status="completed")

        analysis = full_analysis(all_products)
        analysis["record_id"] = record_id
        return analysis

    def search_async(self, keyword: str, platforms: List[str] = None, limit: int = 20) -> int:
        record_id = database.create_search_record(keyword, platforms or [])
        self._active_tasks[record_id] = {"status": "running", "progress": {}}

        def _task():
            try:
                def _progress(platform, status, count):
                    if record_id in self._active_tasks:
                        self._active_tasks[record_id]["progress"][platform] = {
                            "status": status,
                            "count": count,
                        }

                result = self.search(keyword, platforms, limit, progress_callback=_progress)
                if record_id in self._active_tasks:
                    self._active_tasks[record_id]["status"] = "completed"
                    self._active_tasks[record_id]["result"] = result
            except Exception as e:
                if record_id in self._active_tasks:
                    self._active_tasks[record_id]["status"] = "failed"
                    self._active_tasks[record_id]["error"] = str(e)
                database.update_search_record(record_id, status="failed")

        t = threading.Thread(target=_task, daemon=True)
        t.start()
        return record_id

    def get_task_status(self, record_id: int) -> dict:
        if record_id in self._active_tasks:
            task = self._active_tasks[record_id]
            if task["status"] == "completed":
                return task
            return {
                "status": task["status"],
                "progress": task.get("progress", {}),
            }

        record = database.get_search_records(limit=1)
        for r in record:
            if r.id == record_id:
                products = database.get_products_by_keyword(r.keyword)
                return {
                    "status": r.status,
                    "product_count": r.product_count,
                    "products": [p.to_dict() for p in products],
                }
        return {"status": "not_found"}


_engine = None


def get_engine() -> CollectEngine:
    global _engine
    if _engine is None:
        _engine = CollectEngine()
    return _engine
