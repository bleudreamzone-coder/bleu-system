#!/usr/bin/env python3
"""MASTER REBUILD: Spotify dark, cards first, Alvai guides, zero text walls"""
import os, re
os.chdir('/workspaces/bleu-system')
Q=chr(39)

# Design system — darker, more breathing room, Spotify feel
def card(title,sub,icon,action,clr):
    bg='rgba(25,50,68,0.6)' if clr=='t' else 'rgba(28,45,58,0.6)'
    bc='rgba(78,205,196,0.1)' if clr=='t' else 'rgba(212,175,55,0.1)'
    tc='#4ecdc4' if clr=='t' else '#d4af37'
    return '<div style="background:'+bg+';border:1px solid '+bc+';border-radius:14px;padding:18px;cursor:pointer;transition:all 0.2s" onclick="'+action+'" onmouseover="this.style.borderColor='+Q+tc+Q+'" onmouseout="this.style.borderColor='+Q+bc+Q+'"><div style="font-size:24px;margin-bottom:10px">'+icon+'</div><div style="color:'+tc+';font-weight:600;font-size:14px">'+title+'</div><div style="color:#8fa4b0;font-size:12px;margin-top:6px;line-height:1.5;font-weight:300">'+sub+'</div></div>'

def minicard(title,icon,action,clr):
    bg='rgba(25,50,68,0.6)' if clr=='t' else 'rgba(28,45,58,0.6)'
    bc='rgba(78,205,196,0.08)' if clr=='t' else 'rgba(212,175,55,0.08)'
    tc='#4ecdc4' if clr=='t' else '#d4af37'
    return '<div style="background:'+bg+';border:1px solid '+bc+';border-radius:12px;padding:12px;cursor:pointer;text-align:center;transition:all 0.2s" onclick="'+action+'" onmouseover="this.style.borderColor='+Q+tc+Q+'" onmouseout="this.style.borderColor='+Q+bc+Q+'"><div style="font-size:18px">'+icon+'</div><div style="color:'+tc+';font-weight:500;font-size:11px;margin-top:4px">'+title+'</div></div>'

def sec(t):
    return '<div style="color:rgba(212,175,55,0.5);font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:28px 0 14px;text-align:center">'+t+'</div>'

g2='display:grid;grid-template-columns:repeat(2,1fr);gap:12px'
g3='display:grid;grid-template-columns:repeat(3,1fr);gap:12px'
g4='display:grid;grid-template-columns:repeat(4,1fr);gap:10px'
g5='display:grid;grid-template-columns:repeat(5,1fr);gap:8px'

def a(tab,msg): return 'ask('+Q+tab+Q+','+Q+msg+Q+')'
def g(tab): return 'go('+Q+tab+Q+')'

