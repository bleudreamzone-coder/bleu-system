#!/usr/bin/env python3
"""
BLEU TANK FILLER v4 — Schema-Matched Edition
Every column name verified against actual Supabase tables.
"""
import os,sys,json,time,hashlib,uuid,argparse,datetime
from urllib.request import urlopen,Request
from urllib.parse import quote,urlencode
from urllib.error import HTTPError,URLError

SB_URL='https://sqyzboesdpdussiwqpzk.supabase.co'
SB_KEY='sb_secret__zYCYtWcOx9uKnIgRPPN4Q_PWkTOf96'
GOOGLE_KEY='AIzaSyCGYgOuRAPS5HO95ify2ZNmQj_21Tjn0Ks'
YT_KEY='AIzaSyCGYgOuRAPS5HO95ify2ZNmQj_21Tjn0Ks'
AMZ_TAG='bleu-live-20'
IHERB='BLEU'
TOTAL=0

def uid(s): return str(uuid.uuid5(uuid.NAMESPACE_DNS,s))

def sbh(upsert=True):
    h={'apikey':SB_KEY,'Authorization':f'Bearer {SB_KEY}','Content-Type':'application/json'}
    if upsert: h['Prefer']='resolution=merge-duplicates'
    return h

def upsert(table,rows):
    global TOTAL
    if not rows: return 0
    t=0
    for i in range(0,len(rows),50):
        batch=rows[i:i+50]
        try:
            req=Request(f'{SB_URL}/rest/v1/{table}',data=json.dumps(batch).encode(),headers=sbh(),method='POST')
            urlopen(req,timeout=30)
            t+=len(batch)
        except HTTPError as e:
            body=e.read().decode()[:300]
            # Try one by one
            for row in batch:
                try:
                    req2=Request(f'{SB_URL}/rest/v1/{table}',data=json.dumps([row]).encode(),headers=sbh(),method='POST')
                    urlopen(req2,timeout=15)
                    t+=1
                except:
                    pass
        except: pass
    TOTAL+=t
    return t

def count(table):
    try:
        req=Request(f'{SB_URL}/rest/v1/{table}?select=id&limit=1',headers={**sbh(False),'Range':'0-0','Prefer':'count=exact'})
        resp=urlopen(req,timeout=10)
        return int(resp.headers.get('content-range','*/0').split('/')[-1])
    except: return 0

def fetch(url,timeout=20):
    try:
        req=Request(url,headers={'User-Agent':'BLEU-Wellness/3.0'})
        return json.loads(urlopen(req,timeout=timeout).read().decode())
    except: return None

def log(m):
    print(f'  [{datetime.datetime.now().strftime("%H:%M:%S")}] {m}',flush=True)

# ════════════════════════════════════════════
# CITIES
# ════════════════════════════════════════════
NOLA=[
    ('New Orleans','LA'),('Metairie','LA'),('Kenner','LA'),('Gretna','LA'),
    ('Harvey','LA'),('Slidell','LA'),('Mandeville','LA'),('Covington','LA'),
    ('Hammond','LA'),('Houma','LA'),('Baton Rouge','LA'),('Lafayette','LA'),
    ('Shreveport','LA'),('Lake Charles','LA'),('Monroe','LA'),
]
BIG_CITIES=[
    ('Houston','TX'),('Dallas','TX'),('Austin','TX'),('San Antonio','TX'),
    ('Atlanta','GA'),('Miami','FL'),('Tampa','FL'),('Orlando','FL'),
    ('Charlotte','NC'),('Nashville','TN'),('Memphis','TN'),('Birmingham','AL'),
    ('Jackson','MS'),('New York','NY'),('Los Angeles','CA'),('Chicago','IL'),
    ('Philadelphia','PA'),('Phoenix','AZ'),('San Diego','CA'),
    ('San Francisco','CA'),('Seattle','WA'),('Portland','OR'),('Denver','CO'),
    ('Minneapolis','MN'),('Boston','MA'),('Washington','DC'),('Baltimore','MD'),
    ('Las Vegas','NV'),('Columbus','OH'),('Indianapolis','IN'),
    ('Kansas City','MO'),('St Louis','MO'),('Pittsburgh','PA'),
    ('Raleigh','NC'),('Richmond','VA'),('Louisville','KY'),
    ('Salt Lake City','UT'),('Tucson','AZ'),('Albuquerque','NM'),
    ('Oklahoma City','OK'),('Detroit','MI'),('Cleveland','OH'),
]
ALL_CITIES=NOLA+BIG_CITIES

