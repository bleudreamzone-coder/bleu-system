#!/bin/bash
# ═══════════════════════════════════════════════════════════
# BLEU.LIVE — MASTER DEPLOY SCRIPT
# Run in Codespace: bash deploy.sh
# Adds: Auth, History, Passport, Legal, SEO
# ═══════════════════════════════════════════════════════════

set -e
echo "🔵 BLEU Deploy Starting..."

# ═══ STEP 1: Add Supabase SDK before </head> ═══
echo "  → Adding Supabase SDK..."
if ! grep -q "supabase-js@2" index.html; then
  sed -i 's|</head>|<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n</head>|' index.html
  echo "    ✅ Supabase SDK added"
else
  echo "    ⏭ Already present"
fi

# ═══ STEP 2: Add SEO meta tags after <head> ═══
echo "  → Adding SEO meta tags..."
if ! grep -q "og:title" index.html; then
  sed -i '/<head>/a\
<meta name="description" content="Free AI wellness intelligence. 22 therapeutic modes. 48,000 verified practitioners. Drug interaction checking. Recovery support.">\
<meta name="keywords" content="AI therapy, wellness AI, mental health AI, drug interactions, recovery support, addiction help, New Orleans wellness">\
<meta property="og:type" content="website">\
<meta property="og:url" content="https://bleu.live">\
<meta property="og:title" content="BLEU — AI Wellness Intelligence That Actually Listens">\
<meta property="og:description" content="Free AI-powered therapeutic conversations. 22 modes. 48,000 verified practitioners.">\
<meta property="og:image" content="https://bleu.live/og-image.png">\
<meta name="twitter:card" content="summary_large_image">\
<link rel="canonical" href="https://bleu.live">\
<link rel="manifest" href="/manifest.json">\
<meta name="theme-color" content="#1A6B5C">' index.html
  echo "    ✅ SEO tags added"
else
  echo "    ⏭ Already present"
fi

# ═══ STEP 3: Replace Passport Panel with Auth + Profile ═══
echo "  → Rebuilding Passport tab with Auth + History..."

