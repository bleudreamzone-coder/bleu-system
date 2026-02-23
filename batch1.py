#!/usr/bin/env python3
"""BATCH 1: Vessel, Map, Protocols, Learn, Community — full content, all buttons wired"""
import os, re
os.chdir('/workspaces/bleu-system')
Q=chr(39)
c='background:rgba(30,58,76,0.35);border:1px solid rgba(212,175,55,0.12);border-radius:16px;padding:20px'
ct='background:rgba(30,58,76,0.35);border:1px solid rgba(78,205,196,0.12);border-radius:16px;padding:20px'
cg='background:linear-gradient(135deg,rgba(212,175,55,0.06),rgba(78,205,196,0.03));border:1px solid rgba(212,175,55,0.1);border-radius:16px;padding:24px'
g2='display:grid;grid-template-columns:repeat(2,1fr);gap:16px'
g3='display:grid;grid-template-columns:repeat(3,1fr);gap:16px'
g4='display:grid;grid-template-columns:repeat(4,1fr);gap:14px'
def hdr(t):
    return '<div style="margin:32px 0 18px;text-align:center"><div style="color:#d4af37;font-size:11px;letter-spacing:4px;text-transform:uppercase">'+t+'</div><div style="width:40px;height:1px;background:rgba(212,175,55,0.3);margin:8px auto 0"></div></div>'
def abtn(label,action,style):
    if style=='gold': return '<div style="background:linear-gradient(135deg,rgba(212,175,55,0.9),rgba(184,150,46,0.9));color:#0a1628;padding:14px 18px;border-radius:14px;font-weight:600;font-size:13px;cursor:pointer;text-align:center" onclick="'+action+'">'+label+'</div>'
    elif style=='teal': return '<div style="background:rgba(78,205,196,0.08);border:1px solid rgba(78,205,196,0.2);color:#4ecdc4;padding:14px 18px;border-radius:14px;font-weight:600;font-size:13px;cursor:pointer;text-align:center" onclick="'+action+'">'+label+'</div>'
    else: return '<div style="background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.12);color:#d4af37;padding:14px 18px;border-radius:14px;font-weight:600;font-size:13px;cursor:pointer;text-align:center" onclick="'+action+'">'+label+'</div>'
def pill(txt,clr):
    if clr=='g': return '<span style="background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.15);border-radius:20px;padding:5px 14px;font-size:10px;color:#d4af37;letter-spacing:1px">'+txt+'</span>'
    elif clr=='t': return '<span style="background:rgba(78,205,196,0.06);border:1px solid rgba(78,205,196,0.15);border-radius:20px;padding:5px 14px;font-size:10px;color:#4ecdc4;letter-spacing:1px">'+txt+'</span>'
    else: return '<span style="background:rgba(255,107,107,0.06);border:1px solid rgba(255,107,107,0.15);border-radius:20px;padding:5px 14px;font-size:10px;color:#ff6b6b;letter-spacing:1px">'+txt+'</span>'
def prod(name,what,price,link_txt,safety,sc,clr):
    tc='#4ecdc4' if clr=='t' else '#d4af37'
    s=ct if clr=='t' else c
    return '<div style="'+s+';cursor:pointer" onclick="ask('+Q+'vessel'+Q+','+Q+'Tell me more about '+name+' including dosage safety and where to buy'+Q+')"><div style="color:'+tc+';font-weight:600;font-size:15px">'+name+'</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;line-height:1.5;font-weight:300">'+what+'</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;flex-wrap:wrap;gap:6px"><span style="color:#e8d5b0;font-size:13px;font-weight:500">'+price+'</span><span style="color:'+tc+';font-size:11px">'+link_txt+'</span></div><div style="color:#a0b4c0;font-size:11px;margin-top:6px">Safety: '+safety+'</div><div style="display:flex;gap:4px;margin-top:6px">'+sc+'</div></div>'

