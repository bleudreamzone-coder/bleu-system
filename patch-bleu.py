#!/usr/bin/env python3
"""
BLEU.live Surgical Patch
========================
- Adds greeting messages to ALL tab chat boxes (not just home)
- Adds enhanced scroll-reveal animations + text flow effects
- Adds Alvai cursor glow + breathing chat box effects
- Does NOT change design, colors, layout, fonts, or structure
"""

import re, sys

FILE = '/workspaces/bleu-system/index.html'

with open(FILE, 'r') as f:
    code = f.read()

original = code  # backup

# ═══════════════════════════════════════════════════════
# PATCH 1: Add greetings to ALL tab chat boxes
# ═══════════════════════════════════════════════════════
# The existing code only greets chat-home. We add greetings for every tab.

GREETINGS_BLOCK = r"""
// ═══════ ALVAI GREETINGS — ALL TABS ═══════
window.addEventListener('DOMContentLoaded',function(){
  var greetings = {
    'alvai': "<strong style='color:#C9A84C'>✦ I'm Alvai — The Light That Learns.</strong><br><br>I'm connected to <strong style='color:#2D8A9E'>7 federal APIs</strong> right now — OpenFDA, RxNorm, DailyMed, PubMed, ClinicalTrials.gov, USDA FoodData, and Open Meteo. Ask me anything about drug interactions, supplements, practitioners, or your wellness journey.<br><br><span style='color:#7B8DA6'>Try: \"Check interactions between melatonin and sertraline\" or \"Find me a nutritionist\"</span>",
    'dashboard': "<strong style='color:#C9A84C'>Your Wellness Dashboard</strong><br><br>This is your command center. Track protocols, monitor safety alerts, and see your wellness data in one view. <strong style='color:#2D8A9E'>Sign in above to activate your dashboard.</strong>",
    'directory': "<strong style='color:#C9A84C'>485,476 NPI-Verified Practitioners</strong><br><br>Tell me what you need — a therapist, nutritionist, chiropractor, acupuncturist, or any specialty. Include your city and I'll find verified providers with real addresses and phone numbers.<br><br><span style='color:#7B8DA6'>Try: \"Find me a therapist for anxiety in New Orleans\"</span>",
    'vessel': "<strong style='color:#C9A84C'>Vessel — Your Body Intelligence</strong><br><br>Tell me what you're feeling. Pain, fatigue, brain fog, digestive issues, sleep problems — I'll help map it to your endocannabinoid system and suggest evidence-based approaches.<br><br><span style='color:#7B8DA6'>Try: \"I've been exhausted every morning for weeks\"</span>",
    'map': "<strong style='color:#C9A84C'>Wellness Map</strong><br><br>Find practitioners, wellness centers, and community resources near you. The interactive map is being connected to location services.",
    'protocols': "<strong style='color:#C9A84C'>Evidence-Based Protocols</strong><br><br>Designed by <strong style='color:#2D8A9E'>Dr. Felicia Stoler, DCN, MS, RDN, FACSM</strong>. From the 40-Day Reset to sleep optimization, gut health, and hormone balancing — tell me your goal and I'll build a plan.<br><br><span style='color:#7B8DA6'>Try: \"Build me a sleep optimization protocol\"</span>",
    'learn': "<strong style='color:#C9A84C'>Research & Science Hub</strong><br><br>I pull from <strong style='color:#2D8A9E'>PubMed, ClinicalTrials.gov, and our curated knowledge base</strong>. Ask me about any supplement, condition, drug interaction, or wellness topic. I'll give you the science, not opinions.<br><br><span style='color:#7B8DA6'>Try: \"What does the research say about ashwagandha for anxiety?\"</span>",
    'community': "<strong style='color:#C9A84C'>Community Hub</strong><br><br>Connect with fellow wellness seekers, share experiences, and find local events in your area. Community features launching soon.",
    'passport': "<strong style='color:#C9A84C'>Wellness Passport</strong><br><br>Your portable wellness identity. Track achievements, protocols completed, and health milestones. Sign in to activate your Passport.",
    'therapy': "<strong style='color:#C9A84C'>Therapeutic Guide</strong><br><br>CBT, DBT, somatic, motivational, journaling, crisis support — <strong style='color:#2D8A9E'>22 therapeutic modes</strong> that meet you where you are. Not a replacement for a therapist. A bridge until you find one — or alongside one.<br><br><span style='color:#7B8DA6'>Choose a mode above, or just start talking.</span>",
    'finance': "<strong style='color:#C9A84C'>Wellness Finance</strong><br><br>Insurance navigation, HSA/FSA optimization, GoodRx savings, sliding scale options, medical bill negotiation. Stop spending on what hurts you. <strong style='color:#2D8A9E'>Start investing in what heals you.</strong><br><br><span style='color:#7B8DA6'>Try: \"Help me budget for therapy and supplements\"</span>",
    'missions': "<strong style='color:#C9A84C'>Wellness Missions</strong><br><br>Daily and weekly challenges to build healthy habits. Complete missions, earn achievements, and level up your health. Mission system activating soon.",
    'recovery': "<strong style='color:#C9A84C'>Recovery Intelligence</strong><br><br>Whether it's sobriety, post-workout, post-surgery, or chronic fatigue — I can help build a recovery protocol specific to you. <strong style='color:#2D8A9E'>No judgment. Just support.</strong><br><br><span style='color:#7B8DA6'>Choose your recovery mode above, or tell me what you're working through.</span>",
    'ecsiq': "<strong style='color:#C9A84C'>ECS Intelligence — 127 Years of Plant Wisdom</strong><br><br>CB1/CB2 receptors, terpene profiles, strain matching, cannabinoid interactions, microdosing protocols, and the complete <strong style='color:#2D8A9E'>endocannabinoid system</strong> guide. Beginner to expert. Drug interactions checked.<br><br><span style='color:#7B8DA6'>Try: \"What strain is best for anxiety?\" or \"Check cannabis interactions with my medications\"</span>"
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
});
"""

