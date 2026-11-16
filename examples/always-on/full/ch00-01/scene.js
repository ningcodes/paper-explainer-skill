// ch00-01 · 开头 + 一次 run（段 00、01）。g1。
// 镜头：原文时间轴动图（第 0 帧）+ 标题页实体纸 → 推近 Asleep/Run → 缩到上方，五格母图逐个落下 →
// 五格围成一圈、中间长出 Agent 循环 → 循环飞回原图第 3 步，原图放大讲 Run 四步 → 原图缩成小地图，横带长成重画时间轴（会话跨 run）
// → 睡着不花 token、外面小服务一直开着 → 成本原文 + 数字卡 → 数字卡变每日简报示意卡。
(function () {
'use strict';
const E = window.ED, K = window.Kit;
const { C, SERIF, SANS, INTER, F, clamp, lerp, eOQ, eOC, eIC, eIO, pr, mix, tw, text } = E;
let ctx = null, M = {}, IMG = {}, REG = null, GF = [];

// ===== 五格母图（规格见 examples/always-on/MOTHER.md，与其中代码一致）=====
const M5 = (() => {
  const NAMES = ['事件收件箱', '定时器', '记忆', '权限', '发件箱'];
  const EN = ['Event inbox', 'Timers', 'Memory', 'Permissions', 'Outbox'];
  const NUM = ['02', '03', '04', '05', '06'];
  const BIG = { x: 96, y: 420, w: 1728, h: 260, gap: 24 };
  const CHIP = { x: 96, y: 92, w: 360, h: 68 };
  const big = i => { const w = (BIG.w - BIG.gap * 4) / 5; return { x: BIG.x + i * (w + BIG.gap), y: BIG.y, w, h: BIG.h }; };
  const LR = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });
  function cell(i, r, lit = 0, alpha = 1, s = 1, enA = 1) {
    if (alpha <= 0) return; const c = E.ctx; c.save(); c.globalAlpha *= alpha;
    c.fillStyle = mix(C.wheat, C.claret, lit); c.fillRect(r.x, r.y, r.w, r.h);
    const on = lit > 0.5, cx = r.x + r.w / 2;
    text(NUM[i], r.x + 22 * s, r.y + 46 * s, F(700, 30 * s, INTER), on ? '#FFFFFF' : C.claret);
    text(NAMES[i], cx, r.y + r.h / 2 + 22 * s, F(800, 52 * s, SERIF), on ? '#FFFFFF' : C.black, 'center');
    if (enA > 0) text(EN[i], cx, r.y + r.h - 30 * s, F(500, 26 * s, SANS), on ? '#F7E6EC' : C.ink2, 'center', enA);
    c.restore();
  }
  return { NAMES, EN, NUM, BIG, CHIP, big, cell, LR };
})();

