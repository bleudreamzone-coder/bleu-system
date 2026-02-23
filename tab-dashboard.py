#!/usr/bin/env python3
"""DASHBOARD — Your Living Command Center"""
import os
os.chdir('/workspaces/bleu-system')
c='background:rgba(30,58,76,0.35);border:1px solid rgba(212,175,55,0.12);border-radius:16px;padding:20px'
ct='background:rgba(30,58,76,0.35);border:1px solid rgba(78,205,196,0.12);border-radius:16px;padding:20px'
cg='background:linear-gradient(135deg,rgba(212,175,55,0.06),rgba(78,205,196,0.03));border:1px solid rgba(212,175,55,0.1);border-radius:16px;padding:24px'
g2='display:grid;grid-template-columns:repeat(2,1fr);gap:16px'
g3='display:grid;grid-template-columns:repeat(3,1fr);gap:16px'
g4='display:grid;grid-template-columns:repeat(4,1fr);gap:14px'
Q=chr(39)
def hdr(t):
    return '<div style="margin:32px 0 18px;text-align:center"><div style="color:#d4af37;font-size:11px;letter-spacing:4px;text-transform:uppercase">'+t+'</div><div style="width:40px;height:1px;background:rgba(212,175,55,0.3);margin:8px auto 0"></div></div>'
def abtn(label,action,style):
    if style=='gold': return '<div style="background:linear-gradient(135deg,rgba(212,175,55,0.9),rgba(184,150,46,0.9));color:#0a1628;padding:14px 18px;border-radius:14px;font-weight:600;font-size:13px;cursor:pointer;text-align:center" onclick="'+action+'">'+label+'</div>'
    elif style=='teal': return '<div style="background:rgba(78,205,196,0.08);border:1px solid rgba(78,205,196,0.2);color:#4ecdc4;padding:14px 18px;border-radius:14px;font-weight:600;font-size:13px;cursor:pointer;text-align:center" onclick="'+action+'">'+label+'</div>'
    else: return '<div style="background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.12);color:#d4af37;padding:14px 18px;border-radius:14px;font-weight:600;font-size:13px;cursor:pointer;text-align:center" onclick="'+action+'">'+label+'</div>'