# Create the new passport panel content
cat > /tmp/passport-panel.html << 'PASSPORT_EOF'
<div class="panel" id="p-passport">
  <div class="panel-header">
    <div class="panel-icon">🛂</div>
    <div><div class="panel-title">Your Passport</div><div class="panel-sub">Login • Profile • History</div></div>
  </div>

  <!-- AUTH SCREEN (not logged in) -->
  <div id="auth-screen" style="text-align:center;padding:20px">
    <div style="font-family:Georgia;font-size:2rem;color:#4ecdc4;margin-bottom:4px">BLEU</div>
    <div style="color:#d4af37;font-size:0.85rem;margin-bottom:24px;font-style:italic">Your Wellness Passport</div>
    
    <div id="auth-signup" style="max-width:320px;margin:0 auto">
      <input type="text" id="auth-name" placeholder="Your name" style="width:100%;padding:12px;margin-bottom:8px;border:1px solid rgba(78,205,196,0.2);border-radius:10px;background:rgba(25,50,68,0.6);color:#e8d5b0;font-size:0.95rem;outline:none">
      <input type="email" id="auth-email" placeholder="Email address" style="width:100%;padding:12px;margin-bottom:8px;border:1px solid rgba(78,205,196,0.2);border-radius:10px;background:rgba(25,50,68,0.6);color:#e8d5b0;font-size:0.95rem;outline:none">
      <input type="password" id="auth-pass" placeholder="Password (6+ characters)" style="width:100%;padding:12px;margin-bottom:8px;border:1px solid rgba(78,205,196,0.2);border-radius:10px;background:rgba(25,50,68,0.6);color:#e8d5b0;font-size:0.95rem;outline:none">
      <div id="auth-error" style="color:#ff6b6b;font-size:0.8rem;margin:4px 0;display:none"></div>
      <button onclick="doSignUp()" style="width:100%;padding:12px;background:#4ecdc4;color:#0a1628;border:none;border-radius:10px;font-weight:600;cursor:pointer;margin-bottom:8px;font-size:0.95rem">Create My Passport</button>
    </div>

    <div id="auth-signin" style="display:none;max-width:320px;margin:0 auto">
      <input type="email" id="si-email" placeholder="Email address" style="width:100%;padding:12px;margin-bottom:8px;border:1px solid rgba(78,205,196,0.2);border-radius:10px;background:rgba(25,50,68,0.6);color:#e8d5b0;font-size:0.95rem;outline:none">
      <input type="password" id="si-pass" placeholder="Password" style="width:100%;padding:12px;margin-bottom:8px;border:1px solid rgba(78,205,196,0.2);border-radius:10px;background:rgba(25,50,68,0.6);color:#e8d5b0;font-size:0.95rem;outline:none">
      <div id="si-error" style="color:#ff6b6b;font-size:0.8rem;margin:4px 0;display:none"></div>
      <button onclick="doSignIn()" style="width:100%;padding:12px;background:#4ecdc4;color:#0a1628;border:none;border-radius:10px;font-weight:600;cursor:pointer;margin-bottom:8px;font-size:0.95rem">Sign In</button>
    </div>

    <div style="display:flex;align-items:center;gap:12px;margin:16px auto;max-width:320px;color:#8fa4b0;font-size:0.8rem"><div style="flex:1;height:1px;background:rgba(255,255,255,0.1)"></div>or<div style="flex:1;height:1px;background:rgba(255,255,255,0.1)"></div></div>

    <button onclick="doGoogleAuth()" style="width:100%;max-width:320px;padding:12px;background:rgba(25,50,68,0.6);color:#e8d5b0;border:1px solid rgba(78,205,196,0.2);border-radius:10px;cursor:pointer;font-size:0.9rem;display:flex;align-items:center;justify-content:center;gap:8px;margin:0 auto 8px">
      <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
      Continue with Google
    </button>

    <div id="auth-msg" style="color:#4ecdc4;font-size:0.8rem;margin:8px 0;display:none"></div>

    <p id="toggle-to-signin" onclick="toggleAuth()" style="color:#4ecdc4;cursor:pointer;font-size:0.85rem;margin-top:12px">Already have an account? <strong>Sign in</strong></p>
    <p id="toggle-to-signup" onclick="toggleAuth()" style="color:#4ecdc4;cursor:pointer;font-size:0.85rem;margin-top:12px;display:none">Don't have an account? <strong>Create one</strong></p>

    <div style="margin-top:30px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.06)">
      <p style="font-size:0.75rem;color:#8fa4b0;margin-bottom:6px">By creating an account, you agree to our</p>
      <a href="/terms.html" style="color:#8fa4b0;font-size:0.75rem;margin:0 8px;text-decoration:none">Terms</a> · <a href="/privacy.html" style="color:#8fa4b0;font-size:0.75rem;margin:0 8px;text-decoration:none">Privacy</a>
    </div>
  </div>

  <!-- PROFILE SCREEN (logged in) -->
  <div id="profile-screen" style="display:none">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,rgba(25,50,68,0.8),rgba(40,60,80,0.8));border:1px solid rgba(78,205,196,0.15);border-radius:14px;padding:20px;margin-bottom:16px">
      <div style="font-family:Georgia;font-size:1.3rem;color:#e8d5b0">Welcome back, <span id="prof-name">—</span></div>
      <span id="prof-tier" style="display:inline-block;background:#d4af37;color:#0a1628;padding:2px 10px;border-radius:16px;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-top:6px">Community</span>
    </div>

    <!-- Stats -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px">
      <div style="background:rgba(25,50,68,0.6);border:1px solid rgba(78,205,196,0.08);border-radius:12px;padding:14px;text-align:center"><div id="stat-convos" style="font-family:Georgia;font-size:1.5rem;color:#4ecdc4;font-weight:bold">0</div><div style="font-size:0.7rem;color:#8fa4b0">Sessions</div></div>
      <div style="background:rgba(25,50,68,0.6);border:1px solid rgba(212,175,55,0.08);border-radius:12px;padding:14px;text-align:center"><div id="stat-streak" style="font-family:Georgia;font-size:1.5rem;color:#d4af37;font-weight:bold">0</div><div style="font-size:0.7rem;color:#8fa4b0">Day Streak</div></div>
      <div style="background:rgba(25,50,68,0.6);border:1px solid rgba(78,205,196,0.08);border-radius:12px;padding:14px;text-align:center"><div id="stat-score" style="font-family:Georgia;font-size:1.5rem;color:#4ecdc4;font-weight:bold">0</div><div style="font-size:0.7rem;color:#8fa4b0">BLEU Score</div></div>
    </div>

    <!-- Recent Sessions -->
    <div style="margin-bottom:20px">
      <div style="font-family:Georgia;font-size:1rem;color:#e8d5b0;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.06)">Recent Sessions</div>
      <div id="session-list"><div style="text-align:center;color:#8fa4b0;padding:20px;font-size:0.85rem">Start a conversation with Alvai to see your history here.</div></div>
    </div>

    <!-- Wellness Goals -->
    <div style="margin-bottom:20px">
      <div style="font-family:Georgia;font-size:1rem;color:#e8d5b0;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.06)">My Wellness Focus</div>
      <div id="goal-chips" style="display:flex;flex-wrap:wrap;gap:6px">
        <span class="goal-chip" data-g="sleep" onclick="togGoal(this)">Sleep</span>
        <span class="goal-chip" data-g="anxiety" onclick="togGoal(this)">Anxiety</span>
        <span class="goal-chip" data-g="nutrition" onclick="togGoal(this)">Nutrition</span>
        <span class="goal-chip" data-g="fitness" onclick="togGoal(this)">Fitness</span>
        <span class="goal-chip" data-g="recovery" onclick="togGoal(this)">Recovery</span>
        <span class="goal-chip" data-g="stress" onclick="togGoal(this)">Stress</span>
        <span class="goal-chip" data-g="grief" onclick="togGoal(this)">Grief</span>
        <span class="goal-chip" data-g="relationships" onclick="togGoal(this)">Relationships</span>
        <span class="goal-chip" data-g="cannabis" onclick="togGoal(this)">Cannabis Safety</span>
        <span class="goal-chip" data-g="longevity" onclick="togGoal(this)">Longevity</span>
      </div>
    </div>

    <!-- Settings -->
    <div style="margin-bottom:16px">
      <div style="font-family:Georgia;font-size:1rem;color:#e8d5b0;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.06)">Settings</div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)"><span style="color:#e8d5b0;font-size:0.85rem">Email</span><span id="set-email" style="color:#8fa4b0;font-size:0.8rem">—</span></div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)"><span style="color:#e8d5b0;font-size:0.85rem">Export My Data</span><span onclick="exportData()" style="color:#4ecdc4;font-size:0.8rem;cursor:pointer">Download</span></div>
      <div style="display:flex;justify-content:space-between;padding:10px 0"><span style="color:#e8d5b0;font-size:0.85rem">Delete History</span><span onclick="clearHistory()" style="color:#ff6b6b;font-size:0.8rem;cursor:pointer">Clear</span></div>
    </div>

    <button onclick="doSignOut()" style="width:100%;padding:12px;border:1px solid #ff6b6b;background:transparent;color:#ff6b6b;border-radius:10px;font-size:0.85rem;cursor:pointer;margin-top:8px">Sign Out</button>

    <div style="text-align:center;margin-top:20px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06)">
      <a href="/terms.html" style="color:#8fa4b0;font-size:0.75rem;margin:0 8px;text-decoration:none">Terms</a> · <a href="/privacy.html" style="color:#8fa4b0;font-size:0.75rem;margin:0 8px;text-decoration:none">Privacy</a>
      <p style="margin-top:6px;font-size:0.7rem;color:rgba(255,255,255,0.2)">BLEU v1.0 · Patent Pending · © 2026</p>
    </div>
  </div>
