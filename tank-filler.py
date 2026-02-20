#!/usr/bin/env python3
"""
BLEU TANK FILLER v3 — 18-Hour Total Ecosystem Data Engine
Fills EVERY Supabase table with MAXIMUM data from EVERY free API.
NOLA first, then nationwide expansion.

Usage:
  python tank-filler.py --all          # Run everything (18 hrs)
  python tank-filler.py --nola         # Just NOLA deep fill
  python tank-filler.py --source npi   # Just one source
  python tank-filler.py --status       # Show counts
"""

import os, sys, json, time, hashlib, argparse, re, datetime
from urllib.request import urlopen, Request
from urllib.parse import quote, urlencode
from urllib.error import HTTPError, URLError

# ══════════════════════════════════════════════════════════
# CONFIG
# ══════════════════════════════════════════════════════════
SB_URL = os.environ.get('SUPABASE_URL', 'https://sqyzboesdpdussiwqpzk.supabase.co')
SB_KEY = os.environ.get('SUPABASE_SERVICE_KEY', 'sb_secret__zYCYtWcOx9uKnIgRPPN4Q_PWkTOf96')
GOOGLE_KEY = os.environ.get('GOOGLE_PLACES_KEY', 'AIzaSyCGYgOuRAPS5HO95ify2ZNmQj_21Tjn0Ks')
YT_KEY = os.environ.get('YOUTUBE_API_KEY', 'AIzaSyCGYgOuRAPS5HO95ify2ZNmQj_21Tjn0Ks')
AMZ_TAG = 'bleu-live-20'
IHERB_CODE = 'BLEU'

if not SB_KEY:
    SB_KEY = os.environ.get('SUPABASE_ANON_KEY', '')

TOTAL_STORED = 0

def sb_headers(upsert=True):
    h = {
        'apikey': SB_KEY,
        'Authorization': f'Bearer {SB_KEY}',
        'Content-Type': 'application/json',
    }
    if upsert:
        h['Prefer'] = 'resolution=merge-duplicates'
    return h

def sb_upsert(table, rows):
    global TOTAL_STORED
    if not rows:
        return 0
    total = 0
    for i in range(0, len(rows), 100):
        batch = rows[i:i+100]
        try:
            req = Request(f'{SB_URL}/rest/v1/{table}', data=json.dumps(batch).encode(), headers=sb_headers(), method='POST')
            urlopen(req, timeout=30)
            total += len(batch)
        except HTTPError as e:
            body = e.read().decode()[:200] if hasattr(e, 'read') else str(e)
            if '42P01' in body:
                print(f'    ⚠ Table {table} missing — run setup-tables.sql first')
                return 0
            # Try individual
            for row in batch:
                try:
                    req2 = Request(f'{SB_URL}/rest/v1/{table}', data=json.dumps([row]).encode(), headers=sb_headers(), method='POST')
                    urlopen(req2, timeout=15)
                    total += 1
                except:
                    pass
        except Exception as e:
            print(f'    ⚠ {e}')
    TOTAL_STORED += total
    return total

def sb_count(table):
    try:
        req = Request(f'{SB_URL}/rest/v1/{table}?select=id&limit=1', headers={**sb_headers(False), 'Range': '0-0', 'Prefer': 'count=exact'})
        resp = urlopen(req, timeout=10)
        return int(resp.headers.get('content-range', '*/0').split('/')[-1])
    except:
        return 0

def fetch_json(url, headers=None, timeout=20):
    try:
        req = Request(url, headers=headers or {'User-Agent': 'BLEU-Wellness-Intelligence/2.0'})
        resp = urlopen(req, timeout=timeout)
        return json.loads(resp.read().decode())
    except Exception as e:
        return None

def make_id(s):
    import uuid
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, s))
def _old_make_id(s):
    import uuid; return str(uuid.uuid5(uuid.NAMESPACE_DNS, s))

def log(msg):
    ts = datetime.datetime.now().strftime('%H:%M:%S')
    print(f'  [{ts}] {msg}', flush=True)

# ══════════════════════════════════════════════════════════
# CITIES — NOLA DEEP + 50 EXPANSION CITIES
# ══════════════════════════════════════════════════════════
NOLA_NEIGHBORHOODS = [
    {'city': 'New Orleans', 'state': 'LA', 'lat': 29.9511, 'lng': -90.0715},
    {'city': 'Metairie', 'state': 'LA', 'lat': 29.9841, 'lng': -90.1526},
    {'city': 'Kenner', 'state': 'LA', 'lat': 29.9941, 'lng': -90.2417},
    {'city': 'Gretna', 'state': 'LA', 'lat': 29.9146, 'lng': -90.0522},
    {'city': 'Harvey', 'state': 'LA', 'lat': 29.9035, 'lng': -90.0773},
    {'city': 'Marrero', 'state': 'LA', 'lat': 29.8994, 'lng': -90.1004},
    {'city': 'Chalmette', 'state': 'LA', 'lat': 29.9427, 'lng': -89.9650},
    {'city': 'Slidell', 'state': 'LA', 'lat': 30.2752, 'lng': -89.7812},
    {'city': 'Mandeville', 'state': 'LA', 'lat': 30.3585, 'lng': -90.0656},
    {'city': 'Covington', 'state': 'LA', 'lat': 30.4755, 'lng': -90.1009},
    {'city': 'Hammond', 'state': 'LA', 'lat': 30.5044, 'lng': -90.4612},
    {'city': 'Houma', 'state': 'LA', 'lat': 29.5958, 'lng': -90.7195},
    {'city': 'LaPlace', 'state': 'LA', 'lat': 30.0666, 'lng': -90.4818},
    {'city': 'Westwego', 'state': 'LA', 'lat': 29.9063, 'lng': -90.1423},
    {'city': 'Destrehan', 'state': 'LA', 'lat': 29.9583, 'lng': -90.3516},
]

LOUISIANA_CITIES = [
    {'city': 'Baton Rouge', 'state': 'LA', 'lat': 30.4515, 'lng': -91.1871},
    {'city': 'Shreveport', 'state': 'LA', 'lat': 32.5252, 'lng': -93.7502},
    {'city': 'Lafayette', 'state': 'LA', 'lat': 30.2241, 'lng': -92.0198},
    {'city': 'Lake Charles', 'state': 'LA', 'lat': 30.2266, 'lng': -93.2174},
    {'city': 'Monroe', 'state': 'LA', 'lat': 32.5093, 'lng': -92.1193},
    {'city': 'Alexandria', 'state': 'LA', 'lat': 31.3113, 'lng': -92.4451},
]

