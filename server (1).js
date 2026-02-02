/**
 * BLEU.LIVE — ALVAI API SERVER
 * ══════════════════════════════════════════════
 * Part 3 of the 3-part system.
 * 
 * This server:
 * 1. Powers the Alvai chat widget on every BLEU page
 * 2. Queries Supabase for trust-scored data
 * 3. Sends context + user question to Claude API
 * 4. Returns intelligent, data-backed answers
 * 5. Tracks affiliate clicks for revenue
 * 
 * Deploy: Railway ($5/mo) — runs 24/7
 * 
 * Endpoints:
 *   POST /api/chat        — Alvai chat (main)
 *   GET  /api/search      — Quick search (practitioners/products/locations)
 *   GET  /api/stats       — Public stats for homepage
 *   GET  /go/:id          — Affiliate redirect (tracks clicks)
 *   GET  /health          — Health check
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const AMAZON_TAG = process.env.AMAZON_PARTNER_TAG || 'bleu-live-20';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://bleu.live,http://localhost:3000').split(',');

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function supabaseHeaders() {
  return {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };
}

function corsHeaders(req) {
  const origin = req.headers.origin || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

function fetchJSON(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    
    const req = lib.request(parsed, {
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    req.end();
  });
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

// ═══════════════════════════════════════════════════════════
// SUPABASE QUERIES
// ═══════════════════════════════════════════════════════════

async function searchPractitioners(query, city, state, limit = 10) {
  let url = `${SUPABASE_URL}/rest/v1/practitioners?select=*&limit=${limit}&order=trust_score.desc`;
  
  if (city) url += `&city=ilike.%25${encodeURIComponent(city)}%25`;
  if (state) url += `&state=eq.${encodeURIComponent(state)}`;
  if (query) url += `&or=(full_name.ilike.%25${encodeURIComponent(query)}%25,specialty.ilike.%25${encodeURIComponent(query)}%25,taxonomy_description.ilike.%25${encodeURIComponent(query)}%25)`;
  
  const resp = await fetchJSON(url, { headers: supabaseHeaders() });
  return resp.data || [];
}

async function searchProducts(query, category, limit = 10) {
  let url = `${SUPABASE_URL}/rest/v1/products?select=*&limit=${limit}&order=trust_score.desc`;
  
  if (category) url += `&category=ilike.%25${encodeURIComponent(category)}%25`;
  if (query) url += `&or=(name.ilike.%25${encodeURIComponent(query)}%25,brand.ilike.%25${encodeURIComponent(query)}%25,ingredients.ilike.%25${encodeURIComponent(query)}%25)`;
  
  const resp = await fetchJSON(url, { headers: supabaseHeaders() });
  return resp.data || [];
}

async function searchLocations(query, city, state, limit = 10) {
  let url = `${SUPABASE_URL}/rest/v1/locations?select=*&limit=${limit}&order=trust_score.desc`;
  
  if (city) url += `&city=ilike.%25${encodeURIComponent(city)}%25`;
  if (state) url += `&state=eq.${encodeURIComponent(state)}`;
  if (query) url += `&or=(name.ilike.%25${encodeURIComponent(query)}%25,type.ilike.%25${encodeURIComponent(query)}%25)`;
  
  const resp = await fetchJSON(url, { headers: supabaseHeaders() });
  return resp.data || [];
}

async function getStats() {
  const tables = ['practitioners', 'products', 'locations', 'cities', 'reviews'];
  const counts = {};
  
  for (const table of tables) {
    try {
      const resp = await fetchJSON(
        `${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`,
        { 
          headers: { 
            ...supabaseHeaders(), 
            'Prefer': 'count=exact',
            'Range': '0-0',
          }
        }
      );
      const range = resp.headers?.['content-range'] || '*/0';
      counts[table] = parseInt(range.split('/').pop()) || 0;
    } catch {
      counts[table] = 0;
    }
  }
  
  return counts;
}

// ═══════════════════════════════════════════════════════════
// ALVAI CHAT — The Intelligence Engine
// ═══════════════════════════════════════════════════════════

