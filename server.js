// ═══════════════════════════════════════════════════════════════════════════════
//  BLEU.LIVE ENGINE v3.1 — FULL BACKEND + SEO ENGINE
//  Safety Engine (54 substances, 5 layers) | NPI Pipeline (20 cities)
//  SEO Page Generator | Supabase | Claude AI Chat | 24/7 Scheduler | API Proxies
//  Zero dependencies — pure Node.js
// ═══════════════════════════════════════════════════════════════════════════════

const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = process.env.PORT || 8080;

// ═══════════════════════════════════════════════════════════════
// ENV — reads from Railway environment variables
// ═══════════════════════════════════════════════════════════════
const ENV = {
  claude: process.env.CLAUDE_API_KEY || '',
  sbUrl: process.env.SUPABASE_URL || '',
  sbKey: process.env.SUPABASE_SERVICE_KEY || '',
  ncbi: process.env.NCBI_API_KEY || '',
  airnow: process.env.AIRNOW_API_KEY || '',
  usda: process.env.USDA_API_KEY || '',
  openfda: process.env.OPENFDA_API_KEY || '',
  openweather: process.env.OPENWEATHER_API_KEY || '',
};

// ═══════════════════════════════════════════════════════════════
// LOGGING
// ═══════════════════════════════════════════════════════════════
function log(tag, msg) {
  console.log(`[${new Date().toISOString().slice(11,19)}] [${tag}] ${msg}`);
}

// ═══════════════════════════════════════════════════════════════
// HTTP HELPERS — zero dependency fetch
// ═══════════════════════════════════════════════════════════════
function fetchJSON(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const mod = u.protocol === 'https:' ? https : http;
    const req = mod.request(u, {
      method: opts.method || 'GET',
      headers: opts.headers || {},
      timeout: 12000
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ _raw: data, _status: res.statusCode }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (opts.body) req.write(typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body));
    req.end();
  });
}

function safe(fn) { return fn().catch(e => ({ error: e.message })); }

