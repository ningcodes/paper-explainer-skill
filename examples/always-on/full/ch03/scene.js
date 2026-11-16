// 03 · 定时器（s03-1 ~ s03-6）。g2 制作。
// 镜头规划：
//  3A s03-1  五格母图落地 → 定时器格变红飞成章节签；同时从大排「定时器」格长出闹钟卡（连续变形）
//  3B s03-2  闹钟卡一分为二：follow-up（Agent 定）/ schedule（用户定）两张票（连续变形）
//  3C s03-3  两张票缩小飞进原图实体纸（c16694，含 Fri 09:00 Daily newsletter）对应位置；推近，酒红圈 Timers 表、Event inbox 表（钻进原文）
//  3D s03-4  纸翻面到原文段落：黄笔 A timer doesn't initiate a run on its own / polls…due；纸收成定时器表 → 重画：表、Scheduler 扫表、标完成/改下一次、写事件进收件箱、叫醒 worker
//  3E s03-5  schedule 那行长成「每日简报」大行（示意），Scheduler 变成钟：09:00 一过 → 明天 09:00 → 事件进收件箱
//  3F s03-6  收件箱居中放大，三种事件源一起进同一个收件箱；单个 worker / 重试 / 去重 打勾（留到下一章翻页）
(function () {
'use strict';
const E = window.ED, K = window.Kit;
const { C, SERIF, SANS, INTER, F, clamp, lerp, eOQ, eOC, eIO, pr, mix, text } = E;
let ctx = null, M = {}, IMG = {}, REG = null;

// ---------- 五格母图（照 full/MOTHER.md 原样复制） ----------
const M5 = (() => {
  const { lerp, clamp, eOC, eIO, pr, mix, text } = E;
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
  function intro(t, i, tGo) {
    const lit = eOC(pr(t, 0.2, 0.45)), p = eIO(pr(t, tGo, 0.7)), fo = pr(t, tGo, 0.35);
    for (let k = 0; k < 5; k++) if (k !== i && fo < 1) { const r = big(k); cell(k, { x: r.x, y: r.y + eIO(fo) * 50, w: r.w, h: r.h }, 0, 1 - fo); }
    if (p < 0.6) { const r = LR(big(i), CHIP, p); cell(i, r, lit, 1, lerp(1, 0.4, p)); return r; }
    const r = LR(big(i), CHIP, p); chip(i, r); return r;
  }
  return { NAMES, EN, NUM, BIG, CHIP, big, cell, chip, intro, LR };
})();
const LR = M5.LR;

// ---------- 小画件 ----------
function clock(x, y, r, col, hh, mm, o = {}) {
  ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(3, r * 0.09); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = Math.max(2, r * 0.045);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.74, y + Math.sin(a) * r * 0.74); ctx.lineTo(x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.86); ctx.stroke(); }
  const ah = ((hh % 12) + mm / 60) / 12 * Math.PI * 2 - Math.PI / 2, am = mm / 60 * Math.PI * 2 - Math.PI / 2;
  ctx.lineWidth = r * 0.1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ah) * r * 0.45, y + Math.sin(ah) * r * 0.45); ctx.stroke();
  ctx.lineWidth = r * 0.065; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(am) * r * 0.66, y + Math.sin(am) * r * 0.66); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r * 0.08, 0, Math.PI * 2); ctx.fill();
  if (o.recur) {
    const R = r * 1.24; ctx.lineWidth = Math.max(3, r * 0.07); ctx.beginPath(); ctx.arc(x, y, R, -Math.PI * 0.35, Math.PI * 1.45); ctx.stroke();
    const a = -Math.PI * 0.35; E.arrowHead(x + Math.cos(a) * R, y + Math.sin(a) * R, a + Math.PI / 2, col, r * 0.2, Math.max(3, r * 0.07));
  }
  ctx.restore();
}
function box(r, o = {}) { K.card(r, Object.assign({ fill: C.sheet, stroke: C.rule, lw: 2, r: 8, lift: 0.3 }, o)); }
function pill(x, y, str, col, fill, alpha = 1) {
  if (alpha <= 0) return; const f = F(700, 26, SANS); const w = E.tw(str, f) + 28;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = fill; E.rrect(x, y - 30, w, 42, 21); ctx.fill(); ctx.restore();
  text(str, x + 14, y, f, col, 'left', alpha); return w;
}
// 绘制在 r 里，内部按「设计尺寸」dw×dh 排版，整体缩放 s = r.w/dw（只缩小，不放大文字层）
function scaled(r, dw, alpha, fn) {
  if (alpha <= 0) return; const s = Math.min(1, r.w / dw);
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(r.x, r.y); ctx.scale(s, s); fn(); ctx.restore();
}

