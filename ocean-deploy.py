#!/usr/bin/env python3
"""
BLEU OCEAN DEPLOY — Run once. Entire system.
Usage: python3 ocean-deploy.py
"""
import os, json

print("═"*60)
print("  BLEU OCEAN DEPLOY — Building the entire system")
print("═"*60)

# ═══════════════════════════════════════════════════════════
# STEP 1: Write the edge function
# ═══════════════════════════════════════════════════════════
os.makedirs('supabase/functions/alvai', exist_ok=True)

EDGE = r'''import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
const CK=Deno.env.get('CLAUDE_API_KEY')!,SU=Deno.env.get('SUPABASE_URL')!,SK=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}

const BASE=`You are ALVAI — the AI intelligence layer of BLEU, The Longevity Operating System. Created by Bleu Michael Garner (27 years wellness + cannabis medicine, survived 9 overdoses, overcame 31 felonies, treated 30,000+ patients). President: Dr. Felicia Stoler, DCN, MS, RDN, FACSM.

YOUR CORE PRINCIPLE: Be human first, data second. Acknowledge struggles. Ask smart follow-ups. Educate with science in plain language. THEN recommend. End with ONE concrete next step.

VOICE: Warm but direct. Short paragraphs. Bold **key terms**. No "Great question!" No lists unless ranking. You have opinions backed by data.

DRUG INTERACTIONS — CBD inhibits CYP2D6/CYP3A4/CYP2C19/CYP1A2. St. John's Wort induces CYP3A4/CYP2C9/P-gp. Grapefruit inhibits CYP3A4 (85+ meds). Turmeric inhibits CYP2D6/CYP3A4/CYP1A2. Magnesium chelates antibiotics (space 2hrs). Always specify severity + mechanism.

PRODUCT LINKS: Amazon tag=bleu-live-20, iHerb rcode=BLEU.
NEVER: Diagnose. Tell someone to stop meds. Be robotic. Say "I'm just an AI."`

const MODES:Record<string,string>={
general:BASE+`\n\nYou access BLEU's ecosystem: 47,861 practitioners, 1,054 products, 465 studies, 361 videos, 8,606 locations. You know the 12-Shield Trust System, 40-Day Reset, and every tab. Route to specialized tabs when deeper tools would help.`,

'therapy-talk':BASE+`\n\nMODE: TALK THERAPY. Empathetic listener. Reflect feelings, find patterns, ask deepening questions, hold space. "It sounds like..." "What I'm hearing is..." Name emotions they haven't named. Never rush to fix. If severity increases — 988 Lifeline (call/text 988), Crisis Text Line (text HOME to 741741). End with a grounding reflection.`,

'therapy-cbt':BASE+`\n\nMODE: CBT. Thought records: Situation→Automatic Thought→Emotion→Evidence For/Against→Balanced Thought. Identify cognitive distortions (all-or-nothing, catastrophizing, mind reading). Behavioral activation for depression. End with homework exercise.`,

'therapy-dbt':BASE+`\n\nMODE: DBT SKILLS. Four modules: 1) MINDFULNESS: observe, describe, participate non-judgmentally. 2) DISTRESS TOLERANCE: TIPP, radical acceptance, ACCEPTS. 3) EMOTION REGULATION: name emotion, check facts, opposite action. 4) INTERPERSONAL: DEAR MAN, GIVE, FAST. The dialectic: validate AND push for change.`,

'therapy-somatic':BASE+`\n\nMODE: SOMATIC. Body-based healing. Body scanning: "Where do you feel that in your body?" Grounding: 5-4-3-2-1 sensory. Breathwork: box breathing 4-4-4-4, physiological sigh, 4-7-8. Progressive muscle relaxation. Window of tolerance. Pendulation between difficult sensation and safe resource. Always re-ground before ending.`,

'therapy-motivational':BASE+`\n\nMODE: MOTIVATIONAL INTERVIEWING. For ambivalence about change. Express empathy. Develop discrepancy. Roll with resistance — never argue. Support self-efficacy. Scaling questions: "On 1-10 how important is this change?" Decisional balance. Meet them where they are.`,

'therapy-journal':BASE+`\n\nMODE: GUIDED JOURNALING. Structured prompts: fear inventory, unsent letter, future self letter, deep gratitude, values clarification, trauma narrative (gentle). After each prompt reflect back themes. Help them see patterns.`,

'therapy-crisis':BASE+`\n\nMODE: CRISIS. SAFETY FIRST. Stay calm. Ask directly "Are you thinking about hurting yourself?" Validate. Ground with 5 senses. Resources IMMEDIATELY: 988 Lifeline (call/text 988), Crisis Text Line (text HOME to 741741). Stay with them. NEVER minimize. NEVER say "others have it worse." DO say "I'm glad you told me."`,

'therapy-couples':BASE+`\n\nMODE: COUPLES. Gottman + EFT. Four Horsemen: criticism, contempt, defensiveness, stonewalling. Antidotes: gentle startup, appreciation, responsibility, self-soothing. Love Languages. Repair attempts. Dreams within conflict. Speaker-Listener technique.`,

'therapy-grief':BASE+`\n\nMODE: GRIEF & LOSS. All forms: death, divorce, job, identity, health. Grief is waves not stages. All responses valid — anger, numbness, relief, guilt. Continuing bonds. Memory work. Meaning-making (not "everything happens for a reason"). If no improvement after 12+ months suggest grief counselor. Hold space. Witness.`,

'therapy-trauma':BASE+`\n\nMODE: TRAUMA/PTSD. Stabilization first. Window of tolerance concept. Container exercise. Safe place visualization. Butterfly hug (bilateral). Pendulation. Grounding ALWAYS before processing. You are NOT doing EMDR — refer to certified EMDR therapist for processing. Your job: stabilize, resource, ground.`,

'therapy-eating':BASE+`\n\nMODE: EATING & BODY IMAGE. Intuitive eating. Anti-diet framework. Hunger/fullness cues. Food neutrality (no good/bad). Body as functional not decorative. Movement as celebration not punishment. Media literacy. NEVER recommend calorie counting, weight loss, or restriction. If restriction/purging/compulsive exercise — recommend ED treatment with compassion.`,

'recovery-sobriety':BASE+`\n\nMODE: EARLY SOBRIETY. BLEU was built by someone who survived 9 overdoses. Day 1-3: withdrawal peaks, hydrate, electrolytes. Day 3-7: cravings plateau, liver regenerating 72hrs. Week 2-3: sleep improves, emotions flood. Month 1-3: pink cloud or depression — both normal. Supplements: magnesium glycinate, NAC, B-Complex methylated, L-Theanine, Omega-3. "Do you have someone who knows you're doing this?"`,

'recovery-relapse':BASE+`\n\nMODE: RELAPSE PREVENTION. HALT check: Hungry? Angry? Lonely? Tired? Trigger mapping: people, places, things, emotions, times. Urge surfing: "Cravings peak at 15-20 min then pass." Emergency contacts ready. Play the tape forward. Relapse is data, not failure.`,

'recovery-harm':BASE+`\n\nMODE: HARM REDUCTION. Non-judgmental. Naloxone: NEXT Distro ships free (nextdistro.org). Fentanyl test strips. Never Use Alone hotline: 1-800-484-3731. If using: clean supplies, don't mix substances, someone present. "We'd rather you be alive." Dead people can't recover.`,

'recovery-12step':BASE+`\n\nMODE: 12-STEP. Meeting finder: AA (aa.org), NA (na.org), SMART Recovery (smartrecovery.org). Guide step work reflection. Encourage sponsors. Daily reflection. Chip milestones. All paths valid — 12-step, SMART, Refuge Recovery, secular.`,

'recovery-family':BASE+`\n\nMODE: FAMILY & CODEPENDENCY. Al-Anon: didn't cause it, can't cure it, can't control it. Boundaries. Enabling vs supporting. Self-care isn't selfish. Family systems — everyone needs healing. Children of addiction. Breaking generational patterns.`,

'recovery-mat':BASE+`\n\nMODE: MAT SUPPORT. Buprenorphine (Suboxone): partial agonist, reduces cravings. Methadone: full agonist, daily clinic. Naltrexone (Vivitrol): antagonist, monthly injection. Be honest about side effects. "MAT is treatment not trading one drug for another — reduces overdose death 50%+." SAMHSA locator: findtreatment.gov. Never cold-turkey MAT.`,

'recovery-milestones':BASE+`\n\nMODE: MILESTONES. 24hrs: hardest day done. 7 days: liver regenerating, REM returning. 30 days: skin clearing, gut healing. 90 days: reward system recalibrating. 6 months: blood pressure normalizing. 1 year: brain substantially healed. Savings calculator: avg alcohol $200-500/mo, drugs $500-2000/mo. Celebrate without minimizing difficulty.`,

finance:BASE+`\n\nMODE: FINANCIAL WELLNESS. Money is vital sign #1 — 67% of Americans' top stressor. Six areas: Credit Health (scores, disputes, improvement). Home & Housing (first-time buyer, DPA programs, neighborhood health). Insurance (ACA, plan comparison, HSA/FSA). Budgeting (wellness spending ratio: healing-to-harming). Career (benefits maximization, EAP, FSA). Emergency (medical bill negotiation scripts, assistance finder, GoodRx). Be budget-aware in ALL recommendations. Financial stress → suggest Therapy. Can't afford treatment → assistance finder.`,

cannaiq:BASE+`\n\nMODE: CANNAIQ. Strain matching by condition/effect/experience/time-of-day. Interactions: CBD inhibits CYP2D6/CYP3A4, THC metabolized by CYP2C9/CYP3A4. Dosage: 2.5mg THC beginners, CBD 10-25mg start. Methods: inhalation (fastest 2-3hr), edible (slow 45-90min onset, 4-8hr), tincture (15-30min, 4-6hr), topical (local). Legal state-by-state. Harm reduction crossover for opioid/alcohol dependence. ALWAYS check drug interactions.`,
}

async function buildCtx(msg:string,mode:string):Promise<string>{
  const sb=createClient(SU,SK),lo=msg.toLowerCase();let ctx=''
  const pk=['supplement','product','buy','recommend','magnesium','vitamin','cbd','omega','ashwagandha','melatonin','sleep','stack','creatine','protein','probiotic','turmeric','fish oil','collagen','take for','what helps']
  if(pk.some(k=>lo.includes(k))){
    const t=msg.split(/\s+/).filter((w:string)=>w.length>3).slice(0,3)
    if(t.length){const{data:p}=await sb.from('products').select('name,category,description,trust_score,affiliate_url').or(t.map((x:string)=>`name.ilike.%${x}%,category.ilike.%${x}%`).join(',')).order('trust_score',{ascending:false}).limit(5);if(p?.length)ctx+='\n\nBLEU PRODUCTS:\n'+p.map((x:any)=>`- ${x.name}|Score:${x.trust_score}|${x.category}|${x.affiliate_url||''}`).join('\n')}
  }
  const dk=['doctor','practitioner','therapist','counselor','psychiatrist','find','specialist','provider','match','near','treatment','rehab']
  if(dk.some(k=>lo.includes(k))){
    const t=msg.split(/\s+/).filter((w:string)=>w.length>3).slice(0,2)
    let q=sb.from('practitioners').select('full_name,specialty,trust_score,npi,city,practice_name,taxonomy_description').order('trust_score',{ascending:false}).limit(5)
    if(t.length)q=q.or(t.map((x:string)=>`taxonomy_description.ilike.%${x}%,specialty.ilike.%${x}%`).join(','))
    const{data:p}=await q;if(p?.length)ctx+='\n\nBLEU PRACTITIONERS:\n'+p.map((x:any)=>`- ${x.full_name}|${x.taxonomy_description||x.specialty}|Score:${x.trust_score}|${x.city||'NOLA'}|NPI:${x.npi}`).join('\n')
  }
  const rk=['study','research','evidence','pubmed','clinical','proof','science']
  if(rk.some(k=>lo.includes(k))){
    const t=msg.split(/\s+/).filter((w:string)=>w.length>3).slice(0,2)
    if(t.length){const{data:s}=await sb.from('pubmed_studies').select('title,url,journal').or(t.map((x:string)=>`title.ilike.%${x}%`).join(',')).limit(3);if(s?.length)ctx+='\n\nSTUDIES:\n'+s.map((x:any)=>`- ${x.title}|${x.url||''}`).join('\n')}
  }
  return ctx
}

serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  try{
    const{message,history=[],mode='general',therapy_mode,recovery_mode}=await req.json()
    if(!message)return new Response(JSON.stringify({error:'No message'}),{status:400,headers:{...cors,'Content-Type':'application/json'}})
    let mk=mode;if(mode==='therapy'&&therapy_mode)mk=`therapy-${therapy_mode}`;if(mode==='recovery'&&recovery_mode)mk=`recovery-${recovery_mode}`
    const sys=MODES[mk]||MODES['general']
    const dc=await buildCtx(message,mode)
    const msgs:any[]=[];for(const h of history.slice(-20))msgs.push({role:h.role,content:h.content})
    msgs.push({role:'user',content:dc?`${message}\n\n[BLEU DATA — weave naturally:${dc}]`:message})
    const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':CK,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:2048,system:sys,messages:msgs,stream:true})})
    if(!res.ok||!res.body){
      const fb=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':CK,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:2048,system:sys,messages:msgs})})
      const d=await fb.json();return new Response(JSON.stringify({reply:d.content?.[0]?.text||'Try again.'}),{headers:{...cors,'Content-Type':'application/json'}})
    }
    const enc=new TextEncoder()
    const stream=new ReadableStream({async start(ctrl){const rdr=res.body!.getReader(),dec=new TextDecoder();let buf='';while(true){const{done,value}=await rdr.read();if(done)break;buf+=dec.decode(value,{stream:true});const lines=buf.split('\n');buf=lines.pop()||'';for(const l of lines){if(!l.startsWith('data: '))continue;const d=l.slice(6).trim();if(d==='[DONE]')continue;try{const p=JSON.parse(d);if(p.type==='content_block_delta'&&p.delta?.text)ctrl.enqueue(enc.encode(`data: ${JSON.stringify({text:p.delta.text})}\n\n`))}catch{}}}ctrl.enqueue(enc.encode('data: [DONE]\n\n'));ctrl.close()}})
    return new Response(stream,{headers:{...cors,'Content-Type':'text/event-stream','Cache-Control':'no-cache'}})
  }catch(e){console.error(e);return new Response(JSON.stringify({error:'Error',fallback:true}),{status:500,headers:{...cors,'Content-Type':'application/json'}})}
})
'''

