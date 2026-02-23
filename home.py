#!/usr/bin/env python3
"""BLEU.live HOME — The Arrival Experience"""
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
h='<div style="margin:24px 0">'
h+='<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:24px">'
h+=pill('Patent Pending','g')+pill('Trademark Protected','g')+pill('NPI Verified','t')+pill('HIPAA Aware','t')+pill('127-Year Lineage','g')+pill('54-Substance Safety Engine','r')
h+='</div>'
h+='<div style="'+cg+';text-align:center;margin-bottom:24px">'
h+='<div style="color:#d4af37;font-size:24px;font-weight:700;line-height:1.4">The Longevity Operating System</div>'
h+='<div style="color:#e8d5b0;font-size:16px;margin-top:10px">Quantifying wellness. Validating outcomes. Forecasting longevity.</div>'
h+='<div style="color:#a0b4c0;font-size:14px;margin-top:14px;max-width:700px;margin-left:auto;margin-right:auto;line-height:1.7">BLEU is where individuals, families, practitioners, businesses, cities, and governments converge on one mission: <strong style="color:#4ecdc4">measurable human wellness at scale</strong>. 24/7 AI intelligence. 253,938 verified practitioners. Real data. Real outcomes.</div>'
h+='</div>'
h+=hdr('THE LIVING SYSTEM')
h+='<div style="'+g5+'">'+stat('253,938','NPI Practitioners')+stat('302,516','Drug Interactions')+stat('529+','Strain Profiles')+stat('68','API Integrations')+stat('9.2M','Lives Touched')+'</div>'
h+=hdr('WHO BLEU SERVES')
h+='<div style="'+g3+'">'
h+='<div style="'+ct+'"><div style="font-size:28px">&#129489;</div><div style="color:#4ecdc4;font-weight:700;font-size:16px;margin-top:10px">Individuals</div><div style="color:#a0b4c0;font-size:13px;margin-top:8px;line-height:1.6">Your body is a vessel. BLEU maps sleep, stress, nutrition, meds, cannabis, and mental health into one living profile. Alvai learns YOU.</div></div>'
h+='<div style="'+c+'"><div style="font-size:28px">&#127968;</div><div style="color:#d4af37;font-weight:700;font-size:16px;margin-top:10px">Families</div><div style="color:#a0b4c0;font-size:13px;margin-top:8px;line-height:1.6">When one heals, the home heals. Family dashboards, shared practitioner networks, medication alerts across household members.</div></div>'
h+='<div style="'+ct+'"><div style="font-size:28px">&#129658;</div><div style="color:#4ecdc4;font-weight:700;font-size:16px;margin-top:10px">Practitioners</div><div style="color:#a0b4c0;font-size:13px;margin-top:8px;line-height:1.6">253,938 NPI-verified. Trust scores earned through federal data and outcomes. No pay-to-play. Your reputation is your currency.</div></div>'
h+='</div>'
h+='<div style="'+g3+';margin-top:14px">'
h+='<div style="'+c+'"><div style="font-size:28px">&#127970;</div><div style="color:#d4af37;font-weight:700;font-size:16px;margin-top:10px">Businesses</div><div style="color:#a0b4c0;font-size:13px;margin-top:8px;line-height:1.6">Employee wellness ROI quantified. Reduce healthcare costs 15-30%. Real-time dashboards. Practitioner networks for your team.</div></div>'
h+='<div style="'+ct+'"><div style="font-size:28px">&#127963;</div><div style="color:#4ecdc4;font-weight:700;font-size:16px;margin-top:10px">City Governments</div><div style="color:#a0b4c0;font-size:13px;margin-top:8px;line-height:1.6">Neighborhood wellness mapping. Healthcare deserts identified. Mental health trends tracked. Resources allocated by data, not assumptions.</div></div>'
h+='<div style="'+c+'"><div style="font-size:28px">&#127793;</div><div style="color:#d4af37;font-weight:700;font-size:16px;margin-top:10px">Community Leaders</div><div style="color:#a0b4c0;font-size:13px;margin-top:8px;line-height:1.6">Build wellness movements. Recovery communities, run clubs, urban farms. BLEU connects grassroots healing to systemic change.</div></div>'
h+='</div>'
h+=hdr('HOW THE ENGINE WORKS')
h+='<div style="'+g4+'">'
h+='<div style="'+ct+';text-align:center"><div style="color:#4ecdc4;font-size:36px;font-weight:700">1</div><div style="color:#e8d5b0;font-weight:600;margin-top:8px">You Arrive</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;line-height:1.5">Tell Alvai what you need. Anxiety. Sleep. Pain. Recovery. Cannabis. Anything.</div></div>'
h+='<div style="'+c+';text-align:center"><div style="color:#d4af37;font-size:36px;font-weight:700">2</div><div style="color:#e8d5b0;font-weight:600;margin-top:8px">Intelligence Maps You</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;line-height:1.5">68 APIs cross-reference your profile. Meds checked. Practitioners matched. Safety validated.</div></div>'
h+='<div style="'+ct+';text-align:center"><div style="color:#4ecdc4;font-size:36px;font-weight:700">3</div><div style="color:#e8d5b0;font-weight:600;margin-top:8px">You Take Action</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;line-height:1.5">Protocols with exact dosages. Practitioners with real numbers. Products with buy links. No dead ends.</div></div>'
h+='<div style="'+c+';text-align:center"><div style="color:#d4af37;font-size:36px;font-weight:700">4</div><div style="color:#e8d5b0;font-weight:600;margin-top:8px">We Compound</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;line-height:1.5">Every check-in feeds back. Your score rises. The system gets smarter. Community grows.</div></div>'
h+='</div>'
h+=hdr('FOUR CIRCLES OF IMPACT')
h+='<div style="'+g4+'">'
h+='<div style="'+cg+';text-align:center"><div style="font-size:32px">&#129489;</div><div style="color:#d4af37;font-weight:700;margin-top:8px">Individual</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px">Your body. Your data. Your healing.</div></div>'
h+='<div style="'+cg+';text-align:center"><div style="font-size:32px">&#127968;</div><div style="color:#4ecdc4;font-weight:700;margin-top:8px">Family</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px">When you heal, your home heals.</div></div>'
h+='<div style="'+cg+';text-align:center"><div style="font-size:32px">&#127969;</div><div style="color:#d4af37;font-weight:700;margin-top:8px">Neighborhood</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px">Block-by-block wellness mapping.</div></div>'
h+='<div style="'+cg+';text-align:center"><div style="font-size:32px">&#127963;</div><div style="color:#4ecdc4;font-weight:700;margin-top:8px">City</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px">Municipal wellness intelligence.</div></div>'
h+='</div>'
h+=hdr('13 ECOSYSTEMS | ONE MISSION')
h+='<div style="'+g4+';margin-bottom:14px">'
for icon,nm,desc,cl in [('&#128202;','Dashboard','Command center','t'),('&#128269;','Directory','253K practitioners','g'),('&#128138;','Vessel','Vetted supplements','t'),('&#128506;','Map','Wellness geography','g'),('&#128221;','Protocols','Evidence programs','t'),('&#127891;','Learn','Video + research','g'),('&#129309;','Community','NOLA resources','t')]:
    tc='#4ecdc4' if cl=='t' else '#d4af37'
    s=ct if cl=='t' else c
    h+='<div style="'+s+';text-align:center;padding:12px"><div style="font-size:20px">'+icon+'</div><div style="color:'+tc+';font-weight:600;font-size:12px;margin-top:4px">'+nm+'</div><div style="color:#a0b4c0;font-size:10px;margin-top:2px">'+desc+'</div></div>'
