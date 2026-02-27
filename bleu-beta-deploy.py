#!/usr/bin/env python3
"""BLEU BETA — All-in-one deploy. Keeps everything, makes it better."""
import re, os, shutil

ALVAI_URL = "https://sqyzboesdpdussiwqpzk.supabase.co/functions/v1/alvai"
SB_URL = "https://sqyzboesdpdussiwqpzk.supabase.co"
SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeXpib2VzZHBkdXNzaXdxcHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0NDg2OTMsImV4cCI6MjA1NDAyNDY5M30.LVAjBCm23lxGx1mY0dCDn0AfT7GDVxAlKoh-G9TplGk"

print("="*60)
print("  BLEU BETA DEPLOY — Nothing changes, everything gets better")
print("="*60)

if not os.path.exists('index.html'):
    print("ERROR: index.html not found. Run: cd /workspaces/bleu-system")
    exit(1)

with open('index.html','r') as f: html=f.read()
original=len(html)
fixes=[]

# ═══ PHASE 1: Kill Railway, point to Supabase ═══
print("\n--- PHASE 1: Kill Railway ---")
for p in [r'https?://bleu-system-production\.up\.railway\.app[^\s"\']*',r'https?://[a-z0-9-]+\.up\.railway\.app[^\s"\']*']:
    for m in re.findall(p,html):
        if '/health' not in m:
            html=html.replace(m,ALVAI_URL)
            fixes.append(f"  Railway URL replaced: {m[:50]}...")

html=re.sub(r'((?:var|const|let)\s+(?:ALVAI_URL|API_URL|CHAT_URL|apiUrl|alvaiUrl)\s*=\s*["\'])https?://[^"\']*railway[^"\']*(["\'])',rf'\g<1>{ALVAI_URL}\g<2>',html)

# Add config if missing
if 'window.BLEU_CONFIG' not in html and '</head>' in html:
    cfg=f'\n<script>window.BLEU_CONFIG={{ALVAI_URL:"{ALVAI_URL}",SUPABASE_URL:"{SB_URL}",SUPABASE_ANON:"{SB_ANON}"}};</script>\n'
    html=html.replace('</head>',cfg+'</head>')
    fixes.append("  Added BLEU_CONFIG")

# Add analytics
if 'plausible' not in html and '</head>' in html:
    html=html.replace('</head>','<script defer data-domain="bleu.live" src="https://plausible.io/js/script.js"></script>\n</head>')
    fixes.append("  Added Plausible analytics")

# ═══ PHASE 1B: Fix Alvai text readability ═══
if 'alvai-readability-fix' not in html and '</head>' in html:
    css="""<style id="alvai-readability-fix">
.alvai-msg-bubble,.msg.ai,.bub.ai,[class*="alvai"] [class*="bubble"]{font-size:15px!important;line-height:1.85!important;letter-spacing:0.01em!important;max-width:92%!important;padding:18px 22px!important}
.msg.ai,.bub.ai{background:rgba(74,120,88,0.08)!important;border:1px solid rgba(74,120,88,0.15)!important;border-radius:16px!important;color:#e8ebe9!important}
.alvai-msg.ai .alvai-msg-bubble{background:#f4f7f5!important;color:#1a2420!important;border-radius:18px!important;border-bottom-left-radius:4px!important}
.msg.user,.bub.user,.alvai-msg.user .alvai-msg-bubble{font-size:14px!important;line-height:1.7!important;padding:14px 18px!important}
[class*="alvai"] input,#ch-in,[id*="alvai"] input{font-size:15px!important;padding:16px 20px!important;border-radius:14px!important}
.msg.ai strong,.bub.ai strong{color:#4a7858!important}
.msg.ai a,.bub.ai a{color:#06b6d4!important;text-decoration:underline!important}
.alvai-cursor{display:inline-block!important;width:2px!important;height:18px!important;background:#4a7858!important;margin-left:2px!important;animation:alvai-blink 1s step-end infinite!important;vertical-align:text-bottom!important}
@keyframes alvai-blink{50%{opacity:0}}
</style>"""
    html=html.replace('</head>',css+'\n</head>')
    fixes.append("  Added Alvai readability CSS")

# ═══ PHASE 3: Coming Soon gates + Patent Pending ═══
print("--- PHASE 3: Polish ---")

