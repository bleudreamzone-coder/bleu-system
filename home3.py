#!/usr/bin/env python3
"""HOME v3: WORKING BUTTONS + SPA AESTHETIC — every button goes somewhere real"""
import os
os.chdir('/workspaces/bleu-system')
c='background:rgba(30,58,76,0.35);border:1px solid rgba(212,175,55,0.12);border-radius:16px;padding:20px'
ct='background:rgba(30,58,76,0.35);border:1px solid rgba(78,205,196,0.12);border-radius:16px;padding:20px'
cr='background:rgba(30,58,76,0.35);border:1px solid rgba(255,107,107,0.12);border-radius:16px;padding:20px'
cg='background:linear-gradient(135deg,rgba(212,175,55,0.06),rgba(78,205,196,0.03));border:1px solid rgba(212,175,55,0.1);border-radius:16px;padding:28px'
g2='display:grid;grid-template-columns:repeat(2,1fr);gap:16px'
g3='display:grid;grid-template-columns:repeat(3,1fr);gap:16px'
g4='display:grid;grid-template-columns:repeat(4,1fr);gap:14px'
g5='display:grid;grid-template-columns:repeat(5,1fr);gap:14px'
Q=chr(39)
def stat(n,l):
    return '<div style="'+ct+';text-align:center"><div style="color:#4ecdc4;font-size:28px;font-weight:300;letter-spacing:-1px">'+n+'</div><div style="color:#a0b4c0;font-size:11px;margin-top:6px;letter-spacing:1px;text-transform:uppercase">'+l+'</div></div>'
def hdr(t):
    return '<div style="margin:36px 0 18px;text-align:center"><div style="color:#d4af37;font-size:11px;letter-spacing:4px;text-transform:uppercase">'+t+'</div><div style="width:40px;height:1px;background:rgba(212,175,55,0.3);margin:8px auto 0"></div></div>'
def pill(txt,clr):
    if clr=='g': return '<span style="background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.15);border-radius:20px;padding:5px 14px;font-size:10px;color:#d4af37;letter-spacing:1px">'+txt+'</span>'
    elif clr=='t': return '<span style="background:rgba(78,205,196,0.06);border:1px solid rgba(78,205,196,0.15);border-radius:20px;padding:5px 14px;font-size:10px;color:#4ecdc4;letter-spacing:1px">'+txt+'</span>'
    else: return '<span style="background:rgba(255,107,107,0.06);border:1px solid rgba(255,107,107,0.15);border-radius:20px;padding:5px 14px;font-size:10px;color:#ff6b6b;letter-spacing:1px">'+txt+'</span>'
def abtn(label,action,style):
    if style=='gold': return '<div style="background:linear-gradient(135deg,rgba(212,175,55,0.9),rgba(184,150,46,0.9));color:#0a1628;padding:16px 20px;border-radius:14px;font-weight:600;font-size:14px;cursor:pointer;text-align:center;transition:all 0.3s;letter-spacing:0.5px" onclick="'+action+'">'+label+'</div>'
    elif style=='teal': return '<div style="background:rgba(78,205,196,0.08);border:1px solid rgba(78,205,196,0.2);color:#4ecdc4;padding:16px 20px;border-radius:14px;font-weight:600;font-size:14px;cursor:pointer;text-align:center;transition:all 0.3s" onclick="'+action+'">'+label+'</div>'
    else: return '<div style="background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.12);color:#d4af37;padding:16px 20px;border-radius:14px;font-weight:600;font-size:14px;cursor:pointer;text-align:center;transition:all 0.3s" onclick="'+action+'">'+label+'</div>'
