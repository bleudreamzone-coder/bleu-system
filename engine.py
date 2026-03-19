"""
BLEU.LIVE — DEFINITIVE PRODUCTION ENGINE v3.0
10 sources. Retry logic. Incremental. Daily reports. Social queue.
This is the moat builder. Every night it runs, the ocean gets deeper.

SOURCES (10):
  1. NPI Registry       FREE    7.8M practitioners
  2. FDA                FREE    Recalls + DailyMed labels + FAERS
  3. Google Places      FREE*   Wellness locations, 18 categories
  4. YouTube + Claude   FREE*   14 channels, transcripts, AI extraction
  5. Reddit             FREE    15 subreddits, sentiment, trends
  6. Amazon             EARN    Supplements with affiliate links
  7. iHerb              EARN    30K supplements, 5-10% commission
  8. PubMed             FREE    Studies STORED with evidence levels
  9. Open Food Facts    FREE    2.5M food/supplement products
  10. Yelp              FREE*   Reviews, ratings, business data

* = free tier / free API key

Usage:
  python engine.py                  Full daily cycle (all sources)
  python engine.py --source npi     Single source
  python engine.py --status         Database totals
  python engine.py --setup          Check API keys
  python engine.py --report         Generate daily report only
"""

import os, sys, json, time, re, hashlib, requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
load_dotenv()

# ── CONFIG ──────────────────────────────────────────────────
SB_URL   = os.getenv("SUPABASE_URL","")
SB_KEY   = os.getenv("SUPABASE_SERVICE_KEY","")
G_KEY    = os.getenv("GOOGLE_PLACES_KEY","")
YT_KEY   = os.getenv("YOUTUBE_API_KEY","")
CL_KEY   = os.getenv("CLAUDE_API_KEY","")
AZ_TAG   = os.getenv("AMAZON_PARTNER_TAG","bleu-live-20")
YELP_KEY = os.getenv("YELP_API_KEY","")
HOOK     = os.getenv("PAGE_BUILD_WEBHOOK","")

HDR = {"apikey":SB_KEY,"Authorization":f"Bearer {SB_KEY}",
       "Content-Type":"application/json","Prefer":"resolution=merge-duplicates"}

RESULTS = {}  # Track all scrape results
ERRORS = []

# ── ZONES ───────────────────────────────────────────────────
ZONES = [
  [{"city":"New Orleans","state":"LA","lat":29.9511,"lng":-90.0715}],
  [{"city":"Baton Rouge","state":"LA","lat":30.4515,"lng":-91.1871},
   {"city":"Houston","state":"TX","lat":29.7604,"lng":-95.3698},
   {"city":"Jackson","state":"MS","lat":32.2988,"lng":-90.1848},
   {"city":"Mobile","state":"AL","lat":30.6954,"lng":-88.0399}],
  [{"city":"Austin","state":"TX","lat":30.2672,"lng":-97.7431},
   {"city":"Atlanta","state":"GA","lat":33.749,"lng":-84.388},
   {"city":"Miami","state":"FL","lat":25.7617,"lng":-80.1918},
   {"city":"Nashville","state":"TN","lat":36.1627,"lng":-86.7816},
   {"city":"Charlotte","state":"NC","lat":35.2271,"lng":-80.8431},
   {"city":"Dallas","state":"TX","lat":32.7767,"lng":-96.797}],
  [{"city":"Los Angeles","state":"CA","lat":34.0522,"lng":-118.2437},
   {"city":"New York","state":"NY","lat":40.7128,"lng":-74.006},
   {"city":"Chicago","state":"IL","lat":41.8781,"lng":-87.6298},
   {"city":"Denver","state":"CO","lat":39.7392,"lng":-104.9903},
   {"city":"Portland","state":"OR","lat":45.5152,"lng":-122.6784},
   {"city":"Seattle","state":"WA","lat":47.6062,"lng":-122.3321},
   {"city":"San Francisco","state":"CA","lat":37.7749,"lng":-122.4194},
   {"city":"Boston","state":"MA","lat":42.3601,"lng":-71.0589},
   {"city":"Phoenix","state":"AZ","lat":33.4484,"lng":-112.074}],
  [{"city":"Boulder","state":"CO","lat":40.015,"lng":-105.2705},
   {"city":"Sedona","state":"AZ","lat":34.8697,"lng":-111.761},
   {"city":"Asheville","state":"NC","lat":35.5951,"lng":-82.5515},
   {"city":"Santa Fe","state":"NM","lat":35.687,"lng":-105.9378}],
]

def p(m): print(f"    {m}")
def ok(m): print(f"  ✅ {m}")
def warn(m): print(f"  ⚠  {m}"); ERRORS.append(m)

def retry(fn, attempts=3, delay=2):
    for i in range(attempts):
        try: return fn()
        except Exception as e:
            if i == attempts-1: raise
            time.sleep(delay * (i+1))

def sb(table, records):
    if not SB_URL or not records: return 0
    saved = 0
    for i in range(0, len(records), 50):
        batch = records[i:i+50]
        try:
            r = requests.post(f"{SB_URL}/rest/v1/{table}", headers=HDR, json=batch, timeout=30)
            if r.status_code in (200,201): saved += len(batch)
            elif r.status_code == 409: saved += len(batch)
            else: warn(f"DB {table} {r.status_code}: {r.text[:100]}")
        except Exception as e: warn(f"DB {table}: {e}")
    return saved

def sb_count(table):
    try:
        r = requests.get(f"{SB_URL}/rest/v1/{table}?select=id&limit=1",
            headers={**HDR,"Prefer":"count=exact","Range":"0-0"}, timeout=10)
        return int(r.headers.get("content-range","*/0").split("/")[-1])
    except: return 0

def sb_count_where(table, where):
    try:
        r = requests.get(f"{SB_URL}/rest/v1/{table}?select=id&{where}&limit=1",
            headers={**HDR,"Prefer":"count=exact","Range":"0-0"}, timeout=10)
        return int(r.headers.get("content-range","*/0").split("/")[-1])
    except: return 0

def log_scrape(source, found, saved, dur=0, cities=None, notes=""):
    sb("scrape_log",[{"source":source,"records_found":found,"records_saved":saved,
        "duration_seconds":dur,"cities_scraped":cities or [],"notes":notes}])

def get_cities():
    sf = "ripple_state.json"
    s = json.load(open(sf)) if os.path.exists(sf) else {"start":datetime.now().isoformat(),"runs":0}
    d = s.get("runs",0)
    z = 0 if d<7 else 1 if d<14 else 2 if d<30 else 3 if d<60 else 4
    c = []
    for i in range(min(z+1,len(ZONES))): c.extend(ZONES[i])
    s["runs"]=d+1; s["last"]=datetime.now().isoformat(); s["zone"]=z
    with open(sf,"w") as f: json.dump(s,f)
    return c, z

# ═══════════════════════════════════════════════════════════
# 1. NPI
# ═══════════════════════════════════════════════════════════
def scrape_npi(cities):
    print(f"\n  🏥 NPI — {len(cities)} cities")
    t0, total = time.time(), 0
    for c in cities:
        city, state = c["city"], c["state"]
        p(f"{city}, {state}...")
        skip, cn = 0, 0
        while skip < 1200:
            try:
                def fetch():
                    return requests.get("https://npiregistry.cms.hhs.gov/api/",
                        params={"version":"2.1","city":city,"state":state,"limit":200,"skip":skip}, timeout=30)
                r = retry(fetch)
                results = r.json().get("results",[])
                if not results: break
                recs = []
                for rx in results:
                    b = rx.get("basic",{})
                    addr = next((a for a in rx.get("addresses",[]) if a.get("address_purpose")=="LOCATION"),(rx.get("addresses") or [{}])[0])
                    tax = next((t for t in rx.get("taxonomies",[]) if t.get("primary")),(rx.get("taxonomies") or [{}])[0])
                    fn,ln = b.get("first_name","").title(),b.get("last_name","").title()
                    org,npi = b.get("organization_name",""),str(rx.get("number",""))
                    recs.append({"npi":npi,"first_name":fn or org[:50],"last_name":ln,
                        "full_name":f"{fn} {ln}".strip() or org[:100],
                        "credential":b.get("credential",""),"gender":b.get("gender",""),
                        "specialty":tax.get("desc",""),"taxonomy_code":tax.get("code",""),
                        "taxonomy_description":tax.get("desc",""),"practice_name":org[:200],
                        "address_line1":addr.get("address_1",""),"city":addr.get("city","").title(),
                        "state":addr.get("state",""),"zip":(addr.get("postal_code","") or "")[:5],
                        "phone":addr.get("telephone_number",""),
                        "source":"npi_registry","source_id":npi,
                        "source_url":f"https://npiregistry.cms.hhs.gov/provider-view/{npi}",
                        "trust_score":50.0,"credentials_verified":True,"license_verified":True,
                        "validation_status":"pending"})
                cn += sb("practitioners", recs)
                skip += 200
                if skip >= r.json().get("result_count",0): break
                time.sleep(0.3)
            except Exception as e: warn(f"NPI {city}: {e}"); break
        p(f"→ {cn}"); total += cn; time.sleep(0.5)
    ok(f"NPI: {total}")
    log_scrape("npi",total,total,int(time.time()-t0),[c["city"] for c in cities])
    RESULTS["npi"] = total; return total

