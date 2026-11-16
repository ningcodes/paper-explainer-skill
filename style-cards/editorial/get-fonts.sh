#!/usr/bin/env bash
# 下载卡 ④ 报刊风用的三套字体到 style-cards/editorial/fonts/（不提交进仓库，约 43MB）。
# 全部是 SIL Open Font License 1.1（OFL），可以免费使用和随作品分发；许可原文一并下载到 fonts/。
#   Noto Serif SC（宋体，标题）   google/fonts  ofl/notoserifsc
#   Noto Sans SC（思源黑，正文）   google/fonts  ofl/notosanssc
#   Inter（数字，tnum 等宽）       rsms/inter v4.1
# 先从 GitHub raw 下载，失败再走 jsDelivr。
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p fonts
get() { # get <目标文件> <url1> [url2]
  local out="fonts/$1"; shift
  if [ -s "$out" ]; then echo "已有 $out"; return 0; fi
  for u in "$@"; do
    echo "下载 $out ← $u"
    if curl -fL --retry 2 --connect-timeout 20 -o "$out.part" "$u"; then mv "$out.part" "$out"; return 0; fi
  done
  rm -f "$out.part"; echo "下载失败：$out" >&2; return 1
}
GF=https://raw.githubusercontent.com/google/fonts/main/ofl
JF=https://cdn.jsdelivr.net/gh/google/fonts@main/ofl
get NotoSerifSC-Variable.ttf "$GF/notoserifsc/NotoSerifSC%5Bwght%5D.ttf" "$JF/notoserifsc/NotoSerifSC%5Bwght%5D.ttf"
get NotoSansSC.ttf           "$GF/notosanssc/NotoSansSC%5Bwght%5D.ttf"   "$JF/notosanssc/NotoSansSC%5Bwght%5D.ttf"
get InterVariable.woff2      "https://raw.githubusercontent.com/rsms/inter/v4.1/docs/font-files/InterVariable.woff2" "https://cdn.jsdelivr.net/gh/rsms/inter@v4.1/docs/font-files/InterVariable.woff2"
get OFL-NotoSerifSC.txt      "$GF/notoserifsc/OFL.txt" "$JF/notoserifsc/OFL.txt"
get OFL-NotoSansSC.txt       "$GF/notosanssc/OFL.txt"  "$JF/notosanssc/OFL.txt"
get LICENSE-Inter.txt        "https://raw.githubusercontent.com/rsms/inter/v4.1/LICENSE.txt" "https://cdn.jsdelivr.net/gh/rsms/inter@v4.1/LICENSE.txt"
ls -l fonts
echo "字体就绪：style-cards/editorial/fonts/"