async function alvaiChat(userMessage, context = {}) {
  if (!CLAUDE_API_KEY) {
    return { 
      response: "Alvai is being configured. Please check back soon.",
      sources: [] 
    };
  }
  
  // Step 1: Understand intent and extract search parameters
  const lowerMsg = userMessage.toLowerCase();
  
  let practitioners = [];
  let products = [];
  let locations = [];
  
  // Smart context extraction
  const cityMatch = lowerMsg.match(/in\s+([a-zA-Z\s]+?)(?:,?\s*([A-Z]{2}))?\s*$/);
  const city = context.city || (cityMatch ? cityMatch[1].trim() : null);
  const state = context.state || (cityMatch ? cityMatch[2] : null);
  
  // Determine what to search based on the question
  const wantsPractitioner = /doctor|therapist|practitioner|specialist|find|who|recommend|best|top|acupunctur|chiropract|naturopath|nutritionist|psych|counselor/i.test(lowerMsg);
  const wantsProduct = /supplement|vitamin|magnesium|ashwagandha|product|buy|take|dosage|medication|herb|cbd|protein|omega|probiotic|collagen/i.test(lowerMsg);
  const wantsLocation = /studio|gym|spa|market|store|clinic|center|class|yoga|meditation|float|cryo|sauna/i.test(lowerMsg);
  
  // Query Supabase for relevant data
  const searchTerm = userMessage.replace(/in\s+[a-zA-Z\s,]+$/i, '').trim();
  
  if (wantsPractitioner) {
    practitioners = await searchPractitioners(searchTerm, city, state, 5);
  }
  if (wantsProduct) {
    products = await searchProducts(searchTerm, null, 5);
  }
  if (wantsLocation) {
    locations = await searchLocations(searchTerm, city, state, 5);
  }
  
  // If nothing specific detected, search everything
  if (!wantsPractitioner && !wantsProduct && !wantsLocation) {
    practitioners = await searchPractitioners(searchTerm, city, state, 3);
    products = await searchProducts(searchTerm, null, 3);
    locations = await searchLocations(searchTerm, city, state, 3);
  }
  
  // Step 2: Build context for Claude
  let dataContext = '';
  
  if (practitioners.length > 0) {
    dataContext += '\n\nVERIFIED PRACTITIONERS IN BLEU DATABASE:\n';
    practitioners.forEach((p, i) => {
      dataContext += `${i+1}. ${p.full_name}${p.credential ? ', ' + p.credential : ''} — ${p.specialty || 'General'} in ${p.city}, ${p.state}. Trust Score: ${(p.trust_score || 0).toFixed(1)}. ${p.credentials_verified ? 'Credentials verified ✓' : ''} ${p.phone ? 'Phone: ' + p.phone : ''} NPI: ${p.npi || 'N/A'}\n`;
    });
  }
  
  if (products.length > 0) {
    dataContext += '\n\nVERIFIED PRODUCTS IN BLEU DATABASE:\n';
    products.forEach((p, i) => {
      dataContext += `${i+1}. ${p.name}${p.brand ? ' by ' + p.brand : ''} — Trust Score: ${(p.trust_score || 0).toFixed(1)}. ${p.lab_tested ? 'Lab tested ✓' : ''} ${p.price ? '$' + p.price : ''} Category: ${p.category || 'general'}\n`;
    });
  }
  
  if (locations.length > 0) {
    dataContext += '\n\nVERIFIED LOCATIONS IN BLEU DATABASE:\n';
    locations.forEach((l, i) => {
      dataContext += `${i+1}. ${l.name} — ${l.type || 'Wellness'} in ${l.city}, ${l.state}. ${l.avg_rating ? 'Rating: ' + l.avg_rating + '/5' : ''} ${l.review_count ? '(' + l.review_count + ' reviews)' : ''} Trust Score: ${(l.trust_score || 0).toFixed(1)}\n`;
    });
  }
  
  // Step 3: Call Claude API with full context
  const systemPrompt = `You are Alvai, the wellness intelligence assistant for BLEU.LIVE — the world's most trusted wellness platform.

YOUR IDENTITY:
- Name: Alvai ("The Light That Learns")
- Purpose: Help people find validated wellness practitioners, products, and places
- Personality: Warm, knowledgeable, trustworthy. Like a wise friend who happens to know everything about health.
- You NEVER diagnose conditions or prescribe treatments
- You ALWAYS recommend people see a qualified practitioner for medical concerns
- You highlight BLEU Trust Scores to help users make informed decisions
- You mention when something is "BLEU Verified" vs "unverified"

THE 12 SHIELDS OF TRUST:
BLEU validates everything through 12 shields: Real Outcomes, Verified Credentials, Lab Tested, Honest Reviews, Always Watching, Safety Record, Fair Pricing, Equal Access, Evidence-Based, Data Protected, No Pay-to-Play, Aligned Interests.

FORMATTING:
- Be warm and conversational, not clinical
- Use line breaks for readability
- When listing practitioners or products, include their Trust Score
- Always offer to help further
- Keep responses focused and helpful
- When recommending products, mention they can be purchased through BLEU's verified links

THE BLEU STORY:
BLEU was founded on 127 years of healing lineage — from Jesse, a Fire Keeper who walked from Onondaga Nation territory in 1898, to Tim who healed freely for 47 years, to Bleu Michael Garner who overcame extraordinary adversity to build this platform. The 12 Shields come from indigenous healing principles: the village verified its healers through results, not payment.

${dataContext ? 'HERE IS VERIFIED DATA FROM THE BLEU DATABASE TO USE IN YOUR RESPONSE:' + dataContext : 'No specific matches found in the BLEU database for this query. Use your general knowledge but note that results are not yet BLEU-verified.'}`;

  try {
    const response = await fetchJSON('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
    
    if (response.status === 200 && response.data.content) {
      const text = response.data.content.map(c => c.text || '').join('');
      
      return {
        response: text,
        sources: {
          practitioners: practitioners.map(p => ({
            name: p.full_name,
            specialty: p.specialty,
            city: p.city,
            state: p.state,
            trust_score: p.trust_score,
            url: `/find/${slugify(p.full_name + '-' + p.city + '-' + p.state, { lower: true, strict: true })}`,
          })),
          products: products.map(p => ({
            name: p.name,
            brand: p.brand,
            trust_score: p.trust_score,
            url: `/products/${slugify(p.name || '', { lower: true, strict: true })}`,
            buy_url: `https://www.amazon.com/s?k=${encodeURIComponent(p.name)}&tag=${AMAZON_TAG}`,
          })),
          locations: locations.map(l => ({
            name: l.name,
            type: l.type,
            city: l.city,
            rating: l.avg_rating,
            url: `/places/${slugify(l.name + '-' + l.city + '-' + l.state, { lower: true, strict: true })}`,
          })),
        },
      };
    } else {
      console.error('Claude API error:', response.status, JSON.stringify(response.data).substring(0, 200));
      return { response: "I'm having a moment — please try again shortly.", sources: {} };
    }
  } catch (err) {
    console.error('Alvai error:', err.message);
    return { response: "I'm having trouble connecting right now. Please try again.", sources: {} };
  }
}

function slugify(text, opts = {}) {
  return (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ═══════════════════════════════════════════════════════════
// AFFILIATE TRACKING
// ═══════════════════════════════════════════════════════════

const clickLog = [];

function trackClick(productId, destination) {
  clickLog.push({
    product_id: productId,
    destination,
    timestamp: new Date().toISOString(),
  });
  
  // Batch save to Supabase every 100 clicks
  if (clickLog.length >= 100) {
    flushClicks();
  }
}

async function flushClicks() {
  if (clickLog.length === 0) return;
  
  const batch = clickLog.splice(0, clickLog.length);
  try {
    await fetchJSON(`${SUPABASE_URL}/rest/v1/affiliate_clicks`, {
      method: 'POST',
      headers: supabaseHeaders(),
      body: JSON.stringify(batch),
    });
  } catch (e) {
    console.error('Failed to log clicks:', e.message);
  }
}

// ═══════════════════════════════════════════════════════════
// HTTP SERVER
// ═══════════════════════════════════════════════════════════

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const headers = corsHeaders(req);
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    return res.end();
  }
  
  try {
    // ─── HEALTH CHECK ───
    if (pathname === '/health') {
      res.writeHead(200, headers);
      return res.end(JSON.stringify({ status: 'ok', service: 'alvai-api', timestamp: new Date().toISOString() }));
    }
    
    // ─── ALVAI CHAT ───
    if (pathname === '/api/chat' && req.method === 'POST') {
      const body = await readBody(req);
      const { message, city, state } = body;
      
      if (!message) {
        res.writeHead(400, headers);
        return res.end(JSON.stringify({ error: 'message required' }));
      }
      
      const result = await alvaiChat(message, { city, state });
      res.writeHead(200, headers);
      return res.end(JSON.stringify(result));
    }
    
    // ─── SEARCH ───
    if (pathname === '/api/search' && req.method === 'GET') {
      const q = url.searchParams.get('q') || '';
      const type = url.searchParams.get('type') || 'all';
      const city = url.searchParams.get('city');
      const state = url.searchParams.get('state');
      
      let results = {};
      
      if (type === 'all' || type === 'practitioners') {
        results.practitioners = await searchPractitioners(q, city, state, 10);
      }
      if (type === 'all' || type === 'products') {
        results.products = await searchProducts(q, null, 10);
      }
      if (type === 'all' || type === 'locations') {
        results.locations = await searchLocations(q, city, state, 10);
      }
      
      res.writeHead(200, headers);
      return res.end(JSON.stringify(results));
    }
    
    // ─── PUBLIC STATS ───
    if (pathname === '/api/stats' && req.method === 'GET') {
      const counts = await getStats();
      res.writeHead(200, headers);
      return res.end(JSON.stringify(counts));
    }
    
    // ─── AFFILIATE REDIRECT ───
    if (pathname.startsWith('/go/')) {
      const productSlug = pathname.replace('/go/', '');
      const dest = url.searchParams.get('to') || `https://www.amazon.com/s?k=${encodeURIComponent(productSlug)}&tag=${AMAZON_TAG}`;
      
      trackClick(productSlug, dest);
      
      res.writeHead(302, { ...headers, 'Location': dest });
      return res.end();
    }
    
    // ─── 404 ───
    res.writeHead(404, headers);
    res.end(JSON.stringify({ error: 'not found' }));
    
  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(500, headers);
    res.end(JSON.stringify({ error: 'internal error' }));
  }
});

// Flush clicks on interval
setInterval(flushClicks, 60000);

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🌿  ALVAI API SERVER                                        ║
║       Running on port ${PORT}                                    ║
║                                                               ║
║   Endpoints:                                                  ║
║     POST /api/chat     — Chat with Alvai                     ║
║     GET  /api/search   — Search database                     ║
║     GET  /api/stats    — Public statistics                   ║
║     GET  /go/:slug     — Affiliate redirect                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
