#!/bin/bash
set -e

PROJECT_DIR="/www/bijia-system/price-compare"
BACKUP_DIR="/www/backups/bijia"
DB_FILE="$PROJECT_DIR/data/price_compare.db"
MAX_BACKUPS=30

mkdir -p "$BACKUP_DIR"

echo "开始备份数据库..."

BACKUP_FILE="$BACKUP_DIR/price_compare_$(date +%Y%m%d_%H%M%S).db"

if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$BACKUP_FILE"
    echo "备份完成: $BACKUP_FILE"
else
    echo "数据库文件不存在: $DB_FILE"
    exit 1
fi

echo "清理旧备份（保留最近 $MAX_BACKUPS 份）..."
cd "$BACKUP_DIR"
ls -t price_compare_*.db | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f 2>/dev/null || true

echo "备份任务完成！"
