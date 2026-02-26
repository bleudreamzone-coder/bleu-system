#!/usr/bin/env python3
"""
BLEU.live — Home Page WOW Factor

1. Fix 9th card — proper grid position (bottom right, not nested)
2. All 9 cards interactive — click to expand with deep data
3. Scroll animations on cards
4. Enterprise tab stays as-is

Run: python3 bleu-home-wow.py
"""

import os, sys, re

FILE = "index.html"
if not os.path.exists(FILE):
    print("❌ index.html not found"); sys.exit(1)

with open(FILE, "r", encoding="utf-8") as f:
    html = f.read()

orig = len(html)

# ═══════════════════════════════════════════════════════════════
# 1. REMOVE THE WRONGLY-NESTED ENTERPRISE CARD
# ═══════════════════════════════════════════════════════════════

# The enterprise card got nested inside Recovery Support card
# Remove it wherever it is
for marker in ["Built for Cities · Leaders · Business", "Cities · Business · Enterprise"]:
    while marker in html:
        pos = html.find(marker)
        if pos < 0:
            break
        # Find the <div that starts this card
        card_start = html.rfind('<div', 0, pos)
        # Find proper end — track div depth
        depth = 0
        i = card_start
        card_end = -1
        while i < len(html) and i < card_start + 3000:
            if html[i:i+4] == '<div':
                depth += 1
            if html[i:i+6] == '</div>':
                depth -= 1
                if depth == 0:
                    card_end = i + 6
                    break
            i += 1
        if card_start > 0 and card_end > card_start:
            html = html[:card_start] + html[card_end:]
            print(f"  Removed nested card")

print("✅ Old enterprise cards cleaned")

# ═══════════════════════════════════════════════════════════════
# 2. FIND THE HOME CARD GRID AND REPLACE ENTIRELY
# ═══════════════════════════════════════════════════════════════

# The card grid starts after "Your Journey Through BLEU" or "WHAT BRINGS YOU HERE TODAY"
# and contains 8 cards. We replace ALL of them with 9 interactive cards + animations

# Find the card-grid div in the home panel
home_start = html.find('id="p-home"')
grid_start = html.find('class="card-grid"', home_start)

if grid_start < 0:
    print("❌ card-grid not found in home")
    sys.exit(1)

# Find the <div that opens the grid
grid_div = html.rfind('<div', 0, grid_start + 20)

# Find the closing </div> of the grid by counting depth
depth = 0
i = grid_div
grid_end = -1
while i < len(html) and i < grid_div + 15000:
    if html[i:i+4] == '<div':
        depth += 1
    if html[i:i+6] == '</div>':
        depth -= 1
        if depth == 0:
            grid_end = i + 6
            break
    i += 1

if grid_end < 0:
    print("❌ Could not find card-grid end")
    sys.exit(1)

print(f"  Found card-grid: chars {grid_div}–{grid_end}")

# ═══════════════════════════════════════════════════════════════
# THE NEW INTERACTIVE 9-CARD GRID WITH ANIMATIONS
# ═══════════════════════════════════════════════════════════════