EXPANSION_CITIES = [
    {'city': 'Houston', 'state': 'TX', 'lat': 29.7604, 'lng': -95.3698},
    {'city': 'Dallas', 'state': 'TX', 'lat': 32.7767, 'lng': -96.7970},
    {'city': 'Austin', 'state': 'TX', 'lat': 30.2672, 'lng': -97.7431},
    {'city': 'San Antonio', 'state': 'TX', 'lat': 29.4241, 'lng': -98.4936},
    {'city': 'Atlanta', 'state': 'GA', 'lat': 33.7490, 'lng': -84.3880},
    {'city': 'Miami', 'state': 'FL', 'lat': 25.7617, 'lng': -80.1918},
    {'city': 'Tampa', 'state': 'FL', 'lat': 27.9506, 'lng': -82.4572},
    {'city': 'Orlando', 'state': 'FL', 'lat': 28.5383, 'lng': -81.3792},
    {'city': 'Jacksonville', 'state': 'FL', 'lat': 30.3322, 'lng': -81.6557},
    {'city': 'Charlotte', 'state': 'NC', 'lat': 35.2271, 'lng': -80.8431},
    {'city': 'Nashville', 'state': 'TN', 'lat': 36.1627, 'lng': -86.7816},
    {'city': 'Memphis', 'state': 'TN', 'lat': 35.1495, 'lng': -90.0490},
    {'city': 'Birmingham', 'state': 'AL', 'lat': 33.5207, 'lng': -86.8025},
    {'city': 'Jackson', 'state': 'MS', 'lat': 32.2988, 'lng': -90.1848},
    {'city': 'New York', 'state': 'NY', 'lat': 40.7128, 'lng': -74.0060},
    {'city': 'Los Angeles', 'state': 'CA', 'lat': 34.0522, 'lng': -118.2437},
    {'city': 'Chicago', 'state': 'IL', 'lat': 41.8781, 'lng': -87.6298},
    {'city': 'Philadelphia', 'state': 'PA', 'lat': 39.9526, 'lng': -75.1652},
    {'city': 'Phoenix', 'state': 'AZ', 'lat': 33.4484, 'lng': -112.0740},
    {'city': 'San Diego', 'state': 'CA', 'lat': 32.7157, 'lng': -117.1611},
    {'city': 'San Francisco', 'state': 'CA', 'lat': 37.7749, 'lng': -122.4194},
    {'city': 'Seattle', 'state': 'WA', 'lat': 47.6062, 'lng': -122.3321},
    {'city': 'Portland', 'state': 'OR', 'lat': 45.5152, 'lng': -122.6784},
    {'city': 'Denver', 'state': 'CO', 'lat': 39.7392, 'lng': -104.9903},
    {'city': 'Minneapolis', 'state': 'MN', 'lat': 44.9778, 'lng': -93.2650},
    {'city': 'Detroit', 'state': 'MI', 'lat': 42.3314, 'lng': -83.0458},
    {'city': 'Boston', 'state': 'MA', 'lat': 42.3601, 'lng': -71.0589},
    {'city': 'Washington', 'state': 'DC', 'lat': 38.9072, 'lng': -77.0369},
    {'city': 'Baltimore', 'state': 'MD', 'lat': 39.2904, 'lng': -76.6122},
    {'city': 'Las Vegas', 'state': 'NV', 'lat': 36.1699, 'lng': -115.1398},
    {'city': 'Columbus', 'state': 'OH', 'lat': 39.9612, 'lng': -82.9988},
    {'city': 'Indianapolis', 'state': 'IN', 'lat': 39.7684, 'lng': -86.1581},
    {'city': 'Kansas City', 'state': 'MO', 'lat': 39.0997, 'lng': -94.5786},
    {'city': 'St Louis', 'state': 'MO', 'lat': 38.6270, 'lng': -90.1994},
    {'city': 'Pittsburgh', 'state': 'PA', 'lat': 40.4406, 'lng': -79.9959},
    {'city': 'Cincinnati', 'state': 'OH', 'lat': 39.1031, 'lng': -84.5120},
    {'city': 'Cleveland', 'state': 'OH', 'lat': 41.4993, 'lng': -81.6944},
    {'city': 'Raleigh', 'state': 'NC', 'lat': 35.7796, 'lng': -78.6382},
    {'city': 'Richmond', 'state': 'VA', 'lat': 37.5407, 'lng': -77.4360},
    {'city': 'Louisville', 'state': 'KY', 'lat': 38.2527, 'lng': -85.7585},
    {'city': 'Oklahoma City', 'state': 'OK', 'lat': 35.4676, 'lng': -97.5164},
    {'city': 'Salt Lake City', 'state': 'UT', 'lat': 40.7608, 'lng': -111.8910},
    {'city': 'Tucson', 'state': 'AZ', 'lat': 32.2226, 'lng': -110.9747},
    {'city': 'Albuquerque', 'state': 'NM', 'lat': 35.0844, 'lng': -106.6504},
    {'city': 'Honolulu', 'state': 'HI', 'lat': 21.3069, 'lng': -157.8583},
    {'city': 'Anchorage', 'state': 'AK', 'lat': 61.2181, 'lng': -149.9003},
]

ALL_CITIES = NOLA_NEIGHBORHOODS + LOUISIANA_CITIES + EXPANSION_CITIES

# ══════════════════════════════════════════════════════════
# 1. NPI — MASSIVE practitioner scrape
# ══════════════════════════════════════════════════════════
ALL_SPECIALTIES = [
    'Chiropract','Internal Medicine','Family Medicine','Family Practice',
    'Psychiatry','Psychiatry & Neurology','Physical Therapy','Physical Therapist',
    'Nurse Practitioner','Licensed Clinical Social Worker','Social Worker',
    'Counselor','Professional Counselor','Mental Health','Psychology',
    'Clinical Psychology','Clinical Neuropsychologist','Behavioral Health',
    'General Dentistry','Orthodont','Periodon','Oral Surgery',
    'Optometry','Ophthalmology','Podiatry','Cardiology','Cardiovascular',
    'Gastroenterology','Endocrinology','Registered Dietitian','Nutritionist',
    'Sports Medicine','Dermatology','Neurology','Naturopath',
    'Acupunctur','Chinese Medicine','Pharmacist','Rheumatology',
    'Marriage and Family','Pulmonology','Pulmonary','Orthopedic','Orthopedic Surgery',
    'Oncology','Hematology','Oncology','Massage Therap','Massage Therapy',
    'Yoga Therap','Meditation','Holistic','Integrative Medicine',
    'Functional Medicine','Occupational Therapy','Occupational Therapist',
    'Speech Therap','Speech-Language','Midwi','Midwifery',
    'Addiction Medicine','Addiction','Pain Medicine','Pain Management',
    'Allergy','Allergy & Immunology','Immunology',
    'Emergency Medicine','General Practice','General Surgery',
    'Geriatric','Gerontology','Gynecology','Obstetrics',
    'OB/GYN','Infectious Disease','Nephrology','Urology',
    'Otolaryngology','ENT','Plastic Surgery','Radiology',
    'Anesthesiology','Pathology','Preventive Medicine',
    'Public Health','Rehabilitation','Sleep Medicine',
    'Vascular','Wound Care','Hospice','Palliative',
    'Pediatric','Neonatal','Physician Assistant',
    'Registered Nurse','Certified Nurse','Clinical Nurse',
    'Nurse Anesthetist','Nurse Midwife',
    'Audiologist','Hearing','Respiratory Therap',
    'Genetic Counselor','Dietetic Technician',
    'Athletic Trainer','Exercise Physiolog',
    'Art Therap','Music Therap','Dance Therap','Recreation Therap',
    'Behavioral Analyst','Applied Behavior',
    'Optician','Dental Hygienist','Dental Assistant',
    'Medical Assistant','Surgical Technolog',
    'Radiologic Technolog','Nuclear Medicine',
    'Electrodiagnostic','Perfusionist',
]

def run_npi(cities=None):
    target = cities or ALL_CITIES
    print(f'\n🏥 NPI REGISTRY — {len(target)} cities × {len(ALL_SPECIALTIES)} specialties')
    rows = []
    seen = set()

    for ci, city_info in enumerate(target):
        city = city_info['city']
        state = city_info['state']
        log(f'📍 [{ci+1}/{len(target)}] {city}, {state}...')
        city_count = 0

        for spec in ALL_SPECIALTIES:
            url = f'https://npiregistry.cms.hhs.gov/api/?version=2.1&city={quote(city)}&state={state}&taxonomy_description={quote(spec)}&limit=200'
            data = fetch_json(url)
            if not data or 'results' not in data:
                continue

            for r in data['results']:
                npi = str(r.get('number', ''))
                if not npi or npi in seen:
                    continue
                seen.add(npi)

                basic = r.get('basic', {})
                addrs = r.get('addresses', [{}])
                prac = addrs[0] if addrs else {}
                for a in addrs:
                    if a.get('address_purpose') == 'LOCATION':
                        prac = a
                        break

                tax = r.get('taxonomies', [{}])
                ptax = tax[0] if tax else {}
                for t in tax:
                    if t.get('primary'):
                        ptax = t
                        break

                first = basic.get('first_name', '')
                last = basic.get('last_name', '')
                org = basic.get('organization_name', '')
                name = f"{first} {last}".strip() if first else org
                cred = basic.get('credential', '')
                if cred and name:
                    name = f"{name}, {cred}"

                rows.append({
                    'id': str(__import__('uuid').uuid5(__import__('uuid').NAMESPACE_DNS, npi)), 'npi': npi, 'full_name': name,
                    'provider_organization_name': org,
                    'specialty': ptax.get('desc', ''),
                    'taxonomy_description': ptax.get('desc', ''),
                    'taxonomy_code': ptax.get('code', ''),
                    'city': prac.get('city', city),
                    'state': prac.get('state', state),
                    'address': prac.get('address_1', ''),
                    'zip': prac.get('postal_code', '')[:5],
                    'phone': prac.get('telephone_number', ''),
                    'gender': basic.get('gender', ''),
                    'enumeration_date': basic.get('enumeration_date', ''),
                    'source': 'npi_registry',
                    'trust_score': 0
                })
                city_count += 1

            time.sleep(0.25)

        log(f'   → {city_count} practitioners')
        # Batch upsert every 5 cities
        if (ci + 1) % 5 == 0 and rows:
            stored = sb_upsert('practitioners', rows)
            log(f'   💾 Batch stored: {stored}')
            rows = []

    if rows:
        stored = sb_upsert('practitioners', rows)
    total = len(seen)
    log(f'✅ NPI COMPLETE: {total} unique practitioners')
    return total

