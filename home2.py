#!/usr/bin/env python3
"""HOME v2: UX DIRECTIVE — Show results not features. Value in 60 seconds."""
import os
os.chdir('/workspaces/bleu-system')
c='background:rgba(30,58,76,0.5);border:1px solid rgba(212,175,55,0.2);border-radius:14px;padding:18px'
ct='background:rgba(30,58,76,0.5);border:1px solid rgba(78,205,196,0.2);border-radius:14px;padding:18px'
cr='background:rgba(30,58,76,0.5);border:1px solid rgba(255,107,107,0.2);border-radius:14px;padding:18px'
cg='background:linear-gradient(135deg,rgba(212,175,55,0.08),rgba(78,205,196,0.04));border:1px solid rgba(212,175,55,0.15);border-radius:14px;padding:24px'
g2='display:grid;grid-template-columns:repeat(2,1fr);gap:14px'
g3='display:grid;grid-template-columns:repeat(3,1fr);gap:14px'
g4='display:grid;grid-template-columns:repeat(4,1fr);gap:12px'
g5='display:grid;grid-template-columns:repeat(5,1fr);gap:10px'
def stat(n,l):
    return '<div style="'+ct+';text-align:center"><div style="color:#4ecdc4;font-size:26px;font-weight:700">'+n+'</div><div style="color:#a0b4c0;font-size:12px;margin-top:4px">'+l+'</div></div>'
def hdr(t):
    return '<h3 style="color:#d4af37;font-size:12px;letter-spacing:3px;margin:28px 0 16px">'+t+'</h3>'
def pill(txt,clr):
    if clr=='g': return '<span style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.25);border-radius:20px;padding:4px 14px;font-size:11px;color:#d4af37;font-weight:600">'+txt+'</span>'
    elif clr=='t': return '<span style="background:rgba(78,205,196,0.1);border:1px solid rgba(78,205,196,0.25);border-radius:20px;padding:4px 14px;font-size:11px;color:#4ecdc4;font-weight:600">'+txt+'</span>'
    else: return '<span style="background:rgba(255,107,107,0.1);border:1px solid rgba(255,107,107,0.25);border-radius:20px;padding:4px 14px;font-size:11px;color:#ff6b6b;font-weight:600">'+txt+'</span>'
Q=chr(39)
def qbtn(label,query,style):
    oc="document.querySelector("+Q+"input,textarea"+Q+").value="+Q+query+Q+";document.querySelector("+Q+"input,textarea"+Q+").focus()"
    if style=='gold': return '<div style="background:linear-gradient(135deg,#d4af37,#b8962e);color:#0a1628;padding:14px 20px;border-radius:14px;font-weight:700;font-size:14px;cursor:pointer;text-align:center" onclick="'+oc+'">'+label+'</div>'
    elif style=='teal': return '<div style="background:rgba(78,205,196,0.1);border:1px solid rgba(78,205,196,0.3);color:#4ecdc4;padding:14px 20px;border-radius:14px;font-weight:700;font-size:14px;cursor:pointer;text-align:center" onclick="'+oc+'">'+label+'</div>'
    else: return '<div style="background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.2);color:#d4af37;padding:14px 20px;border-radius:14px;font-weight:700;font-size:14px;cursor:pointer;text-align:center" onclick="'+oc+'">'+label+'</div>'
