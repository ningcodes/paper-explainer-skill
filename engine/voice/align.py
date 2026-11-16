"""任意 TTS 出的配音 → voice.wav + timeline.json + clauses.json（全片唯一时间源）。

做法（来自已发布片的配音流水线）：
  1. 每批 TTS 原声（mp3/wav，一批可以是一段或几段口播）先做语音识别，拿到字级时间（whisper 格式 JSON）；
  2. 口播原句和识别结果按字对齐（difflib），得到每句在原声里的起止，再吸附到最近的静音点；
  3. 每句：去首尾静音 → 句内长停顿压到 ≤0.30s → atempo 1.05 → 8ms 淡入淡出；
  4. 按停顿参数拼起来（片头 0.3s、句间 0.35s、段间 0.7s、片尾 2.5s，可改），输出时间轴和分句时间。
没有识别结果时退回「按字数均分 + 吸附静音」的粗对齐（会标 rough），上线前务必逐句听一遍或补识别。

用法：
  uv run --with numpy python engine/voice/align.py voice.json
  uv run --with mlx-whisper --with numpy python engine/voice/align.py asr raw_00.mp3 asr_00.json [--prompt "专有名词, 逗号分隔"]   # 可选：本机识别（Apple Silicon）

voice.json（路径都相对 voice.json 所在目录）：
{
  "script": "../口播.md",                 // 口播：段标题「## 00 · 段名」，句子行以「- 」开头（同 engine/tools/mk_dummy_timeline.py）
  "batches": [                            // 每批原声对应哪些段（按口播顺序）
    {"audio": "raw_00.mp3", "asr": "asr_00.json", "sections": ["00"]},
    {"audio": "raw_0607.mp3", "asr": "asr_0607.json", "sections": ["06", "07"]}
  ],
  "overrides": {"s03-4": {"audio": "raw_r_s03-4.mp3", "asr": "asr_r_s03-4.json"}},   // 可选：单句重生成
  "pauses": {"head": 0.3, "sentence": 0.35, "section": 0.7, "tail": 2.5, "atempo": 1.05, "cap": 0.30},
  "out": ".."                             // 输出目录：voice/voice.wav、timeline.json、clauses.json 写到这里
}
依赖：numpy、ffmpeg。
"""
import json, re, os, sys, subprocess, difflib
import numpy as np

SR = 48000


def parse_script(path):
    sec = None; n = 0; out = []
    for line in open(path, encoding='utf-8'):
        m = re.match(r'^## (\d\d) ·', line)
        if m: sec = m.group(1); n = 0; continue
        if line.startswith('- ') and sec:
            n += 1; out.append({'id': f's{sec}-{n}', 'section': sec, 'text': line[2:].strip().replace('**', '')})
    if not out: raise SystemExit('口播里没找到句子（段标题「## 00 · 段名」，句子行「- 」开头）')
    return out


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def energy_db(x, hop_s=0.01):
    hop = int(hop_s * SR); n = len(x) // hop
    e = np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
    return 20 * np.log10(e / (e.max() + 1e-9))


def silences(x, thr=-40, minlen=0.08):
    db = energy_db(x); q = db < thr; out = []; i = 0; n = len(q)
    while i < n:
        if q[i]:
            j = i
            while j < n and q[j]: j += 1
            if (j - i) * 0.01 >= minlen: out.append((i * 0.01, j * 0.01))
            i = j
        else: i += 1
    return out


norm = lambda t: [c for c in t.lower() if c.isalnum()]


def asr_chars(path):
    r = json.load(open(path, encoding='utf-8')); ch = []; ts = []
    for seg in r['segments']:
        words = seg.get('words') or [{'word': seg['text'], 'start': seg['start'], 'end': seg['end']}]
        for w in words:
            cs = norm(w['word'])
            if not cs: continue
            d = (w['end'] - w['start']) / len(cs)
            for k, c in enumerate(cs): ch.append(c); ts.append((w['start'] + k * d, w['start'] + (k + 1) * d))
    return ch, ts


