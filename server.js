// ============================================================
// BLEU.LIVE — Safety Check Engine v1.0
// The Google of Wellness — 5-Layer Pharmacology + 9 Live APIs
// ============================================================

const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;

// ============================================================
// PHARMACOLOGY DATABASE — CYP450 + UGT + Transporters
// ============================================================
const PHARMACOLOGY_DB = {
  // CANNABINOIDS
  cbd: {
    name: 'Cannabidiol (CBD)',
    category: 'cannabinoid',
    cyp_inhibits: ['CYP3A4', 'CYP2C19', 'CYP2C9', 'CYP2D6', 'CYP1A2'],
    cyp_substrates: ['CYP3A4', 'CYP2C19'],
    ugt_inhibits: ['UGT1A9', 'UGT2B7'],
    transporters: ['P-gp inhibitor'],
    pharmacodynamic: ['sedation', 'hypotension', 'hepatotoxic_risk'],
    severity_base: 0.6
  },
  thc: {
    name: 'THC (Delta-9-Tetrahydrocannabinol)',
    category: 'cannabinoid',
    cyp_inhibits: ['CYP3A4', 'CYP2C9'],
    cyp_substrates: ['CYP2C9', 'CYP3A4'],
    ugt_inhibits: ['UGT1A1'],
    transporters: ['P-gp substrate'],
    pharmacodynamic: ['sedation', 'tachycardia', 'psychoactive'],
    severity_base: 0.5
  },
  cbg: {
    name: 'Cannabigerol (CBG)',
    category: 'cannabinoid',
    cyp_inhibits: ['CYP3A4', 'CYP2D6'],
    cyp_substrates: ['CYP3A4'],
    ugt_inhibits: [],
    transporters: [],
    pharmacodynamic: ['anti-inflammatory'],
    severity_base: 0.3
  },
  cbn: {
    name: 'Cannabinol (CBN)',
    category: 'cannabinoid',
    cyp_inhibits: ['CYP3A4'],
    cyp_substrates: ['CYP3A4', 'CYP2C9'],
    ugt_inhibits: [],
    transporters: [],
    pharmacodynamic: ['sedation'],
    severity_base: 0.3
  },
  // COMMON DRUGS
  warfarin: {
    name: 'Warfarin',
    category: 'pharmaceutical',
    cyp_inhibits: [],
    cyp_substrates: ['CYP2C9', 'CYP3A4', 'CYP1A2'],
    ugt_inhibits: [],
    transporters: [],
    pharmacodynamic: ['bleeding_risk', 'vitamin_k_sensitive'],
    severity_base: 0.8,
    narrow_therapeutic_index: true
  },
  metformin: {
    name: 'Metformin',
    category: 'pharmaceutical',
    cyp_inhibits: [],
    cyp_substrates: [],
    ugt_inhibits: [],
    transporters: ['OCT1 substrate', 'OCT2 substrate', 'MATE1 substrate'],
    pharmacodynamic: ['hypoglycemia', 'lactic_acidosis_risk'],
    severity_base: 0.4
  },
  clopidogrel: {
    name: 'Clopidogrel (Plavix)',
    category: 'pharmaceutical',
    cyp_inhibits: [],
    cyp_substrates: ['CYP2C19', 'CYP3A4'],
    ugt_inhibits: [],
    transporters: ['P-gp substrate'],
    pharmacodynamic: ['bleeding_risk'],
    severity_base: 0.7,
    narrow_therapeutic_index: true
  },
  metoprolol: {
    name: 'Metoprolol',
    category: 'pharmaceutical',
    cyp_inhibits: [],
    cyp_substrates: ['CYP2D6'],
    ugt_inhibits: [],
    transporters: [],
    pharmacodynamic: ['bradycardia', 'hypotension'],
    severity_base: 0.5
  },
  sertraline: {
    name: 'Sertraline (Zoloft)',
    category: 'pharmaceutical',
    cyp_inhibits: ['CYP2D6'],
    cyp_substrates: ['CYP2C19', 'CYP2D6', 'CYP3A4'],
    ugt_inhibits: [],
    transporters: ['P-gp substrate'],
    pharmacodynamic: ['serotonin_syndrome_risk', 'sedation'],
    severity_base: 0.5
  },
  fluoxetine: {
    name: 'Fluoxetine (Prozac)',
    category: 'pharmaceutical',
    cyp_inhibits: ['CYP2D6', 'CYP2C19'],
    cyp_substrates: ['CYP2D6', 'CYP2C19'],
    ugt_inhibits: [],
    transporters: [],
    pharmacodynamic: ['serotonin_syndrome_risk', 'sedation'],
    severity_base: 0.5
  },
  omeprazole: {
    name: 'Omeprazole (Prilosec)',
    category: 'pharmaceutical',
    cyp_inhibits: ['CYP2C19'],
    cyp_substrates: ['CYP2C19', 'CYP3A4'],
    ugt_inhibits: [],
    transporters: [],
    pharmacodynamic: ['nutrient_depletion'],
    severity_base: 0.3
  },
  atorvastatin: {
    name: 'Atorvastatin (Lipitor)',
    category: 'pharmaceutical',
    cyp_inhibits: [],
    cyp_substrates: ['CYP3A4'],
    ugt_inhibits: [],
    transporters: ['P-gp substrate', 'OATP1B1 substrate'],
    pharmacodynamic: ['myopathy_risk', 'hepatotoxic_risk'],
    severity_base: 0.5
  },
  lisinopril: {
    name: 'Lisinopril',
    category: 'pharmaceutical',
    cyp_inhibits: [],
    cyp_substrates: [],
    ugt_inhibits: [],
    transporters: [],
    pharmacodynamic: ['hypotension', 'hyperkalemia'],
    severity_base: 0.3
  },
  amlodipine: {
    name: 'Amlodipine (Norvasc)',
    category: 'pharmaceutical',
    cyp_inhibits: [],
    cyp_substrates: ['CYP3A4'],
    ugt_inhibits: [],
    transporters: [],
    pharmacodynamic: ['hypotension', 'edema'],
    severity_base: 0.4
  },
  gabapentin: {
    name: 'Gabapentin (Neurontin)',
    category: 'pharmaceutical',
    cyp_inhibits: [],
    cyp_substrates: [],
    ugt_inhibits: [],
    transporters: [],
    pharmacodynamic: ['sedation', 'dizziness'],
    severity_base: 0.4
  },
  // SUPPLEMENTS & HERBS
  turmeric: {
    name: 'Turmeric / Curcumin',
    category: 'supplement',
    cyp_inhibits: ['CYP3A4', 'CYP2C9', 'CYP1A2', 'CYP2D6'],
    cyp_substrates: [],
    ugt_inhibits: ['UGT1A1'],
    transporters: ['P-gp inhibitor'],
    pharmacodynamic: ['anti-inflammatory', 'bleeding_risk'],
    severity_base: 0.4
  },
  'st-johns-wort': {
    name: "St. John's Wort",
    category: 'supplement',
    cyp_inhibits: [],
    cyp_substrates: [],
    ugt_inhibits: [],
    transporters: ['P-gp inducer'],
    pharmacodynamic: ['serotonin_syndrome_risk'],
    cyp_induces: ['CYP3A4', 'CYP2C19', 'CYP2C9', 'CYP1A2'],
    severity_base: 0.7
  },
  melatonin: {
    name: 'Melatonin',
    category: 'supplement',
    cyp_inhibits: [],
    cyp_substrates: ['CYP1A2', 'CYP2C19'],
    ugt_inhibits: [],
    transporters: [],
    pharmacodynamic: ['sedation'],
    severity_base: 0.2
  },
  'fish-oil': {
    name: 'Fish Oil / Omega-3',
    category: 'supplement',
    cyp_inhibits: [],
    cyp_substrates: [],
    ugt_inhibits: [],
    transporters: [],
    pharmacodynamic: ['bleeding_risk'],
    severity_base: 0.2
  },
  'vitamin-d': {
    name: 'Vitamin D',
    category: 'supplement',
    cyp_inhibits: [],
    cyp_substrates: ['CYP3A4', 'CYP2R1'],
    ugt_inhibits: [],
    transporters: [],
    pharmacodynamic: ['hypercalcemia'],
    severity_base: 0.2
  },
  ashwagandha: {
    name: 'Ashwagandha',
    category: 'supplement',
    cyp_inhibits: ['CYP3A4', 'CYP2D6'],
    cyp_substrates: [],
    ugt_inhibits: [],
    transporters: [],
    pharmacodynamic: ['sedation', 'thyroid_modulation'],
    severity_base: 0.3
  }
};