# ══════════════════════════════════════════════════════════
# 2. FDA — DEEP supplement scrape
# ══════════════════════════════════════════════════════════
FDA_TERMS = [
    # Vitamins
    'vitamin+a','vitamin+b1','vitamin+b2','vitamin+b3','vitamin+b5','vitamin+b6',
    'vitamin+b7','vitamin+b9','vitamin+b12','vitamin+c','vitamin+d','vitamin+d3',
    'vitamin+e','vitamin+k','vitamin+k2','multivitamin','prenatal','postnatal',
    'children+vitamin','men+vitamin','women+vitamin','senior+vitamin',
    # Minerals
    'magnesium','magnesium+glycinate','magnesium+citrate','magnesium+threonate',
    'magnesium+oxide','magnesium+malate','zinc','zinc+picolinate','zinc+gluconate',
    'iron','iron+bisglycinate','calcium','calcium+citrate','calcium+carbonate',
    'potassium','selenium','chromium','iodine','manganese','molybdenum',
    'copper','boron','silica','lithium+orotate','vanadium','germanium',
    # Omega/Fats
    'omega+3','omega+3+6+9','fish+oil','krill+oil','cod+liver+oil',
    'flaxseed+oil','evening+primrose','borage+oil','black+seed+oil',
    'mct+oil','coconut+oil','hemp+seed+oil','chia+seed+oil',
    # Amino acids
    'l+theanine','l+glutamine','l+arginine','l+carnitine','l+tyrosine',
    'l+tryptophan','l+lysine','l+citrulline','l+ornithine','taurine',
    'glycine','nac','n+acetyl+cysteine','bcaa','eaa','glutathione',
    'collagen','collagen+peptides','marine+collagen','bone+broth+protein',
    # Adaptogens
    'ashwagandha','rhodiola','ginseng','panax+ginseng','siberian+ginseng',
    'holy+basil','tulsi','schisandra','astragalus','maca','maca+root',
    'shilajit','tongkat+ali','cordyceps','reishi','lion+mane',
    'chaga','turkey+tail','shiitake','maitake','agaricus',
    # Probiotics/Gut
    'probiotic','probiotics','lactobacillus','bifidobacterium','saccharomyces',
    'spore+probiotic','soil+based+probiotic','prebiotic','postbiotic',
    'digestive+enzyme','betaine+hcl','ox+bile','pancreatin',
    'psyllium','fiber','inulin','fos','apple+cider+vinegar',
    # Herbs
    'turmeric','curcumin','ginger','garlic','oregano+oil',
    'elderberry','echinacea','goldenseal','cat+claw','olive+leaf',
    'berberine','milk+thistle','dandelion','artichoke+extract',
    'saw+palmetto','pygeum','nettle+root','black+cohosh',
    'vitex','dong+quai','red+clover','evening+primrose',
    'valerian','passionflower','lemon+balm','chamomile',
    'kava','st+john+wort','skullcap','magnolia+bark',
    'bacopa','gotu+kola','ginkgo+biloba','phosphatidylserine',
    'huperzine','vinpocetine','noopept','alpha+gpc',
    # Performance
    'creatine','creatine+monohydrate','beta+alanine','citrulline+malate',
    'whey+protein','casein+protein','pea+protein','rice+protein',
    'hemp+protein','egg+white+protein','beef+protein',
    'pre+workout','post+workout','electrolyte','hydration',
    'carnitine','coq10','ubiquinol','pqq','d+ribose',
    # Anti-aging
    'nmn','nad','nicotinamide+riboside','resveratrol','pterostilbene',
    'fisetin','quercetin','apigenin','luteolin','spermidine',
    'alpha+lipoic+acid','astaxanthin','zeaxanthin','lutein',
    'hyaluronic+acid','biotin','keratin','silica',
    # Specialty
    'cbd+oil','hemp+extract','cbg','cbn',
    'melatonin','5+htp','sam+e','dhea','pregnenolone',
    'dim','indole+3+carbinol','calcium+d+glucarate',
    'glucosamine','chondroitin','msm','hyaluronic',
    'serrapeptase','nattokinase','lumbrokinase','wobenzym',
    'chlorella','spirulina','moringa','wheat+grass',
    'barley+grass','chlorophyll','greens+powder',
    # Superfoods
    'acai','goji+berry','camu+camu','maqui+berry',
    'pomegranate','tart+cherry','blueberry+extract',
    'green+tea+extract','matcha','cacao','raw+cacao',
]

def run_fda():
    print(f'\n💊 FDA SUPPLEMENTS — {len(FDA_TERMS)} categories')
    rows = []
    seen = set()
    skip_words = set(['tablet','injection','cream','ointment','suppository','lotion',
        'shampoo','cleanser','antiseptic','bandage','condom','patch',
        'lidocaine','sildenafil','estradiol','levonorgestrel','dronabinol',
        'acetaminophen','ibuprofen','naproxen','aspirin','hydrocodone',
        'oxycodone','gabapentin','metformin','atorvastatin','amoxicillin',
        'prednisone','sertraline','fluoxetine','bupropion','lisinopril',
        'amlodipine','omeprazole','losartan','montelukast','metronidazole',
        'azithromycin','ciprofloxacin','clindamycin','nystatin','fluconazole',
        'hydrocortisone','triamcinolone','mupirocin','diphenhydramine',
        'cetirizine','guaifenesin','albuterol','insulin','warfarin',
        'heparin','morphine','fentanyl','diazepam','lorazepam',
        'clonazepam','amphetamine','methylphenidate','modafinil'])

    for ti, term in enumerate(FDA_TERMS):
        if ti % 20 == 0:
            log(f'FDA [{ti}/{len(FDA_TERMS)}] — {len(rows)} products so far')

        for endpoint in [
            f'https://api.fda.gov/drug/label.json?search=openfda.brand_name:"{term}"&limit=10',
            f'https://api.fda.gov/drug/label.json?search="{term}"+AND+openfda.route:"ORAL"&limit=5',
        ]:
            data = fetch_json(endpoint)
            if not data or 'results' not in data:
                continue
            for r in data['results']:
                openfda = r.get('openfda', {})
                name = (openfda.get('brand_name', ['']) or [''])[0]
                if not name:
                    name = (openfda.get('generic_name', ['']) or [''])[0]
                if not name:
                    continue

                nl = name.lower()
                if any(w in nl for w in skip_words):
                    continue

                pid = make_id(name)
                if pid in seen:
                    continue
                seen.add(pid)

                mfr = (openfda.get('manufacturer_name', ['']) or [''])[0]
                form = (openfda.get('dosage_form', ['']) or [''])[0]

                cat_map = {
                    'vitamin': 'Vitamins', 'magnesium': 'Minerals', 'zinc': 'Minerals',
                    'iron': 'Minerals', 'calcium': 'Minerals', 'omega': 'Essential Fats',
                    'fish': 'Essential Fats', 'probiotic': 'Gut Health', 'prebiotic': 'Gut Health',
                    'collagen': 'Beauty + Joints', 'ashwagandha': 'Adaptogens',
                    'turmeric': 'Anti-Inflammation', 'curcumin': 'Anti-Inflammation',
                    'melatonin': 'Sleep', 'theanine': 'Focus', 'creatine': 'Performance',
                    'protein': 'Performance', 'coq10': 'Heart + Energy', 'berberine': 'Metabolic',
                    'mushroom': 'Nootropics', 'lion': 'Nootropics', 'reishi': 'Adaptogens',
                    'electrolyte': 'Hydration', 'elderberry': 'Immunity', 'echinacea': 'Immunity',
                    'glucosamine': 'Joints', 'spirulina': 'Superfoods', 'cbd': 'Cannabis',
                    'nmn': 'Longevity', 'nad': 'Longevity', 'resveratrol': 'Longevity',
                    'rhodiola': 'Adaptogens', 'ginseng': 'Adaptogens', 'maca': 'Adaptogens',
                    'amino': 'Amino Acids', 'bcaa': 'Amino Acids', 'glutamine': 'Amino Acids',
                    'herb': 'Herbal', 'garlic': 'Herbal', 'ginger': 'Herbal',
                }
                category = 'Supplements'
                for k, v in cat_map.items():
                    if k in term.replace('+', ' ').lower():
                        category = v
                        break

                search_q = quote(name[:60])
                rows.append({
                    'id': pid, 'name': name[:200], 'brand_name': mfr[:200],
                    'manufacturer_name': mfr[:200], 'category': category,
                    'product_type': 'supplement', 'dosage_form': form,
                    'source': 'openfda',
                    'url_amazon': f'https://www.amazon.com/s?k={search_q}&tag={AMZ_TAG}',
                    'url_iherb': f'https://www.iherb.com/search?kw={search_q}&rcode={IHERB_CODE}',
                    'trust_score': 0
                })
        time.sleep(0.15)

    log(f'Total unique supplements: {len(rows)}')
    stored = sb_upsert('products', rows)
    log(f'✅ FDA: {stored} supplements stored')
    return stored

