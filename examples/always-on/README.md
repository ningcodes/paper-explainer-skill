# Always-on 示例：一期已发布片的完整工程（不含原文、原图和配音）

这是一期 7 分 18 秒的单篇拆解（Anthropic《Building always-on agents》，2026-11-13）当时的全部制作文件，按本 skill 的流程做：口播 → 盲测 + 核查 → 作者审 → 配音 → 7 章并行 → 本机 Chrome WebCodecs 渲染 → 独立审片。

## 有什么
| 文件 | 说明 |
|---|---|
| `逻辑链与问题链.md` | 写稿前的逻辑链和观众问题链 |
| `口播.md`、`口播-纯稿.txt` | 锁定版口播（结尾署名改成了通用的「我是作者」） |
| `镜头规划与制作简报.md` | 章节划分、每章主画面、要钻进的原文、风格和渲染约定 |
| `MOTHER.md` | 全片母图（五格）的规格和代码，各章原样复制 |
| `full/film.json` | 章节顺序、7 栏进度条、结尾署名配置 |
| `full/timeline.json`、`full/clauses.json` | 真实配音对齐出的时间轴和分句时间（配音 wav 不分发） |
| `full/chNN/chapter.json`、`scene.js` | 7 章的画面代码 |
| `source/g*-regions.json` | 原文截图的区域和短语词框坐标（只有坐标，没有原文） |
| `tools/make_placeholders.py` | 生成同尺寸灰底占位图 |
| `tools/fetch_sources.mjs` | 自己从原文页取真图（仅供个人学习复现） |

## 没有什么，为什么
- **原文和原图**（文章网页截图、7 张配图及 gif 帧）：版权属于原作者，不随仓库分发。`source/` 下的图要么用占位图，要么自己取。
- **配音 wav**：用商用 TTS 生成，不分发。没有配音时拼接会用静音代替，音乐和音效照常。
- **成片 mp4**、头像、封面：不分发。

## 跑起来
```sh
bash style-cards/editorial/get-fonts.sh
uv run --with pillow python examples/always-on/tools/make_placeholders.py      # 占位图（约 7MB，不提交）
node engine/tools/serve.mjs 8771
node engine/tools/prep_render.mjs --project examples/always-on/full --port 8771  # 各章 cues + prev.png
# 本机 Chrome：http://127.0.0.1:8771/engine/common/shell-wc.html?ch=examples/always-on/full/ch02
```
画面里所有原文图的位置会显示「原文截图位：请自行截取 https://claude.com/resources 对应文章」。

## 换成真图（可选，自己用）
```sh
node examples/always-on/tools/fetch_sources.mjs
```
按 `source/g*-regions.json` 记录的区域重新截原文网页（3×），并下载文章配图、用 ffmpeg 抽 gif 帧。原网页改版后区域可能对不上，需要用 `engine/tools/capture.mjs` 重新定位。取到的图已在 `.gitignore` 里，不要提交或再分发。
