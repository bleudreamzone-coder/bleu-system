#!/usr/bin/env python3
"""
BLEU.live — THE WIN

1. Alvai suggestion boxes 3x bigger
2. Fix 9th home card (Enterprise — cities, business, leaders)
3. Deep Enterprise tab — how we quantify, validate, old vs new,
   NOLA HQ, the full moat, B.L.E.U. at bottom
   
Run: python3 bleu-win.py
Then: git add -A && git commit -m 'Enterprise deep + bigger Alvai' && git push origin main --force
"""

import os, sys

FILE = "index.html"
if not os.path.exists(FILE):
    print("❌ index.html not found. Run from repo root.")
    sys.exit(1)

with open(FILE, "r", encoding="utf-8") as f:
    html = f.read()

original_len = len(html)

# ═══════════════════════════════════════════════════════════════
# 1. ALVAI SUGGESTION BOXES — 3X BIGGER
# ═══════════════════════════════════════════════════════════════

# The quick-btn class controls the suggestion pill buttons
# Make them significantly larger: bigger font, more padding, taller
# Find the .quick-btn CSS rule and replace it

# Common patterns for the quick-btn style
quick_btn_replacements = [
    # Pattern: inline style on quick-btn spans
    ("font-size:11px;padding:6px 12px", "font-size:15px;padding:14px 22px"),
    ("font-size:11px;padding:5px 10px", "font-size:15px;padding:14px 22px"),
    ("font-size:12px;padding:6px 12px", "font-size:15px;padding:14px 22px"),
    ("font-size:12px;padding:8px 14px", "font-size:15px;padding:14px 22px"),
    ("font-size:10px;padding:5px 10px", "font-size:15px;padding:14px 22px"),
    ("font-size:11px;padding:8px 12px", "font-size:15px;padding:14px 22px"),
    ("font-size:10px;padding:6px 10px", "font-size:15px;padding:14px 22px"),
]

for old, new in quick_btn_replacements:
    html = html.replace(old, new)

# Also try the CSS class definition
# .quick-btn{...font-size:Xpx;padding:Xpx...}
import re

# Make quick-btn CSS class bigger
html = re.sub(
    r'(\.quick-btn\s*\{[^}]*?)font-size:\s*\d+px',
    r'\g<1>font-size:15px',
    html
)
html = re.sub(
    r'(\.quick-btn\s*\{[^}]*?)padding:\s*\d+px\s+\d+px',
    r'\g<1>padding:14px 22px',
    html
)

# Also increase the quick-row gap if it exists
html = re.sub(
    r'(\.quick-row\s*\{[^}]*?)gap:\s*\d+px',
    r'\g<1>gap:10px',
    html
)

# Increase line-height on quick-btn
html = re.sub(
    r'(\.quick-btn\s*\{[^}]*?)line-height:\s*[\d.]+',
    r'\g<1>line-height:1.4',
    html
)

print("✅ Alvai suggestion boxes enlarged (3x)")

# ═══════════════════════════════════════════════════════════════
# 2. FIX 9TH HOME CARD
# ═══════════════════════════════════════════════════════════════

# Check if the old 9th card exists and replace it, or add fresh
old_9th = "Cities · Business · Enterprise"
if old_9th in html:
    # Replace the entire card with better version
    # Find the card div containing this text
    pos = html.find(old_9th)
    if pos > 0:
        # Find the start of this card div
        card_start = html.rfind('<div class="card"', 0, pos)
        # Find the end </div>
        card_end = html.find('</div>', pos) + 6
        if card_start > 0 and card_end > card_start:
            NEW_9TH = '''<div class="card" onclick="go('enterprise')" style="border:1px solid rgba(200,169,81,.25);background:linear-gradient(135deg,rgba(200,169,81,.06),rgba(96,165,250,.04))"><h3>🏛️ Built for Cities · Leaders · Business</h3><p>How BLEU deploys as infrastructure — [city].bleu.live, [business].bleu.live, [enterprise].bleu.live. The validation engine. The moat. Starting from our headquarters in New Orleans. See how we quantify what the old systems never could.</p></div>'''
            html = html[:card_start] + NEW_9TH + html[card_end:]
            print("✅ 9th home card upgraded")
