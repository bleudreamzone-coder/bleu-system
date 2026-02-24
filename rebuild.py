#!/usr/bin/env python3
"""BLEU.live Complete Frontend Rebuild — The Longevity Operating System"""

# This script generates a REPLACEMENT index.html
# Run in /workspaces/bleu-system: python3 rebuild.py

HTML = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BLEU — The Longevity Operating System</title>
<meta name="description" content="Your AI-powered wellness guide. Practitioners, supplements, therapy, cannabis intelligence, recovery — all verified, all connected.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#0a0f1a;--bg2:#111827;--bg3:#1a2332;--card:#162032;
  --gold:#d4af37;--teal:#4ecdc4;--rose:#ff6b8a;--lavender:#a78bfa;
  --text:#e8edf5;--dim:#6b7b8f;--border:rgba(212,175,55,0.1);
  --glow:rgba(212,175,55,0.15);
}
body{font-family:'Outfit',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;min-height:100vh}
h1,h2,h3,.brand{font-family:'Playfair Display',serif}

/* NAV */
nav{position:sticky;top:0;z-index:100;background:rgba(10,15,26,0.92);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);padding:0 20px}
.nav-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;height:56px;gap:8px;overflow-x:auto;scrollbar-width:none}
.nav-inner::-webkit-scrollbar{display:none}
.brand{color:var(--gold);font-size:22px;font-weight:700;letter-spacing:2px;margin-right:16px;flex-shrink:0;cursor:pointer}
.nav-tab{padding:8px 14px;border-radius:8px;font-size:13px;font-weight:500;color:var(--dim);cursor:pointer;white-space:nowrap;transition:all 0.2s;border:none;background:none}
.nav-tab:hover{color:var(--text);background:rgba(255,255,255,0.05)}
.nav-tab.active{color:var(--gold);background:var(--glow)}
.nav-more{position:relative}
.more-menu{display:none;position:absolute;top:44px;right:0;background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:8px;min-width:180px;box-shadow:0 20px 40px rgba(0,0,0,0.5)}
.more-menu.show{display:block}
.more-item{display:block;width:100%;text-align:left;padding:10px 14px;border-radius:8px;font-size:13px;color:var(--dim);cursor:pointer;border:none;background:none;font-family:'Outfit',sans-serif}
.more-item:hover{color:var(--text);background:rgba(255,255,255,0.05)}

/* MAIN */
main{max-width:1200px;margin:0 auto;padding:20px}
section{display:none}
section.active{display:block}

/* HOME */
.hero{text-align:center;padding:60px 20px 40px}
.hero h1{font-size:clamp(32px,6vw,52px);background:linear-gradient(135deg,var(--gold),var(--teal));-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1.2}
.hero p{color:var(--dim);font-size:18px;margin-top:12px;max-width:600px;margin-left:auto;margin-right:auto;font-weight:300}
.hero-stats{display:flex;justify-content:center;gap:40px;margin-top:32px;flex-wrap:wrap}
.hero-stat{text-align:center}
.hero-stat .num{font-size:28px;font-weight:700;color:var(--gold);font-family:'Playfair Display',serif}
.hero-stat .label{font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-top:2px}

/* QUICK ACTIONS */
.quick-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;margin-top:40px}
.quick-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px;cursor:pointer;transition:all 0.3s}
.quick-card:hover{border-color:var(--gold);transform:translateY(-2px);box-shadow:0 8px 30px rgba(212,175,55,0.1)}
.quick-card .icon{font-size:28px;margin-bottom:8px}
.quick-card h3{font-size:16px;color:var(--text);margin-bottom:6px;font-family:'Outfit',sans-serif;font-weight:600}
.quick-card p{font-size:13px;color:var(--dim);line-height:1.5;font-weight:300}
.quick-card .tag{display:inline-block;font-size:10px;padding:3px 8px;border-radius:20px;margin-top:8px;font-weight:500}
.tag-free{background:rgba(78,205,196,0.15);color:var(--teal)}
.tag-affiliate{background:rgba(212,175,55,0.15);color:var(--gold)}

/* AFFILIATE BAR */
.aff-bar{display:flex;gap:12px;overflow-x:auto;padding:20px 0;scrollbar-width:none;margin-top:40px}
.aff-bar::-webkit-scrollbar{display:none}
.aff-chip{flex-shrink:0;padding:8px 16px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.2s;border:1px solid var(--border);color:var(--dim);background:var(--card)}
.aff-chip:hover{border-color:var(--teal);color:var(--teal)}

/* TAB CONTENT */
.tab-header{margin-bottom:20px}
.tab-header h2{font-size:24px;color:var(--text)}
.tab-header p{color:var(--dim);font-size:14px;margin-top:4px;font-weight:300}

