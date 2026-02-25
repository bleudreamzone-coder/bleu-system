#!/bin/bash
set -e
echo "🔵 BLEU Deploy Starting..."

# Step 1: Add Supabase SDK
if ! grep -q "supabase-js@2" index.html; then
  sed -i 's|</head>|<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n</head>|' index.html
  echo "✅ Supabase SDK added"
fi

# Step 2: SEO meta tags
if ! grep -q "og:title" index.html; then
  sed -i '/<head>/a\<meta name="description" content="Free AI wellness intelligence. 22 therapeutic modes. 48,000 verified practitioners.">\n<meta property="og:type" content="website">\n<meta property="og:url" content="https://bleu.live">\n<meta property="og:title" content="BLEU — AI Wellness Intelligence That Actually Listens">\n<link rel="canonical" href="https://bleu.live">\n<meta name="theme-color" content="#1A6B5C">' index.html
  echo "✅ SEO tags added"
fi

# Step 3: Create terms.html
cat > terms.html << 'TEOF'
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Terms of Service — BLEU</title><style>body{margin:0;padding:0;background:#0a1628;color:#c8d6e0;font-family:Arial,sans-serif;line-height:1.7}.container{max-width:720px;margin:0 auto;padding:40px 20px}h1{font-family:Georgia;color:#4ecdc4;font-size:2rem}h2{font-family:Georgia;color:#d4af37;font-size:1.2rem;margin-top:32px}p{font-size:0.9rem;color:#a0b4c0}a{color:#4ecdc4}.back{display:inline-block;margin-bottom:24px;color:#4ecdc4;text-decoration:none;font-size:0.85rem}</style></head><body><div class="container"><a href="/" class="back">← Back to BLEU</a><h1>Terms of Service</h1><p style="color:#8fa4b0;font-size:0.8rem">Effective: February 25, 2026</p><h2>1. Acceptance</h2><p>By accessing BLEU (bleu.live), you agree to these terms.</p><h2>2. What BLEU Is — And Is Not</h2><p>BLEU provides AI-powered wellness conversations, practitioner directory access, and health information. BLEU is NOT a medical provider, licensed therapist, or substitute for professional healthcare. Alvai is an AI wellness intelligence, not a clinician.</p><h2>3. Mental Health Disclaimer</h2><p>If you are experiencing a mental health crisis: <strong>988 Suicide & Crisis Lifeline</strong> (call or text 988), <strong>Crisis Text Line</strong> (text HOME to 741741), or call <strong>911</strong>. BLEU is not a crisis service.</p><h2>4. Cannabis Disclaimer</h2><p>Cannabis information through CannaIQ is educational only. Legality varies by jurisdiction. BLEU does not sell or distribute cannabis.</p><h2>5. Practitioner Directory</h2><p>Our directory contains NPI-verified practitioners from federal databases. BLEU does not employ or endorse any listed practitioner. Verify credentials independently.</p><h2>6. User Accounts</h2><p>You are responsible for your account security. Must be 18+ (or 13+ with parental consent).</p><h2>7. Subscriptions</h2><p>Paid tiers billed monthly via Stripe. Cancel anytime. Refunds case-by-case within 30 days.</p><h2>8. User Content</h2><p>Conversations are stored for continuity. Export or delete anytime from Passport tab. We do not share conversations with third parties.</p><h2>9. Intellectual Property</h2><p>BLEU, Alvai, The Longevity Operating System, CannaIQ, OCEAN architecture — Patent Pending. © 2026 bleu.live.</p><h2>10. Limitation of Liability</h2><p>BLEU is provided "as is." We are not liable for decisions based on platform information. Max liability limited to amounts paid in prior 12 months.</p><h2>11. Governing Law</h2><p>State of Louisiana, United States.</p><h2>12. Contact</h2><p><a href="mailto:hello@bleu.live">hello@bleu.live</a></p><p style="margin-top:40px;text-align:center;font-size:0.75rem;color:#8fa4b0;border-top:1px solid rgba(255,255,255,0.06);padding-top:16px">BLEU · Patent Pending · © 2026</p></div></body></html>
TEOF
echo "✅ terms.html"

# Step 4: Create privacy.html
cat > privacy.html << 'PEOF'
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Privacy Policy — BLEU</title><style>body{margin:0;padding:0;background:#0a1628;color:#c8d6e0;font-family:Arial,sans-serif;line-height:1.7}.container{max-width:720px;margin:0 auto;padding:40px 20px}h1{font-family:Georgia;color:#4ecdc4;font-size:2rem}h2{font-family:Georgia;color:#d4af37;font-size:1.2rem;margin-top:32px}p{font-size:0.9rem;color:#a0b4c0}a{color:#4ecdc4}.back{display:inline-block;margin-bottom:24px;color:#4ecdc4;text-decoration:none;font-size:0.85rem}</style></head><body><div class="container"><a href="/" class="back">← Back to BLEU</a><h1>Privacy Policy</h1><p style="color:#8fa4b0;font-size:0.8rem">Effective: February 25, 2026</p><h2>1. What We Collect</h2><p>Email + name (signup), conversations (during use), wellness goals (profile), usage analytics (cookieless).</p><h2>2. What We Do NOT Collect</h2><p>SSN, insurance info, precise geolocation, cannabis purchase history tied to identity. We never sell data to advertisers.</p><h2>3. How We Use Data</h2><p>Provide AI wellness conversations, save session history, personalize experience, improve Alvai (anonymized).</p><h2>4. Security</h2><p>Supabase encryption at rest + transit. Row-Level Security. Stripe PCI-DSS compliant. We never store credit card numbers.</p><h2>5. Data Sharing</h2><p>Only with: Supabase (database), OpenAI (AI — conversations sent without identity), Stripe (payments). No advertisers. No data sales.</p><h2>6. Your Rights</h2><p>View all data in Passport tab. Export as JSON anytime. Delete history anytime. Request full account deletion: hello@bleu.live (30 days).</p><h2>7. Analytics</h2><p>Cookieless, privacy-friendly. No tracking cookies. No cross-site tracking. No consent banner needed.</p><h2>8. Children</h2><p>Designed for 18+. Users 13-17 with parental consent. No data collected from children under 13.</p><h2>9. Contact</h2><p><a href="mailto:hello@bleu.live">hello@bleu.live</a></p><h2>A Note From Our Founder</h2><p style="font-style:italic;color:#d4af37">"Your trust is sacred to me. Your data exists to serve you, not to be sold. That's not a policy — it's a promise." — Bleu Michael Garner</p><p style="margin-top:40px;text-align:center;font-size:0.75rem;color:#8fa4b0;border-top:1px solid rgba(255,255,255,0.06);padding-top:16px">BLEU · Patent Pending · © 2026</p></div></body></html>
PEOF
echo "✅ privacy.html"

# Step 5: sitemap + robots
cat > sitemap.xml << 'SEOF'
<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://bleu.live</loc><changefreq>weekly</changefreq><priority>1.0</priority></url><url><loc>https://bleu.live/terms.html</loc><changefreq>monthly</changefreq><priority>0.3</priority></url><url><loc>https://bleu.live/privacy.html</loc><changefreq>monthly</changefreq><priority>0.3</priority></url></urlset>
SEOF
cat > robots.txt << 'REOF'
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://bleu.live/sitemap.xml
REOF
echo "✅ sitemap + robots"

# Step 6: Patch Passport tab with Auth + Profile + History
python3 << 'PYEOF'
import re

with open('index.html','r') as f:
    html=f.read()

# Find passport panel
s=html.find('<div class="panel" id="p-passport">')
if s==-1:
    print("ERROR: no passport panel found")
    exit(1)

# Find matching close div
depth=0;i=s;end=-1
while i<len(html):
    if html[i:i+4]=='<div':depth+=1
    elif html[i:i+6]=='</div>':
        depth-=1
        if depth==0:end=i+6;break
    i+=1

if end==-1:
    print("ERROR: cant find end of passport panel")
    exit(1)

new_passport='''<div class="panel" id="p-passport">
  <div class="panel-header"><div class="panel-icon">🛂</div><div><div class="panel-title">Your Passport</div><div class="panel-sub">Login · Profile · History</div></div></div>
  <div id="auth-screen" style="text-align:center;padding:20px">
    <div style="font-family:Georgia;font-size:2rem;color:#4ecdc4;margin-bottom:4px">BLEU</div>
    <div style="color:#d4af37;font-size:0.85rem;margin-bottom:24px;font-style:italic">Your Wellness Passport</div>
    <div id="auth-signup" style="max-width:320px;margin:0 auto">
      <input type="text" id="auth-name" placeholder="Your name" style="width:100%;padding:12px;margin-bottom:8px;border:1px solid rgba(78,205,196,0.2);border-radius:10px;background:rgba(25,50,68,0.6);color:#e8d5b0;font-size:0.95rem;outline:none;box-sizing:border-box">
      <input type="email" id="auth-email" placeholder="Email address" style="width:100%;padding:12px;margin-bottom:8px;border:1px solid rgba(78,205,196,0.2);border-radius:10px;background:rgba(25,50,68,0.6);color:#e8d5b0;font-size:0.95rem;outline:none;box-sizing:border-box">
      <input type="password" id="auth-pass" placeholder="Password (6+ characters)" style="width:100%;padding:12px;margin-bottom:8px;border:1px solid rgba(78,205,196,0.2);border-radius:10px;background:rgba(25,50,68,0.6);color:#e8d5b0;font-size:0.95rem;outline:none;box-sizing:border-box">
      <div id="auth-error" style="color:#ff6b6b;font-size:0.8rem;margin:4px 0;display:none"></div>
      <button onclick="doSignUp()" style="width:100%;padding:12px;background:#4ecdc4;color:#0a1628;border:none;border-radius:10px;font-weight:600;cursor:pointer;margin-bottom:8px;font-size:0.95rem">Create My Passport</button>
    </div>
    <div id="auth-signin" style="display:none;max-width:320px;margin:0 auto">
      <input type="email" id="si-email" placeholder="Email address" style="width:100%;padding:12px;margin-bottom:8px;border:1px solid rgba(78,205,196,0.2);border-radius:10px;background:rgba(25,50,68,0.6);color:#e8d5b0;font-size:0.95rem;outline:none;box-sizing:border-box">
      <input type="password" id="si-pass" placeholder="Password" style="width:100%;padding:12px;margin-bottom:8px;border:1px solid rgba(78,205,196,0.2);border-radius:10px;background:rgba(25,50,68,0.6);color:#e8d5b0;font-size:0.95rem;outline:none;box-sizing:border-box">
      <div id="si-error" style="color:#ff6b6b;font-size:0.8rem;margin:4px 0;display:none"></div>
      <button onclick="doSignIn()" style="width:100%;padding:12px;background:#4ecdc4;color:#0a1628;border:none;border-radius:10px;font-weight:600;cursor:pointer;margin-bottom:8px;font-size:0.95rem">Sign In</button>
    </div>
    <div style="display:flex;align-items:center;gap:12px;margin:16px auto;max-width:320px;color:#8fa4b0;font-size:0.8rem"><div style="flex:1;height:1px;background:rgba(255,255,255,0.1)"></div>or<div style="flex:1;height:1px;background:rgba(255,255,255,0.1)"></div></div>
    <button onclick="doGoogleAuth()" style="width:100%;max-width:320px;padding:12px;background:rgba(25,50,68,0.6);color:#e8d5b0;border:1px solid rgba(78,205,196,0.2);border-radius:10px;cursor:pointer;font-size:0.9rem;margin:0 auto 8px;display:block">Continue with Google</button>
    <div id="auth-msg" style="color:#4ecdc4;font-size:0.8rem;margin:8px 0;display:none"></div>
    <p id="toggle-to-signin" onclick="toggleAuth()" style="color:#4ecdc4;cursor:pointer;font-size:0.85rem;margin-top:12px">Already have an account? <strong>Sign in</strong></p>
    <p id="toggle-to-signup" onclick="toggleAuth()" style="color:#4ecdc4;cursor:pointer;font-size:0.85rem;margin-top:12px;display:none">Need an account? <strong>Create one</strong></p>
    <div style="margin-top:30px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.06)"><p style="font-size:0.75rem;color:#8fa4b0;margin-bottom:6px">By creating an account you agree to our</p><a href="/terms.html" style="color:#8fa4b0;font-size:0.75rem">Terms</a> · <a href="/privacy.html" style="color:#8fa4b0;font-size:0.75rem">Privacy</a></div>
  </div>
  <div id="profile-screen" style="display:none">
    <div style="background:linear-gradient(135deg,rgba(25,50,68,0.8),rgba(40,60,80,0.8));border:1px solid rgba(78,205,196,0.15);border-radius:14px;padding:20px;margin-bottom:16px"><div style="font-family:Georgia;font-size:1.3rem;color:#e8d5b0">Welcome back, <span id="prof-name">—</span></div><span id="prof-tier" style="display:inline-block;background:#d4af37;color:#0a1628;padding:2px 10px;border-radius:16px;font-size:0.7rem;font-weight:700;text-transform:uppercase;margin-top:6px">Community</span></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px"><div style="background:rgba(25,50,68,0.6);border:1px solid rgba(78,205,196,0.08);border-radius:12px;padding:14px;text-align:center"><div id="stat-convos" style="font-family:Georgia;font-size:1.5rem;color:#4ecdc4;font-weight:bold">0</div><div style="font-size:0.7rem;color:#8fa4b0">Sessions</div></div><div style="background:rgba(25,50,68,0.6);border:1px solid rgba(212,175,55,0.08);border-radius:12px;padding:14px;text-align:center"><div id="stat-streak" style="font-family:Georgia;font-size:1.5rem;color:#d4af37;font-weight:bold">0</div><div style="font-size:0.7rem;color:#8fa4b0">Streak</div></div><div style="background:rgba(25,50,68,0.6);border:1px solid rgba(78,205,196,0.08);border-radius:12px;padding:14px;text-align:center"><div id="stat-score" style="font-family:Georgia;font-size:1.5rem;color:#4ecdc4;font-weight:bold">0</div><div style="font-size:0.7rem;color:#8fa4b0">BLEU Score</div></div></div>
    <div style="margin-bottom:20px"><div style="font-family:Georgia;font-size:1rem;color:#e8d5b0;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.06)">Recent Sessions</div><div id="session-list"><div style="text-align:center;color:#8fa4b0;padding:20px;font-size:0.85rem">Start a conversation with Alvai to see your history here.</div></div></div>
    <div style="margin-bottom:20px"><div style="font-family:Georgia;font-size:1rem;color:#e8d5b0;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.06)">My Wellness Focus</div><div id="goal-chips" style="display:flex;flex-wrap:wrap;gap:6px"><span class="gc" data-g="sleep" onclick="togGoal(this)">Sleep</span><span class="gc" data-g="anxiety" onclick="togGoal(this)">Anxiety</span><span class="gc" data-g="nutrition" onclick="togGoal(this)">Nutrition</span><span class="gc" data-g="fitness" onclick="togGoal(this)">Fitness</span><span class="gc" data-g="recovery" onclick="togGoal(this)">Recovery</span><span class="gc" data-g="stress" onclick="togGoal(this)">Stress</span><span class="gc" data-g="grief" onclick="togGoal(this)">Grief</span><span class="gc" data-g="relationships" onclick="togGoal(this)">Relationships</span><span class="gc" data-g="cannabis" onclick="togGoal(this)">Cannabis</span><span class="gc" data-g="longevity" onclick="togGoal(this)">Longevity</span></div></div>
    <div style="margin-bottom:16px"><div style="font-family:Georgia;font-size:1rem;color:#e8d5b0;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.06)">Settings</div><div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)"><span style="color:#e8d5b0;font-size:0.85rem">Email</span><span id="set-email" style="color:#8fa4b0;font-size:0.8rem">—</span></div><div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)"><span style="color:#e8d5b0;font-size:0.85rem">Export Data</span><span onclick="exportData()" style="color:#4ecdc4;font-size:0.8rem;cursor:pointer">Download</span></div><div style="display:flex;justify-content:space-between;padding:10px 0"><span style="color:#e8d5b0;font-size:0.85rem">Delete History</span><span onclick="clearHist()" style="color:#ff6b6b;font-size:0.8rem;cursor:pointer">Clear</span></div></div>
    <button onclick="doSignOut()" style="width:100%;padding:12px;border:1px solid #ff6b6b;background:transparent;color:#ff6b6b;border-radius:10px;font-size:0.85rem;cursor:pointer">Sign Out</button>
    <div style="text-align:center;margin-top:20px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06)"><a href="/terms.html" style="color:#8fa4b0;font-size:0.75rem;margin:0 8px;text-decoration:none">Terms</a> · <a href="/privacy.html" style="color:#8fa4b0;font-size:0.75rem;margin:0 8px;text-decoration:none">Privacy</a><p style="margin-top:6px;font-size:0.7rem;color:rgba(255,255,255,0.2)">BLEU v1.0 · Patent Pending · © 2026</p></div>
  </div>
</div>'''

html=html[:s]+new_passport+html[end:]

# Add goal chip CSS
if '.gc{' not in html and '.gc ' not in html:
    gcss='.gc{display:inline-block;background:rgba(78,205,196,0.1);color:#4ecdc4;padding:5px 12px;border-radius:16px;font-size:0.8rem;cursor:pointer;border:1px solid transparent;transition:all 0.2s}.gc.active{background:#4ecdc4;color:#0a1628}.gc:hover{border-color:#4ecdc4}'
    html=html.replace('</style>',gcss+'\\n</style>',1)

with open('index.html','w') as f:
    f.write(html)
print("✅ Passport panel rebuilt with Auth + Profile + History")
PYEOF

# Step 7: Add Auth JavaScript
if ! grep -q "doSignUp" index.html; then
python3 << 'PYEOF2'
with open('index.html','r') as f:
    html=f.read()

sb_line="const SB='https://sqyzboesdpdussiwqpzk.supabase.co'"
idx=html.find(sb_line)
if idx==-1:
    print("ERROR: no SB const");exit(1)
eol=html.find('\\n',idx)

auth_js="""
const SB_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeXpib2VzZHBkdXNzaXdxcHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MjMzMzUsImV4cCI6MjA1Mjk5OTMzNX0.eMHhdjJKZi0ZH0hgdGfszqJJ8KLbFG6fVPWFSYBfwDg'
let sbClient=null,currentUser=null,currentConvoId=null
try{if(window.supabase)sbClient=window.supabase.createClient(SB,SB_ANON)}catch(e){}
window.addEventListener('DOMContentLoaded',()=>{
  if(!sbClient&&window.supabase)sbClient=window.supabase.createClient(SB,SB_ANON)
  if(!sbClient)return
  sbClient.auth.getSession().then(({data})=>{if(data.session){currentUser=data.session.user;showProfile()}})
  sbClient.auth.onAuthStateChange((ev,ses)=>{if(ses){currentUser=ses.user;showProfile()}else{currentUser=null;showAuth()}})
})
let authMode=true
function toggleAuth(){authMode=!authMode;document.getElementById('auth-signup').style.display=authMode?'block':'none';document.getElementById('auth-signin').style.display=authMode?'none':'block';document.getElementById('toggle-to-signin').style.display=authMode?'block':'none';document.getElementById('toggle-to-signup').style.display=authMode?'none':'block'}
async function doSignUp(){if(!sbClient)return sErr('Loading...');const n=document.getElementById('auth-name').value.trim(),e=document.getElementById('auth-email').value.trim(),p=document.getElementById('auth-pass').value;if(!n||!e||!p)return sErr('Fill all fields');if(p.length<6)return sErr('Password 6+ chars');hErr();const{data,error}=await sbClient.auth.signUp({email:e,password:p,options:{data:{full_name:n}}});if(error)return sErr(error.message);if(data.user&&!data.session)sMsg('Check email to confirm!');else if(data.session){currentUser=data.user;showProfile()}}
async function doSignIn(){if(!sbClient)return siErr('Loading...');const e=document.getElementById('si-email').value.trim(),p=document.getElementById('si-pass').value;if(!e||!p)return siErr('Enter email+password');hSiErr();const{data,error}=await sbClient.auth.signInWithPassword({email:e,password:p});if(error)return siErr(error.message);currentUser=data.user;showProfile()}
async function doGoogleAuth(){if(sbClient)await sbClient.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin}})}
async function doSignOut(){if(sbClient)await sbClient.auth.signOut();currentUser=null;currentConvoId=null;showAuth()}
function sErr(m){const e=document.getElementById('auth-error');e.textContent=m;e.style.display='block'}
function hErr(){document.getElementById('auth-error').style.display='none'}
function siErr(m){const e=document.getElementById('si-error');e.textContent=m;e.style.display='block'}
function hSiErr(){document.getElementById('si-error').style.display='none'}
function sMsg(m){const e=document.getElementById('auth-msg');e.textContent=m;e.style.display='block';setTimeout(()=>e.style.display='none',5000)}
function showAuth(){document.getElementById('auth-screen').style.display='block';document.getElementById('profile-screen').style.display='none'}
async function showProfile(){document.getElementById('auth-screen').style.display='none';document.getElementById('profile-screen').style.display='block';if(!currentUser)return;document.getElementById('prof-name').textContent=currentUser.user_metadata?.full_name||currentUser.email?.split('@')[0]||'Friend';document.getElementById('set-email').textContent=currentUser.email||'';if(sbClient){const{data:p}=await sbClient.from('profiles').select('*').eq('id',currentUser.id).single();if(p){document.getElementById('stat-convos').textContent=p.conversations_count||0;document.getElementById('stat-streak').textContent=p.streak_days||0;document.getElementById('stat-score').textContent=p.bleu_score||0;if(p.wellness_goals)p.wellness_goals.forEach(g=>{const c=document.querySelector('.gc[data-g=\"'+g+'\"]');if(c)c.classList.add('active')})}loadSessions()}}
async function loadSessions(){if(!sbClient||!currentUser)return;const{data}=await sbClient.from('conversations').select('id,title,mode,created_at').eq('user_id',currentUser.id).order('updated_at',{ascending:false}).limit(10);const el=document.getElementById('session-list');if(!data||!data.length){el.innerHTML='<div style=\"text-align:center;color:#8fa4b0;padding:20px;font-size:0.85rem\">Talk to Alvai to see history here.</div>';return}el.innerHTML=data.map(c=>{const ic=c.mode==='recovery'?'🌱':c.mode==='therapy'?'🧠':'💚',d=new Date(c.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'});return '<div onclick=\"loadConvo(\\''+c.id+'\\')\\" style=\"display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;cursor:pointer\" onmouseover=\"this.style.background=\\'rgba(78,205,196,0.05)\\'\" onmouseout=\"this.style.background=\\'transparent\\'\"><div style=\"width:32px;height:32px;border-radius:8px;background:rgba(78,205,196,0.1);display:flex;align-items:center;justify-content:center\">'+ic+'</div><div><div style=\"color:#e8d5b0;font-size:0.85rem\">'+(c.title||'Session')+'</div><div style=\"color:#8fa4b0;font-size:0.7rem\">'+d+' · '+(c.mode||'general')+'</div></div></div>'}).join('')}
async function loadConvo(id){if(!sbClient)return;const{data}=await sbClient.from('conversations').select('messages,mode').eq('id',id).single();if(!data)return;currentConvoId=id;const t=data.mode||'alvai';go(t==='general'?'alvai':t);const msgs=data.messages||[];const ce=document.getElementById('chat-'+(t==='general'?'alvai':t));if(ce){ce.innerHTML='';msgs.forEach(m=>{const d=document.createElement('div');d.className=m.role==='user'?'msg-user':'msg-ai';d.innerHTML=m.content;ce.appendChild(d)});ce.scrollTop=ce.scrollHeight}}
async function saveConvo(tab,msgs){if(!sbClient||!currentUser||!msgs.length)return;const mode=tab==='home'?'alvai':tab;const title=(msgs.find(m=>m.role==='user')?.content||'Session').slice(0,60);if(currentConvoId){await sbClient.from('conversations').update({messages:msgs,updated_at:new Date().toISOString()}).eq('id',currentConvoId)}else{const{data}=await sbClient.from('conversations').insert({user_id:currentUser.id,mode,title,messages:msgs}).select('id').single();if(data)currentConvoId=data.id}}
function togGoal(el){el.classList.toggle('active');if(!sbClient||!currentUser)return;const g=[...document.querySelectorAll('.gc.active')].map(c=>c.dataset.g);sbClient.from('profiles').update({wellness_goals:g,updated_at:new Date().toISOString()}).eq('id',currentUser.id)}
async function exportData(){if(!sbClient||!currentUser)return;const{data}=await sbClient.from('conversations').select('*').eq('user_id',currentUser.id);const b=new Blob([JSON.stringify(data||[],null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='bleu-data.json';a.click()}
async function clearHist(){if(!confirm('Delete all history? Cannot undo.'))return;if(!sbClient||!currentUser)return;await sbClient.from('conversations').delete().eq('user_id',currentUser.id);document.getElementById('session-list').innerHTML='<div style=\"text-align:center;color:#8fa4b0;padding:20px\">Cleared.</div>'}
"""

html=html[:eol]+auth_js+html[eol:]

# Hook saveConvo into the chat send flow
# Find where AI response streams complete (scrollTop pattern)
scroll_idx=html.rfind('el.scrollTop=el.scrollHeight')
if scroll_idx>-1 and 'saveConvo' not in html[scroll_idx:scroll_idx+200]:
    seol=html.find('\\n',scroll_idx)
    if seol>-1:
        html=html[:seol]+'\\n    if(currentUser)saveConvo(tab,chatHistories[tab])'+html[seol:]

with open('index.html','w') as f:
    f.write(html)
print("✅ Auth + History JS added + saveConvo hooked")
PYEOF2
fi

# Step 8: Commit + Push
echo "→ Committing..."
git add -A
git commit -m "Deploy: Auth + History + Passport + Legal + SEO"
git push

echo ""
echo "════════════════════════════════════════"
echo "🔵 DONE! Now do these 2 things:"
echo "════════════════════════════════════════"
echo "1. Supabase Dashboard → SQL Editor → run:"
echo "   CREATE TABLE profiles (...)  -- see SQL below"
echo "2. Supabase → Authentication → Providers → Enable Email"
echo "3. Wait 2 min → test bleu.live/passport"
echo "════════════════════════════════════════"