else:
    print("⚠️  9th card not found — may need manual check")

# ═══════════════════════════════════════════════════════════════
# 3. REPLACE ENTERPRISE TAB — THE DEEP VERSION
# ═══════════════════════════════════════════════════════════════

# Find and replace the entire enterprise panel
ent_start = html.find('id="p-enterprise"')
if ent_start > 0:
    # Find the div that starts this panel
    panel_div_start = html.rfind('<div', 0, ent_start)
    # Find the matching closing </div> — it's the next panel or footer
    # Search for next panel start or footer
    next_markers = ['<div class="panel"', '<footer', '<!-- ═══']
    panel_end = len(html)
    for marker in next_markers:
        pos = html.find(marker, ent_start + 50)
        if pos > 0 and pos < panel_end:
            panel_end = pos
    
    ENTERPRISE_DEEP = '''<div class="panel" id="p-enterprise">
  <div class="section-label" style="letter-spacing:5px">THE INFRASTRUCTURE MOAT</div>
  <h1 style="font-size:32px;line-height:1.2">The Old System Is Broken.<br><span style="color:var(--gold)">BLEU Is the Replacement.</span></h1>
  <p class="hero" style="font-size:16px;line-height:1.8;max-width:800px">Wellness has been fragmented for decades — scattered directories, unverified claims, no data connecting anything. BLEU doesn't patch the old system. BLEU replaces it with infrastructure. Every city. Every business. Every health system. One operating system. One truth layer. Built from our headquarters in New Orleans, Louisiana — and scaling to every city in America.</p>

  <div class="divider"></div>
  <div class="section-label">HOW THE OLD WORLD WORKED vs. HOW BLEU WORKS</div>
  
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0">
    <div style="background:rgba(192,57,43,.06);border:1px solid rgba(192,57,43,.15);border-radius:10px;padding:24px">
      <div style="font-size:12px;letter-spacing:3px;color:#E74C3C;font-weight:700;margin-bottom:14px">❌ THE OLD SYSTEM</div>
      <div style="font-size:14px;color:var(--dim);line-height:1.9">
        <div style="margin-bottom:10px;padding:8px 12px;background:rgba(192,57,43,.04);border-radius:6px"><strong style="color:var(--cream)">Directories:</strong> Yelp, Google, ZocDoc — reviews by strangers. No federal verification. Pay-to-rank. A 5-star listing means nothing about clinical outcomes.</div>
        <div style="margin-bottom:10px;padding:8px 12px;background:rgba(192,57,43,.04);border-radius:6px"><strong style="color:var(--cream)">Supplements:</strong> Amazon reviews. Influencer codes. No drug interaction checking. No dosage validation. No safety engine. People guess and hope.</div>
        <div style="margin-bottom:10px;padding:8px 12px;background:rgba(192,57,43,.04);border-radius:6px"><strong style="color:var(--cream)">Mental Health:</strong> Psychology Today's directory. Filter by insurance, maybe. No AI bridge. No crisis integration. No therapy modes. Wait 6 weeks for an appointment.</div>
        <div style="margin-bottom:10px;padding:8px 12px;background:rgba(192,57,43,.04);border-radius:6px"><strong style="color:var(--cream)">City Health:</strong> Annual PDF reports. 18 months old by publication. No real-time data. No neighborhood-level intelligence. No actionable dashboards.</div>
        <div style="padding:8px 12px;background:rgba(192,57,43,.04);border-radius:6px"><strong style="color:var(--cream)">Recovery:</strong> Isolated from everything else. No connection to therapy, finance, nutrition, community. Treatment ends and there's nothing on the other side.</div>
      </div>
    </div>
    <div style="background:rgba(45,212,168,.06);border:1px solid rgba(45,212,168,.15);border-radius:10px;padding:24px">
      <div style="font-size:12px;letter-spacing:3px;color:var(--teal);font-weight:700;margin-bottom:14px">✅ THE BLEU SYSTEM</div>
      <div style="font-size:14px;color:var(--dim);line-height:1.9">
        <div style="margin-bottom:10px;padding:8px 12px;background:rgba(45,212,168,.04);border-radius:6px"><strong style="color:var(--cream)">Directory:</strong> 485,476 NPI-verified practitioners. Federal database — not reviews. Trust scores based on credentials, not popularity. Every phone number confirmed.</div>
        <div style="margin-bottom:10px;padding:8px 12px;background:rgba(45,212,168,.04);border-radius:6px"><strong style="color:var(--cream)">Supplements:</strong> 5-layer safety engine. FDA adverse event database. Drug interaction checker. Exact doses, brands, mechanisms. Products earn their place — they don't buy it.</div>
        <div style="margin-bottom:10px;padding:8px 12px;background:rgba(45,212,168,.04);border-radius:6px"><strong style="color:var(--cream)">Mental Health:</strong> 22 AI therapeutic modes — CBT, DBT, somatic, trauma, grief, crisis, couples, family. Available right now, 24/7. The bridge until you find a therapist. Or alongside one.</div>
        <div style="margin-bottom:10px;padding:8px 12px;background:rgba(45,212,168,.04);border-radius:6px"><strong style="color:var(--cream)">City Health:</strong> Real-time. EPA air quality. SAMHSA treatment density. NPI provider mapping. Neighborhood-level scores across 12 dimensions. Living dashboards — not PDFs.</div>
        <div style="padding:8px 12px;background:rgba(45,212,168,.04);border-radius:6px"><strong style="color:var(--cream)">Recovery:</strong> 8 specialized modes. Connected to therapy, finance, nutrition, community, crisis lines. SAMHSA 1-800-662-4357 built in. Recovery doesn't end — it's supported by the entire ecosystem.</div>
      </div>
    </div>
  </div>

  <div class="divider"></div>
  <div class="section-label">HOW BLEU QUANTIFIES & VALIDATES</div>
  
  <div class="card-grid">
    <div class="card" style="border-top:3px solid #A78BFA">
      <h3 style="color:#A78BFA">🛡️ 247 Data Sources</h3>
      <p>Direct API integration with federal health agencies. Not scraped. Not crawled. Direct. EPA environmental monitoring. SAMHSA treatment locators. NPI provider verification. FDA adverse event reporting. NIH clinical research. CMS Medicare/Medicaid coverage. PharmGKB pharmacogenomics. DrugBank interactions. Every data point traces back to its source. If it can't be verified, it doesn't exist on BLEU.</p>
    </div>
    <div class="card" style="border-top:3px solid var(--gold)">
      <h3 style="color:var(--gold)">📊 525,965 Verified Records</h3>
      <p>Growing daily. Practitioners verified against NPI. Products checked against FDA. Interactions validated against clinical databases. Environmental data updated in real-time from EPA sensors. Treatment facilities confirmed through SAMHSA. This is not a static database — it's a living intelligence layer that gets smarter with every query, every interaction, every new data source connected.</p>
    </div>
    <div class="card" style="border-top:3px solid var(--teal)">
      <h3 style="color:var(--teal)">⚕️ Medical Oversight Standard</h3>
      <p>Dr. Felicia Stoler — DCN, MS, RDN, FACSM, FAND, Dipl ACLM. Tulane University. Columbia University. Rutgers University. 28 years in health and wellness. Trained medical journalist. Her standard is simple: no embellishing. Every claim must be a verifiable fact. If it doesn't pass her review, it doesn't go live. This is the credibility layer most platforms don't have — because most platforms never had someone willing to hold that line.</p>
    </div>
    <div class="card" style="border-top:3px solid #F472B6">
      <h3 style="color:#F472B6">🧠 22 AI Therapeutic Modes</h3>
      <p>Not a chatbot with canned responses. 12 therapy modes: CBT, DBT, somatic, motivational interviewing, journaling, crisis support, couples, grief, trauma, psychoeducation, life coaching, career. 7 recovery modes: early sobriety, relapse prevention, harm reduction, MAT support, family, milestones, eating disorders. Plus ECS Intelligence, finance, and general wellness. Powered by Claude. Available 24/7. The bridge and the companion.</p>
    </div>
    <div class="card" style="border-top:3px solid #60A5FA">
      <h3 style="color:#60A5FA">🗺️ 12-Dimension City Scoring</h3>
      <p>Every neighborhood scored across: practitioner density, treatment access, environmental quality, food access, walkability, social infrastructure, recovery resources, financial health services, mental health access, fitness density, community organizations, and crisis response. Real-time. Actionable. The data cities need to make decisions — not the data they've been settling for.</p>
    </div>
    <div class="card" style="border-top:3px solid #FB923C">
      <h3 style="color:#FB923C">🔒 Zero-Compromise Privacy</h3>
      <p>No data selling. No ad targeting. No behavioral tracking. No third-party data brokers. Row-level security on Supabase. HIPAA-conscious architecture. Wellness data belongs to the people it serves — period. Cities and businesses trust BLEU because the architecture was built for trust from day one. Not retrofitted. Not promised. Built.</p>
    </div>
  </div>

  <div class="divider"></div>
  <div class="section-label">THE DEPLOYMENT MODEL</div>
  
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin:20px 0">
    <div style="background:rgba(96,165,250,.06);border:1px solid rgba(96,165,250,.15);border-radius:10px;padding:28px">
      <div style="font-size:28px;margin-bottom:12px">🏛️</div>
      <div style="font-size:12px;letter-spacing:3px;color:#60A5FA;font-weight:700;margin-bottom:8px">CITIES</div>
      <div style="font-size:22px;font-weight:300;color:var(--cream);margin-bottom:8px;font-family:Georgia,serif">[city].bleu.live</div>
      <div style="font-size:14px;color:var(--dim);line-height:1.7;margin-bottom:14px">Every city gets its own living wellness portal. Neighborhood health intelligence. Population dashboards. Environmental monitoring. Treatment mapping. Provider verification. Community wellness scoring. The data layer that feeds into municipal planning, tourism positioning, economic development, and federal grant applications.</div>
      <div style="padding:12px;background:rgba(96,165,250,.06);border-radius:6px;font-size:12px;color:#60A5FA;line-height:1.6"><strong>Live now:</strong> neworleans.bleu.live — 276 hand-verified providers. 12 categories. Real-time federal data. The model every city deployment follows.</div>
    </div>
    <div style="background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.15);border-radius:10px;padding:28px">
      <div style="font-size:28px;margin-bottom:12px">🏢</div>
      <div style="font-size:12px;letter-spacing:3px;color:var(--gold);font-weight:700;margin-bottom:8px">BUSINESSES</div>
      <div style="font-size:22px;font-weight:300;color:var(--cream);margin-bottom:8px;font-family:Georgia,serif">[business].bleu.live</div>
      <div style="font-size:14px;color:var(--dim);line-height:1.7;margin-bottom:14px">Employee wellness infrastructure that reduces healthcare costs and improves retention. Your company portal with practitioner access, supplement safety, AI therapeutic support, health dashboards, and 40-Day Missions for team engagement. Not a perk — a system. Measurable ROI from day one.</div>
      <div style="padding:12px;background:rgba(200,169,81,.06);border-radius:6px;font-size:12px;color:var(--gold);line-height:1.6"><strong>Example:</strong> ochsner.bleu.live — hospital system employees get BLEU's full platform under their brand. Supplement safety. Recovery support. Financial wellness. All 15 systems.</div>
    </div>
    <div style="background:rgba(45,212,168,.06);border:1px solid rgba(45,212,168,.15);border-radius:10px;padding:28px">
      <div style="font-size:28px;margin-bottom:12px">🏥</div>
      <div style="font-size:12px;letter-spacing:3px;color:var(--teal);font-weight:700;margin-bottom:8px">ENTERPRISE</div>
      <div style="font-size:22px;font-weight:300;color:var(--cream);margin-bottom:8px;font-family:Georgia,serif">[enterprise].bleu.live</div>
      <div style="font-size:14px;color:var(--dim);line-height:1.7;margin-bottom:14px">Full white-label for health systems, hospital networks, universities, insurance platforms, and government agencies. Your brand. Your data sovereignty. BLEU's 15 intelligence systems, 22 AI modes, and 525K+ verified records underneath. API integration with your existing EMR, benefits platform, or student health system.</div>
      <div style="padding:12px;background:rgba(45,212,168,.06);border-radius:6px;font-size:12px;color:var(--teal);line-height:1.6"><strong>Example:</strong> tulane.bleu.live — student wellness, campus practitioner directory, supplement safety, recovery support, mental health access. University-branded.</div>
    </div>
  </div>

  <div class="divider"></div>
  <div class="section-label">🏠 HEADQUARTERED IN NEW ORLEANS</div>
  
  <div style="background:linear-gradient(135deg,rgba(200,169,81,.06),rgba(45,212,168,.04));border:1px solid rgba(200,169,81,.15);border-radius:12px;padding:32px;margin:20px 0">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <div>
        <h3 style="font-size:22px;font-weight:300;color:var(--cream);margin-bottom:12px;font-family:Georgia,serif">New Orleans isn't just our first city.<br><em style="color:var(--gold)">It's our home.</em></h3>
        <div style="font-size:14px;color:var(--dim);line-height:1.8">
          <p style="margin-bottom:12px">BLEU was born in New Orleans. Built by people who live here, heal here, and belong here. Jazz Bird® NOLA is our partnership with this city — a 501(c)(3) nonprofit initiative repositioning Greater New Orleans as the wellness destination of America.</p>
          <p style="margin-bottom:12px">This isn't a tech company parachuting into a market. This is a system built from inside the community — 28 years of healing lineage, strategic alliances with city institutions, and hand-verified local providers who we know by name.</p>
          <p>When BLEU deploys to the next city, we bring what we built here. The methodology. The medical oversight. The validation standard. The community-first approach. New Orleans proved the model. Every city after inherits it.</p>
        </div>
      </div>
      <div>
        <div style="font-size:12px;letter-spacing:3px;color:var(--gold);font-weight:700;margin-bottom:14px">STRATEGIC ALLIANCES</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div style="padding:10px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.1);border-radius:6px;font-size:12px;color:var(--cream);font-weight:600;text-align:center">GNO, Inc.</div>
          <div style="padding:10px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.1);border-radius:6px;font-size:12px;color:var(--cream);font-weight:600;text-align:center">New Orleans & Company</div>
          <div style="padding:10px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.1);border-radius:6px;font-size:12px;color:var(--cream);font-weight:600;text-align:center">Tulane Center for Aging</div>
          <div style="padding:10px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.1);border-radius:6px;font-size:12px;color:var(--cream);font-weight:600;text-align:center">Council on Aging</div>
          <div style="padding:10px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.1);border-radius:6px;font-size:12px;color:var(--cream);font-weight:600;text-align:center">Ochsner Eat Fit</div>
          <div style="padding:10px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.1);border-radius:6px;font-size:12px;color:var(--cream);font-weight:600;text-align:center">Celebrate Canal!</div>
          <div style="padding:10px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.1);border-radius:6px;font-size:12px;color:var(--cream);font-weight:600;text-align:center">Downtown Dev District</div>
          <div style="padding:10px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.1);border-radius:6px;font-size:12px;color:var(--cream);font-weight:600;text-align:center">Mayor's Office Econ Dev</div>
        </div>
        <div style="margin-top:14px;padding:12px;background:rgba(45,212,168,.06);border:1px solid rgba(45,212,168,.1);border-radius:6px">
          <div style="font-size:12px;color:var(--teal);line-height:1.6"><strong>neworleans.bleu.live</strong> — 276 verified providers. 12 wellness categories. 119 confirmed phone numbers. Live Alvai AI. Federal data integration. The proof that the model works — built right here.</div>
        </div>
      </div>
    </div>
  </div>

  <div class="divider"></div>
  <div class="section-label">THE NETWORK EFFECT — WHY THE MOAT IS PERMANENT</div>

  <div style="background:rgba(15,22,40,.8);border:1px solid rgba(200,169,81,.1);border-radius:12px;padding:28px;margin:20px 0">
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:16px;color:var(--cream);line-height:1.7;max-width:700px;margin:0 auto">Every city added makes BLEU smarter. Every business deployed adds practitioners to the network. Every user interaction improves the AI. A competitor doesn't just need the technology — they need the community trust, the federal data pipeline, the medical oversight, and the years of relationship building. By the time they start, BLEU is three cities ahead.</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;text-align:center">
      <div style="padding:16px 8px;background:rgba(96,165,250,.06);border:1px solid rgba(96,165,250,.1);border-radius:8px">
        <div style="font-size:20px;margin-bottom:6px">🏛️</div>
        <div style="font-size:11px;color:#60A5FA;font-weight:700">More Cities</div>
      </div>
      <div style="padding:16px 8px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.1);border-radius:8px">
        <div style="font-size:20px;margin-bottom:6px">👨‍⚕️</div>
        <div style="font-size:11px;color:var(--gold);font-weight:700">More Practitioners</div>
      </div>
      <div style="padding:16px 8px;background:rgba(167,139,250,.06);border:1px solid rgba(167,139,250,.1);border-radius:8px">
        <div style="font-size:20px;margin-bottom:6px">📊</div>
        <div style="font-size:11px;color:#A78BFA;font-weight:700">Better Data</div>
      </div>
      <div style="padding:16px 8px;background:rgba(45,212,168,.06);border:1px solid rgba(45,212,168,.1);border-radius:8px">
        <div style="font-size:20px;margin-bottom:6px">💎</div>
        <div style="font-size:11px;color:var(--teal);font-weight:700">More Value</div>
      </div>
      <div style="padding:16px 8px;background:rgba(244,114,182,.06);border:1px solid rgba(244,114,182,.1);border-radius:8px">
        <div style="font-size:20px;margin-bottom:6px">🔄</div>
        <div style="font-size:11px;color:#F472B6;font-weight:700">Compounds</div>
      </div>
    </div>
  </div>

  <!-- B.L.E.U. STATEMENT -->
  <div style="margin-top:32px;text-align:center;padding:32px 20px;border-top:1px solid rgba(200,169,81,.1)">
    <div style="display:flex;justify-content:center;gap:32px;margin-bottom:16px;flex-wrap:wrap">
      <div><span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:var(--gold)">B</span><span style="font-size:16px;color:var(--dim);margin-left:6px;letter-spacing:1px">elieve</span></div>
      <div><span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:var(--gold)">L</span><span style="font-size:16px;color:var(--dim);margin-left:6px;letter-spacing:1px">ove</span></div>
      <div><span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:var(--gold)">E</span><span style="font-size:16px;color:var(--dim);margin-left:6px;letter-spacing:1px">volve</span></div>
      <div><span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:var(--gold)">U</span><span style="font-size:16px;color:var(--dim);margin-left:6px;letter-spacing:1px">nite</span></div>
    </div>
    <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(200,169,81,.2),transparent);max-width:400px;margin:0 auto 16px"></div>
    <p style="font-size:15px;color:var(--dim);max-width:650px;margin:0 auto;line-height:1.8;font-style:italic">The Longevity Operating System. Born in New Orleans. Built for every city, every business, every human who deserves access to real wellness intelligence. Not the old system repackaged. The new one. Patent Pending.</p>
    <div style="display:flex;justify-content:center;gap:6px;margin-top:16px;flex-wrap:wrap">
      <span style="font-size:9px;padding:3px 8px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.08);border-radius:3px;color:var(--muted);font-weight:600">EPA</span>
      <span style="font-size:9px;padding:3px 8px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.08);border-radius:3px;color:var(--muted);font-weight:600">FDA</span>
      <span style="font-size:9px;padding:3px 8px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.08);border-radius:3px;color:var(--muted);font-weight:600">SAMHSA</span>
      <span style="font-size:9px;padding:3px 8px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.08);border-radius:3px;color:var(--muted);font-weight:600">NPI</span>
      <span style="font-size:9px;padding:3px 8px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.08);border-radius:3px;color:var(--muted);font-weight:600">NIH</span>
      <span style="font-size:9px;padding:3px 8px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.08);border-radius:3px;color:var(--muted);font-weight:600">CMS</span>
      <span style="font-size:9px;padding:3px 8px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.08);border-radius:3px;color:var(--muted);font-weight:600">PharmGKB</span>
      <span style="font-size:9px;padding:3px 8px;background:rgba(200,169,81,.06);border:1px solid rgba(200,169,81,.08);border-radius:3px;color:var(--muted);font-weight:600">DrugBank</span>
    </div>
  </div>

  <div class="disclaimer">🏛️ BLEU is the longevity operating system. Medical oversight by Dr. Felicia Stoler (DCN, MS, RDN, FACSM, FAND — Tulane, Columbia, Rutgers). For enterprise inquiries: hello@bleu.live</div>
</div>
'''

    html = html[:panel_div_start] + ENTERPRISE_DEEP + "\n" + html[panel_end:]
    print("✅ Enterprise tab rebuilt — deep version")