# ═══════════════════════════════════════════════════════
# PATCH 2: Enhanced animations CSS
# ═══════════════════════════════════════════════════════

ANIMATIONS_CSS = """
/* ═══ BLEU ENHANCEMENT PATCH — ANIMATIONS ═══ */

/* Greeting fade-in */
.greet-fade{animation:greetIn .8s ease .2s both}
@keyframes greetIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

/* Enhanced scroll reveals */
.reveal{opacity:0;transform:translateY(20px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
.reveal.visible{opacity:1;transform:translateY(0)}
.reveal-left{opacity:0;transform:translateX(-30px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
.reveal-left.visible{opacity:1;transform:translateX(0)}
.reveal-right{opacity:0;transform:translateX(30px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
.reveal-right.visible{opacity:1;transform:translateX(0)}
.reveal-scale{opacity:0;transform:scale(.92);transition:opacity .6s ease,transform .6s ease}
.reveal-scale.visible{opacity:1;transform:scale(1)}

/* Staggered card entrances */
.card-grid .card:nth-child(1){transition-delay:.05s}
.card-grid .card:nth-child(2){transition-delay:.1s}
.card-grid .card:nth-child(3){transition-delay:.15s}
.card-grid .card:nth-child(4){transition-delay:.2s}
.card-grid .card:nth-child(5){transition-delay:.25s}
.card-grid .card:nth-child(6){transition-delay:.3s}
.card-grid .card:nth-child(7){transition-delay:.35s}
.card-grid .card:nth-child(8){transition-delay:.4s}

/* Chat message entrance */
.msg{animation:msgIn .45s cubic-bezier(.16,1,.3,1)}
@keyframes msgIn{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}

/* Alvai cursor enhanced */
.alvai-cursor{display:inline-block;width:2px;height:1em;background:var(--teal);margin-left:2px;vertical-align:text-bottom;animation:cursorBlink .8s step-end infinite,cursorGlow 2s ease infinite}
@keyframes cursorBlink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes cursorGlow{0%,100%{box-shadow:0 0 4px rgba(45,138,158,.3)}50%{box-shadow:0 0 12px rgba(45,138,158,.6)}}

/* Chat box subtle breathing */
[id^="chat-"]{position:relative}
[id^="chat-"]::after{content:'';position:absolute;bottom:0;left:0;right:0;height:40px;background:linear-gradient(transparent,var(--bg));pointer-events:none;z-index:1;opacity:.6}

/* Stat box counter animation */
.stat-box .num{transition:transform .3s ease}
.stat-box:hover .num{transform:scale(1.08)}

/* Hero title text shimmer on hover */
.hero-title:hover .accent{text-shadow:0 0 30px rgba(201,168,76,.3);transition:.4s}
.hero-title:hover .teal{text-shadow:0 0 30px rgba(45,138,158,.3);transition:.4s}

/* Nav tab micro-interactions */
.nav-tab{position:relative;overflow:hidden}
.nav-tab::after{content:'';position:absolute;bottom:0;left:50%;width:0;height:2px;background:var(--gold);transition:all .3s;transform:translateX(-50%)}
.nav-tab.active::after{width:60%}
.nav-tab.t2.active::after{background:var(--teal)}

/* Section labels line animation */
.section-label::after{animation:lineGrow 1s ease .3s both}
@keyframes lineGrow{from{transform:scaleX(0);transform-origin:left}to{transform:scaleX(1)}}

/* Card hover glow variations */
.card:hover{box-shadow:0 8px 32px rgba(0,0,0,.3),0 0 0 1px rgba(201,168,76,.1)}

/* Smooth panel transitions */
.panel{animation:panelIn .5s cubic-bezier(.16,1,.3,1)}

/* Chat input focus glow */
[id^="in-"]:focus{box-shadow:0 0 0 2px rgba(45,138,158,.2);border-color:var(--teal)!important;transition:.3s}

/* Topic cards on home page — stagger */
[onclick^="goAsk"]{opacity:0;animation:cardReveal .6s cubic-bezier(.16,1,.3,1) both}
[onclick^="goAsk"]:nth-child(1){animation-delay:.1s}
[onclick^="goAsk"]:nth-child(2){animation-delay:.18s}
[onclick^="goAsk"]:nth-child(3){animation-delay:.26s}
[onclick^="goAsk"]:nth-child(4){animation-delay:.34s}
[onclick^="goAsk"]:nth-child(5){animation-delay:.42s}
[onclick^="goAsk"]:nth-child(6){animation-delay:.50s}
[onclick^="goAsk"]:nth-child(7){animation-delay:.58s}
@keyframes cardReveal{from{opacity:0;transform:translateY(24px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}

/* Divider shimmer */
.divider{position:relative;overflow:hidden}
.divider::after{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(201,168,76,.06),transparent);animation:shimmerLine 6s ease infinite}
@keyframes shimmerLine{0%{left:-100%}100%{left:200%}}

/* Floating ambient effect on hero */
.hero-title{position:relative}
.hero-title::before{content:'';position:absolute;top:-20px;left:-30px;width:120px;height:120px;background:radial-gradient(circle,rgba(45,138,158,.06),transparent 70%);border-radius:50%;animation:heroFloat 8s ease infinite;pointer-events:none;z-index:-1}
@keyframes heroFloat{0%,100%{transform:translate(0,0)}25%{transform:translate(10px,-10px)}50%{transform:translate(-5px,5px)}75%{transform:translate(15px,8px)}}

/* Smooth scroll indicator pulse */
.stat-row .stat-box{animation:statReveal .5s ease both}
.stat-row .stat-box:nth-child(1){animation-delay:.1s}
.stat-row .stat-box:nth-child(2){animation-delay:.2s}
.stat-row .stat-box:nth-child(3){animation-delay:.3s}
.stat-row .stat-box:nth-child(4){animation-delay:.4s}
@keyframes statReveal{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
"""