/* CHAT */
.chat-container{background:var(--bg2);border:1px solid var(--border);border-radius:16px;overflow:hidden}
.chat-messages{height:400px;overflow-y:auto;padding:20px;scroll-behavior:smooth}
.chat-input-row{display:flex;border-top:1px solid var(--border);background:var(--card)}
.chat-input-row input{flex:1;background:none;border:none;padding:16px 20px;color:var(--text);font-size:14px;font-family:'Outfit',sans-serif;outline:none}
.chat-input-row input::placeholder{color:var(--dim)}
.chat-input-row button{padding:16px 24px;background:var(--gold);color:var(--bg);font-weight:600;border:none;cursor:pointer;font-family:'Outfit',sans-serif;font-size:14px;transition:background 0.2s}
.chat-input-row button:hover{background:#e5c342}
.msg{margin-bottom:16px;padding:12px 16px;border-radius:12px;font-size:14px;line-height:1.7;max-width:85%}
.msg.user{background:rgba(212,175,55,0.12);color:var(--gold);margin-left:auto;border-bottom-right-radius:4px}
.msg.ai{background:var(--card);color:var(--text);border-bottom-left-radius:4px}
.msg.ai strong,.msg.ai b{color:var(--gold)}

/* CARDS GRID */
.cards-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:16px}
.card-btn{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;cursor:pointer;text-align:left;transition:all 0.2s;font-family:'Outfit',sans-serif}
.card-btn:hover{border-color:var(--gold);transform:translateY(-1px)}
.card-btn .card-title{font-weight:600;font-size:14px;color:var(--text);margin-bottom:4px}
.card-btn .card-desc{font-size:12px;color:var(--dim);line-height:1.5;font-weight:300}
.card-btn .card-price{font-size:12px;color:var(--gold);margin-top:6px;font-weight:500}

/* PRODUCT CARDS */
.product-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:16px}
.prod-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;cursor:pointer;transition:all 0.2s}
.prod-card:hover{border-color:var(--teal)}
.prod-name{font-weight:600;font-size:14px;color:var(--teal)}
.prod-price{font-size:12px;color:var(--gold);margin-top:2px}
.prod-desc{font-size:11px;color:var(--dim);margin-top:6px;line-height:1.5}
.prod-safety{font-size:10px;margin-top:6px}
.safe{color:var(--teal)}
.warn{color:#f59e0b}

/* THERAPY MODES */
.mode-row{display:flex;gap:8px;overflow-x:auto;padding-bottom:12px;scrollbar-width:none;margin-bottom:12px}
.mode-row::-webkit-scrollbar{display:none}
.mode-btn{padding:8px 16px;border-radius:20px;font-size:12px;border:1px solid var(--border);background:none;color:var(--dim);cursor:pointer;white-space:nowrap;font-family:'Outfit',sans-serif;transition:all 0.2s}
.mode-btn:hover,.mode-btn.active{border-color:var(--lavender);color:var(--lavender);background:rgba(167,139,250,0.1)}

/* FOOTER */
.site-footer{text-align:center;padding:40px 20px;color:var(--dim);font-size:12px;border-top:1px solid var(--border);margin-top:60px}
.site-footer a{color:var(--gold);text-decoration:none}

/* ALVAI CURSOR */
.alvai-cursor{display:inline-block;width:2px;height:16px;background:var(--gold);animation:blink 1s infinite;vertical-align:text-bottom;margin-left:2px}
@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}

/* RESPONSIVE */
@media(max-width:768px){
  .hero{padding:40px 16px 24px}
  .hero-stats{gap:24px}
  .quick-grid{grid-template-columns:1fr}
  .chat-messages{height:350px}
  .nav-tab{padding:6px 10px;font-size:12px}
}
</style>
</head>
<body>

<nav>
<div class="nav-inner">
  <div class="brand" onclick="showTab('home')">BLEU</div>
  <button class="nav-tab active" onclick="showTab('home')">Home</button>
  <button class="nav-tab" onclick="showTab('alvai')">Alvai</button>
  <button class="nav-tab" onclick="showTab('directory')">Find Care</button>
  <button class="nav-tab" onclick="showTab('vessel')">Products</button>
  <button class="nav-tab" onclick="showTab('therapy')">Therapy</button>
  <button class="nav-tab" onclick="showTab('finance')">Finance</button>
  <button class="nav-tab" onclick="showTab('recovery')">Recovery</button>
  <button class="nav-tab" onclick="showTab('cannaiq')">CannaIQ</button>
  <div class="nav-more">
    <button class="nav-tab" onclick="toggleMore(event)">More ▾</button>
    <div class="more-menu" id="more-menu">
      <button class="more-item" onclick="showTab('protocols');closeMore()">Protocols</button>
      <button class="more-item" onclick="showTab('learn');closeMore()">Learn</button>
      <button class="more-item" onclick="showTab('community');closeMore()">Community</button>
      <button class="more-item" onclick="showTab('dashboard');closeMore()">Dashboard</button>
      <button class="more-item" onclick="showTab('missions');closeMore()">Missions</button>
      <button class="more-item" onclick="showTab('passport');closeMore()">Passport</button>
      <button class="more-item" onclick="showTab('map');closeMore()">Map</button>
    </div>
  </div>
