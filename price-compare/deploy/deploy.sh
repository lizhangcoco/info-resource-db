#!/bin/bash
set -e

PROJECT_DIR="/www/bijia-system/price-compare"
VENV_DIR="$PROJECT_DIR/venv"
LOG_DIR="$PROJECT_DIR/logs"
BACKUP_DIR="/www/backups/bijia"
DB_FILE="$PROJECT_DIR/data/price_compare.db"

echo "=========================================="
echo "  电商比价系统 - 生产部署脚本"
echo "=========================================="

mkdir -p "$LOG_DIR"
mkdir -p "$BACKUP_DIR"
mkdir -p "$PROJECT_DIR/data"

echo ""
echo "[1/6] 更新代码..."
cd /www/bijia-system
git pull origin trae/agent-w4LV0u
echo "代码更新完成"

echo ""
echo "[2/6] 安装/更新依赖..."
cd "$PROJECT_DIR"
source "$VENV_DIR/bin/activate"
pip install -r requirements.txt gunicorn --upgrade
echo "依赖安装完成"

echo ""
echo "[3/6] 备份数据库..."
if [ -f "$DB_FILE" ]; then
    BACKUP_FILE="$BACKUP_DIR/price_compare_$(date +%Y%m%d_%H%M%S).db"
    cp "$DB_FILE" "$BACKUP_FILE"
    echo "数据库已备份到: $BACKUP_FILE"
fi

echo ""
echo "[4/6] 停止旧服务..."
systemctl stop bijia 2>/dev/null || true
pkill -f gunicorn 2>/dev/null || true
sleep 2
echo "旧服务已停止"

echo ""
echo "[5/6] 启动新服务..."
systemctl daemon-reload
systemctl start bijia
sleep 3

if systemctl is-active --quiet bijia; then
    echo "服务启动成功！"
else
    echo "服务启动失败，查看日志："
    journalctl -u bijia -n 20 --no-pager
    exit 1
fi

echo ""
echo "[6/6] 验证服务状态..."
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8081/)
if [ "$HTTP_CODE" = "200" ]; then
    echo "HTTP 验证通过: 200 OK"
else
    echo "HTTP 验证失败: $HTTP_CODE"
fi

echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "服务状态: systemctl status bijia"
echo "查看日志: journalctl -u bijia -f"
echo "访问地址: https://cdnjs-one.work/bijia/"
echo ""