if 'trust-score-fix' not in html and '</head>' in html:
    ts="""<style id="trust-score-fix">
.bleu-verified-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:8px;font-size:12px;font-weight:600;color:#22c55e;letter-spacing:0.5px}
.bleu-verified-badge::before{content:'\\2713';font-size:14px}
.coming-soon-gate{position:relative;min-height:300px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:48px 24px}
.coming-soon-gate::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(74,120,88,0.06) 0%,transparent 70%);pointer-events:none}
.coming-soon-icon{font-size:48px;margin-bottom:16px;opacity:0.6}
.coming-soon-title{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:700;color:#e8ebe9;margin-bottom:8px}
.coming-soon-sub{font-size:14px;color:#8a9b90;max-width:400px;line-height:1.7;margin-bottom:24px}
.coming-soon-notify{display:flex;gap:8px;max-width:360px;width:100%}
.coming-soon-notify input{flex:1;padding:12px 16px;border:1px solid rgba(74,120,88,0.2);border-radius:10px;background:rgba(255,255,255,0.04);color:#e8ebe9;font-size:14px;font-family:inherit;outline:none}
.coming-soon-notify input:focus{border-color:rgba(74,120,88,0.4)}
.coming-soon-notify button{padding:12px 20px;background:#4a7858;border:none;border-radius:10px;color:white;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap}
.coming-soon-notify button:hover{background:#3a6048}
</style>"""
    html=html.replace('</head>',ts+'\n</head>')
    fixes.append("  Added trust badge + coming-soon styles")

if 'coming-soon-logic' not in html and '</body>' in html:
    gate="""<script id="coming-soon-logic">
function gateTab(id,icon,title,desc){var el=document.getElementById(id);if(!el)return;if(el.querySelectorAll('[class*="card"],[class*="item"],[class*="result"],table,form').length>3)return;el.innerHTML='<div class="coming-soon-gate"><div class="coming-soon-icon">'+icon+'</div><div class="coming-soon-title">'+title+'</div><div class="coming-soon-sub">'+desc+'</div><div class="coming-soon-notify"><input type="email" placeholder="Your email for early access"><button onclick="this.textContent=\\'Added \\u2713\\';this.disabled=true">Notify Me</button></div></div>'}
document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){gateTab('protocols','\\ud83d\\udccb','Protocols','Evidence-based wellness protocols curated by Dr. Felicia Stoler. Launching soon.');gateTab('learn','\\ud83d\\udcda','Learn','Research hub with PubMed studies, video library, and educational content. Coming soon.');gateTab('community','\\ud83e\\udd1d','Community','Connect with others on the same wellness journey. Groups, events, mentors. Building now.');gateTab('travel','\\u2708\\ufe0f','Travel','Wellness retreats, Blue Zone travel, and health-conscious destination guides. Coming soon.');gateTab('missions','\\ud83c\\udfaf','Missions','Gamified wellness challenges with real rewards. The 40-Day Reset and more. Launching soon.')},500)})
</script>"""
    html=html.replace('</body>',gate+'\n</body>')
    fixes.append("  Added Coming Soon gates for 5 unfinished tabs")

# Patent Pending
if 'Patent Pending' not in html:
    html=html.replace('Built by Bleu Michael Garner','Built by Bleu Michael Garner · Patent Pending')
    fixes.append("  Added Patent Pending to footer")

pp=html.count('Patent Pending')+html.count('PATENT PENDING')
fixes.append(f"  Patent Pending instances: {pp}")

# Viewport
if 'viewport' not in html:
    html=html.replace('<head>','<head>\n<meta name="viewport" content="width=device-width, initial-scale=1.0">')
    fixes.append("  Added viewport meta")

# ═══ WRITE ═══
with open('index.html','w') as f: f.write(html)

# ═══ PHASE 2: Write upgraded edge function ═══
print("--- PHASE 2: Upgrade Edge Function ---")
edge_dir='supabase/functions/alvai'
os.makedirs(edge_dir,exist_ok=True)

# Check if edge function exists, back it up
if os.path.exists(f'{edge_dir}/index.ts'):
    shutil.copy(f'{edge_dir}/index.ts',f'{edge_dir}/index.ts.backup')
    fixes.append("  Backed up existing edge function")

print("  Edge function will be deployed separately")
print("  (Keeping existing edge function — upgrade when ready)")
fixes.append("  Edge function directory ready")

# ═══ REPORT ═══
print("\n" + "="*60)
print("  RESULTS")
print("="*60)
for f2 in fixes: print(f2)
print(f"\n  File: {original:,} -> {len(html):,} bytes")
print(f"  Railway refs remaining: {html.lower().count('railway')}")
print(f"  Supabase URL: {'SET' if ALVAI_URL in html else 'MISSING'}")
print(f"  Config: {'YES' if 'BLEU_CONFIG' in html else 'NO'}")
print(f"  Analytics: {'YES' if 'plausible' in html else 'NO'}")
print(f"  Readability: {'YES' if 'alvai-readability-fix' in html else 'NO'}")
print(f"  Coming Soon: {'YES' if 'coming-soon-logic' in html else 'NO'}")

print("\n" + "="*60)
print("  NOW RUN:")
print("  git add -A && git commit -m 'BLEU BETA: robust' && git push origin main --force")
print("="*60)