# ════════════════════════════════════════════
# SPECIALTIES
# ════════════════════════════════════════════
SPECS=[
    'Chiropract','Internal Medicine','Family Medicine','Psychiatry',
    'Physical Therapy','Nurse Practitioner','Social Worker','Counselor',
    'Psychology','General Dentistry','Optometry','Podiatry','Cardiology',
    'Gastroenterology','Endocrinology','Registered Dietitian','Nutritionist',
    'Sports Medicine','Dermatology','Neurology','Naturopath','Acupunctur',
    'Pharmacist','Rheumatology','Pulmonology','Orthopedic','Oncology',
    'Massage Therap','Holistic','Integrative Medicine','Functional Medicine',
    'Occupational Therapy','Speech Therap','Midwi','Addiction Medicine',
    'Allergy','Pain Medicine','Emergency Medicine','General Surgery',
    'Geriatric','Gynecology','Obstetrics','Infectious Disease',
    'Nephrology','Urology','Physician Assistant','Registered Nurse',
]

# ════════════════════════════════════════════
# 1. NPI PRACTITIONERS
# Schema: id(uuid), npi, first_name, last_name, full_name, credential,
#   specialty, taxonomy_code, taxonomy_description, practice_name,
#   address_line1, city, state, zip, phone, gender, source, trust_score
# ════════════════════════════════════════════
def run_npi(cities=None):
    target=cities or ALL_CITIES
    print(f'\n🏥 NPI — {len(target)} cities × {len(SPECS)} specialties')
    rows=[];seen=set()
    for ci,(city,state) in enumerate(target):
        log(f'📍 [{ci+1}/{len(target)}] {city}, {state}...')
        cc=0
        for spec in SPECS:
            url=f'https://npiregistry.cms.hhs.gov/api/?version=2.1&city={quote(city)}&state={state}&taxonomy_description={quote(spec)}&limit=200'
            data=fetch(url)
            if not data or 'results' not in data: continue
            for r in data['results']:
                npi=str(r.get('number',''))
                if not npi or npi in seen: continue
                seen.add(npi)
                b=r.get('basic',{})
                addrs=r.get('addresses',[{}])
                a=addrs[0]
                for x in addrs:
                    if x.get('address_purpose')=='LOCATION': a=x; break
                tax=r.get('taxonomies',[{}])
                pt=tax[0] if tax else {}
                for t in tax:
                    if t.get('primary'): pt=t; break
                fn=b.get('first_name','')
                ln=b.get('last_name','')
                org=b.get('organization_name','')
                full=f"{fn} {ln}".strip() if fn else org
                cred=b.get('credential','')
                rows.append({
                    'id':uid(npi),'npi':npi,
                    'first_name':fn,'last_name':ln,'full_name':full,
                    'credential':cred,
                    'specialty':pt.get('desc',''),
                    'taxonomy_code':pt.get('code',''),
                    'taxonomy_description':pt.get('desc',''),
                    'practice_name':org,
                    'address_line1':a.get('address_1',''),
                    'city':a.get('city',city),'state':a.get('state',state),
                    'zip':a.get('postal_code','')[:5],
                    'phone':a.get('telephone_number',''),
                    'gender':b.get('gender',''),
                    'source':'npi_registry','trust_score':0
                })
                cc+=1
            time.sleep(0.2)
        log(f'   → {cc} practitioners')
        if (ci+1)%5==0 and rows:
            s=upsert('practitioners',rows)
            log(f'   💾 Stored: {s}')
            rows=[]
    if rows: upsert('practitioners',rows)
    log(f'✅ NPI: {len(seen)} total')
    return len(seen)

# ════════════════════════════════════════════
# 2. FDA PRODUCTS
# Schema: id(uuid), name, brand, category, form, source, trust_score,
#   url_amazon, url_iherb, shield_category, is_bleu_pick
# ════════════════════════════════════════════
FDA_TERMS=[
    'vitamin+a','vitamin+b12','vitamin+c','vitamin+d','vitamin+d3','vitamin+e',
    'vitamin+k','multivitamin','prenatal+vitamin','magnesium','magnesium+glycinate',
    'zinc','iron','calcium','potassium','selenium','chromium','iodine',
    'omega+3','fish+oil','krill+oil','flaxseed+oil','mct+oil',
    'l+theanine','l+glutamine','l+arginine','l+carnitine','taurine','glycine',
    'nac','bcaa','collagen','collagen+peptides',
    'ashwagandha','rhodiola','ginseng','maca','holy+basil','cordyceps',
    'reishi','lion+mane','chaga','turkey+tail',
    'probiotic','prebiotic','digestive+enzyme','psyllium',
    'turmeric','curcumin','ginger','garlic','oregano+oil','elderberry','echinacea',
    'berberine','milk+thistle','saw+palmetto','black+cohosh','valerian',
    'creatine','whey+protein','pea+protein','electrolyte',
    'coq10','ubiquinol','nmn','resveratrol','alpha+lipoic+acid',
    'melatonin','5+htp','gaba','sam+e','dhea',
    'glucosamine','chondroitin','biotin','quercetin',
    'spirulina','chlorella','moringa','green+tea+extract',
]
SKIP_DRUGS={'lidocaine','sildenafil','estradiol','levonorgestrel','dronabinol',
    'acetaminophen','ibuprofen','naproxen','aspirin','hydrocodone','oxycodone',
    'gabapentin','metformin','atorvastatin','amoxicillin','prednisone',
    'sertraline','fluoxetine','lisinopril','amlodipine','omeprazole',
    'losartan','warfarin','insulin','morphine','fentanyl','diazepam',
    'amphetamine','methylphenidate','clonazepam'}