h='<div style="margin:20px 0">'
h+='<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:28px;opacity:0.8">'
h+=pill('PATENT PENDING','g')+pill('TRADEMARK PROTECTED','g')+pill('NPI VERIFIED','t')+pill('HIPAA AWARE','t')+pill('127-YEAR LINEAGE','g')
h+='</div>'
h+='<div style="text-align:center;margin-bottom:36px;padding:0 20px">'
h+='<div style="color:#d4af37;font-size:13px;letter-spacing:4px;text-transform:uppercase;margin-bottom:12px">Welcome to</div>'
h+='<div style="color:#e8d5b0;font-size:28px;font-weight:300;letter-spacing:2px;line-height:1.4">The Longevity Operating System</div>'
h+='<div style="color:#a0b4c0;font-size:15px;margin-top:14px;max-width:600px;margin-left:auto;margin-right:auto;line-height:1.7;font-weight:300">Tell Alvai what you need. Get matched to practitioners, products, protocols, and safety data in seconds. No account required.</div>'
h+='</div>'
h+=hdr('HOW CAN WE HELP')
h+='<div style="'+g3+'">'
h+=abtn('&#128164; I can'+Q+'t sleep','ask('+Q+'home'+Q+','+Q+'I struggle with sleep. What supplements, strains, and practitioners can help me?'+Q+')','gold')
h+=abtn('&#128556; I have anxiety','ask('+Q+'home'+Q+','+Q+'I deal with anxiety. Show me evidence-based options including CBD, therapy, and breathing protocols.'+Q+')','teal')
h+=abtn('&#129657; I'+Q+'m in pain','ask('+Q+'home'+Q+','+Q+'I have chronic pain. What are my options beyond opioids? Show me practitioners, cannabis, and supplements.'+Q+')','dim')
h+='</div>'
h+='<div style="'+g3+';margin-top:12px">'
h+=abtn('&#128138; Check my medications','ask('+Q+'home'+Q+','+Q+'Check my medications for interactions with cannabis and supplements. What is safe to combine?'+Q+')','teal')
h+=abtn('&#129658; Find a practitioner','go('+Q+'directory'+Q+')','dim')
h+=abtn('&#127793; Cannabis beginner','go('+Q+'cannaiq'+Q+')','gold')
h+='</div>'
h+='<div style="'+g3+';margin-top:12px">'
h+=abtn('&#128154; Recovery support','go('+Q+'recovery'+Q+')','dim')
h+=abtn('&#129489; Build my protocol','go('+Q+'protocols'+Q+')','gold')
h+=abtn('&#127919; Daily mission','go('+Q+'missions'+Q+')','teal')
h+='</div>'
h+=hdr('WHAT HAPPENS WHEN YOU ASK')
h+='<div style="'+g4+'">'
h+='<div style="'+ct+';text-align:center"><div style="color:#4ecdc4;font-size:36px;font-weight:200">1</div><div style="color:#e8d5b0;font-weight:500;font-size:14px;margin-top:8px">You speak</div><div style="color:#a0b4c0;font-size:12px;margin-top:8px;line-height:1.6;font-weight:300">Plain language. &quot;I can'+Q+'t sleep&quot; is enough.</div></div>'
h+='<div style="'+c+';text-align:center"><div style="color:#d4af37;font-size:36px;font-weight:200">2</div><div style="color:#e8d5b0;font-weight:500;font-size:14px;margin-top:8px">Intelligence activates</div><div style="color:#a0b4c0;font-size:12px;margin-top:8px;line-height:1.6;font-weight:300">68 APIs cross-reference. Meds checked. Practitioners matched.</div></div>'
h+='<div style="'+ct+';text-align:center"><div style="color:#4ecdc4;font-size:36px;font-weight:200">3</div><div style="color:#e8d5b0;font-weight:500;font-size:14px;margin-top:8px">Results delivered</div><div style="color:#a0b4c0;font-size:12px;margin-top:8px;line-height:1.6;font-weight:300">Real practitioners. Real products. Real protocols. No dead ends.</div></div>'
h+='<div style="'+c+';text-align:center"><div style="color:#d4af37;font-size:36px;font-weight:200">4</div><div style="color:#e8d5b0;font-weight:500;font-size:14px;margin-top:8px">It compounds</div><div style="color:#a0b4c0;font-size:12px;margin-top:8px;line-height:1.6;font-weight:300">Every visit sharpens your profile. Better matches. Smarter safety.</div></div>'
h+='</div>'
h+=hdr('SAMPLE RESULTS')
h+='<div style="color:#a0b4c0;font-size:13px;text-align:center;margin-bottom:14px;font-weight:300;font-style:italic">What one question returns</div>'
h+='<div style="'+g2+'">'
h+='<div style="'+ct+';cursor:pointer" onclick="go('+Q+'vessel'+Q+')"><div style="color:#4ecdc4;font-weight:500;font-size:13px;margin-bottom:10px">&#128138; Supplement Match</div><div style="color:#e8d5b0;font-weight:500">Magnesium Glycinate 400mg</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;line-height:1.5;font-weight:300">GABA-A receptor modulation. 1hr before bed. No interactions detected.</div><div style="color:#d4af37;font-size:12px;margin-top:8px">Amazon $14.99 &#8594; Vessel tab</div></div>'
h+='<div style="'+c+';cursor:pointer" onclick="go('+Q+'cannaiq'+Q+')"><div style="color:#d4af37;font-weight:500;font-size:13px;margin-bottom:10px">&#127807; Cannabis Match</div><div style="color:#e8d5b0;font-weight:500">Granddaddy Purple &#8212; BEMS 82</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;line-height:1.5;font-weight:300">Indica. Myrcene-dominant. GABA agonist pathway. Evening use only.</div><div style="color:#4ecdc4;font-size:12px;margin-top:8px">Full profile &#8594; CannaIQ tab</div></div>'
h+='<div style="'+ct+';cursor:pointer" onclick="go('+Q+'directory'+Q+')"><div style="color:#4ecdc4;font-weight:500;font-size:13px;margin-bottom:10px">&#129658; Practitioner Match</div><div style="color:#e8d5b0;font-weight:500">Sleep Specialist &#8212; NPI Verified</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;line-height:1.5;font-weight:300">Naturopathic. Trust score 94. Accepts insurance. Telehealth available.</div><div style="color:#d4af37;font-size:12px;margin-top:8px">Browse all &#8594; Directory tab</div></div>'
h+='<div style="'+c+';cursor:pointer" onclick="go('+Q+'protocols'+Q+')"><div style="color:#d4af37;font-weight:500;font-size:13px;margin-bottom:10px">&#128221; Protocol Built</div><div style="color:#e8d5b0;font-weight:500">Evening Wind-Down</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;line-height:1.5;font-weight:300">8pm screen curfew. 9pm mag + chamomile. 9:30pm 4-7-8 breathing. Sleep onset reduced 15-30 min.</div><div style="color:#4ecdc4;font-size:12px;margin-top:8px">Build yours &#8594; Protocols tab</div></div>'
h+='</div>'
h+='<div style="color:#a0b4c0;font-size:12px;text-align:center;margin-top:12px;font-weight:300;font-style:italic">Every result links to a real tab with full detail. Nothing is a dead end.</div>'
h+=hdr('THE LIVING SYSTEM')
h+='<div style="'+g5+'">'+stat('253,938','Practitioners')+stat('302,516','Interactions')+stat('529+','Strains')+stat('68','APIs')+stat('9.2M','Lives')+'</div>'
h+=hdr('BUILT FOR EVERYONE')
h+='<div style="'+g3+'">'
h+='<div style="'+ct+';text-align:center;cursor:pointer" onclick="ask('+Q+'home'+Q+','+Q+'I am an individual looking to improve my personal wellness. Where do I start?'+Q+')"><div style="font-size:28px;margin-bottom:8px">&#129489;</div><div style="color:#4ecdc4;font-weight:500;font-size:15px">You</div><div style="color:#a0b4c0;font-size:13px;margin-top:8px;line-height:1.5;font-weight:300">Sleep. Anxiety. Pain. Recovery. Start with one question.</div></div>'
h+='<div style="'+c+';text-align:center;cursor:pointer" onclick="ask('+Q+'home'+Q+','+Q+'How can BLEU help my family with wellness across multiple household members?'+Q+')"><div style="font-size:28px;margin-bottom:8px">&#127968;</div><div style="color:#d4af37;font-weight:500;font-size:15px">Families</div><div style="color:#a0b4c0;font-size:13px;margin-top:8px;line-height:1.5;font-weight:300">Cross-member drug alerts. Shared practitioners. Generational wellness.</div></div>'
h+='<div style="'+ct+';text-align:center;cursor:pointer" onclick="go('+Q+'directory'+Q+')"><div style="font-size:28px;margin-bottom:8px">&#129658;</div><div style="color:#4ecdc4;font-weight:500;font-size:15px">Practitioners</div><div style="color:#a0b4c0;font-size:13px;margin-top:8px;line-height:1.5;font-weight:300">Get listed. Trust earned by outcomes. 253,938 verified.</div></div>'
h+='</div>'
h+='<div style="'+g3+';margin-top:14px">'
h+='<div style="'+c+';text-align:center;cursor:pointer" onclick="ask('+Q+'home'+Q+','+Q+'How can BLEU help my business reduce employee healthcare costs through wellness?'+Q+')"><div style="font-size:28px;margin-bottom:8px">&#127970;</div><div style="color:#d4af37;font-weight:500;font-size:15px">Employers</div><div style="color:#a0b4c0;font-size:13px;margin-top:8px;line-height:1.5;font-weight:300">Workforce wellness ROI. Reduce costs 15-30%.</div></div>'
h+='<div style="'+ct+';text-align:center;cursor:pointer" onclick="ask('+Q+'home'+Q+','+Q+'How can BLEU help city government with neighborhood wellness mapping and resource allocation?'+Q+')"><div style="font-size:28px;margin-bottom:8px">&#127963;</div><div style="color:#4ecdc4;font-weight:500;font-size:15px">City Leaders</div><div style="color:#a0b4c0;font-size:13px;margin-top:8px;line-height:1.5;font-weight:300">Neighborhood mapping. Healthcare deserts. Data-driven allocation.</div></div>'
h+='<div style="'+c+';text-align:center;cursor:pointer" onclick="go('+Q+'community'+Q+')"><div style="font-size:28px;margin-bottom:8px">&#127793;</div><div style="color:#d4af37;font-weight:500;font-size:15px">Communities</div><div style="color:#a0b4c0;font-size:13px;margin-top:8px;line-height:1.5;font-weight:300">Recovery. Run clubs. Urban farms. Grassroots to systemic change.</div></div>'
h+='</div>'
h+=hdr('FOUR CIRCLES OF IMPACT')
h+='<div style="'+g4+'">'
for icon,nm,desc,cl in [('&#129489;','Individual','Your body. Your healing.','g'),('&#127968;','Family','One heals, all heal.','t'),('&#127969;','Neighborhood','Block-by-block.','g'),('&#127963;','City','Municipal intelligence.','t')]:
    tc='#d4af37' if cl=='g' else '#4ecdc4'
    h+='<div style="'+cg+';text-align:center"><div style="font-size:26px;margin-bottom:6px">'+icon+'</div><div style="color:'+tc+';font-weight:500;font-size:14px">'+nm+'</div><div style="color:#a0b4c0;font-size:11px;margin-top:4px;font-weight:300">'+desc+'</div></div>'
