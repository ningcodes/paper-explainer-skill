// ch02 · 事件收件箱（段 02）。g1。
// 镜头：五格母图「事件收件箱」那格变红、飞成左上章节签，睡着的 Agent 从那格长出 → 四种事件源 → 直接调用的两种问题（同时起两次 run / 崩溃丢事件）
// → 收件箱原图实体纸（推近表 / handler / worker）→ 原图里的方块飞出重画成 handler→表→worker→run 动画（状态列、去重）
// → handler、worker 飞到右栏当标题，左边原文经验句黄笔 → 每个用户一个收件箱、一个 worker、连发三条合成一次 run → 续会话 vs 新会话。
(function () {
'use strict';
const E = window.ED, K = window.Kit;
const { C, SERIF, SANS, INTER, F, clamp, lerp, eOQ, eOC, eIC, eIO, pr, mix, tw, text } = E;
let ctx = null, M = {}, IMG = {}, REG = null;

// ===== 五格母图（full/MOTHER.md 原样）=====
const M5 = (() => {
  const NAMES = ['事件收件箱', '定时器', '记忆', '权限', '发件箱'];
  const EN = ['Event inbox', 'Timers', 'Memory', 'Permissions', 'Outbox'];
  const NUM = ['02', '03', '04', '05', '06'];
  const BIG = { x: 96, y: 420, w: 1728, h: 260, gap: 24 };
  const CHIP = { x: 96, y: 92, w: 360, h: 68 };
  const big = i => { const w = (BIG.w - BIG.gap * 4) / 5; return { x: BIG.x + i * (w + BIG.gap), y: BIG.y, w, h: BIG.h }; };
  const LR = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });
  function cell(i, r, lit = 0, alpha = 1, s = 1) {
    if (alpha <= 0) return; const c = E.ctx; c.save(); c.globalAlpha *= alpha;
    c.fillStyle = mix(C.wheat, C.claret, lit); c.fillRect(r.x, r.y, r.w, r.h);
    const on = lit > 0.5, cx = r.x + r.w / 2;
    text(NUM[i], r.x + 22 * s, r.y + 46 * s, F(700, 30 * s, INTER), on ? '#FFFFFF' : C.claret);
    text(NAMES[i], cx, r.y + r.h / 2 + 22 * s, F(800, 52 * s, SERIF), on ? '#FFFFFF' : C.black, 'center');
    text(EN[i], cx, r.y + r.h - 30 * s, F(500, 26 * s, SANS), on ? '#F7E6EC' : C.ink2, 'center');
    c.restore();
  }
  function chip(i, r, alpha = 1) {
    if (alpha <= 0) return; const c = E.ctx; c.save(); c.globalAlpha *= alpha;
    c.fillStyle = C.claret; c.fillRect(r.x, r.y, r.w, r.h);
    const k = r.h / CHIP.h; text(NUM[i], r.x + 24 * k, r.y + r.h / 2 + 11 * k, F(700, 30 * k, INTER), '#FFFFFF');
    text(NAMES[i], r.x + 80 * k, r.y + r.h / 2 + 12 * k, F(800, 34 * k, SERIF), '#FFFFFF');
    c.restore();
  }
  function intro(t, i, tGo) {
    const lit = eOC(pr(t, 0.2, 0.45)), p = eIO(pr(t, tGo, 0.7)), fo = pr(t, tGo, 0.35);
    for (let k = 0; k < 5; k++) if (k !== i && fo < 1) { const r = big(k); cell(k, { x: r.x, y: r.y + eIO(fo) * 50, w: r.w, h: r.h }, 0, 1 - fo); }
    if (p < 0.6) { const r = LR(big(i), CHIP, p); cell(i, r, lit, 1, lerp(1, 0.4, p)); return r; }
    const r = LR(big(i), CHIP, p); chip(i, r); return r;
  }
  return { NAMES, EN, NUM, BIG, CHIP, big, cell, chip, intro, LR };
})();

const LR = M5.LR;
function box(r, title, sub, o = {}) {
  K.card(r, { fill: o.fill || C.sheet, stroke: o.stroke || C.ink, lw: o.lw || 3, r: 12, lift: 0.3, alpha: o.alpha, dash: o.dash });
  const a = o.alpha == null ? 1 : o.alpha, ta = a * (o.ta == null ? 1 : o.ta);
  if (ta <= 0) return;
  const cx = r.x + r.w / 2;
  if (sub) { text(title, cx, r.y + r.h / 2 - 4, F(800, o.fs || 38, /[一-鿿]/.test(title) ? SERIF : INTER), o.tcol || C.black, 'center', ta); text(sub, cx, r.y + r.h / 2 + 38, F(500, 28, SANS), o.scol || C.ink2, 'center', ta); }
  else text(title, cx, r.y + r.h / 2 + 13, F(800, o.fs || 38, /[一-鿿]/.test(title) ? SERIF : INTER), o.tcol || C.black, 'center', ta);
}
function dedupe(rs) { const u = []; (rs || []).forEach(q => { if (!u.some(v => Math.abs(v.x - q.x) < 1 && Math.abs(v.y - q.y) < 1)) u.push(q); }); return u; }

