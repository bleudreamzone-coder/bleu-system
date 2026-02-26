#!/usr/bin/env python3
"""
Fix: The 3rd </div> was the GRID CONTAINER, not the card.
Insert after 2nd </div> = inside the grid, after Recovery card.

Structure:
  SAMHSA + AA + SMART + Free</span></div>  ← 1st: tag container
    </div>  ← 2nd: RECOVERY CARD  ← INSERT HERE
  </div>    ← 3rd: GRID CONTAINER (don't go past this!)
"""
import os, sys
FILE = "index.html"
if not os.path.exists(FILE):
    print("❌ index.html not found"); sys.exit(1)
with open(FILE, "r", encoding="utf-8") as f:
    html = f.read()
orig = len(html)

# Remove any existing enterprise cards
for text in ["Built for Cities · Leaders · Business"]:
    while text in html:
        pos = html.find(text)
        if pos < 0: break
        back = html[max(0,pos-2000):pos]
        divs = []
        idx = 0
        while True:
            f = back.find('<div', idx)
            if f < 0: break
            divs.append(f + max(0,pos-2000))
            idx = f + 1
        if not divs: break
        card_s = divs[-1]
        d = 0; i = card_s; card_e = -1
        while i < card_s + 3000:
            if html[i:i+4] == '<div': d += 1
            if html[i:i+6] == '</div>':
                d -= 1
                if d == 0: card_e = i + 6; break
            i += 1
        if card_e > card_s:
            html = html[:card_s] + html[card_e:]
print(f"✅ Cleaned old cards")

# Find Recovery tag, count 2 (not 3) closing divs
tag = "SAMHSA + AA + SMART + Free"
tag_pos = html.find(tag)
if tag_pos < 0:
    print("❌ Tag not found"); sys.exit(1)

pos = tag_pos
divs_found = 0
insert_at = -1
for _ in range(20):
    nc = html.find('</div>', pos)
    if nc < 0: break
    divs_found += 1
    if divs_found == 2:  # After 2nd </div> = after the CARD, inside the GRID
        insert_at = nc + 6
        break
    pos = nc + 6

if insert_at < 0:
    print("❌ Cannot find insert point"); sys.exit(1)

after = html[insert_at:insert_at+60].strip()
print(f"  Insert at char {insert_at}")
print(f"  After: {repr(after[:50])}")

CARD = '''
    <div onclick="go('enterprise')" style="cursor:pointer;border-radius:12px;padding:24px;background:linear-gradient(135deg,rgba(200,169,81,.08),rgba(96,165,250,.04));border:1px solid rgba(200,169,81,.3);transition:all .3s" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 12px 40px rgba(200,169,81,.15)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
      <div style="font-size:28px;margin-bottom:10px">🏛️</div>
      <h3 style="color:var(--gold);font-size:17px;margin-bottom:8px">Built for Cities · Leaders · Business</h3>
      <p style="font-size:13px;color:var(--dim);line-height:1.7">How BLEU measures, quantifies, and forecasts community health. How cities save millions. How businesses cut costs. How [city].bleu.live becomes infrastructure.</p>
      <div style="margin-top:12px;display:flex;gap:5px;flex-wrap:wrap">
        <span style="font-size:10px;padding:3px 8px;background:rgba(96,165,250,.12);border:1px solid rgba(96,165,250,.2);border-radius:4px;color:#60A5FA;font-weight:600">[city].bleu.live</span>
        <span style="font-size:10px;padding:3px 8px;background:rgba(200,169,81,.12);border:1px solid rgba(200,169,81,.2);border-radius:4px;color:var(--gold);font-weight:600">ROI</span>
        <span style="font-size:10px;padding:3px 8px;background:rgba(45,212,168,.12);border:1px solid rgba(45,212,168,.2);border-radius:4px;color:var(--teal);font-weight:600">Forecasting</span>
      </div>
    </div>
'''

html = html[:insert_at] + CARD + html[insert_at:]

with open(FILE, "w", encoding="utf-8") as f:
    f.write(html)

new = len(html)
ok1 = html.count("Built for Cities · Leaders · Business") == 1
ok2 = "go('enterprise')" in html
ok3 = 'id="p-enterprise"' in html
print(f"\n  {'✅' if ok1 else '❌'} Exactly 1 enterprise card")
print(f"  {'✅' if ok2 else '❌'} Links to enterprise")
print(f"  {'✅' if ok3 else '❌'} Enterprise tab intact")
print(f"  Size: {orig:,} → {new:,}")
print(f"\n  git add -A && git commit -m '9th card in grid' && git push origin main --force")