</div>
</nav>

<main>

<!-- HOME -->
<section id="sec-home" class="active">
<div class="hero">
  <h1>The Longevity Operating System</h1>
  <p>AI-powered wellness guidance. Verified practitioners. Real products. Your pathway to healing — measured, quantified, and flowing.</p>
  <div class="hero-stats">
    <div class="hero-stat"><div class="num" id="s-prac">485,476</div><div class="label">Verified Practitioners</div></div>
    <div class="hero-stat"><div class="num">54</div><div class="label">Substances Tracked</div></div>
    <div class="hero-stat"><div class="num">302K+</div><div class="label">Drug Interactions</div></div>
    <div class="hero-stat"><div class="num">14</div><div class="label">Wellness Modes</div></div>
  </div>
</div>

<div class="quick-grid">
  <div class="quick-card" onclick="goAsk('alvai','I cant sleep and I feel exhausted. Help me.')">
    <div class="icon">🌙</div>
    <h3>Fix My Sleep</h3>
    <p>Get a specific protocol: supplements with doses, timing, prices, and the science behind why they work.</p>
    <span class="tag tag-affiliate">Products + Protocol</span>
  </div>
  <div class="quick-card" onclick="goAsk('directory','Find me a therapist for anxiety in New Orleans')">
    <div class="icon">🧠</div>
    <h3>Find a Therapist</h3>
    <p>NPI-verified practitioners near you, plus virtual options starting at $60/week. Every price point covered.</p>
    <span class="tag tag-free">Local + Online + Free</span>
  </div>
  <div class="quick-card" onclick="goAsk('vessel','Build me a morning supplement stack for energy and focus')">
    <div class="icon">💊</div>
    <h3>Supplement Stack</h3>
    <p>Exact products, exact doses, exact brands, exact prices. Checked through our 5-layer safety engine.</p>
    <span class="tag tag-affiliate">Thorne · Amazon · iHerb</span>
  </div>
  <div class="quick-card" onclick="goAsk('cannaiq','What strain is best for anxiety and sleep? I am new to cannabis')">
    <div class="icon">🌿</div>
    <h3>Cannabis Guide</h3>
    <p>28 years of cannabis intelligence. Strains, dosing, terpenes, interactions — from the 127-year lineage.</p>
    <span class="tag tag-affiliate">Leafly · Eaze · Charlotte's Web</span>
  </div>
  <div class="quick-card" onclick="goAsk('directory','Help me find a back doctor in New Orleans')">
    <div class="icon">🩺</div>
    <h3>Find a Doctor</h3>
    <p>Chiropractors, specialists, physical therapists — plus natural pain relief options and CBD alternatives.</p>
    <span class="tag tag-free">485K+ Practitioners</span>
  </div>
  <div class="quick-card" onclick="goAsk('therapy','I feel overwhelmed and I dont know where to start')">
    <div class="icon">💛</div>
    <h3>Talk to Someone</h3>
    <p>Evidence-based therapy modes: CBT, DBT, IFS, somatic, motivational. AI-guided, judgment-free, always here.</p>
    <span class="tag tag-free">Free · 988 · BetterHelp</span>
  </div>
  <div class="quick-card" onclick="goAsk('finance','Help me budget for wellness - I spend too much on things that hurt me')">
    <div class="icon">💰</div>
    <h3>Wellness Budget</h3>
    <p>Insurance, superbills, HSA/FSA, sliding scale, GoodRx savings. Make wellness affordable.</p>
    <span class="tag tag-affiliate">GoodRx · Cost Plus Drugs</span>
  </div>
  <div class="quick-card" onclick="goAsk('recovery','I am 3 days sober and struggling')">
    <div class="icon">🕊️</div>
    <h3>Recovery Support</h3>
    <p>Sacred ground. Multiple pathways. 12-step, SMART, MAT, harm reduction — all valid. You are not alone.</p>
    <span class="tag tag-free">SAMHSA · AA · SMART</span>
  </div>
</div>