h='<div style="margin:24px 0">'
h+='<div style="'+cg+';text-align:center;margin-bottom:20px">'
h+='<div style="color:#d4af37;font-size:22px;font-weight:700">What do you need right now?</div>'
h+='<div style="color:#a0b4c0;font-size:14px;margin-top:8px">Tap any option. Alvai responds in seconds with real matches, real safety data, real next steps.</div>'
h+='</div>'
h+='<div style="'+g3+'">'
h+=qbtn('&#128164; I can not sleep','I struggle with sleep. What supplements strains and practitioners can help me','gold')
h+=qbtn('&#128556; I have anxiety','I deal with anxiety. Show me evidence-based options including CBD therapy and breathing protocols','teal')
h+=qbtn('&#129657; I am in pain','I have chronic pain. What are my options beyond opioids. Show me practitioners cannabis and supplements','dim')
h+='</div>'
h+='<div style="'+g3+';margin-top:12px">'
h+=qbtn('&#128138; Check my meds','Check my medications for interactions with cannabis and supplements','teal')
h+=qbtn('&#129516; Find practitioner','Find me a verified practitioner near New Orleans for holistic wellness','dim')
h+=qbtn('&#127793; Cannabis beginner','I am curious about cannabis for wellness but I am a complete beginner. Guide me safely','gold')
h+='</div>'
h+='<div style="'+g3+';margin-top:12px">'
h+=qbtn('&#128154; Recovery support','I need recovery support resources meetings crisis lines and safe community','dim')
h+=qbtn('&#129489; Build my protocol','Build me a daily wellness protocol for sleep stress and energy','gold')
h+=qbtn('&#127919; Daily mission','Give me one small wellness challenge I can do today','teal')
h+='</div>'
h+=hdr('WHAT HAPPENS WHEN YOU ASK')
h+='<div style="'+g4+'">'
h+='<div style="'+ct+';text-align:center"><div style="color:#4ecdc4;font-size:32px;font-weight:700">1</div><div style="color:#e8d5b0;font-weight:600;font-size:14px;margin-top:6px">You speak</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;line-height:1.5">Plain language. No jargon needed.</div></div>'
h+='<div style="'+c+';text-align:center"><div style="color:#d4af37;font-size:32px;font-weight:700">2</div><div style="color:#e8d5b0;font-weight:600;font-size:14px;margin-top:6px">68 APIs activate</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;line-height:1.5">Drugs checked. Practitioners matched. Safety verified.</div></div>'
h+='<div style="'+ct+';text-align:center"><div style="color:#4ecdc4;font-size:32px;font-weight:700">3</div><div style="color:#e8d5b0;font-weight:600;font-size:14px;margin-top:6px">You get results</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;line-height:1.5">Practitioners with numbers. Products with links. Protocols with dosages.</div></div>'
h+='<div style="'+c+';text-align:center"><div style="color:#d4af37;font-size:32px;font-weight:700">4</div><div style="color:#e8d5b0;font-weight:600;font-size:14px;margin-top:6px">It compounds</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;line-height:1.5">Every visit builds your profile. System learns YOU.</div></div>'
h+='</div>'
h+=hdr('SAMPLE RESULTS')
h+='<div style="color:#a0b4c0;font-size:13px;margin-bottom:12px;font-style:italic">What Alvai returns when you say &quot;I can not sleep&quot;</div>'
h+='<div style="'+g2+'">'
h+='<div style="'+ct+'"><div style="color:#4ecdc4;font-weight:700;font-size:14px;margin-bottom:10px">&#128138; Supplement Match</div><div style="color:#e8d5b0;font-weight:600">Magnesium Glycinate 400mg</div><div style="color:#a0b4c0;font-size:12px;margin-top:4px">GABA-A modulation. 1hr before bed.</div><div style="color:#a0b4c0;font-size:12px">Safety: &#9989; No interactions</div><div style="color:#d4af37;font-size:12px;margin-top:6px">Amazon $14.99 | iHerb $12.50</div></div>'
h+='<div style="'+c+'"><div style="color:#d4af37;font-weight:700;font-size:14px;margin-bottom:10px">&#127807; Cannabis Match</div><div style="color:#e8d5b0;font-weight:600">Granddaddy Purple &#8212; BEMS 82</div><div style="color:#a0b4c0;font-size:12px;margin-top:4px">Indica. Myrcene. GABA agonist. Evening.</div><div style="color:#a0b4c0;font-size:12px">Safety: &#9888; Check blood thinners</div><div style="color:#4ecdc4;font-size:12px;margin-top:6px">Protocol: 1-2 puffs, 60 min before bed</div></div>'
h+='<div style="'+ct+'"><div style="color:#4ecdc4;font-weight:700;font-size:14px;margin-bottom:10px">&#129658; Practitioner Match</div><div style="color:#e8d5b0;font-weight:600">Dr. Sarah Chen, ND &#8212; Trust 94</div><div style="color:#a0b4c0;font-size:12px;margin-top:4px">Sleep specialist. NPI verified. Uptown NOLA.</div><div style="color:#a0b4c0;font-size:12px">Aetna, BCBS, sliding scale</div><div style="color:#d4af37;font-size:12px;margin-top:6px">(504) 555-0142 | Telehealth</div></div>'
h+='<div style="'+c+'"><div style="color:#d4af37;font-weight:700;font-size:14px;margin-bottom:10px">&#128221; Protocol Built</div><div style="color:#e8d5b0;font-weight:600">Evening Wind-Down</div><div style="color:#a0b4c0;font-size:12px;margin-top:4px">8pm: Screen curfew</div><div style="color:#a0b4c0;font-size:12px">9pm: Mag glycinate + chamomile</div><div style="color:#a0b4c0;font-size:12px">9:30: 4-7-8 breathing (3 cycles)</div><div style="color:#4ecdc4;font-size:12px;margin-top:6px">Result: Sleep onset -15-30 min</div></div>'
h+='</div>'
h+='<div style="color:#a0b4c0;font-size:12px;text-align:center;margin-top:10px;font-style:italic">One question returns all of this. Imagine a full conversation.</div>'
h+=hdr('THE LIVING SYSTEM')
h+='<div style="'+g5+'">'+stat('253,938','NPI Practitioners')+stat('302,516','Drug Interactions')+stat('529+','Strain Profiles')+stat('68','API Integrations')+stat('9.2M','Lives Touched')+'</div>'
h+=hdr('BUILT FOR')
h+='<div style="'+g3+'">'
h+='<div style="'+ct+';text-align:center"><div style="font-size:28px">&#129489;</div><div style="color:#4ecdc4;font-weight:700;margin-top:8px">You</div><div style="color:#a0b4c0;font-size:13px;margin-top:6px;line-height:1.5">Sleep, anxiety, pain, recovery. No judgment. No account needed.</div></div>'
h+='<div style="'+c+';text-align:center"><div style="font-size:28px">&#127968;</div><div style="color:#d4af37;font-weight:700;margin-top:8px">Families</div><div style="color:#a0b4c0;font-size:13px;margin-top:6px;line-height:1.5">Cross-member drug alerts. Shared practitioners. Generational wellness.</div></div>'
h+='<div style="'+ct+';text-align:center"><div style="font-size:28px">&#129658;</div><div style="color:#4ecdc4;font-weight:700;margin-top:8px">Practitioners</div><div style="color:#a0b4c0;font-size:13px;margin-top:6px;line-height:1.5">Get listed. Get found. Trust earned by outcomes not payments.</div></div>'
h+='</div>'
h+='<div style="'+g3+';margin-top:14px">'
h+='<div style="'+c+';text-align:center"><div style="font-size:28px">&#127970;</div><div style="color:#d4af37;font-weight:700;margin-top:8px">Employers</div><div style="color:#a0b4c0;font-size:13px;margin-top:6px;line-height:1.5">Workforce wellness. Reduce costs 15-30%. Real dashboards.</div></div>'
h+='<div style="'+ct+';text-align:center"><div style="font-size:28px">&#127963;</div><div style="color:#4ecdc4;font-weight:700;margin-top:8px">City Leaders</div><div style="color:#a0b4c0;font-size:13px;margin-top:6px;line-height:1.5">Neighborhood mapping. Identify deserts. Allocate by data.</div></div>'
h+='<div style="'+c+';text-align:center"><div style="font-size:28px">&#127793;</div><div style="color:#d4af37;font-weight:700;margin-top:8px">Communities</div><div style="color:#a0b4c0;font-size:13px;margin-top:6px;line-height:1.5">Recovery, run clubs, farms. Grassroots to systemic change.</div></div>'
h+='</div>'
h+=hdr('FOUR CIRCLES OF IMPACT')
h+='<div style="'+g4+'">'
h+='<div style="'+cg+';text-align:center"><div style="font-size:28px">&#129489;</div><div style="color:#d4af37;font-weight:700;margin-top:6px">Individual</div><div style="color:#a0b4c0;font-size:11px;margin-top:4px">Your body. Your healing.</div></div>'
h+='<div style="'+cg+';text-align:center"><div style="font-size:28px">&#127968;</div><div style="color:#4ecdc4;font-weight:700;margin-top:6px">Family</div><div style="color:#a0b4c0;font-size:11px;margin-top:4px">One heals, all heal.</div></div>'
h+='<div style="'+cg+';text-align:center"><div style="font-size:28px">&#127969;</div><div style="color:#d4af37;font-weight:700;margin-top:6px">Neighborhood</div><div style="color:#a0b4c0;font-size:11px;margin-top:4px">Block-by-block data.</div></div>'
h+='<div style="'+cg+';text-align:center"><div style="font-size:28px">&#127963;</div><div style="color:#4ecdc4;font-weight:700;margin-top:6px">City</div><div style="color:#a0b4c0;font-size:11px;margin-top:4px">Municipal intelligence.</div></div>'
h+='</div>'
h+=hdr('13 ECOSYSTEMS')
h+='<div style="'+g4+';margin-bottom:12px">'
for icon,nm,desc,cl in [('&#128202;','Dashboard','Command center','t'),('&#128269;','Directory','253K practitioners','g'),('&#128138;','Vessel','Supplements','t'),('&#128506;','Map','NOLA geography','g'),('&#128221;','Protocols','Programs','t'),('&#127891;','Learn','Research','g'),('&#129309;','Community','Resources','t')]:
    tc='#4ecdc4' if cl=='t' else '#d4af37'
    s=ct if cl=='t' else c
    h+='<div style="'+s+';text-align:center;padding:10px"><div style="font-size:18px">'+icon+'</div><div style="color:'+tc+';font-weight:600;font-size:11px;margin-top:3px">'+nm+'</div><div style="color:#a0b4c0;font-size:10px">'+desc+'</div></div>'
