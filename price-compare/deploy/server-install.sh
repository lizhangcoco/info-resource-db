#!/bin/bash
# ============================================================
# 电商比价系统 - 服务管理脚本
# 使用 systemctl 管理服务，支持开机自启
# ============================================================

APP_NAME="bijia-system"
APP_DIR="/www/bijia-system"
PORT=8081
SUBPATH="/bijia"
PYTHON_BIN="/www/bijia-system/venv/bin/python"
WSGI_FILE="$APP_DIR/wsgi.py"
PID_FILE="$APP_DIR/bijia.pid"
LOG_FILE="$APP_DIR/bijia.log"

# systemd 服务文件内容
SYSTEMD_SERVICE="[Unit]
Description=Price Compare System
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
Environment=\"PATH=$APP_DIR/venv/bin\"
ExecStart=$APP_DIR/venv/bin/gunicorn wsgi:app --bind 127.0.0.1:$PORT --workers 2 --timeout 120 --access-logfile $LOG_FILE --error-logfile $LOG_FILE --pid $PID_FILE
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
"

# 创建应用目录
create_dir() {
    echo "[1/5] 创建应用目录..."
    mkdir -p $APP_DIR
    echo "      目录已创建: $APP_DIR"
}

# 克隆代码
clone_code() {
    echo "[2/5] 克隆代码..."
    if [ -d "$APP_DIR/.git" ]; then
        echo "      代码已存在，跳过克隆"
    else
        git clone https://github.com/lizhangcoco/info-resource-db.git $APP_DIR
        cd $APP_DIR && git checkout trae/agent-w4LV0u
        echo "      代码已克隆到 $APP_DIR"
    fi
}

# 安装依赖
install_deps() {
    echo "[3/5] 安装依赖..."
    cd $APP_DIR

    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi

    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt -r requirements-prod.txt
    echo "      依赖安装完成"
}

# 配置服务
setup_service() {
    echo "[4/5] 配置系统服务..."
    cat > /etc/systemd/system/${APP_NAME}.service << EOF
$SYSTEMD_SERVICE
EOF
    systemctl daemon-reload
    echo "      服务文件已创建: /etc/systemd/system/${APP_NAME}.service"
}

# 启动服务
start_service() {
    echo "[5/5] 启动服务..."
    systemctl enable $APP_NAME
    systemctl restart $APP_NAME
    sleep 2

    if systemctl is-active --quiet $APP_NAME; then
        echo "      ✅ 服务启动成功！"
        echo ""
        echo "      服务状态: 运行中"
        echo "      监听端口: $PORT"
        echo "      子路径:   $SUBPATH"
    else
        echo "      ❌ 服务启动失败，请检查日志: journalctl -u $APP_NAME -n 50"
    fi
}

# 完整安装
install() {
    echo "=========================================="
    echo "  电商比价系统 - 一键安装脚本"
    echo "=========================================="
    echo ""

    create_dir
    clone_code
    install_deps
    setup_service
    start_service

    echo ""
    echo "=========================================="
    echo "  安装完成！"
    echo "=========================================="
    echo ""
    echo "常用命令："
    echo "  查看状态:  systemctl status $APP_NAME"
    echo "  查看日志:  journalctl -u $APP_NAME -f"
    echo "  重启服务:  systemctl restart $APP_NAME"
    echo "  停止服务:  systemctl stop $APP_NAME"
    echo ""
}

# 卸载
uninstall() {
    echo "卸载 $APP_NAME..."
    systemctl stop $APP_NAME
    systemctl disable $APP_NAME
    rm -f /etc/systemd/system/${APP_NAME}.service
    systemctl daemon-reload
    echo "卸载完成（应用目录 $APP_DIR 未删除，如需删除请手动处理）"
}

# 查看状态
status() {
    systemctl status $APP_NAME --no-pager
}

# 查看日志
logs() {
    journalctl -u $APP_NAME -n 50 --no-pager
}

# 显示帮助
show_help() {
    echo "用法: $0 {install|uninstall|status|logs|restart|stop|start}"
    echo ""
    echo "命令说明："
    echo "  install   - 完整安装并启动服务"
    echo "  uninstall - 卸载服务"
    echo "  status    - 查看服务状态"
    echo "  logs      - 查看最近 50 行日志"
    echo "  restart   - 重启服务"
    echo "  stop      - 停止服务"
    echo "  start     - 启动服务"
}

# 主逻辑
case "$1" in
    install)
        install
        ;;
    uninstall)
        uninstall
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    restart)
        systemctl restart $APP_NAME && echo "服务已重启"
        ;;
    stop)
        systemctl stop $APP_NAME && echo "服务已停止"
        ;;
    start)
        systemctl start $APP_NAME && echo "服务已启动"
        ;;
    *)
        show_help
        ;;
esac