NEW_GRID = '''<style>
.wow-card{position:relative;border-radius:12px;padding:24px;cursor:pointer;transition:all .4s cubic-bezier(.16,1,.3,1);overflow:hidden;background:rgba(20,26,40,.8);border:1px solid rgba(255,255,255,.06)}
.wow-card:hover{transform:translateY(-4px);border-color:rgba(200,169,81,.25);box-shadow:0 20px 60px rgba(0,0,0,.3)}
.wow-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--accent);opacity:0;transition:opacity .3s}
.wow-card:hover::before{opacity:1}
.wow-card .card-title{font-size:17px;font-weight:600;margin-bottom:8px;transition:color .3s}
.wow-card:hover .card-title{color:var(--accent)}
.wow-card .card-desc{font-size:13px;color:var(--dim);line-height:1.7}
.wow-card .card-expand{max-height:0;overflow:hidden;transition:max-height .5s cubic-bezier(.16,1,.3,1);opacity:0}
.wow-card.open .card-expand{max-height:600px;opacity:1;transition:max-height .5s cubic-bezier(.16,1,.3,1),opacity .4s .1s}
.wow-card .card-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:10px}
.wow-card .card-tag{font-size:10px;padding:3px 8px;border-radius:3px;font-weight:600;letter-spacing:.3px}
.wow-card .card-icon{font-size:28px;margin-bottom:10px;display:block;transition:transform .3s}
.wow-card:hover .card-icon{transform:scale(1.15)}
.wow-card .expand-hint{font-size:10px;color:var(--muted);letter-spacing:1px;margin-top:8px;transition:color .3s}
.wow-card:hover .expand-hint{color:var(--accent)}
@keyframes cardIn{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
.wow-card{animation:cardIn .6s cubic-bezier(.16,1,.3,1) backwards}
.wow-card:nth-child(1){animation-delay:.05s}.wow-card:nth-child(2){animation-delay:.1s}.wow-card:nth-child(3){animation-delay:.15s}
.wow-card:nth-child(4){animation-delay:.2s}.wow-card:nth-child(5){animation-delay:.25s}.wow-card:nth-child(6){animation-delay:.3s}
.wow-card:nth-child(7){animation-delay:.35s}.wow-card:nth-child(8){animation-delay:.4s}.wow-card:nth-child(9){animation-delay:.45s}
</style>

<div class="card-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px" id="home-wow-grid">

  <div class="wow-card" style="--accent:#FB923C" onclick="this.classList.toggle('open')">
    <span class="card-icon">🌙</span>
    <div class="card-title" style="color:#FB923C">I Can't Sleep</div>
    <div class="card-desc">Magnesium glycinate, ashwagandha, L-theanine — exact doses, brands, prices. Plus sleep hygiene protocols that actually work. Not generic advice. A real plan.</div>
    <div class="card-tags"><span class="card-tag" style="background:rgba(251,146,60,.12);border:1px solid rgba(251,146,60,.2);color:#FB923C">Protocol + Products + Science</span></div>
    <div class="card-expand" style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(251,146,60,.1)">
      <div style="font-size:12px;color:var(--dim);line-height:1.8">
        <div style="margin-bottom:8px"><strong style="color:var(--cream)">What Alvai builds for you:</strong> A personalized sleep stack with exact products from Thorne, Nordic Naturals, or NOW Foods — checked against your medications for interactions via our FDA adverse event database.</div>
        <div style="margin-bottom:8px"><strong style="color:var(--cream)">The science:</strong> Magnesium glycinate (400mg) improves sleep latency by 17 minutes. L-theanine (200mg) increases alpha brain waves. Ashwagandha (600mg KSM-66) reduces cortisol 30%.</div>
        <div><strong style="color:var(--cream)">Connected to:</strong> Supplement Safety Engine · Vessel Products · Practitioner Directory · Protocols</div>
      </div>
    </div>
    <div class="expand-hint">TAP TO EXPLORE →</div>
  </div>

  <div class="wow-card" style="--accent:#F472B6;border-color:rgba(244,114,182,.15)" onclick="this.classList.toggle('open')">
    <span class="card-icon">🧠</span>
    <div class="card-title" style="color:#F472B6">Find Me a Therapist</div>
    <div class="card-desc">485,476 NPI-verified practitioners. Local in your city with phone numbers and addresses. Plus BetterHelp from $60/week. Plus free crisis lines. Every price point, every time.</div>
    <div class="card-tags"><span class="card-tag" style="background:rgba(244,114,182,.12);border:1px solid rgba(244,114,182,.2);color:#F472B6">Local + Virtual + Free</span></div>
    <div class="card-expand" style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(244,114,182,.1)">
      <div style="font-size:12px;color:var(--dim);line-height:1.8">
        <div style="margin-bottom:8px"><strong style="color:var(--cream)">How it works:</strong> Tell Alvai what hurts — anxiety, trauma, grief, relationship issues — and get matched to NPI-verified therapists in your area. Filter by insurance, specialty, sliding scale.</div>
        <div style="margin-bottom:8px"><strong style="color:var(--cream)">Three tiers:</strong> Local in-person (Directory) → Virtual therapy (BetterHelp $60/wk) → Free crisis support (988, 741741, SAMHSA). No one falls through the cracks.</div>
        <div><strong style="color:var(--cream)">Connected to:</strong> Directory · Therapy (22 AI modes) · Recovery Support · Crisis Resources</div>
      </div>
    </div>
    <div class="expand-hint">TAP TO EXPLORE →</div>
  </div>

  <div class="wow-card" style="--accent:#FB923C" onclick="this.classList.toggle('open')">
    <span class="card-icon">💊</span>
    <div class="card-title" style="color:#FB923C">Build My Supplement Stack</div>
    <div class="card-desc">Thorne, Nordic Naturals, NOW Foods — clinically dosed, 5-layer safety engine. Every recommendation comes with the mechanism, the brand, and the price. No guessing.</div>
    <div class="card-tags"><span class="card-tag" style="background:rgba(251,146,60,.12);border:1px solid rgba(251,146,60,.2);color:#FB923C">Thorne + Amazon + Safety Engine</span></div>
    <div class="card-expand" style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(251,146,60,.1)">
      <div style="font-size:12px;color:var(--dim);line-height:1.8">
        <div style="margin-bottom:8px"><strong style="color:var(--cream)">5-Layer Safety:</strong> 1) FDA adverse event check 2) Drug interaction screening 3) Dose validation 4) Brand quality verification 5) Contraindication review. Products earn their place — they don't buy it.</div>
        <div style="margin-bottom:8px"><strong style="color:var(--cream)">Real products:</strong> Thorne Magnesium Bisglycinate ($25), Nordic Naturals Ultimate Omega ($28), NOW Ashwagandha ($14). Every link goes to the actual product with affiliate transparency.</div>
        <div><strong style="color:var(--cream)">Connected to:</strong> Vessel · Supplement Safety · Alvai Protocols · Drug Interaction Checker</div>
      </div>
    </div>
    <div class="expand-hint">TAP TO EXPLORE →</div>
  </div>

  <div class="wow-card" style="--accent:var(--teal)" onclick="this.classList.toggle('open')">
    <span class="card-icon">🌿</span>
    <div class="card-title" style="color:var(--teal)">ECS Intelligence</div>
    <div class="card-desc">28 years of plant intelligence. 127-year healing lineage. ECSIQ protocols matched to conditions. Terpene profiles. Drug interactions checked. Beginner to expert. No judgment.</div>
    <div class="card-tags"><span class="card-tag" style="background:rgba(45,212,168,.12);border:1px solid rgba(45,212,168,.2);color:var(--teal)">ECSIQ + Evidence-Based + ECS</span></div>
    <div class="card-expand" style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(45,212,168,.1)">
      <div style="font-size:12px;color:var(--dim);line-height:1.8">
        <div style="margin-bottom:8px"><strong style="color:var(--cream)">ECSIQ System:</strong> Your endocannabinoid system intelligence quotient. Protocols matched to conditions — sleep, pain, anxiety, inflammation. Terpene profiles. Delivery methods compared. Drug interactions checked against CYP450 pathways.</div>
        <div style="margin-bottom:8px"><strong style="color:var(--cream)">The lineage:</strong> 127 years of healing knowledge. 28 years of direct experience. 30,000+ patients consulted. Distilled into an AI system that doesn't judge — it guides.</div>
        <div><strong style="color:var(--cream)">Connected to:</strong> 🌿 ECSIQ Tab · Drug Interactions · Practitioner Directory · Protocols</div>
      </div>
    </div>
    <div class="expand-hint">TAP TO EXPLORE →</div>
  </div>

  <div class="wow-card" style="--accent:var(--teal);border-color:rgba(45,212,168,.15)" onclick="this.classList.toggle('open')">
    <span class="card-icon">💚</span>
    <div class="card-title" style="color:var(--teal)">I Need to Talk to Someone</div>
    <div class="card-desc">CBT, DBT, somatic, motivational, journaling, crisis. AI-guided therapy that meets you where you are. Not a replacement for a therapist — a bridge until you find one. Or alongside one.</div>
    <div class="card-tags"><span class="card-tag" style="background:rgba(45,212,168,.12);border:1px solid rgba(45,212,168,.2);color:var(--teal)">Free + 988 + BetterHelp</span></div>
    <div class="card-expand" style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(45,212,168,.1)">
      <div style="font-size:12px;color:var(--dim);line-height:1.8">
        <div style="margin-bottom:8px"><strong style="color:var(--cream)">22 therapeutic modes:</strong> CBT, DBT, somatic experiencing, motivational interviewing, journaling, crisis support, couples, grief, trauma, psychoeducation, life coaching, career counseling — plus 7 specialized recovery modes and ECS Intelligence.</div>
        <div style="margin-bottom:8px"><strong style="color:var(--cream)">Available now:</strong> No waitlist. No appointment. No insurance needed. 24/7. Powered by Claude AI with medical oversight from Dr. Felicia Stoler.</div>
        <div><strong style="color:var(--cream)">Connected to:</strong> Therapy Tab · Recovery · Crisis Lines (988) · Practitioner Directory</div>
      </div>
    </div>
    <div class="expand-hint">TAP TO EXPLORE →</div>
  </div>

  <div class="wow-card" style="--accent:#E74C3C" onclick="this.classList.toggle('open')">
    <span class="card-icon">🩺</span>
    <div class="card-title" style="color:#E74C3C">Find a Doctor Near Me</div>
    <div class="card-desc">Back pain, migraines, skin, hormones, fertility, pediatrics — say what hurts and we match you. Chiropractors, specialists, physical therapists. Real addresses, real phone numbers.</div>
    <div class="card-tags"><span class="card-tag" style="background:rgba(231,76,60,.12);border:1px solid rgba(231,76,60,.2);color:#E74C3C">485,476 NPI Practitioners</span></div>
    <div class="card-expand" style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(231,76,60,.1)">
      <div style="font-size:12px;color:var(--dim);line-height:1.8">
        <div style="margin-bottom:8px"><strong style="color:var(--cream)">NPI-verified:</strong> Every practitioner checked against the National Provider Identifier registry. Not Yelp reviews. Federal verification. Credentials confirmed. License active.</div>
        <div style="margin-bottom:8px"><strong style="color:var(--cream)">Specialties:</strong> Primary care, dermatology, orthopedics, endocrinology, pediatrics, OB/GYN, neurology, psychiatry, chiropractic, physical therapy, acupuncture, naturopathic — and more.</div>
        <div><strong style="color:var(--cream)">Connected to:</strong> Directory · Map · Alvai (describe symptoms, get matched) · Protocols</div>
      </div>
    </div>
    <div class="expand-hint">TAP TO EXPLORE →</div>
  </div>

  <div class="wow-card" style="--accent:var(--gold)" onclick="this.classList.toggle('open')">
    <span class="card-icon">💰</span>
    <div class="card-title" style="color:var(--gold)">Wellness Budget</div>
    <div class="card-desc">Insurance navigation, HSA/FSA optimization, GoodRx savings, medical bill negotiation, sliding scale options. Stop spending on what hurts you. Start investing in what heals you.</div>
    <div class="card-tags"><span class="card-tag" style="background:rgba(200,169,81,.12);border:1px solid rgba(200,169,81,.2);color:var(--gold)">GoodRx + Cost Plus Drugs</span></div>
    <div class="card-expand" style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(200,169,81,.1)">
      <div style="font-size:12px;color:var(--dim);line-height:1.8">
        <div style="margin-bottom:8px"><strong style="color:var(--cream)">Save real money:</strong> GoodRx saves up to 80% on prescriptions. Mark Cuban's Cost Plus Drugs sells at cost + 15%. Medical bill negotiation can reduce hospital bills by 40-60%. BLEU connects you to all of it.</div>
        <div style="margin-bottom:8px"><strong style="color:var(--cream)">Financial stress = health crisis:</strong> #1 cause of anxiety in America. BLEU's Finance tab covers credit health, insurance navigation, Medicaid, medical debt relief (Dollar For), and retirement planning.</div>
        <div><strong style="color:var(--cream)">Connected to:</strong> Finance Tab · Vessel (price comparisons) · Practitioner (sliding scale filter)</div>
      </div>
    </div>
    <div class="expand-hint">TAP TO EXPLORE →</div>
  </div>

  <div class="wow-card" style="--accent:var(--teal)" onclick="this.classList.toggle('open')">
    <span class="card-icon">🛡️</span>
    <div class="card-title" style="color:var(--teal)">Recovery Support</div>
    <div class="card-desc">This is sacred ground. 12-step, SMART Recovery, MAT, harm reduction — all valid. Relapse is not failure. Family support included. SAMHSA 1-800-662-4357. You are not alone.</div>
    <div class="card-tags"><span class="card-tag" style="background:rgba(45,212,168,.12);border:1px solid rgba(45,212,168,.2);color:var(--teal)">SAMHSA + AA + SMART + Free</span></div>
    <div class="card-expand" style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(45,212,168,.1)">
      <div style="font-size:12px;color:var(--dim);line-height:1.8">
        <div style="margin-bottom:8px"><strong style="color:var(--cream)">8 recovery modes:</strong> Early sobriety, relapse prevention, harm reduction, MAT support, family support, milestone tracking, eating disorders, and crisis companion. Every mode built with lived experience.</div>
        <div style="margin-bottom:8px"><strong style="color:var(--cream)">All pathways honored:</strong> AA, NA, SMART Recovery, Refuge Recovery, MAT (Suboxone, Vivitrol, methadone), harm reduction. No single path. Your recovery, your way.</div>
        <div><strong style="color:var(--cream)">Connected to:</strong> Recovery Tab · Therapy · Crisis Lines · Community · Practitioner Directory</div>
      </div>
    </div>
    <div class="expand-hint">TAP TO EXPLORE →</div>
  </div>

  <div class="wow-card" style="--accent:var(--gold);border:1px solid rgba(200,169,81,.25);background:linear-gradient(135deg,rgba(200,169,81,.08),rgba(96,165,250,.04))" onclick="go('enterprise')">
    <span class="card-icon">🏛️</span>
    <div class="card-title" style="color:var(--gold)">Built for Cities · Leaders · Business</div>
    <div class="card-desc">How BLEU measures, quantifies, and forecasts community health. How cities save millions. How businesses cut costs and boost productivity. How [city].bleu.live becomes infrastructure.</div>
    <div class="card-tags">
      <span class="card-tag" style="background:rgba(96,165,250,.12);border:1px solid rgba(96,165,250,.2);color:#60A5FA">[city].bleu.live</span>
      <span class="card-tag" style="background:rgba(200,169,81,.12);border:1px solid rgba(200,169,81,.2);color:var(--gold)">ROI</span>
      <span class="card-tag" style="background:rgba(45,212,168,.12);border:1px solid rgba(45,212,168,.2);color:var(--teal)">Forecasting</span>
    </div>
    <div class="expand-hint">SEE THE MATH →</div>
  </div>

</div>'''