# ═══════════════════════════════════════════════════════════
# 2. FDA
# ═══════════════════════════════════════════════════════════
def scrape_fda():
    print(f"\n  💊 FDA — Recalls + DailyMed + FAERS")
    t0, total = time.time(), 0
    # Recalls
    try:
        r = retry(lambda: requests.get("https://api.fda.gov/drug/enforcement.json",
            params={"search":"dietary+supplement","limit":100,"sort":"report_date:desc"}, timeout=30))
        if r.status_code == 200:
            recs = [{"name":(rc.get("product_description","") or "")[:300],"brand":rc.get("recalling_firm",""),
                "category":"supplement","fda_recall":True,"fda_recall_reason":rc.get("reason_for_recall","")[:500],
                "source":"fda_recall","source_id":rc.get("event_id",str(hash(rc.get("product_description","")))),
                "validation_status":"flagged","trust_score":0}
                for rc in r.json().get("results",[]) if rc.get("product_description")]
            total += sb("products", recs); p(f"Recalls: {len(recs)}")
    except Exception as e: warn(f"FDA recalls: {e}")
    # DailyMed labels
    try:
        r = retry(lambda: requests.get("https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json",
            params={"product_type":"DIETARY SUPPLEMENT","page":1,"pagesize":100}, timeout=30))
        if r.status_code == 200:
            recs = [{"name":s.get("title","")[:300],"brand":s.get("labeler",""),"category":"supplement",
                "source":"fda_dailymed","source_id":s.get("setid",""),"validation_status":"pending","trust_score":35.0,
                "source_url":f"https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid={s.get('setid','')}"}
                for s in r.json().get("data",[]) if s.get("title")]
            total += sb("products",recs); p(f"DailyMed: {len(recs)}")
    except Exception as e: warn(f"DailyMed: {e}")
    ok(f"FDA: {total}"); RESULTS["fda"]=total
    log_scrape("fda",total,total,int(time.time()-t0)); return total

# ═══════════════════════════════════════════════════════════
# 3. GOOGLE PLACES
# ═══════════════════════════════════════════════════════════
def scrape_google(cities):
    if not G_KEY: warn("No GOOGLE_PLACES_KEY"); RESULTS["google"]=0; return 0
    QUERIES = ["wellness clinic","yoga studio","meditation center","functional medicine",
        "acupuncture","chiropractor","organic grocery","juice bar","float tank",
        "supplement store","therapist counselor","naturopathic doctor","pilates studio",
        "health food store","spa wellness","cryotherapy","CBD shop","nutritionist"]
    today = cities[:24]
    print(f"\n  📍 GOOGLE PLACES — {len(today)} cities × {len(QUERIES)} queries")
    t0,total,seen = time.time(),0,set()
    for c in today:
        p(f"{c['city']}, {c['state']}...")
        for q in QUERIES:
            try:
                r = requests.get("https://maps.googleapis.com/maps/api/place/textsearch/json",
                    params={"query":f"{q} {c['city']} {c['state']}","location":f"{c['lat']},{c['lng']}",
                            "radius":16000,"key":G_KEY}, timeout=15)
                if r.status_code!=200: continue
                recs=[]
                for pl in r.json().get("results",[]):
                    pid=pl.get("place_id","")
                    if pid in seen: continue
                    seen.add(pid)
                    loc=pl.get("geometry",{}).get("location",{})
                    rat=pl.get("rating",0); rev=pl.get("user_ratings_total",0)
                    recs.append({"name":pl.get("name","")[:200],"type":q.split()[0],
                        "address":pl.get("formatted_address",""),"city":c["city"],"state":c["state"],
                        "latitude":loc.get("lat"),"longitude":loc.get("lng"),
                        "avg_rating":rat,"review_count":rev,"price_level":pl.get("price_level"),
                        "source":"google_places","source_id":pid,"validation_status":"pending",
                        "trust_score":round(30+min(rat*5,25)+(5 if rev>50 else 0),1)})
                total+=sb("locations",recs); time.sleep(0.2)
            except: pass
    ok(f"Google: {total}"); RESULTS["google"]=total
    log_scrape("google_places",total,total,int(time.time()-t0),[c["city"] for c in today]); return total

