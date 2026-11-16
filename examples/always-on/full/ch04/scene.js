// 04 · 记忆（s04-1 ~ s04-9）。g2 制作。
// 镜头规划：
//  4A s04-1  五格母图落地 → 记忆格变红飞成章节签；同时从大排「记忆」格长出文件目录卡；三次断开的 run 连到目录；目录落在数据库/对象存储上；worker 划掉，记忆还在（连续变形）
//  4B s04-2  原文段落实体纸滑入：黄笔 can't look up again / save a pointer instead；纸收到左半，右侧长出工单系统 + 指针示意（钻进原文）
//  4C s04-3  记忆目录原图实体纸（e5d209），标「文件名来自原文示例图」
//  4D s04-4~7 推近原图，逐行点亮 instructions.md / notes/ / reported.md / progress/，右侧注释卡；简报两处标示意
//  4E s04-8  圈 notes/ progress/ 与 index.md；原图里的行飞出重画：每次加载（三个小文件）vs 按需读（两个文件夹，经索引）
//  4F s04-9  run 里写入；原文 dreaming 段黄笔；dreaming 文字卡 + Anthropic《The components of agent memory》2026-11-06 来源卡
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


function box(r, o = {}) { K.card(r, Object.assign({ fill: C.sheet, stroke: C.rule, lw: 2, r: 8, lift: 0.3 }, o)); }
function pill(x, y, str, col, fill, alpha = 1, align = 'left') {
  if (alpha <= 0) return; const f = F(700, 26, SANS); const w = E.tw(str, f) + 28; if (align === 'right') x -= w;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = fill; E.rrect(x, y - 30, w, 42, 21); ctx.fill(); ctx.restore();
  text(str, x + 14, y, f, col, 'left', alpha); return w;
}
function scaled(r, dw, alpha, fn) {
  if (alpha <= 0) return; const s = Math.min(1, r.w / dw);
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(r.x, r.y); ctx.scale(s, s); fn(); ctx.restore();
}
function flipX(v, fl, fn) {
  ctx.save();
  if (fl > 0 && fl < 1) { const sx = Math.max(0.02, Math.abs(Math.cos(Math.PI * fl))); const mx = v.rect.x + v.rect.w / 2; ctx.translate(mx, 0); ctx.scale(sx, 1); ctx.translate(-mx, 0); }
  fn();
  if (fl > 0 && fl < 1) { ctx.fillStyle = `rgba(51,48,46,${0.22 * (1 - Math.abs(Math.cos(Math.PI * fl)))})`; ctx.fillRect(v.rect.x, v.rect.y, v.rect.w, v.rect.h); }
  ctx.restore();
}
// 文件夹图形（设计尺寸 700×420）
function folderCard(t) {
  ctx.save();
  ctx.fillStyle = C.wheatDeep; E.rrect(0, 0, 260, 70, 10); ctx.fill();
  K.card({ x: 0, y: 40, w: 700, h: 380 }, { fill: C.wheat, r: 10, lift: 0.35 });
  text('记忆', 40, 130, F(900, 64, SERIF), C.black);
  text('Memory · 一个文件目录', 200, 126, F(600, 30, SANS), C.ink2);
  const files = ['instructions.md', 'reported.md', 'notes/', 'progress/'];
  files.forEach((f, i) => {
    const x = 40 + (i % 2) * 320, y = 180 + Math.floor(i / 2) * 110;
    box({ x, y, w: 300, h: 88 }, { fill: C.sheet, lift: 0.15 });
    E.docIcon(x + 20, y + 18, 38, 52, C.ink2);
    text(f, x + 74, y + 56, F(600, 28, INTER), C.ink);
  });
  ctx.restore();
}
function cylinder(x, y, w, h, label) {
  ctx.save(); ctx.fillStyle = C.sheet; ctx.strokeStyle = C.ink; ctx.lineWidth = 3;
  const ry = 18;
  ctx.beginPath(); ctx.ellipse(x + w / 2, y + h - ry, w / 2, ry, 0, 0, Math.PI); ctx.lineTo(x, y + ry); ctx.ellipse(x + w / 2, y + ry, w / 2, ry, 0, Math.PI, 0, true); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x + w / 2, y + ry, w / 2, ry, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  text(label, x + w / 2, y + h / 2 + 22, F(700, 30, SANS), C.black, 'center');
}