// ---------- 3A/3B：闹钟卡、两张票 ----------
const CENTER = { x: 560, y: 190, w: 800, h: 640 };
const TL = { x: 300, y: 200, w: 560, h: 620 }, TR = { x: 1060, y: 200, w: 560, h: 620 };
function ticket(kind, t) {
  // 设计尺寸 560×620，原点在左上
  const fu = kind === 0;
  K.card({ x: 0, y: 0, w: 560, h: 620 }, { fill: C.sheet, stroke: C.rule, lw: 2, r: 10, lift: 0.35 });
  clock(280, 130, 68, C.claret, fu ? 6 : 9, 0, { recur: !fu });
  text(fu ? 'follow-up' : 'schedule', 280, 300, F(800, 58, INTER), C.black, 'center');
  text(fu ? 'Agent 给自己定' : '通常由用户定', 280, 362, F(700, 36, SANS), C.claret, 'center');
  E.line(40, 410, 520, 410, C.rule, 2, [8, 8]);
  text(fu ? '到点做一次' : '固定节奏重复', 280, 470, F(500, 32, SANS), C.ink, 'center');
  if (fu) text('例：过两天看对方回没回', 280, 530, F(500, 30, SANS), C.ink, 'center');
  else {
    text('例：每日简报', 280, 530, F(500, 30, SANS), C.ink, 'center');
    const u = eOC(pr(t, M.brief, 0.5)); if (u > 0) { ctx.fillStyle = C.claret; ctx.fillRect(280 - 90, 544, 180 * u, 4); }
    text('示意', 280, 586, F(400, 26, SANS), C.ink2, 'center');
  }
}
function clockCard(r, a) {
  scaled(r, 800, a, () => {
    K.card({ x: 0, y: 0, w: 800, h: 640 }, { fill: C.wheat, r: 10, lift: 0.3 });
    clock(400, 250, 140, C.claret, 9, 0, {});
    text('定时器', 400, 520, F(900, 84, SERIF), C.black, 'center');
    text('Timers', 400, 584, F(600, 32, INTER), C.ink2, 'center');
  });
}
function drawOpening(t) {
  if (t > M.p3 + 0.35) return;
  // 闹钟卡：tGo+0.1 起从大排「定时器」格长出
  const g = eIO(pr(t, M.go + 0.1, 0.8));
  const split = eIO(pr(t, M.fu - 0.35, 0.6));
  if (g > 0 && split < 1) {
    const r0 = LR(M5.big(1), CENTER, g);
    if (split <= 0) {
      if (g < 1) { ctx.save(); ctx.globalAlpha = 1; ctx.fillStyle = C.wheat; ctx.fillRect(r0.x, r0.y, r0.w, r0.h); ctx.restore(); }
      clockCard(r0, clamp((g - 0.35) / 0.65));
    } else {
      const r = LR(CENTER, TL, split);
      ctx.fillStyle = mix(C.wheat, C.sheet, split); E.rrect(r.x, r.y, r.w, r.h, 10); ctx.fill();
      clockCard(r, 1 - clamp(split * 2));
      if (split > 0.5) scaled(r, 560, clamp(split * 2 - 1), () => ticket(0, t));
    }
  }
  // 两张票 → 3C 飞进原图
  const fly = eIO(pr(t, M.p3 - 0.6, 0.8)), fa = 1 - pr(t, M.p3 + 0.2, 0.15);
  if (split >= 1) {
    const tl = LR(TL, { x: 706, y: 311, w: 214, h: 335 }, fly);
    scaled({ x: tl.x, y: tl.y, w: tl.w, h: tl.w * 620 / 560 }, 560, fa, () => ticket(0, t));
  }
  const sp = eOC(pr(t, M.sc - 0.3, 0.6));
  if (sp > 0) {
    const r1 = LR(TL, TR, sp); const tr = LR(r1, { x: 949, y: 311, w: 214, h: 335 }, fly);
    scaled({ x: tr.x, y: tr.y, w: tr.w, h: tr.w * 620 / 560 }, 560, fa * clamp(sp * 3), () => ticket(1, t));
  }
}