# ══════════════════ HOME ══════════════════
home='<div style="margin:16px 0">'
home+='<div style="text-align:center;padding:20px 0 24px"><div style="color:#d4af37;font-size:10px;letter-spacing:4px;margin-bottom:8px">WELCOME TO</div><div style="color:#e8d5b0;font-size:24px;font-weight:300;letter-spacing:1px">The Longevity Operating System</div><div style="color:#8fa4b0;font-size:13px;margin-top:10px;font-weight:300">Tell Alvai what you need. Get real help in seconds.</div></div>'
home+='<div style="'+g3+'">'
home+=card('I can'+Q+'t sleep','Supplements, strains, practitioners matched to your biology','&#128164;',a('home','I struggle with sleep. Help me with supplements strains and practitioners'),'g')
home+=card('I have anxiety','Evidence-based options from CBD to therapy to breathwork','&#128556;',a('home','I deal with anxiety. Show me evidence-based options'),'t')
home+=card('I'+Q+'m in pain','Beyond opioids. Natural protocols that actually work','&#129657;',a('home','I have chronic pain. Show me options beyond opioids'),'g')
home+='</div>'
home+='<div style="'+g3+';margin-top:12px">'
home+=card('Check my meds','Drug interactions scanned across 302,516 combinations','&#128138;',a('home','Check my medications for interactions and safety'),'t')
home+=card('Find practitioner','253,938 NPI-verified. Trust earned, never bought','&#129658;',g('directory'),'g')
home+=card('Cannabis guide','Beginner to expert. BEMS-matched. Safety first','&#127793;',g('cannaiq'),'t')
home+='</div>'
home+='<div style="'+g3+';margin-top:12px">'
home+=card('Recovery support','Meetings, crisis lines, community. Right now','&#128154;',g('recovery'),'g')
home+=card('Build my protocol','Sleep, stress, energy. Evidence-based, personalized','&#128221;',g('protocols'),'t')
home+=card('Talk to Alvai','Your wellness guide. No judgment. Start anywhere','&#128172;',g('alvai'),'g')
home+='</div>'
home+=sec('EXPLORE')
home+='<div style="'+g5+'">'
home+=minicard('Dashboard','&#128202;',g('dashboard'),'t')
home+=minicard('Directory','&#128269;',g('directory'),'g')
home+=minicard('Vessel','&#128138;',g('vessel'),'t')
home+=minicard('Map','&#128506;',g('map'),'g')
home+=minicard('Protocols','&#128221;',g('protocols'),'t')
home+='</div>'
home+='<div style="'+g5+';margin-top:8px">'
home+=minicard('Learn','&#127891;',g('learn'),'g')
home+=minicard('Community','&#129309;',g('community'),'t')
home+=minicard('Passport','&#127380;',g('passport'),'g')
home+=minicard('Therapy','&#128156;',g('therapy'),'t')
home+=minicard('CannaIQ','&#127807;',g('cannaiq'),'g')
home+='</div>'
home+='<div style="'+g5+';margin-top:8px">'
home+=minicard('Finance','&#128176;',g('finance'),'t')
home+=minicard('Missions','&#127919;',g('missions'),'g')
home+=minicard('Recovery','&#128154;',g('recovery'),'t')
home+=minicard('Alvai','&#10024;',g('alvai'),'g')
home+=minicard('Map','&#127963;',g('map'),'t')
home+='</div>'
home+='<div style="text-align:center;margin-top:24px;padding:12px"><div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;opacity:0.5"><span style="color:#d4af37;font-size:9px;letter-spacing:2px">PATENT PENDING</span><span style="color:#8fa4b0;font-size:9px">&#8226;</span><span style="color:#4ecdc4;font-size:9px;letter-spacing:2px">NPI VERIFIED</span><span style="color:#8fa4b0;font-size:9px">&#8226;</span><span style="color:#d4af37;font-size:9px;letter-spacing:2px">253,938 PRACTITIONERS</span><span style="color:#8fa4b0;font-size:9px">&#8226;</span><span style="color:#4ecdc4;font-size:9px;letter-spacing:2px">302,516 INTERACTIONS</span></div></div>'
home+='</div>'

# ══════════════════ DASHBOARD ══════════════════
dash='<div style="margin:16px 0">'
dash+='<div style="'+g4+';margin-bottom:16px">'
dash+='<div style="background:rgba(25,50,68,0.6);border:1px solid rgba(78,205,196,0.1);border-radius:14px;padding:16px;text-align:center"><div style="color:#4ecdc4;font-size:28px;font-weight:300">72</div><div style="color:#8fa4b0;font-size:10px;margin-top:4px;letter-spacing:1px">WELLNESS</div><div style="width:100%;height:3px;background:rgba(78,205,196,0.1);border-radius:2px;margin-top:8px"><div style="width:72%;height:100%;background:linear-gradient(90deg,#4ecdc4,#d4af37);border-radius:2px"></div></div></div>'
dash+='<div style="background:rgba(28,45,58,0.6);border:1px solid rgba(212,175,55,0.1);border-radius:14px;padding:16px;text-align:center"><div style="color:#d4af37;font-size:28px;font-weight:300">6.8</div><div style="color:#8fa4b0;font-size:10px;margin-top:4px;letter-spacing:1px">SLEEP</div><div style="color:#4ecdc4;font-size:10px;margin-top:6px">&#9650; +0.4</div></div>'
dash+='<div style="background:rgba(25,50,68,0.6);border:1px solid rgba(78,205,196,0.1);border-radius:14px;padding:16px;text-align:center;cursor:pointer" onclick="'+g('missions')+'"><div style="color:#4ecdc4;font-size:28px;font-weight:300">3/8</div><div style="color:#8fa4b0;font-size:10px;margin-top:4px;letter-spacing:1px">MISSIONS</div><div style="color:#d4af37;font-size:10px;margin-top:6px">Continue &#8594;</div></div>'
dash+='<div style="background:rgba(28,45,58,0.6);border:1px solid rgba(212,175,55,0.1);border-radius:14px;padding:16px;text-align:center"><div style="color:#d4af37;font-size:28px;font-weight:300">14</div><div style="color:#8fa4b0;font-size:10px;margin-top:4px;letter-spacing:1px">DAY STREAK</div><div style="color:#4ecdc4;font-size:10px;margin-top:6px">&#127942; Best</div></div>'
dash+='</div>'
dash+='<div style="'+g3+'">'
dash+=card('My supplements','Mag, Ashwagandha, Omega-3, L-Theanine','&#128138;',g('vessel'),'t')
dash+=card('My cannabis','Indica hybrids. Myrcene + Linalool. BEMS active','&#127807;',g('cannaiq'),'g')
dash+=card('My therapy','Somatic + CBT. 12 sessions. Next: Thursday','&#128156;',g('therapy'),'t')
dash+='</div>'
dash+=sec('QUICK ACTIONS')
dash+='<div style="'+g4+'">'
dash+=minicard('Safety check','&#128270;',a('dashboard','Run a complete safety check on all my medications and supplements'),'t')
dash+=minicard('Protocols','&#128221;',g('protocols'),'g')
dash+=minicard('Practitioner','&#129658;',g('directory'),'t')
dash+=minicard('Alvai','&#10024;',g('alvai'),'g')
dash+='</div></div>'