# ══════════════════════════════════════════════════════════
# 3. PUBMED — DEEP research
# ══════════════════════════════════════════════════════════
RESEARCH_TOPICS = [
    # Sleep
    'magnesium sleep quality randomized','melatonin insomnia efficacy','valerian root sleep',
    'l-theanine sleep anxiety','glycine sleep quality','tart cherry melatonin sleep',
    'ashwagandha sleep quality','CBD insomnia','lavender essential oil sleep',
    'GABA supplement sleep','passionflower insomnia','chamomile sleep',
    'sleep deprivation cognitive function','blue light melatonin','sleep hygiene interventions',
    # Immunity
    'vitamin D immune function meta-analysis','zinc common cold duration','vitamin C immune response',
    'elderberry influenza','echinacea upper respiratory','probiotics immune modulation',
    'beta glucan immune','astragalus immunity','quercetin antiviral',
    'selenium immune function','garlic antimicrobial','oregano oil antimicrobial',
    'mushroom beta glucan immune','vitamin A mucosal immunity','lactoferrin immunity',
    # Heart
    'omega-3 cardiovascular outcomes trial','CoQ10 heart failure','magnesium blood pressure',
    'garlic extract cardiovascular','nattokinase fibrinolysis','berberine cholesterol',
    'red yeast rice statin','plant sterols cholesterol','hawthorn heart failure',
    'vitamin K2 arterial calcification','policosanol cholesterol','niacin cardiovascular',
    'pomegranate arterial health','beetroot nitric oxide blood pressure',
    # Brain
    'lion mane mushroom neurogenesis','bacopa monnieri memory','ginkgo biloba cognitive',
    'phosphatidylserine memory','omega-3 DHA brain','curcumin cognitive decline',
    'creatine cognitive function','caffeine neuroprotective','blueberry cognitive',
    'alpha-GPC acetylcholine','citicoline cognitive','lithium neuroprotection',
    'exercise neuroplasticity','meditation brain structure','intermittent fasting BDNF',
    # Gut
    'probiotics gut microbiome meta-analysis','prebiotics gut health','fermented foods microbiome',
    'butyrate gut barrier','glutamine intestinal permeability','digestive enzyme efficacy',
    'psyllium fiber cholesterol','inulin prebiotic','bone broth gut health',
    'apple cider vinegar digestion','aloe vera gut','marshmallow root gut',
    'gut brain axis serotonin','microbiome mental health','fecal transplant review',
    # Inflammation
    'turmeric curcumin anti-inflammatory trial','omega-3 inflammation markers',
    'boswellia joint inflammation','ginger anti-inflammatory','spirulina inflammation',
    'green tea EGCG inflammation','resveratrol NF-kB','sulforaphane Nrf2',
    'black seed oil inflammation','willow bark pain','devil claw arthritis',
    'tart cherry gout inflammation','bromelain inflammation','serrapeptase inflammation',
    # Longevity
    'NMN NAD+ aging human','resveratrol longevity sirtuin','fisetin senolytic',
    'spermidine autophagy','rapamycin aging','metformin aging TAME trial',
    'caloric restriction longevity','intermittent fasting longevity','telomere length lifestyle',
    'NAD+ precursor aging','pterostilbene aging','senolytics clinical trial',
    'exercise telomere length','meditation telomere','social connection mortality',
    # Stress
    'ashwagandha cortisol randomized','rhodiola rosea fatigue','holy basil adaptogen',
    'phosphatidylserine cortisol','lemon balm anxiety','kava anxiety meta-analysis',
    'magnesium anxiety','l-theanine stress','CBD anxiety disorder',
    'mindfulness based stress reduction','yoga cortisol','forest bathing cortisol',
    # Metabolic
    'berberine type 2 diabetes','chromium insulin sensitivity','cinnamon blood sugar',
    'alpha lipoic acid neuropathy','bitter melon glucose','fenugreek diabetes',
    'apple cider vinegar glycemic','gymnema sylvestre sugar','inositol PCOS',
    'magnesium insulin resistance','vanadium glucose metabolism','white kidney bean carb blocker',
    # Women
    'iron deficiency women fatigue','folate pregnancy outcomes','vitamin D pregnancy',
    'omega-3 prenatal DHA','chaste tree PMS','black cohosh menopause',
    'evening primrose PMS','red raspberry leaf labor','dong quai menstrual',
    'myo-inositol PCOS','DIM estrogen metabolism','calcium d-glucarate estrogen',
    # Men
    'saw palmetto BPH','tongkat ali testosterone','fenugreek testosterone',
    'ashwagandha testosterone','zinc testosterone','boron testosterone',
    'DHEA aging men','pygeum prostate','beta sitosterol prostate',
    # Performance
    'creatine monohydrate strength meta-analysis','beta-alanine endurance','citrulline malate performance',
    'caffeine exercise performance','beet root juice VO2max','sodium bicarbonate performance',
    'HMB muscle preservation','whey protein muscle synthesis','collagen tendon recovery',
    'tart cherry recovery exercise','electrolyte hydration exercise','carnitine fat oxidation',
    # Drug interactions
    'CYP450 herb drug interaction','St John wort drug interactions','grapefruit drug metabolism',
    'CBD drug interaction cytochrome','turmeric drug interaction warfarin','omega-3 anticoagulant interaction',
    'garlic supplement bleeding risk','ginkgo biloba drug interaction','valerian sedative interaction',
    'supplement pharmaceutical interaction review','polypharmacy elderly supplements',
    # Environmental health
    'air pollution cognitive decline','water quality health outcomes','urban green space mental health',
    'noise pollution cardiovascular','microplastics health effects','EMF health effects review',
    'mold exposure health','lead exposure cognitive','PFAS health effects',
    # Sauna/cold
    'sauna cardiovascular outcomes','cold water immersion inflammation','heat shock protein sauna',
    'cryotherapy recovery','contrast therapy','infrared sauna detoxification',
    # Breathwork
    'Wim Hof method immune','box breathing anxiety','pranayama autonomic nervous system',
    'diaphragmatic breathing stress','holotropic breathwork','vagus nerve stimulation breathing',
]