def run_fda():
    print(f'\n💊 FDA — {len(FDA_TERMS)} categories')
    rows=[];seen=set()
    for ti,term in enumerate(FDA_TERMS):
        if ti%20==0: log(f'FDA [{ti}/{len(FDA_TERMS)}] — {len(rows)} so far')
        url=f'https://api.fda.gov/drug/label.json?search=openfda.brand_name:"{term}"&limit=10'
        data=fetch(url)
        if not data or 'results' not in data: time.sleep(0.15); continue
        for r in data['results']:
            o=r.get('openfda',{})
            name=(o.get('brand_name',[''])+[''])[0]
            if not name: name=(o.get('generic_name',[''])+[''])[0]
            if not name: continue
            nl=name.lower()
            if any(w in nl for w in SKIP_DRUGS): continue
            pid=uid(name)
            if pid in seen: continue
            seen.add(pid)
            mfr=(o.get('manufacturer_name',[''])+[''])[0]
            form=(o.get('dosage_form',[''])+[''])[0]
            cat_map={'vitamin':'Vitamins','magnesium':'Minerals','zinc':'Minerals',
                'iron':'Minerals','calcium':'Minerals','omega':'Essential Fats',
                'fish':'Essential Fats','probiotic':'Gut Health','collagen':'Beauty',
                'ashwagandha':'Adaptogens','turmeric':'Anti-Inflammation',
                'curcumin':'Anti-Inflammation','melatonin':'Sleep','theanine':'Focus',
                'creatine':'Performance','protein':'Performance','coq10':'Energy',
                'berberine':'Metabolic','mushroom':'Nootropics','lion':'Nootropics',
                'elderberry':'Immunity','echinacea':'Immunity','glucosamine':'Joints',
                'nmn':'Longevity','resveratrol':'Longevity','rhodiola':'Adaptogens'}
            cat='Supplements'
            for k,v in cat_map.items():
                if k in term.replace('+',' ').lower(): cat=v; break
            sq=quote(name[:60])
            rows.append({
                'id':pid,'name':name[:200],'brand':mfr[:200],
                'category':cat,'form':form,'source':'openfda',
                'url_amazon':f'https://www.amazon.com/s?k={sq}&tag={AMZ_TAG}',
                'url_iherb':f'https://www.iherb.com/search?kw={sq}&rcode={IHERB}',
                'trust_score':0
            })
        time.sleep(0.15)
    s=upsert('products',rows)
    log(f'✅ FDA: {s} products')
    return s