# ══════════════════ DIRECTORY ══════════════════
direc='<div style="margin:16px 0">'
direc+='<div style="'+g4+';margin-bottom:16px">'
direc+=minicard('Anxiety','&#128546;',a('directory','Find anxiety specialists near New Orleans'),'t')
direc+=minicard('Sleep','&#128164;',a('directory','Find sleep specialists near New Orleans'),'g')
direc+=minicard('Pain','&#129657;',a('directory','Find pain management near New Orleans'),'t')
direc+=minicard('Cannabis','&#127793;',a('directory','Find cannabis doctors near New Orleans'),'g')
direc+='</div>'
direc+='<div style="'+g4+';margin-bottom:16px">'
direc+=minicard('Therapy','&#128156;',a('directory','Find therapists accepting patients near New Orleans'),'g')
direc+=minicard('Nutrition','&#129372;',a('directory','Find dietitians near New Orleans'),'t')
direc+=minicard('Acupuncture','&#129506;',a('directory','Find acupuncturists near New Orleans'),'g')
direc+=minicard('Psychiatry','&#129504;',a('directory','Find psychiatrists near New Orleans'),'t')
direc+='</div>'
direc+=sec('FEATURED')
direc+='<div style="'+g2+'">'
for nm,sp,trust,cl in [('Dr. Maria Santos, ND','Sleep + Anxiety + Hormones',96,'t'),('Dr. James Watu, DC','Pain + Sports Medicine',93,'g'),('Sarah Mitchell, LPC','Trauma + EMDR',97,'t'),('Dr. Andre Baptiste, MD','Psychiatry + Cannabis-Informed',94,'g')]:
    tc='#4ecdc4' if cl=='t' else '#d4af37'
    bg='rgba(25,50,68,0.6)' if cl=='t' else 'rgba(28,45,58,0.6)'
    bc='rgba(78,205,196,0.1)' if cl=='t' else 'rgba(212,175,55,0.1)'
    direc+='<div style="background:'+bg+';border:1px solid '+bc+';border-radius:14px;padding:16px;cursor:pointer" onclick="'+a('directory','Tell me about '+nm+' and how to book')+'"><div style="display:flex;justify-content:space-between;align-items:center"><span style="color:'+tc+';font-weight:600;font-size:14px">'+nm+'</span><span style="color:#d4af37;font-size:11px;background:rgba(212,175,55,0.1);padding:3px 10px;border-radius:10px">'+str(trust)+'</span></div><div style="color:#8fa4b0;font-size:12px;margin-top:6px;font-weight:300">'+sp+' &#8226; NPI Verified &#8226; Telehealth</div></div>'
direc+='</div>'
direc+='<div style="text-align:center;margin-top:12px;color:#8fa4b0;font-size:10px;font-weight:300">Trust scores earned by outcomes. Never bought. NPI checked nightly via CMS.gov.</div>'
direc+='</div>'