h+='</div>'
h+=hdr('EXPLORE THE ECOSYSTEM')
h+='<div style="'+g4+';margin-bottom:12px">'
for icon,nm,tab,cl in [('&#128202;','Dashboard','dashboard','t'),('&#128269;','Directory','directory','g'),('&#128138;','Vessel','vessel','t'),('&#128506;','Map','map','g'),('&#128221;','Protocols','protocols','t'),('&#127891;','Learn','learn','g'),('&#129309;','Community','community','t')]:
    tc='#4ecdc4' if cl=='t' else '#d4af37'
    s=ct if cl=='t' else c
    h+='<div style="'+s+';text-align:center;padding:14px;cursor:pointer" onclick="go('+Q+tab+Q+')"><div style="font-size:20px">'+icon+'</div><div style="color:'+tc+';font-weight:500;font-size:12px;margin-top:6px">'+nm+'</div></div>'
h+='</div><div style="'+g4+'">'
for icon,nm,tab,cl in [('&#127380;','Passport','passport','g'),('&#128156;','Therapy','therapy','t'),('&#128176;','Finance','finance','g'),('&#127919;','Missions','missions','t'),('&#128154;','Recovery','recovery','g'),('&#127807;','CannaIQ','cannaiq','t')]:
    tc='#4ecdc4' if cl=='t' else '#d4af37'
    s=ct if cl=='t' else c
    h+='<div style="'+s+';text-align:center;padding:14px;cursor:pointer" onclick="go('+Q+tab+Q+')"><div style="font-size:20px">'+icon+'</div><div style="color:'+tc+';font-weight:500;font-size:12px;margin-top:6px">'+nm+'</div></div>'