# ════════════════════════════════════════════
# 3. PUBMED
# Schema: id(uuid), pmid, title, authors, journal, pub_date,
#   category, search_topic, query_term, url, study_type
# ════════════════════════════════════════════
PM_TOPICS=[
    'magnesium sleep quality','melatonin insomnia efficacy','vitamin D immune function',
    'omega-3 cardiovascular outcomes','ashwagandha cortisol stress','turmeric curcumin inflammation',
    'probiotics gut microbiome mental health','creatine cognitive function',
    'lion mane mushroom neurogenesis','berberine blood sugar metabolic',
    'CoQ10 mitochondrial function','collagen skin elasticity','zinc immune deficiency',
    'L-theanine anxiety focus','vitamin B12 energy methylation','quercetin antioxidant',
    'resveratrol longevity aging','rhodiola adaptogen fatigue','NAD+ aging human',
    'glutathione oxidative stress','iron deficiency fatigue women',
    'folate pregnancy neural tube','vitamin K2 bone density','spirulina nutritional',
    'CBD anxiety pain','intermittent fasting metabolic','cold exposure inflammation',
    'meditation anxiety neuroplasticity','exercise depression mental health',
    'sleep deprivation cognitive','gut brain axis serotonin','social connection longevity',
    'forest bathing cortisol','breathwork autonomic nervous','sauna cardiovascular',
    'glucosamine osteoarthritis','saw palmetto prostate','elderberry influenza',
    'garlic cardiovascular','ginger anti-inflammatory','valerian insomnia',
    'GABA supplement anxiety','alpha lipoic acid neuropathy','phosphatidylserine memory',
    'milk thistle liver','boswellia joint inflammation','green tea EGCG metabolism',
    'maca root energy libido','reishi mushroom immunity','cordyceps athletic performance',
    'electrolyte hydration performance','whey protein muscle synthesis',
    'vitamin C collagen immune','selenium thyroid function','chromium blood sugar',
    'drug interaction supplement safety','CYP450 herb drug interaction',
    'air pollution cognitive decline','microplastics health effects',
    'NMN NAD aging','fisetin senolytic','spermidine autophagy',
    'bacopa monnieri memory','ginkgo biloba cognitive','caffeine neuroprotective',
    'tart cherry recovery exercise','nattokinase fibrinolysis',
    'black cohosh menopause','tongkat ali testosterone','fenugreek testosterone',
    'beta alanine endurance','citrulline malate performance',
    'Wim Hof immune','box breathing anxiety','pranayama autonomic',
    'psychedelic therapy depression','ketamine depression',
    'mindfulness cognitive therapy','yoga chronic pain','acupuncture pain',
    'ketogenic diet epilepsy','fecal transplant microbiome',
    'red light therapy','hyperbaric oxygen therapy',
]

def run_pubmed():
    print(f'\n📚 PUBMED — {len(PM_TOPICS)} topics')
    rows=[];seen=set()
    for ti,topic in enumerate(PM_TOPICS):
        if ti%20==0: log(f'PubMed [{ti}/{len(PM_TOPICS)}] — {len(rows)} studies')
        for pt in ['clinical+trial','review']:
            url=f'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=5&sort=relevance&term={quote(topic)}+AND+{pt}[pt]'
            data=fetch(url)
            if not data or 'esearchresult' not in data: continue
            ids=data['esearchresult'].get('idlist',[])
            if not ids: continue
            details=fetch(f'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id={",".join(ids)}')
            if not details or 'result' not in details: continue
            for pmid in ids:
                if pmid in seen: continue
                seen.add(pmid)
                info=details['result'].get(pmid,{})
                if not info or isinstance(info,str): continue
                title=info.get('title','')
                if not title: continue
                auths=info.get('authors',[])
                fa=auths[0].get('name','') if auths else ''
                journal=info.get('fulljournalname',info.get('source',''))
                pd=info.get('pubdate','')
                cat_map={'sleep':'Sleep','immun':'Immunity','cardiovascular':'Heart',
                    'heart':'Heart','brain':'Brain','cognitive':'Brain','neuro':'Brain',
                    'gut':'Gut Health','microbiome':'Gut Health','inflammat':'Inflammation',
                    'aging':'Longevity','longevity':'Longevity','stress':'Stress',
                    'anxiety':'Mental Health','depress':'Mental Health','diabetes':'Metabolic',
                    'insulin':'Metabolic','women':'Women Health','pregnancy':'Women Health',
                    'testosterone':'Men Health','prostate':'Men Health',
                    'exercise':'Performance','muscle':'Performance','drug interact':'Safety',
                    'sauna':'Recovery','cold':'Recovery','breath':'Breathwork',
                    'meditation':'Mindfulness','psychedelic':'Mental Health'}
                cat='Wellness'
                for k,v in cat_map.items():
                    if k.lower() in topic.lower(): cat=v; break
                rows.append({
                    'id':uid(pmid),'pmid':pmid,'title':title[:500],
                    'authors':fa,'journal':journal,'pub_date':pd,
                    'category':cat,'search_topic':topic,'query_term':topic,
                    'study_type':pt.replace('+',' '),
                    'url':f'https://pubmed.ncbi.nlm.nih.gov/{pmid}/'
                })
            if ids: break
        time.sleep(0.35)
    s=upsert('pubmed_studies',rows)
    log(f'✅ PubMed: {s} studies')
    return s