// ---------- 4A ----------
const FOLD = { x: 1000, y: 190, w: 760, h: 456 };
function drawOpening(t) {
  if (t > M.p2 + 0.6) return;
  const out = eIO(pr(t, M.p2 - 0.4, 0.8));
  ctx.save(); ctx.translate(-1900 * out, 0);
  const g = eIO(pr(t, M.go + 0.1, 0.8));
  if (g > 0) {
    const r = M5.LR(M5.big(2), FOLD, g);
    if (g < 1) { ctx.fillStyle = C.wheat; ctx.fillRect(r.x, r.y + r.h * 0.1, r.w, r.h * 0.9); }
    scaled(r, 700, clamp((g - 0.3) / 0.7), () => folderCard(t));
  }
  // 三次断开的 run
  for (let i = 0; i < 3; i++) {
    const [s, a] = K.pop(t, M.go + 0.35 + i * 0.12); const y = 220 + i * 140;
    K.withScale(310, y + 45, s, a, () => {
      box({ x: 160, y, w: 300, h: 90 }, { stroke: C.ink, lw: 2 });
      text('run ' + (i + 1), 310, y + 58, F(800, 36, INTER), C.black, 'center');
    });
    if (i < 2 && a > 0.5) E.line(310, y + 96, 310, y + 136, C.gray, 3, [6, 8]);
    K.arrow(470, y + 45, FOLD.x - 12, FOLD.y + 140 + i * 90, pr(t, M.cont + 0.1 * i, 0.5), C.claret, 3);
  }
  text('读写同一份记忆', 735, 196, F(700, 28, SANS), C.claret, 'center', eOC(pr(t, M.cont + 0.3, 0.4)));
  // 落在数据库 / 对象存储
  const db = eOC(pr(t, M.db, 0.5));
  if (db > 0) {
    ctx.save(); ctx.globalAlpha *= db; ctx.translate(0, (1 - db) * 30);
    E.line(FOLD.x + 190, FOLD.y + FOLD.h + 6, FOLD.x + 190, 700, C.ink, 3); E.line(FOLD.x + 570, FOLD.y + FOLD.h + 6, FOLD.x + 570, 700, C.ink, 3);
    cylinder(FOLD.x + 40, 700, 300, 150, '数据库');
    cylinder(FOLD.x + 420, 700, 300, 150, '对象存储');
    ctx.restore();
  }
  // worker 没了，记忆还在
  const wk = eOC(pr(t, M.db + 0.3, 0.5));
  if (wk > 0) {
    const gone = eOC(pr(t, M.wgone, 0.5));
    ctx.save(); ctx.globalAlpha *= wk * (1 - 0.55 * gone);
    box({ x: 160, y: 680, w: 300, h: 150 }, { stroke: C.rule });
    text('Worker', 310, 750, F(800, 38, INTER), C.black, 'center');
    text('可能重启、换掉', 310, 798, F(500, 28, SANS), C.ink, 'center');
    ctx.restore();
    K.cross(310, 755, 120, gone, C.claret, 7);
    const st = eOC(pr(t, M.still, 0.5));
    if (st > 0) { K.check(FOLD.x + FOLD.w - 60, FOLD.y + 100, 44, st, C.teal, 7); text('记忆还在', FOLD.x + FOLD.w - 100, FOLD.y + 116, F(800, 34, SANS), C.teal, 'right', st); }
  }
  ctx.restore();
}

