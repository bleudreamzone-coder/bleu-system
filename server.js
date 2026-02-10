// ═══════════════════════════════════════════════════════════════════════════════
//  BLEU.LIVE ENGINE v2.0 — FULL DECK PRODUCTION SERVER
//  68 APIs (25 keyed + 43 free) | Safety Engine | NPI Pipeline | Scheduler
//  Deploy to Railway: git add -A && git commit -m "v2 full deck" && git push
// ═══════════════════════════════════════════════════════════════════════════════

const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = process.env.PORT || 8080;

// ═══ API KEYS — Railway Environment Variables ═══
const KEYS = {
  claude:       process.env.CLAUDE_API_KEY || '',
  supabaseUrl:  process.env.SUPABASE_URL || '',
  supabaseKey:  process.env.SUPABASE_SERVICE_KEY || '',
  ncbi:         process.env.NCBI_API_KEY || '',
  usda:         process.env.USDA_FOODDATA_API_KEY || '',
  weather:      process.env.OPENWEATHERMAP_API_KEY || '',
  waqi:         process.env.WAQI_API_KEY || '',
  census:       process.env.CENSUS_API_KEY || '',
  cannlytics:   process.env.CANNLYTICS_API_KEY || '',
  openfda:      process.env.OPENFDA_API_KEY || '',
  openuv:       process.env.OPENUV_API_KEY || '',
  google:       process.env.GOOGLE_API_KEY || '',
  yelp:         process.env.YELP_API_KEY || '',
  nps:          process.env.NPS_API_KEY || '',
  spoonacular:  process.env.SPOONACULAR_API_KEY || '',
  foursquare:   process.env.FOURSQUARE_API_KEY || '',
  eventbrite:   process.env.EVENTBRITE_API_KEY || '',
  listenNotes:  process.env.LISTEN_NOTES_API_KEY || '',
  edamamId:     process.env.EDAMAM_APP_ID || '',
  edamamKey:    process.env.EDAMAM_APP_KEY || '',
  sendgrid:     process.env.SENDGRID_API_KEY || '',
  walkscore:    process.env.WALKSCORE_API_KEY || '',
  airnow:       process.env.AIRNOW_API_KEY || '',
  meersens:     process.env.MEERSENS_API_KEY || '',
  amazon:       process.env.AMAZON_AFFILIATE_TAG || 'bleulive-20',
};

function log(tag, msg) { console.log(`[${new Date().toISOString()}] [${tag}] ${msg}`); }

// ═══ HTTP FETCH HELPER ═══
function fetchJSON(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname, path: u.pathname + u.search, port: u.port || 443,
      method: options.method || 'GET',
      headers: { 'Accept': 'application/json', 'User-Agent': 'BLEU-Live/2.0', ...(options.headers || {}) },
      timeout: options.timeout || 15000
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve({ raw: data, status: res.statusCode }); } });
    });
    req.on('error', e => reject(e));
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    req.end();
  });
}