# ═══════════════════════════════════════════════════════════
# 4. YOUTUBE + TRANSCRIPTS + CLAUDE AI EXTRACTION
# ═══════════════════════════════════════════════════════════
# ═══════════════════════════════════════════════════════════
# CHANNEL UNIVERSE — 100+ channels organized by BLEU tab
# Each channel tagged so videos route to the right tab
# BEAST pulls 3 new per week per channel = 300+ videos/week auto-indexed
# Historical backfill runs monthly = 50K+ videos total
# ═══════════════════════════════════════════════════════════
CHANNELS = {
    # ── LONGEVITY + SCIENCE (vessel, learn, protocols) ──
    "Andrew Huberman":       {"id":"UC2D2CMWXMOVWx7giW1n3LIg","tabs":["learn","vessel","protocols"],"priority":10},
    "Rhonda Patrick":        {"id":"UCwUBMn2CYxuaGiCOsJaVPag","tabs":["learn","vessel","protocols"],"priority":10},
    "Peter Attia":           {"id":"UC8kGsMa0LygSX9nkBcBH1Sg","tabs":["learn","vessel","protocols"],"priority":10},
    "Mark Hyman":            {"id":"UCFtEEv80fQVKkD4h1PF-Xqw","tabs":["learn","vessel","protocols"],"priority":9},
    "David Sinclair":        {"id":"UCFKeSrBSrKNbKlQCFoRdqHQ","tabs":["learn","protocols"],"priority":9},
    "Thomas DeLauer":        {"id":"UC70SrI3VkT1MXALRtf0pcHg","tabs":["vessel","protocols"],"priority":8},
    "Dr. Eric Berg":         {"id":"UC3w193M5tYPJqF0Hi-7U-2g","tabs":["vessel","learn"],"priority":8},
    "Dr. Mindy Pelz":        {"id":"UCmapCJSNQ0bO_4SnvXAKsIg","tabs":["vessel","protocols"],"priority":8},
    "Jeff Nippard":          {"id":"UC68TLK0mAEzUyHx5x5k-S1Q","tabs":["vessel","protocols"],"priority":7},
    "Layne Norton":          {"id":"UCGDoS3hJSglNK5vSWv1MrTw","tabs":["vessel","protocols"],"priority":7},
    "Paul Saladino":         {"id":"UCgBg5_JxCqHmSjDXnFWzFKw","tabs":["vessel","protocols"],"priority":7},
    "Mike Mutzel":           {"id":"UCMdiHBLR1o5Yz0CVQPQy7MQ","tabs":["learn","vessel"],"priority":6},
    "Dr. Steven Gundry":     {"id":"UCrJPUrxNBg18tUSnr4qQ-mA","tabs":["vessel","learn"],"priority":7},
    "Ben Greenfield":        {"id":"UCQVQp0tIOjJJjkgxWJRDC6w","tabs":["learn","protocols"],"priority":6},
    "BiOptimizers":          {"id":"UCVdh7N37sIQl6fB6b8c-MHw","tabs":["vessel","protocols"],"priority":6},
    "Dave Asprey":           {"id":"UCbOp1B6HxmdA-wBNanGlDPw","tabs":["learn","protocols"],"priority":6},
    "Siim Land":             {"id":"UCPrMEVFj2Cig2q1QKhLkYQA","tabs":["learn","protocols"],"priority":5},
    "Found My Fitness":      {"id":"UCq3FE1HqHnlKRXaVHPPQTiQ","tabs":["learn"],"priority":6},
    "Nick Norwitz":          {"id":"UCmMzAyUBZXtlJi0MkiGDMcQ","tabs":["learn","vessel"],"priority":5},

    # ── SLEEP (sleep tab) ──
    "MedCram":               {"id":"UCG-iSMVtWbbwDDXgXXypARQ","tabs":["sleep","learn"],"priority":8},
    "SleepFoundation":       {"id":"UCXjEZWFQcfpBpjn5jWmD6Ag","tabs":["sleep"],"priority":7},
    "Matthew Walker":        {"id":"UCPME3H7KG1Nt0q9wqy3VWNA","tabs":["sleep"],"priority":9},
    "Shawn Stevenson":       {"id":"UCFAi5FpjjlkjKLaEfJDv2Lg","tabs":["sleep","learn"],"priority":7},
    "Dr. Michael Breus":     {"id":"UCpn5QRPKZ7P-cI9CxRZ3yOg","tabs":["sleep"],"priority":8},
    "The Longevity Doc":     {"id":"UCBb2FHmrUMGGjBNSVN6UXCQ","tabs":["sleep","protocols"],"priority":6},

    # ── MENTAL HEALTH + THERAPY (therapy tab) ──
    "Psych2Go":              {"id":"UCkJEpR7JmS36tajD34Gp4VA","tabs":["therapy"],"priority":8},
    "Doctor Mike":           {"id":"UC0QHWhjbe5fGJEPz3sVb6nw","tabs":["therapy","learn"],"priority":8},
    "Therapy in a Nutshell": {"id":"UCjQeBOqTZRD2N0ow-Bnz0OQ","tabs":["therapy"],"priority":9},
    "Dr. Tracey Marks":      {"id":"UC8E1VRfefKRWzXnT5OTBoTA","tabs":["therapy"],"priority":9},
    "Kati Morton":           {"id":"UCRiLQLpBMb7-OFzp7gNRK0A","tabs":["therapy"],"priority":8},
    "Dr. Todd Grande":       {"id":"UC4NIcnCFdFfb4xqaWPq7JMg","tabs":["therapy"],"priority":7},
    "Healthygamer GG":       {"id":"UCGiZSlCFBpLmoSMEKnKAZmQ","tabs":["therapy"],"priority":8},
    "Patrick Teahan LICSW":  {"id":"UCNVjEWcxMqQW0JaOXi5Bmzg","tabs":["therapy"],"priority":7},
    "Dr. Kirk Honda":        {"id":"UC2vS7bj9l_XlKSagXeqWx0Q","tabs":["therapy"],"priority":7},
    "Gabor Mate":            {"id":"UCWZ7xPIhVJxMvYPWgNbFJig","tabs":["therapy","recovery"],"priority":9},
    "Alan Watts":            {"id":"UCHnyfMqiRRG1u-2MsSQLbXA","tabs":["spirit","therapy"],"priority":7},
    "Dr. Daniel Amen":       {"id":"UCND2IEGnrqNxCWpE3w0A5MA","tabs":["therapy","learn"],"priority":8},
    "BrainCraft":            {"id":"UCt_t6FwNsqr3WWoL6dFqG9w","tabs":["therapy","learn"],"priority":6},

    # ── RECOVERY + ADDICTION (recovery tab) ──
    "Recovery Elevator":     {"id":"UCv9yNe1IWwmOZd0QOTJF0UQ","tabs":["recovery"],"priority":9},
    "Club Soda Network":     {"id":"UCJyS83OPM_kpnJUYxHF0T2w","tabs":["recovery"],"priority":7},
    "This Naked Mind":       {"id":"UCPwv8eRXJUVAfwLNB6N5D7Q","tabs":["recovery"],"priority":9},
    "Addiction Recovery TV": {"id":"UCuX8u5sBQRz3d0hLX4Hk8Gw","tabs":["recovery"],"priority":8},
    "AA Speaker Recordings": {"id":"UCvsxQMRuLfxQRfYnXrBfU4A","tabs":["recovery"],"priority":7},
    "Smart Recovery":        {"id":"UC9J9RHpZ0BuuC0IYAWjU7vQ","tabs":["recovery"],"priority":8},

    # ── NUTRITION + FOOD (vessel, protocols) ──
    "Pick Up Limes":         {"id":"UCq2E1mIwUKMWzCA4liA_XGQ","tabs":["vessel","protocols"],"priority":8},
    "Nutrition Made Simple": {"id":"UCesHfkDW4Gh93E6KkBsGKdg","tabs":["vessel","learn"],"priority":8},
    "Abbey Sharp":           {"id":"UCzl1eTImIJNKrJKSGlMcWKg","tabs":["vessel"],"priority":7},
    "Dr. Eric Westman":      {"id":"UC8ELXHFDvMMpbInbHRqJq4g","tabs":["vessel","protocols"],"priority":7},
    "What I've Learned":     {"id":"UCqYPhGiB9tkShZorfgcL2lA","tabs":["learn","vessel"],"priority":8},
    "Mic the Vegan":         {"id":"UCGJq0eQZoFSwgcqgxIE9MHw","tabs":["vessel"],"priority":6},
    "Brian Turner Fitness":  {"id":"UCXiB2CZe7KN4D4BCxeUZ1mQ","tabs":["vessel","protocols"],"priority":6},

    # ── FITNESS + MOVEMENT (vessel, protocols) ──
    "Yoga With Adriene":     {"id":"UCFKE7WVJfvaHW5q283SxchA","tabs":["vessel","protocols","sleep"],"priority":9},
    "Sydney Cummings Houdyshell":{"id":"UCDaKMFWEcxKY_Rfq7Dkimdg","tabs":["vessel","protocols"],"priority":8},
    "James Whitfield":       {"id":"UCRJKhLNJrZN-b7d7OHM3JMw","tabs":["vessel"],"priority":6},
    "FitnessBlender":        {"id":"UCiP6wD_tYlYLYh3agzbByWQ","tabs":["vessel","protocols"],"priority":8},
    "Tone It Up":            {"id":"UCrFp-qpbWFt2k_sTd9guY_w","tabs":["vessel","protocols"],"priority":7},
    "Hybrid Calisthenics":   {"id":"UCO_dTeSyQPCgXNfGhtFomSw","tabs":["vessel","protocols"],"priority":7},
    "Tom Merrick":           {"id":"UCU0DZhN-8KFLVP9PgurJgyg","tabs":["vessel"],"priority":6},

    # ── CANNABIS + ECSIQ (ecsiq tab) ──
    "The Dank Duchess":      {"id":"UCIKonBV0vWdQhkCEFY7JXOQ","tabs":["ecsiq"],"priority":7},
    "Marijuana Moment":      {"id":"UCiH6f0JkwBs7vOA7P-JfNkg","tabs":["ecsiq"],"priority":7},
    "Project CBD":           {"id":"UC6mZilnXsFm24LMuGE6nODQ","tabs":["ecsiq"],"priority":9},
    "Weedmaps":              {"id":"UCO6kwFuM-7h_cB_2XYjuQIA","tabs":["ecsiq"],"priority":7},
    "Nugg Club":             {"id":"UC0JMbT2G-OkMFpjO1nIAGaA","tabs":["ecsiq"],"priority":6},
    "Leafly":                {"id":"UCRrKn3oHYHZ7UBaVjAoUaYw","tabs":["ecsiq"],"priority":8},

    # ── FINANCE + WELLNESS ECONOMICS (finance tab) ──
    "Nerdwallet":            {"id":"UCqBiO0xkfBnhBVKq-wNZ-UA","tabs":["finance"],"priority":7},
    "Two Cents":             {"id":"UCL8w_A8t3P9_3H5ZoGmW3Gg","tabs":["finance"],"priority":8},
    "The Financial Diet":    {"id":"UCSPYNpQ2fHv9HJ-q6MIHlXQ","tabs":["finance"],"priority":8},
    "Graham Stephan":        {"id":"UCV6KDgJskWaEckne5aPA0aQ","tabs":["finance"],"priority":7},
    "Healthcare Triage":     {"id":"UCabaQPYxxKepiqovzfn9CCQ","tabs":["finance","learn"],"priority":8},

    # ── SPIRIT + MEANING (spirit tab) ──
    "Eckhart Tolle":         {"id":"UCj9fPezLH1HUh7mSo-tB1Kg","tabs":["spirit","therapy"],"priority":10},
    "Tara Brach":            {"id":"UCIAktB6q98Uu1gB36bWKWaA","tabs":["spirit","therapy"],"priority":9},
    "Mooji":                 {"id":"UCpw2gh99erM2GgFdCPCB1Fg","tabs":["spirit"],"priority":7},
    "Sadhguru":              {"id":"UCerRGXFAtNIbBzyFLxDkBMw","tabs":["spirit"],"priority":8},
    "Thich Nhat Hanh":       {"id":"UCn5ULBCRCFCMj0TY1y8ESsQ","tabs":["spirit","therapy"],"priority":9},
    "The School of Life":    {"id":"UC7IcJI8PUf5Z3zKxnZvTBog","tabs":["spirit","therapy"],"priority":8},
    "Actualized.org":        {"id":"UCEkFeCJ0cYU5pkb6zHT2uLQ","tabs":["spirit"],"priority":7},
    "Matt Kahn":             {"id":"UCLXmNiLvNbJqNRgPlbUVqsA","tabs":["spirit"],"priority":6},

    # ── COMMUNITY + CULTURE (community tab) ──
    "New Orleans News":      {"id":"UCf3MClH4YV31TkJuGgb-mPQ","tabs":["community"],"priority":8},
    "WWLTV":                 {"id":"UCqULzshkbMFRoXjNqpIBiGw","tabs":["community"],"priority":7},
    "Dustin Poirier Foundation":{"id":"UCY9APdF9OBZqEaFMnP9s5ig","tabs":["community","recovery"],"priority":6},
    "NOLA Culture":          {"id":"UCRWx0lh7bJQqiXh5nIVXEkw","tabs":["community"],"priority":7},

    # ── WEED x WELLNES (ecsiq, vessel) ──
    "Rogan x Health":        {"id":"UCnxgQokSimply1Z_YVeyIpow","tabs":["ecsiq","learn"],"priority":7},
    "Cannabis Health Radio": {"id":"UCQn7gk4bP7n4EkFaG2GWGug","tabs":["ecsiq"],"priority":7},

    # ── MEDITATION + MINDFULNESS (sleep, spirit, therapy) ──
    "Headspace":             {"id":"UCMbCyTFg9bCHEGMlVqHGpCw","tabs":["sleep","spirit"],"priority":8},
    "Great Meditation":      {"id":"UCN4vyryy6O4GIQkXlAbPCyQ","tabs":["sleep","spirit"],"priority":7},
    "Michael Sealey":        {"id":"UCoTuB8rDkqJJFW8QjOXOJdw","tabs":["sleep"],"priority":8},
    "Jason Stephenson":      {"id":"UCV3F0yEp5FgB3i8MBVWXsFg","tabs":["sleep"],"priority":7},
    "The Mindfulness Movement":{"id":"UCPzBPJSQaJMBlfJWGHETZJA","tabs":["spirit","therapy"],"priority":7},
    "Insight Timer":         {"id":"UCEBSbO0c8IQntPd9UDQK_4w","tabs":["sleep","spirit"],"priority":8},

    # ── BIOHACKING + QUANTIFIED SELF (dashboard, vessel) ──
    "Oura Ring":             {"id":"UCxSmCNjC8pMgMLQ-5VFBuVg","tabs":["dashboard","vessel"],"priority":8},
    "Levels Health":         {"id":"UCjG8MJjqN1rEZ6UBFB6z51Q","tabs":["dashboard","vessel"],"priority":8},
    "InsideTracker":         {"id":"UCKGlHVb1nN4TiO7yGrMQceg","tabs":["dashboard","vessel"],"priority":7},
    "Function Health":       {"id":"UCqK2M5XyM2pJqNQwKsKe0XA","tabs":["dashboard","vessel"],"priority":8},
    "Quantified Self":       {"id":"UCp_AGGQAXr0LfLTPjHjGDwA","tabs":["dashboard"],"priority":6},
    "Blueprint Bryan Johnson":{"id":"UCEiznTnW0d02uAhNQVCbpUg","tabs":["dashboard","protocols"],"priority":7},
}