// ===== A：事件源 + 睡着的 Agent，直接调用的两种问题 =====
const AG = { x: 1180, y: 200, w: 644, h: 660 };   // v2：铺满 y200–860
const SRC = [['你发来的消息', ''], ['webhook', '别的系统有变化时推过来'], ['定时任务', ''], ['后台作业', '']];
const srcR = i => ({ x: 96, y: 200 + i * 172, w: 640, h: 144 });   // v2：四张一次排满 y200–860
const tgtY = (r, i) => r.y + 150 + i * 120;
function drawA(t) {
  if (t < M.go + 0.1 || t > M.b3 + 0.8) return;
  const out = eIC(pr(t, M.b3, 0.7));
  // Agent：从五格里「事件收件箱」那格的位置长出
  const pg = eIO(pr(t, M.go + 0.15, 0.75));
  const r0 = LR(M5.big(0), AG, pg); const r = { x: r0.x + 900 * out, y: r0.y, w: r0.w, h: r0.h };
  const crash = pr(t, M.crash, 0.3);
  K.card(r, { fill: C.sheet, stroke: crash > 0 ? mix(C.ink, C.claret, crash) : C.ink, lw: 3, r: 12, lift: 0.35, alpha: clamp(pg * 3) * (1 - out) });
  const ta = pr(t, M.go + 0.6, 0.4) * (1 - out);
  text('Agent', r.x + 40, r.y + 76, F(800, 56, INTER), C.black, 'left', ta);
  const asleep = 1 - pr(t, M.direct, 0.3);
  text('睡着 · 不花 token', r.x + r.w / 2, r.y + r.h / 2 + 14, F(700, 40, SANS), C.ink2, 'center', ta * asleep);
  text('Z z z', r.x + r.w / 2, r.y + r.h / 2 - 70, F(800, 56, SERIF), C.gray, 'center', ta * asleep * (1 - pr(t, M.direct, 0.3)));
  // 两次 run 抢
  const pb = pr(t, M.both + 0.55, 0.35);
  if (pb > 0 && t < M.crash + 0.2) {
    const a = pb * (1 - out) * (1 - pr(t, M.crash - 0.1, 0.3));
    [0, 1].forEach(k => { K.card({ x: r.x + 60 + k * 50, y: r.y + 200 + k * 110, w: 400, h: 84 }, { fill: C.wheat, stroke: C.claret, lw: 3, r: 8, lift: 0.15, alpha: a }); text('run ' + (k + 1), r.x + 92 + k * 50, r.y + 254 + k * 110, F(700, 40, INTER), C.claret, 'left', a); });
    K.cross(r.x + r.w - 90, r.y + 300, 70, pr(t, M.fight, 0.4) * (1 - pr(t, M.crash - 0.1, 0.3)));
    text('两次 run 互相抢', r.x + r.w / 2, r.y + r.h - 70, F(800, 40, SERIF), C.claret, 'center', pr(t, M.fight, 0.4) * (1 - pr(t, M.crash - 0.1, 0.3)) * (1 - out));
  }
  if (crash > 0) {
    K.cross(r.x + r.w / 2, r.y + r.h / 2, 120, pr(t, M.crash, 0.45));
    text('崩溃', r.x + 40, r.y + 136, F(800, 44, SERIF), C.claret, 'left', crash * (1 - out));
  }
  // 事件源
  SRC.forEach(([lb, sub], i) => {
    const p = pr(t, M.go + 0.35 + 0.09 * i, 0.45); if (p <= 0) return;
    const nx = i < 3 ? M.src[i + 1] : M.b2;
    const on = eOC(pr(t, M.src[i] - 0.05, 0.3)) * (1 - pr(t, nx - 0.05, 0.3));
    const q = srcR(i); const dx = (1 - eOQ(p)) * -60 - 820 * out;
    const R = { x: q.x + dx, y: q.y, w: q.w, h: q.h }, a = clamp(p * 3);
    K.card(R, { fill: mix(C.sheet, '#FBEFE6', on), stroke: mix(C.rule, C.claret, on), lw: 2 + 2 * on, r: 10, lift: 0.25, alpha: a });
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = C.claret; ctx.beginPath(); ctx.arc(R.x + 40, R.y + R.h / 2, 12 + 4 * on, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    const f = F(800, 42, /[一-鿿]/.test(lb) ? SANS : INTER);
    if (sub) { text(lb, R.x + 76, R.y + 62, f, C.black, 'left', a); text(sub, R.x + 76, R.y + 108, F(500, 30, SANS), C.ink, 'left', a); }
    else text(lb, R.x + 76, R.y + R.h / 2 + 15, f, C.black, 'left', a);
    // 直接调用的箭头
    const pa = pr(t, M.direct + 0.12 * i, 0.5);
    if (pa > 0) K.arrow(R.x + R.w + 10, R.y + R.h / 2, r.x - 12, tgtY(r, i), pa * (1 - out), C.ink, 3, 12);
  });
  text('每个事件源直接调用 Agent', 958, 176, F(800, 34, SERIF), C.ink, 'center', pr(t, M.direct, 0.4) * (1 - out));
  // 两个事件同时到：两颗事件点沿箭头同时跑
  [0, 1].forEach(i => {
    const p = eIO(pr(t, M.both, 0.6)); if (p <= 0 || p >= 1) return;
    const q = srcR(i); const x = lerp(q.x + q.w + 10, r.x - 12, p), y = lerp(q.y + q.h / 2, tgtY(r, i), p);
    ctx.fillStyle = C.claret; ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill();
  });
  // 崩溃丢事件：后台作业那颗事件跑到一半掉下去
  const pl = pr(t, M.crash + 0.1, 0.6);
  if (pl > 0) {
    const q = srcR(3); const ax = q.x + q.w + 10 - 820 * out, ay = q.y + q.h / 2;
    const hx = lerp(ax, r.x - 12, 0.45), hy = lerp(ay, tgtY(r, 3), 0.45);
    const p1 = eIO(clamp(pl)), drop = eIC(pr(t, M.lost, 0.6));
    const x = lerp(ax, hx, p1), y = lerp(ay, hy, p1) + 70 * drop;
    if (drop < 1) { ctx.save(); ctx.globalAlpha *= (1 - drop); ctx.fillStyle = C.claret; ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    const pg2 = pr(t, M.lost + 0.3, 0.4) * (1 - out);
    if (pg2 > 0) { ctx.save(); ctx.globalAlpha *= pg2; ctx.strokeStyle = C.claret; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(hx, hy + 70, 16, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      text('事件整个丢了', hx + 30, hy + 82, F(800, 34, SERIF), C.claret, 'left', pg2); }
  }
}

// ===== B：收件箱原图（bb0854，2040×1821 px）=====
const PR = { hnd: { x: 795, y: 70, w: 530, h: 220 }, tbl: { x: 440, y: 465, w: 1490, h: 825 }, wrk: { x: 440, y: 1485, w: 520, h: 220 }, run: { x: 1475, y: 1485, w: 455, h: 220 } };
const VB = (k, cx, cy, x = 760) => K.V(k, cx, cy, x, 130, 1064, 760);
function viewB(t) {
  return K.kview(t, [[M.b3, VB(0.4, 1020, 910, 1960)], [M.b3 + 0.8, VB(0.4, 1020, 910)], [M.table - 0.2, VB(0.4, 1020, 910)], [M.table + 0.6, VB(0.62, 1185, 880)],
    [M.handler - 0.2, VB(0.62, 1185, 880)], [M.handler + 0.6, VB(0.62, 1100, 560)], [M.worker - 0.2, VB(0.62, 1100, 560)], [M.worker + 0.6, VB(0.62, 1150, 1180)]]);
}
let mapB = null;
function drawB(t) {
  if (t < M.b3 || t > M.b4 + 0.12) return;
  const a = 1 - pr(t, M.b4, 0.1);
  mapB = K.view(IMG.inbox, 1, viewB(t), { bg: '#FFFFFF', lift: 0.5, alpha: a, over: map => {
    const R = q => ({ x: map.x(q.x), y: map.y(q.y), w: q.w * map.k, h: q.h * map.k });
    E.strokeCW(R(PR.tbl), eOC(pr(t, M.table, 0.6)), C.claret, 5);
    E.strokeCW(R(PR.hnd), eOC(pr(t, M.handler, 0.6)), C.claret, 5);
    E.strokeCW(R(PR.wrk), eOC(pr(t, M.worker, 0.6)), C.claret, 5);
  } });
}
const LC = [['一张数据库表', '存事件', 'table'], ['handler', '通常是个 HTTP 接口，往表里写', 'handler'], ['worker', '后台服务，从表里读', 'worker']];
function drawBLeft(t) {
  if (t < M.b3 + 0.4 || t > M.b4 + 0.6) return;
  const out = pr(t, M.b4, 0.4);
  E.kicker(96, 270, '收件箱：三件东西', C.ink, pr(t, M.three3, 0.5) * (1 - out));
  text('事件源只往里写，不再直接调用 Agent', 96, 320, F(500, 30, SANS), C.ink, 'left', pr(t, M.only, 0.5) * (1 - out));
  LC.forEach(([a, b, k], i) => {
    const p = pr(t, M[k], 0.45); if (p <= 0) return;
    const y = 370 + i * 160, al = clamp(p * 3) * (1 - out), dy = (1 - eOQ(p)) * 20;
    K.card({ x: 96, y: y + dy, w: 600, h: 136 }, { fill: C.sheet, stroke: C.claret, lw: 3, r: 10, lift: 0.25, alpha: al });
    text(a, 126, y + dy + 56, F(800, 38, /[一-鿿]/.test(a) ? SERIF : INTER), C.black, 'left', al);
    text(b, 126, y + dy + 104, F(500, 28, SANS), C.ink, 'left', al);
  });
}

// ===== C：重画 handler → 表 → worker → run =====
const HND = { x: 130, y: 250, w: 320, h: 150 }, TBL = { x: 540, y: 200, w: 860, h: 560 }, WRK = { x: 1480, y: 250, w: 320, h: 150 }, RUN = { x: 1480, y: 540, w: 320, h: 150 };
const HND2 = { x: 1240, y: 140, w: 584, h: 104 }, WRK2 = { x: 1240, y: 470, w: 584, h: 104 };
function fromB(q) { return mapB ? { x: mapB.x(q.x), y: mapB.y(q.y), w: q.w * mapB.k, h: q.h * mapB.k } : q; }
let SRCR = null;
function drawC(t) {
  if (t < M.b4 || t > M.b6 + 0.8) return;
  if (!SRCR) return;
  const p = eIO(pr(t, M.b4, 0.8)), sty = clamp((p - 0.65) / 0.35);
  const pD = eIO(pr(t, M.b5, 0.8)), pE = eIC(pr(t, M.b6, 0.6));
  // 表与 run：D 开始时下沉淡出
  const tA = 1 - pD, tdy = 80 * eIC(pD);
  const tb = LR(SRCR.tbl, TBL, p); const T2 = { x: tb.x, y: tb.y + tdy, w: tb.w, h: tb.h };
  if (tA > 0) {
    K.card(T2, { fill: mix('#FFFFFF', '#F3E8DC', sty), stroke: sty > 0 ? C.rule : C.claret, lw: 2, r: 14, lift: 0.2, alpha: tA });
    if (sty > 0) drawTable(t, T2, sty * tA);
    const rr = LR(SRCR.run, RUN, p); const R2 = { x: rr.x, y: rr.y + tdy, w: rr.w, h: rr.h };
    const running = pr(t, M.start, 0.3) * (1 - pr(t, M.done, 0.3));
    box(R2, 'Run', running > 0.5 ? '运行中' : (t > M.done ? '跑完了' : 'Agent 循环'), { alpha: tA, ta: sty, stroke: mix(C.ink, C.claret, running), scol: running > 0.5 ? C.claret : C.ink2 });
  }
  // handler / worker：D 时飞到右栏当标题，E 时退场
  const h1 = LR(LR(SRCR.hnd, HND, p), HND2, pD), w1 = LR(LR(SRCR.wrk, WRK, p), WRK2, pD);
  const ex = 760 * pE, a = 1 - pE;
  box({ x: h1.x + ex, y: h1.y, w: h1.w, h: h1.h }, 'Handler', 'HTTP 接口', { alpha: a, ta: sty });
  const woke = pr(t, M.wake + 0.5, 0.3) * (1 - pD);
  box({ x: w1.x + ex, y: w1.y, w: w1.w, h: w1.h }, 'Worker', '后台服务', { alpha: a, ta: sty, stroke: mix(C.ink, C.claret, woke) });
  if (pD > 0) return;
  // 新事件飞进 handler
  const pe = eIO(pr(t, M.newEv, 0.6));
  if (pe > 0 && pe < 1) { const x = lerp(-80, HND.x + 40, pe); K.card({ x: x - 70, y: 432, w: 140, h: 56 }, { fill: C.claret, r: 8, lift: 0.2 }); text('新事件', x, 470, F(700, 28, SANS), '#FFFFFF', 'center'); }
  if (pe > 0 && pe < 1) K.arrow(HND.x + HND.w / 2, 425, HND.x + HND.w / 2, HND.y + HND.h + 6, 1, C.claret, 3);
  K.arrow(HND.x + HND.w + 8, 325, TBL.x - 8, 325, pr(t, M.write, 0.4), C.claret, 4, 12);
  text('写表', (HND.x + HND.w + TBL.x) / 2, 300, F(700, 28, SANS), C.claret, 'center', pr(t, M.write + 0.2, 0.3));
  // 叫醒 worker：虚线弧
  const pw = pr(t, M.wake, 0.6);
  if (pw > 0) {
    ctx.save(); ctx.strokeStyle = C.claret; ctx.lineWidth = 3; ctx.setLineDash([12, 9]); ctx.beginPath();
    const N = 40, P0 = [HND.x + HND.w / 2, HND.y - 6], P1 = [960, 60], P2 = [WRK.x + WRK.w / 2, WRK.y - 6]; let X = 0, Y = 0, pX = 0, pY = 0;
    for (let i = 0; i <= N * eOC(pw); i++) { const u = i / N; pX = X; pY = Y; X = (1 - u) * (1 - u) * P0[0] + 2 * (1 - u) * u * P1[0] + u * u * P2[0]; Y = (1 - u) * (1 - u) * P0[1] + 2 * (1 - u) * u * P1[1] + u * u * P2[1]; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
    ctx.stroke(); ctx.restore(); if (pw > 0.95) E.arrowHead(X, Y, Math.atan2(Y - pY, X - pX), C.claret, 12, 3);
    text('叫醒', 960, 168, F(800, 32, SERIF), C.claret, 'center', pr(t, M.wake + 0.3, 0.3));
  }
  K.arrow(TBL.x + TBL.w + 8, 420, WRK.x - 8, 340, pr(t, M.read, 0.4), C.claret, 4, 12);
  text('读出待处理', WRK.x + WRK.w / 2, 470, F(700, 28, SANS), C.claret, 'center', pr(t, M.read + 0.2, 0.3));
  K.arrow(WRK.x + WRK.w / 2, WRK.y + WRK.h + 90, WRK.x + WRK.w / 2, RUN.y - 8, pr(t, M.start, 0.4), C.claret, 4, 12);
}
function drawTable(t, r, a) {
  ctx.save(); ctx.globalAlpha *= a;
  text('收件箱 · 数据库表', r.x + 36, r.y + 60, F(800, 36, SERIF), C.claret);
  const cols = [r.x + 40, r.x + 190, r.x + r.w - 40];
  const hy = r.y + 120;
  text('时间', cols[0], hy, F(600, 28, SANS), C.ink2); text('发生了什么', cols[1], hy, F(600, 28, SANS), C.ink2); text('状态', cols[2], hy, F(600, 28, SANS), C.ink2, 'right');
  E.underlineSweep('状态', cols[2] - tw('状态', F(600, 28, SANS)), hy, F(600, 28, SANS), pr(t, M.status, 0.5));
  const row = (i, tm, what, st, stCol, o = {}) => {
    const y = r.y + 150 + i * 96, R = { x: r.x + 24, y, w: r.w - 48, h: 78 };
    K.card(R, { fill: o.fill || '#FFFFFF', stroke: o.stroke || C.rule, lw: o.lw || 2, r: 8, lift: 0.08, dash: o.dash, alpha: o.alpha });
    const al = o.alpha == null ? 1 : o.alpha, col = o.gray ? C.gray : C.ink;
    text(tm, cols[0], y + 50, F(600, 30, INTER), col, 'left', al);
    text(what, cols[1], y + 50, F(500, 30, SANS), o.gray ? C.gray : C.black, 'left', al);
    text(st, cols[2], y + 50, F(800, 30, SANS), stCol, 'right', al);
    if (o.strike) E.line(cols[1], y + 40, cols[1] + (tw(what, F(500, 30, SANS))) * eOC(o.strike), y + 40, C.claret, 3);
  };
  row(0, '09:00', '一条记录变了', '已完成', C.ink2);
  const pw = pr(t, M.write, 0.4);
  if (pw > 0) {
    const done = t > M.done, rd = pr(t, M.read, 0.3);
    row(1, '14:05', '你发来一条消息', done ? '已完成' : '待处理', done ? C.ink2 : C.claret, { alpha: clamp(pw * 2), stroke: rd > 0 && !done ? C.claret : C.rule, lw: rd > 0 && !done ? 3 : 2, fill: rd > 0 && !done ? '#FBEFE6' : '#FFFFFF' });
  }
  const pd = pr(t, M.dup, 0.4);
  if (pd > 0) row(2, '14:05', '同一条消息又送来（同 ID）', '丢弃', C.claret, { alpha: clamp(pd * 2), dash: [10, 7], fill: '#F7F2EC', gray: true, strike: pr(t, M.dup + 0.5, 0.5) });
  ctx.restore();
}

// ===== D/E/F：原文经验（bp 截图，CSS 720×1825）=====
const VP = (k, cy, x = 96) => K.V(k, 360, cy, x, 184, 1080, 700);
function viewP(t) {
  return K.kview(t, [[M.b5, VP(1.5, 1330, -1200)], [M.b5 + 0.8, VP(1.5, 1330)], [M.b6, VP(1.5, 1330)], [M.b6 + 0.7, VP(0.6, 700)], [M.b6 + 1.4, VP(1.5, 150)],
    [M.oneW - 0.6, VP(1.5, 150)], [M.oneW + 0.1, VP(0.6, 900)], [M.oneW + 0.8, VP(1.5, 1655)], [M.b7 - 0.1, VP(1.5, 1655)], [M.b7 + 0.6, VP(0.6, 1300)], [M.b7 + 1.3, VP(1.5, 975)]]);
}
function drawP(t) {
  if (t < M.b5) return;
  const S = REG.shots.bp.phrases, hl = (k, t0, d = 0.9) => [dedupe(S[k]), t0, d];
  K.view(IMG.bp, 3, viewP(t), { bg: '#FAF9F5', lift: 0.5, rot: -0.5, over: map => {
    [hl('ack', M.ack), hl('deep', M.deep, 1.2), hl('truth', M.pull), hl('retry', M.die, 1.1),
     hl('perUser', M.b6 + 1.6), hl('one', M.oneW + 0.9), hl('dup', M.dupW + 0.2, 1.1), hl('batch', M.three), hl('merge', M.merge, 1.1),
     hl('resume', M.b7 + 1.4, 1.2), hl('newS', M.newSess, 0.8)].forEach(([rs, t0, d]) => K.sweep(rs, map, eIO(pr(t, t0, d))));
  } });
}
function bullet(x, y, str, t0, out, col = C.ink) {
  const p = pr(t_, t0, 0.5); if (p <= 0 || out >= 1) return;
  ctx.save(); ctx.globalAlpha *= (1 - out); ctx.fillStyle = C.claret; ctx.fillRect(x, y - 22, 8 * eOC(p), 26); ctx.restore();
  ctx.save(); ctx.globalAlpha *= (1 - out); E.wipeText(str, x + 26, y, F(700, 32, SANS), col, 32, p); ctx.restore();
}
let t_ = 0;
function drawDRight(t) {
  if (t < M.b5 || t > M.b6 + 0.7) return;
  const o = pr(t, M.b6, 0.5);
  bullet(1250, 300, '马上回应，别让对方等', M.ack, o);
  bullet(1250, 370, '深一点的检查放进 run 里', M.deep, o);
  text('（比如 prompt injection 检查）', 1276, 416, F(400, 26, SANS), C.ink2, 'left', pr(t, M.deep + 0.6, 0.4) * (1 - o));
  bullet(1250, 630, '醒来先去表里拉事件', M.pull, o);
  bullet(1250, 700, '中途死了，换一个重试', M.die, o);
}
function drawE(t) {
  if (t < M.b6 + 0.6 || t > M.b7 + 0.8) return;
  const out = eIC(pr(t, M.b7, 0.6)), dx = 760 * out, X = 1240 + dx;
  // 两个 worker：只留一个
  const pw = pr(t, M.oneW, 0.45);
  if (pw > 0) {
    box({ x: X, y: 150, w: 270, h: 90 }, 'Worker', '', { alpha: clamp(pw * 3), stroke: C.claret, fs: 34 });
    box({ x: X + 314, y: 150, w: 270, h: 90 }, '第 2 个', '', { alpha: clamp(pw * 3) * 0.9, stroke: C.gray, dash: [10, 7], tcol: C.gray, fs: 32 });
    K.cross(X + 449, 195, 60, pr(t, M.oneW + 0.5, 0.4));
    text('同一时间只有 1 个', X, 290, F(700, 30, SANS), C.claret, 'left', pr(t, M.dupW, 0.4));
  }
  // 每个用户一个收件箱
  const pu = pr(t, M.b6 + 1.2, 0.5);
  if (pu > 0) {
    const R = { x: X, y: 330, w: 584, h: 300 };
    K.card(R, { fill: '#F3E8DC', stroke: C.rule, lw: 2, r: 12, lift: 0.2, alpha: clamp(pu * 2) });
    text('你的收件箱（每个用户一个）', X + 28, 380, F(800, 32, SERIF), C.claret, 'left', pu);
    for (let i = 0; i < 3; i++) {
      const p = pr(t, M.three + 0.3 + 0.3 * i, 0.4); if (p <= 0) continue;
      const y = 410 + i * 70 - (1 - eOQ(p)) * 20;
      K.card({ x: X + 24, y, w: 480, h: 58 }, { fill: '#FFFFFF', stroke: C.rule, lw: 2, r: 8, lift: 0.08, alpha: clamp(p * 2) });
      text('消息 ' + (i + 1), X + 50, y + 40, F(600, 30, SANS), C.black, 'left', p);
      text(t > M.merge + 1.0 ? '已完成' : '待处理', X + 484, y + 40, F(800, 28, SANS), t > M.merge + 1.0 ? C.ink2 : C.claret, 'right', p);
    }
  }
  // 合成一次 run → 只回一次
  const pm = pr(t, M.merge, 0.5);
  if (pm > 0) {
    ctx.save(); ctx.globalAlpha *= clamp(pm * 2); ctx.strokeStyle = C.claret; ctx.lineWidth = 4; ctx.beginPath();
    const bx = X + 556; ctx.moveTo(X + 520, 420); ctx.lineTo(bx, 420); ctx.lineTo(bx, 600); ctx.lineTo(X + 520, 600); ctx.stroke(); ctx.restore();
    K.arrow(X + 292, 640, X + 292, 668, eOC(pm), C.claret, 4, 10);
    box({ x: X + 120, y: 672, w: 344, h: 80 }, '一次 run', '', { alpha: clamp(pm * 2), stroke: C.claret, tcol: C.claret, fs: 34 });
  }
  const pr1 = pr(t, M.once, 0.5);
  if (pr1 > 0) {
    K.card({ x: X + 60, y: 776, w: 464, h: 76 }, { fill: C.claret, r: 18, lift: 0.25, alpha: clamp(pr1 * 2) });
    text('Agent 只回你一次', X + 292, 826, F(800, 32, SANS), '#FFFFFF', 'center', pr1);
  }
}
function drawF(t) {
  if (t < M.b7 + 0.4) return;
  const X = 1240;
  const lane = (y, lb, sess, col, t0, ext) => {
    const p = pr(t, t0, 0.5); if (p <= 0) return;
    K.card({ x: X, y, w: 240, h: 72 }, { fill: C.sheet, stroke: C.rule, lw: 2, r: 8, lift: 0.2, alpha: clamp(p * 3) });
    text(lb, X + 120, y + 47, F(700, 30, /[一-鿿]/.test(lb) ? SANS : INTER), C.black, 'center', p);
    K.arrow(X + 120, y + 80, X + 120, y + 128, pr(t, t0 + 0.3, 0.4), col, 4, 10);
    const by = y + 136, pb = eOC(pr(t, t0 + 0.5, 0.6));
    if (ext) { // 已有会话 A 的旧段 + 续上的新段
      ctx.fillStyle = mix('#FFFFFF', C.claret, 0.25); ctx.fillRect(X, by, 300, 64);
      text('会话 A（之前的）', X + 18, by + 42, F(600, 28, SANS), C.claret, 'left', clamp(p * 2));
      ctx.fillStyle = col; ctx.fillRect(X + 304, by, 280 * pb, 64);
      text('续上', X + 444, by + 43, F(800, 30, SANS), '#FFFFFF', 'center', pr(t, t0 + 0.8, 0.3));
    } else {
      K.card({ x: X, y: by, w: 584 * pb, h: 64 }, { fill: col, r: 6, lift: 0.1 });
      text(sess, X + 24, by + 43, F(800, 30, SANS), '#FFFFFF', 'left', pr(t, t0 + 0.8, 0.3));
    }
  };
  lane(170, '你的回复', '', C.claret, M.cont - 0.6, true);
  lane(520, 'webhook', '会话 B（新开）', C.oxford, M.newSess - 0.4, false);
}

window.Chapter = {
  sources: [],
  texts: '睡着不花你发来的消息别系统有变化时推过定时任务后台作业每个事件源直接调用两次互相抢崩溃整丢了收件箱三件东西只往里写再一张数据库表存通常是接口从读运行中跑完循环新叫醒出待处理发生什么状态已完成同条又送来丢弃马上回应让对方等深点检查放进比如醒先去拉途死换重试第个时间有户合成回会话之前续上开外',
  async init(data) {
    const A = data.A, st = data.st;
    IMG = data.img; REG = data.json.reg;
    M = {
      go: A('s02-1', '谁来'), src: ['你发来的消息', 'webhook', '定时任务', '后台作业'].map(w => A('s02-1', w)),
      b2: st('s02-2'), direct: A('s02-2', '直接调用'), both: A('s02-2', '两个事件同时到'), fight: A('s02-2', '互相抢'), crash: A('s02-2', '一崩溃'), lost: A('s02-2', '整个丢掉'),
      b3: st('s02-3'), only: A('s02-3', '只往里写'), three: A('s02-3', '三件东西'), table: A('s02-3', '一张数据库表'), handler: A('s02-3', '一个 handler'), worker: A('s02-3', '一个 worker'),
      b4: st('s02-4'), newEv: A('s02-4', '新事件进来'), write: A('s02-4', 'handler 写表'), wake: A('s02-4', '叫醒 worker'), read: A('s02-4', 'worker 读出'),
      start: A('s02-4', '起一次 run'), done: A('s02-4', '跑完标成'), status: A('s02-4', '表里记着状态'), dup: A('s02-4', '重复的事件'),
      b5: st('s02-5'), ack: A('s02-5', '马上回应'), deep: A('s02-5', '深一点'), pull: A('s02-5', '自己去表里拉'), die: A('s02-5', '中途死了'),
      b6: st('s02-6'), oneW: A('s02-6', '只让一个 worker'), dupW: A('s02-6', '免得'), three: A('s02-6', '连发三条'), merge: A('s02-6', '合成一次'), once: A('s02-6', '只回你一次'),
      b7: st('s02-7'), cont: A('s02-7', '续上原来的会话'), newSess: A('s02-7', '开新会话')
    };
    // s02-3 里「三件东西」与 s02-6「连发三条」同名键：前者改名
    M.three3 = A('s02-3', '三件东西');
    { const v = viewB(M.b4); const f = q => ({ x: v.rect.x + v.rect.w / 2 + (q.x - v.cx) * v.k, y: v.rect.y + v.rect.h / 2 + (q.y - v.cy) * v.k, w: q.w * v.k, h: q.h * v.k });
      SRCR = { hnd: f(PR.hnd), tbl: f(PR.tbl), wrk: f(PR.wrk), run: f(PR.run) }; }
    this.sources = [
      [0, '原文：always-on agents can be triggered by many types of events, including webhooks, scheduled tasks, and background jobs'],
      [M.b2, '原文：that has a few failure modes … competing runs, and a crash can lose an event entirely'],
      [M.b3, '原图：Event inbox（Handler → Database table → Worker → Run）'],
      [M.b5, '原文 Event inbox 一节的 best practices'],
      [M.b7, '原文：Events that continue earlier work … resume an existing session']
    ];
    const cue = data.cue;
    cue(M.go, 'whoosh'); M.src.forEach(x => cue(x, 'pop'));
    cue(M.direct, 'whoosh'); cue(M.both, 'whoosh'); cue(M.fight, 'pop'); cue(M.crash, 'pop'); cue(M.lost, 'pop');
    cue(M.b3, 'whoosh'); cue(M.b3, 'paper'); [M.table, M.handler, M.worker].forEach(x => cue(x, 'marker'));
    cue(M.b4, 'whoosh'); cue(M.newEv, 'whoosh'); [M.write, M.read, M.start, M.done, M.dup].forEach(x => cue(x, 'pop')); cue(M.status, 'marker');
    cue(M.b5, 'whoosh'); cue(M.b5, 'paper'); [M.ack, M.deep, M.pull, M.die].forEach(x => cue(x, 'marker'));
    cue(M.b6, 'whoosh'); cue(M.b6 + 1.6, 'marker'); cue(M.oneW, 'pop'); cue(M.oneW + 0.9, 'marker'); cue(M.three + 0.3, 'pop'); cue(M.merge, 'pop'); cue(M.once, 'pop');
    cue(M.b7, 'whoosh'); cue(M.b7 + 1.4, 'marker'); cue(M.cont, 'pop'); cue(M.newSess, 'pop');
  },
  renderContent(c, t, data) {
    ctx = c; t_ = t;
    drawA(t);
    drawB(t);
    drawBLeft(t);
    drawC(t);
    drawP(t);
    drawDRight(t);
    drawE(t);
    drawF(t);
    M5.intro(t, 0, M.go);
  }
};
})();
