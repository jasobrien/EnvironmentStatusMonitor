/* ============================================================
   Target / Bullseye Dashboard
   - Single canvas, concentric rings = environments
   - Pie-like segments within each ring = business transactions
   ============================================================ */

const DEBUG = false;
function debugLog(...args) { if (DEBUG) console.log(...args); }

// ── State ───────────────────────────────────────────────────
const environments = [];
const environmentLabels = {};
const environmentData = {};
let dashboardInitialized = false;
let activeDashboard = null;  // loaded dashboard filter config
let allowedTests = null;     // null = show all, array = filter

// ── Colour helpers ──────────────────────────────────────────
const STATUS_COLOURS = { Green: '#22c55e', Red: '#ef4444', Amber: '#f59e0b' };
const STATUS_COLOURS_HOVER = { Green: '#4ade80', Red: '#f87171', Amber: '#fbbf24' };
const FALLBACK_COLOUR = '#94a3b8';
const FALLBACK_COLOUR_HOVER = '#cbd5e1';
function statusColour(s) { return STATUS_COLOURS[s] || FALLBACK_COLOUR; }
function statusColourHover(s) { return STATUS_COLOURS_HOVER[s] || FALLBACK_COLOUR_HOVER; }

// Ring colours for environment bands (subtle background tint per ring)
const RING_TINTS = [
    'rgba(99,102,241,0.07)',   // indigo
    'rgba(16,185,129,0.07)',   // emerald
    'rgba(245,158,11,0.07)',   // amber
    'rgba(239,68,68,0.07)',    // red
    'rgba(139,92,246,0.07)',   // violet
];

// ── Config fetch ────────────────────────────────────────────
async function fetchConfig() {
    try {
        const response = await fetch('/config');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (data.environments && data.environments.length > 0) {
            environments.length = 0;
            Object.keys(environmentLabels).forEach(k => delete environmentLabels[k]);
            Object.keys(environmentData).forEach(k => delete environmentData[k]);

            data.environments.forEach(env => {
                environments.push(env.id);
                environmentLabels[env.id] = env.displayName || env.name;
                environmentData[env.id] = { features: [], colors: [], uptimeData: [], lastUpdated: null };
            });
        }
        return data;
    } catch (err) {
        console.error('Error loading config:', err);
        return null;
    }
}

// ── Dashboard ID from URL ────────────────────────────────────
function getDashboardId() {
    const parts = window.location.pathname.split('/');
    // /dashboard/view/:id
    const viewIdx = parts.indexOf('view');
    if (viewIdx >= 0 && parts[viewIdx + 1]) return decodeURIComponent(parts[viewIdx + 1]);
    return null;
}

async function fetchDashboardConfig(id) {
    try {
        const r = await fetch('/api/dashboards/' + encodeURIComponent(id));
        if (!r.ok) return null;
        return await r.json();
    } catch (err) { console.error('Error loading dashboard config:', err); return null; }
}

// ── DOM bootstrap ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {
    const config = await fetchConfig();
    if (!config) {
        // Fallback
        ['dev', 'test', 'staging', 'prod'].forEach(env => {
            environments.push(env);
            environmentLabels[env] = env.charAt(0).toUpperCase() + env.slice(1);
            environmentData[env] = { features: [], colors: [], uptimeData: [], lastUpdated: null };
        });
    }

    // Load dashboard filter if viewing a specific dashboard
    const dashId = getDashboardId();
    if (dashId) {
        activeDashboard = await fetchDashboardConfig(dashId);
        if (activeDashboard) {
            // Filter environments if dashboard specifies them
            if (activeDashboard.environments && activeDashboard.environments.length > 0) {
                const keep = new Set(activeDashboard.environments);
                const toRemove = environments.filter(e => !keep.has(e));
                toRemove.forEach(e => {
                    environments.splice(environments.indexOf(e), 1);
                    delete environmentLabels[e];
                    delete environmentData[e];
                });
            }
            // Set test filter
            if (activeDashboard.tests && activeDashboard.tests.length > 0) {
                allowedTests = activeDashboard.tests;
            }
            // Update page title to dashboard name
            const t = document.getElementById('pageTitle');
            if (t) t.textContent = activeDashboard.name;
            const h = document.querySelector('.card-header h2');
            if (h) h.textContent = activeDashboard.name;
        }
    } else {
        if (config && config.page_title) {
            const t = document.getElementById('pageTitle');
            if (t) t.textContent = config.page_title;
        }
    }

    if (environments.length > 0) initDashboard();
});

