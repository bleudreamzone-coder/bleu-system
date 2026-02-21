#!/usr/bin/env python3
"""Fix Dr. Felicia's credentials everywhere"""
import os

OLD_CRED = "DCN, MS, RDN, FACSM"
NEW_CRED = "DCN, MS, RDN, FACSM, FAND, Dipl ACLM"

OLD_BIO = "Board-certified DCN, MS, RDN, FACSM. The clinical credibility"
NEW_BIO = "DCN, MS, RDN, FACSM, FAND, Dipl ACLM. Tulane, Columbia, and Rutgers. The clinical credibility"

OLD_EDGE = "President: Dr. Felicia Stoler, DCN, MS, RDN, FACSM."
NEW_EDGE = "President: Dr. Felicia Stoler, DCN, MS, RDN, FACSM, FAND, Dipl ACLM (Tulane, Columbia, Rutgers)."

fixes = 0

# Fix index.html
with open('index.html', 'r') as f:
    html = f.read()

if OLD_BIO in html:
    html = html.replace(OLD_BIO, NEW_BIO)
    fixes += 1

# Fix footer - be specific
html = html.replace(
    "Dr. Felicia Stoler, DCN, MS, RDN, FACSM<br>",
    "Dr. Felicia Stoler, DCN, MS, RDN, FACSM, FAND, Dipl ACLM<br>"
)
fixes += 1

with open('index.html', 'w') as f:
    f.write(html)

# Fix edge function
edge_path = 'supabase/functions/alvai/index.ts'
with open(edge_path, 'r') as f:
    edge = f.read()

if OLD_EDGE in edge:
    edge = edge.replace(OLD_EDGE, NEW_EDGE)
    fixes += 1
    with open(edge_path, 'w') as f:
        f.write(edge)

print(f"✅ Fixed {fixes} locations")
print()
print("Deploy:")
print("  supabase functions deploy alvai --no-verify-jwt")
print("  git add -A && git commit -m 'Fix Dr. Felicia credentials' && git push origin main --force")
