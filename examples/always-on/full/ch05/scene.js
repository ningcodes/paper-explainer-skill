// 05 · 权限（s05-1 ~ s05-6）。g3。
// 镜头：5A 翻页落在五格 → 「权限」格变签，原文 Permissions 段从该格长出（实体纸，most risk 黄笔）+ 右栏「一次 run」卡；
// 5B 同一张纸黄笔 proceed/block/wait，右栏 run 卡长出三条分支 + 三样小签；5C 纸缩成左侧小地图，三样小签飞成顶部页签，
// 大画布向右平移三格：① 凭证代理 ② auto mode 分类器（示意）③ 延后的工具调用（run 结束 → 存档 → 卡片 → 回答进收件箱 → 新 run 续会话）。
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

// ---------- 原文纸：大 → 左侧小地图 ----------
const RX = 720;  // perm 截图 CSS 宽
function permPaper(t) {
  if (t < M.g0) return;
  const r0 = M5.big(3);
  const BV = K.V(1.58, 360, 238, 96, 180, 1140, 700);
  const V0 = K.V(1.58 * r0.w / 1140, 360, 238, r0.x, r0.y, r0.w, r0.h);
  const MM = cy => K.V(0.75, 360, cy, 96, 180, 540, 700);
  const v = K.kview(t, [[M.g0, V0], [M.g0 + 0.8, BV], [M.c0, BV], [M.c0 + 0.8, MM(500)], [M.p3, MM(500)], [M.p3 + 0.7, MM(640)]]);
  const S = RG.shots.perm.phrases;
  K.view(IMG.perm, 3, v, { bg: '#FAF9F5', lift: 0.5, rot: lerp(-1.5, 0, eIO(pr(t, M.g0, 0.8))), over: map => {
    K.sweep(S.risk, map, eIO(pr(t, M.risk, 1.3)));
    K.sweep(S.decide, map, eIO(pr(t, M.dec, 1.2)));
    K.sweep(S.same, map, eIO(pr(t, M.same, 0.8)));
    K.sweep(S.proxy, map, eIO(pr(t, M.proxy, 1.0))); K.sweep(S.inject, map, eIO(pr(t, M.inj, 0.8)));
    K.sweep(S.classif, map, eIO(pr(t, M.cls, 0.9))); K.sweep(S.review, map, eIO(pr(t, M.rev, 0.9)));
    K.sweep(S.saved, map, eIO(pr(t, M.save, 0.8))); K.sweep(S.card, map, eIO(pr(t, M.card, 0.7)));
    K.sweep(S.event, map, eIO(pr(t, M.ans, 0.8))); K.sweep(S.worker, map, eIO(pr(t, M.wk, 0.8)));
  } });
}