// ── Data fetching (unchanged API surface) ───────────────────
async function fetchUptimeStats(environment, days) {
    try {
        const r = await fetch(`/getSummaryStats/${environment}/${days}`);
        return await r.json();
    } catch (err) { console.error('Uptime stats error:', err); return null; }
}

async function fetchStatus(environment) {
    try {
        const r = await fetch(`/results/${environment}/`);
        let data = await r.json();
        // Apply test key filter if dashboard specifies it
        if (allowedTests) {
            data = data.filter(d => allowedTests.includes(d.key));
        }
        const ed = environmentData[environment];
        ed.features = data.map(d => d.key);
        ed.colors = data.map(d => d.value);
        ed.lastUpdated = data[0]?.DateTime || null;
        ed.performanceData = data.map(d => d.AvgResponseTime || 'N/A');

        const [u1, u7, u30] = await Promise.all([1, 7, 30].map(d => fetchUptimeStats(environment, d)));
        const pct = u => u ? ((u.Green / u.Total) * 100).toFixed(2) : 'N/A';
        ed.uptimeData = ed.features.map((_, i) => ({
            day1: pct(u1), day7: pct(u7), day30: pct(u30),
            avgResponseTime: ed.performanceData[i]
        }));
    } catch (err) {
        console.error('Fetch error for', environment, err);
        const mock = ['dashboard', 'deploy', 'data', 'performance'];
        const ed = environmentData[environment];
        ed.features = mock;
        ed.colors = mock.map(() => 'Green');
        ed.lastUpdated = new Date().toLocaleString();
        ed.performanceData = [45, 55, 65, 75];
        ed.uptimeData = mock.map((_, i) => ({ day1: '98.5', day7: '97.2', day30: '96.8', avgResponseTime: ed.performanceData[i] }));
    }
}

// ── Dashboard init ──────────────────────────────────────────
function initDashboard() {
    if (dashboardInitialized) return;
    dashboardInitialized = true;

    buildPerformanceButtons();

    Promise.all(environments.map(env => fetchStatus(env)))
        .then(() => {
            renderTarget();
            setupTooltip();
            buildLegend();
            updateTimestamp();
        })
        .catch(err => console.error('Dashboard load error:', err));
}

function buildPerformanceButtons() {
    const c = document.getElementById('performanceButtons');
    if (!c) return;
    c.innerHTML = '';
    environments.forEach(envId => {
        const a = document.createElement('a');
        a.href = `/dashboard/performance/${envId}/1`;
        a.className = 'btn btn-primary btn-sm mr-2 mb-2';
        a.textContent = `${environmentLabels[envId] || envId} Performance`;
        c.appendChild(a);
    });
}

function updateTimestamp() {
    const el = document.getElementById('lastUpdated');
    if (!el) return;
    const latest = environments.map(e => environmentData[e].lastUpdated).filter(Boolean).sort().pop();
    el.textContent = latest ? `Last Updated: ${latest}` : 'Waiting for data…';
}

// ── Geometry helpers ────────────────────────────────────────
function getAllFeatures() {
    const s = new Set();
    environments.forEach(env => environmentData[env].features.forEach(f => s.add(f)));
    return Array.from(s);
}

function getGeometry(canvas) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(cx, cy) * 0.72; // leave room for labels
    return { w, h, cx, cy, maxR };
}

function getRings(maxR) {
    const n = environments.length;
    const gap = 2;                       // px gap between rings
    const ringW = (maxR - gap * (n - 1)) / n;
    return environments.map((env, i) => {
        const outer = maxR - i * (ringW + gap);
        const inner = outer - ringW;
        return { env, outer: Math.max(0, outer), inner: Math.max(0, inner) };
    });
}