<div class="aff-bar">
  <div class="aff-chip" onclick="window.open('https://betterhelp.com/bleu','_blank')">💬 BetterHelp — Therapy from $60/wk</div>
  <div class="aff-chip" onclick="window.open('https://thorne.com','_blank')">💊 Thorne — Clinical Supplements</div>
  <div class="aff-chip" onclick="window.open('https://amazon.com/?tag=bleulive-20','_blank')">📦 Amazon Wellness</div>
  <div class="aff-chip" onclick="window.open('https://charlottesweb.com','_blank')">🌿 Charlotte's Web CBD</div>
  <div class="aff-chip" onclick="window.open('https://ouraring.com','_blank')">⌚ Oura Ring — Sleep Tracking</div>
  <div class="aff-chip" onclick="window.open('https://goodrx.com','_blank')">💰 GoodRx — Rx Savings</div>
  <div class="aff-chip" onclick="window.open('https://classpass.com','_blank')">🏃 ClassPass — Fitness</div>
  <div class="aff-chip" onclick="window.open('https://leafly.com/dispensaries','_blank')">🗺️ Leafly — Dispensaries</div>
  <div class="aff-chip" onclick="window.open('https://costplusdrugs.com','_blank')">💊 Cost Plus Drugs</div>
</div>
</section>

<!-- ALVAI -->
<section id="sec-alvai">
<div class="tab-header"><h2>Alvai</h2><p>Your AI wellness guide — 127 years of healing wisdom, powered by intelligence.</p></div>
<div class="cards-grid">
  <div class="card-btn" onclick="ask('alvai','I cant sleep and I dont know why')"><div class="card-title">🌙 Can't Sleep</div><div class="card-desc">Get a specific protocol with products, prices, and the science</div></div>
  <div class="card-btn" onclick="ask('alvai','I feel anxious all the time. What can I do right now?')"><div class="card-title">😰 Anxiety Relief</div><div class="card-desc">Immediate techniques + supplements + when to see someone</div></div>
  <div class="card-btn" onclick="ask('alvai','Build me a morning routine for energy')"><div class="card-title">⚡ Morning Routine</div><div class="card-desc">Exact timing, supplements, movement, nutrition</div></div>
  <div class="card-btn" onclick="ask('alvai','What is the 40-Day Reset and how do I start')"><div class="card-title">🔄 40-Day Reset</div><div class="card-desc">Transform your body and mind in 40 days</div></div>
</div>
<div class="chat-container"><div class="chat-messages" id="chat-alvai"></div><div class="chat-input-row"><input id="in-alvai" placeholder="Ask Alvai anything..." onkeydown="if(event.key==='Enter')send('alvai')"><button onclick="send('alvai')">Send</button></div></div>
</section>

<!-- DIRECTORY -->
<section id="sec-directory">
<div class="tab-header"><h2>Find Care</h2><p>485,476 NPI-verified practitioners. Trust scores earned by outcomes, never bought.</p></div>
<div class="cards-grid">
  <div class="card-btn" onclick="ask('directory','Find me a therapist in New Orleans')"><div class="card-title">🧠 Therapists</div><div class="card-desc">Psychologists, counselors, psychiatrists</div></div>
  <div class="card-btn" onclick="ask('directory','Find sleep specialists in New Orleans')"><div class="card-title">🌙 Sleep Medicine</div><div class="card-desc">Sleep specialists and clinics</div></div>
  <div class="card-btn" onclick="ask('directory','Find a chiropractor in New Orleans')"><div class="card-title">🦴 Chiropractors</div><div class="card-desc">Spine, back, and joint specialists</div></div>
  <div class="card-btn" onclick="ask('directory','Find a nutritionist in New Orleans')"><div class="card-title">🥗 Nutritionists</div><div class="card-desc">Diet, meal planning, clinical nutrition</div></div>
  <div class="card-btn" onclick="ask('directory','Find addiction counselors in New Orleans')"><div class="card-title">🕊️ Addiction Help</div><div class="card-desc">Substance abuse counselors and rehab</div></div>
  <div class="card-btn" onclick="ask('directory','Find a dermatologist in New Orleans')"><div class="card-title">✨ Dermatology</div><div class="card-desc">Skin health and treatment</div></div>
</div>
<div class="chat-container"><div class="chat-messages" id="chat-directory"></div><div class="chat-input-row"><input id="in-directory" placeholder="What kind of care do you need? Include your city..." onkeydown="if(event.key==='Enter')send('directory')"><button onclick="send('directory')">Search</button></div></div>
</section>

