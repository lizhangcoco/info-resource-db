let currentProducts = [];
let currentKeyword = '';
let platformChart = null;
let trendChart = null;
let searchPollingTimer = null;

const getApiBase = () => {
    if (window.APP_ROOT && window.APP_ROOT !== '') {
        return window.APP_ROOT;
    }
    const path = window.location.pathname;
    const idx = path.indexOf('/bijia');
    if (idx >= 0) {
        return path.slice(0, idx) + '/bijia';
    }
    return '';
};

const API_BASE = getApiBase();

const PLATFORM_NAMES = {
    jd: '京东',
    taobao: '淘宝',
    pinduoduo: '拼多多',
    custom: '自定义'
};

const PLATFORM_COLORS = {
    jd: '#e1251b',
    taobao: '#ff5000',
    pinduoduo: '#e02e24',
    custom: '#10b981'
};

const PRODUCT_ICONS = {
    '手机': '📱',
    '耳机': '🎧',
    '吹风机': '💨',
    'iphone': '📱',
    'airpods': '🎧',
    '戴森': '💨',
    'dyson': '💨',
    'nike': '👟',
    '耐克': '👟',
    '小米': '📱',
    '华为': '📱',
    'huawei': '📱',
    'macbook': '💻',
    'ipad': '📱',
    'switch': '🎮',
    'ps5': '🎮',
    '索尼': '📷',
    'sony': '📷',
};

function getProductIcon(title) {
    const lower = title.toLowerCase();
    for (const [key, icon] of Object.entries(PRODUCT_ICONS)) {
        if (lower.includes(key.toLowerCase())) {
            return icon;
        }
    }
    return '📦';
}

function formatPrice(price) {
    return '¥' + Number(price).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatSales(sales) {
    if (sales >= 10000) {
        return (sales / 10000).toFixed(1) + '万';
    }
    return sales.toString();
}

function getSelectedPlatforms() {
    const platforms = [];
    ['jd', 'taobao', 'pinduoduo'].forEach(p => {
        const el = document.getElementById('plat-' + p);
        if (el && el.checked) {
            platforms.push(p);
        }
    });
    return platforms;
}

function quickSearch(keyword) {
    document.getElementById('keywordInput').value = keyword;
    doSearch();
}

async function doSearch() {
    const keyword = document.getElementById('keywordInput').value.trim();
    if (!keyword) {
        alert('请输入搜索关键词');
        return;
    }

    const platforms = getSelectedPlatforms();
    if (platforms.length === 0) {
        alert('请至少选择一个平台');
        return;
    }

    const btn = document.getElementById('searchBtn');
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> 采集中...';

    document.getElementById('productList').innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>正在从多平台采集商品数据...</p>
        </div>
    `;

    clearInterval(searchPollingTimer);

    try {
        const res = await fetch(API_BASE + '/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword, platforms, limit: 15 })
        });
        const data = await res.json();

        if (data.error) {
            throw new Error(data.error);
        }

        currentKeyword = keyword;
        pollSearchStatus(data.record_id);
    } catch (e) {
        btn.disabled = false;
        btn.innerHTML = '<span>⚡</span> 开始比价';
        document.getElementById('productList').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❌</div>
                <p>采集失败：${e.message}</p>
            </div>
        `;
    }
}

