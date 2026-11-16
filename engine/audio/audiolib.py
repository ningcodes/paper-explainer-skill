"""音乐床 + 音效 + 混音。numpy 合成，不用任何有版权的素材。

用法（需要 numpy 和 ffmpeg；推荐 uv run --with numpy python engine/audio/audiolib.py ...）：
  python audiolib.py music  --voice voice.wav --dur 75.9 --out music.wav
  python audiolib.py sfx    --voice voice.wav --cues cues.json --dur 75.9 --out sfx.wav
  python audiolib.py mix    --voice voice.wav --music music.wav --sfx sfx.wav --out mix.wav

规范（skill/SKILL.md 第 10 节）：
- 音乐：暖 pad + 柔和琶音 + 低音，F 大调 Fmaj7–Dm7–Bbmaj7–C7，84 BPM；整体约 −28 LUFS；
  人声出现时压低约 7 dB（起音 60ms / 释放 450ms）；片头淡入、片尾淡出。
- 音效：whoosh / pop / paper / marker / tick，整体比人声低约 19 dB；GAIN whoosh 1.0 / pop 1.0 /
  tick 0.65(+6dB 补偿后) / marker 1.0 / paper 0.85。
- 混音：两遍 loudnorm I=-16:TP=-1.8:LRA=11（在 mix 里做），AAC 192k 由封装步骤做。
cues.json 格式：[{"t": 秒, "type": "whoosh|pop|paper|marker|tick", "gain": 可选倍数, "pan": 可选 -1..1}]
"""
import argparse, json, subprocess, wave, sys
import numpy as np

SR = 48000


def read_wav(path):
    w = wave.open(path)
    sr, n, ch, sw = w.getframerate(), w.getnframes(), w.getnchannels(), w.getsampwidth()
    raw = w.readframes(n)
    if sw == 2:
        x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    elif sw == 4:
        x = np.frombuffer(raw, dtype=np.int32).astype(np.float32) / 2147483648
    else:
        raise SystemExit(f"unsupported sample width {sw}")
    x = x.reshape(-1, ch)
    if sr != SR:  # 简单线性重采样（只用于包络和长度对齐）
        t = np.arange(int(len(x) * SR / sr)) * sr / SR
        x = np.stack([np.interp(t, np.arange(len(x)), x[:, c]) for c in range(ch)], 1).astype(np.float32)
    return x


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    if x.ndim == 1:
        x = x[:, None]
    w = wave.open(path, "wb")
    w.setnchannels(x.shape[1]); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype(np.int16).tobytes())
    w.close()