</div>
PASSPORT_EOF

# Now replace the existing passport panel
# We need to find the exact block and replace it
python3 << 'PYEOF'
import re

with open('index.html', 'r') as f:
    html = f.read()

# Find the passport panel - from <div class="panel" id="p-passport"> to the next panel or the matching close
# Looking for the pattern that starts with the passport panel div
start_marker = '<div class="panel" id="p-passport">'
start_idx = html.find(start_marker)

if start_idx == -1:
    print("ERROR: Could not find passport panel!")
    exit(1)

# Find the end - look for the chat-box closing pattern for passport
# The passport panel ends with: </div></div>  before the next section
# Based on the structure, find the closing </div> for the panel
# The panel contains: panel-header, content div, chat-box div, then closes
# Let's find the next panel start or </div>\n pattern after the chat input

end_marker = '</div>\n'
search_from = start_idx

# Count nested divs to find the matching close
depth = 0
i = start_idx
found_end = -1
while i < len(html):
    if html[i:i+4] == '<div':
        depth += 1
    elif html[i:i+6] == '</div>':
        depth -= 1
        if depth == 0:
            found_end = i + 6
            break
    i += 1

if found_end == -1:
    print("ERROR: Could not find end of passport panel!")
    exit(1)

# Read the new passport content
with open('/tmp/passport-panel.html', 'r') as f:
    new_passport = f.read()

# Replace
html = html[:start_idx] + new_passport + html[found_end:]