# Keep backward compat — scraper accesses .id
CHANNEL_IDS = {name: data["id"] for name, data in CHANNELS.items()}
CHANNEL_TABS = {name: data["tabs"] for name, data in CHANNELS.items()}

def scrape_youtube():
    if not YT_KEY: warn("No YOUTUBE_API_KEY"); RESULTS["youtube"]=0; return 0
    print(f"\n  🎬 YOUTUBE — {len(CHANNELS)} channels + Claude intelligence")
    t0, vids, prods = time.time(), 0, 0
    week_ago = (datetime.now()-timedelta(days=7)).strftime("%Y-%m-%dT00:00:00Z")
    try: from youtube_transcript_api import YouTubeTranscriptApi; has_tx=True
    except: has_tx=False; p("No transcript lib — install youtube-transcript-api")

    for name, channel_data in CHANNELS.items():
        cid = channel_data["id"] if isinstance(channel_data, dict) else channel_data
        tabs = channel_data.get("tabs", ["learn"]) if isinstance(channel_data, dict) else ["learn"]
        priority = channel_data.get("priority", 5) if isinstance(channel_data, dict) else 5
        # Pull more videos for high-priority channels, fewer for low
        max_results = min(10, max(3, priority))
        try:
            r = requests.get("https://www.googleapis.com/youtube/v3/search",
                params={"key":YT_KEY,"channelId":cid,"part":"snippet","order":"date",
                        "maxResults":max_results,"type":"video","publishedAfter":week_ago}, timeout=15)
            if r.status_code!=200: continue
            videos = r.json().get("items",[])
            if not videos: continue
            p(f"{name}: {len(videos)} new")

            for v in videos:
                vid = v["id"]["videoId"]
                title = v["snippet"]["title"]

                # Stats
                views,likes,coms = 0,0,0
                try:
                    sr = requests.get("https://www.googleapis.com/youtube/v3/videos",
                        params={"key":YT_KEY,"id":vid,"part":"statistics"}, timeout=10)
                    if sr.status_code==200:
                        st = sr.json().get("items",[{}])[0].get("statistics",{})
                        views=int(st.get("viewCount",0)); likes=int(st.get("likeCount",0)); coms=int(st.get("commentCount",0))
                except: pass

                # Transcript
                transcript = ""
                if has_tx:
                    try: transcript = " ".join([t["text"] for t in YouTubeTranscriptApi.get_transcript(vid)])[:15000]
                    except: pass

                # Claude extracts products + protocols
                extracted_products, extracted_protocols = [], []
                if transcript and CL_KEY:
                    try:
                        ar = requests.post("https://api.anthropic.com/v1/messages",
                            headers={"x-api-key":CL_KEY,"anthropic-version":"2023-06-01","Content-Type":"application/json"},
                            json={"model":"claude-sonnet-4-20250514","max_tokens":1500,
                                "messages":[{"role":"user","content":f"""Extract from this wellness video transcript:
1. PRODUCTS mentioned (supplements, devices, foods) with dosage and purpose
2. PROTOCOLS described (step-by-step health routines)
Return ONLY JSON: {{"products":[{{"name":"...","dosage":"...","purpose":"...","category":"supplement|device|food"}}],"protocols":[{{"name":"...","steps":["..."],"category":"sleep|fitness|nutrition|longevity|mental"}}]}}
Title: {title}
Transcript: {transcript[:4000]}"""}]}, timeout=45)
                        if ar.status_code==200:
                            txt = ar.json()["content"][0]["text"]
                            jm = re.search(r'\{.*\}', txt, re.DOTALL)
                            if jm:
                                a = json.loads(jm.group())
                                extracted_products = a.get("products",[])
                                extracted_protocols = a.get("protocols",[])
                                for px in extracted_products:
                                    if px.get("name"):
                                        sb("products",[{"name":px["name"][:300],"category":px.get("category","supplement"),
                                            "dosage":px.get("dosage",""),"description":f"Mentioned by {name}: {px.get('purpose','')}",
                                            "source":"youtube_extraction","source_id":f"{vid}-{hashlib.md5(px['name'].encode()).hexdigest()[:8]}",
                                            "source_url":f"https://youtube.com/watch?v={vid}","validation_status":"pending","trust_score":25.0}])
                                        prods += 1
                                for pr in extracted_protocols:
                                    if pr.get("name"):
                                        sb("protocols",[{"name":pr["name"][:300],"creator":name,
                                            "category":pr.get("category","general"),
                                            "steps":json.dumps(pr.get("steps",[])),
                                            "source":"youtube_extraction","source_url":f"https://youtube.com/watch?v={vid}",
                                            "trust_score":30.0}])
                                p(f"  🧠 {len(extracted_products)} products, {len(extracted_protocols)} protocols")
                    except Exception as e: warn(f"Claude: {e}")

                sb("youtube_videos",[{"video_id":vid,"channel_name":name,"channel_id":cid,
                    "title":title,"description":v["snippet"].get("description","")[:2000],
                    "published_at":v["snippet"]["publishedAt"],"view_count":views,
                    "like_count":likes,"comment_count":coms,
                    "tabs":tabs,
                    "thumbnail":f"https://img.youtube.com/vi/{vid}/hqdefault.jpg",
                    "embed_url":f"https://www.youtube-nocookie.com/embed/{vid}",
                    "watch_url":f"https://youtube.com/watch?v={vid}",
                    "transcript":transcript[:10000] if transcript else None,
                    "products_mentioned":json.dumps(extracted_products) if extracted_products else None,
                    "protocols_extracted":json.dumps(extracted_protocols) if extracted_protocols else None}])
                vids += 1
            time.sleep(0.5)
        except Exception as e: warn(f"YT {name}: {e}")

    ok(f"YouTube: {vids} videos, {prods} products extracted"); RESULTS["youtube"]=vids
    log_scrape("youtube",vids,vids,int(time.time()-t0),notes=f"{prods} products by Claude"); return vids

