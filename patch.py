import re

FILE = '/workspaces/bleu-system/index.html'
with open(FILE, 'r') as f:
    code = f.read()

changes = 0

# ═══ FIX 1: Replace dead ALVAI URL ═══
old_url = "const ALVAI='https://bleu-pipeline-production.up.railway.app/api/chat'"
new_url = "const ALVAI='https://bleu-system-production.up.railway.app/api/chat'"
if old_url in code:
    code = code.replace(old_url, new_url)
    changes += 1
    print("✓ Fixed ALVAI URL: pipeline → system")

# ═══ FIX 2: Add greetings to ALL tab chat boxes ═══
old_greeting = """window.addEventListener('DOMContentLoaded',function(){
  var box=document.getElementById('chat-home');
  if(box){
    var g=document.createElement('div');
    g.className='msg ai';
    g.innerHTML="<strong style='color:#d4af37'>Hey, I'm Alvai.</strong> Welcome to BLEU — your longevity operating system.<br><br>I'm here whenever you need me. Whether it's finding a therapist, building a supplement stack, managing pain, navigating cannabis, or just figuring out where to start — <strong style='color:#4ecdc4'>tell me what's going on.</strong><br><br>Type below or tap any card. Let's get you somewhere real.";
    box.appendChild(g);
  }
});"""

new_greeting = """window.addEventListener('DOMContentLoaded',function(){
  var greetings = {
    'home': "<strong style='color:#d4af37'>Hey, I'm Alvai.</strong> Welcome to BLEU \\u2014 your longevity operating system.<br><br>I'm here whenever you need me. Whether it's finding a therapist, building a supplement stack, managing pain, navigating cannabis, or just figuring out where to start \\u2014 <strong style='color:#4ecdc4'>tell me what's going on.</strong><br><br>Type below or tap any card. Let's get you somewhere real.",
    'alvai': "<strong style='color:#C9A84C'>\\u2726 I'm Alvai \\u2014 The Light That Learns.</strong><br><br>I'm connected to <strong style='color:#2D8A9E'>7 federal APIs</strong> right now \\u2014 OpenFDA, RxNorm, DailyMed, PubMed, ClinicalTrials.gov, USDA FoodData, and Open Meteo. Ask me anything about drug interactions, supplements, practitioners, or your wellness journey.<br><br><span style='color:#7B8DA6'>Try: \\"Check interactions between melatonin and sertraline\\" or \\"Find me a nutritionist\\"</span>",
    'dashboard': "<strong style='color:#C9A84C'>Your Wellness Dashboard</strong><br><br>This is your command center. Track protocols, monitor safety alerts, and see your wellness data in one view. <strong style='color:#2D8A9E'>Sign in above to activate your dashboard.</strong>",
    'directory': "<strong style='color:#C9A84C'>485,476 NPI-Verified Practitioners</strong><br><br>Tell me what you need \\u2014 a therapist, nutritionist, chiropractor, acupuncturist, or any specialty. Include your city and I'll find verified providers with real addresses and phone numbers.<br><br><span style='color:#7B8DA6'>Try: \\"Find me a therapist for anxiety in New Orleans\\"</span>",
    'vessel': "<strong style='color:#C9A84C'>Vessel \\u2014 Your Body Intelligence</strong><br><br>Tell me what you're feeling. Pain, fatigue, brain fog, digestive issues, sleep problems \\u2014 I'll help map it to your endocannabinoid system and suggest evidence-based approaches.<br><br><span style='color:#7B8DA6'>Try: \\"I've been exhausted every morning for weeks\\"</span>",
    'protocols': "<strong style='color:#C9A84C'>Evidence-Based Protocols</strong><br><br>Designed by <strong style='color:#2D8A9E'>Dr. Felicia Stoler, DCN, MS, RDN, FACSM</strong>. From the 40-Day Reset to sleep optimization, gut health, and hormone balancing \\u2014 tell me your goal and I'll build a plan.<br><br><span style='color:#7B8DA6'>Try: \\"Build me a sleep optimization protocol\\"</span>",
    'learn': "<strong style='color:#C9A84C'>Research & Science Hub</strong><br><br>I pull from <strong style='color:#2D8A9E'>PubMed, ClinicalTrials.gov, and our curated knowledge base</strong>. Ask me about any supplement, condition, drug interaction, or wellness topic. Real science, not opinions.<br><br><span style='color:#7B8DA6'>Try: \\"What does the research say about ashwagandha for anxiety?\\"</span>",
    'community': "<strong style='color:#C9A84C'>Community Hub</strong><br><br>Connect with fellow wellness seekers, share experiences, and find local events in your area. Community features launching soon.",
    'passport': "<strong style='color:#C9A84C'>Wellness Passport</strong><br><br>Your portable wellness identity. Track achievements, protocols completed, and health milestones. Sign in to activate your Passport.",
    'therapy': "<strong style='color:#C9A84C'>Therapeutic Guide</strong><br><br>CBT, DBT, somatic, motivational, journaling, crisis support \\u2014 <strong style='color:#2D8A9E'>22 therapeutic modes</strong> that meet you where you are. Not a replacement for a therapist. A bridge until you find one \\u2014 or alongside one.<br><br><span style='color:#7B8DA6'>Choose a mode above, or just start talking.</span>",
    'finance': "<strong style='color:#C9A84C'>Wellness Finance</strong><br><br>Insurance navigation, HSA/FSA optimization, GoodRx savings, sliding scale options, medical bill negotiation. Stop spending on what hurts you. <strong style='color:#2D8A9E'>Start investing in what heals you.</strong><br><br><span style='color:#7B8DA6'>Try: \\"Help me budget for therapy and supplements\\"</span>",
    'missions': "<strong style='color:#C9A84C'>Wellness Missions</strong><br><br>Daily and weekly challenges to build healthy habits. Complete missions, earn achievements, and level up your health. Mission system activating soon.",
    'recovery': "<strong style='color:#C9A84C'>Recovery Intelligence</strong><br><br>Whether it's sobriety, post-workout, post-surgery, or chronic fatigue \\u2014 I can help build a recovery protocol specific to you. <strong style='color:#2D8A9E'>No judgment. Just support.</strong><br><br><span style='color:#7B8DA6'>Choose your recovery mode above, or tell me what you're working through.</span>",
    'ecsiq': "<strong style='color:#C9A84C'>ECS Intelligence \\u2014 127 Years of Plant Wisdom</strong><br><br>CB1/CB2 receptors, terpene profiles, strain matching, cannabinoid interactions, microdosing protocols, and the complete <strong style='color:#2D8A9E'>endocannabinoid system</strong> guide. Beginner to expert. Drug interactions checked.<br><br><span style='color:#7B8DA6'>Try: \\"What strain is best for anxiety?\\" or \\"Check cannabis interactions with my medications\\"</span>"
  };
  Object.keys(greetings).forEach(function(tab){
    var box = document.getElementById('chat-' + tab);
    if(box && box.children.length === 0){
      var g = document.createElement('div');
      g.className = 'msg ai greet-fade';
      g.innerHTML = greetings[tab];
      box.appendChild(g);
    }
  });
});"""

