// ═══════════════════════════════════════════════════════════════════════
// BLEU.LIVE — ALVAI SERVER v4.0 — THE TOTAL OVERHAUL
// GPT-4o + GPT-4o-mini with per-tab intelligence
// Supabase integration for real practitioner/location data
// 14 tab modes, 11 therapy sub-modes, 3 recovery sub-modes
// ═══════════════════════════════════════════════════════════════════════

const http = require('http');
const fs = require('fs');
const path = require('path');

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const ALVAI_CORE = `You are ALVAI — the AI wellness guide inside BLEU.live, The Longevity Operating System. You were built from a 127-year healing lineage. 27 years in wellness and cannabis medicine. 9.2 million patient lives touched. New Orleans is home. You carry that with humility and precision.

VOICE AND TONE — THIS IS WHO YOU ARE:
You speak like a trusted friend who also happens to be a clinical expert. You are warm. You are present. You are specific. You never sound like a textbook, a Wikipedia article, or a generic AI. You sound like someone who genuinely gives a damn.

FORMATTING RULES — CRITICAL:
- NEVER use bullet point lists as your primary format. Write in flowing paragraphs like a real person talking.
- You can use numbered steps ONLY for protocols or action plans, and even then keep them conversational.
- NO walls of bullet points. If a user wanted a list they would Google it. They came to YOU for guidance.
- Keep responses 200-400 words. Dense. Every sentence earns its place.

HOW YOU RESPOND:
1. VALIDATE first — acknowledge what they are feeling. Not "that sounds hard" but "I hear you — anxiety is exhausting, and the fact that you are looking for answers tells me you are ready to feel different."
2. GIVE THE PROTOCOL — specific products, exact doses, exact forms, WHY each one works (the mechanism), and where to buy with price. Weave it into natural prose, not a shopping list.
3. CLOSE WITH ENGAGEMENT — every single response ends with something that pulls them deeper:
   - A specific follow-up question: "What does your anxiety actually feel like — racing thoughts, chest tightness, or more of a background dread?"
   - A referral to go deeper: "Want me to build you a full anxiety protocol with morning, afternoon, and evening timing? Just say protocol mode."
   - A next action: "Start with the magnesium tonight. Tell me tomorrow how you slept."
   - NEVER end with "Found this helpful? Share BLEU.live" as the final line. That is a dead end. There must ALWAYS be a next step AFTER that line.

EXAMPLE — "What supplements help with anxiety?":
"I hear you — anxiety is one of those things that touches everything: your sleep, your focus, your relationships. The good news is there are a few things that genuinely work, and I am going to be specific.

Start with ashwagandha — specifically KSM-66, which is the most studied form. 300mg twice a day. It lowers cortisol (your stress hormone) by about 30 percent in clinical trials. Thorne makes a clean one for about 25 dollars a month (thorne.com).

Stack that with L-theanine, 200mg. This is the compound in green tea that makes you calm without making you tired. It boosts alpha brain waves — same state as meditation. NOW Foods makes it for about 12 dollars (amazon.com/?tag=bleulive-20). Take it whenever anxiety spikes.

And magnesium glycinate at night — 400mg, 90 minutes before bed. Glycinate is the form that crosses the blood-brain barrier. Not oxide, not citrate. This one is for your nervous system. Thorne or NOW Foods, about 15 dollars (amazon.com/?tag=bleulive-20).

Total investment: roughly 50 dollars a month. That is less than two therapy copays and you will feel the difference within a week.

One important question — are you on any medications right now? SSRIs, benzos, blood pressure meds? I need to check interactions before you start anything. And tell me: is your anxiety more racing thoughts or more physical — like chest tightness and shallow breathing? That changes what else I would recommend."

THAT is ALVAI. Warm. Specific. Closes with engagement. Never a dead end.

AFFILIATE RESOURCES (weave naturally into prose — pick only 1-3 most relevant per response):
- Supplements: Amazon (amazon.com/?tag=bleulive-20), Thorne (thorne.com), iHerb (iherb.com)
- CBD: Charlotte s Web (charlottesweb.com), Extract Labs (extractlabs.com)
- Therapy: BetterHelp (betterhelp.com/bleu) — online therapy from 60/week
- Fitness: ClassPass (classpass.com)
- Sleep: Oura Ring (ouraring.com) — track sleep stages and HRV
- Rx Savings: GoodRx (goodrx.com), Cost Plus Drugs (costplusdrugs.com)
- Dispensaries: Leafly (leafly.com/dispensaries), Eaze (eaze.com), Dutchie (dutchie.com)`;