// ===== 原文时间轴动图（5dc803，1200×675，10fps 抽帧）=====
// 源坐标（px）：横带 y152–220；Run 面板 30–1170 × 282–466；四步框 y334–454，x 42/324/605/887，宽 271；Stored state y530–594
const STEP_X = [42, 324, 605, 887], STEP_W = 271;
const G0 = K.V(0.937, 600, 335, 700, 150, 1124, 560);
const G1 = K.V(1.4, 600, 280, 160, 130, 1600, 600);
const G2 = K.V(0.83, 600, 320, 460, 96, 1000, 300);
const G3 = K.V(0.3, 600, 335, 96, 96, 360, 165);
const G4 = K.V(1.25, 600, 312, 210, 130, 1500, 680);
const G5 = K.V(0.3, 600, 335, -420, 96, 360, 165);
const mapV = (v, sx, sy) => ({ x: v.rect.x + v.rect.w / 2 + (sx - v.cx) * v.k, y: v.rect.y + v.rect.h / 2 + (sy - v.cy) * v.k });
function gframe(t) {
  if (t >= M.b2 - 0.5 && t < M.b3 - 0.2) return GF[5];            // 橙色那格正在醒（webhook arrives）
  if (t >= M.b3 - 0.2 && t < M.b4 + 0.4) return GF[25];           // 静止帧：四步都未点亮，我们自己圈
  return GF[Math.floor(Math.max(0, t) * 10) % GF.length];
}
function drawGif(t) {
  if (t > M.cost + 0.7) return;
  const v = K.kview(t, [[0, G0], [M.zzz - 0.2, G0], [M.zzz + 0.7, G1], [M.cell[0] - 0.8, G1], [M.cell[0] - 0.1, G2], [M.b1, G2], [M.b1 + 0.8, G3],
    [M.b2 - 0.5, G3], [M.b2 + 0.4, G4], [M.b4, G4], [M.b4 + 0.8, G3], [M.cost, G3], [M.cost + 0.6, G5]]);
  K.view(gframe(t), 1, v, { bg: '#FFFFFF', lift: 0.5, over: map => {
    if (t < M.b2 - 0.5 || t > M.b4 + 0.2) return;
    const R = (x, y, w, h) => ({ x: map.x(x), y: map.y(y), w: w * map.k, h: h * map.k });
    // s01-2：灰色睡着 / 橙色小格 / Run awake briefly（酒红批注）
    if (t < M.b3 - 0.2) {
      E.strokeCW(R(236, 150, 340, 72), eOC(pr(t, M.gray, 0.5)), C.claret, 4);
      text('睡着', map.x(406), map.y(128), F(800, 40, SERIF), C.claret, 'center', pr(t, M.gray, 0.3));
      E.strokeCW(R(572, 146, 68, 80), eOC(pr(t, M.mid, 0.5)), C.claret, 5);
      text('醒着干活', map.x(800), map.y(128), F(800, 40, SERIF), C.claret, 'center', pr(t, M.mid, 0.3));
      E.strokeCW(R(46, 292, 200, 40), eOC(pr(t, M.run, 0.5)), C.claret, 4);
      // v3：run 第一次出现，给大白话注释
      const pa = pr(t, M.run, 0.4);
      if (pa > 0) { const f = F(800, 38, SERIF), str = 'run = 醒着干活的一段', w = tw(str, f) + 44, x0 = map.x(262), y0 = map.y(288) - 4;
        K.card({ x: x0, y: y0, w, h: 62 }, { fill: '#FFF7F0', stroke: C.claret, lw: 3, r: 8, lift: 0.25, alpha: clamp(pa * 2) });
        text(str, x0 + 22, y0 + 44, f, C.claret, 'left', clamp(pa * 2)); }
    } else {
      // s01-3：四步依次圈
      for (let i = 0; i < 4; i++) {
        const a = M.step[i], b = i < 3 ? M.step[i + 1] : M.b4;
        const on = eOC(pr(t, a, 0.45)) * (1 - pr(t, b, 0.25));
        E.strokeCW(R(STEP_X[i] - 4, 330, STEP_W + 8, 128), on, C.claret, 5);
      }
    }
  } });
  return v;
}

// ===== 标题页实体纸（截图 g1-title@3x，CSS 736×752）=====
const TITLE_RECTS = [{ x: 46, y: 150, w: 412, h: 54 }, { x: 46, y: 212, w: 240, h: 54 }];
function drawTitle(t) {
  const out = eIC(pr(t, M.zzz - 0.3, 0.7)); if (out >= 1) return;
  const dx = -720 * out;
  const v = K.V(0.79, 368, 360, 96 + dx, 150, 580, 420);
  K.view(IMG.title, 3, v, { bg: '#FAF9F5', lift: 0.5, rot: -1.2, over: map => K.sweep(TITLE_RECTS, map, eIO(pr(t, M.title, 1.0))) });
  E.kicker(96 + dx, 680, 'Anthropic · 2026-11-13', C.ink, pr(t, 0.2, 0.6));
  text('William Hu · Best practices', 96 + dx, 726, F(500, 28, SANS), C.ink, 'left', pr(t, 0.4, 0.5));
  text('claude.com/resources', 96 + dx, 766, F(400, 26, SANS), C.ink2, 'left', pr(t, 0.5, 0.5));
}

