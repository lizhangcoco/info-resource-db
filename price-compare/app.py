#!/usr/bin/env python3
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, render_template, jsonify, request

from storage import database
from core.engine import get_engine
from core.analyzer import full_analysis, mark_recommendations
from core.trend import get_keyword_trends, batch_trends_to_echarts
from collectors import get_supported_platforms, get_collectors
from collectors.mock_collector import generate_history_price
from core.cleaner import clean_products


def _init_demo_data():
    if database.is_db_initialized():
        return
    demo_keywords = ["iPhone 15 Pro", "AirPods Pro 2", "戴森吹风机 HD15"]
    collectors = get_collectors()
    for keyword in demo_keywords:
        all_products = []
        for collector in collectors:
            products = collector.search(keyword, limit=12)
            all_products.extend(products)
        all_products = clean_products(all_products)
        database.batch_insert_products(all_products)
        for p in all_products:
            history = generate_history_price(p, days=30)
            database.batch_insert_price_history(history)


def create_app():
    app = Flask(__name__,
                template_folder=os.path.join(os.path.dirname(__file__), "web", "templates"),
                static_folder=os.path.join(os.path.dirname(__file__), "web", "static"))
    app.config["APPLICATION_ROOT"] = "/bijia"

    database.init_db()
    _init_demo_data()
    engine = get_engine()

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/api/platforms")
    def api_platforms():
        return jsonify({
            "platforms": get_supported_platforms()
        })

    @app.route("/api/keywords")
    def api_keywords():
        keywords = database.get_keywords()
        return jsonify({"keywords": keywords})

    @app.route("/api/search", methods=["POST"])
    def api_search():
        data = request.get_json() or {}
        keyword = data.get("keyword", "").strip()
        platforms = data.get("platforms") or get_supported_platforms()
        limit = int(data.get("limit", 15))

        if not keyword:
            return jsonify({"error": "关键词不能为空"}), 400

        record_id = engine.search_async(keyword, platforms, limit)
        return jsonify({"record_id": record_id, "status": "running"})

    @app.route("/api/search/<int:record_id>")
    def api_search_status(record_id):
        status = engine.get_task_status(record_id)
        if status.get("status") == "completed" and "result" in status:
            result = status["result"]
            return jsonify(result)
        return jsonify(status)

    @app.route("/api/products")
    def api_products():
        keyword = request.args.get("keyword", "").strip()
        platform = request.args.get("platform", "").strip() or None
        order_by = request.args.get("order_by", "price")
        sort = request.args.get("sort", "asc")
        limit = int(request.args.get("limit", 50))

        if not keyword:
            return jsonify({"products": [], "stats": {}})

        products = database.get_products_by_keyword(keyword, platform, order_by, sort, limit)
        products = mark_recommendations(products)
        stats = database.get_stats(keyword)

        return jsonify({
            "products": [p.to_dict() for p in products],
            "stats": stats.to_dict(),
        })

    @app.route("/api/products/<product_key>/trend")
    def api_product_trend(product_key):
        days = int(request.args.get("days", 30))
        from core.trend import get_product_trend, trend_to_echarts
        trend = get_product_trend(product_key, days)
        return jsonify(trend_to_echarts(trend))

    @app.route("/api/trends")
    def api_trends():
        keyword = request.args.get("keyword", "").strip()
        days = int(request.args.get("days", 30))
        limit = int(request.args.get("limit", 5))

        if not keyword:
            return jsonify({"trends": []})

        trends = get_keyword_trends(keyword, days, limit)
        return jsonify({"trends": batch_trends_to_echarts(trends)})

    @app.route("/api/stats")
    def api_stats():
        keyword = request.args.get("keyword", "").strip()
        if not keyword:
            return jsonify({})
        stats = database.get_stats(keyword)
        return jsonify(stats.to_dict())

    @app.route("/api/history")
    def api_history():
        keyword = request.args.get("keyword", "").strip() or None
        limit = int(request.args.get("limit", 20))
        records = database.get_search_records(keyword, limit)
        return jsonify({"records": [r.to_dict() for r in records]})

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