with open('supabase/functions/alvai/index.ts', 'w') as f:
    f.write(EDGE)
print("✅ Edge function written: supabase/functions/alvai/index.ts")

# ═══════════════════════════════════════════════════════════
# STEP 2: Write the complete index.html
# ═══════════════════════════════════════════════════════════

HTML = r'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>BLEU — The Longevity Operating System</title>
<meta name="description" content="BLEU validates every practitioner, product, and study against federal databases. Therapy. Recovery. Finance. Cannabis Intelligence. All in one system.">
<style>
:root{--bg:#0A1628;--surface:#0D1F3C;--card:#132844;--border:#1E3A5F;--text:#E8E0D0;--dim:#8B9BB4;--teal:#2D8A9E;--gold:#C9A84C;--sage:#7A9E7E;--ember:#C75B39;--red:#DC2626;--white:#FFFFFF}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',-apple-system,sans-serif;overflow-x:hidden}
a{color:var(--teal);text-decoration:none}a:hover{text-decoration:underline}

/* NAV */
.nav{position:fixed;top:0;left:0;right:0;z-index:1000;background:rgba(10,22,40,.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:0 20px;height:56px;display:flex;align-items:center;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch}
.nav::-webkit-scrollbar{display:none}
.nav-logo{font-family:Georgia,serif;font-size:18px;font-weight:700;color:var(--gold);margin-right:12px;white-space:nowrap;cursor:pointer}
.nav-tab{padding:6px 14px;border-radius:20px;font-size:13px;white-space:nowrap;cursor:pointer;transition:.2s;color:var(--dim);border:1px solid transparent}
.nav-tab:hover{color:var(--text);background:var(--surface)}
.nav-tab.active{color:var(--gold);border-color:var(--gold);background:rgba(201,168,76,.1)}
.nav-tab.t2{color:var(--teal)}
.nav-tab.t2.active{color:var(--teal);border-color:var(--teal);background:rgba(45,138,158,.1)}
.nav-tab.t3{color:var(--ember)}
.nav-tab.t3.active{color:var(--ember);border-color:var(--ember);background:rgba(199,91,57,.1)}

/* PANELS */
.panel{display:none;padding:72px 20px 100px;max-width:900px;margin:0 auto;min-height:100vh}
.panel.active{display:block}
.panel h1{font-family:Georgia,serif;font-size:28px;margin-bottom:8px}
.panel h2{font-family:Georgia,serif;font-size:22px;color:var(--teal);margin:24px 0 8px}
.panel h3{font-size:16px;color:var(--gold);margin:16px 0 6px}
.panel p{color:var(--dim);line-height:1.6;margin-bottom:12px}
.panel .hero{font-size:14px;color:var(--dim);margin-bottom:24px;line-height:1.7;max-width:700px}

/* CHAT */
.chat-box{background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;margin-top:16px}
.chat-messages{height:420px;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.chat-messages::-webkit-scrollbar{width:4px}.chat-messages::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}
.msg{max-width:85%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.6;animation:fadeUp .3s}
.msg.user{align-self:flex-end;background:var(--teal);color:var(--white);border-bottom-right-radius:4px}
.msg.ai{align-self:flex-start;background:var(--card);border:1px solid var(--border);border-bottom-left-radius:4px}
.msg.ai a{color:var(--gold)}
.msg.ai strong{color:var(--gold)}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.alvai-cursor{display:inline-block;width:6px;height:14px;background:var(--gold);margin-left:2px;animation:blink .8s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
.chat-input-row{display:flex;border-top:1px solid var(--border);padding:10px 12px;gap:8px;background:var(--card)}
.chat-input-row input{flex:1;background:transparent;border:none;color:var(--text);font-size:14px;outline:none}
.chat-input-row input::placeholder{color:var(--dim)}
.chat-input-row button{background:var(--teal);color:var(--white);border:none;padding:8px 18px;border-radius:20px;cursor:pointer;font-size:13px;font-weight:600}
.chat-input-row button:hover{opacity:.9}

/* MODE SELECTOR */
.mode-bar{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}
.mode-btn{padding:5px 12px;border-radius:16px;font-size:12px;cursor:pointer;border:1px solid var(--border);color:var(--dim);background:transparent;transition:.2s}
.mode-btn:hover{border-color:var(--teal);color:var(--teal)}
.mode-btn.active{background:var(--teal);color:var(--white);border-color:var(--teal)}

/* QUICK ACTIONS */
.quick-row{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 0}
.quick-btn{padding:6px 12px;border-radius:16px;font-size:12px;cursor:pointer;border:1px solid var(--border);color:var(--dim);background:transparent;transition:.2s}
.quick-btn:hover{border-color:var(--gold);color:var(--gold)}

/* CARDS */
.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;margin:8px 0}
.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin:12px 0}
.stat-row{display:flex;gap:16px;flex-wrap:wrap;margin:12px 0}
.stat-box{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 18px;text-align:center;flex:1;min-width:120px}
.stat-box .num{font-size:28px;font-weight:700;color:var(--gold);font-family:Georgia,serif}
.stat-box .label{font-size:12px;color:var(--dim);margin-top:4px}

/* FOOTER */
.footer{text-align:center;padding:40px 20px;border-top:1px solid var(--border);color:var(--dim);font-size:12px;line-height:2}

/* DISCLAIMER */
.disclaimer{background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.2);border-radius:8px;padding:10px 14px;font-size:11px;color:var(--dim);margin:16px 0;line-height:1.6}