// ---------- 4B：原文段落 + 指针示意 ----------
const MW_FULL = K.V(2.3, 360, 430, 96, 180, 1728, 720);
const MW_LEFT = K.V(1.25, 360, 330, 96, 180, 860, 690);
function drawLookup(t) {
  if (t < M.p2 - 0.5 || t > M.p3 + 0.6) return;
  const slide = eOC(pr(t, M.p2 - 0.5, 0.8)), out = eIO(pr(t, M.p3 - 0.4, 0.8));
  let v = K.lv(MW_FULL, MW_LEFT, eIO(pr(t, M.other - 0.2, 0.8)));
  v = { k: v.k, cx: v.cx, cy: v.cy, rect: { x: v.rect.x + 1800 * (1 - slide) - 1900 * out, y: v.rect.y, w: v.rect.w, h: v.rect.h } };
  const P = REG.shots.memory.phrases;
  K.view(IMG.mweb, 3, v, { bg: '#FAF9F5', lift: 0.55, rot: -1.5 * (1 - slide), over: map => {
    K.sweep(P.lookup, map, eIO(pr(t, M.only, 1.2)));
    K.sweep(P.pointer, map, eIO(pr(t, M.ptr, 0.8)));
  } });
  // 右侧：工单系统 + 记忆里的指针（示意）
  const a = eOC(pr(t, M.other + 0.3, 0.5));
  if (a > 0) {
    ctx.save(); ctx.translate(-1900 * out, (1 - a) * 30); ctx.globalAlpha *= a;
    const R = { x: 1020, y: 190, w: 800, h: 290 };
    box(R, { stroke: C.oxford, lw: 3, lift: 0.35 });
    text('工单系统', R.x + 30, R.y + 58, F(800, 38, SERIF), C.black);
    text('示意', R.x + R.w - 30, R.y + 52, F(400, 26, SANS), C.ink2, 'right');
    box({ x: R.x + 30, y: R.y + 92, w: R.w - 60, h: 166 }, { fill: '#FFFFFF', lift: 0.1 });
    text('#142  登录页报错', R.x + 56, R.y + 146, F(700, 32, SANS), C.ink);
    text('状态、讨论、附件都在这里', R.x + 56, R.y + 196, F(500, 28, SANS), C.ink);
    text('能随时查回来', R.x + 56, R.y + 238, F(500, 28, SANS), C.oxford);
    ctx.restore();
    const b = eOC(pr(t, M.ptr, 0.5));
    if (b > 0) {
      ctx.save(); ctx.translate(-1900 * out, (1 - b) * 30); ctx.globalAlpha *= b;
      const Q = { x: 1020, y: 590, w: 800, h: 230 };
      box(Q, { fill: C.wheat, stroke: C.claret, lw: 3, lift: 0.35 });
      text('记忆里只存一行', Q.x + 30, Q.y + 58, F(800, 36, SERIF), C.black);
      box({ x: Q.x + 30, y: Q.y + 90, w: Q.w - 60, h: 100 }, { fill: '#FFFFFF', lift: 0.1 });
      text('任务见工单 #142', Q.x + 60, Q.y + 152, F(700, 34, SANS), C.claret);
      ctx.restore();
      K.arrow(1300, 580 - 0, 1300, 492, pr(t, M.ptr + 0.3, 0.5), C.claret, 4);
      text('指针', 1330, 548, F(700, 28, SANS), C.claret, 'left', eOC(pr(t, M.ptr + 0.5, 0.4)) * (1 - out));
    }
  }
}