# ════════════════════════════════════════════
# 4. YOUTUBE
# Schema: id(uuid), video_id, title, channel_name, channel_id,
#   description, published_at, view_count, like_count, comment_count, search_topic
# ════════════════════════════════════════════
YT_SEARCHES=[
    'Andrew Huberman sleep protocol','Andrew Huberman supplements','Peter Attia longevity',
    'Rhonda Patrick vitamin D','Mark Hyman gut health','Bryan Johnson anti aging',
    'Thomas DeLauer intermittent fasting','Dr Berg vitamins','Layne Norton protein',
    'Jeff Nippard creatine','Dr Rangan Chatterjee stress','Dr Mindy Pelz fasting women',
    'best supplements 2025 science','vitamin D deficiency fix','magnesium glycinate benefits',
    'omega 3 brain health','ashwagandha cortisol','gut health probiotics science',
    'creatine benefits beyond muscle','intermittent fasting science','cold plunge benefits',
    'meditation neuroscience','reduce inflammation naturally','longevity supplements',
    'drug interactions supplements warning','CBD oil science','turmeric absorption tips',
    'berberine blood sugar','lion mane mushroom brain','NAD NMN aging',
    'sauna health benefits','sleep optimization guide','exercise mental health',
    'gut brain connection','hormone optimization naturally','new orleans wellness',
]

def run_youtube():
    print(f'\n🎥 YOUTUBE — {len(YT_SEARCHES)} searches')
    rows=[];seen=set()
    for si,q in enumerate(YT_SEARCHES):
        if si%10==0: log(f'YT [{si}/{len(YT_SEARCHES)}] — {len(rows)} videos')
        url=f'https://www.googleapis.com/youtube/v3/search?part=snippet&q={quote(q)}&type=video&maxResults=5&relevanceLanguage=en&key={YT_KEY}'
        data=fetch(url)
        if not data or 'items' not in data: time.sleep(0.5); continue
        vids=[i['id']['videoId'] for i in data['items'] if i.get('id',{}).get('videoId')]
        if not vids: continue
        stats=fetch(f'https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id={",".join(vids)}&key={YT_KEY}')
        if stats and 'items' in stats:
            for v in stats['items']:
                vid=v['id']
                if vid in seen: continue
                seen.add(vid)
                sn=v.get('snippet',{})
                st=v.get('statistics',{})
                rows.append({
                    'id':uid(vid),'video_id':vid,'title':sn.get('title','')[:300],
                    'channel_name':sn.get('channelTitle',''),
                    'channel_id':sn.get('channelId',''),
                    'description':sn.get('description','')[:1000],
                    'published_at':sn.get('publishedAt',''),
                    'view_count':int(st.get('viewCount',0)),
                    'like_count':int(st.get('likeCount',0)),
                    'comment_count':int(st.get('commentCount',0)),
                    'search_topic':q
                })
        time.sleep(0.3)
    s=upsert('youtube_videos',rows)
    log(f'✅ YouTube: {s} videos')
    return s

# ════════════════════════════════════════════
# 5. GOOGLE PLACES → LOCATIONS
# Schema: id(uuid), name, address, city, state, zip, latitude, longitude,
#   avg_rating, review_count, type, source, trust_score
# ════════════════════════════════════════════
PLACE_TYPES=[
    'wellness center','yoga studio','meditation center','acupuncture',
    'chiropractor','naturopath','massage therapist','fitness gym',
    'health food store','organic grocery','juice bar','spa',
    'float tank','cryotherapy','sauna','pilates studio',
    'martial arts','crossfit','physical therapy','mental health counselor',
    'holistic health','functional medicine','vitamin store','supplement store',
]
PLACE_CITIES=[
    ('New Orleans',29.9511,-90.0715),('Metairie',29.984,-90.153),
    ('Baton Rouge',30.451,-91.187),('Houston',29.760,-95.370),
    ('Atlanta',33.749,-84.388),('Miami',25.762,-80.192),
    ('Austin',30.267,-97.743),('Nashville',36.163,-86.782),
    ('Denver',39.739,-104.990),('Charlotte',35.227,-80.843),
    ('Los Angeles',34.052,-118.244),('New York',40.713,-74.006),
    ('Chicago',41.878,-87.630),('San Francisco',37.775,-122.419),
    ('Seattle',47.606,-122.332),
]

def run_google():
    print(f'\n📍 PLACES — {len(PLACE_CITIES)} cities × {len(PLACE_TYPES)} types')
    rows=[];seen=set()
    for ci,(city,lat,lng) in enumerate(PLACE_CITIES):
        log(f'📍 [{ci+1}/{len(PLACE_CITIES)}] {city}...')
        cc=0
        for pt in PLACE_TYPES:
            url=f'https://maps.googleapis.com/maps/api/place/textsearch/json?query={quote(pt)}+in+{quote(city)}&key={GOOGLE_KEY}'
            data=fetch(url)
            if not data or 'results' not in data: continue
            for p in data['results']:
                pid=p.get('place_id','')
                if not pid or pid in seen: continue
                seen.add(pid)
                loc=p.get('geometry',{}).get('location',{})
                addr=p.get('formatted_address','')
                # Extract state/zip from address
                st='';zp=''
                parts=addr.split(',')
                if len(parts)>=3:
                    sz=parts[-2].strip().split()
                    if len(sz)>=2: st=sz[0]; zp=sz[1] if len(sz)>1 else ''
                rows.append({
                    'id':uid(pid),'name':p.get('name','')[:200],
                    'address':addr,'city':city,'state':st,'zip':zp,
                    'latitude':loc.get('lat',0),'longitude':loc.get('lng',0),
                    'avg_rating':p.get('rating',0),
                    'review_count':p.get('user_ratings_total',0),
                    'type':pt,'source':'google_places','trust_score':0
                })
                cc+=1
            time.sleep(0.12)
        log(f'   → {cc} locations')
        if (ci+1)%5==0 and rows:
            upsert('locations',rows); rows=[]
    if rows: upsert('locations',rows)
    log(f'✅ Places: {len(seen)} locations')
    return len(seen)

