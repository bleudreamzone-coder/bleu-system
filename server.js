// ═══════════════════════════════════════════════════════════════════════════
// BLEU.LIVE — MAXED OUT PIPELINE v5.0
// $200/MONTH CLAUDE BUDGET — EVERY PAGE GETS UNIQUE AI CONTENT
//
// THE MATH:
// ┌──────────────────────────────────────────────────────────────────────┐
// │  Haiku 4.5:  $1/M input, $5/M output  → ~$0.005/call              │
// │  Sonnet 4:   $3/M input, $15/M output → ~$0.014/call              │
// │                                                                      │
// │  BUDGET SPLIT:                                                       │
// │  $150/mo → Haiku  = ~30,000 calls/mo = ~1,000/day (VOLUME)         │
// │  $50/mo  → Sonnet = ~3,500 calls/mo  = ~117/day  (PILLAR)         │
// │                                                                      │
// │  TOTAL: ~1,117 unique AI-written pages PER DAY                      │
// │  + unlimited free template pages                                     │
// │  + unlimited free scraping                                           │
// │                                                                      │
// │  30 DAYS: 33,000 AI pages + 500K template pages = 533,000 pages    │
// │  90 DAYS: 100K AI pages + 1.5M template pages = 1.6M pages         │
// └──────────────────────────────────────────────────────────────────────┘
//
// WHY THIS MATTERS: Google ranks UNIQUE content over templates.
// With Haiku, every practitioner page, every condition/city page,
// every comparison gets unique AI-written content for $0.005.
// Templates are the fallback, not the default.
// ═══════════════════════════════════════════════════════════════════════════

const https = require('https');
const http = require('http');

// ─── CONFIG ─────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

// Budget tracking — resets monthly
const BUDGET = {
  monthly_limit_cents: 20000,  // $200.00
  haiku_cost_per_call: 0.5,    // $0.005 in cents
  sonnet_cost_per_call: 1.4,   // $0.014 in cents
  haiku_calls_today: 0,
  sonnet_calls_today: 0,
  haiku_calls_total: 0,
  sonnet_calls_total: 0,
  spent_today_cents: 0,
  spent_total_cents: 0,
  daily_limit_cents: 667,      // ~$6.67/day ($200/30)
  last_reset: new Date().toDateString(),
};

function checkBudget(model) {
  // Reset daily counters
  const today = new Date().toDateString();
  if (BUDGET.last_reset !== today) {
    BUDGET.haiku_calls_today = 0;
    BUDGET.sonnet_calls_today = 0;
    BUDGET.spent_today_cents = 0;
    BUDGET.last_reset = today;
  }
  const cost = model === 'sonnet' ? BUDGET.sonnet_cost_per_call : BUDGET.haiku_cost_per_call;
  // Allow 10% overflow for daily, hard stop on monthly
  if (BUDGET.spent_today_cents + cost > BUDGET.daily_limit_cents * 1.1) return false;
  if (BUDGET.spent_total_cents + cost > BUDGET.monthly_limit_cents) return false;
  return true;
}

function trackSpend(model) {
  const cost = model === 'sonnet' ? BUDGET.sonnet_cost_per_call : BUDGET.haiku_cost_per_call;
  BUDGET.spent_today_cents += cost;
  BUDGET.spent_total_cents += cost;
  if (model === 'sonnet') { BUDGET.sonnet_calls_today++; BUDGET.sonnet_calls_total++; }
  else { BUDGET.haiku_calls_today++; BUDGET.haiku_calls_total++; }
}

// ─── 20 CITIES ──────────────────────────────────────────────────────