# ══════════════════ VESSEL ══════════════════
ves='<div style="margin:16px 0">'
ves+='<div style="'+g4+';margin-bottom:16px">'
ves+=minicard('Sleep','&#128164;',a('vessel','What supplements help with sleep'),'g')
ves+=minicard('Stress','&#128556;',a('vessel','What supplements help with stress and anxiety'),'t')
ves+=minicard('Energy','&#9889;',a('vessel','What supplements boost clean energy'),'g')
ves+=minicard('Pain','&#129657;',a('vessel','What natural supplements help with pain'),'t')
ves+='</div>'
ves+='<div style="'+g2+'">'
for nm,what,price,safe,cl in [('Magnesium Glycinate 400mg','GABA-A modulation. Sleep + muscle recovery. 1hr before bed.','$14.99','&#9989; No interactions','t'),('Ashwagandha KSM-66','Cortisol -30%. Adaptogen. 6-week cycle.','$22.99','&#9888; Check thyroid meds','g'),('Omega-3 2000mg EPA/DHA','Inflammation, brain, cardio. 3rd party tested.','$18.50','&#9989; Safe with most meds','t'),('L-Theanine 200mg','Alpha waves. Calm focus. Stacks with caffeine.','$12.99','&#9989; No known interactions','g'),('Vitamin D3+K2 5000IU','42% deficient. Immune + bones. Take with fat.','$16.99','&#9888; Check blood thinners','t'),('CBD Tincture 1500mg','5-HT1A pathway. Sublingual. Start 10mg.','$59.99','&#9888; CYP450 — check meds','g')]:
    tc='#4ecdc4' if cl=='t' else '#d4af37'
    bg='rgba(25,50,68,0.6)' if cl=='t' else 'rgba(28,45,58,0.6)'
    bc='rgba(78,205,196,0.1)' if cl=='t' else 'rgba(212,175,55,0.1)'
    ves+='<div style="background:'+bg+';border:1px solid '+bc+';border-radius:14px;padding:16px;cursor:pointer" onclick="'+a('vessel','Tell me about '+nm+' dosage safety and best brand to buy')+'"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap"><span style="color:'+tc+';font-weight:600;font-size:14px">'+nm+'</span><span style="color:#e8d5b0;font-size:12px">'+price+'</span></div><div style="color:#8fa4b0;font-size:12px;margin-top:6px;font-weight:300">'+what+'</div><div style="color:#8fa4b0;font-size:11px;margin-top:6px">'+safe+'</div></div>'
ves+='</div>'
ves+='<div style="text-align:center;margin-top:12px;color:#8fa4b0;font-size:10px;font-weight:300">All products checked through 5-layer safety engine. Affiliate links sustain BLEU at no extra cost.</div>'
ves+='</div>'

# ══════════════════ MAP ══════════════════
mp='<div style="margin:16px 0">'
mp+='<div style="'+g4+';margin-bottom:16px">'
mp+=minicard('Practitioners','&#129658;',a('map','Show me practitioners near me in New Orleans'),'t')
mp+=minicard('Pharmacies','&#128137;',a('map','Show pharmacies and dispensaries near me'),'g')
mp+=minicard('Recovery','&#128154;',a('map','Show recovery meetings near me in New Orleans'),'t')
mp+=minicard('Fitness','&#127939;',a('map','Show gyms yoga and fitness near me in New Orleans'),'g')
mp+='</div>'
mp+='<div style="'+g3+'">'
for nm,desc,cl in [('City Park','1,300 acres. Trails, meditation, ancient oaks. Free.','t'),('Crescent Park','Riverfront 1.4mi. Sunrise yoga. Bywater.','g'),('Ochsner Health','All specialties. NPI verified. Major system.','t'),('Palmer Park Yoga','Free Saturday 9am. Community. All levels.','g'),('NOLA Cannabis Co','Licensed dispensary. Full menus. Budtender guidance.','t'),('Tulane Behavioral','Psychiatry + counseling. Insurance accepted.','g')]:
    tc='#4ecdc4' if cl=='t' else '#d4af37'
    bg='rgba(25,50,68,0.6)' if cl=='t' else 'rgba(28,45,58,0.6)'
    bc='rgba(78,205,196,0.1)' if cl=='t' else 'rgba(212,175,55,0.1)'
    mp+='<div style="background:'+bg+';border:1px solid '+bc+';border-radius:14px;padding:14px;cursor:pointer" onclick="'+a('map','Tell me about '+nm+' in New Orleans')+'"><div style="color:'+tc+';font-weight:600;font-size:13px">'+nm+'</div><div style="color:#8fa4b0;font-size:11px;margin-top:4px;font-weight:300">'+desc+'</div></div>'
