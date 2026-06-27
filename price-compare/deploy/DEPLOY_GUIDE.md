# 腾讯云轻量服务器 - 部署指南

## 概述

本文档说明如何将电商比价系统部署到腾讯云轻量应用服务器，与现有网站共存。

## 部署方案

- **部署路径**: `/bijia/`（子目录方式）
- **后端端口**: `8081`
- **Web服务**: Nginx 反向代理
- **进程管理**: systemd 服务（开机自启）

---

## 方式一：一键自动部署（推荐）

### 步骤 1：上传安装脚本到服务器

在本地执行以下命令，将安装脚本上传到服务器：

```bash
scp -r deploy/ root@你的服务器IP:/www/
```

### 步骤 2：SSH 登录服务器并执行安装

```bash
ssh root@你的服务器IP
cd /www/deploy
chmod +x server-install.sh
./server-install.sh install
```

安装过程会自动：
- 创建应用目录 `/www/bijia-system`
- 克隆代码
- 安装 Python 依赖（虚拟环境）
- 配置 systemd 服务
- 启动服务

### 步骤 3：配置 Nginx

编辑 Nginx 配置文件（根据您的实际情况选择）：

```bash
# 编辑主配置文件
nano /etc/nginx/conf.d/your-site.conf

# 或编辑站点配置
nano /etc/nginx/sites-available/default
```

将 `deploy/nginx-subdir-config.conf` 中的 location 块添加到对应的 server 块内。

### 步骤 4：重载 Nginx

```bash
nginx -t && systemctl reload nginx
```

---

## 方式二：手动分步部署

### 步骤 1：安装依赖

```bash
# 安装 Python 和 pip
apt update && apt install -y python3 python3-pip python3-venv

# 安装 Nginx
apt install -y nginx

# 安装 Gunicorn
pip3 install gunicorn
```

### 步骤 2：创建应用目录并克隆代码

```bash
mkdir -p /www/bijia-system
cd /www/bijia-system
git clone https://github.com/lizhangcoco/info-resource-db.git .
git checkout trae/agent-w4LV0u
```

### 步骤 3：创建虚拟环境并安装依赖

```bash
cd /www/bijia-system/price-compare
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt -r requirements-prod.txt
```

### 步骤 4：启动后端服务

```bash
# 测试启动
source venv/bin/activate
gunicorn wsgi:app --bind 127.0.0.1:8081 --workers 2 --daemon

# 或创建 systemd 服务（推荐）
cat > /etc/systemd/system/bijia-system.service << 'EOF'
[Unit]
Description=Price Compare System
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/www/bijia-system/price-compare
Environment="PATH=/www/bijia-system/price-compare/venv/bin"
ExecStart=/www/bijia-system/price-compare/venv/bin/gunicorn wsgi:app --bind 127.0.0.1:8081 --workers 2 --timeout 120
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable bijia-system
systemctl start bijia-system
```

### 步骤 5：配置 Nginx 反向代理

```bash
nano /etc/nginx/conf.d/bijia.conf
```

写入以下内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名

    # 电商比价系统子目录
    location /bijia/ {
        proxy_pass http://127.0.0.1:8081/bijia/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 步骤 6：配置 SSL（可选，强烈推荐）

如果已有 SSL 证书：

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /bijia/ {
        proxy_pass http://127.0.0.1:8081/bijia/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 步骤 7：重载 Nginx

```bash
nginx -t && systemctl reload nginx
```

---

## 验证部署

访问以下地址验证：

- **子目录首页**: `https://your-domain.com/bijia/`
- **API接口**: `https://your-domain.com/bijia/api/platforms`
- **统计数据**: `https://your-domain.com/bijia/api/stats?keyword=iPhone`

---

## 常用运维命令

```bash
# 查看服务状态
systemctl status bijia-system

# 查看日志
journalctl -u bijia-system -f

# 重启服务
systemctl restart bijia-system

# 停止服务
systemctl stop bijia-system

# 重载 Nginx
nginx -t && systemctl reload nginx

# 查看 Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 故障排查

### 1. 服务启动失败

```bash
# 查看详细错误
journalctl -u bijia-system -n 100

# 手动测试启动
cd /www/bijia-system/price-compare
source venv/bin/activate
python wsgi.py
```

### 2. Nginx 502 Bad Gateway

- 检查后端服务是否运行：`curl http://127.0.0.1:8081/bijia/api/platforms`
- 检查 Nginx 日志：`tail -f /var/log/nginx/error.log`

### 3. 页面样式丢失

- 检查静态文件路径配置
- 确认 Nginx location 块顺序正确

---

## 目录结构

```
/www/bijia-system/          # 应用根目录
├── price-compare/          # 项目代码
│   ├── app.py             # Flask 应用
│   ├── wsgi.py            # WSGI 入口
│   ├── core/              # 核心模块
│   ├── collectors/         # 采集器
│   ├── storage/           # 数据层
│   ├── web/               # 前端资源
│   └── data/              # 数据库
├── venv/                   # Python 虚拟环境
└── bijia.log              # 日志文件
```

---

## 更新部署

```bash
cd /www/bijia-system/price-compare
git pull origin trae/agent-w4LV0u
source ../venv/bin/activate
pip install -r requirements.txt -r requirements-prod.txt -q
systemctl restart bijia-system
```
