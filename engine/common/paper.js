// 原文截图「实体纸」组件（卡 ④）。全片公用。
// 截图来源：engine/tools/capture.mjs 用本机 Chrome 3× 截取网页原文 → <名>@3x.png + regions.json（区域与短语词框，CSS px，相对各自截图）；
// PDF 论文页用 pdftoppm 300dpi 渲染 + pdftotext -bbox 取词框（见 examples/demo）。
// 规则：原文上的荧光笔 = 黄 rgba(250,199,117,0.7)，跟口播从左往右；我们的批注 = 酒红；原文清晰停留 ≥3 秒（不含推拉）；
// 推近不超过截图分辨率：屏幕宽 / CSS 宽 ≤ dpr（3×截图 → 最多 3 倍）。
(function () {
'use strict';
const E = window.ED;
const HL = 'rgba(250,199,117,0.7)';

// 把截图区域（CSS 尺寸 regionW×regionH）放进屏幕矩形 rect，返回 CSS→屏幕 的映射
function mapper(rect, regionW) {
  const k = rect.w / regionW;
  return { k, x: cx => rect.x + cx * k, y: cy => rect.y + cy * k, r: q => ({ x: rect.x + q.x * k, y: rect.y + q.y * k, w: q.w * k, h: q.h * k }) };
}

// 画一张实体纸。opts:
//   img        截图 Image；src = [sx,sy,sw,sh]（截图像素，可选，裁一块）
//   rect       {x,y,w,h} 屏幕位置（h 应按截图宽高比算：paperH(w, regionW, regionH)）
//   rot        角度（度），默认 0；初次出现可用 -1.5° 表示实体纸
//   lift       0–1，阴影强度（浮起）
//   alpha      整体透明度
//   flip       0–1 翻页进度；>0.5 显示 back(img2/src2)；翻页 0.8s，画出纸背明暗
//   bg         纸色，默认 #F9F8F5（米白网页底色；PDF 页可传 #FFFFFF）
function drawPaper(o) {
  const ctx = E.ctx; const r = o.rect;
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  ctx.save();
  ctx.globalAlpha *= (o.alpha == null ? 1 : o.alpha);
  ctx.translate(cx, cy); ctx.rotate((o.rot || 0) * Math.PI / 180);
  const fl = o.flip || 0; const sx = fl > 0 && fl < 1 ? Math.abs(Math.cos(Math.PI * fl)) : 1; const back = fl >= 0.5;
  ctx.scale(Math.max(0.02, sx), 1);
  const lift = o.lift == null ? 0.5 : o.lift;
  ctx.shadowColor = `rgba(51,48,46,${0.16 + 0.12 * lift})`; ctx.shadowBlur = 14 + 22 * lift; ctx.shadowOffsetY = 6 + 10 * lift;
  ctx.fillStyle = o.bg || '#F9F8F5'; ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h);
  ctx.shadowColor = 'transparent';
  const im = back ? o.img2 : o.img, src = back ? o.src2 : o.src;
  if (im) { if (src) ctx.drawImage(im, src[0], src[1], src[2], src[3], -r.w / 2, -r.h / 2, r.w, r.h); else ctx.drawImage(im, -r.w / 2, -r.h / 2, r.w, r.h); }
  if (fl > 0 && fl < 1) { ctx.fillStyle = `rgba(51,48,46,${0.22 * (1 - sx)})`; ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h); }
  ctx.restore();
}
const paperH = (w, regionW, regionH) => w * regionH / regionW;

// 黄色荧光笔：在词框 rects（CSS，相对截图）上从左往右划，多行按总长度顺序扫；p 0–1
function sweep(rects, map, p, col = HL) {
  const ctx = E.ctx; if (!rects || p <= 0) return;
  const uniq = []; rects.forEach(q => { if (!uniq.some(u => Math.abs(u.x - q.x) < 0.5 && Math.abs(u.y - q.y) < 0.5)) uniq.push(q); });
  const tot = uniq.reduce((a, q) => a + q.w, 0); let L = tot * E.clamp(p);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = col;
  uniq.forEach(q => { const w = Math.min(q.w, Math.max(0, L)); L -= q.w; if (w <= 0) return; ctx.fillRect(map.x(q.x - 2), map.y(q.y + 1), (w + 4) * map.k, (q.h + 1) * map.k); });
  ctx.restore();
}
// 按时间表划：list = [[rects, t0, dur], ...]
function highlights(t, list, map) { list.forEach(([rects, t0, d]) => sweep(rects, map, E.eIO(E.pr(t, t0, d)))); }

// 酒红批注：给原文词框加下划线（我们的标注，不和黄色混用）
function claretUnderline(rects, map, p, lw = 4) {
  const ctx = E.ctx; if (!rects || p <= 0) return;
  const tot = rects.reduce((a, q) => a + q.w, 0); let L = tot * E.eOC(p);
  ctx.fillStyle = E.C.claret;
  rects.forEach(q => { const w = Math.min(q.w, Math.max(0, L)); L -= q.w; if (w > 0) ctx.fillRect(map.x(q.x), map.y(q.y + q.h + 2), w * map.k, lw); });
}
// 酒红圈注（外框顺时针描边）
function claretBox(rect, p, lw = 3) { E.strokeCW({ x: rect.x - 6, y: rect.y - 4, w: rect.w + 12, h: rect.h + 8 }, p, E.C.claret, lw); }

// 推进 / 拉远：from → to 两个屏幕矩形之间插值（保持截图比例），返回当前矩形
function push(t, t0, dur, from, to) { return E.lr(from, to, E.eIO(E.pr(t, t0, dur))); }

window.Paper = { drawPaper, paperH, mapper, sweep, highlights, claretUnderline, claretBox, push, HL };
})();