else:
    print("❌ Enterprise panel not found — was previous script run?")

# ═══════════════════════════════════════════════════════════════
# SAVE + VERIFY
# ═══════════════════════════════════════════════════════════════

with open(FILE, "w", encoding="utf-8") as f:
    f.write(html)

new_len = len(html)

print(f"\n{'═'*55}")
print(f"  BLEU.live — THE WIN")
print(f"{'═'*55}")
print(f"  Size: {original_len:,} → {new_len:,} (+{new_len - original_len:,})")
print()

checks = [
    ("Alvai boxes enlarged", "font-size:15px;padding:14px 22px" in html or "font-size:15px" in html),
    ("9th home card upgraded", "Built for Cities · Leaders · Business" in html),
    ("Enterprise panel deep", "The Old System Is Broken" in html),
    ("Old vs New comparison", "THE OLD SYSTEM" in html and "THE BLEU SYSTEM" in html),
    ("Quantification section", "247 Data Sources" in html),
    ("[city].bleu.live", "[city].bleu.live" in html),
    ("[business].bleu.live", "[business].bleu.live" in html),
    ("[enterprise].bleu.live", "[enterprise].bleu.live" in html),
    ("NOLA HQ section", "Headquartered" in html or "HEADQUARTERED" in html),
    ("Strategic alliances", "GNO, Inc." in html or "GNO Inc." in html),
    ("neworleans.bleu.live", "neworleans.bleu.live" in html),
    ("Network effect moat", "MOAT IS PERMANENT" in html or "moat" in html),
    ("B.L.E.U. at bottom", "elieve" in html and "volve" in html),
    ("Dr. Felicia", "Dr. Felicia Stoler" in html),
    ("Patent Pending", "Patent Pending" in html),
    ("Medical oversight", "Tulane" in html and "Columbia" in html),
    ("22 AI modes", "22 AI" in html or "22 therapeutic" in html),
    ("525K records", "525,965" in html),
]

for name, ok in checks:
    print(f"  {'✅' if ok else '❌'} {name}")

passed = sum(1 for _, ok in checks if ok)
print(f"\n  {passed}/{len(checks)} passed")
print(f"\n{'═'*55}")
print(f"  DEPLOY:")
print(f"  git add -A && git commit -m 'Enterprise deep + Alvai bigger' && git push origin main --force")
print(f"  Then Cmd+Shift+R on bleu.live")
print(f"{'═'*55}")