// ============================================================
// PHARMACODYNAMIC RISK COMBINATIONS
// ============================================================
const PD_RISK_MAP = {
  'sedation+sedation': { risk: 'Additive CNS depression — drowsiness, impaired coordination, respiratory depression risk', severity: 0.6 },
  'bleeding_risk+bleeding_risk': { risk: 'Compounded bleeding risk — bruising, GI bleeds, hemorrhagic stroke risk', severity: 0.8 },
  'hypotension+hypotension': { risk: 'Additive blood pressure lowering — dizziness, fainting, falls', severity: 0.6 },
  'serotonin_syndrome_risk+serotonin_syndrome_risk': { risk: 'CRITICAL: Serotonin syndrome risk — agitation, tremor, hyperthermia, seizures', severity: 0.9 },
  'hepatotoxic_risk+hepatotoxic_risk': { risk: 'Combined liver stress — monitor liver enzymes (ALT/AST)', severity: 0.7 },
  'sedation+hypotension': { risk: 'Combined sedation + low blood pressure — fall risk, impaired driving', severity: 0.5 },
  'bleeding_risk+vitamin_k_sensitive': { risk: 'Bleeding risk amplified in vitamin K-sensitive medication — INR monitoring critical', severity: 0.8 },
};

// ============================================================
// UTILITY: HTTPS GET with Promise
// ============================================================
function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: { 'User-Agent': 'BleuLive/1.0', 'Accept': 'application/json', ...headers },
      timeout: 8000
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

