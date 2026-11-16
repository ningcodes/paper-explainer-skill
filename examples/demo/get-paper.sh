#!/usr/bin/env bash
# 重新生成 demo 用的论文页（已提交，一般不用跑）：ReAct（arXiv:2210.03629v3，CC BY 4.0）第 1 页
#   paper/react-p1.jpg         pdftoppm 300dpi（推近 ≈4 倍不糊）
#   paper/react-p1-words.json  词框（pt），给 Kit.pdfPhrase 找句、划荧光笔
# 依赖：curl、poppler（pdftoppm）、uv（临时装 pymupdf 取词框）。
set -euo pipefail
cd "$(dirname "$0")"
tmp=$(mktemp -d)
curl -fL -o "$tmp/react.pdf" https://arxiv.org/pdf/2210.03629v3
pdftoppm -f 1 -l 1 -r 300 -jpeg -jpegopt quality=85 -singlefile "$tmp/react.pdf" paper/react-p1
cat > "$tmp/words.py" <<'PY'
import sys, json, unicodedata, pymupdf
pg = pymupdf.open(sys.argv[1])[0]
words = [[round(x0, 2), round(y0, 2), round(x1 - x0, 2), round(y1 - y0, 2), unicodedata.normalize('NFKC', w)] for x0, y0, x1, y1, w, *_ in pg.get_text('words')]
json.dump({'source': 'arXiv:2210.03629v3 page 1', 'license': 'CC BY 4.0', 'units': 'pt', 'width': pg.rect.width, 'height': pg.rect.height, 'words': words}, open(sys.argv[2], 'w'), ensure_ascii=False)
print(len(words), 'words')
PY
uv run --quiet --with pymupdf python -I "$tmp/words.py" "$tmp/react.pdf" paper/react-p1-words.json
rm -rf "$tmp"