# ════════════════════════════════════════════
# 6. CLINICAL TRIALS
# Schema: id(uuid), nct_id, title, brief_title, status, phase,
#   summary, location, enrollment, start_date, search_topic, url, source
# ════════════════════════════════════════════
TRIAL_TOPICS=[
    'vitamin D supplementation','magnesium sleep','omega-3 depression',
    'probiotics gut health','turmeric inflammation','ashwagandha anxiety',
    'CBD pain','meditation stress','intermittent fasting','creatine cognitive',
    'lion mane mushroom','berberine diabetes','CoQ10 heart failure',
    'melatonin insomnia','NAD+ aging','resveratrol cardiovascular',
    'exercise mental health','yoga chronic pain','acupuncture pain',
    'sauna cardiovascular','psilocybin depression','ketamine depression',
    'cold exposure recovery','GLP-1 obesity','gut microbiome immunity',
]

def run_trials():
    print(f'\n🔬 TRIALS — {len(TRIAL_TOPICS)} topics')
    rows=[];seen=set()
    for topic in TRIAL_TOPICS:
        for status in ['RECRUITING','ACTIVE_NOT_RECRUITING']:
            url=f'https://clinicaltrials.gov/api/v2/studies?query.term={quote(topic)}&filter.overallStatus={status}&pageSize=10&format=json'
            data=fetch(url)
            if not data or 'studies' not in data: continue
            for study in data['studies']:
                proto=study.get('protocolSection',{})
                ident=proto.get('identificationModule',{})
                nct=ident.get('nctId','')
                if not nct or nct in seen: continue
                seen.add(nct)
                sm=proto.get('statusModule',{})
                dm=proto.get('designModule',{})
                desc=proto.get('descriptionModule',{})
                clm=proto.get('contactsLocationsModule',{})
                locs=clm.get('locations',[])
                loc_str=f"{locs[0].get('city','')}, {locs[0].get('state','')}" if locs else ''
                rows.append({
                    'id':uid(nct),'nct_id':nct,
                    'title':ident.get('officialTitle',ident.get('briefTitle',''))[:500],
                    'brief_title':ident.get('briefTitle','')[:300],
                    'status':sm.get('overallStatus',''),
                    'phase':str(dm.get('phases',[''])),
                    'summary':desc.get('briefSummary','')[:1000],
                    'location':loc_str,
                    'enrollment':dm.get('enrollmentInfo',{}).get('count',0) or 0,
                    'start_date':sm.get('startDateStruct',{}).get('date',''),
                    'search_topic':topic,
                    'url':f'https://clinicaltrials.gov/study/{nct}',
                    'source':'clinicaltrials_gov'
                })
        time.sleep(0.3)
    s=upsert('clinical_trials',rows)
    log(f'✅ Trials: {s}')
    return s

# ════════════════════════════════════════════
# 7. EVENTS
# Schema: id(uuid), title, description, category, city, source, url
# ════════════════════════════════════════════
def run_events():
    print('\n🎪 EVENTS')
    rows=[];seen=set()
    etypes=['yoga','meditation','wellness workshop','fitness class','sound bath',
        'breathwork','nutrition workshop','cooking class healthy','tai chi','qigong',
        'running club','hiking','dance fitness','boxing fitness','self defense',
        'reiki','sound healing','herbalism','fermentation class']
    for city,state in ALL_CITIES[:20]:
        for et in etypes:
            eid=uid(f'{et}-{city}')
            if eid in seen: continue
            seen.add(eid)
            rows.append({
                'id':eid,'title':f'{et.title()} in {city}',
                'description':f'Find {et} events and classes near you in {city}, {state}',
                'category':et.split()[0].title(),'city':city,
                'source':'eventbrite',
                'url':f'https://www.eventbrite.com/d/{state.lower()}--{quote(city.lower().replace(" ","-"))}/{quote(et.replace(" ","-"))}/'
            })
    s=upsert('events',rows)
    log(f'✅ Events: {s}')
    return s

