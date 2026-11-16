# 从口播 md 生成句子表 + 估算时间轴（占位：没配音也能先做画面；配音后由 engine/voice/align.py 产出的真 timeline 覆盖）。
# 口播 md 格式：段标题 `## 00 · 段名`，念的句子一行一个，以 `- ` 开头（** 加粗会去掉）。句 id = s<段>-<序号>。
# 用法：python3 engine/tools/mk_dummy_timeline.py 口播.md timeline.json
import re,json,sys
src=sys.argv[1]; out=sys.argv[2]
sec=None; n=0; sents=[]
for line in open(src,encoding='utf-8'):
    m=re.match(r'^## (\d\d) ·',line)
    if m: sec=m.group(1); n=0; continue
    if line.startswith('- ') and sec:
        n+=1; t=line[2:].strip().replace('**','')
        sents.append({'id':f's{sec}-{n}','section':sec,'text':t})
if not sents: raise SystemExit('没找到句子：段标题要写成「## 00 · 段名」，句子行以「- 」开头')
t=0.5; secs=[]
for s in sents:
    if not secs or secs[-1]['id']!=s['section']:
        if secs: secs[-1]['end']=t; t+=0.4
        secs.append({'id':s['section'],'start':t})
    d=len(re.findall(r'[一-鿿0-9]',s['text']))*0.2+len(re.findall(r'[A-Za-z]+',s['text']))*0.35
    s['start']=round(t,3); t+=d; s['end']=round(t,3); t+=0.4
secs[-1]['end']=round(t+2,3)
secs[0]['start']=0.0
json.dump({'note':'DUMMY 估算，配音后覆盖','duration':round(t+2,3),'sections':secs,'sentences':sents},open(out,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
print(len(sents),'sentences',round(t+2,1),'s')
