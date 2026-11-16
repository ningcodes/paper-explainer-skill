// 卡 ④ 报刊数据新闻：色板、字体、缓动、文字与线条的标志动作。全片公用。
// 用法：页面先加载本文件 → await ED.loadFonts(base)（base 下要有 fonts/，见 style-cards/editorial/get-fonts.sh）→ ED.setCtx(ctx)；之后在任何地方调用 ED.text / ED.maskLine ...
(function () {
'use strict';
let ctx = null;
const W = 1920, H = 1080;
const C = {
  paper: '#FFF1E5', ink: '#33302E', ink2: '#66605C', rule: '#CCC1B7', claret: '#990F3D',
  oxford: '#0F5499', teal: '#0D7680', gray: '#B9AFA6', wheat: '#F2DFCE', black: '#1A1817',
  wheatDeep: '#E8CBB1', sheet: '#FFFCF7'
};
const SERIF = 'NSerif', SANS = 'NSans', INTER = 'NInter';
const F = (w, px, fam) => `${w} ${px}px ${fam}`;

// ---------- math ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, p) => a + (b - a) * p;
const eOQ = p => 1 - Math.pow(1 - clamp(p), 4);           // easeOutQuart
const eOC = p => 1 - Math.pow(1 - clamp(p), 3);           // easeOutCubic
const eIC = p => Math.pow(clamp(p), 3);                   // easeInCubic
const eIO = p => { p = clamp(p); return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
const pr = (t, t0, d) => clamp((t - t0) / d);               // linear progress
const lr = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });
function mix(c1, c2, p) {
  const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
  const r = Math.round(lerp(a >> 16, b >> 16, p)), g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, p)), bl = Math.round(lerp(a & 255, b & 255, p));
  return `rgb(${r},${g},${bl})`;
}
function rgba(hex, a) { const v = parseInt(hex.slice(1), 16); return `rgba(${v >> 16},${(v >> 8) & 255},${v & 255},${a})`; }
function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// 分段关键帧：keys = [[t, value], ...]，段间 eIO
function kf(t, keys, ease = eIO) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
      const p = ease((t - t0) / Math.max(1e-6, t1 - t0));
      if (typeof v0 === 'number') return lerp(v0, v1, p);
      return lr(v0, v1, p);
    }
  }
  return keys[keys.length - 1][1];
}
// 字体（Noto Serif SC 宋体 / Noto Sans SC 思源黑 / Inter 数字），本地文件 FontFace 加载，不走系统回退
async function loadFonts(base) {
  const faces = [
    new FontFace(SERIF, `url(${base}/fonts/NotoSerifSC-Variable.ttf)`, { weight: '200 900' }),
    new FontFace(SANS, `url(${base}/fonts/NotoSansSC.ttf)`, { weight: '100 900' }),
    new FontFace(INTER, `url(${base}/fonts/InterVariable.woff2)`, { weight: '100 900' })
  ];
  for (const f of faces) { await f.load(); document.fonts.add(f); }
}
// 回退检查：返回在目标字体里没有字形的字符（应为空）
function fontCheck(chars) {
  const c = document.createElement('canvas').getContext('2d'); const miss = {};
  for (const fam of [SANS, SERIF]) for (const ch of new Set([...chars])) {
    if (!/[\u3000-\u9fff\uff00-\uffef]/.test(ch)) continue;
    c.font = `700 40px ${fam}, monospace`; const a = c.measureText(ch).width;
    c.font = `700 40px ${fam}, serif`; const b = c.measureText(ch).width;
    if (Math.abs(a - b) > 0.01) (miss[fam] = miss[fam] || []).push(ch);
  }
  return miss;
}
function loadImg(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('img ' + src)); im.src = src; }); }