// ---------- 3C/3D：原图实体纸 → 原文段落 ----------
const DIAG_FULL = K.V(0.95, 700, 366, 295, 185, 1330, 695);
const DIAG_PUSH = K.V(1.22, 680, 372, 96, 180, 1728, 720);
const WEB = K.V(2.4, 360, 935, 96, 180, 1728, 720);
function drawPaper(t) {
  if (t < M.p3 - 0.6 || t > M.due + 0.6) return;
  const slide = eOC(pr(t, M.p3 - 0.6, 0.8));
  const dIn = K.V(0.95, 700, 366, 295 + 1700 * (1 - slide), 185, 1330, 695);
  const fl = pr(t, M.p4 - 0.4, 0.8);
  if (fl < 0.5) {
    const v = t < M.sep - 0.4 ? dIn : K.lv(DIAG_FULL, DIAG_PUSH, eIO(pr(t, M.sep - 0.4, 0.8)));
    ctx.save();
    if (fl > 0) { const sx = Math.max(0.02, Math.cos(Math.PI * fl)); const mx = v.rect.x + v.rect.w / 2; ctx.translate(mx, 0); ctx.scale(sx, 1); ctx.translate(-mx, 0); }
    K.view(IMG.tdiag, 1, v, { bg: '#FFFFFF', lift: 0.55, rot: -1.5 * (1 - slide), over: map => {
      K.ring([{ x: 405, y: 55, w: 537, h: 460 }], map, pr(t, M.sep, 0.7));
      K.ring([{ x: 548, y: 570, w: 249, h: 112 }], map, pr(t, M.ready, 0.6));
    } });
    if (fl > 0) { ctx.fillStyle = `rgba(51,48,46,${0.22 * fl * 2})`; ctx.fillRect(v.rect.x, v.rect.y, v.rect.w, v.rect.h); }
    ctx.restore();
    if (t > M.sep + 0.3 && fl <= 0) {
      const a = eOC(pr(t, M.sep + 0.3, 0.4));
      pill(1420, 262, '定时器表', '#FFFFFF', C.claret, a);
      pill(1150, 872, '收件箱表', '#FFFFFF', C.claret, eOC(pr(t, M.ready + 0.2, 0.4)));
    }
    return;
  }
  // 翻面后：原文段落；M.due 起收成定时器表的位置
  const out = eIO(pr(t, M.due - 0.3, 0.6));
  let v = WEB;
  if (out > 0) { const r = LR(WEB.rect, TABLE, out); v = { k: WEB.k * r.w / WEB.rect.w, cx: WEB.cx, cy: WEB.cy, rect: r }; }
  ctx.save();
  if (fl < 1) { const sx = Math.max(0.02, -Math.cos(Math.PI * fl)); const mx = v.rect.x + v.rect.w / 2; ctx.translate(mx, 0); ctx.scale(sx, 1); ctx.translate(-mx, 0); }
  const P = REG.shots.timers.phrases;
  K.view(IMG.tweb, 3, v, { bg: '#FAF9F5', lift: 0.55, alpha: 1 - clamp(out * 2 - 0.8), over: map => {
    K.sweep(P.noinit, map, eIO(pr(t, M.noinit, 0.9)));
    K.sweep(P.polls, map, eIO(pr(t, M.scan, 1.3)));
  } });
  if (fl < 1) { ctx.fillStyle = `rgba(51,48,46,${0.22 * (1 - fl) * 2})`; ctx.fillRect(v.rect.x, v.rect.y, v.rect.w, v.rect.h); }
  ctx.restore();
}