// ============================================================
// UTILITY: HTTPS POST with Promise
// ============================================================
function httpsPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const payload = JSON.stringify(body);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': 'BleuLive/1.0',
        ...headers
      },
      timeout: 15000
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(payload);
    req.end();
  });
}

// ============================================================
// UTILITY: HTTP GET (for non-TLS APIs)
// ============================================================
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: { 'User-Agent': 'BleuLive/1.0', 'Accept': 'application/json' },
      timeout: 8000
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

// ============================================================
// API FUNCTIONS — Live calls to external data
// ============================================================

// RxNorm — Resolve drug names to standard IDs
async function rxnormLookup(drug) {
  try {
    const url = `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(drug)}`;
    const data = await httpsGet(url);
    const group = data?.drugGroup;
    if (!group?.conceptGroup) return { drug, found: false };
    const concepts = [];
    for (const cg of group.conceptGroup) {
      if (cg.conceptProperties) {
        for (const cp of cg.conceptProperties) {
          concepts.push({ rxcui: cp.rxcui, name: cp.name, tty: cp.tty });
        }
      }
    }
    return { drug, found: concepts.length > 0, results: concepts.slice(0, 5) };
  } catch (e) {
    return { drug, found: false, error: e.message };
  }
}

// OpenFDA — Drug label data
async function fdaLabelLookup(drug) {
  try {
    const base = process.env.OPENFDA_BASE_URL || 'https://api.fda.gov';
    const key = process.env.OPENFDA_API_KEY ? `&api_key=${process.env.OPENFDA_API_KEY}` : '';
    const url = `${base}/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(drug)}"&limit=1${key}`;
    const data = await httpsGet(url);
    if (!data?.results?.[0]) return { drug, found: false };
    const r = data.results[0];
    return {
      drug,
      found: true,
      brand_name: r.openfda?.brand_name?.[0] || 'Unknown',
      generic_name: r.openfda?.generic_name?.[0] || drug,
      warnings: (r.warnings || []).slice(0, 2),
      drug_interactions: (r.drug_interactions || []).slice(0, 2),
      contraindications: (r.contraindications || []).slice(0, 2)
    };
  } catch (e) {
    return { drug, found: false, error: e.message };
  }
}

// OpenFDA — Adverse Event Reports (FAERS)
async function fdaAdverseEvents(drug) {
  try {
    const base = process.env.OPENFDA_BASE_URL || 'https://api.fda.gov';
    const key = process.env.OPENFDA_API_KEY ? `&api_key=${process.env.OPENFDA_API_KEY}` : '';
    const url = `${base}/drug/event.json?search=patient.drug.openfda.generic_name:"${encodeURIComponent(drug)}"&count=patient.reaction.reactionmeddrapt.exact&limit=10${key}`;
    const data = await httpsGet(url);
    if (!data?.results) return { drug, found: false };
    return {
      drug,
      found: true,
      top_adverse_events: data.results.map(r => ({ reaction: r.term, count: r.count }))
    };
  } catch (e) {
    return { drug, found: false, error: e.message };
  }
}