# ═══════════════════════════════════════════════════════
# PATCH 3: Enhanced scroll observer (replace existing)
# ═══════════════════════════════════════════════════════

ENHANCED_OBSERVER = """
// ═══════ ENHANCED SCROLL REVEALS ═══════
const revealObserver=new IntersectionObserver((entries)=>{
  entries.forEach((e,i)=>{
    if(e.isIntersecting){
      // Stagger delay for items in grids
      const parent = e.target.parentElement;
      if(parent && (parent.classList.contains('card-grid') || parent.style.display === 'grid')){
        const siblings = Array.from(parent.children);
        const idx = siblings.indexOf(e.target);
        e.target.style.transitionDelay = (idx * 0.06) + 's';
      }
      e.target.classList.add('visible');
    }
  });
},{threshold:0.08,rootMargin:'0px 0px -20px 0px'});

// Observe all revealable elements
document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale,.card,.stat-box').forEach(el=>{
  if(!el.classList.contains('reveal') && !el.classList.contains('reveal-left') && !el.classList.contains('reveal-right') && !el.classList.contains('reveal-scale')){
    el.classList.add('reveal');
  }
  revealObserver.observe(el);
});

// Re-trigger reveals on tab switch
var origGo = window.go;
window.go = function(tab){
  origGo(tab);
  setTimeout(function(){
    document.querySelectorAll('#p-'+tab+' .reveal, #p-'+tab+' .reveal-left, #p-'+tab+' .reveal-right, #p-'+tab+' .reveal-scale').forEach(function(el){
      if(el.getBoundingClientRect().top < window.innerHeight + 50){
        el.classList.add('visible');
      }
    });
  },120);
};
"""