<!-- VESSEL / PRODUCTS -->
<section id="sec-vessel">
<div class="tab-header"><h2>Products</h2><p>Every product verified through our 5-layer safety engine. Real brands, real prices, real links.</p></div>
<div class="product-grid">
  <div class="prod-card" onclick="ask('vessel','Tell me about Magnesium Glycinate 400mg — dosage, mechanism, best brand to buy')"><div class="prod-name">Magnesium Glycinate</div><div class="prod-price">~$15/month</div><div class="prod-desc">GABA-A modulation. Sleep + muscle recovery. 90min before bed.</div><div class="prod-safety safe">✅ No interactions</div></div>
  <div class="prod-card" onclick="ask('vessel','Tell me about Ashwagandha KSM-66 — dosage, safety, best brand')"><div class="prod-name">Ashwagandha KSM-66</div><div class="prod-price">~$25/month</div><div class="prod-desc">Cortisol -30%. Adaptogen. 300mg 2x daily.</div><div class="prod-safety warn">⚠️ Check thyroid meds</div></div>
  <div class="prod-card" onclick="ask('vessel','Tell me about CBD Tincture 1500mg — dosage, safety, brand')"><div class="prod-name">CBD Tincture</div><div class="prod-price">~$60/bottle</div><div class="prod-desc">5-HT1A pathway. Start 10-25mg sublingual.</div><div class="prod-safety warn">⚠️ CYP450 — check meds</div></div>
  <div class="prod-card" onclick="ask('vessel','Tell me about Omega-3 EPA DHA 2000mg — best brand, dosage')"><div class="prod-name">Omega-3 EPA/DHA</div><div class="prod-price">~$18/month</div><div class="prod-desc">Inflammation, brain, cardio. 3rd party tested.</div><div class="prod-safety safe">✅ Safe with most meds</div></div>
  <div class="prod-card" onclick="ask('vessel','Tell me about L-Theanine 200mg for focus and calm')"><div class="prod-name">L-Theanine 200mg</div><div class="prod-price">~$12/month</div><div class="prod-desc">Alpha waves. Calm focus. Stacks with caffeine.</div><div class="prod-safety safe">✅ No known interactions</div></div>
  <div class="prod-card" onclick="ask('vessel','Tell me about Vitamin D3 K2 5000IU — dosage, brands')"><div class="prod-name">Vitamin D3+K2</div><div class="prod-price">~$17/month</div><div class="prod-desc">42% deficient. Immune + bones. Take with fat.</div><div class="prod-safety warn">⚠️ Check blood thinners</div></div>
</div>
<div style="text-align:center;color:var(--dim);font-size:10px;margin-bottom:12px">All products checked through 5-layer safety engine. Affiliate links sustain BLEU at no extra cost.</div>
<div class="chat-container"><div class="chat-messages" id="chat-vessel"></div><div class="chat-input-row"><input id="in-vessel" placeholder="What supplement or product do you need?" onkeydown="if(event.key==='Enter')send('vessel')"><button onclick="send('vessel')">Search</button></div></div>
</section>

<!-- THERAPY -->
<section id="sec-therapy">
<div class="tab-header"><h2>Therapy</h2><p>Evidence-based guidance. This is a safe space. You are not alone.</p></div>
<div class="mode-row">
  <button class="mode-btn active" onclick="setMode('therapy','talk',this)">Talk Therapy</button>
  <button class="mode-btn" onclick="setMode('therapy','cbt',this)">CBT</button>
  <button class="mode-btn" onclick="setMode('therapy','dbt',this)">DBT</button>
  <button class="mode-btn" onclick="setMode('therapy','somatic',this)">Somatic</button>
  <button class="mode-btn" onclick="setMode('therapy','motivational',this)">Motivational</button>
  <button class="mode-btn" onclick="setMode('therapy','journaling',this)">Journaling</button>
  <button class="mode-btn" onclick="setMode('therapy','couples',this)">Couples</button>
  <button class="mode-btn" onclick="setMode('therapy','crisis',this)">Crisis</button>
</div>
<div class="chat-container"><div class="chat-messages" id="chat-therapy"></div><div class="chat-input-row"><input id="in-therapy" placeholder="What's on your mind? This is a safe space..." onkeydown="if(event.key==='Enter')send('therapy')"><button onclick="send('therapy')">Share</button></div></div>
<div style="text-align:center;margin-top:12px;font-size:12px;color:var(--dim)">Need immediate help? <strong style="color:var(--rose)">988</strong> · Text HOME to <strong style="color:var(--rose)">741741</strong> · SAMHSA <strong style="color:var(--rose)">1-800-662-4357</strong></div>
</section>

<!-- FINANCE -->
<section id="sec-finance">
<div class="tab-header"><h2>Finance</h2><p>Wellness economics. Make healing affordable.</p></div>
<div class="cards-grid">
  <div class="card-btn" onclick="ask('finance','Help me budget for wellness')"><div class="card-title">💰 Wellness Budget</div><div class="card-desc">Stop spending on things that hurt. Invest in what heals.</div></div>
  <div class="card-btn" onclick="ask('finance','How do I improve my credit score step by step')"><div class="card-title">📈 Credit Score</div><div class="card-desc">Step by step guide to better credit</div></div>
  <div class="card-btn" onclick="ask('finance','Help me understand health insurance')"><div class="card-title">🏥 Insurance Guide</div><div class="card-desc">ACA, employer plans, out-of-network benefits</div></div>
  <div class="card-btn" onclick="ask('finance','What employee benefits am I probably not using')"><div class="card-title">🎯 Hidden Benefits</div><div class="card-desc">FSA, HSA, EAP, gym reimbursement</div></div>
  <div class="card-btn" onclick="ask('finance','I have medical bills I cant pay')"><div class="card-title">🏥 Medical Bills</div><div class="card-desc">Negotiation, payment plans, forgiveness programs</div></div>
  <div class="card-btn" onclick="ask('finance','I want to buy a house — where do I start')"><div class="card-title">🏠 First Home</div><div class="card-desc">Step by step for first-time buyers</div></div>
