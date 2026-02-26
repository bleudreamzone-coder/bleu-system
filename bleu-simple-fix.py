#!/usr/bin/env python3
"""
BLEU.live — Ultra-simple 9th card insert

Debug showed us the exact structure after Recovery card:
  SAMHSA + AA + SMART + Free</span></div>  ← tag div closes
      </div>  ← inner wrapper closes  
    </div>  ← CARD closes
  <div class="divider">  ← next element

So: find the tag text, skip forward 3 </div>, insert card there.

Run: python3 bleu-simple-fix.py
"""

import os, sys

FILE = "index.html"
if not os.path.exists(FILE):
    print("❌ index.html not found"); sys.exit(1)

with open(FILE, "r", encoding="utf-8") as f:
    html = f.read()

orig = len(html)

# ═══════════════════════════════════════════════════════════════
# 1. REMOVE ANY EXISTING ENTERPRISE CARDS
# ═══════════════════════════════════════════════════════════════

for text in ["Built for Cities · Leaders · Business", "SEE THE MATH"]:
    while text in html:
        pos = html.find(text)
        if pos < 0: break
        # Find the nearest <div before this
        back = html[max(0,pos-2000):pos]
        divs = []
        idx = 0
        while True:
            f = back.find('<div', idx)
            if f < 0: break
            divs.append(f + max(0,pos-2000))
            idx = f + 1
        if not divs:
            break
        card_s = divs[-1]
        # Find matching close
        d = 0
        i = card_s
        card_e = -1
        while i < card_s + 3000:
            if html[i:i+4] == '<div': d += 1
            if html[i:i+6] == '</div>':
                d -= 1
                if d == 0:
                    card_e = i + 6
                    break
            i += 1
        if card_e > card_s:
            html = html[:card_s] + html[card_e:]

count_after = html.count("Built for Cities")
print(f"✅ Cleaned enterprise cards (remaining: {count_after})")

# ═══════════════════════════════════════════════════════════════
# 2. FIND RECOVERY CARD END USING THE TAG TEXT
# ═══════════════════════════════════════════════════════════════

tag = "SAMHSA + AA + SMART + Free"
tag_pos = html.find(tag)

if tag_pos < 0:
    print("❌ Cannot find Recovery tag"); sys.exit(1)

# From tag_pos, find the 3rd </div> — that's the card's outer close
# Debug showed: </span></div> then </div> then </div> then <div class="divider">
pos = tag_pos
divs_found = 0
insert_at = -1

while pos < tag_pos + 500:
    next_close = html.find('</div>', pos)
    if next_close < 0: break
    divs_found += 1
    if divs_found == 3:
        insert_at = next_close + 6
        break
    pos = next_close + 6

if insert_at < 0:
    print("❌ Cannot find card boundary"); sys.exit(1)

# Show what's at the insertion point
after = html[insert_at:insert_at+80].strip()
print(f"  Inserting at char {insert_at}")
print(f"  What follows: {repr(after[:60])}")

# ═══════════════════════════════════════════════════════════════
# 3. INSERT THE CARD
# ═══════════════════════════════════════════════════════════════

CARD = '''
  <div onclick="go('enterprise')" style="cursor:pointer;border-radius:12px;padding:24px;background:linear-gradient(135deg,rgba(200,169,81,.08),rgba(96,165,250,.04));border:1px solid rgba(200,169,81,.3);transition:all .3s;margin-top:0" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 12px 40px rgba(200,169,81,.15)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
    <div style="font-size:28px;margin-bottom:10px">🏛️</div>
    <h3 style="color:var(--gold);font-size:17px;margin-bottom:8px">Built for Cities · Leaders · Business</h3>
    <p style="font-size:13px;color:var(--dim);line-height:1.7">How BLEU measures, quantifies, and forecasts community health. How cities save millions. How businesses cut costs and boost productivity. How [city].bleu.live becomes infrastructure. See the math.</p>
    <div style="margin-top:12px;display:flex;gap:5px;flex-wrap:wrap">
      <span style="font-size:10px;padding:3px 8px;background:rgba(96,165,250,.12);border:1px solid rgba(96,165,250,.2);border-radius:4px;color:#60A5FA;font-weight:600">[city].bleu.live</span>
      <span style="font-size:10px;padding:3px 8px;background:rgba(200,169,81,.12);border:1px solid rgba(200,169,81,.2);border-radius:4px;color:var(--gold);font-weight:600">ROI</span>
      <span style="font-size:10px;padding:3px 8px;background:rgba(45,212,168,.12);border:1px solid rgba(45,212,168,.2);border-radius:4px;color:var(--teal);font-weight:600">Forecasting</span>
    </div>
  </div>
'''

html = html[:insert_at] + CARD + html[insert_at:]
print(f"✅ Enterprise card inserted as sibling after Recovery")

# ═══════════════════════════════════════════════════════════════
# SAVE
# ═══════════════════════════════════════════════════════════════

with open(FILE, "w", encoding="utf-8") as f:
    f.write(html)

new = len(html)
print(f"\n{'═'*55}")
print(f"  Size: {orig:,} → {new:,} ({new-orig:+,})")

checks = [
    ("Card exists", "Built for Cities · Leaders · Business" in html),
    ("Exactly 1 card", html.count("Built for Cities · Leaders · Business") == 1),
    ("Links to enterprise", "go('enterprise')" in html),
    ("Recovery intact", "SAMHSA + AA + SMART + Free" in html),
    ("Enterprise tab intact", 'id="p-enterprise"' in html),
]
print()
for n, ok in checks:
    print(f"  {'✅' if ok else '❌'} {n}")
print(f"\n{'═'*55}")
print(f"  git add -A && git commit -m '9th card fixed' && git push origin main --force")
print(f"{'═'*55}")