# Add goal-chip CSS if not present
if '.goal-chip' not in html:
    goal_css = '''
.goal-chip{display:inline-block;background:rgba(78,205,196,0.1);color:#4ecdc4;padding:5px 12px;border-radius:16px;font-size:0.8rem;cursor:pointer;border:1px solid transparent;transition:all 0.2s}
.goal-chip.active{background:#4ecdc4;color:#0a1628}
.goal-chip:hover{border-color:#4ecdc4}
'''
    html = html.replace('</style>', goal_css + '</style>', 1)

with open('index.html', 'w') as f:
    f.write(html)

print(f"    ✅ Passport panel replaced (was {found_end - start_idx} chars)")
PYEOF

# ═══ STEP 4: Add Auth + History JavaScript ═══
echo "  → Adding Auth + History JavaScript..."

# Check if auth code already exists
if ! grep -q "doSignUp" index.html; then

# Add the auth JS right after the existing SB constant line
python3 << 'PYEOF2'
with open('index.html', 'r') as f:
    html = f.read()

# Find the SB constant
sb_line = "const SB='https://sqyzboesdpdussiwqpzk.supabase.co'"
sb_idx = html.find(sb_line)

if sb_idx == -1:
    print("ERROR: Could not find SB constant!")
    exit(1)

# Find the end of this line
eol = html.find('\n', sb_idx)

