# demo：一页读懂 ReAct（约 23 秒，一章，无配音）

演示整套镜头语言的最小例子，不需要任何 API key、不需要配音：
- 章首整页翻报纸（第一章没有上一章，`renderPrev` 自己画一张报头封面当「上一页」）
- 论文第 1 页当实体纸（阴影、−1.5° 倾斜）→ 转正推近约 4 倍到摘要
- 黄色荧光笔跟「口播」从左往右扫原句，酒红圈注「interleaved manner」
- 实体纸缩成右上角小地图，大画布三块（想一步 → 做一步 → 看结果），下一站骨架提前铺好，镜头平移
- 顶部栏目进度条（导读 / 思路）、麦色字幕条、来源行
- 时间轴是 `mk_dummy_timeline.py` 从 `口播.md` 估出来的占位（0.2 秒 / 字）

## 渲染
见仓库根目录 `AGENTS.md` 第 3 步。地址：`http://127.0.0.1:8771/engine/common/shell-wc.html?ch=examples/demo/ch01`，帧数应为 `ceil(22.85×30) = 686`。

## 文件
| 文件 | 说明 |
|---|---|
| `口播.md` | 示例口播（我们写的） |
| `timeline.json` | 占位时间轴：`python3 engine/tools/mk_dummy_timeline.py examples/demo/口播.md examples/demo/timeline.json` |
| `film.json` | 章节顺序、进度条栏目 |
| `ch01/chapter.json`、`ch01/scene.js` | 章节配置和画面（开头注释是镜头规划） |
| `paper/react-p1.jpg` | 论文第 1 页，300dpi |
| `paper/react-p1-words.json` | 第 1 页词框（pt） |
| `get-paper.sh` | 重新下载、渲染这一页和词框 |

## 论文页的出处与许可
`paper/react-p1.jpg` 和 `paper/react-p1-words.json` 取自：

> Shunyu Yao, Jeffrey Zhao, Dian Yu, Nan Du, Izhak Shafran, Karthik Narasimhan, Yuan Cao. **ReAct: Synergizing Reasoning and Acting in Language Models.** ICLR 2023. arXiv:2210.03629v3, https://arxiv.org/abs/2210.03629

该论文在 arXiv 上以 **CC BY 4.0**（https://creativecommons.org/licenses/by/4.0/）发布。本仓库按原样使用第 1 页的渲染图（转为 300dpi JPEG）并提取了词框坐标，未改动内容。本仓库的 MIT 许可不覆盖这两个文件。
