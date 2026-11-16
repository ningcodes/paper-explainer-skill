# AGENTS.md：给 coding agent 的逐步手册

你在帮面前这个人装好「论文讲解视频 skill」，先跑通 demo，再带他做自己的第一条片。从上往下做；每步跑检查、和「期望」对照，检查没过就停下告诉用户，不要跳过。标 **【人】** 的步骤需要用户本人：停下，说清要他做什么，等他说「好了」再继续。

基本规则：
- 所有命令在仓库根目录跑。不要提交 `build/`、配音、成片、字体、第三方原文图（`.gitignore` 已排除）。
- 下载东西前先说清来源和大小（字体约 43MB、npm 依赖约 10MB）。
- 不要替用户登录任何网站、填账号、接受条款。浏览器只开自己的新标签，不碰用户正在看的标签。
- 渲染只走本机 Chrome + WebCodecs 这一条路；检测到软件渲染就停下报告，不换别的渲染方式。

## 0. 环境
```sh
bash engine/tools/check-env.sh
```
期望最后一行「必需项齐全」：Node ≥ 18、ffmpeg / ffprobe、python3、Google Chrome。缺 Chrome / Node / ffmpeg → **【人】** 请用户安装（macOS 可 `brew install node ffmpeg`，Chrome 从官网装），问过再装。`uv` 是推荐项（音乐音效、配音对齐用），没有的话 demo 画面照样能渲。

## 1. 装依赖
```sh
npm install
```
期望：`node_modules/playwright` 存在。只用来 headless 抽静帧和截网页原文，用的是本机 Chrome（`channel: 'chrome'`），不需要 `npx playwright install`。

## 2. 拉字体
```sh
bash style-cards/editorial/get-fonts.sh
```
期望：`style-cards/editorial/fonts/` 下有 `NotoSerifSC-Variable.ttf`（约 25MB）、`NotoSansSC.ttf`（约 17MB）、`InterVariable.woff2`（约 0.3MB）和三份许可文本。都是 SIL OFL 1.1。

## 3. 渲染 demo（约 23 秒，一章，无配音）
```sh
node engine/tools/serve.mjs 8771          # 后台跑；端口被占用就换一个，下面的地址跟着换
node engine/tools/prep_render.mjs --project examples/demo --port 8771
```
期望 prep_render 打印 `ch01 start 0 end 22.85 need 686 T 22.85 renderFrames 686 cues 10 fontMissing {}`。`fontMissing` 不为空 → 回第 2 步。

然后在**本机 Chrome**（要有 GPU 的那台）开一个**新标签**：
```
http://127.0.0.1:8771/engine/common/shell-wc.html?ch=examples/demo/ch01
```
页面底下显示 `ready T=22.85` 后：
1. **检测 GPU**：点「1 检测 GPU」，或在控制台 `await probe()`。期望 `webglRenderer` 是真显卡（如 `ANGLE (Apple, ANGLE Metal Renderer: Apple M4, ...)`、NVIDIA、AMD），`prefer-hardware: true`，`software: false`。**是 SwiftShader / llvmpipe 等软件渲染就停下**，告诉用户打开 Chrome 的「使用图形加速」或换一台有 GPU 的电脑。
2. **测 10 秒**：点「2 测 10 秒」，或 `startRender({ to: 10, download: false })` 后轮询 `window.__prog`，直到 `state === 'done'`，记下 `msPerFrame`（GPU 上一般 5–20 ms/帧）。
3. **渲染并下载**：同一个标签点「3 渲染并下载」，或 `startRender({ name: 'demo.mp4' })`。等 `__prog.state === 'done'`，浏览器把 `demo.mp4` / `ch01.mp4` 下到下载目录。**一个标签只能下载一次**（Chrome 会静默拦截第二次），渲完关掉这个标签。

没有浏览器自动化工具的 agent → **【人】** 请用户在 Chrome 里打开上面的地址，依次点三个按钮，把页面上显示的结果（GPU 名字、ms/帧）告诉你。