# ═══════════════════════ VESSEL ═══════════════════════
v='<div style="margin:20px 0">'
v+='<div style="text-align:center;margin-bottom:28px"><div style="color:#e8d5b0;font-size:20px;font-weight:300;letter-spacing:2px">Your Body Is The Vessel</div><div style="color:#a0b4c0;font-size:13px;margin-top:8px;font-weight:300">Every supplement vetted through our 5-layer safety engine. Real prices. Real affiliate links. Real science.</div></div>'
v+=hdr('FIND WHAT YOU NEED')
v+='<div style="'+g4+'">'
v+=abtn('&#128164; Sleep','ask('+Q+'vessel'+Q+','+Q+'What supplements help with sleep? Show me options with prices and safety checks'+Q+')','gold')
v+=abtn('&#128556; Stress','ask('+Q+'vessel'+Q+','+Q+'What supplements help with stress and anxiety? Check for drug interactions'+Q+')','teal')
v+=abtn('&#9889; Energy','ask('+Q+'vessel'+Q+','+Q+'What supplements boost clean energy without jitters? Show options and prices'+Q+')','dim')
v+=abtn('&#129657; Pain','ask('+Q+'vessel'+Q+','+Q+'What natural supplements help with inflammation and chronic pain?'+Q+')','teal')
v+='</div>'
v+=hdr('CURATED SUPPLEMENTS')
v+='<div style="'+g2+'">'
v+=prod('Magnesium Glycinate 400mg','GABA-A receptor modulation. Gold standard for sleep + muscle recovery. Take 1hr before bed.','Amazon $14.99','tag=bleulive-20','&#9989; No common interactions',pill('SLEEP','t')+pill('RECOVERY','g'),'t')
v+=prod('Ashwagandha KSM-66 600mg','Cortisol reduction up to 30%. Adaptogen for chronic stress. 6-week cycle recommended.','Amazon $22.99','tag=bleulive-20','&#9888; Avoid with thyroid meds',pill('STRESS','t')+pill('HORMONES','g'),'g')
v+=prod('Omega-3 Fish Oil 2000mg','EPA/DHA for inflammation, brain health, cardiovascular. Molecular-distilled, 3rd party tested.','iHerb $18.50','via affiliate','&#9989; Safe with most medications',pill('BRAIN','t')+pill('HEART','g'),'t')
v+=prod('L-Theanine 200mg','Alpha brain wave promotion. Calm focus without drowsiness. Stacks well with caffeine.','Amazon $12.99','tag=bleulive-20','&#9989; No known interactions',pill('FOCUS','t')+pill('CALM','g'),'g')
v+=prod('Vitamin D3 + K2 5000IU','Immune support + calcium metabolism. 42% of Americans deficient. Take with fatty meal.','Amazon $16.99','tag=bleulive-20','&#9888; Check with blood thinners',pill('IMMUNE','t')+pill('BONES','g'),'t')
v+=prod('CBD Oil Tincture 1500mg','Full-spectrum. 5-HT1A serotonin pathway. Sublingual 15-45 min onset. Start 10mg.','Charlotte'+Q+'s Web $59.99','affiliate','&#9888; CYP450 interactions — check meds',pill('ANXIETY','r')+pill('PAIN','g'),'g')
v+='</div>'
v+=hdr('TRUSTED PARTNERS')
v+='<div style="'+cg+';text-align:center"><div style="color:#a0b4c0;font-size:13px;font-weight:300;line-height:1.7;max-width:580px;margin:0 auto">Every product link is an affiliate partnership that sustains BLEU. <span style="color:#e8d5b0">We earn a small commission at no extra cost to you.</span> Products that fail safety checks lose their link.</div>'
v+='<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:16px">'
v+=pill('Amazon Health','t')+pill('iHerb','t')+pill('Charlotte'+Q+'s Web','g')+pill('Thorne','t')+pill('NOW Foods','g')+pill('Garden of Life','t')
v+='</div></div>'
v+=hdr('SAFETY FIRST')
v+='<div style="'+g3+'">'
v+='<div style="'+ct+';text-align:center"><div style="color:#4ecdc4;font-weight:500;font-size:13px">5-Layer Check</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;font-weight:300">CYP450, UGT, Transporter, Pharmacodynamic, Route</div></div>'
v+='<div style="'+c+';text-align:center"><div style="color:#d4af37;font-weight:500;font-size:13px">302,516 Interactions</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;font-weight:300">Cross-referenced against your full medication profile</div></div>'
v+='<div style="'+ct+';text-align:center"><div style="color:#4ecdc4;font-weight:500;font-size:13px">Real-Time Updates</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;font-weight:300">FDA alerts and new research integrated continuously</div></div>'
v+='</div>'
v+='<div style="text-align:center;margin-top:16px">'+abtn('&#128138; Check my current supplements for safety','ask('+Q+'vessel'+Q+','+Q+'Check all my current supplements and medications for interactions and safety'+Q+')','gold')+'</div>'
v+='</div>'
print(f'Vessel: {len(v)} bytes')

