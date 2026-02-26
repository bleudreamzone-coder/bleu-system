#!/usr/bin/env python3
"""
BLEU.live — Fix home card + Enterprise ROI rebuild

1. Force-insert 9th card into home grid (Recovery Support is last card visible)
2. Rebuild Enterprise tab — ROI, revenue, cost savings, forecasting, commerce

Run: python3 bleu-fix.py
"""

import os, sys, re

FILE = "index.html"
if not os.path.exists(FILE):
    print("❌ index.html not found"); sys.exit(1)

with open(FILE, "r", encoding="utf-8") as f:
    html = f.read()

orig = len(html)

# ═══════════════════════════════════════════════════════════════
# 1. FORCE INSERT 9TH HOME CARD
# ═══════════════════════════════════════════════════════════════

# The Recovery Support card is the last card in row 3
# Find it by its unique text and insert the 9th card right after

CARD_9 = '''<div class="card" onclick="go('enterprise')" style="border:1px solid rgba(200,169,81,.3);background:linear-gradient(135deg,rgba(200,169,81,.08),rgba(96,165,250,.05))"><h3 style="color:var(--gold)">🏛️ Built for Cities · Leaders · Business</h3><p>How BLEU measures, quantifies, and forecasts community health. How cities save millions. How businesses cut costs and boost productivity. How [city].bleu.live becomes infrastructure. See the math.</p><div style="margin-top:10px"><span style="font-size:11px;padding:4px 10px;background:rgba(200,169,81,.12);border:1px solid rgba(200,169,81,.2);border-radius:4px;color:var(--gold);font-weight:600">[city].bleu.live + ROI + Forecasting</span></div></div>'''

# Remove old 9th card if it exists (from previous script)
old_card_pattern = r'<div class="card"[^>]*onclick="go\(\'enterprise\'\)"[^>]*>.*?</div>\s*</div>'
# Simpler: find by the unique text
for old_text in ["Cities · Business · Enterprise", "Built for Cities · Leaders · Business"]:
    pos = html.find(old_text)
    if pos > 0:
        card_s = html.rfind('<div class="card"', 0, pos)
        # Find the matching closing - count the inner divs
        depth = 0
        i = card_s
        card_e = -1
        while i < len(html) and i < card_s + 2000:
            if html[i:i+4] == '<div':
                depth += 1
            if html[i:i+6] == '</div>':
                depth -= 1
                if depth == 0:
                    card_e = i + 6
                    break
            i += 1
        if card_s > 0 and card_e > card_s:
            html = html[:card_s] + html[card_e:]
            print(f"  Removed old 9th card ({old_text[:30]}...)")

# Now find Recovery Support card and insert after it
recovery_markers = [
    "You are not alone.</p>",
    "SAMHSA + AA + SMART + Free",
    "Recovery Support</h3>",
    "1-800-662-4357",
]

inserted = False
for marker in recovery_markers:
    pos = html.find(marker)
    if pos > 0 and pos < 30000:  # Must be in home panel area
        # Find the </div> that closes this card
        # Go forward from marker to find card-closing </div>
        # The card has nested divs (tag spans), so find the right level
        search = html[pos:pos+500]
        # Find consecutive </div> that close the card
        # After the marker text, we need the card's closing </div>
        close_pos = pos
        for _ in range(5):  # max 5 closing divs to check
            next_close = html.find('</div>', close_pos + 1)
            if next_close < 0:
                break
            # Check if the next thing after this </div> is another <div class="card" or </div> (grid close)
            after = html[next_close+6:next_close+60].strip()
            if after.startswith('<div class="card"') or after.startswith('</div>') or after.startswith('\n</div>') or after.startswith('\n  </div>'):
                # This is the card's closing div
                insert_at = next_close + 6
                html = html[:insert_at] + "\n    " + CARD_9 + "\n" + html[insert_at:]
                inserted = True
                print(f"✅ 9th card inserted after Recovery Support")
                break
            close_pos = next_close
        if inserted:
            break