// ---------- 4C/4D/4E：记忆目录原图 ----------
const MEM_FULL = K.V(0.95, 700, 351, 295, 190, 1330, 668);
const MEM_PUSH = K.V(1.3, 895, 395, 96, 180, 1180, 720);
const ROWS = { instr: { x: 477, y: 177, w: 836, h: 77 }, index: { x: 477, y: 270, w: 836, h: 77 }, reported: { x: 477, y: 363, w: 836, h: 77 }, notes: { x: 477, y: 455, w: 836, h: 78 }, progress: { x: 477, y: 548, w: 836, h: 78 } };
const NOTE = {
  instr: ['instructions.md', '用户对 Agent 的要求', '每次 run 都加载', '简报里：只要 Agent 相关的新闻', true],
  notes: ['notes/', '学到的关于用户的事：偏好、被纠正过的地方', '要用时再读', '', false],
  reported: ['reported.md', '已经告诉过用户什么', '每次都加载', '简报里：昨天发过的，今天不再发', true],
  progress: ['progress/', '每个进行中的任务一个进度文件', '下一次 run 读它接着干', '', false],
  index: ['index.md', 'notes/ 和 progress/ 的索引', '每次加载，细节按需读', '', false]
};
function activeRows(t) {
  const seq = [['instr', M.p4], ['notes', M.p5], ['reported', M.p6], ['progress', M.p7], ['index', M.p8]];
  const out = {}; seq.forEach(([k, t0], i) => { const t1 = i + 1 < seq.length ? seq[i + 1][1] : 1e9; out[k] = pr(t, t0 - 0.3, 0.4) * (1 - pr(t, t1 - 0.3, 0.3)); });
  if (t > M.p8) { out.notes = Math.max(out.notes, pr(t, M.p8 - 0.2, 0.4)); out.progress = Math.max(out.progress, pr(t, M.p8 - 0.2, 0.4)); }
  return out;
}
function drawMem(t) {
  if (t < M.p3 - 0.6 || t > M.so + 0.8) return;
  const slide = eOC(pr(t, M.p3 - 0.6, 0.8));
  let v = K.lv(MEM_FULL, MEM_PUSH, eIO(pr(t, M.p4 - 0.6, 0.8)));
  const out = eIO(pr(t, M.so, 0.7));
  v = { k: v.k, cx: v.cx, cy: v.cy, rect: { x: v.rect.x + 1700 * (1 - slide) - 1300 * out, y: v.rect.y, w: v.rect.w, h: v.rect.h } };
  const act = activeRows(t); const anyA = t > M.p4 - 0.3 ? 1 : 0;
  K.view(IMG.mem, 1, v, { bg: '#FFFFFF', lift: 0.55, rot: -1.5 * (1 - slide), alpha: 1 - clamp(out * 1.5), over: map => {
    if (anyA) Object.entries(ROWS).forEach(([k, q]) => {
      const dim = 0.55 * (1 - clamp((act[k] || 0) * 1.5)) * clamp(pr(t, M.p4 - 0.3, 0.4));
      if (dim > 0) { ctx.fillStyle = `rgba(255,255,255,${dim})`; ctx.fillRect(map.x(q.x), map.y(q.y), q.w * map.k, q.h * map.k); }
      if ((act[k] || 0) > 0) K.ring([q], map, act[k]);
    });
    else K.ring([{ x: 478, y: 82, w: 305, h: 36 }], map, pr(t, M.p3 + 0.6, 0.6));
  } });
  const la = eOC(pr(t, M.fname, 0.5)) * (1 - out);
  if (la > 0) pill(1824, 150 + 0, '文件名来自原文示例图', '#FFFFFF', C.ink2, la, 'right');
  // 注释卡
  if (t > M.so) return;
  const order = ['instr', 'notes', 'reported', 'progress', 'index'];
  order.forEach(k => {
    const a = act[k] || 0; if (a <= 0) return;
    if (t > M.p8 && k !== 'index') return;
    const d = NOTE[k]; const R = { x: 1310, y: 200, w: 514, h: 560 };
    ctx.save(); ctx.globalAlpha *= clamp(a * 1.4); ctx.translate((1 - eOC(a)) * 60, 0);
    box(R, { fill: C.sheet, stroke: C.claret, lw: 3, lift: 0.4 });
    ctx.fillStyle = C.claret; ctx.fillRect(R.x, R.y, R.w, 8);
    text(d[0], R.x + 30, R.y + 76, F(800, 40, INTER), C.black);
    let y = R.y + 140; const n = K.para(d[1], R.x + 30, y, F(500, 32, SANS), 46, C.ink, R.w - 60); y += n * 46 + 14;
    text(d[2], R.x + 30, y, F(700, 32, SANS), C.claret); y += 70;
    if (d[3]) {
      E.line(R.x + 30, y - 30, R.x + R.w - 30, y - 30, C.rule, 2);
      const m = K.para(d[3], R.x + 30, y + 10, F(600, 30, SANS), 44, C.black, R.w - 60); y += m * 44 + 20;
      if (d[4]) text('示意', R.x + 30, y + 10, F(400, 26, SANS), C.ink2);
    }
    ctx.restore();
  });
}

