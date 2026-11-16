// 06 · 发件箱（s06-1 ~ s06-4）。g3。
// 镜头：6A 五格落地 →「发件箱」格变签，右栏卡从该格长出：左「普通 Agent 边生成边推」/ 右「always-on 后台干完只给结果」；
// 6B 两栏向两侧退场，原文发件箱图（700b5f）实体纸从下浮起，三种结束方式依次酒红圈注；
// 6C 图缩到右上，原文 send / recover 段从左滑入（黄笔），下方两张选择卡；随后图推近到 Outbox 表 + Dispatcher，右栏批注；
// 6D 图退场，原文 noisy / evals / start quiet 段（黄笔）+ 发多少刻度示意：太多 = 噪音，太少 = 漏事，评测找平衡，先少发。
(function () {
'use strict';
const E = window.ED, K = window.Kit;
const { C, SERIF, SANS, INTER, F, clamp, lerp, eOQ, eOC, eIC, eIO, pr, mix, tw, text } = E;
let ctx = null, T = 0, M = {}, IMG = {}, RG = null;

// ---------- 五格母图（MOTHER.md 原样） ----------
const M5 = (() => {
  const NAMES = ['事件收件箱', '定时器', '记忆', '权限', '发件箱'];
  const EN = ['Event inbox', 'Timers', 'Memory', 'Permissions', 'Outbox'];
  const NUM = ['02', '03', '04', '05', '06'];
  const BIG = { x: 96, y: 420, w: 1728, h: 260, gap: 24 };
  const CHIP = { x: 96, y: 92, w: 360, h: 68 };
  const big = i => { const w = (BIG.w - BIG.gap * 4) / 5; return { x: BIG.x + i * (w + BIG.gap), y: BIG.y, w, h: BIG.h }; };
  const LR = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });
  function cell(i, r, lit = 0, alpha = 1, s = 1) {
    if (alpha <= 0) return; const ctx = E.ctx; ctx.save(); ctx.globalAlpha *= alpha;
    ctx.fillStyle = mix(C.wheat, C.claret, lit); ctx.fillRect(r.x, r.y, r.w, r.h);
    const on = lit > 0.5, cx = r.x + r.w / 2;
    text(NUM[i], r.x + 22 * s, r.y + 46 * s, F(700, 30 * s, INTER), on ? '#FFFFFF' : C.claret);
    text(NAMES[i], cx, r.y + r.h / 2 + 22 * s, F(800, 52 * s, SERIF), on ? '#FFFFFF' : C.black, 'center');
    text(EN[i], cx, r.y + r.h - 30 * s, F(500, 26 * s, SANS), on ? '#F7E6EC' : C.ink2, 'center');
    ctx.restore();
  }
  function chip(i, r, alpha = 1) {
    if (alpha <= 0) return; const ctx = E.ctx; ctx.save(); ctx.globalAlpha *= alpha;
    ctx.fillStyle = C.claret; ctx.fillRect(r.x, r.y, r.w, r.h);
    const k = r.h / CHIP.h; text(NUM[i], r.x + 24 * k, r.y + r.h / 2 + 11 * k, F(700, 30 * k, INTER), '#FFFFFF');
    text(NAMES[i], r.x + 80 * k, r.y + r.h / 2 + 12 * k, F(800, 34 * k, SERIF), '#FFFFFF');
    ctx.restore();
  }
  function row(lit = [0, 0, 0, 0, 0], enter = 1, alpha = 1) {
    for (let i = 0; i < 5; i++) {
      const p = eOC(clamp(enter * 1.6 - i * 0.15)); if (p <= 0) continue;
      const r = big(i); cell(i, { x: r.x, y: r.y + (1 - p) * 40, w: r.w, h: r.h }, lit[i], alpha * clamp(p * 1.5));
    }
  }
  function intro(t, i, tGo) {
    const lit = eOC(pr(t, 0.2, 0.45)), p = eIO(pr(t, tGo, 0.7)), fo = pr(t, tGo, 0.35);
    for (let k = 0; k < 5; k++) if (k !== i && fo < 1) { const r = big(k); cell(k, { x: r.x, y: r.y + eIO(fo) * 50, w: r.w, h: r.h }, 0, 1 - fo); }
    if (p < 0.6) { const r = LR(big(i), CHIP, p); cell(i, r, lit, 1, lerp(1, 0.4, p)); return r; }
    const r = LR(big(i), CHIP, p); chip(i, r); return r;
  }
  return { NAMES, EN, NUM, BIG, CHIP, big, cell, chip, row, intro, LR };
})();

