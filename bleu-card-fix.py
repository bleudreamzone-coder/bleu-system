#!/usr/bin/env python3
"""
BLEU.live — Surgical card fix

The enterprise card keeps getting NESTED inside Recovery.
This script:
1. Removes ALL enterprise cards from everywhere
2. Finds the Recovery Support big card by its SAMHSA tag
3. Finds that card's OUTER boundary precisely 
4. Inserts the 9th card AFTER it as a sibling

Run: python3 bleu-card-fix.py
"""

import os, sys

FILE = "index.html"
if not os.path.exists(FILE):
    print("❌ index.html not found"); sys.exit(1)

with open(FILE, "r", encoding="utf-8") as f:
    html = f.read()

orig = len(html)

# ═══════════════════════════════════════════════════════════════
# STEP 1: NUKE every enterprise card from the HTML
# ═══════════════════════════════════════════════════════════════

removal_count = 0
for marker_text in [
    "Built for Cities · Leaders · Business",
    "Cities · Business · Enterprise",
    "SEE THE MATH",
    "[city].bleu.live + ROI + Forecasting",
]:
    while marker_text in html:
        pos = html.find(marker_text)
        if pos < 0:
            break
        
        # Walk backwards to find the opening <div of this card
        search_back = html[max(0, pos-2000):pos]
        
        # Find the last <div with class containing "card" or "wow" before our text
        candidates = []
        idx = 0
        while True:
            found = search_back.find('<div', idx)
            if found < 0:
                break
            candidates.append(found + max(0, pos-2000))
            idx = found + 1
        
        # The card start is the last <div before our marker that has card/wow/onclick enterprise
        card_start = -1
        for c in reversed(candidates):
            chunk = html[c:c+300]
            if 'enterprise' in chunk or 'wow-card' in chunk or ('card' in chunk and 'Built for' in html[c:pos+50]):
                card_start = c
                break
        
        if card_start < 0:
            # Just take the closest div
            card_start = candidates[-1] if candidates else -1
        
        if card_start < 0:
            break
            
        # Now find the matching close </div>
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
        
        if card_end > card_start:
            # Remove any trailing whitespace/newlines
            while card_end < len(html) and html[card_end] in '\n\r \t':
                card_end += 1
            html = html[:card_start] + html[card_end:]
            removal_count += 1

print(f"✅ Removed {removal_count} old enterprise card(s)")

# Also remove the wow-card CSS if it was injected
if '<style>\n.wow-card' in html:
    style_start = html.find('<style>\n.wow-card')
    style_end = html.find('</style>', style_start) + 8
    if style_end > style_start:
        html = html[:style_start] + html[style_end:]
        print("  Cleaned up orphaned wow-card CSS")

# ═══════════════════════════════════════════════════════════════
# STEP 2: Find the Recovery Support card's EXACT outer boundary
# ═══════════════════════════════════════════════════════════════

# The Recovery card has this unique tag text:
# "SAMHSA + AA + SMART + Free"
# This tag is INSIDE the Recovery card. We need to find the card's
# outermost </div> closing tag.

tag_text = "SAMHSA + AA + SMART + Free"
tag_pos = html.find(tag_text)

if tag_pos < 0:
    # Try alternate
    tag_text = "You are not alone."
    tag_pos = html.find(tag_text)

if tag_pos < 0:
    print("❌ Cannot find Recovery Support card")
    sys.exit(1)

print(f"  Found Recovery card marker at char {tag_pos}")

# The tag is inside a <span> inside a <div> inside the card div
# We need to go FORWARD from the tag to find where the card ends
# The card structure is roughly:
# <div class="card">
#   ...icon...
#   <h3>Recovery Support</h3>
#   <p>...SAMHSA...</p>
#   <div class="card-tags"><span>SAMHSA + AA...</span></div>
#   [maybe expand div]
#   [maybe expand-hint div]
# </div>

# Strategy: from tag_pos, go forward and find closing </div> tags
# We need to count them. The tag is inside card-tags div.
# After card-tags closes, the card div closes.

# Let's find what's between tag_pos and the next 500 chars
after_tag = html[tag_pos:tag_pos+500]
print(f"  After tag: {repr(after_tag[:120])}")

# Count forward from tag_pos to find the card's closing
# Find the sequence of </div> that closes: span → card-tags div → card div
# Minimum 3 closing divs needed after the tag text

pos = tag_pos
closes_needed = 0

# First, figure out what wraps the tag
# If wrapped in <span> we need span close + div close + card close
# Look backwards to see the nesting
pre = html[max(0,tag_pos-200):tag_pos]
if '<span' in pre[pre.rfind('<'):]:
    closes_needed = 3  # close span, close tags-div, close card