// ===== 小标签 =====
function tag(x, y, str, t0, tOut, o = {}) {
  const pIn = pr(T_, t0, 0.4), pOut = pr(T_, tOut, 0.3); if (pIn <= 0 || pOut >= 1) return;
  const f = F(700, o.fs || 32, SANS), w = tw(str, f) + 48, h = (o.fs || 32) + 34;
  const dy = (1 - eOQ(pIn)) * 24 + eIC(pOut) * 30, al = clamp(pIn * 3) * (1 - pOut);
  const xx = o.align === 'center' ? x - w / 2 : x;
  K.card({ x: xx, y: y + dy, w, h }, { fill: o.fill || C.sheet, stroke: o.stroke || C.rule, lw: 2, r: 8, lift: 0.25, alpha: al });
  text(str, xx + 24, y + dy + h / 2 + (o.fs || 32) * 0.36, f, o.col || C.ink, 'left', al);
}
let T_ = 0;

// ===== Agent 循环（s01-1）=====
const LOOP = { x: 960, y: 470, r: 150 };
const NODES = [['模型', -90], ['调工具', 30], ['看结果', 150]];
function drawLoop(t) {
  if (t < M.b1 || t > M.b2 + 0.45) return;
  const pIn = eOC(pr(t, M.b1, 0.8)), pOut = eIO(pr(t, M.b2 - 0.5, 0.9));
  const box3 = mapV(G2, 740, 394), dst = mapV(G4, 740, 394);
  const cx = lerp(lerp(box3.x, LOOP.x, pIn), dst.x, pOut), cy = lerp(lerp(box3.y, LOOP.y, pIn), dst.y, pOut);
  const s = lerp(lerp(0.25, 1, pIn), 0.3, pOut), al = clamp(pIn * 2) * (1 - pOut);
  if (al <= 0) return;
  ctx.save(); ctx.globalAlpha *= al; ctx.translate(cx, cy); ctx.scale(s, s);
  const R = LOOP.r;
  ctx.strokeStyle = C.rule; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
  // 弧形箭头（顺时针三段）
  const nt = [M.loopA, M.loopB, M.loopC];
  for (let i = 0; i < 3; i++) {
    const a0 = (NODES[i][1] + 26) * Math.PI / 180, a1 = (NODES[(i + 1) % 3][1] - 26 + (i === 2 ? 360 : 0)) * Math.PI / 180;
    const p = eOC(pr(t, nt[(i + 1) % 3] - 0.1, 0.5)); if (p <= 0) continue;
    const ae = lerp(a0, a1, p);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, R, a0, ae); ctx.stroke();
    if (p > 0.8) E.arrowHead(R * Math.cos(ae), R * Math.sin(ae), ae + Math.PI / 2, C.ink, 12, 4);
  }
  // 运行中的小红点
  const pd = pr(t, M.loopAgain, 0.3);
  if (pd > 0) { const ang = -Math.PI / 2 + (t - M.loopAgain) * 2.6; ctx.fillStyle = C.claret; ctx.globalAlpha *= pd; ctx.beginPath(); ctx.arc(R * Math.cos(ang), R * Math.sin(ang), 11, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha /= pd; }
  NODES.forEach(([lb, deg], i) => {
    const p = pr(t, nt[i], 0.4); if (p <= 0) return;
    const a = deg * Math.PI / 180, x = R * Math.cos(a), y = R * Math.sin(a);
    const [sc, aa] = K.pop(t, nt[i], 0.4);
    K.withScale(x, y, sc, aa, () => { K.card({ x: x - 80, y: y - 32, w: 160, h: 64 }, { fill: C.wheat, r: 8, lift: 0.2 }); text(lb, x, y + 12, F(700, 32, SANS), C.black, 'center'); });
  });
  text('Agent 循环', 0, -6, F(800, 34, SERIF), C.black, 'center', pr(t, M.b1 + 0.3, 0.5));
  text('直到做完', 0, 34, F(500, 28, SANS), C.ink, 'center', pr(t, M.loopDone, 0.4));
  ctx.restore();
}