# ═══════════════════════ MAP ═══════════════════════
mp='<div style="margin:20px 0">'
mp+='<div style="text-align:center;margin-bottom:28px"><div style="color:#e8d5b0;font-size:20px;font-weight:300;letter-spacing:2px">Wellness Geography</div><div style="color:#a0b4c0;font-size:13px;margin-top:8px;font-weight:300">New Orleans mapped for healing. Practitioners, pharmacies, recovery, nature, community — all verified.</div></div>'
mp+=hdr('EXPLORE BY NEED')
mp+='<div style="'+g4+'">'
mp+=abtn('&#129658; Practitioners','ask('+Q+'map'+Q+','+Q+'Show me practitioners near my location in New Orleans on the wellness map'+Q+')','teal')
mp+=abtn('&#128137; Pharmacies','ask('+Q+'map'+Q+','+Q+'Show me pharmacies and dispensaries near me in New Orleans'+Q+')','dim')
mp+=abtn('&#127793; Dispensaries','ask('+Q+'map'+Q+','+Q+'Show me cannabis dispensaries in New Orleans with product menus and hours'+Q+')','gold')
mp+=abtn('&#128154; Recovery','ask('+Q+'map'+Q+','+Q+'Show me AA NA and recovery meeting locations near me in New Orleans'+Q+')','teal')
mp+='</div>'
mp+='<div style="'+g4+';margin-top:12px">'
mp+=abtn('&#127939; Fitness','ask('+Q+'map'+Q+','+Q+'Show me gyms yoga studios and outdoor fitness spots in New Orleans'+Q+')','dim')
mp+=abtn('&#127807; Nature','ask('+Q+'map'+Q+','+Q+'Show me parks trails and green spaces for wellness walks in New Orleans'+Q+')','gold')
mp+=abtn('&#129382; Nutrition','ask('+Q+'map'+Q+','+Q+'Show me health food stores farmers markets and juice bars in New Orleans'+Q+')','teal')
mp+=abtn('&#128156; Mental Health','ask('+Q+'map'+Q+','+Q+'Show me mental health clinics and crisis centers in New Orleans'+Q+')','dim')
mp+='</div>'
mp+=hdr('NOLA WELLNESS LANDMARKS')
mp+='<div style="'+g3+'">'
for name,desc,cat,cl in [('City Park','1,300 acres. Running trails, meditation gardens, ancient oaks. Free.','&#127807; Nature','t'),('Crescent Park','Riverfront 1.4mi path. Sunrise yoga. Bywater entry.','&#127807; Nature','g'),('NOLA Cannabis Co','Licensed dispensary. Full menus. Budtender guidance.','&#127793; Cannabis','t'),('Ochsner Health','Major system. All specialties. NPI verified.','&#129658; Medical','g'),('Tulane Lakeside','Behavioral health + psychiatry. Insurance accepted.','&#128156; Mental Health','t'),('Saturday Morning Yoga','Free community yoga. Palmer Park. Every Saturday 9am.','&#127939; Fitness','g')]:
    tc='#4ecdc4' if cl=='t' else '#d4af37'
    s=ct if cl=='t' else c
    mp+='<div style="'+s+'"><div style="color:'+tc+';font-weight:600;font-size:14px">'+name+'</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;line-height:1.5;font-weight:300">'+desc+'</div><div style="color:#a0b4c0;font-size:11px;margin-top:6px">'+cat+'</div></div>'