// ---------- 右栏（5A/5B）：一次 run → 三条分支 → 三样 ----------
const RC = 1280, RW = 544;
const CHIPS = [['凭证', 0], ['auto mode', 1], ['延后的工具调用', 2]];
function chipW(s) { return tw(s, F(700, 28, SANS)) + 32; }
function chip5B(i) { let x = RC; for (let k = 0; k < i; k++) x += chipW(CHIPS[k][0]) + 12; return { x, y: 760, w: chipW(CHIPS[i][0]), h: 52 }; }
function chipTab(i) { return { x: 700 + i * 380, y: 186, w: 360, h: 60 }; }
function rightCol(t) {
  if (t < M.acc - 0.6 || t > M.c0 + 0.8) return;
  const out = eIO(pr(t, M.c0, 0.7));
  ctx.save(); ctx.translate(760 * out, 0);
  // run 卡
  const [s0, a0] = K.pop(t, M.acc - 0.5, 0.5);
  K.withScale(RC + RW / 2, 270, s0, a0, () => {
    K.card({ x: RC, y: 190, w: RW, h: 180 }, { fill: C.sheet, stroke: C.ink, lw: 2.5, r: 10, lift: 0.35 });
    text('一次 run', RC + 28, 244, F(800, 36, SERIF), C.black);
    const q1 = pr(t, M.acc, 0.5), q2 = pr(t, M.un, 0.5);
    if (q1 > 0) { ctx.save(); ctx.globalAlpha *= clamp(q1 * 2); keyIcon(RC + 52, 296, 40, C.claret); ctx.restore(); E.wipeText('用户的访问权限', RC + 96, 306, F(700, 30, SANS), C.ink, 30, q1); }
    if (q2 > 0) { ctx.save(); ctx.globalAlpha *= clamp(q2 * 2); person(RC + 50, 344, 30, C.gray); ctx.restore(); E.wipeText('无人值守', RC + 96, 352, F(700, 30, SANS), C.ink, 30, q2); }
  });
  // 每次调用工具 → 三条分支
  const pt = pr(t, M.dec - 0.2, 0.5);
  if (pt > 0) {
    K.arrow(RC + RW / 2, 372, RC + RW / 2, 420, pt, C.ink, 3);
    E.wipeText('每次调用工具', RC + RW / 2, 458, F(700, 30, SANS), C.black, 30, pr(t, M.dec, 0.5), 'center');
  }
  const BR = [['直接执行', M.b1, C.teal], ['拦下', M.b2, C.claret], ['等批准', M.b3, C.oxford]];
  BR.forEach(([lb, tt, col], i) => {
    const x = RC + i * 188, w = 168;
    K.arrow(RC + RW / 2, 478, x + w / 2, 520, pr(t, tt - 0.25, 0.4), C.ink2, 2);
    const [s, a] = K.pop(t, tt - 0.1, 0.45);
    K.withScale(x + w / 2, 580, s, a, () => {
      K.card({ x, y: 524, w, h: 118 }, { fill: C.sheet, stroke: col, lw: 3, r: 8, lift: 0.25 });
      if (i === 0) K.check(x + w / 2, 556, 30, pr(t, tt, 0.4), col, 5);
      if (i === 1) K.cross(x + w / 2, 556, 28, pr(t, tt, 0.4), col, 5);
      if (i === 2) pauseIcon(x + w / 2, 556, 34, col);
      text(lb, x + w / 2, 620, F(700, 30, SANS), C.black, 'center');
    });
  });
  // 三样
  if (t > M.same - 0.3) E.kicker(RC, 730, '普通 Agent 也有的三样', C.black, pr(t, M.same - 0.3, 0.6));
  ctx.restore();
}
// 三样小签：5B 在右栏 → 5C 飞成顶部页签（同一元素）
function chips(t) {
  const tabP = eIO(pr(t, M.c0 + 0.1, 0.8));
  const act = t < M.p2 ? 0 : t < M.p3 ? 1 : 2;
  CHIPS.forEach(([lb], i) => {
    const tt = [M.l1, M.l2, M.l3][i]; const [s, a] = K.pop(t, tt - 0.1, 0.4); if (a <= 0) return;
    const r = E.lr(chip5B(i), chipTab(i), tabP);
    const on = tabP > 0.5 ? (i === act ? 1 : 0) : 1;
    K.withScale(r.x + r.w / 2, r.y + r.h / 2, s, a, () => {
      ctx.fillStyle = on ? C.claret : C.wheat; ctx.fillRect(r.x, r.y, r.w, r.h);
      const fs = lerp(28, 30, tabP);
      if (tabP > 0.5) text(String(i + 1), r.x + 22, r.y + r.h / 2 + 11, F(700, 30, INTER), on ? '#FFFFFF' : C.claret, 'left', clamp((tabP - 0.5) * 3));
      text(lb, r.x + r.w / 2 + 12 * tabP, r.y + r.h / 2 + fs * 0.36, F(700, fs, SANS), on ? '#FFFFFF' : C.black, 'center');
    });
  });
}