// ---------- 3D–3F：重画 ----------
const TABLE = { x: 96, y: 180, w: 1040, h: 360 };
const SCHED = { x: 1300, y: 230, w: 420, h: 200 };
const INBOX = { x: 520, y: 600, w: 860, h: 290 };
const WORKER = { x: 1480, y: 650, w: 340, h: 190 };
const INBOX6 = { x: 470, y: 196, w: 860, h: 470 };
const WORKER6 = { x: 1430, y: 330, w: 380, h: 210 };
const BIGROW = { x: 96, y: 200, w: 1040, h: 330 };
const CLOCK = { x: 1300, y: 190, w: 420, h: 370 };

function timerTable(t, a) {
  if (a <= 0) return;
  const r = TABLE; ctx.save(); ctx.globalAlpha *= a;
  box(r, { lift: 0.35 });
  text('定时器表', r.x + 30, r.y + 56, F(800, 40, SERIF), C.black);
  text('Timers', r.x + 214, r.y + 56, F(600, 30, INTER), C.ink2);
  text('数据库表', r.x + r.w - 30, r.y + 56, F(500, 26, SANS), C.ink2, 'right');
  const cols = [30, 270, 500, 800];
  ['类型', '时间', '内容', '状态'].forEach((h, i) => text(h, r.x + cols[i], r.y + 112, F(600, 26, SANS), C.ink2));
  E.line(r.x + 20, r.y + 128, r.x + r.w - 20, r.y + 128, C.rule, 2);
  const dn = eOC(pr(t, M.done, 0.5)), nx = eOC(pr(t, M.next, 0.6));
  // 扫描线
  const sc = pr(t, M.due, 1.0);
  if (sc > 0 && sc < 1) { const y = lerp(r.y + 130, r.y + r.h - 10, eIO(sc)); E.line(r.x + 10, y, r.x + r.w - 10, y, C.claret, 3); }
  const rows = [
    { k: 'follow-up', tm: 'Thu 18:00', c: '看回复来了没' },
    { k: 'schedule', tm: 'Fri 09:00', c: 'Daily newsletter' }
  ];
  rows.forEach((w, i) => {
    const y = r.y + 135 + i * 108;
    if (i === 0 && sc > 0.2) { ctx.fillStyle = rgbaW(0.6 * (1 - dn) * clamp((sc - 0.2) * 4)); ctx.fillRect(r.x + 12, y + 6, r.w - 24, 96); }
    if (i === 1 && sc > 0.6) { ctx.fillStyle = rgbaW(0.6 * (1 - nx) * clamp((sc - 0.6) * 4)); ctx.fillRect(r.x + 12, y + 6, r.w - 24, 96); }
    const ink = i === 0 ? mix(C.ink, C.ink2, dn) : C.ink;
    text(w.k, r.x + cols[0], y + 68, F(700, 32, INTER), ink);
    if (i === 1 && nx > 0) {
      text(w.tm, r.x + cols[1], y + 68, F(600, 32, INTER), C.ink2, 'left', 1 - nx);
      if (nx < 1) E.line(r.x + cols[1], y + 56, r.x + cols[1] + 150 * nx, y + 56, C.claret, 3);
      text('Sat 09:00', r.x + cols[1], y + 68 - 0 * (1 - nx), F(700, 32, INTER), C.claret, 'left', nx);
    } else text(w.tm, r.x + cols[1], y + 68, F(600, 32, INTER), ink);
    text(w.c, r.x + cols[2], y + 68, F(500, 30, i ? INTER : SANS), ink);
    if (i === 0) { if (dn > 0) { K.check(r.x + cols[3] + 20, y + 54, 34, dn, C.teal, 6); text('已完成', r.x + cols[3] + 56, y + 68, F(700, 30, SANS), C.teal, 'left', dn); } else text('等待', r.x + cols[3], y + 68, F(500, 30, SANS), C.ink2); }
    else text(nx > 0 ? '改到下一次' : '每天重复', r.x + cols[3], y + 68, F(nx > 0 ? 700 : 500, 30, SANS), nx > 0 ? C.claret : C.ink2);
    if (i === 0) E.line(r.x + 20, y + 104, r.x + r.w - 20, y + 104, C.rule, 1);
  });
  ctx.restore();
}
function rgbaW(a) { return `rgba(242,223,206,${a})`; }
function schedBox(r, a, label) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a;
  box(r, { stroke: C.ink, lw: 3, lift: 0.35 });
  text('Scheduler', r.x + 30, r.y + 66, F(800, 44, INTER), C.black);
  text(label || '后台服务', r.x + 30, r.y + 120, F(500, 30, SANS), C.ink);
  ctx.restore();
}
// 收件箱：rows = [{l, s, col, a}]（新的在上）
function inbox(r, rows, a) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a;
  box(r, { fill: C.sheet, stroke: C.ink, lw: 3, lift: 0.35 });
  ctx.fillStyle = C.wheat; ctx.fillRect(r.x + 3, r.y + 3, r.w - 6, 70);
  text('事件收件箱', r.x + 28, r.y + 50, F(800, 36, SERIF), C.black);
  text('Event inbox · 数据库表', r.x + r.w - 28, r.y + 48, F(500, 26, SANS), C.ink2, 'right');
  const n = Math.floor((r.h - 84) / 66);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y + 74, r.w, r.h - 76); ctx.clip();
  let yy = r.y + 84;
  rows.slice(0, n + 1).forEach(w => {
    const q = w.a == null ? 1 : w.a; if (q <= 0) return;
    const y = yy - (1 - eOC(q)) * 40;
    ctx.save(); ctx.globalAlpha *= clamp(q * 2);
    ctx.fillStyle = w.hi ? '#FBE9DD' : '#FFFFFF'; ctx.fillRect(r.x + 18, y, r.w - 36, 56);
    ctx.strokeStyle = C.rule; ctx.lineWidth = 1.5; ctx.strokeRect(r.x + 18.5, y + 0.5, r.w - 37, 55);
    text(w.l, r.x + 40, y + 39, F(600, 30, SANS), w.dim ? C.ink2 : C.ink);
    const f = F(700, 26, SANS); const pw = E.tw(w.s, f) + 28;
    pill(r.x + r.w - 40 - pw, y + 40, w.s, '#FFFFFF', w.col || C.gray);
    ctx.restore();
    yy += 66 * eOC(q);
  });
  ctx.restore();
  ctx.restore();
}
function worker(r, on, a, sub) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a;
  box(r, { stroke: on > 0 ? mix(C.rule, C.claret, on) : C.rule, lw: on > 0 ? 4 : 2, lift: 0.3 });
  ctx.fillStyle = on > 0.5 ? C.claret : C.ink; ctx.beginPath(); ctx.arc(r.x + 36, r.y + 52, 10, 0, Math.PI * 2); ctx.fill();
  text('Worker', r.x + 58, r.y + 64, F(800, 40, INTER), C.black);
  text(on > 0.5 ? (sub || '醒了，起一次 run') : '后台服务', r.x + 30, r.y + 126, F(on > 0.5 ? 700 : 500, 30, SANS), on > 0.5 ? C.claret : C.ink);
  ctx.restore();
}
function eventCard(x, y, str, a) {
  if (a <= 0) return; const f = F(700, 28, SANS), w = E.tw(str, f) + 40;
  K.card({ x: x - w / 2, y: y - 30, w, h: 56 }, { fill: C.claret, r: 6, lift: 0.4, alpha: a });
  text(str, x, y + 8, f, '#FFFFFF', 'center', a);
}

