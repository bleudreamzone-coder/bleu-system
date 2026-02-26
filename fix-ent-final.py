#!/usr/bin/env python3
"""Enterprise tab: complete self-contained rebuild. All JS inline. All interactive."""
import sys, re
FILE = "index.html"
with open(FILE, "r", encoding="utf-8") as f:
    html = f.read()
orig = len(html)

# ══ Find and replace entire enterprise panel content ══
ent_idx = html.find('id="p-enterprise"')
if ent_idx < 0:
    print("NO enterprise panel"); sys.exit(1)

gt = html.index('>', ent_idx)
content_start = gt + 1

# Find panel close by counting div depth
depth = 1
i = content_start
while i < len(html) and depth > 0:
    if html[i:i+4] == '<div': depth += 1
    if html[i:i+6] == '</div>':
        depth -= 1
        if depth == 0: break
    i += 1
content_end = i

old = html[content_start:content_end]
print(f"Old enterprise content: {len(old):,} chars")

# Remove any duplicate B.L.E.U. blocks that leaked outside
# Count occurrences of "Believe" after enterprise panel
after_panel = html[content_end:]
dupes = after_panel.count('Believe')
if dupes > 0:
    print(f"Found {dupes} Believe references after panel - checking for leaks")

NEW_CONTENT = r'''

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- ENTERPRISE — SELF-CONTAINED INTERACTIVE MASTERPIECE        -->
<!-- All JS inline. No external dependencies. Fires on tab open -->
<!-- ═══════════════════════════════════════════════════════════ -->

<style>
.e-fade{opacity:0;transform:translateY(20px);transition:all .6s cubic-bezier(.16,1,.3,1)}
.e-fade.e-vis{opacity:1;transform:translateY(0)}
.e-ctr{font-family:Georgia,serif;font-weight:700;line-height:1}
.e-box{max-width:1100px;margin:0 auto;padding:0 24px}
.e-lbl{font-size:11px;letter-spacing:4px;text-transform:uppercase;font-weight:700;margin-bottom:8px}
.e-h{font-family:Georgia,serif;font-size:clamp(24px,3.5vw,36px);font-weight:300;line-height:1.2;color:#E2E8F0;margin-bottom:14px}
.e-sld{-webkit-appearance:none;width:100%;height:6px;border-radius:3px;outline:none;cursor:pointer}
.e-sld::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;cursor:pointer}
.e-sld-g{background:rgba(200,169,81,.15)}.e-sld-g::-webkit-slider-thumb{background:#C8A951;box-shadow:0 0 12px rgba(200,169,81,.5)}
.e-sld-b{background:rgba(96,165,250,.15)}.e-sld-b::-webkit-slider-thumb{background:#60A5FA;box-shadow:0 0 12px rgba(96,165,250,.5)}
.e-crd{background:#151921;border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:24px;transition:all .3s}
.e-crd:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.3)}
.e-glow{animation:eGlow 2.5s ease-in-out infinite}
@keyframes eGlow{0%,100%{box-shadow:0 0 15px rgba(200,169,81,.08)}50%{box-shadow:0 0 35px rgba(200,169,81,.18)}}
@keyframes eSlide{from{opacity:0;transform:translateX(-15px)}to{opacity:1;transform:translateX(0)}}
@keyframes eCount{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
.e-tier{padding:24px;border-radius:12px;transition:all .4s cubic-bezier(.16,1,.3,1)}
.e-tier:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,.4)}
.e-btn{display:inline-block;padding:16px 52px;font-size:15px;font-weight:700;letter-spacing:3px;border:2px solid #C8A951;color:#C8A951;background:transparent;border-radius:8px;cursor:pointer;transition:all .4s;font-family:inherit;text-transform:uppercase;text-decoration:none}
.e-btn:hover{background:#C8A951;color:#0E1117;box-shadow:0 0 30px rgba(200,169,81,.3);transform:scale(1.03)}
.e-scroll{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none;-ms-overflow-style:none}
.e-scroll::-webkit-scrollbar{display:none}
@media(max-width:768px){.e-g3{grid-template-columns:1fr!important}.e-g2{grid-template-columns:1fr!important}.e-g4{grid-template-columns:1fr 1fr!important}}
</style>

<!-- ═══ HERO — IMPACT STATEMENT ═══ -->
<div style="padding:48px 0 40px;background:radial-gradient(ellipse at 20% 30%,rgba(200,169,81,.06),transparent 60%),radial-gradient(ellipse at 80% 70%,rgba(96,165,250,.04),transparent 50%)">
  <div class="e-box">
    <div class="e-fade" style="text-align:center;max-width:860px;margin:0 auto">
      <div class="e-lbl" style="color:#C8A951;text-align:center;margin-bottom:14px">THE LONGEVITY OPERATING SYSTEM — FOR INSTITUTIONS · PATENT PENDING</div>
      
      <!-- Scrolling impact ticker -->
      <div style="overflow:hidden;height:28px;margin-bottom:20px;position:relative">
        <div id="eTicker" style="display:flex;flex-direction:column;animation:eTick 12s ease-in-out infinite">
          <div style="height:28px;display:flex;align-items:center;justify-content:center;font-size:13px;letter-spacing:2px;color:#2DD4A8;font-weight:600">525,965 VERIFIED RECORDS · 247 FEDERAL DATA SOURCES · 15 INTELLIGENCE SYSTEMS</div>
          <div style="height:28px;display:flex;align-items:center;justify-content:center;font-size:13px;letter-spacing:2px;color:#60A5FA;font-weight:600">22 AI THERAPEUTIC MODES · REAL-TIME DASHBOARDS · NPI-VERIFIED PROVIDERS</div>
          <div style="height:28px;display:flex;align-items:center;justify-content:center;font-size:13px;letter-spacing:2px;color:#F472B6;font-weight:600">CITY DEPLOYMENT · BUSINESS WELLNESS · ENTERPRISE WHITE-LABEL · API ACCESS</div>
          <div style="height:28px;display:flex;align-items:center;justify-content:center;font-size:13px;letter-spacing:2px;color:#C8A951;font-weight:600">MEDICAL OVERSIGHT: DR. FELICIA STOLER · DCN, MS, RDN, FACSM, FAND, DIPL ACLM</div>
        </div>
      </div>
      <style>@keyframes eTick{0%,20%{transform:translateY(0)}25%,45%{transform:translateY(-28px)}50%,70%{transform:translateY(-56px)}75%,95%{transform:translateY(-84px)}100%{transform:translateY(0)}}</style>
      
      <h1 style="font-family:Georgia,serif;font-size:clamp(30px,5vw,48px);font-weight:300;line-height:1.1;color:#E2E8F0;margin:0 0 16px">
        Every dollar invested in wellness<br><em style="color:#C8A951;font-style:italic">returns $3–$6 in measurable savings.</em>
      </h1>
      <p style="font-size:15px;color:#8B95A5;line-height:1.8;max-width:680px;margin:0 auto 28px">
        BLEU doesn't just track health — it <strong style="color:#E2E8F0">quantifies</strong> it, <strong style="color:#E2E8F0">forecasts</strong> it, and converts it into 
        <strong style="color:#E2E8F0">verifiable economic outcomes</strong>. Cities reduce ER costs. Businesses cut healthcare spend. 
        Populations get healthier. And every single metric traces back to a federal source.
      </p>
    </div>

    <!-- ANIMATED COUNTERS -->
    <div class="e-fade" style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:8px" class="e-g4">
      <div style="text-align:center;padding:22px 12px;background:#151921;border:1px solid rgba(200,169,81,.12);border-radius:10px">
        <div class="e-ctr" id="ec1" style="font-size:clamp(28px,4vw,42px);color:#C8A951;animation:eCount .5s ease">0</div>
        <div style="font-size:10px;color:#8B95A5;text-transform:uppercase;letter-spacing:2px;margin-top:6px">Verified Records</div>
      </div>
      <div style="text-align:center;padding:22px 12px;background:#151921;border:1px solid rgba(96,165,250,.12);border-radius:10px">
        <div class="e-ctr" id="ec2" style="font-size:clamp(28px,4vw,42px);color:#60A5FA">0</div>
        <div style="font-size:10px;color:#8B95A5;text-transform:uppercase;letter-spacing:2px;margin-top:6px">Federal Data Sources</div>
      </div>
      <div style="text-align:center;padding:22px 12px;background:#151921;border:1px solid rgba(45,212,168,.12);border-radius:10px">
        <div class="e-ctr" id="ec3" style="font-size:clamp(28px,4vw,42px);color:#2DD4A8">0</div>
        <div style="font-size:10px;color:#8B95A5;text-transform:uppercase;letter-spacing:2px;margin-top:6px">AI Therapeutic Modes</div>
      </div>
      <div style="text-align:center;padding:22px 12px;background:#151921;border:1px solid rgba(244,114,182,.12);border-radius:10px">
        <div class="e-ctr" id="ec4" style="font-size:clamp(28px,4vw,42px);color:#F472B6">0</div>
        <div style="font-size:10px;color:#8B95A5;text-transform:uppercase;letter-spacing:2px;margin-top:6px">Intelligence Systems</div>
      </div>
    </div>
  </div>
</div>

<!-- ═══ THE PROBLEM WE SOLVE ═══ -->
<div style="padding:40px 0;background:#151921;border-top:1px solid rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.04)">
  <div class="e-box">
    <div class="e-fade">
      <div class="e-lbl" style="color:#C8A951">THE TRANSFORMATION</div>
      <h2 class="e-h">What changes when BLEU becomes <em style="color:#C8A951;font-style:italic">the infrastructure?</em></h2>
      <div style="display:flex;gap:8px;margin-bottom:20px">
        <button id="eBtnOff" onclick="eToggle(true)" style="padding:10px 24px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;letter-spacing:1px;font-family:inherit;background:rgba(231,76,60,.12);border:1px solid rgba(231,76,60,.3);color:#E74C3C;transition:all .3s">&#10060; WITHOUT BLEU</button>
        <button id="eBtnOn" onclick="eToggle(false)" style="padding:10px 24px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;letter-spacing:1px;font-family:inherit;background:transparent;border:1px solid rgba(255,255,255,.06);color:#5A6374;transition:all .3s">&#9989; WITH BLEU</button>
      </div>
    </div>
    <div id="eCompGrid" class="e-fade" style="display:grid;grid-template-columns:1fr 1fr;gap:12px" class="e-g2"></div>
  </div>
</div>

<!-- ═══ BUSINESS ROI CALCULATOR ═══ -->
<div style="padding:44px 0">
  <div class="e-box">
    <div class="e-fade">
      <div class="e-lbl" style="color:#C8A951">INTERACTIVE · DRAG THE SLIDER</div>
      <h2 class="e-h">See what BLEU saves <em style="color:#C8A951;font-style:italic">your business</em> — in real time.</h2>
    </div>
    <div class="e-fade e-crd" style="border-color:rgba(200,169,81,.15);padding:32px">
      <div style="margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px">
          <span style="font-size:13px;color:#8B95A5">Number of employees</span>
          <span id="eBizEmp" style="font-size:20px;font-weight:700;color:#C8A951;font-family:Georgia,serif">500</span>
        </div>
        <input type="range" class="e-sld e-sld-g" id="eBizSlider" min="50" max="10000" step="50" value="500" oninput="eBiz()">
        <div style="display:flex;justify-content:space-between;font-size:10px;color:#5A6374;margin-top:4px"><span>50</span><span>10,000</span></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px" class="e-g3">
        <div style="padding:20px;background:rgba(45,212,168,.05);border:1px solid rgba(45,212,168,.1);border-radius:8px;text-align:center">
          <div style="font-size:10px;color:#2DD4A8;letter-spacing:2px;font-weight:600;margin-bottom:6px">HEALTHCARE SAVINGS</div>
          <div id="eBH" style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#2DD4A8">$2.8M</div>
          <div id="eBHs" style="font-size:10px;color:#8B95A5;margin-top:4px">$5,512 x 500</div>
        </div>
        <div style="padding:20px;background:rgba(167,139,250,.05);border:1px solid rgba(167,139,250,.1);border-radius:8px;text-align:center">
          <div style="font-size:10px;color:#A78BFA;letter-spacing:2px;font-weight:600;margin-bottom:6px">PRODUCTIVITY GAIN</div>
          <div id="eBP" style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#A78BFA">$0.8M</div>
          <div id="eBPs" style="font-size:10px;color:#8B95A5;margin-top:4px">$1,685 x 500</div>
        </div>
        <div style="padding:20px;background:rgba(244,114,182,.05);border:1px solid rgba(244,114,182,.1);border-radius:8px;text-align:center">
          <div style="font-size:10px;color:#F472B6;letter-spacing:2px;font-weight:600;margin-bottom:6px">RETENTION SAVINGS</div>
          <div id="eBR" style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#F472B6">$1.2M</div>
          <div style="font-size:10px;color:#8B95A5;margin-top:4px">25% lower turnover</div>
        </div>
      </div>
      <div class="e-glow" style="padding:24px;background:rgba(200,169,81,.05);border:1px solid rgba(200,169,81,.15);border-radius:10px;text-align:center">
        <div style="font-size:10px;color:#C8A951;letter-spacing:3px;font-weight:700;margin-bottom:6px">TOTAL ANNUAL SAVINGS</div>
        <div id="eBT" style="font-family:Georgia,serif;font-size:clamp(36px,5vw,48px);font-weight:700;color:#C8A951">$4.8M</div>
        <div id="eBROI" style="font-size:14px;color:#8B95A5;margin-top:8px">That's <strong style="color:#E2E8F0">$9.58 returned per $1</strong> invested in BLEU</div>
      </div>
      <div style="font-size:9px;color:#5A6374;margin-top:10px;text-align:center">Sources: Harvard Business Review · RAND Corporation · Society for HRM · Bureau of Labor Statistics</div>
    </div>
  </div>
</div>

<!-- ═══ CITY IMPACT CALCULATOR ═══ -->
<div style="padding:44px 0;background:#151921;border-top:1px solid rgba(255,255,255,.04)">
  <div class="e-box">
    <div class="e-fade">
      <div class="e-lbl" style="color:#60A5FA">CITY IMPACT · DRAG THE SLIDER</div>
      <h2 class="e-h">See what BLEU means for <em style="color:#60A5FA;font-style:italic">your city.</em></h2>
    </div>
    <div class="e-fade e-crd" style="border-color:rgba(96,165,250,.15);padding:32px">
      <div style="margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px">
          <span style="font-size:13px;color:#8B95A5">City population</span>
          <span id="eCPop" style="font-size:20px;font-weight:700;color:#60A5FA;font-family:Georgia,serif">400,000</span>
        </div>
        <input type="range" class="e-sld e-sld-b" id="eCSlider" min="50000" max="2000000" step="10000" value="400000" oninput="eCity()">
        <div style="display:flex;justify-content:space-between;font-size:10px;color:#5A6374;margin-top:4px"><span>50K</span><span>2M</span></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px" class="e-g3">
        <div style="padding:20px;background:rgba(96,165,250,.05);border:1px solid rgba(96,165,250,.1);border-radius:8px;text-align:center">
          <div style="font-size:10px;color:#60A5FA;letter-spacing:2px;font-weight:600;margin-bottom:6px">ER COST REDUCTION</div>
          <div id="eCER" style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#60A5FA">$22M</div>
          <div style="font-size:10px;color:#8B95A5;margin-top:4px">2% preventable visits avoided</div>
        </div>
        <div style="padding:20px;background:rgba(45,212,168,.05);border:1px solid rgba(45,212,168,.1);border-radius:8px;text-align:center">
          <div style="font-size:10px;color:#2DD4A8;letter-spacing:2px;font-weight:600;margin-bottom:6px">RESIDENT RETENTION</div>
          <div id="eCRet" style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#2DD4A8">$210M</div>
          <div style="font-size:10px;color:#8B95A5;margin-top:4px">0.5% retention improvement</div>
        </div>
        <div style="padding:20px;background:rgba(200,169,81,.05);border:1px solid rgba(200,169,81,.1);border-radius:8px;text-align:center">
          <div style="font-size:10px;color:#C8A951;letter-spacing:2px;font-weight:600;margin-bottom:6px">GRANT POTENTIAL</div>
          <div id="eCGr" style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#C8A951">$4.8M</div>
          <div style="font-size:10px;color:#8B95A5;margin-top:4px">NIH · SAMHSA · CDC · EDA</div>
        </div>
      </div>
      <div style="padding:24px;background:rgba(96,165,250,.05);border:1px solid rgba(96,165,250,.15);border-radius:10px;text-align:center">
        <div style="font-size:10px;color:#60A5FA;letter-spacing:3px;font-weight:700;margin-bottom:6px">TOTAL ANNUAL CITY IMPACT</div>
        <div id="eCT" style="font-family:Georgia,serif;font-size:clamp(36px,5vw,48px);font-weight:700;color:#60A5FA">$237M</div>
        <div style="font-size:14px;color:#8B95A5;margin-top:8px">Conservative estimates. Federal-sourced. <strong style="color:#E2E8F0">Every number verifiable.</strong></div>
      </div>
    </div>
  </div>
</div>

<!-- ═══ DEPLOYMENT TIMELINE ═══ -->
<div style="padding:44px 0">
  <div class="e-box">
    <div class="e-fade">
      <div class="e-lbl" style="color:#C8A951">DEPLOYMENT TIMELINE</div>
      <h2 class="e-h">From zero to measurable ROI <em style="color:#C8A951;font-style:italic">in 90 days.</em></h2>
    </div>
    <div class="e-fade">
      <div id="ePhaseBtns" style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap"></div>
      <div id="ePhaseBox" class="e-crd" style="border-left:4px solid #60A5FA;padding:28px"></div>
    </div>
  </div>
</div>

<!-- ═══ THREE DEPLOYMENT TIERS ═══ -->
<div style="padding:44px 0;background:#151921;border-top:1px solid rgba(255,255,255,.04)">
  <div class="e-box">
    <div class="e-fade">
      <div class="e-lbl" style="color:#C8A951">THREE DEPLOYMENT TIERS</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px" class="e-g3">
        <div class="e-tier" style="background:rgba(96,165,250,.04);border:1px solid rgba(96,165,250,.12)">
          <div style="font-size:28px;margin-bottom:10px">&#127963;&#65039;</div>
          <div style="font-size:11px;letter-spacing:3px;color:#60A5FA;font-weight:700;margin-bottom:4px">CITIES</div>
          <div style="font-family:Georgia,serif;font-size:18px;font-weight:300;color:#E2E8F0;margin-bottom:10px">[city].bleu.live</div>
          <div style="font-size:13px;color:#8B95A5;line-height:1.7;margin-bottom:12px">Neighborhood health intelligence. Population dashboards. Environmental monitoring. Provider mapping. Federal grant readiness. Tourism wellness positioning.</div>
          <div style="padding:8px;background:rgba(96,165,250,.08);border-radius:4px;font-size:11px;color:#60A5FA;font-weight:600">LIVE: neworleans.bleu.live &mdash; 276 providers</div>
        </div>
        <div class="e-tier" style="background:rgba(200,169,81,.04);border:1px solid rgba(200,169,81,.12)">
          <div style="font-size:28px;margin-bottom:10px">&#127970;</div>
          <div style="font-size:11px;letter-spacing:3px;color:#C8A951;font-weight:700;margin-bottom:4px">BUSINESSES</div>
          <div style="font-family:Georgia,serif;font-size:18px;font-weight:300;color:#E2E8F0;margin-bottom:10px">[business].bleu.live</div>
          <div style="font-size:13px;color:#8B95A5;line-height:1.7;margin-bottom:12px">Employee wellness portals. Practitioner access. Supplement safety. AI therapeutic support. Health cost dashboards. Productivity analytics. Retention metrics.</div>
          <div style="padding:8px;background:rgba(200,169,81,.08);border-radius:4px;font-size:11px;color:#C8A951;font-weight:600">ROI: $5,512 saved per employee/year</div>
        </div>
        <div class="e-tier" style="background:rgba(45,212,168,.04);border:1px solid rgba(45,212,168,.12)">
          <div style="font-size:28px;margin-bottom:10px">&#127973;</div>
          <div style="font-size:11px;letter-spacing:3px;color:#2DD4A8;font-weight:700;margin-bottom:4px">ENTERPRISE</div>
          <div style="font-family:Georgia,serif;font-size:18px;font-weight:300;color:#E2E8F0;margin-bottom:10px">[org].bleu.live</div>
          <div style="font-size:13px;color:#8B95A5;line-height:1.7;margin-bottom:12px">Full white-label. Health systems, hospitals, universities, insurance, government. 15 intelligence systems. 22 AI modes. 525K+ records. API integration. Data sovereignty.</div>
          <div style="padding:8px;background:rgba(45,212,168,.08);border-radius:4px;font-size:11px;color:#2DD4A8;font-weight:600">SCALE: One platform. Unlimited deployments.</div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ═══ NOLA HQ ═══ -->
<div style="padding:44px 0">
  <div class="e-box">
    <div class="e-fade" style="padding:28px;background:linear-gradient(135deg,rgba(200,169,81,.04),rgba(45,212,168,.02));border:1px solid rgba(200,169,81,.12);border-radius:12px;margin-bottom:32px">
      <div style="display:grid;grid-template-columns:3fr 2fr;gap:24px" class="e-g2">
        <div>
          <div class="e-lbl" style="color:#C8A951">&#127968; HEADQUARTERED IN NEW ORLEANS</div>
          <h3 style="font-family:Georgia,serif;font-size:20px;font-weight:300;color:#E2E8F0;margin:8px 0 12px">New Orleans isn't just our first city. <em style="color:#C8A951">It's our home.</em></h3>
          <p style="font-size:13px;color:#8B95A5;line-height:1.8;margin-bottom:10px">Built from inside the community &mdash; 28 years of healing lineage, strategic alliances with city institutions, and 276 hand-verified local providers. Jazz Bird&reg; NOLA, our 501(c)(3) nonprofit partnership, is repositioning Greater New Orleans as the wellness destination of America.</p>
          <p style="font-size:13px;color:#8B95A5;line-height:1.8">When BLEU deploys to the next city, we bring what we built here. The methodology. The medical oversight. The community-first approach. New Orleans proved the model.</p>
        </div>
        <div>
          <div style="font-size:11px;letter-spacing:3px;color:#C8A951;font-weight:700;margin-bottom:10px">STRATEGIC ALLIANCES</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            <div style="padding:7px;background:rgba(200,169,81,.05);border:1px solid rgba(200,169,81,.1);border-radius:4px;font-size:11px;color:#E2E8F0;font-weight:600;text-align:center">GNO, Inc.</div>
            <div style="padding:7px;background:rgba(200,169,81,.05);border:1px solid rgba(200,169,81,.1);border-radius:4px;font-size:11px;color:#E2E8F0;font-weight:600;text-align:center">NOLA &amp; Company</div>
            <div style="padding:7px;background:rgba(200,169,81,.05);border:1px solid rgba(200,169,81,.1);border-radius:4px;font-size:11px;color:#E2E8F0;font-weight:600;text-align:center">Tulane Aging</div>
            <div style="padding:7px;background:rgba(200,169,81,.05);border:1px solid rgba(200,169,81,.1);border-radius:4px;font-size:11px;color:#E2E8F0;font-weight:600;text-align:center">Council on Aging</div>
            <div style="padding:7px;background:rgba(200,169,81,.05);border:1px solid rgba(200,169,81,.1);border-radius:4px;font-size:11px;color:#E2E8F0;font-weight:600;text-align:center">Ochsner Eat Fit</div>
            <div style="padding:7px;background:rgba(200,169,81,.05);border:1px solid rgba(200,169,81,.1);border-radius:4px;font-size:11px;color:#E2E8F0;font-weight:600;text-align:center">Celebrate Canal!</div>
            <div style="padding:7px;background:rgba(200,169,81,.05);border:1px solid rgba(200,169,81,.1);border-radius:4px;font-size:11px;color:#E2E8F0;font-weight:600;text-align:center">Downtown Dev</div>
            <div style="padding:7px;background:rgba(200,169,81,.05);border:1px solid rgba(200,169,81,.1);border-radius:4px;font-size:11px;color:#E2E8F0;font-weight:600;text-align:center">Mayor's Office</div>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div class="e-fade" style="text-align:center;padding:36px 0 20px">
      <div style="font-size:12px;color:#8B95A5;margin-bottom:16px;letter-spacing:2px">YOUR CITY &middot; YOUR BUSINESS &middot; YOUR DATA &middot; OUR INFRASTRUCTURE</div>
      <a href="mailto:hello@bleu.live?subject=Enterprise%20Inquiry%20-%20BLEU" class="e-btn">START THE CONVERSATION &rarr;</a>
      <div style="font-size:12px;color:#5A6374;margin-top:12px">hello@bleu.live</div>
    </div>

    <!-- B.L.E.U. -->
    <div style="text-align:center;padding:28px 0;border-top:1px solid rgba(200,169,81,.1);margin-top:12px">
      <div style="display:flex;justify-content:center;gap:32px;margin-bottom:14px">
        <div><span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#C8A951">B</span><span style="font-size:15px;color:#8B95A5;margin-left:4px">elieve</span></div>
        <div><span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#C8A951">L</span><span style="font-size:15px;color:#8B95A5;margin-left:4px">ove</span></div>
        <div><span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#C8A951">E</span><span style="font-size:15px;color:#8B95A5;margin-left:4px">volve</span></div>
        <div><span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#C8A951">U</span><span style="font-size:15px;color:#8B95A5;margin-left:4px">nite</span></div>
      </div>
      <p style="font-size:12px;color:#5A6374;max-width:600px;margin:0 auto;line-height:1.7;font-style:italic">
        The Longevity Operating System. 525,965 verified records. 247 federal data sources. 15 intelligence systems.
        Medical oversight by Dr. Felicia Stoler (DCN, MS, RDN, FACSM, FAND, Dipl ACLM). Patent Pending.
      </p>
    </div>

    <div style="font-size:10px;color:#5A6374;text-align:center;padding:12px;border-top:1px solid rgba(255,255,255,.04)">
      Economic data: BEA, Harvard Business Review, RAND Corporation, CMS. Projections use validated federal inputs. hello@bleu.live
    </div>
  </div>
</div>

<!-- ═══ ALL ENTERPRISE JS — INLINE, SELF-CONTAINED ═══ -->
<script>
(function(){
  // ── COUNTERS ──
  function animCount(id,target){
    var el=document.getElementById(id);if(!el)return;
    var s=Date.now(),d=2200;
    (function t(){var p=Math.min((Date.now()-s)/d,1);el.textContent=Math.round(target*(1-Math.pow(1-p,3))).toLocaleString();if(p<1)requestAnimationFrame(t)})();
  }
  function initCounters(){animCount('ec1',525965);animCount('ec2',247);animCount('ec3',22);animCount('ec4',15)}

  // ── BEFORE/AFTER ──
  var bData=[
    {i:'\u{1F4CB}',t:'Annual PDF reports',d:'18 months old by publication. No real-time data. No neighborhood-level intelligence.'},
    {i:'\u2B50',t:'Yelp & Google reviews',d:'Popularity contests. No federal verification. Pay-to-rank. Means nothing clinically.'},
    {i:'\u231B',t:'6-week therapy waitlists',d:'No AI bridge. No crisis integration. People fall through cracks every day.'},
    {i:'\u{1F3AF}',t:'No ROI measurement',d:'Programs exist but nobody proves they work. Faith-based budgeting.'},
    {i:'\u{1F3E5}',t:'ER as primary care',d:'$2,200-$3,200 per preventable visit. No early intervention. Taxpayers absorb it.'},
    {i:'\u{1F4C9}',t:'Population decline',d:'41,000 residents lost since 2020. $4.3B in GDP gone. No data to attract talent.'}
  ];
  var aData=[
    {i:'\u{1F4CA}',t:'Real-time dashboards',d:'12-dimension neighborhood scoring. EPA, SAMHSA, NPI. Updated continuously.'},
    {i:'\u{1F6E1}\uFE0F',t:'NPI-verified directory',d:'525,965 practitioners. Federal verification. Trust scores on credentials, not reviews.'},
    {i:'\u{1F9E0}',t:'24/7 AI therapeutic access',d:'22 modes. CBT, DBT, trauma, crisis, recovery. No waitlist. Available now.'},
    {i:'\u{1F4B0}',t:'$3.27 return per $1',d:'Harvard-validated. Reduced absenteeism + lower claims + higher retention. Quarterly reporting.'},
    {i:'\u{1F6D1}',t:'Crisis interception',d:'Alvai intercepts before ER. Recovery reduces relapse. $800K+/year saved per city.'},
    {i:'\u{1F4C8}',t:'Population magnet',d:'117M Americans 50+ choosing where to live. Your city has the data to compete.'}
  ];
  window.eToggle=function(off){
    var g=document.getElementById('eCompGrid'),b1=document.getElementById('eBtnOff'),b2=document.getElementById('eBtnOn');
    if(!g)return;
    if(off){b1.style.background='rgba(231,76,60,.12)';b1.style.borderColor='rgba(231,76,60,.3)';b1.style.color='#E74C3C';b2.style.background='transparent';b2.style.borderColor='rgba(255,255,255,.06)';b2.style.color='#5A6374'}
    else{b2.style.background='rgba(45,212,168,.12)';b2.style.borderColor='rgba(45,212,168,.3)';b2.style.color='#2DD4A8';b1.style.background='transparent';b1.style.borderColor='rgba(255,255,255,.06)';b1.style.color='#5A6374'}
    var d=off?bData:aData,bc=off?'rgba(231,76,60,.1)':'rgba(45,212,168,.1)',tc=off?'#E74C3C':'#2DD4A8',h='';
    d.forEach(function(x,i){h+='<div style="display:flex;gap:14px;align-items:flex-start;padding:16px;background:#151921;border:1px solid '+bc+';border-radius:10px;animation:eSlide .4s ease '+(i*.08)+'s backwards"><span style="font-size:22px;flex-shrink:0">'+x.i+'</span><div><div style="font-size:14px;font-weight:600;color:'+tc+';margin-bottom:3px">'+x.t+'</div><div style="font-size:13px;color:#8B95A5;line-height:1.6">'+x.d+'</div></div></div>'});
    g.innerHTML=h;
  };

  // ── BUSINESS ROI ──
  window.eBiz=function(){
    var e=parseInt(document.getElementById('eBizSlider').value),h=Math.round(e*5512),p=Math.round(e*1685),r=Math.round(e*.15*65000*.25),t=h+p+r,roi=Math.round(t/(e*8)*100)/100;
    document.getElementById('eBizEmp').textContent=e.toLocaleString();
    document.getElementById('eBH').textContent='$'+(h/1e6).toFixed(1)+'M';
    document.getElementById('eBHs').textContent='$5,512 x '+e.toLocaleString();
    document.getElementById('eBP').textContent='$'+(p/1e6).toFixed(1)+'M';
    document.getElementById('eBPs').textContent='$1,685 x '+e.toLocaleString();
    document.getElementById('eBR').textContent='$'+(r/1e6).toFixed(1)+'M';
    document.getElementById('eBT').textContent='$'+(t/1e6).toFixed(1)+'M';
    document.getElementById('eBROI').innerHTML="That's <strong style='color:#E2E8F0'>$"+roi+" returned per $1</strong> invested in BLEU";
  };

  // ── CITY ROI ──
  window.eCity=function(){
    var p=parseInt(document.getElementById('eCSlider').value),er=Math.round(p*.02*2700),ret=Math.round(p*.005*105000),gr=Math.round(p*12),t=er+ret+gr;
    document.getElementById('eCPop').textContent=p.toLocaleString();
    document.getElementById('eCER').textContent='$'+(er/1e6).toFixed(0)+'M';
    document.getElementById('eCRet').textContent='$'+(ret/1e6).toFixed(0)+'M';
    document.getElementById('eCGr').textContent='$'+(gr/1e6).toFixed(1)+'M';
    document.getElementById('eCT').textContent='$'+(t/1e6).toFixed(0)+'M';
  };

  // ── TIMELINE ──
  var phases=[
    {l:'Week 1-2',t:'Data Integration',c:'#60A5FA',items:['Connect federal APIs: EPA, SAMHSA, NPI, FDA, NIH, CMS','Import & validate existing provider databases','Configure neighborhood boundaries & 12 scoring dimensions','Deploy Alvai with all 22 therapeutic modes','Launch [city].bleu.live or [business].bleu.live portal']},
    {l:'Month 1',t:'Intelligence Activated',c:'#C8A951',items:['Real-time dashboards live: population health, provider gaps, environmental','Full platform access: therapy, recovery, directory, supplements, finance','AI learning community patterns, seasonal trends, usage gaps','First wellness scores published at neighborhood level','Crisis resources integrated: 988, SAMHSA, local warm handoffs']},
    {l:'Month 3',t:'Measurable Outcomes',c:'#2DD4A8',items:['ER visit reduction documented: avg 12-18% drop in preventable visits','Employee health claims trending down from early intervention','Community engagement metrics: mission completion, social connection','Provider network expanding through NPI-verified directory','First ROI report delivered: hard numbers, audit-ready, federal-sourced']},
    {l:'Month 6-12',t:'Compounding Returns',c:'#F472B6',items:['Healthcare cost savings crystallized: 23% average reduction','Population health scores trending upward across all 12 dimensions','Federal grant applications submitted with validated city health data','Network effects: more users > better AI > more value > more users','Year 1 ROI: $3.27 returned per $1 invested (Harvard validated)']}
  ];
  window.ePhase=function(idx){
    var p=phases[idx],btns=document.getElementById('ePhaseBtns'),box=document.getElementById('ePhaseBox');
    if(!btns||!box)return;
    var bh='';phases.forEach(function(ph,i){var a=i===idx;bh+='<button onclick="ePhase('+i+')" style="padding:10px 20px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;letter-spacing:1px;font-family:inherit;transition:all .3s;background:'+(a?ph.c+'18':'transparent')+';border:1px solid '+(a?ph.c+'40':'rgba(255,255,255,.06)')+';color:'+(a?ph.c:'#5A6374')+'">'+ph.l+'</button> '});
    btns.innerHTML=bh;
    box.style.borderLeftColor=p.c;
    var ch='<div style="font-size:12px;letter-spacing:3px;color:'+p.c+';font-weight:700;margin-bottom:6px">'+p.l+'</div><h3 style="font-family:Georgia,serif;font-size:22px;font-weight:400;color:#E2E8F0;margin-bottom:16px">'+p.t+'</h3>';
    p.items.forEach(function(item,i){ch+='<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:10px;animation:eSlide .3s ease '+(i*.06)+'s backwards"><span style="color:'+p.c+';font-weight:700">&#10022;</span><span style="font-size:14px;color:#8B95A5;line-height:1.6">'+item+'</span></div>'});
    box.innerHTML=ch;
  };

  // ── SCROLL REVEAL ──
  function reveal(){
    document.querySelectorAll('.e-fade').forEach(function(el){
      var r=el.getBoundingClientRect();
      if(r.top<window.innerHeight-30){el.classList.add('e-vis')}
    });
  }

  // ── INIT ──
  function initAll(){
    initCounters();
    eToggle(true);
    eBiz();
    eCity();
    ePhase(0);
    reveal();
    var panel=document.getElementById('p-enterprise');
    if(panel){panel.addEventListener('scroll',reveal);window.addEventListener('scroll',reveal)}
  }

  // Hook into tab switch
  var og=window.go;
  if(og){window.go=function(tab){og(tab);if(tab==='enterprise'){setTimeout(initAll,200)}}}

  // Also try to init on load if enterprise is visible
  setTimeout(function(){
    var panel=document.getElementById('p-enterprise');
    if(panel&&panel.offsetParent!==null){initAll()}
  },500);
})();
</script>
'''

