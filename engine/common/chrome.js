// 全片统一的固定元素 + 章节外壳。章节 agent 不画这些，只实现 window.Chapter（见 README）。
// 内容：顶部栏目导航进度条、字幕条、底部来源行、章节开头翻报纸转场、时间轴/锚词工具、render(t) 外壳。
(function () {
'use strict';
const E = window.ED;
const { W, H, C, F, SERIF, SANS, INTER, clamp, lerp, eOC, eIO, pr } = E;

// 栏目导航（进度条）：每期不同，不写死在这里。来源（后者覆盖前者）：
//   1) 工程目录下 film.json 的 "nav"（全片共用，推荐）；2) chapter.json 的 "nav"。
// 每项 { n: '01', name: '两字栏目名', sections: ['01'] }；sections = timeline.json 里属于这一栏的段号；n 可为空串（如收尾栏）。
// 没有任何 nav 时不画栏目，只留顶部 64px 纸面。
let NAV = [];

// ---------- 时间轴 ----------
function cw(ch) { return /[一-鿿0-9]/.test(ch) ? 1 : 0; }
function weights(str) {
  const w = []; let i = 0;
  while (i < str.length) {
    if (/[A-Za-z]/.test(str[i])) { let j = i; while (j < str.length && /[A-Za-z]/.test(str[j])) j++; for (let k = i; k < j; k++) w.push(1.6 / (j - i)); i = j; }
    else { w.push(cw(str[i])); i++; }
  }
  return w;
}
// 由全片 timeline + 本章 section 列表，得到章内局部时间的数据
function buildData(cfg, tl, clauses) {
  const secs = tl.sections.filter(s => cfg.sections.includes(s.id));
  const t0 = secs[0].start, tEnd = secs[secs.length - 1].end;
  const sents = tl.sentences.filter(s => cfg.sections.includes(s.section)).map(s => {
    const c = clauses && clauses.sentences.find(x => x.id === s.id && x.text === s.text && Math.abs(x.start - s.start) < 1e-3);
    const cl = c ? c.clauses : [{ text: s.text, start: s.start, end: s.end }];
    return { id: s.id, section: s.section, text: s.text, start: s.start - t0, end: s.end - t0, clauses: cl.map(k => ({ text: k.text, start: k.start - t0, end: k.end - t0 })) };
  });
  const last = sents[sents.length - 1];
  const T = Math.max(tEnd - t0, last.end + (cfg.tail || 0));
  const S = {}; sents.forEach(s => S[s.id] = s);
  // 锚词：句 id + 子串 → 局部秒；frac=1 取子串结尾
  function A(id, sub, frac = 0) {
    const s = S[id]; if (!s) throw new Error('no sentence ' + id);
    for (const c of s.clauses) {
      const idx = c.text.indexOf(sub); if (idx < 0) continue;
      const w = weights(c.text); const tot = w.reduce((a, b) => a + b, 0) || 1;
      const k = idx + (frac ? sub.length : 0); let acc = 0; for (let i = 0; i < k; i++) acc += w[i];
      return c.start + (c.end - c.start) * acc / tot;
    }
    throw new Error('anchor not found ' + id + ' ' + sub);
  }
  return { cfg, t0, T, sentences: sents, S, A, st: id => S[id].start, en: id => S[id].end, timeline: tl };
}

// ---------- 字幕：按分句合并成意群，一行 ≤22 字（英文按半字计），阿拉伯数字；句末 +0.25s 收，不跨章 ----------
// 中文数字 → 阿拉伯数字的替换表：film.json 的 numfix（全片）+ chapter.json 的 numfix（本章）。
const NUMFIX_DEFAULT = [];
function subLen(s) { let n = 0; s.replace(/[A-Za-z]+/g, m => { n += m.length * 0.5; return ''; }).replace(/[一-鿿0-9《》、，：；？]/g, () => { n += 1; return ''; }); return n; }
function buildSubs(data, numfix) {
  const fix = s => { (numfix && numfix.length ? numfix : NUMFIX_DEFAULT).forEach(([a, b]) => s = s.split(a).join(b)); return s; };
  const strip = s => s.replace(/[，。：；、]+$/, '');
  const out = [];
  data.sentences.forEach((s, si) => {
    let cur = null; const part = [];
    s.clauses.forEach(c => {
      const txt = fix(c.text);
      if (cur && !/[：；。？！]$/.test(cur.text) && subLen(strip(cur.text + txt)) <= 22 && cur.n < 3) { cur.text += txt; cur.end = c.end; cur.n++; }
      else { if (cur) part.push(cur); cur = { text: txt, start: c.start, end: c.end, n: 1 }; }
    });
    if (cur) part.push(cur);
    // 单个分句仍超 22 字：在「，」「时」或空格处、最靠近中间的位置拆成两条，时间按字数分
    for (let i = 0; i < part.length; i++) {
      const u = part[i], txt = strip(u.text); if (subLen(txt) <= 22) continue;
      let best = -1, bd = 1e9; const half = subLen(txt) / 2;
      for (let k = 1; k < txt.length - 1; k++) { const ch = txt[k - 1]; if (!(ch === '，' || ch === '时' || (txt[k] === ' ' && /[一-鿿]/.test(txt[k + 1] || '')))) continue;
        const d = Math.abs(subLen(txt.slice(0, k)) - half); if (d < bd) { bd = d; best = k; } }
      if (best < 0) continue;
      const a = txt.slice(0, best).trim(), b = txt.slice(best).trim(), r = subLen(a) / (subLen(a) + subLen(b)), mid = u.start + (u.end - u.start) * r;
      part.splice(i, 1, { text: a, start: u.start, end: mid, n: 1 }, { text: b, start: mid, end: u.end, n: 1 }); i++;
    }
    part.forEach((u, i) => { u.text = strip(u.text).replace(/。/g, ''); u.show = i < part.length - 1 ? part[i + 1].start : s.end + 0.25; });
    out.push(...part);
  });
  out.forEach((u, i) => { const nx = out[i + 1]; if (nx) u.show = Math.min(u.show, nx.start); u.show = Math.min(u.show, data.T); });
  return out;
}
function drawSub(t, subs) {
  const ctx = E.ctx; const y = 952, h = 88;
  ctx.fillStyle = E.rgba(C.wheat, 0.98); ctx.fillRect(0, y, W, h);
  E.line(0, y + 0.5, W, y + 0.5, C.ink, 1);
  const u = subs.find(u => t >= u.start - 0.05 && t < u.show);
  if (u) E.text(u.text, 868, y + 60, F(700, 44, SERIF), C.black, 'center');
}

// ---------- 顶部栏目导航：占满 96–1824；红线只表示已播进度，走在基线上，不压任何文字 ----------
function navTimes(tl) {
  return NAV.map(n => {
    const ss = tl.sections.filter(s => n.sections.includes(s.id));
    return ss.length ? { start: Math.min(...ss.map(s => s.start)), end: Math.max(...ss.map(s => s.end)) } : null;
  });
}
function drawNav(tGlobal, nt, tlEnd) {
  const ctx = E.ctx;
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, 64);
  if (!NAV.length) return;
  const x0 = 96, x1 = 1824, slot = (x1 - x0) / NAV.length, yb = 54, yt = 38;
  let cur = -1; nt.forEach((r, i) => { if (r && tGlobal >= r.start) cur = i; });
  E.line(x0, yb + 0.5, x1, yb + 0.5, C.rule, 1);
  NAV.forEach((s, i) => {
    const x = x0 + slot * i, on = i === cur;
    E.line(x + 0.5, yb - 7, x + 0.5, yb + 1, on ? C.claret : C.ink2, 2);
    const fN = F(700, 26, INTER), fT = on ? F(900, 26, SERIF) : F(500, 26, SANS);
    if (s.n) E.text(s.n, x + 12, yt, fN, on ? C.claret : C.ink2);
    E.text(s.name, x + 12 + (s.n ? E.tw(s.n, fN) + 10 : 0), yt, fT, on ? C.black : C.ink2);
  });
  // 已播：之前各节整格，当前节按本节进度
  nt.forEach((r, i) => {
    if (!r) return; const p = i < cur ? 1 : i === cur ? clamp((tGlobal - r.start) / Math.max(1e-6, r.end - r.start)) : 0;
    if (p > 0) { ctx.fillStyle = C.claret; ctx.fillRect(x0 + slot * i, yb - 1, slot * p, 3); }
  });
  // 预告：当前节最后 2 秒，下一节刻度和编号脉动
  const r = cur < 0 ? { end: tlEnd } : nt[cur];
  if (r && cur + 1 < NAV.length) {
    const pp = pr(tGlobal, Math.min(r.end, tlEnd) - 2.0, 2.0);
    if (pp > 0 && pp < 1) {
      const a = Math.sin(Math.PI * clamp((pp * 2) % 1)); const x = x0 + slot * (cur + 1);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = C.claret; ctx.beginPath(); ctx.arc(x + 1, yb, 6, 0, Math.PI * 2); ctx.fill();
      if (NAV[cur + 1].n) { const fN = F(700, 26, INTER); E.text(NAV[cur + 1].n, x + 12, yt, fN, C.claret); E.text(NAV[cur + 1].name, x + 22 + E.tw(NAV[cur + 1].n, fN), yt, F(900, 26, SERIF), C.claret); } else E.text(NAV[cur + 1].name, x + 12, yt, F(900, 26, SERIF), C.claret); ctx.restore();
    }
  }
}

// ---------- 底部来源行：先擦除旧行，再从左擦出新行（不叠字），灰色 26px ----------
function drawSource(t, list) {
  if (!list || !list.length) return;
  const f = F(400, 26, SANS); let i = -1; for (let k = 0; k < list.length; k++) if (t >= list[k][0]) i = k;
  if (i < 0) return;
  const po = i === 0 ? 1 : pr(t, list[i][0], 0.22);
  if (po < 1) {
    const w = E.tw(list[i - 1][1], f), cut = 120 + w * E.eIC(po); const ctx = E.ctx;
    ctx.save(); ctx.beginPath(); ctx.rect(cut, 900, W, 40); ctx.clip(); E.text(list[i - 1][1], 120, 928, f, C.ink2); ctx.restore();
    return;
  }
  E.wipeText(list[i][1], 120, 928, f, C.ink2, 26, i === 0 ? 1 : pr(t, list[i][0] + 0.22, 0.4));
}

// ---------- 外壳 ----------
const Chrome = { NAV, buildData, buildSubs, drawNav, drawSub, drawSource, weights };
Chrome.boot = async function ({ chapterDir, root, fontBase }) {
  const q = new URLSearchParams(location.search);
  const noChrome = q.get('nochrome') === '1';
  await E.loadFonts(fontBase || '/style-cards/editorial');
  const cfg = await (await fetch(`${chapterDir}/chapter.json`)).json();
  // 全片配置 film.json（可选）：nav 栏目、numfix、brand 等，全片所有章节共用
  const film = await fetch(`${root}/${cfg.film || 'film.json'}`).then(r => r.ok ? r.json() : {}).catch(() => ({}));
  NAV = cfg.nav || film.nav || []; Chrome.NAV = NAV; Chrome.film = film;
  cfg.numfix = [...(film.numfix || []), ...(cfg.numfix || [])];
  const tl = await (await fetch(`${root}/${cfg.timeline}`)).json();
  const clauses = cfg.clauses ? await (await fetch(`${root}/${cfg.clauses}`)).json() : null;
  const data = buildData(cfg, tl, clauses);
  data.root = root; data.dir = chapterDir; data.img = {}; data.json = {};
  for (const [k, p] of Object.entries((cfg.assets && cfg.assets.img) || {})) data.img[k] = await E.loadImg(`${root}/${p}`);
  for (const [k, p] of Object.entries((cfg.assets && cfg.assets.json) || {})) data.json[k] = await (await fetch(`${root}/${p}`)).json();
  data.cues = []; data.cue = (t, type, gain, pan) => data.cues.push(Object.assign({ t: +(t + data.t0).toFixed(3), tLocal: +t.toFixed(3), type }, gain ? { gain } : {}, pan ? { pan } : {}));
  let prev = null; if (cfg.flipIn) prev = await E.loadImg(`${chapterDir}/prev.png`).catch(() => null);
  const cv = document.getElementById('c'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d'); E.setCtx(ctx);
  const Ch = window.Chapter;
  if (Ch.init) await Ch.init(data);
  // 第一章没有上一章可翻：scene 可以实现 renderPrev(ctx, data) 自己画「上一页」（如报头封面），翻页时用它代替 prev.png
  if (cfg.flipIn && !prev && Ch.renderPrev) {
    const pc = document.createElement('canvas'); pc.width = W; pc.height = H; const pctx = pc.getContext('2d');
    E.setCtx(pctx); pctx.fillStyle = C.paper; pctx.fillRect(0, 0, W, H); Ch.renderPrev(pctx, data); E.setCtx(ctx); prev = pc;
  }
  const subs = buildSubs(data, cfg.numfix);
  const nt = navTimes(tl); const tlEnd = tl.duration;
  function render(t) {
    t = clamp(t, 0, data.T);
    E.setCtx(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    const content = () => { ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H); ctx.save(); Ch.renderContent(ctx, t, data); ctx.restore(); };
    const FL = 0.6;
    if (prev && t < FL) {
      // 章节开头翻报纸：上一章最后一帧（无固定元素）左移，新版面带纸边阴影从右滑入
      const fp = eIO(t / FL), ex = W * (1 - fp);
      ctx.drawImage(prev, -W * fp, 0, W, H);
      ctx.save(); ctx.beginPath(); ctx.rect(ex, 0, W, H); ctx.clip(); ctx.translate(ex, 0); content(); ctx.restore();
      const g = ctx.createLinearGradient(ex - 46, 0, ex, 0); g.addColorStop(0, 'rgba(51,48,46,0)'); g.addColorStop(1, 'rgba(51,48,46,0.16)');
      ctx.fillStyle = g; ctx.fillRect(ex - 46, 0, 46, H);
    } else content();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    if (!noChrome) {
      drawSource(t, Ch.sources);
      drawSub(t, subs);
      drawNav(t + data.t0, nt, tlEnd);
    }
  }
  window.render = window.seek = render; window.T = data.T; window.DATA = data;
  window.CUES = data.cues.slice().sort((a, b) => a.t - b.t);
  window.SUBS = subs.map(u => ({ text: u.text, start: u.start, show: u.show }));
  window.fontCheck = () => E.fontCheck(document.documentElement.innerText + JSON.stringify(window.SUBS) + JSON.stringify(Ch.sources || []) + (Ch.texts || ''));
  render(0); window.__READY = true;
};
window.Chrome = Chrome;
})();