function drawRedraw(t) {
  if (t < M.due - 0.3) return;
  const p5 = eIO(pr(t, M.p5 - 0.3, 0.8));
  const p6 = eIO(pr(t, M.p6 - 0.2, 0.8));
  const aIn = eOC(pr(t, M.due, 0.5));
  // 定时器表（3D），3E 时只剩 schedule 那行长成大行
  const top = 1 - p6;
  ctx.save(); ctx.translate(0, -60 * p6);
  timerTable(t, aIn * (1 - p5) * top);
  if (p5 > 0 && top > 0) {
    const row = LR({ x: TABLE.x + 12, y: TABLE.y + 243, w: TABLE.w - 24, h: 100 }, BIGROW, p5);
    ctx.save(); ctx.globalAlpha *= top;
    box(row, { fill: C.sheet, stroke: C.claret, lw: 3, lift: 0.4 });
    const q = clamp(p5 * 2 - 1);
    if (q > 0) {
      const R = BIGROW;
      text('每日简报', R.x + 40, R.y + 86, F(800, 56, SERIF), C.black, 'left', q);
      text('schedule · 用户定的', R.x + 300, R.y + 82, F(600, 30, SANS), C.ink2, 'left', q);
      text('示意', R.x + R.w - 36, R.y + 52, F(400, 26, SANS), C.ink2, 'right', q);
      E.line(R.x + 30, R.y + 124, R.x + R.w - 30, R.y + 124, C.rule, 2);
      text('下一次', R.x + 40, R.y + 236, F(600, 34, SANS), C.ink, 'left', q);
      const tm = eOC(pr(t, M.tom, 0.6));
      text('今天 09:00', R.x + 200, R.y + 250, F(800, 76, INTER), C.black, 'left', q * (1 - tm));
      if (tm > 0) text('明天 09:00', R.x + 200, R.y + 250 - (1 - tm) * 30, F(800, 76, INTER), C.claret, 'left', tm);
      if (tm > 0.6) E.underlineSweep('明天 09:00', R.x + 200, R.y + 250, F(800, 76, INTER), pr(tm, 0.6, 0.4));
    }
    ctx.restore();
  }
  // Scheduler（3D）→ 钟（3E）
  const sA = eOC(pr(t, M.due + 0.1, 0.5)) * top;
  if (p5 <= 0) schedBox(SCHED, sA);
  else {
    const r = LR(SCHED, CLOCK, p5);
    ctx.save(); ctx.globalAlpha *= sA; box(r, { stroke: C.ink, lw: 3, lift: 0.35 });
    text('Scheduler', r.x + 30, r.y + 60, F(800, 40, INTER), C.black);
    const q = clamp(p5 * 2 - 1);
    if (q > 0) {
      const tm = t < M.nine ? lerp(58, 60, eIO(pr(t, M.p5, M.nine - M.p5))) : 60 + 1.5 * eOC(pr(t, M.nine, 0.8));
      const hh = tm >= 60 ? 9 : 8, mm = tm >= 60 ? tm - 60 : tm;
      ctx.save(); ctx.globalAlpha *= q;
      clock(r.x + r.w / 2, r.y + 190, 92, tm >= 60 ? C.claret : C.ink, hh, mm, {});
      ctx.restore();
      const s = (hh < 10 ? '0' : '') + hh + ':' + String(Math.floor(mm)).padStart(2, '0');
      text(s, r.x + r.w / 2, r.y + 340, F(800, 44, INTER), tm >= 60 ? C.claret : C.ink, 'center', q);
    }
    ctx.restore();
  }
  ctx.restore();
  // 扫表箭头
  const ar = pr(t, M.due, 0.5) * top * (1 - p5);
  if (ar > 0) { K.arrow(SCHED.x - 8, 330, TABLE.x + TABLE.w + 14, 330, ar, C.claret, 3); text('扫表', (SCHED.x + TABLE.x + TABLE.w) / 2, 312, F(700, 28, SANS), C.claret, 'center', clamp(ar * 2)); }
  // 收件箱 + worker
  const iA = eOC(pr(t, M.due + 0.2, 0.5));
  const ib = LR(INBOX, INBOX6, p6), wk = LR(WORKER, WORKER6, p6);
  const rows = [];
  const ev1 = pr(t, M.write + 0.5, 0.4), ev5 = pr(t, M.ev5 + 0.5, 0.4);
  const busy1 = pr(t, M.wake, 0.3) > 0, done1 = t > M.ev5 + 0.9;
  const sS = [pr(t, M.same - 0.2, 0.4), pr(t, M.same + 0.05, 0.4)];
  if (sS[1] > 0) rows.push({ l: 'webhook：工单有更新', s: '待处理', col: C.oxford, a: sS[1] });
  if (sS[0] > 0) rows.push({ l: '用户消息', s: '待处理', col: C.oxford, a: sS[0] });
  if (ev5 > 0) rows.push({ l: '定时器到点：每日简报', s: t > M.ev5 + 1.2 ? '处理中' : '待处理', col: t > M.ev5 + 1.2 ? C.claret : C.oxford, a: ev5, hi: true });
  if (ev1 > 0) rows.push({ l: '定时器到点：follow-up', s: done1 ? '已完成' : busy1 ? '处理中' : '待处理', col: done1 ? C.teal : busy1 ? C.claret : C.oxford, a: ev1, dim: done1 });
  rows.push({ l: '用户消息', s: '已完成', col: C.teal, dim: true });
  inbox(ib, rows, iA);
  const won = Math.max(eOC(pr(t, M.wake, 0.4)) * (1 - pr(t, M.p5 - 0.2, 0.4)), eOC(pr(t, M.ev5 + 1.0, 0.4)));
  worker(wk, won, iA, '醒了，起一次 run');
  K.arrow(ib.x + ib.w + 6, wk.y + wk.h / 2, wk.x - 10, wk.y + wk.h / 2, pr(t, M.due + 0.4, 0.5), C.ink, 3);
  // 写事件：Scheduler → 收件箱（3D），钟 → 收件箱（3E）
  const fly = (t0, from, str) => {
    const q = pr(t, t0, 0.6); if (q <= 0 || q >= 1) return;
    const e = eIO(q); const tx = ib.x + ib.w / 2, ty = ib.y + 112;
    eventCard(lerp(from[0], tx, e), lerp(from[1], ty, e) - Math.sin(Math.PI * e) * 80, str, clamp(q * 4) * (1 - pr(q, 0.85, 0.15)));
  };
  fly(M.write - 0.1, [SCHED.x + SCHED.w / 2, SCHED.y + SCHED.h], '写一个事件');
  fly(M.ev5 - 0.1, [CLOCK.x + CLOCK.w / 2, CLOCK.y + CLOCK.h], '每日简报到点');
  if (p6 <= 0) {
    const ca = pr(t, M.write - 0.3, 0.5) * (1 - pr(t, M.p5 - 0.3, 0.3));
    if (ca > 0) K.curveArrow(SCHED.x + SCHED.w / 2, SCHED.y + SCHED.h + 8, ib.x + ib.w - 120, ib.y - 10, -0.25, ca, C.claret, 3);
    const cb = pr(t, M.ev5 - 0.4, 0.5) * (1 - pr(t, M.p6 - 0.3, 0.3));
    if (cb > 0) K.curveArrow(CLOCK.x + CLOCK.w / 2 - 60, CLOCK.y + CLOCK.h + 8, ib.x + ib.w - 120, ib.y - 10, -0.2, cb, C.claret, 3);
  }
  // 3F：三种事件源进同一个收件箱；三个好处
  if (p6 > 0) {
    const src = [['用户消息', M.same - 0.4], ['webhook', M.same - 0.2], ['定时器到点', M.same]];
    src.forEach(([s, t0], i) => {
      const [k, al] = K.pop(t, t0); const y = 250 + i * 140;
      K.withScale(220, y + 42, k, al, () => { box({ x: 96, y, w: 300, h: 84 }, { fill: i === 2 ? C.wheat : C.sheet, stroke: i === 2 ? C.claret : C.rule, lw: i === 2 ? 3 : 2 }); text(s, 246, y + 54, F(700, 32, s === 'webhook' ? INTER : SANS), C.black, 'center'); });
      K.arrow(402, y + 42, ib.x - 10, lerp(y + 42, ib.y + 200, 0.5), pr(t, t0 + 0.2, 0.4), i === 2 ? C.claret : C.ink, 3);
    });
    const tags = [['单个 worker', M.w1], ['重试', M.retry], ['去重', M.dedup]];
    tags.forEach(([s, t0], i) => {
      const [k, al] = K.pop(t, t0 - 0.1); const x = 470 + i * 300, y = 720;
      K.withScale(x + 130, y + 45, k, al, () => {
        box({ x, y, w: 270, h: 90 }, { fill: C.wheat, stroke: null, lift: 0.2 });
        K.check(x + 44, y + 44, 36, pr(t, t0 + 0.15, 0.4), C.teal, 6);
        text(s, x + 80, y + 56, F(700, 32, /worker/.test(s) ? SANS : SANS), C.black);
      });
    });
  }
}