auth_js = '''

// ═══ SUPABASE AUTH + HISTORY ═══
const SB_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeXpib2VzZHBkdXNzaXdxcHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MjMzMzUsImV4cCI6MjA1Mjk5OTMzNX0.eMHhdjJKZi0ZH0hgdGfszqJJ8KLbFG6fVPWFSYBfwDg'
let sbClient=null,currentUser=null,currentConvoId=null
try{sbClient=window.supabase?window.supabase.createClient(SB,SB_ANON):null}catch(e){console.log('Supabase SDK not loaded yet')}

// Initialize auth after page load
window.addEventListener('DOMContentLoaded',()=>{
  if(!sbClient&&window.supabase){sbClient=window.supabase.createClient(SB,SB_ANON)}
  if(sbClient){
    sbClient.auth.getSession().then(({data})=>{
      if(data.session){currentUser=data.session.user;showProfile()}
    })
    sbClient.auth.onAuthStateChange((ev,session)=>{
      if(session){currentUser=session.user;showProfile()}
      else{currentUser=null;showAuth()}
    })
  }
})

let authIsSignUp=true
function toggleAuth(){
  authIsSignUp=!authIsSignUp
  document.getElementById('auth-signup').style.display=authIsSignUp?'block':'none'
  document.getElementById('auth-signin').style.display=authIsSignUp?'none':'block'
  document.getElementById('toggle-to-signin').style.display=authIsSignUp?'block':'none'
  document.getElementById('toggle-to-signup').style.display=authIsSignUp?'none':'block'
}

async function doSignUp(){
  if(!sbClient)return showAuthErr('System loading, try again in a moment')
  const name=document.getElementById('auth-name').value.trim()
  const email=document.getElementById('auth-email').value.trim()
  const pass=document.getElementById('auth-pass').value
  if(!name||!email||!pass)return showAuthErr('Please fill in all fields')
  if(pass.length<6)return showAuthErr('Password must be at least 6 characters')
  hideAuthErr()
  const{data,error}=await sbClient.auth.signUp({email,password:pass,options:{data:{full_name:name}}})
  if(error)return showAuthErr(error.message)
  if(data.user&&!data.session){showAuthMsg('Check your email to confirm your account!')}
  else if(data.session){currentUser=data.user;showProfile()}
}

async function doSignIn(){
  if(!sbClient)return showAuthErr('System loading, try again')
  const email=document.getElementById('si-email').value.trim()
  const pass=document.getElementById('si-pass').value
  if(!email||!pass)return showSiErr('Please enter email and password')
  hideSiErr()
  const{data,error}=await sbClient.auth.signInWithPassword({email,password:pass})
  if(error)return showSiErr(error.message)
  currentUser=data.user;showProfile()
}

async function doGoogleAuth(){
  if(!sbClient)return
  await sbClient.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin}})
}

async function doSignOut(){
  if(!sbClient)return
  await sbClient.auth.signOut()
  currentUser=null;currentConvoId=null;showAuth()
}

function showAuthErr(m){const e=document.getElementById('auth-error');e.textContent=m;e.style.display='block'}
function hideAuthErr(){document.getElementById('auth-error').style.display='none'}
function showSiErr(m){const e=document.getElementById('si-error');e.textContent=m;e.style.display='block'}
function hideSiErr(){document.getElementById('si-error').style.display='none'}
function showAuthMsg(m){const e=document.getElementById('auth-msg');e.textContent=m;e.style.display='block';setTimeout(()=>e.style.display='none',5000)}

function showAuth(){
  document.getElementById('auth-screen').style.display='block'
  document.getElementById('profile-screen').style.display='none'
}

async function showProfile(){
  document.getElementById('auth-screen').style.display='none'
  document.getElementById('profile-screen').style.display='block'
  if(!currentUser)return
  const name=currentUser.user_metadata?.full_name||currentUser.email?.split('@')[0]||'Friend'
  document.getElementById('prof-name').textContent=name
  document.getElementById('set-email').textContent=currentUser.email||'—'
  // Load profile data
  if(sbClient){
    const{data:prof}=await sbClient.from('profiles').select('*').eq('id',currentUser.id).single()
    if(prof){
      document.getElementById('stat-convos').textContent=prof.conversations_count||0
      document.getElementById('stat-streak').textContent=prof.streak_days||0
      document.getElementById('stat-score').textContent=prof.bleu_score||0
      document.getElementById('prof-tier').textContent=(prof.tier||'community').replace(/_/g,' ').replace(/\\b\\w/g,c=>c.toUpperCase())
      if(prof.wellness_goals){prof.wellness_goals.forEach(g=>{const c=document.querySelector('.goal-chip[data-g="'+g+'"]');if(c)c.classList.add('active')})}
    }
    loadSessions()
  }
}

async function loadSessions(){
  if(!sbClient||!currentUser)return
  const{data}=await sbClient.from('conversations').select('id,title,mode,created_at').eq('user_id',currentUser.id).order('updated_at',{ascending:false}).limit(10)
  const el=document.getElementById('session-list')
  if(!data||data.length===0){el.innerHTML='<div style="text-align:center;color:#8fa4b0;padding:20px;font-size:0.85rem">Start a conversation with Alvai to see your history here.</div>';return}
  el.innerHTML=data.map(c=>{
    const icon=c.mode==='recovery'?'🌱':c.mode==='therapy'?'🧠':'💚'
    const d=new Date(c.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})
    return '<div onclick="loadConvo(\\''+c.id+'\\')" style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;cursor:pointer;transition:background 0.2s" onmouseover="this.style.background=\\'rgba(78,205,196,0.05)\\'" onmouseout="this.style.background=\\'transparent\\'"><div style="width:32px;height:32px;border-radius:8px;background:rgba(78,205,196,0.1);display:flex;align-items:center;justify-content:center;font-size:1rem">'+icon+'</div><div><div style="color:#e8d5b0;font-size:0.85rem">'+(c.title||'Session')+'</div><div style="color:#8fa4b0;font-size:0.7rem">'+d+' · '+(c.mode||'general')+'</div></div></div>'
  }).join('')
}

async function loadConvo(id){
  if(!sbClient)return
  const{data}=await sbClient.from('conversations').select('messages,mode').eq('id',id).single()
  if(!data)return
  currentConvoId=id
  const tab=data.mode||'alvai'
  go(tab==='general'?'alvai':tab)
  // Load messages into the chat
  const msgs=data.messages||[]
  const chatEl=document.getElementById('chat-'+(tab==='general'?'alvai':tab))
  if(chatEl){
    chatEl.innerHTML=''
    msgs.forEach(m=>{
      const div=document.createElement('div')
      div.className=m.role==='user'?'msg-user':'msg-ai'
      div.innerHTML=m.content
      chatEl.appendChild(div)
    })
    chatEl.scrollTop=chatEl.scrollHeight
  }
}

async function saveConvo(tab,msgs){
  if(!sbClient||!currentUser)return
  const mode=tab==='home'?'alvai':tab
  const title=msgs.find(m=>m.role==='user')?.content?.slice(0,60)||'Session'
  if(currentConvoId){
    await sbClient.from('conversations').update({messages:msgs,updated_at:new Date().toISOString()}).eq('id',currentConvoId)
  }else{
    const{data}=await sbClient.from('conversations').insert({user_id:currentUser.id,mode,title,messages:msgs}).select('id').single()
    if(data)currentConvoId=data.id
  }
  // Update conversation count
  await sbClient.rpc('increment_convos',{user_id_input:currentUser.id}).catch(()=>{})
}

async function togGoal(el){
  el.classList.toggle('active')
  if(!sbClient||!currentUser)return
  const goals=[...document.querySelectorAll('.goal-chip.active')].map(c=>c.dataset.g)
  await sbClient.from('profiles').update({wellness_goals:goals,updated_at:new Date().toISOString()}).eq('id',currentUser.id)
}

async function exportData(){
  if(!sbClient||!currentUser)return
  const{data}=await sbClient.from('conversations').select('*').eq('user_id',currentUser.id)
  const blob=new Blob([JSON.stringify(data||[],null,2)],{type:'application/json'})
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='bleu-data.json';a.click()
}

async function clearHistory(){
  if(!confirm('Delete all your conversation history? This cannot be undone.'))return
  if(!sbClient||!currentUser)return
  await sbClient.from('conversations').delete().eq('user_id',currentUser.id)
  document.getElementById('session-list').innerHTML='<div style="text-align:center;color:#8fa4b0;padding:20px;font-size:0.85rem">History cleared.</div>'
}
'''

