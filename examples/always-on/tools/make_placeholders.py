"""生成 Always-on 示例的原文占位图：和原图同尺寸、同文件名的灰底图，标「原文截图位」。
原文是 Anthropic 的文章和配图，版权不属于本仓库，所以不分发；占位图让示例章节照样能渲。
想看真图：照 examples/always-on/README.md「换成真图」一节，自己从原文页截取（fetch_sources.mjs）。
用法：uv run --with pillow python examples/always-on/tools/make_placeholders.py   （需要先跑 style-cards/editorial/get-fonts.sh）
"""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'source')
FONT = os.path.join(HERE, '..', '..', '..', 'style-cards', 'editorial', 'fonts', 'NotoSansSC.ttf')
URL = 'https://claude.com/resources'
# 文件名 → (宽, 高, 说明)；尺寸 = 原图像素（@3x 是网页 3 倍截图，其余是文章原图）
SHOTS = {
    'g1-title@3x.png': (2208, 2256, '文章标题页'), 'g1-intro@3x.png': (2160, 1656, '开头两段'), 'g1-cycle@3x.png': (2160, 888, '睡眠 / run 一段'),
    'g1-fail@3x.png': (2160, 888, '事件直连的问题'), 'g1-bp@3x.png': (2160, 5475, '收件箱做法'), 'g2-timers@3x.png': (2160, 3030, 'Timers 一节'),
    'g2-memory@3x.png': (2160, 1680, 'Memory 一节'), 'g2-dream@3x.png': (2160, 900, 'dreaming 一段'), 'g3-perm@3x.png': (2160, 3348, 'Permissions 一节'),
    'g3-out@3x.png': (2160, 4530, 'Outbox 一节'), 'g3-head@3x.png': (3168, 1116, '标题与分类'), 'g3-cost@3x.png': (2160, 984, '成本一段'), 'g3-poll@3x.png': (2160, 504, '扫表间隔一句'),
    'bb08543a505cea3a24c88c718ceec4405e9c0a79.png': (2040, 1821, '收件箱原图'), 'c16694e6d979a2ace84d03da0544297b7245c0a8.png': (1400, 732, '定时器原图'),
    'e5d209d7ef9b3455dec8a27b777dc12bdf806699.png': (1400, 703, '记忆目录原图'), '700b5f3a446f22493c0307ec65751b6b2f82ccb7.png': (1506, 739, '发件箱原图'),
}
FRAMES = [('g1-tl', 'f{:03d}.jpg', range(1, 104), '时间轴动图'), ('g3-total', 'f{:03d}.png', range(0, 120), '总图动图')]


def draw(path, w, h, label):
    im = Image.new('RGB', (w, h), (214, 210, 204)); d = ImageDraw.Draw(im)
    s = max(28, min(w, h) // 18); f1 = ImageFont.truetype(FONT, s); f2 = ImageFont.truetype(FONT, int(s * 0.62))
    d.rectangle([s // 2, s // 2, w - s // 2, h - s // 2], outline=(150, 145, 138), width=max(3, s // 10))
    y = h // 2 - int(s * 1.6)
    for txt, f in [('原文截图位：' + label, f1), ('请自行截取 ' + URL + ' 对应文章', f2), (f'{os.path.basename(path)} · {w}×{h}', f2)]:
        tw = d.textlength(txt, font=f); d.text(((w - tw) / 2, y), txt, font=f, fill=(90, 86, 80)); y += int(f.size * 1.5)
    im.save(path, quality=70) if path.endswith('.jpg') else im.save(path, optimize=True)


os.makedirs(SRC, exist_ok=True)
for name, (w, h, label) in SHOTS.items(): draw(os.path.join(SRC, name), w, h, label)
for sub, pat, rng, label in FRAMES:
    os.makedirs(os.path.join(SRC, sub), exist_ok=True)
    for i in rng: draw(os.path.join(SRC, sub, pat.format(i)), 1200, 675, f'{label}第 {i} 帧')
print('placeholders ->', os.path.normpath(SRC))