def run_pubmed():
    print(f'\n📚 PUBMED — {len(RESEARCH_TOPICS)} topics')
    rows = []
    seen = set()

    for ti, topic in enumerate(RESEARCH_TOPICS):
        if ti % 25 == 0:
            log(f'PubMed [{ti}/{len(RESEARCH_TOPICS)}] — {len(rows)} studies so far')

        # Try clinical trials first, then reviews
        for ptype in ['clinical+trial', 'review', 'meta-analysis']:
            search_url = f'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=5&sort=relevance&term={quote(topic)}+AND+{ptype}[pt]'
            data = fetch_json(search_url)
            if not data or 'esearchresult' not in data:
                continue
            ids = data['esearchresult'].get('idlist', [])
            if not ids:
                continue

            id_str = ','.join(ids)
            details = fetch_json(f'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id={id_str}')
            if not details or 'result' not in details:
                continue

            for pmid in ids:
                if pmid in seen:
                    continue
                seen.add(pmid)
                info = details['result'].get(pmid, {})
                if not info or isinstance(info, str):
                    continue
                title = info.get('title', '')
                if not title:
                    continue

                authors = info.get('authors', [])
                first_author = authors[0].get('name', '') if authors else ''
                journal = info.get('fulljournalname', info.get('source', ''))
                pubdate = info.get('pubdate', '')

                cat_map = {
                    'sleep': 'Sleep', 'immun': 'Immunity', 'cardiovascular': 'Heart',
                    'heart': 'Heart', 'brain': 'Brain', 'cognitive': 'Brain',
                    'neuro': 'Brain', 'gut': 'Gut Health', 'microbiome': 'Gut Health',
                    'inflammat': 'Inflammation', 'aging': 'Longevity', 'longevity': 'Longevity',
                    'senolyti': 'Longevity', 'telomere': 'Longevity', 'NAD': 'Longevity',
                    'stress': 'Stress', 'cortisol': 'Stress', 'anxiety': 'Mental Health',
                    'depress': 'Mental Health', 'diabetes': 'Metabolic', 'insulin': 'Metabolic',
                    'blood sugar': 'Metabolic', 'women': "Women's Health", 'pregnancy': "Women's Health",
                    'menopause': "Women's Health", 'PMS': "Women's Health", 'PCOS': "Women's Health",
                    'testosterone': "Men's Health", 'prostate': "Men's Health",
                    'exercise': 'Performance', 'muscle': 'Performance', 'creatine': 'Performance',
                    'drug interact': 'Safety', 'CYP450': 'Safety', 'air pollution': 'Environment',
                    'water quality': 'Environment', 'sauna': 'Recovery', 'cold': 'Recovery',
                    'breath': 'Breathwork', 'meditation': 'Mindfulness',
                }
                category = 'Wellness Research'
                for k, v in cat_map.items():
                    if k.lower() in topic.lower():
                        category = v
                        break

                rows.append({
                    'id': str(__import__('uuid').uuid5(__import__('uuid').NAMESPACE_DNS, pmid)), 'pmid': pmid, 'title': title[:500],
                    'authors': first_author, 'journal': journal,
                    'year': pubdate[:4], 'pub_date': pubdate,
                    'category': category, 'search_topic': topic,
                    'url': f'https://pubmed.ncbi.nlm.nih.gov/{pmid}/',
                    'source': 'pubmed', 'trust_score': 0
                })

            if ids:
                break  # Got results, skip other publication types
        time.sleep(0.35)

    # Batch store
    log(f'Total unique studies: {len(rows)}')
    stored = sb_upsert('pubmed_studies', rows)
    log(f'✅ PubMed: {stored} studies stored')
    return stored

# ══════════════════════════════════════════════════════════
# 4. YOUTUBE — MASSIVE video library
# ══════════════════════════════════════════════════════════
YT_SEARCHES = [
    # Top educators
    'Andrew Huberman sleep protocol','Andrew Huberman dopamine','Andrew Huberman supplements',
    'Peter Attia longevity','Peter Attia exercise','Peter Attia sleep',
    'Rhonda Patrick vitamin D','Rhonda Patrick omega 3','Rhonda Patrick sauna',
    'Mark Hyman functional medicine','Mark Hyman sugar','Mark Hyman gut health',
    'Bryan Johnson blueprint protocol','Bryan Johnson anti aging','Bryan Johnson supplements',
    'Thomas DeLauer intermittent fasting','Thomas DeLauer supplements',
    'Dr Berg keto','Dr Berg insulin resistance','Dr Berg vitamins',
    'Layne Norton protein','Jeff Nippard creatine','Athlean-X mobility',
    'Dr Rangan Chatterjee stress','Dr Mindy Pelz fasting women',
    'Ben Greenfield biohacking','Dr Jason Fung fasting','Rich Roll plant based',
    # Topics
    'best supplements 2025 science','vitamin D deficiency symptoms fix',
    'magnesium glycinate vs citrate','omega 3 brain health','ashwagandha cortisol science',
    'gut health heal naturally','creatine benefits not just muscle','intermittent fasting science',
    'cold plunge ice bath benefits science','meditation neuroscience how',
    'how to reduce inflammation naturally','longevity supplements that actually work',
    'drug interactions supplements danger','CBD oil science what works',
    'turmeric curcumin how to absorb','zinc immune system dosage',
    'collagen supplements do they actually work','berberine metformin natural alternative',
    'lion mane mushroom brain benefits','NAD NMN anti aging science',
    'sauna health benefits how often','breathwork vagus nerve activate',
    'best morning routine backed by science','sleep optimization complete guide',
    'stress management techniques that work','exercise for mental health depression',
    'gut brain connection explained simply','hormone optimization men naturally',
    'hormone optimization women naturally','liver detox what actually works',
    'autoimmune protocol what to eat','inflammation blood test markers',
    'methylation MTHFR explained','histamine intolerance supplements',
    'leaky gut syndrome heal','SIBO treatment natural','candida protocol',
    'adrenal fatigue recovery','thyroid natural support','cortisol lowering techniques',
    'testosterone natural boost proven','estrogen dominance fix','progesterone balance',
    'weight loss science what works','metabolic health markers','insulin resistance fix',
    'heart rate variability improve','nervous system regulation','polyvagal theory explained',
    'trauma stored in body','somatic experiencing','EMDR therapy explained',
    'new orleans wellness','new orleans health food','new orleans yoga',
    'black health disparities solutions','health equity wellness','food desert solutions',
    'community health outcomes','social determinants health','neighborhood wellness score',
    'wellness industry truth','supplement industry scams avoid','FDA supplement regulation',
    'functional medicine vs conventional','integrative medicine explained',
    'chinese medicine acupuncture science','ayurveda modern science',
    'forest bathing shinrin yoku','grounding earthing science',
    'red light therapy benefits','infrared sauna vs traditional',
    'peptides health benefits','rapamycin longevity','metformin anti aging',
    'ozempic weight loss science','GLP-1 agonist natural','berberine vs metformin',
]

def run_youtube():
    if not YT_KEY:
        log('⚠ No YouTube API key')
        return 0
    print(f'\n🎥 YOUTUBE — {len(YT_SEARCHES)} searches')
    rows = []
    seen = set()

    for si, query in enumerate(YT_SEARCHES):
        if si % 15 == 0:
            log(f'YouTube [{si}/{len(YT_SEARCHES)}] — {len(rows)} videos so far')

        url = f'https://www.googleapis.com/youtube/v3/search?part=snippet&q={quote(query)}&type=video&maxResults=5&relevanceLanguage=en&key={YT_KEY}'
        data = fetch_json(url)
        if not data or 'items' not in data:
            time.sleep(0.5)
            continue

        vids = [i['id']['videoId'] for i in data['items'] if i.get('id', {}).get('videoId')]
        if not vids:
            continue

        # Get stats
        stats_url = f'https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id={",".join(vids)}&key={YT_KEY}'
        stats = fetch_json(stats_url)
        if stats and 'items' in stats:
            for v in stats['items']:
                vid = v['id']
                if vid in seen:
                    continue
                seen.add(vid)
                s = v.get('snippet', {})
                st = v.get('statistics', {})
                rows.append({
                    'id': str(__import__('uuid').uuid5(__import__('uuid').NAMESPACE_DNS, vid)), 'video_id': vid, 'title': s.get('title', '')[:300],
                    'channel_name': s.get('channelTitle', ''),
                    'channel_id': s.get('channelId', ''),
                    'description': s.get('description', '')[:1000],
                    'published_at': s.get('publishedAt', ''),
                    'thumbnail_url': s.get('thumbnails', {}).get('high', {}).get('url', ''),
                    'view_count': int(st.get('viewCount', 0)),
                    'like_count': int(st.get('likeCount', 0)),
                    'comment_count': int(st.get('commentCount', 0)),
                    'search_topic': query,
                    'url': f'https://www.youtube.com/watch?v={vid}',
                    'source': 'youtube_api', 'trust_score': 0
                })
        time.sleep(0.3)

    log(f'Total unique videos: {len(rows)}')
    stored = sb_upsert('youtube_videos', rows)
    log(f'✅ YouTube: {stored} videos stored')
    return stored

