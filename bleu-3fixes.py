#!/usr/bin/env python3
"""Fix 3 missing: Enterprise Timeline + B.L.E.U. + Home Animation JS"""
import sys, os
FILE = "index.html"
if not os.path.exists(FILE):
    print("run from repo root"); sys.exit(1)

with open(FILE, "r", encoding="utf-8") as f:
    html = f.read()
orig = len(html)
fixes = 0

if 'initHomeAnimations' not in html:
    HOME_JS = '<script>\n(function(){function initHomeAnimations(){var obs=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add("visible");obs.unobserve(e.target)}})},{threshold:0.05,rootMargin:"0px 0px -30px 0px"});var hp=document.getElementById("p-home");if(hp){hp.querySelectorAll("[onclick]").forEach(function(c,i){c.classList.add("home-card-animate");c.style.transitionDelay=(i*0.08)+"s";obs.observe(c)});hp.querySelectorAll("h1,h2,h3,p").forEach(function(t,i){if(!t.closest("[onclick]")){t.classList.add("home-reveal");t.style.transitionDelay=(i*0.05)+"s";obs.observe(t)}})}document.querySelectorAll(".home-reveal,.home-card-animate").forEach(function(el){obs.observe(el)})}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",initHomeAnimations)}else{initHomeAnimations()}var origGo=window.go;if(origGo){window.go=function(tab){origGo(tab);if(tab==="home"){setTimeout(initHomeAnimations,100)}}}})();\n</script>'
    html = html.replace('</body>', HOME_JS + '\n</body>', 1)
    fixes += 1
    print("fix 1: Home Animation JS")

if 'entSetPhase' not in html:
    TL_JS = '<script>\nvar entPhases=[{label:"Week 1-2",title:"Data Integration",color:"#60A5FA",items:["Connect federal APIs (EPA, SAMHSA, NPI, FDA, NIH, CMS)","Import existing provider databases","Configure neighborhood scoring dimensions","Deploy Alvai with 22 therapeutic modes","Launch portal"]},{label:"Month 1",title:"Intelligence Activated",color:"#C8A951",items:["Real-time dashboards live","Full platform access: therapy, directory, supplements","AI learning community patterns","First wellness scores published","Crisis resources integrated: 988, SAMHSA"]},{label:"Month 3",title:"Measurable Outcomes",color:"#2DD4A8",items:["ER visit reduction: 12-18% drop","Employee health claims trending down","Community engagement metrics live","Provider network expanding","First ROI report: audit-ready"]},{label:"Month 6-12",title:"Compounding Returns",color:"#F472B6",items:["Healthcare savings: 23% reduction","Population health scores trending up","Federal grant apps with validated data","Network effects accelerating","Year 1 ROI: $3.27 per $1 invested"]}];function entSetPhase(idx){var p=entPhases[idx];var btns=document.getElementById("entPhaseButtons");if(!btns)return;var h="";entPhases.forEach(function(phase,i){var a=i===idx;h+="<button class=ent-phase onclick=entSetPhase("+i+") style=background:"+(a?phase.color+"18":"transparent")+";border:1px_solid_"+(a?phase.color+"40":"rgba(255,255,255,.06)")+";color:"+(a?phase.color:"#5A6374")+";padding:10px_20px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;letter-spacing:1px;font-family:inherit>"+phase.label+"</button> "});btns.innerHTML=h;var c=document.getElementById("entPhaseContent");if(!c)return;c.style.borderLeftColor=p.color;var ch="<div style=font-size:12px;letter-spacing:3px;color:"+p.color+";font-weight:700;margin-bottom:6px>"+p.label+"</div><h3 style=font-family:Georgia,serif;font-size:22px;font-weight:400;color:#E2E8F0;margin-bottom:16px>"+p.title+"</h3>";p.items.forEach(function(item,i){ch+="<div style=display:flex;gap:10px;align-items:flex-start;margin-bottom:10px><span style=color:"+p.color+";font-weight:700>&#10022;</span><span style=font-size:14px;color:#8B95A5;line-height:1.6>"+item+"</span></div>"});c.innerHTML=ch}entSetPhase(0);\n</script>'
    html = html.replace('</body>', TL_JS + '\n</body>', 1)
    fixes += 1
    print("fix 2: Enterprise Timeline JS")

ent_idx = html.find('id="p-enterprise"')
if ent_idx > 0:
    next_p = html.find('id="p-', ent_idx + 20)
    if next_p < 0: next_p = len(html)
    if 'Believe' not in html[ent_idx:next_p]:
        cta = html.find('START THE CONVERSATION', ent_idx)
        if cta > 0:
            spot = html.find('</div>', cta)
            spot = html.find('</div>', spot + 6)
            spot = html.find('</div>', spot + 6) + 6
            BLEU = '\n<div style="text-align:center;padding:28px 0;border-top:1px solid rgba(200,169,81,.12)"><div style="display:flex;justify-content:center;gap:32px;margin-bottom:14px"><div><span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#C8A951">B</span><span style="font-size:15px;color:#8B95A5;margin-left:4px">elieve</span></div><div><span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#C8A951">L</span><span style="font-size:15px;color:#8B95A5;margin-left:4px">ove</span></div><div><span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#C8A951">E</span><span style="font-size:15px;color:#8B95A5;margin-left:4px">volve</span></div><div><span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#C8A951">U</span><span style="font-size:15px;color:#8B95A5;margin-left:4px">nite</span></div></div><p style="font-size:13px;color:#5A6374;max-width:600px;margin:0 auto;line-height:1.7;font-style:italic">The Longevity Operating System. 525,965 verified records. 247 federal data sources. 15 intelligence systems. Medical oversight by Dr. Felicia Stoler (DCN, MS, RDN, FACSM, FAND, Dipl ACLM). Patent Pending.</p></div>\n'
            html = html[:spot] + BLEU + html[spot:]
            fixes += 1
            print("fix 3: B.L.E.U. block added")

ok1 = 'initHomeAnimations' in html
ok2 = 'entSetPhase' in html
ok3 = 'Believe' in html[html.find('id="p-enterprise"'):] if 'id="p-enterprise"' in html else False
print(f"\n{'Y' if ok1 else 'N'} Home JS | {'Y' if ok2 else 'N'} Timeline | {'Y' if ok3 else 'N'} BLEU")
print(f"Fixes: {fixes} | Size: {orig:,} -> {len(html):,}")

with open(FILE, "w", encoding="utf-8") as f:
    f.write(html)

if ok1 and ok2 and ok3:
    print("\nALL 3 FIXED - deploy now")