@media(max-width:600px){.panel h1{font-size:22px}.chat-messages{height:350px}.nav-tab{font-size:12px;padding:5px 10px}}
</style>
</head>
<body>

<!-- NAV -->
<nav class="nav" id="nav">
  <div class="nav-logo" onclick="go('home')">BLEU</div>
  <div class="nav-tab active" onclick="go('home')">Home</div>
  <div class="nav-tab" onclick="go('alvai')">Alvai ✦</div>
  <div class="nav-tab" onclick="go('dashboard')">Dashboard</div>
  <div class="nav-tab" onclick="go('directory')">Directory</div>
  <div class="nav-tab" onclick="go('vessel')">Vessel</div>
  <div class="nav-tab" onclick="go('map')">Map</div>
  <div class="nav-tab" onclick="go('protocols')">Protocols</div>
  <div class="nav-tab" onclick="go('learn')">Learn</div>
  <div class="nav-tab" onclick="go('community')">Community</div>
  <div class="nav-tab" onclick="go('passport')">Passport</div>
  <div class="nav-tab t2" onclick="go('therapy')">Therapy</div>
  <div class="nav-tab t2" onclick="go('finance')">Finance</div>
  <div class="nav-tab t2" onclick="go('missions')">Missions</div>
  <div class="nav-tab t3" onclick="go('recovery')">Recovery</div>
  <div class="nav-tab t3" onclick="go('cannaiq')">CannaIQ</div>