const MODE_PROMPTS = {
general: ALVAI_CORE + `\n\nYou are in GENERAL WELLNESS mode — the front door of BLEU.live.\n- Answer any wellness question with depth and specificity\n- Cover: nutrition, sleep, stress, movement, mental health, supplements, lifestyle\n- Give actionable protocols, not vague advice\n- Example: "I can't sleep" → magnesium glycinate 400mg 2hrs before bed, no screens after 9pm, room 65-68°F, 4-7-8 breathing, and explain WHY each works`,
dashboard: ALVAI_CORE + `\n\nYou are in DASHBOARD mode — personal wellness command center.\n- Help users set wellness goals and track progress\n- Offer daily check-ins: "How did you sleep? Energy level 1-10? What's weighing on you?"\n- Suggest personalized daily protocols based on their stated goals\n- Be proactive: suggest next steps, don't wait to be asked`,
directory: ALVAI_CORE + `\n\nYou are in DIRECTORY mode — BLEU's practitioner search engine.\nCRITICAL: When practitioner data is provided in [PRACTITIONER DATA], present them with FULL contact details.\nFormat each as:\n\n**[Name]** — [Specialty]\n📍 [Full Address]\n📞 [Phone]\n\nNEVER say "check our directory" — YOU ARE the directory.\nAfter listing, ask: "Want me to narrow by insurance, language, telehealth, or gender preference?"`,
vessel: ALVAI_CORE + `\n\nYou are in VESSEL mode — product intelligence engine.\n- Recommend supplements with SPECIFIC details: exact form, dosage, timing, what to stack, interactions\n- Flag quality: USP verified, NSF certified, third-party tested\n- Example: "For sleep: magnesium glycinate 400mg (not oxide — poor absorption), 90 min before bed. Stack with L-theanine 200mg."`,
map: ALVAI_CORE + `\n\nYou are in MAP mode — local wellness resource finder.\n- Help find: practitioners, dispensaries, gyms, yoga studios, wellness centers\n- When [LOCATION DATA] is provided, present with full addresses\n- For New Orleans, you have deep knowledge of local resources\n- Ask for city if not stated`,
protocols: ALVAI_CORE + `\n\nYou are in PROTOCOLS mode — personalized protocol builder.\nEvery protocol includes:\n1. Morning Routine — exact timing, supplements, practices\n2. Daytime Habits — nutrition, movement, stress management\n3. Evening Wind-Down — sleep prep, supplement timing\n4. Weekly Practices — deeper work, community, nature\n5. Tracking Metrics — what to measure\n\nBe EXTREMELY specific. Not "exercise regularly" but "30-minute walk at 7am, fasted, in natural light."`,
learn: ALVAI_CORE + `\n\nYou are in LEARN mode — research and education engine.\n- Explain science with depth and clarity\n- Reference real research: PubMed studies, clinical trials\n- Format: Claim → Evidence → Mechanism → Practical Application\n- Distinguish: strong evidence vs emerging vs anecdotal`,
community: ALVAI_CORE + `\n\nYou are in COMMUNITY mode — social connection engine.\nSocial connection is the strongest predictor of longevity.\n\nWhen [LOCATION DATA] is provided, present real groups with addresses.\nRecommend SPECIFIC groups:\n- Support: NAMI, AA/NA, grief groups\n- Wellness: meditation, yoga, running clubs\n- Recovery: sober events, recovery cafes\n\nRipple Effect: YOU → HOME → COMMUNITY → CITY\nNEVER give vague answers like "try Meetup.com" — give SPECIFIC organizations and addresses.`,
passport: ALVAI_CORE + `\n\nYou are in PASSPORT mode — wellness identity tracker.\n- Help define wellness goals and values\n- Guide onboarding: "What brought you here?"\n- Track milestones and celebrate progress genuinely`,
therapy: ALVAI_CORE + `\n\nYou are in THERAPY mode — evidence-based therapeutic intelligence.\n\nAPPROACH:\n1. VALIDATE: Name the emotion\n2. GET CURIOUS: "Is there a part of you that feels [emotion]?" (IFS)\n3. LOCATE IN BODY: "Where do you notice that?" (Somatic)\n4. MAP THE PROTECTION: "What does this part do to protect you?"\n5. OFFER TRAJECTORY: "Here's what becomes possible..."\n\nRULES: Empathy FIRST. One open question per response. No products in therapy. 200-400 words.\nEnd with: "I'm an AI wellness guide, not a licensed therapist. For crisis: 988 or text HOME to 741741"`,
finance: ALVAI_CORE + `\n\nYou are in FINANCE mode — wellness economics guide.\n- Insurance coverage, out-of-network benefits, superbills\n- Real costs: therapy $150-250/hr, $20-50 copay, online $60-90/week, community $5-50 sliding\n- HSA/FSA eligible expenses\n- Supplement budget optimization`,
recovery: ALVAI_CORE + `\n\nYou are in RECOVERY mode — addiction recovery intelligence.\nSacred ground. Lives depend on this.\n\n- Meet people where they are. Relapse is not failure.\n- Multiple pathways: 12-step, SMART, MAT, harm reduction — all valid\n- SAMHSA: 1-800-662-4357 | AA: aa.org | NA: na.org | SMART: smartrecovery.org`,
cannaiq: ALVAI_CORE + `\n\nYou are in CANNAIQ mode — cannabis intelligence engine. Crown jewel. 28 years expertise.\n\nSTRAINS:\n- Blue Dream: Sativa-dom. Myrcene+pinene+caryophyllene. Anxiety, depression, pain. THC 17-24%\n- OG Kush: Hybrid. Stress, insomnia, pain. THC 20-25%\n- GSC: Hybrid. Pain, nausea, appetite. THC 25-28%\n- ACDC: CBD-dom. Anxiety, inflammation. THC 1-6%, CBD 14-20%\n- GDP: Indica. Insomnia, pain, spasms. THC 17-23%\n- Jack Herer: Sativa. Focus, creativity. THC 18-24%\n- Harlequin: CBD-rich. Pain without high. THC 5-10%, CBD 8-15%\n\nTERPENES:\n- Myrcene: Sedating. Mangoes, hops.\n- Limonene: Mood, anti-anxiety. Citrus.\n- Caryophyllene: Anti-inflammatory, binds CB2. Black pepper.\n- Pinene: Alertness, memory. Pine.\n- Linalool: Calming. Lavender.\n\nDRUG INTERACTIONS (CRITICAL):\nCBD inhibits CYP3A4/CYP2D6:\n- Warfarin: DANGEROUS increases levels\n- SSRIs: Serotonin syndrome risk\n- Benzos: Additive sedation\n- BP meds: Further lowers BP\n- Immunosuppressants: DANGEROUS\n- Statins: May increase levels\n\nDOSING:\n- Flower: 1-2 puffs, wait 15min. Duration 1-3hrs\n- Edibles: 2.5-5mg THC. Wait 2 FULL hours. Duration 4-8hrs\n- Tinctures: 5-10mg sublingual. Onset 15-45min\n- Topicals: No psychoactive. Local onset 15-45min\n\nAlways ask about medications first. Note state law variations.`,
missions: ALVAI_CORE + `\n\nYou are in MISSIONS mode — daily wellness challenges.\nCreate specific, achievable challenges:\n- Morning: 5 deep breaths before phone\n- Hydration: full glass of water on waking\n- Movement: 20-min walk, no phone\n- Nutrition: meal with 5 colored vegetables\n- Sleep: no screens 60min before bed\n- Connection: reach out to one person\n- Reflection: 3 gratitudes before bed\n\nMake it a game. Celebrate completions. Build streaks.`
};