// ---------- 5C 大画布：三格横排，镜头平移 ----------
const PX = [700, 2000, 3300];
function panel1(t, ox) {
  const ap = pr(t, M.c0 + 0.4, 0.6); if (ap <= 0) return;
  // Agent 的环境（虚线框）
  ctx.save(); ctx.globalAlpha *= clamp(ap * 2);
  ctx.strokeStyle = C.ink2; ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.strokeRect(ox, 330, 360, 380); ctx.setLineDash([]);
  text('Agent 的环境', ox + 20, 370, F(700, 28, SANS), C.ink2);
  ctx.restore();
  K.agent(ox + 180, 520, { label: 'Agent', sub: '发请求', w: 260, h: 140, alpha: clamp(ap * 2) });
  // 代理（环境外）
  const [s1, a1] = K.pop(t, M.proxy - 0.1, 0.5);
  K.withScale(ox + 620, 520, s1, a1, () => {
    const r = box(ox + 620, 520, 280, 140, '代理', '在环境外面', { stroke: C.claret, lw: 3 });
    keyIcon(r.x + 44, r.y + 44, 38, C.claret);
  });
  // 网站
  const [s2, a2] = K.pop(t, M.proxy + 0.5, 0.5);
  K.withScale(ox + 1000, 520, s2, a2, () => { box(ox + 1000, 520, 240, 140, '网站', '要登录'); });
  if (t > M.site) { tagShi(ox + 932, 640, pr(t, M.site, 0.4)); E.wipeText('简报要登录的网站', ox + 1000, 690, F(700, 28, SANS), C.claret, 28, pr(t, M.site + 0.1, 0.6), 'center'); }
  // 请求信封：Agent → 代理（不带凭证）→ 网站（带上真凭证）
  const m1 = eIO(pr(t, M.noCred - 0.2, 1.2)), m2 = eIO(pr(t, M.inj + 0.5, 1.0));
  if (t > M.noCred - 0.3) {
    const x = m2 > 0 ? lerp(ox + 620, ox + 1000, m2) : lerp(ox + 180, ox + 620, m1), y = 410;
    K.arrow(ox + 320, 430, ox + 470, 430, pr(t, M.noCred - 0.3, 0.5), C.ink2, 2);
    K.arrow(ox + 770, 430, ox + 870, 430, pr(t, M.inj + 0.4, 0.4), C.ink2, 2);
    envelope(x, y, 96, 62, clamp(pr(t, M.noCred - 0.3, 0.3)));
    const kb = pr(t, M.inj, 0.4);
    if (kb > 0) { ctx.save(); ctx.globalAlpha *= kb; ctx.fillStyle = C.claret; ctx.beginPath(); ctx.arc(x + 46, y - 30, 22, 0, Math.PI * 2); ctx.fill(); keyIcon(x + 46, y - 30, 26, '#FFFFFF'); ctx.restore(); }
    if (m2 <= 0) E.wipeText('不带密码和 token', ox + 400, 300, F(700, 28, SANS), C.ink, 28, pr(t, M.noCred, 0.6), 'center');
    E.wipeText('转发前加上真凭证', ox + 620, 780, F(700, 30, SANS), C.claret, 30, pr(t, M.inj, 0.6), 'center');
  }
}
function panel2(t, ox) {
  if (t < M.p2 - 0.4) return;
  tagShi(ox + 1054, 300, pr(t, M.p2, 0.4));
  // 左：要执行的工具调用（示意）
  const Q = [['读网页', 0], ['写草稿', 0], ['删除文件', 1]];
  const gate = { x: ox + 560, y: 500 };
  Q.forEach(([lb, risky], i) => {
    const [s, a] = K.pop(t, M.p2 + 0.4 + i * 0.12, 0.45); if (a <= 0) return;
    let x = ox + 130, y = 380 + i * 120;
    if (risky) { const m = eIO(pr(t, M.cls + 0.4, 0.8)), m2 = eIO(pr(t, M.blk, 0.8)); x = lerp(x, gate.x, m); y = lerp(y, gate.y, m); if (m2 > 0) { x = lerp(gate.x, ox + 880, m2); y = lerp(gate.y, 600, m2); } }
    K.withScale(x, y, s, a, () => box(x, y, 220, 84, lb, null, { fs: 30, stroke: risky && t > M.cls ? C.claret : C.rule, lw: risky ? 3 : 2 }));
  });
  // 分类器闸门
  const [sg, ag] = K.pop(t, M.cls - 0.1, 0.5);
  K.withScale(gate.x, gate.y - 150, sg, ag, () => {
    const r = box(gate.x, gate.y - 150, 280, 120, '分类器', '只看高风险操作', { stroke: C.ink, lw: 3 });
    E.magnifier(r.x + 34, r.y + 36, 13, C.ink, 3);
  });
  if (ag > 0) K.arrow(gate.x, gate.y - 88, gate.x, gate.y - 46, ag, C.ink, 3);
  // 拦下 → 换个更安全的做法
  const pb = pr(t, M.blk + 0.5, 0.4);
  if (pb > 0) { K.cross(ox + 1030, 600, 34, pb, C.claret, 6); text('拦下', ox + 1060, 612, F(800, 34, SERIF), C.claret, 'left', pb); }
  const ps = pr(t, M.safer, 0.6);
  if (ps > 0) { K.curveArrow(ox + 860, 650, ox + 260, 690, -0.18, ps, C.claret, 3); E.wipeText('换个更安全的做法', ox + 560, 790, F(700, 30, SANS), C.claret, 30, pr(t, M.safer + 0.2, 0.6), 'center'); }
  // 最重要的决定 → 用户审
  const pu = pr(t, M.rev, 0.5);
  if (pu > 0) {
    K.card({ x: ox + 760, y: 320, w: 340, h: 110 }, { fill: C.sheet, stroke: C.oxford, lw: 3, r: 10, lift: 0.3, alpha: clamp(pu * 2) });
    ctx.save(); ctx.globalAlpha *= clamp(pu * 2); person(ox + 810, 375, 50, C.oxford); ctx.restore();
    E.wipeText('最重要的决定', ox + 856, 366, F(700, 30, SANS), C.black, 30, pu);
    E.wipeText('还得用户审', ox + 856, 408, F(700, 30, SANS), C.oxford, 30, pr(t, M.rev + 0.3, 0.5));
  }
}
function panel3(t, ox) {
  if (t < M.p3 - 0.4) return;
  // run（调用中）
  const [s0, a0] = K.pop(t, M.p3 + 0.3, 0.45);
  const ended = eOC(pr(t, M.rend, 0.5));
  K.withScale(ox + 160, 380, s0, a0, () => {
    const r = box(ox + 160, 380, 300, 130, 'run', ' ', { stroke: ended > 0.5 ? C.gray : C.ink, lw: 3, tcol: ended > 0.5 ? C.ink2 : C.black, fill: mix(C.sheet, C.wheat, ended) });
    const pc = pr(t, M.p3 + 0.6, 0.4);
    if (pc > 0) { ctx.save(); ctx.globalAlpha *= pc; ctx.fillStyle = C.wheat; ctx.fillRect(r.x + 40, r.y + 76, 220, 40); ctx.globalAlpha *= clamp(pr(t, M.nx - 0.2, 0.3) + (t > M.nx ? 1 : 0.0)); pauseIcon(r.x + 66, r.y + 96, 26, C.oxford); ctx.globalAlpha = pc; text('工具调用', r.x + 92, r.y + 106, F(700, 28, SANS), C.oxford); ctx.restore(); }
    if (ended > 0) text('结束', r.x + r.w - 20, r.y + 50, F(800, 30, SERIF), C.claret, 'right', ended);
  });
  // 会话存档
  const ps = pr(t, M.save - 0.2, 0.5);
  if (ps > 0) {
    K.arrow(ox + 315, 380, ox + 395, 380, ps, C.ink, 3);
    const [s1, a1] = K.pop(t, M.save, 0.5);
    K.withScale(ox + 560, 380, s1, a1, () => { const r = box(ox + 560, 380, 300, 130, '会话存档', '停在这次调用中间', { stroke: C.oxford, lw: 3 }); E.docIcon(r.x + 18, r.y + 18, 30, 38, C.oxford); });
  }
  // 卡片推给用户（示意）
  const pk = pr(t, M.push, 0.5);
  if (pk > 0) {
    K.curveArrow(ox + 712, 360, ox + 830, 330, -0.2, pk, C.ink, 3);
    E.wipeText('推给用户', ox + 770, 296, F(700, 28, SANS), C.ink, 28, pr(t, M.push + 0.2, 0.5), 'center');
    const [s2, a2] = K.pop(t, M.card - 0.2, 0.5);
    K.withScale(ox + 970, 400, s2, a2, () => {
      const r = { x: ox + 840, y: 300, w: 270, h: 220 };
      K.card(r, { fill: '#FFFFFF', stroke: C.ink, lw: 2.5, r: 14, lift: 0.45 });
      text('需要你批准', r.x + 24, r.y + 52, F(700, 30, SANS), C.black);
      text('（示意）', r.x + 24, r.y + 92, F(500, 26, SANS), C.ink2);
      const press = eOC(pr(t, M.ans - 0.2, 0.3));
      ctx.fillStyle = mix(C.claret, '#6E0A2C', press); ctx.fillRect(r.x + 24, r.y + 134, 104, 56); text('批准', r.x + 76, r.y + 172, F(700, 28, SANS), '#FFFFFF', 'center');
      ctx.strokeStyle = C.ink2; ctx.lineWidth = 2; ctx.strokeRect(r.x + 142, r.y + 134, 104, 56); text('拒绝', r.x + 194, r.y + 172, F(700, 28, SANS), C.ink, 'center');
    });
  }
  // 收件箱（下方）+ worker 照常处理别的事件
  const pi = pr(t, M.p3 + 0.9, 0.6);
  if (pi > 0) {
    ctx.save(); ctx.globalAlpha *= clamp(pi * 2);
    ctx.fillStyle = C.wheat; ctx.fillRect(ox, 620, 660, 130);
    text('事件收件箱', ox + 24, 664, F(800, 30, SERIF), C.black);
    ctx.restore();
    // 别的事件：在 worker 手里依次处理掉（打勾）
    for (let i = 0; i < 2; i++) {
      const tt = M.wk + 0.3 + i * 0.7, x = ox + 210 + i * 140;
      const a = clamp(pi * 2) * (1 - 0.55 * pr(t, tt + 0.4, 0.4));
      K.card({ x, y: 642, w: 120, h: 50 }, { fill: C.sheet, stroke: C.rule, lw: 2, r: 6, lift: 0.1, alpha: a });
      text('事件', x + 60, 677, F(700, 26, SANS), C.ink, 'center', a);
      if (t > M.wk) K.check(x + 100, 668, 22, pr(t, tt, 0.4), C.teal, 4);
    }
    if (t > M.wk) E.wipeText('worker 照样处理别的事件', ox + 24, 730, F(700, 28, SANS), C.teal, 28, pr(t, M.wk, 0.6));
  }
  // 用户回答 = 新事件：从卡片飞进收件箱
  const pa = eIO(pr(t, M.ans + 0.1, 0.9));
  if (pa > 0) {
    const x = lerp(ox + 976, ox + 560, pa), y = lerp(500, 668, pa);
    K.card({ x: x - 80, y: y - 26, w: 160, h: 52 }, { fill: C.claret, r: 6, lift: 0.2 });
    text('用户回答', x, y + 10, F(700, 26, SANS), '#FFFFFF', 'center');
  }
  // 新 run 接着存档往下走
  const pn = pr(t, M.newrun, 0.5);
  if (pn > 0) {
    K.arrow(ox + 662, 680, ox + 830, 680, pn, C.claret, 3);
    const [s3, a3] = K.pop(t, M.newrun + 0.1, 0.5);
    K.withScale(ox + 975, 680, s3, a3, () => box(ox + 975, 680, 290, 120, '新 run', '续上存档的会话', { stroke: C.claret, lw: 3 }));
    // 虚线：存档 → 新 run（续会话）
    const pc = pr(t, M.cont, 0.6);
    if (pc > 0) { ctx.save(); ctx.setLineDash([8, 7]); K.curveArrow(ox + 640, 446, ox + 900, 618, 0.15, pc, C.oxford, 3); ctx.restore(); }
  }
}
function canvas5C(t) {
  if (t < M.c0 + 0.2) return;
  const pan = E.kf(t, [[M.p2, 0], [M.p2 + 0.75, 1300], [M.p3, 1300], [M.p3 + 0.75, 2600]]);
  ctx.save(); ctx.beginPath(); ctx.rect(670, 262, 1250, 640); ctx.clip();
  ctx.translate(-pan, 0);
  if (pan < 1250) panel1(t, PX[0]);
  if (pan > 50 && pan < 2550) panel2(t, PX[1]);
  if (pan > 1350) panel3(t, PX[2]);
  ctx.restore();
}