// ═══════════════════════════════════════════════════════════════
// SUPABASE CLIENT — direct REST
// ═══════════════════════════════════════════════════════════════
const sb = {
  async query(table, params = '') {
    if (!ENV.sbUrl || !ENV.sbKey) return { error: 'No Supabase config' };
    try {
      return await fetchJSON(`${ENV.sbUrl}/rest/v1/${table}?${params}`, {
        headers: { apikey: ENV.sbKey, Authorization: `Bearer ${ENV.sbKey}` }
      });
    } catch (e) { return { error: e.message }; }
  },
  async insert(table, rows) {
    if (!ENV.sbUrl || !ENV.sbKey) return { error: 'No Supabase config' };
    try {
      return await fetchJSON(`${ENV.sbUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          apikey: ENV.sbKey, Authorization: `Bearer ${ENV.sbKey}`,
          'Content-Type': 'application/json', Prefer: 'return=minimal'
        },
        body: JSON.stringify(rows)
      });
    } catch (e) { return { error: e.message }; }
  },
  async upsert(table, rows) {
    if (!ENV.sbUrl || !ENV.sbKey) return { error: 'No Supabase config' };
    try {
      return await fetchJSON(`${ENV.sbUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          apikey: ENV.sbKey, Authorization: `Bearer ${ENV.sbKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify(rows)
      });
    } catch (e) { return { error: e.message }; }
  },
  async count(table) {
    if (!ENV.sbUrl || !ENV.sbKey) return 0;
    try {
      const r = await fetchJSON(`${ENV.sbUrl}/rest/v1/${table}?select=count`, {
        headers: {
          apikey: ENV.sbKey, Authorization: `Bearer ${ENV.sbKey}`,
          Prefer: 'count=exact', Range: '0-0'
        }
      });
      return Array.isArray(r) ? r[0]?.count || 0 : 0;
    } catch { return 0; }
  }
};

// ═══════════════════════════════════════════════════════════════
// SEO ENGINE — Content generation & page serving
// ═══════════════════════════════════════════════════════════════
let seo = null;
try { seo = require('./seo-engine')({ sb, ENV, fetchJSON, log }); log('SEO', 'SEO Engine loaded'); }
catch (e) { log('SEO', `SEO Engine not loaded: ${e.message}`); }

// Autonomous Engine loaded after PHARMA_DB and TARGET_CITIES are defined (see below)

// ═══════════════════════════════════════════════════════════════
// PHARMACOLOGY DATABASE — 54 substances, 5 layers
// ═══════════════════════════════════════════════════════════════
const PHARMA_DB = {
  // ── CANNABINOIDS ──
  'cbd': { class:'cannabinoid', cyp_sub:['CYP2C19','CYP3A4'], cyp_inh:['CYP3A4_strong','CYP2C19_strong','CYP2C9_mod','CYP2D6_mod','CYP1A2_weak'], ugt_inh:['UGT1A9_strong','UGT2B7_mod','UGT1A1_mod'], transport:['P-gp_inh','BCRP_inh'], receptor:['CB1_partial','CB2_agonist','5HT1A_agonist','TRPV1','GPR55'], sero:true, nti:false, half:'18-32h', sched:'OTC', notes:'Potent CYP inhibitor. FDA Epidiolex warns hepatotoxicity w/ valproate.' },
  'thc': { class:'cannabinoid', cyp_sub:['CYP2C9','CYP3A4'], cyp_inh:['CYP3A4_mod','CYP2C9_weak'], ugt_inh:['UGT1A1_weak'], transport:['P-gp_sub'], receptor:['CB1_agonist','CB2_partial'], sero:false, nti:false, half:'20-36h', sched:'Schedule I/State legal', notes:'Smoking induces CYP1A2.' },
  'cbg': { class:'cannabinoid', cyp_sub:['CYP3A4'], cyp_inh:['CYP2C9_mod','CYP3A4_weak'], ugt_inh:[], transport:[], receptor:['CB1_antagonist','CB2_partial','5HT1A','TRPV1'], sero:true, nti:false, half:'2-6h', sched:'OTC', notes:'Emerging data.' },
  'cbn': { class:'cannabinoid', cyp_sub:['CYP3A4'], cyp_inh:['CYP3A4_weak'], ugt_inh:[], transport:[], receptor:['CB1_weak','CB2_partial'], sero:false, nti:false, half:'2-4h', sched:'OTC', notes:'Sedative. Degradation product of THC.' },
  'delta-8-thc': { class:'cannabinoid', cyp_sub:['CYP2C9','CYP3A4'], cyp_inh:['CYP3A4_weak'], ugt_inh:[], transport:[], receptor:['CB1_partial'], sero:false, nti:false, half:'unknown', sched:'Legal gray area', notes:'Less psychoactive than Delta-9.' },
  // ── SUPPLEMENTS ──
  'melatonin': { class:'supplement', cyp_sub:['CYP1A2'], cyp_inh:[], ugt_inh:[], transport:[], receptor:['MT1','MT2'], sero:false, nti:false, half:'0.5-1h', sched:'OTC', notes:'Short half-life. CYP1A2 inhibitors increase levels.' },
  'ashwagandha': { class:'adaptogen', cyp_sub:[], cyp_inh:['CYP2C9_weak','CYP3A4_weak'], ugt_inh:[], transport:[], receptor:['GABA_mod','thyroid_stim'], sero:false, nti:false, half:'unknown', sched:'OTC', notes:'May affect thyroid. Monitor TSH w/ levothyroxine.' },
  'turmeric': { class:'supplement', cyp_sub:[], cyp_inh:['CYP2C9_mod','CYP3A4_weak','CYP1A2_weak'], ugt_inh:['UGT1A1_weak'], transport:['P-gp_inh'], receptor:['COX2_inh','NF-kB'], sero:false, nti:false, half:'6-7h', sched:'OTC', notes:'Inhibits platelet aggregation. Bleeding risk w/ anticoagulants.' },
  'st-johns-wort': { class:'supplement', cyp_sub:[], cyp_inh:[], ugt_inh:[], transport:['P-gp_inducer'], receptor:['SERT_inh','MAO_weak'], sero:true, nti:false, half:'24-48h', sched:'OTC', notes:'POTENT CYP3A4 INDUCER. Reduces efficacy of many drugs.', cyp_ind:['CYP3A4_strong','CYP2C9_mod','CYP1A2_mod','CYP2C19_mod'] },
  'valerian': { class:'supplement', cyp_sub:[], cyp_inh:['CYP3A4_weak'], ugt_inh:[], transport:[], receptor:['GABA_A_mod'], sero:false, nti:false, half:'1-2h', sched:'OTC', notes:'GABAergic. Additive w/ CNS depressants.' },
  'kava': { class:'supplement', cyp_sub:[], cyp_inh:['CYP2E1_mod','CYP1A2_weak','CYP2D6_weak'], ugt_inh:[], transport:[], receptor:['GABA_A_mod','sodium_ch_block'], sero:false, nti:false, half:'9h', sched:'OTC', notes:'Hepatotoxicity concern. Avoid w/ alcohol.' },
  'ginkgo': { class:'supplement', cyp_sub:[], cyp_inh:['CYP2C9_weak'], ugt_inh:[], transport:['P-gp_inh_weak'], receptor:['PAF_antagonist','NO_mod'], sero:false, nti:false, half:'3-10h', sched:'OTC', notes:'Antiplatelet. Bleeding risk w/ anticoagulants.' },
  'ginseng': { class:'adaptogen', cyp_sub:[], cyp_inh:['CYP3A4_weak','CYP2D6_weak'], ugt_inh:[], transport:[], receptor:['cortisol_mod','NO_mod'], sero:false, nti:false, half:'varies', sched:'OTC', notes:'May affect blood sugar. Monitor w/ diabetes meds.' },
  'magnesium': { class:'mineral', cyp_sub:[], cyp_inh:[], ugt_inh:[], transport:[], receptor:['NMDA_block','GABA_mod'], sero:false, nti:false, half:'varies', sched:'OTC', notes:'Complementary w/ melatonin. Can reduce absorption of some drugs.' },
  'zinc': { class:'mineral', cyp_sub:[], cyp_inh:[], ugt_inh:[], transport:[], receptor:['immune_mod'], sero:false, nti:false, half:'varies', sched:'OTC', notes:'Competes w/ copper absorption. Can reduce antibiotic absorption.' },
  'vitamin-d': { class:'vitamin', cyp_sub:['CYP2R1','CYP27B1'], cyp_inh:[], ugt_inh:[], transport:[], receptor:['VDR'], sero:false, nti:false, half:'15d', sched:'OTC', notes:'CYP24A1 inactivates. High doses may cause hypercalcemia.' },
  'omega-3': { class:'supplement', cyp_sub:[], cyp_inh:[], ugt_inh:[], transport:[], receptor:['COX_mod','resolvin'], sero:false, nti:false, half:'varies', sched:'OTC', notes:'Mild antiplatelet effect at high doses.' },
  'probiotics': { class:'supplement', cyp_sub:[], cyp_inh:[], ugt_inh:[], transport:[], receptor:['gut_microbiome'], sero:false, nti:false, half:'transit', sched:'OTC', notes:'May affect drug absorption timing.' },
  'iron': { class:'mineral', cyp_sub:[], cyp_inh:[], ugt_inh:[], transport:[], receptor:[], sero:false, nti:false, half:'6h', sched:'OTC', notes:'Chelates w/ levothyroxine, tetracyclines, quinolones. Separate by 2h.' },
  'b-complex': { class:'vitamin', cyp_sub:[], cyp_inh:[], ugt_inh:[], transport:[], receptor:[], sero:false, nti:false, half:'varies', sched:'OTC', notes:'B6 high doses may reduce levodopa efficacy.' },
  'coq10': { class:'supplement', cyp_sub:[], cyp_inh:[], ugt_inh:[], transport:[], receptor:['mitochondria'], sero:false, nti:false, half:'33h', sched:'OTC', notes:'Structurally similar to vitamin K. May reduce warfarin efficacy.' },
  'milk-thistle': { class:'supplement', cyp_sub:[], cyp_inh:['CYP2C9_weak','CYP3A4_weak'], ugt_inh:['UGT1A1_weak'], transport:['P-gp_inh_weak'], receptor:[], sero:false, nti:false, half:'6h', sched:'OTC', notes:'Hepatoprotective. Mild CYP effects.' },
  'echinacea': { class:'supplement', cyp_sub:[], cyp_inh:['CYP1A2_mod'], ugt_inh:[], transport:[], receptor:['immune_stim'], sero:false, nti:false, half:'varies', sched:'OTC', notes:'Short-term CYP3A4 inhibition then induction w/ chronic use.' },
  'kratom': { class:'supplement', cyp_sub:['CYP3A4','CYP2D6'], cyp_inh:['CYP2D6_strong','CYP3A4_mod'], ugt_inh:[], transport:[], receptor:['mu_opioid','delta_opioid','5HT2A'], sero:true, nti:false, half:'varies', sched:'Unscheduled/varies', notes:'Opioid activity. Serotonin syndrome risk w/ SSRIs. CYP2D6 strong inhibitor.' },
  // ── COMMON MEDICATIONS ──
  'sertraline': { class:'SSRI', cyp_sub:['CYP2C19','CYP2B6','CYP2C9','CYP3A4','CYP2D6'], cyp_inh:['CYP2D6_mod','CYP2B6_weak'], ugt_inh:[], transport:[], receptor:['SERT_inh'], sero:true, nti:false, half:'22-36h', sched:'Rx', notes:'Primary SSRI. CYP2C19 polymorphism affects levels.' },
  'fluoxetine': { class:'SSRI', cyp_sub:['CYP2D6','CYP2C9'], cyp_inh:['CYP2D6_strong','CYP2C19_mod','CYP3A4_weak'], ugt_inh:[], transport:[], receptor:['SERT_inh'], sero:true, nti:false, half:'4-6d (norfluoxetine)', sched:'Rx', notes:'Strong CYP2D6 inhibitor. Very long half-life.' },
  'escitalopram': { class:'SSRI', cyp_sub:['CYP2C19','CYP3A4'], cyp_inh:['CYP2D6_weak'], ugt_inh:[], transport:['P-gp_sub'], receptor:['SERT_inh'], sero:true, nti:false, half:'27-32h', sched:'Rx', notes:'Cleanest SSRI. Fewer CYP interactions than others.' },
  'venlafaxine': { class:'SNRI', cyp_sub:['CYP2D6','CYP3A4'], cyp_inh:[], ugt_inh:[], transport:[], receptor:['SERT_inh','NET_inh'], sero:true, nti:false, half:'5h (11h ODV)', sched:'Rx', notes:'CYP2D6 poor metabolizers get higher levels.' },
  'bupropion': { class:'NDRI', cyp_sub:['CYP2B6'], cyp_inh:['CYP2D6_strong'], ugt_inh:[], transport:[], receptor:['DAT_inh','NET_inh','nACh_ant'], sero:false, nti:false, half:'21h', sched:'Rx', notes:'Strong CYP2D6 inhibitor. Seizure risk.' },
  'trazodone': { class:'SARI', cyp_sub:['CYP3A4'], cyp_inh:[], ugt_inh:[], transport:[], receptor:['5HT2A_ant','SERT_weak','H1_ant','alpha1_ant'], sero:true, nti:false, half:'7-15h', sched:'Rx', notes:'CYP3A4 inhibitors raise levels significantly.' },
  'warfarin': { class:'anticoagulant', cyp_sub:['CYP2C9','CYP3A4','CYP1A2'], cyp_inh:[], ugt_inh:[], transport:[], receptor:['VKORC1'], sero:false, nti:true, half:'20-60h', sched:'Rx', notes:'NTI. CYP2C9 inhibition → elevated INR → bleeding.' },
  'levothyroxine': { class:'thyroid', cyp_sub:[], cyp_inh:[], ugt_inh:[], transport:[], receptor:['thyroid_replacement'], sero:false, nti:true, half:'6-7d', sched:'Rx', notes:'NTI. Absorption affected by calcium, iron, coffee. Take alone.' },
  'metformin': { class:'antidiabetic', cyp_sub:[], cyp_inh:[], ugt_inh:[], transport:['OCT1_sub','OCT2_sub','MATE1_sub'], receptor:['AMPK'], sero:false, nti:false, half:'6h', sched:'Rx', notes:'Not CYP metabolized. Transport interactions possible.' },
  'lisinopril': { class:'ACE_inhibitor', cyp_sub:[], cyp_inh:[], ugt_inh:[], transport:[], receptor:['ACE_inh'], sero:false, nti:false, half:'12h', sched:'Rx', notes:'Not CYP metabolized. Hyperkalemia risk w/ potassium supplements.' },
  'amlodipine': { class:'CCB', cyp_sub:['CYP3A4'], cyp_inh:[], ugt_inh:[], transport:[], receptor:['L-type_Ca_block'], sero:false, nti:false, half:'30-50h', sched:'Rx', notes:'CYP3A4 inhibitors increase levels.' },
  'atorvastatin': { class:'statin', cyp_sub:['CYP3A4'], cyp_inh:[], ugt_inh:[], transport:['OATP1B1_sub','P-gp_sub'], receptor:['HMG-CoA_inh'], sero:false, nti:false, half:'14h', sched:'Rx', notes:'CYP3A4 inhibitors increase statin levels → myopathy risk.' },
  'omeprazole': { class:'PPI', cyp_sub:['CYP2C19','CYP3A4'], cyp_inh:['CYP2C19_mod'], ugt_inh:[], transport:[], receptor:['H+K+ATPase_inh'], sero:false, nti:false, half:'1h', sched:'OTC/Rx', notes:'CYP2C19 inhibitor. Reduces absorption of many drugs.' },
  'gabapentin': { class:'anticonvulsant', cyp_sub:[], cyp_inh:[], ugt_inh:[], transport:[], receptor:['alpha2delta_Ca'], sero:false, nti:false, half:'5-7h', sched:'Rx', notes:'Renal elimination. No CYP interactions. CNS depression additive.' },
  'alprazolam': { class:'benzodiazepine', cyp_sub:['CYP3A4'], cyp_inh:[], ugt_inh:[], transport:[], receptor:['GABA_A_pos_mod'], sero:false, nti:false, half:'11h', sched:'Schedule IV', notes:'CYP3A4 inhibitors increase levels. CNS depression additive.' },
  'zolpidem': { class:'z-drug', cyp_sub:['CYP3A4','CYP1A2'], cyp_inh:[], ugt_inh:[], transport:[], receptor:['GABA_A_alpha1'], sero:false, nti:false, half:'2.5h', sched:'Schedule IV', notes:'CYP3A4 inhibitors increase levels significantly.' },
  'tramadol': { class:'opioid', cyp_sub:['CYP2D6','CYP3A4'], cyp_inh:[], ugt_inh:[], transport:[], receptor:['mu_opioid_weak','SERT_inh','NET_inh'], sero:true, nti:false, half:'6h', sched:'Schedule IV', notes:'CYP2D6 converts to active metabolite. Serotonin syndrome risk.' },
  'birth-control': { class:'hormonal_contraceptive', cyp_sub:['CYP3A4'], cyp_inh:[], ugt_inh:[], transport:[], receptor:['estrogen_progestin'], sero:false, nti:true, half:'varies', sched:'Rx', notes:'CYP3A4 inducers reduce efficacy. St Johns Wort is major risk.' },
  'prednisone': { class:'corticosteroid', cyp_sub:['CYP3A4'], cyp_inh:[], ugt_inh:[], transport:['P-gp_sub'], receptor:['GR_agonist'], sero:false, nti:false, half:'3-4h', sched:'Rx', notes:'CYP3A4 inhibitors increase levels.' },
  'metoprolol': { class:'beta_blocker', cyp_sub:['CYP2D6'], cyp_inh:[], ugt_inh:[], transport:[], receptor:['beta1_ant'], sero:false, nti:false, half:'3-7h', sched:'Rx', notes:'CYP2D6 inhibitors increase levels. Bradycardia risk.' },
  'hydrochlorothiazide': { class:'diuretic', cyp_sub:[], cyp_inh:[], ugt_inh:[], transport:[], receptor:['NCC_inh'], sero:false, nti:false, half:'6-15h', sched:'Rx', notes:'Not CYP metabolized. Electrolyte monitoring needed.' },
  // ── OTC ──
  'ibuprofen': { class:'NSAID', cyp_sub:['CYP2C9'], cyp_inh:[], ugt_inh:[], transport:[], receptor:['COX1','COX2'], sero:false, nti:false, half:'2-4h', sched:'OTC', notes:'Antiplatelet. Bleeding risk w/ anticoagulants.' },
  'acetaminophen': { class:'analgesic', cyp_sub:['CYP2E1','CYP1A2','CYP3A4'], cyp_inh:[], ugt_inh:[], transport:[], receptor:['COX3_central','TRPV1'], sero:false, nti:false, half:'2-3h', sched:'OTC', notes:'CYP2E1 produces toxic NAPQI metabolite. Hepatotoxicity risk.' },
  'diphenhydramine': { class:'antihistamine', cyp_sub:['CYP2D6'], cyp_inh:['CYP2D6_mod'], ugt_inh:[], transport:[], receptor:['H1_ant','mACh_ant'], sero:false, nti:false, half:'2-8h', sched:'OTC', notes:'Anticholinergic. Additive sedation.' },
  'caffeine': { class:'stimulant', cyp_sub:['CYP1A2'], cyp_inh:[], ugt_inh:[], transport:[], receptor:['adenosine_A1_A2A_ant'], sero:false, nti:false, half:'3-5h', sched:'OTC', notes:'CYP1A2 inhibitors increase levels. Anxiety at high doses.' },
  'alcohol': { class:'depressant', cyp_sub:['ADH','CYP2E1'], cyp_inh:['CYP2E1_acute'], ugt_inh:[], transport:[], receptor:['GABA_A_pos','NMDA_block'], sero:false, nti:false, half:'varies', sched:'Legal', notes:'Acute = CYP2E1 inhibitor. Chronic = CYP2E1 inducer. CNS depression.', cyp_ind:['CYP2E1_chronic'] },
  'nicotine': { class:'stimulant', cyp_sub:['CYP2A6'], cyp_inh:[], ugt_inh:[], transport:[], receptor:['nACh_agonist'], sero:false, nti:false, half:'2h', sched:'OTC', notes:'Smoking induces CYP1A2 (not nicotine itself — the smoke).' },
  'pseudoephedrine': { class:'decongestant', cyp_sub:[], cyp_inh:[], ugt_inh:[], transport:[], receptor:['alpha1_agonist_indirect','beta_indirect'], sero:false, nti:false, half:'5-8h', sched:'OTC-BTC', notes:'Sympathomimetic. Avoid w/ MAOIs. Raises BP.' },
  'dextromethorphan': { class:'antitussive', cyp_sub:['CYP2D6','CYP3A4'], cyp_inh:[], ugt_inh:[], transport:[], receptor:['NMDA_ant','sigma1','SERT_inh'], sero:true, nti:false, half:'3-6h', sched:'OTC', notes:'CYP2D6 poor metabolizers get high levels. Serotonin risk.' },
};

// ═══════════════════════════════════════════════════════════════
// SAFETY ENGINE — 5-LAYER INTERACTION ANALYSIS
// ═══════════════════════════════════════════════════════════════
function runSafetyCheck(substanceNames) {
  const found = [], unknown = [];
  for (const name of substanceNames) {
    const key = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (PHARMA_DB[key]) found.push({ name, key, d: PHARMA_DB[key] });
    else unknown.push(name);
  }

  const interactions = [];

  for (let i = 0; i < found.length; i++) {
    for (let j = i + 1; j < found.length; j++) {
      const a = found[i], b = found[j];

      // LAYER 1: CYP450 Inhibition
      for (const inh of (a.d.cyp_inh || [])) {
        const [enz, str] = inh.split('_');
        const full = enz + (str ? '' : '');
        for (const sub of (b.d.cyp_sub || [])) {
          if (sub.startsWith(enz)) {
            const sev = b.d.nti ? 0.95 : (str === 'strong' ? 0.8 : str === 'mod' ? 0.6 : 0.3);
            interactions.push({ pair: `${a.name} + ${b.name}`, layer: 'CYP450', mechanism: `${a.name} inhibits ${enz} (${str || 'unknown'} strength), which metabolizes ${b.name}. May increase ${b.name} blood levels${b.d.nti ? ' — NARROW THERAPEUTIC INDEX' : ''}.`, severity: sev, enzyme: enz });
          }
        }
      }
      // Reverse direction
      for (const inh of (b.d.cyp_inh || [])) {
        const [enz, str] = inh.split('_');
        for (const sub of (a.d.cyp_sub || [])) {
          if (sub.startsWith(enz)) {
            const sev = a.d.nti ? 0.95 : (str === 'strong' ? 0.8 : str === 'mod' ? 0.6 : 0.3);
            interactions.push({ pair: `${b.name} + ${a.name}`, layer: 'CYP450', mechanism: `${b.name} inhibits ${enz} (${str || 'unknown'} strength), which metabolizes ${a.name}. May increase ${a.name} blood levels${a.d.nti ? ' — NARROW THERAPEUTIC INDEX' : ''}.`, severity: sev, enzyme: enz });
          }
        }
      }

      // LAYER 1b: CYP450 Induction (St. John's Wort etc.)
      for (const ind of (a.d.cyp_ind || [])) {
        const [enz, str] = ind.split('_');
        for (const sub of (b.d.cyp_sub || [])) {
          if (sub.startsWith(enz)) {
            interactions.push({ pair: `${a.name} + ${b.name}`, layer: 'CYP450_Induction', mechanism: `${a.name} INDUCES ${enz} — accelerates metabolism of ${b.name}. May REDUCE ${b.name} efficacy${b.d.nti ? ' — CRITICAL: narrow therapeutic index drug' : ''}.`, severity: b.d.nti ? 0.95 : 0.7, enzyme: enz });
          }
        }
      }
      for (const ind of (b.d.cyp_ind || [])) {
        const [enz, str] = ind.split('_');
        for (const sub of (a.d.cyp_sub || [])) {
          if (sub.startsWith(enz)) {
            interactions.push({ pair: `${b.name} + ${a.name}`, layer: 'CYP450_Induction', mechanism: `${b.name} INDUCES ${enz} — accelerates metabolism of ${a.name}. May REDUCE ${a.name} efficacy${a.d.nti ? ' — CRITICAL: narrow therapeutic index drug' : ''}.`, severity: a.d.nti ? 0.95 : 0.7, enzyme: enz });
          }
        }
      }

      // LAYER 2: UGT Enzyme Interactions
      for (const uA of (a.d.ugt_inh || [])) {
        const [enz] = uA.split('_');
        interactions.push({ pair: `${a.name} + ${b.name}`, layer: 'UGT', mechanism: `${a.name} inhibits ${enz} glucuronidation pathway. May affect clearance of ${b.name} if UGT-metabolized.`, severity: 0.4, enzyme: enz });
      }

      // LAYER 3: Transporter Interactions
      const aTransport = a.d.transport || [], bTransport = b.d.transport || [];
      for (const t of aTransport) {
        if (t.includes('inh') && bTransport.some(bt => bt.includes('sub') && bt.split('_')[0] === t.split('_')[0])) {
          const transporter = t.split('_')[0];
          interactions.push({ pair: `${a.name} + ${b.name}`, layer: 'Transporter', mechanism: `${a.name} inhibits ${transporter} transporter. ${b.name} is a ${transporter} substrate. May increase ${b.name} absorption/levels.`, severity: 0.5, enzyme: transporter });
        }
      }

      // LAYER 4: Serotonin Syndrome Risk
      if (a.d.sero && b.d.sero) {
        interactions.push({ pair: `${a.name} + ${b.name}`, layer: 'Serotonin', mechanism: `Both ${a.name} and ${b.name} affect serotonin pathways. Combined serotonergic activity increases risk of serotonin syndrome (agitation, hyperthermia, clonus, autonomic instability).`, severity: 0.85, enzyme: 'Serotonin' });
      }

      // LAYER 5: Pharmacodynamic — CNS Depression
      const aGABA = (a.d.receptor || []).some(r => r.includes('GABA'));
      const bGABA = (b.d.receptor || []).some(r => r.includes('GABA'));
      if (aGABA && bGABA) {
        interactions.push({ pair: `${a.name} + ${b.name}`, layer: 'CNS_Depression', mechanism: `Both ${a.name} and ${b.name} enhance GABAergic/CNS depressant activity. Combined use increases sedation, respiratory depression, and motor impairment risk.`, severity: 0.75, enzyme: 'GABA' });
      }

      // LAYER 5b: NTI + Any Interaction
      if ((a.d.nti || b.d.nti) && interactions.filter(ix => ix.pair.includes(a.name) && ix.pair.includes(b.name)).length > 0) {
        interactions.push({ pair: `${a.name} + ${b.name}`, layer: 'NTI_Warning', mechanism: `${a.d.nti ? a.name : b.name} has a narrow therapeutic index. ANY interaction affecting its levels requires medical supervision and monitoring.`, severity: 0.95, enzyme: 'NTI' });
      }
    }
  }

  // Deduplicate by layer+pair
  const seen = new Set();
  const unique = interactions.filter(ix => {
    const k = `${ix.layer}|${ix.pair}`;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });

  const maxSev = unique.length > 0 ? Math.max(...unique.map(i => i.severity)) : 0;

  return {
    query: substanceNames,
    recognized: found.map(f => ({ name: f.name, class: f.d.class, nti: f.d.nti, schedule: f.d.sched })),
    unknown,
    interactions: unique.sort((a, b) => b.severity - a.severity),
    risk_level: maxSev >= 0.8 ? 'HIGH' : maxSev >= 0.5 ? 'MODERATE' : maxSev > 0 ? 'LOW' : 'NONE',
    max_severity: maxSev,
    interaction_count: unique.length,
    substances_in_db: Object.keys(PHARMA_DB).length,
    engine_version: '3.0',
    disclaimer: 'Educational tool only. Not medical advice. Consult your healthcare provider.'
  };
}

// ═══════════════════════════════════════════════════════════════
// API QUERY FUNCTIONS — Free Federal APIs
// ═══════════════════════════════════════════════════════════════
async function queryNPI(query, city, state, taxonomy) {
  let url = `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=200`;
  if (taxonomy) url += `&taxonomy_description=${encodeURIComponent(taxonomy)}`;
  if (city) url += `&city=${encodeURIComponent(city)}`;
  if (state) url += `&state=${encodeURIComponent(state)}`;
  if (query && /^\d+$/.test(query)) url += `&number=${query}`;
  else if (query) {
    const parts = query.split(' ');
    if (parts.length > 1) url += `&first_name=${encodeURIComponent(parts[0])}&last_name=${encodeURIComponent(parts.slice(1).join(' '))}`;
    else url += `&last_name=${encodeURIComponent(query)}`;
  }
  const d = await fetchJSON(url);
  return { source: 'NPI Registry (CMS)', results: (d.results || []).slice(0, 50), count: d.result_count || 0 };
}

async function queryRxNorm(drug) {
  const d = await fetchJSON(`https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(drug)}`);
  return { source: 'RxNorm (NIH)', drug, results: (d?.drugGroup?.conceptGroup?.flatMap(g => g.conceptProperties || []) || []).slice(0, 10) };
}

async function queryRxInteractions(rxcui) {
  const d = await fetchJSON(`https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=${rxcui}`);
  return { source: 'RxNorm Interactions', rxcui, interactions: d?.interactionTypeGroup?.[0]?.interactionType?.[0]?.interactionPair || [] };
}

async function queryFDA(drug) {
  const k = ENV.openfda ? `&api_key=${ENV.openfda}` : '';
  const d = await fetchJSON(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(drug)}"+openfda.generic_name:"${encodeURIComponent(drug)}"&limit=3${k}`);
  return { source: 'FDA Labels', drug, results: (d.results || []).map(r => ({ brand: r.openfda?.brand_name?.[0], generic: r.openfda?.generic_name?.[0], warnings: r.warnings?.[0]?.substring(0, 500), interactions: r.drug_interactions?.[0]?.substring(0, 500) })) };
}

async function queryPubMed(term, maxResults = 5) {
  const k = ENV.ncbi ? `&api_key=${ENV.ncbi}` : '';
  const s = await fetchJSON(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=${maxResults}&term=${encodeURIComponent(term)}${k}`);
  const ids = s?.esearchresult?.idlist || [];
  if (ids.length === 0) return { source: 'PubMed', term, results: [] };
  const details = await fetchJSON(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}${k}`);
  return { source: 'PubMed (NCBI)', term, results: ids.map(id => ({ pmid: id, title: details?.result?.[id]?.title, authors: details?.result?.[id]?.authors?.slice(0, 3)?.map(a => a.name), journal: details?.result?.[id]?.fulljournalname, year: details?.result?.[id]?.pubdate?.substring(0, 4) })) };
}

async function queryClinicalTrials(condition, city) {
  let url = `https://clinicaltrials.gov/api/v2/studies?format=json&pageSize=10&query.cond=${encodeURIComponent(condition)}`;
  if (city) url += `&query.locn=${encodeURIComponent(city)}`;
  const d = await fetchJSON(url);
  return { source: 'ClinicalTrials.gov', condition, results: (d.studies || []).map(s => ({ title: s.protocolSection?.identificationModule?.officialTitle, status: s.protocolSection?.statusModule?.overallStatus, phase: s.protocolSection?.designModule?.phases?.[0], conditions: s.protocolSection?.conditionsModule?.conditions })) };
}

async function queryAirNow(lat, lng) {
  if (!ENV.airnow) return { source: 'AirNow', error: 'No API key' };
  const d = await fetchJSON(`https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=${lat}&longitude=${lng}&distance=25&API_KEY=${ENV.airnow}`);
  return { source: 'AirNow (EPA)', lat, lng, readings: Array.isArray(d) ? d : [] };
}

async function queryDailyMed(drug) {
  const d = await fetchJSON(`https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name=${encodeURIComponent(drug)}&pagesize=5`);
  return { source: 'DailyMed (NIH)', drug, results: (d?.data || []).map(r => ({ title: r.title, setid: r.setid, published: r.published_date })) };
}

async function queryOpenFoodFacts(barcode) {
  const d = await fetchJSON(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
  return { source: 'OpenFoodFacts', barcode, product: d?.product ? { name: d.product.product_name, brands: d.product.brands, nutriscore: d.product.nutriscore_grade, ingredients: d.product.ingredients_text?.substring(0, 300) } : null };
}

// ═══════════════════════════════════════════════════════════════
// NPI PIPELINE — Scrapes practitioners for 20 cities
// ═══════════════════════════════════════════════════════════════
const TARGET_CITIES = [
  { name: 'New Orleans', state: 'LA' }, { name: 'Austin', state: 'TX' },
  { name: 'Denver', state: 'CO' }, { name: 'Portland', state: 'OR' },
  { name: 'Nashville', state: 'TN' }, { name: 'Seattle', state: 'WA' },
  { name: 'Miami', state: 'FL' }, { name: 'San Francisco', state: 'CA' },
  { name: 'Los Angeles', state: 'CA' }, { name: 'Chicago', state: 'IL' },
  { name: 'New York', state: 'NY' }, { name: 'Phoenix', state: 'AZ' },
  { name: 'Philadelphia', state: 'PA' }, { name: 'San Antonio', state: 'TX' },
  { name: 'San Diego', state: 'CA' }, { name: 'Dallas', state: 'TX' },
  { name: 'Atlanta', state: 'GA' }, { name: 'Minneapolis', state: 'MN' },
  { name: 'Charlotte', state: 'NC' }, { name: 'Tampa', state: 'FL' },
];

const PRACTITIONER_TYPES = [
  'Psychologist', 'Clinical Social Worker', 'Marriage & Family Therapist',
  'Psychiatry', 'Counselor', 'Acupuncturist', 'Chiropractor',
  'Massage Therapist', 'Naturopath', 'Dietitian', 'Nutritionist',
  'Physical Therapist', 'Occupational Therapist', 'Nurse Practitioner',
  'Physician Assistant', 'Yoga Therapist',
];

// ═══════════════════════════════════════════════════════════════
// AUTONOMOUS ENGINE — Content factory, events, Google, research, protocols, ZIP, media
// (Loaded here because it needs PHARMA_DB and TARGET_CITIES)
// ═══════════════════════════════════════════════════════════════
let auto = null;
try { auto = require('./autonomous-engine')({ sb, ENV, fetchJSON, log, PHARMA_DB, TARGET_CITIES }); log('AUTO', 'Autonomous Engine loaded'); }
catch (e) { log('AUTO', `Autonomous Engine not loaded: ${e.message}`); }

let pipelineCycle = 0;
let pipelineRunning = false;

async function runPipelineCycle() {
  if (pipelineRunning) { log('PIPELINE', 'Already running, skipping'); return; }
  pipelineRunning = true;

  const cityIdx = pipelineCycle % TARGET_CITIES.length;
  const city = TARGET_CITIES[cityIdx];
  log('PIPELINE', `═══ Cycle ${pipelineCycle} | ${city.name}, ${city.state} ═══`);

  let totalFound = 0;

  for (const type of PRACTITIONER_TYPES) {
    try {
      const result = await queryNPI(null, city.name, city.state, type);
      if (!result.results || result.results.length === 0) continue;

      const practitioners = result.results.map(r => ({
        npi: r.number,
        first_name: r.basic?.first_name || '',
        last_name: r.basic?.last_name || '',
        credential: r.basic?.credential || '',
        gender: r.basic?.gender || '',
        city: r.addresses?.[0]?.city || city.name,
        state: r.addresses?.[0]?.state || city.state,
        zip: r.addresses?.[0]?.postal_code?.substring(0, 5) || '',
        phone: r.addresses?.[0]?.telephone_number || '',
        address: `${r.addresses?.[0]?.address_1 || ''}, ${r.addresses?.[0]?.city || ''}, ${r.addresses?.[0]?.state || ''} ${r.addresses?.[0]?.postal_code || ''}`,
        taxonomy: r.taxonomies?.[0]?.desc || type,
        specialty: type,
        source: 'NPI',
        scraped_at: new Date().toISOString()
      }));

      if (practitioners.length > 0) {
        const dbResult = await sb.upsert('practitioners', practitioners);
        totalFound += practitioners.length;
        log('PIPELINE', `  ${type}: ${practitioners.length} found${dbResult?.error ? ' (DB: ' + JSON.stringify(dbResult.error).substring(0, 80) + ')' : ''}`);
      }

      // NPI rate limit
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      log('PIPELINE', `  ${type}: ERROR - ${e.message}`);
    }
  }

  // Log the run
  await sb.insert('pipeline_log', [{
    city: city.name, state: city.state,
    practitioners_found: totalFound,
    cycle_index: pipelineCycle,
    ran_at: new Date().toISOString()
  }]);

  log('PIPELINE', `═══ ${city.name} complete: ${totalFound} practitioners ═══`);

  // Generate SEO pages for this city
  if (seo && totalFound > 0) {
    seo.afterPipelineCycle(city).catch(e => log('SEO', `Page gen error: ${e.message}`));
  }

  pipelineCycle++;
  pipelineRunning = false;
}

// ═══════════════════════════════════════════════════════════════
// CLAUDE CHAT — AI wellness guide
// ═══════════════════════════════════════════════════════════════
async function claudeChat(message) {
  if (!ENV.claude) return { response: 'AI not configured.' };
  try {
    const d = await fetchJSON('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': ENV.claude, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 1024,
        system: `You are the BLEU.LIVE AI wellness guide. You help people with health, longevity, wellness, supplement safety, practitioner finding, and holistic wellbeing. You know about the 5 longevity wellspring cities (Okinawa, Sardinia, Nicoya, Ikaria, Loma Linda). You measure health across 10 dimensions: Mind, Body, Spirit, Rest, Nourish, Finances, Safety, ECS, Family, Connect. You understand that financial stress IS health stress. Be warm, knowledgeable, concise. Always recommend consulting healthcare providers for medical decisions.`,
        messages: [{ role: 'user', content: message }]
      })
    });
    return { response: d?.content?.[0]?.text || 'No response' };
  } catch (e) { return { response: `Error: ${e.message}` }; }
}