// ---------- 4E：每次加载 vs 按需读 ----------
const CTX = { x: 96, y: 200, w: 800, h: 580 }, ND = { x: 1040, y: 200, w: 784, h: 580 };
function drawLoad(t) {
  if (t < M.so - 0.1 || t > M.p9end) return;
  const a = eOC(pr(t, M.so + 0.1, 0.5));
  const ex = eIO(pr(t, M.say - 0.4, 0.8));
  // 4F 时整块缩小到右下（只缩小）
  ctx.save();
  const sq = ex, sc = lerp(1, 0.45, sq);
  const tx = lerp(0, 1000 - 96 * 0.45, sq), ty = lerp(0, 600 - 200 * 0.45, sq);
  ctx.translate(tx, ty); ctx.scale(sc, sc);
  ctx.globalAlpha *= 1 - pr(t, M.dream - 0.3, 0.4);
  // 上下文框
  box(CTX, { fill: C.wheat, stroke: C.ink, lw: 3, lift: 0.35, alpha: a });
  text('每次 run 开头装进上下文', CTX.x + 30, CTX.y + 62, F(800, 40, SERIF), C.black, 'left', a);
  box(ND, { fill: C.sheet, stroke: C.ink2, lw: 2, dash: [10, 8], lift: 0.1, alpha: a });
  text('要细节再去读', ND.x + 30, ND.y + 62, F(800, 40, SERIF), C.black, 'left', a);
  // 文件卡：从原图对应行飞出（原图推近视窗里的行位置）
  const map = r => ({ x: MEM_PUSH.rect.x + MEM_PUSH.rect.w / 2 + (r.x - MEM_PUSH.cx) * MEM_PUSH.k, y: MEM_PUSH.rect.y + MEM_PUSH.rect.h / 2 + (r.y - MEM_PUSH.cy) * MEM_PUSH.k, w: r.w * MEM_PUSH.k * 0.45, h: r.h * MEM_PUSH.k });
  const files = [['instructions.md', 'instr', { x: CTX.x + 40, y: CTX.y + 110, w: 720, h: 96 }], ['index.md', 'index', { x: CTX.x + 40, y: CTX.y + 230, w: 720, h: 96 }], ['reported.md', 'reported', { x: CTX.x + 40, y: CTX.y + 350, w: 720, h: 96 }],
    ['notes/', 'notes', { x: ND.x + 340, y: ND.y + 130, w: 400, h: 110 }], ['progress/', 'progress', { x: ND.x + 340, y: ND.y + 300, w: 400, h: 110 }]];
  files.forEach(([nm, k, dst], i) => {
    const q = eIO(pr(t, M.so + i * 0.08, 0.7));
    const r = M5.LR(map(ROWS[k]), dst, q);
    const fold = i >= 3;
    box(r, { fill: '#FFFFFF', stroke: fold ? C.ink2 : C.claret, lw: 2, dash: fold ? [8, 6] : null, lift: 0.2 });
    E.docIcon(r.x + 20, r.y + r.h / 2 - 26, 38, 52, fold ? C.ink2 : C.claret);
    text(nm, r.x + 76, r.y + r.h / 2 + 12, F(700, 32, INTER), C.black);
  });
  const ia = eOC(pr(t, M.so + 0.8, 0.5));
  if (ia > 0) {
    K.curveArrow(CTX.x + 760, CTX.y + 278, ND.x + 340, ND.y + 185, -0.15, pr(t, M.so + 0.8, 0.5), C.claret, 3);
    K.curveArrow(CTX.x + 760, CTX.y + 278, ND.x + 340, ND.y + 355, 0.12, pr(t, M.so + 0.95, 0.5), C.claret, 3);
    text('索引指过去', ND.x + 40, ND.y + 470, F(700, 30, SANS), C.claret, 'left', ia);
    text('只装几个小文件', CTX.x + 40, CTX.y + 530, F(700, 32, SANS), C.claret, 'left', eOC(pr(t, M.small, 0.5)));
  }
  ctx.restore();
  // 4F 开头：run 里写入
  const w = eOC(pr(t, M.say, 0.4)) * (1 - pr(t, M.dream - 0.3, 0.4));
  if (w > 0) {
    const R = { x: 160, y: 300, w: 640, h: 300 };
    box(R, { fill: C.sheet, stroke: C.ink, lw: 3, alpha: w });
    text('run', R.x + 40, R.y + 90, F(800, 56, INTER), C.black, 'left', w);
    text('边干活边写记忆', R.x + 40, R.y + 170, F(700, 36, SANS), C.claret, 'left', w);
    K.arrow(R.x + R.w + 10, R.y + 150, 990, 700, pr(t, M.say + 0.2, 0.5), C.claret, 4);
  }
}

