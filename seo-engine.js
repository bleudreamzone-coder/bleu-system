// ═══════════════════════════════════════════════════════════════════════════════
//  BLEU.LIVE SEO ENGINE v1.0 — Content Generation & Page Serving
//  Generates Google-indexable pages from pipeline data
//  City hubs · City+Specialty listings · Practitioner profiles · Safety pages
//  Sitemap · robots.txt · Schema.org · Open Graph · Internal linking
//  Plugs into server.js: const seo = require('./seo-engine')(deps);
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = function({ sb, ENV, fetchJSON, log }) {

  const DOMAIN = 'https://bleu.live';
  const BRAND = 'BLEU.LIVE';

  // ═══════════════════════════════════════════════════════════════
  // SLUG HELPERS
  // ═══════════════════════════════════════════════════════════════
  function slugify(str) { return (str || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function titleCase(str) { return (str || '').split(/[\s-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '); }
  function specialtySlug(s) { return slugify(s); }
  function citySlug(name) { return slugify(name); }

  // ═══════════════════════════════════════════════════════════════
  // CITY + SPECIALTY METADATA
  // ═══════════════════════════════════════════════════════════════
  const CITY_META = {
    'new-orleans': { lat: 29.95, lng: -90.07, soul: 'Jazz, gumbo, second lines — a city that heals through rhythm and community.', pop: '383K' },
    'austin': { lat: 30.27, lng: -97.74, soul: 'Live music, outdoor culture, tech-meets-wellness in the heart of Texas.', pop: '979K' },
    'denver': { lat: 39.74, lng: -104.99, soul: 'Mile-high altitude, cannabis-forward, outdoor lifestyle drives wellness innovation.', pop: '713K' },
    'portland': { lat: 45.52, lng: -122.68, soul: 'Pacific Northwest consciousness — plant medicine, naturopathy, radical self-care.', pop: '641K' },
    'nashville': { lat: 36.16, lng: -86.78, soul: 'Music City heals through songwriting, faith communities, and Southern resilience.', pop: '689K' },
    'seattle': { lat: 47.61, lng: -122.33, soul: 'Tech wealth meets wellness innovation. Coffee culture, rain-driven introspection.', pop: '749K' },
    'miami': { lat: 25.76, lng: -80.19, soul: 'Latin energy, ocean air, a crossroads where Caribbean wellness meets American healthcare.', pop: '442K' },
    'san-francisco': { lat: 37.77, lng: -122.42, soul: 'Psychedelic research, biohacking, meditation — the frontier of consciousness.', pop: '874K' },
    'los-angeles': { lat: 34.05, lng: -118.24, soul: 'Hollywood meets holistic. Juice bars, breathwork, sound baths on every corner.', pop: '3.9M' },
    'chicago': { lat: 41.88, lng: -87.63, soul: 'Deep roots, neighborhood pride, world-class healthcare meets community healing.', pop: '2.7M' },
    'new-york': { lat: 40.71, lng: -74.01, soul: 'Eight million stories. The most diverse wellness landscape on earth.', pop: '8.3M' },
    'phoenix': { lat: 33.45, lng: -112.07, soul: 'Desert heat, Native wisdom, a growing wellness scene under endless sun.', pop: '1.6M' },
    'philadelphia': { lat: 39.95, lng: -75.17, soul: 'Brotherly love, gritty resilience, historic healthcare institutions.', pop: '1.6M' },
    'san-antonio': { lat: 29.42, lng: -98.49, soul: 'Tex-Mex soul, military community, family-centered wellness traditions.', pop: '1.4M' },
    'san-diego': { lat: 32.72, lng: -117.16, soul: 'Beach culture, military wellness, cross-border healing traditions.', pop: '1.4M' },
    'dallas': { lat: 32.78, lng: -96.80, soul: 'Big ambition, big faith, corporate wellness meets community care.', pop: '1.3M' },
    'atlanta': { lat: 33.75, lng: -84.39, soul: 'Black excellence, civil rights legacy, church-rooted community health.', pop: '499K' },
    'minneapolis': { lat: 44.98, lng: -93.27, soul: 'Nordic discipline meets progressive wellness policy. Lake culture, cold therapy.', pop: '429K' },
    'charlotte': { lat: 35.23, lng: -80.84, soul: 'Banking capital with Southern warmth. Growing wellness infrastructure.', pop: '879K' },
    'tampa': { lat: 27.95, lng: -82.46, soul: 'Gulf coast healing. Retirement wellness meets young family energy.', pop: '384K' },
  };

  const CONDITIONS = [
    'anxiety', 'depression', 'insomnia', 'chronic-pain', 'ptsd', 'adhd',
    'addiction-recovery', 'eating-disorders', 'grief', 'stress',
    'back-pain', 'migraine', 'digestive-issues', 'weight-management',
    'prenatal-care', 'postpartum', 'couples-therapy', 'trauma',
  ];

  // ═══════════════════════════════════════════════════════════════
  // HTML TEMPLATE — Beautiful, fast, SEO-perfect
  // ═══════════════════════════════════════════════════════════════
  function baseHTML({ title, description, canonical, schema, body, breadcrumbs }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | ${BRAND}</title>
<meta name="description" content="${(description || '').replace(/"/g, '&quot;')}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${(description || '').replace(/"/g, '&quot;')}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${BRAND}">
<meta name="twitter:card" content="summary">
<meta name="robots" content="index, follow">
${schema ? `<script type="application/ld+json">${JSON.stringify(schema)}</script>` : ''}
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Georgia','Times New Roman',serif;background:#F8F7F4;color:#1B1B18;line-height:1.7}
a{color:#4A6FA5;text-decoration:none}a:hover{text-decoration:underline}
.w{max-width:1080px;margin:0 auto;padding:0 24px}
.nav{padding:16px 0;border-bottom:1px solid rgba(0,0,0,.06);margin-bottom:40px}
.nav-in{display:flex;align-items:center;justify-content:space-between}
.logo{font-family:system-ui,sans-serif;font-weight:700;font-size:16px;letter-spacing:.06em;color:#1B1B18}
.logo span{font-family:monospace;font-size:11px;color:#B0B0A8}
.nav-links{display:flex;gap:20px;font-family:system-ui,sans-serif;font-size:13px}
.nav-links a{color:#777770}
.bc{font-family:system-ui,sans-serif;font-size:12px;color:#B0B0A8;margin-bottom:24px}
.bc a{color:#777770}
h1{font-size:clamp(32px,4.5vw,52px);font-weight:300;line-height:1.12;letter-spacing:-.02em;margin-bottom:16px}
h2{font-size:clamp(22px,3vw,32px);font-weight:300;line-height:1.2;letter-spacing:-.01em;margin:40px 0 16px}
h3{font-size:20px;font-weight:400;margin-bottom:8px}
.sub{font-family:system-ui,sans-serif;font-size:17px;color:#777770;max-width:600px;line-height:1.7;margin-bottom:32px}
.tag{display:inline-block;font-family:monospace;font-size:10px;padding:3px 10px;border-radius:100px;border:1px solid #E8E8E2;color:#777770;margin:0 4px 6px 0}
.tag-g{border-color:#059669;color:#059669}
.tag-b{border-color:#4A6FA5;color:#4A6FA5}
.card{background:#fff;border:1px solid rgba(0,0,0,.05);border-radius:16px;padding:24px;margin-bottom:12px;transition:box-shadow .3s}
.card:hover{box-shadow:0 8px 32px rgba(0,0,0,.04)}
.card h3 a{color:#1B1B18}
.card-meta{font-family:system-ui,sans-serif;font-size:13px;color:#B0B0A8;margin-top:4px}
.card-spec{font-family:system-ui,sans-serif;font-size:12px;color:#4A6FA5;margin-top:6px}
.card-addr{font-family:system-ui,sans-serif;font-size:13px;color:#777770;margin-top:8px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.stats{display:flex;gap:24px;margin:24px 0;flex-wrap:wrap}
.stat{text-align:center;padding:16px 24px;background:#fff;border-radius:12px;border:1px solid rgba(0,0,0,.04)}
.stat-n{font-family:monospace;font-size:28px;font-weight:500}
.stat-l{font-family:system-ui,sans-serif;font-size:11px;color:#B0B0A8;text-transform:uppercase;letter-spacing:.06em;margin-top:2px}
.cta{display:inline-block;font-family:system-ui,sans-serif;font-weight:600;font-size:15px;background:#1B1B18;color:#fff;padding:14px 36px;border-radius:100px;margin:20px 0;transition:transform .2s}
.cta:hover{transform:translateY(-2px);text-decoration:none}
.sidebar{font-family:system-ui,sans-serif;font-size:14px}
.sidebar h4{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#B0B0A8;margin-bottom:12px}
.sidebar a{display:block;padding:6px 0;color:#777770;border-bottom:1px solid rgba(0,0,0,.03)}
.sidebar a:hover{color:#1B1B18}
.safety-banner{background:linear-gradient(135deg,#4A6FA520,#10B98110);border-radius:16px;padding:28px;margin:32px 0}
.safety-banner h3{font-size:18px;margin-bottom:8px}
.safety-banner p{font-family:system-ui,sans-serif;font-size:14px;color:#777770}
.footer{margin-top:60px;padding:32px 0;border-top:1px solid rgba(0,0,0,.04);font-family:system-ui,sans-serif;font-size:12px;color:#B0B0A8}
.two-col{display:grid;grid-template-columns:1fr 280px;gap:48px}
@media(max-width:768px){.two-col{grid-template-columns:1fr}.stats{flex-direction:column}.grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="w">
<nav class="nav"><div class="nav-in">
<a href="/" class="logo">BLEU <span>.LIVE</span></a>
<div class="nav-links">
<a href="/safety-check">Safety Check</a>
<a href="/find">Find a Practitioner</a>
<a href="/cities">Cities</a>
</div>
</div></nav>
${breadcrumbs ? `<div class="bc">${breadcrumbs}</div>` : ''}
${body}
<footer class="footer">
<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:16px">
<div>© 2025 ${BRAND} — The Operating System for Human Longevity<br>Every practitioner verified against the federal NPI Registry. Safety intelligence is educational.</div>
<div><a href="/sitemap.xml">Sitemap</a> · <a href="/safety-check">Safety Engine</a> · <a href="/cities">All Cities</a></div>
</div>
</footer>
</div>
</body>
</html>`;
  }

  // ═══════════════════════════════════════════════════════════════
  // CONTENT GENERATION — Claude Haiku writes unique copy
  // ═══════════════════════════════════════════════════════════════
  async function generateContent(prompt) {
    if (!ENV.claude) return null;
    try {
      const d = await fetchJSON('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': ENV.claude, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20241022', max_tokens: 600,
          system: 'You write concise, warm, SEO-optimized wellness content for BLEU.LIVE. No fluff. No generic filler. Every sentence adds value. Write in second person. Include the city name and specialty naturally. 2-3 short paragraphs max. No markdown formatting — plain text only.',
          messages: [{ role: 'user', content: prompt }]
        })
      });
      return d?.content?.[0]?.text || null;
    } catch (e) { log('SEO', `Haiku error: ${e.message}`); return null; }
  }

  // ═══════════════════════════════════════════════════════════════
  // PAGE GENERATORS
  // ═══════════════════════════════════════════════════════════════

  // ── CITY HUB PAGE ──
  async function generateCityPage(cityName, state) {
    const slug = citySlug(cityName);
    const meta = CITY_META[slug] || {};

    // Get practitioner counts by specialty
    const practitioners = await sb.query('practitioners',
      `select=specialty&city=ilike.${encodeURIComponent(cityName)}&state=eq.${state}`
    );
    const specCounts = {};
    if (Array.isArray(practitioners)) {
      for (const p of practitioners) {
        specCounts[p.specialty] = (specCounts[p.specialty] || 0) + 1;
      }
    }
    const totalPract = Array.isArray(practitioners) ? practitioners.length : 0;

    // Generate unique content
    const aiContent = await generateContent(
      `Write 2-3 paragraphs about wellness and finding verified health practitioners in ${cityName}, ${state}. Mention what makes ${cityName}'s wellness scene unique. The city's soul: "${meta.soul || ''}". Population: ${meta.pop || 'unknown'}. There are ${totalPract} verified practitioners across ${Object.keys(specCounts).length} specialties. Reference BLEU.LIVE's 10-dimension health model and the longevity wellspring cities.`
    );

    const specialtyLinks = Object.entries(specCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([spec, count]) => ({ name: spec, slug: specialtySlug(spec), count }));

    const description = `Find ${totalPract}+ verified wellness practitioners in ${cityName}, ${state}. Psychologists, therapists, acupuncturists, nutritionists — all verified against the federal NPI Registry.`;

    const body = `
<h1>Wellness in ${cityName}</h1>
<p class="sub">${meta.soul || `Find verified wellness practitioners in ${cityName}.`}</p>
<div class="stats">
<div class="stat"><div class="stat-n">${totalPract}</div><div class="stat-l">Verified Practitioners</div></div>
<div class="stat"><div class="stat-n">${Object.keys(specCounts).length}</div><div class="stat-l">Specialties</div></div>
<div class="stat"><div class="stat-n">5</div><div class="stat-l">Safety Layers</div></div>
<div class="stat"><div class="stat-n">10</div><div class="stat-l">Health Dimensions</div></div>
</div>

${aiContent ? `<div style="margin:32px 0;font-size:17px;line-height:1.8;color:#555">${aiContent.split('\n').filter(Boolean).map(p => `<p style="margin-bottom:16px">${p}</p>`).join('')}</div>` : ''}

<div class="safety-banner">
<h3>💊 Check Supplement & Medication Safety</h3>
<p>Taking CBD with an SSRI? Mixing kratom with your prescriptions? Run it through 5 layers of pharmacology before you combine anything.</p>
<a href="/safety-check" class="cta" style="margin-top:16px;display:inline-block">Run a Safety Check →</a>
</div>

<h2>Find a Practitioner in ${cityName}</h2>
<div class="grid">
${specialtyLinks.map(s => `
<a href="/${slug}/${s.slug}" class="card" style="text-decoration:none">
<h3 style="color:#1B1B18">${s.name}</h3>
<div class="card-meta">${s.count} verified in ${cityName}</div>
<span class="tag tag-g">NPI Verified</span>
</a>`).join('')}
</div>

<h2>Explore Other Cities</h2>
<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">
${Object.entries(CITY_META).filter(([s]) => s !== slug).slice(0, 12).map(([s]) => `<a href="/${s}" class="tag">${titleCase(s)}</a>`).join('')}
</div>`;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'MedicalWebPage',
      name: `Wellness Practitioners in ${cityName}, ${state}`,
      description,
      url: `${DOMAIN}/${slug}`,
      about: { '@type': 'City', name: cityName, containedInPlace: { '@type': 'State', name: state } },
      provider: { '@type': 'Organization', name: BRAND, url: DOMAIN }
    };

    const html = baseHTML({
      title: `Wellness in ${cityName}, ${state} — ${totalPract}+ Verified Practitioners`,
      description,
      canonical: `${DOMAIN}/${slug}`,
      schema,
      breadcrumbs: `<a href="/">BLEU.LIVE</a> → <a href="/cities">Cities</a> → ${cityName}`,
      body
    });

    // Store
    await sb.upsert('seo_pages', [{
      slug, title: `Wellness in ${cityName}`, page_type: 'city',
      city: cityName, state,
      content: { html, specialties: specialtyLinks, total: totalPract },
      status: 'published', published_at: new Date().toISOString()
    }]);

    log('SEO', `City page: /${slug} (${totalPract} practitioners, ${specialtyLinks.length} specialties)`);
    return html;
  }

  // ── CITY + SPECIALTY PAGE ──
  async function generateCitySpecialtyPage(cityName, state, specialty) {
    const cSlug = citySlug(cityName);
    const sSlug = specialtySlug(specialty);
    const slug = `${cSlug}/${sSlug}`;

    // Get actual practitioners
    const practitioners = await sb.query('practitioners',
      `select=*&city=ilike.${encodeURIComponent(cityName)}&state=eq.${state}&specialty=ilike.${encodeURIComponent(specialty)}&limit=100&order=last_name.asc`
    );
    const list = Array.isArray(practitioners) ? practitioners : [];

    if (list.length === 0) return null; // Don't generate empty pages

    const aiContent = await generateContent(
      `Write 2 paragraphs about finding a ${specialty} in ${cityName}, ${state}. There are ${list.length} verified ${specialty}s here. What should someone look for when choosing a ${specialty}? What makes ${cityName} unique for this type of care? Keep it warm, specific, actionable.`
    );

    const description = `${list.length} verified ${specialty}s in ${cityName}, ${state}. All credentials confirmed against the federal NPI Registry. Find the right ${specialty.toLowerCase()} for your needs.`;

    const body = `
<h1>${specialty}s in ${cityName}</h1>
<p class="sub">${list.length} verified ${specialty.toLowerCase()}s — every credential confirmed against the federal NPI Registry.</p>
<div class="stats">
<div class="stat"><div class="stat-n">${list.length}</div><div class="stat-l">Verified ${specialty}s</div></div>
<div class="stat"><div class="stat-n tag-g" style="color:#059669">✓</div><div class="stat-l">NPI Confirmed</div></div>
</div>

${aiContent ? `<div style="margin:32px 0;font-size:17px;line-height:1.8;color:#555">${aiContent.split('\n').filter(Boolean).map(p => `<p style="margin-bottom:16px">${p}</p>`).join('')}</div>` : ''}

<h2>All Verified ${specialty}s</h2>
<div class="grid">
${list.map(p => `
<div class="card">
<h3><a href="/practitioner/${p.npi}">${p.first_name} ${p.last_name}${p.credential ? ', ' + p.credential : ''}</a></h3>
<div class="card-spec">${p.taxonomy || specialty}</div>
<div class="card-addr">${p.address || `${p.city}, ${p.state} ${p.zip}`}</div>
${p.phone ? `<div class="card-meta" style="margin-top:6px">📞 ${p.phone}</div>` : ''}
<div style="margin-top:8px"><span class="tag tag-g">NPI #${p.npi}</span>${p.gender ? `<span class="tag">${p.gender === 'F' ? 'Female' : p.gender === 'M' ? 'Male' : p.gender}</span>` : ''}</div>
</div>`).join('')}
</div>

<div class="safety-banner">
<h3>💊 Taking Supplements or Medications?</h3>
<p>Before your appointment, check if your supplements interact with your medications. 54 substances. 5 pharmacological layers. Free.</p>
<a href="/safety-check" class="cta" style="margin-top:12px;display:inline-block">Run a Safety Check →</a>
</div>

<h2>Other Specialties in ${cityName}</h2>
<div style="display:flex;gap:8px;flex-wrap:wrap">
${['Psychologist','Clinical Social Worker','Psychiatry','Counselor','Acupuncturist','Chiropractor','Massage Therapist','Naturopath','Dietitian','Nutritionist','Physical Therapist','Nurse Practitioner'].filter(s => s !== specialty).map(s => `<a href="/${cSlug}/${specialtySlug(s)}" class="tag">${s}</a>`).join('')}
</div>`;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'MedicalWebPage',
      name: `${specialty}s in ${cityName}, ${state}`,
      description,
      url: `${DOMAIN}/${slug}`,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: list.length,
        itemListElement: list.slice(0, 20).map((p, i) => ({
          '@type': 'ListItem', position: i + 1,
          item: {
            '@type': 'MedicalBusiness',
            name: `${p.first_name} ${p.last_name}`,
            medicalSpecialty: specialty,
            address: { '@type': 'PostalAddress', addressLocality: cityName, addressRegion: state, postalCode: p.zip }
          }
        }))
      }
    };

    const html = baseHTML({
      title: `${list.length} Verified ${specialty}s in ${cityName}, ${state}`,
      description,
      canonical: `${DOMAIN}/${slug}`,
      schema,
      breadcrumbs: `<a href="/">BLEU.LIVE</a> → <a href="/${cSlug}">${cityName}</a> → ${specialty}`,
      body
    });

    await sb.upsert('seo_pages', [{
      slug, title: `${specialty}s in ${cityName}`, page_type: 'city_specialty',
      city: cityName, state, condition: specialty,
      content: { count: list.length },
      status: 'published', published_at: new Date().toISOString()
    }]);

    log('SEO', `Specialty page: /${slug} (${list.length} practitioners)`);
    return html;
  }

  // ── PRACTITIONER PROFILE PAGE ──
  async function generatePractitionerPage(npi) {
    const results = await sb.query('practitioners', `select=*&npi=eq.${npi}&limit=1`);
    if (!Array.isArray(results) || results.length === 0) return null;
    const p = results[0];

    const fullName = `${p.first_name} ${p.last_name}${p.credential ? ', ' + p.credential : ''}`;
    const description = `${fullName} — verified ${p.specialty || p.taxonomy} in ${p.city}, ${p.state}. NPI #${p.npi}. Credentials confirmed against the federal NPI Registry.`;

    const body = `
<h1>${fullName}</h1>
<p class="sub">Verified ${p.specialty || p.taxonomy} in ${p.city}, ${p.state}</p>

<div class="two-col">
<div>
<div class="card" style="border-left:3px solid #059669">
<span class="tag tag-g" style="margin-bottom:12px">✓ Federally Verified — NPI #${p.npi}</span>
<h3>${fullName}</h3>
<div class="card-spec">${p.taxonomy || p.specialty}</div>
<div class="card-addr" style="margin-top:12px">${p.address || `${p.city}, ${p.state} ${p.zip}`}</div>
${p.phone ? `<div class="card-meta" style="margin-top:8px">📞 ${p.phone}</div>` : ''}
${p.gender ? `<div class="card-meta">Gender: ${p.gender === 'F' ? 'Female' : p.gender === 'M' ? 'Male' : p.gender}</div>` : ''}
</div>

<h2>About This Verification</h2>
<p style="font-family:system-ui,sans-serif;font-size:14px;color:#777;line-height:1.7">
This practitioner's credentials are verified against the <strong>National Provider Identifier (NPI) Registry</strong>, maintained by the Centers for Medicare & Medicaid Services (CMS). The NPI number, name, credentials, address, and taxonomy are confirmed against federal records. BLEU.LIVE re-verifies all practitioners on a regular cycle.
</p>

<div class="safety-banner">
<h3>💊 Preparing for Your Visit?</h3>
<p>Check if your supplements interact with your medications before your appointment. Our safety engine analyzes 54 substances across 5 pharmacological layers.</p>
<a href="/safety-check" class="cta" style="margin-top:12px;display:inline-block">Run a Safety Check →</a>
</div>
</div>

<div class="sidebar">
<h4>More ${p.specialty || 'Practitioners'} in ${p.city}</h4>
<a href="/${citySlug(p.city)}/${specialtySlug(p.specialty)}">All ${p.specialty}s in ${p.city} →</a>
<br><br>
<h4>Other Specialties</h4>
${['Psychologist','Psychiatry','Counselor','Acupuncturist','Chiropractor','Nutritionist'].filter(s => s !== p.specialty).map(s => `<a href="/${citySlug(p.city)}/${specialtySlug(s)}">${s}s in ${p.city}</a>`).join('')}
<br><br>
<h4>Explore ${p.city}</h4>
<a href="/${citySlug(p.city)}">All wellness in ${p.city} →</a>
</div>
</div>`;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'MedicalBusiness',
      name: fullName,
      medicalSpecialty: p.specialty || p.taxonomy,
      address: { '@type': 'PostalAddress', streetAddress: p.address, addressLocality: p.city, addressRegion: p.state, postalCode: p.zip },
      telephone: p.phone || undefined,
      identifier: { '@type': 'PropertyValue', name: 'NPI', value: p.npi }
    };

    return baseHTML({
      title: `${fullName} — ${p.specialty || p.taxonomy} in ${p.city}, ${p.state}`,
      description,
      canonical: `${DOMAIN}/practitioner/${p.npi}`,
      schema,
      breadcrumbs: `<a href="/">BLEU.LIVE</a> → <a href="/${citySlug(p.city)}">${p.city}</a> → <a href="/${citySlug(p.city)}/${specialtySlug(p.specialty)}">${p.specialty}</a> → ${p.first_name} ${p.last_name}`,
      body
    });
  }

  // ── SAFETY CHECK PAGE ──
  function safetyCheckPage() {
    const description = 'Check supplement and medication interactions. 54 substances analyzed across 5 pharmacological layers — CYP450, UGT enzymes, serotonin pathways, drug transporters, and CNS depression risk.';
    const body = `
<h1>Safety Check</h1>
<p class="sub">Enter two or more substances to analyze interactions across 5 pharmacological layers. Free. Instant. Grounded in real pharmacology.</p>
<div class="card" style="max-width:600px;padding:32px">
<p style="font-family:system-ui,sans-serif;font-size:14px;color:#777;margin-bottom:16px">Use the API directly:</p>
<code style="display:block;background:#F0F0EA;padding:16px;border-radius:8px;font-size:13px;word-break:break-all">${DOMAIN.replace('https://bleu.live','')}/api/safety-check?substances=cbd,sertraline</code>
<p style="font-family:system-ui,sans-serif;font-size:13px;color:#B0B0A8;margin-top:12px">Replace substance names with any combination. Separate with commas.</p>
</div>
<h2>What We Check</h2>
<div class="grid" style="margin-top:16px">
${[
  {l:'CYP450 Metabolism',d:'Does substance A inhibit the enzyme that breaks down substance B? If so, B accumulates — dangerous with narrow therapeutic index drugs.'},
  {l:'CYP450 Induction',d:'Does substance A speed up metabolism of B? St. John\'s Wort can make birth control ineffective this way.'},
  {l:'UGT Enzymes',d:'Glucuronidation pathway interactions. CBD is a potent UGT inhibitor that can affect drug clearance.'},
  {l:'Drug Transporters',d:'P-glycoprotein, BCRP, OCT, MATE. These cellular pumps determine how much drug actually gets absorbed.'},
  {l:'Serotonin Pathways',d:'SSRIs + tramadol + kratom + dextromethorphan — combinations that risk serotonin syndrome.'},
  {l:'CNS Depression',d:'Stacking GABAergic substances — benzodiazepines, alcohol, kava, valerian — multiplies sedation risk.'},
].map(c => `<div class="card"><h3>${c.l}</h3><p style="font-family:system-ui,sans-serif;font-size:14px;color:#777">${c.d}</p></div>`).join('')}
</div>`;

    return baseHTML({ title: 'Supplement & Medication Safety Check', description, canonical: `${DOMAIN}/safety-check`, body,
      breadcrumbs: `<a href="/">BLEU.LIVE</a> → Safety Check` });
  }

  // ── CITIES INDEX PAGE ──
  async function citiesIndexPage() {
    const cityList = Object.entries(CITY_META).map(([slug, m]) => ({ slug, name: titleCase(slug), ...m }));
    const body = `
<h1>Cities</h1>
<p class="sub">20 cities. Thousands of verified practitioners. Every one confirmed against the federal NPI Registry.</p>
<div class="grid">
${cityList.map(c => `
<a href="/${c.slug}" class="card" style="text-decoration:none">
<h3 style="color:#1B1B18">${c.name}</h3>
<div class="card-meta">${c.pop || ''}</div>
<div style="font-family:system-ui,sans-serif;font-size:13px;color:#777;margin-top:8px;font-style:italic">${c.soul || ''}</div>
</a>`).join('')}
</div>`;

    return baseHTML({ title: 'All Cities — Verified Wellness Practitioners', description: 'Find verified wellness practitioners in 20 major US cities. Every credential confirmed against the federal NPI Registry.',
      canonical: `${DOMAIN}/cities`, body, breadcrumbs: `<a href="/">BLEU.LIVE</a> → Cities` });
  }

  // ═══════════════════════════════════════════════════════════════
  // SITEMAP — Auto-generated from seo_pages table
  // ═══════════════════════════════════════════════════════════════
  async function generateSitemap() {
    const pages = await sb.query('seo_pages', 'select=slug,published_at&status=eq.published&limit=10000');
    const list = Array.isArray(pages) ? pages : [];

    // Add static pages
    const urls = [
      { loc: DOMAIN + '/', priority: '1.0', freq: 'daily' },
      { loc: DOMAIN + '/cities', priority: '0.9', freq: 'weekly' },
      { loc: DOMAIN + '/safety-check', priority: '0.9', freq: 'monthly' },
    ];

    // Add dynamic pages
    for (const p of list) {
      urls.push({
        loc: `${DOMAIN}/${p.slug}`,
        priority: p.slug.includes('/') ? '0.7' : '0.8',
        freq: 'weekly',
        lastmod: p.published_at ? p.published_at.substring(0, 10) : undefined
      });
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `<url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<changefreq>${u.freq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;
  }

  function robotsTxt() {
    return `User-agent: *\nAllow: /\nSitemap: ${DOMAIN}/sitemap.xml\n`;
  }

  // ═══════════════════════════════════════════════════════════════
  // POST-SCRAPE HOOK — Generate pages after pipeline cycle
  // ═══════════════════════════════════════════════════════════════
  async function afterPipelineCycle(city) {
    log('SEO', `Generating pages for ${city.name}, ${city.state}...`);

    try {
      // 1. City hub page
      await generateCityPage(city.name, city.state);

      // 2. Get distinct specialties with practitioners
      const specs = await sb.query('practitioners',
        `select=specialty&city=ilike.${encodeURIComponent(city.name)}&state=eq.${city.state}`
      );
      const uniqueSpecs = [...new Set((Array.isArray(specs) ? specs : []).map(s => s.specialty).filter(Boolean))];

      // 3. Generate city+specialty pages
      for (const spec of uniqueSpecs) {
        await generateCitySpecialtyPage(city.name, city.state, spec);
        await new Promise(r => setTimeout(r, 500)); // Rate limit Haiku
      }

      log('SEO', `Pages complete for ${city.name}: 1 city + ${uniqueSpecs.length} specialty pages`);
    } catch (e) {
      log('SEO', `Page generation error for ${city.name}: ${e.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ROUTE HANDLER — Serves pages from DB or generates on-the-fly
  // ═══════════════════════════════════════════════════════════════
  async function handleRoute(path) {
    // Remove leading slash
    const route = path.replace(/^\//, '').replace(/\/$/, '');

    // Static routes
    if (route === 'sitemap.xml') return { type: 'xml', content: await generateSitemap() };
    if (route === 'robots.txt') return { type: 'text', content: robotsTxt() };
    if (route === 'safety-check') return { type: 'html', content: safetyCheckPage() };
    if (route === 'cities') return { type: 'html', content: await citiesIndexPage() };

    // Practitioner profile: /practitioner/1234567890
    if (route.startsWith('practitioner/')) {
      const npi = route.split('/')[1];
      if (/^\d+$/.test(npi)) {
        const html = await generatePractitionerPage(npi);
        if (html) return { type: 'html', content: html };
      }
      return null;
    }

    // City routes: /new-orleans or /new-orleans/psychologist
    const parts = route.split('/');
    if (parts.length === 1 && CITY_META[parts[0]]) {
      // City hub — check cache first
      const cached = await sb.query('seo_pages', `select=content&slug=eq.${parts[0]}&status=eq.published&limit=1`);
      if (Array.isArray(cached) && cached.length > 0 && cached[0].content?.html) {
        return { type: 'html', content: cached[0].content.html };
      }
      // Generate on the fly
      const cityMeta = CITY_META[parts[0]];
      const cityName = titleCase(parts[0]);
      // Find state from practitioners or meta
      const stateQuery = await sb.query('practitioners', `select=state&city=ilike.${encodeURIComponent(cityName)}&limit=1`);
      const state = (Array.isArray(stateQuery) && stateQuery[0]?.state) || '';
      if (state) {
        const html = await generateCityPage(cityName, state);
        return { type: 'html', content: html };
      }
      return null;
    }

    if (parts.length === 2 && CITY_META[parts[0]]) {
      // City + specialty
      const cityName = titleCase(parts[0]);
      const specialty = titleCase(parts[1]);
      const stateQuery = await sb.query('practitioners', `select=state&city=ilike.${encodeURIComponent(cityName)}&limit=1`);
      const state = (Array.isArray(stateQuery) && stateQuery[0]?.state) || '';
      if (state) {
        const html = await generateCitySpecialtyPage(cityName, state, specialty);
        if (html) return { type: 'html', content: html };
      }
      return null;
    }

    return null; // Not an SEO route
  }

  // ═══════════════════════════════════════════════════════════════
  // EXPORTS
  // ═══════════════════════════════════════════════════════════════
  return {
    handleRoute,
    afterPipelineCycle,
    generateSitemap,
    generateCityPage,
    generateCitySpecialtyPage,
    generatePractitionerPage,
  };
};
