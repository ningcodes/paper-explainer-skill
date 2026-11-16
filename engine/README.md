# engine：画布外壳、风格卡 ④、渲染与音频

所有路径相对仓库根目录。本机服务 `node engine/tools/serve.mjs 8771` 把仓库根挂在 `http://127.0.0.1:8771/`。

**章节只画内容层。** 进度条、字幕、来源行、章节开头翻报纸都由 `common/chrome.js` 统一画。

## 文件
| 文件 | 作用 |
|---|---|
| `common/style.js` | `window.ED`：卡 ④ 色板 `C`；字体加载 `loadFonts(base)`（`base/fonts/` 下的 Noto Serif SC / Noto Sans SC / Inter，本地 FontFace，不走系统回退）；字体回退检查 `fontCheck`；缓动 `eOQ eOC eIC eIO`；`pr` 进度、`kf` 关键帧、`lr` 矩形插值、`mulberry` 种子随机；文字和线条的标志动作 |
| `common/paper.js` | `window.Paper`：截图实体纸（推进 / 拉远、翻页、阴影）、黄色荧光笔、酒红批注 |
| `common/kit.js` | `window.Kit`：实体纸视窗 `view / kview / lv / V`（适合 PDF 页 + 词框）、`pdfPhrase` 找句、`sweep` 黄笔、`ring` 圈注、卡片、Agent 方块、条形图、源码卡、勾叉、箭头、`pop` 弹出；`mother / chapterIntro` 是某期母图的参考写法 |
| `common/chrome.js` | `window.Chrome`：时间轴、锚词、栏目导航进度条、字幕、来源行、章节翻报纸、外壳 `render(t)` |
| `common/shell-wc.html` | 渲染页：逐帧 `render(t)` → WebCodecs（avc1.640033，20Mbps，prefer-hardware）→ mp4-muxer → 浏览器下载 |
| `common/assemble.mjs` | 全片拼接：逐帧对齐 concat、音乐床 + 音效、混音、封装、<30MB 轻量版 |
| `tools/serve.mjs` | 本机静态服务（127.0.0.1） |
| `tools/prep_render.mjs` | 渲染前准备（headless，只取静帧和数据）：各章 cues.json、字体回退检查、下一章翻页底图 prev.png |
| `tools/capture.mjs` | 截网页原文（3×）+ 短语词框 regions.json |
| `tools/mk_dummy_timeline.py` | 口播 md → 占位 timeline.json（没配音先做画面） |
| `voice/align.py` | 任意 TTS 原声 → voice.wav + timeline.json + clauses.json |
| `audio/audiolib.py` | numpy 合成音乐床、音效，两遍 loudnorm 混音 |

## 工程目录
```
<工程>/                     例：examples/demo、examples/always-on/full
  film.json                 全片配置：chapters 顺序、nav 进度条栏目、numfix、outro 结尾署名、name
  timeline.json             全片唯一时间源（align.py 或 mk_dummy_timeline.py 生成）
  clauses.json              可选：分句时间（锚词更准）
  voice/voice.wav           配音（不提交）
  chNN-xxx/
    chapter.json            章节配置
    scene.js                定义 window.Chapter
    prev.png                flipIn 时的上一章末帧（prep_render.mjs 生成，不提交）
    build/                  video.mp4、cues.json（不提交）
```

`film.json`：
```json
{
  "name": "成片文件名",
  "chapters": ["ch00-01", "ch02"],
  "nav": [ { "n": "01", "name": "导读", "sections": ["00", "01"] }, { "n": "", "name": "收尾", "sections": ["09"] } ],
  "numfix": [["第一层", "第1层"]],
  "outro": { "sign": "我是 <你的名字>", "follow": "关注我，<一句关注语>" }
}
```

`chapter.json`：
```json
{
  "id": "ch02",
  "timeline": "timeline.json",          // 相对工程目录
  "clauses": "clauses.json",            // 可选
  "sections": ["02"],                   // 本章包含 timeline 里的哪些段号
  "tail": 0,                            // 必须为 0：章节时长 = 本章 section 起止，拼接时逐帧对齐
  "flipIn": true,                       // 章首整页翻报纸（0.6s）；第一章用 false，或实现 renderPrev
  "numfix": [["四百一十三个", "413个"]], // 可选：本章字幕的中文数字替换表
  "nav": [...],                         // 可选：覆盖 film.json 的 nav
  "assets": { "img": { "fig": "source/fig1@3x.png" }, "json": { "reg": "source/regions.json" } }   // 相对工程目录
}
```
时间：`tLocal = 全片时间 − 本章第一个 section 的 start`；`T = 本章最后一个 section 的 end − start`。