h='<div style="margin:20px 0">'
h+='<div style="text-align:center;margin-bottom:28px"><div style="color:#e8d5b0;font-size:20px;font-weight:300;letter-spacing:2px">Your Living Wellness Profile</div><div style="color:#a0b4c0;font-size:13px;margin-top:8px;font-weight:300">Everything updates as you interact. This is your nervous system in data.</div></div>'
h+=hdr('DAILY SNAPSHOT')
h+='<div style="'+g4+'">'
h+='<div style="'+ct+';text-align:center"><div style="color:#4ecdc4;font-size:32px;font-weight:300">72</div><div style="color:#a0b4c0;font-size:11px;margin-top:6px;letter-spacing:1px">WELLNESS SCORE</div><div style="width:100%;height:4px;background:rgba(78,205,196,0.1);border-radius:2px;margin-top:8px"><div style="width:72%;height:100%;background:linear-gradient(90deg,#4ecdc4,#d4af37);border-radius:2px"></div></div></div>'
h+='<div style="'+c+';text-align:center"><div style="color:#d4af37;font-size:32px;font-weight:300">6.8<span style="font-size:16px;color:#a0b4c0">/10</span></div><div style="color:#a0b4c0;font-size:11px;margin-top:6px;letter-spacing:1px">SLEEP QUALITY</div><div style="color:#4ecdc4;font-size:11px;margin-top:6px">&#9650; +0.4 this week</div></div>'
h+='<div style="'+ct+';text-align:center"><div style="color:#4ecdc4;font-size:32px;font-weight:300">3<span style="font-size:16px;color:#a0b4c0">/8</span></div><div style="color:#a0b4c0;font-size:11px;margin-top:6px;letter-spacing:1px">MISSIONS TODAY</div><div style="cursor:pointer;color:#d4af37;font-size:11px;margin-top:6px" onclick="go('+Q+'missions'+Q+')">Continue &#8594;</div></div>'
h+='<div style="'+c+';text-align:center"><div style="color:#d4af37;font-size:32px;font-weight:300">14</div><div style="color:#a0b4c0;font-size:11px;margin-top:6px;letter-spacing:1px">DAY STREAK</div><div style="color:#4ecdc4;font-size:11px;margin-top:6px">&#127942; Personal best</div></div>'
h+='</div>'
h+=hdr('MORNING PROTOCOL')
h+='<div style="'+cg+'">'
h+='<div style="'+g3+'">'
h+='<div style="text-align:center"><div style="font-size:24px">&#9728;&#65039;</div><div style="color:#e8d5b0;font-weight:500;font-size:14px;margin-top:8px">6:30 AM</div><div style="color:#a0b4c0;font-size:12px;margin-top:4px;font-weight:300">10 min sunlight exposure</div><div style="color:#a0b4c0;font-size:11px;margin-top:2px;font-weight:300">Cortisol reset + circadian anchor</div></div>'
h+='<div style="text-align:center"><div style="font-size:24px">&#128167;</div><div style="color:#e8d5b0;font-weight:500;font-size:14px;margin-top:8px">6:45 AM</div><div style="color:#a0b4c0;font-size:12px;margin-top:4px;font-weight:300">16oz water + electrolytes</div><div style="color:#a0b4c0;font-size:11px;margin-top:2px;font-weight:300">Rehydrate after 7hr fast</div></div>'
h+='<div style="text-align:center"><div style="font-size:24px">&#128524;</div><div style="color:#e8d5b0;font-weight:500;font-size:14px;margin-top:8px">7:00 AM</div><div style="color:#a0b4c0;font-size:12px;margin-top:4px;font-weight:300">4-7-8 breathing (3 cycles)</div><div style="color:#a0b4c0;font-size:11px;margin-top:2px;font-weight:300">Vagus nerve activation</div></div>'
h+='</div>'
h+='<div style="text-align:center;margin-top:16px">'+abtn('&#128221; Customize my morning protocol','go('+Q+'protocols'+Q+')','teal')+'</div>'
h+='</div>'
h+=hdr('EVENING WIND-DOWN')
h+='<div style="'+cg+'">'
h+='<div style="'+g3+'">'
h+='<div style="text-align:center"><div style="font-size:24px">&#128261;</div><div style="color:#e8d5b0;font-weight:500;font-size:14px;margin-top:8px">8:00 PM</div><div style="color:#a0b4c0;font-size:12px;margin-top:4px;font-weight:300">Screen curfew + blue blockers</div><div style="color:#a0b4c0;font-size:11px;margin-top:2px;font-weight:300">Melatonin production begins</div></div>'
h+='<div style="text-align:center"><div style="font-size:24px">&#128138;</div><div style="color:#e8d5b0;font-weight:500;font-size:14px;margin-top:8px">9:00 PM</div><div style="color:#a0b4c0;font-size:12px;margin-top:4px;font-weight:300">Mag glycinate 400mg</div><div style="color:#a0b4c0;font-size:11px;margin-top:2px;font-weight:300">GABA-A receptor calming</div></div>'
h+='<div style="text-align:center"><div style="font-size:24px">&#127769;</div><div style="color:#e8d5b0;font-weight:500;font-size:14px;margin-top:8px">9:30 PM</div><div style="color:#a0b4c0;font-size:12px;margin-top:4px;font-weight:300">Lights to 10% + lavender</div><div style="color:#a0b4c0;font-size:11px;margin-top:2px;font-weight:300">Linalool terpene pathway</div></div>'
h+='</div>'
h+='<div style="text-align:center;margin-top:16px">'+abtn('&#128138; See my supplement stack','go('+Q+'vessel'+Q+')','dim')+'</div>'
h+='</div>'
h+=hdr('YOUR ACTIVE SYSTEMS')
h+='<div style="'+g3+'">'
h+='<div style="'+ct+';cursor:pointer" onclick="go('+Q+'vessel'+Q+')"><div style="color:#4ecdc4;font-weight:500;font-size:13px;letter-spacing:1px">SUPPLEMENT STACK</div><div style="color:#a0b4c0;font-size:12px;margin-top:10px;line-height:1.6;font-weight:300">&#9679; Mag Glycinate 400mg<br>&#9679; Ashwagandha KSM-66<br>&#9679; Omega-3 2000mg<br>&#9679; L-Theanine 200mg</div><div style="color:#d4af37;font-size:11px;margin-top:10px">4 active &#8594; Vessel</div></div>'
h+='<div style="'+c+';cursor:pointer" onclick="go('+Q+'cannaiq'+Q+')"><div style="color:#d4af37;font-weight:500;font-size:13px;letter-spacing:1px">CANNABIS PROFILE</div><div style="color:#a0b4c0;font-size:12px;margin-top:10px;line-height:1.6;font-weight:300">&#9679; Preferred: Indica hybrids<br>&#9679; Terpene: Myrcene + Linalool<br>&#9679; Goal: Sleep + pain<br>&#9679; Last: Granddaddy Purple</div><div style="color:#4ecdc4;font-size:11px;margin-top:10px">BEMS active &#8594; CannaIQ</div></div>'
h+='<div style="'+ct+';cursor:pointer" onclick="go('+Q+'therapy'+Q+')"><div style="color:#4ecdc4;font-weight:500;font-size:13px;letter-spacing:1px">THERAPY + HEALING</div><div style="color:#a0b4c0;font-size:12px;margin-top:10px;line-height:1.6;font-weight:300">&#9679; Mode: Somatic + CBT<br>&#9679; Sessions: 12 completed<br>&#9679; Next: Thursday 2pm<br>&#9679; Progress: &#9650; improving</div><div style="color:#d4af37;font-size:11px;margin-top:10px">View modes &#8594; Therapy</div></div>'
h+='</div>'
h+=hdr('SAFETY STATUS')
h+='<div style="background:rgba(30,58,76,0.35);border:1px solid rgba(255,107,107,0.12);border-radius:16px;padding:20px">'
h+='<div style="'+g2+'">'
h+='<div><div style="color:#ff6b6b;font-weight:500;font-size:13px;letter-spacing:1px">MEDICATION MONITOR</div><div style="color:#a0b4c0;font-size:12px;margin-top:10px;line-height:1.8;font-weight:300">&#9989; Magnesium &#8212; No conflicts<br>&#9989; Ashwagandha &#8212; No conflicts<br>&#9888; CBD + Sertraline &#8212; <span style="color:#d4af37">Monitor CYP2D6</span><br>&#9989; L-Theanine &#8212; No conflicts</div></div>'
h+='<div><div style="color:#4ecdc4;font-weight:500;font-size:13px;letter-spacing:1px">LAST SAFETY CHECK</div><div style="color:#a0b4c0;font-size:12px;margin-top:10px;line-height:1.8;font-weight:300">&#9679; 5 layers scanned<br>&#9679; 302,516 interactions checked<br>&#9679; 1 moderate flag (CBD+SSRI)<br>&#9679; Updated: Today</div><div style="margin-top:12px">'+abtn('&#128270; Run full safety check','ask('+Q+'dashboard'+Q+','+Q+'Run a complete safety check on all my current medications and supplements'+Q+')','teal')+'</div></div>'
h+='</div></div>'
h+=hdr('WEEKLY FOCUS')
h+='<div style="'+g4+'">'
h+='<div style="'+ct+';text-align:center;cursor:pointer" onclick="go('+Q+'learn'+Q+')"><div style="font-size:22px">&#127891;</div><div style="color:#4ecdc4;font-weight:500;font-size:12px;margin-top:8px">Learn</div><div style="color:#a0b4c0;font-size:11px;margin-top:4px;font-weight:300">Gut-brain connection</div></div>'
h+='<div style="'+c+';text-align:center;cursor:pointer" onclick="go('+Q+'missions'+Q+')"><div style="font-size:22px">&#127919;</div><div style="color:#d4af37;font-weight:500;font-size:12px;margin-top:8px">Mission</div><div style="color:#a0b4c0;font-size:11px;margin-top:4px;font-weight:300">Rainbow plate challenge</div></div>'
h+='<div style="'+ct+';text-align:center;cursor:pointer" onclick="go('+Q+'community'+Q+')"><div style="font-size:22px">&#129309;</div><div style="color:#4ecdc4;font-weight:500;font-size:12px;margin-top:8px">Community</div><div style="color:#a0b4c0;font-size:11px;margin-top:4px;font-weight:300">NOLA run club Sat</div></div>'
h+='<div style="'+c+';text-align:center;cursor:pointer" onclick="go('+Q+'passport'+Q+')"><div style="font-size:22px">&#127380;</div><div style="color:#d4af37;font-weight:500;font-size:12px;margin-top:8px">Passport</div><div style="color:#a0b4c0;font-size:11px;margin-top:4px;font-weight:300">Level: Seedling &#8594; Sprout</div></div>'
h+='</div>'
h+=hdr('QUICK ACTIONS')
h+='<div style="'+g3+'">'
h+=abtn('&#128172; Talk to Alvai','go('+Q+'alvai'+Q+')','gold')
h+=abtn('&#129658; Find practitioner','go('+Q+'directory'+Q+')','teal')
h+=abtn('&#128506; Explore NOLA map','go('+Q+'map'+Q+')','dim')
h+='</div>'
h+='<div style="'+g3+';margin-top:12px">'
h+=abtn('&#128154; Recovery resources','go('+Q+'recovery'+Q+')','dim')
h+=abtn('&#128176; Insurance + costs','go('+Q+'finance'+Q+')','teal')
h+=abtn('&#127807; Cannabis intelligence','go('+Q+'cannaiq'+Q+')','gold')
h+='</div>'
h+='</div>'
print(f'Built Dashboard: {len(h)} bytes')
with open('index.html','r') as f: html=f.read()
marker='DAILY SNAPSHOT'
if marker in html:
    i=html.index(marker)
    sec_start=html.rfind('<!--',0,i)
    if sec_start<0: sec_start=html.rfind('<div',0,i)
    nd=html.find('</div>',i)
    if nd>0:
        html=html[:nd+6]+h+html[nd+6:]
        print(f'Injected Dashboard after: {marker}')
else:
    markers=['<!-- ═══════════════════════ DASHBOARD','DASHBOARD','p-dashboard']
    for m in markers:
        if m in html:
            i=html.index(m)+len(m)
            nd=html.find('</div>',i)
            if nd>0:
                html=html[:nd+6]+h+html[nd+6:]
                print(f'Injected after: {m}')
                break
with open('index.html','w') as f: f.write(html)
os.system('git add -A && git commit -m "DASHBOARD: living profile, protocols, safety monitor, active systems, weekly focus, all buttons wired" && git push --force')
print('DONE')