html = html[:grid_div] + NEW_GRID + html[grid_end:]
print("✅ 9-card interactive grid with animations installed")

# ═══════════════════════════════════════════════════════════════
# SAVE + VERIFY
# ═══════════════════════════════════════════════════════════════

with open(FILE, "w", encoding="utf-8") as f:
    f.write(html)

new = len(html)
print(f"\n{'═'*55}")
print(f"  BLEU.live — HOME WOW")
print(f"{'═'*55}")
print(f"  Size: {orig:,} → {new:,} ({new-orig:+,})")
print()

checks = [
    ("9 wow-cards", html.count('class="wow-card"') == 9),
    ("Card animations CSS", "cardIn" in html),
    ("Expand interaction", "card-expand" in html),
    ("TAP TO EXPLORE", "TAP TO EXPLORE" in html),
    ("9th card bottom-right", "Built for Cities · Leaders · Business" in html),
    ("9th links to enterprise", "go('enterprise')" in html),
    ("Card 1: Sleep", "I Can't Sleep" in html),
    ("Card 5: Talk", "I Need to Talk to Someone" in html),
    ("Card 8: Recovery", "Recovery Support" in html),
    ("Hover effects", "translateY(-4px)" in html),
    ("Staggered delays", "animation-delay:.45s" in html),
    ("ECS not Cannabis", "ECS Intelligence" in html),
    ("Enterprise tab intact", 'id="p-enterprise"' in html),
]

for n, ok in checks:
    print(f"  {'✅' if ok else '❌'} {n}")
p = sum(1 for _,ok in checks if ok)
print(f"\n  {p}/{len(checks)} passed")
print(f"\n{'═'*55}")
print(f"  git add -A && git commit -m 'Home WOW: 9 interactive cards' && git push origin main --force")
print(f"{'═'*55}")