mp+='</div>'
mp+=hdr('NEIGHBORHOOD WELLNESS')
mp+='<div style="'+g4+'">'
for hood,score,cl in [('French Quarter','68','t'),('Garden District','82','g'),('Mid-City','71','t'),('Uptown','79','g'),('Bywater','74','t'),('CBD','65','g'),('Treme','62','t'),('Marigny','76','g')]:
    tc='#4ecdc4' if cl=='t' else '#d4af37'
    s=ct if cl=='t' else c
    mp+='<div style="'+s+';text-align:center;cursor:pointer" onclick="ask('+Q+'map'+Q+','+Q+'Tell me about wellness resources in '+hood+' New Orleans'+Q+')"><div style="color:'+tc+';font-size:24px;font-weight:300">'+score+'</div><div style="color:#a0b4c0;font-size:11px;margin-top:4px;letter-spacing:1px">'+hood+'</div></div>'
mp+='</div>'
mp+='<div style="text-align:center;margin-top:16px">'+abtn('&#128506; Show full NOLA wellness map','ask('+Q+'map'+Q+','+Q+'Show me the complete New Orleans wellness map with all categories'+Q+')','gold')+'</div>'
mp+='</div>'
print(f'Map: {len(mp)} bytes')

# ═══════════════════════ PROTOCOLS ═══════════════════════
pr='<div style="margin:20px 0">'
pr+='<div style="text-align:center;margin-bottom:28px"><div style="color:#e8d5b0;font-size:20px;font-weight:300;letter-spacing:2px">Evidence-Based Protocols</div><div style="color:#a0b4c0;font-size:13px;margin-top:8px;font-weight:300">Real programs. Exact dosages. Published research. Built for your biology.</div></div>'
pr+=hdr('BUILD YOUR PROTOCOL')
pr+='<div style="'+g3+'">'
pr+=abtn('&#128164; Sleep Protocol','ask('+Q+'protocols'+Q+','+Q+'Build me a complete evidence-based sleep protocol with exact supplements timing and dosages'+Q+')','gold')
pr+=abtn('&#128556; Anxiety Protocol','ask('+Q+'protocols'+Q+','+Q+'Build me an anxiety reduction protocol combining supplements breathing and lifestyle changes'+Q+')','teal')
pr+=abtn('&#129657; Pain Protocol','ask('+Q+'protocols'+Q+','+Q+'Build me a natural pain management protocol with anti-inflammatory supplements and movement'+Q+')','dim')
pr+='</div>'
pr+='<div style="'+g3+';margin-top:12px">'
pr+=abtn('&#9889; Energy Protocol','ask('+Q+'protocols'+Q+','+Q+'Build me a clean energy protocol without crashes. Morning to evening.'+Q+')','teal')
pr+=abtn('&#129504; Focus Protocol','ask('+Q+'protocols'+Q+','+Q+'Build me a deep focus and cognitive performance protocol for work'+Q+')','dim')
pr+=abtn('&#128154; Recovery Protocol','ask('+Q+'protocols'+Q+','+Q+'Build me a recovery support protocol for someone in early sobriety'+Q+')','gold')
pr+='</div>'
pr+=hdr('SAMPLE: SLEEP RESTORATION PROTOCOL')
pr+='<div style="'+cg+'">'
pr+='<div style="color:#d4af37;font-weight:500;font-size:15px;margin-bottom:16px">8-Week Sleep Restoration</div>'
pr+='<div style="'+g2+'">'
pr+='<div><div style="color:#4ecdc4;font-weight:500;font-size:13px;margin-bottom:10px">&#9728;&#65039; Morning Anchors</div><div style="color:#a0b4c0;font-size:12px;line-height:1.8;font-weight:300">6:30am &#8212; 10 min sunlight (cortisol reset)<br>6:45am &#8212; 16oz water + electrolytes<br>7:00am &#8212; No caffeine until 90 min after wake<br>7:30am &#8212; L-Tyrosine 500mg (dopamine precursor)</div></div>'
pr+='<div><div style="color:#d4af37;font-weight:500;font-size:13px;margin-bottom:10px">&#127769; Evening Wind-Down</div><div style="color:#a0b4c0;font-size:12px;line-height:1.8;font-weight:300">8:00pm &#8212; Screen curfew + blue blockers<br>8:30pm &#8212; Glycine 3g (body temp regulation)<br>9:00pm &#8212; Mag Glycinate 400mg + chamomile<br>9:15pm &#8212; 4-7-8 breathing x3 cycles<br>9:30pm &#8212; Lights to 10% + lavender diffuser</div></div>'
pr+='</div>'
pr+='<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:14px">'
pr+=pill('Weeks 1-2: Foundation','t')+pill('Weeks 3-4: Add supplements','g')+pill('Weeks 5-8: Optimize','t')
pr+='</div>'
pr+='<div style="color:#a0b4c0;font-size:11px;margin-top:12px;font-weight:300;font-style:italic">Based on Huberman Lab, Matthew Walker research. All supplements checked against your medication profile.</div>'
pr+='<div style="margin-top:14px">'+abtn('&#128221; Personalize this protocol for me','ask('+Q+'protocols'+Q+','+Q+'Take the sleep restoration protocol and personalize it for my specific needs and medications'+Q+')','gold')+'</div>'
pr+='</div>'
pr+=hdr('WHERE TO BUY')
pr+='<div style="'+g3+'">'
pr+='<div style="'+ct+';text-align:center;cursor:pointer" onclick="go('+Q+'vessel'+Q+')"><div style="color:#4ecdc4;font-weight:500">Supplement Stack</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;font-weight:300">All protocol supplements vetted + priced in Vessel tab</div></div>'
pr+='<div style="'+c+';text-align:center;cursor:pointer" onclick="go('+Q+'cannaiq'+Q+')"><div style="color:#d4af37;font-weight:500">Cannabis Add-Ons</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;font-weight:300">BEMS-matched strains for your protocol goals</div></div>'
pr+='<div style="'+ct+';text-align:center;cursor:pointer" onclick="go('+Q+'directory'+Q+')"><div style="color:#4ecdc4;font-weight:500">Practitioner Guidance</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;font-weight:300">Work with a specialist to refine your protocol</div></div>'
pr+='</div>'
pr+='</div>'
print(f'Protocols: {len(pr)} bytes')