// ── Canvas Rendering ────────────────────────────────────────
function renderTarget() {
    const canvas = document.getElementById('targetCanvas');
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height) || 600;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const { cx, cy, maxR } = { cx: size / 2, cy: size / 2, maxR: Math.min(size / 2, size / 2) * 0.72 };
    const features = getAllFeatures();
    const nSeg = features.length || 1;
    const segAngle = (2 * Math.PI) / nSeg;
    const startOffset = -Math.PI / 2;          // 12-o'clock start
    const rings = getRings(maxR);

    ctx.clearRect(0, 0, size, size);

    // Draw segment cells: for each ring, for each feature
    rings.forEach((ring, ri) => {
        const env = ring.env;
        const ed = environmentData[env];

        features.forEach((feature, fi) => {
            const a0 = startOffset + fi * segAngle;
            const a1 = a0 + segAngle;

            // Determine colour for this cell
            const featureIdx = ed.features.indexOf(feature);
            const status = featureIdx >= 0 ? ed.colors[featureIdx] : null;
            const fill = status ? statusColour(status) : RING_TINTS[ri % RING_TINTS.length];

            // Draw arc segment
            ctx.beginPath();
            ctx.arc(cx, cy, ring.outer, a0, a1);
            ctx.arc(cx, cy, ring.inner, a1, a0, true);
            ctx.closePath();
            ctx.fillStyle = fill;
            ctx.fill();

            // Borders
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });
    });

    // Draw ring-boundary circles (crisp separation lines)
    rings.forEach(ring => {
        [ring.outer, ring.inner].forEach(r => {
            if (r <= 0) return;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    });

    // Centre dot
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#475569';
    ctx.fill();

    // ── Environment labels (inside each ring band, at the top) ────
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    rings.forEach((ring, ri) => {
        const midR = (ring.outer + ring.inner) / 2;
        const labelAngle = startOffset; // top of ring
        const lx = cx + Math.cos(labelAngle) * midR;
        const ly = cy + Math.sin(labelAngle) * midR;

        const label = environmentLabels[ring.env] || ring.env;
        const fontSize = Math.max(9, Math.min(12, (ring.outer - ring.inner) * 0.45));
        ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

        // Background pill
        const tm = ctx.measureText(label);
        const pw = tm.width + 10;
        const ph = fontSize + 6;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        roundRect(ctx, lx - pw / 2, ly - ph / 2, pw, ph, 3);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.fillText(label, lx, ly);
    });

    // ── Feature labels (outside outermost ring) ─────────────────
    const labelR = maxR + 20;
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    features.forEach((feature, fi) => {
        const midAngle = startOffset + fi * segAngle + segAngle / 2;
        const lx = cx + Math.cos(midAngle) * labelR;
        const ly = cy + Math.sin(midAngle) * labelR;

        // Determine text alignment based on angle
        const deg = ((midAngle * 180 / Math.PI) % 360 + 360) % 360;
        ctx.textAlign = deg > 90 && deg < 270 ? 'right' : deg === 90 || deg === 270 ? 'center' : 'left';
        ctx.textBaseline = 'middle';

        // Background pill
        const tm = ctx.measureText(feature);
        const pw = tm.width + 10;
        const ph = 18;
        let pillX = lx;
        if (ctx.textAlign === 'right') pillX = lx - pw;
        else if (ctx.textAlign === 'center') pillX = lx - pw / 2;

        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        roundRect(ctx, pillX - 2, ly - ph / 2, pw + 4, ph, 3);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Connector line from outer ring to label
        const lineStartR = maxR + 3;
        const lineEndR = labelR - 6;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(midAngle) * lineStartR, cy + Math.sin(midAngle) * lineStartR);
        ctx.lineTo(cx + Math.cos(midAngle) * lineEndR, cy + Math.sin(midAngle) * lineEndR);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#334155';
        ctx.fillText(feature, lx, ly);
    });

    // Store computed geometry for hit-testing
    canvas._targetGeo = { cx, cy, maxR, features, rings, segAngle, startOffset, size };
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ── Hover / Tooltip ─────────────────────────────────────────
let _hoveredCell = null;

function setupTooltip() {
    const canvas = document.getElementById('targetCanvas');
    const tooltip = document.getElementById('targetTooltip');
    if (!canvas || !tooltip) return;

    canvas.addEventListener('mousemove', e => {
        const geo = canvas._targetGeo;
        if (!geo) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const hit = hitTest(geo, mx, my);

        if (hit) {
            const ed = environmentData[hit.env];
            const fi = ed.features.indexOf(hit.feature);
            const uptime = fi >= 0 && ed.uptimeData[fi] ? ed.uptimeData[fi] : null;
            const status = fi >= 0 ? ed.colors[fi] : 'N/A';

            tooltip.innerHTML = `
                <div class="tt-row"><span class="tt-label">Environment</span><span class="tt-value">${environmentLabels[hit.env] || hit.env}</span></div>
                <div class="tt-row"><span class="tt-label">Feature</span><span class="tt-value">${hit.feature}</span></div>
                <div class="tt-row"><span class="tt-label">Status</span><span class="tt-badge tt-${status}">${status}</span></div>
                ${uptime ? `
                <div class="tt-divider"></div>
                <div class="tt-row"><span class="tt-label">1-Day Uptime</span><span class="tt-value">${uptime.day1}%</span></div>
                <div class="tt-row"><span class="tt-label">7-Day Uptime</span><span class="tt-value">${uptime.day7}%</span></div>
                <div class="tt-row"><span class="tt-label">30-Day Uptime</span><span class="tt-value">${uptime.day30}%</span></div>
                ${uptime.avgResponseTime !== 'N/A' ? `<div class="tt-row"><span class="tt-label">Avg Response</span><span class="tt-value">${uptime.avgResponseTime}ms</span></div>` : ''}
                ` : ''}`;
            tooltip.style.display = 'block';

            // Position tooltip near cursor but keep on screen
            let tx = e.clientX + 14;
            let ty = e.clientY + 14;
            const tw = tooltip.offsetWidth;
            const th = tooltip.offsetHeight;
            if (tx + tw > window.innerWidth - 8) tx = e.clientX - tw - 10;
            if (ty + th > window.innerHeight - 8) ty = e.clientY - th - 10;
            tooltip.style.left = tx + 'px';
            tooltip.style.top = ty + 'px';
            canvas.style.cursor = 'pointer';

            // Highlight cell
            if (!_hoveredCell || _hoveredCell.env !== hit.env || _hoveredCell.feature !== hit.feature) {
                _hoveredCell = hit;
                renderTargetWithHighlight(hit);
            }
        } else {
            tooltip.style.display = 'none';
            canvas.style.cursor = 'default';
            if (_hoveredCell) { _hoveredCell = null; renderTarget(); }
        }
    });

    canvas.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
        canvas.style.cursor = 'default';
        if (_hoveredCell) { _hoveredCell = null; renderTarget(); }
    });

    // Redraw on resize
    window.addEventListener('resize', () => { renderTarget(); });
}