else:
    closes_needed = 2  # close tags-div, close card

# But the card might also have expand content after tags
# Safer: find the card's opening div, then count to close

# Find the card opening by going back from tag_pos
card_open = -1
search = html[max(0,tag_pos-1500):tag_pos]
# Find all <div entries
last_class_card = search.rfind('class="card"')
last_wow_card = search.rfind('class="wow-card"')
last_card_match = max(last_class_card, last_wow_card)

if last_card_match >= 0:
    # Find the <div before this class attribute
    div_before = search.rfind('<div', 0, last_card_match + 5)
    if div_before >= 0:
        card_open = max(0, tag_pos - 1500) + div_before

if card_open < 0:
    print("❌ Cannot find Recovery card opening div")
    sys.exit(1)

print(f"  Recovery card opens at char {card_open}")

# Now properly count div depth from card_open to find its close
depth = 0
i = card_open
card_close = -1
while i < len(html) and i < card_open + 5000:
    if html[i:i+4] == '<div':
        depth += 1
    if html[i:i+6] == '</div>':
        depth -= 1
        if depth == 0:
            card_close = i + 6
            break
    i += 1

if card_close < 0:
    print("❌ Cannot find Recovery card closing div")
    sys.exit(1)

print(f"  Recovery card closes at char {card_close}")
print(f"  Recovery card size: {card_close - card_open} chars")

# Verify: what comes after the card close?
after = html[card_close:card_close+100].strip()
print(f"  After Recovery card: {repr(after[:80])}")

# ═══════════════════════════════════════════════════════════════
# STEP 3: INSERT THE 9TH CARD AS A SIBLING AFTER RECOVERY
# ═══════════════════════════════════════════════════════════════

ENTERPRISE_CARD = '''
  <div class="card" onclick="go('enterprise')" style="cursor:pointer;border:1px solid rgba(200,169,81,.3);background:linear-gradient(135deg,rgba(200,169,81,.08),rgba(96,165,250,.04))">
    <h3 style="color:var(--gold)">🏛️ Built for Cities · Leaders · Business</h3>
    <p>How BLEU measures, quantifies, and forecasts community health. How cities save millions. How businesses cut costs and boost productivity. How [city].bleu.live becomes infrastructure. See the math.</p>
    <div style="margin-top:10px;display:flex;gap:5px;flex-wrap:wrap">
      <span style="font-size:10px;padding:3px 8px;background:rgba(96,165,250,.12);border:1px solid rgba(96,165,250,.2);border-radius:4px;color:#60A5FA;font-weight:600">[city].bleu.live</span>
      <span style="font-size:10px;padding:3px 8px;background:rgba(200,169,81,.12);border:1px solid rgba(200,169,81,.2);border-radius:4px;color:var(--gold);font-weight:600">ROI</span>
      <span style="font-size:10px;padding:3px 8px;background:rgba(45,212,168,.12);border:1px solid rgba(45,212,168,.2);border-radius:4px;color:var(--teal);font-weight:600">Forecasting</span>
    </div>
  </div>
'''

html = html[:card_close] + "\n" + ENTERPRISE_CARD + "\n" + html[card_close:]
print(f"✅ Enterprise card inserted as sibling AFTER Recovery card")

# ═══════════════════════════════════════════════════════════════
# SAVE + VERIFY
# ═══════════════════════════════════════════════════════════════

with open(FILE, "w", encoding="utf-8") as f:
    f.write(html)

new = len(html)
print(f"\n{'═'*55}")
print(f"  BLEU.live — CARD FIX")  
print(f"{'═'*55}")
print(f"  Size: {orig:,} → {new:,} ({new-orig:+,})")
print()

# Count how many of each card type exist
enterprise_count = html.count("Built for Cities · Leaders · Business")
recovery_count = html.count("Recovery Support")

checks = [
    ("Enterprise card exists", enterprise_count >= 1),
    ("Only 1 enterprise card", enterprise_count == 1),
    ("Recovery card intact", recovery_count >= 1),
    ("Links to enterprise tab", "go('enterprise')" in html),
    ("[city].bleu.live tag", "[city].bleu.live" in html),
    ("ROI tag", ">ROI<" in html),
    ("Enterprise tab intact", 'id="p-enterprise"' in html),
    ("Gold border on card", "rgba(200,169,81,.3)" in html),
]

for n, ok in checks:
    print(f"  {'✅' if ok else '❌'} {n}")
p = sum(1 for _,ok in checks if ok)
print(f"\n  {p}/{len(checks)} passed")
print(f"\n{'═'*55}")
print(f"  git add -A && git commit -m 'Fix: 9th card as sibling' && git push origin main --force")
print(f"{'═'*55}")