def char_times(items, asr_path, x):
    """items: [(id, text)]。返回 exp 字表、每字属于哪句、每字在原声里的 (start, end)、匹配率。"""
    exp = []; own = []
    for k, (_, text) in enumerate(items):
        for c in norm(text): exp.append(c); own.append(k)
    T = [None] * len(exp)
    if asr_path and os.path.exists(asr_path):
        ac, at = asr_chars(asr_path)
        sm = difflib.SequenceMatcher(None, exp, ac, autojunk=False)
        for a, b, n in sm.get_matching_blocks():
            for i in range(n): T[a + i] = at[b + i]
    else:  # 粗对齐：有声区间内按字数均分
        db = energy_db(x); on = np.where(db > -40)[0]
        s0, s1 = (on[0] * 0.01, (on[-1] + 1) * 0.01) if len(on) else (0, len(x) / SR)
        d = (s1 - s0) / max(1, len(exp))
        T = [(s0 + i * d, s0 + (i + 1) * d) for i in range(len(exp))]
    idx = [i for i, t in enumerate(T) if t]
    if not idx: raise SystemExit('识别结果和口播一个字都对不上：' + str(asr_path))
    for i in range(len(T)):
        if T[i] is None:
            p = max([j for j in idx if j < i], default=None); q = min([j for j in idx if j > i], default=None)
            if p is None: T[i] = (T[q][0], T[q][0])
            elif q is None: T[i] = (T[p][1], T[p][1])
            else: f = (i - p) / (q - p); t = T[p][1] + (T[q][0] - T[p][1]) * f; T[i] = (t, t)
    return exp, own, T, len(idx) / len(exp)


def trim(x, thr=-45):
    db = energy_db(x, 0.005); idx = np.where(db > thr)[0]
    if not len(idx): return 0, len(x)
    s = max(0, idx[0] * int(0.005 * SR) - int(0.02 * SR)); e = min(len(x), (idx[-1] + 1) * int(0.005 * SR) + int(0.04 * SR)); return s, e