function hitTest(geo, mx, my) {
    const { cx, cy, rings, features, segAngle, startOffset } = geo;
    const dx = mx - cx;
    const dy = my - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let angle = Math.atan2(dy, dx);

    // Normalize angle relative to start offset
    angle -= startOffset;
    if (angle < 0) angle += 2 * Math.PI;
    if (angle >= 2 * Math.PI) angle -= 2 * Math.PI;

    // Which segment?
    const segIdx = Math.floor(angle / segAngle);
    if (segIdx < 0 || segIdx >= features.length) return null;

    // Which ring?
    for (const ring of rings) {
        if (dist >= ring.inner && dist <= ring.outer) {
            return { env: ring.env, feature: features[segIdx] };
        }
    }
    return null;
}

function renderTargetWithHighlight(hit) {
    const canvas = document.getElementById('targetCanvas');
    if (!canvas) return;
    // Do a normal render then overlay highlight
    renderTarget();

    const geo = canvas._targetGeo;
    if (!geo) return;
    const { cx, cy, rings, features, segAngle, startOffset, size } = geo;
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(dpr, dpr);

    const fi = features.indexOf(hit.feature);
    const ring = rings.find(r => r.env === hit.env);
    if (fi < 0 || !ring) { ctx.restore(); return; }

    const a0 = startOffset + fi * segAngle;
    const a1 = a0 + segAngle;

    // Draw bright highlight border
    ctx.beginPath();
    ctx.arc(cx, cy, ring.outer - 1, a0, a1);
    ctx.arc(cx, cy, ring.inner + 1, a1, a0, true);
    ctx.closePath();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw glowing outline
    ctx.beginPath();
    ctx.arc(cx, cy, ring.outer, a0, a1);
    ctx.arc(cx, cy, ring.inner, a1, a0, true);
    ctx.closePath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 8;
    ctx.stroke();

    ctx.restore();
}

// ── Legend ───────────────────────────────────────────────────
function buildLegend() {
    const el = document.getElementById('targetLegend');
    if (!el) return;
    el.innerHTML = `
        <div class="legend-section">
            <span class="legend-title">Status</span>
            <span class="legend-item"><span class="legend-dot" style="background:#22c55e"></span>Green</span>
            <span class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span>Amber</span>
            <span class="legend-item"><span class="legend-dot" style="background:#ef4444"></span>Red</span>
            <span class="legend-item"><span class="legend-dot" style="background:#94a3b8"></span>N/A</span>
        </div>
        <div class="legend-section">
            <span class="legend-title">Rings (outer → inner)</span>
            ${environments.map(e => `<span class="legend-item">${environmentLabels[e] || e}</span>`).join('')}
        </div>
    `;
}

function refreshPage() { location.reload(); }