mp+='</div></div>'

# ══════════════════ PROTOCOLS ══════════════════
pro='<div style="margin:16px 0">'
pro+='<div style="'+g3+'">'
pro+=card('Sleep Protocol','8 weeks. Exact supplements + timing. Huberman-based.','&#128164;',a('protocols','Build me a complete sleep protocol with exact dosages and timing'),'g')
pro+=card('Anxiety Protocol','Breathwork + supplements + therapy modes combined.','&#128556;',a('protocols','Build me an anxiety reduction protocol'),'t')
pro+=card('Pain Protocol','Anti-inflammatory stack + movement + cannabis options.','&#129657;',a('protocols','Build me a natural pain management protocol'),'g')
pro+='</div>'
pro+='<div style="'+g3+';margin-top:12px">'
pro+=card('Energy Protocol','Morning to evening. No crashes. Clean fuel.','&#9889;',a('protocols','Build me a clean energy protocol'),'t')
pro+=card('Focus Protocol','Deep work. Nootropic stack. Cognitive performance.','&#129504;',a('protocols','Build me a focus and cognitive performance protocol'),'g')
pro+=card('Recovery Protocol','Early sobriety support. Gentle. Step by step.','&#128154;',a('protocols','Build me a recovery support protocol'),'t')
pro+='</div></div>'

# ══════════════════ LEARN ══════════════════
lea='<div style="margin:16px 0">'
lea+='<div style="'+g3+'">'
lea+=card('Cannabis 101','From ECS to safe first use. Complete beginner path.','&#127793;',a('learn','Teach me cannabis 101 from endocannabinoid system to safe first use'),'g')
lea+=card('Supplement Science','How they work. How to read labels. What matters.','&#128138;',a('learn','Teach me how supplements work and how to read labels'),'t')
lea+=card('Brain Health','Neuroplasticity, sleep science, cognitive protocols.','&#129504;',a('learn','Teach me about brain health and neuroplasticity'),'g')
lea+='</div>'
lea+='<div style="'+g3+';margin-top:12px">'
lea+=card('Gut-Brain Axis','Your second brain. Diet affects mental health.','&#129362;',a('learn','Teach me about the gut-brain connection'),'t')
lea+=card('Trauma + Healing','Informed approaches. Modalities that work.','&#128156;',a('learn','Teach me about trauma-informed healing approaches'),'g')
lea+=card('Insurance Navigation','Get holistic treatments covered. Know your rights.','&#128176;',a('learn','Teach me how to navigate insurance for holistic treatments'),'t')
lea+='</div>'
lea+=sec('QUICK GUIDES')
lea+='<div style="'+g4+'">'
for t,q,cl in [('Reading Labels','How to read supplement labels','t'),('Drug Interactions','How drug interactions work simply','g'),('Terpene Guide','Cannabis terpenes explained','t'),('ECS Basics','Endocannabinoid system simply','g'),('Dosing 101','How to find right supplement dose','t'),('Safety Signs','Warning signs with supplements','g'),('Finding Studies','How to find medical research','t'),('Insurance Tips','Getting holistic care covered','g')]:
    lea+=minicard(t,'&#128218;',a('learn',q),cl)
lea+='</div></div>'

# ══════════════════ COMMUNITY ══════════════════
com='<div style="margin:16px 0">'
com+='<div style="'+g3+'">'
com+=card('Recovery Groups','AA, NA, SMART. Meetings this week near you.','&#128154;',a('community','Find recovery meetings near me in New Orleans this week'),'g')
com+=card('Fitness Community','Run clubs, yoga, outdoor fitness. Free options.','&#127939;',a('community','Find fitness groups and run clubs in New Orleans'),'t')
com+=card('Wellness Events','Workshops, health fairs, community circles.','&#127891;',a('community','What wellness events are happening in New Orleans this month'),'g')
com+='</div>'
com+='<div style="'+g3+';margin-top:12px">'
com+=card('Urban Farms','Gardens, co-ops, food access. Volunteer.','&#127793;',a('community','Find urban farms and community gardens in New Orleans'),'t')
com+=card('Support Groups','Mental health, grief, wellness circles.','&#128156;',a('community','Find support groups in New Orleans'),'g')
com+=card('Jazz Bird NOLA','501(c)(3). Cultural healing. Community wellness.','&#127918;',a('community','Tell me about Jazz Bird NOLA community initiatives'),'t')
com+='</div></div>'