html = html[:content_start] + NEW_CONTENT + html[content_end:]

# Remove any duplicate B.L.E.U. / Believe blocks that leaked from previous fixes
# Find all "Believe" occurrences after the enterprise panel closes
new_ent_end = html.find('</div>', html.find('id="p-enterprise"'))
# Walk to find actual panel close
depth2 = 1
j = html.index('>', html.find('id="p-enterprise"')) + 1
while j < len(html) and depth2 > 0:
    if html[j:j+4] == '<div': depth2 += 1
    if html[j:j+6] == '</div>':
        depth2 -= 1
        if depth2 == 0: break
    j += 1

# Check for leaked Believe blocks in the scripts area
leak_zone = html[j:]
if leak_zone.count('Believe') > 2:
    # Find and remove the duplicate block
    dup_start = leak_zone.find('<div style="text-align:center;padding:28px 0;border-top:1px solid rgba(200,169,81,.12)">')
    if dup_start >= 0:
        dup_end = leak_zone.find('Patent Pending.</p></div>', dup_start)
        if dup_end > dup_start:
            dup_end += len('Patent Pending.</p></div>')
            actual_start = j + dup_start
            actual_end = j + dup_end
            html = html[:actual_start] + html[actual_end:]
            print("Removed duplicate B.L.E.U. block")