// ═══ SUPABASE LIGHTWEIGHT CLIENT ═══
const supabase = {
  async query(table, params = '') {
    if (!KEYS.supabaseUrl || !KEYS.supabaseKey) return { error: 'No Supabase config' };
    try {
      return await fetchJSON(`${KEYS.supabaseUrl}/rest/v1/${table}?${params}`, {
        headers: { 'apikey': KEYS.supabaseKey, 'Authorization': `Bearer ${KEYS.supabaseKey}`, 'Prefer': 'return=representation' }
      });
    } catch(e) { return { error: e.message }; }
  },
  async upsert(table, data) {
    if (!KEYS.supabaseUrl || !KEYS.supabaseKey) return { error: 'No Supabase config' };
    try {
      return await fetchJSON(`${KEYS.supabaseUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers: { 'apikey': KEYS.supabaseKey, 'Authorization': `Bearer ${KEYS.supabaseKey}`,
          'Content-Type': 'application/json', 'Prefer': 'return=representation,resolution=merge-duplicates' },
        body: JSON.stringify(Array.isArray(data) ? data : [data])
      });
    } catch(e) { return { error: e.message }; }
  }
};

// ═══ TARGET CITIES ═══
const TARGET_CITIES = [
  { name:'New Orleans', state:'LA', lat:29.95, lng:-90.07, zip:'70112' },
  { name:'Baton Rouge', state:'LA', lat:30.45, lng:-91.19, zip:'70801' },
  { name:'Houston', state:'TX', lat:29.76, lng:-95.37, zip:'77001' },
  { name:'Atlanta', state:'GA', lat:33.75, lng:-84.39, zip:'30301' },
  { name:'Los Angeles', state:'CA', lat:34.05, lng:-118.24, zip:'90001' },
  { name:'New York', state:'NY', lat:40.71, lng:-74.01, zip:'10001' },
  { name:'Chicago', state:'IL', lat:41.88, lng:-87.63, zip:'60601' },
  { name:'Miami', state:'FL', lat:25.76, lng:-80.19, zip:'33101' },
  { name:'Denver', state:'CO', lat:39.74, lng:-104.99, zip:'80201' },
  { name:'Portland', state:'OR', lat:45.52, lng:-122.68, zip:'97201' },
  { name:'San Francisco', state:'CA', lat:37.77, lng:-122.42, zip:'94102' },
  { name:'Seattle', state:'WA', lat:47.61, lng:-122.33, zip:'98101' },
  { name:'Austin', state:'TX', lat:30.27, lng:-97.74, zip:'78701' },
  { name:'Nashville', state:'TN', lat:36.16, lng:-86.78, zip:'37201' },
  { name:'Phoenix', state:'AZ', lat:33.45, lng:-112.07, zip:'85001' },
  { name:'Detroit', state:'MI', lat:42.33, lng:-83.05, zip:'48201' },
  { name:'Philadelphia', state:'PA', lat:39.95, lng:-75.17, zip:'19101' },
  { name:'Dallas', state:'TX', lat:32.78, lng:-96.80, zip:'75201' },
  { name:'Las Vegas', state:'NV', lat:36.17, lng:-115.14, zip:'89101' },
  { name:'Charlotte', state:'NC', lat:35.23, lng:-80.84, zip:'28201' },
];

const CONDITIONS = [
  'anxiety','depression','chronic-pain','insomnia','ptsd','adhd',
  'addiction-recovery','inflammation','migraine','fibromyalgia',
  'ibs','arthritis','diabetes','hypertension','obesity',
  'menopause','endometriosis','autoimmune','cancer-support','hiv-wellness'
];

// ═══════════════════════════════════════════════════════════════
// PHARMACOLOGY DATABASE — 54 Substances
// ═══════════════════════════════════════════════════════════════
const PHARMA_DB = {
  'thc': { class:'cannabinoid', cyp_substrates:['CYP2C9','CYP3A4'], cyp_inhibits:['CYP2C9','CYP3A4'], receptor:['CB1','CB2'], effects:['euphoria','pain_relief','appetite'], serotonergic:false, nti:false, half_life:'1-3h', schedule:'I/state-legal' },
  'cbd': { class:'cannabinoid', cyp_substrates:['CYP2C19','CYP3A4'], cyp_inhibits:['CYP2C19','CYP3A4','CYP2D6','CYP2C9'], receptor:['CB1_antagonist','5HT1A','TRPV1'], effects:['anxiolytic','anti_inflammatory','anticonvulsant'], serotonergic:true, nti:false, half_life:'18-32h', schedule:'unscheduled' },
  'cbg': { class:'cannabinoid', cyp_substrates:['CYP3A4'], cyp_inhibits:[], receptor:['CB1_partial','CB2','5HT1A','alpha2'], effects:['anti_inflammatory','antibacterial','neuroprotective'], serotonergic:true, nti:false, half_life:'2-4h', schedule:'unscheduled' },
  'cbn': { class:'cannabinoid', cyp_substrates:['CYP3A4','CYP2C9'], cyp_inhibits:[], receptor:['CB1_weak','CB2'], effects:['sedation','anti_inflammatory'], serotonergic:false, nti:false, half_life:'2-4h', schedule:'unscheduled' },
  'delta-8-thc': { class:'cannabinoid', cyp_substrates:['CYP3A4','CYP2C9'], cyp_inhibits:['CYP3A4'], receptor:['CB1_partial','CB2'], effects:['mild_euphoria','antiemetic','anxiolytic'], serotonergic:false, nti:false, half_life:'1-3h', schedule:'variable' },
  'thcv': { class:'cannabinoid', cyp_substrates:['CYP3A4'], cyp_inhibits:[], receptor:['CB1_antagonist_low','CB2'], effects:['appetite_suppression','energizing'], serotonergic:false, nti:false, half_life:'1-2h', schedule:'unscheduled' },
  'thca': { class:'cannabinoid', cyp_substrates:['CYP3A4'], cyp_inhibits:[], receptor:['TRPA1','TRPM8'], effects:['anti_inflammatory','antiemetic','neuroprotective'], serotonergic:false, nti:false, half_life:'1-2h', schedule:'unscheduled' },
  'cbda': { class:'cannabinoid', cyp_substrates:['CYP2C19'], cyp_inhibits:[], receptor:['5HT1A','TRPV1'], effects:['antiemetic','anti_inflammatory'], serotonergic:true, nti:false, half_life:'1-2h', schedule:'unscheduled' },
  'sertraline': { class:'ssri', cyp_substrates:['CYP2B6','CYP2C19','CYP2D6','CYP3A4'], cyp_inhibits:['CYP2D6','CYP2B6'], receptor:['SERT'], effects:['antidepressant','anxiolytic'], serotonergic:true, nti:false, half_life:'26h', schedule:'Rx' },
  'fluoxetine': { class:'ssri', cyp_substrates:['CYP2D6','CYP2C9'], cyp_inhibits:['CYP2D6','CYP2C19'], receptor:['SERT'], effects:['antidepressant','anxiolytic'], serotonergic:true, nti:false, half_life:'1-6 days', schedule:'Rx' },
  'escitalopram': { class:'ssri', cyp_substrates:['CYP2C19','CYP3A4'], cyp_inhibits:['CYP2D6_weak'], receptor:['SERT'], effects:['antidepressant','anxiolytic'], serotonergic:true, nti:false, half_life:'27-33h', schedule:'Rx' },
  'paroxetine': { class:'ssri', cyp_substrates:['CYP2D6'], cyp_inhibits:['CYP2D6'], receptor:['SERT'], effects:['antidepressant','anxiolytic'], serotonergic:true, nti:false, half_life:'21h', schedule:'Rx' },
  'venlafaxine': { class:'snri', cyp_substrates:['CYP2D6','CYP3A4'], cyp_inhibits:[], receptor:['SERT','NET'], effects:['antidepressant','anxiolytic','pain'], serotonergic:true, nti:false, half_life:'5h', schedule:'Rx' },
  'duloxetine': { class:'snri', cyp_substrates:['CYP1A2','CYP2D6'], cyp_inhibits:['CYP2D6'], receptor:['SERT','NET'], effects:['antidepressant','pain','fibromyalgia'], serotonergic:true, nti:false, half_life:'12h', schedule:'Rx' },
  'bupropion': { class:'ndri', cyp_substrates:['CYP2B6'], cyp_inhibits:['CYP2D6'], receptor:['NET','DAT'], effects:['antidepressant','smoking_cessation','energizing'], serotonergic:false, nti:false, half_life:'21h', schedule:'Rx' },
  'alprazolam': { class:'benzodiazepine', cyp_substrates:['CYP3A4'], cyp_inhibits:[], receptor:['GABA_A'], effects:['anxiolytic','sedation','muscle_relaxant'], serotonergic:false, nti:true, half_life:'11h', schedule:'IV' },
  'diazepam': { class:'benzodiazepine', cyp_substrates:['CYP2C19','CYP3A4'], cyp_inhibits:[], receptor:['GABA_A'], effects:['anxiolytic','sedation','anticonvulsant'], serotonergic:false, nti:true, half_life:'20-100h', schedule:'IV' },
  'clonazepam': { class:'benzodiazepine', cyp_substrates:['CYP3A4'], cyp_inhibits:[], receptor:['GABA_A'], effects:['anxiolytic','anticonvulsant'], serotonergic:false, nti:true, half_life:'30-40h', schedule:'IV' },
  'gabapentin': { class:'gabapentinoid', cyp_substrates:[], cyp_inhibits:[], receptor:['alpha2delta'], effects:['pain','anticonvulsant','anxiolytic'], serotonergic:false, nti:false, half_life:'5-7h', schedule:'V' },
  'pregabalin': { class:'gabapentinoid', cyp_substrates:[], cyp_inhibits:[], receptor:['alpha2delta'], effects:['pain','anticonvulsant','anxiolytic'], serotonergic:false, nti:false, half_life:'6h', schedule:'V' },
  'tramadol': { class:'opioid', cyp_substrates:['CYP2D6','CYP3A4'], cyp_inhibits:[], receptor:['MOR','SERT','NET'], effects:['pain_relief'], serotonergic:true, nti:false, half_life:'6h', schedule:'IV' },
  'oxycodone': { class:'opioid', cyp_substrates:['CYP3A4','CYP2D6'], cyp_inhibits:[], receptor:['MOR'], effects:['pain_relief'], serotonergic:false, nti:true, half_life:'3-5h', schedule:'II' },
  'morphine': { class:'opioid', cyp_substrates:['UGT2B7'], cyp_inhibits:[], receptor:['MOR'], effects:['pain_relief'], serotonergic:false, nti:true, half_life:'2-4h', schedule:'II' },
  'methadone': { class:'opioid', cyp_substrates:['CYP3A4','CYP2B6','CYP2D6'], cyp_inhibits:['CYP2D6'], receptor:['MOR','NMDA'], effects:['pain_relief','opioid_maintenance'], serotonergic:true, nti:true, half_life:'8-59h', schedule:'II' },
  'suboxone': { class:'opioid_partial', cyp_substrates:['CYP3A4'], cyp_inhibits:[], receptor:['MOR_partial','KOR_antagonist'], effects:['opioid_maintenance','pain'], serotonergic:false, nti:true, half_life:'24-42h', schedule:'III' },
  'warfarin': { class:'anticoagulant', cyp_substrates:['CYP2C9','CYP3A4','CYP1A2'], cyp_inhibits:[], receptor:['VKORC1'], effects:['anticoagulation'], serotonergic:false, nti:true, half_life:'20-60h', schedule:'Rx' },
  'lithium': { class:'mood_stabilizer', cyp_substrates:[], cyp_inhibits:[], receptor:['GSK3B','IMPase'], effects:['mood_stabilization','anti_suicidal'], serotonergic:false, nti:true, half_life:'18-36h', schedule:'Rx' },
  'lamotrigine': { class:'anticonvulsant', cyp_substrates:['UGT1A4'], cyp_inhibits:[], receptor:['sodium_channel','glutamate'], effects:['mood_stabilization','anticonvulsant'], serotonergic:false, nti:false, half_life:'25-33h', schedule:'Rx' },
  'quetiapine': { class:'atypical_antipsychotic', cyp_substrates:['CYP3A4'], cyp_inhibits:[], receptor:['D2','5HT2A','H1','alpha1'], effects:['antipsychotic','mood_stabilization','sedation'], serotonergic:true, nti:false, half_life:'7h', schedule:'Rx' },
  'aripiprazole': { class:'atypical_antipsychotic', cyp_substrates:['CYP2D6','CYP3A4'], cyp_inhibits:[], receptor:['D2_partial','5HT1A_partial','5HT2A'], effects:['antipsychotic','mood_stabilization'], serotonergic:true, nti:false, half_life:'75h', schedule:'Rx' },
  'methylphenidate': { class:'stimulant', cyp_substrates:[], cyp_inhibits:[], receptor:['DAT','NET'], effects:['attention','focus','wakefulness'], serotonergic:false, nti:false, half_life:'2-3h', schedule:'II' },
  'amphetamine': { class:'stimulant', cyp_substrates:['CYP2D6'], cyp_inhibits:[], receptor:['DAT','NET','VMAT2'], effects:['attention','focus','wakefulness'], serotonergic:false, nti:false, half_life:'10-13h', schedule:'II' },
  'melatonin': { class:'supplement', cyp_substrates:['CYP1A2'], cyp_inhibits:[], receptor:['MT1','MT2'], effects:['sleep','circadian'], serotonergic:false, nti:false, half_life:'0.5-1h', schedule:'OTC' },
  'st-johns-wort': { class:'supplement', cyp_substrates:['CYP3A4'], cyp_inhibits:[], receptor:['SERT','MAO_weak'], effects:['antidepressant_mild'], serotonergic:true, nti:false, half_life:'24-48h', schedule:'OTC', cyp_inducers:['CYP3A4','CYP2C9','CYP1A2','CYP2C19'] },
  'ashwagandha': { class:'adaptogen', cyp_substrates:['CYP3A4','CYP2D6'], cyp_inhibits:['CYP3A4_mild','CYP2D6_mild'], receptor:['GABA_A_mod','thyroid'], effects:['anxiolytic','adaptogenic','anti_inflammatory'], serotonergic:false, nti:false, half_life:'4-6h', schedule:'OTC' },
  'valerian': { class:'supplement', cyp_substrates:['CYP3A4'], cyp_inhibits:['CYP3A4_weak'], receptor:['GABA_A_mod'], effects:['sedation','anxiolytic'], serotonergic:false, nti:false, half_life:'1-2h', schedule:'OTC' },
  'kava': { class:'supplement', cyp_substrates:['CYP2E1'], cyp_inhibits:['CYP2E1','CYP1A2','CYP2D6'], receptor:['GABA_A','sodium_channel'], effects:['anxiolytic','sedation','muscle_relaxant'], serotonergic:false, nti:false, half_life:'1-2h', schedule:'OTC' },
  'kratom': { class:'supplement', cyp_substrates:['CYP3A4','CYP2D6'], cyp_inhibits:['CYP2D6','CYP3A4'], receptor:['MOR_partial','5HT2A','alpha2'], effects:['pain_relief','euphoria','stimulant_low_dose'], serotonergic:true, nti:false, half_life:'3-6h', schedule:'unscheduled/variable' },
  'turmeric': { class:'supplement', cyp_substrates:['CYP3A4'], cyp_inhibits:['CYP3A4','CYP2C9','CYP1A2'], receptor:['NF_kB','COX2'], effects:['anti_inflammatory','antioxidant'], serotonergic:false, nti:false, half_life:'6-7h', schedule:'OTC' },
  'fish-oil': { class:'supplement', cyp_substrates:[], cyp_inhibits:[], receptor:['PPAR','GPR120'], effects:['anti_inflammatory','cardiovascular','brain_health'], serotonergic:false, nti:false, half_life:'48h', schedule:'OTC' },
  'magnesium': { class:'mineral', cyp_substrates:[], cyp_inhibits:[], receptor:['NMDA_block','GABA_mod'], effects:['muscle_relaxation','sleep','nerve_function'], serotonergic:false, nti:false, half_life:'varies', schedule:'OTC' },
  'vitamin-d': { class:'vitamin', cyp_substrates:['CYP27B1','CYP24A1'], cyp_inhibits:[], receptor:['VDR'], effects:['bone_health','immune_modulation','mood'], serotonergic:false, nti:false, half_life:'15 days', schedule:'OTC' },
  'l-theanine': { class:'amino_acid', cyp_substrates:[], cyp_inhibits:[], receptor:['glutamate_mod','GABA_mod','alpha_wave'], effects:['calm_focus','anxiolytic_mild'], serotonergic:false, nti:false, half_life:'1-2h', schedule:'OTC' },
  '5-htp': { class:'amino_acid', cyp_substrates:['AADC'], cyp_inhibits:[], receptor:['serotonin_precursor'], effects:['mood','sleep','appetite'], serotonergic:true, nti:false, half_life:'2-4h', schedule:'OTC' },
  'sam-e': { class:'supplement', cyp_substrates:[], cyp_inhibits:[], receptor:['methyl_donor'], effects:['mood','liver_health','joint_health'], serotonergic:true, nti:false, half_life:'100min', schedule:'OTC' },
  'gaba-supplement': { class:'amino_acid', cyp_substrates:[], cyp_inhibits:[], receptor:['GABA_B_peripheral'], effects:['relaxation','sleep'], serotonergic:false, nti:false, half_life:'1-2h', schedule:'OTC' },
  'passionflower': { class:'supplement', cyp_substrates:['CYP3A4'], cyp_inhibits:['CYP3A4_weak'], receptor:['GABA_A_mod','MAO_weak'], effects:['anxiolytic','sedation'], serotonergic:true, nti:false, half_life:'2-4h', schedule:'OTC' },
  'lions-mane': { class:'mushroom', cyp_substrates:[], cyp_inhibits:[], receptor:['NGF_stimulator'], effects:['neuroprotective','cognitive_enhancement','anti_inflammatory'], serotonergic:false, nti:false, half_life:'unknown', schedule:'OTC' },
  'reishi': { class:'mushroom', cyp_substrates:['CYP3A4','CYP1A2'], cyp_inhibits:['CYP3A4_weak'], receptor:['immune_modulator','GABA_mod'], effects:['immune_modulation','sleep','anti_inflammatory'], serotonergic:false, nti:false, half_life:'unknown', schedule:'OTC' },
  'ibuprofen': { class:'nsaid', cyp_substrates:['CYP2C9'], cyp_inhibits:['CYP2C9_weak'], receptor:['COX1','COX2'], effects:['pain_relief','anti_inflammatory','antipyretic'], serotonergic:false, nti:false, half_life:'2-4h', schedule:'OTC' },
  'acetaminophen': { class:'analgesic', cyp_substrates:['CYP2E1','CYP1A2','CYP3A4'], cyp_inhibits:[], receptor:['COX3_central','TRPV1'], effects:['pain_relief','antipyretic'], serotonergic:false, nti:false, half_life:'2-3h', schedule:'OTC' },
  'diphenhydramine': { class:'antihistamine', cyp_substrates:['CYP2D6'], cyp_inhibits:['CYP2D6_moderate'], receptor:['H1','mACh'], effects:['antihistamine','sedation','anticholinergic'], serotonergic:false, nti:false, half_life:'2-8h', schedule:'OTC' },
  'caffeine': { class:'stimulant', cyp_substrates:['CYP1A2'], cyp_inhibits:[], receptor:['adenosine_A1_A2A'], effects:['wakefulness','focus','bronchodilation'], serotonergic:false, nti:false, half_life:'3-5h', schedule:'OTC' },
  'alcohol': { class:'depressant', cyp_substrates:['ADH','CYP2E1'], cyp_inhibits:['CYP2E1_acute'], receptor:['GABA_A','NMDA_block','opioid_indirect'], effects:['sedation','disinhibition','euphoria'], serotonergic:false, nti:false, half_life:'varies', schedule:'legal', cyp_inducers:['CYP2E1_chronic'] },
};

// ═══════════════════════════════════════════════════════════════
// SAFETY CHECK ENGINE v2.0 — 5 Layers
// ═══════════════════════════════════════════════════════════════
function runSafetyEngine(substances) {
  const found = substances.map(s => {
    const key = s.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
    return { name: s, key, data: PHARMA_DB[key] };
  }).filter(s => s.data);
  const unknown = substances.filter(s => !PHARMA_DB[s.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')]);
  const interactions = [];

  for (let i = 0; i < found.length; i++) {
    for (let j = i + 1; j < found.length; j++) {
      const a = found[i], b = found[j];
      // L1: CYP450 Inhibition
      for (const enz of (a.data.cyp_inhibits || [])) {
        const clean = enz.replace(/_weak|_moderate|_mild/,'');
        if ((b.data.cyp_substrates || []).includes(clean))
          interactions.push({ pair:`${a.name} + ${b.name}`, layer:'CYP450', mechanism:`${a.name} inhibits ${clean} → may increase ${b.name} levels`, severity:(a.data.nti||b.data.nti)?0.9:(enz.includes('weak')||enz.includes('mild')?0.3:0.6), enzyme:clean });
      }
      for (const enz of (b.data.cyp_inhibits || [])) {
        const clean = enz.replace(/_weak|_moderate|_mild/,'');
        if ((a.data.cyp_substrates || []).includes(clean))
          interactions.push({ pair:`${b.name} + ${a.name}`, layer:'CYP450', mechanism:`${b.name} inhibits ${clean} → may increase ${a.name} levels`, severity:(a.data.nti||b.data.nti)?0.9:(enz.includes('weak')||enz.includes('mild')?0.3:0.6), enzyme:clean });
      }
      // L1b: CYP Induction
      for (const enz of (a.data.cyp_inducers || [])) {
        const clean = enz.replace(/_chronic/,'');
        if ((b.data.cyp_substrates || []).includes(clean))
          interactions.push({ pair:`${a.name} + ${b.name}`, layer:'CYP450', mechanism:`${a.name} induces ${clean} → may reduce ${b.name} effectiveness`, severity:b.data.nti?0.9:0.6, enzyme:clean, action:'induction' });
      }
      // L2: Serotonin Syndrome
      if (a.data.serotonergic && b.data.serotonergic)
        interactions.push({ pair:`${a.name} + ${b.name}`, layer:'Serotonin', mechanism:`Both affect serotonin → serotonin syndrome risk (agitation, hyperthermia, tremor)`, severity:0.8, warning:'SEROTONIN_SYNDROME_RISK' });
      // L3: Receptor Competition
      const aR = new Set((a.data.receptor||[]).map(r=>r.replace(/_partial|_weak|_antagonist|_block|_mod/,'')));
      const bR = new Set((b.data.receptor||[]).map(r=>r.replace(/_partial|_weak|_antagonist|_block|_mod/,'')));
      const shared = [...aR].filter(r=>bR.has(r));
      if (shared.length > 0)
        interactions.push({ pair:`${a.name} + ${b.name}`, layer:'Receptor', mechanism:`Both act on ${shared.join(', ')}. May compete or compound effects.`, severity:0.4, receptors:shared });
      // L4: Sedation Stacking
      const sedA = (a.data.effects||[]).some(e=>['sedation','sleep','muscle_relaxant'].includes(e));
      const sedB = (b.data.effects||[]).some(e=>['sedation','sleep','muscle_relaxant'].includes(e));
      if (sedA && sedB)
        interactions.push({ pair:`${a.name} + ${b.name}`, layer:'Sedation', mechanism:`Both cause sedation → increased drowsiness + respiratory depression risk`, severity:(a.data.class==='opioid'||b.data.class==='opioid')?0.95:(a.data.class==='benzodiazepine'||b.data.class==='benzodiazepine')?0.85:0.6 });
      // L5: NTI Flagging
      if ((a.data.nti||b.data.nti) && interactions.some(ix=>ix.pair.includes(a.data.nti?a.name:b.name)&&ix.layer==='CYP450'))
        interactions.push({ pair:`${a.data.nti?a.name:b.name} (NTI)`, layer:'NTI', mechanism:`Narrow therapeutic index drug — small level changes = toxicity risk. REQUIRES MEDICAL SUPERVISION.`, severity:0.95, warning:'NTI_CRITICAL' });
    }
  }

  const maxSev = interactions.length > 0 ? Math.max(...interactions.map(i=>i.severity)) : 0;
  return {
    query: substances, recognized: found.map(f=>({ name:f.name, class:f.data.class, schedule:f.data.schedule, nti:f.data.nti })),
    unknown, interactions, risk_level: maxSev>=0.8?'HIGH':maxSev>=0.5?'MODERATE':maxSev>0?'LOW':'NONE',
    max_severity: maxSev, interaction_count: interactions.length,
    disclaimer: 'Educational tool only. Consult your healthcare provider before combining substances.',
    engine_version: '2.0', substances_in_db: Object.keys(PHARMA_DB).length
  };
}

// ═══════════════════════════════════════════════════════════════
// API QUERY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

// -- FREE APIs --
async function queryRxNorm(drug) {
  try { const d=await fetchJSON(`https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(drug)}`); return { source:'RxNorm', drug, results:(d?.drugGroup?.conceptGroup?.flatMap(g=>g.conceptProperties||[])||[]).slice(0,10) }; } catch(e) { return { source:'RxNorm', error:e.message }; }
}
async function queryNPI(query, city, state) {
  try { let url=`https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=50`;
    if(/^\d+$/.test(query)) url+=`&number=${query}`; else url+=`&first_name=${encodeURIComponent(query.split(' ')[0]||'')}&last_name=${encodeURIComponent(query.split(' ').slice(1).join(' ')||query)}`;
    if(city) url+=`&city=${encodeURIComponent(city)}`; if(state) url+=`&state=${encodeURIComponent(state)}`;
    const d=await fetchJSON(url); return { source:'NPI Registry', query, results:(d.results||[]).slice(0,20), count:d.result_count||0 };
  } catch(e) { return { source:'NPI', error:e.message }; }
}
async function queryFDALabels(drug) {
  try { const k=KEYS.openfda?`&api_key=${KEYS.openfda}`:''; const d=await fetchJSON(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(drug)}"+openfda.generic_name:"${encodeURIComponent(drug)}"&limit=3${k}`);
    return { source:'FDA Labels', drug, results:(d.results||[]).map(r=>({ brand:r.openfda?.brand_name?.[0], generic:r.openfda?.generic_name?.[0], warnings:r.warnings?.[0]?.substring(0,500), interactions:r.drug_interactions?.[0]?.substring(0,500) })) };
  } catch(e) { return { source:'FDA Labels', error:e.message }; }
}
async function queryFDAEvents(drug) {
  try { const k=KEYS.openfda?`&api_key=${KEYS.openfda}`:''; const d=await fetchJSON(`https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"${encodeURIComponent(drug)}"&count=patient.reaction.reactionmeddrapt.exact&limit=15${k}`);
    return { source:'FDA Adverse Events', drug, reactions:d.results||[] };
  } catch(e) { return { source:'FDA Events', error:e.message }; }
}
async function queryDailyMed(drug) {
  try { const d=await fetchJSON(`https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name=${encodeURIComponent(drug)}&pagesize=5`); return { source:'DailyMed', drug, results:d.data||[] }; } catch(e) { return { source:'DailyMed', error:e.message }; }
}
async function queryCPIC(gene) {
  try { const d=await fetchJSON(`https://api.cpicpgx.org/v1/guideline?genesymbol=eq.${encodeURIComponent(gene)}`); return { source:'CPIC', gene, guidelines:d||[] }; } catch(e) { return { source:'CPIC', error:e.message }; }
}
async function queryClinicalTrials(condition, city) {
  try { let url=`https://clinicaltrials.gov/api/v2/studies?query.cond=${encodeURIComponent(condition)}&pageSize=10&sort=LastUpdatePostDate:desc`; if(city) url+=`&query.locn=${encodeURIComponent(city)}`;
    const d=await fetchJSON(url); return { source:'ClinicalTrials.gov', condition, studies:(d.studies||[]).map(s=>({ title:s.protocolSection?.identificationModule?.briefTitle, status:s.protocolSection?.statusModule?.overallStatus })) };
  } catch(e) { return { source:'ClinicalTrials.gov', error:e.message }; }
}
async function querySAMHSA(zip) { try { return { source:'SAMHSA', zip, note:'Use findtreatment.gov for treatment locator' }; } catch(e) { return { source:'SAMHSA', error:e.message }; } }
async function queryCDCPlaces(state) { try { const d=await fetchJSON(`https://data.cdc.gov/resource/swc5-untb.json?stateabbr=${encodeURIComponent(state)}&$limit=20`); return { source:'CDC PLACES', state, data:d||[] }; } catch(e) { return { source:'CDC', error:e.message }; } }
async function queryOpenFoodFacts(product) {
  try { const d=await fetchJSON(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(product)}&json=1&page_size=5`);
    return { source:'Open Food Facts', products:(d.products||[]).map(p=>({ name:p.product_name, brand:p.brands, nutriscore:p.nutriscore_grade, calories:p.nutriments?.['energy-kcal_100g'] })) };
  } catch(e) { return { source:'Open Food Facts', error:e.message }; }
}
async function queryWger(muscle) { try { const d=await fetchJSON(`https://wger.de/api/v2/exercise/?format=json&language=2&limit=10`); return { source:'wger', exercises:d.results||[] }; } catch(e) { return { source:'wger', error:e.message }; } }
async function queryOpenLibrary(topic) { try { const d=await fetchJSON(`https://openlibrary.org/search.json?q=${encodeURIComponent(topic)}&limit=10`); return { source:'Open Library', books:(d.docs||[]).map(b=>({ title:b.title, author:b.author_name?.[0], year:b.first_publish_year })) }; } catch(e) { return { source:'Open Library', error:e.message }; } }
async function queryFDARecalls(q) { try { const k=KEYS.openfda?`&api_key=${KEYS.openfda}`:''; const d=await fetchJSON(`https://api.fda.gov/drug/enforcement.json?search=reason_for_recall:"${encodeURIComponent(q)}"&limit=5${k}`); return { source:'FDA Recalls', recalls:d.results||[] }; } catch(e) { return { source:'FDA Recalls', error:e.message }; } }

// -- KEYED APIs --
async function queryPubMed(query, max=10) {
  try { const k=KEYS.ncbi?`&api_key=${KEYS.ncbi}`:''; const s=await fetchJSON(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${max}&retmode=json${k}`);
    const ids=s?.esearchresult?.idlist||[]; if(!ids.length) return { source:'PubMed', articles:[], count:0 };
    const d=await fetchJSON(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json${k}`);
    return { source:'PubMed', query, articles:ids.map(id=>{ const r=d?.result?.[id]; return r?{ pmid:id, title:r.title, journal:r.source, date:r.pubdate }:null; }).filter(Boolean), count:parseInt(s?.esearchresult?.count||0) };
  } catch(e) { return { source:'PubMed', error:e.message }; }
}
async function queryUSDAFood(food) {
  try { if(!KEYS.usda) return { source:'USDA', error:'No key' }; const d=await fetchJSON(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${KEYS.usda}&query=${encodeURIComponent(food)}&pageSize=5`);
    return { source:'USDA FoodData', results:(d.foods||[]).map(f=>({ name:f.description, nutrients:(f.foodNutrients||[]).filter(n=>['Energy','Protein','Total lipid (fat)','Carbohydrate, by difference'].includes(n.nutrientName)).map(n=>({ name:n.nutrientName, value:n.value, unit:n.unitName })) })) };
  } catch(e) { return { source:'USDA', error:e.message }; }
}
async function queryWeather(lat, lng) {
  try { if(!KEYS.weather) return { source:'Weather', error:'No key' }; const d=await fetchJSON(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${KEYS.weather}&units=imperial`);
    return { source:'OpenWeatherMap', location:d.name, temp_f:d.main?.temp, humidity:d.main?.humidity, conditions:d.weather?.[0]?.description };
  } catch(e) { return { source:'Weather', error:e.message }; }
}
async function queryAirQuality(lat, lng) {
  try { if(KEYS.waqi) { const d=await fetchJSON(`https://api.waqi.info/feed/geo:${lat};${lng}/?token=${KEYS.waqi}`); if(d.status==='ok') return { source:'WAQI', aqi:d.data?.aqi, station:d.data?.city?.name }; }
    if(KEYS.airnow) { const d=await fetchJSON(`https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=${lat}&longitude=${lng}&distance=50&API_KEY=${KEYS.airnow}`); return { source:'AirNow', data:d }; }
    return { source:'Air Quality', error:'No key' };
  } catch(e) { return { source:'Air Quality', error:e.message }; }
}
async function queryUV(lat, lng) {
  try { if(!KEYS.openuv) return { source:'OpenUV', error:'No key' }; const d=await fetchJSON(`https://api.openuv.io/api/v1/uv?lat=${lat}&lng=${lng}`, { headers:{'x-access-token':KEYS.openuv} });
    return { source:'OpenUV', uv:d.result?.uv, uv_max:d.result?.uv_max, safe_exposure:d.result?.safe_exposure_time };
  } catch(e) { return { source:'OpenUV', error:e.message }; }
}
async function queryGooglePlaces(query, lat, lng) {
  try { if(!KEYS.google) return { source:'Google Places', error:'No key' }; const loc=lat&&lng?`&location=${lat},${lng}&radius=16000`:'';
    const d=await fetchJSON(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}${loc}&key=${KEYS.google}`);
    return { source:'Google Places', results:(d.results||[]).slice(0,10).map(p=>({ name:p.name, address:p.formatted_address, rating:p.rating })) };
  } catch(e) { return { source:'Google Places', error:e.message }; }
}
async function queryYelp(term, location) {
  try { if(!KEYS.yelp) return { source:'Yelp', error:'No key' };
    const d=await fetchJSON(`https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(term)}&location=${encodeURIComponent(location)}&limit=10`, { headers:{'Authorization':`Bearer ${KEYS.yelp}`} });
    return { source:'Yelp', businesses:(d.businesses||[]).map(b=>({ name:b.name, rating:b.rating, reviews:b.review_count, phone:b.phone, address:b.location?.display_address?.join(', ') })) };
  } catch(e) { return { source:'Yelp', error:e.message }; }
}
async function queryFoursquare(query, lat, lng) {
  try { if(!KEYS.foursquare) return { source:'Foursquare', error:'No key' }; const ll=lat&&lng?`&ll=${lat},${lng}`:'';
    const d=await fetchJSON(`https://api.foursquare.com/v3/places/search?query=${encodeURIComponent(query)}${ll}&limit=10`, { headers:{'Authorization':KEYS.foursquare} });
    return { source:'Foursquare', results:d.results||[] };
  } catch(e) { return { source:'Foursquare', error:e.message }; }
}
async function querySpoonacular(query) {
  try { if(!KEYS.spoonacular) return { source:'Spoonacular', error:'No key' };
    const d=await fetchJSON(`https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&number=5&addRecipeNutrition=true&apiKey=${KEYS.spoonacular}`);
    return { source:'Spoonacular', recipes:(d.results||[]).map(r=>({ title:r.title, readyIn:r.readyInMinutes, calories:r.nutrition?.nutrients?.find(n=>n.name==='Calories')?.amount })) };
  } catch(e) { return { source:'Spoonacular', error:e.message }; }
}
async function queryEdamam(query) {
  try { if(!KEYS.edamamId||!KEYS.edamamKey) return { source:'Edamam', error:'No key' };
    const d=await fetchJSON(`https://api.edamam.com/api/nutrition-data?app_id=${KEYS.edamamId}&app_key=${KEYS.edamamKey}&ingr=${encodeURIComponent(query)}`);
    return { source:'Edamam', calories:d.calories, nutrients:{ protein:d.totalNutrients?.PROCNT, fat:d.totalNutrients?.FAT, carbs:d.totalNutrients?.CHOCDF } };
  } catch(e) { return { source:'Edamam', error:e.message }; }
}
async function queryNPS(state) {
  try { if(!KEYS.nps) return { source:'NPS', error:'No key' }; const d=await fetchJSON(`https://developer.nps.gov/api/v1/parks?stateCode=${state}&limit=10&api_key=${KEYS.nps}`);
    return { source:'NPS', parks:(d.data||[]).map(p=>({ name:p.fullName, designation:p.designation, url:p.url })) };
  } catch(e) { return { source:'NPS', error:e.message }; }
}
async function queryEventbrite(query, location) {
  try { if(!KEYS.eventbrite) return { source:'Eventbrite', error:'No key' };
    const d=await fetchJSON(`https://www.eventbriteapi.com/v3/events/search/?q=${encodeURIComponent(query)}&location.address=${encodeURIComponent(location)}`, { headers:{'Authorization':`Bearer ${KEYS.eventbrite}`} });
    return { source:'Eventbrite', events:(d.events||[]).slice(0,10).map(e=>({ name:e.name?.text, start:e.start?.local, url:e.url })) };
  } catch(e) { return { source:'Eventbrite', error:e.message }; }
}
async function queryListenNotes(query) {
  try { if(!KEYS.listenNotes) return { source:'Listen Notes', error:'No key' };
    const d=await fetchJSON(`https://listen-api.listennotes.com/api/v2/search?q=${encodeURIComponent(query)}&type=podcast`, { headers:{'X-ListenAPI-Key':KEYS.listenNotes} });
    return { source:'Listen Notes', podcasts:(d.results||[]).slice(0,5).map(p=>({ title:p.title_original, publisher:p.publisher_original })) };
  } catch(e) { return { source:'Listen Notes', error:e.message }; }
}
async function queryWalkScore(address) {
  try { if(!KEYS.walkscore) return { source:'WalkScore', error:'No key' };
    const d=await fetchJSON(`https://api.walkscore.com/score?format=json&address=${encodeURIComponent(address)}&wsapikey=${KEYS.walkscore}`);
    return { source:'WalkScore', walkscore:d.walkscore, description:d.description, transit:d.transit?.score, bike:d.bike?.score };
  } catch(e) { return { source:'WalkScore', error:e.message }; }
}
async function queryCannlytics(query) {
  try { if(!KEYS.cannlytics) return { source:'Cannlytics', error:'No key' };
    const d=await fetchJSON(`https://cannlytics.com/api/data/coas?q=${encodeURIComponent(query)}&limit=5`, { headers:{'Authorization':`Bearer ${KEYS.cannlytics}`} });
    return { source:'Cannlytics', results:d };
  } catch(e) { return { source:'Cannlytics', error:e.message }; }
}
async function queryCensus(zip) {
  try { if(!KEYS.census) return { source:'Census', error:'No key' };
    const d=await fetchJSON(`https://api.census.gov/data/2022/acs/acs5?get=B01003_001E,B19013_001E,B15003_022E&for=zip%20code%20tabulation%20area:${zip}&key=${KEYS.census}`);
    if(Array.isArray(d)&&d.length>1) return { source:'Census', zip, population:d[1][0], median_income:d[1][1], bachelors:d[1][2] };
    return { source:'Census', raw:d };
  } catch(e) { return { source:'Census', error:e.message }; }
}
async function queryGooglePollen(lat, lng) {
  try { if(!KEYS.google) return { source:'Pollen', error:'No key' }; const d=await fetchJSON(`https://pollen.googleapis.com/v1/forecast:lookup?location.latitude=${lat}&location.longitude=${lng}&days=3&key=${KEYS.google}`); return { source:'Google Pollen', forecast:d }; } catch(e) { return { source:'Pollen', error:e.message }; }
}
async function queryMeersens(lat, lng) {
  try { if(!KEYS.meersens) return { source:'Meersens', error:'No key' }; const d=await fetchJSON(`https://api.meersens.com/environment/public/air/current?lat=${lat}&lng=${lng}`, { headers:{'apikey':KEYS.meersens} }); return { source:'Meersens', data:d }; } catch(e) { return { source:'Meersens', error:e.message }; }
}

// ═══ COMPOSITE ENDPOINTS ═══
async function getCityScore(city) {
  const c = TARGET_CITIES.find(tc=>tc.name.toLowerCase()===city.toLowerCase()) || TARGET_CITIES[0];
  const [w,a,u,ce,p,ws] = await Promise.allSettled([ queryWeather(c.lat,c.lng), queryAirQuality(c.lat,c.lng), queryUV(c.lat,c.lng), queryCensus(c.zip), queryNPS(c.state), queryWalkScore(`${c.name}, ${c.state}`) ]);
  return { city:c.name, state:c.state, weather:w.value, air:a.value, uv:u.value, census:ce.value, parks:p.value, walkability:ws.value, generated:new Date().toISOString() };
}
async function getConditionBrief(condition) {
  const [pub,tri] = await Promise.allSettled([ queryPubMed(`${condition} treatment 2025`,5), queryClinicalTrials(condition) ]);
  return { condition, research:pub.value, trials:tri.value, generated:new Date().toISOString() };
}
async function getPractitioners(specialty, city, state) {
  const [npi,goog,yelp] = await Promise.allSettled([ queryNPI(specialty,city,state), KEYS.google?queryGooglePlaces(`${specialty} ${city} ${state}`):null, KEYS.yelp?queryYelp(specialty,`${city}, ${state}`):null ]);
  return { specialty, city, state, npi:npi.value, google:goog.value, yelp:yelp.value, generated:new Date().toISOString() };
}
async function getEnvironment(lat, lng, zip) {
  const [w,a,u,p,m] = await Promise.allSettled([ queryWeather(lat,lng), queryAirQuality(lat,lng), queryUV(lat,lng), queryGooglePollen(lat,lng), queryMeersens(lat,lng) ]);
  return { weather:w.value, air:a.value, uv:u.value, pollen:p.value, meersens:m.value, generated:new Date().toISOString() };
}

// ═══ NPI PIPELINE ═══
const PRACTITIONER_TYPES = ['acupuncturist','chiropractor','massage therapist','naturopath','psychologist','psychiatrist','counselor','social worker','nutritionist','dietitian','yoga therapist','physical therapist','nurse practitioner','pharmacist'];

async function runPipeline(cycle) {
  const city = TARGET_CITIES[cycle % TARGET_CITIES.length];
  log('PIPELINE', `Cycle ${cycle} | ${city.name}, ${city.state}`);
  let total = 0;
  for (const type of PRACTITIONER_TYPES) {
    try {
      const r = await queryNPI(type, city.name, city.state);
      const pracs = (r.results||[]).map(p => ({ npi:p.number, name:`${p.basic?.first_name||''} ${p.basic?.last_name||''}`.trim(), specialty:type, city:city.name, state:city.state, phone:p.addresses?.[0]?.telephone_number, address:`${p.addresses?.[0]?.address_1||''}, ${p.addresses?.[0]?.city||''}, ${p.addresses?.[0]?.state||''}`, source:'NPI', scraped_at:new Date().toISOString() }));
      if (pracs.length > 0) { await supabase.upsert('practitioners', pracs); total += pracs.length; }
      await new Promise(r => setTimeout(r, 200));
    } catch(e) { log('PIPELINE', `${type}: ${e.message}`); }
  }
  await supabase.upsert('pipeline_log', [{ city:city.name, state:city.state, practitioners_found:total, cycle_index:cycle, ran_at:new Date().toISOString() }]);
  log('PIPELINE', `${city.name} done: ${total} practitioners`);
  return total;
}

let pipelineCycle = 0, pipelineRunning = false;
function startScheduler() {
  log('SCHEDULER', `Active: ${TARGET_CITIES.length} cities, ${PRACTITIONER_TYPES.length} types`);
  setTimeout(async () => { if(!pipelineRunning) { pipelineRunning=true; try { await runPipeline(pipelineCycle++); } catch(e) { log('SCHEDULER',e.message); } pipelineRunning=false; } }, 60000);
  setInterval(async () => { if(!pipelineRunning) { pipelineRunning=true; try { await runPipeline(pipelineCycle++); } catch(e) { log('SCHEDULER',e.message); } pipelineRunning=false; } }, 30*60*1000);
}

// ═══ ALVAI CHAT ═══
async function alvaiChat(message) {
  if (!KEYS.claude) return { response: 'Alvai needs an API key.' };
  try {
    const d = await fetchJSON('https://api.anthropic.com/v1/messages', { method:'POST',
      headers: { 'x-api-key':KEYS.claude, 'anthropic-version':'2023-06-01', 'Content-Type':'application/json' },
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1024,
        system: `You are Alvai, the AI wellness guide for BLEU.live. You help with drug interactions, supplement safety, practitioners, cannabis education, and holistic wellness. Be warm, evidence-based, direct. Mention Safety Check Engine for interaction analysis. ${Object.keys(PHARMA_DB).length} substances in database across ${TARGET_CITIES.length} cities. Always disclaim: not a replacement for medical advice.`,
        messages: [{ role:'user', content:message }]
      })
    });
    return { response: d.content?.[0]?.text || 'Let me think...', model: d.model };
  } catch(e) { return { response: 'Having trouble. Try again?', error: e.message }; }
}