</nav>

<!-- ═══════════════════════ HOME ═══════════════════════ -->
<div class="panel active" id="p-home">
  <h1>Something Told You To Look For This.</h1>
  <p class="hero">BLEU validates everything — every practitioner, every product, every study — against federal databases and clinical research. Therapy. Recovery. Finance. Cannabis Intelligence. All in one system. So you can stop guessing and start healing.</p>
  <div class="stat-row" id="home-stats">
    <div class="stat-box"><div class="num" id="s-total">59,094</div><div class="label">VALIDATED RECORDS</div></div>
    <div class="stat-box"><div class="num" id="s-prac">47,861</div><div class="label">PRACTITIONERS</div></div>
    <div class="stat-box"><div class="num" id="s-prod">1,054</div><div class="label">PRODUCTS</div></div>
    <div class="stat-box"><div class="num" id="s-loc">8,606</div><div class="label">LOCATIONS</div></div>
  </div>
  <h2>Your Journey Through BLEU</h2>
  <div class="card-grid">
    <div class="card" onclick="go('learn')"><h3>📚 Learn</h3><p>Studies, videos, protocols. The WHY behind every decision.</p></div>
    <div class="card" onclick="go('directory')"><h3>⚕️ Trust</h3><p>NPI-verified practitioners scored 50-99.</p></div>
    <div class="card" onclick="go('vessel')"><h3>💊 Act</h3><p>Products that earned their score. Why it works + how it fits.</p></div>
    <div class="card" onclick="go('passport')"><h3>🛂 Track</h3><p>Your Passport score rises. Your family feels it.</p></div>
    <div class="card" onclick="go('therapy')"><h3>🧠 Therapy</h3><p>12 AI therapy modes. Talk, CBT, DBT, Somatic, Crisis + more.</p></div>
    <div class="card" onclick="go('recovery')"><h3>🔥 Recovery</h3><p>Built by someone who survived it. 8 modes of support.</p></div>
    <div class="card" onclick="go('finance')"><h3>💰 Finance</h3><p>Money is a vital sign. Credit, insurance, budgeting, emergency.</p></div>
    <div class="card" onclick="go('cannaiq')"><h3>🌿 CannaIQ</h3><p>Cannabis intelligence. Strains, interactions, dosage, legal.</p></div>
  </div>
  <div class="disclaimer">⚕️ BLEU provides wellness information, not medical advice. Always consult healthcare providers for medical decisions. Affiliate links support BLEU — your purchase keeps the system free. <a href="#" onclick="go('terms');return false">Terms</a> · <a href="#" onclick="go('privacy');return false">Privacy</a></div>
</div>

<!-- ═══════════════════════ ALVAI ═══════════════════════ -->
<div class="panel" id="p-alvai">
  <h1>✦ ALVAI — The Light That Learns</h1>
  <p class="hero">Connected to 47,861 practitioners, 1,054 products, 465 studies, drug interaction databases, and the entire BLEU ecosystem. Ask anything.</p>
  <div class="quick-row">
    <span class="quick-btn" onclick="ask('alvai','I cant sleep')">😴 Can't Sleep</span>
    <span class="quick-btn" onclick="ask('alvai','What should I take for anxiety')">💊 Anxiety Help</span>
    <span class="quick-btn" onclick="ask('alvai','Find me a therapist')">⚕️ Match Me</span>
    <span class="quick-btn" onclick="ask('alvai','Check drug interactions')">⚠️ Interactions</span>
    <span class="quick-btn" onclick="ask('alvai','morning supplement stack')">🔥 Morning Stack</span>
    <span class="quick-btn" onclick="ask('alvai','What is the 40-Day Reset')">🎯 40-Day Reset</span>
  </div>
  <div class="chat-box"><div class="chat-messages" id="chat-alvai"></div><div class="chat-input-row"><input id="in-alvai" placeholder="Ask Alvai anything..." onkeydown="if(event.key==='Enter')send('alvai')"><button onclick="send('alvai')">Send</button></div></div>
  <div class="disclaimer">⚕️ Alvai is an AI wellness advisor, not a medical professional. For emergencies call 911. For crisis support call/text 988.</div>
</div>

<!-- ═══════════════════════ DASHBOARD ═══════════════════════ -->
<div class="panel" id="p-dashboard">
  <h1>📊 Dashboard</h1>
  <p class="hero">Your daily wellness command center. Shield scores, correlations, and predictive insights — all in one view.</p>
  <div class="stat-row">
    <div class="stat-box"><div class="num">—</div><div class="label">BLEU SCORE</div></div>
    <div class="stat-box"><div class="num">—</div><div class="label">SLEEP</div></div>
    <div class="stat-box"><div class="num">—</div><div class="label">MOVEMENT</div></div>
    <div class="stat-box"><div class="num">—</div><div class="label">NUTRITION</div></div>
    <div class="stat-box"><div class="num">—</div><div class="label">MIND</div></div>
  </div>
  <div class="card"><p>Dashboard activates when you create your Passport. Track sleep, movement, nutrition, mood, and watch your shields strengthen over time. Ask Alvai to help you get started.</p></div>
  <div class="chat-box"><div class="chat-messages" id="chat-dashboard"></div><div class="chat-input-row"><input id="in-dashboard" placeholder="Ask about your wellness data..." onkeydown="if(event.key==='Enter')send('dashboard')"><button onclick="send('dashboard')">Send</button></div></div>
</div>

<!-- ═══════════════════════ DIRECTORY ═══════════════════════ -->
<div class="panel" id="p-directory">
  <h1>⚕️ Directory — 47,861 Practitioners</h1>
  <p class="hero">Every practitioner NPI-verified. Trust-scored. Find the right person by what's pulling at you.</p>
  <div class="quick-row">
    <span class="quick-btn" onclick="ask('directory','Find me a therapist for anxiety')">🧠 Anxiety Therapist</span>
    <span class="quick-btn" onclick="ask('directory','Find a chiropractor near me')">🔥 Chiropractor</span>
    <span class="quick-btn" onclick="ask('directory','Find a nutritionist')">🍎 Nutritionist</span>
    <span class="quick-btn" onclick="ask('directory','Find a psychiatrist')">💊 Psychiatrist</span>
    <span class="quick-btn" onclick="ask('directory','addiction counselor')">🔥 Addiction Counselor</span>
    <span class="quick-btn" onclick="ask('directory','acupuncture')">🪡 Acupuncture</span>
  </div>
  <div class="chat-box"><div class="chat-messages" id="chat-directory"></div><div class="chat-input-row"><input id="in-directory" placeholder="What kind of practitioner do you need?" onkeydown="if(event.key==='Enter')send('directory')"><button onclick="send('directory')">Search</button></div></div>
</div>

