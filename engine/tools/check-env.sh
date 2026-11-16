#!/usr/bin/env bash
# 环境检查：Node ≥18、npm、Google Chrome、ffmpeg/ffprobe、python3、uv（音频和配音对齐用）、字体是否已下载。
cd "$(dirname "$0")/../.."
ok=1
chk() { if command -v "$1" >/dev/null 2>&1; then printf '  %-9s %s\n' "$1" "$($2 2>&1 | head -1)"; else printf '  %-9s 缺失  %s\n' "$1" "$3"; ok=0; fi; }
echo "== 必需"
chk node "node -v" "安装 Node 18+（如 brew install node）"
chk npm "npm -v" ""
chk ffmpeg "ffmpeg -version" "安装 ffmpeg（如 brew install ffmpeg）"
chk ffprobe "ffprobe -version" ""
chk python3 "python3 --version" ""
if [ "$(uname)" = Darwin ]; then CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; else CH="$(command -v google-chrome || command -v google-chrome-stable || true)"; fi
if [ -n "$CH" ] && [ -x "$CH" ]; then echo "  chrome    $("$CH" --version 2>/dev/null)"; else echo "  chrome    缺失  安装 Google Chrome（渲染和 headless 抽帧都用它）"; ok=0; fi
NV=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0); [ "$NV" -ge 18 ] 2>/dev/null || { echo "  node 版本需 ≥18"; ok=0; }
echo "== 推荐"
chk uv "uv --version" "音乐音效、配音对齐用（https://docs.astral.sh/uv/）"
echo "== 仓库状态"
[ -d node_modules/playwright ] && echo "  playwright 已安装" || echo "  playwright 未安装：npm install"
for f in NotoSerifSC-Variable.ttf NotoSansSC.ttf InterVariable.woff2; do [ -s "style-cards/editorial/fonts/$f" ] && echo "  字体 $f ok" || echo "  字体 $f 未下载：bash style-cards/editorial/get-fonts.sh"; done
[ $ok = 1 ] && echo "必需项齐全" || { echo "有必需项缺失"; exit 1; }