# ════════════════════════════════════════════
# 8. CURATED BLEU PICKS
# Schema: id(uuid), name, brand, category, form, source, trust_score,
#   url_amazon, url_iherb, shield_category, is_bleu_pick
# ════════════════════════════════════════════
def run_curated():
    print('\n🔥 BLEU PICKS')
    products=[
        ('Vitamin D3+K2 5000IU','Sports Research','Immunity','B00TGMNNZ4',94,'Nutrition'),
        ('Magnesium Glycinate 400mg','NOW Foods','Sleep','B000OQ2DL4',94,'Sleep'),
        ('Ultimate Omega 1280mg','Nordic Naturals','Heart','B002CQU564',95,'Nutrition'),
        ('Ashwagandha KSM-66 600mg','Jarrow Formulas','Stress','B0BXMVW1HN',91,'Mindset'),
        ('Creatine Monohydrate','Thorne','Performance','B07L5NRVQX',97,'Movement'),
        ('L-Theanine 200mg','NOW Foods','Focus','B000H7P9M0',89,'Mindset'),
        ('Probiotics 50 Billion','Garden of Life','Gut Health','B010OIFN48',90,'Nutrition'),
        ('LMNT Electrolyte Mix','LMNT','Hydration','B08GRP7WYQ',93,'Recovery'),
        ('CoQ10 200mg Ubiquinol','Jarrow Formulas','Heart','B0013OQBZQ',88,'Recovery'),
        ('Zinc Picolinate 50mg','Thorne','Immunity','B000KHPMXE',86,'Nutrition'),
        ('Berberine 500mg','Thorne','Metabolic','B09G981PYB',87,'Nutrition'),
        ('Lions Mane 1000mg','Host Defense','Brain','B00BBYB5HI',85,'Mindset'),
        ('Curcumin Phytosome','Thorne','Inflammation','B0797JK6BN',90,'Recovery'),
        ('B-Complex #12','Thorne','Energy','B002RL8FBU',88,'Nutrition'),
        ('Collagen Peptides','Vital Proteins','Beauty','B00NLR1PX0',84,'Recovery'),
        ('AG1 Greens Powder','Athletic Greens','Foundation','B09P5GX46N',82,'Nutrition'),
        ('Rhodiola Rosea 500mg','NOW Foods','Energy','B001CZSG4Q',83,'Mindset'),
        ('NAC 600mg','NOW Foods','Detox','B00H9WNMAK',86,'Recovery'),
        ('Glucosamine Chondroitin','NOW Foods','Joints','B0013OVZJG',81,'Movement'),
        ('Elderberry Extract','Natures Way','Immunity','B004AIRMRC',80,'Nutrition'),
        ('Melatonin 3mg','NOW Foods','Sleep','B003KLRB2A',79,'Sleep'),
        ('Reishi Mushroom','Host Defense','Immunity','B00BBYB62E',83,'Sleep'),
        ('Alpha Lipoic Acid 600mg','NOW Foods','Antioxidant','B0013OUBB0',82,'Recovery'),
        ('Vitamin C 1000mg','NOW Foods','Immunity','B0013HVHWM',85,'Nutrition'),
        ('Selenium 200mcg','NOW Foods','Thyroid','B0013OXFPA',80,'Nutrition'),
        ('Milk Thistle Extract','NOW Foods','Liver','B0013OVZLG',81,'Recovery'),
        ('GABA 500mg','NOW Foods','Calm','B0013OVZAM',78,'Mindset'),
        ('5-HTP 200mg','NOW Foods','Mood','B0013OXD38',80,'Mindset'),
        ('Cordyceps Mushroom','Host Defense','Energy','B00BBYB5IA',82,'Movement'),
        ('Turkey Tail Mushroom','Host Defense','Immunity','B00GY9B550',81,'Nutrition'),
        ('MCT Oil Powder','Perfect Keto','Energy','B07C3TPFYL',79,'Mindset'),
        ('Whey Protein Isolate','Optimum Nutrition','Performance','B000QSNYGI',88,'Movement'),
        ('Fish Oil Triple Strength','Nature Made','Heart','B004U3Y9FU',86,'Nutrition'),
        ('Vitamin B12 Methylcobalamin','Jarrow Formulas','Energy','B0013OQBZQ',87,'Nutrition'),
        ('Iron Bisglycinate','Thorne','Blood','B000FGWFUS',83,'Nutrition'),
        ('Folate 5-MTHF 1mg','Thorne','Prenatal','B002RL8FCS',85,'Nutrition'),
        ('Biotin 10000mcg','Sports Research','Beauty','B00JGCBGZQ',77,'Recovery'),
        ('Quercetin 500mg','NOW Foods','Allergy','B0015HOGEG',81,'Recovery'),
        ('Resveratrol 200mg','NOW Foods','Longevity','B003VW0FAO',80,'Recovery'),
        ('NMN 250mg','ProHealth','Longevity','B08C5N7HBH',83,'Recovery'),
        ('Psyllium Husk Powder','NOW Foods','Fiber','B002RWUNYM',78,'Nutrition'),
        ('DIM 200mg','NOW Foods','Hormones','B003KVKGOU',79,'Recovery'),
        ('Saw Palmetto 320mg','NOW Foods','Prostate','B0013OXEXW',77,'Recovery'),
        ('Boron 3mg','NOW Foods','Bones','B005K8FXJG',74,'Nutrition'),
        ('Pea Protein Powder','NOW Foods','Performance','B003JEX3KA',80,'Movement'),
        ('Bone Broth Protein','Ancient Nutrition','Gut','B01LNYNQ0A',81,'Recovery'),
        ('Chaga Mushroom','Host Defense','Antioxidant','B00BBYB5IU',80,'Nutrition'),
        ('Vitamin A 10000IU','NOW Foods','Vision','B0019LTJ8S',78,'Nutrition'),
        ('Potassium Citrate 99mg','NOW Foods','Heart','B003JET232',75,'Nutrition'),
        ('Vitamin E 400IU','NOW Foods','Antioxidant','B000MGS1L8',76,'Nutrition'),
    ]
    rows=[]
    for name,brand,cat,asin,score,shield in products:
        iq=quote(name[:40])
        rows.append({
            'id':uid(name),'name':name,'brand':brand,
            'category':cat,'form':'Supplement','source':'bleu_curated',
            'trust_score':score,
            'url_amazon':f'https://www.amazon.com/dp/{asin}?tag={AMZ_TAG}',
            'url_iherb':f'https://www.iherb.com/search?kw={iq}&rcode={IHERB}',
            'shield_category':shield,'is_bleu_pick':True
        })
    s=upsert('products',rows)
    log(f'✅ Curated: {s} BLEU Picks')
    return s