// PubMed — Research citations
async function pubmedSearch(query) {
  try {
    const base = process.env.PUBMED_BASE_URL || 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
    const apiKey = process.env.NCBI_API_KEY ? `&api_key=${process.env.NCBI_API_KEY}` : '';
    const searchUrl = `${base}/esearch.fcgi?db=pubmed&retmode=json&retmax=5&term=${encodeURIComponent(query)}${apiKey}`;
    const searchData = await httpsGet(searchUrl);
    const ids = searchData?.esearchresult?.idlist || [];
    if (ids.length === 0) return { query, found: false, count: 0 };
    const summaryUrl = `${base}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}${apiKey}`;
    const summaryData = await httpsGet(summaryUrl);
    const articles = [];
    for (const id of ids) {
      const a = summaryData?.result?.[id];
      if (a) {
        articles.push({
          pmid: id,
          title: a.title,
          source: a.source,
          pubdate: a.pubdate,
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
        });
      }
    }
    return {
      query,
      found: true,
      count: parseInt(searchData.esearchresult.count),
      articles
    };
  } catch (e) {
    return { query, found: false, error: e.message };
  }
}

// ClinicalTrials.gov — Active trials
async function clinicalTrialsSearch(query) {
  try {
    const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(query)}&filter.overallStatus=RECRUITING&pageSize=3`;
    const data = await httpsGet(url);
    const studies = (data?.studies || []).map(s => ({
      nctId: s.protocolSection?.identificationModule?.nctId,
      title: s.protocolSection?.identificationModule?.briefTitle,
      status: s.protocolSection?.statusModule?.overallStatus,
      conditions: s.protocolSection?.conditionsModule?.conditions?.slice(0, 3),
      locations: (s.protocolSection?.contactsLocationsModule?.locations || []).slice(0, 2).map(l => `${l.city}, ${l.state || l.country}`)
    }));
    return { query, found: studies.length > 0, studies };
  } catch (e) {
    return { query, found: false, error: e.message };
  }
}

// NPI — Practitioner lookup
async function npiLookup(zip, taxonomy) {
  try {
    const base = process.env.NPI_BASE_URL || 'https://npiregistry.cms.hhs.gov/api';
    let url = `${base}/?version=2.1&postal_code=${encodeURIComponent(zip)}&limit=10`;
    if (taxonomy) url += `&taxonomy_description=${encodeURIComponent(taxonomy)}`;
    const data = await httpsGet(url);
    const providers = (data?.results || []).map(p => ({
      npi: p.number,
      name: `${p.basic?.first_name || ''} ${p.basic?.last_name || ''}`.trim(),
      credential: p.basic?.credential || '',
      specialty: p.taxonomies?.[0]?.desc || '',
      city: p.addresses?.[0]?.city || '',
      state: p.addresses?.[0]?.state || '',
      phone: p.addresses?.[0]?.telephone_number || ''
    }));
    return { zip, found: providers.length > 0, count: data?.result_count || 0, providers };
  } catch (e) {
    return { zip, found: false, error: e.message };
  }
}

// AirNow — Air quality by ZIP
async function airQualityLookup(zip) {
  try {
    const key = process.env.AIRNOW_API_KEY;
    if (!key) return { zip, found: false, error: 'AIRNOW_API_KEY not set' };
    const url = `https://www.airnowapi.org/aq/observation/zipCode/current/?format=application/json&zipCode=${zip}&API_KEY=${key}`;
    const data = await httpsGet(url);
    if (!Array.isArray(data) || data.length === 0) return { zip, found: false };
    return {
      zip,
      found: true,
      readings: data.map(r => ({
        parameter: r.ParameterName,
        aqi: r.AQI,
        category: r.Category?.Name,
        reporting_area: r.ReportingArea,
        state: r.StateCode
      }))
    };
  } catch (e) {
    return { zip, found: false, error: e.message };
  }
}

// CPIC — Gene-drug guidelines
async function cpicLookup(drug) {
  try {
    const base = process.env.CPIC_BASE_URL || 'https://api.cpicpgx.org/v1';
    const url = `${base}/drug?name=eq.${encodeURIComponent(drug)}&select=drugid,name,url`;
    const data = await httpsGet(url);
    if (!Array.isArray(data) || data.length === 0) return { drug, found: false };
    return { drug, found: true, guidelines: data };
  } catch (e) {
    return { drug, found: false, error: e.message };
  }
}

// DailyMed — Drug label search
async function dailymedLookup(drug) {
  try {
    const base = process.env.DAILYMED_BASE_URL || 'https://dailymed.nlm.nih.gov/dailymed/services';
    const url = `${base}/v2/spls.json?drug_name=${encodeURIComponent(drug)}&page_size=3`;
    const data = await httpsGet(url);
    if (!data?.data) return { drug, found: false };
    return {
      drug,
      found: true,
      labels: (data.data || []).map(d => ({
        setid: d.setid,
        title: d.title,
        published: d.published_date
      }))
    };
  } catch (e) {
    return { drug, found: false, error: e.message };
  }
}