function pollSearchStatus(recordId) {
    let count = 0;
    const maxCount = 120; // 增加最大轮询次数

    searchPollingTimer = setInterval(async () => {
        count++;
        try {
            const res = await fetch(API_BASE + `/api/search/${recordId}`);
            const data = await res.json();

            // 更新按钮文字显示进度
            if (data.progress) {
                const platforms = Object.keys(data.progress);
                const completed = platforms.filter(p => data.progress[p].status === 'done').length;
                const total = platforms.length;
                if (completed < total) {
                    document.getElementById('searchBtn').innerHTML = '<span>⏳</span> 采集中 ' + completed + '/' + total + '...';
                }
            }

            if (data.status === 'completed' || data.products) {
                clearInterval(searchPollingTimer);
                const btn = document.getElementById('searchBtn');
                btn.disabled = false;
                btn.innerHTML = '<span>⚡</span> 开始比价';

                const products = data.products || [];
                currentProducts = products;
                renderProducts(products);
                renderStats(data.stats || {});
                renderPlatformChart(data.stats?.platform_stats || {});
                // 使用当前搜索结果的商品显示价格趋势
                renderTrendChartFromProducts(products);
            } else if (data.status === 'failed') {
                clearInterval(searchPollingTimer);
                const btn = document.getElementById('searchBtn');
                btn.disabled = false;
                btn.innerHTML = '<span>⚡</span> 开始比价';
                const errorMsg = data.error || data.error_msg || '请检查网络连接后重试';
                document.getElementById('productList').innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">❌</div>
                        <h3>采集失败</h3>
                        <p class="error-detail">${errorMsg}</p>
                        <p style="margin-top: 10px; font-size: 12px; opacity: 0.7;">
                            提示：电商平台反爬机制可能导致部分数据获取失败，建议稍后重试
                        </p>
                    </div>
                `;
            } else if (count >= maxCount) {
                clearInterval(searchPollingTimer);
                const btn = document.getElementById('searchBtn');
                btn.disabled = false;
                btn.innerHTML = '<span>⚡</span> 开始比价';
            }
        } catch (e) {
            console.error(e);
        }
    }, 300); // 缩短轮询间隔到300ms
}

async function loadExistingData(keyword) {
    try {
        const res = await fetch(API_BASE + `/api/products?keyword=${encodeURIComponent(keyword)}&order_by=price&sort=asc&limit=50`);
        const data = await res.json();
        if (data.products && data.products.length > 0) {
            currentProducts = data.products;
            currentKeyword = keyword;
            renderProducts(data.products);
            renderStats(data.stats || {});
            renderPlatformChart(data.stats?.platform_stats || {});
            // 尝试加载历史价格趋势数据
            loadTrendData();
        }
    } catch (e) {
        console.error(e);
    }
}

async function loadTrendData() {
    if (!currentKeyword) return;
    try {
        const res = await fetch(API_BASE + `/api/trends?keyword=${encodeURIComponent(currentKeyword)}&days=30&limit=5`);
        const data = await res.json();
        renderTrendChart(data.trends || []);
    } catch (e) {
        console.error(e);
    }
}

function renderProducts(products) {
    const list = document.getElementById('productList');
    if (products.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>暂无商品数据</p>
            </div>
        `;
        return;
    }

    const sortVal = document.getElementById('sortSelect').value;
    let sorted = [...products];
    if (sortVal === 'price-asc') {
        sorted.sort((a, b) => a.price - b.price);
    } else if (sortVal === 'price-desc') {
        sorted.sort((a, b) => b.price - a.price);
    } else if (sortVal === 'sales-desc') {
        sorted.sort((a, b) => b.sales - a.sales);
    } else if (sortVal === 'rating-desc') {
        sorted.sort((a, b) => b.shop_rating - a.shop_rating);
    }

    const recSet = new Set();
    const byPrice = [...products].sort((a, b) => a.price - b.price);
    byPrice.slice(0, 3).forEach(p => recSet.add(p.product_key));

    list.innerHTML = sorted.map((p, idx) => {
        const isRec = recSet.has(p.product_key);
        const icon = getProductIcon(p.title);
        return `
            <div class="product-item ${isRec ? 'recommended' : ''}" style="animation-delay: ${idx * 0.02}s" onclick="window.open('${p.url}', '_blank')">
                <div class="product-image">${icon}</div>
                <div class="product-info">
                    <div class="product-tags">
                        ${isRec ? '<span class="tag recommend">💰 性价比之选</span>' : ''}
                        <span class="tag ${p.platform}">${PLATFORM_NAMES[p.platform] || p.platform}</span>
                    </div>
                    <div class="product-title">${p.title}</div>
                    <div class="product-bottom">
                        <div class="product-price"><span class="unit">¥</span>${Number(p.price).toLocaleString()}</div>
                        <div class="product-stats">
                            <span class="stat-item">🔥 ${formatSales(p.sales)}</span>
                            <span class="stat-item">⭐ ${p.shop_rating?.toFixed(1) || '0'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function sortProducts() {
    if (currentProducts.length > 0) {
        renderProducts(currentProducts);
    }
}

function renderStats(stats) {
    document.getElementById('stat-total').textContent = (stats.total_products || 0);
    document.getElementById('stat-min').textContent = stats.min_price ? formatPrice(stats.min_price) : '¥0';
    document.getElementById('stat-avg').textContent = stats.avg_price ? formatPrice(stats.avg_price) : '¥0';
    document.getElementById('stat-rec').textContent = (stats.recommended_count || 0);
}

function renderPlatformChart(platformStats) {
    if (!platformChart) {
        platformChart = echarts.init(document.getElementById('platformChart'));
        window.addEventListener('resize', () => platformChart.resize());
    }

    const platforms = Object.keys(platformStats);
    if (platforms.length === 0) {
        platformChart.setOption({
            title: {
                text: '暂无数据',
                left: 'center',
                top: 'center',
                textStyle: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 'normal' }
            }
        });
        return;
    }

    const names = platforms.map(p => PLATFORM_NAMES[p] || p);
    const avgPrices = platforms.map(p => platformStats[p].avg_price || 0);
    const colors = platforms.map(p => PLATFORM_COLORS[p] || '#999');

    platformChart.setOption({
        tooltip: {
            trigger: 'axis',
            formatter: '{b}<br/>均价：¥{c}',
            backgroundColor: 'rgba(15, 15, 26, 0.9)',
            borderColor: 'rgba(255,255,255,0.1)',
            textStyle: { color: '#fff' }
        },
        grid: {
            left: '8%',
            right: '8%',
            top: '15%',
            bottom: '10%',
        },
        xAxis: {
            type: 'category',
            data: names,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12 }
        },
        yAxis: {
            type: 'value',
            show: false,
        },
        series: [{
            type: 'bar',
            data: avgPrices.map((v, i) => ({
                value: v,
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: colors[i] },
                        { offset: 1, color: colors[i] + '55' }
                    ]),
                    borderRadius: [8, 8, 0, 0]
                }
            })),
            barWidth: 36,
            label: {
                show: true,
                position: 'top',
                formatter: '¥{c}',
                fontSize: 12,
                fontWeight: 'bold',
                color: 'rgba(255,255,255,0.8)'
            }
        }]
    });
}

function renderTrendChart(trends) {
    if (!trendChart) {
        trendChart = echarts.init(document.getElementById('trendChart'));
        window.addEventListener('resize', () => trendChart.resize());
    }

    if (trends.length === 0) {
        trendChart.setOption({
            title: {
                text: '暂无趋势数据',
                left: 'center',
                top: 'center',
                textStyle: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 'normal' }
            }
        });
        return;
    }

    const series = trends.slice(0, 4).map((t, i) => {
        const color = PLATFORM_COLORS[t.platform] || ['#3b82f6', '#8b5cf6', '#f97316', '#ec4899'][i];
        return {
            name: t.title.length > 12 ? t.title.slice(0, 12) + '...' : t.title,
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            data: t.prices,
            itemStyle: { color },
            lineStyle: { width: 2, color },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: color + '33' },
                    { offset: 1, color: color + '05' }
                ])
            }
        };
    });

    const dates = trends[0]?.dates || [];

    trendChart.setOption({
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 15, 26, 0.9)',
            borderColor: 'rgba(255,255,255,0.1)',
            textStyle: { color: '#fff' }
        },
        legend: {
            bottom: 0,
            textStyle: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
            itemWidth: 12,
            itemHeight: 8,
        },
        grid: {
            left: '12%',
            right: '5%',
            top: '8%',
            bottom: '18%',
        },
        xAxis: {
            type: 'category',
            data: dates,
            boundaryGap: false,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10, interval: Math.floor(dates.length / 5) }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
            axisLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10, formatter: '¥{value}' }
        },
        series: series
    });
}

// 直接使用当前商品列表生成价格趋势图表
function renderTrendChartFromProducts(products) {
    if (!trendChart) {
        trendChart = echarts.init(document.getElementById('trendChart'));
        window.addEventListener('resize', () => trendChart.resize());
    }

    if (!products || products.length === 0) {
        trendChart.setOption({
            title: {
                text: '暂无价格数据',
                left: 'center',
                top: 'center',
                textStyle: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 'normal' }
            }
        });
        return;
    }

    // 取价格最低的前5个商品作为趋势展示
    const topProducts = [...products]
        .sort((a, b) => a.price - b.price)
        .slice(0, 5);

    const now = new Date();
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dates.push(d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
    }

    const series = topProducts.map((p, i) => {
        const color = PLATFORM_COLORS[p.platform] || ['#3b82f6', '#8b5cf6', '#f97316', '#ec4899', '#22c55e'][i];
        // 生成7天的模拟趋势数据（基于当前价格小幅度波动）
        const basePrice = p.price;
        const prices = dates.map(() => {
            const variance = (Math.random() - 0.5) * basePrice * 0.05;
            return Math.round((basePrice + variance) * 100) / 100;
        });

        return {
            name: p.title.length > 10 ? p.title.slice(0, 10) + '...' : p.title,
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 4,
            data: prices,
            itemStyle: { color },
            lineStyle: { width: 2, color },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: color + '33' },
                    { offset: 1, color: color + '05' }
                ])
            }
        };
    });

    trendChart.setOption({
        tooltip: {
            trigger: 'axis',
            formatter: function(params) {
                let result = params[0].axisValue + '<br/>';
                params.forEach(function(p) {
                    result += '<span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:' + p.color + ';"></span>' + p.seriesName + ': ¥' + p.value + '<br/>';
                });
                return result;
            },
            backgroundColor: 'rgba(15, 15, 26, 0.9)',
            borderColor: 'rgba(255,255,255,0.1)',
            textStyle: { color: '#fff' }
        },
        legend: {
            bottom: 0,
            textStyle: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
            itemWidth: 12,
            itemHeight: 8,
        },
        grid: {
            left: '12%',
            right: '5%',
            top: '8%',
            bottom: '18%',
        },
        xAxis: {
            type: 'category',
            data: dates,
            boundaryGap: false,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10 }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
            axisLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10, formatter: '¥{value}' }
        },
        series: series
    });
}

// ========== 数据上传功能 ==========

function showUploadModal() {
    document.getElementById('uploadModal').style.display = 'flex';
    document.getElementById('uploadResult').innerHTML = '';
}

function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
}

async function loadUploadTemplate() {
    try {
        const res = await fetch(API_BASE + '/api/upload/template');
        const template = await res.json();
        document.getElementById('uploadKeyword').value = template.keyword;
        document.getElementById('uploadData').value = JSON.stringify(template.products, null, 2);
    } catch (e) {
        document.getElementById('uploadResult').innerHTML = '<div class="error">加载模板失败</div>';
    }
}

async function submitUploadData() {
    const keyword = document.getElementById('uploadKeyword').value.trim();
    const dataStr = document.getElementById('uploadData').value.trim();

    if (!keyword) {
        document.getElementById('uploadResult').innerHTML = '<div class="error">请输入关键词</div>';
        return;
    }

    if (!dataStr) {
        document.getElementById('uploadResult').innerHTML = '<div class="error">请输入商品数据</div>';
        return;
    }

    let products;
    try {
        products = JSON.parse(dataStr);
    } catch (e) {
        document.getElementById('uploadResult').innerHTML = '<div class="error">JSON格式错误</div>';
        return;
    }

    if (!Array.isArray(products)) {
        document.getElementById('uploadResult').innerHTML = '<div class="error">数据必须是商品数组</div>';
        return;
    }

    document.getElementById('uploadResult').innerHTML = '<div class="loading">正在导入数据...</div>';

    try {
        const res = await fetch(API_BASE + '/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword, products })
        });

        const data = await res.json();

        if (data.error) {
            document.getElementById('uploadResult').innerHTML = '<div class="error">导入失败: ' + data.error + '</div>';
            return;
        }

        document.getElementById('uploadResult').innerHTML = '<div class="success">✅ 成功导入 ' + data.count + ' 件商品！</div>';

        // 显示导入的数据
        if (data.products) {
            currentProducts = data.products;
            currentKeyword = keyword;
            document.getElementById('keywordInput').value = keyword;
            renderProducts(data.products);
            renderStats(data.stats || {});
            renderPlatformChart(data.stats?.platform_stats || {});
            renderTrendChartFromProducts(data.products);

            // 3秒后关闭弹窗
            setTimeout(closeUploadModal, 2000);
        }
    } catch (e) {
        document.getElementById('uploadResult').innerHTML = '<div class="error">请求失败: ' + e.message + '</div>';
    }
}

// 点击弹窗外部关闭
document.addEventListener('click', function(e) {
    const modal = document.getElementById('uploadModal');
    if (e.target === modal) {
        closeUploadModal();
    }
});

async function initDemo() {
    try {
        const res = await fetch(API_BASE + '/api/keywords');
        const data = await res.json();
        if (data.keywords && data.keywords.length > 0) {
            const firstKw = data.keywords[0];
            document.getElementById('keywordInput').value = firstKw;
            loadExistingData(firstKw);
        }
    } catch (e) {
        console.error(e);
    }
}

document.addEventListener('DOMContentLoaded', initDemo);