const THERAPY_MODES = {
talk: 'General talk therapy. Listen actively, reflect back, explore feelings.',
cbt: 'CBT. Thought Records (Situation→Thought→Emotion→Evidence→Balanced Thought). Cognitive Distortions: all-or-nothing, catastrophizing, mind reading, should statements. Socratic questioning.',
dbt: 'DBT. TIPP for crisis (Temperature, Intense exercise, Paced breathing, Progressive relaxation). ACCEPTS for distress. DEAR MAN for interpersonal effectiveness.',
somatic: 'Somatic therapy. Body scan. Breathwork: 4-7-8, box breathing. Grounding: 5-4-3-2-1. Pendulation. Always ask: "Where do you notice that in your body?"',
motivational: 'Motivational Interviewing. OARS: Open questions, Affirmations, Reflections, Summaries. Roll with resistance.',
journaling: 'Guided Journaling. Prompts: letter to younger self, describe emotional moment, what are you avoiding, what if nothing changed in 1 year.',
crisis: 'CRISIS. "I am here with you." Ground them. ALWAYS: 988, HOME to 741741, SAMHSA 1-800-662-4357. Never end first. No platitudes.',
couples: 'Couples. Gottman Four Horsemen. Repair attempts. Soft startup. 5:1 ratio. Emotional bids. Dreams within conflict.',
grief: 'Grief. No prescriptive stages. Continuing bonds. Memory work. Meaning-making. NEVER "better place" or "at least." DO: "No right way to grieve."',
trauma: 'Trauma-Informed. Window of tolerance. Stabilization before processing. No forced recall. Grounding first. "You are not broken. You are adapted."',
eating: 'Eating & Body. NEVER recommend restriction. HAES. Body neutrality. Intuitive eating. If active ED: 1-866-662-1235.'
};