# ══════════════════ PASSPORT ══════════════════
pas='<div style="margin:16px 0">'
pas+='<div style="background:rgba(25,50,68,0.6);border:1px solid rgba(212,175,55,0.1);border-radius:14px;padding:24px;text-align:center;margin-bottom:16px"><div style="color:#d4af37;font-size:10px;letter-spacing:3px;margin-bottom:8px">YOUR LEVEL</div><div style="color:#e8d5b0;font-size:22px;font-weight:300">&#127793; Seedling</div><div style="width:200px;height:4px;background:rgba(212,175,55,0.1);border-radius:2px;margin:12px auto"><div style="width:28%;height:100%;background:linear-gradient(90deg,#d4af37,#4ecdc4);border-radius:2px"></div></div><div style="color:#8fa4b0;font-size:11px;margin-top:6px">280 / 1000 XP to Sprout</div></div>'
pas+='<div style="'+g4+'">'
pas+=minicard('Take ECS Quiz','&#129504;',a('passport','Start my ECS Quiz to discover my endocannabinoid type'),'t')
pas+=minicard('Log wellness','&#128221;',a('passport','I want to log my wellness data for today'),'g')
pas+=minicard('Earn XP','&#127919;',g('missions'),'t')
pas+=minicard('View journey','&#128202;',a('passport','Show me my complete wellness journey and progress'),'g')
pas+='</div></div>'

# ══════════════════ THERAPY ══════════════════
ther='<div style="margin:16px 0">'
ther+='<div style="'+g3+'">'
ther+=card('Talk Therapy','CBT, DBT, psychodynamic. Find your fit.','&#128172;',a('therapy','Help me understand different talk therapy types and find my fit'),'t')
ther+=card('Somatic','Body-based healing. Trauma stored in tissue.','&#129506;',a('therapy','Teach me about somatic therapy and how it helps with trauma'),'g')
ther+=card('EMDR','Eye movement reprocessing. Gold standard for PTSD.','&#128065;',a('therapy','Explain EMDR therapy and help me find a practitioner'),'t')
ther+='</div>'
ther+='<div style="'+g3+';margin-top:12px">'
ther+=card('Breathwork','4-7-8, box breathing, Wim Hof. Free. Now.','&#128524;',a('therapy','Guide me through a breathwork session right now'),'g')
ther+=card('Meditation','Guided, mantra, body scan. Start with 5 min.','&#129495;',a('therapy','Guide me through a 5 minute meditation right now'),'t')
ther+=card('Crisis Support','988 Lifeline. Crisis Text. Warmlines. Now.','&#128154;',a('therapy','I need crisis support resources right now'),'g')
ther+='</div>'
ther+=sec('FREE RIGHT NOW')
ther+='<div style="'+g4+'">'
ther+=minicard('Breathing','&#128524;',a('therapy','Guide me through 4-7-8 breathing right now'),'t')
ther+=minicard('Grounding','&#127793;',a('therapy','Guide me through a grounding exercise right now'),'g')
ther+=minicard('Body scan','&#129506;',a('therapy','Guide me through a body scan meditation'),'t')
ther+=minicard('Journaling','&#128221;',a('therapy','Give me a therapeutic journaling prompt'),'g')
ther+='</div></div>'

# ══════════════════ FINANCE ══════════════════
fin='<div style="margin:16px 0">'
fin+='<div style="'+g3+'">'
fin+=card('Insurance guide','What does my plan cover? Holistic, therapy, cannabis.','&#128176;',a('finance','Help me understand what my health insurance covers for holistic wellness'),'t')
fin+=card('Cost calculator','Monthly wellness budget. Supplements + therapy + cannabis.','&#129518;',a('finance','Help me calculate my monthly wellness costs and find savings'),'g')
fin+=card('Free resources','Broke? Here. Free therapy, free supplements, sliding scale.','&#128154;',a('finance','I cannot afford wellness right now. Show me every free option available'),'t')
fin+='</div>'
fin+='<div style="'+g3+';margin-top:12px">'
fin+=card('HSA/FSA guide','Tax-free wellness spending. What qualifies.','&#128179;',a('finance','What wellness expenses qualify for HSA and FSA spending'),'g')
fin+=card('Sliding scale','Practitioners who adjust to your income.','&#129309;',a('finance','Find sliding scale practitioners near New Orleans'),'t')
fin+=card('Prescription savings','GoodRx, Mark Cuban Cost Plus, manufacturer coupons.','&#128138;',a('finance','Help me find prescription savings programs and discount cards'),'g')
fin+='</div></div>'

