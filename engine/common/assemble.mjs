// 全片拼接：按章节顺序 concat（逐帧对齐 timeline）、合成音乐床 + 音效、和人声混音、封装。
// 用法（在仓库根目录）：
//   node engine/common/assemble.mjs --project examples/always-on/full [--chapters ch00-01,ch02] [--voice path/voice.wav] [--name 成片名] [--out 输出目录]
// 约定：
//   - 每章渲好的视频放在 <project>/<章>/build/video.mp4（WebCodecs 下载后 cp 过来）；cues 在 <project>/<章>/build/cues.json（prep_render.mjs 导出）。
//   - 章节顺序：--chapters，或 <project>/film.json 的 "chapters"。
//   - 人声：--voice，或 <project>/<timeline.audio>；都没有时用同长度静音（没配音也能出带音乐和音效的片）。
//   - 章首翻页已在 WebCodecs 渲染时用 prev.png（prep_render.mjs 导出的上一章 nochrome 末帧）画进章节视频，这里不补渲。
//   - 合成只用 trim / tpad / concat / amix / loudnorm，不用 geq。混音不用 -shortest。
import crypto from 'node:crypto'; import path from 'node:path'; import fs from 'node:fs'; import { execFileSync } from 'node:child_process';
const ENGINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2); const opt = k => { const i = args.indexOf('--' + k); return i < 0 ? null : (args[i + 1] || true); };
if (!opt('project')) { console.error('usage: node engine/common/assemble.mjs --project <工程目录> [--chapters a,b] [--voice wav] [--name 名] [--out 目录]'); process.exit(2); }
const FULL = path.resolve(String(opt('project')));
const OUT = path.resolve(String(opt('out') || path.join(FULL, 'build'))); fs.mkdirSync(OUT, { recursive: true });
const film = fs.existsSync(path.join(FULL, 'film.json')) ? JSON.parse(fs.readFileSync(path.join(FULL, 'film.json'), 'utf8')) : {};
const ORDER = opt('chapters') ? String(opt('chapters')).split(',') : (film.chapters || []);
if (!ORDER.length) { console.error('没有章节顺序：传 --chapters 或在 film.json 写 "chapters"'); process.exit(2); }
const FPS = 30;
const tl = JSON.parse(fs.readFileSync(path.join(FULL, 'timeline.json'), 'utf8'));
const run = (cmd, a, o = {}) => execFileSync(cmd, a, Object.assign({ stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 }, o)).toString();
// 帧数：先读 mp4 头里的 nb_frames（瞬时）；读不到再完整解码数帧
const frames = f => { const h = run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=nb_frames', '-of', 'csv=p=0', f]).trim();
  return /^\d+$/.test(h) ? +h : +run('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', f]).trim(); };

const chs = [];
for (const ch of ORDER) {
  const dir = path.join(FULL, ch), cfgP = path.join(dir, 'chapter.json'), vid = path.join(dir, 'build/video.mp4');
  if (!fs.existsSync(cfgP) || !fs.existsSync(vid)) { chs.push({ ch, missing: true }); continue; }
  const cfg = JSON.parse(fs.readFileSync(cfgP, 'utf8'));
  const secs = tl.sections.filter(s => cfg.sections.includes(s.id));
  const start = Math.min(...secs.map(s => s.start)), end = Math.max(...secs.map(s => s.end));
  chs.push({ ch, dir, cfg, vid, start, end, f0: Math.round(start * FPS), f1: Math.round(end * FPS), have: frames(vid) });
}
const present = chs.filter(c => !c.missing);
console.log(chs.map(c => c.missing ? `${c.ch}: MISSING` : `${c.ch}: ${c.start.toFixed(3)}–${c.end.toFixed(3)} need ${c.f1 - c.f0} have ${c.have}`).join('\n'));
if (!present.length) { console.error('一章视频都没有'); process.exit(1); }

// 视频：每章裁/补到 timeline 帧数（不足时复制末帧），按顺序 concat，重新编码一次
const inputs = [], filters = []; let k = 0, total = 0;
for (const c of present) {
  const need = c.f1 - c.f0;
  inputs.push('-i', c.vid); const a = k++;
  filters.push(`[${a}:v]fps=${FPS},tpad=stop_mode=clone:stop=${Math.max(0, need)},trim=end_frame=${need},setpts=PTS-STARTPTS[v${a}]`);
  total += need;
}
filters.push(present.map((_, i) => `[v${i}]`).join('') + `concat=n=${present.length}:v=1:a=0[vout]`);
const video = path.join(OUT, 'video.mp4');
run('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filters.join(';'), '-map', '[vout]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), video]);
const vN = frames(video); const DUR = vN / FPS;
console.log('video frames', vN, 'expected', total, 'dur', DUR.toFixed(3));

