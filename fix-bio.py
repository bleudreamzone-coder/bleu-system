#!/usr/bin/env python3
"""Fix both bios: precise, verifiable facts only"""

with open('index.html', 'r') as f:
    html = f.read()

# Fix Bleu's bio - all possible versions
for old in [
    "27 years wellness + cannabis medicine. Tulane, Columbia, and Rutgers educated. 9.2M patient lives touched. Survived 9 overdoses. Overcame 31 felonies. Built this because nobody else would.",
    "27 years wellness + cannabis medicine. 9.2M patient lives touched. Survived 9 overdoses. Overcame 31 felonies. Built this because nobody else would.",
    "28 years in the medical cannabis industry. 30,000+ patients served. Survived 9 overdoses. Overcame 31 felonies. Built this because nobody else would.",
]:
    html = html.replace(old,
        "28 years in the medical cannabis industry. Survived 9 overdoses. Overcame 31 felonies. Built this because nobody else would."
    )

# Fix Dr. Felicia's bio - add 28 years
for old in [
    "DCN, MS, RDN, FACSM, FAND, Dipl ACLM. Tulane, Columbia, and Rutgers. The clinical credibility that validates the system.",
    "Board-certified DCN, MS, RDN, FACSM. The clinical credibility that validates the system.",
]:
    html = html.replace(old,
        "28 years in health &amp; wellness. DCN, MS, RDN, FACSM, FAND, Dipl ACLM. Tulane, Columbia, and Rutgers. The clinical credibility that validates the system."
    )

with open('index.html', 'w') as f:
    f.write(html)

# Fix edge function
edge_path = 'supabase/functions/alvai/index.ts'
with open(edge_path, 'r') as f:
    edge = f.read()

# Fix Bleu in system prompt
for old in [
    "27 years wellness + cannabis medicine, Tulane/Columbia/Rutgers educated, survived 9 overdoses, overcame 31 felonies, treated 30,000+ patients",
    "27 years wellness + cannabis medicine, survived 9 overdoses, overcame 31 felonies, treated 30,000+ patients",
    "28 years in the medical cannabis industry, survived 9 overdoses, overcame 31 felonies, served 30,000+ patients",
]:
    edge = edge.replace(old,
        "28 years in the medical cannabis industry, survived 9 overdoses, overcame 31 felonies"
    )

# Fix Dr. Felicia in system prompt
edge = edge.replace(
    "Dr. Felicia Stoler, DCN, MS, RDN, FACSM, FAND, Dipl ACLM (Tulane, Columbia, Rutgers).",
    "Dr. Felicia Stoler, 28 years in health & wellness, DCN, MS, RDN, FACSM, FAND, Dipl ACLM (Tulane, Columbia, Rutgers)."
)
edge = edge.replace(
    "Dr. Felicia Stoler, DCN, MS, RDN, FACSM, FAND, Dipl ACLM.",
    "Dr. Felicia Stoler, 28 years in health & wellness, DCN, MS, RDN, FACSM, FAND, Dipl ACLM (Tulane, Columbia, Rutgers)."
)

with open(edge_path, 'w') as f:
    f.write(edge)

print("✅ Both bios fixed — verifiable facts only")
print()
print("   BLEU:")
print("   • 28 years in the medical cannabis industry")
print("   • Survived 9 overdoses, overcame 31 felonies")
print()
print("   DR. FELICIA:")
print("   • 28 years in health & wellness")
print("   • DCN, MS, RDN, FACSM, FAND, Dipl ACLM")
print("   • Tulane, Columbia, and Rutgers")
print()
print("Deploy:")
print("  supabase functions deploy alvai --no-verify-jwt")
print("  git add -A && git commit -m 'Both bios: precise verifiable facts' && git push origin main --force")
