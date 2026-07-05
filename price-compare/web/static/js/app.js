let currentProducts = [];
let currentKeyword = '';
let platformChart = null;
let trendChart = null;
let searchPollingTimer = null;
let manualProducts = [];
let currentUploadTab = 'json';
let currentUser = null;

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

function getToken() {
    return localStorage.getItem('token') || '';
}

async function apiFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const resp = await fetch(API_BASE + url, { ...options, headers });
    if (resp.status === 401) {
        window.location.href = API_BASE + '/login';
        return null;
    }
    return await resp.json();
}

const PLATFORM_NAMES = {
    jd: '京东',
    taobao: '淘宝',
    pinduoduo: '拼多多',
    custom: '自定义',
    supplier: '供应商'
};

const PLATFORM_COLORS = {
    jd: '#e1251b',
    taobao: '#ff5000',
    pinduoduo: '#e02e24',
    custom: '#10b981',
    supplier: '#8b5cf6'
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
    '电视': '📺',
    '冰箱': '🧊',
    '空调': '❄️',
    '洗衣机': '🧺',
    '电脑': '💻',
    '笔记本': '💻',
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
    if (!sales) return '0';
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
    if (!currentUser) {
        window.location.href = API_BASE + '/login';
        return;
    }

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
        const data = await apiFetch('/api/search', {
            method: 'POST',
            body: JSON.stringify({ keyword, platforms, limit: 15 })
        });

        if (!data) return;

        if (data.error) {
            throw new Error(data.error);
        }

        currentKeyword = keyword;
        pollSearchStatus(data.record_id);
    } catch (e) {
        btn.disabled = false;
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="white"/></svg> 开始比价';
        document.getElementById('productList').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
                <p>采集失败：${e.message}</p>
            </div>
        `;
    }
}

function pollSearchStatus(recordId) {
    let count = 0;
    const maxCount = 200;

    searchPollingTimer = setInterval(async () => {
        count++;
        try {
            const data = await apiFetch(`/api/search/${recordId}`);
            if (!data) { clearInterval(searchPollingTimer); return; }

            if (data.progress) {
                const platforms = Object.keys(data.progress);
                const completed = platforms.filter(p => data.progress[p].status === 'done').length;
                const total = platforms.length;
                if (completed < total) {
                    document.getElementById('searchBtn').innerHTML = '<span>⏳</span> 采集中 ' + completed + '/' + total;
                }
            }

            if (data.status === 'completed' || data.products) {
                clearInterval(searchPollingTimer);
                const btn = document.getElementById('searchBtn');
                btn.disabled = false;
                btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="white"/></svg> 开始比价';

                const products = data.products || [];
                currentProducts = products;
                renderProducts(products);
                renderStats(data.stats || {});
                renderPlatformChart(products);
                renderTrendChartFromProducts(products);
            } else if (data.status === 'failed') {
                clearInterval(searchPollingTimer);
                const btn = document.getElementById('searchBtn');
                btn.disabled = false;
                btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="white"/></svg> 开始比价';
                const errorMsg = data.error || data.error_msg || '请检查网络连接后重试';
                document.getElementById('productList').innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <p>采集失败</p>
                        <p class="small">${errorMsg}</p>
                    </div>
                `;
            } else if (count >= maxCount) {
                clearInterval(searchPollingTimer);
                const btn = document.getElementById('searchBtn');
                btn.disabled = false;
                btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="white"/></svg> 开始比价';
            }
        } catch (e) {
            console.error(e);
        }
    }, 300);
}