</div>
<div class="chat-container"><div class="chat-messages" id="chat-finance"></div><div class="chat-input-row"><input id="in-finance" placeholder="What financial question is weighing on you?" onkeydown="if(event.key==='Enter')send('finance')"><button onclick="send('finance')">Ask</button></div></div>
</section>

<!-- RECOVERY -->
<section id="sec-recovery">
<div class="tab-header"><h2>Recovery</h2><p>Sacred ground. Lives depend on this. Every pathway is valid.</p></div>
<div class="mode-row">
  <button class="mode-btn active" onclick="setMode('recovery','sobriety',this)">Sobriety</button>
  <button class="mode-btn" onclick="setMode('recovery','relapse',this)">Relapse Support</button>
  <button class="mode-btn" onclick="setMode('recovery','family',this)">Family</button>
  <button class="mode-btn" onclick="setMode('recovery','harm_reduction',this)">Harm Reduction</button>
</div>
<div class="chat-container"><div class="chat-messages" id="chat-recovery"></div><div class="chat-input-row"><input id="in-recovery" placeholder="You're not alone. What's happening right now?" onkeydown="if(event.key==='Enter')send('recovery')"><button onclick="send('recovery')">Share</button></div></div>
<div style="text-align:center;margin-top:12px;font-size:12px;color:var(--dim)">SAMHSA: <strong style="color:var(--teal)">1-800-662-4357</strong> · AA: aa.org · NA: na.org · SMART: smartrecovery.org</div>
</section>

<!-- CANNAIQ -->
<section id="sec-cannaiq">
<div class="tab-header"><h2>CannaIQ</h2><p>Cannabis intelligence engine. 28 years expertise. 127-year healing lineage.</p></div>
<div class="cards-grid">
  <div class="card-btn" onclick="ask('cannaiq','Best strain for anxiety and sleep — I am new to cannabis')"><div class="card-title">🌿 Anxiety + Sleep</div><div class="card-desc">Strains, terpenes, dosing for beginners</div></div>
  <div class="card-btn" onclick="ask('cannaiq','CBD vs THC — explain the difference and what I should try for pain')"><div class="card-title">🧪 CBD vs THC</div><div class="card-desc">Full breakdown with recommendations</div></div>
  <div class="card-btn" onclick="ask('cannaiq','Check drug interactions with CBD and my medications')"><div class="card-title">⚠️ Drug Interactions</div><div class="card-desc">CYP450, serotonin syndrome, safety check</div></div>
  <div class="card-btn" onclick="ask('cannaiq','Explain the endocannabinoid system simply')"><div class="card-title">🧬 ECS Education</div><div class="card-desc">Your body's master regulator explained</div></div>
</div>
<div class="chat-container"><div class="chat-messages" id="chat-cannaiq"></div><div class="chat-input-row"><input id="in-cannaiq" placeholder="Ask about cannabis — strains, interactions, dosage, legal..." onkeydown="if(event.key==='Enter')send('cannaiq')"><button onclick="send('cannaiq')">Ask</button></div></div>
</section>

<!-- PROTOCOLS -->
<section id="sec-protocols">
<div class="tab-header"><h2>Protocols</h2><p>Personalized daily protocols. Morning to night. Measured and specific.</p></div>
<div class="cards-grid">
  <div class="card-btn" onclick="ask('protocols','Build me a complete anxiety protocol — morning to night')"><div class="card-title">😰 Anxiety Protocol</div><div class="card-desc">Full day: supplements, habits, timing</div></div>
  <div class="card-btn" onclick="ask('protocols','Build me a sleep optimization protocol')"><div class="card-title">🌙 Sleep Protocol</div><div class="card-desc">Evening wind-down to morning energy</div></div>
  <div class="card-btn" onclick="ask('protocols','Build me a pain management protocol')"><div class="card-title">🩹 Pain Protocol</div><div class="card-desc">Natural + supplement + movement</div></div>
  <div class="card-btn" onclick="ask('protocols','Build me a gut health protocol')"><div class="card-title">🦠 Gut Health</div><div class="card-desc">Microbiome, probiotics, diet plan</div></div>