// ═══════════════════════════════════════════════════════════════
// HTTP SERVER — All Endpoints
// ═══════════════════════════════════════════════════════════════
function sendJSON(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function sendHTML(res, code, html) {
  res.writeHead(code, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(html);
}

function sendText(res, code, text, type) {
  res.writeHead(code, { 'Content-Type': type || 'text/plain' });
  res.end(text);
}

function getBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
  });
}

function getParams(url) {
  const u = new URL(url, 'http://localhost');
  const p = {};
  u.searchParams.forEach((v, k) => p[k] = v);
  return { path: u.pathname, params: p };
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return sendJSON(res, 200, {});

  const { path, params } = getParams(req.url);
  log('REQ', `${req.method} ${path}`);

  try {
    // ── HEALTH ──
    if (path === '/' || path === '/health') {
      const practCount = await sb.count('practitioners');
      return sendJSON(res, 200, {
        status: 'BLEU.LIVE ENGINE v3.2 — ONLINE',
        uptime: process.uptime(),
        services: {
          safety_engine: `${Object.keys(PHARMA_DB).length} substances, 5 layers`,
          claude_ai: ENV.claude ? 'CONNECTED' : 'NO KEY',
          supabase: ENV.sbUrl ? 'CONNECTED' : 'NO CONFIG',
          seo_engine: seo ? 'LOADED — generating pages' : 'NOT LOADED',
          autonomous_engine: auto ? 'RUNNING — 7 subsystems 24/7' : 'NOT LOADED',
          pipeline: `Cycle ${pipelineCycle}, ${TARGET_CITIES.length} cities, ${PRACTITIONER_TYPES.length} types`,
          practitioners_in_db: practCount,
        },
        endpoints: [
          'GET  /api/safety-check?substances=cbd,sertraline',
          'GET  /api/npi?city=Austin&state=TX&taxonomy=Psychologist',
          'GET  /api/rxnorm?drug=sertraline',
          'GET  /api/rx-interactions?rxcui=36437',
          'GET  /api/fda?drug=sertraline',
          'GET  /api/pubmed?term=CBD+anxiety&max=5',
          'GET  /api/trials?condition=anxiety&city=Austin',
          'GET  /api/airnow?lat=29.95&lng=-90.07',
          'GET  /api/dailymed?drug=sertraline',
          'GET  /api/food?barcode=0049000006346',
          'POST /api/chat  {message:"your question"}',
          'GET  /api/pipeline/status',
          'POST /api/pipeline/run',
          'GET  /api/practitioners?city=Austin&state=TX',
          'GET  /api/substances',
          'GET  /api/stats',
          '── SEO PAGES ──',
          'GET  /cities                        — All cities index',
          'GET  /new-orleans                   — City wellness hub',
          'GET  /new-orleans/psychologist      — City + specialty listing',
          'GET  /practitioner/1234567890       — Practitioner profile',
          'GET  /safety-check                  — Interactive safety page',
          'GET  /sitemap.xml                   — Google sitemap',
          'GET  /robots.txt                    — Crawler instructions',
        ]
      });
    }

    // ── SAFETY ENGINE ──
    if (path === '/api/safety-check') {
      const subs = (params.substances || '').split(',').map(s => s.trim()).filter(Boolean);
      if (subs.length < 2) return sendJSON(res, 400, { error: 'Provide at least 2 substances: ?substances=cbd,sertraline' });
      const result = runSafetyCheck(subs);
      // Log to Supabase
      sb.insert('safety_checks', [{ substances: subs, risk_level: result.risk_level, interaction_count: result.interaction_count, checked_at: new Date().toISOString() }]);
      return sendJSON(res, 200, result);
    }

    if (path === '/api/substances') {
      return sendJSON(res, 200, {
        count: Object.keys(PHARMA_DB).length,
        substances: Object.entries(PHARMA_DB).map(([k, v]) => ({ key: k, name: v.class === 'cannabinoid' ? k.toUpperCase() : k.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '), class: v.class, schedule: v.sched, nti: v.nti || false }))
      });
    }

    // ── NPI ──
    if (path === '/api/npi') {
      const r = await safe(() => queryNPI(params.query, params.city, params.state, params.taxonomy));
      return sendJSON(res, 200, r);
    }

    // ── RXNORM ──
    if (path === '/api/rxnorm') {
      if (!params.drug) return sendJSON(res, 400, { error: 'Provide ?drug=name' });
      return sendJSON(res, 200, await safe(() => queryRxNorm(params.drug)));
    }

    if (path === '/api/rx-interactions') {
      if (!params.rxcui) return sendJSON(res, 400, { error: 'Provide ?rxcui=12345' });
      return sendJSON(res, 200, await safe(() => queryRxInteractions(params.rxcui)));
    }

    // ── FDA ──
    if (path === '/api/fda') {
      if (!params.drug) return sendJSON(res, 400, { error: 'Provide ?drug=name' });
      return sendJSON(res, 200, await safe(() => queryFDA(params.drug)));
    }

    // ── PUBMED ──
    if (path === '/api/pubmed') {
      if (!params.term) return sendJSON(res, 400, { error: 'Provide ?term=search+term' });
      return sendJSON(res, 200, await safe(() => queryPubMed(params.term, parseInt(params.max) || 5)));
    }

    // ── CLINICAL TRIALS ──
    if (path === '/api/trials') {
      if (!params.condition) return sendJSON(res, 400, { error: 'Provide ?condition=name' });
      return sendJSON(res, 200, await safe(() => queryClinicalTrials(params.condition, params.city)));
    }

    // ── AIR QUALITY ──
    if (path === '/api/airnow') {
      if (!params.lat || !params.lng) return sendJSON(res, 400, { error: 'Provide ?lat=29.95&lng=-90.07' });
      return sendJSON(res, 200, await safe(() => queryAirNow(params.lat, params.lng)));
    }

    // ── DAILYMED ──
    if (path === '/api/dailymed') {
      if (!params.drug) return sendJSON(res, 400, { error: 'Provide ?drug=name' });
      return sendJSON(res, 200, await safe(() => queryDailyMed(params.drug)));
    }

    // ── FOOD ──
    if (path === '/api/food') {
      if (!params.barcode) return sendJSON(res, 400, { error: 'Provide ?barcode=0049000006346' });
      return sendJSON(res, 200, await safe(() => queryOpenFoodFacts(params.barcode)));
    }

    // ── CLAUDE CHAT ──
    if (path === '/api/chat' && req.method === 'POST') {
      const body = await getBody(req);
      if (!body.message) return sendJSON(res, 400, { error: 'Provide {message: "your question"}' });
      return sendJSON(res, 200, await claudeChat(body.message));
    }

    // ── PRACTITIONERS FROM DB ──
    if (path === '/api/practitioners') {
      let query = 'select=*&limit=50';
      if (params.city) query += `&city=ilike.${encodeURIComponent(params.city)}`;
      if (params.state) query += `&state=eq.${encodeURIComponent(params.state)}`;
      if (params.specialty) query += `&specialty=ilike.%25${encodeURIComponent(params.specialty)}%25`;
      return sendJSON(res, 200, await sb.query('practitioners', query));
    }

    // ── PIPELINE ──
    if (path === '/api/pipeline/status') {
      return sendJSON(res, 200, {
        running: pipelineRunning,
        cycle: pipelineCycle,
        current_city: TARGET_CITIES[pipelineCycle % TARGET_CITIES.length],
        total_cities: TARGET_CITIES.length,
        practitioner_types: PRACTITIONER_TYPES.length,
        next_run: pipelineRunning ? 'running now' : 'scheduled'
      });
    }

    if (path === '/api/pipeline/run' && req.method === 'POST') {
      if (pipelineRunning) return sendJSON(res, 200, { status: 'Already running' });
      runPipelineCycle(); // fire and forget
      return sendJSON(res, 200, { status: 'Pipeline started', city: TARGET_CITIES[pipelineCycle % TARGET_CITIES.length] });
    }

    // ── STATS ──
    if (path === '/api/stats') {
      const [pract, pages, checks] = await Promise.all([
        sb.count('practitioners'), sb.count('seo_pages'), sb.count('safety_checks')
      ]);
      return sendJSON(res, 200, {
        practitioners: pract, seo_pages: pages, safety_checks: checks,
        substances_in_engine: Object.keys(PHARMA_DB).length,
        pipeline_cycles: pipelineCycle,
        uptime_hours: (process.uptime() / 3600).toFixed(1),
        cities_covered: TARGET_CITIES.length
      });
    }

    // ── AUTONOMOUS ENGINE STATUS ──
    if (path === '/api/autonomous') {
      return sendJSON(res, 200, auto ? auto.getStatus() : { status: 'NOT LOADED' });
    }

    // ── SEO PAGES — city hubs, specialty listings, practitioner profiles ──
    if (seo) {
      const seoResult = await seo.handleRoute(path);
      if (seoResult) {
        if (seoResult.type === 'html') return sendHTML(res, 200, seoResult.content);
        if (seoResult.type === 'xml') return sendText(res, 200, seoResult.content, 'application/xml');
        if (seoResult.type === 'text') return sendText(res, 200, seoResult.content, 'text/plain');
      }
    }

    // ── 404 ──
    sendJSON(res, 404, { error: 'Not found', hint: 'Try / for all endpoints' });

  } catch (e) {
    log('ERROR', `${path}: ${e.message}`);
    sendJSON(res, 500, { error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════
server.listen(PORT, () => {
  log('SERVER', `═══════════════════════════════════════════════`);
  log('SERVER', `  BLEU.LIVE ENGINE v3.2 — PORT ${PORT}`);
  log('SERVER', `  Safety Engine: ${Object.keys(PHARMA_DB).length} substances, 5 layers`);
  log('SERVER', `  Claude AI: ${ENV.claude ? 'CONNECTED' : 'NO KEY'}`);
  log('SERVER', `  Supabase: ${ENV.sbUrl ? 'CONNECTED' : 'NO CONFIG'}`);
  log('SERVER', `  SEO Engine: ${seo ? 'LOADED' : 'NOT LOADED'}`);
  log('SERVER', `  Autonomous: ${auto ? 'LOADED — 7 subsystems' : 'NOT LOADED'}`);
  log('SERVER', `  Pipeline: ${TARGET_CITIES.length} cities × ${PRACTITIONER_TYPES.length} types`);
  log('SERVER', `═══════════════════════════════════════════════`);

  // Start pipeline scheduler — first run in 90 seconds, then every 30 min
  if (ENV.sbUrl && ENV.sbKey) {
    log('SCHEDULER', 'Pipeline scheduler ACTIVE');
    setTimeout(() => runPipelineCycle(), 90 * 1000);
    setInterval(() => runPipelineCycle(), 30 * 60 * 1000);
  } else {
    log('SCHEDULER', 'No Supabase config — pipeline disabled');
  }

  // Start autonomous engine — content, events, Google, research, protocols, ZIP, media
  if (auto && ENV.sbUrl && ENV.claude) {
    auto.start();
  } else {
    log('AUTO', 'Autonomous Engine not started — missing Supabase or Claude config');
  }
});
