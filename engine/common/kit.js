// 章节公用画法（在 style.js / paper.js 之上）：原文实体纸视窗 view/kview、PDF 词框找句 pdfPhrase、黄笔 sweep、酒红圈注 ring、
// 卡片、Agent 方块、条形图、源码卡、勾叉、箭头、文字换行。全部是 t 的纯函数，不用随机数。
// 注：CAT / mother / chapterIntro 是某一期「三类失败」母图的写法，留作「母图 + 章节转场」的参考实现；做自己的片时照着写自己的母图。
(function () {
'use strict';
const E = window.ED;
const { W, H, C, SERIF, SANS, INTER, F, clamp, lerp, eOQ, eOC, eIC, eIO, pr, rgba, mix, tw, text } = E;
const HL = 'rgba(250,199,117,0.7)';
const cx = () => E.ctx;
const eSine = p => 0.5 - 0.5 * Math.cos(Math.PI * clamp(p));
const eBack = p => { p = clamp(p); const c1 = 1.2, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };  // 轻回弹

// ---------- 原文实体纸视窗（同片头 v4 drawView） ----------
// v = { k: 源单位→屏幕倍数, cx, cy: 视窗中心（源单位）, rect: 屏幕矩形 }；dpr = 截图像素 / 源单位
function view(img, dpr, v, o = {}) {
  const ctx = cx(), r = v.rect; const rot = (o.rot || 0) * Math.PI / 180; const lift = o.lift == null ? 0.5 : o.lift;
  ctx.save();
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  const mx = r.x + r.w / 2, my = r.y + r.h / 2;
  ctx.translate(mx, my); ctx.rotate(rot); ctx.translate(-mx, -my);
  ctx.shadowColor = `rgba(51,48,46,${0.16 + 0.12 * lift})`; ctx.shadowBlur = 14 + 22 * lift; ctx.shadowOffsetY = 6 + 10 * lift;
  ctx.fillStyle = o.bg || '#FFFFFF'; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.shadowColor = 'transparent';
  ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  const sx = r.x + r.w / 2 - v.cx * v.k, sy = r.y + r.h / 2 - v.cy * v.k;
  const c0x = Math.max(0, (r.x - sx) / v.k), c0y = Math.max(0, (r.y - sy) / v.k);
  const c1x = Math.min(img.width / dpr, (r.x + r.w - sx) / v.k), c1y = Math.min(img.height / dpr, (r.y + r.h - sy) / v.k);
  if (c1x > c0x && c1y > c0y) ctx.drawImage(img, c0x * dpr, c0y * dpr, (c1x - c0x) * dpr, (c1y - c0y) * dpr, sx + c0x * v.k, sy + c0y * v.k, (c1x - c0x) * v.k, (c1y - c0y) * v.k);
  const map = { k: v.k, x: q => sx + q * v.k, y: q => sy + q * v.k };
  if (o.over) o.over(map);
  ctx.restore();
  return map;
}
function lv(a, b, p) {
  return { k: Math.exp(lerp(Math.log(a.k), Math.log(b.k), p)), cx: lerp(a.cx, b.cx, p), cy: lerp(a.cy, b.cy, p),
    rect: { x: lerp(a.rect.x, b.rect.x, p), y: lerp(a.rect.y, b.rect.y, p), w: lerp(a.rect.w, b.rect.w, p), h: lerp(a.rect.h, b.rect.h, p) } };
}
const V = (k, vx, vy, x, y, w, h) => ({ k, cx: vx, cy: vy, rect: { x, y, w, h } });
// 关键帧视窗：keys = [[t, view], ...]，段间 eIO（k 走对数）
function kview(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return lv(keys[i - 1][1], keys[i][1], eIO((t - keys[i - 1][0]) / Math.max(1e-6, keys[i][0] - keys[i - 1][0])));
  return keys[keys.length - 1][1];
}
// 黄笔：rects（源单位）从左往右扫
function sweep(rects, map, p, col = HL) {
  const ctx = cx(); if (!rects || !rects.length || p <= 0) return;
  const tot = rects.reduce((a, q) => a + q.w, 0); let L = tot * clamp(p);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = col;
  rects.forEach(q => { const w = Math.min(q.w, Math.max(0, L)); L -= q.w; if (w > 0) ctx.fillRect(map.x(q.x - 1.5), map.y(q.y - 0.5), (w + 3) * map.k, (q.h + 1) * map.k); });
  ctx.restore();
}
// 酒红圈注（我们的批注）
function ring(rects, map, p, lw = 4) {
  if (!rects || !rects.length || p <= 0) return;
  const x0 = Math.min(...rects.map(q => q.x)), y0 = Math.min(...rects.map(q => q.y)), x1 = Math.max(...rects.map(q => q.x + q.w)), y1 = Math.max(...rects.map(q => q.y + q.h));
  E.strokeCW({ x: map.x(x0) - 8, y: map.y(y0) - 6, w: (x1 - x0) * map.k + 16, h: (y1 - y0) * map.k + 12 }, eOC(p), C.claret, lw);
}

// ---------- PDF 词框找句（pdf-words.json：[x, y, w, h, word]，pt） ----------
const normW = s => s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^a-z0-9%.+\-_'=]/g, '');
function pdfPhrase(page, phrase, nth = 0) {
  const ws = page.words, tok = phrase.split(/\s+/).map(normW).filter(Boolean); let hit = -1, cnt = 0;
  for (let i = 0; i + tok.length <= ws.length; i++) {
    let ok = true;
    for (let j = 0; j < tok.length; j++) { const a = normW(ws[i + j][4]); if (!(a === tok[j] || (j === 0 && a.endsWith(tok[j])) || (j === tok.length - 1 && a.startsWith(tok[j])))) { ok = false; break; } }
    if (ok) { if (cnt === nth) { hit = i; break; } cnt++; }
  }
  if (hit < 0) { console.warn('pdfPhrase miss', phrase); return []; }
  const lines = [];
  for (let j = 0; j < tok.length; j++) {
    const [x, y, w, h] = ws[hit + j]; const L = lines[lines.length - 1];
    if (L && Math.abs(L.y - y) < h * 0.6 && x > L.x) { L.w = x + w - L.x; L.h = Math.max(L.h, h); } else lines.push({ x, y, w, h });
  }
  return lines;
}

// ---------- 卡片、文字 ----------
function card(r, o = {}) {
  const ctx = cx(); const lift = o.lift == null ? 0.35 : o.lift;
  ctx.save(); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  ctx.shadowColor = `rgba(51,48,46,${0.10 + 0.12 * lift})`; ctx.shadowBlur = 8 + 18 * lift; ctx.shadowOffsetY = 3 + 8 * lift;
  ctx.fillStyle = o.fill || C.sheet; E.rrect(r.x, r.y, r.w, r.h, o.r == null ? 6 : o.r); ctx.fill(); ctx.shadowColor = 'transparent';
  if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw || 2; if (o.dash) ctx.setLineDash(o.dash); E.rrect(r.x, r.y, r.w, r.h, o.r == null ? 6 : o.r); ctx.stroke(); }
  if (o.bar) { ctx.fillStyle = o.bar; ctx.fillRect(r.x, r.y, r.w, 6); }
  ctx.restore();
}
function wrap(str, f, maxW) {
  const ctx = cx(); ctx.font = f; const out = []; let cur = '';
  const toks = str.match(/[A-Za-z0-9_.%+\-=()'"/:]+\s?|\s|./g) || [];
  for (const tk of toks) { if (ctx.measureText(cur + tk).width > maxW && cur) { out.push(cur.trim()); cur = tk.trimStart(); } else cur += tk; }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function para(str, x, y, f, lh, col, maxW, p = 1, align = 'left') {
  const ls = wrap(str, f, maxW); ls.forEach((l, i) => { const q = clamp(p * ls.length - i); if (q > 0) E.wipeText(l, x, y + i * lh, f, col, lh * 0.75, q, align); }); return ls.length;
}
// 弹出缩放（卡片、标签）：先缩小再到 1，带轻回弹；返回 [scale, alpha]
function pop(t, t0, d = 0.45) { const p = pr(t, t0, d); return [lerp(0.86, 1, eBack(p)), clamp(p * 3)]; }
function withScale(x, y, s, a, fn) { if (a <= 0) return; const ctx = cx(); ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s); ctx.translate(-x, -y); fn(); ctx.restore(); }
function check(x, y, s, p, col = C.teal, lw = 6) {
  if (p <= 0) return; const ctx = cx(); ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const pts = [[x - s * 0.5, y], [x - s * 0.12, y + s * 0.38], [x + s * 0.55, y - s * 0.42]]; const L1 = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]), L2 = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]); let L = (L1 + L2) * eOC(p);
  ctx.beginPath(); ctx.moveTo(...pts[0]); const q1 = Math.min(1, L / L1); ctx.lineTo(lerp(pts[0][0], pts[1][0], q1), lerp(pts[0][1], pts[1][1], q1)); L -= L1;
  if (L > 0) { const q2 = L / L2; ctx.lineTo(lerp(pts[1][0], pts[2][0], q2), lerp(pts[1][1], pts[2][1], q2)); } ctx.stroke(); ctx.restore();
}
function cross(x, y, s, p, col = C.claret, lw = 6) {
  if (p <= 0) return; const a = eOC(clamp(p * 2)), b = eOC(clamp(p * 2 - 1));
  E.line(x - s / 2, y - s / 2, lerp(x - s / 2, x + s / 2, a), lerp(y - s / 2, y + s / 2, a), col, lw);
  if (b > 0) E.line(x + s / 2, y - s / 2, lerp(x + s / 2, x - s / 2, b), lerp(y - s / 2, y + s / 2, b), col, lw);
}
// 箭头：从 a 到 b 长出
function arrow(x1, y1, x2, y2, p, col = C.ink, lw = 3, head = 12) {
  if (p <= 0) return; const q = eOC(p); const X = lerp(x1, x2, q), Y = lerp(y1, y2, q);
  E.line(x1, y1, X, Y, col, lw); if (q > 0.6) E.arrowHead(X, Y, Math.atan2(y2 - y1, x2 - x1), col, head, lw);
}
function curveArrow(x1, y1, x2, y2, bend, p, col = C.ink, lw = 3) {
  if (p <= 0) return; const ctx = cx(); const mx = (x1 + x2) / 2 - (y2 - y1) * bend, my = (y1 + y2) / 2 + (x2 - x1) * bend;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath(); const N = 40; let X = x1, Y = y1, pX = x1, pY = y1;
  for (let i = 0; i <= N * eOC(p); i++) { const u = i / N; pX = X; pY = Y; X = (1 - u) * (1 - u) * x1 + 2 * (1 - u) * u * mx + u * u * x2; Y = (1 - u) * (1 - u) * y1 + 2 * (1 - u) * u * my + u * u * y2; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
  ctx.stroke(); ctx.restore(); if (p > 0.9) E.arrowHead(X, Y, Math.atan2(Y - pY, X - pX), col, 11, lw);
}

// ---------- Agent 方块（编辑风：米白卡 + 墨色小标签） ----------
// o: { label, sub, on(0..1 → 酒红描边), color, w, h }
function agent(x, y, o = {}) {
  if (o.alpha != null) { if (o.alpha <= 0) return; const ctx = cx(); ctx.save(); ctx.globalAlpha *= o.alpha; const r = agent(x, y, Object.assign({}, o, { alpha: null })); ctx.restore(); return r; }
  const w = o.w || 200, h = o.h || 120; const r = { x: x - w / 2, y: y - h / 2, w, h };
  card(r, { fill: o.fill || C.sheet, stroke: o.on > 0 ? mix(C.rule, o.color || C.claret, o.on) : C.rule, lw: o.on > 0 ? 3 : 2, lift: o.lift == null ? 0.3 : o.lift, r: 10 });
  // 小「头」：圆点 + 横线，像一个 Agent 图标
  const ctx = cx(); ctx.fillStyle = o.color || C.ink; ctx.beginPath(); ctx.arc(r.x + 30, r.y + 32, 9, 0, Math.PI * 2); ctx.fill();
  if (o.label) text(o.label, r.x + 50, r.y + 42, F(700, o.fs || 30, o.fam || SANS), C.black);
  if (o.sub) { const ls = Array.isArray(o.sub) ? o.sub : [o.sub]; ls.forEach((s, i) => text(s, r.x + 22, r.y + 82 + i * 34, F(500, 26, SANS), o.subCol || C.ink)); }
  return r;
}

// ---------- 母图：MAST 三类（份额按图 1 原值） ----------
const CAT = [
  { k: '设计', n: '第一类', full: '设计没定好', en: 'System Design Issues', v: 44.2 },
  { k: '对齐', n: '第二类', full: 'Agent 之间没对齐', en: 'Inter-Agent Misalignment', v: 32.3 },
  { k: '验收', n: '第三类', full: '验收没做好', en: 'Task Verification', v: 23.5 }
];
const MINI = { x: 1384, y: 80, w: 440, h: 40, fs: 24, gap: 4 };
const BIG = { x: 160, y: 400, w: 1600, h: 170, fs: 44, gap: 10 };
function motherCells(L) {
  const tot = CAT.reduce((a, c) => a + c.v, 0), inner = L.w - L.gap * 2; let x = L.x;
  return CAT.map(c => { const w = inner * c.v / tot; const r = { x, y: L.y, w, h: L.h }; x += w + L.gap; return r; });
}
// st: { lay: 0（big）..1（mini）或自定义 L, cur: 当前章 0/1/2（-1 无）, lit:[a,b,c] 0..1 酒红程度, pct: 是否显示百分数, alpha }
function mother(st) {
  const A = st.L0 || BIG, B = st.L1 || MINI, p = st.lay == null ? 0 : st.lay;
  const L = { x: lerp(A.x, B.x, p), y: lerp(A.y, B.y, p), w: lerp(A.w, B.w, p), h: lerp(A.h, B.h, p), fs: lerp(A.fs, B.fs, p), gap: lerp(A.gap, B.gap, p) };
  const cells = motherCells(L); const ctx = cx();
  ctx.save(); if (st.alpha != null) ctx.globalAlpha *= st.alpha;
  cells.forEach((r, i) => {
    if (st.skip && st.skip[i]) return;
    const lit = st.lit ? st.lit[i] : (st.cur === i ? 1 : 0);
    ctx.fillStyle = mix(C.wheat, C.claret, lit); ctx.fillRect(r.x, r.y, r.w, r.h);
    const fs = L.fs, col = lit > 0.5 ? '#FFFFFF' : C.black;
    const lbl = CAT[i].k + (st.pct ? '  ' : '');
    const f1 = F(800, fs, SERIF);
    if (st.pct) {
      const f2 = F(700, fs * 0.78, INTER); const pv = st.pctVal ? st.pctVal[i] : CAT[i].v; const s2 = pv > 0.05 ? pv.toFixed(1) + '%' : '';
      text(CAT[i].k, r.x + fs * 0.5, r.y + r.h / 2 + fs * 0.36, f1, col);
      text(s2, r.x + r.w - fs * 0.5, r.y + r.h / 2 + fs * 0.32, f2, col, 'right');
    } else text(CAT[i].k, r.x + r.w / 2, r.y + r.h / 2 + fs * 0.36, f1, col, 'center');
  });
  ctx.restore();
  return cells;
}

// ---------- 条形图（横向）：rows = [{label, v, col, sub}], max；p 0..1 生长；数字滚动 ----------
function hbars(x, y, w, rows, o = {}) {
  const bh = o.bh || 56, gap = o.gap || 30, lw = o.lw || 300, max = o.max || 100;
  rows.forEach((r, i) => {
    const yy = y + i * (bh + gap); const p = clamp(r.p == null ? 1 : r.p); if (p <= 0 && !o.showEmpty) return;
    const a = clamp(p * 4);
    text(r.label, x + lw - 24, yy + bh / 2 + 11, F(r.bold ? 700 : 500, o.lfs || 30, SANS), C.ink, 'right', a);
    const bw = (w - lw - 160) * r.v / max * eOC(p);
    cx().fillStyle = r.col || C.oxford; cx().globalAlpha = a; cx().fillRect(x + lw, yy, bw, bh); cx().globalAlpha = 1;
    const shown = r.v * eOC(p);
    text((o.fmt ? o.fmt(shown, r) : shown.toFixed(r.dec == null ? 0 : r.dec) + '%'), x + lw + bw + 16, yy + bh / 2 + 13, F(700, o.vfs || 38, INTER), r.col || C.oxford, 'left', a);
    if (r.sub) text(r.sub, x + lw + bw + 16 + 120, yy + bh / 2 + 11, F(400, 26, SANS), C.ink2, 'left', a);
  });
}

// ---------- 源码卡（GitHub 文件视图样式；文字按原文） ----------
const MONO = 'Menlo, Monaco, "Courier New", monospace';
function codeCard(r, d, hl, o = {}) {
  // d = { head, rows: [[lineNo, text]], fs }，hl = [[rowIdx, phrase, p]]
  const ctx = cx(), fs = d.fs || 26, lh = fs * 1.42, k = fs / 26;
  card(r, { fill: '#FFFFFF', stroke: '#D1D9E0', lw: 2, r: 8, lift: o.lift == null ? 0.4 : o.lift });
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  ctx.fillStyle = '#F6F8FA'; ctx.fillRect(r.x, r.y, r.w, 54 * k); ctx.fillStyle = '#D1D9E0'; ctx.fillRect(r.x, r.y + 54 * k, r.w, 2);
  text(d.head, r.x + 22, r.y + 36 * k, `600 ${24 * k}px ${MONO}`, '#1F2328');
  if (d.right) text(d.right, r.x + r.w - 22, r.y + 36 * k, F(700, 26 * k, INTER), '#59636E', 'right');
  const gx = r.x + 92 * k, y0 = r.y + 56 * k + lh * 0.95;
  ctx.fillStyle = '#F6F8FA'; ctx.fillRect(r.x, r.y + 56 * k, 76 * k, r.h);
  const fC = `400 ${fs}px ${MONO}`;
  d.rows.forEach(([ln, tx], i) => {
    const y = y0 + i * lh;
    if (ln) text(ln, r.x + 64 * k, y, fC, '#6E7781', 'right');
    (hl || []).filter(h => h[0] === i).forEach(([, ph, p]) => {
      if (p <= 0) return; const at = tx.indexOf(ph); if (at < 0) return; ctx.font = fC;
      const x0 = gx + ctx.measureText(tx.slice(0, at)).width, w = ctx.measureText(ph).width;
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = HL; ctx.fillRect(x0 - 3, y - fs * 0.95, (w + 6) * eIO(clamp(p)), fs * 1.3); ctx.restore();
    });
    text(tx, gx, y, fC, '#1F2328');
  });
  ctx.restore();
}

// 标题卡里的大字和 kicker（章节转场用）
function titleCard(r, n, title, p, out) {
  const ctx = cx(); if (p <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  E.kicker(r.x + 80, r.y + r.h / 2 - 70, n, '#FFFFFF', p, '#FFFFFF');
  E.maskLine(title, r.x + 80, r.y + r.h / 2 + 60, F(900, 112, SERIF), '#FFFFFF', 112, eOQ(pr(p, 0.15, 0.85)), out || 0);
  ctx.restore();
}

// ---------- 章节转场：母图小条 → 三格大条 → 本章那一格长满成标题卡 → 缩回小条 ----------
// 返回 { mini: 本帧是否只画常驻小条（转场结束后由章节自己画）, cellRect: 收回中的那一格矩形 }
const FULL = { x: 96, y: 150, w: 1728, h: 730 };
function lerpR(a, b, p) { return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) }; }
function chapterIntro(t, idx, n, title, tOut) {
  const ctx = cx();
  const pBig = eIO(pr(t, 0.0, 0.55));                // 小条 → 大条
  const pExp = eIO(pr(t, 0.6, 0.5));                 // 本格长满
  const pTitle = pr(t, 0.85, 0.6);
  const pOutT = pr(t, tOut, 0.3);                    // 标题先退
  const pCol = eIO(pr(t, tOut + 0.25, 0.6));          // 缩回小条
  if (t >= tOut + 0.85) { mother({ lay: 1, cur: idx }); return { done: 1 }; }
  if (pCol > 0) {
    // 其他两格从小条位置弹回；本格从全屏缩到小条
    const mini = motherCells({ ...MINI });
    mother({ lay: 1, cur: idx, skip: [idx === 0, idx === 1, idx === 2].map(b => b), alpha: clamp(pCol * 2) });
    const r = lerpR(FULL, mini[idx], pCol);
    ctx.fillStyle = C.claret; ctx.fillRect(r.x, r.y, r.w, r.h);
    if (pCol > 0.85) text(CAT[idx].k, r.x + r.w / 2, r.y + r.h / 2 + 24 * 0.36, F(800, 24, SERIF), '#FFFFFF', 'center', pr(pCol, 0.85, 0.15));
    return { done: pCol, cellRect: r };
  }
  if (pExp <= 0) { mother({ lay: 1 - pBig, cur: idx, pct: pBig > 0.5 }); return { done: 0 }; }
  const big = motherCells(BIG);
  mother({ lay: 0, cur: idx, pct: true, skip: [0, 1, 2].map(i => i === idx), alpha: 1 - clamp(pExp * 1.6) });
  const r = lerpR(big[idx], FULL, pExp);
  ctx.fillStyle = C.claret; ctx.fillRect(r.x, r.y, r.w, r.h);
  if (pExp < 0.4) text(CAT[idx].k, r.x + r.w / 2, r.y + r.h / 2 + 44 * 0.36, F(800, 44, SERIF), '#FFFFFF', 'center', 1 - pExp / 0.4);
  if (pTitle > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    E.kicker(r.x + 96, r.y + 300, n + ' · ' + CAT[idx].en, '#FFFFFF', pTitle, '#FFFFFF');
    E.maskLine(title, r.x + 96, r.y + 450, F(900, 112, SERIF), '#FFFFFF', 112, eOQ(pr(pTitle, 0.1, 0.9)), pOutT);
    E.maskLine(`MAST 图 1 · 约占全部失败标签的 ${CAT[idx].v}%`, r.x + 96, r.y + 540, F(500, 34, SANS), '#F7E6EC', 34, eOQ(pr(pTitle, 0.3, 0.7)), pOutT);
    ctx.restore();
  }
  return { done: 0 };
}

window.Kit = { FULL, lerpR, chapterIntro, HL, eSine, eBack, view, lv, V, kview, sweep, ring, pdfPhrase, card, wrap, para, pop, withScale, check, cross, arrow, curveArrow, agent, CAT, MINI, BIG, motherCells, mother, hbars, codeCard, MONO, titleCard };
})();
