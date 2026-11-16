// 自己从原文页取真图，替换占位图（仅供个人学习复现；第三方原文图不要提交、不要再分发）。
// 1) 按 source/g*-regions.json 里记录的区域（CSS px，dpr 3）截原文网页 → source/<g>-<key>@3x.png
// 2) 下载文章里的 7 张配图，gif 用 ffmpeg 抽帧 → source/g1-tl/f001..f103.jpg（10fps）、source/g3-total/f000..f119.png（全部帧）
// 注意：原网页改版后区域会对不上，截出来的图和词框可能错位，需要按 engine/tools/capture.mjs 重新定位。
// 用法（仓库根目录）：node examples/always-on/tools/fetch_sources.mjs
import { chromium } from 'playwright'; import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const SRC = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../source');
const IMGS = ['bb08543a505cea3a24c88c718ceec4405e9c0a79.png', 'c16694e6d979a2ace84d03da0544297b7245c0a8.png', 'e5d209d7ef9b3455dec8a27b777dc12bdf806699.png',
  '700b5f3a446f22493c0307ec65751b6b2f82ccb7.png', '5dc803bf06d6e92e4aecae762da096626e2fa9ec.gif', '48757f0a147acfe841c943674c6214d34ed4405a.gif', '9f8df7b2dcc9d4637d27f37dae6e40a2a5851c8a.gif'];
for (const f of IMGS) {
  const r = await fetch('https://assets.claude.com/' + f); if (!r.ok) { console.log('下载失败', f, r.status); continue; }
  fs.writeFileSync(path.join(SRC, f), Buffer.from(await r.arrayBuffer())); console.log('下载', f);
}
const ff = a => execFileSync('ffmpeg', ['-v', 'error', '-y', ...a]);
for (const [gif, sub, args] of [['5dc803bf06d6e92e4aecae762da096626e2fa9ec.gif', 'g1-tl', ['-vf', 'fps=10', '-q:v', '3', '-start_number', '1', 'f%03d.jpg']],
  ['9f8df7b2dcc9d4637d27f37dae6e40a2a5851c8a.gif', 'g3-total', ['-start_number', '0', 'f%03d.png']]]) {
  const g = path.join(SRC, gif); if (!fs.existsSync(g)) continue; const d = path.join(SRC, sub); fs.mkdirSync(d, { recursive: true });
  ff(['-i', g, ...args.slice(0, -1), path.join(d, args[args.length - 1])]); console.log('抽帧', sub, fs.readdirSync(d).length);
}
const br = await chromium.launch({ channel: 'chrome', headless: true });
for (const g of ['g1', 'g2', 'g3']) {
  const R = JSON.parse(fs.readFileSync(path.join(SRC, `${g}-regions.json`), 'utf8'));
  const pg = await br.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: R.dpr || 3 });
  await pg.goto(R.url, { waitUntil: 'load', timeout: 60000 });
  for (let y = 0; y < 14000; y += 700) { await pg.evaluate(y => scrollTo(0, y), y); await pg.waitForTimeout(150); }
  await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(1500);
  for (const [key, s] of Object.entries(R.shots)) {
    const c = s.region; await pg.screenshot({ path: path.join(SRC, `${g}-${key}@3x.png`), clip: { x: c.x, y: c.y, width: c.w, height: c.h }, fullPage: true, timeout: 90000 });
    console.log('截图', `${g}-${key}@3x.png`);
  }
  await pg.close();
}
await br.close();