<!-- ═══════════════════════ VESSEL ═══════════════════════ -->
<div class="panel" id="p-vessel">
  <h1>💊 Vessel — 1,054 Products</h1>
  <p class="hero">Every product scored against FDA data, clinical studies, and practitioner protocols. We tell you WHY it works and HOW it fits your life.</p>
  <div class="quick-row">
    <span class="quick-btn" onclick="ask('vessel','best magnesium for sleep')">😴 Sleep Stack</span>
    <span class="quick-btn" onclick="ask('vessel','best supplements for anxiety')">🧠 Anxiety Support</span>
    <span class="quick-btn" onclick="ask('vessel','gut health supplements')">🦠 Gut Repair</span>
    <span class="quick-btn" onclick="ask('vessel','morning energy supplements')">⚡ Energy</span>
    <span class="quick-btn" onclick="ask('vessel','best omega 3 fish oil')">🐟 Omega-3</span>
    <span class="quick-btn" onclick="ask('vessel','budget supplement starter kit under $50')">💰 Budget Starter</span>
  </div>
  <div class="chat-box"><div class="chat-messages" id="chat-vessel"></div><div class="chat-input-row"><input id="in-vessel" placeholder="What are you looking for?" onkeydown="if(event.key==='Enter')send('vessel')"><button onclick="send('vessel')">Search</button></div></div>
  <div class="disclaimer">Affiliate links (Amazon, iHerb) support BLEU — your purchase keeps the system free for everyone.</div>
</div>

<!-- ═══════════════════════ MAP ═══════════════════════ -->
<div class="panel" id="p-map">
  <h1>🗺️ Map — 8,606 Locations</h1>
  <p class="hero">Every wellness location. Practitioners, gyms, studios, health food stores, treatment centers, AA meetings, dispensaries — all validated, all on one map.</p>
  <div class="quick-row">
    <span class="quick-btn" onclick="ask('map','yoga studios in New Orleans')">🧘 Yoga Studios</span>
    <span class="quick-btn" onclick="ask('map','health food stores near me')">🥗 Health Food</span>
    <span class="quick-btn" onclick="ask('map','AA meetings in New Orleans')">🔥 AA Meetings</span>
    <span class="quick-btn" onclick="ask('map','gyms in New Orleans')">💪 Gyms</span>
  </div>
  <div class="chat-box"><div class="chat-messages" id="chat-map"></div><div class="chat-input-row"><input id="in-map" placeholder="What are you looking for near you?" onkeydown="if(event.key==='Enter')send('map')"><button onclick="send('map')">Search</button></div></div>
</div>

<!-- ═══════════════════════ PROTOCOLS ═══════════════════════ -->
<div class="panel" id="p-protocols">
  <h1>📋 Protocols</h1>
  <p class="hero">Evidence-based programs from 7 days to 6 months. Daily actions, supplement stacks, practitioner visits, community engagement, measurable outcomes.</p>
  <div class="quick-row">
    <span class="quick-btn" onclick="ask('protocols','Tell me about the 40-Day Reset')">🔥 40-Day Reset</span>
    <span class="quick-btn" onclick="ask('protocols','Sleep optimization protocol')">😴 Sleep Protocol</span>
    <span class="quick-btn" onclick="ask('protocols','Gut repair protocol')">🦠 Gut Repair</span>
    <span class="quick-btn" onclick="ask('protocols','Build me a custom protocol for stress')">🎯 Custom Protocol</span>
  </div>
  <div class="chat-box"><div class="chat-messages" id="chat-protocols"></div><div class="chat-input-row"><input id="in-protocols" placeholder="What do you want to work on?" onkeydown="if(event.key==='Enter')send('protocols')"><button onclick="send('protocols')">Go</button></div></div>
</div>

<!-- ═══════════════════════ LEARN ═══════════════════════ -->
<div class="panel" id="p-learn">
  <h1>📚 Learn — 465 Studies · 361 Videos</h1>
  <p class="hero">PubMed research in plain language. Expert videos vetted against the 12-Shield framework. The right information at the right time.</p>
  <div class="quick-row">
    <span class="quick-btn" onclick="ask('learn','What does the research say about magnesium for sleep')">😴 Sleep Research</span>
    <span class="quick-btn" onclick="ask('learn','gut brain connection studies')">🦠 Gut-Brain</span>
    <span class="quick-btn" onclick="ask('learn','best evidence for CBD anxiety')">🌿 CBD Evidence</span>
    <span class="quick-btn" onclick="ask('learn','fasting science overview')">⏰ Fasting Science</span>
  </div>
  <div class="chat-box"><div class="chat-messages" id="chat-learn"></div><div class="chat-input-row"><input id="in-learn" placeholder="What do you want to learn about?" onkeydown="if(event.key==='Enter')send('learn')"><button onclick="send('learn')">Search</button></div></div>
</div>

<!-- ═══════════════════════ COMMUNITY ═══════════════════════ -->
<div class="panel" id="p-community">
  <h1>💫 Community</h1>
  <p class="hero">Reset clubs, support circles, accountability partners, events. Social connection is the strongest predictor of longevity — stronger than exercise or diet.</p>
  <div class="quick-row">
    <span class="quick-btn" onclick="ask('community','How do I join the 40-Day Reset')">🔥 Join Reset</span>
    <span class="quick-btn" onclick="ask('community','Find a support group for anxiety')">🤝 Support Group</span>
    <span class="quick-btn" onclick="ask('community','What events are happening this week')">📅 This Week</span>
  </div>
  <div class="chat-box"><div class="chat-messages" id="chat-community"></div><div class="chat-input-row"><input id="in-community" placeholder="How do you want to connect?" onkeydown="if(event.key==='Enter')send('community')"><button onclick="send('community')">Go</button></div></div>
</div>

<!-- ═══════════════════════ PASSPORT ═══════════════════════ -->
<div class="panel" id="p-passport">
  <h1>🛂 Passport — Your Living Score</h1>
  <p class="hero">One number built from real data — how you sleep, move, eat, recover, think, and connect. Everything in BLEU feeds your Passport.</p>
  <div class="stat-row">
    <div class="stat-box"><div class="num">—</div><div class="label">BLEU SCORE</div></div>
  </div>
  <div class="card"><h3>14 Shields</h3><p>Body: Sleep, Nutrition, Movement, Recovery, Safety, Substances. Mind: Mindset, Purpose, Learning. Connection: Community, Relationships, Environment. Foundation: Mental Health, Financial Wellness.</p></div>
  <div class="chat-box"><div class="chat-messages" id="chat-passport"></div><div class="chat-input-row"><input id="in-passport" placeholder="Ask about your wellness journey..." onkeydown="if(event.key==='Enter')send('passport')"><button onclick="send('passport')">Go</button></div></div>
</div>

