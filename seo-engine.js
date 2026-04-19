// ═══════════════════════════════════════════════════════════════════════════════
//  BLEU.LIVE SEO ENGINE v1.0 — Content Generation & Page Serving
//  Generates Google-indexable pages from pipeline data
//  City hubs · City+Specialty listings · Practitioner profiles · Safety pages
//  Sitemap · robots.txt · Schema.org · Open Graph · Internal linking
//  Plugs into server.js: const seo = require('./seo-engine')(deps);
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = function({ sb, ENV, fetchJSON, log }) {

  const DOMAIN = 'https://bleu-system.onrender.com';
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
    'baton-rouge': { lat: 30.45, lng: -91.15, soul: 'Cajun country capital — swampy heat, LSU pride, soul food as medicine.', pop: '228K' },
    'houston': { lat: 29.76, lng: -95.37, soul: 'Medical City powerhouse — largest med center on earth, Gulf humidity, global kitchens.', pop: '2.3M' },
    'jackson': { lat: 32.30, lng: -90.18, soul: 'Blues birthplace, civil rights ground — slow-living healing in the heart of Mississippi.', pop: '153K' },
    'mobile': { lat: 30.70, lng: -88.04, soul: 'Gulf Coast soul — oak-lined streets, Mardi Gras roots, Southern maritime wellness.', pop: '187K' },
    'boston': { lat: 42.36, lng: -71.06, soul: 'Academic medicine, New England grit, world-class hospitals and walking-city rhythm.', pop: '675K' },
    'boulder': { lat: 40.01, lng: -105.27, soul: 'Flatirons views, trail-run culture, psychedelic research and Buddhist centers.', pop: '108K' },
    'sedona': { lat: 34.87, lng: -111.76, soul: 'Red rock vortexes, energy healers — the spiritual capital of the American Southwest.', pop: '10K' },
    'asheville': { lat: 35.60, lng: -82.55, soul: 'Blue Ridge mountains, craft beer and craft healing — plant medicine meets Appalachian folk wisdom.', pop: '94K' },
    'santa-fe': { lat: 35.69, lng: -105.94, soul: 'High desert capital — Native and Hispanic healing traditions, adobe quiet, thin air.', pop: '85K' },
    'las-vegas': { lat: 36.17, lng: -115.14, soul: 'Desert neon, 24-hour energy, a city that runs on stimulation and needs recovery intelligence.', pop: '641K' },
    'salt-lake-city': { lat: 40.76, lng: -111.89, soul: 'Mountain air, LDS wellness culture, outdoor endurance meets community care.', pop: '200K' },
    'albuquerque': { lat: 35.08, lng: -106.65, soul: 'High desert healing, Native and Hispanic traditions, green chile and red rock medicine.', pop: '564K' },
    'tucson': { lat: 32.22, lng: -110.97, soul: 'Sonoran Desert medicine, UA research, borderland healing traditions.', pop: '542K' },
    'kansas-city': { lat: 39.10, lng: -94.58, soul: 'BBQ soul, jazz roots, Midwest resilience and faith-rooted community health.', pop: '508K' },
    'st-louis': { lat: 38.63, lng: -90.20, soul: 'Gateway city, hospital corridor, Black excellence and Arch-city grit.', pop: '301K' },
    'memphis': { lat: 35.15, lng: -90.05, soul: 'Blues birthplace, soul food as medicine, deep Southern resilience.', pop: '633K' },
    'new-orleans-east': { lat: 29.97, lng: -89.93, soul: 'Vietnamese and Black community healing, East NOLA resilience, underserved care turning.', pop: '89K' },
    'richmond': { lat: 37.54, lng: -77.43, soul: 'Capital city healing, civil rights legacy, emerging wellness infrastructure.', pop: '226K' },
    'pittsburgh': { lat: 40.44, lng: -79.99, soul: 'Steel city grit, Carnegie healthcare, rust belt resilience meets wellness innovation.', pop: '302K' },
    'columbus': { lat: 39.96, lng: -82.99, soul: 'College town energy, OSU medical center, Midwest progressive wellness.', pop: '898K' },
    'indianapolis': { lat: 39.77, lng: -86.16, soul: 'Heartland healing, sports medicine capital, faith-rooted community care.', pop: '872K' },
    'louisville': { lat: 38.25, lng: -85.76, soul: 'Bourbon country, Kentucky Derby wellness, southern charm meets medical research.', pop: '633K' },
    'cincinnati': { lat: 39.10, lng: -84.51, soul: 'Queen City resilience, UC medical center, Ohio River community healing.', pop: '309K' },
    'cleveland': { lat: 41.50, lng: -81.69, soul: 'Clinic city — Cleveland Clinic is here. Medical gravity pulling wellness innovation.', pop: '372K' },
    'detroit': { lat: 42.33, lng: -83.05, soul: 'Motown soul, automotive grit, Black-led wellness renaissance in the comeback city.', pop: '632K' },
    'milwaukee': { lat: 43.04, lng: -87.91, soul: 'Great Lakes healing, brewing culture, Midwestern community health roots.', pop: '577K' },
    'omaha': { lat: 41.26, lng: -95.94, soul: 'Heartland anchor, Warren Buffett town, quiet Midwest wellness infrastructure.', pop: '486K' },
    'des-moines': { lat: 41.59, lng: -93.62, soul: 'Iowa capital, agricultural wellness, farm-to-table health culture.', pop: '214K' },
    'tulsa': { lat: 36.15, lng: -95.99, soul: 'Oil country resilience, Native American healing traditions, Green Country wellness.', pop: '413K' },
    'oklahoma-city': { lat: 35.47, lng: -97.52, soul: 'Plains city grit, rodeo culture, faith-driven community health.', pop: '681K' },
    'el-paso': { lat: 31.76, lng: -106.49, soul: 'Border city healing, Mexican wellness traditions, military community care.', pop: '678K' },
    'fort-worth': { lat: 32.75, lng: -97.33, soul: 'Cowtown soul, Stockyards wellness culture, DFW health corridor.', pop: '918K' },
    'sacramento': { lat: 38.58, lng: -121.49, soul: 'Farm-to-fork capital, state government workforce, California wellness at scale.', pop: '524K' },
    'fresno': { lat: 36.74, lng: -119.77, soul: 'Central Valley agriculture, farmworker health, San Joaquin wellness desert turning.', pop: '542K' },
    'bakersfield': { lat: 35.37, lng: -119.02, soul: 'Oil and agriculture, country music soul, underserved Central Valley care.', pop: '403K' },
    'long-beach': { lat: 33.77, lng: -118.19, soul: 'Port city diversity, LA adjacent, Pacific wellness culture at the edge.', pop: '466K' },
    'oakland': { lat: 37.80, lng: -122.27, soul: 'Black excellence, Bay Area grit, social justice meets wellness innovation.', pop: '440K' },
    'san-jose': { lat: 37.34, lng: -121.89, soul: 'Silicon Valley wellness, tech wealth meets burnout recovery, innovation at the edge.', pop: '1.0M' },
    'raleigh': { lat: 35.78, lng: -78.64, soul: 'Research Triangle medicine, college town energy, progressive Southern wellness.', pop: '467K' },
    'virginia-beach': { lat: 36.85, lng: -75.98, soul: 'Military wellness, oceanfront recovery, coastal Virginia healing culture.', pop: '459K' },
    'jacksonville': { lat: 30.33, lng: -81.66, soul: 'Largest city footprint in US, military community, Florida wellness frontier.', pop: '949K' },
    'orlando': { lat: 28.54, lng: -81.38, soul: 'Tourist city, hospitality workforce wellness, theme park burnout and recovery.', pop: '307K' },
    'fort-lauderdale': { lat: 26.12, lng: -80.14, soul: 'Venice of America, boating culture, South Florida wellness and recovery scene.', pop: '182K' },
    'st-petersburg': { lat: 27.77, lng: -82.64, soul: 'Sunshine City, arts district wellness, Tampa Bay healing culture.', pop: '258K' },
    'jersey-city': { lat: 40.72, lng: -74.04, soul: 'NYC overflow, immigrant wellness culture, Hudson River resilience.', pop: '292K' },
    'newark': { lat: 40.74, lng: -74.17, soul: 'Brick City resilience, Newark revitalization, underserved care turning.', pop: '311K' },
    'hartford': { lat: 41.76, lng: -72.68, soul: 'Insurance capital, Connecticut wellness infrastructure, New England resilience.', pop: '121K' },
    'providence': { lat: 41.82, lng: -71.41, soul: 'Rhode Island healing, RISD creativity meets wellness, New England community care.', pop: '190K' },
    'buffalo': { lat: 42.89, lng: -78.88, soul: 'Niagara frontier grit, Buffalo wings and Rust Belt resilience, Great Lakes healing.', pop: '278K' },
    'rochester': { lat: 43.16, lng: -77.61, soul: 'Kodak city reinventing itself, strong hospital infrastructure, upstate NY wellness.', pop: '211K' },
    'albany': { lat: 42.65, lng: -73.75, soul: 'State capital, government workforce wellness, Hudson Valley healing culture.', pop: '99K' },
    'new-haven': { lat: 41.31, lng: -72.92, soul: 'Yale medicine, college town wellness, Connecticut harbor healing.', pop: '130K' },
    'worcester': { lat: 42.26, lng: -71.80, soul: 'Heart of Massachusetts, UMass medical, New England working-class wellness.', pop: '185K' },
    'springfield-ma': { lat: 42.10, lng: -72.59, soul: 'Western Mass resilience, Connecticut River valley, opioid recovery ground zero turning.', pop: '153K' },
    'richmond-va': { lat: 37.54, lng: -77.44, soul: 'RVA arts wellness, VCU medical center, civil rights healing legacy.', pop: '226K' },
    'norfolk': { lat: 36.85, lng: -76.29, soul: 'Naval city wellness, Hampton Roads healing, Virginia coastline resilience.', pop: '238K' },
    'birmingham': { lat: 33.52, lng: -86.80, soul: 'Magic City rising, civil rights healing, Southern medical research corridor.', pop: '212K' },
    'montgomery': { lat: 32.36, lng: -86.30, soul: 'Civil rights capital, Alabama resilience, faith-rooted community care.', pop: '199K' },
    'little-rock': { lat: 34.75, lng: -92.29, soul: 'Arkansas capital, delta healing traditions, UAMS medical anchor.', pop: '202K' },
    'shreveport': { lat: 32.52, lng: -93.75, soul: 'ArkLaTex crossroads, Cajun adjacent, underserved Southern care turning.', pop: '175K' },
    'baton-rouge-east': { lat: 30.41, lng: -91.13, soul: 'Southern University corridor, HBCU wellness, Black Louisiana healing culture.', pop: '45K' },
    'lafayette-la': { lat: 30.22, lng: -92.02, soul: 'Cajun Country heart, French Louisiana healing, crawfish and community medicine.', pop: '121K' },
    'lake-charles': { lat: 30.23, lng: -93.22, soul: 'Southwest Louisiana grit, chemical corridor health, Cajun resilience.', pop: '78K' },
    'gulfport': { lat: 30.37, lng: -89.09, soul: 'Gulf Coast resilience, post-Katrina healing, Mississippi Sound recovery.', pop: '72K' },
    'tallahassee': { lat: 30.44, lng: -84.28, soul: 'Capital city wellness, FSU research, North Florida healing culture.', pop: '196K' },
    'gainesville': { lat: 29.65, lng: -82.32, soul: 'Gator country, UF medical powerhouse, college town wellness frontier.', pop: '141K' },
    'savannah': { lat: 32.08, lng: -81.10, soul: 'Historic squares, Southern grace, coastal Georgia healing and recovery culture.', pop: '147K' },
    'columbia-sc': { lat: 34.00, lng: -81.03, soul: 'Palmetto State capital, USC medical, Southern wellness infrastructure.', pop: '131K' },
    'greenville-sc': { lat: 34.85, lng: -82.39, soul: 'Upstate South Carolina rising, BMW meets Blue Ridge wellness, progressive Southern city.', pop: '70K' },
    'knoxville': { lat: 35.96, lng: -83.92, soul: 'Tennessee Valley grit, UT medical, Appalachian healing traditions.', pop: '190K' },
    'chattanooga': { lat: 35.05, lng: -85.31, soul: 'Scenic city, outdoor wellness capital of Tennessee, Lookout Mountain healing.', pop: '181K' },
    'lexington': { lat: 38.04, lng: -84.50, soul: 'Bluegrass healing, horse country wellness, UK medical anchor.', pop: '322K' },
    'springfield-mo': { lat: 37.21, lng: -93.29, soul: 'Ozarks healing, Missouri State wellness, Bass Pro country community care.', pop: '169K' },
    'columbia-mo': { lat: 38.95, lng: -92.33, soul: 'MU medical powerhouse, college town wellness, Show-Me State community health.', pop: '126K' },
    'wichita': { lat: 37.69, lng: -97.34, soul: 'Air capital, Kansas plains grit, faith-driven community health.', pop: '389K' },
    'sioux-falls': { lat: 43.54, lng: -96.73, soul: 'Great Plains wellness, Sanford Health anchor, South Dakota community care.', pop: '192K' },
    'fargo': { lat: 46.88, lng: -96.79, soul: 'Northern Plains grit, NDSU wellness culture, cold-weather community health.', pop: '125K' },
    'bismarck': { lat: 46.81, lng: -100.78, soul: 'Prairie capital, Native healing traditions nearby, North Dakota resilience.', pop: '73K' },
    'rapid-city': { lat: 44.08, lng: -103.23, soul: 'Mount Rushmore gateway, Lakota healing traditions, Black Hills wellness frontier.', pop: '75K' },
    'billings': { lat: 45.78, lng: -108.50, soul: 'Montana gateway, Big Sky wellness, ranching culture meets community health.', pop: '117K' },
    'boise': { lat: 43.61, lng: -116.20, soul: 'Treasure Valley wellness, outdoor culture, tech migration meets Idaho healing.', pop: '235K' },
    'spokane': { lat: 47.66, lng: -117.43, soul: 'Inland Northwest wellness, Gonzaga community, Pacific Northwest grit.', pop: '228K' },
    'tacoma': { lat: 47.25, lng: -122.44, soul: 'Puget Sound resilience, military community, Pacific Northwest healing culture.', pop: '219K' },
    'olympia': { lat: 47.04, lng: -122.90, soul: 'Washington capital, progressive wellness policy, South Sound healing.', pop: '53K' },
    'eugene': { lat: 44.05, lng: -123.09, soul: 'Track Town USA, University of Oregon wellness, Pacific Northwest progressive care.', pop: '176K' },
    'bend': { lat: 44.06, lng: -121.31, soul: 'High desert outdoor capital, craft beer wellness culture, Central Oregon healing.', pop: '99K' },
    'reno': { lat: 39.53, lng: -119.81, soul: 'Biggest Little City, Nevada wellness frontier, Sierra Nevada healing culture.', pop: '264K' },
    'henderson': { lat: 36.04, lng: -114.98, soul: 'Las Vegas suburb wellness, planned community health, Nevada desert healing.', pop: '320K' },
    'paradise-nv': { lat: 36.09, lng: -115.14, soul: 'The Strip wellness industry, hospitality workforce recovery, Nevada gaming community care.', pop: '223K' },
    'anchorage': { lat: 61.22, lng: -149.90, soul: 'Last Frontier wellness, indigenous healing traditions, extreme climate health.', pop: '291K' },
    'honolulu': { lat: 21.31, lng: -157.86, soul: 'Aloha healing, Pacific Islander wellness traditions, ocean medicine at the edge.', pop: '350K' },
    'richmond-ca': { lat: 37.94, lng: -122.35, soul: 'Bay Area resilience, environmental justice health, Richmond rising wellness.', pop: '116K' },
    'stockton': { lat: 37.96, lng: -121.29, soul: 'Central Valley recovery, inland California wellness, diverse community care.', pop: '320K' },
    'modesto': { lat: 37.64, lng: -120.99, soul: 'Agricultural California, Central Valley community, almond country health.', pop: '218K' },
    'fontana': { lat: 34.09, lng: -117.43, soul: 'Inland Empire wellness, working-class community care, San Bernardino healing.', pop: '214K' },
    'moreno-valley': { lat: 33.94, lng: -117.23, soul: 'Inland Empire resilience, Riverside County wellness, desert-edge community care.', pop: '208K' },
    'glendale-ca': { lat: 34.14, lng: -118.25, soul: 'Armenian healing traditions, LA adjacent, diverse community wellness.', pop: '196K' },
    'scottsdale': { lat: 33.49, lng: -111.92, soul: 'Luxury wellness capital of Arizona, spa culture, desert longevity hub.', pop: '258K' },
    'gilbert': { lat: 33.35, lng: -111.79, soul: 'Phoenix suburb wellness, family-centered community health, East Valley healing.', pop: '267K' },
    'chandler': { lat: 33.30, lng: -111.84, soul: 'Tech corridor wellness, Intel community, Phoenix East Valley health culture.', pop: '261K' },
    'tempe': { lat: 33.43, lng: -111.94, soul: 'ASU wellness, college town health culture, Salt River community care.', pop: '195K' },
    'mesa': { lat: 33.42, lng: -111.83, soul: 'Largest Phoenix suburb, LDS community wellness, Arizona healing culture.', pop: '504K' },
    'peoria-az': { lat: 33.58, lng: -112.24, soul: 'West Valley wellness, spring training city, Arizona family community health.', pop: '190K' },
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

    // Top 10 featured practitioners in this city (ordered by full_name)
    const featured = await sb.query('practitioners',
      `select=full_name,specialty,address_line1,city,zip,phone,npi&city=ilike.${encodeURIComponent(cityName)}&state=eq.${state}&order=full_name.asc&limit=10`
    );
    const featuredList = Array.isArray(featured) ? featured : [];

    // Recent research — 5 most recent pubmed studies
    const studies = await sb.query('pubmed_studies',
      `select=title,journal,published_date,url&order=published_date.desc.nullslast&limit=5`
    );
    const studyList = Array.isArray(studies) ? studies : [];

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

${featuredList.length ? `
<h2>Featured Practitioners in ${cityName}</h2>
<div class="grid">
${featuredList.map(p => `
<div class="card">
<h3><a href="/practitioner/${p.npi}">${p.full_name || 'Verified Practitioner'}</a></h3>
${p.specialty ? `<div class="card-spec">${p.specialty}</div>` : ''}
<div class="card-addr">${[p.address_line1, p.city, p.zip].filter(Boolean).join(', ')}</div>
${p.phone ? `<div class="card-meta" style="margin-top:6px">📞 ${p.phone}</div>` : ''}
<div style="margin-top:8px"><span class="tag tag-g">NPI #${p.npi}</span></div>
</div>`).join('')}
</div>` : ''}

${studyList.length ? `
<h2>Recent Research</h2>
<div class="grid">
${studyList.map(s => `
<div class="card">
<h3><a href="${s.url}" target="_blank" rel="noopener">${s.title}</a></h3>
${s.journal ? `<div class="card-spec">${s.journal}</div>` : ''}
${s.published_date ? `<div class="card-meta" style="margin-top:6px">${s.published_date}</div>` : ''}
</div>`).join('')}
</div>` : ''}

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

    // Recent research — 5 most recent pubmed studies
    const studies = await sb.query('pubmed_studies',
      `select=title,journal,published_date,url&order=published_date.desc.nullslast&limit=5`
    );
    const studyList = Array.isArray(studies) ? studies : [];

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

${studyList.length ? `
<h2>Recent Research</h2>
<div class="grid">
${studyList.map(s => `
<div class="card">
<h3><a href="${s.url}" target="_blank" rel="noopener">${s.title}</a></h3>
${s.journal ? `<div class="card-spec">${s.journal}</div>` : ''}
${s.published_date ? `<div class="card-meta" style="margin-top:6px">${s.published_date}</div>` : ''}
</div>`).join('')}
</div>` : ''}

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

    // Add city hub pages from CITY_META
    for (const slug of Object.keys(CITY_META)) {
      urls.push({ loc: `${DOMAIN}/${slug}`, priority: '0.8', freq: 'weekly' });
      for (const cond of CONDITIONS) {
        urls.push({ loc: `${DOMAIN}/${slug}/${cond}`, priority: '0.7', freq: 'weekly' });
      }
    }

    // Add dynamic pages from seo_pages cache (skip duplicates)
    const seen = new Set(urls.map(u => u.loc));
    for (const p of list) {
      const loc = `${DOMAIN}/${p.slug}`;
      if (seen.has(loc)) continue;
      seen.add(loc);
      urls.push({
        loc,
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