if old_greeting in code:
    code = code.replace(old_greeting, new_greeting)
    changes += 1
    print("✓ Added greetings to ALL tab chat boxes")

# ═══ FIX 3: Inject animation CSS ═══
ANIM_CSS = """
/* ═══ BLEU PATCH — ANIMATIONS ═══ */
.greet-fade{animation:greetIn .8s ease .2s both}
@keyframes greetIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.reveal{opacity:0;transform:translateY(20px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
.reveal.visible{opacity:1;transform:translateY(0)}
.card-grid .card:nth-child(1){transition-delay:.05s}.card-grid .card:nth-child(2){transition-delay:.1s}
.card-grid .card:nth-child(3){transition-delay:.15s}.card-grid .card:nth-child(4){transition-delay:.2s}
.card-grid .card:nth-child(5){transition-delay:.25s}.card-grid .card:nth-child(6){transition-delay:.3s}
.card-grid .card:nth-child(7){transition-delay:.35s}.card-grid .card:nth-child(8){transition-delay:.4s}
.msg{animation:msgIn .45s cubic-bezier(.16,1,.3,1)}
@keyframes msgIn{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
.alvai-cursor{display:inline-block;width:2px;height:1em;background:var(--teal);margin-left:2px;vertical-align:text-bottom;animation:cursorBlink .8s step-end infinite,cursorGlow 2s ease infinite}
@keyframes cursorBlink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes cursorGlow{0%,100%{box-shadow:0 0 4px rgba(45,138,158,.3)}50%{box-shadow:0 0 12px rgba(45,138,158,.6)}}
.stat-box .num{transition:transform .3s ease}.stat-box:hover .num{transform:scale(1.08)}
.hero-title:hover .accent{text-shadow:0 0 30px rgba(201,168,76,.3);transition:.4s}
.hero-title:hover .teal{text-shadow:0 0 30px rgba(45,138,158,.3);transition:.4s}
.nav-tab{position:relative;overflow:hidden}
.nav-tab::after{content:'';position:absolute;bottom:0;left:50%;width:0;height:2px;background:var(--gold);transition:all .3s;transform:translateX(-50%)}
.nav-tab.active::after{width:60%}.nav-tab.t2.active::after{background:var(--teal)}
.section-label::after{animation:lineGrow 1s ease .3s both}
@keyframes lineGrow{from{transform:scaleX(0);transform-origin:left}to{transform:scaleX(1)}}
.panel{animation:panelIn .5s cubic-bezier(.16,1,.3,1)}
[id^="in-"]:focus{box-shadow:0 0 0 2px rgba(45,138,158,.2);border-color:var(--teal)!important;transition:.3s}
[onclick^="goAsk"]{opacity:0;animation:cardReveal .6s cubic-bezier(.16,1,.3,1) both}
[onclick^="goAsk"]:nth-child(1){animation-delay:.1s}[onclick^="goAsk"]:nth-child(2){animation-delay:.18s}
[onclick^="goAsk"]:nth-child(3){animation-delay:.26s}[onclick^="goAsk"]:nth-child(4){animation-delay:.34s}
[onclick^="goAsk"]:nth-child(5){animation-delay:.42s}[onclick^="goAsk"]:nth-child(6){animation-delay:.5s}
[onclick^="goAsk"]:nth-child(7){animation-delay:.58s}
@keyframes cardReveal{from{opacity:0;transform:translateY(24px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
.divider{position:relative;overflow:hidden}
.divider::after{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(201,168,76,.06),transparent);animation:shimmerLine 6s ease infinite}
@keyframes shimmerLine{0%{left:-100%}100%{left:200%}}
.stat-row .stat-box{animation:statReveal .5s ease both}
.stat-row .stat-box:nth-child(1){animation-delay:.1s}.stat-row .stat-box:nth-child(2){animation-delay:.2s}
.stat-row .stat-box:nth-child(3){animation-delay:.3s}.stat-row .stat-box:nth-child(4){animation-delay:.4s}
@keyframes statReveal{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
"""