// ============================================================
// 5-LAYER SAFETY CHECK ENGINE
// ============================================================
function runSafetyEngine(substances) {
  const normalized = substances.map(s => s.toLowerCase().replace(/\s+/g, '-'));
  const profiles = [];
  const unknown = [];

  // Resolve profiles
  for (const sub of normalized) {
    if (PHARMACOLOGY_DB[sub]) {
      profiles.push({ key: sub, ...PHARMACOLOGY_DB[sub] });
    } else {
      unknown.push(sub);
    }
  }

  const interactions = [];

  // LAYER 1: CYP450 Interactions
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const a = profiles[i];
      const b = profiles[j];

      // Check if A inhibits enzymes that B is substrate of
      const a_inhibits_b = (a.cyp_inhibits || []).filter(e => (b.cyp_substrates || []).includes(e));
      if (a_inhibits_b.length > 0) {
        interactions.push({
          layer: 'CYP450',
          pair: `${a.name} → ${b.name}`,
          mechanism: `${a.name} inhibits ${a_inhibits_b.join(', ')} — may INCREASE ${b.name} blood levels`,
          severity: Math.min(a.severity_base + b.severity_base + (a_inhibits_b.length * 0.1), 1.0),
          action: b.narrow_therapeutic_index
            ? 'CRITICAL: Narrow therapeutic index drug — dose adjustment likely needed. Consult prescriber.'
            : 'Monitor for increased side effects. Consider dose adjustment.'
        });
      }

      // Check if B inhibits enzymes that A is substrate of
      const b_inhibits_a = (b.cyp_inhibits || []).filter(e => (a.cyp_substrates || []).includes(e));
      if (b_inhibits_a.length > 0) {
        interactions.push({
          layer: 'CYP450',
          pair: `${b.name} → ${a.name}`,
          mechanism: `${b.name} inhibits ${b_inhibits_a.join(', ')} — may INCREASE ${a.name} blood levels`,
          severity: Math.min(b.severity_base + a.severity_base + (b_inhibits_a.length * 0.1), 1.0),
          action: a.narrow_therapeutic_index
            ? 'CRITICAL: Narrow therapeutic index drug — dose adjustment likely needed. Consult prescriber.'
            : 'Monitor for increased side effects. Consider dose adjustment.'
        });
      }

      // Check induction (e.g. St. John's Wort)
      const a_induces_b = (a.cyp_induces || []).filter(e => (b.cyp_substrates || []).includes(e));
      if (a_induces_b.length > 0) {
        interactions.push({
          layer: 'CYP450_INDUCTION',
          pair: `${a.name} → ${b.name}`,
          mechanism: `${a.name} induces ${a_induces_b.join(', ')} — may DECREASE ${b.name} effectiveness`,
          severity: Math.min(a.severity_base + b.severity_base + 0.2, 1.0),
          action: 'Medication may become less effective. Consult prescriber about dose adjustment.'
        });
      }

      const b_induces_a = (b.cyp_induces || []).filter(e => (a.cyp_substrates || []).includes(e));
      if (b_induces_a.length > 0) {
        interactions.push({
          layer: 'CYP450_INDUCTION',
          pair: `${b.name} → ${a.name}`,
          mechanism: `${b.name} induces ${b_induces_a.join(', ')} — may DECREASE ${a.name} effectiveness`,
          severity: Math.min(b.severity_base + a.severity_base + 0.2, 1.0),
          action: 'Medication may become less effective. Consult prescriber about dose adjustment.'
        });
      }
    }
  }

  // LAYER 2: UGT Interactions
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const a = profiles[i];
      const b = profiles[j];
      const shared_ugt = (a.ugt_inhibits || []).filter(e => (b.ugt_inhibits || []).includes(e));
      if (shared_ugt.length > 0) {
        interactions.push({
          layer: 'UGT',
          pair: `${a.name} + ${b.name}`,
          mechanism: `Both affect UGT enzymes (${shared_ugt.join(', ')}) — combined glucuronidation inhibition may increase toxicity`,
          severity: 0.5,
          action: 'Monitor liver function. Space doses if possible.'
        });
      }
    }
  }

  // LAYER 3: Transporter Interactions
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const a = profiles[i];
      const b = profiles[j];
      const a_pgp_inhib = (a.transporters || []).some(t => t.includes('P-gp inhibitor'));
      const b_pgp_sub = (b.transporters || []).some(t => t.includes('P-gp substrate'));
      if (a_pgp_inhib && b_pgp_sub) {
        interactions.push({
          layer: 'TRANSPORTER',
          pair: `${a.name} → ${b.name}`,
          mechanism: `${a.name} inhibits P-glycoprotein — may increase ${b.name} absorption and brain penetration`,
          severity: 0.5,
          action: 'May increase drug exposure. Monitor for enhanced effects.'
        });
      }
      const b_pgp_inhib = (b.transporters || []).some(t => t.includes('P-gp inhibitor'));
      const a_pgp_sub = (a.transporters || []).some(t => t.includes('P-gp substrate'));
      if (b_pgp_inhib && a_pgp_sub) {
        interactions.push({
          layer: 'TRANSPORTER',
          pair: `${b.name} → ${a.name}`,
          mechanism: `${b.name} inhibits P-glycoprotein — may increase ${a.name} absorption and brain penetration`,
          severity: 0.5,
          action: 'May increase drug exposure. Monitor for enhanced effects.'
        });
      }
    }
  }

  // LAYER 4: Pharmacodynamic Interactions
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const a = profiles[i];
      const b = profiles[j];
      for (const pdA of (a.pharmacodynamic || [])) {
        for (const pdB of (b.pharmacodynamic || [])) {
          const comboKey1 = `${pdA}+${pdB}`;
          const comboKey2 = `${pdB}+${pdA}`;
          const match = PD_RISK_MAP[comboKey1] || PD_RISK_MAP[comboKey2];
          if (match) {
            // Avoid duplicates
            const existing = interactions.find(ix =>
              ix.layer === 'PHARMACODYNAMIC' &&
              ix.pair === `${a.name} + ${b.name}` &&
              ix.mechanism === match.risk
            );
            if (!existing) {
              interactions.push({
                layer: 'PHARMACODYNAMIC',
                pair: `${a.name} + ${b.name}`,
                mechanism: match.risk,
                severity: match.severity,
                action: match.severity >= 0.8 ? 'Consult prescriber before combining.' : 'Use caution. Monitor symptoms.'
              });
            }
          }
        }
      }
    }
  }

  // LAYER 5: Narrow Therapeutic Index Flag
  const ntiDrugs = profiles.filter(p => p.narrow_therapeutic_index);
  const ntiWarnings = ntiDrugs.map(d => ({
    layer: 'NTI_WARNING',
    drug: d.name,
    message: `${d.name} has a narrow therapeutic index — small changes in blood levels can be dangerous. Any interacting substance requires extra caution.`,
    severity: 0.8
  }));

  // Overall severity
  const maxSeverity = interactions.length > 0
    ? Math.max(...interactions.map(i => i.severity))
    : 0;

  const riskLevel = maxSeverity >= 0.8 ? 'HIGH' : maxSeverity >= 0.5 ? 'MODERATE' : maxSeverity >= 0.2 ? 'LOW' : 'MINIMAL';

  return {
    substances_checked: substances,
    profiles_found: profiles.map(p => ({ key: p.key, name: p.name, category: p.category })),
    unknown_substances: unknown,
    interaction_count: interactions.length,
    risk_level: riskLevel,
    max_severity: Math.round(maxSeverity * 100) / 100,
    interactions: interactions.sort((a, b) => b.severity - a.severity),
    nti_warnings: ntiWarnings,
    disclaimer: 'This information is for educational purposes only. It is NOT medical advice. Always consult your healthcare provider before making changes to your medication or supplement regimen.'
  };
}


