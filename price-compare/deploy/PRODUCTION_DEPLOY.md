# 电商比价系统 - 生产部署指南

## 一、系统架构

```
用户浏览器 → Nginx (反向代理+静态文件) → Gunicorn (WSGI服务器) → Flask (应用) → SQLite (数据库)
```

---

## 二、生产环境配置步骤

### 1. 部署 systemd 服务

```bash
# 复制服务配置
cp /www/bijia-system/price-compare/deploy/bijia.service /etc/systemd/system/bijia.service

# 创建日志目录
mkdir -p /www/bijia-system/price-compare/logs

# 重载 systemd
systemctl daemon-reload

# 启动服务
systemctl start bijia

# 设置开机自启
systemctl enable bijia

# 查看服务状态
systemctl status bijia
```

### 2. 配置日志轮转

```bash
# 复制日志轮转配置
cp /www/bijia-system/price-compare/deploy/bijia-logrotate /etc/logrotate.d/bijia

# 手动测试轮转
logrotate -f /etc/logrotate.d/bijia
```

### 3. 配置自动备份

```bash
# 创建备份目录
mkdir -p /www/backups/bijia

# 添加定时任务（每天凌晨3点备份）
crontab -e

# 添加以下内容：
0 3 * * * /www/bijia-system/price-compare/deploy/backup.sh >> /www/backups/bijia/backup.log 2>&1
```

### 4. Nginx 优化配置

在 Nginx 配置文件中添加：

```nginx
# 静态文件直接由 Nginx 提供
location ^~ /bijia/static/ {
    alias /www/bijia-system/price-compare/web/static/;
    expires 30d;
    access_log off;
    add_header Cache-Control "public, immutable";
}

# 反向代理
location /bijia/ {
    proxy_pass http://127.0.0.1:8081/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_redirect off;
    proxy_read_timeout 300s;
    proxy_connect_timeout 10s;
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;
}
```

重载 Nginx：
```bash
nginx -t && nginx -s reload
```

---

## 三、日常运维命令

### 服务管理

```bash
# 启动服务
systemctl start bijia

# 停止服务
systemctl stop bijia

# 重启服务
systemctl restart bijia

# 重新加载（不中断服务）
systemctl reload bijia

# 查看状态
systemctl status bijia

# 开机自启
systemctl enable bijia

# 取消开机自启
systemctl disable bijia
```

### 查看日志

```bash
# 实时查看服务日志
journalctl -u bijia -f

# 查看最近100行日志
journalctl -u bijia -n 100 --no-pager

# 查看今天的日志
journalctl -u bijia --since today

# 查看应用访问日志
tail -f /www/bijia-system/price-compare/logs/access.log

# 查看应用错误日志
tail -f /www/bijia-system/price-compare/logs/error.log
```

### 一键部署更新

```bash
# 执行部署脚本（自动拉取代码、备份、重启）
bash /www/bijia-system/price-compare/deploy/deploy.sh
```

### 手动备份数据库

```bash
bash /www/bijia-system/price-compare/deploy/backup.sh
```

---

## 四、性能优化建议

### 1. Gunicorn Worker 数量

建议设置为 `CPU核心数 * 2 + 1`

查看 CPU 核心数：
```bash
nproc
```

修改 `/etc/systemd/system/bijia.service` 中的 `--workers` 参数，然后：
```bash
systemctl daemon-reload && systemctl restart bijia
```

### 2. 数据库优化

SQLite 数据库建议：
- 定期执行 `VACUUM` 清理
- 定期备份
- 数据量过大时考虑迁移到 PostgreSQL/MySQL

### 3. Nginx 缓存

静态文件已配置 30 天缓存，首次加载后浏览器会缓存。

---

## 五、安全加固建议

### 1. 防火墙配置

```bash
# 只开放必要端口
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-service=ssh
firewall-cmd --reload
```

### 2. 修改默认 SSH 端口

编辑 `/etc/ssh/sshd_config`，修改 Port 为自定义端口，然后：
```bash
systemctl restart sshd
```

### 3. 禁止 root 直接登录

编辑 `/etc/ssh/sshd_config`：
```
PermitRootLogin no
```

### 4. 定期更新系统

```bash
yum update -y
```

---

## 六、故障排查

### 502 Bad Gateway

检查后端服务是否运行：
```bash
systemctl status bijia
curl -I http://127.0.0.1:8081/
```

如果服务挂了，查看错误日志：
```bash
journalctl -u bijia -n 50 --no-pager
tail -50 /www/bijia-system/price-compare/logs/error.log
```

### 页面样式丢失

检查静态文件配置：
```bash
curl -I https://your-domain.com/bijia/static/css/style.css
```

确认 Nginx 配置中 `location ^~ /bijia/static/` 是否正确。

### 数据库损坏

从备份恢复：
```bash
systemctl stop bijia
cp /www/backups/bijia/price_compare_YYYYMMDD_HHMMSS.db /www/bijia-system/price-compare/data/price_compare.db
systemctl start bijia
```

---

## 七、监控建议

### 简单监控脚本

```bash
# 创建监控脚本
cat > /root/monitor-bijia.sh << 'EOF'
#!/bin/bash
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8081/)
if [ "$HTTP_CODE" != "200" ]; then
    echo "服务异常，HTTP状态码: $HTTP_CODE，正在重启..."
    systemctl restart bijia
fi
EOF

chmod +x /root/monitor-bijia.sh

# 添加到定时任务（每5分钟检查一次）
crontab -e
# 添加：
*/5 * * * * /root/monitor-bijia.sh
```

---

## 八、配置文件路径汇总

| 配置项 | 路径 |
|--------|------|
| systemd 服务 | `/etc/systemd/system/bijia.service` |
| 应用代码 | `/www/bijia-system/price-compare/` |
| 数据库 | `/www/bijia-system/price-compare/data/price_compare.db` |
| 访问日志 | `/www/bijia-system/price-compare/logs/access.log` |
| 错误日志 | `/www/bijia-system/price-compare/logs/error.log` |
| Nginx 配置 | `/www/server/panel/vhost/nginx/cdnjs-one.work.conf` |
| 备份目录 | `/www/backups/bijia/` |
| 部署脚本 | `/www/bijia-system/price-compare/deploy/deploy.sh` |
| 备份脚本 | `/www/bijia-system/price-compare/deploy/backup.sh` |