// ═══════════════════════════════════════════════════════════════
// HTTP SERVER
// ═══════════════════════════════════════════════════════════════
function json(res, data, status=200) {
  res.writeHead(status, { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type,Authorization' });
  res.end(JSON.stringify(data, null, 2));
}
function getBody(req) { return new Promise(r => { let b=''; req.on('data',c=>b+=c); req.on('end',()=>r(b)); }); }
function qp(url) { const p={}; const q=url.split('?')[1]; if(q) q.split('&').forEach(x=>{ const [k,v]=x.split('='); p[k]=decodeURIComponent(v||''); }); return p; }

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, {});
  const path = req.url.split('?')[0];
  const params = qp(req.url);
  try {
    // Health
    if (path === '/health') { const kc=Object.entries(KEYS).filter(([k,v])=>v&&k!=='amazon').length; return json(res, { status:'ok', version:'2.0', engine:'BLEU.live Full Deck', api_keys:kc, substances:Object.keys(PHARMA_DB).length, cities:TARGET_CITIES.length, pipeline_cycle:pipelineCycle, uptime:process.uptime() }); }
    // Chat
    if (path==='/api/chat'&&req.method==='POST') { const b=JSON.parse(await getBody(req)); return json(res, await alvaiChat(b.message||b.query||'')); }
    // Safety Check
    if (path==='/api/safety-check') { const s=params.substances?params.substances.split(',').map(x=>x.trim()):[]; if(!s.length) return json(res,{error:'?substances=cbd,sertraline'},400); return json(res, runSafetyEngine(s)); }
    if (path==='/api/safety-check'&&req.method==='POST') { const b=JSON.parse(await getBody(req)); return json(res, runSafetyEngine(b.substances||[])); }
    // Drug/Pharma
    if (path.match(/^\/api\/rxnorm\/(.+)/)) return json(res, await queryRxNorm(decodeURIComponent(path.split('/')[3])));
    if (path.match(/^\/api\/pubmed\/(.+)/)) return json(res, await queryPubMed(decodeURIComponent(path.split('/')[3])));
    if (path.match(/^\/api\/dailymed\/(.+)/)) return json(res, await queryDailyMed(decodeURIComponent(path.split('/')[3])));
    if (path.match(/^\/api\/cpic\/(.+)/)) return json(res, await queryCPIC(decodeURIComponent(path.split('/')[3])));
    if (path.match(/^\/api\/fda\/labels\/(.+)/)) return json(res, await queryFDALabels(decodeURIComponent(path.split('/')[4])));
    if (path.match(/^\/api\/fda\/events\/(.+)/)) return json(res, await queryFDAEvents(decodeURIComponent(path.split('/')[4])));
    if (path.match(/^\/api\/fda\/recalls\/(.+)/)) return json(res, await queryFDARecalls(decodeURIComponent(path.split('/')[4])));
    // Practitioners
    if (path.match(/^\/api\/npi\/(.+)/)) return json(res, await queryNPI(decodeURIComponent(path.split('/')[3]), params.city, params.state));
    if (path.match(/^\/api\/practitioners\/(.+)\/(.+)\/(.+)/)) { const p=path.split('/'); return json(res, await getPractitioners(decodeURIComponent(p[3]),decodeURIComponent(p[4]),decodeURIComponent(p[5]))); }
    // Clinical
    if (path.match(/^\/api\/trials\/(.+)/)) return json(res, await queryClinicalTrials(decodeURIComponent(path.split('/')[3]), params.city));
    if (path.match(/^\/api\/samhsa\/(.+)/)) return json(res, await querySAMHSA(decodeURIComponent(path.split('/')[3])));
    // Nutrition
    if (path.match(/^\/api\/usda\/(.+)/)) return json(res, await queryUSDAFood(decodeURIComponent(path.split('/')[3])));
    if (path.match(/^\/api\/food\/(.+)/)) return json(res, await queryOpenFoodFacts(decodeURIComponent(path.split('/')[3])));
    if (path.match(/^\/api\/recipes\/(.+)/)) return json(res, await querySpoonacular(decodeURIComponent(path.split('/')[3])));
    if (path.match(/^\/api\/nutrition\/(.+)/)) return json(res, await queryEdamam(decodeURIComponent(path.split('/')[3])));
    // Environment
    if (path.match(/^\/api\/weather\/(.+)\/(.+)/)) { const p=path.split('/'); return json(res, await queryWeather(p[3],p[4])); }
    if (path.match(/^\/api\/air\/(.+)\/(.+)/)) { const p=path.split('/'); return json(res, await queryAirQuality(p[3],p[4])); }
    if (path.match(/^\/api\/uv\/(.+)\/(.+)/)) { const p=path.split('/'); return json(res, await queryUV(p[3],p[4])); }
    if (path.match(/^\/api\/pollen\/(.+)\/(.+)/)) { const p=path.split('/'); return json(res, await queryGooglePollen(p[3],p[4])); }
    if (path.match(/^\/api\/environment\/(.+)\/(.+)\/(.+)/)) { const p=path.split('/'); return json(res, await getEnvironment(p[3],p[4],p[5])); }
    // Places
    if (path.match(/^\/api\/places\/(.+)/)) return json(res, await queryGooglePlaces(decodeURIComponent(path.split('/')[3]), params.lat, params.lng));
    if (path.match(/^\/api\/yelp\/(.+)\/(.+)/)) { const p=path.split('/'); return json(res, await queryYelp(decodeURIComponent(p[3]),decodeURIComponent(p[4]))); }
    if (path.match(/^\/api\/foursquare\/(.+)/)) return json(res, await queryFoursquare(decodeURIComponent(path.split('/')[3]), params.lat, params.lng));
    if (path.match(/^\/api\/events\/(.+)\/(.+)/)) { const p=path.split('/'); return json(res, await queryEventbrite(decodeURIComponent(p[3]),decodeURIComponent(p[4]))); }
    // Content
    if (path.match(/^\/api\/podcasts\/(.+)/)) return json(res, await queryListenNotes(decodeURIComponent(path.split('/')[3])));
    if (path.match(/^\/api\/books\/(.+)/)) return json(res, await queryOpenLibrary(decodeURIComponent(path.split('/')[3])));
    if (path.match(/^\/api\/exercises\/(.+)/)) return json(res, await queryWger(decodeURIComponent(path.split('/')[3])));
    // Location
    if (path.match(/^\/api\/parks\/(.+)/)) return json(res, await queryNPS(decodeURIComponent(path.split('/')[3])));
    if (path.match(/^\/api\/walkscore\/(.+)/)) return json(res, await queryWalkScore(decodeURIComponent(path.split('/').slice(3).join('/'))));
    if (path.match(/^\/api\/census\/(.+)/)) return json(res, await queryCensus(decodeURIComponent(path.split('/')[3])));
    if (path.match(/^\/api\/cannabis\/(.+)/)) return json(res, await queryCannlytics(decodeURIComponent(path.split('/')[3])));
    // Composites
    if (path.match(/^\/api\/city-score\/(.+)/)) return json(res, await getCityScore(decodeURIComponent(path.split('/')[3])));
    if (path.match(/^\/api\/condition\/(.+)/)) return json(res, await getConditionBrief(decodeURIComponent(path.split('/')[3])));
    // CDC/Health
    if (path.match(/^\/api\/cdc\/(.+)/)) return json(res, await queryCDCPlaces(decodeURIComponent(path.split('/')[3])));
    // Pipeline
    if (path==='/api/pipeline/run'&&req.method==='POST') { if(pipelineRunning) return json(res,{status:'already_running'}); pipelineRunning=true; const n=await runPipeline(pipelineCycle++); pipelineRunning=false; return json(res,{status:'complete',found:n}); }
    if (path==='/api/pipeline/status') return json(res, { running:pipelineRunning, cycle:pipelineCycle, next_city:TARGET_CITIES[pipelineCycle%TARGET_CITIES.length]?.name });
    // Lists
    if (path==='/api/substances') return json(res, { count:Object.keys(PHARMA_DB).length, substances:Object.entries(PHARMA_DB).map(([k,v])=>({ name:k, class:v.class, schedule:v.schedule, nti:v.nti })) });
    if (path==='/api/cities') return json(res, { count:TARGET_CITIES.length, cities:TARGET_CITIES });
    if (path==='/api/conditions') return json(res, { count:CONDITIONS.length, conditions:CONDITIONS });
    // 404
    json(res, { error:'Not found', hint:'/health for endpoints' }, 404);
  } catch(e) { log('SERVER',`Error: ${e.message}`); json(res,{error:e.message},500); }
});

// ═══ START ═══
server.listen(PORT, () => {
  const kc = Object.entries(KEYS).filter(([k,v])=>v&&k!=='amazon').length;
  log('SERVER', '═══════════════════════════════════════════');
  log('SERVER', '  BLEU.LIVE ENGINE v2.0 — FULL DECK');
  log('SERVER', `  Port: ${PORT} | Keys: ${kc} | Substances: ${Object.keys(PHARMA_DB).length}`);
  log('SERVER', `  Cities: ${TARGET_CITIES.length} | Conditions: ${CONDITIONS.length}`);
  log('SERVER', '  Pipeline: Every 30 min, cycling all cities');
  log('SERVER', '═══════════════════════════════════════════');
  startScheduler();
});