# ══════════════════════════════════════════════════════════
# 5. GOOGLE PLACES — Wellness businesses
# ══════════════════════════════════════════════════════════
PLACE_TYPES = [
    'wellness center','yoga studio','meditation center','acupuncture',
    'chiropractor','naturopath','massage therapist','fitness gym',
    'health food store','organic grocery','juice bar','smoothie bar',
    'spa','float tank','cryotherapy','sauna','pilates studio',
    'martial arts','crossfit','physical therapy','mental health counselor',
    'holistic health','functional medicine','integrative medicine',
    'vitamin store','supplement store','herb shop','apothecary',
    'boxing gym','rock climbing gym','personal trainer',
    'acai bowl','vegan restaurant','farm to table restaurant',
    'farmers market','food co-op','natural grocery',
    'wellness retreat','meditation retreat',
]

def run_google(cities=None):
    if not GOOGLE_KEY:
        log('⚠ No Google API key')
        return 0
    target = cities or (NOLA_NEIGHBORHOODS + LOUISIANA_CITIES + EXPANSION_CITIES[:10])
    print(f'\n📍 GOOGLE PLACES — {len(target)} cities × {len(PLACE_TYPES)} types')
    rows = []
    seen = set()

    for ci, city_info in enumerate(target):
        city = city_info['city']
        log(f'📍 [{ci+1}/{len(target)}] {city}...')
        cc = 0
        for ptype in PLACE_TYPES:
            url = f'https://maps.googleapis.com/maps/api/place/textsearch/json?query={quote(ptype)}+in+{quote(city)}&key={GOOGLE_KEY}'
            data = fetch_json(url)
            if not data or 'results' not in data:
                continue
            for place in data['results']:
                pid = place.get('place_id', '')
                if not pid or pid in seen:
                    continue
                seen.add(pid)
                loc = place.get('geometry', {}).get('location', {})
                rows.append({
                    'id': make_id(pid), 'place_id': pid,
                    'name': place.get('name', '')[:200],
                    'address': place.get('formatted_address', ''),
                    'latitude': loc.get('lat', 0), 'longitude': loc.get('lng', 0),
                    'rating': place.get('rating', 0),
                    'total_ratings': place.get('user_ratings_total', 0),
                    'business_type': ptype, 'city': city,
                    'state': city_info['state'],
                    'is_open': place.get('business_status') == 'OPERATIONAL',
                    'source': 'google_places', 'trust_score': 0
                })
                cc += 1
            time.sleep(0.12)
        log(f'   → {cc} locations')
        if (ci + 1) % 5 == 0 and rows:
            sb_upsert('locations', rows)
            rows = []
    if rows:
        sb_upsert('locations', rows)
    total = len(seen)
    log(f'✅ Google Places: {total} locations stored')
    return total

# ══════════════════════════════════════════════════════════
# 6. CLINICAL TRIALS — Active wellness research
# ══════════════════════════════════════════════════════════
TRIAL_TOPICS = [
    'vitamin D supplementation','magnesium sleep','omega-3 depression',
    'probiotics gut health','turmeric inflammation','ashwagandha anxiety',
    'CBD pain','meditation stress','intermittent fasting','creatine cognitive',
    'lion mane mushroom','berberine diabetes','CoQ10 heart failure',
    'melatonin insomnia','collagen skin aging','NAD+ aging','resveratrol',
    'exercise mental health','yoga chronic pain','acupuncture pain',
    'ketogenic diet','gut microbiome immunity','sauna cardiovascular',
    'breathwork PTSD','psychedelic therapy depression','cold exposure',
    'GLP-1 obesity','ozempic weight','rapamycin aging',
    'fecal transplant','stem cell therapy','hyperbaric oxygen therapy',
    'red light therapy','psilocybin depression','MDMA PTSD',
    'ketamine depression','transcranial magnetic stimulation',
    'vagus nerve stimulation','neurofeedback ADHD',
    'mindfulness based cognitive therapy','acceptance commitment therapy',
    'dialectical behavior therapy','EMDR trauma',
    'functional medicine outcomes','integrative oncology',
    'traditional chinese medicine','ayurvedic medicine clinical',
    'cannabis pain management','CBD epilepsy','THC chronic pain',
    'psilocybin end of life anxiety','LSD microdosing',
]

def run_trials():
    print(f'\n🔬 CLINICAL TRIALS — {len(TRIAL_TOPICS)} topics')
    rows = []
    seen = set()
    for ti, topic in enumerate(TRIAL_TOPICS):
        if ti % 10 == 0:
            log(f'Trials [{ti}/{len(TRIAL_TOPICS)}]')
        for status in ['RECRUITING', 'ACTIVE_NOT_RECRUITING']:
            url = f'https://clinicaltrials.gov/api/v2/studies?query.term={quote(topic)}&filter.overallStatus={status}&pageSize=10&format=json'
            data = fetch_json(url)
            if not data or 'studies' not in data:
                continue
            for study in data['studies']:
                proto = study.get('protocolSection', {})
                ident = proto.get('identificationModule', {})
                nct = ident.get('nctId', '')
                if not nct or nct in seen:
                    continue
                seen.add(nct)
                sm = proto.get('statusModule', {})
                dm = proto.get('designModule', {})
                desc = proto.get('descriptionModule', {})
                clm = proto.get('contactsLocationsModule', {})
                locs = clm.get('locations', [])
                loc_str = f"{locs[0].get('city','')}, {locs[0].get('state','')}" if locs else ''
                rows.append({
                    'id': str(__import__('uuid').uuid5(__import__('uuid').NAMESPACE_DNS, nct)), 'nct_id': nct,
                    'title': ident.get('officialTitle', ident.get('briefTitle', ''))[:500],
                    'brief_title': ident.get('briefTitle', '')[:300],
                    'status': sm.get('overallStatus', ''),
                    'phase': str(dm.get('phases', [''])),
                    'summary': desc.get('briefSummary', '')[:1000],
                    'location': loc_str,
                    'enrollment': dm.get('enrollmentInfo', {}).get('count', 0),
                    'start_date': sm.get('startDateStruct', {}).get('date', ''),
                    'search_topic': topic,
                    'url': f'https://clinicaltrials.gov/study/{nct}',
                    'source': 'clinicaltrials_gov', 'trust_score': 0
                })
        time.sleep(0.3)
    stored = sb_upsert('clinical_trials', rows)
    log(f'✅ ClinicalTrials: {stored} trials stored')
    return stored

# ══════════════════════════════════════════════════════════
# 7. EVENTS
# ══════════════════════════════════════════════════════════
def run_events():
    print('\n🎪 EVENTS')
    rows = []
    seen = set()
    event_types = ['yoga','meditation','wellness workshop','fitness class','health expo',
        'sound bath','breathwork','nutrition workshop','cooking class healthy',
        'mindfulness','tai chi','qigong','running club','hiking group',
        'dance fitness','boxing fitness','cycling','swimming','rock climbing',
        'martial arts','self defense','retreat','plant medicine','sound healing',
        'reiki','energy healing','crystal healing','aromatherapy','herbalism',
        'fermentation class','meal prep','juice cleanse','detox retreat']

    for city_info in ALL_CITIES[:25]:
        for etype in event_types:
            eid = make_id(f'{etype}-{city_info["city"]}')
            if eid in seen:
                continue
            seen.add(eid)
            rows.append({
                'id': str(__import__('uuid').uuid5(__import__('uuid').NAMESPACE_DNS, eid)),
                'title': f'{etype.title()} in {city_info["city"]}',
                'description': f'Find {etype} events and classes near you',
                'category': etype.split()[0].title(),
                'city': city_info['city'],
                'source': 'eventbrite',
                'url': f'https://www.eventbrite.com/d/{city_info["state"].lower()}--{quote(city_info["city"].lower().replace(" ","-"))}/{quote(etype.replace(" ","-"))}/',
                'trust_score': 0
            })
    stored = sb_upsert('events', rows)
    log(f'✅ Events: {stored} stored')
    return stored

