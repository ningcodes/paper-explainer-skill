# 风格卡 ④ 报刊数据新闻（editorial）

参考：FT Visual Journalism、Bloomberg、NYT Upshot。适合论文解读、硬数字、前后对比、带「打折扣」注释的结论。规则全文见 `skill/SKILL.md` 第 8 节；实现在 `engine/common/style.js`（色板、字体、标志动作）和 `engine/common/chrome.js`（栏目导航进度条、麦色字幕条、来源行、翻报纸转场）。

## 字体（不随仓库提交）
```sh
bash style-cards/editorial/get-fonts.sh      # → style-cards/editorial/fonts/，约 43MB
```
| 文件 | 字体 | 用途 | 许可 |
|---|---|---|---|
| `NotoSerifSC-Variable.ttf` | Noto Serif SC（可变字重） | 标题、字幕、栏目名 | SIL OFL 1.1 |
| `NotoSansSC.ttf` | Noto Sans SC（可变字重） | 正文、标签、来源行 | SIL OFL 1.1 |
| `InterVariable.woff2` | Inter 4.1 | 数字、英文 | SIL OFL 1.1 |

来源：Google Fonts 仓库（github.com/google/fonts，`ofl/notoserifsc`、`ofl/notosanssc`）和 rsms/inter v4.1；下载失败时走 jsDelivr 镜像。许可原文随字体下载到 `fonts/`。OFL 允许免费使用、嵌入和随作品分发，但不允许单独出售字体文件。

渲染页用 FontFace 从本地加载这三套字体，不走系统回退；`prep_render.mjs` 会报告哪些字落到了系统字体（应为空）。