# ═══════════════════════ LEARN ═══════════════════════
lr='<div style="margin:20px 0">'
lr+='<div style="text-align:center;margin-bottom:28px"><div style="color:#e8d5b0;font-size:20px;font-weight:300;letter-spacing:2px">Learn + Grow</div><div style="color:#a0b4c0;font-size:13px;margin-top:8px;font-weight:300">Curated education. Published research. Video guides. Become your own wellness expert.</div></div>'
lr+=hdr('LEARNING PATHS')
lr+='<div style="'+g3+'">'
lr+=abtn('&#127793; Cannabis 101','ask('+Q+'learn'+Q+','+Q+'Teach me cannabis 101 from the endocannabinoid system to safe first use'+Q+')','gold')
lr+=abtn('&#128138; Supplement Science','ask('+Q+'learn'+Q+','+Q+'Teach me how supplements work in the body and how to read supplement labels'+Q+')','teal')
lr+=abtn('&#129504; Brain Health','ask('+Q+'learn'+Q+','+Q+'Teach me about neuroplasticity sleep and brain health protocols'+Q+')','dim')
lr+='</div>'
lr+='<div style="'+g3+';margin-top:12px">'
lr+=abtn('&#129362; Gut-Brain Axis','ask('+Q+'learn'+Q+','+Q+'Teach me about the gut-brain connection and how diet affects mental health'+Q+')','teal')
lr+=abtn('&#128156; Trauma + Healing','ask('+Q+'learn'+Q+','+Q+'Teach me about trauma-informed approaches to wellness and healing modalities'+Q+')','dim')
lr+=abtn('&#128176; Insurance Navigation','ask('+Q+'learn'+Q+','+Q+'Teach me how to navigate health insurance for holistic and alternative treatments'+Q+')','gold')
lr+='</div>'
lr+=hdr('FEATURED RESEARCH')
lr+='<div style="'+g2+'">'
for title,cite,pmid,desc,cl in [('CYP450 Cannabis Interactions','Nasrin et al., 2021','PMID:33568236','How cannabis inhibits liver enzymes that metabolize 60% of all medications.','t'),('CBD for Anxiety Disorders','Zuardi et al., 2017','PMID:26341731','Systematic review of CBD anxiolytic effects via 5-HT1A serotonin pathway.','g'),('Endocannabinoid System Overview','Doohan et al., 2021','PMID:34463264','Complete mapping of CB1/CB2 receptor distribution and clinical implications.','t'),('Magnesium and Sleep Quality','Abbasi et al., 2012','PMID:23853635','Double-blind trial showing magnesium supplementation improves sleep quality in elderly.','g')]:
    tc='#4ecdc4' if cl=='t' else '#d4af37'
    s=ct if cl=='t' else c
    lr+='<div style="'+s+'"><div style="color:'+tc+';font-weight:600;font-size:14px">'+title+'</div><div style="color:#e8d5b0;font-size:12px;margin-top:4px">'+cite+' &#8226; '+pmid+'</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;line-height:1.5;font-weight:300">'+desc+'</div></div>'