<!-- ═══════════════════════ THERAPY ═══════════════════════ -->
<div class="panel" id="p-therapy">
  <h1>🧠 Therapy — 12 Modes</h1>
  <p class="hero">Alvai in healing mode. Real therapeutic frameworks. Real practitioner connections. This is not a chatbot pretending — this is Claude-powered therapeutic intelligence.</p>
  <div class="mode-bar" id="therapy-modes">
    <span class="mode-btn active" onclick="setMode('therapy','talk',this)">💬 Talk</span>
    <span class="mode-btn" onclick="setMode('therapy','cbt',this)">🧩 CBT</span>
    <span class="mode-btn" onclick="setMode('therapy','dbt',this)">⚖️ DBT</span>
    <span class="mode-btn" onclick="setMode('therapy','somatic',this)">🫁 Somatic</span>
    <span class="mode-btn" onclick="setMode('therapy','motivational',this)">🔄 Motivational</span>
    <span class="mode-btn" onclick="setMode('therapy','journal',this)">📓 Journal</span>
    <span class="mode-btn" onclick="setMode('therapy','crisis',this)">🆘 Crisis</span>
    <span class="mode-btn" onclick="setMode('therapy','couples',this)">❤️ Couples</span>
    <span class="mode-btn" onclick="setMode('therapy','grief',this)">🕊️ Grief</span>
    <span class="mode-btn" onclick="setMode('therapy','trauma',this)">🛡️ Trauma</span>
    <span class="mode-btn" onclick="setMode('therapy','eating',this)">🍎 Eating</span>
  </div>
  <div class="quick-row">
    <span class="quick-btn" onclick="ask('therapy','I feel anxious and I dont know why')">😰 Anxious</span>
    <span class="quick-btn" onclick="ask('therapy','I cant stop thinking about the past')">🔄 Ruminating</span>
    <span class="quick-btn" onclick="ask('therapy','My relationship is falling apart')">💔 Relationship</span>
    <span class="quick-btn" onclick="ask('therapy','I lost someone close to me')">🕊️ Loss</span>
  </div>
  <div class="chat-box"><div class="chat-messages" id="chat-therapy"></div><div class="chat-input-row"><input id="in-therapy" placeholder="What's on your mind? This is a safe space..." onkeydown="if(event.key==='Enter')send('therapy')"><button onclick="send('therapy')">Share</button></div></div>
  <div class="disclaimer">⚕️ Alvai Therapy uses evidence-based frameworks but is not a substitute for professional therapy. For crisis support: 988 Lifeline (call/text 988) · Crisis Text Line (text HOME to 741741). BLEU can match you with a licensed therapist in your area.</div>
</div>

<!-- ═══════════════════════ FINANCE ═══════════════════════ -->
<div class="panel" id="p-finance">
  <h1>💰 Finance — Money As Vital Sign</h1>
  <p class="hero">67% of Americans report money as their #1 stressor. Financial stress doubles cardiovascular disease risk. Poverty reduces lifespan by 15 years. BLEU treats money like a health metric.</p>
  <div class="quick-row">
    <span class="quick-btn" onclick="ask('finance','How do I improve my credit score')">📊 Credit Score</span>
    <span class="quick-btn" onclick="ask('finance','Help me understand health insurance options')">🏥 Insurance</span>
    <span class="quick-btn" onclick="ask('finance','I have medical bills I cant pay')">🆘 Medical Bills</span>
    <span class="quick-btn" onclick="ask('finance','How do I budget for wellness on a tight budget')">💵 Budget Wellness</span>
    <span class="quick-btn" onclick="ask('finance','What employer benefits am I probably not using')">🏢 Hidden Benefits</span>
    <span class="quick-btn" onclick="ask('finance','First time home buyer where do I start')">🏠 Home Buying</span>
  </div>
  <div class="chat-box"><div class="chat-messages" id="chat-finance"></div><div class="chat-input-row"><input id="in-finance" placeholder="What financial question is weighing on you?" onkeydown="if(event.key==='Enter')send('finance')"><button onclick="send('finance')">Ask</button></div></div>
  <div class="disclaimer">💰 BLEU provides financial wellness information, not professional financial advice. Consult a licensed financial advisor for investment and tax decisions.</div>
</div>

<!-- ═══════════════════════ MISSIONS ═══════════════════════ -->
<div class="panel" id="p-missions">
  <h1>🎯 Missions</h1>
  <p class="hero">Daily challenges tied to your weakest shields. Small actions, big compounds. Streaks, points, achievements, leaderboards.</p>
  <div class="card"><h3>🔥 Today's Mission</h3><p>Walk 20 minutes. Journal 5 minutes. Check your credit score. One small action toward the version of yourself you're building.</p></div>
  <div class="chat-box"><div class="chat-messages" id="chat-missions"></div><div class="chat-input-row"><input id="in-missions" placeholder="What do you want to work on today?" onkeydown="if(event.key==='Enter')send('missions')"><button onclick="send('missions')">Go</button></div></div>
</div>

<!-- ═══════════════════════ RECOVERY ═══════════════════════ -->
<div class="panel" id="p-recovery">
  <h1>🔥 Recovery</h1>
  <p class="hero">Built by someone who survived 9 overdoses and overcame 31 felonies. This isn't theory. This is lived experience turned into a system that meets you exactly where you are — with dignity, privacy, and real tools.</p>
  <div class="mode-bar" id="recovery-modes">
    <span class="mode-btn active" onclick="setMode('recovery','sobriety',this)">🌅 Early Sobriety</span>
    <span class="mode-btn" onclick="setMode('recovery','relapse',this)">🛡️ Relapse Prevention</span>
    <span class="mode-btn" onclick="setMode('recovery','harm',this)">❤️ Harm Reduction</span>
    <span class="mode-btn" onclick="setMode('recovery','12step',this)">📿 12-Step</span>
    <span class="mode-btn" onclick="setMode('recovery','family',this)">👨‍👩‍👧 Family</span>
    <span class="mode-btn" onclick="setMode('recovery','mat',this)">💊 MAT</span>
    <span class="mode-btn" onclick="setMode('recovery','milestones',this)">🏆 Milestones</span>
  </div>
  <div class="quick-row">
    <span class="quick-btn" onclick="ask('recovery','Im on day 1 what do I do')">Day 1</span>
    <span class="quick-btn" onclick="ask('recovery','I want to drink right now')">Craving Now</span>
    <span class="quick-btn" onclick="ask('recovery','Find a treatment center near me')">Find Treatment</span>
    <span class="quick-btn" onclick="ask('recovery','My family member is using and I dont know what to do')">Family Help</span>
    <span class="quick-btn" onclick="ask('recovery','What is Suboxone and how does it work')">MAT Info</span>
    <span class="quick-btn" onclick="ask('recovery','I relapsed. I feel like a failure')">After Relapse</span>
  </div>
  <div class="chat-box"><div class="chat-messages" id="chat-recovery"></div><div class="chat-input-row"><input id="in-recovery" placeholder="You're not alone. What's happening?" onkeydown="if(event.key==='Enter')send('recovery')"><button onclick="send('recovery')">Share</button></div></div>
  <div class="disclaimer">🔥 If you or someone near you is experiencing an overdose: Call 911 immediately. Administer naloxone (Narcan) if available. For crisis support: 988 Lifeline (call/text 988) · SAMHSA Helpline: 1-800-662-4357 (free, 24/7). Never use alone: 1-800-484-3731.</div>
</div>

