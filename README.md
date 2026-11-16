# 论文讲解视频 skill · paper-explainer-skill

An agent skill plus a small rendering engine that turns a paper (or a technical article, or several papers) into a 6–8 minute horizontal Chinese explainer video: a locked voice-over is the single time source, every frame is a pure `render(t)` canvas function, the camera zooms into the real paper page, and the final video is encoded by your own Chrome with WebCodecs on the GPU.

一个 agent skill 加一套小渲染引擎：把一篇论文（或一篇技术长文、几篇论文的综述）做成 6–8 分钟横屏中文讲解视频。口播先锁、当唯一时间源；每一帧都是 `render(t)` 画布纯函数；镜头推进到真实论文页；成片由你本机 Chrome 用 WebCodecs 走 GPU 编码。作者在小红书发布的论文讲解视频用的就是这套流程。

> **Using a coding agent?** Hand it this repository and point it at [AGENTS.md](AGENTS.md): step-by-step setup with checks, and the places where it must stop and ask you.
> 交给 Claude Code / Codex：让它读 [AGENTS.md](AGENTS.md)，照着装、照着验证；需要你本人做的地方（审口播、生成配音、看片）它会停下来提示。

**How it differs from Paper2Video (NUS Show Lab) / 和 Paper2Video 的区别**：Paper2Video generates academic-presentation videos (slides, talking head, cursor) from a paper automatically; this repo is an editorial workflow for explainer videos aimed at a general technical audience, with human review gates and hand-directed camera work.
Paper2Video 从论文自动生成学术报告式视频（幻灯片 + 讲者 + 光标）；这里是给大众技术观众的讲解视频编辑流程，有人工审稿关口，镜头由 agent 按规则逐镜编排。

## How it works / 架构

```
 skill/SKILL.md (rules)                                   engine/ (code)
 ─────────────────────                                    ─────────────────────────────────────────────
 0 选题 → 1 论文卡 → 2–3 钩子 + 问题链 → 4 口播
        → 5–6 盲测 + 事实核查（独立 agent）
        → 7 作者审稿 ──────────── human gate
 9 任意 TTS ─────────────────────────────────────────▶  voice/align.py ──▶ timeline.json  (唯一时间源)
 8 镜头规划表 ── human gate                                     │
 11 按章并行写 scene.js  ── window.Chapter.renderContent(t) ◀──┘  anchors: data.A('s02-3','子串')
                                    │
              common/chrome.js（进度条 · 字幕 · 来源行 · 翻报纸）+ style.js（风格卡 ④）+ paper.js / kit.js（实体纸）
                                    │
              common/shell-wc.html ── 本机 Chrome：render(t) → WebCodecs (GPU) → mp4
                                    │
              common/assemble.mjs ── concat + audio/audiolib.py（合成音乐床 + 音效 + loudnorm）
 12 独立审片 ── human gate
```

## Quick start / 3 步快速开始

Needs Node ≥ 18, Google Chrome with GPU acceleration, ffmpeg. No API keys. 需要 Node ≥ 18、开了硬件加速的 Chrome、ffmpeg；不需要任何 API key。

```sh
# 1. install + fonts (OFL, ~43MB, not committed)
npm install && bash style-cards/editorial/get-fonts.sh
# 2. serve the repo locally and prepare the demo
node engine/tools/serve.mjs 8771 &
node engine/tools/prep_render.mjs --project examples/demo --port 8771
# 3. open in Chrome, then click 1 检测 GPU → 2 测 10 秒 → 3 渲染并下载
open "http://127.0.0.1:8771/engine/common/shell-wc.html?ch=examples/demo/ch01"
```
The demo is a 23-second chapter: page-turn transition, a real arXiv page (ReAct, CC BY 4.0) as a physical sheet, zoom into the abstract, yellow highlighter following the voice-over, claret annotation, a two-stop big-canvas pan, the progress bar. Expect 686 frames at 1920×1080.
demo 是一章 23 秒：章首翻报纸、真实 arXiv 论文页当实体纸、推近摘要、黄色荧光笔跟口播、酒红批注、大画布两站平移、顶部进度条。应得 686 帧。

Make your own: in Claude Code, `cp -R skill ~/.claude/skills/paper-explainer`, then say 「把 arXiv 2210.03629 做成讲解视频」.
做自己的片：把 skill 装进 Claude Code 后说「把 arXiv XXXX 做成讲解视频」，agent 会按流程走，到审口播、配音、看镜头规划表、看片这些地方停下来等你。

## Repository / 目录

| Path | What |
|---|---|
| `skill/SKILL.md` | The skill (Chinese): hard rules, steps 0–12, style card, camera language, audio, rendering / 流程和硬规则 |
| `skill/references/` | paper card, question chain, voice-over self-check, shot plan, listen-test & fact-check briefs, review checklist, pitfalls / 模板和清单 |
| `engine/common/` | `style.js` `paper.js` `kit.js` `chrome.js` `shell-wc.html` `assemble.mjs` — interface in [engine/README.md](engine/README.md) |
| `engine/tools/` | local server, headless prep, web capture, dummy timeline, env check |
| `engine/voice/align.py` | any TTS audio → `voice.wav` + `timeline.json` + `clauses.json` |
| `engine/audio/audiolib.py` | numpy-synthesized music bed, SFX, two-pass loudnorm mix |
| `style-cards/editorial/` | style card ④ (FT-like editorial) notes + font downloader |
| `examples/demo/` | 23 s runnable demo / 可直接渲的最小示例 |
| `examples/always-on/` | a complete published episode's project files (script, shot plan, 7 chapters, real timeline) without third-party images or voice / 一期完整示例（不含原文图和配音） |

## Acknowledgements / 致谢

- Fonts: Noto Serif SC, Noto Sans SC (Google, SIL OFL 1.1), Inter (Rasmus Andersson, SIL OFL 1.1).
- [mp4-muxer](https://github.com/Vanilagy/mp4-muxer) (MIT), loaded from jsDelivr.
- Demo page: Yao et al., *ReAct: Synergizing Reasoning and Acting in Language Models*, ICLR 2023, arXiv:2210.03629, CC BY 4.0.
- Camera-language references: 3Blue1Brown (continuous morphing), Kurzgesagt (big-canvas pans), FT Visual Journalism (editorial style).

## License / 许可

MIT for the code and docs written for this repository ([LICENSE](LICENSE)). Fonts, the demo paper page, mp4-muxer and anything you capture yourself keep their own licenses. Do not redistribute third-party article screenshots or TTS voices you are not licensed to share.
MIT 只覆盖本仓库自己写的代码和文档；字体、示例论文页、第三方库、你自己截取的原文各有许可。没有授权的原文截图和配音不要再分发。