const CITY_ZIPS = {
  "new-orleans-la": ["70112","70113","70114","70115","70116","70117","70118","70119","70122","70124","70125","70126","70127","70128","70129","70130","70131","70139","70141","70142","70143","70145","70146","70148","70150","70151","70152","70153","70154","70156","70157","70158","70160","70161"],
  "austin-tx": ["78701","78702","78703","78704","78705","78712","78717","78719","78721","78722","78723","78724","78725","78726","78727","78728","78729","78730","78731","78732","78733","78734","78735","78736","78737","78738","78739","78741","78742","78744","78745","78746","78747","78748","78749","78750","78751","78752","78753","78754","78756","78757","78758","78759"],
  "los-angeles-ca": ["90001","90002","90003","90004","90005","90006","90007","90008","90010","90011","90012","90013","90014","90015","90016","90017","90018","90019","90020","90021","90022","90023","90024","90025","90026","90027","90028","90029","90031","90032","90033","90034","90035","90036","90037","90038","90039","90041","90042","90043","90044","90045","90046","90047","90048","90049"],
  "new-york-ny": ["10001","10002","10003","10004","10005","10006","10007","10009","10010","10011","10012","10013","10014","10016","10017","10018","10019","10020","10021","10022","10023","10024","10025","10026","10027","10028","10029","10030","10031","10032","10033","10034","10035","10036","10037","10038","10039","10040","10044","10065","10069","10075","10128","10280","10282"],
  "miami-fl": ["33101","33109","33125","33126","33127","33128","33129","33130","33131","33132","33133","33134","33135","33136","33137","33138","33139","33140","33141","33142","33143","33144","33145","33146","33147","33149","33150","33154","33155","33156","33157","33158","33160","33161","33162","33165","33166","33167","33168","33169","33170","33172","33173","33174","33175","33176"],
  "denver-co": ["80201","80202","80203","80204","80205","80206","80207","80209","80210","80211","80212","80214","80216","80218","80219","80220","80221","80222","80223","80224","80226","80227","80228","80229","80230","80231","80232","80233","80234","80235","80236","80237","80238","80239","80246","80247","80249","80260","80264"],
  "atlanta-ga": ["30301","30303","30305","30306","30307","30308","30309","30310","30312","30313","30314","30315","30316","30317","30318","30319","30322","30324","30326","30327","30328","30329","30331","30332","30334","30336","30337","30338","30339","30340","30341","30342","30344","30345","30346","30349","30350","30354","30360","30363"],
  "chicago-il": ["60601","60602","60603","60604","60605","60606","60607","60608","60609","60610","60611","60612","60613","60614","60615","60616","60617","60618","60619","60620","60621","60622","60623","60624","60625","60626","60628","60629","60630","60631","60632","60634","60636","60637","60638","60639","60640","60641","60642","60643","60644","60645","60646","60647"],
  "houston-tx": ["77001","77002","77003","77004","77005","77006","77007","77008","77009","77010","77011","77012","77013","77014","77015","77016","77017","77018","77019","77020","77021","77022","77023","77024","77025","77026","77027","77028","77029","77030","77031","77033","77034","77035","77036","77038","77039","77040","77041","77042","77043","77044","77045","77047","77048","77049","77050","77051"],
  "seattle-wa": ["98101","98102","98103","98104","98105","98106","98107","98108","98109","98112","98115","98116","98117","98118","98119","98121","98122","98125","98126","98133","98134","98136","98144","98146","98154","98164","98174","98177","98178","98188","98195","98199"],
  "nashville-tn": ["37201","37203","37204","37205","37206","37207","37208","37209","37210","37211","37212","37213","37214","37215","37216","37217","37218","37219","37220","37221","37228","37232","37234","37236"],
  "portland-or": ["97201","97202","97203","97204","97205","97206","97209","97210","97211","97212","97213","97214","97215","97216","97217","97218","97219","97220","97221","97222","97223","97224","97225","97227","97229","97230","97231","97232","97233","97236","97239","97266"],
  "san-francisco-ca": ["94102","94103","94104","94105","94107","94108","94109","94110","94111","94112","94114","94115","94116","94117","94118","94121","94122","94123","94124","94127","94129","94130","94131","94132","94133","94134","94158"],
  "phoenix-az": ["85001","85003","85004","85006","85007","85008","85009","85012","85013","85014","85015","85016","85017","85018","85019","85020","85021","85022","85023","85024","85027","85028","85029","85031","85032","85033","85034","85035","85037","85040","85041","85042","85043","85044","85045","85048","85050","85051","85053","85054"],
  "san-diego-ca": ["92101","92102","92103","92104","92105","92106","92107","92108","92109","92110","92111","92113","92114","92115","92116","92117","92119","92120","92121","92122","92123","92124","92126","92127","92128","92129","92130","92131","92132","92134","92139","92154"],
  "dallas-tx": ["75201","75202","75203","75204","75205","75206","75207","75208","75209","75210","75211","75212","75214","75215","75216","75217","75218","75219","75220","75223","75224","75225","75226","75227","75228","75229","75230","75231","75232","75233","75234","75235","75236","75237","75238","75240","75243","75244","75246","75247","75248","75249","75251","75252","75253","75254"],
  "philadelphia-pa": ["19102","19103","19104","19106","19107","19109","19111","19114","19115","19116","19118","19119","19120","19121","19122","19123","19124","19125","19126","19127","19128","19129","19130","19131","19132","19133","19134","19135","19136","19137","19138","19139","19140","19141","19142","19143","19144","19145","19146","19147","19148","19149","19150","19151","19152","19153","19154"],
  "boston-ma": ["02101","02108","02109","02110","02111","02113","02114","02115","02116","02118","02119","02120","02121","02122","02124","02125","02126","02127","02128","02129","02130","02131","02132","02134","02135","02136","02163","02199","02210","02215"],
  "minneapolis-mn": ["55401","55402","55403","55404","55405","55406","55407","55408","55409","55410","55411","55412","55413","55414","55415","55416","55417","55418","55419","55420","55422","55423","55424","55426","55427","55428","55429","55430","55431","55432","55433"],
  "detroit-mi": ["48201","48202","48203","48204","48205","48206","48207","48208","48209","48210","48211","48212","48213","48214","48215","48216","48217","48219","48221","48223","48224","48225","48226","48227","48228","48234","48235","48236","48238","48239","48240"],
};

// ─── 85 CONDITIONS ──────────────────────────────────────────────────

const CONDITIONS = [
  "anxiety","depression","insomnia","ptsd","adhd","addiction","eating-disorder",
  "chronic-pain","fibromyalgia","ocd","bipolar","autism","grief","anger-management",
  "couples-therapy","trauma","substance-abuse","stress","self-esteem","phobias",
  "panic-disorder","social-anxiety","postpartum-depression","domestic-violence",
  "sexual-abuse-recovery","divorce-counseling","career-counseling","child-therapy",
  "teen-therapy","family-therapy","mindfulness-therapy","cbt-therapy","emdr-therapy",
  "dbt-therapy","somatic-therapy","art-therapy","music-therapy","play-therapy",
  "addiction-recovery","alcohol-addiction","opioid-addiction","gambling-addiction",
  "sex-addiction","marijuana-dependence","prescription-drug-abuse","meth-addiction",
  "cocaine-addiction","benzo-withdrawal","sleep-disorders","chronic-fatigue","ibs",
  "autoimmune-disease","thyroid-disorder","weight-management","nutrition-therapy",
  "holistic-medicine","functional-medicine","acupuncture","chiropractic-care",
  "massage-therapy","physical-therapy","occupational-therapy","speech-therapy",
  "naturopathic-medicine","integrative-psychiatry","pain-management","headaches",
  "migraines","back-pain","neck-pain","knee-pain","shoulder-pain","hip-pain",
  "sciatica","sports-injury","prenatal-care","postpartum-care","fertility",
  "menopause","pelvic-floor-therapy","hormone-therapy","mens-health","womens-health",
  "senior-wellness","pediatric-wellness",
];

// ─── 120+ PRODUCT COMPARISONS ───────────────────────────────────────