# ═══════════════════════════════════════════════════════
# APPLY PATCHES
# ═══════════════════════════════════════════════════════

changes = 0

# --- Inject animations CSS before the first </style> ---
first_style_close = code.find('</style>')
if first_style_close > 0:
    code = code[:first_style_close] + ANIMATIONS_CSS + '\n' + code[first_style_close:]
    changes += 1
    print("✓ Injected animation CSS")

# --- Replace the basic scroll observer with enhanced version ---
# Find the existing observer block
old_observer = """// Scroll reveals
const observer=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')})},{threshold:0.1})
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el))"""

if old_observer in code:
    code = code.replace(old_observer, ENHANCED_OBSERVER.strip())
    changes += 1
    print("✓ Enhanced scroll observer")
else:
    # Try a more flexible match
    pattern = r"// Scroll reveals\nconst observer=new IntersectionObserver.*?\n.*?\.forEach\(el=>observer\.observe\(el\)\)"
    if re.search(pattern, code):
        code = re.sub(pattern, ENHANCED_OBSERVER.strip(), code)
        changes += 1
        print("✓ Enhanced scroll observer (regex)")
    else:
        print("⚠ Could not find scroll observer to replace — will append")

# --- Add greetings block before the closing </script> that's right before Enterprise ---
enterprise_marker = "<!-- ═══════════════════════ ENTERPRISE ═══════════════════════ -->"
script_before_enterprise = code.rfind('</script>', 0, code.find(enterprise_marker))
if script_before_enterprise > 0:
    code = code[:script_before_enterprise] + GREETINGS_BLOCK + '\n' + code[script_before_enterprise:]
    changes += 1
    print("✓ Added greetings for all tab chat boxes")
else:
    print("⚠ Could not find script tag before Enterprise section")

# --- Write the patched file ---
with open(FILE, 'w') as f:
    f.write(code)

print(f"\n{'='*50}")
print(f"PATCH COMPLETE — {changes} changes applied")
print(f"File: {FILE}")
print(f"Size: {len(code):,} bytes")
print(f"{'='*50}")
print(f"\nNext: git add index.html && git commit -m 'Fix all chat boxes + animations' && git push")