first_close = code.find('</style>')
if first_close > 0:
    code = code[:first_close] + ANIM_CSS + code[first_close:]
    changes += 1
    print("✓ Injected animation CSS")

# ═══ FIX 4: Enhanced scroll observer ═══
old_obs = """// Scroll reveals
const observer=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')})},{threshold:0.1})
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el))"""

new_obs = """// ═══ Enhanced scroll reveals ═══
const revealObs=new IntersectionObserver((entries)=>{entries.forEach((e,i)=>{if(e.isIntersecting){const p=e.target.parentElement;if(p&&(p.classList.contains('card-grid')||p.style.display==='grid')){const idx=Array.from(p.children).indexOf(e.target);e.target.style.transitionDelay=(idx*0.06)+'s'}e.target.classList.add('visible')}})},{threshold:0.08,rootMargin:'0px 0px -20px 0px'});
document.querySelectorAll('.reveal,.card,.stat-box').forEach(el=>{if(!el.classList.contains('reveal'))el.classList.add('reveal');revealObs.observe(el)});
var _origGo=window.go;window.go=function(t){_origGo(t);setTimeout(function(){document.querySelectorAll('#p-'+t+' .reveal').forEach(function(el){if(el.getBoundingClientRect().top<window.innerHeight+50)el.classList.add('visible')})},120)}"""

if old_obs in code:
    code = code.replace(old_obs, new_obs)
    changes += 1
    print("✓ Enhanced scroll observer")

with open(FILE, 'w') as f:
    f.write(code)

print(f"\n{'='*50}")
print(f"PATCH COMPLETE — {changes} changes applied")
print(f"{'='*50}")