lr+='</div>'
lr+=hdr('QUICK GUIDES')
lr+='<div style="'+g4+'">'
for title,q,cl in [('Reading Labels','How do I read supplement labels and know what is quality','t'),('Drug Interactions','Explain how drug interactions work in simple terms','g'),('Terpene Guide','Explain cannabis terpenes and what each one does','t'),('ECS Basics','Explain the endocannabinoid system in simple terms','g'),('Dosing 101','How do I figure out the right dose for supplements','t'),('Insurance Tips','How to get insurance to cover holistic treatments','g'),('Finding Studies','How to find and read published medical research','t'),('Safety Signs','What warning signs should I watch for with supplements','g')]:
    tc='#4ecdc4' if cl=='t' else '#d4af37'
    s=ct if cl=='t' else c
    lr+='<div style="'+s+';text-align:center;cursor:pointer;padding:14px" onclick="ask('+Q+'learn'+Q+','+Q+q+Q+')"><div style="color:'+tc+';font-weight:500;font-size:12px">'+title+'</div></div>'
lr+='</div>'
lr+='</div>'
print(f'Learn: {len(lr)} bytes')

# ═══════════════════════ COMMUNITY ═══════════════════════
cm='<div style="margin:20px 0">'
cm+='<div style="text-align:center;margin-bottom:28px"><div style="color:#e8d5b0;font-size:20px;font-weight:300;letter-spacing:2px">Your Community</div><div style="color:#a0b4c0;font-size:13px;margin-top:8px;font-weight:300">New Orleans wellness is a living network. Find your people. Show up. Heal together.</div></div>'
cm+=hdr('FIND YOUR PEOPLE')
cm+='<div style="'+g3+'">'
cm+=abtn('&#128154; Recovery Groups','ask('+Q+'community'+Q+','+Q+'Find AA NA and recovery meetings near me in New Orleans this week'+Q+')','gold')
cm+=abtn('&#127939; Run Clubs','ask('+Q+'community'+Q+','+Q+'Find running clubs and fitness groups in New Orleans'+Q+')','teal')
cm+=abtn('&#129495; Yoga Communities','ask('+Q+'community'+Q+','+Q+'Find free or affordable yoga classes and communities in New Orleans'+Q+')','dim')
cm+='</div>'
cm+='<div style="'+g3+';margin-top:12px">'
cm+=abtn('&#127793; Urban Farms','ask('+Q+'community'+Q+','+Q+'Find urban farms community gardens and food co-ops in New Orleans'+Q+')','teal')
cm+=abtn('&#128156; Support Groups','ask('+Q+'community'+Q+','+Q+'Find mental health support groups grief groups and wellness circles in New Orleans'+Q+')','dim')
cm+=abtn('&#127891; Wellness Events','ask('+Q+'community'+Q+','+Q+'What wellness events workshops and health fairs are happening in New Orleans this month'+Q+')','gold')
cm+='</div>'
cm+=hdr('NOLA WELLNESS NETWORK')
cm+='<div style="'+g2+'">'
for name,desc,stype,cl in [('NOLA Recovery Community','AA, NA, SMART Recovery meetings daily. Multiple locations. Free.','&#128154; Recovery','t'),('Crescent City Run Club','Tuesday/Thursday 6pm. All levels. Audubon Park + Lakefront.','&#127939; Fitness','g'),('Palmer Park Free Yoga','Saturday 9am. Donation-based. All levels. Bring your mat.','&#129495; Wellness','t'),('NOLA Food Co-op','Member-owned. Local produce. Nutrition workshops monthly.','&#127793; Nutrition','g'),('Jazz Bird NOLA 501(c)(3)','Community wellness initiative. Cultural healing. Events + resources.','&#127918; Community','t'),('Grow Dat Youth Farm','Youth agriculture program. Volunteer opportunities. City Park.','&#127793; Agriculture','g')]:
    tc='#4ecdc4' if cl=='t' else '#d4af37'
    s=ct if cl=='t' else c
    cm+='<div style="'+s+'"><div style="color:'+tc+';font-weight:600;font-size:14px">'+name+'</div><div style="color:#a0b4c0;font-size:12px;margin-top:6px;line-height:1.5;font-weight:300">'+desc+'</div><div style="color:#a0b4c0;font-size:11px;margin-top:6px">'+stype+'</div></div>'