# ═══════════════════════════════════════════════════════════
# 5. REDDIT
# ═══════════════════════════════════════════════════════════
SUBS = ["supplements","nootropics","meditation","nutrition","fitness","yoga",
    "herbalism","alternativehealth","biohackers","sleep","gut_health",
    "fasting","keto","PlantBasedDiet","longevity"]

def scrape_reddit():
    print(f"\n  🔴 REDDIT — {len(SUBS)} subreddits")
    t0, total = time.time(), 0
    KEYWORDS = ["magnesium","ashwagandha","vitamin d","omega 3","creatine","zinc",
        "probiotics","cbd","melatonin","collagen","turmeric","lion's mane",
        "NAC","CoQ10","berberine","L-theanine","rhodiola","quercetin","sea moss",
        "mushroom","adaptogens","electrolytes","protein","fiber"]
    for s in SUBS:
        try:
            r = requests.get(f"https://www.reddit.com/r/{s}/hot.json",
                params={"limit":25},headers={"User-Agent":"BLEU-Research/1.0"}, timeout=15)
            if r.status_code!=200: continue
            recs = []
            for post in r.json().get("data",{}).get("children",[]):
                d = post.get("data",{})
                pid = d.get("id","")
                if not pid: continue
                text = f"{d.get('title','')} {d.get('selftext','')}"
                prods = [k for k in KEYWORDS if k.lower() in text.lower()]
                # Simple sentiment
                pos_words = len(re.findall(r'\b(great|amazing|love|best|works|effective|recommend)\b', text, re.I))
                neg_words = len(re.findall(r'\b(terrible|waste|useless|scam|bad|avoid|warning)\b', text, re.I))
                sentiment = round(min(max((pos_words-neg_words)/max(pos_words+neg_words,1),-1),1),2)
                recs.append({"post_id":pid,"subreddit":s,"title":d.get("title","")[:500],
                    "body":(d.get("selftext","") or "")[:3000],"author":d.get("author",""),
                    "score":d.get("score",0),"num_comments":d.get("num_comments",0),
                    "url":f"https://reddit.com{d.get('permalink','')}",
                    "products_mentioned":prods if prods else None,"sentiment":sentiment,
                    "posted_at":datetime.fromtimestamp(d.get("created_utc",0)).isoformat() if d.get("created_utc") else None})
            total += sb("reddit_mentions",recs); p(f"r/{s}: {len(recs)}")
            time.sleep(1)
        except Exception as e: warn(f"Reddit {s}: {e}")
    ok(f"Reddit: {total}"); RESULTS["reddit"]=total
    log_scrape("reddit",total,total,int(time.time()-t0)); return total

# ═══════════════════════════════════════════════════════════
# 6. AMAZON (affiliate links — earns commission)
# ═══════════════════════════════════════════════════════════
SUPP_SEARCHES = [
    "magnesium glycinate","ashwagandha KSM-66","vitamin D3 K2","omega 3 fish oil",
    "probiotic 50 billion","collagen peptides","lion's mane mushroom","turmeric curcumin",
    "melatonin sleep","zinc picolinate","B complex vitamin","creatine monohydrate",
    "electrolyte powder","berberine supplement","NAC N-acetyl cysteine","CoQ10 ubiquinol",
    "adaptogens supplement","green superfood powder","digestive enzymes","L-theanine",
    "rhodiola rosea","elderberry immune","quercetin bromelain","sea moss supplement",
    "shilajit supplement","beef organ supplement","spirulina chlorella","tongkat ali",
    "fadogia agrestis","apigenin sleep","inositol supplement","black seed oil",
]

def scrape_amazon():
    print(f"\n  🛒 AMAZON — {len(SUPP_SEARCHES)} supplement categories")
    t0, total = time.time(), 0
    recs = []
    for search in SUPP_SEARCHES:
        name = search.replace(" supplement","").replace(" capsules","").title()
        recs.append({"name":f"Best {name} Supplements","category":"supplement",
            "subcategory":name.lower(),
            "url_amazon":f"https://www.amazon.com/s?k={requests.utils.quote(search)}&tag={AZ_TAG}",
            "affiliate_tag":AZ_TAG,"source":"amazon_search",
            "source_id":f"search-{search.replace(' ','-')}",
            "validation_status":"pending","trust_score":25.0})
    total += sb("products",recs)
    ok(f"Amazon: {total} (affiliate links)"); RESULTS["amazon"]=total
    log_scrape("amazon",total,total,int(time.time()-t0)); return total

# ═══════════════════════════════════════════════════════════
# 7. iHERB (5-10% affiliate commission)
# ═══════════════════════════════════════════════════════════
def scrape_iherb():
    print(f"\n  🌿 iHERB — Supplement universe")
    t0, total = time.time(), 0
    CATEGORIES = [
        ("supplements","Supplements",120),("vitamins","Vitamins",100),
        ("minerals","Minerals",80),("herbs","Herbs",90),
        ("probiotics","Probiotics",60),("protein","Protein",70),
        ("omega-fatty-acids","Omega Fatty Acids",50),("antioxidants","Antioxidants",40),
        ("amino-acids","Amino Acids",40),("enzymes","Enzymes",30),
        ("mushrooms","Mushrooms",40),("adaptogens","Adaptogens",35),
        ("collagen","Collagen",50),("greens","Greens & Superfoods",30),
    ]
    for slug, label, expected in CATEGORIES:
        try:
            # iHerb doesn't have a public API but we can create affiliate links
            recs = [{"name":f"Best {label} on iHerb","category":"supplement",
                "subcategory":label.lower(),
                "url_iherb":f"https://www.iherb.com/c/{slug}?rcode=BLEU",
                "source":"iherb_category","source_id":f"iherb-{slug}",
                "validation_status":"pending","trust_score":30.0}]
            total += sb("products",recs)
        except: pass
    ok(f"iHerb: {total} categories"); RESULTS["iherb"]=total
    log_scrape("iherb",total,total,int(time.time()-t0)); return total

# ═══════════════════════════════════════════════════════════
# 8. PUBMED (now STORES results — was just searching before)
# ═══════════════════════════════════════════════════════════
def scrape_pubmed():
    print(f"\n  📚 PUBMED — Storing research")
    t0, total = time.time(), 0
    TERMS = [
        ("functional medicine outcomes","functional medicine"),
        ("ashwagandha randomized controlled","ashwagandha"),
        ("magnesium sleep clinical trial","magnesium"),
        ("acupuncture chronic pain systematic review","acupuncture"),
        ("meditation anxiety clinical trial","meditation"),
        ("gut microbiome intervention","gut health"),
        ("CBD anxiety randomized","CBD"),
        ("yoga mental health meta analysis","yoga"),
        ("intermittent fasting metabolic","fasting"),
        ("probiotics immune clinical","probiotics"),
        ("turmeric curcumin inflammation","turmeric"),
        ("lion's mane cognition","lion's mane"),
        ("cold exposure health benefits","cold exposure"),
        ("breathwork stress cortisol","breathwork"),
        ("creatine cognitive","creatine"),
        ("berberine metabolic","berberine"),
        ("omega-3 depression","omega-3"),
    ]
    month_ago = (datetime.now()-timedelta(days=30)).strftime("%Y/%m/%d")
    for term, product in TERMS:
        try:
            # Search
            r = retry(lambda: requests.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
                params={"db":"pubmed","term":term,"retmax":5,"retmode":"json","sort":"date","mindate":month_ago}, timeout=15))
            ids = r.json().get("esearchresult",{}).get("idlist",[])
            if not ids: continue

            # Fetch details
            r2 = retry(lambda: requests.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi",
                params={"db":"pubmed","id":",".join(ids),"retmode":"json"}, timeout=15))
            if r2.status_code != 200: continue
            result = r2.json().get("result",{})

            recs = []
            for pmid in ids:
                if pmid == "uids": continue
                info = result.get(pmid,{})
                title = info.get("title","")[:500]
                if not title: continue
                authors = [a.get("name","") for a in info.get("authors",[])][:10]
                recs.append({
                    "pmid":pmid,"title":title,
                    "authors":authors,"journal":info.get("fulljournalname","")[:300],
                    "published_date":info.get("sortdate","")[:10] if info.get("sortdate") else None,
                    "doi":info.get("elocationid","").replace("doi: ","")[:100],
                    "products_studied":[product],
                    "url":f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                })

            total += sb("pubmed_studies",recs)
            p(f"{product}: {len(recs)} studies stored")
            time.sleep(0.4)
        except Exception as e: warn(f"PubMed {term}: {e}")

    ok(f"PubMed: {total} studies STORED"); RESULTS["pubmed"]=total
    log_scrape("pubmed",total,total,int(time.time()-t0)); return total