def voice_env(voice, n):
    """人声活动包络 0..1（10ms 帧，-40 dBFS 门限），长度 n。"""
    v = voice.mean(1)
    hop = SR // 100
    fr = len(v) // hop
    rms = np.sqrt((v[:fr * hop].reshape(fr, hop) ** 2).mean(1) + 1e-12)
    act = (20 * np.log10(rms + 1e-9) > -40).astype(np.float32)
    # attack 60ms / release 450ms 的一阶平滑
    out = np.zeros_like(act); g = 0.0
    a_up = 1 - np.exp(-1 / 6.0); a_dn = 1 - np.exp(-1 / 45.0)
    for i, s in enumerate(act):
        g += (s - g) * (a_up if s > g else a_dn)
        out[i] = g
    env = np.interp(np.arange(n) / hop, np.arange(len(out)), out, right=0.0)
    return env.astype(np.float32), rms[act > 0].mean() if act.sum() else 0.05


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def music(dur, voice_path, out):
    n = int(dur * SR)
    t = np.arange(n) / SR
    beat = 60 / 84
    bar = 4 * beat
    # F 大调：Fmaj7 – Dm7 – Bbmaj7 – C7，每个和弦 2 小节
    chords = [[53, 57, 60, 64], [50, 53, 57, 60], [46, 50, 53, 57], [48, 52, 55, 58]]
    roots = [41, 38, 46 - 12, 36]
    L = np.zeros(n, np.float32); R = np.zeros(n, np.float32)
    seg = 2 * bar
    rng = np.random.default_rng(7)
    k = 0
    while k * seg < dur + seg:
        ci = k % 4; s0 = k * seg
        i0 = int(s0 * SR); i1 = min(n, int((s0 + seg + 0.6) * SR))
        if i0 >= n: break
        tt = t[i0:i1] - s0
        # pad：每个音 3 个微失谐正弦 + 少量二次谐波，慢起慢收
        envp = np.minimum(1, tt / 0.9) * np.clip((seg + 0.6 - tt) / 0.9, 0, 1)
        for j, m in enumerate(chords[ci]):
            f = midi(m)
            for d, pan in ((-0.07, 0.3), (0.0, 0.5), (0.07, 0.7)):
                ff = f * 2 ** (d / 12)
                ph = rng.uniform(0, 6.28)
                w_ = np.sin(2 * np.pi * ff * tt + ph) + 0.18 * np.sin(4 * np.pi * ff * tt + ph)
                L[i0:i1] += 0.030 * envp * w_ * (1 - pan) * 2
                R[i0:i1] += 0.030 * envp * w_ * pan * 2
        # 低音：每小节第 1、3 拍
        for b in range(8):
            if b % 2: continue
            bs = s0 + b * beat; j0 = int(bs * SR)
            if j0 >= n: break
            j1 = min(n, j0 + int(beat * 1.8 * SR)); tb = t[j0:j1] - bs
            e = np.minimum(1, tb / 0.02) * np.exp(-tb * 1.6)
            sig = 0.11 * e * (np.sin(2 * np.pi * midi(roots[ci]) * tb) + 0.25 * np.sin(4 * np.pi * midi(roots[ci]) * tb))
            L[j0:j1] += sig; R[j0:j1] += sig
        # 琶音：八分音符，和弦音上行，柔和拨弦
        arp = chords[ci] + [chords[ci][0] + 12, chords[ci][2] + 12]
        for q in range(16):
            qs = s0 + q * beat / 2; j0 = int(qs * SR)
            if j0 >= n: break
            j1 = min(n, j0 + int(0.9 * SR)); tq = t[j0:j1] - qs
            m = arp[q % len(arp)] + 12
            e = np.minimum(1, tq / 0.008) * np.exp(-tq * 5.5)
            sig = 0.022 * e * (np.sin(2 * np.pi * midi(m) * tq) + 0.3 * np.sin(4 * np.pi * midi(m) * tq) * np.exp(-tq * 8))
            p = 0.35 + 0.3 * ((q * 5) % 7) / 6
            L[j0:j1] += sig * (1 - p) * 2; R[j0:j1] += sig * p * 2
        k += 1
    x = np.stack([L, R], 1)
    # 轻微低通（一阶），让音色更暖
    a = 0.35
    for c in range(2):
        y = x[:, c]; z = np.empty_like(y); acc = 0.0
        # 向量化一阶 IIR：用 lfilter 等价的 cumulative 近似，分块处理
        for i0 in range(0, len(y), SR):
            blk = y[i0:i0 + SR]
            ob = np.empty_like(blk)
            for i in range(len(blk)):
                acc += a * (blk[i] - acc); ob[i] = acc
            z[i0:i0 + SR] = ob
        x[:, c] = z
    # 目标约 −28 LUFS：用 RMS ≈ −30 dBFS 近似（之后整体 loudnorm 会再统一）
    rms = np.sqrt((x ** 2).mean() + 1e-12)
    x *= 10 ** (-30 / 20) / rms
    # ducking：人声出现时压低 7 dB
    if voice_path:
        env, _ = voice_env(read_wav(voice_path), n)
        x *= (10 ** (-7 * env / 20))[:, None]
    # 淡入 1.2s、淡出 2.0s
    fi = np.minimum(1, t / 1.2); fo = np.clip((dur - t) / 2.0, 0, 1)
    x *= (fi * fo)[:, None]
    write_wav(out, x)
    print("music ->", out, f"{dur:.2f}s")


# ---------------- SFX ----------------
def _bandnoise(n, rng, lo, hi):
    X = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    y = np.fft.irfft(X, n)
    return y / (np.abs(y).max() + 1e-9)


def sfx_whoosh(rng, pan=0.0):
    d = 0.55; n = int(d * SR); t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    # 扫频带通：用时变一阶低通 + 高通近似
    fc = 300 + 2600 * np.sin(np.pi * t / d) ** 2
    y = np.zeros(n); lp = 0.0; hp_prev = 0.0; lp2 = 0.0
    for i in range(n):
        a = 1 - np.exp(-2 * np.pi * fc[i] / SR)
        lp += a * (noise[i] - lp)
        lp2 += 0.02 * (lp - lp2)
        y[i] = lp - lp2
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.6
    y *= env
    p = np.clip(pan + 0.6 * (t / d - 0.5), -1, 1)
    return np.stack([y * (1 - p) / 2 * 2 ** 0.5, y * (1 + p) / 2 * 2 ** 0.5], 1)


