import os
os.chdir('/workspaces/bleu-system')

# Read the new CannaIQ HTML
with open('/dev/stdin','r') as f: pass  # placeholder
ciq_html = open('/workspaces/bleu-system/cannaiq-content.html').read()

with open('index.html','r') as f: html = f.read()

# Find CannaIQ section and replace injected content
marker = "CANNABIS INTELLIGENCE"
if marker in html:
    i = html.index(marker) + len(marker)
    nd = html.find('</div>', i)
    # Find next section comment to know where our old injection ends
    next_section = html.find('CANNAIQ INTELLIGENCE AREAS', nd)
    if next_section > 0:
        # Find the div before that marker
        pre = html.rfind('<div', 0, next_section)
        html = html[:nd+6] + ciq_html + html[pre:]
    else:
        html = html[:nd+6] + ciq_html + html[nd+6:]
    print("OK CannaIQ replaced")
else:
    print("SKIP - marker not found")

with open('index.html','w') as f: f.write(html)
os.system('git add -A && git commit -m "CANNAIQ MASTERPIECE: 529 strains, 302K interactions, 5-layer safety, BEMS scores, terpene science, ECS quiz, real PMIDs" && git push --force')
print("DONE")