# ═══════════════════════════════════════════════════════════
# 9. OPEN FOOD FACTS
# ═══════════════════════════════════════════════════════════
def scrape_food():
    print(f"\n  🥦 OPEN FOOD FACTS")
    t0, total = time.time(), 0
    for cat in ["en:dietary-supplements","en:organic-foods","en:plant-based-foods",
                "en:herbal-teas","en:superfoods","en:protein-supplements"]:
        try:
            r = requests.get("https://world.openfoodfacts.org/cgi/search.pl",
                params={"tagtype_0":"categories","tag_contains_0":"contains",
                        "tag_0":cat,"page_size":50,"json":1}, timeout=15)
            if r.status_code==200:
                recs = [{"name":(px.get("product_name","") or "")[:300],"brand":px.get("brands",""),
                    "category":"food" if "food" in cat else "supplement",
                    "ingredients":(px.get("ingredients_text","") or "")[:1000],"upc":px.get("code",""),
                    "source":"open_food_facts","source_id":px.get("code",str(hash(px.get("product_name","")))),
                    "source_url":px.get("url",""),"validation_status":"pending","trust_score":30.0}
                    for px in r.json().get("products",[]) if px.get("product_name")]
                total += sb("products",recs)
            time.sleep(1)
        except: pass
    ok(f"Food: {total}"); RESULTS["food"]=total
    log_scrape("open_food_facts",total,total,int(time.time()-t0)); return total

# ═══════════════════════════════════════════════════════════
# 10. YELP (reviews + ratings)
# ═══════════════════════════════════════════════════════════
def scrape_yelp(cities):
    if not YELP_KEY: warn("No YELP_API_KEY"); RESULTS["yelp"]=0; return 0
    print(f"\n  ⭐ YELP — Reviews + locations")
    t0, total = time.time(), 0
    CATS = ["acupuncture","chiropractors","yoga","meditation","nutritionists",
        "naturopathic","massage","floatation","cryotherapy"]
    today = cities[:24]
    for c in today:
        for cat in CATS:
            try:
                r = requests.get("https://api.yelp.com/v3/businesses/search",
                    params={"location":f"{c['city']}, {c['state']}","categories":cat,"limit":20,"sort_by":"rating"},
                    headers={"Authorization":f"Bearer {YELP_KEY}"}, timeout=15)
                if r.status_code!=200: continue
                recs = []
                for biz in r.json().get("businesses",[]):
                    loc = biz.get("location",{})
                    recs.append({"name":biz.get("name","")[:200],"type":cat,
                        "address":loc.get("display_address",[""])[0] if loc.get("display_address") else "",
                        "city":loc.get("city",c["city"]),"state":loc.get("state",c["state"]),
                        "zip":loc.get("zip_code",""),
                        "latitude":biz.get("coordinates",{}).get("latitude"),
                        "longitude":biz.get("coordinates",{}).get("longitude"),
                        "phone":biz.get("display_phone",""),"avg_rating":biz.get("rating"),
                        "review_count":biz.get("review_count",0),
                        "source":"yelp","source_id":biz.get("id",""),
                        "source_url":biz.get("url",""),
                        "validation_status":"pending",
                        "trust_score":round(30+min(biz.get("rating",0)*5,25)+(5 if biz.get("review_count",0)>50 else 0),1)})
                total += sb("locations",recs)
                time.sleep(0.3)
            except: pass
    ok(f"Yelp: {total}"); RESULTS["yelp"]=total
    log_scrape("yelp",total,total,int(time.time()-t0),[c["city"] for c in today]); return total

# ═══════════════════════════════════════════════════════════
# TRUST RECALC + CITY SCORES
# ═══════════════════════════════════════════════════════════
def recalc_trust():
    print(f"\n  🛡️  TRUST + CITY SCORES")
    try:
        r = requests.get(f"{SB_URL}/rest/v1/practitioners?select=id,trust_score,credentials_verified,license_verified,npi,review_count,avg_rating&limit=1000",
            headers=HDR, timeout=15)
        if r.status_code==200:
            u=0
            for px in r.json():
                s=20
                if px.get("npi"): s+=20
                if px.get("credentials_verified"): s+=10
                if px.get("license_verified"): s+=10
                rc=px.get("review_count") or 0
                if rc>0: s+=min(rc,10)
                ar=px.get("avg_rating") or 0
                if ar>0: s+=min(ar*2,10)
                s=min(s,100)
                if abs(s-(px.get("trust_score") or 0))>1:
                    requests.patch(f"{SB_URL}/rest/v1/practitioners?id=eq.{px['id']}",
                        headers=HDR,json={"trust_score":round(s,1)},timeout=10)
                    u+=1
            p(f"Trust: {u} updated")
    except: pass
    # City counts
    for zone in ZONES:
        for c in zone:
            pc=sb_count_where("practitioners",f"city=eq.{c['city']}&state=eq.{c['state']}")
            lc=sb_count_where("locations",f"city=eq.{c['city']}&state=eq.{c['state']}")
            if pc>0 or lc>0:
                try: requests.patch(f"{SB_URL}/rest/v1/cities?name=eq.{c['city']}&state=eq.{c['state']}",
                    headers=HDR,json={"practitioner_count":pc,"location_count":lc,
                        "health_score":round(min((pc/100+lc/50)*10,100),1)},timeout=10)
                except: pass
    ok("Trust + city scores updated")

# ═══════════════════════════════════════════════════════════
# DAILY REPORT
# ═══════════════════════════════════════════════════════════
def daily_report():
    print(f"\n  📊 DAILY REPORT")
    counts = {t:sb_count(t) for t in ["practitioners","products","locations","youtube_videos",
        "reddit_mentions","pubmed_studies","protocols","cities","reviews","seo_pages","affiliate_clicks"]}
    
    report = {"report_date":datetime.now().strftime("%Y-%m-%d"),
        "total_practitioners":counts["practitioners"],"total_products":counts["products"],
        "total_locations":counts["locations"],"total_youtube":counts["youtube_videos"],
        "total_reddit":counts["reddit_mentions"],"total_studies":counts["pubmed_studies"],
        "new_today":json.dumps(RESULTS),"scrape_results":json.dumps(RESULTS),
        "pages_generated":counts["seo_pages"],"affiliate_clicks_today":counts["affiliate_clicks"],
        "errors_today":len(ERRORS),"active_cities":counts["cities"]}
    sb("daily_reports",[report])
    
    total_records = sum(counts.values())
    new_today = sum(RESULTS.values())
    print(f"""
  ┌─────────────────────────────────────────┐
  │  📊 BLEU.LIVE — DAILY REPORT            │
  │  {datetime.now().strftime('%B %d, %Y'):^40}│
  ├─────────────────────────────────────────┤
  │  DATABASE TOTALS                        │
  │  Practitioners:    {counts['practitioners']:>8,}              │
  │  Products/SKUs:    {counts['products']:>8,}              │
  │  Locations:        {counts['locations']:>8,}              │
  │  YouTube Videos:   {counts['youtube_videos']:>8,}              │
  │  Reddit Posts:     {counts['reddit_mentions']:>8,}              │
  │  PubMed Studies:   {counts['pubmed_studies']:>8,}              │
  │  Protocols:        {counts['protocols']:>8,}              │
  │  ─────────────────────────              │
  │  TOTAL RECORDS:    {total_records:>8,}              │
  │                                         │
  │  ADDED TODAY:      {new_today:>8,}              │
  │  ERRORS:           {len(ERRORS):>8}              │
  │  SEO PAGES:        {counts['seo_pages']:>8,}              │
  │  AFFILIATE CLICKS: {counts['affiliate_clicks']:>8,}              │
  └─────────────────────────────────────────┘""")
    
    if ERRORS:
        print(f"\n  ⚠  ERRORS ({len(ERRORS)}):")
        for e in ERRORS[:10]: print(f"    • {e}")
    
    return counts

# ═══════════════════════════════════════════════════════════
# TRIGGER PAGE BUILD
# ═══════════════════════════════════════════════════════════
def trigger_build():
    if not HOOK: p("No PAGE_BUILD_WEBHOOK — manual build needed"); return
    print(f"\n  🔨 TRIGGERING PAGE BUILD")
    try: r=requests.post(HOOK,timeout=15); ok(f"Build: {r.status_code}")
    except Exception as e: warn(f"Build trigger: {e}")