const PRODUCT_COMPARISONS = [
  ["ashwagandha","rhodiola"],["magnesium-glycinate","magnesium-threonate"],
  ["magnesium-glycinate","magnesium-citrate"],["magnesium-threonate","magnesium-taurate"],
  ["cbd-oil","melatonin"],["cbd-oil","ashwagandha"],["cbd-oil","valerian-root"],
  ["cbd-oil","l-theanine"],["cbd-oil","gaba"],
  ["lions-mane","reishi"],["lions-mane","cordyceps"],["reishi","chaga"],
  ["lions-mane","alpha-gpc"],["cordyceps","rhodiola"],
  ["omega-3","krill-oil"],["omega-3","algae-oil"],["fish-oil","flaxseed-oil"],
  ["probiotics","prebiotics"],["probiotics","digestive-enzymes"],["probiotics","kefir"],
  ["vitamin-d3","vitamin-d2"],["vitamin-d3","vitamin-k2"],
  ["whey-protein","plant-protein"],["whey-protein","casein-protein"],["collagen-peptides","whey-protein"],
  ["collagen-peptides","biotin"],["collagen-peptides","hyaluronic-acid"],
  ["turmeric","curcumin"],["turmeric","boswellia"],["turmeric","ginger"],
  ["elderberry","echinacea"],["elderberry","vitamin-c"],["elderberry","zinc"],
  ["zinc","quercetin"],["zinc","vitamin-c"],["zinc","copper"],
  ["b12-methylcobalamin","b12-cyanocobalamin"],["b-complex","b12"],
  ["coq10","pqq"],["coq10","alpha-lipoic-acid"],["coq10","ubiquinol"],
  ["valerian-root","passionflower"],["valerian-root","melatonin"],["valerian-root","chamomile"],
  ["gaba","l-theanine"],["gaba","magnesium"],["l-theanine","caffeine"],
  ["sam-e","5-htp"],["sam-e","st-johns-wort"],["5-htp","tryptophan"],
  ["berberine","metformin"],["berberine","cinnamon-extract"],["berberine","chromium"],
  ["spirulina","chlorella"],["spirulina","wheatgrass"],
  ["maca","tribulus"],["maca","ashwagandha"],["maca","tongkat-ali"],
  ["creatine","beta-alanine"],["creatine","citrulline"],["creatine","hmb"],
  ["iron-bisglycinate","iron-sulfate"],["iron-bisglycinate","ferrous-fumarate"],
  ["melatonin","magnesium-glycinate"],["melatonin","l-theanine"],["melatonin","tart-cherry"],
  ["saw-palmetto","pygeum"],["black-cohosh","dong-quai"],["vitex","evening-primrose-oil"],
  ["glucosamine","chondroitin"],["glucosamine","msm"],["glucosamine","turmeric"],
  ["milk-thistle","nac"],["nac","glutathione"],["milk-thistle","artichoke-extract"],
  ["astragalus","echinacea"],["olive-leaf-extract","oregano-oil"],
  ["oura-ring","whoop"],["oura-ring","apple-watch"],["whoop","fitbit"],["garmin","apple-watch"],
  ["eight-sleep","chilipad"],["theragun","hypervolt"],["theragun","normatec"],
  ["betterhelp","talkspace"],["betterhelp","cerebral"],["headspace","calm"],["headspace","waking-up"],
  ["peloton","tonal"],["peloton","mirror"],["classpass","mindbody"],
  ["ag1","bloom-greens"],["ag1","amazing-grass"],["ag1","organifi"],
  ["noom","weight-watchers"],["noom","calibrate"],
  ["hims","keeps"],["nurx","simple-health"],
  ["ritual-vitamins","care-of"],["ritual-vitamins","persona"],
];

// ─── 60 "BEST FOR" TERMS ───────────────────────────────────────────

const BEST_FOR = [
  "best-magnesium-for-sleep","best-magnesium-for-anxiety","best-magnesium-for-muscle-cramps",
  "best-probiotic-for-ibs","best-probiotic-for-bloating","best-probiotic-for-women","best-probiotic-for-men",
  "best-supplement-for-anxiety","best-supplement-for-depression","best-supplement-for-sleep",
  "best-supplement-for-energy","best-supplement-for-focus","best-supplement-for-stress",
  "best-supplement-for-gut-health","best-supplement-for-joint-pain","best-supplement-for-inflammation",
  "best-supplement-for-brain-fog","best-supplement-for-fatigue","best-supplement-for-memory",
  "best-cbd-for-anxiety","best-cbd-for-sleep","best-cbd-for-pain","best-cbd-for-inflammation",
  "best-mushroom-supplement","best-mushroom-for-focus","best-mushroom-for-immunity",
  "best-adaptogen-for-stress","best-adaptogen-for-energy","best-nootropic-for-focus",
  "best-protein-powder-for-weight-loss","best-protein-powder-for-women","best-collagen-supplement",
  "best-omega-3-supplement","best-fish-oil","best-vitamin-d-supplement","best-b12-supplement",
  "best-iron-supplement-for-women","best-prenatal-vitamin","best-multivitamin-for-men",
  "best-multivitamin-for-women","best-multivitamin-for-seniors",
  "best-wearable-for-sleep","best-fitness-tracker-2025","best-meditation-app-2025",
  "best-therapy-app","best-online-therapy-2025","best-telehealth-platform",
  "best-weighted-blanket","best-blue-light-glasses","best-air-purifier-for-allergies",
  "best-journal-for-mental-health","best-books-for-anxiety","best-books-for-depression",
  "best-podcasts-for-mental-health","best-podcasts-for-wellness",
  "best-greens-powder","best-electrolyte-supplement","best-sleep-supplement",
  "best-natural-anxiety-remedy","best-natural-sleep-aid","best-natural-anti-inflammatory",
];

// ─── HTTP + HELPERS ─────────────────────────────────────────────────

function httpFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    const req = mod.request(parsed, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 45000,
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: () => JSON.parse(data), text: () => data }); }
        catch(e) { resolve({ status: res.statusCode, json: () => ({}), text: () => data }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (options.body) req.write(options.body);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function db(method, table, body = null, query = '') {
  const headers = {
    'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (method === 'POST') headers['Prefer'] = 'resolution=merge-duplicates';
  try {
    const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await httpFetch(url, opts);
    if (method === 'GET') return await res.json();
    return res.status;
  } catch(e) { return method === 'GET' ? [] : 500; }
}

// Batch upsert with chunking
async function dbBatch(table, records) {
  if (!records.length) return 0;
  let ok = 0;
  for (let i = 0; i < records.length; i += 500) {
    const chunk = records.slice(i, i + 500);
    const status = await db('POST', table, chunk);
    if (status < 300) ok += chunk.length;
  }
  return ok;
}

// ─── CLAUDE API — DUAL MODEL ───────────────────────────────────────

async function callClaude(prompt, model = 'haiku', maxTokens = 1000) {
  if (!checkBudget(model)) {
    console.log(`    ⚠ Budget limit hit for ${model}, skipping`);
    return null;
  }

  const modelId = model === 'sonnet'
    ? 'claude-sonnet-4-20250514'
    : 'claude-haiku-4-5-20251001';

  try {
    const res = await httpFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    trackSpend(model);
    const text = data.content?.[0]?.text || '';
    try {
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch(e) {
      return text; // Return raw if not JSON
    }
  } catch(e) {
    console.error(`    ✗ Claude ${model} error:`, e.message);
    return null;
  }
}

// ─── SCRAPERS (ALL FREE) ────────────────────────────────────────────

async function scrapeNPI(zip) {
  try {
    const res = await httpFetch(`https://npiregistry.cms.hhs.gov/api/?version=2.1&postal_code=${zip}&limit=200&enumeration_type=NPI-1`);
    const data = await res.json();
    return (data.results || []).map(r => {
      const b = r.basic||{}, a = (r.addresses||[])[0]||{}, t = (r.taxonomies||[])[0]||{};
      const name = `${b.first_name||''} ${b.last_name||''}`.trim();
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      return {
        npi: r.number, name, slug, credential: b.credential||'',
        specialty: t.desc||'', taxonomy_code: t.code||'',
        city: (a.city||'').toLowerCase(), state: (a.state||'').toUpperCase(),
        zip: (a.postal_code||'').slice(0,5), address: a.address_1||'',
        phone: a.telephone_number||'', gender: b.gender||'',
        source: 'npi', updated_at: new Date().toISOString(),
      };
    }).filter(p => p.name.length > 2);
  } catch(e) { return []; }
}

async function scrapePubMed(query, max = 10) {
  try {
    const s = await httpFetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=${max}&sort=date&term=${encodeURIComponent(query)}`);
    const ids = (await s.json()).esearchresult?.idlist || [];
    if (!ids.length) return [];
    const f = await httpFetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}`);
    const results = (await f.json()).result || {};
    return ids.map(id => { const r = results[id]; if (!r) return null; return {
      pmid: id, title: r.title||'', authors: (r.authors||[]).map(a=>a.name).join(', '),
      journal: r.fulljournalname||r.source||'', pub_date: r.pubdate||'',
      doi: (r.elocationid||'').replace('doi: ',''), query_term: query,
      fetched_at: new Date().toISOString(),
    };}).filter(Boolean);
  } catch(e) { return []; }
}

async function scrapeFDA(drug) {
  try {
    const r = await httpFetch(`https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(drug)}"&limit=3`);
    return ((await r.json()).results||[]).map(x => ({
      drug_name: drug, brand_name: x.openfda?.brand_name?.[0]||'',
      warnings: (x.warnings||[]).join(' ').slice(0,2000),
      interactions: (x.drug_interactions||[]).join(' ').slice(0,2000),
      adverse_reactions: (x.adverse_reactions||[]).join(' ').slice(0,2000),
      indications: (x.indications_and_usage||[]).join(' ').slice(0,2000),
      source: 'openfda', fetched_at: new Date().toISOString(),
    }));
  } catch(e) { return []; }
}

async function scrapeFDAEvents(drug) {
  try {
    const r = await httpFetch(`https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:"${encodeURIComponent(drug)}"&count=patient.reaction.reactionmeddrapt.exact&limit=20`);
    return ((await r.json()).results||[]).map(x => ({
      drug_name: drug, reaction: x.term, count: x.count,
      source: 'fda_faers', fetched_at: new Date().toISOString(),
    }));
  } catch(e) { return []; }
}

async function scrapeClinicalTrials(condition, max = 10) {
  try {
    const r = await httpFetch(`https://clinicaltrials.gov/api/v2/studies?query.cond=${encodeURIComponent(condition)}&pageSize=${max}&sort=LastUpdatePostDate:desc&fields=NCTId,BriefTitle,OverallStatus,StartDate,Condition`);
    return ((await r.json()).studies||[]).map(s => {
      const p = s.protocolSection||{}, id = p.identificationModule||{}, st = p.statusModule||{};
      return { nct_id: id.nctId||'', title: id.briefTitle||'', status: st.overallStatus||'',
        start_date: st.startDateStruct?.date||'', conditions: (p.conditionsModule?.conditions||[]).join(', '),
        query_term: condition, fetched_at: new Date().toISOString() };
    });
  } catch(e) { return []; }
}

// ═══════════════════════════════════════════════════════════════════
// AI CONTENT WRITERS — HAIKU FOR VOLUME, SONNET FOR PILLAR
// ═══════════════════════════════════════════════════════════════════

// HAIKU: Quick, unique practitioner pages ($0.005 each)
async function aiWritePractitioner(p) {
  const prompt = `Write unique SEO content for a wellness directory listing. Be warm, professional, 200 words total.

${p.name}${p.credential ? ', ' + p.credential : ''} — ${p.specialty || 'Healthcare Provider'} in ${p.city}, ${p.state} ${p.zip}

Return ONLY JSON:
{"title":"60 char SEO title with name, specialty, city","meta_description":"155 char meta","intro":"3 sentences about this practitioner","specialty_text":"2 sentences about their focus area","location_text":"2 sentences about location and access","cta":"1 sentence call to action"}`;

  return await callClaude(prompt, 'haiku', 500);
}

// HAIKU: Unique condition+city pages ($0.005 each)
async function aiWriteConditionCity(condition, cityName, state) {
  const cond = condition.replace(/-/g,' ');
  const prompt = `Write unique SEO content for "${cond} treatment in ${cityName}, ${state}" wellness directory page. 300 words total. Empathetic, informative, NOT medical advice.

Return ONLY JSON:
{"title":"60 char SEO title","meta_description":"155 char meta","intro":"3 sentences","what_is":"3 sentences explaining ${cond}","treatment_options":"4 sentences on approaches","finding_help":"3 sentences mentioning BLEU.LIVE directory","local_context":"2 sentences about ${cityName} wellness scene","cta":"2 sentence call to action"}`;

  return await callClaude(prompt, 'haiku', 700);
}

// HAIKU: Unique comparison pages ($0.005 each)
async function aiWriteComparison(p1, p2) {
  const n1 = p1.replace(/-/g,' '), n2 = p2.replace(/-/g,' ');
  const prompt = `Write "${n1} vs ${n2}" comparison for wellness directory. 300 words. Evidence-informed, balanced, not medical advice. Mention BLEU.LIVE Safety Check for interactions.

Return ONLY JSON:
{"title":"60 char title","meta_description":"155 chars","intro":"3 sentences","p1_overview":"3 sentences on ${n1}","p2_overview":"3 sentences on ${n2}","differences":"4 sentences comparing","who_should_choose":"3 sentences practical guidance","safety":"2 sentences on checking interactions","verdict":"2 sentence balanced conclusion"}`;

  return await callClaude(prompt, 'haiku', 700);
}

// HAIKU: "Best for" pages ($0.005 each)
async function aiWriteBestFor(term) {
  const title = term.replace(/-/g,' ');
  const prompt = `Write "${title}" guide for wellness directory. 300 words. Evidence-based picks, what to look for, safety notes. Mention BLEU.LIVE for verification.

Return ONLY JSON:
{"title":"60 char title","meta_description":"155 chars","intro":"3 sentences on why this matters","criteria":"3 sentences on what to look for","top_picks_text":"4 sentences discussing top options without specific brand endorsement","dosage_tips":"2 sentences","safety":"2 sentences on interactions","cta":"2 sentences"}`;

  return await callClaude(prompt, 'haiku', 700);
}

// SONNET: Deep city wellness guides ($0.014 each — premium content)
async function aiWriteCityGuide(cityName, state) {
  const prompt = `Write an 800-word comprehensive wellness city guide for ${cityName}, ${state} for BLEU.LIVE — "The Operating System for Human Longevity."

Cover: wellness culture & history, top neighborhoods for health-minded living, outdoor activities & nature, unique local wellness traditions, healthy food scene, practitioner landscape, mental health resources, fitness scene, community wellness events, and what makes this city unique for wellness.

Write with deep local knowledge. Make someone WANT to explore wellness in ${cityName}.

Return ONLY JSON:
{"title":"SEO title 60 chars","meta_description":"155 chars","h1":"compelling heading","sections":[{"heading":"section title","content":"3-5 paragraphs of rich content"}],"local_tips":["5 insider tips"],"wellness_score_factors":"3 sentences on what drives this city's wellness profile"}`;

  return await callClaude(prompt, 'sonnet', 1800);
}

// SONNET: Deep condition guides ($0.014 each — pillar content)
async function aiWriteConditionGuide(condition) {
  const cond = condition.replace(/-/g,' ');
  const prompt = `Write a 1000-word comprehensive guide about ${cond} for BLEU.LIVE wellness platform. This is PILLAR content that hundreds of city/practitioner pages will link to.

Cover: what it is and how it manifests, symptoms and warning signs, evidence-based treatment approaches (therapy types, medication, holistic, lifestyle), recent research developments, how to find the right provider, self-care strategies, when to seek immediate help, and the path forward.

Empathetic, evidence-informed, NOT medical advice. Write for someone actively seeking help.

Return ONLY JSON:
{"title":"SEO title","meta_description":"155 chars","h1":"heading","sections":[{"heading":"title","content":"rich paragraphs"}],"key_stats":"3 important statistics","related_conditions":["5 related conditions"],"treatment_types":["list of approaches"]}`;

  return await callClaude(prompt, 'sonnet', 2200);
}

// SONNET: Deep supplement guides ($0.014 each — pillar content)
async function aiWriteSupplementGuide(supplement) {
  const supp = supplement.replace(/-/g,' ');
  const prompt = `Write a 800-word evidence-based guide about ${supp} for BLEU.LIVE wellness platform. PILLAR content for SEO authority.

Cover: what it is, mechanism of action, research evidence, optimal dosage ranges, forms/bioavailability, timing, side effects, drug interactions (mention BLEU Safety Check Engine), who should/shouldn't use it, quality markers to look for, and bottom line.

Evidence-informed, cite study types (RCTs, meta-analyses) without specific citations. NOT medical advice.

Return ONLY JSON:
{"title":"SEO title","meta_description":"155 chars","h1":"heading","sections":[{"heading":"title","content":"paragraphs"}],"quick_facts":{"forms":"types","typical_dose":"range","timing":"when to take","interactions":"key ones"},"safety_rating":"low/moderate/high concern"}`;

  return await callClaude(prompt, 'sonnet', 1800);
}

// ═══════════════════════════════════════════════════════════════════
// PIPELINE ORCHESTRATOR — THE BEAST
// ═══════════════════════════════════════════════════════════════════

const S = {
  cycle: 0, started: new Date().toISOString(),
  practitioners: 0, aiPages: 0, templatePages: 0,
  studies: 0, fdaRecords: 0, errors: 0,
  running: false, lastCycle: null,
};

// PHASE 1: Scrape practitioners (FREE)
async function phaseScrape() {
  console.log('\n── PHASE 1: SCRAPING ──');
  const cities = Object.keys(CITY_ZIPS);
  // 5 cities × 6 ZIPs = 30 NPI calls per cycle
  const batch = [];
  for (let c = 0; c < 5; c++) {
    const city = cities[(S.cycle * 5 + c) % cities.length];
    const zips = CITY_ZIPS[city].sort(() => Math.random() - 0.5).slice(0, 6);
    console.log(`  📍 ${city} → ${zips.length} ZIPs`);
    for (const zip of zips) {
      batch.push(...await scrapeNPI(zip));
      await sleep(400);
    }
  }
  if (batch.length) {
    await dbBatch('practitioners', batch);
    S.practitioners += batch.length;
    console.log(`  ✓ ${batch.length} practitioners`);
  }

  // Research + FDA (FREE)
  for (let i = 0; i < 5; i++) {
    const cond = CONDITIONS[(S.cycle * 5 + i) % CONDITIONS.length].replace(/-/g,' ');
    const studies = await scrapePubMed(`${cond} treatment 2024 2025`, 8);
    if (studies.length) { await dbBatch('pubmed_studies', studies); S.studies += studies.length; }
    await sleep(350);
  }
  const drugs = ['cbd','melatonin','ashwagandha','turmeric','magnesium','omega-3','probiotics','zinc','iron','vitamin-d','b12','coq10','lions-mane','valerian','5-htp','nac','berberine','collagen','creatine','l-theanine'];
  for (let i = 0; i < 3; i++) {
    const drug = drugs[(S.cycle * 3 + i) % drugs.length];
    const labels = await scrapeFDA(drug);
    const events = await scrapeFDAEvents(drug);
    if (labels.length) await dbBatch('fda_data', labels);
    if (events.length) await dbBatch('fda_adverse_events', events);
    S.fdaRecords += labels.length + events.length;
    await sleep(300);
  }
  const trials = await scrapeClinicalTrials(CONDITIONS[S.cycle % CONDITIONS.length].replace(/-/g,' '), 10);
  if (trials.length) await dbBatch('clinical_trials', trials);
}

// PHASE 2: AI Volume Pages (HAIKU — $0.005/each, ~1000/day budget)
async function phaseHaikuVolume() {
  console.log('\n── PHASE 2: HAIKU VOLUME PAGES ──');
  const cities = Object.keys(CITY_ZIPS);
  let written = 0;

  // 20 practitioner pages per cycle
  const unwritten = await db('GET', 'practitioners', null, 'select=npi,name,slug,credential,specialty,city,state,zip,address,phone,gender&has_content=is.null&limit=20');
  if (Array.isArray(unwritten) && unwritten.length) {
    console.log(`  📝 ${unwritten.length} practitioner pages...`);
    for (const p of unwritten) {
      const content = await aiWritePractitioner(p);
      if (content && typeof content === 'object') {
        const cityTitle = (p.city||'').split(' ').map(w=>w[0]?.toUpperCase()+w.slice(1)).join(' ');
        await dbBatch('seo_pages', [{
          slug: `directory/${p.slug}`, page_type: 'practitioner',
          title: content.title || `${p.name} — ${p.specialty} in ${cityTitle}, ${p.state}`,
          meta_description: content.meta_description || '',
          h1: `${p.name}${p.credential ? ', '+p.credential : ''}`,
          content_json: JSON.stringify(content),
          city: p.city, state: p.state, status: 'published',
          created_at: new Date().toISOString(),
        }]);
        await db('PATCH', 'practitioners', { has_content: true }, `npi=eq.${p.npi}`);
        written++;
      }
      await sleep(800);
    }
  }

  // 15 condition/city pages per cycle
  console.log(`  📝 Condition/city pages...`);
  for (let i = 0; i < 15; i++) {
    const condIdx = (S.cycle * 15 + i) % CONDITIONS.length;
    const cityIdx = Math.floor((S.cycle * 15 + i) / CONDITIONS.length) % cities.length;
    const cityKey = cities[cityIdx];
    const slug = `${CONDITIONS[condIdx]}-treatment-${cityKey}`;

    // Check if exists
    const existing = await db('GET', 'seo_pages', null, `slug=eq.${encodeURIComponent(slug)}&select=slug&limit=1`);
    if (Array.isArray(existing) && existing.length) continue;

    const parts = cityKey.split('-');
    const st = parts.pop().toUpperCase();
    const cityName = parts.map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');

    const content = await aiWriteConditionCity(CONDITIONS[condIdx], cityName, st);
    if (content && typeof content === 'object') {
      await dbBatch('seo_pages', [{
        slug, page_type: 'condition_city',
        title: content.title, meta_description: content.meta_description,
        h1: content.title, content_json: JSON.stringify(content),
        city: cityName.toLowerCase(), state: st, condition: CONDITIONS[condIdx],
        status: 'published', created_at: new Date().toISOString(),
      }]);
      written++;
    }
    await sleep(800);
  }

  // 5 comparison pages per cycle
  console.log(`  📝 Comparison pages...`);
  for (let i = 0; i < 5; i++) {
    const idx = (S.cycle * 5 + i) % PRODUCT_COMPARISONS.length;
    const [p1, p2] = PRODUCT_COMPARISONS[idx];
    const slug = `${p1}-vs-${p2}`;
    const existing = await db('GET', 'seo_pages', null, `slug=eq.${encodeURIComponent(slug)}&select=slug&limit=1`);
    if (Array.isArray(existing) && existing.length) continue;

    const content = await aiWriteComparison(p1, p2);
    if (content && typeof content === 'object') {
      await dbBatch('seo_pages', [{
        slug, page_type: 'product_comparison',
        title: content.title, meta_description: content.meta_description,
        h1: content.title, content_json: JSON.stringify(content),
        status: 'published', created_at: new Date().toISOString(),
      }]);
      written++;
    }
    await sleep(800);
  }

  // 3 "best for" pages per cycle
  console.log(`  📝 "Best for" pages...`);
  for (let i = 0; i < 3; i++) {
    const idx = (S.cycle * 3 + i) % BEST_FOR.length;
    const slug = BEST_FOR[idx];
    const existing = await db('GET', 'seo_pages', null, `slug=eq.${encodeURIComponent(slug)}&select=slug&limit=1`);
    if (Array.isArray(existing) && existing.length) continue;

    const content = await aiWriteBestFor(slug);
    if (content && typeof content === 'object') {
      await dbBatch('seo_pages', [{
        slug, page_type: 'best_for',
        title: content.title, meta_description: content.meta_description,
        h1: content.title, content_json: JSON.stringify(content),
        status: 'published', created_at: new Date().toISOString(),
      }]);
      written++;
    }
    await sleep(800);
  }

  S.aiPages += written;
  console.log(`  ✓ ${written} Haiku pages written this cycle`);
}

// PHASE 3: Sonnet Pillar Pages (premium, ~5/cycle)
async function phaseSonnetPillars() {
  console.log('\n── PHASE 3: SONNET PILLAR PAGES ──');
  const cities = Object.keys(CITY_ZIPS);
  let written = 0;

  // 2 city guides
  for (let i = 0; i < 2; i++) {
    const cityKey = cities[(S.cycle * 2 + i) % cities.length];
    const slug = `city-wellness-guide-${cityKey}`;
    const existing = await db('GET', 'seo_pages', null, `slug=eq.${encodeURIComponent(slug)}&select=slug&limit=1`);
    if (Array.isArray(existing) && existing.length) continue;

    const parts = cityKey.split('-');
    const st = parts.pop().toUpperCase();
    const cityName = parts.map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');

    console.log(`  🤖 City guide: ${cityName}, ${st}`);
    const content = await aiWriteCityGuide(cityName, st);
    if (content && typeof content === 'object') {
      await dbBatch('seo_pages', [{
        slug, page_type: 'city_guide',
        title: content.title, meta_description: content.meta_description,
        h1: content.h1 || content.title, content_json: JSON.stringify(content),
        city: cityName.toLowerCase(), state: st,
        status: 'published', created_at: new Date().toISOString(),
      }]);
      written++;
    }
    await sleep(2000);
  }

  // 2 condition deep guides
  for (let i = 0; i < 2; i++) {
    const condIdx = (S.cycle * 2 + i) % CONDITIONS.length;
    const slug = `complete-guide-${CONDITIONS[condIdx]}`;
    const existing = await db('GET', 'seo_pages', null, `slug=eq.${encodeURIComponent(slug)}&select=slug&limit=1`);
    if (Array.isArray(existing) && existing.length) continue;

    console.log(`  🤖 Condition guide: ${CONDITIONS[condIdx]}`);
    const content = await aiWriteConditionGuide(CONDITIONS[condIdx]);
    if (content && typeof content === 'object') {
      await dbBatch('seo_pages', [{
        slug, page_type: 'condition_guide',
        title: content.title, meta_description: content.meta_description,
        h1: content.h1 || content.title, content_json: JSON.stringify(content),
        condition: CONDITIONS[condIdx],
        status: 'published', created_at: new Date().toISOString(),
      }]);
      written++;
    }
    await sleep(2000);
  }

  // 1 supplement guide
  const supps = ['ashwagandha','magnesium','cbd-oil','melatonin','lions-mane','omega-3','probiotics','turmeric','zinc','vitamin-d','b12','iron','coq10','collagen','creatine','l-theanine','gaba','5-htp','berberine','nac','rhodiola','reishi','cordyceps','maca','sam-e','valerian-root','passionflower','black-cohosh','saw-palmetto','milk-thistle'];
  const suppIdx = S.cycle % supps.length;
  const slug = `supplement-guide-${supps[suppIdx]}`;
  const existing = await db('GET', 'seo_pages', null, `slug=eq.${encodeURIComponent(slug)}&select=slug&limit=1`);
  if (!Array.isArray(existing) || !existing.length) {
    console.log(`  🤖 Supplement guide: ${supps[suppIdx]}`);
    const content = await aiWriteSupplementGuide(supps[suppIdx]);
    if (content && typeof content === 'object') {
      await dbBatch('seo_pages', [{
        slug, page_type: 'supplement_guide',
        title: content.title, meta_description: content.meta_description,
        h1: content.h1 || content.title, content_json: JSON.stringify(content),
        status: 'published', created_at: new Date().toISOString(),
      }]);
      written++;
    }
  }

  S.aiPages += written;
  console.log(`  ✓ ${written} Sonnet pillar pages`);
}

// ─── MAIN CYCLE ─────────────────────────────────────────────────────

async function runCycle() {
  if (S.running) return;
  S.running = true;
  S.cycle++;
  const start = Date.now();

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🔵 MAXED OUT PIPELINE v5.0 — CYCLE ${S.cycle}`);
  console.log(`   ${new Date().toISOString()}`);
  console.log(`   Budget: $${(BUDGET.spent_today_cents/100).toFixed(2)} today / $${(BUDGET.daily_limit_cents/100).toFixed(2)} limit`);
  console.log(`${'═'.repeat(60)}`);

  try {
    await phaseScrape();
    await phaseHaikuVolume();
    await phaseSonnetPillars();
  } catch(e) {
    console.error('✗ CYCLE ERROR:', e.message);
    S.errors++;
  }

  S.running = false;
  S.lastCycle = new Date().toISOString();
  const mins = ((Date.now() - start) / 60000).toFixed(1);

  console.log(`\n── CYCLE ${S.cycle} DONE (${mins} min) ──`);
  console.log(`  Practitioners: ${S.practitioners.toLocaleString()}`);
  console.log(`  AI pages: ${S.aiPages.toLocaleString()}`);
  console.log(`  Studies: ${S.studies} | FDA: ${S.fdaRecords}`);
  console.log(`  Today: Haiku ${BUDGET.haiku_calls_today} / Sonnet ${BUDGET.sonnet_calls_today}`);
  console.log(`  Spent: $${(BUDGET.spent_today_cents/100).toFixed(2)} today / $${(BUDGET.spent_total_cents/100).toFixed(2)} total`);
}

// ─── SERVER ─────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  const send = (code, data) => {
    res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(data, null, 2));
  };

  if (req.url === '/health' || req.url === '/') {
    return send(200, {
      status: 'MAXED_OUT', version: '5.0',
      ...S, budget: {
        daily_spent: `$${(BUDGET.spent_today_cents/100).toFixed(2)}`,
        daily_limit: `$${(BUDGET.daily_limit_cents/100).toFixed(2)}`,
        monthly_spent: `$${(BUDGET.spent_total_cents/100).toFixed(2)}`,
        monthly_limit: '$200.00',
        haiku_today: BUDGET.haiku_calls_today,
        sonnet_today: BUDGET.sonnet_calls_today,
        haiku_total: BUDGET.haiku_calls_total,
        sonnet_total: BUDGET.sonnet_calls_total,
      },
      uptime: `${(process.uptime()/3600).toFixed(1)}h`,
    });
  }

  if (req.url === '/stats') {
    const haikuPerCycle = 43; // 20 pract + 15 cond/city + 5 comp + 3 bestfor
    const sonnetPerCycle = 5;
    const cyclesPerDay = 24 * 60 / 8; // every 8 min = 180 cycles
    return send(200, {
      throughput: {
        haiku_pages_per_cycle: haikuPerCycle,
        sonnet_pages_per_cycle: sonnetPerCycle,
        total_pages_per_cycle: haikuPerCycle + sonnetPerCycle,
        cycle_interval: '8 minutes',
        cycles_per_day: cyclesPerDay,
        ai_pages_per_day: `~${((haikuPerCycle + sonnetPerCycle) * cyclesPerDay).toLocaleString()}`,
        ai_pages_per_month: `~${((haikuPerCycle + sonnetPerCycle) * cyclesPerDay * 30).toLocaleString()}`,
        practitioners_per_day: `~${(6000 * cyclesPerDay / 180).toLocaleString()}`,
      },
      content_types: {
        practitioner_profiles: `${haikuPerCycle > 15 ? '20' : '0'}/cycle (Haiku, unique AI content)`,
        condition_city: '15/cycle (Haiku, unique for each city)',
        comparisons: '5/cycle (Haiku, evidence-informed)',
        best_for: '3/cycle (Haiku, product guides)',
        city_guides: '2/cycle (Sonnet, 800-word deep guides)',
        condition_guides: '2/cycle (Sonnet, 1000-word pillar content)',
        supplement_guides: '1/cycle (Sonnet, 800-word pillar content)',
      },
      seo_capacity: {
        condition_city_combos: `${CONDITIONS.length} × ${Object.keys(CITY_ZIPS).length} = ${CONDITIONS.length * Object.keys(CITY_ZIPS).length}`,
        comparisons: PRODUCT_COMPARISONS.length,
        best_for: BEST_FOR.length,
        city_guides: Object.keys(CITY_ZIPS).length,
        condition_guides: CONDITIONS.length,
        supplement_guides: '30+',
        practitioner_profiles: 'Unlimited (7M+ in NPI)',
      },
      budget: {
        monthly: '$200',
        haiku_share: '$150 (~30,000 calls)',
        sonnet_share: '$50 (~3,500 calls)',
        cost_per_ai_page_haiku: '$0.005',
        cost_per_ai_page_sonnet: '$0.014',
        total_ai_pages_possible: '~33,500/month',
      },
      free_data_sources: [
        'NPI Registry — 7M+ providers, unlimited',
        'PubMed — 36M papers, 3 req/sec',
        'OpenFDA Labels — drug labels, 240 req/min',
        'OpenFDA FAERS — adverse events, 240 req/min',
        'RxNorm — drug data, unlimited',
        'ClinicalTrials.gov — trials, unlimited',
      ],
    });
  }

  if (req.url === '/run') {
    send(200, { triggered: true });
    runCycle();
    return;
  }

  if (req.url === '/budget') {
    return send(200, BUDGET);
  }

  send(404, { error: 'Try /health /stats /budget /run' });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`\n${'═'.repeat(60)}`);
  console.log('🔵 BLEU.LIVE — MAXED OUT PIPELINE v5.0');
  console.log('   EVERY PAGE = UNIQUE AI CONTENT');
  console.log('   $200/mo → 33,500 AI pages/month');
  console.log(`${'═'.repeat(60)}`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Cities: ${Object.keys(CITY_ZIPS).length}`);
  console.log(`  Conditions: ${CONDITIONS.length}`);
  console.log(`  Comparisons: ${PRODUCT_COMPARISONS.length}`);
  console.log(`  "Best for" terms: ${BEST_FOR.length}`);
  console.log(`  Haiku budget: $150/mo (~1,000/day)`);
  console.log(`  Sonnet budget: $50/mo (~117/day)`);
  console.log(`  Cycle: every 8 minutes`);
  console.log(`${'═'.repeat(60)}\n`);

  setTimeout(runCycle, 5000);
  setInterval(runCycle, 8 * 60 * 1000);
});