if not inserted:
    # Nuclear option: find the card-grid closing div in home
    home_pos = html.find('id="p-home"')
    if home_pos > 0:
        grid_pos = html.find('class="card-grid"', home_pos)
        if grid_pos > 0:
            # Find all cards in this grid
            search_end = grid_pos + 8000
            last_card_close = grid_pos
            pos = grid_pos
            while pos < search_end:
                next_card = html.find('class="card"', pos + 1)
                if next_card < 0 or next_card > search_end:
                    break
                # Find this card's close
                c = html.find('</div>', next_card)
                if c > 0:
                    last_card_close = c + 6
                pos = next_card + 1
            
            if last_card_close > grid_pos:
                html = html[:last_card_close] + "\n    " + CARD_9 + "\n" + html[last_card_close:]
                inserted = True
                print("✅ 9th card inserted (grid scan method)")

if not inserted:
    print("❌ Could not insert 9th card")

# ═══════════════════════════════════════════════════════════════
# 2. REBUILD ENTERPRISE TAB — ROI, SAVINGS, REVENUE, FORECASTING
# ═══════════════════════════════════════════════════════════════

ent_start = html.find('id="p-enterprise"')
if ent_start > 0:
    panel_div_start = html.rfind('<div', 0, ent_start)
    
    # Find end of panel
    panel_end = len(html)
    search_from = ent_start + 50
    for marker in ['<div class="panel"', '<footer']:
        p = html.find(marker, search_from)
        if 0 < p < panel_end:
            panel_end = p

    ENTERPRISE = '''<div class="panel" id="p-enterprise">
  <div class="section-label" style="letter-spacing:5px">THE LONGEVITY OPERATING SYSTEM — FOR INSTITUTIONS</div>
  <h1 style="font-size:32px;line-height:1.2">Every dollar spent on wellness<br><span style="color:var(--gold)">returns $3–$6 in savings.</span></h1>
  <p class="hero" style="font-size:16px;line-height:1.8;max-width:800px">BLEU doesn't just track health — it quantifies it, forecasts it, and turns it into measurable economic outcomes. Cities reduce emergency costs. Businesses cut healthcare spend. Populations get healthier. And every metric is verifiable, because every data point traces back to a federal source. This is the infrastructure layer that was missing. Built from our headquarters in New Orleans. Deploying everywhere.</p>

  <div class="divider"></div>
  <div class="section-label">THE ECONOMICS OF WELLNESS INFRASTRUCTURE</div>

  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:20px 0">
    <div style="text-align:center;padding:28px 20px;background:rgba(45,212,168,.06);border:1px solid rgba(45,212,168,.15);border-radius:10px">
      <div style="font-size:36px;font-weight:700;color:var(--teal);font-family:Georgia,serif">$3.27</div>
      <div style="font-size:13px;color:var(--cream);font-weight:600;margin:6px 0">Return per $1 invested</div>
      <div style="font-size:11px;color:var(--dim);line-height:1.5">Harvard Business Review workplace wellness meta-analysis. Reduced absenteeism, lower insurance claims, higher retention.</div>
    </div>
    <div style="text-align:center;padding:28px 20px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.15);border-radius:10px">
      <div style="font-size:36px;font-weight:700;color:var(--gold);font-family:Georgia,serif">23%</div>
      <div style="font-size:13px;color:var(--cream);font-weight:600;margin:6px 0">Healthcare cost reduction</div>
      <div style="font-size:11px;color:var(--dim);line-height:1.5">Average employer savings with comprehensive wellness programs. Johnson & Johnson saved $250M over a decade.</div>
    </div>
    <div style="text-align:center;padding:28px 20px;background:rgba(96,165,250,.06);border:1px solid rgba(96,165,250,.15);border-radius:10px">
      <div style="font-size:36px;font-weight:700;color:#60A5FA;font-family:Georgia,serif">$105K</div>
      <div style="font-size:13px;color:var(--cream);font-weight:600;margin:6px 0">GDP per resident retained</div>
      <div style="font-size:11px;color:var(--dim);line-height:1.5">BEA/FRED 2023. Every resident who stays or moves in contributes this annually to the metro economy.</div>
    </div>
  </div>

  <div class="divider"></div>
  <div class="section-label">WHAT BLEU MEASURES, QUANTIFIES & FORECASTS</div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:20px 0">
    <div style="padding:24px;background:rgba(45,212,168,.04);border:1px solid rgba(45,212,168,.12);border-radius:10px">
      <div style="font-size:12px;letter-spacing:3px;color:var(--teal);font-weight:700;margin-bottom:10px">📊 WHAT WE MEASURE</div>
      <div style="font-size:14px;color:var(--dim);line-height:1.9">
        <div style="padding:8px;border-bottom:1px solid rgba(45,212,168,.06)">✦ <strong style="color:var(--cream)">Population health</strong> — real-time vitals across 12 wellness dimensions per neighborhood</div>
        <div style="padding:8px;border-bottom:1px solid rgba(45,212,168,.06)">✦ <strong style="color:var(--cream)">Provider density</strong> — NPI-verified practitioner coverage gaps by specialty and geography</div>
        <div style="padding:8px;border-bottom:1px solid rgba(45,212,168,.06)">✦ <strong style="color:var(--cream)">Environmental health</strong> — EPA air quality, water quality, environmental hazard proximity</div>
        <div style="padding:8px;border-bottom:1px solid rgba(45,212,168,.06)">✦ <strong style="color:var(--cream)">Treatment access</strong> — SAMHSA facility density, wait times, capacity, insurance acceptance</div>
        <div style="padding:8px;border-bottom:1px solid rgba(45,212,168,.06)">✦ <strong style="color:var(--cream)">Community engagement</strong> — wellness event participation, mission completion, social connection</div>
        <div style="padding:8px">✦ <strong style="color:var(--cream)">Economic wellness</strong> — insurance coverage rates, medical debt burden, financial stress indicators</div>
      </div>
    </div>
    <div style="padding:24px;background:rgba(200,169,81,.04);border:1px solid rgba(200,169,81,.12);border-radius:10px">
      <div style="font-size:12px;letter-spacing:3px;color:var(--gold);font-weight:700;margin-bottom:10px">🔮 WHAT WE FORECAST</div>
      <div style="font-size:14px;color:var(--dim);line-height:1.9">
        <div style="padding:8px;border-bottom:1px solid rgba(200,169,81,.06)">✦ <strong style="color:var(--cream)">Cost avoidance</strong> — predicted ER visits prevented, chronic conditions intercepted early</div>
        <div style="padding:8px;border-bottom:1px solid rgba(200,169,81,.06)">✦ <strong style="color:var(--cream)">Revenue impact</strong> — projected economic contribution from healthier, retained populations</div>
        <div style="padding:8px;border-bottom:1px solid rgba(200,169,81,.06)">✦ <strong style="color:var(--cream)">Productivity gains</strong> — reduced absenteeism, presenteeism, turnover projections by quarter</div>
        <div style="padding:8px;border-bottom:1px solid rgba(200,169,81,.06)">✦ <strong style="color:var(--cream)">Migration modeling</strong> — wellness score correlation with inbound relocation and retention rates</div>
        <div style="padding:8px;border-bottom:1px solid rgba(200,169,81,.06)">✦ <strong style="color:var(--cream)">Grant readiness</strong> — federal funding eligibility scoring for NIH, SAMHSA, CDC, EDA applications</div>
        <div style="padding:8px">✦ <strong style="color:var(--cream)">Insurance impact</strong> — projected premium reductions based on community health trajectory</div>
      </div>
    </div>
  </div>

  <div class="divider"></div>
  <div class="section-label">HOW CITIES SAVE MONEY & GENERATE REVENUE</div>

  <div class="card-grid">
    <div class="card" style="border-top:3px solid #60A5FA">
      <h3 style="color:#60A5FA">🏛️ Reduce Emergency Costs</h3>
      <p>Every preventable ER visit costs a city $2,200–$3,200 in uncompensated care. BLEU's 22 AI therapeutic modes intercept crises before they become emergencies. Recovery support reduces relapse. Supplement safety prevents adverse events. One prevented ER visit per day saves a city $800K+ per year. BLEU gives cities the data to prove it.</p>
    </div>
    <div class="card" style="border-top:3px solid var(--gold)">
      <h3 style="color:var(--gold)">📈 Attract Residents & Revenue</h3>
      <p>NOLA lost 41,000 residents since 2020 — $4.3B in annual GDP. Every resident retained or attracted contributes ~$105K in GDP, $58K–$90K in consumer spending, $8K–$12K in tax revenue. BLEU's wellness positioning makes cities destinations for the 117M Americans age 50+ actively choosing where to live. Data-validated wellness scores on neworleans.com drive relocation decisions.</p>
    </div>
    <div class="card" style="border-top:3px solid var(--teal)">
      <h3 style="color:var(--teal)">🎯 Unlock Federal Grants</h3>
      <p>NIH, SAMHSA, CDC, EDA — federal agencies fund communities with validated health data. BLEU provides the real-time metrics these applications require. GNO Inc. secured $50M from EDA for hydrogen infrastructure. BLEU's validated city health data supports the next federal ask — potentially worth multiples of the initial investment.</p>
    </div>
  </div>

  <div class="divider"></div>
  <div class="section-label">HOW BUSINESSES CUT COSTS & BOOST PRODUCTIVITY</div>

  <div class="card-grid">
    <div class="card" style="border-top:3px solid #F472B6">
      <h3 style="color:#F472B6">💰 Cut Healthcare Spend</h3>
      <p>The average employer spends $23,968 per employee per year on health insurance. Comprehensive wellness programs reduce that by 23% — saving $5,512 per employee annually. A 500-person company saves $2.75M per year. BLEU provides the infrastructure: supplement safety prevents adverse events, recovery support reduces substance-related claims, AI therapy reduces outpatient utilization.</p>
    </div>
    <div class="card" style="border-top:3px solid #A78BFA">
      <h3 style="color:#A78BFA">⚡ Boost Productivity</h3>
      <p>Unhealthy employees cost employers $1,685 per employee per year in lost productivity. Depression alone costs $210B annually in absenteeism and presenteeism. BLEU's 22 AI therapeutic modes are available 24/7 — no waiting lists, no scheduling barriers. Financial wellness reduces the #1 source of employee stress. The supplement safety engine prevents the adverse reactions that cause missed days.</p>
    </div>
    <div class="card" style="border-top:3px solid #FB923C">
      <h3 style="color:#FB923C">🤝 Retain Talent</h3>
      <p>Replacing an employee costs 50–200% of their salary. Companies with strong wellness programs see 25% lower turnover. BLEU isn't a gym membership or a meditation app — it's a complete wellness operating system: therapy, recovery, nutrition, financial health, practitioner access, community connection. The employees who have it don't leave for companies that don't.</p>
    </div>
  </div>

  <div class="divider"></div>
  <div class="section-label">THE DEPLOYMENT MODEL</div>

  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin:20px 0">
    <div style="background:rgba(96,165,250,.06);border:1px solid rgba(96,165,250,.15);border-radius:10px;padding:28px">
      <div style="font-size:28px;margin-bottom:10px">🏛️</div>
      <div style="font-size:11px;letter-spacing:3px;color:#60A5FA;font-weight:700;margin-bottom:6px">CITIES</div>
      <div style="font-size:20px;font-weight:300;color:var(--cream);margin-bottom:10px;font-family:Georgia,serif">[city].bleu.live</div>
      <div style="font-size:13px;color:var(--dim);line-height:1.7;margin-bottom:12px">Neighborhood health intelligence. Population dashboards. Environmental monitoring. Provider mapping. Community wellness scoring. Federal grant data readiness. Tourism wellness positioning.</div>
      <div style="padding:10px;background:rgba(96,165,250,.06);border-radius:6px;font-size:11px;color:#60A5FA;line-height:1.5"><strong>LIVE:</strong> neworleans.bleu.live — 276 providers, 12 categories, real-time federal data</div>
    </div>
    <div style="background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.15);border-radius:10px;padding:28px">
      <div style="font-size:28px;margin-bottom:10px">🏢</div>
      <div style="font-size:11px;letter-spacing:3px;color:var(--gold);font-weight:700;margin-bottom:6px">BUSINESSES</div>
      <div style="font-size:20px;font-weight:300;color:var(--cream);margin-bottom:10px;font-family:Georgia,serif">[business].bleu.live</div>
      <div style="font-size:13px;color:var(--dim);line-height:1.7;margin-bottom:12px">Employee wellness portals. Practitioner access. Supplement safety. AI therapeutic support. Health cost dashboards. Productivity analytics. Retention metrics. 40-Day team missions.</div>
      <div style="padding:10px;background:rgba(200,169,81,.06);border-radius:6px;font-size:11px;color:var(--gold);line-height:1.5"><strong>ROI:</strong> $5,512 saved per employee/year at 23% healthcare cost reduction</div>
    </div>
    <div style="background:rgba(45,212,168,.06);border:1px solid rgba(45,212,168,.15);border-radius:10px;padding:28px">
      <div style="font-size:28px;margin-bottom:10px">🏥</div>
      <div style="font-size:11px;letter-spacing:3px;color:var(--teal);font-weight:700;margin-bottom:6px">ENTERPRISE</div>
      <div style="font-size:20px;font-weight:300;color:var(--cream);margin-bottom:10px;font-family:Georgia,serif">[enterprise].bleu.live</div>
      <div style="font-size:13px;color:var(--dim);line-height:1.7;margin-bottom:12px">Full white-label. Health systems, hospitals, universities, insurance, government. Your brand, your data sovereignty. 15 intelligence systems. 22 AI modes. 525K+ verified records. API integration.</div>
      <div style="padding:10px;background:rgba(45,212,168,.06);border-radius:6px;font-size:11px;color:var(--teal);line-height:1.5"><strong>SCALE:</strong> One platform powering unlimited deployments. Each one makes the network smarter.</div>
    </div>
  </div>

  <div class="divider"></div>
  <div class="section-label">🏠 HEADQUARTERED IN NEW ORLEANS, LOUISIANA</div>

  <div style="background:linear-gradient(135deg,rgba(200,169,81,.06),rgba(45,212,168,.03));border:1px solid rgba(200,169,81,.12);border-radius:12px;padding:28px;margin:20px 0">
    <div style="display:grid;grid-template-columns:3fr 2fr;gap:24px">
      <div>
        <h3 style="font-size:20px;font-weight:300;color:var(--cream);margin-bottom:10px;font-family:Georgia,serif">New Orleans isn't just our first city. <em style="color:var(--gold)">It's our home.</em></h3>
        <div style="font-size:13px;color:var(--dim);line-height:1.8">
          <p style="margin-bottom:10px">BLEU was born here. Built by people who live here, heal here, and belong here. Jazz Bird® NOLA is our 501(c)(3) nonprofit partnership with this city — repositioning Greater New Orleans as the wellness destination of America.</p>
          <p style="margin-bottom:10px">This isn't a tech company parachuting into a market. This is a system built from inside the community — 28 years of healing lineage, strategic alliances with city institutions, and 276 hand-verified local providers we know by name.</p>
          <p>When BLEU deploys to the next city, we bring what we built here. The methodology. The medical oversight. The community-first approach. New Orleans proved the model. Every city after inherits it.</p>
        </div>
      </div>
      <div>
        <div style="font-size:11px;letter-spacing:3px;color:var(--gold);font-weight:700;margin-bottom:10px">STRATEGIC ALLIANCES</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <div style="padding:8px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.08);border-radius:4px;font-size:11px;color:var(--cream);font-weight:600;text-align:center">GNO, Inc.</div>
          <div style="padding:8px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.08);border-radius:4px;font-size:11px;color:var(--cream);font-weight:600;text-align:center">NOLA & Company</div>
          <div style="padding:8px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.08);border-radius:4px;font-size:11px;color:var(--cream);font-weight:600;text-align:center">Tulane Aging</div>
          <div style="padding:8px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.08);border-radius:4px;font-size:11px;color:var(--cream);font-weight:600;text-align:center">Council on Aging</div>
          <div style="padding:8px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.08);border-radius:4px;font-size:11px;color:var(--cream);font-weight:600;text-align:center">Ochsner Eat Fit</div>
          <div style="padding:8px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.08);border-radius:4px;font-size:11px;color:var(--cream);font-weight:600;text-align:center">Celebrate Canal!</div>
          <div style="padding:8px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.08);border-radius:4px;font-size:11px;color:var(--cream);font-weight:600;text-align:center">Downtown Dev</div>
          <div style="padding:8px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.08);border-radius:4px;font-size:11px;color:var(--cream);font-weight:600;text-align:center">Mayor's Office</div>
        </div>
      </div>
    </div>
  </div>

  <!-- B.L.E.U. -->
  <div style="margin-top:24px;text-align:center;padding:28px 16px;border-top:1px solid rgba(200,169,81,.1)">
    <div style="display:flex;justify-content:center;gap:28px;margin-bottom:14px">
      <div><span style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:var(--gold)">B</span><span style="font-size:14px;color:var(--dim);margin-left:4px">elieve</span></div>
      <div><span style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:var(--gold)">L</span><span style="font-size:14px;color:var(--dim);margin-left:4px">ove</span></div>
      <div><span style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:var(--gold)">E</span><span style="font-size:14px;color:var(--dim);margin-left:4px">volve</span></div>
      <div><span style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:var(--gold)">U</span><span style="font-size:14px;color:var(--dim);margin-left:4px">nite</span></div>
    </div>
    <p style="font-size:13px;color:var(--muted);max-width:600px;margin:0 auto;line-height:1.7;font-style:italic">The Longevity Operating System. Born in New Orleans. 525,965 verified records. 247 federal data sources. 15 intelligence systems. Medical oversight by Dr. Felicia Stoler. Every claim verifiable. Patent Pending.</p>
  </div>

  <div class="disclaimer">🏛️ Economic data sourced from BEA, Harvard Business Review, RAND Corporation, and CMS. BLEU projections use validated federal inputs. For enterprise inquiries: hello@bleu.live</div>
</div>
'''

    html = html[:panel_div_start] + ENTERPRISE + "\n" + html[panel_end:]
    print("✅ Enterprise tab rebuilt — ROI + forecasting + commerce")