// 音频：合并各章 cues → 音乐床 + 音效（engine/audio/audiolib.py），和全片人声混音
const firstStart = present[0].start;
let cues = [];
for (const c of present) { const f = path.join(c.dir, 'build/cues.json'); if (fs.existsSync(f)) cues.push(...JSON.parse(fs.readFileSync(f, 'utf8')).map(q => Object.assign({}, q, { t: +(q.t - firstStart).toFixed(3) }))); }
cues.sort((a, b) => a.t - b.t);
fs.writeFileSync(path.join(OUT, 'cues.json'), JSON.stringify(cues));
const voice = path.join(OUT, 'voice.wav');
const voiceSrc = opt('voice') ? path.resolve(String(opt('voice'))) : (tl.audio ? path.join(FULL, tl.audio) : null);
if (voiceSrc && fs.existsSync(voiceSrc)) {
  // 只拼了部分章节时，人声按已有章节的时间切出拼起来
  const vparts = present.map((c, i) => `[0:a]atrim=start=${(c.f0 / FPS).toFixed(4)}:end=${(c.f1 / FPS).toFixed(4)},asetpts=PTS-STARTPTS[a${i}]`);
  run('ffmpeg', ['-y', '-loglevel', 'error', '-i', voiceSrc, '-filter_complex', vparts.join(';') + ';' + present.map((_, i) => `[a${i}]`).join('') + `concat=n=${present.length}:v=0:a=1,aresample=48000[a]`, '-map', '[a]', '-c:a', 'pcm_s16le', voice]);
} else {
  console.log('没有人声文件，用静音代替（只有音乐和音效）');
  run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', DUR.toFixed(4), '-c:a', 'pcm_s16le', voice]);
}
const AUDIOLIB = path.join(ENGINE, 'audio/audiolib.py');
const PY = ['run', '--quiet', '--with', 'numpy', 'python', AUDIOLIB];
// 音乐床只取决于配音、时长和 audiolib.py：三者不变就复用上次的 music.wav（纯 Python 滤波要一两分钟）
{
  const st = f => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');
  const key = [st(voice), DUR.toFixed(4), st(AUDIOLIB)].join('|');
  const mw = path.join(OUT, 'music.wav'), mk = path.join(OUT, 'music.key');
  if (fs.existsSync(mw) && fs.existsSync(mk) && fs.readFileSync(mk, 'utf8') === key) console.log('music: 复用缓存');
  else { run('uv', [...PY, 'music', '--voice', voice, '--dur', DUR.toFixed(4), '--out', mw]); fs.writeFileSync(mk, key); }
}
run('uv', [...PY, 'sfx', '--voice', voice, '--cues', path.join(OUT, 'cues.json'), '--dur', DUR.toFixed(4), '--out', path.join(OUT, 'sfx.wav')]);
console.log(run('uv', [...PY, 'mix', '--voice', voice, '--music', path.join(OUT, 'music.wav'), '--sfx', path.join(OUT, 'sfx.wav'), '--dur', DUR.toFixed(4), '--out', path.join(OUT, 'mix.wav')]));
run('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(OUT, 'mix.wav'), '-af', 'volume=-0.5dB', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', path.join(OUT, 'mix.m4a')]);

// 封装
const name = opt('name') || film.name || 'film';
const final = path.join(OUT, `${name}.mp4`);
run('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-i', path.join(OUT, 'mix.m4a'), '-map', '0:v', '-map', '1:a', '-c', 'copy', '-movflags', '+faststart', final]);
// 轻量版 <30MB：两遍编码，AAC 160k
const lite = path.join(OUT, `${name}-lite.mp4`);
const vb = Math.max(200, Math.floor((28 * 8 * 1024 * 1024 / DUR - 160 * 1024) / 1024));
run('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-c:v', 'libx264', '-preset', 'slow', '-b:v', `${vb}k`, '-pass', '1', '-passlogfile', path.join(OUT, 'p2'), '-an', '-f', 'null', '/dev/null']);
run('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-i', path.join(OUT, 'mix.wav'), '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-b:v', `${vb}k`, '-pass', '2', '-passlogfile', path.join(OUT, 'p2'), '-pix_fmt', 'yuv420p', '-af', 'volume=-0.5dB', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', lite]);
function measure(f) {
  const p = run('bash', ['-c', `ffmpeg -hide_banner -i "${f}" -af ebur128=peak=true -f null - 2>&1 | grep -A20 Summary | grep -E "I:|Peak:"`]);
  const d = run('bash', ['-c', `ffprobe -v error -show_entries stream=codec_type,duration -of csv=p=0 "${f}"`]);
  return p + d;
}
console.log('FINAL', final, '\n', measure(final));
console.log('LITE', lite, (fs.statSync(lite).size / 1048576).toFixed(1) + 'MB', '\n', measure(lite));
console.log('chapters:', JSON.stringify(chs.map(c => ({ ch: c.ch, missing: !!c.missing, start: c.start, end: c.end, need: c.missing ? 0 : c.f1 - c.f0, have: c.have }))));
