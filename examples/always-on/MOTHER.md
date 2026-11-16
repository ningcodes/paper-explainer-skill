# 五格母图规格（g1 定，全片共用）

五格 = 全片母图：事件收件箱 / 定时器 / 记忆 / 权限 / 发件箱。ch00-01 在 s00-4「五样东西」时落成大排；ch02–ch06 开头翻页落地帧就是这排五格，本章那格变酒红 → 其余四格下沉淡出 → 本章那格飞到左上角变成章节签（整章常驻）；本章第一个内容元素从那格的大排位置（`M5.big(i)`）长出来。ch07 回总图时可以先把五格大排摆回来再并入总图。

## 坐标（1920×1080）
- 大排 BIG：x=96，y=420，总宽 1728，格高 260，格间距 24 → 每格宽 326.4。第 i 格 x = 96 + i×350.4。
  - 格 0 收件箱 x96｜格 1 定时器 x446.4｜格 2 记忆 x796.8｜格 3 权限 x1147.2｜格 4 发件箱 x1497.6（均 y420，w326.4，h260）
- 章节签 CHIP：x=96，y=92，w=360，h=68（左上角，进度条下方，整章常驻；本章内容别压这块）。

## 样式（卡 ④ 报刊风，不发光、不弹跳）
- 未点亮：底 `C.wheat #F2DFCE`，无描边；左上编号 Inter 700 30px 酒红（02–06，对应进度条栏号）；中间名称 宋体 800 52px `C.black`；底部英文 思源黑 500 26px `C.ink2`（Event inbox / Timers / Memory / Permissions / Outbox，原文用词）。
- 点亮：底色 wheat→酒红 `C.claret` 插值（`ED.mix`），字变白（编号、英文变 #F7E6EC）。
- 章节签：酒红底，白字「02  事件收件箱」：编号 Inter 700 30px + 名称 宋体 800 34px，左内边距 24。
- 中文名：事件收件箱 / 定时器 / 记忆 / 权限 / 发件箱。

## 代码（复制进自己的 scene.js，不改 common/）
```js
const M5 = (() => {
  const E = window.ED, { C, F, SERIF, SANS, INTER, lerp, clamp, eOC, eIO, pr, mix, text } = E;
  const NAMES = ['事件收件箱', '定时器', '记忆', '权限', '发件箱'];
  const EN = ['Event inbox', 'Timers', 'Memory', 'Permissions', 'Outbox'];
  const NUM = ['02', '03', '04', '05', '06'];
  const BIG = { x: 96, y: 420, w: 1728, h: 260, gap: 24 };
  const CHIP = { x: 96, y: 92, w: 360, h: 68 };
  const big = i => { const w = (BIG.w - BIG.gap * 4) / 5; return { x: BIG.x + i * (w + BIG.gap), y: BIG.y, w, h: BIG.h }; };
  const LR = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });
  // 画一格。r 屏幕矩形；lit 0..1；s = 尺寸系数（1 = 大排）；alpha
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
  // 大排五格；lit = [5 个 0..1]；enter = 0..1 逐格错开擦出（ch00 用），默认 1
  function row(lit = [0, 0, 0, 0, 0], enter = 1, alpha = 1) {
    for (let i = 0; i < 5; i++) {
      const p = eOC(clamp(enter * 1.6 - i * 0.15)); if (p <= 0) continue;
      const r = big(i); cell(i, { x: r.x, y: r.y + (1 - p) * 40, w: r.w, h: r.h }, lit[i], alpha * clamp(p * 1.5));
    }
  }
  // 章节开头（翻页落地即画）：0.2s 起本格变红；tGo 起 0.7s 其余四格下沉淡出、本格飞成左上章节签；之后整章常驻签。
  // 返回本格当前矩形（变形中），本章首个元素可从 big(i) 长出。
  function intro(t, i, tGo) {
    const lit = eOC(pr(t, 0.2, 0.45)), p = eIO(pr(t, tGo, 0.7)), fo = pr(t, tGo, 0.35);
    for (let k = 0; k < 5; k++) if (k !== i && fo < 1) { const r = big(k); cell(k, { x: r.x, y: r.y + eIO(fo) * 50, w: r.w, h: r.h }, 0, 1 - fo); }
    if (p < 0.6) { const r = LR(big(i), CHIP, p); cell(i, r, lit, 1, lerp(1, 0.4, p)); return r; }
    const r = LR(big(i), CHIP, p); chip(i, r); return r;
  }
  return { NAMES, EN, NUM, BIG, CHIP, big, cell, chip, row, intro, LR };
})();
```
用法：`renderContent` 里先 `M5.intro(t, 本章格号, tGo)`（ch02 格号 0 … ch06 格号 4；tGo 取本章第 1 句里的锚词，例如 `data.A('s03-1','光有')`，保证落地后五格停 ≥0.8s）。tGo+0.7s 之后只画签：`M5.intro` 会自动只画签。