def cap_internal(x, cap=0.30, thr=-40):
    db = energy_db(x); n = len(db); keep = np.ones(len(x), bool); hop = int(0.01 * SR); i = 0
    while i < n:
        if db[i] < thr:
            j = i
            while j < n and db[j] < thr: j += 1
            L = (j - i) * 0.01
            if L > cap + 0.02:
                cut = int((L - cap) * SR); mid = (i * hop + j * hop) // 2
                keep[mid - cut // 2:mid - cut // 2 + cut] = False
            i = j
        else: i += 1
    return keep


def atempo(x, r):
    if abs(r - 1) < 1e-6: return x
    p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', f'atempo={r}', '-f', 'f32le', '-'], input=x.tobytes(), capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype=np.float32).copy()


def fade(x, ms=8):
    n = min(len(x) // 2, int(ms / 1000 * SR)); r = np.linspace(0, 1, n, dtype=np.float32); x[:n] *= r; x[len(x) - n:] *= r[::-1]; return x


def split_clauses(t):
    parts = re.findall(r'[^，；：。？！]+[，；：。？！」]*', t); return [p for p in parts if p.strip()]


def build(cfg_path):
    base = os.path.dirname(os.path.abspath(cfg_path)); P = lambda p: os.path.join(base, p)
    cfg = json.load(open(cfg_path, encoding='utf-8'))
    pz = dict(head=0.3, sentence=0.35, section=0.7, tail=2.5, atempo=1.05, cap=0.30); pz.update(cfg.get('pauses', {}))
    S = parse_script(P(cfg['script'])); ovr = cfg.get('overrides', {})
    sec2b = {}
    for bi, b in enumerate(cfg['batches']):
        for s in b['sections']: sec2b[s] = bi
    raws = {}; sils = {}; bounds = {}; info = {}

    def get(path):
        if path not in raws: raws[path] = load(P(path)); sils[path] = silences(raws[path])
        return raws[path]

    def snap(path, t):
        best = None
        for a, b in sils[path]:
            d = 0 if a <= t <= b else min(abs(t - a), abs(t - b))
            if best is None or d < best[0]: best = (d, a, b)
        if best is None: return t
        d, a, b = best
        return (a + b) / 2 if d < 0.6 else t

    groups = {}
    for s in S:  # 单句重生成的句子也留在原批里参与对齐（这样它在原批里的那段声音不会被并进前后句），之后再换成重生成的版本
        if s['section'] not in sec2b: raise SystemExit(f"段 {s['section']} 没有对应的配音批次（voice.json 的 batches）")
        groups.setdefault(sec2b[s['section']], []).append(s)
    for bi, ss in groups.items():
        b = cfg['batches'][bi]; x = get(b['audio']); items = [(s['id'], s['text']) for s in ss]
        exp, own, T, ratio = char_times(items, P(b['asr']) if b.get('asr') else None, x); info[b['audio']] = round(ratio, 2) if b.get('asr') else 'rough'
        dur = len(x) / SR; rng = {}
        for i, k in enumerate(own): rng.setdefault(k, []).append(i)
        for k, (sid, _) in enumerate(items):
            ii = rng[k]; bounds[sid] = dict(audio=b['audio'], first=T[ii[0]][0], last=T[ii[-1]][1], ii=ii, T=T)
        for k in range(len(items)):
            bb = bounds[items[k][0]]
            bb['s_est'] = 0.0 if k == 0 else (bounds[items[k - 1][0]]['last'] + bb['first']) / 2
        for k in range(len(items)):
            bb = bounds[items[k][0]]; bb['e_est'] = bounds[items[k + 1][0]]['s_est'] if k + 1 < len(items) else dur
    for s in S:
        if s['id'] not in ovr: continue
        o = ovr[s['id']]; x = get(o['audio'])
        exp, own, T, ratio = char_times([(s['id'], s['text'])], P(o['asr']) if o.get('asr') else None, x); info[o['audio']] = round(ratio, 2) if o.get('asr') else 'rough'
        bounds[s['id']] = dict(audio=o['audio'], first=T[0][0], last=T[-1][1], ii=list(range(len(exp))), T=T, s_est=0.0, e_est=len(x) / SR)

    out = [np.zeros(int(pz['head'] * SR), np.float32)]; t = pz['head']; tl = []; cl = []
    for k, s in enumerate(S):
        b = bounds[s['id']]; x = raws[b['audio']]; name = b['audio']
        a0 = int(snap(name, b['s_est']) * SR) if b['s_est'] > 0 else 0
        b0 = int(snap(name, b['e_est']) * SR) if b['e_est'] < len(x) / SR - 0.01 else len(x)
        clip = x[a0:b0]; ts, te = trim(clip); clip = clip[ts:te]; off = (a0 + ts) / SR
        keep = cap_internal(clip, pz['cap']); cum = np.cumsum(keep)

        def map_t(raw_t):
            i = int((raw_t - off) * SR); i = max(0, min(len(clip) - 1, i))
            return ((cum[i] - 1) if keep[i] else cum[i]) / SR / pz['atempo']
        clip2 = fade(atempo(clip[keep], pz['atempo'])); st = t; dur = len(clip2) / SR
        out.append(clip2); t += dur
        clauses = []; pos = 0
        for c in split_clauses(s['text']):
            n = len(norm(c))
            if n == 0: continue
            sub = b['ii'][pos:pos + n]; pos += n
            if not sub: continue
            clauses.append([c, map_t(b['T'][sub[0]][0]), map_t(b['T'][sub[-1]][1])])
        if not clauses: clauses = [[s['text'], 0.0, dur]]
        for j, c in enumerate(clauses):
            c[1] = 0.0 if j == 0 else clauses[j - 1][2]; c[2] = max(c[2], c[1] + 0.05)
        clauses[-1][2] = dur
        tl.append(dict(id=s['id'], section=s['section'], text=s['text'], start=round(st, 3), end=round(t, 3)))
        cl.append(dict(id=s['id'], text=s['text'], start=round(st, 3), end=round(t, 3), clauses=[dict(text=c[0], start=round(st + c[1], 3), end=round(st + c[2], 3)) for c in clauses]))
        g = (pz['section'] if S[k + 1]['section'] != s['section'] else pz['sentence']) if k + 1 < len(S) else pz['tail']
        out.append(np.zeros(int(g * SR), np.float32)); t += g
    y = np.concatenate(out); total = len(y) / SR
    od = P(cfg.get('out', '.')); os.makedirs(os.path.join(od, 'voice'), exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'pcm_s16le', '-ar', '48000', os.path.join(od, 'voice/voice.wav')], input=y.tobytes(), check=True)
    secs = []; ids = []
    for x_ in tl:
        if x_['section'] not in ids: ids.append(x_['section'])
    for i, sec in enumerate(ids):
        ss = [x_ for x_ in tl if x_['section'] == sec]
        secs.append(dict(id=sec, start=0.0 if i == 0 else round(ss[0]['start'] - pz['sentence'], 3), speech_start=ss[0]['start'], speech_end=ss[-1]['end']))
    for i, x_ in enumerate(secs): x_['end'] = secs[i + 1]['start'] if i + 1 < len(secs) else round(total, 3)
    json.dump(dict(audio='voice/voice.wav', sample_rate=48000, duration=round(total, 3), pauses=pz, sections=secs, sentences=tl), open(os.path.join(od, 'timeline.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    json.dump(dict(duration=round(total, 3), sentences=cl), open(os.path.join(od, 'clauses.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('total', round(total, 2), 's  match', info)
    for x_ in secs: print(x_['id'], x_['start'], x_['end'], round(x_['end'] - x_['start'], 1))


def asr(audio, out, prompt=''):
    import mlx_whisper  # Apple Silicon；别的平台换成任意能出词级时间的 whisper 实现，输出同样的 segments[].words[] 结构
    r = mlx_whisper.transcribe(audio, path_or_hf_repo='mlx-community/whisper-large-v3-turbo', language='zh', word_timestamps=True, initial_prompt=prompt or None)
    json.dump(r, open(out, 'w', encoding='utf-8'), ensure_ascii=False)
    print(r['text'])


if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: print(__doc__); sys.exit(2)
    if a[0] == 'asr':
        pr = a[a.index('--prompt') + 1] if '--prompt' in a else ''
        asr(a[1], a[2], pr)
    else:
        build(a[0])
