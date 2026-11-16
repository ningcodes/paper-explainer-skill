// 07 合起来 · 08 保留意见 · 09 结尾（s07-1 ~ s09-7）。g3。
// 镜头：7A 翻页落在五格大排 → 五格飞进原文总图（9f8df7）对应方块位置，总图实体纸接住；
// 7B 每日简报（示意）走一遍：右栏步骤逐条亮，总图里对应方块酒红描边 + 小圆点沿原图箭头走；7C（s07-6）原图 gif 动起来循环；
// 8 总图退场，左：原文标题页（Best practices 黄笔）→ 成本句（−78% / −40%）→ 翻成 Timers 句（fixed interval）；右：两张保留意见卡；
// 9 五格回来当表头，五条总结逐条出 → 讨论问题 → 署名卡（文字来自 film.json 的 outro），停到片尾。
(function () {
'use strict';
const E = window.ED, K = window.Kit;
const { C, SERIF, SANS, INTER, F, clamp, lerp, eOQ, eOC, eIC, eIO, pr, mix, tw, text } = E;
let ctx = null, T = 0, M = {}, IMG = {}, RG = null, GIF = [];

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



// ---------- 总图坐标（原图像素 1200×675）----------
const TV = K.V(1.22, 600, 337, 96, 160, 1318, 702);
const sx = ix => 96 + 1318 / 2 + (ix - 600) * 1.22, sy = iy => 160 + 702 / 2 + (iy - 337) * 1.22;
const BOX = { inbox: [85, 292, 155, 85], timers: [85, 120, 153, 82], memory: [361, 467, 150, 82], perm: [558, 467, 154, 82], outbox: [832, 293, 156, 84], run: [411, 293, 250, 84], user: [1040, 295, 92, 92] };
const CELL_BOX = ['inbox', 'timers', 'memory', 'perm', 'outbox'];
const scr = b => ({ x: sx(b[0]), y: sy(b[1]), w: b[2] * 1.22, h: b[3] * 1.22 });
function lit(iv, t) { let v = 0; for (const [a, b] of iv) v = Math.max(v, eOC(pr(t, a, 0.3)) * (1 - pr(t, b, 0.3))); return v; }
function dotPath(pts, t, a, d) {
  const p = pr(t, a, d); if (p <= 0 || p >= 1) return;
  const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(l); tot += l; }
  let s = eIO(p) * tot, i = 0; while (i < L.length - 1 && s > L[i]) { s -= L[i]; i++; }
  const q = clamp(s / L[i]); const x = lerp(pts[i][0], pts[i + 1][0], q), y = lerp(pts[i][1], pts[i + 1][1], q);
  ctx.fillStyle = C.claret; ctx.beginPath(); ctx.arc(sx(x), sy(y), 11, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.stroke();
}

// ---------- 7A：五格 → 总图 ----------
function intro7(t) {
  if (t > M.fly + 1.2) return;
  const p = eIO(pr(t, M.fly, 0.8)), fade = 1 - pr(t, M.fly + 0.85, 0.15);
  for (let i = 0; i < 5; i++) {
    const r = M5.LR(M5.big(i), scr(BOX[CELL_BOX[i]]), p);
    M5.cell(i, r, 0, fade, r.h / 260);
  }
}
function totalPaper(t) {
  if (t < M.fly + 0.4 || t > M.h0 + 0.9) return;
  const a = pr(t, M.fly + 0.4, 0.35);
  const out = K.V(1.22, 600, 337, 96 - 1900, 160, 1318, 702);   // v2：整排推走，标题页从右跟进
  const v = K.kview(t, [[M.h0, TV], [M.h0 + 0.7, out]]);
  const playing = t >= M.g0;
  const img = playing ? GIF[Math.floor((t - M.g0) * 20) % GIF.length] : GIF[12];
  K.view(img, 1, v, { bg: '#FFFFFF', lift: 0.5, alpha: a, over: () => {
    if (t >= M.g0 + 0.3 || t > M.h0) return;
    const o = 1 - pr(t, M.g0, 0.3);
    ctx.save(); ctx.globalAlpha *= o;
    // 睡回去：run 方块压暗
    const sl = lit([[M.sleep, M.cont]], t);
    if (sl > 0) { const r = scr(BOX.run); ctx.fillStyle = E.rgba(C.gray, 0.45 * sl); ctx.fillRect(r.x, r.y, r.w, r.h); text('睡', r.x + r.w - 16, r.y + 40, F(800, 32, SERIF), C.ink2, 'right', sl); }
    const L = {
      timers: [[M.nine, M.wkr]], inbox: [[M.sch, M.wkr + 1.2], [M.evt + 1.0, M.cont + 1.0]], run: [[M.runT, M.sleep], [M.cont, M.g0]],
      memory: [[M.instr, M.cred], [M.rec7, M.sleep + 0.5]], perm: [[M.cred, M.send]], outbox: [[M.send + 0.3, M.rec7]], user: [[M.send + 0.9, M.rec7], [M.reply, M.evt + 1.0]]
    };
    for (const [k, iv] of Object.entries(L)) { const l = lit(iv, t); if (l > 0) { const r = scr(BOX[k]); E.strokeCW({ x: r.x - 6, y: r.y - 6, w: r.w + 12, h: r.h + 12 }, l, C.claret, 5); } }
    dotPath([[160, 205], [160, 288]], t, M.sch, 0.8);
    dotPath([[245, 335], [405, 335]], t, M.wkr, 0.8);
    dotPath([[435, 380], [435, 462]], t, M.instr, 0.7);
    dotPath([[633, 380], [633, 462]], t, M.cred, 0.7);
    dotPath([[665, 335], [828, 335], [992, 335], [1050, 335]], t, M.send, 1.2);
    dotPath([[435, 380], [435, 462]], t, M.rec7, 0.7);
    dotPath([[1085, 392], [1085, 612], [160, 612], [160, 382]], t, M.evt, 1.4);
    dotPath([[245, 335], [405, 335]], t, M.cont, 0.8);
    // 09:00 标签
    const p9 = lit([[M.nine, M.wkr + 0.6]], t);
    if (p9 > 0) { const r = scr(BOX.timers); K.card({ x: r.x + r.w + 14, y: r.y + 8, w: 120, h: 50 }, { fill: C.claret, r: 6, lift: 0.2, alpha: p9 }); text('09:00', r.x + r.w + 74, r.y + 44, F(800, 30, INTER), '#FFFFFF', 'center', p9); }
    // 你的回复（气泡）
    const pr2 = lit([[M.reply, M.evt + 1.2]], t);
    if (pr2 > 0) { const r = scr(BOX.user); K.card({ x: r.x - 190, y: r.y - 132, w: 280, h: 64 }, { fill: '#FFFFFF', stroke: C.claret, lw: 3, r: 12, lift: 0.4, alpha: pr2 }); text('第 2 条多讲点', r.x - 50, r.y - 89, F(700, 30, SANS), C.claret, 'center', pr2); }
    ctx.restore();
  } });
}
// 右栏：每日简报步骤（示意）
const STEPS = ['09:00 定时器到点', '写一个事件进收件箱', 'worker 起一次 run', '读 instructions.md', '读 reported.md', '代理加凭证', '发出简报', '记进 reported.md', '睡回去', '你回复「第 2 条多讲点」', '作为事件进收件箱', '续上会话，再跑一次'];
function steps(t) {
  if (t < M.nine - 0.5 || t > M.h0 + 0.9) return;
  const out = eIO(pr(t, M.h0, 0.7));
  ctx.save(); ctx.translate(-1900 * out, 0);
  const x = 1450;
  E.kicker(x, 214, '每日简报', C.black, pr(t, M.nine - 0.5, 0.5)); tagShi(1740, 212, pr(t, M.nine - 0.3, 0.4));
  const TS = [M.nine, M.sch, M.wkr, M.instr, M.rep, M.cred, M.send, M.rec7, M.sleep, M.reply, M.evt, M.cont];
  let cur = -1; TS.forEach((tt, i) => { if (t >= tt) cur = i; }); if (t >= M.g0) cur = -1;
  TS.forEach((tt, i) => {
    const p = pr(t, tt - 0.1, 0.5); if (p <= 0) return;
    const y = 270 + i * 52, on = i === cur;
    if (on) { ctx.fillStyle = C.wheat; ctx.fillRect(x - 10, y - 34, 384, 46); }
    text(String(i + 1), x + 12, y, F(700, 26, INTER), C.claret, 'center', clamp(p * 2));
    E.wipeText(STEPS[i], x + 36, y, F(on ? 700 : 500, 28, SANS), on ? C.black : C.ink, 28, p);
  });
  ctx.restore();
}

// ---------- 8：两条保留意见 ----------
function papers8(t) {
  if (t < M.h0 || t > M.n0 + 0.9) return;
  const S = RG.shots;
  const out = eIO(pr(t, M.n0, 0.7)), dx = -1100 * out;
  // 上：标题页 → 翻成 Timers 句
  const H0 = K.V(0.852, 528, 186, 96 + 1900 + dx, 180, 900, 316), H1 = K.V(0.852, 528, 186, 96 + dx, 180, 900, 316), H2 = K.V(2.0, 880, 112, 96 + dx, 180, 900, 316);
  const P1 = K.V(1.25, 360, 84, 96 + dx, 180, 900, 316);
  const fl = pr(t, M.p8, 0.8), back = fl >= 0.5;
  const v = back ? P1 : K.kview(t, [[M.h0, H0], [M.h0 + 0.7, H1], [M.bp - 0.4, H1], [M.bp + 0.4, H2]]);   // v2：总图完全退场后再进
  ctx.save();
  if (fl > 0 && fl < 1) { const s = Math.max(0.02, Math.abs(Math.cos(Math.PI * fl))); const mx = v.rect.x + v.rect.w / 2; ctx.translate(mx, 0); ctx.scale(s, 1); ctx.translate(-mx, 0); }
  K.view(back ? IMG.poll : IMG.head, 3, v, { bg: '#FAF9F5', lift: 0.5, over: map => {
    if (!back) { K.sweep(S.head.phrases.cat.slice(0, 1), map, eIO(pr(t, M.bp + 0.4, 0.7))); }
    else K.sweep(S.poll.phrases.poll, map, eIO(pr(t, M.scan, 0.8)));
  } });
  ctx.restore();
  // 下：成本句
  const pc = pr(t, M.cost - 0.4, 0.8);
  if (pc > 0) {
    const C0 = K.V(1.3, 360, 230, 96 + dx, 1100, 900, 330), C1 = K.V(1.3, 360, 230, 96 + dx, 530, 900, 330);
    const vc = K.kview(t, [[M.cost - 0.4, C0], [M.cost + 0.4, C1]]);
    K.view(IMG.cost, 3, vc, { bg: '#FAF9F5', lift: 0.5, over: map => K.sweep(S.cost.phrases.cost, map, eIO(pr(t, M.cost + 0.3, 1.4))) });
  }
}
function cards8(t) {
  if (t < M.h0 + 0.3 || t > M.n0 + 0.9) return;
  const out = eIO(pr(t, M.n0, 0.7)); ctx.save(); ctx.translate(-1900 * out, 0);
  const x = 1060, w = 764;
  const [sa, aa] = K.pop(t, M.bp - 0.35, 0.5);   // v2：卡片和标题字一起出
  K.withScale(x + w / 2, 370, sa, aa, () => {
    K.card({ x, y: 180, w, h: 380 }, { fill: C.sheet, stroke: C.rule, lw: 2, r: 10, lift: 0.3 });
    E.kicker(x + 34, 262, '保留意见 1', C.claret, 1);
    E.wipeText('一篇实践指南', x + 34, 320, F(800, 40, SERIF), C.black, 40, pr(t, M.bp, 0.6));
    E.wipeText('全文唯一一组数据：模型成本（Opus 5.5 对比 Opus 5）', x + 34, 372, F(700, 28, SANS), C.ink, 28, pr(t, M.cost, 0.6));
    const pn = eOC(pr(t, M.cost + 0.4, 0.9));
    if (pn > 0) {
      text('−' + Math.round(78 * pn) + '%', x + 34, 456, F(800, 64, INTER), C.claret, 'left', clamp(pn * 3));
      text('长程编码基准', x + 34, 498, F(500, 28, SANS), C.ink, 'left', clamp(pn * 3));
      text('−' + Math.round(40 * pn) + '%', x + 300, 456, F(800, 64, INTER), C.oxford, 'left', clamp(pn * 3));
      text('常规负载', x + 300, 498, F(500, 28, SANS), C.ink, 'left', clamp(pn * 3));
    }
    const pz = pr(t, M.noTest, 0.5);
    if (pz > 0) { K.cross(x + 50, 534, 22, pz, C.claret, 4); E.wipeText('没测这套架构本身的效果', x + 76, 543, F(700, 28, SANS), C.claret, 28, pz); }
  });
  const [sb, ab] = K.pop(t, M.p8 - 0.35, 0.5);
  K.withScale(x + w / 2, 735, sb, ab, () => {
    K.card({ x, y: 590, w, h: 290 }, { fill: C.sheet, stroke: C.rule, lw: 2, r: 10, lift: 0.3 });
    E.kicker(x + 34, 672, '保留意见 2', C.claret, 1);
    E.wipeText('参数要自己试', x + 34, 730, F(800, 40, SERIF), C.black, 40, pr(t, M.p8 - 0.2, 0.5));
    E.wipeText('scheduler 多久扫一次：原文没给', x + 34, 792, F(700, 28, SANS), C.ink, 28, pr(t, M.scan, 0.6));
    E.wipeText('发多少消息：靠评测', x + 34, 846, F(700, 28, SANS), C.ink, 28, pr(t, M.howMany, 0.6));
  });
  ctx.restore();
}

// ---------- 9：五条总结 + 讨论 + 署名（v2：五行纵向铺满 y150–718，讨论/署名卡 y740–880）----------
const SUM = ['事件先落表，同一时间只让一个 worker 处理', '到点了也只是往收件箱写一个事件', '只存查不回来的东西，每次加载的部分要小', '凭证放在 Agent 外面，要人批的地方先停下来', '发多少靠评测，一开始宁可少发'];
const ROW = i => ({ y: 150 + i * 116, h: 104 });
function end9(t) {
  if (t < M.n0 + 0.2) return;
  const HX = 96, HW = 400, BX = 516, BW = 1824 - 516;
  for (let i = 0; i < 5; i++) {
    const p = eOC(pr(t, M.n0 + 0.3 + i * 0.09, 0.6)); if (p <= 0) continue;
    const R = ROW(i), y = R.y + (1 - p) * 40, a = clamp(p * 1.5);
    const on = lit([[M.sum[i], i < 4 ? M.sum[i + 1] : M.q9]], t);
    ctx.save(); ctx.globalAlpha *= a;
    ctx.fillStyle = mix(C.wheat, C.claret, on); ctx.fillRect(HX, y, HW, R.h);
    text(M5.NUM[i], HX + 24, y + R.h / 2 + 11, F(700, 30, INTER), on > 0.5 ? '#FFFFFF' : C.claret);
    text(M5.NAMES[i], HX + 92, y + R.h / 2 + 16, F(800, 46, SERIF), on > 0.5 ? '#FFFFFF' : C.black);
    // 正文条：与表头一起进场（空条带细框），口播点到时字擦出
    ctx.fillStyle = C.sheet; ctx.fillRect(BX, y, BW, R.h); ctx.strokeStyle = on > 0.5 ? C.claret : C.rule; ctx.lineWidth = on > 0.5 ? 3 : 2; ctx.strokeRect(BX + 1, y + 1, BW - 2, R.h - 2);
    const pb = pr(t, M.sum[i], 0.6);
    if (pb > 0) E.wipeText(SUM[i], BX + 40, y + R.h / 2 + 15, F(700, 42, SANS), on > 0.5 ? C.black : C.ink, 42, pb);
    ctx.restore();
  }
  // 讨论问题
  const pq = pr(t, M.q9, 0.6);
  if (pq > 0) {
    const dy = (1 - eOQ(pq)) * 30;
    K.card({ x: 96, y: 740 + dy, w: 1090, h: 140 }, { fill: C.sheet, stroke: C.claret, lw: 3, r: 10, lift: 0.3, alpha: clamp(pq * 2) });
    E.wipeText('你在用的 Agent，有这五样里的哪几样？', 130, 798 + dy, F(800, 40, SERIF), C.black, 40, pr(t, M.q9 + 0.1, 0.7));
    E.wipeText('它会自己醒来找你吗？', 130, 856 + dy, F(800, 40, SERIF), C.black, 40, pr(t, M.q9b, 0.6));
    text('评论区聊聊', 1152, 856 + dy, F(800, 30, SANS), C.claret, 'right', pr(t, M.q9b + 0.4, 0.5));
  }
  // 署名
  const ps = pr(t, M.sign, 0.6);
  if (ps > 0) {
    const dy = (1 - eOQ(ps)) * 30;
    K.card({ x: 1210, y: 740 + dy, w: 614, h: 140 }, { fill: C.claret, r: 10, lift: 0.3, alpha: clamp(ps * 2) });
    const O = (window.Chrome.film && window.Chrome.film.outro) || {};   // 结尾署名是配置项，不写死作者
    E.maskLine(O.sign || '我是作者', 1246, 806 + dy, F(900, 48, SERIF), '#FFFFFF', 48, ps);
    E.wipeText(O.follow || '关注我，带你看懂 Agent', 1246, 856 + dy, F(700, 30, SANS), '#F7E6EC', 30, pr(t, M.follow, 0.6));
  }
}

window.Chapter = {
  sources: [],
  texts: '',
  async init(data) {
    T = data.T; const A = data.A, st = data.st, en = data.en;
    IMG = data.img; RG = data.json.reg;
    GIF = await Promise.all(Array.from({ length: 120 }, (_, i) => E.loadImg(`${data.root}/../source/g3-total/f${String(i).padStart(3, '0')}.png`)));
    M.fly = Math.max(0.9, A('s07-1', '连起来'));
    M.nine = Math.max(M.fly + 1.3, A('s07-2', '九点')); M.sch = Math.max(M.nine + 0.5, A('s07-2', 'scheduler')); M.wkr = Math.max(M.sch + 0.9, A('s07-2', 'worker')); M.runT = A('s07-2', '起一次 run');
    M.instr = A('s07-3', 'instructions'); M.rep = A('s07-3', 'reported');
    M.cred = A('s07-4', '代理'); M.send = A('s07-4', '发出去'); M.rec7 = A('s07-4', '记进'); M.sleep = A('s07-4', '睡回去');
    M.reply = A('s07-5', '你回了一句'); M.evt = A('s07-5', '作为事件'); M.cont = Math.max(M.evt + 1.4, A('s07-5', '续上'));
    M.g0 = st('s07-6');
    M.h0 = st('s08-1') - 0.3; M.bp = Math.max(M.h0 + 1.15, A('s08-1', '实践指南')); M.cost = Math.max(M.bp + 1.4, A('s08-1', '唯一的数字')); M.noTest = A('s08-1', '没有测');
    M.p8 = st('s08-2') - 0.2; M.scan = Math.max(M.p8 + 0.8, A('s08-2', '多久扫')); M.howMany = A('s08-2', '发多少');
    M.n0 = st('s09-1') - 0.5; M.sum = [1, 2, 3, 4, 5].map(i => st('s09-' + i));
    M.q9 = st('s09-6'); M.q9b = A('s09-6', '它会自己'); M.sign = st('s09-7'); M.fans = A('s09-7', '评论区'); M.follow = A('s09-7', '关注我');
    window.__M = M;
    const cue = data.cue;
    cue(M.fly, 'whoosh', 0.7); cue(M.fly + 0.4, 'paper', 0.6);
    [M.nine, M.sch, M.wkr, M.instr, M.rep, M.cred, M.send, M.rec7, M.sleep, M.reply, M.evt, M.cont].forEach(x => cue(x, 'pop', 0.4));
    cue(M.h0, 'whoosh', 0.7); cue(M.bp + 0.4, 'marker', 0.6); cue(M.cost + 0.3, 'marker', 0.6); cue(M.cost + 0.4, 'tick', 0.5); cue(M.p8, 'paper', 0.7); cue(M.scan, 'marker', 0.5);
    cue(M.n0, 'whoosh', 0.7); M.sum.forEach(x => cue(x, 'pop', 0.5)); cue(M.q9, 'pop', 0.6); cue(M.sign, 'pop', 0.6);
    this.sources = [
      [M.fly + 0.6, 'Anthropic《Building always-on agents》（2026-11-13）· How everything fits together 原图'],
      [M.nine, '同上原图；每日简报流程为示意，按原文规则推演'],
      [M.h0 + 0.6, '同上：文章分类 Best practices；成本数据为原文 Opus 5.5 对比 Opus 5；Timers 一节未给扫表间隔'],
      [M.n0 + 0.6, '五条为本片归纳，均出自前文']
    ];
    this.texts = '每日简报示意定时器到点写一个事件进收件箱起次读代理加凭证发出记睡回去你回复第条多讲作为续上会话再跑保留意见一篇实践指南全文唯组数据模型成本长程编码基准常规负载对比没测这套架构本身的效果参数要自己试多久扫原文给少消息靠评测先落表只交到往存查不来每加载小放在外面人批停开始论区聊用有五样里哪几它会醒找吗我是作者关注带你看懂评论区聊同一时间让处理了也的东西部分面地方来宁可收件箱记忆权限发件箱';
  },
  renderContent(c, t) {
    ctx = c; t = clamp(t, 0, T);
    totalPaper(t);
    steps(t);
    papers8(t);
    cards8(t);
    end9(t);
    intro7(t);
  }
};
})();