核帧数（把下载的文件 cp 到仓库外或 `examples/demo/ch01/build/video.mp4`，用 cp 不要 mv）：
```sh
mkdir -p examples/demo/ch01/build && cp ~/Downloads/ch01.mp4 examples/demo/ch01/build/video.mp4
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames,width,height -of csv=p=0 examples/demo/ch01/build/video.mp4
```
期望 `1920,1080,686`（= ceil(22.85 × 30)）。

可选：加上音乐床和音效（需要 uv，约 1–2 分钟）：
```sh
node engine/common/assemble.mjs --project examples/demo
```
期望打印 `video frames 686 expected 686`，输出 `examples/demo/build/demo.mp4` 和 `demo-lite.mp4`；没有配音时人声轨是静音，响度由音乐决定。

## 4. 看一期完整示例（可选）
`examples/always-on/` 是一期 7 分多钟已发布片的全部工程（口播、镜头规划、母图、7 章 scene.js、真实时间轴），不含原文图和配音。读 `examples/always-on/README.md`：
```sh
uv run --with pillow python examples/always-on/tools/make_placeholders.py
node engine/tools/prep_render.mjs --project examples/always-on/full --port 8771
```
然后在 Chrome 里打开 `shell-wc.html?ch=examples/always-on/full/ch02` 拖动底部滑条看画面（原文图位置是灰色占位）。

## 5. 安装 skill
Claude Code：
```sh
mkdir -p ~/.claude/skills && cp -R skill ~/.claude/skills/paper-explainer
```
或者留在仓库里用：在这个仓库里开 Claude Code / Codex，告诉它「先读 skill/SKILL.md」。其他 agent：把 `skill/SKILL.md` 当系统说明，`skill/references/` 按需读。

## 6. 做自己的第一条片
用户说「把 arXiv XXXX.XXXXX 做成讲解视频」「一次讲完 X」「paper explainer」之类，就加载 `skill/SKILL.md` 全文，照第 0–12 步做。新建一个工程目录（例如 `films/<主题>/`，结构见 `engine/README.md`），不要改 `examples/`。

到下面这些地方**必须停下**，说清要用户做什么、给他看什么文件，等他确认：
1. **【人】选题**：给出读者问题、主张、证据、交付四件事，用户点头再精读。
2. **【人】审口播**（SKILL 第 7 节）：先给一页逻辑链，再分段给口播（一句一行），附盲测分数和核查 must-fix 处理情况。用户没确认，不做分镜、不配音。
3. **【人】生成配音**（第 9 节）：除非用户已经告诉你用哪个 TTS、并且你有权限调用，否则请用户自己用他的 TTS 按段生成，把 mp3 / wav 放到 `<工程>/voice/`。拿到后写 `voice.json`，跑 `uv run --with numpy python engine/voice/align.py <工程>/voice/voice.json`（有识别结果更准：`align.py asr`）。没配音也可以先用 `mk_dummy_timeline.py` 出占位时间轴做画面。
4. **【人】看镜头规划表**（第 8 节，`skill/references/shot-plan.md`）：用户看过再写 scene.js。
5. **【人】看样片**：钩子 + 第一次钻进论文、大画布前两站各一段，完整合成后给用户看、听音量。
6. **【人】看成片**：先由一个没参与制作的 agent 按 `skill/references/review-checklist.md` 审片，审片报告和成片一起交给用户。
7. **【人】发布**：只由用户自己发。

## 常见问题
- 页面显示 `ERROR scene.js not found`：`ch=` 路径要相对仓库根目录，且服务是从仓库根目录起的。
- 中文显示成方块 / 系统字体：字体没下载，或 `fonts=` 参数指错。
- 第二次点下载没反应：同一标签只能下载一次，开新标签。
- `prep_render.mjs` 报 `browserType.launch: Chromium distribution 'chrome' is not found`：本机没装 Google Chrome。
- `pdftotext -bbox` 崩溃：用 `examples/demo/get-paper.sh` 里的 PyMuPDF 办法取词框。