def sfx_pop(rng, pan=0.0):
    d = 0.16; n = int(d * SR); t = np.arange(n) / SR
    f = 900 * np.exp(-t * 18) + 520
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t * 32) * np.minimum(1, t / 0.002)
    y += 0.25 * _bandnoise(n, rng, 2000, 6000) * np.exp(-t * 90)
    return np.stack([y * (1 - pan * 0.5), y * (1 + pan * 0.5)], 1)


def sfx_tick(rng, pan=0.0):
    d = 0.06; n = int(d * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 120) + 0.4 * _bandnoise(n, rng, 3000, 9000) * np.exp(-t * 200)
    return np.stack([y, y], 1)


def sfx_paper(rng, pan=0.0):
    d = 0.7; n = int(d * SR); t = np.arange(n) / SR
    y = _bandnoise(n, rng, 1500, 9000)
    grain = (np.abs(_bandnoise(n, rng, 8, 40)) ** 2)
    env = np.sin(np.pi * t / d) ** 1.2 * (0.4 + 0.6 * grain / (grain.max() + 1e-9))
    y *= env
    return np.stack([y * 0.9, y], 1)


def sfx_marker(rng, pan=0.0):
    d = 0.42; n = int(d * SR); t = np.arange(n) / SR
    y = _bandnoise(n, rng, 2500, 7500)
    strokes = 0.6 + 0.4 * np.sin(2 * np.pi * 14 * t) ** 2
    env = np.minimum(1, t / 0.03) * np.clip((d - t) / 0.08, 0, 1) * strokes
    y *= env
    return np.stack([y, y], 1)


SFX = {"whoosh": sfx_whoosh, "pop": sfx_pop, "tick": sfx_tick, "paper": sfx_paper, "marker": sfx_marker}
GAIN = {"whoosh": 1.0, "pop": 1.0, "tick": 0.65 * 2.0, "paper": 0.85, "marker": 1.0}


def sfx(dur, voice_path, cues_path, out):
    n = int(dur * SR)
    x = np.zeros((n, 2), np.float32)
    voice = read_wav(voice_path)
    _, vrms = voice_env(voice, n)
    target = vrms * 10 ** (-19 / 20)  # 比人声低约 19 dB（按各音效自身有声段 RMS 校准）
    cues = json.load(open(cues_path))
    rng = np.random.default_rng(11)
    for c in cues:
        kind = c["type"]
        if kind not in SFX: continue
        s = SFX[kind](rng, c.get("pan", 0.0)).astype(np.float32)
        a = np.abs(s).mean(1)
        active = s[a > a.max() * 0.1]
        r = np.sqrt((active ** 2).mean() + 1e-12)
        s *= target / r * GAIN[kind] * c.get("gain", 1.0)
        i0 = int(c["t"] * SR)
        if i0 >= n: continue
        i1 = min(n, i0 + len(s))
        x[i0:i1] += s[:i1 - i0]
    write_wav(out, x)
    print("sfx ->", out, len(cues), "cues")


def run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode:
        print(p.stderr[-3000:]); raise SystemExit(p.returncode)
    return p.stderr


def mix(voice, music_p, sfx_p, out, dur):
    pre = out + ".pre.wav"
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", voice, "-i", music_p, "-i", sfx_p, "-filter_complex",
         f"[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0,apad=whole_dur={dur}[v];"
         f"[1:a]aresample=48000,apad=whole_dur={dur}[m];[2:a]aresample=48000,apad=whole_dur={dur}[s];"
         f"[v][m][s]amix=inputs=3:normalize=0:duration=longest,atrim=0:{dur}[o]",
         "-map", "[o]", "-c:a", "pcm_s16le", pre])
    ln = "loudnorm=I=-16:TP=-1.8:LRA=11"
    err = run(["ffmpeg", "-y", "-hide_banner", "-i", pre, "-af", ln + ":print_format=json", "-f", "null", "-"])
    js = json.loads(err[err.rfind("{"):err.rfind("}") + 1])
    second = (f"{ln}:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}"
              f":measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", pre, "-af", second + ",aresample=48000", "-c:a", "pcm_s16le", out])
    print("mix ->", out, "pass1", js["input_i"], js["input_tp"])


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["music", "sfx", "mix"])
    ap.add_argument("--voice"); ap.add_argument("--cues"); ap.add_argument("--music"); ap.add_argument("--sfx")
    ap.add_argument("--dur", type=float); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    if a.cmd == "music": music(a.dur, a.voice, a.out)
    elif a.cmd == "sfx": sfx(a.dur, a.voice, a.cues, a.out)
    else: mix(a.voice, a.music, a.sfx, a.out, a.dur)