html = html[:eol] + auth_js + html[eol:]

with open('index.html', 'w') as f:
    f.write(html)

print("    ✅ Auth + History JavaScript added")
PYEOF2

else
  echo "    ⏭ Auth code already present"
fi

# ═══ STEP 5: Hook saveConvo into the existing send() function ═══
echo "  → Hooking conversation saving into send()..."
if ! grep -q "saveConvo" index.html; then
  # Find the response handler and add save call
  # The existing code appends AI response - we add saveConvo after
  python3 << 'PYEOF3'
with open('index.html', 'r') as f:
    html = f.read()

# Find where chatHistories gets pushed to (the AI response completion)
# Look for the pattern where stream ends and add saveConvo
# The existing code likely has something like chatHistories[tab].push
# Let's find the streaming completion and add our hook

# Add saveConvo call after each AI response completes
# Look for the [DONE] handler or similar stream end
if 'el.scrollTop=el.scrollHeight' in html and 'saveConvo' not in html:
    # Find the last occurrence of scrollTop in the streaming handler
    # and add saveConvo after it
    idx = html.rfind('el.scrollTop=el.scrollHeight')
    if idx > -1:
        eol = html.find('\n', idx)
        if eol > -1:
            html = html[:eol] + '\n    if(currentUser)saveConvo(tab,chatHistories[tab])' + html[eol:]

with open('index.html', 'w') as f:
    f.write(html)

print("    ✅ saveConvo hooked into chat flow")
PYEOF3
else
  echo "    ⏭ saveConvo already hooked"
fi

