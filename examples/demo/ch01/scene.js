// demo · ch01（段 00 导读 + 01 思路，约 23 秒，占位时间轴，无配音）。
// 镜头规划：
//   0.0  章首翻报纸（上一页 = renderPrev 画的报头封面）→ 落地帧：左大标题 + 右侧论文第 1 页实体纸（-1.5°）
//   00   「摘要」：标题上推退场，实体纸转正、镜头推近 ≈4 倍到摘要 → 黄色荧光笔跟口播扫原句 → 酒红圈注「interleaved manner」；原文清晰停留 ≥3 秒
//   01   实体纸缩到右上角当小地图（摘要那块仍亮着）；大画布第一站「想一步」从圈注处长出 → 镜头平移（whoosh）到第二站「做一步 → 看结果」→ 回环箭头「接着想下一步」
// 只画内容层；进度条、字幕、来源行、翻页由 engine/common/chrome.js 统一画。切点全部来自锚词 data.A()。
(function () {
'use strict';
const E = window.ED, K = window.Kit;
const { C, SERIF, SANS, INTER, F, clamp, lerp, eOQ, eOC, eIO, pr, mix, text } = E;
const DPR = 300 / 72;                 // 页面图 300dpi，词框单位 pt → 每 pt 4.17 像素；推近不超过它
let M = {}, PAGE = null, WORDS = null, HL = [], RING = [];

// 视窗：k = 屏幕像素 / pt；cx, cy = 视窗中心（pt）；rect = 屏幕矩形
const VIEW_SIDE = K.V(1.02, 306, 396, 1150, 112, 624, 808);          // 落地：整页放在右侧
const VIEW_DIVE = K.V(4.05, 300, 322, 96, 150, 1728, 700);           // 推近：摘要那几行占满宽度（4.05 ≤ 4.17）
const VIEW_MINI = K.V(0.42, 306, 396, 1560, 92, 257, 333);           // 小地图：右上角

// 大画布：三块排在一条横线上（世界坐标），镜头 = 平移量 camX；下一站的骨架提前铺好，平移途中就能看到目的地
const ST1 = { x: 120, y: 450, w: 700, h: 380 }, ST2 = { x: 900, y: 450, w: 700, h: 380 }, OBS = { x: 1680, y: 450, w: 560, h: 380 };
const CAM2 = 680;

function skeleton(r, label, a) {   // 未点亮的下一站：虚线框 + 灰色栏头，克制占位
  if (a <= 0) return; const ctx = E.ctx; ctx.save(); ctx.globalAlpha *= a;
  ctx.strokeStyle = C.rule; ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2); ctx.setLineDash([]);
  text(label, r.x + 48, r.y + 96, F(700, 30, SANS), C.ink2); ctx.restore();
}
function station(r, n, title, en, lines, p, lit) {
  if (p <= 0) return;
  const ctx = E.ctx;
  ctx.save(); ctx.globalAlpha *= clamp(p * 2);
  const yy = r.y + (1 - eOQ(p)) * 40;
  K.card({ x: r.x, y: yy, w: r.w, h: r.h }, { fill: C.sheet, stroke: lit ? C.claret : C.rule, lw: lit ? 3 : 2, lift: 0.35, bar: lit ? C.claret : C.rule });
  E.kicker(r.x + 48, yy + 96, n + ' · ' + en, C.ink, pr(p, 0.1, 0.6));
  E.maskLine(title, r.x + 48, yy + 210, F(900, 92, SERIF), C.black, 92, pr(p, 0.2, 0.6));
  lines.forEach((l, i) => E.wipeText(l, r.x + 48, yy + 300 + i * 54, F(500, 36, SANS), C.ink, 36, pr(p, 0.45 + i * 0.12, 0.4)));
  ctx.restore();
}

window.Chapter = {
  sources: [],
  texts: '论文速读论文讲解视频示例一页边想边做的原文摘录有删节想一步做一步看结果下一步该去查什么调用工具把写回上下文接着第一站第二站推理行动交替示意',

  async init(data) {
    PAGE = data.img.page; WORDS = data.json.words;
    const A = data.A, st = data.st;
    HL = K.pdfPhrase(WORDS, 'reasoning traces and task-specific actions in an interleaved manner');
    RING = K.pdfPhrase(WORDS, 'interleaved manner');
    M.titleOut = A('s00-2', '摘要');                 // 标题退场、开始推近
    M.dive = M.titleOut + 0.1;
    M.hl0 = A('s00-2', '推理'); M.hl1 = A('s00-2', '写出来', 1);
    M.ring = A('s00-2', '交替');
    M.mini = data.st('s01-1') - 0.2;                 // 实体纸缩成小地图
    M.st1 = A('s01-1', '先想一步');
    M.pan = A('s01-2', '第二站') - 0.35;              // 镜头平移到第二站
    M.st2 = A('s01-2', '再做一步');
    M.obs = A('s01-2', '看到的结果');
    M.loop = A('s01-2', '接着');
    data.cue(0.05, 'paper'); data.cue(M.dive, 'whoosh', 0.8); data.cue(M.hl0, 'marker'); data.cue(M.ring, 'pop');
    data.cue(M.mini, 'whoosh', 0.7); data.cue(M.st1, 'pop'); data.cue(M.pan, 'whoosh'); data.cue(M.st2, 'pop'); data.cue(M.obs, 'pop', 0.8); data.cue(M.loop, 'pop', 0.8);
    this.sources = [[0, '原文：Yao et al.《ReAct: Synergizing Reasoning and Acting in Language Models》· arXiv:2210.03629 · CC BY 4.0']];
  },

  // 第一章没有上一章：自己画「上一页」报头封面，chrome 用它做章首翻报纸
  renderPrev(ctx, data) {
    E.growLine(96, 150, 1824, 1, C.ink, 4);
    E.kicker(120, 260, '论文速读 · 示例', C.ink, 1);
    E.text('论文讲解视频', 120, 470, F(900, 132, SERIF), C.black);
    E.text('一页读懂 ReAct', 120, 620, F(900, 132, SERIF), C.claret);
    E.text('示例片：占位时间轴、无配音，只演示镜头语言', 120, 720, F(500, 40, SANS), C.ink2);
    E.growLine(96, 880, 1824, 1, C.rule, 1);
  },

  renderContent(ctx, t, data) {
    // ---------- 左侧大标题（第 0 帧已在位） ----------
    const tOut = pr(t, M.titleOut, 0.5);
    if (tOut < 1) {
      E.kicker(120, 250, '论文速读 · ReAct', C.ink, 1);
      E.maskLine('边想', 120, 450, F(900, 132, SERIF), C.black, 132, 1, tOut);
      E.maskLine('边做的 Agent', 120, 600, F(900, 132, SERIF), C.claret, 132, 1, pr(t, M.titleOut + 0.08, 0.5));
      E.wipeText('Princeton × Google · ICLR 2023', 120, 700, F(500, 34, SANS), C.ink, 34, 1 - tOut);
    }
    // ---------- 实体纸：侧放 → 推近 → 小地图 ----------
    let v = VIEW_SIDE, rot = -1.5;
    if (t >= M.dive) { const p = eIO(pr(t, M.dive, 1.1)); v = K.lv(VIEW_SIDE, VIEW_DIVE, p); rot = lerp(-1.5, 0, p); }
    if (t >= M.mini) { const p = eIO(pr(t, M.mini, 0.9)); v = K.lv(VIEW_DIVE, VIEW_MINI, p); rot = lerp(0, -1.5, p); }
    const pHL = eIO(pr(t, M.hl0, Math.max(0.6, M.hl1 - M.hl0)));
    const pRing = pr(t, M.ring, 0.6);
    K.view(PAGE, DPR, v, { rot, lift: t >= M.mini ? 0.3 : 0.6, over: map => { K.sweep(HL, map, pHL); K.ring(RING, map, pRing, Math.max(2, 4 * clamp(v.k / 4))); } });
    // 推近时标出处
    const dv = pr(t, M.dive + 0.9, 0.4) * (1 - pr(t, M.mini, 0.3));
    if (dv > 0) E.text('原文摘录 · 摘要第 1 段', 1824, 130, F(500, 28, SANS), C.ink2, 'right', dv);

    // ---------- 大画布：想一步 → 做一步 → 看结果 ----------
    if (t < M.mini) return;
    // 固定在画面左上的本节标题（不随镜头平移）
    const pt = pr(t, M.mini + 0.2, 0.7);
    E.kicker(120, 220, 'ReAct 的一轮', C.ink, pt);
    E.maskLine('想一步，做一步', 120, 360, F(900, 92, SERIF), C.black, 92, pr(t, M.mini + 0.35, 0.6));
    const camX = lerp(0, CAM2, eIO(pr(t, M.pan, 0.8)));
    ctx.save(); ctx.translate(-camX, 0);
    // 第一站从摘要的圈注长出：一条酒红细线从右上小地图画到第一站
    const pGrow = pr(t, M.mini + 0.3, 0.7);
    if (pGrow > 0 && t < M.st1 + 0.6) { const a = 1 - pr(t, M.st1 + 0.3, 0.3); ctx.save(); ctx.globalAlpha *= a;
      K.arrow(1560 + camX, 330, ST1.x + ST1.w - 60, ST1.y - 12, pGrow, C.claret, 3, 12); ctx.restore(); }
    skeleton(ST2, '02 · Act', 1 - pr(t, M.st2, 0.3));
    skeleton(OBS, 'Observation', 1 - pr(t, M.obs, 0.3));
    const dim1 = pr(t, M.pan, 0.8);
    ctx.save(); ctx.globalAlpha *= 1 - 0.5 * dim1;
    station(ST1, '01', '想一步', 'Thought', ['写下一句想法：', '下一步该去查什么'], pr(t, M.st1, 0.9), t < M.pan + 0.4);
    ctx.restore();
    station(ST2, '02', '做一步', 'Act', ['调用工具去查', '把结果写回上下文'], pr(t, M.st2, 0.9), true);
    station(OBS, '03', '看结果', 'Observation', ['工具返回的内容', '成为下一步的依据'], pr(t, M.obs, 0.9), false);
    // 回环：看结果 → 接着想下一步（指回第一站方向）
    const pl = pr(t, M.loop, 0.9);
    if (pl > 0) {
      K.curveArrow(OBS.x + OBS.w * 0.5, OBS.y + OBS.h + 12, ST1.x + ST1.w * 0.85, ST1.y + ST1.h + 12, -0.035, pl, C.claret, 4);
    }
    ctx.restore();
    if (pl > 0) E.wipeText('接着想下一步', 120, 422, F(700, 34, SANS), C.claret, 34, pr(pl, 0.3, 0.6));
    // 右下角「示意」标签（这两站是讲解用的示意图，不是论文原图）
    E.text('示意', 1824, 880, F(500, 26, SANS), C.ink2, 'right', pr(t, M.st1, 0.5));
  }
};
})();