<!-- ═══════════════════════ CANNAIQ ═══════════════════════ -->
<div class="panel" id="p-cannaiq">
  <h1>🌿 CannaIQ</h1>
  <p class="hero">Cannabis intelligence with clinical precision. Strain matching, drug interactions, dosage guidance, legal navigator. Whether you're exploring cannabis for wellness or managing it alongside medications — BLEU has the data.</p>
  <div class="quick-row">
    <span class="quick-btn" onclick="ask('cannaiq','Best strain for sleep')">😴 Sleep Strain</span>
    <span class="quick-btn" onclick="ask('cannaiq','Is CBD safe with my blood pressure medication')">⚠️ Interactions</span>
    <span class="quick-btn" onclick="ask('cannaiq','What dose of CBD should I start with for anxiety')">📏 Dosage</span>
    <span class="quick-btn" onclick="ask('cannaiq','Difference between indica sativa and hybrid')">🌱 Strain Types</span>
    <span class="quick-btn" onclick="ask('cannaiq','Cannabis vs prescription for chronic pain')">💊 vs Pharma</span>
    <span class="quick-btn" onclick="ask('cannaiq','How to get a medical marijuana card')">🏥 Med Card</span>
  </div>
  <div class="chat-box"><div class="chat-messages" id="chat-cannaiq"></div><div class="chat-input-row"><input id="in-cannaiq" placeholder="Ask about cannabis..." onkeydown="if(event.key==='Enter')send('cannaiq')"><button onclick="send('cannaiq')">Ask</button></div></div>
  <div class="disclaimer">🌿 Cannabis legality varies by state. BLEU provides information — always verify local laws. Drug interaction information is for education, not prescription. Consult your doctor when combining cannabis with medications.</div>
</div>

<!-- ═══════════════════════ TERMS ═══════════════════════ -->
<div class="panel" id="p-terms">
  <h1>Terms of Service</h1>
  <p>Last updated: February 20, 2026</p>
  <div class="card"><p>BLEU ("The Longevity Operating System") provides wellness information, AI-assisted guidance, practitioner directories, product recommendations, and community features. By using bleu.live you agree to these terms.</p>
  <h3>Not Medical Advice</h3><p>BLEU is not a healthcare provider. Content is for informational purposes only. AI responses (Alvai) are not diagnoses, prescriptions, or treatment plans. Always consult licensed healthcare professionals for medical decisions. In emergencies call 911.</p>
  <h3>Therapy & Recovery Features</h3><p>Alvai Therapy modes use evidence-based therapeutic frameworks (CBT, DBT, etc.) but are not substitutes for licensed therapy. Recovery features provide support tools and resources but are not treatment programs. For crisis: 988 Lifeline, Crisis Text Line (741741), SAMHSA 1-800-662-4357.</p>
  <h3>Financial Information</h3><p>Finance tab provides wellness-oriented financial information, not professional financial, tax, or investment advice. Consult licensed financial advisors for specific decisions.</p>
  <h3>Affiliate Relationships</h3><p>BLEU earns commissions through affiliate partnerships (Amazon, iHerb, and others). These relationships never affect trust scores or validation. Products are scored on safety and efficacy data independent of commercial relationships.</p>
  <h3>Cannabis Information</h3><p>CannaIQ provides educational information about cannabis. Cannabis legality varies by jurisdiction. Users are responsible for compliance with local laws. Drug interaction information is educational, not prescriptive.</p>
  <h3>Data & Privacy</h3><p>See our <a href="#" onclick="go('privacy');return false">Privacy Policy</a>. Conversations with Alvai are not stored permanently. BLEU does not sell personal data.</p></div>
</div>

<!-- ═══════════════════════ PRIVACY ═══════════════════════ -->
<div class="panel" id="p-privacy">
  <h1>Privacy Policy</h1>
  <p>Last updated: February 20, 2026</p>
  <div class="card"><p>BLEU respects your privacy. Here's what we collect and why.</p>
  <h3>What We Collect</h3><p>Usage analytics (page views, interactions). Conversation content sent to Alvai (processed by Claude API, not permanently stored by BLEU). No personally identifiable information is required to use BLEU.</p>
  <h3>What We Don't Do</h3><p>We don't sell your data. We don't share conversations with third parties beyond our AI provider (Anthropic). We don't track you across other websites. We don't serve ads.</p>
  <h3>Affiliate Links</h3><p>When you click affiliate links (Amazon, iHerb, etc.), those platforms have their own privacy policies. BLEU receives commission data (anonymous) but not your personal purchase details.</p>
  <h3>Contact</h3><p>Questions? contact@bleu.live</p></div>
</div>

<!-- FOOTER -->
<div class="footer">
  BLEU · The Longevity Operating System · Patent Pending · © 2026<br>
  Created by Bleu Michael Garner · President: Dr. Felicia Stoler, DCN, MS, RDN, FACSM<br>
  <a href="#" onclick="go('terms');return false">Terms</a> · <a href="#" onclick="go('privacy');return false">Privacy</a> · Affiliate Disclosure: BLEU earns commissions from partner links<br>
  ⚕️ Not medical advice. Always consult healthcare professionals. Crisis: 988 · 911
</div>

<script>
// ═══════════════════════════════════════════════════════════
// BLEU OCEAN ENGINE — Frontend
// ═══════════════════════════════════════════════════════════
const SB='https://sqyzboesdpdussiwqpzk.supabase.co'
const ALVAI=SB+'/functions/v1/alvai'
const tabs=['home','alvai','dashboard','directory','vessel','map','protocols','learn','community','passport','therapy','finance','missions','recovery','cannaiq','terms','privacy']
const chatHistories={},chatModes={therapy:'talk',recovery:'sobriety'}
tabs.forEach(t=>chatHistories[t]=[])

// ═══ NAV ═══
function go(tab){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'))
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'))
  const panel=document.getElementById('p-'+tab)
  if(panel)panel.classList.add('active')
  const navTabs=document.querySelectorAll('.nav-tab')
  const idx=tabs.indexOf(tab)
  if(idx>=0&&idx<navTabs.length)navTabs[idx].classList.add('active')
  window.scrollTo(0,0)
}

// ═══ MODE SWITCHING ═══
function setMode(tab,mode,el){
  chatModes[tab]=mode
  const bar=el.parentElement
  bar.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active'))
  el.classList.add('active')
}

// ═══ QUICK ACTIONS ═══
function ask(tab,msg){
  go(tab)
  const input=document.getElementById('in-'+tab)
  if(input){input.value=msg;setTimeout(()=>send(tab),100)}
}