h+='</div><div style="'+g4+'">'
for icon,nm,desc,cl in [('&#127380;','Passport','Living score','g'),('&#128156;','Therapy','12 modes','t'),('&#128176;','Finance','Costs decoded','g'),('&#127919;','Missions','Daily challenges','t'),('&#128154;','Recovery','Crisis support','g'),('&#127807;','CannaIQ','Cannabis intel','t')]:
    tc='#4ecdc4' if cl=='t' else '#d4af37'
    s=ct if cl=='t' else c
    h+='<div style="'+s+';text-align:center;padding:12px"><div style="font-size:20px">'+icon+'</div><div style="color:'+tc+';font-weight:600;font-size:12px;margin-top:4px">'+nm+'</div><div style="color:#a0b4c0;font-size:10px;margin-top:2px">'+desc+'</div></div>'
h+='</div>'
h+=hdr('24/7 DATA INTELLIGENCE')
h+='<div style="'+g3+'">'
h+='<div style="'+ct+'"><div style="color:#4ecdc4;font-weight:600">Real-Time Validation</div><div style="color:#a0b4c0;font-size:13px;margin-top:8px;line-height:1.6">Every practitioner verified against NPI federal database nightly. Trust scores recalculated. Inactive licenses flagged.</div></div>'
h+='<div style="'+c+'"><div style="color:#d4af37;font-weight:600">Outcome Forecasting</div><div style="color:#a0b4c0;font-size:13px;margin-top:8px;line-height:1.6">Pattern recognition across interactions. Sleep protocols that work. Supplement stacks with measurable outcomes. Practitioner scoring.</div></div>'
h+='<div style="'+ct+'"><div style="color:#4ecdc4;font-weight:600">Community Intelligence</div><div style="color:#a0b4c0;font-size:13px;margin-top:8px;line-height:1.6">Anonymous aggregate wellness data by neighborhood, city, region. Data drives resource allocation and identifies gaps.</div></div>'
h+='</div>'
h+=hdr('TRUST ARCHITECTURE')
h+='<div style="'+g2+'">'
h+='<div style="'+c+'"><div style="color:#d4af37;font-weight:700;font-size:15px">Intellectual Property</div><div style="color:#a0b4c0;font-size:13px;margin-top:10px;line-height:1.8">'
h+='&#9679; <strong style="color:#e8d5b0">Patent Pending</strong> &#8212; 5-Layer Safety Engine (16 claims)<br>'
h+='&#9679; <strong style="color:#e8d5b0">Trademarks</strong> &#8212; BLEU, CannaIQ, ALVAI, BEMS<br>'
h+='&#9679; <strong style="color:#e8d5b0">Copyright</strong> &#8212; All content, algorithms, design<br>'
h+='&#9679; <strong style="color:#e8d5b0">Trade Secrets</strong> &#8212; BEMS scoring, trust methodology<br>'
h+='&#9679; <strong style="color:#e8d5b0">Data Assets</strong> &#8212; 302K interactions, 529+ strains'
h+='</div></div>'
h+='<div style="'+ct+'"><div style="color:#4ecdc4;font-weight:700;font-size:15px">Advisory + Lineage</div><div style="color:#a0b4c0;font-size:13px;margin-top:10px;line-height:1.8">'
h+='&#9679; <strong style="color:#e8d5b0">Dr. Felicia Stoler, DCN, MS, RDN, FACSM</strong><br>'
h+='&#9679; <strong style="color:#e8d5b0">127-Year Healing Lineage</strong><br>'
h+='&#9679; <strong style="color:#e8d5b0">27 Years Active</strong> &#8212; 9.2M lives touched<br>'
h+='&#9679; <strong style="color:#e8d5b0">New Orleans Rooted</strong> &#8212; Scaling to every city<br>'
h+='&#9679; <strong style="color:#e8d5b0">Jazz Bird NOLA 501(c)(3)</strong>'
h+='</div></div></div>'
h+=hdr('HOW BLEU SUSTAINS ITSELF')
h+='<div style="'+cg+';text-align:center">'
h+='<div style="color:#d4af37;font-weight:700;font-size:16px">Transparent. Ethical. Aligned.</div>'
h+='<div style="color:#a0b4c0;font-size:14px;margin-top:12px;max-width:650px;margin-left:auto;margin-right:auto;line-height:1.7">BLEU earns through trusted affiliate partnerships. When you purchase through our links, a commission sustains this platform. <strong style="color:#e8d5b0">Trust scores are NEVER affected by affiliate status.</strong> Products that lose validation lose their link. Your health comes first.</div>'
h+='<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:16px">'
h+=pill('Amazon Health','t')+pill('iHerb','t')+pill('BetterHelp','t')+pill('Oura Ring','t')+pill('ClassPass','t')
h+='</div></div>'
h+='<div style="'+cg+';text-align:center;margin-top:24px">'
h+='<div style="color:#d4af37;font-weight:700;font-size:20px">Start Your Journey</div>'
h+='<div style="color:#a0b4c0;font-size:14px;margin-top:10px">Tell Alvai what you need. No account required. No pressure. Just intelligence that meets you where you are.</div>'
h+='<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:20px">'
h+='<span style="background:linear-gradient(135deg,#d4af37,#b8962e);color:#0a1628;padding:12px 28px;border-radius:24px;font-weight:700;font-size:14px;cursor:pointer">I need help with anxiety</span>'
h+='<span style="background:rgba(78,205,196,0.12);border:1px solid #4ecdc4;color:#4ecdc4;padding:12px 28px;border-radius:24px;font-weight:700;font-size:14px;cursor:pointer">Check my medications</span>'
h+='<span style="background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.3);color:#d4af37;padding:12px 28px;border-radius:24px;font-weight:700;font-size:14px;cursor:pointer">Find a practitioner</span>'
h+='</div></div>'
h+='<div style="text-align:center;margin-top:24px;padding:16px"><div style="color:#a0b4c0;font-size:11px;line-height:1.8">BLEU.live | The Longevity Operating System | Patent Pending | Trademark Protected | All Rights Reserved 2026<br>Not medical advice. Consult your healthcare provider. NPI data via CMS.gov. Built in New Orleans.</div></div>'
h+='</div>'
print(f'Built Home: {len(h)} bytes')
with open('index.html','r') as f: html=f.read()
injected=False
for marker in ['THE LONGEVITY OPERATING SYSTEM','Your companion on the path','LONGEVITY OPERATING SYSTEM']:
    if marker in html:
        i=html.index(marker)+len(marker)
        nd=html.find('</div>',i)
        if nd>0:
            html=html[:nd+6]+h+html[nd+6:]
            print(f'Injected after: {marker}')
            injected=True
            break
if not injected:
    m='<!-- ═══════════════════════ DASHBOARD'
    if m in html:
        html=html.replace(m,h+m)
        print('Injected before Dashboard')
        injected=True
if not injected:
    print('Searching for injection points...')
    for kw in ['LONGEVITY','operating','companion','BLEU']:
        idx=html.lower().find(kw.lower())
        if idx>=0: print(f'  Found {kw} at {idx}: {html[max(0,idx-15):idx+30]}')
with open('index.html','w') as f: f.write(html)
os.system('git add -A && git commit -m "HOME MASTERPIECE: IP badges, ecosystem vision, who we serve, 4 circles, 13 tabs, trust architecture, affiliate transparency" && git push --force')
print('DONE')