# ══════════════════════════════════════════════════════════
# 8. CURATED BLEU PICKS — 50 real products
# ══════════════════════════════════════════════════════════
def run_curated():
    print('\n🔥 CURATED BLEU PICKS — 50 Products')
    products = [
        {'n':'Vitamin D3+K2 5000IU','b':'Sports Research','c':'Immunity + Energy','s':94,'a':'B00TGMNNZ4','i':'vitamin+d3+k2','sh':'Nutrition'},
        {'n':'Magnesium Glycinate 400mg','b':'NOW Foods','c':'Sleep + Recovery','s':94,'a':'B000OQ2DL4','i':'magnesium+glycinate','sh':'Sleep'},
        {'n':'Ultimate Omega 1280mg','b':'Nordic Naturals','c':'Heart + Brain','s':95,'a':'B002CQU564','i':'nordic+naturals+omega','sh':'Nutrition'},
        {'n':'Ashwagandha KSM-66 600mg','b':'Jarrow Formulas','c':'Stress + Cortisol','s':91,'a':'B0BXMVW1HN','i':'ashwagandha+ksm+66','sh':'Mindset'},
        {'n':'Creatine Monohydrate','b':'Thorne','c':'Energy + Cognition','s':97,'a':'B07L5NRVQX','i':'thorne+creatine','sh':'Movement'},
        {'n':'L-Theanine 200mg','b':'NOW Foods','c':'Focus + Calm','s':89,'a':'B000H7P9M0','i':'l-theanine+200mg','sh':'Mindset'},
        {'n':'Probiotics 50 Billion','b':'Garden of Life','c':'Gut + Mood','s':90,'a':'B010OIFN48','i':'garden+of+life+probiotics','sh':'Nutrition'},
        {'n':'LMNT Electrolyte Mix','b':'LMNT','c':'Hydration + Recovery','s':93,'a':'B08GRP7WYQ','i':'electrolyte+mix','sh':'Recovery'},
        {'n':'CoQ10 200mg Ubiquinol','b':'Jarrow Formulas','c':'Heart + Mitochondria','s':88,'a':'B0013OQGO2','i':'coq10+ubiquinol','sh':'Recovery'},
        {'n':'Zinc Picolinate 50mg','b':'Thorne','c':'Immunity + Skin','s':86,'a':'B000KHPMXE','i':'zinc+picolinate','sh':'Nutrition'},
        {'n':'Berberine 500mg','b':'Thorne','c':'Metabolic + Blood Sugar','s':87,'a':'B09G981PYB','i':'berberine+500','sh':'Nutrition'},
        {'n':'Lions Mane 1000mg','b':'Host Defense','c':'Brain + Nerve','s':85,'a':'B00BBYB5HI','i':'lion+mane+mushroom','sh':'Mindset'},
        {'n':'Curcumin Phytosome','b':'Thorne','c':'Inflammation + Joints','s':90,'a':'B0797JK6BN','i':'curcumin+phytosome','sh':'Recovery'},
        {'n':'B-Complex #12','b':'Thorne','c':'Energy + Methylation','s':88,'a':'B002RL8FBU','i':'thorne+b+complex','sh':'Nutrition'},
        {'n':'Collagen Peptides','b':'Vital Proteins','c':'Skin + Joints + Gut','s':84,'a':'B00NLR1PX0','i':'collagen+peptides','sh':'Recovery'},
        {'n':'AG1 Greens Powder','b':'Athletic Greens','c':'Daily Foundation','s':82,'a':'B09P5GX46N','i':'greens+powder','sh':'Nutrition'},
        {'n':'Rhodiola Rosea 500mg','b':'NOW Foods','c':'Energy + Endurance','s':83,'a':'B001CZSG4Q','i':'rhodiola+rosea','sh':'Mindset'},
        {'n':'NAC 600mg','b':'NOW Foods','c':'Detox + Lungs','s':86,'a':'B00H9WNMAK','i':'nac+600','sh':'Recovery'},
        {'n':'Glucosamine Chondroitin','b':'NOW Foods','c':'Joint Support','s':81,'a':'B0013OVZJG','i':'glucosamine+chondroitin','sh':'Movement'},
        {'n':'Elderberry Extract','b':'Natures Way','c':'Immunity + Antiviral','s':80,'a':'B004AIRMRC','i':'elderberry+extract','sh':'Nutrition'},
        {'n':'Melatonin 3mg','b':'NOW Foods','c':'Sleep Onset','s':79,'a':'B003KLRB2A','i':'melatonin+3mg','sh':'Sleep'},
        {'n':'Reishi Mushroom','b':'Host Defense','c':'Immunity + Sleep','s':83,'a':'B00BBYB62E','i':'reishi+mushroom','sh':'Sleep'},
        {'n':'Psyllium Husk Powder','b':'NOW Foods','c':'Fiber + Gut','s':78,'a':'B002RWUNYM','i':'psyllium+husk','sh':'Nutrition'},
        {'n':'Alpha Lipoic Acid 600mg','b':'NOW Foods','c':'Antioxidant + Nerve','s':82,'a':'B0013OUBB0','i':'alpha+lipoic+acid','sh':'Recovery'},
        {'n':'Vitamin C 1000mg','b':'NOW Foods','c':'Immunity + Collagen','s':85,'a':'B0013HVHWM','i':'vitamin+c+1000','sh':'Nutrition'},
        {'n':'Selenium 200mcg','b':'NOW Foods','c':'Thyroid + Antioxidant','s':80,'a':'B0013OXFPA','i':'selenium+200mcg','sh':'Nutrition'},
        {'n':'Saw Palmetto 320mg','b':'NOW Foods','c':'Prostate Health','s':77,'a':'B0013OXEXW','i':'saw+palmetto','sh':'Recovery'},
        {'n':'Milk Thistle Extract','b':'NOW Foods','c':'Liver Support','s':81,'a':'B0013OVZLG','i':'milk+thistle','sh':'Recovery'},
        {'n':'GABA 500mg','b':'NOW Foods','c':'Calm + Sleep','s':78,'a':'B0013OVZAM','i':'gaba+500mg','sh':'Mindset'},
        {'n':'5-HTP 200mg','b':'NOW Foods','c':'Mood + Serotonin','s':80,'a':'B0013OXD38','i':'5-htp+200mg','sh':'Mindset'},
        {'n':'Cordyceps Mushroom','b':'Host Defense','c':'Energy + Stamina','s':82,'a':'B00BBYB5IA','i':'cordyceps+mushroom','sh':'Movement'},
        {'n':'Turkey Tail Mushroom','b':'Host Defense','c':'Immunity + Gut','s':81,'a':'B00GY9B550','i':'turkey+tail+mushroom','sh':'Nutrition'},
        {'n':'Chaga Mushroom','b':'Host Defense','c':'Antioxidant + Immunity','s':80,'a':'B00BBYB5IU','i':'chaga+mushroom','sh':'Nutrition'},
        {'n':'MCT Oil Powder','b':'Perfect Keto','c':'Energy + Brain','s':79,'a':'B07C3TPFYL','i':'mct+oil+powder','sh':'Mindset'},
        {'n':'Whey Protein Isolate','b':'Optimum Nutrition','c':'Muscle + Recovery','s':88,'a':'B000QSNYGI','i':'whey+protein+isolate','sh':'Movement'},
        {'n':'Pea Protein Powder','b':'NOW Foods','c':'Plant Performance','s':80,'a':'B003JEX3KA','i':'pea+protein','sh':'Movement'},
        {'n':'Bone Broth Protein','b':'Ancient Nutrition','c':'Gut + Joints','s':81,'a':'B01LNYNQ0A','i':'bone+broth+protein','sh':'Recovery'},
        {'n':'Fish Oil Triple Strength','b':'Nature Made','c':'Heart + Brain','s':86,'a':'B004U3Y9FU','i':'triple+strength+fish+oil','sh':'Nutrition'},
        {'n':'Vitamin B12 Methylcobalamin','b':'Jarrow Formulas','c':'Energy + Nerves','s':87,'a':'B0013OQBZQ','i':'methylcobalamin+b12','sh':'Nutrition'},
        {'n':'Iron Bisglycinate','b':'Thorne','c':'Energy + Blood','s':83,'a':'B000FGWFUS','i':'iron+bisglycinate','sh':'Nutrition'},
        {'n':'Folate 5-MTHF 1mg','b':'Thorne','c':'Methylation + Prenatal','s':85,'a':'B002RL8FCS','i':'5-mthf+folate','sh':'Nutrition'},
        {'n':'Biotin 10000mcg','b':'Sports Research','c':'Hair + Skin + Nails','s':77,'a':'B00JGCBGZQ','i':'biotin+10000','sh':'Recovery'},
        {'n':'Vitamin A 10000IU','b':'NOW Foods','c':'Vision + Immunity','s':78,'a':'B0019LTJ8S','i':'vitamin+a+10000','sh':'Nutrition'},
        {'n':'Vitamin E 400IU','b':'NOW Foods','c':'Antioxidant + Skin','s':76,'a':'B000MGS1L8','i':'vitamin+e+400','sh':'Nutrition'},
        {'n':'Potassium Citrate 99mg','b':'NOW Foods','c':'Heart + Muscle','s':75,'a':'B003JET232','i':'potassium+citrate','sh':'Nutrition'},
        {'n':'Boron 3mg','b':'NOW Foods','c':'Bones + Hormones','s':74,'a':'B005K8FXJG','i':'boron+3mg','sh':'Nutrition'},
        {'n':'DIM 200mg','b':'NOW Foods','c':'Estrogen Balance','s':79,'a':'B003KVKGOU','i':'dim+200mg','sh':'Recovery'},
        {'n':'Quercetin 500mg','b':'NOW Foods','c':'Allergy + Antioxidant','s':81,'a':'B0015HOGEG','i':'quercetin+500','sh':'Recovery'},
        {'n':'Resveratrol 200mg','b':'NOW Foods','c':'Longevity + Heart','s':80,'a':'B003VW0FAO','i':'resveratrol+200','sh':'Recovery'},
        {'n':'NMN 250mg','b':'ProHealth','c':'NAD+ Longevity','s':83,'a':'B08C5N7HBH','i':'nmn+250mg','sh':'Recovery'},
    ]

    rows = []
    for p in products:
        rows.append({
            'id': make_id(p['n']), 'name': p['n'], 'brand_name': p['b'],
            'category': p['c'], 'product_type': 'curated_pick',
            'dosage_form': 'Supplement', 'source': 'bleu_curated',
            'trust_score': p['s'],
            'url_amazon': f'https://www.amazon.com/dp/{p["a"]}?tag={AMZ_TAG}',
            'url_iherb': f'https://www.iherb.com/search?kw={p["i"]}&rcode={IHERB_CODE}',
            'shield_category': p['sh'], 'is_bleu_pick': True
        })
    stored = sb_upsert('products', rows)
    log(f'✅ Curated: {stored} BLEU Picks stored')
    return stored