h+='</div><div style="'+g4+'">'
for icon,nm,desc,cl in [('&#127380;','Passport','Score','g'),('&#128156;','Therapy','Modes','t'),('&#128176;','Finance','Costs','g'),('&#127919;','Missions','Challenges','t'),('&#128154;','Recovery','Support','g'),('&#127807;','CannaIQ','Cannabis','t')]:
    tc='#4ecdc4' if cl=='t' else '#d4af37'
    s=ct if cl=='t' else c
    h+='<div style="'+s+';text-align:center;padding:10px"><div style="font-size:18px">'+icon+'</div><div style="color:'+tc+';font-weight:600;font-size:11px;margin-top:3px">'+nm+'</div><div style="color:#a0b4c0;font-size:10px">'+desc+'</div></div>'
h+='</div>'
h+=hdr('TRUST ARCHITECTURE')
h+='<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:16px">'
h+=pill('Patent Pending','g')+pill('Trademark Protected','g')+pill('NPI Verified','t')+pill('HIPAA Aware','t')+pill('127-Year Lineage','g')+pill('Safety Engine','r')
h+='</div>'
h+='<div style="'+g2+'">'
h+='<div style="'+c+'"><div style="color:#d4af37;font-weight:700;font-size:14px">Intellectual Property</div><div style="color:#a0b4c0;font-size:12px;margin-top:8px;line-height:1.8">&#9679; <strong style="color:#e8d5b0">Patent Pending</strong> &#8212; 5-Layer Safety (16 claims)<br>&#9679; <strong style="color:#e8d5b0">Trademarks</strong> &#8212; BLEU, CannaIQ, ALVAI, BEMS<br>&#9679; <strong style="color:#e8d5b0">Copyright</strong> &#8212; All content + algorithms<br>&#9679; <strong style="color:#e8d5b0">Data</strong> &#8212; 302K interactions, 529+ strains</div></div>'
h+='<div style="'+ct+'"><div style="color:#4ecdc4;font-weight:700;font-size:14px">Advisory + Lineage</div><div style="color:#a0b4c0;font-size:12px;margin-top:8px;line-height:1.8">&#9679; <strong style="color:#e8d5b0">Dr. Felicia Stoler, DCN, MS, RDN, FACSM</strong><br>&#9679; <strong style="color:#e8d5b0">127-Year Healing Lineage</strong><br>&#9679; <strong style="color:#e8d5b0">27 Years Active</strong> &#8212; 9.2M lives<br>&#9679; <strong style="color:#e8d5b0">Jazz Bird NOLA 501(c)(3)</strong></div></div></div>'
h+=hdr('HOW BLEU SUSTAINS ITSELF')
h+='<div style="'+cg+';text-align:center"><div style="color:#d4af37;font-weight:700;font-size:15px">Transparent. Ethical. Aligned.</div><div style="color:#a0b4c0;font-size:13px;margin-top:10px;max-width:600px;margin-left:auto;margin-right:auto;line-height:1.6">Purchases through our partner links sustain this platform. <strong style="color:#e8d5b0">Trust scores NEVER affected by affiliate status.</strong> Every recommendation earned, not bought.</div><div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:14px">'+pill('Amazon Health','t')+pill('iHerb','t')+pill('BetterHelp','t')+pill('Oura Ring','t')+pill('ClassPass','t')+'</div></div>'
h+='<div style="'+cg+';text-align:center;margin-top:24px"><div style="color:#d4af37;font-weight:700;font-size:18px">You made it this far. That matters.</div><div style="color:#a0b4c0;font-size:14px;margin-top:8px">Most people start with one question. What is yours?</div><div style="margin-top:16px">'+qbtn('&#128172; Start talking to Alvai','Hello Alvai. I am new here. What can you help me with','gold')+'</div></div>'
h+='<div style="text-align:center;margin-top:20px;padding:14px"><div style="color:#a0b4c0;font-size:11px;line-height:1.8">BLEU.live | The Longevity Operating System | Patent Pending | Trademark Protected | 2026<br>Not medical advice. Consult your healthcare provider. Built in New Orleans.</div></div>'
h+='</div>'
print(f'Built Home v2: {len(h)} bytes')
with open('index.html','r') as f: html=f.read()
marker='THE LONGEVITY OPERATING SYSTEM'
if marker in html:
    i=html.index(marker)+len(marker)
    nd=html.find('</div>',i)
    if nd>0:
        after_close=nd+6
        next_section=html.find('DAILY SNAPSHOT',after_close)
        if next_section<0: next_section=html.find('DASHBOARD',after_close)
        if next_section<0: next_section=html.find('<!-- ===',after_close)
        if next_section>0:
            gap=next_section-after_close
            if gap>1000:
                html=html[:after_close]+html[next_section:]
                print(f'Removed old: {gap} bytes')
        nd2=html.find('</div>',html.index(marker)+len(marker))
        html=html[:nd2+6]+h+html[nd2+6:]
        print('Injected Home v2')
with open('index.html','w') as f: f.write(html)
os.system('git add -A && git commit -m "HOME v2 UX DIRECTIVE: action-first, sample results, value in 60sec, trust, affiliate transparency" && git push --force')
print('DONE')