window.Chapter = {
  sources: [],
  texts: '定时器Timers给自己定通常由用户到点做一次固定节奏重复例过两天看对方回没回每日简报示意定时器表数据库表类型时间内容状态看回复来了没等待已完成改到下一次每天重复后台服务扫表事件收件箱处理中待处理工单有更新用户消息醒了起一次写一个事件每日简报到点单个重试去重下一次今天明天的收件箱表原文配图规则推演一节与',
  async init(data) {
    const A = data.A;
    IMG = data.img; REG = data.json.reg;
    M.go = A('s03-1', '要主动');
    M.p3 = data.st('s03-3');
    M.fu = A('s03-2', 'follow-up'); M.sc = A('s03-2', 'schedule'); M.brief = A('s03-2', '每日简报');
    M.sep = A('s03-3', '和收件箱分开'); M.ready = A('s03-3', '因为收件箱');
    M.p4 = data.st('s03-4'); M.noinit = A('s03-4', '定时器自己'); M.scan = A('s03-4', '隔一段时间');
    M.due = A('s03-4', '到点的'); M.done = A('s03-4', '标成完成'); M.next = A('s03-4', '改到下一次');
    M.write = A('s03-4', '往收件箱写'); M.wake = A('s03-4', '叫醒');
    M.p5 = data.st('s03-5'); M.nine = A('s03-5', '九点一过'); M.tom = A('s03-5', '明天九点'); M.ev5 = A('s03-5', '再往收件箱');
    M.p6 = data.st('s03-6'); M.same = A('s03-6', '同一个收件箱'); M.w1 = A('s03-6', '单个 worker'); M.retry = A('s03-6', '重试'); M.dedup = A('s03-6', '去重');
    this.sources = [
      [0, '原文：Anthropic《Building always-on agents》2026-11-13 · Timers 一节与配图'],
      [M.p5 - 0.3, '每日简报的流程是示意，按原文规则推演']
    ];
    const c = data.cue;
    c(M.go + 0.1, 'whoosh'); c(M.fu - 0.35, 'pop'); c(M.sc - 0.3, 'pop');
    c(M.p3 - 0.6, 'paper'); c(M.sep, 'marker'); c(M.ready, 'marker');
    c(M.p4 - 0.4, 'paper'); c(M.noinit, 'marker'); c(M.scan, 'marker');
    c(M.due - 0.3, 'whoosh'); c(M.done, 'pop'); c(M.next, 'tick'); c(M.write - 0.1, 'whoosh'); c(M.wake, 'pop');
    c(M.p5 - 0.3, 'whoosh'); c(M.nine, 'tick'); c(M.tom, 'tick'); c(M.ev5 - 0.1, 'whoosh');
    c(M.p6 - 0.2, 'whoosh'); c(M.w1, 'pop'); c(M.retry, 'pop'); c(M.dedup, 'pop');
  },
  renderContent(c, t, data) {
    ctx = c;
    M5.intro(t, 1, M.go);
    drawOpening(t);
    drawPaper(t);
    drawRedraw(t);
  }
};
})();