// ===== 五格：s00-4 落下 → s01-1 围成一圈 =====
const RING = [{ x: 330, y: 290, w: 300, h: 130 }, { x: 330, y: 500, w: 300, h: 130 }, { x: 1290, y: 290, w: 300, h: 130 }, { x: 1290, y: 500, w: 300, h: 130 }, { x: 810, y: 700, w: 300, h: 130 }];
function drawCells(t) {
  if (t < M.cell[0] - 0.2 || t > M.b2) return;
  const pR = eIO(pr(t, M.b1, 0.9)), pO = pr(t, M.b2 - 0.6, 0.45);
  for (let i = 0; i < 5; i++) {
    const pe = eOC(pr(t, M.cell[i] - 0.1, 0.45)); if (pe <= 0) continue;
    let r = M5.big(i); r = { x: r.x, y: r.y + (1 - pe) * 40, w: r.w, h: r.h };
    r = M5.LR(r, RING[i], pR); r = { x: r.x, y: r.y + eIC(pO) * 60, w: r.w, h: r.h };
    // s01-1：三个问题依次点亮对应格
    let lit = 0;
    const win = (a, b) => eOC(pr(t, a, 0.3)) * (1 - eOC(pr(t, b, 0.3)));
    if (i === 0 || i === 1) lit = win(M.qWake, M.qCarry);
    if (i === 2) lit = win(M.qCarry, M.qOut);
    if (i === 4) lit = win(M.qOut, M.b2 - 0.7);
    if (t < M.b1) lit = eOC(pr(t, M.cell[i], 0.3)) * (1 - eOC(pr(t, M.cell[i] + 0.9, 0.4)));   // 点名时短暂变红
    M5.cell(i, r, lit, clamp(pe * 1.5) * (1 - pO), lerp(1, 0.62, pR), 1 - clamp(pR * 2));
  }
  // 「外面那圈架构」：围绕循环的一圈细虚线
  const pc = pr(t, M.diff, 0.6);
  if (pc > 0 && t > M.b1) { ctx.save(); ctx.globalAlpha *= (1 - pO); ctx.strokeStyle = C.claret; ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
    ctx.beginPath(); ctx.ellipse(LOOP.x, 530, 480 * eOC(pc), 260 * eOC(pc), 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    text('外面一圈：叫醒它 · 记住什么 · 告诉你', LOOP.x, 150, F(800, 34, SERIF), C.claret, 'center', pc * (1 - pO)); }
}

// ===== s01-3 四步中文标签（原图下方）=====
const STEP_ZH = ['收到一件事', '打开记录（会话）', '干活', '存下要记的'];
function drawStepLabels(t) {
  if (t < M.step[0] - 0.2 || t > M.b4 + 0.4) return;
  const out = pr(t, M.b4, 0.3);
  for (let i = 0; i < 4; i++) {
    const p = pr(t, M.step[i], 0.4); if (p <= 0) continue;
    const c = mapV(G4, STEP_X[i] + STEP_W / 2, 0).x;
    const cur = t < (i < 3 ? M.step[i + 1] : M.b4);
    text((i + 1) + ' ' + STEP_ZH[i], c, 868 - (1 - eOQ(p)) * 16, F(800, 38, cur ? SERIF : SANS), cur ? C.claret : C.ink, 'center', clamp(p * 2) * (1 - out));
  }
}

// ===== 重画时间轴（s01-4、s01-5）=====
const RUNF = [0.27, 0.53, 0.78];
function drawRT(t) {
  if (t < M.b4 || t > M.cost + 0.8) return;
  const pm = eIO(pr(t, M.b4, 0.8)), dy = -170, ex = -2100 * eIC(pr(t, M.cost, 0.75));
  const from = { x: mapV(G4, 36, 0).x, y: mapV(G4, 0, 152).y, w: 1128 * 1.25, h: 68 * 1.25 };
  const B = M5.LR(from, { x: 96, y: 520 + dy, w: 1728, h: 90 }, pm);
  ctx.save(); ctx.translate(ex, 0);
  ctx.fillStyle = '#E4DDD4'; ctx.fillRect(B.x, B.y, B.w, B.h);
  const rx = RUNF.map(f => B.x + B.w * f), rw = 92 * (B.h / 90);
  rx.forEach(x => { ctx.fillStyle = C.claret; ctx.fillRect(x - rw / 2, B.y, rw, B.h); });
  const la = pr(t, M.b4 + 0.6, 0.4);
  if (la > 0) {
    rx.forEach(x => { text('run', x, B.y + B.h / 2 + 10, F(700, 28, INTER), '#FFFFFF', 'center', la);
      K.arrow(x, B.y - 70, x, B.y - 8, pr(t, M.b4 + 0.7, 0.4), C.ink, 3); text('事件', x, B.y - 82, F(600, 28, SANS), C.ink, 'center', la); });
    const segs = [[B.x, rx[0] - rw / 2], [rx[0] + rw / 2, rx[1] - rw / 2], [rx[1] + rw / 2, rx[2] - rw / 2], [rx[2] + rw / 2, B.x + B.w]];
    const pz = pr(t, M.noRun, 0.4);
    segs.forEach(([a, b]) => {
      const c = (a + b) / 2;
      if (pz < 1) text('睡着', c, B.y + B.h / 2 + 11, F(600, 30, SANS), C.ink2, 'center', la * (1 - pz));
      if (pz > 0) text('睡着 · 不花 token', c, B.y + B.h / 2 + 11, F(700, 30, SANS), C.ink, 'center', pz);
    });
  }
  // s01-5：外面的小服务
  const ps = pr(t, M.svc, 0.6);
  if (ps > 0) {
    const ly = 580;
    E.growLine(96, ly, 1824, ps, C.teal, 4);
    text('外面只留几个很轻的程序 · 一直开着，不调用模型', 96, ly - 18, F(800, 34, SERIF), C.teal, 'left', clamp(ps * 2));
    [['接事件', 520, M.ev, 'mail'], ['看时间', 1140, M.time, 'clock']].forEach(([lb, x, t0, ic]) => {
      const [s, a] = K.pop(t, t0, 0.4);
      K.withScale(x + 130, ly + 64, s, a, () => {
        K.card({ x, y: ly + 24, w: 260, h: 84 }, { fill: C.sheet, stroke: C.teal, lw: 3, r: 8, lift: 0.25 });
        const ix = x + 52, iy = ly + 66; ctx.save(); ctx.strokeStyle = C.teal; ctx.lineWidth = 3; ctx.lineJoin = 'round';
        if (ic === 'mail') { ctx.strokeRect(ix - 24, iy - 17, 48, 34); ctx.beginPath(); ctx.moveTo(ix - 24, iy - 17); ctx.lineTo(ix, iy + 3); ctx.lineTo(ix + 24, iy - 17); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(ix, iy, 21, 0, Math.PI * 2); ctx.moveTo(ix, iy - 12); ctx.lineTo(ix, iy); ctx.lineTo(ix + 10, iy + 6); ctx.stroke(); }
        ctx.restore();
        text(lb, x + 160, iy + 12, F(700, 34, SANS), C.teal, 'center'); });
    });
  }
  ctx.restore();
}

// ===== 原文段落纸（cycle：会话定义；intro：成本）=====
function dedupe(rs) { const u = []; (rs || []).forEach(q => { if (!u.some(v => Math.abs(v.x - q.x) < 1 && Math.abs(v.y - q.y) < 1)) u.push(q); }); return u; }
function drawCycle(t) {
  if (t < M.cyc || t > M.b5 + 0.8) return;
  const S = REG.shots.cycle.phrases;
  const pin = eOC(pr(t, M.cyc, 0.7)), pout = eIC(pr(t, M.b5, 0.7));
  const y = lerp(-320, 96, pin) - 440 * pout;
  const v = K.V(1.75, 360, 148, 500, y, 1324, 280);
  K.view(IMG.cycle, 3, v, { bg: '#FAF9F5', lift: 0.5, over: map => K.sweep(dedupe(S.session), map, eIO(pr(t, M.cyc + 0.7, 1.4))) });
}
function drawIntroPaper(t) {
  if (t < M.cost || t > M.cut + 0.9) return;
  const S = REG.shots.intro.phrases;
  const pin = eOC(pr(t, M.cost + 0.1, 0.8)), pout = eIC(pr(t, M.cut, 0.8));
  const x = lerp(1960, 96, pin) - 1200 * pout;
  const v = K.V(1.6, 360, 420, x, 140, 1100, 700);
  K.view(IMG.intro, 3, v, { bg: '#FAF9F5', lift: 0.5, rot: -0.6, over: map => {
    K.sweep(dedupe(S.judg), map, eIO(pr(t, M.judg, 0.9)));
    K.sweep(dedupe(S.cost), map, eIO(pr(t, M.long - 0.2, 1.0)));
    K.sweep(dedupe(S.cost40), map, eIO(pr(t, M.long + 0.8, 0.8)));
  } });
}

// ===== 成本卡 → 每日简报卡 =====
const COST = { x: 1230, y: 150, w: 594, h: 690 }, BRIEF = { x: 140, y: 150, w: 820, h: 600 };
function drawCost(t) {
  if (t < M.cost + 0.6) return;
  const [s, a] = K.pop(t, M.cost + 0.6, 0.5);
  // v2：终值停到 M.cut（≥3 s）再变形；旧字 0.2 s 退，新字随卡片一起进，无空卡帧
  const pm = eIO(pr(t, M.cut, 0.8)), fadeOld = 1 - pr(t, M.cut, 0.2);
  const r = M5.LR(COST, BRIEF, pm);
  K.withScale(r.x + r.w / 2, r.y + r.h / 2, t < M.cut ? s : 1, a, () => {
    K.card(r, { fill: C.sheet, stroke: C.rule, lw: 2, r: 10, lift: 0.4 });
    if (fadeOld > 0) {
      ctx.save(); ctx.globalAlpha *= fadeOld; const x = r.x + 44;
      E.kicker(x, r.y + 80, 'Anthropic 自述', C.ink, pr(t, M.cost + 0.7, 0.5));
      text('1  更会判断什么时候该来问', x, r.y + 150, F(700, 30, SANS), C.ink, 'left', pr(t, M.judg, 0.4));
      text('2  更便宜：Opus 5.5 对比 Opus 5', x, r.y + 205, F(700, 30, SANS), C.ink, 'left', pr(t, M.cheap, 0.4));
      const n1 = 78 * eOC(pr(t, M.long, 0.5)), n2 = 40 * eOC(pr(t, M.long, 0.5));
      text('−' + Math.round(n1) + '%', x, r.y + 340, F(800, 120, INTER), C.claret, 'left', pr(t, M.long, 0.3));
      text('每个解决的任务的成本', x, r.y + 392, F(700, 30, SANS), C.ink, 'left', pr(t, M.long + 0.2, 0.4));
      text('某个长任务编程基准（文中未写名）', x, r.y + 432, F(400, 26, SANS), C.ink2, 'left', pr(t, M.long + 0.2, 0.4));
      text('−' + Math.round(n2) + '%', x, r.y + 560, F(800, 100, INTER), C.oxford, 'left', pr(t, M.long, 0.3));
      text('典型工作负载', x, r.y + 612, F(700, 30, SANS), C.ink, 'left', pr(t, M.long + 0.2, 0.4));
      ctx.restore();
    }
  });
  // 简报卡内容
  const pb = pr(t, M.cut + 0.12, 0.35); if (pb <= 0) return;
  const x = r.x + 56;
  E.kicker(x, r.y + 96, '贯穿例子', C.ink, pb);
  // 「示意」章
  ctx.save(); ctx.globalAlpha *= clamp(pb * 2); ctx.strokeStyle = C.claret; ctx.lineWidth = 3; ctx.strokeRect(r.x + r.w - 150, r.y + 44, 104, 52); ctx.restore();
  text('示意', r.x + r.w - 98, r.y + 81, F(800, 28, SANS), C.claret, 'center', clamp(pb * 2));
  E.maskLine('每日简报', x, r.y + 200, F(900, 76, SERIF), C.black, 76, eOQ(pr(t, M.cut + 0.15, 0.5)));
  text('每天早上，Agent 主动发给你', x, r.y + 262, F(500, 32, SANS), C.ink, 'left', pr(t, M.cut + 0.25, 0.45));
  E.growLine(x, r.y + 300, r.x + r.w - 56, pr(t, M.cut + 0.25, 0.5), C.rule, 2);
  const items = ['今天的 Agent 新闻', '你关注的论文有更新', '一个值得试的新工具'];
  items.forEach((s2, i) => {
    const p = pr(t, M.cut + 0.3 + 0.1 * i, 0.4); if (p <= 0) return;
    const yy = r.y + 380 + i * 92;
    text(String(i + 1), x, yy, F(800, 40, INTER), C.claret, 'left', p);
    E.wipeText(s2, x + 56, yy, F(600, 36, SANS), C.ink, 36, p);
    E.growLine(x, yy + 34, r.x + r.w - 56, p, C.rule, 1);
  });
}
function drawBriefRight(t) {
  const p = pr(t, M.cut + 0.35, 0.5); if (p <= 0) return;
  const x = 1060;
  E.kicker(x, 236, '原文 · Timers 一节', C.ink, p);
  const q = pr(t, M.cut + 0.45, 0.6);
  K.para('“a schedule … such as a daily newsletter”', x, 320, F(500, 44, SERIF), 62, C.black, 760, q);
  text('原文只拿它举 schedule 的例子', x, 470, F(500, 32, SANS), C.ink, 'left', pr(t, M.cut + 0.6, 0.5));
  const po = pr(t, M.ours, 0.5);
  const f = F(800, 40, SERIF);
  E.wipeText('后面的流程：按原文规则推演', x, 600, f, C.claret, 40, po);
  E.underlineSweep('后面的流程：按原文规则推演', x, 600, f, pr(t, M.ours + 0.4, 0.6));
}

window.Chapter = {
  sources: [],
  texts: '外面一圈叫醒它记住什么告诉你收到一件事打开记录（会话）干活存下要记的醒着干活的一段只留几个很轻的程序不调用模型画成小图标本片解读原图示意睡着醒着的一段一次来了一个事件开会话跑循环写回存储外面那圈架构直到做完模型调工具看结果收件箱定时器记忆权限发件箱同会话隔几接用不花小服务一直开着看时间示意原图只标是本片解读自述对比每解决任务成本某长编程基准文中未写名典型工作负载贯穿例子每日简报天早上主动发给你今新闻关注论有更值得试具节拿它举后流规则推演',
  async init(data) {
    const A = data.A, st = data.st;
    IMG = data.img; REG = data.json.reg;
    for (let i = 0; i < 103; i++) GF.push(IMG['g' + i]);
    M = {
      title: A('s00-1', '《Building'), s2: st('s00-2'), watch: A('s00-2', '盯着事情'), clock: A('s00-2', '到点'), done: A('s00-2', '做完了'),
      s3: st('s00-3'), zzz: A('s00-3', '大部分时间'), wake: A('s00-3', '有事件来了'),
      s4: st('s00-4'), cell: ['事件收件箱', '定时器', '记忆', '权限', '发件箱'].map(w => A('s00-4', w)),
      b1: st('s01-1'), loopA: A('s01-1', '模型调工具'), loopB: A('s01-1', '调工具、看结果') + 0.15, loopC: A('s01-1', '看结果'), loopAgain: A('s01-1', '再调工具'), loopDone: A('s01-1', '直到做完'),
      diff: A('s01-1', '多出来的是'), qWake: A('s01-1', '什么时候叫醒'), qCarry: A('s01-1', '两次之间'), qOut: A('s01-1', '做完怎么告诉你'),
      b2: st('s01-2'), gray: A('s01-2', '灰色'), mid: A('s01-2', '中间那一小格'), run: A('s01-2', '一次 run'),
      b3: st('s01-3'), step: ['收到一件事', '打开这件事', '干活', '最后把'].map(w => A('s01-3', w)),
      b4: st('s01-4'), noRun: A('s01-4', '不调用模型'), svc: A('s01-4', '外面只留'), ev: A('s01-4', '接事件'), time: A('s01-4', '看时间'),
      cost: st('s01-5'), judg: A('s01-5', '更会判断'), cheap: A('s01-5', '更便宜'), long: A('s01-5', '长任务'),
      b7: st('s01-6'), brief: A('s01-6', '每天早上'), ours: A('s01-6', '后面的流程')
    };
    M.cut = Math.max(M.long + 0.5 + 3.0, A('s01-6', '一个 Agent') + 0.25);   // v2：成本终值停 ≥3 s 再变形
    this.sources = [
      [0, '原文：Anthropic《Building always-on agents》· William Hu · claude.com/resources · 2026-11-13'],
      [M.b1, '原文：they run on the same core loop as other agents. The difference is the surrounding architecture'],
      [M.b2, '原图：The cycle behind the always-on agent（文中动图）'],
      [M.b3, '原文：A run works inside a session, which is the transcript of messages and tool calls'],
      [M.b4, '原图：Asleep · no tokens spent；外面的程序为本片示意'],
      [M.cost, '原文：Opus 5.5 cost 78% less per solved task than Opus 5 · Anthropic 自述，基准未写名'],
      [M.cut, '例子：原文 a schedule … such as a daily newsletter；流程为示意']
    ];
    const cue = data.cue;
    cue(M.title, 'marker'); [M.watch, M.clock, M.done].forEach(x => cue(x, 'pop'));
    cue(M.zzz - 0.2, 'whoosh'); cue(M.zzz, 'pop'); cue(M.wake, 'pop'); cue(M.s4 - 0.1, 'whoosh'); M.cell.forEach(x => cue(x - 0.1, 'pop'));
    cue(M.b1, 'whoosh'); [M.loopA, M.loopB, M.loopC].forEach(x => cue(x, 'pop'));
    cue(M.b2 - 0.5, 'whoosh'); cue(M.b2 - 0.5, 'paper'); [M.gray, M.mid, M.run].forEach(x => cue(x, 'marker')); M.step.forEach(x => cue(x, 'pop'));
    cue(M.run + 0.05, 'pop');
    cue(M.b4, 'whoosh'); cue(M.noRun, 'pop'); cue(M.ev, 'pop'); cue(M.time, 'pop');
    cue(M.cost, 'whoosh'); cue(M.cost + 0.1, 'paper'); cue(M.judg, 'marker'); cue(M.cheap - 0.2, 'pop'); cue(M.long - 0.2, 'marker'); cue(M.long, 'tick');
    cue(M.cut, 'whoosh'); cue(M.cut + 0.3, 'pop'); cue(M.ours, 'marker');
  },
  renderContent(c, t, data) {
    ctx = c; T_ = t;
    drawTitle(t);
    drawGif(t);
    // s00-2 三个小标签（G0 下方）
    tag(700, 740, '自己盯着事情', M.watch, M.zzz - 0.3);
    tag(1080, 740, '到点给你发消息', M.clock, M.zzz - 0.3);
    tag(1500, 740, '做完来找你', M.done, M.zzz - 0.3);
    // s00-3 Asleep / Run 标签（G1 下方）
    tag(160, 770, 'Asleep：睡着，一个 token 都不花', M.zzz + 0.3, M.s4 - 0.1, { fill: '#E4DDD4', stroke: '#E4DDD4' });
    tag(1020, 770, 'Run：醒一下，跑一小段，存好状态', M.wake, M.s4 - 0.1, { fill: C.sheet, stroke: C.claret, col: C.claret });
    drawCells(t);
    drawLoop(t);
    drawStepLabels(t);
    drawRT(t);
    drawIntroPaper(t);
    drawCost(t);
    drawBriefRight(t);
  }
};
})();