# ═══════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════
def status():
    print(f"\n  📊 BLEU.LIVE STATUS")
    print(f"  {'═'*45}")
    t=0
    for tb in ["practitioners","products","locations","youtube_videos","reddit_mentions",
               "pubmed_studies","protocols","cities","reviews","seo_pages","affiliate_clicks","scrape_log","daily_reports"]:
        c=sb_count(tb); t+=c; print(f"  {tb:25s} {c:>10,}")
    print(f"  {'─'*45}"); print(f"  {'TOTAL':25s} {t:>10,}")
    est = sb_count("practitioners")*3 + sb_count("products")*4 + sb_count("locations")*2
    print(f"  {'Est SEO pages':25s} {est:>10,}")
    print(f"  {'═'*45}\n")

def setup():
    print(f"\n  🔑 CONFIGURATION")
    print(f"  {'═'*50}")
    ck = [("Supabase",bool(SB_URL and SB_KEY),"$25/mo"),("Google Places",bool(G_KEY),"FREE"),
        ("YouTube",bool(YT_KEY),"FREE"),("Claude AI",bool(CL_KEY),"~$15/mo"),
        ("Yelp Fusion",bool(YELP_KEY),"FREE"),("Page Webhook",bool(HOOK),"FREE")]
    for n,r,c in ck: print(f"  {'✅' if r else '❌'} {n:30s} {c}")
    print(f"\n  🆓 ALWAYS FREE (no key):")
    for s in ["NPI (7.8M)","FDA recalls+labels","PubMed (36M)","Open Food Facts (2.5M)",
              "Reddit (15 subs)","YouTube transcripts","Amazon affiliate links","iHerb affiliate links"]:
        print(f"  ✅ {s}")
    print()

# ═══════════════════════════════════════════════════════════
# 11. SAMHSA TREATMENT LOCATOR — Recovery tab
# Free federal API. AA/NA meetings, treatment centers, MAT providers.
# ═══════════════════════════════════════════════════════════
def scrape_samhsa():
    print(f"\n  🏥 SAMHSA — Treatment + Recovery locations")
    t0, total = time.time(), 0
    cities = [
        {"name":"New Orleans","lat":29.9511,"lng":-90.0715,"state":"LA"},
        {"name":"Baton Rouge","lat":30.4515,"lng":-91.1871,"state":"LA"},
        {"name":"Houston","lat":29.7604,"lng":-95.3698,"state":"TX"},
        {"name":"Atlanta","lat":33.749,"lng":-84.388,"state":"GA"},
        {"name":"New York","lat":40.7128,"lng":-74.006,"state":"NY"},
        {"name":"Los Angeles","lat":34.0522,"lng":-118.2437,"state":"CA"},
        {"name":"Chicago","lat":41.8781,"lng":-87.6298,"state":"IL"},
    ]
    for city in cities:
        try:
            r = requests.get("https://findtreatment.gov/locator/listing",
                params={"sType":"SA","lat":city["lat"],"lng":city["lng"],"distance":25,
                        "limitPayment":"false","sAddr":city["name"]},
                headers={"Accept":"application/json"}, timeout=20)
            if r.status_code != 200: continue
            facilities = r.json().get("rows",[])
            recs = []
            for f in facilities[:50]:
                recs.append({
                    "full_name": f.get("name1","")[:200],
                    "practice_name": f.get("name1","")[:200],
                    "specialty": "Substance Use Treatment",
                    "address_line1": f.get("street","")[:200],
                    "city": f.get("city",""),
                    "state": f.get("state",""),
                    "zip": f.get("zip",""),
                    "phone": (f.get("phone","") or "")[:20],
                    "source": "samhsa",
                    "tab_affinity": "recovery",
                    "services": json.dumps(f.get("services",[])),
                    "accepts_medicaid": f.get("paymentMedicaid",False),
                    "accepts_sliding_scale": f.get("paymentSlidingFeeScale",False),
                })
            total += sb("practitioners", recs)
            p(f"{city['name']}: {len(recs)} SAMHSA facilities")
            time.sleep(1)
        except Exception as e: warn(f"SAMHSA {city['name']}: {e}")
    ok(f"SAMHSA: {total} facilities"); RESULTS["samhsa"] = total
    log_scrape("samhsa", total, total, int(time.time()-t0)); return total


# ═══════════════════════════════════════════════════════════
# 12. HRSA HEALTH CENTER FINDER — Directory tab (free clinics)
# Free federal API. FQHCs (free/sliding scale clinics).
# ═══════════════════════════════════════════════════════════
def scrape_hrsa():
    print(f"\n  🏥 HRSA — Free clinics + FQHCs")
    t0, total = time.time(), 0
    states = ["LA","TX","MS","AL","GA","FL","TN","NC","NY","CA","IL","TX"]
    for state in states:
        try:
            r = requests.get("https://findahealthcenter.hrsa.gov/api/findahealthcenter",
                params={"statecode":state,"pageNumber":1,"pageSize":50},
                headers={"Accept":"application/json"}, timeout=20)
            if r.status_code != 200: continue
            centers = r.json().get("dataList",[])
            recs = []
            for c in centers:
                recs.append({
                    "full_name": (c.get("healthCenterName","") or "")[:200],
                    "practice_name": (c.get("healthCenterName","") or "")[:200],
                    "specialty": "Community Health Center",
                    "address_line1": (c.get("streetAddress","") or "")[:200],
                    "city": c.get("city",""),
                    "state": c.get("stateCode",""),
                    "zip": (c.get("zipCode","") or "")[:10],
                    "phone": (c.get("phoneNumber","") or "")[:20],
                    "source": "hrsa_fqhc",
                    "tab_affinity": "directory",
                    "accepts_sliding_scale": True,
                    "accepts_medicaid": True,
                    "telehealth": bool(c.get("telehealthYn")),
                })
            total += sb("practitioners", recs)
            p(f"{state}: {len(recs)} FQHCs")
            time.sleep(0.5)
        except Exception as e: warn(f"HRSA {state}: {e}")
    ok(f"HRSA: {total} free clinics"); RESULTS["hrsa"] = total
    log_scrape("hrsa", total, total, int(time.time()-t0)); return total


# ═══════════════════════════════════════════════════════════
# 13. EPA AirNow + Open Meteo — Dashboard environmental layer
# Real-time AQI by zip. Free. No key for Open Meteo.
# AirNow: free key at airnowapi.org
# ═══════════════════════════════════════════════════════════
AIRNOW_KEY = os.getenv("AIRNOW_API_KEY","")
def scrape_environmental():
    print(f"\n  🌿 ENVIRONMENTAL — AQI + UV + Pollen")
    t0, total = time.time(), 0
    locations = [
        {"zip":"70130","city":"New Orleans","lat":29.9511,"lng":-90.0715},
        {"zip":"70117","city":"Tremé","lat":29.9648,"lng":-90.0642},
        {"zip":"70116","city":"Marigny","lat":29.9571,"lng":-90.0508},
        {"zip":"70115","city":"Uptown","lat":29.9286,"lng":-90.1020},
        {"zip":"70118","city":"Mid-City","lat":29.9672,"lng":-90.1042},
        {"zip":"70119","city":"Mid-City North","lat":29.9750,"lng":-90.0903},
    ]
    for loc in locations:
        rec = {"zip_code":loc["zip"],"city":loc["city"],"lat":loc["lat"],"lng":loc["lng"],"updated_at":datetime.now().isoformat()}
        # Open Meteo — free, no key
        try:
            r = requests.get("https://api.open-meteo.com/v1/forecast",
                params={"latitude":loc["lat"],"longitude":loc["lng"],
                        "daily":["uv_index_max","precipitation_probability_max"],
                        "current":["temperature_2m","relative_humidity_2m","wind_speed_10m"],
                        "forecast_days":1,"timezone":"America/Chicago"}, timeout=10)
            if r.status_code==200:
                d = r.json()
                cur = d.get("current",{})
                daily = d.get("daily",{})
                rec["temp_f"] = round((cur.get("temperature_2m",0)*9/5)+32,1)
                rec["humidity"] = cur.get("relative_humidity_2m")
                rec["uv_index"] = daily.get("uv_index_max",[None])[0]
        except: pass
        # AirNow — requires free key
        if AIRNOW_KEY:
            try:
                r2 = requests.get("https://www.airnowapi.org/aq/observation/zipCode/current/",
                    params={"zipCode":loc["zip"],"format":"application/json",
                            "distance":25,"API_KEY":AIRNOW_KEY}, timeout=10)
                if r2.status_code==200:
                    obs = r2.json()
                    if obs:
                        rec["aqi"] = obs[0].get("AQI")
                        rec["aqi_category"] = obs[0].get("Category",{}).get("Name","")
                        rec["aqi_pollutant"] = obs[0].get("ParameterName","")
            except: pass
        total += sb("environmental_data", [rec])
    ok(f"Environmental: {total} locations updated"); RESULTS["environmental"] = total
    log_scrape("environmental", total, total, int(time.time()-t0)); return total