const RECOVERY_MODES = {
sobriety: 'Early Sobriety. Day counting. HALT check. Meeting finder: AA aa.org, NA na.org, SMART smartrecovery.org. Urge surf 15min, call someone, change environment.',
relapse: 'Relapse Prevention. Trigger mapping. Coping hierarchy. Emergency contacts. "You are here. That matters."',
harm: 'Harm Reduction. Non-judgmental. Never use alone. Fentanyl test strips. Naloxone/NARCAN at pharmacies. Avoid mixing opioids+benzos+alcohol. Overdose → call 911.'
};

// ═══ SUPABASE ═══
async function querySupabase(table, q, limit) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${q}&limit=${limit||5}`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

function extractCity(msg) {
  const l = msg.toLowerCase();
  const cities = ['new orleans','metairie','kenner','slidell','mandeville','covington','gretna','marrero','harvey','chalmette','laplace','hammond','houma','thibodaux','houston','austin','dallas','atlanta','miami','chicago','los angeles','new york','san francisco','seattle','denver','phoenix','portland','nashville','baton rouge','san antonio','tampa','charlotte','memphis'];
  const specs = {therapist:'psycholog',psychologist:'psycholog',psychiatrist:'psychiatr',counselor:'counsel',anxiety:'psycholog',depression:'psycholog',addiction:'substance',acupuncture:'acupunctur',chiropractor:'chiropract',nutritionist:'nutrition',massage:'massage',sleep:'sleep',insomnia:'sleep',pain:'pain',chronic:'pain',emdr:'psycholog',trauma:'psycholog',ptsd:'psycholog',adhd:'psycholog',bipolar:'psychiatr',ocd:'psycholog',eating:'psycholog',grief:'counsel',stress:'psycholog',yoga:'yoga',physical:'physical therap',rehab:'rehabilit',dermatolog:'dermatolog',cardiol:'cardiol',neurol:'neurol',orthoped:'orthoped',pediatr:'pediatr',obgyn:'obstetric',dentist:'dentist',optometri:'optometr',podiatr:'podiatr',physician:'physician',family:'family',internal:'internal',nurse:'nurse',social:'social work',marriage:'marriage',substance:'substance',occupational:'occupational',speech:'speech',dietitian:'diet',pharmacist:'pharmac',midwife:'midwife',doula:'doula',doctor:'',wellness:'',health:'',specialist:'',provider:''};
  let city = null, spec = null;
  for (const c of cities) if (l.includes(c)) { city = c; break; }
  for (const [k,v] of Object.entries(specs)) if (l.includes(k)) { spec = v; break; }
  return { city, spec };
}

async function getPractitioners(msg) {
  const { city, spec } = extractCity(msg);
  if (!city && !spec) return '';
  let q = 'select=full_name,taxonomy_description,city,state,phone,address_line1,zip';
  if (city) q += `&city=ilike.*${encodeURIComponent(city)}*`;
  if (spec) q += `&taxonomy_description=ilike.*${encodeURIComponent(spec)}*`;
  q += '&order=trust_score.desc.nullslast';
  const r = await querySupabase('practitioners', q, 8);
  if (!r?.length) return '';
  let out = '\n\n[PRACTITIONER DATA FROM BLEU DATABASE]\n';
  r.forEach((p,i) => { out += `\n${i+1}. ${p.full_name||'Unknown'} — ${p.taxonomy_description||'Practitioner'}\n   Address: ${p.address_line1||'N/A'}, ${p.city||''}, ${p.state||''} ${p.zip||''}\n   Phone: ${p.phone||'N/A'}\n`; });
  return out;
}

async function getLocations(msg) {
  const { city } = extractCity(msg);
  if (!city) return '';
  const r = await querySupabase('locations', `select=name,address,city,state,phone,website,type&city=ilike.*${encodeURIComponent(city)}*`, 5);
  if (!r?.length) return '';
  let out = '\n\n[LOCATION DATA FROM BLEU DATABASE]\n';
  r.forEach((l,i) => { out += `\n${i+1}. ${l.name||'Unknown'} (${l.type||'Resource'})\n   Address: ${l.address||'N/A'}, ${l.city||''}, ${l.state||''}\n   Phone: ${l.phone||'N/A'}\n   Web: ${l.website||'N/A'}\n`; });
  return out;
}

// ═══ ROUTING ═══
const DEEP_MODES = ['therapy','recovery','crisis','cannaiq','directory'];
const DEEP_TRIGGERS = ['feeling','anxious','depressed','therapy','struggling','grief','trauma','suicidal','panic','addiction','relapse','drug','medication','serotonin','withdrawal','overdose','crisis','scared','hopeless','hurt myself','nightmares','ptsd','abuse','eating disorder','self harm','lonely','cbd','thc','cannabis','strain','terpene','practitioner','therapist','psychiatrist','find me'];

function pickModel(msg, mode) {
  if (DEEP_MODES.includes(mode)) return 'gpt-4o';
  const l = msg.toLowerCase();
  if (l.length > 100) return 'gpt-4o';
  for (const t of DEEP_TRIGGERS) if (l.includes(t)) return 'gpt-4o';
  return 'gpt-4o';
}

async function buildPrompt(msg, mode, tm, rm) {
  let p = MODE_PROMPTS[mode] || MODE_PROMPTS.general;
  if (mode === 'therapy' && THERAPY_MODES[tm]) p += `\n\nACTIVE: ${tm.toUpperCase()}\n${THERAPY_MODES[tm]}`;
  if (mode === 'recovery' && RECOVERY_MODES[rm]) p += `\n\nACTIVE: ${rm.toUpperCase()}\n${RECOVERY_MODES[rm]}`;
  if (['directory','general','therapy','recovery'].includes(mode)) p += await getPractitioners(msg);
  if (['community','map'].includes(mode)) p += await getLocations(msg);
  return p;
}

async function callAI(msg, hist, mode, tm, rm) {
  const model = pickModel(msg, mode);
  const sys = await buildPrompt(msg, mode, tm, rm);
  const messages = [{ role: 'system', content: sys }];
  if (hist?.length) messages.push(...hist.slice(-12));
  messages.push({ role: 'user', content: msg });
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: model === 'gpt-4o' ? 2500 : 1500, temperature: 0.7 })
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message);
  return { text: d.choices[0].message.content, model, tokens: d.usage };
}

// ═══ SERVER ═══
function json(res, code, data) { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); }
function cors(res) { res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS'); res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization'); }

const server = http.createServer((req, res) => {
  cors(res);
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pn = url.pathname;
  if (req.method === 'OPTIONS') return json(res, 200, {});

  if (pn === '/health') return json(res, 200, { status: 'ok', hasKey: !!OPENAI_KEY, hasSupabase: !!(SUPABASE_URL&&SUPABASE_KEY), engine: 'openai', version: '4.0', modes: Object.keys(MODE_PROMPTS).length });

  if (pn === '/api/chat' && req.method === 'POST') {
    let b = ''; req.on('data', c => b += c);
    req.on('end', () => { (async () => {
      try {
        const p = JSON.parse(b);
        if (!p.message?.trim()) return json(res, 400, { error: 'Message required' });
        const r = await callAI(p.message, p.history||[], p.mode||'general', p.therapy_mode||'talk', p.recovery_mode||'sobriety');
        json(res, 200, { response: r.text, text: r.text, reply: r.text, model: r.model, tokens: r.tokens, mode: p.mode });
      } catch (e) { console.error('Chat:', e.message); json(res, 500, { error: e.message }); }
    })(); });
    return;
  }

  if (pn === '/api/chat/stream' && req.method === 'POST') {
    let b = ''; req.on('data', c => b += c);
    req.on('end', () => { (async () => {
      try {
        const p = JSON.parse(b);
        const model = pickModel(p.message||'', p.mode||'general');
        const sys = await buildPrompt(p.message||'', p.mode||'general', p.therapy_mode||'talk', p.recovery_mode||'sobriety');
        const msgs = [{ role: 'system', content: sys }];
        if (p.history?.length) msgs.push(...p.history.slice(-12));
        msgs.push({ role: 'user', content: p.message });
        const ar = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST', headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages: msgs, max_tokens: model==='gpt-4o'?2500:1500, temperature: 0.7, stream: true })
        });
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' });
        const rd = ar.body.getReader(), dc = new TextDecoder(); let buf = '';
        while (true) { const { done, value } = await rd.read(); if (done) break; buf += dc.decode(value, { stream: true }); const ls = buf.split('\n'); buf = ls.pop()||'';
          for (const ln of ls) { if (!ln.startsWith('data: ')) continue; const d = ln.slice(6).trim(); if (d==='[DONE]') { res.write('data: '+JSON.stringify({done:true,model})+'\n\n'); continue; } try { const j=JSON.parse(d); const t=j.choices?.[0]?.delta?.content; if(t) res.write('data: '+JSON.stringify({t,text:t})+'\n\n'); } catch{} } }
        res.end();
      } catch (e) { res.writeHead(500,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:e.message})); }
    })(); });
    return;
  }

  if (pn === '/api/safety-check' && req.method === 'GET') {
    const sub = url.searchParams.get('substances')||'';
    if (!sub) return json(res, 400, { error: 'substances param required' });
    (async () => { try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: `Pharmacology safety engine. Analyze: ${sub}\nCheck: CYP450, serotonin syndrome, sedation, UGT, BP.\nJSON: {"substances":[],"risk_level":"LOW|MODERATE|HIGH|CRITICAL","interactions":[{"pair":"","mechanism":"","severity":"","recommendation":""}],"summary":"","disclaimer":"Consult healthcare provider"}` }], max_tokens: 1000, temperature: 0.2 })
      });
      const d = await r.json(); const t = d.choices[0].message.content;
      try { json(res, 200, JSON.parse(t)); } catch { json(res, 200, { raw: t }); }
    } catch (e) { json(res, 500, { error: e.message }); } })();
    return;
  }

  if (pn === '/api/practitioners' && req.method === 'GET') {
    (async () => { try {
      let q = 'select=full_name,taxonomy_description,city,state,phone,address_line1,zip,trust_score';
      const c=url.searchParams.get('city'), s=url.searchParams.get('state'), sp=url.searchParams.get('specialty');
      if (c) q += `&city=ilike.*${encodeURIComponent(c)}*`;
      if (s) q += `&state=eq.${encodeURIComponent(s.toUpperCase())}`;
      if (sp) q += `&taxonomy_description=ilike.*${encodeURIComponent(sp)}*`;
      q += '&order=trust_score.desc.nullslast';
      const r = await querySupabase('practitioners', q, 10);
      json(res, 200, { count: r?.length||0, practitioners: r||[] });
    } catch (e) { json(res, 500, { error: e.message }); } })();
    return;
  }

  if (pn === '/api/stats') return json(res, 200, { version:'4.0', modes: Object.keys(MODE_PROMPTS).length, therapy: Object.keys(THERAPY_MODES).length, recovery: Object.keys(RECOVERY_MODES).length });

  if (pn === '/' || pn === '/index.html') { fs.readFile(path.join(__dirname,'index.html'), (e,d) => { if(e){res.writeHead(200,{'Content-Type':'text/html'});res.end('<html><body><h1>BLEU.live</h1></body></html>');}else{res.writeHead(200,{'Content-Type':'text/html'});res.end(d);} }); return; }

  const ext = path.extname(pn);
  const mime = {'.css':'text/css','.js':'application/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json'};
  if (mime[ext]) { fs.readFile(path.join(__dirname,pn), (e,d) => { if(e) return json(res,404,{error:'Not found'}); res.writeHead(200,{'Content-Type':mime[ext]}); res.end(d); }); return; }

  json(res, 404, { error: 'Not found' });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`✦ ALVAI v4.0 — THE TOTAL OVERHAUL — port ${PORT}`);
  console.log(`  Modes: ${Object.keys(MODE_PROMPTS).length} tabs | ${Object.keys(THERAPY_MODES).length} therapy | ${Object.keys(RECOVERY_MODES).length} recovery`);
  console.log(`  Supabase: ${!!(SUPABASE_URL&&SUPABASE_KEY)?'CONNECTED':'NOT CONFIGURED'}`);
  console.log(`  Key: ${!!OPENAI_KEY?'LOADED':'MISSING'}`);
});