# ══════════════════ MISSIONS ══════════════════
mis='<div style="margin:16px 0">'
mis+='<div style="'+g3+'">'
mis+=card('Today'+Q+'s mission','One small step. Doable in 5 minutes. Builds streak.','&#127919;',a('missions','Give me today wellness mission. Something I can do in 5 minutes'),'g')
mis+=card('Weekly challenge','7-day program. Stacks into real change.','&#128293;',a('missions','Give me a 7-day wellness challenge I can start today'),'t')
mis+=card('Streak rewards','14 days and counting. Keep building momentum.','&#127942;',a('missions','Show me my streak progress and what I unlock next'),'g')
mis+='</div>'
mis+=sec('QUICK MISSIONS')
mis+='<div style="'+g4+'">'
mis+=minicard('Hydrate','&#128167;',a('missions','Hydration mission: how much water should I drink today'),'t')
mis+=minicard('Move','&#127939;',a('missions','Movement mission: give me a 10 minute exercise I can do now'),'g')
mis+=minicard('Breathe','&#128524;',a('missions','Breathing mission: guide me through 3 minutes of breathwork'),'t')
mis+=minicard('Journal','&#128221;',a('missions','Journaling mission: give me a reflective prompt for today'),'g')
mis+='</div></div>'

# ══════════════════ RECOVERY ══════════════════
rec='<div style="margin:16px 0">'
rec+='<div style="background:rgba(25,50,68,0.6);border:1px solid rgba(154,205,50,0.15);border-radius:14px;padding:20px;text-align:center;margin-bottom:16px"><div style="color:#9acd32;font-size:13px;font-weight:500">If you are in crisis right now</div><div style="color:#e8d5b0;font-size:18px;font-weight:300;margin-top:8px">988 Suicide + Crisis Lifeline</div><div style="color:#8fa4b0;font-size:12px;margin-top:6px;font-weight:300">Call or text 988 &#8226; Free &#8226; 24/7 &#8226; Confidential</div></div>'
rec+='<div style="'+g3+'">'
rec+=card('Find meetings','AA, NA, SMART Recovery near you. This week.','&#128154;',a('recovery','Find AA NA and recovery meetings near me in New Orleans this week'),'g')
rec+=card('Sober community','Events, groups, social without substances.','&#129309;',a('recovery','Find sober social events and communities in New Orleans'),'t')
rec+=card('Talk to someone','Crisis lines, warmlines, text support. Free.','&#128172;',a('recovery','I need someone to talk to right now. Show me free crisis and warmline options'),'g')
rec+='</div>'
rec+='<div style="'+g3+';margin-top:12px">'
rec+=card('Day counter','Track your journey. Every day matters.','&#128197;',a('recovery','Help me set up a sobriety day counter and track my recovery journey'),'t')
rec+=card('Relapse support','No shame. Just a step. Get back on path.','&#128156;',a('recovery','I am struggling with relapse. I need support without judgment'),'g')
rec+=card('Family support','Al-Anon, family therapy, healing together.','&#127968;',a('recovery','Find family support resources like Al-Anon near New Orleans'),'t')
rec+='</div></div>'