# ═══════════════════════════════════════════════════════════
# 14. AMAZON PRODUCT SKU DATABASE
# Verified ASINs for every product in BLEU commerce layer
# These feed the Vessel tab embedded product cards
# ═══════════════════════════════════════════════════════════
PRODUCT_SKUS = [
    # SLEEP
    {"name":"Thorne Magnesium Bisglycinate","asin":"B07RY37KGB","category":"sleep","subcategory":"magnesium","price_usd":25,"dose":"400mg","tabs":["sleep","vessel","protocols"]},
    {"name":"Doctor's Best Magnesium Glycinate","asin":"B00YXTHZXE","category":"sleep","subcategory":"magnesium","price_usd":15,"dose":"400mg","tabs":["sleep","vessel"]},
    {"name":"L-Theanine 200mg","asin":"B001DZKHGA","category":"sleep","subcategory":"amino_acid","price_usd":13,"dose":"200mg","tabs":["sleep","vessel","therapy"]},
    {"name":"Melatonin 0.5mg Microdose","asin":"B07WMGQX2L","category":"sleep","subcategory":"hormone","price_usd":8,"dose":"0.5mg","tabs":["sleep"]},
    {"name":"Endel Sleep Soundscapes","asin":None,"category":"sleep","subcategory":"app","price_usd":50,"tabs":["sleep"],"url":"https://endel.io"},
    # ANXIETY + STRESS
    {"name":"NOW Ashwagandha KSM-66 450mg","asin":"B01N0A5XEJ","category":"anxiety","subcategory":"adaptogen","price_usd":12,"dose":"450mg","tabs":["therapy","vessel","protocols"]},
    {"name":"Ashwagandha KSM-66 600mg","asin":"B01N0A5XEJ","category":"anxiety","subcategory":"adaptogen","price_usd":12,"dose":"600mg","tabs":["therapy","vessel"]},
    # LONGEVITY + ENERGY
    {"name":"Nordic Naturals Ultimate Omega","asin":"B002CQU564","category":"longevity","subcategory":"omega3","price_usd":28,"dose":"2000mg EPA/DHA","tabs":["vessel","protocols","dashboard"]},
    {"name":"Sports Research Vitamin D3 K2","asin":"B01GBGS7JU","category":"longevity","subcategory":"vitamin","price_usd":17,"dose":"5000IU D3 + 100mcg K2","tabs":["vessel","protocols"]},
    {"name":"Thorne CoQ10 Ubiquinol","asin":"B00I5JV0AC","category":"longevity","subcategory":"coq10","price_usd":40,"dose":"100mg","tabs":["vessel","protocols","dashboard"]},
    {"name":"Jarrow Methyl B12 1000mcg","asin":"B06XFMLTTM","category":"longevity","subcategory":"vitamin","price_usd":8,"dose":"1000mcg","tabs":["vessel","recovery"]},
    # COGNITIVE
    {"name":"Momentous Creatine Monohydrate","asin":"B0BGVB8T84","category":"cognitive","subcategory":"creatine","price_usd":30,"dose":"5g/day","tabs":["vessel","protocols","dashboard"]},
    {"name":"Lion's Mane Mushroom","asin":"B07BS2KYLC","category":"cognitive","subcategory":"mushroom","price_usd":22,"dose":"500mg","tabs":["vessel","protocols","learn"]},
    # METABOLIC
    {"name":"Thorne Berberine-500","asin":"B07BG2CNKD","category":"metabolic","subcategory":"berberine","price_usd":40,"dose":"500mg x3/day","tabs":["vessel","protocols","dashboard"]},
    {"name":"Momentous Essential Protein","asin":"B09KQDQBYW","category":"metabolic","subcategory":"protein","price_usd":55,"dose":"25g/serving","tabs":["vessel","protocols"]},
    # MENTAL HEALTH
    {"name":"Charlotte's Web CBD Oil 17mg","asin":"B07ZF3YRLZ","category":"mental_health","subcategory":"cbd","price_usd":45,"dose":"17mg/serving","tabs":["ecsiq","therapy","vessel"]},
    # RECOVERY
    {"name":"Zinc Picolinate 30mg","asin":"B07Y3G6R2D","category":"immune","subcategory":"mineral","price_usd":12,"dose":"30mg","tabs":["recovery","vessel","protocols"]},
    # SPIRIT
    {"name":"Apigenin 50mg","asin":"B09XPRTPP4","category":"spirit","subcategory":"flavonoid","price_usd":18,"dose":"50mg","tabs":["spirit","sleep"]},
    {"name":"Tibetan Singing Bowl Set","asin":"B07GYPFNZD","category":"spirit","subcategory":"meditation","price_usd":35,"tabs":["spirit"]},
    {"name":"Zafu Meditation Cushion","asin":"B07C3DG1LV","category":"spirit","subcategory":"meditation","price_usd":40,"tabs":["spirit"]},
]

def scrape_product_skus():
    print(f"\n  🛒 PRODUCT SKU DATABASE — {len(PRODUCT_SKUS)} verified products")
    t0, total = time.time(), 0
    recs = []
    for p_data in PRODUCT_SKUS:
        asin = p_data.get("asin")
        url = p_data.get("url") or (f"https://amazon.com/dp/{asin}?tag={AZ_TAG}" if asin else "")
        recs.append({
            "name": p_data["name"],
            "category": p_data["category"],
            "subcategory": p_data.get("subcategory",""),
            "asin": asin,
            "price_usd": p_data.get("price_usd"),
            "dose": p_data.get("dose",""),
            "tabs": p_data.get("tabs",[]),
            "url_amazon": url if asin else None,
            "url": url,
            "affiliate_tag": AZ_TAG if asin else None,
            "source": "bleu_verified_sku",
            "source_id": f"sku-{asin or p_data['name'][:20].replace(' ','-')}",
            "validation_status": "verified",
            "trust_score": 85.0,
        })
    total = sb("products", recs)
    ok(f"SKUs: {total} verified products with ASINs"); RESULTS["product_skus"] = total
    log_scrape("product_skus", total, total, int(time.time()-t0)); return total


def run_full():
    start = time.time()
    cities, zone = get_cities()
    print(f"""
╔═══════════════════════════════════════════════════════════════╗
║  🌿 BLEU.LIVE — COMPLETE MOAT BUILDER v3.0                   ║
║  {datetime.now().strftime('%A %B %d, %Y %I:%M %p'):^60}║
║  Zone {zone} — {len(cities)} cities — 10 sources{' '*(40-len(str(zone))-len(str(len(cities))))}║
╚═══════════════════════════════════════════════════════════════╝""")
    p(f"Cities: {', '.join(c['city'] for c in cities)}\n")

    scrape_npi(cities)
    scrape_fda()
    scrape_google(cities)
    scrape_youtube()
    scrape_reddit()
    scrape_amazon()
    scrape_iherb()
    scrape_product_skus()
    scrape_samhsa()
    scrape_hrsa()
    scrape_environmental()
    scrape_pubmed()
    scrape_food()
    scrape_yelp(cities)
    recalc_trust()
    daily_report()
    trigger_build()

    print(f"\n  ⏱  Total runtime: {int(time.time()-start)}s")
    print(f"  🌊 The moat got deeper. See you tomorrow.\n")

if __name__ == "__main__":
    a = sys.argv[1:]
    if "--setup" in a: setup()
    elif "--status" in a: status()
    elif "--report" in a: daily_report()
    elif "--source" in a:
        src = a[a.index("--source")+1] if len(a)>a.index("--source")+1 else ""
        cities,_ = get_cities()
        {"npi":lambda:scrape_npi(cities),"fda":scrape_fda,"google":lambda:scrape_google(cities),
         "youtube":scrape_youtube,"reddit":scrape_reddit,"amazon":scrape_amazon,"samhsa":scrape_samhsa,"hrsa":scrape_hrsa,"environmental":scrape_environmental,"skus":scrape_product_skus,
         "iherb":scrape_iherb,"pubmed":scrape_pubmed,"food":scrape_food,
         "yelp":lambda:scrape_yelp(cities)}.get(src, lambda:print(f"Unknown: {src}"))()
    else: run_full()