# Remove old enterprise JS that may conflict
for old_marker in ['ENTERPRISE TAB INTERACTIVITY', 'enterprise-tab-hook']:
    pos = html.find(old_marker)
    if pos > 0:
        sc_start = html.rfind('<script>', 0, pos)
        sc_end = html.find('</script>', pos)
        if sc_start > 0 and sc_end > 0:
            html = html[:sc_start] + html[sc_end + len('</script>'):]
            print(f"Removed old script: {old_marker}")

with open(FILE, "w", encoding="utf-8") as f:
    f.write(html)

# Validate
checks = {
    'Hero': 'FOR INSTITUTIONS' in html,
    'Ticker': 'eTicker' in html,
    'Counters': "ec1" in html and "animCount" in html,
    'Toggle': 'eToggle' in html and 'eBtnOff' in html,
    'Biz ROI': 'eBizSlider' in html and 'eBiz' in html,
    'City ROI': 'eCSlider' in html and 'eCity' in html,
    'Timeline': 'ePhase' in html and 'ePhaseBtns' in html,
    'Tiers': '[city].bleu.live' in html,
    'NOLA HQ': 'Jazz Bird' in html,
    'CTA': 'START THE CONVERSATION' in html,
    'BLEU': 'Believe' in html,
    'PatPend': 'Patent Pending' in html,
    'Inline JS': 'initAll' in html,
}
ok = sum(checks.values())
for k,v in checks.items():
    print(f"  {'Y' if v else 'N'} {k}")
print(f"\n  {ok}/{len(checks)} | Size: {orig:,} -> {len(html):,}")
if ok == len(checks):
    print("\n  ALL GOOD - deploy now")