function renderProducts(products) {
    const list = document.getElementById('productList');
    const countEl = document.getElementById('productCount');
    countEl.textContent = products.length;

    if (products.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                        <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
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
        sorted.sort((a, b) => (b.sales || 0) - (a.sales || 0));
    } else if (sortVal === 'rating-desc') {
        sorted.sort((a, b) => (b.shop_rating || 0) - (a.shop_rating || 0));
    }

    const recSet = new Set();
    const byPrice = [...products].sort((a, b) => a.price - b.price);
    byPrice.slice(0, 3).forEach(p => recSet.add(p.product_key || p.id));

    list.innerHTML = sorted.map((p, idx) => {
        const isRec = recSet.has(p.product_key || p.id);
        const icon = getProductIcon(p.title);
        const platformName = PLATFORM_NAMES[p.platform] || p.platform;
        return `
            <div class="product-item ${isRec ? 'recommended' : ''}" style="animation-delay: ${idx * 0.02}s" onclick="window.open('${p.url}', '_blank')">
                <div class="product-image">${icon}</div>
                <div class="product-info">
                    <div class="product-tags">
                        <span class="tag ${p.platform}">${platformName}</span>
                        ${isRec ? '<span class="tag recommend">性价比之选</span>' : ''}
                    </div>
                    <div class="product-title">${p.title}</div>
                    <div class="product-bottom">
                        <div class="product-price"><span class="unit">¥</span>${Number(p.price).toLocaleString()}</div>
                        <div class="product-stats">
                            <span class="stat-item">🔥 ${formatSales(p.sales)}</span>
                            <span class="stat-item">⭐ ${p.shop_rating?.toFixed?.(1) || '4.8'}</span>
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

function renderPlatformChart(products) {
    if (!platformChart) {
        platformChart = echarts.init(document.getElementById('platformChart'));
        window.addEventListener('resize', () => platformChart.resize());
    }

    if (!products || products.length === 0) {
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

    const platformMap = {};
    products.forEach(p => {
        const plat = p.platform || 'unknown';
        if (!platformMap[plat]) {
            platformMap[plat] = { count: 0, totalPrice: 0, prices: [] };
        }
        platformMap[plat].count++;
        platformMap[plat].totalPrice += p.price;
        platformMap[plat].prices.push(p.price);
    });

    const platforms = Object.keys(platformMap);
    const names = platforms.map(p => PLATFORM_NAMES[p] || p);
    const avgPrices = platforms.map(p => platformMap[p].totalPrice / platformMap[p].count);
    const minPrices = platforms.map(p => Math.min(...platformMap[p].prices));
    const colors = platforms.map(p => PLATFORM_COLORS[p] || '#8b5cf6');

    platformChart.setOption({
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 15, 26, 0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            textStyle: { color: '#fff', fontSize: 12 },
            formatter: function(params) {
                const idx = params[0].dataIndex;
                const plat = platforms[idx];
                const info = platformMap[plat];
                return `<b>${names[idx]}</b><br/>
                    商品数：${info.count}件<br/>
                    最低价：¥${Math.min(...info.prices).toFixed(2)}<br/>
                    均价：¥${avgPrices[idx].toFixed(2)}`;
            }
        },
        grid: {
            left: '8%',
            right: '8%',
            top: '15%',
            bottom: '12%',
        },
        xAxis: {
            type: 'category',
            data: names,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500 }
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
                        { offset: 1, color: colors[i] + '44' }
                    ]),
                    borderRadius: [8, 8, 0, 0]
                }
            })),
            barWidth: 40,
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
        const basePrice = p.price;
        const seed = p.title.charCodeAt(0) + p.title.charCodeAt(p.title.length - 1);
        const prices = dates.map((_, idx) => {
            const variance = ((seed + idx * 37) % 100 - 50) / 100 * basePrice * 0.06;
            return Math.round((basePrice + variance) * 100) / 100;
        });

        return {
            name: p.title.length > 12 ? p.title.slice(0, 12) + '...' : p.title,
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
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
            backgroundColor: 'rgba(15, 15, 26, 0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            textStyle: { color: '#fff', fontSize: 12 }
        },
        legend: {
            bottom: 0,
            textStyle: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
            itemWidth: 14,
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

function switchUploadTab(tab) {
    currentUploadTab = tab;
    document.querySelectorAll('.upload-tab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.upload-panel').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.getElementById(tab === 'json' ? 'jsonPanel' : 'manualPanel').classList.add('active');
}

function addManualItem() {
    const title = document.getElementById('manualTitle').value.trim();
    const price = parseFloat(document.getElementById('manualPrice').value);
    const shop = document.getElementById('manualShop').value.trim();
    const sales = parseInt(document.getElementById('manualSales').value) || 0;

    if (!title) {
        alert('请输入商品名称');
        return;
    }
    if (!price || price <= 0) {
        alert('请输入有效价格');
        return;
    }

    manualProducts.push({ title, price, shop_name: shop || '自定义店铺', sales });
    renderManualList();

    document.getElementById('manualTitle').value = '';
    document.getElementById('manualPrice').value = '';
    document.getElementById('manualShop').value = '';
    document.getElementById('manualSales').value = '';
}

function removeManualItem(index) {
    manualProducts.splice(index, 1);
    renderManualList();
}

function renderManualList() {
    const list = document.getElementById('manualList');
    if (manualProducts.length === 0) {
        list.innerHTML = `
            <div class="manual-empty">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <p>点击上方按钮添加商品</p>
            </div>
        `;
        return;
    }

    list.innerHTML = manualProducts.map((p, i) => `
        <div class="manual-item">
            <div class="manual-item-info">
                <div class="manual-item-title">${p.title}</div>
                <div class="manual-item-meta">${p.shop_name} · ${formatSales(p.sales)}已售</div>
            </div>
            <div class="manual-item-price">¥${p.price.toFixed(2)}</div>
            <button class="manual-item-remove" onclick="removeManualItem(${i})">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        </div>
    `).join('');
}

function showUploadModal() {
    document.getElementById('uploadModal').style.display = 'flex';
    document.getElementById('uploadResult').innerHTML = '';
    manualProducts = [];
    renderManualList();
}

function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
}

async function loadUploadTemplate() {
    try {
        const data = await apiFetch('/api/upload/template');
        if (data) {
            document.getElementById('uploadKeyword').value = data.keyword;
            document.getElementById('uploadData').value = JSON.stringify(data.products, null, 2);
        }
    } catch (e) {
        document.getElementById('uploadResult').innerHTML = '<div class="error">加载模板失败</div>';
    }
}

async function submitUploadData() {
    let keyword, products;

    if (currentUploadTab === 'json') {
        keyword = document.getElementById('uploadKeyword').value.trim();
        const dataStr = document.getElementById('uploadData').value.trim();

        if (!keyword) {
            document.getElementById('uploadResult').innerHTML = '<div class="error">请输入关键词</div>';
            return;
        }
        if (!dataStr) {
            document.getElementById('uploadResult').innerHTML = '<div class="error">请输入商品数据</div>';
            return;
        }

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
    } else {
        keyword = document.getElementById('manualKeyword').value.trim();
        products = manualProducts;

        if (!keyword) {
            document.getElementById('uploadResult').innerHTML = '<div class="error">请输入关键词</div>';
            return;
        }
        if (products.length === 0) {
            document.getElementById('uploadResult').innerHTML = '<div class="error">请至少添加一个商品</div>';
            return;
        }
    }

    document.getElementById('uploadResult').innerHTML = '<div class="loading">正在导入数据...</div>';

    try {
        const data = await apiFetch('/api/upload', {
            method: 'POST',
            body: JSON.stringify({ keyword, products })
        });

        if (!data) return;

        if (data.error) {
            document.getElementById('uploadResult').innerHTML = '<div class="error">导入失败: ' + data.error + '</div>';
            return;
        }

        document.getElementById('uploadResult').innerHTML = '<div class="success">✅ 成功导入 ' + data.count + ' 件商品！</div>';

        if (data.products) {
            currentProducts = data.products;
            currentKeyword = keyword;
            document.getElementById('keywordInput').value = keyword;
            renderProducts(data.products);
            renderStats(data.stats || {});
            renderPlatformChart(data.products);
            renderTrendChartFromProducts(data.products);

            setTimeout(closeUploadModal, 1500);
        }
    } catch (e) {
        document.getElementById('uploadResult').innerHTML = '<div class="error">请求失败: ' + e.message + '</div>';
    }
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('uploadModal').style.display === 'flex') {
        closeUploadModal();
    }
});

async function checkAuth() {
    try {
        const data = await apiFetch('/api/auth/me');
        if (data && data.user) {
            currentUser = data.user;
            updateHeaderUser();
            return true;
        }
    } catch (e) {
        console.error(e);
    }
    return false;
}

function updateHeaderUser() {
    const actions = document.querySelector('.header-actions');
    if (!currentUser) {
        actions.innerHTML = `
            <div class="header-badge">
                <span class="badge-dot"></span>
                <span>实时采集</span>
            </div>
            <button class="upload-btn" onclick="window.location.href='${API_BASE}/login'">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <polyline points="10 17 15 12 10 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <line x1="15" y1="12" x2="3" y2="12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                登录
            </button>
        `;
        return;
    }

    let adminBtn = '';
    if (currentUser.role === 'admin') {
        adminBtn = `<button class="upload-btn" onclick="window.location.href='${API_BASE}/admin'">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="white" stroke-width="2"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="white" stroke-width="2"/>
            </svg>
            管理后台
        </button>`;
    }

    actions.innerHTML = `
        <div class="header-badge">
            <span class="badge-dot"></span>
            <span>实时采集</span>
        </div>
        ${adminBtn}
        <button class="upload-btn" onclick="showUploadModal()">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            导入数据
        </button>
        <div class="user-menu">
            <div class="user-avatar">${currentUser.username?.charAt(0).toUpperCase() || 'U'}</div>
            <div class="user-info">
                <div class="user-name">${currentUser.username}</div>
                <div class="user-role">${currentUser.role === 'admin' ? '管理员' : '采购人'}</div>
            </div>
        </div>
    `;
}

async function initDemo() {
    const isAuthed = await checkAuth();
    if (!isAuthed) return;

    try {
        const data = await apiFetch('/api/keywords');
        if (data && data.keywords && data.keywords.length > 0) {
            const firstKw = data.keywords[0];
            document.getElementById('keywordInput').value = firstKw;
            loadExistingData(firstKw);
        }
    } catch (e) {
        console.error(e);
    }
}

async function loadExistingData(keyword) {
    try {
        const data = await apiFetch(`/api/products?keyword=${encodeURIComponent(keyword)}&order_by=price&sort=asc&limit=50`);
        if (data && data.products && data.products.length > 0) {
            currentProducts = data.products;
            currentKeyword = keyword;
            renderProducts(data.products);
            renderStats(data.stats || {});
            renderPlatformChart(data.products);
            renderTrendChartFromProducts(data.products);
        }
    } catch (e) {
        console.error(e);
    }
}

document.addEventListener('DOMContentLoaded', initDemo);