// ---------- 4F：dreaming ----------
const DW = K.V(2.2, 360, 110, 168, 180, 1584, 400);
function drawDream(t) {
  if (t < M.dream - 0.5) return;
  const slide = eOC(pr(t, M.dream - 0.5, 0.7));
  let v = DW;
  v = { k: v.k, cx: v.cx, cy: v.cy, rect: { x: v.rect.x - 1500 * (1 - slide), y: v.rect.y, w: v.rect.w, h: v.rect.h } };
  const P = REG.shots.dream.phrases;
  K.view(IMG.dweb, 3, v, { bg: '#FAF9F5', lift: 0.55, rot: -1.2 * (1 - slide), over: map => {
    K.sweep(P.dreaming, map, eIO(pr(t, M.dream, 0.7)));
    K.sweep(P.curate, map, eIO(pr(t, M.dream + 0.8, 1.0)));
    K.sweep(P.post, map, eIO(pr(t, M.anth, 0.8)));
  } });
  // dreaming 卡
  const ca = eOC(pr(t, M.outside + 0.4, 0.5));
  if (ca > 0) {
    const R = { x: 96, y: 612, w: 1000, h: 280 };
    ctx.save(); ctx.globalAlpha *= ca; ctx.translate(0, (1 - ca) * 40);
    box(R, { fill: C.sheet, stroke: C.claret, lw: 3, lift: 0.4 });
    E.kicker(R.x + 36, R.y + 76, 'dreaming（可选）', C.black, 1);
    const L = [['在 run 之外，单独跑一个整理任务', M.outside + 0.4], ['回头看过去的会话', M.look], ['替换过时的记忆', M.repl]];
    L.forEach(([s, t0], i) => { const q = eOC(pr(t, t0, 0.5)); if (q > 0) { ctx.fillStyle = C.claret; ctx.fillRect(R.x + 36, R.y + 106 + i * 54, 8, 36 * q); E.wipeText(s, R.x + 64, R.y + 136 + i * 54, F(600, 32, SANS), C.ink, 32, q); } });
    ctx.restore();
  }
  const sa = eOC(pr(t, M.anth, 0.5));
  if (sa > 0) {
    const R = { x: 1130, y: 612, w: 694, h: 280 };
    ctx.save(); ctx.globalAlpha *= sa; ctx.translate(0, (1 - sa) * 40);
    box(R, { fill: C.wheat, lift: 0.3 });
    text('Anthropic · 2026-11-06', R.x + 36, R.y + 62, F(700, 30, INTER), C.claret);
    text('The components of', R.x + 36, R.y + 116, F(800, 38, SERIF), C.black); text('agent memory', R.x + 36, R.y + 164, F(800, 38, SERIF), C.black);
    text('专门讲过 dreaming · 我们也拆过', R.x + 36, R.y + 234, F(500, 30, SANS), C.ink, 'left', eOC(pr(t, M.we, 0.5)));
    ctx.restore();
  }
}