# ══════════════════════════════════════════════════════════
# 9. EPA AIR QUALITY (FREE)
# ══════════════════════════════════════════════════════════
def run_environment():
    print('\n🌍 ENVIRONMENTAL DATA')
    rows = []
    # CDC PLACES — County health data
    log('Fetching CDC PLACES county health data...')
    states = ['LA','TX','FL','GA','TN','NC','NY','CA','IL','WA','OR','CO','AZ','MA','PA']
    for state in states:
        url = f'https://data.cdc.gov/resource/swc5-untb.json?stateabbr={state}&$limit=50'
        data = fetch_json(url)
        if data:
            for row in data:
                rid = make_id(f'{state}-{row.get("locationname","")}')
                rows.append({
                    'id': rid,
                    'location_name': row.get('locationname', ''),
                    'state': state,
                    'measure': row.get('measure', ''),
                    'data_value': row.get('data_value', ''),
                    'category': row.get('category', ''),
                    'year': row.get('year', ''),
                    'source': 'cdc_places',
                    'trust_score': 0
                })
        time.sleep(0.3)
    log(f'CDC data: {len(rows)} records')
    # Store in a general data table or events
    if rows:
        sb_upsert('events', [{'id': r['id'], 'title': f'{r["measure"]} - {r["location_name"]}',
            'description': f'{r["data_value"]}', 'category': 'Health Data',
            'city': r['location_name'], 'source': 'cdc_places', 'trust_score': 0} for r in rows[:200]])
    log(f'✅ Environment: {len(rows)} records')
    return len(rows)

# ══════════════════════════════════════════════════════════
# STATUS
# ══════════════════════════════════════════════════════════
def show_status():
    print('\n' + '═' * 55)
    print('  📊 BLEU DATA TANK STATUS')
    print('═' * 55)
    tables = ['practitioners', 'products', 'youtube_videos', 'pubmed_studies',
              'locations', 'events', 'clinical_trials']
    total = 0
    for t in tables:
        c = sb_count(t)
        total += c
        bar = '█' * min(c // 50, 30)
        s = '✅' if c > 0 else '❌'
        print(f'  {s} {t:20s} {c:>7,}  {bar}')
    print(f'\n  🏆 TOTAL: {total:,} records')
    print('═' * 55)

# ══════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════
def main():
    parser = argparse.ArgumentParser(description='BLEU Tank Filler v3')
    parser.add_argument('--all', action='store_true')
    parser.add_argument('--nola', action='store_true')
    parser.add_argument('--source', type=str)
    parser.add_argument('--status', action='store_true')
    args = parser.parse_args()

    print('╔══════════════════════════════════════════════════╗')
    print('║   BLEU TANK FILLER v3 — 18-Hour Data Engine      ║')
    print('║   Every API. Every City. Every Tab.               ║')
    print('╚══════════════════════════════════════════════════╝')
    print(f'  Supabase: {SB_URL[:45]}')
    print(f'  Google:   {"✅" if GOOGLE_KEY else "❌ SET GOOGLE_PLACES_KEY"}')
    print(f'  YouTube:  {"✅" if YT_KEY else "❌ SET YOUTUBE_API_KEY"}')
    print(f'  Time:     {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')

    if args.status:
        show_status()
        return

    sources = {
        'npi': lambda: run_npi(),
        'nola': lambda: run_npi(NOLA_NEIGHBORHOODS),
        'fda': run_fda,
        'pubmed': run_pubmed,
        'youtube': run_youtube,
        'google': lambda: run_google(),
        'trials': run_trials,
        'events': run_events,
        'curated': run_curated,
        'environment': run_environment,
    }

    if args.source:
        if args.source in sources:
            sources[args.source]()
            show_status()
        else:
            print(f'Unknown: {args.source}. Options: {", ".join(sources.keys())}')
    elif args.nola:
        print('\n🎺 NOLA DEEP FILL MODE')
        run_npi(NOLA_NEIGHBORHOODS)
        run_google(NOLA_NEIGHBORHOODS)
        run_curated()
        run_fda()
        run_pubmed()
        run_youtube()
        run_events()
        run_trials()
        run_environment()
        show_status()
    elif args.all:
        print('\n🚀 FULL TANK FILL — ALL SOURCES, ALL CITIES\n')
        start = time.time()
        results = {}
        order = ['curated','npi','fda','pubmed','youtube','google','trials','events','environment']
        for name in order:
            try:
                count = sources[name]()
                results[name] = count
                elapsed = (time.time() - start) / 60
                log(f'⏱ {elapsed:.1f} min elapsed — {TOTAL_STORED:,} total stored')
            except Exception as e:
                print(f'\n  ❌ {name} failed: {e}')
                import traceback
                traceback.print_exc()
                results[name] = 0

        elapsed = (time.time() - start) / 60
        print('\n' + '═' * 55)
        print(f'  🏁 COMPLETE — {elapsed:.1f} minutes')
        print('═' * 55)
        for name, count in results.items():
            print(f'  {"✅" if count else "⚠"} {name:15s} → {count:>7,}')
        print(f'\n  🏆 TOTAL NEW: {TOTAL_STORED:,}')
        show_status()
    else:
        print('\nUsage:')
        print('  python tank-filler.py --all           # Everything (1-2 hours)')
        print('  python tank-filler.py --nola          # NOLA deep fill first')
        print('  python tank-filler.py --source npi    # Just practitioners')
        print('  python tank-filler.py --status        # Show counts')
        print(f'\nSources: {", ".join(sources.keys())}')

if __name__ == '__main__':
    main()