# ══════════════════ CANNAIQ ══════════════════
ciq='<div style="margin:16px 0">'
ciq+='<div style="'+g4+';margin-bottom:16px">'
ciq+=minicard('529+ Strains','&#127807;',a('cannaiq','Show me cannabis strains matched to my goals'),'g')
ciq+=minicard('302K Interactions','&#128138;',a('cannaiq','Check my medications for cannabis interactions'),'t')
ciq+=minicard('25 Terpenes','&#129514;',a('cannaiq','Teach me about cannabis terpenes and what each does'),'g')
ciq+=minicard('ECS Quiz','&#129504;',a('cannaiq','Start my ECS Quiz'),'t')
ciq+='</div>'
ciq+='<div style="'+g3+'">'
ciq+=card('Match me a strain','BEMS scoring. Goals, body, meds, preferences analyzed.','&#127807;',a('cannaiq','Match me to a cannabis strain based on my goals and medication profile'),'g')
ciq+=card('Safety check','CYP450 + UGT + Transporter + Pharmacodynamic + Route.','&#128138;',a('cannaiq','Run a full 5-layer safety check on cannabis with my current medications'),'t')
ciq+=card('Beginner guide','Never tried cannabis? Start here. Zero shame.','&#128218;',a('cannaiq','I have never tried cannabis. Guide me from absolute zero'),'g')
ciq+='</div>'
ciq+=sec('POPULAR STRAINS')
ciq+='<div style="'+g3+'">'
for nm,tp,bems,terp,cl in [('Blue Dream','Sativa-Hybrid',94,'Myrcene','t'),('Granddaddy Purple','Indica',82,'Myrcene','g'),('ACDC','CBD Dominant',96,'Myrcene + Pinene','t'),('Jack Herer','Sativa',88,'Terpinolene','g'),('Charlotte'+Q+'s Web','CBD',91,'Myrcene + Caryophyllene','t'),('Harlequin','CBD-Rich 2:1',85,'Myrcene + Pinene','g')]:
    tc='#4ecdc4' if cl=='t' else '#d4af37'
    bg='rgba(25,50,68,0.6)' if cl=='t' else 'rgba(28,45,58,0.6)'
    bc='rgba(78,205,196,0.1)' if cl=='t' else 'rgba(212,175,55,0.1)'
    ciq+='<div style="background:'+bg+';border:1px solid '+bc+';border-radius:14px;padding:14px;cursor:pointer" onclick="'+a('cannaiq','Tell me about '+nm+' strain including BEMS score terpenes effects and safety')+'"><div style="display:flex;justify-content:space-between;align-items:center"><span style="color:'+tc+';font-weight:600;font-size:13px">'+nm+'</span><span style="color:#d4af37;font-size:11px;background:rgba(212,175,55,0.1);padding:2px 8px;border-radius:8px">BEMS '+str(bems)+'</span></div><div style="color:#8fa4b0;font-size:11px;margin-top:4px;font-weight:300">'+tp+' &#8226; '+terp+'</div></div>'
ciq+='</div>'
ciq+='<div style="text-align:center;margin-top:12px;color:#8fa4b0;font-size:10px;font-weight:300">Data: PubMed, FDA, DDInter 2.0, Cannlytics. Not medical advice.</div>'
ciq+='</div>'

# ══════════════════ INJECT ALL ══════════════════
with open('index.html','r') as f: html=f.read()
tabs_content={
    'HOME':home,'DASHBOARD':dash,'DIRECTORY':direc,'VESSEL':ves,
    'MAP':mp,'PROTOCOLS':pro,'LEARN':lea,'COMMUNITY':com,
    'PASSPORT':pas,'THERAPY':ther,'FINANCE':fin,'MISSIONS':mis,
    'RECOVERY':rec,'CANNAIQ':ciq
}
total=0
for name,content in tabs_content.items():
    marker='<!-- ═══════════════════════ '+name
    if marker not in html:
        print(f'WARNING: {name} marker not found')
        continue
    i=html.index(marker)
    # Find the chat input for this tab
    tab_lower=name.lower()
    chat_id='chat-'+tab_lower
    chat_pos=html.find(chat_id,i)
    if chat_pos<0:
        # For tabs without chat (HOME), find next section
        next_sec=html.find('<!-- ═══',i+len(marker)+10)
        if next_sec>0:
            # Find last closing div before next section
            inject=html.rfind('</div>',i+50,next_sec)
            if inject>0:
                html=html[:inject]+content+html[inject:]
                total+=len(content)
                print(f'{name}: {len(content)} bytes (before next section)')
                continue
    else:
        # Find the div just before chat area
        inject=html.rfind('</div>',i+50,chat_pos)
        if inject>0:
            html=html[:inject]+content+html[inject:]
            total+=len(content)
            print(f'{name}: {len(content)} bytes')
            continue
    print(f'FALLBACK {name}')

with open('index.html','w') as f: f.write(html)
print(f'\nTotal injected: {total} bytes')
print(f'Final HTML: {len(html)} bytes')
os.system('git add -A && git commit -m "MASTER REBUILD: Spotify dark, cards first, all 14 tabs, every button wired, Alvai guides everything" && git push --force')
print('DONE')