window.Chapter = {
  sources: [],
  texts: '',
  async init(data) {
    T = data.T; const A = data.A, st = data.st, en = data.en;
    IMG = data.img; RG = data.json.reg;
    M.tGo = Math.max(1.4, A('s05-1', '风险'));
    M.g0 = M.tGo + 0.25;
    M.risk = Math.max(M.g0 + 0.9, A('s05-1', '风险最大'));
    M.acc = Math.max(M.g0 + 0.6, A('s05-1', '拿着')); M.un = Math.max(M.acc + 0.6, A('s05-1', '没人看着'));
    M.dec = st('s05-2'); M.b1 = A('s05-2', '直接执行'); M.b2 = A('s05-2', '拦下来'); M.b3 = A('s05-2', '等用户批准');
    M.same = A('s05-2', '管这件事'); M.l1 = A('s05-2', '凭证'); M.l2 = A('s05-2', 'auto mode'); M.l3 = A('s05-2', '延后的');
    M.c0 = Math.max(st('s05-3') - 0.3, M.risk + 3.2);
    M.proxy = Math.max(M.c0 + 0.8, A('s05-3', '放一个代理')); M.noCred = Math.max(M.proxy + 0.6, A('s05-3', '不带密码')); M.inj = Math.max(M.noCred + 1.2, A('s05-3', '真凭证')); M.site = A('s05-3', '简报要登录');
    M.p2 = st('s05-4') - 0.35; M.cls = A('s05-4', '分类器'); M.blk = Math.max(M.cls + 1.3, A('s05-4', '危险的就拦下')); M.safer = A('s05-4', '换个更安全'); M.rev = A('s05-4', '最重要的决定');
    M.p3 = st('s05-5') - 0.35; M.nx = A('s05-5', '先不执行'); M.rend = A('s05-5', 'run 结束'); M.save = A('s05-5', '会话停在');
    M.push = st('s05-6'); M.card = A('s05-6', '卡片'); M.ans = A('s05-6', '用户的回答'); M.newrun = A('s05-6', '起一次新 run'); M.cont = A('s05-6', '接着'); M.wk = A('s05-6', '这段时间');
    window.__M = M;
    const cue = data.cue;
    cue(M.tGo, 'whoosh', 0.6); cue(M.g0, 'paper', 0.7); cue(M.risk, 'marker', 0.7); cue(M.acc - 0.5, 'pop', 0.5);
    cue(M.dec, 'marker', 0.6); [M.b1, M.b2, M.b3].forEach(x => cue(x, 'pop', 0.6)); cue(M.same, 'marker', 0.5);
    cue(M.c0, 'whoosh', 0.7); cue(M.proxy, 'pop', 0.6); cue(M.inj, 'pop', 0.7);
    cue(M.p2, 'whoosh', 0.6); cue(M.cls, 'pop', 0.6); cue(M.blk + 0.5, 'pop', 0.7); cue(M.rev, 'pop', 0.5);
    cue(M.p3, 'whoosh', 0.6); cue(M.save, 'pop', 0.6); cue(M.card, 'pop', 0.6); cue(M.ans + 0.1, 'whoosh', 0.4); cue(M.newrun, 'pop', 0.6);
    this.sources = [
      [M.g0 + 0.3, 'Anthropic《Building always-on agents》（2026-11-13）· Permissions 一节原文'],
      [M.c0 + 0.6, '同上：Credential store / Auto mode / Deferred tool calls；右侧为按原文描述重画的示意']
    ];
    this.texts = '一次用户的访问权限无人值守每调用工具直接执行拦下等批准普通也有的三样凭证延后的环境发请求代理在外面网站要登录简报不带密码和转发前加上真示意读网页写草稿删除文件分类器只看高风险操作换个更安全做法最重要决定还得审结束会话存档停这次中间推给需要你批准拒绝事件收件箱照处理别回答新续上原文';
  },
  renderContent(c, t) {
    ctx = c; t = clamp(t, 0, T);
    permPaper(t);
    rightCol(t);
    canvas5C(t);
    chips(t);
    M5.intro(t, 3, M.tGo);
  }
};
})();