// ---------- 文字与线条（标志动作） ----------
// ---------- text helpers ----------
function font(f) { ctx.font = f; }
function tw(str, f) { ctx.font = f; return ctx.measureText(str).width; }
function text(str, x, y, f, col, align = 'left', alpha = 1) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.font = f; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y); ctx.restore();
}
// 遮罩上推：pIn 0→1 进场，pOut 0→1 退场（继续上推）
function maskLine(str, x, y, f, col, size, pIn, pOut = 0, align = 'left') {
  if (pIn <= 0 || pOut >= 1) return;
  const w = tw(str, f); const x0 = align === 'left' ? x : align === 'center' ? x - w / 2 : x - w;
  const top = y - size * 1.0, hh = size * 1.32;
  ctx.save(); ctx.beginPath(); ctx.rect(x0 - 12, top, w + 24, hh); ctx.clip();
  const dy = (1 - eOQ(pIn)) * hh - eIC(pOut) * hh;
  text(str, x, y + dy, f, col, align);
  ctx.restore();
}
// 从左擦出
function wipeText(str, x, y, f, col, size, p, align = 'left') {
  if (p <= 0) return;
  const w = tw(str, f); const x0 = align === 'left' ? x : align === 'center' ? x - w / 2 : x - w;
  ctx.save(); ctx.beginPath(); ctx.rect(x0 - 6, y - size * 1.1, (w + 12) * eOC(p), size * 1.45); ctx.clip();
  text(str, x, y, f, col, align); ctx.restore();
}
function line(x1, y1, x2, y2, col, lw, dash) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'butt'; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}
function arrowHead(x, y, dir, col, s = 9, lw = 2) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.translate(x, y); ctx.rotate(dir); ctx.beginPath(); ctx.moveTo(-s, -s * 0.75); ctx.lineTo(0, 0); ctx.lineTo(-s, s * 0.75); ctx.stroke(); ctx.restore();
}
function rect(r, fill, stroke, lw = 1) {
  if (fill) { ctx.fillStyle = fill; ctx.fillRect(r.x, r.y, r.w, r.h); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.strokeRect(r.x + lw / 2, r.y + lw / 2, r.w - lw, r.h - lw); }
}
function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
// 外框顺时针描边（从左上角起）
function strokeCW(r, p, col, lw) {
  if (p <= 0) return;
  const per = 2 * (r.w + r.h); let L = per * clamp(p);
  const pts = [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h], [r.x, r.y]];
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'miter'; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length && L > 0; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i]; const seg = Math.hypot(bx - ax, by - ay); const q = Math.min(1, L / seg);
    ctx.lineTo(ax + (bx - ax) * q, ay + (by - ay) * q); L -= seg;
  }
  ctx.stroke(); ctx.restore();
}
function vtext(str, cx, cy, f, size, col, alpha = 1) {
  const n = [...str].length, gap = size * 1.12; const y0 = cy - (n - 1) * gap / 2;
  [...str].forEach((ch, i) => text(ch, cx, y0 + i * gap + size * 0.36, f, col, 'center', alpha));
}
function kicker(x, y, str, col, p, barCol) {
  // 56×5 酒红短线压在栏目标签上：短线从左长出 + 标签擦出
  if (p <= 0) return;
  ctx.fillStyle = barCol || C.claret; ctx.fillRect(x, y - 44, 56 * eOC(p), 5);
  wipeText(str, x, y, F(700, 30, SANS), col, 30, pr(p, 0.15, 0.85));
}
function docIcon(x, y, w, h, col, fill) {
  const f = w * 0.28;
  ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.fillStyle = fill || C.sheet;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w - f, y); ctx.lineTo(x + w, y + f); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + w - f, y); ctx.lineTo(x + w - f, y + f); ctx.lineTo(x + w, y + f); ctx.stroke();
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + w * 0.2, y + h * (0.48 + i * 0.16)); ctx.lineTo(x + w * (i === 2 ? 0.6 : 0.8), y + h * (0.48 + i * 0.16)); ctx.stroke(); }
  ctx.restore();
}
function magnifier(x, y, r, col, lw = 3) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + r * 0.7, y + r * 0.7); ctx.lineTo(x + r * 1.6, y + r * 1.6); ctx.stroke(); ctx.restore();
}

// 细线从左长出
function growLine(x1, y, x2, p, col, lw = 1) { if (p > 0) line(x1, y, lerp(x1, x2, eOC(p)), y, col, lw); }
// 关键短语酒红下划线扫出（文字已画好时调用）
function underlineSweep(str, x, y, f, p, col = C.claret, h = 4, dy = 12) { if (p > 0) { ctx.fillStyle = col; ctx.fillRect(x, y + dy, tw(str, f) * eOC(p), h); } }

window.ED = {
  W, H, C, SERIF, SANS, INTER, F,
  clamp, lerp, eOQ, eOC, eIC, eIO, pr, lr, mix, rgba, mulberry, kf,
  loadFonts, fontCheck, loadImg,
  font, tw, text, maskLine, wipeText, line, arrowHead, rect, rrect, strokeCW, vtext, kicker, docIcon, magnifier, growLine, underlineSweep,
  setCtx: c => { ctx = c; }, get ctx() { return ctx; }
};
})();