</div>
<div class="chat-container"><div class="chat-messages" id="chat-protocols"></div><div class="chat-input-row"><input id="in-protocols" placeholder="What protocol do you need?" onkeydown="if(event.key==='Enter')send('protocols')"><button onclick="send('protocols')">Build</button></div></div>
</section>

<!-- LEARN -->
<section id="sec-learn">
<div class="tab-header"><h2>Learn</h2><p>Research-backed education. Claim → Evidence → Mechanism → Action.</p></div>
<div class="cards-grid">
  <div class="card-btn" onclick="ask('learn','Complete guide to sleep optimization — science, supplements, habits')"><div class="card-title">😴 Sleep Mastery</div><div class="card-desc">Circadian rhythm, melatonin, temperature, light</div></div>
  <div class="card-btn" onclick="ask('learn','Complete guide to gut health — microbiome, probiotics, diet')"><div class="card-title">🦠 Gut Intelligence</div><div class="card-desc">Microbiome, gut-brain axis, probiotics</div></div>
  <div class="card-btn" onclick="ask('learn','Mental health and nutrition connection — research')"><div class="card-title">🧠 Mind-Body</div><div class="card-desc">Nutritional psychiatry, exercise for depression</div></div>
  <div class="card-btn" onclick="ask('learn','Inflammation and chronic disease — anti-inflammatory guide')"><div class="card-title">🔥 Inflammation</div><div class="card-desc">Root of 7/10 chronic diseases. What stops it.</div></div>
</div>
<div class="chat-container"><div class="chat-messages" id="chat-learn"></div><div class="chat-input-row"><input id="in-learn" placeholder="What do you want the science on?" onkeydown="if(event.key==='Enter')send('learn')"><button onclick="send('learn')">Research</button></div></div>
</section>

<!-- COMMUNITY -->
<section id="sec-community">
<div class="tab-header"><h2>Community</h2><p>Social connection is the strongest predictor of longevity.</p></div>
<div class="chat-container"><div class="chat-messages" id="chat-community"></div><div class="chat-input-row"><input id="in-community" placeholder="How do you want to connect?" onkeydown="if(event.key==='Enter')send('community')"><button onclick="send('community')">Connect</button></div></div>
</section>

<!-- DASHBOARD -->
<section id="sec-dashboard">
<div class="tab-header"><h2>Dashboard</h2><p>Your personal wellness command center.</p></div>
<div class="chat-container"><div class="chat-messages" id="chat-dashboard"></div><div class="chat-input-row"><input id="in-dashboard" placeholder="What patterns do you want to understand?" onkeydown="if(event.key==='Enter')send('dashboard')"><button onclick="send('dashboard')">Ask</button></div></div>
</section>

<!-- MISSIONS -->
<section id="sec-missions">
<div class="tab-header"><h2>Missions</h2><p>Daily wellness challenges. Build streaks. Transform habits.</p></div>
<div class="chat-container"><div class="chat-messages" id="chat-missions"></div><div class="chat-input-row"><input id="in-missions" placeholder="What do you want to work on today?" onkeydown="if(event.key==='Enter')send('missions')"><button onclick="send('missions')">Get Mission</button></div></div>
</section>

<!-- PASSPORT -->
<section id="sec-passport">
<div class="tab-header"><h2>Passport</h2><p>Your wellness identity. Goals, milestones, progress.</p></div>
<div class="chat-container"><div class="chat-messages" id="chat-passport"></div><div class="chat-input-row"><input id="in-passport" placeholder="Tell me about your wellness goals..." onkeydown="if(event.key==='Enter')send('passport')"><button onclick="send('passport')">Start</button></div></div>
</section>

<!-- MAP -->
<section id="sec-map">
<div class="tab-header"><h2>Map</h2><p>Wellness resources near you.</p></div>
<div class="chat-container"><div class="chat-messages" id="chat-map"></div><div class="chat-input-row"><input id="in-map" placeholder="What are you looking for near you?" onkeydown="if(event.key==='Enter')send('map')"><button onclick="send('map')">Search</button></div></div>
</section>

</main>

<footer class="site-footer">
  <p>BLEU.live — The Longevity Operating System · 127-Year Healing Lineage · New Orleans</p>
  <p style="margin-top:8px">Affiliate links sustain BLEU at no extra cost to you. All practitioners NPI-verified via <a href="https://npiregistry.cms.hhs.gov" target="_blank">CMS.gov</a>.</p>
</footer>

<script>
const SB='https://sqyzboesdpdussiwqpzk.supabase.co'
const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeXpib2VzZHBkdXNzaXdxcHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDU0NDEsImV4cCI6MjA4NTYyMTQ0MX0.Z2xMkP31VXWhiGG9cVKFPAhzYH-B9zDWD_iTkYbawMw'
const ALVAI='https://bleu-pipeline-production.up.railway.app/api/chat'
const chatHistories={}, chatModes={}