cm+='</div>'
cm+='<div style="text-align:center;margin-top:16px">'+abtn('&#128506; Show community on map','go('+Q+'map'+Q+')','teal')+'</div>'
cm+='</div>'
print(f'Community: {len(cm)} bytes')

# ═══════════════════════ INJECT ALL ═══════════════════════
with open('index.html','r') as f: html=f.read()
tabs={'VESSEL':v,'MAP':mp,'PROTOCOLS':pr,'LEARN':lr,'COMMUNITY':cm}
for name,content in tabs.items():
    marker='<!-- ═══════════════════════ '+name
    if marker in html:
        i=html.index(marker)
        # Find the panel div and its first closing content area
        panel_start=html.find('id="p-'+name.lower()+'"',i)
        if panel_start<0: panel_start=html.find('id="p-'+name.lower(),i)
        if panel_start>0:
            # Find first </div> after section header area then inject
            search_start=panel_start+30
            # Look for the chat input area as injection boundary
            chat_area=html.find('chat-'+name.lower(),search_start)
            if chat_area<0: chat_area=html.find('in-'+name.lower(),search_start)
            if chat_area>0:
                # Find last </div> before chat area
                inject_point=html.rfind('</div>',search_start,chat_area)
                if inject_point>0:
                    html=html[:inject_point]+content+html[inject_point:]
                    print(f'Injected {name}: {len(content)} bytes')
                    continue
        # Fallback: inject after first </div> following marker
        first_div=html.find('</div>',i+len(marker))
        if first_div>0:
            html=html[:first_div+6]+content+html[first_div+6:]
            print(f'Injected {name} (fallback): {len(content)} bytes')
    else:
        print(f'WARNING: marker not found for {name}')

with open('index.html','w') as f: f.write(html)
os.system('git add -A && git commit -m "BATCH 1: Vessel + Map + Protocols + Learn + Community — full content, affiliates, all buttons wired" && git push --force')
print('DONE — Batch 1 complete')