// ---------- 小图标 ----------
function keyIcon(x, y, s, col) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = Math.max(3, s * 0.14); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x - s * 0.3, y, s * 0.26, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - s * 0.04, y); ctx.lineTo(x + s * 0.55, y); ctx.moveTo(x + s * 0.4, y); ctx.lineTo(x + s * 0.4, y + s * 0.2); ctx.moveTo(x + s * 0.55, y); ctx.lineTo(x + s * 0.55, y + s * 0.24); ctx.stroke();
  ctx.restore();
}
function person(x, y, s, col) {
  ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y - s * 0.32, s * 0.22, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y + s * 0.42, s * 0.42, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.restore();
}
function pauseIcon(x, y, s, col) { ctx.fillStyle = col; ctx.fillRect(x - s * 0.32, y - s * 0.4, s * 0.22, s * 0.8); ctx.fillRect(x + s * 0.1, y - s * 0.4, s * 0.22, s * 0.8); }
function box(cxp, cyp, w, h, title, sub, o = {}) {
  const r = { x: cxp - w / 2, y: cyp - h / 2, w, h };
  K.card(r, { fill: o.fill || C.sheet, stroke: o.stroke || C.rule, lw: o.lw || 2, r: 10, lift: o.lift == null ? 0.3 : o.lift, alpha: o.alpha });
  const a = o.alpha == null ? 1 : o.alpha;
  if (title) text(title, cxp, r.y + (sub ? 50 : h / 2 + 12), F(700, o.fs || 32, SANS), o.tcol || C.black, 'center', a);
  if (sub) text(sub, cxp, r.y + 92, F(500, 28, SANS), o.scol || C.ink, 'center', a);
  return r;
}
function tagShi(x, y, a = 1) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.5; ctx.strokeRect(x, y - 26, 66, 34); text('示意', x + 33, y - 1, F(500, 26, SANS), C.ink2, 'center'); ctx.restore(); }
function envelope(x, y, w, h, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = C.ink; ctx.lineWidth = 2.5;
  ctx.fillRect(x - w / 2, y - h / 2, w, h); ctx.strokeRect(x - w / 2, y - h / 2, w, h);
  ctx.beginPath(); ctx.moveTo(x - w / 2, y - h / 2); ctx.lineTo(x, y + h * 0.08); ctx.lineTo(x + w / 2, y - h / 2); ctx.stroke(); ctx.restore();
}



// 原文图（700b5f，1506×739 像素）里的框（图像像素）
const BX = { nothing: [297, 195, 221, 105], send: [296, 358, 222, 107], ask: [297, 522, 221, 106], outbox: [566, 62, 470, 565], disp: [1084, 360, 234, 104], user: [1335, 360, 120, 115] };
function ringBox(map, b, p, lw = 4) { if (p <= 0) return; E.strokeCW({ x: map.x(b[0]) - 6, y: map.y(b[1]) - 6, w: b[2] * map.k + 12, h: b[3] * map.k + 12 }, eOC(p), C.claret, lw); }