# ═══ STEP 6: Create Terms of Service ═══
echo "  → Creating terms.html..."
cat > terms.html << 'TERMS_EOF'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Terms of Service — BLEU</title>
<style>
body{margin:0;padding:0;background:#0a1628;color:#c8d6e0;font-family:Arial,sans-serif;line-height:1.7}
.container{max-width:720px;margin:0 auto;padding:40px 20px}
h1{font-family:Georgia;color:#4ecdc4;font-size:2rem;margin-bottom:4px}
h2{font-family:Georgia;color:#d4af37;font-size:1.2rem;margin-top:32px}
p,li{font-size:0.9rem;color:#a0b4c0}
a{color:#4ecdc4}
.back{display:inline-block;margin-bottom:24px;color:#4ecdc4;text-decoration:none;font-size:0.85rem}
.date{color:#8fa4b0;font-size:0.8rem;margin-bottom:24px}
</style>
</head>
<body>
<div class="container">
<a href="/" class="back">← Back to BLEU</a>
<h1>Terms of Service</h1>
<p class="date">Effective: February 25, 2026</p>

<h2>1. Acceptance of Terms</h2>
<p>By accessing BLEU (bleu.live), you agree to these terms. If you do not agree, please do not use the platform.</p>

<h2>2. What BLEU Is — And What It Is Not</h2>
<p>BLEU provides AI-powered wellness conversations, practitioner directory access, and health information. BLEU is NOT a medical provider, licensed therapist, or substitute for professional healthcare. Alvai is an AI wellness intelligence, not a clinician.</p>

<h2>3. Mental Health Disclaimer</h2>
<p>If you are experiencing a mental health crisis, please contact: <strong>988 Suicide & Crisis Lifeline</strong> (call or text 988), <strong>Crisis Text Line</strong> (text HOME to 741741), or call <strong>911</strong> for emergencies. BLEU is not a crisis service.</p>

<h2>4. Cannabis Disclaimer</h2>
<p>Cannabis information provided through CannaIQ is for educational purposes only. Cannabis legality varies by state and jurisdiction. BLEU does not sell, distribute, or facilitate the purchase of cannabis. Users are responsible for compliance with local laws.</p>

<h2>5. Practitioner Directory</h2>
<p>Our directory contains NPI-verified practitioners sourced from federal databases. BLEU does not employ, endorse, or guarantee any listed practitioner. Verify credentials independently before receiving care.</p>

<h2>6. Product Information</h2>
<p>Supplement and product information is sourced from FDA databases and published research. Trust scores are algorithmically generated. Always consult a healthcare provider before starting any supplement regimen.</p>

<h2>7. User Accounts</h2>
<p>You are responsible for maintaining the security of your account. You must be 18 or older to create an account (or 13+ with parental consent).</p>

<h2>8. Subscriptions and Billing</h2>
<p>Paid tiers are billed monthly through Stripe. You may cancel at any time. Refunds are handled on a case-by-case basis within 30 days of charge.</p>

<h2>9. User Content</h2>
<p>Conversations with Alvai are stored to provide continuity. You can export or delete your data at any time from the Passport tab. We do not share your conversations with third parties.</p>

<h2>10. Intellectual Property</h2>
<p>BLEU, Alvai, The Longevity Operating System, CannaIQ, and the OCEAN architecture are proprietary. Patent Pending. © 2026 bleu.live. All rights reserved.</p>

<h2>11. Limitation of Liability</h2>
<p>BLEU is provided "as is" without warranty. We are not liable for decisions made based on information from Alvai or the platform. Maximum liability is limited to the amount you paid in the 12 months prior to any claim.</p>

<h2>12. Governing Law</h2>
<p>These terms are governed by the laws of the State of Louisiana, United States.</p>

<h2>13. Changes to Terms</h2>
<p>We may update these terms. Continued use after changes constitutes acceptance.</p>

<h2>14. Contact</h2>
<p>Questions? Email <a href="mailto:hello@bleu.live">hello@bleu.live</a></p>

<p style="margin-top:40px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);font-size:0.75rem;color:#8fa4b0;text-align:center">BLEU · The Longevity Operating System · Patent Pending · © 2026</p>
</div>
</body>
</html>
TERMS_EOF
echo "    ✅ terms.html created"

# ═══ STEP 7: Create Privacy Policy ═══
echo "  → Creating privacy.html..."
cat > privacy.html << 'PRIVACY_EOF'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Privacy Policy — BLEU</title>
<style>
body{margin:0;padding:0;background:#0a1628;color:#c8d6e0;font-family:Arial,sans-serif;line-height:1.7}
.container{max-width:720px;margin:0 auto;padding:40px 20px}
h1{font-family:Georgia;color:#4ecdc4;font-size:2rem;margin-bottom:4px}
h2{font-family:Georgia;color:#d4af37;font-size:1.2rem;margin-top:32px}
p,li{font-size:0.9rem;color:#a0b4c0}
a{color:#4ecdc4}
.back{display:inline-block;margin-bottom:24px;color:#4ecdc4;text-decoration:none;font-size:0.85rem}
.date{color:#8fa4b0;font-size:0.8rem;margin-bottom:24px}
table{width:100%;border-collapse:collapse;margin:12px 0}
th{text-align:left;padding:8px;background:rgba(78,205,196,0.1);color:#4ecdc4;font-size:0.8rem;border:1px solid rgba(255,255,255,0.06)}
td{padding:8px;font-size:0.8rem;border:1px solid rgba(255,255,255,0.06);color:#a0b4c0}
</style>
</head>
<body>
<div class="container">
<a href="/" class="back">← Back to BLEU</a>
<h1>Privacy Policy</h1>
<p class="date">Effective: February 25, 2026</p>

<h2>1. What We Collect</h2>
<table>
<tr><th>Data</th><th>When</th><th>Why</th></tr>
<tr><td>Email + Name</td><td>Signup</td><td>Account identification</td></tr>
<tr><td>Conversations</td><td>During use</td><td>Session continuity + history</td></tr>
<tr><td>Wellness Goals</td><td>Profile setup</td><td>Personalized recommendations</td></tr>
<tr><td>Usage Analytics</td><td>Passively</td><td>Improve the platform (cookieless)</td></tr>
</table>

<h2>2. What We Do NOT Collect</h2>
<p>We do not collect: Social Security numbers, insurance information, precise geolocation, cannabis purchase history tied to identity, or any data sold to advertisers.</p>

<h2>3. How We Use Your Data</h2>
<p>Your data is used to: provide AI wellness conversations, save your session history, personalize your experience, improve Alvai's responses (anonymized), and measure platform health.</p>

<h2>4. Data Security</h2>
<p>Data is stored in Supabase with encryption at rest and in transit. Row-Level Security ensures you can only access your own data. Payment processing uses Stripe (PCI-DSS compliant). We never store credit card numbers.</p>

<h2>5. Data Sharing</h2>
<p>We share data ONLY with infrastructure partners necessary to operate BLEU: Supabase (database), OpenAI (AI processing — conversations are sent without user identity), Stripe (payments). We do not sell data. We do not share data with advertisers.</p>

<h2>6. Your Rights</h2>
<p>You can: view all your data in the Passport tab, export your data as JSON at any time, delete your conversation history, request full account deletion by emailing hello@bleu.live (processed within 30 days).</p>

<h2>7. Data Retention</h2>
<p>Active accounts: data retained while account exists. Deleted accounts: data purged within 30 days. Anonymized analytics: retained indefinitely for platform improvement.</p>

<h2>8. Analytics</h2>
<p>We use cookieless, privacy-friendly analytics. No tracking cookies. No cross-site tracking. No consent banner needed.</p>

<h2>9. Children's Privacy</h2>
<p>BLEU is designed for users 18 and older. Users 13-17 may use BLEU with parental consent. We do not knowingly collect data from children under 13.</p>

<h2>10. California Privacy Rights (CCPA)</h2>
<p>California residents may request disclosure or deletion of personal information. Contact hello@bleu.live.</p>

<h2>11. Changes</h2>
<p>We may update this policy. Significant changes will be communicated via the platform.</p>

<h2>12. Contact</h2>
<p>Privacy questions: <a href="mailto:hello@bleu.live">hello@bleu.live</a></p>

<h2>A Note From Our Founder</h2>
<p style="font-style:italic;color:#d4af37">"I built BLEU because I needed it and it didn't exist. Your trust is sacred to me. Your data exists to serve you, not to be sold. That's not a policy — it's a promise." — Bleu Michael Garner</p>

<p style="margin-top:40px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);font-size:0.75rem;color:#8fa4b0;text-align:center">BLEU · The Longevity Operating System · Patent Pending · © 2026</p>
</div>
</body>
</html>
PRIVACY_EOF
echo "    ✅ privacy.html created"

# ═══ STEP 8: Create sitemap.xml ═══
echo "  → Creating sitemap.xml..."
cat > sitemap.xml << 'SITEMAP_EOF'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://bleu.live</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://bleu.live/terms.html</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>
  <url><loc>https://bleu.live/privacy.html</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>
</urlset>
SITEMAP_EOF
echo "    ✅ sitemap.xml created"

# ═══ STEP 9: Create robots.txt ═══
echo "  → Creating robots.txt..."
cat > robots.txt << 'ROBOTS_EOF'
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://bleu.live/sitemap.xml
ROBOTS_EOF
echo "    ✅ robots.txt created"

# ═══ STEP 10: Add alvai mode to practitioner lookup (if not already done) ═══
echo "  → Checking alvai mode in server.js..."
if grep -q "'directory','general','therapy','recovery'" server.js 2>/dev/null && ! grep -q "'directory','general','therapy','recovery','alvai'" server.js 2>/dev/null; then
  sed -i "s/\['directory','general','therapy','recovery'\].includes(mode)/['directory','general','therapy','recovery','alvai'].includes(mode)/" server.js
  echo "    ✅ alvai mode added to practitioner lookup"
else
  echo "    ⏭ Already updated"
fi

# ═══ STEP 11: Git add, commit, push ═══
echo ""
echo "  → Committing and pushing..."
git add index.html terms.html privacy.html sitemap.xml robots.txt
git add server.js 2>/dev/null || true
git commit -m "Deploy: Auth + History + Passport + Legal + SEO — full infrastructure"
git push

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🔵 BLEU DEPLOY COMPLETE"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "NEXT STEPS:"
echo "  1. Run SQL in Supabase Dashboard → SQL Editor"
echo "     (copy from 01-supabase-tables.sql)"
echo ""
echo "  2. Enable Auth providers in Supabase Dashboard:"
echo "     Authentication → Providers → Enable Email"
echo "     Authentication → Providers → Enable Google"
echo ""
echo "  3. Wait ~2 min for Railway + GitHub Pages deploy"
echo ""
echo "  4. Test: Go to bleu.live → Passport tab → Create account"
echo ""
echo "  5. Test: Talk to Alvai → Check Passport → See history"
echo ""
echo "System Health: 62 → ~75/100"
echo "═══════════════════════════════════════════════════════════"