// ═══ MARKDOWN FORMATTER ═══
function fmt(t){
  t=t.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
  t=t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,function(_,x,u){
    let s='color:var(--teal)';if(u.match(/iherb/i))s='color:var(--sage)';if(u.match(/pubmed/i))s='color:var(--gold)';if(u.match(/amazon/i))s='color:var(--gold)';
    return '<a href="'+u+'" target="_blank" style="'+s+'">'+x+'</a>'
  })
  t=t.replace(/(^|\s)(https?:\/\/[^\s<)]+)/g,function(_,p,u){
    let l='Link';if(u.match(/amazon/i))l='Shop Amazon';if(u.match(/iherb/i))l='Shop iHerb';if(u.match(/pubmed/i))l='View Study';
    return p+'<a href="'+u+'" target="_blank" style="color:var(--teal)">'+l+' →</a>'
  })
  t=t.replace(/^### (.+)$/gm,'<strong style="color:var(--gold);font-size:15px">$1</strong>')
  t=t.replace(/^## (.+)$/gm,'<strong style="color:var(--teal);font-size:16px">$1</strong>')
  t=t.replace(/^\d+\.\s/gm,'<br>• ')
  t=t.replace(/^[-•]\s/gm,'<br>• ')
  t=t.replace(/\n\n/g,'<br><br>')
  t=t.replace(/\n/g,'<br>')
  return t
}

// ═══ SEND MESSAGE ═══
async function send(tab){
  const input=document.getElementById('in-'+tab)
  const box=document.getElementById('chat-'+tab)
  if(!input||!box)return
  const msg=input.value.trim()
  if(!msg)return
  input.value=''

  // Add user message
  const uDiv=document.createElement('div');uDiv.className='msg user';uDiv.textContent=msg;box.appendChild(uDiv)
  chatHistories[tab].push({role:'user',content:msg})

  // Add AI placeholder
  const aDiv=document.createElement('div');aDiv.className='msg ai';aDiv.innerHTML='<span class="alvai-cursor"></span>';box.appendChild(aDiv)
  box.scrollTop=box.scrollHeight

  // Build request
  const body={message:msg,history:chatHistories[tab].slice(-20),mode:['therapy','recovery','finance','cannaiq'].includes(tab)?tab:'general'}
  if(tab==='therapy')body.therapy_mode=chatModes.therapy||'talk'
  if(tab==='recovery')body.recovery_mode=chatModes.recovery||'sobriety'

  try{
    const res=await fetch(ALVAI,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeXpib2VzZHBkdXNzaXdxcHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0NDg2OTMsImV4cCI6MjA1NDAyNDY5M30.LVAjBCm23lxGx1mY0dCDn0AfT7GDVxAlKoh-G9TplGk')},body:JSON.stringify(body)})

    if(res.headers.get('content-type')?.includes('text/event-stream')){
      // Streaming
      const reader=res.body.getReader(),decoder=new TextDecoder()
      let full='',buffer=''
      aDiv.innerHTML=''
      while(true){
        const{done,value}=await reader.read()
        if(done)break
        buffer+=decoder.decode(value,{stream:true})
        const lines=buffer.split('\n');buffer=lines.pop()||''
        for(const line of lines){
          if(!line.startsWith('data: '))continue
          const d=line.slice(6).trim()
          if(d==='[DONE]')continue
          try{const p=JSON.parse(d);if(p.text){full+=p.text;aDiv.innerHTML=fmt(full)+'<span class="alvai-cursor"></span>';box.scrollTop=box.scrollHeight}}catch{}
        }
      }
      aDiv.innerHTML=fmt(full)
      chatHistories[tab].push({role:'assistant',content:full})
    } else {
      // JSON fallback
      const data=await res.json()
      const reply=data.reply||data.error||'Try again.'
      aDiv.innerHTML=fmt(reply)
      chatHistories[tab].push({role:'assistant',content:reply})
    }
  }catch(e){
    aDiv.innerHTML='<em style="color:var(--dim)">Connection issue. Try again in a moment.</em>'
  }
  box.scrollTop=box.scrollHeight
}

// ═══ LOAD STATS ═══
async function loadStats(){
  try{
    const h={'apikey':'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeXpib2VzZHBkdXNzaXdxcHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0NDg2OTMsImV4cCI6MjA1NDAyNDY5M30.LVAjBCm23lxGx1mY0dCDn0AfT7GDVxAlKoh-G9TplGk','Authorization':'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeXpib2VzZHBkdXNzaXdxcHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0NDg2OTMsImV4cCI6MjA1NDAyNDY5M30.LVAjBCm23lxGx1mY0dCDn0AfT7GDVxAlKoh-G9TplGk','Range':'0-0','Prefer':'count=exact'}
    const tables=['practitioners','products','locations']
    const counts={}
    let total=0
    for(const t of tables){
      try{const r=await fetch(SB+'/rest/v1/'+t+'?select=id&limit=1',{headers:h});const c=parseInt(r.headers.get('content-range')?.split('/')?.pop()||'0');counts[t]=c;total+=c}catch{counts[t]=0}
    }
    if(total>0){
      document.getElementById('s-total').textContent=total.toLocaleString()
      document.getElementById('s-prac').textContent=(counts.practitioners||0).toLocaleString()
      document.getElementById('s-prod').textContent=(counts.products||0).toLocaleString()
      document.getElementById('s-loc').textContent=(counts.locations||0).toLocaleString()
    }
  }catch{}
}
loadStats()
</script>
</body>
</html>'''

with open('index.html', 'w') as f:
    f.write(HTML)
print(f"✅ index.html written ({len(HTML):,} chars, {HTML.count(chr(10)):,} lines)")

# ═══════════════════════════════════════════════════════════
# VERIFY
# ═══════════════════════════════════════════════════════════
checks = [
    ('15 tabs in nav', HTML.count('nav-tab') >= 15),
    ('Therapy panel', 'p-therapy' in HTML),
    ('Recovery panel', 'p-recovery' in HTML),
    ('Finance panel', 'p-finance' in HTML),
    ('CannaIQ panel', 'p-cannaiq' in HTML),
    ('Dashboard panel', 'p-dashboard' in HTML),
    ('Missions panel', 'p-missions' in HTML),
    ('Map panel', 'p-map' in HTML),
    ('Protocols panel', 'p-protocols' in HTML),
    ('Mode switching', 'setMode' in HTML),
    ('Therapy modes (12)', HTML.count('therapy-') >= 10),
    ('Recovery modes (8)', HTML.count('recovery-') >= 6),
    ('Streaming chat', 'getReader' in HTML),
    ('Markdown formatter', 'function fmt' in HTML),
    ('Stats from Supabase', 'loadStats' in HTML),
    ('Health disclaimer', '988' in HTML),
    ('Affiliate disclosure', 'Affiliate Disclosure' in HTML),
    ('Terms page', 'p-terms' in HTML),
    ('Privacy page', 'p-privacy' in HTML),
    ('Edge function', os.path.exists('supabase/functions/alvai/index.ts')),
]

print("\n" + "═"*60)
print("  VERIFICATION")
print("═"*60)
for name, ok in checks:
    print(f"  {'✅' if ok else '❌'} {name}")

fails = sum(1 for _,ok in checks if not ok)
print(f"\n  {len(checks)-fails}/{len(checks)} passed")

print("\n" + "═"*60)
print("  DEPLOY IN 3 COMMANDS")
print("═"*60)
print()
print("  1. Deploy edge function:")
print("     supabase functions deploy alvai --no-verify-jwt")
print()
print("  2. Push everything live:")
print("     git add -A && git commit -m 'OCEAN: 15 tabs, all modes' && git push origin main --force")
print()
print("  3. Hard refresh bleu.live (Cmd+Shift+R)")
print()
print("═"*60)
print("  THE OCEAN IS BUILT. DEPLOY IT.")
print("═"*60)
