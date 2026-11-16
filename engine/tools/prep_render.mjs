// 渲染前准备（本机 headless Chrome，只取静帧和数据，不出成片）：各章 build/cues.json、字体回退检查、T 核对，
// 以及下一章翻页用的 prev.png（上一章 nochrome 末帧）。成片一律走 shell-wc.html 的 WebCodecs。
// 用法（仓库根目录，先起 serve.mjs）：node engine/tools/prep_render.mjs --project examples/always-on/full [--chapters a,b] [--port 8771]
import { chromium } from 'playwright'; import fs from 'node:fs'; import path from 'node:path';
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const args = process.argv.slice(2); const opt = k => { const i = args.indexOf('--' + k); return i < 0 ? null : (args[i + 1] || true); };
if (!opt('project')) { console.error('usage: node engine/tools/prep_render.mjs --project <工程目录> [--chapters a,b] [--port 8771]'); process.exit(2); }
const port = opt('port') || '8771';
const FULL = path.resolve(String(opt('project'))); const rel = path.relative(REPO, FULL).split(path.sep).join('/');
const film = fs.existsSync(path.join(FULL, 'film.json')) ? JSON.parse(fs.readFileSync(path.join(FULL, 'film.json'), 'utf8')) : {};
const ORDER = opt('chapters') ? String(opt('chapters')).split(',') : (film.chapters || []);
const tl = JSON.parse(fs.readFileSync(path.join(FULL, 'timeline.json'), 'utf8'));
const br = await chromium.launch({ channel: 'chrome', headless: true });
let bad = 0;
for (let i = 0; i < ORDER.length; i++) {
  const ch = ORDER[i], dir = path.join(FULL, ch); fs.mkdirSync(path.join(dir, 'build'), { recursive: true });
  const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'chapter.json'), 'utf8'));
  const secs = tl.sections.filter(s => cfg.sections.includes(s.id));
  const st = Math.min(...secs.map(s => s.start)), en = Math.max(...secs.map(s => s.end));
  const need = Math.round(en * 30) - Math.round(st * 30);
  const pg = await br.newPage({ viewport: { width: 1000, height: 700 } });
  await pg.goto(`http://127.0.0.1:${port}/engine/common/shell-wc.html?ch=${rel}/${ch}&nochrome=1`);
  await pg.waitForFunction(() => window.__READY || window.__ERR, null, { timeout: 90000 });
  const err = await pg.evaluate(() => window.__ERR); if (err) { console.log(ch, 'ERR', err); process.exit(1); }
  const T = await pg.evaluate(() => window.T), cues = await pg.evaluate(() => window.CUES);
  fs.writeFileSync(path.join(dir, 'build/cues.json'), JSON.stringify(cues));
  const fc = await pg.evaluate(() => window.fontCheck());
  if (Object.keys(fc).length) bad++;
  if (i + 1 < ORDER.length) {
    const lastT = (need - 1) / 30;
    const b64 = await pg.evaluate(t => { window.render(t); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, lastT);
    fs.writeFileSync(path.join(FULL, ORDER[i + 1], 'prev.png'), Buffer.from(b64, 'base64'));
  }
  console.log(ch, `start ${st} end ${en} need ${need} T ${T} renderFrames ${Math.ceil(T * 30)} cues ${cues.length} fontMissing ${JSON.stringify(fc)}`);
  await pg.close();
}
await br.close();
if (bad) { console.log('有章节字形回退到系统字体：先跑 style-cards/editorial/get-fonts.sh 或补字'); process.exit(1); }