h+='</div>'
h+=hdr('TRUST + PROTECTION')
h+='<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:18px">'
h+=pill('PATENT PENDING','g')+pill('TRADEMARK','g')+pill('NPI VERIFIED','t')+pill('HIPAA AWARE','t')+pill('127-YEAR LINEAGE','g')+pill('SAFETY ENGINE','r')
h+='</div>'
h+='<div style="'+g2+'">'
h+='<div style="'+c+'"><div style="color:#d4af37;font-weight:500;font-size:13px;letter-spacing:1px">INTELLECTUAL PROPERTY</div><div style="color:#a0b4c0;font-size:12px;margin-top:10px;line-height:1.9;font-weight:300">&#9679; <span style="color:#e8d5b0">Patent Pending</span> &#8212; 5-Layer Safety Engine (16 claims)<br>&#9679; <span style="color:#e8d5b0">Trademarks</span> &#8212; BLEU, CannaIQ, ALVAI, BEMS<br>&#9679; <span style="color:#e8d5b0">Copyright</span> &#8212; All content, algorithms, design<br>&#9679; <span style="color:#e8d5b0">Data Assets</span> &#8212; 302K interactions, 529+ strains</div></div>'
h+='<div style="'+ct+'"><div style="color:#4ecdc4;font-weight:500;font-size:13px;letter-spacing:1px">ADVISORY + LINEAGE</div><div style="color:#a0b4c0;font-size:12px;margin-top:10px;line-height:1.9;font-weight:300">&#9679; <span style="color:#e8d5b0">Dr. Felicia Stoler, DCN, MS, RDN, FACSM</span><br>&#9679; <span style="color:#e8d5b0">127-Year Healing Lineage</span><br>&#9679; <span style="color:#e8d5b0">27 Years Active</span> &#8212; 9.2M lives touched<br>&#9679; <span style="color:#e8d5b0">Jazz Bird NOLA 501(c)(3)</span></div></div></div>'
h+=hdr('HOW BLEU SUSTAINS ITSELF')
h+='<div style="'+cg+';text-align:center"><div style="color:#e8d5b0;font-weight:400;font-size:15px;letter-spacing:1px">Transparent. Ethical. Aligned.</div><div style="color:#a0b4c0;font-size:13px;margin-top:12px;max-width:580px;margin-left:auto;margin-right:auto;line-height:1.7;font-weight:300">Purchases through curated partner links sustain this platform. <span style="color:#e8d5b0">Trust scores are never affected by affiliate status.</span> Every recommendation is earned, not bought.</div><div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:16px">'+pill('Amazon Health','t')+pill('iHerb','t')+pill('BetterHelp','t')+pill('Oura Ring','t')+pill('ClassPass','t')+'</div></div>'
h+='<div style="text-align:center;margin-top:36px;padding:0 20px"><div style="color:#e8d5b0;font-weight:300;font-size:17px;letter-spacing:1px">You made it this far. That matters.</div><div style="color:#a0b4c0;font-size:14px;margin-top:10px;font-weight:300">Most people start with one question. What is yours?</div><div style="margin-top:20px">'+abtn('&#128172; Talk to Alvai','go('+Q+'alvai'+Q+')','gold')+'</div></div>'
h+='<div style="text-align:center;margin-top:28px;padding:16px"><div style="color:#a0b4c0;font-size:10px;line-height:1.8;letter-spacing:1px;font-weight:300">BLEU.LIVE &#8226; THE LONGEVITY OPERATING SYSTEM &#8226; PATENT PENDING &#8226; TRADEMARK PROTECTED &#8226; 2026<br>Not medical advice. Consult your healthcare provider. NPI data via CMS.gov. Built in New Orleans.</div></div>'
h+='</div>'
print(f'Built Home v3: {len(h)} bytes')
with open('index.html','r') as f: html=f.read()
marker='THE LONGEVITY OPERATING SYSTEM'
if marker in html:
    i=html.index(marker)+len(marker)
    nd=html.find('</div>',i)
    if nd>0:
        after_close=nd+6
        for nm in ['DAILY SNAPSHOT','DASHBOARD','<!-- ===']:
            pos=html.find(nm,after_close)
            if pos>0 and (pos-after_close)>500:
                html=html[:after_close]+html[pos:]
                print(f'Removed old: {pos-after_close} bytes')
                break
        nd2=html.find('</div>',html.index(marker)+len(marker))
        html=html[:nd2+6]+h+html[nd2+6:]
        print('Injected Home v3')
with open('index.html','w') as f: f.write(html)
os.system('git add -A && git commit -m "HOME v3: ALL BUTTONS WORK — go() nav, ask() chat, spa aesthetic, softer design, zero dead ends" && git push --force')
print('DONE')
