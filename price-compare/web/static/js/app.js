let currentProducts = [];
let currentKeyword = '';
let platformChart = null;
let trendChart = null;
let searchPollingTimer = null;
const API_BASE = window.location.pathname.split('/bijia')[0] + '/bijia';

const PLATFORM_NAMES = {
    jd: '京东',
    taobao: '淘宝',
    pinduoduo: '拼多多'
};

const PLATFORM_COLORS = {
    jd: '#e1251b',
    taobao: '#ff5000',
    pinduoduo: '#e02e24'
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
        btn.innerHTML = '<span>🔎</span> 开始比价';
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
    const maxCount = 60;

    searchPollingTimer = setInterval(async () => {
        count++;
        try {
            const res = await fetch(API_BASE + `/api/search/${recordId}`);
            const data = await res.json();

            if (data.status === 'completed' || data.products) {
                clearInterval(searchPollingTimer);
                const btn = document.getElementById('searchBtn');
                btn.disabled = false;
                btn.innerHTML = '<span>🔎</span> 开始比价';

                const products = data.products || [];
                currentProducts = products;
                renderProducts(products);
                renderStats(data.stats || {});
                renderPlatformChart(data.stats?.platform_stats || {});
                loadTrendData();
            } else if (data.status === 'failed') {
                clearInterval(searchPollingTimer);
                const btn = document.getElementById('searchBtn');
                btn.disabled = false;
                btn.innerHTML = '<span>🔎</span> 开始比价';
                document.getElementById('productList').innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">❌</div>
                        <p>采集失败</p>
                    </div>
                `;
            } else if (count >= maxCount) {
                clearInterval(searchPollingTimer);
                const btn = document.getElementById('searchBtn');
                btn.disabled = false;
                btn.innerHTML = '<span>🔎</span> 开始比价';
            }
        } catch (e) {
            console.error(e);
        }
    }, 500);
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

    list.innerHTML = sorted.map(p => {
        const isRec = recSet.has(p.product_key);
        const icon = getProductIcon(p.title);
        return `
            <div class="product-item ${isRec ? 'recommended' : ''}" onclick="window.open('${p.url}', '_blank')">
                <div class="product-image">${icon}</div>
                <div class="product-info">
                    <div class="product-tags">
                        ${isRec ? '<span class="tag recommend">💰 性价比之选</span>' : ''}
                        <span class="tag ${p.platform}">${PLATFORM_NAMES[p.platform] || p.platform}</span>
                    </div>
                    <div class="product-title">${p.title}</div>
                    <div class="product-meta">
                        <div class="product-price"><span class="unit">¥</span>${Number(p.price).toLocaleString()}</div>
                        <div class="product-stats">
                            <span>月销 ${formatSales(p.sales)}</span>
                            <span>⭐ ${p.shop_rating?.toFixed(1) || '0'}</span>
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
    document.getElementById('stat-total').textContent = (stats.total_products || 0) + ' 件';
    document.getElementById('stat-min').textContent = stats.min_price ? formatPrice(stats.min_price) : '¥0';
    document.getElementById('stat-avg').textContent = stats.avg_price ? formatPrice(stats.avg_price) : '¥0';
    document.getElementById('stat-rec').textContent = (stats.recommended_count || 0) + ' 款';
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
                textStyle: { color: '#999', fontSize: 14, fontWeight: 'normal' }
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
            formatter: '{b}<br/>均价：¥{c}'
        },
        grid: {
            left: '10%',
            right: '10%',
            top: '15%',
            bottom: '10%',
        },
        xAxis: {
            type: 'category',
            data: names,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#666', fontSize: 12 }
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
                        { offset: 1, color: colors[i] + '88' }
                    ]),
                    borderRadius: [6, 6, 0, 0]
                }
            })),
            barWidth: 40,
            label: {
                show: true,
                position: 'top',
                formatter: '¥{c}',
                fontSize: 12,
                fontWeight: 'bold',
                color: '#333'
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
                textStyle: { color: '#999', fontSize: 14, fontWeight: 'normal' }
            }
        });
        return;
    }

    const series = trends.slice(0, 4).map((t, i) => {
        const color = PLATFORM_COLORS[t.platform] || ['#1976d2', '#4caf50', '#ff9800', '#9c27b0'][i];
        return {
            name: t.title.length > 15 ? t.title.slice(0, 15) + '...' : t.title,
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 4,
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
        },
        legend: {
            bottom: 0,
            textStyle: { fontSize: 11, color: '#666' },
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
            axisLabel: { color: '#999', fontSize: 10, interval: Math.floor(dates.length / 5) }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: '#f0f0f0' } },
            axisLabel: { color: '#999', fontSize: 10, formatter: '¥{value}' }
        },
        series: series
    });
}

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