// ---------- 6A：两种送达方式 ----------
const STREAM = ['正在搜索今天的新闻…', '读到一篇讲 Agent 的…', '这篇和你的关注有关…', '开始写摘要…', '第 1 条：……'];
function compare(t) {
  if (t < M.tGo || t > M.d0 + 0.8) return;
  const out = eIO(pr(t, M.d0, 0.7));
  // 左：普通 Agent
  ctx.save(); ctx.translate(-1000 * out, 0);
  const [sl, al] = K.pop(t, M.tGo + 0.4, 0.5);
  K.withScale(498, 525, sl, al, () => {
    K.card({ x: 96, y: 190, w: 804, h: 670 }, { fill: C.sheet, stroke: C.rule, lw: 2, r: 10, lift: 0.3 });
    E.kicker(136, 270, '普通 Agent', C.black, 1);
    tagShi(800, 268, 1);
    K.card({ x: 136, y: 310, w: 724, h: 400 }, { fill: '#FFFFFF', stroke: C.rule, lw: 2, r: 14, lift: 0.1 });
    STREAM.forEach((s, i) => E.wipeText(s, 168, 370 + i * 70, F(500, 30, SANS), i === STREAM.length - 1 ? C.black : C.ink, 30, pr(t, Math.min(M.strm, M.norm) + i * 0.45, 0.4)));
    E.wipeText('边生成边推给你', 136, 790, F(800, 36, SERIF), C.claret, 36, pr(t, M.strm, 0.6));
  });
  ctx.restore();
  // 右：always-on agent，从「发件箱」格长出
  ctx.save(); ctx.translate(1000 * out, 0);
  const g = eIO(pr(t, M.tGo + 0.15, 0.8)); if (g > 0) {
    const r = M5.LR(M5.big(4), { x: 1000, y: 190, w: 824, h: 670 }, g);
    K.card(r, { fill: C.sheet, stroke: C.rule, lw: 2, r: 10, lift: 0.3 });
    const a = pr(t, Math.min(M.aon - 0.2, M.tGo + 1.0), 0.5);
    if (a > 0) {
      E.kicker(1040, 270, 'always-on agent', C.black, a);
      K.card({ x: 1040, y: 310, w: 744, h: 200 }, { fill: C.wheat, r: 10, lift: 0, alpha: a });
      text('后台', 1080, 380, F(800, 34, SERIF), C.ink, 'left', a);
      // 进度环（确定性）
      const pp = clamp((t - M.aon) / 4.0);
      ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = C.rule; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(1700, 410, 48, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = C.oxford; ctx.beginPath(); ctx.arc(1700, 410, 48, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pp); ctx.stroke(); ctx.restore();
      E.wipeText('活大多在后台干完', 1080, 450, F(700, 30, SANS), C.ink, 30, pr(t, M.bg - 0.2, 0.6));
    }
    const pres = pr(t, M.res - 0.2, 0.5);
    if (pres > 0) {
      K.arrow(1412, 516, 1412, 560, pres, C.ink, 3);
      const [s, al2] = K.pop(t, M.res, 0.5);
      K.withScale(1412, 650, s, al2, () => {
        K.card({ x: 1040, y: 570, w: 744, h: 160 }, { fill: '#FFFFFF', stroke: C.claret, lw: 3, r: 14, lift: 0.4 });
        text('今日 Agent 新闻简报', 1076, 630, F(700, 32, SANS), C.black);
        text('结果 + 几条来源', 1076, 682, F(500, 28, SANS), C.ink);
        tagShi(1700, 630, 1);
      });
      E.wipeText('只拿到结果和少量细节', 1040, 800, F(800, 36, SERIF), C.claret, 36, pr(t, M.res + 0.2, 0.6));
    }
  }
  ctx.restore();
}

// ---------- 6B/6C/6D：原文发件箱图 ----------
function diagram(t) {
  if (t < M.d0 - 0.1 || t > M.q0 + 0.9) return;
  const DV = K.V(0.95, 753, 370, 244, 176, 1431, 702);
  const DV0 = K.V(0.95, 753, 370, 244, 1100, 1431, 702);
  const DV2 = K.V(0.54, 753, 370, 1010, 200, 814, 400);
  const ZV = K.V(1.15, 1000, 345, 96, 180, 1150, 700);
  const OUT = K.V(1.15, 1000, 345, -1200, 180, 1150, 700);
  const v = K.kview(t, [[M.d0, DV0], [M.d0 + 0.8, DV], [M.c0, DV], [M.c0 + 0.8, DV2], [M.z0, DV2], [M.z0 + 0.8, ZV], [M.q0, ZV], [M.q0 + 0.8, OUT]]);
  K.view(IMG.odiag, 1, v, { bg: '#FFFFFF', lift: 0.5, rot: lerp(-1.5, 0, eIO(pr(t, M.d0, 0.8))), over: map => {
    ringBox(map, BX.send, pr(t, M.e1, 0.5)); ringBox(map, BX.nothing, pr(t, M.e2, 0.5)); ringBox(map, BX.ask, pr(t, M.e3, 0.5));
    ringBox(map, BX.outbox, pr(t, M.tbl, 0.6)); ringBox(map, BX.disp, pr(t, M.disp, 0.5));
  } });
  // 三种结束方式：酒红编号
  if (t < M.c0 + 0.2) {
    const map = { x: q => v.rect.x + v.rect.w / 2 + (q - v.cx) * v.k, y: q => v.rect.y + v.rect.h / 2 + (q - v.cy) * v.k };
    [[BX.send, M.e1, '1'], [BX.nothing, M.e2, '2'], [BX.ask, M.e3, '3']].forEach(([b, tt, n]) => {
      const [s, a] = K.pop(t, tt + 0.2, 0.4); if (a <= 0) return;
      const x = map.x(b[0]) - 34, y = map.y(b[1]) + b[3] * v.k / 2;
      K.withScale(x, y, s, a * (1 - pr(t, M.c0, 0.2)), () => { ctx.fillStyle = C.claret; ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill(); text(n, x, y + 10, F(800, 28, INTER), '#FFFFFF', 'center'); });
    });
  }
}
// 原文正文纸（out 截图，CSS 宽 720）：6C send/recover 段 → 6D noisy/evals/quiet 段
function textPaper(t) {
  if (t < M.c0 || (t > M.z0 + 0.9 && t < M.q0 - 0.1)) return;
  const S = RG.shots.out.phrases;
  let v;
  if (t < M.q0 - 0.1) {
    const TV = K.V(1.35, 360, 962, 96, 220, 880, 210), T0 = K.V(1.35, 360, 962, -900, 220, 880, 210);
    v = K.kview(t, [[M.c0, T0], [M.c0 + 0.8, TV], [M.z0, TV], [M.z0 + 0.8, T0]]);
  } else {
    const QV = K.V(1.5, 360, 1378, 96, 170, 1100, 320), Q0 = K.V(1.5, 360, 1378, 2000, 170, 1100, 320);
    v = K.kview(t, [[M.q0, Q0], [M.q0 + 0.8, QV]]);
  }
  K.view(IMG.out, 3, v, { bg: '#FAF9F5', lift: 0.5, over: map => {
    K.sweep(S.send, map, eIO(pr(t, M.sendT, 0.9))); K.sweep(S.recover, map, eIO(pr(t, M.rec, 0.6)));
    K.sweep(S.noisy, map, eIO(pr(t, M.many, 0.8))); K.sweep(S.miss, map, eIO(pr(t, M.few, 0.8)));
    K.sweep(S.evals, map, eIO(pr(t, M.ev, 0.9))); K.sweep(S.quiet, map, eIO(pr(t, M.quiet, 1.0)));
  } });
}
// 6C：两张选择卡 → B 卡升到右栏当标题，下面两条批注
function options(t) {
  if (t < M.c0 + 0.3 || t > M.q0 + 0.9) return;
  const outA = eIO(pr(t, M.z0, 0.7)), outAll = eIO(pr(t, M.q0, 0.7));
  ctx.save(); ctx.translate(-1300 * outAll, 0);
  // A：send 工具够用
  const [sa, aa] = K.pop(t, M.sendT - 0.2, 0.5);
  if (outA < 1) K.withScale(498, 710, sa, aa, () => {
    ctx.save(); ctx.translate(-1000 * outA, 0);
    K.card({ x: 96, y: 560, w: 804, h: 300 }, { fill: C.sheet, stroke: C.teal, lw: 3, r: 10, lift: 0.3 });
    E.kicker(130, 640, '多数情况', C.black, 1);
    text('一个 send 工具，直接发给用户', 130, 700, F(700, 32, SANS), C.black);
    K.agent(250, 790, { label: 'Agent', w: 220, h: 80, lift: 0.1 });
    K.arrow(370, 790, 560, 790, 1, C.teal, 3); text('send', 465, 776, F(700, 28, INTER), C.teal, 'center');
    ctx.save(); person(620, 792, 52, C.ink); ctx.restore(); text('用户', 670, 802, F(700, 28, SANS), C.ink);
    K.check(820, 780, 40, pr(t, M.sendT + 0.5, 0.5), C.teal, 6);
    ctx.restore();
  });
  // B：正式发件箱
  const [sb, ab] = K.pop(t, M.pace - 0.2, 0.5);
  const rb = E.lr({ x: 960, y: 560, w: 864, h: 300 }, { x: 1290, y: 180, w: 534, h: 210 }, outA);
  K.withScale(rb.x + rb.w / 2, rb.y + rb.h / 2, sb, ab, () => {
    K.card(rb, { fill: C.sheet, stroke: C.claret, lw: 3, r: 10, lift: 0.3 });
    E.kicker(rb.x + 34, rb.y + 80, '要控节奏 / 出错要恢复', C.black, 1);
    text('才需要正式发件箱', rb.x + 34, rb.y + 140, F(800, 40, SERIF), C.claret);
  });
  // 批注：表 / dispatcher
  const n1 = pr(t, M.tbl, 0.5), n2 = pr(t, M.disp, 0.5);
  if (n1 > 0) { K.card({ x: 1290, y: 420, w: 534, h: 170 }, { fill: C.sheet, stroke: C.rule, lw: 2, r: 10, lift: 0.25, alpha: clamp(n1 * 2) });
    E.wipeText('Outbox = 一张表', 1324, 488, F(800, 34, SERIF), C.black, 34, n1); E.wipeText('存还没发的消息（pending）', 1324, 548, F(500, 28, SANS), C.ink, 28, pr(t, M.tbl + 0.3, 0.5)); }
  if (n2 > 0) { K.card({ x: 1290, y: 620, w: 534, h: 230 }, { fill: C.sheet, stroke: C.rule, lw: 2, r: 10, lift: 0.25, alpha: clamp(n2 * 2) });
    E.wipeText('Dispatcher', 1324, 690, F(800, 34, INTER), C.black, 34, n2); E.wipeText('后台服务', 1324, 746, F(500, 28, SANS), C.ink, 28, pr(t, M.disp + 0.3, 0.5));
    E.wipeText('决定发哪些、什么时候发', 1324, 800, F(700, 28, SANS), C.claret, 28, pr(t, M.dec, 0.6)); }
  ctx.restore();
}
// 6D：发多少（刻度示意）
function gauge(t) {
  if (t < M.q0 + 0.2) return;
  const a = pr(t, M.q0 + 0.3, 0.6);
  const x0 = 200, x1 = 1720, y = 800;
  ctx.save(); ctx.globalAlpha *= clamp(a * 2);
  E.growLine(x0, y, x1, a, C.ink, 3);
  for (let i = 0; i <= 10; i++) E.line(x0 + (x1 - x0) * i / 10, y - 8, x0 + (x1 - x0) * i / 10, y + 8, C.ink2, 2);
  text('太少', x0, y + 50, F(800, 32, SERIF), C.black, 'center'); text('太多', x1, y + 50, F(800, 32, SERIF), C.black, 'center');
  tagShi(1740, 530, 1);
  ctx.restore();
  const m = E.kf(t, [[M.q0, 0.5], [M.many, 0.5], [M.many + 0.8, 0.92], [M.few, 0.92], [M.few + 0.8, 0.08], [M.ev, 0.08], [M.ev + 0.8, 0.5], [M.quiet, 0.5], [M.quiet + 0.8, 0.28]]);
  const mx = lerp(x0, x1, m);
  // 评测找平衡：中段色带
  const pb = pr(t, M.ev, 0.6);
  if (pb > 0) { ctx.fillStyle = E.rgba(C.oxford, 0.14); ctx.fillRect(lerp(x0, x1, 0.32), y - 24, (x1 - x0) * 0.36 * eOC(pb), 48); text('评测找平衡', 960, y + 50, F(700, 30, SANS), C.oxford, 'center', pb); }
  // 消息堆：数量随刻度
  if (a > 0) {
    const n = 1 + Math.round(m * 4);
    for (let i = 0; i < n; i++) { const yy = y - 70 - i * 52; K.card({ x: mx - 90, y: yy - 22, w: 180, h: 44 }, { fill: C.sheet, stroke: C.rule, lw: 2, r: 5, lift: 0.1 }); text('消息', mx, yy + 10, F(700, 28, SANS), C.ink, 'center'); }
    ctx.fillStyle = C.claret; ctx.beginPath(); ctx.moveTo(mx, y - 12); ctx.lineTo(mx - 12, y - 32); ctx.lineTo(mx + 12, y - 32); ctx.closePath(); ctx.fill();
  }
  // 太多 = 噪音；太少 = 漏掉要紧的事
  const pn = pr(t, M.many + 0.6, 0.4) * (1 - pr(t, M.few, 0.3));
  if (pn > 0) text('噪音', lerp(x0, x1, 0.92) - 120, y - 200, F(800, 36, SERIF), C.claret, 'right', pn);
  const pm = pr(t, M.few + 0.6, 0.4) * (1 - pr(t, M.ev, 0.3));
  if (pm > 0) {
    ctx.save(); ctx.globalAlpha *= pm; ctx.setLineDash([7, 6]); ctx.strokeStyle = C.claret; ctx.lineWidth = 3; ctx.strokeRect(lerp(x0, x1, 0.08) + 110, y - 140, 220, 56); ctx.restore();
    text('要紧的事', lerp(x0, x1, 0.08) + 220, y - 101, F(700, 28, SANS), C.claret, 'center', pm);
    K.cross(lerp(x0, x1, 0.08) + 360, y - 112, 26, pm, C.claret, 5); text('漏掉', lerp(x0, x1, 0.08) + 390, y - 101, F(800, 32, SERIF), C.claret, 'left', pm);
  }
  // 先少发，再慢慢多发
  const pq = pr(t, M.quiet + 0.2, 0.5);
  if (pq > 0) { K.arrow(lerp(x0, x1, 0.3) + 120, y - 190, lerp(x0, x1, 0.5), y - 190, pq, C.claret, 4, 14); E.wipeText('先少发，再慢慢多发', lerp(x0, x1, 0.3) + 120, y - 215, F(800, 34, SERIF), C.claret, 34, pq); }
}
// 6D 右上：原文结论两句（我们的标注）
function quietNote(t) {
  if (t < M.q0 + 0.4) return;
  const a = pr(t, M.ev, 0.5); if (a <= 0) return;
  K.card({ x: 1236, y: 170, w: 588, h: 300 }, { fill: C.sheet, stroke: C.rule, lw: 2, r: 10, lift: 0.25, alpha: clamp(a * 2) });
  E.kicker(1270, 250, 'Anthropic 建议', C.black, a);
  E.wipeText('做评测找平衡', 1270, 320, F(800, 38, SERIF), C.black, 38, pr(t, M.ev + 0.2, 0.6));
  E.wipeText('一开始宁可少发', 1270, 390, F(800, 38, SERIF), C.claret, 38, pr(t, M.quiet, 0.6));
}

window.Chapter = {
  sources: [],
  texts: '',
  async init(data) {
    T = data.T; const A = data.A, st = data.st, en = data.en;
    IMG = data.img; RG = data.json.reg;
    M.tGo = Math.max(1.4, A('s06-1', '管结果'));
    M.norm = Math.max(M.tGo + 0.8, A('s06-1', '普通 Agent')); M.strm = Math.max(M.norm + 0.4, A('s06-1', '边生成'));
    M.aon = Math.max(M.strm + 0.8, A('s06-1', 'always-on agent')); M.bg = A('s06-1', '后台干完'); M.res = Math.max(M.bg + 0.6, A('s06-1', '只拿到结果'));
    M.d0 = st('s06-2') - 0.4; M.e1 = A('s06-2', '发一条消息'); M.e2 = A('s06-2', '没什么要说'); M.e3 = A('s06-2', '延后调用');
    M.c0 = Math.max(st('s06-3') - 0.2, M.d0 + 4.0); M.sendT = Math.max(M.c0 + 0.6, A('s06-3', 'send 工具')); M.pace = A('s06-3', '要控制'); M.rec = A('s06-3', '出错了');
    M.tbl = A('s06-3', '一张待发消息的表'); M.z0 = M.tbl - 0.5; M.disp = A('s06-3', 'dispatcher'); M.dec = A('s06-3', '决定发哪些');
    M.q0 = st('s06-4') - 0.3; M.many = Math.max(M.q0 + 1.2, A('s06-4', '发太多')); M.few = Math.max(M.many + 1.2, A('s06-4', '发太少')); M.ev = Math.max(M.few + 1.2, A('s06-4', '做评测')); M.quiet = Math.max(M.ev + 1.0, A('s06-4', '宁可少发'));
    window.__M = M;
    const cue = data.cue;
    cue(M.tGo, 'whoosh', 0.6); cue(M.norm - 0.3, 'pop', 0.5); for (let i = 0; i < 5; i++) cue(M.strm + i * 0.45, 'tick', 0.3); cue(M.res, 'pop', 0.6);
    cue(M.d0, 'paper', 0.8); cue(M.e1, 'marker', 0.5); cue(M.e2, 'marker', 0.5); cue(M.e3, 'marker', 0.5);
    cue(M.c0, 'whoosh', 0.6); cue(M.sendT, 'marker', 0.6); cue(M.pace, 'pop', 0.5); cue(M.z0, 'whoosh', 0.6); cue(M.tbl, 'pop', 0.5); cue(M.disp, 'pop', 0.5);
    cue(M.q0, 'paper', 0.7); cue(M.many, 'marker', 0.5); cue(M.few, 'marker', 0.5); cue(M.ev, 'marker', 0.6); cue(M.quiet, 'marker', 0.7);
    this.sources = [
      [M.d0 + 0.5, 'Anthropic《Building always-on agents》（2026-11-13）· Outbox 一节原图'],
      [M.q0 + 0.5, '同上 · Outbox 一节原文；刻度为示意']
    ];
    this.texts = '普通边生成推给你正在搜索今天的新闻读到一篇讲有关这和关注开始写摘要第条后台活大多在干完今日简报结果几来源只拿和少量细节示意多数情况一个工具直接发用户要控节奏出错恢复才需正式件箱张表存还没消息服务决定哪些什么时候太少多数量评测找平衡噪音紧事漏掉先再慢建议一宁可';
  },
  renderContent(c, t) {
    ctx = c; t = clamp(t, 0, T);
    compare(t);
    diagram(t);
    textPaper(t);
    options(t);
    gauge(t);
    quietNote(t);
    M5.intro(t, 4, M.tGo);
  }
};
})();