# ════════════════════════════════════════════
# STATUS + MAIN
# ════════════════════════════════════════════
def status():
    print('\n'+'═'*55)
    print('  📊 BLEU DATA TANK STATUS')
    print('═'*55)
    total=0
    for t in ['practitioners','products','youtube_videos','pubmed_studies','locations','events','clinical_trials']:
        c=count(t); total+=c
        bar='█'*min(c//50,30)
        s='✅' if c>0 else '❌'
        print(f'  {s} {t:20s} {c:>7,}  {bar}')
    print(f'\n  🏆 TOTAL: {total:,} records')
    print('═'*55)

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--all',action='store_true')
    p.add_argument('--nola',action='store_true')
    p.add_argument('--source',type=str)
    p.add_argument('--status',action='store_true')
    a=p.parse_args()
    print('╔══════════════════════════════════════════════════╗')
    print('║   BLEU TANK FILLER v4 — Schema-Matched           ║')
    print('╚══════════════════════════════════════════════════╝')
    if a.status: status(); return
    sources={'npi':lambda:run_npi(),'nola':lambda:run_npi(NOLA),'fda':run_fda,
        'pubmed':run_pubmed,'youtube':run_youtube,'google':run_google,
        'trials':run_trials,'events':run_events,'curated':run_curated}
    if a.source:
        if a.source in sources: sources[a.source](); status()
        else: print(f'Unknown: {a.source}. Options: {", ".join(sources.keys())}')
    elif a.nola:
        for s in ['curated','nola','fda','pubmed','youtube','google','trials','events']:
            try: sources[s]()
            except Exception as e: print(f'  ❌ {s}: {e}')
        status()
    elif a.all:
        print('\n🚀 FULL TANK FILL\n')
        start=time.time()
        for s in ['curated','npi','fda','pubmed','youtube','google','trials','events']:
            try:
                sources[s]()
                log(f'⏱ {(time.time()-start)/60:.1f}min — {TOTAL:,} stored')
            except Exception as e:
                print(f'  ❌ {s}: {e}')
                import traceback; traceback.print_exc()
        print(f'\n🏁 DONE — {(time.time()-start)/60:.1f} minutes, {TOTAL:,} new records')
        status()
    else:
        print(f'Usage: python3 tank-filler.py --all | --nola | --source X | --status')
        print(f'Sources: {", ".join(sources.keys())}')

if __name__=='__main__': main()