window.Chapter = {
  sources: [],
  texts: '记忆一个文件目录读写同一份数据库对象存储可能重启换掉还在工单系统示意登录页报错状态讨论附件都在这里能随时查回来里只存一行任务见指针文件名来自原文示例图用户对的要求每次都加载简报里只要相关新闻学到关于事偏好被纠正过地方要用时再读已经告诉什么昨天发今天不进行中进度下一读它接着干和索引细节按需开头装进上下文去指过几小边活写整理单独跑之外回头看会话替换时可选专门讲我们也拆那期一节与配图',
  async init(data) {
    const A = data.A, st = data.st;
    IMG = data.img; REG = data.json.reg;
    M.go = A('s04-1', '连续性'); M.cont = M.go; M.db = A('s04-1', '数据库'); M.wgone = A('s04-1', 'worker 没了'); M.still = A('s04-1', '记忆还在');
    M.p2 = st('s04-2'); M.only = A('s04-2', '记忆只存'); M.other = A('s04-2', '已经在别的系统'); M.ptr = A('s04-2', '存一个指针');
    M.p3 = st('s04-3'); M.fname = A('s04-3', '文件名');
    M.p4 = st('s04-4'); M.p5 = st('s04-5'); M.p6 = st('s04-6'); M.p7 = st('s04-7'); M.p8 = st('s04-8');
    M.so = A('s04-8', '所以'); M.small = A('s04-8', '只装几个小文件');
    M.say = st('s04-9'); M.dream = A('s04-9', 'dreaming'); M.outside = A('s04-9', '在 run 之外'); M.look = A('s04-9', '回头看'); M.repl = A('s04-9', '替换过时');
    M.anth = A('s04-9', 'Anthropic'); M.we = A('s04-9', '我们也拆过'); M.p9end = data.T + 1;
    this.sources = [
      [0, '原文：Anthropic《Building always-on agents》2026-11-13 · Memory 一节与配图'],
      [M.p4 - 0.3, '原文示例图 one example setup；简报两处为示意'],
      [M.dream - 0.5, '原文 dreaming 段；对号：Anthropic《The components of agent memory》2026-11-06']
    ];
    const c = data.cue;
    c(M.go + 0.1, 'whoosh'); c(M.cont, 'pop'); c(M.db, 'pop'); c(M.wgone, 'pop'); c(M.still, 'pop');
    c(M.p2 - 0.5, 'paper'); c(M.only, 'marker'); c(M.other - 0.2, 'whoosh'); c(M.ptr, 'marker');
    c(M.p3 - 0.6, 'paper'); c(M.p4 - 0.6, 'whoosh'); [M.p4, M.p5, M.p6, M.p7, M.p8].forEach(x => c(x - 0.3, 'pop'));
    c(M.so, 'whoosh'); c(M.say - 0.4, 'whoosh'); c(M.dream - 0.5, 'paper'); c(M.dream, 'marker'); c(M.outside + 0.4, 'pop'); c(M.anth, 'pop');
  },
  renderContent(c, t, data) {
    ctx = c;
    drawOpening(t);
    drawLookup(t);
    drawMem(t);
    drawLoad(t);
    drawDream(t);
    M5.intro(t, 2, M.go);
  }
};
})();