// ============================================================
// PARSE REQUEST BODY
// ============================================================
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}


// ============================================================
// CORS + JSON RESPONSE HELPERS
// ============================================================
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJSON(res, statusCode, data) {
  setCors(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
}


// ============================================================
// MAIN SERVER
// ============================================================
const server = http.createServer(async (req, res) => {
  setCors(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    // ---- HEALTH CHECK ----
    if (path === '/health' || path === '/') {
      return sendJSON(res, 200, {
        status: 'online',
        service: 'bleu-system',
        engine: 'Safety Check Engine v1.0',
        version: '1.0.0',
        endpoints: [
          'POST /api/safety-check',
          'POST /api/chat',
          'GET /api/rxnorm/:drug',
          'GET /api/fda/labels/:drug',
          'GET /api/fda/events/:drug',
          'GET /api/pubmed/:query',
          'GET /api/npi/:zip',
          'GET /api/air/:zip',
          'GET /api/cpic/:drug',
          'GET /api/dailymed/:drug',
          'GET /api/trials/:query'
        ],
        substances_in_db: Object.keys(PHARMACOLOGY_DB).length,
        timestamp: new Date().toISOString()
      });
    }

    // ---- SAFETY CHECK ENGINE (THE BEAST) ----
    if (path === '/api/safety-check' && req.method === 'POST') {
      const body = await parseBody(req);
      const substances = body.substances || [];
      const zip = body.zip || null;

      if (!substances.length) {
        return sendJSON(res, 400, { error: 'Provide "substances" array, e.g. ["cbd", "warfarin", "turmeric"]' });
      }

      // Run 5-layer engine
      const engineResult = runSafetyEngine(substances);

      // Fire external APIs in parallel
      const apiCalls = [];

      // RxNorm for each substance
      for (const sub of substances) {
        apiCalls.push(rxnormLookup(sub).then(r => ({ type: 'rxnorm', data: r })));
      }

      // FDA labels for pharmaceuticals
      for (const sub of substances) {
        const normalized = sub.toLowerCase().replace(/\s+/g, '-');
        const profile = PHARMACOLOGY_DB[normalized];
        if (profile && profile.category === 'pharmaceutical') {
          apiCalls.push(fdaLabelLookup(sub).then(r => ({ type: 'fda_label', data: r })));
          apiCalls.push(fdaAdverseEvents(sub).then(r => ({ type: 'fda_events', data: r })));
        }
      }

      // PubMed for interaction combos
      if (substances.length >= 2) {
        const query = substances.slice(0, 3).join(' AND ') + ' interaction';
        apiCalls.push(pubmedSearch(query).then(r => ({ type: 'pubmed', data: r })));
      }

      // ClinicalTrials for combo
      if (substances.length >= 2) {
        const query = substances.slice(0, 2).join(' ');
        apiCalls.push(clinicalTrialsSearch(query).then(r => ({ type: 'clinical_trials', data: r })));
      }

      // CPIC for pharmaceuticals
      for (const sub of substances) {
        const normalized = sub.toLowerCase().replace(/\s+/g, '-');
        const profile = PHARMACOLOGY_DB[normalized];
        if (profile && profile.category === 'pharmaceutical') {
          apiCalls.push(cpicLookup(sub).then(r => ({ type: 'cpic', data: r })));
        }
      }

      // Air quality if ZIP provided
      if (zip) {
        apiCalls.push(airQualityLookup(zip).then(r => ({ type: 'air_quality', data: r })));
        apiCalls.push(npiLookup(zip).then(r => ({ type: 'practitioners', data: r })));
      }

      // Wait for all APIs
      const apiResults = await Promise.allSettled(apiCalls);
      const externalData = {};
      for (const result of apiResults) {
        if (result.status === 'fulfilled' && result.value) {
          const { type, data } = result.value;
          if (!externalData[type]) externalData[type] = [];
          externalData[type].push(data);
        }
      }

      return sendJSON(res, 200, {
        engine: engineResult,
        external_data: externalData,
        apis_called: apiCalls.length,
        timestamp: new Date().toISOString()
      });
    }

    // ---- ALVAI CHAT (Claude-powered) ----
    if (path === '/api/chat' && req.method === 'POST') {
      const body = await parseBody(req);
      const userMessage = body.message || body.content || '';
      const apiKey = process.env.CLAUDE_API_KEY;

      if (!apiKey) {
        return sendJSON(res, 500, { error: 'CLAUDE_API_KEY not configured' });
      }

      const claudeResponse = await httpsPost('https://api.anthropic.com/v1/messages', {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: 'You are Alvai, the AI wellness assistant for bleu.live — the Google of Wellness. You help users understand drug interactions, find practitioners, check environmental health, and navigate their wellness journey. You are warm, knowledgeable, and always remind users to consult their healthcare provider. You were created by Bleu and Dr. Felicia.',
        messages: [{ role: 'user', content: userMessage }]
      }, {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      });

      return sendJSON(res, 200, {
        response: claudeResponse?.content?.[0]?.text || 'Alvai is thinking...',
        model: 'alvai-v1'
      });
    }

    // ---- INDIVIDUAL API ENDPOINTS ----

    // RxNorm lookup
    const rxMatch = path.match(/^\/api\/rxnorm\/(.+)$/);
    if (rxMatch && req.method === 'GET') {
      const result = await rxnormLookup(decodeURIComponent(rxMatch[1]));
      return sendJSON(res, 200, result);
    }

    // FDA Labels
    const fdaLabelMatch = path.match(/^\/api\/fda\/labels\/(.+)$/);
    if (fdaLabelMatch && req.method === 'GET') {
      const result = await fdaLabelLookup(decodeURIComponent(fdaLabelMatch[1]));
      return sendJSON(res, 200, result);
    }

    // FDA Adverse Events
    const fdaEventsMatch = path.match(/^\/api\/fda\/events\/(.+)$/);
    if (fdaEventsMatch && req.method === 'GET') {
      const result = await fdaAdverseEvents(decodeURIComponent(fdaEventsMatch[1]));
      return sendJSON(res, 200, result);
    }

    // PubMed search
    const pubmedMatch = path.match(/^\/api\/pubmed\/(.+)$/);
    if (pubmedMatch && req.method === 'GET') {
      const result = await pubmedSearch(decodeURIComponent(pubmedMatch[1]));
      return sendJSON(res, 200, result);
    }

    // Clinical Trials
    const trialsMatch = path.match(/^\/api\/trials\/(.+)$/);
    if (trialsMatch && req.method === 'GET') {
      const result = await clinicalTrialsSearch(decodeURIComponent(trialsMatch[1]));
      return sendJSON(res, 200, result);
    }

    // NPI Practitioner lookup
    const npiMatch = path.match(/^\/api\/npi\/(.+)$/);
    if (npiMatch && req.method === 'GET') {
      const zip = decodeURIComponent(npiMatch[1]);
      const taxonomy = url.searchParams.get('specialty') || null;
      const result = await npiLookup(zip, taxonomy);
      return sendJSON(res, 200, result);
    }

    // Air Quality
    const airMatch = path.match(/^\/api\/air\/(.+)$/);
    if (airMatch && req.method === 'GET') {
      const result = await airQualityLookup(decodeURIComponent(airMatch[1]));
      return sendJSON(res, 200, result);
    }

    // CPIC Gene-Drug
    const cpicMatch = path.match(/^\/api\/cpic\/(.+)$/);
    if (cpicMatch && req.method === 'GET') {
      const result = await cpicLookup(decodeURIComponent(cpicMatch[1]));
      return sendJSON(res, 200, result);
    }

    // DailyMed
    const dailymedMatch = path.match(/^\/api\/dailymed\/(.+)$/);
    if (dailymedMatch && req.method === 'GET') {
      const result = await dailymedLookup(decodeURIComponent(dailymedMatch[1]));
      return sendJSON(res, 200, result);
    }

    // ---- 404 ----
    sendJSON(res, 404, { error: 'Not found', available_endpoints: ['GET /health', 'POST /api/safety-check', 'POST /api/chat', 'GET /api/rxnorm/:drug', 'GET /api/fda/labels/:drug', 'GET /api/fda/events/:drug', 'GET /api/pubmed/:query', 'GET /api/trials/:query', 'GET /api/npi/:zip', 'GET /api/air/:zip', 'GET /api/cpic/:drug', 'GET /api/dailymed/:drug'] });

  } catch (err) {
    console.error('Server error:', err);
    sendJSON(res, 500, { error: 'Internal server error', message: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║         🔵 BLEU.LIVE — Safety Check Engine        ║
║               v1.0 — THE BEAST                    ║
╠═══════════════════════════════════════════════════╣
║  Port: ${PORT}                                      ║
║  Substances: ${Object.keys(PHARMACOLOGY_DB).length} in pharmacology DB              ║
║  Layers: CYP450 + UGT + Transporters + PD + NTI  ║
║  APIs: RxNorm, OpenFDA, PubMed, CPIC, DailyMed,  ║
║        ClinicalTrials, NPI, AirNow                ║
╠═══════════════════════════════════════════════════╣
║  POST /api/safety-check  ← THE BEAST             ║
║  POST /api/chat          ← Alvai                  ║
║  GET  /api/rxnorm/:drug                           ║
║  GET  /api/fda/labels/:drug                       ║
║  GET  /api/fda/events/:drug                       ║
║  GET  /api/pubmed/:query                          ║
║  GET  /api/trials/:query                          ║
║  GET  /api/npi/:zip                               ║
║  GET  /api/air/:zip                               ║
║  GET  /api/cpic/:drug                             ║
║  GET  /api/dailymed/:drug                         ║
╚═══════════════════════════════════════════════════╝
  `);
});