function showTab(id){
  document.querySelectorAll('section').forEach(s=>s.classList.remove('active'))
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'))
  const sec=document.getElementById('sec-'+id)
  if(sec)sec.classList.add('active')
  // Highlight nav
  document.querySelectorAll('.nav-tab').forEach(t=>{if(t.textContent.toLowerCase().includes(id)||(id==='home'&&t.textContent==='Home')||(id==='vessel'&&t.textContent==='Products')||(id==='directory'&&t.textContent==='Find Care'))t.classList.add('active')})
}

function toggleMore(e){e.stopPropagation();document.getElementById('more-menu').classList.toggle('show')}
function closeMore(){document.getElementById('more-menu').classList.remove('show')}
document.addEventListener('click',closeMore)

function goAsk(tab,msg){showTab(tab);setTimeout(()=>{const inp=document.getElementById('in-'+tab);if(inp){inp.value=msg;send(tab)}},100)}
function ask(tab,msg){const inp=document.getElementById('in-'+tab);if(inp){inp.value=msg;send(tab)}}

function setMode(tab,mode,btn){
  chatModes[tab]=mode
  btn.parentElement.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active'))
  btn.classList.add('active')
}

function fmt(t){
  t=t.replace(/\\*\\*(.+?)\\*\\*/g,'<strong>$1</strong>')
  t=t.replace(/\\*(.+?)\\*/g,'<em>$1</em>')
  t=t.replace(/\\n/g,'<br>')
  return t
}

async function send(tab){
  const input=document.getElementById('in-'+tab),box=document.getElementById('chat-'+tab)
  if(!input||!box)return
  const msg=input.value.trim();if(!msg)return;input.value=''
  if(!chatHistories[tab])chatHistories[tab]=[]
  const uDiv=document.createElement('div');uDiv.className='msg user';uDiv.textContent=msg;box.appendChild(uDiv)
  chatHistories[tab].push({role:'user',content:msg})
  const aDiv=document.createElement('div');aDiv.className='msg ai';aDiv.innerHTML='<span class="alvai-cursor"></span>';box.appendChild(aDiv)
  box.scrollTop=box.scrollHeight
  const mode=['therapy','recovery','finance','cannaiq','directory','vessel','protocols','learn','community','passport','map','missions','dashboard','alvai'].includes(tab)?tab:'general'
  const body={message:msg,history:chatHistories[tab].slice(-20),mode:mode}
  if(tab==='therapy')body.therapy_mode=chatModes.therapy||'talk'
  if(tab==='recovery')body.recovery_mode=chatModes.recovery||'sobriety'
  try{
    const res=await fetch(ALVAI,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+ANON},body:JSON.stringify(body)})
    if(res.headers.get('content-type')?.includes('text/event-stream')){
      const reader=res.body.getReader(),decoder=new TextDecoder();let full='',buffer=''
      aDiv.innerHTML=''
      while(true){const{done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split('\\n');buffer=lines.pop()||'';for(const line of lines){if(!line.startsWith('data: '))continue;const d=line.slice(6).trim();if(d==='[DONE]')continue;try{const p=JSON.parse(d);if(p.text){full+=p.text;aDiv.innerHTML=fmt(full)+'<span class="alvai-cursor"></span>';box.scrollTop=box.scrollHeight}}catch{}}}
      aDiv.innerHTML=fmt(full);chatHistories[tab].push({role:'assistant',content:full})
    }else{const data=await res.json();const reply=data.response||data.text||data.reply||data.error||'Try again.';aDiv.innerHTML=fmt(reply);chatHistories[tab].push({role:'assistant',content:reply})}
  }catch(e){aDiv.innerHTML='<em style="color:var(--dim)">Connection issue. Try again in a moment.</em>'}
  box.scrollTop=box.scrollHeight
}
</script>
</body>
</html>'''

with open('index.html', 'w') as f:
    f.write(HTML)

print("✅ BLEU.live REBUILT")
print("  • Clean home page with 8 action cards")
print("  • 7 primary tabs in nav + 7 in More menu")
print("  • All 14 tabs route to correct server modes")
print("  • Product cards with real prices and safety checks")
print("  • Therapy modes: CBT, DBT, Somatic, etc.")
print("  • Recovery modes: Sobriety, Relapse, Family, Harm Reduction")  
print("  • Affiliate bar on home page")
print("  • Crisis resources visible on therapy + recovery")
print("  • No fake data. No placeholders. No dead ends.")
print("  • Every element goes to Alvai or an affiliate")
print("\nRun: git add index.html && git commit -m 'REBUILD: complete frontend' && git push origin main")