else:
    print("❌ Enterprise panel not found")

# ═══════════════════════════════════════════════════════════════
# SAVE + VERIFY
# ═══════════════════════════════════════════════════════════════

with open(FILE, "w", encoding="utf-8") as f:
    f.write(html)

new_len = len(html)
print(f"\n{'═'*55}")
print(f"  BLEU.live — FIXED")
print(f"{'═'*55}")
print(f"  Size: {orig:,} → {new_len:,} ({new_len - orig:+,})")
print()

checks = [
    ("9th home card present", "Built for Cities" in html and "go('enterprise')" in html),
    ("Enterprise panel", 'id="p-enterprise"' in html),
    ("ROI economics", "$3.27" in html or "3–$6" in html),
    ("Healthcare savings", "23%" in html),
    ("GDP per resident", "$105K" in html),
    ("What we measure", "WHAT WE MEASURE" in html),
    ("What we forecast", "WHAT WE FORECAST" in html),
    ("Cities save money", "Reduce Emergency Costs" in html),
    ("Business ROI", "Cut Healthcare Spend" in html),
    ("Productivity", "Boost Productivity" in html),
    ("Retain talent", "Retain Talent" in html),
    ("[city].bleu.live", "[city].bleu.live" in html),
    ("NOLA HQ", "HEADQUARTERED" in html),
    ("B.L.E.U.", "elieve" in html),
    ("Patent Pending", "Patent Pending" in html),
]

for n, ok in checks:
    print(f"  {'✅' if ok else '❌'} {n}")
passed = sum(1 for _,ok in checks if ok)
print(f"\n  {passed}/{len(checks)} passed")
print(f"\n{'═'*55}")
print(f"  git add -A && git commit -m 'Fix home card + Enterprise ROI' && git push origin main --force")
print(f"{'═'*55}")