## 接口：`window.Chapter`
```js
window.Chapter = {
  sources: [[tLocal, '来源行文字'], ...],   // 底部灰色来源行，按时间切换
  texts: '本章所有自绘中文',                 // 只给字体回退检查用
  async init(data) { ... },                  // 算锚点、登记音效 data.cue(t, type, gain?, pan?)
  renderContent(ctx, tLocal, data) { ... },  // 每帧调用；必须是 tLocal 的纯函数；不要清屏，背景已铺好
  renderPrev(ctx, data) { ... }              // 可选：flipIn 且没有 prev.png 时，画「上一页」
};
```
`data`：`T`；`sentences`（含 `clauses`，局部秒）；`A(id, 子串, frac=0)` 锚词时间；`st(id)` / `en(id)` 句子起止；`img` / `json` 素材；`cue(t, type)`（whoosh | pop | paper | marker | tick）；`t0` 本章在全片的起点；`root` 工程目录 URL。

**切点只能从锚词算，不手写秒数。**

## 坐标与安全区（1920×1080）
- y 0–64：只给进度条。片内元素上边界 ≥ y80，常规内容放在 **y 136–930、左右 96px** 内。
- y 900–940：来源行。y 952–1040：字幕条。
- 要让人读的字 ≥28px；来源行、「示意」可以 26px；承载信息的字用墨色 `C.ink`，灰色 `C.ink2` 只给元数据。
- 内容铺满约 70%；任何一帧（含变形中间帧）半屏空着不超过 2 秒。镜头主标题 92px；第 0 帧大标题 132px。

## 常用函数
- 文字：`ED.text(str,x,y,font,col,align,alpha)`、`tw`、`vtext`；字体 `F(weight,px,SERIF|SANS|INTER)`
- 标志动作：`maskLine(str,x,y,font,col,size,pIn,pOut)` 遮罩上推；`wipeText` 从左擦出；`growLine` 细线长出；`strokeCW(rect,p,col,lw)` 顺时针描边；`underlineSweep` 酒红下划线；`kicker(x,y,str,col,p)` 栏目标签
- 色板 `C`：paper #FFF1E5、ink #33302E、ink2 #66605C、rule #CCC1B7、claret #990F3D、oxford #0F5499、teal #0D7680、gray #B9AFA6、wheat #F2DFCE

## 原文实体纸
网页截图（`tools/capture.mjs`，3×，regions.json 词框单位 CSS px）：
```js
const rect = Paper.push(t, t0, 0.8, from, to);                     // 推进：from → to 两个屏幕矩形
Paper.drawPaper({ img: data.img.fig, rect, rot: -1.5, lift: 0.6 });
const map = Paper.mapper(rect, regionCssWidth);
Paper.highlights(t, [[phrases.def, data.A('s01-2', '从经历'), 0.9]], map);   // 黄色荧光笔
Paper.claretUnderline(phrases.def, map, p);                        // 酒红批注
```
PDF 页（pdftoppm 300dpi + 词框 pt，见 `examples/demo`）：
```js
const v = Kit.lv(Kit.V(1.0, 306, 396, 1150, 112, 624, 808), Kit.V(4.05, 300, 322, 96, 150, 1728, 700), p);   // k = 屏幕像素 / pt
Kit.view(img, 300 / 72, v, { rot, over: map => { Kit.sweep(Kit.pdfPhrase(words, 'some phrase'), map, pHL); } });
```
规则：原文清晰停留 ≥3 秒（不算推拉）；推近不超过截图分辨率（k ≤ dpr）；黄色只用在原文上，我们的批注一律用酒红。

## 渲染流程（唯一路径）
```sh
node engine/tools/serve.mjs 8771
node engine/tools/prep_render.mjs --project <工程> --port 8771      # cues、字体检查、prev.png
# 本机 Chrome 新标签：http://127.0.0.1:8771/engine/common/shell-wc.html?ch=<工程>/<章>
#   控制台：await probe()              → webglRenderer 必须是真 GPU（software:false）
#           startRender({to:10, download:false}); 等 __prog.state==='done' → __prog.msPerFrame
#           startRender({name:'<章>.mp4'})  → 下载；一个标签只下载一次
cp ~/Downloads/<章>.mp4 <工程>/<章>/build/video.mp4
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 <工程>/<章>/build/video.mp4   # = ceil(T×30)
node engine/common/assemble.mjs --project <工程>
```
shell-wc.html 参数：`ch`（章节目录）、`root`（工程目录，默认 ch 的上一级）、`fonts`（字体目录，默认 `style-cards/editorial`）、`nochrome=1`（不画固定元素）。
