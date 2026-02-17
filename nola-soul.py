#!/usr/bin/env python3
"""
BLEU SOUL DATA — Hand-curated NOLA wellness intelligence
The human layer. Real businesses, real stories, real culture.
This is what makes BLEU feel alive.

Run: python3 nola-soul.py
"""
import os, json, hashlib, time
from urllib.request import urlopen, Request

SB_URL = os.environ.get('SUPABASE_URL', 'https://sqyzboesdpdussiwqpzk.supabase.co')
SB_KEY = os.environ.get('SUPABASE_SERVICE_KEY', os.environ.get('SUPABASE_KEY', ''))
if not SB_KEY:
    SB_KEY = os.environ.get('SUPABASE_ANON_KEY', '')

def sb_upsert(table, rows):
    if not rows: return 0
    h = {'apikey': SB_KEY, 'Authorization': f'Bearer {SB_KEY}',
         'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates'}
    total = 0
    for i in range(0, len(rows), 50):
        batch = rows[i:i+50]
        try:
            req = Request(f'{SB_URL}/rest/v1/{table}', data=json.dumps(batch).encode(), headers=h, method='POST')
            urlopen(req, timeout=30)
            total += len(batch)
        except Exception as e:
            print(f'  ⚠ {table}: {e}')
    return total

def mid(s): return hashlib.md5(s.encode()).hexdigest()[:12]

print('🎺 BLEU SOUL DATA — Curated NOLA Wellness Intelligence')
print('=' * 55)

# ══════════════════════════════════════════════════════════
# CURATED NOLA PRACTITIONERS — Real humans, real practices
# ══════════════════════════════════════════════════════════
print('\n👤 Loading curated NOLA practitioners...')
practitioners = [
    # Holistic / Integrative
    {'full_name': 'Dr. Lisa & Matthew Ancira', 'specialty': 'Naturopathic Medicine + Massage Therapy',
     'city': 'New Orleans', 'state': 'LA', 'address': '1325 Amelia St',
     'phone': '', 'source': 'bleu_curated', 'trust_score': 85,
     'provider_organization_name': 'Higher Purpose Healing Center',
     'bio': 'Eastern & Western medicine practitioners combining energy healing, neuromuscular massage therapy, and meditation for total body recovery.'},
    {'full_name': 'Dr. Rian Charé Bush, LAc', 'specialty': 'Acupuncture + Traditional Chinese Medicine',
     'city': 'New Orleans', 'state': 'LA', 'address': '',
     'phone': '', 'source': 'bleu_curated', 'trust_score': 88,
     'provider_organization_name': 'Satsang Awakening Acupuncture & Holistic Health',
     'bio': 'Licensed Acupuncturist specializing in herbal medicine, tuina bodywork, seichim energy medicine, cupping, moxibustion, and spiritual consultation.'},
    {'full_name': 'Dr. Audrey Le, MD', 'specialty': 'Functional Medicine + Acupuncture',
     'city': 'New Orleans', 'state': 'LA', 'address': '',
     'phone': '', 'source': 'bleu_curated', 'trust_score': 92,
     'provider_organization_name': 'Audrey Le MD Holistic Fertility & Acupuncture',
     'bio': 'Board-certified physician specializing in functional medicine for women. Thyroid, hormones, gut health, fertility. Personalized lab testing and acupuncture.'},
    {'full_name': 'Dr. Joseph Mather, MD, MPH', 'specialty': 'Functional Medicine + Internal Medicine',
     'city': 'New Orleans', 'state': 'LA', 'address': '',
     'phone': '', 'source': 'bleu_curated', 'trust_score': 93,
     'provider_organization_name': 'Dr. Mather Functional Medicine',
     'bio': 'Board certified family medicine. Specializes in gut health, autoimmune conditions, mold illness, heavy metals. Ethical approach: discounts supplements, never marks up labs. Root cause medicine.'},
    {'full_name': 'Jess Tregle, Msc.D.', 'specialty': 'Intuitive Healing + Energy Medicine',
     'city': 'New Orleans', 'state': 'LA', 'address': '',
     'phone': '', 'source': 'bleu_curated', 'trust_score': 78,
     'provider_organization_name': 'Jess Tregle Healing',
     'bio': 'Intuitive healing practitioner using energy techniques to help clients feel lighter and reconnect with their authentic self.'},
    {'full_name': 'Michael Moran', 'specialty': 'Holistic Health + Colonics + Nutrition',
     'city': 'New Orleans', 'state': 'LA', 'address': '',
     'phone': '', 'source': 'bleu_curated', 'trust_score': 80,
     'provider_organization_name': 'Wholistic Solutions',
     'bio': 'Passionate about holistic health, nutrition, and colonics. Comprehensive approach to detoxification and digestive wellness.'},
    {'full_name': 'Michelle Clay, DO, CHHC', 'specialty': 'Osteopathic Medicine + Holistic Health',
     'city': 'New Orleans', 'state': 'LA', 'address': '',
     'phone': '', 'source': 'bleu_curated', 'trust_score': 87,
     'provider_organization_name': 'Dr. Michelle Clay Holistic Wellness',
     'bio': 'Doctor of Osteopathic Medicine and Certified Holistic Health Coach. Bridges conventional and holistic approaches.'},
    # Integrative Psychiatry
    {'full_name': 'Dara Wellness Team', 'specialty': 'Integrative Psychiatry + Whole Health',
     'city': 'New Orleans', 'state': 'LA', 'address': '',
     'phone': '', 'source': 'bleu_curated', 'trust_score': 89,
     'provider_organization_name': 'Dara Wellness NOLA',
     'bio': 'Integrative psychiatry including nutrition, sleep management, lifestyle modification, tai chi, yoga, and mindfulness. Telemedicine available.'},
    # Nutrition / Functional
    {'full_name': 'Danielle Paciera, LDN, RD, CCN', 'specialty': 'Registered Dietitian + Clinical Nutritionist',
     'city': 'New Orleans', 'state': 'LA', 'address': '',
     'phone': '', 'source': 'bleu_curated', 'trust_score': 86,
     'provider_organization_name': '365 Vitality',
     'bio': 'Licensed dietitian and certified clinical nutritionist specializing in functional nutrition, dry needling, and eastern medicine integration.'},
    {'full_name': 'Vitry Wellness Team', 'specialty': 'Functional Medicine + Lab Testing',
     'city': 'New Orleans', 'state': 'LA', 'address': '',
     'phone': '', 'source': 'bleu_curated', 'trust_score': 84,
     'provider_organization_name': 'Vitry Wellness',
     'bio': 'Functional medicine lab tests uncovering root causes: detoxification issues, food sensitivities, gut imbalances. Personalized wellness plans with herbal remedies.'},
    # Counseling / Mental Health
    {'full_name': 'Hope Gersovitz & Jessica Joyce', 'specialty': 'Licensed Counseling + Reiki + Energy Healing',
     'city': 'New Orleans', 'state': 'LA', 'address': 'Canal Street, Mid-City',
     'phone': '', 'source': 'bleu_curated', 'trust_score': 83,
     'provider_organization_name': 'Theratique',
     'bio': 'Therapeutic boutique in Mid-City offering individual counseling, couples counseling, Reiki, energy services, and telecounseling. Holistic approach to mind, body, spirit.'},
    # Integrity Health
    {'full_name': 'Integrity Health & Wellness Team', 'specialty': 'Direct Primary Care + Holistic Medicine',
     'city': 'New Orleans', 'state': 'LA', 'address': '',
     'phone': '', 'source': 'bleu_curated', 'trust_score': 86,
     'provider_organization_name': 'Integrity Health & Wellness',
     'bio': 'Direct primary care combining personalized medicine with holistic health approaches. True health goes beyond treating symptoms.'},
    # Black-Owned Wellness
    {'full_name': 'Dee — Deep Wellness NOLA', 'specialty': 'Holistic Nutrition + Wellness Coaching',
     'city': 'New Orleans', 'state': 'LA', 'address': '',
     'phone': '', 'source': 'bleu_curated', 'trust_score': 82,
     'provider_organization_name': 'Deep Wellness NOLA',
     'bio': 'Black-owned wellness practice empowering clients to make their own health decisions. Community-focused COVID response and long-term wellness education.'},
    {'full_name': 'Morrisa Jenkins', 'specialty': 'Aesthetician + Holistic Wellness',
     'city': 'New Orleans', 'state': 'LA', 'address': '',
     'phone': '', 'source': 'bleu_curated', 'trust_score': 81,
     'provider_organization_name': 'Freedom Apothecary',
     'bio': 'Black woman-owned wellness space. Tinctures, botanical skincare, mixing bar, facials, seminars, book groups. Radical self-care as community wellness. Formerly Philadelphia, now revolutionizing NOLA wellness.'},
    # Yoga Teachers / Studios
    {'full_name': 'Seán Johnson', 'specialty': 'Yoga + Meditation + Kirtan Music',
     'city': 'New Orleans', 'state': 'LA', 'address': '',
     'phone': '', 'source': 'bleu_curated', 'trust_score': 84,
     'provider_organization_name': 'Wild Lotus Yoga',
     'bio': 'Founder of Wild Lotus Yoga. Heart-centered yoga and down-to-earth spirituality. Master degree from Naropa Institute. Teaches at Yoga Journal, Kripalu, Bhakti Fest internationally.'},
    {'full_name': 'Balance Yoga & Wellness Team', 'specialty': 'Ashtanga + Vinyasa + Alignment Yoga',
     'city': 'New Orleans', 'state': 'LA', 'address': '',
     'phone': '', 'source': 'bleu_curated', 'trust_score': 85,
     'provider_organization_name': 'Balance Yoga & Wellness',
     'bio': 'Urban sanctuary offering ashtanga, anusara, vinyasa, pranayama, and wellness workshops. 2026 Yoga Challenge active. 30 days unlimited for $48.'},
    {'full_name': 'Magnolia Yoga Studio Team', 'specialty': 'Heated + Therapeutic Yoga',
     'city': 'New Orleans', 'state': 'LA', 'address': '',
     'phone': '', 'source': 'bleu_curated', 'trust_score': 83,
     'provider_organization_name': 'Magnolia Yoga Studio',
     'bio': "New Orleans' first Black-owned yoga studio. Heated and therapeutic classes for beginners, elders, and all levels. Community-centered."},
    {'full_name': 'Free To Be Power Yoga Team', 'specialty': 'Power Yoga + Hot Yoga',
     'city': 'New Orleans', 'state': 'LA', 'address': '725 Magazine St, Floor 2',
     'phone': '', 'source': 'bleu_curated', 'trust_score': 87,
     'provider_organization_name': 'Free To Be Power Yoga',
     'bio': '#1 rated New Orleans yoga studio. Women-owned. Heated power yoga, vinyasa, restorative, HIIT & yoga. Eucalyptus-scented towels. Community oriented.'},
    {'full_name': 'Sama Studio Team', 'specialty': 'Donation-Based Yoga + Meditation + Dharma',
     'city': 'New Orleans', 'state': 'LA', 'address': '',
     'phone': '', 'source': 'bleu_curated', 'trust_score': 82,
     'provider_organization_name': 'Sama Studio',
     'bio': 'Donation-based yoga, meditation, dharma, and retreats. Virtual studio serving Greater New Orleans. Ancient wisdom for modern practitioners.'},
    {'full_name': 'Swan River Yoga Team', 'specialty': 'Community Yoga + Wellness',
     'city': 'New Orleans', 'state': 'LA', 'address': 'Canal Street, Mid-City',
     'phone': '', 'source': 'bleu_curated', 'trust_score': 84,
     'provider_organization_name': 'Swan River Yoga Mid-City Mandir',
     'bio': 'Community yoga space in Mid-City since 2008. All welcome. NOLA institution for accessible yoga and wellness.'},
    {'full_name': 'Spyre Wellness Team', 'specialty': 'Yoga + HIIT + Pilates + Boxing',
     'city': 'New Orleans', 'state': 'LA', 'address': 'Prytania Street',
     'phone': '', 'source': 'bleu_curated', 'trust_score': 85,
     'provider_organization_name': 'Spyre',
     'bio': 'Holistic wellness center in historic setting. Yoga, HIIT, pilates, boxing, water aerobics. Calm and peaceful atmosphere.'},
]

# Add IDs
for p in practitioners:
    p['id'] = mid(p['full_name'])
    p['city'] = p.get('city', 'New Orleans')
    p['state'] = p.get('state', 'LA')

stored = sb_upsert('practitioners', practitioners)
print(f'  ✅ {stored} curated practitioners stored')

# ══════════════════════════════════════════════════════════
# CURATED NOLA LOCATIONS — Real wellness landmarks
# ══════════════════════════════════════════════════════════
print('\n📍 Loading curated NOLA locations...')
locations = [
    {'name': 'New Orleans Healing Center', 'address': '2372 St Claude Ave, New Orleans, LA 70117',
     'latitude': 29.9674, 'longitude': -90.0467, 'rating': 4.5, 'total_ratings': 200,
     'business_type': 'wellness center', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Community center housing 20+ businesses: food co-op, yoga, fitness, botanica, art galleries, restaurants. Free food pantry. Monthly clothing swap. Poetry festivals. The heart of NOLA holistic culture.'},
    {'name': 'NOLA Food Co-Op', 'address': '2372 St Claude Ave Suite 110, New Orleans, LA 70117',
     'latitude': 29.9674, 'longitude': -90.0467, 'rating': 4.3, 'total_ratings': 150,
     'business_type': 'organic grocery', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Member-owned co-op since 2002 (survived Katrina). Local, organic, fair trade groceries. Community-owned food access in a former food desert.'},
    {'name': 'The Herb Import Company', 'address': '5055 Canal St, New Orleans, LA 70119',
     'latitude': 29.9672, 'longitude': -90.1064, 'rating': 4.6, 'total_ratings': 180,
     'business_type': 'herb shop', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Wild Harvest herbs, teas, prayer candles, incense, oils, and botanicals. Cafe attached. NOLA institution for herbalism and natural health.'},
    {'name': 'The Green Fork', 'address': 'New Orleans, LA',
     'latitude': 29.9511, 'longitude': -90.0715, 'rating': 4.5, 'total_ratings': 100,
     'business_type': 'health food store', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Top-rated health food destination in New Orleans.'},
    {'name': 'Natural Drinks Health Food Store', 'address': '141 Allen Toussaint Blvd, New Orleans, LA',
     'latitude': 29.9724, 'longitude': -90.0312, 'rating': 4.7, 'total_ratings': 50,
     'business_type': 'juice bar', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Sea moss gel, date coffee, tamarind coffee, cold press juice, herbal tea blends, herbal supplements, juice coaching, smoothies. Black-owned.'},
    {'name': 'Freedom Apothecary', 'address': 'New Orleans, LA',
     'latitude': 29.9511, 'longitude': -90.0715, 'rating': 4.8, 'total_ratings': 45,
     'business_type': 'apothecary', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Black woman-owned wellness space. Tinctures, women-founded skincare, botanical mixing bar, farm-to-face facials. Radical self-care community hub.'},
    {'name': 'Higher Purpose Healing Center', 'address': '1325 Amelia St, New Orleans, LA 70115',
     'latitude': 29.9269, 'longitude': -90.0897, 'rating': 4.9, 'total_ratings': 28,
     'business_type': 'holistic health', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Naturopathic doctors, massage therapy, energy healing, meditation therapy. Eastern & Western medicine integration.'},
    {'name': 'Wild Lotus Yoga', 'address': 'New Orleans, LA',
     'latitude': 29.9511, 'longitude': -90.0715, 'rating': 4.8, 'total_ratings': 95,
     'business_type': 'yoga studio', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Heart-centered yoga and down-to-earth spirituality. Teacher training program. Founded by Sean Johnson.'},
    {'name': 'Balance Yoga & Wellness', 'address': 'New Orleans, LA',
     'latitude': 29.9511, 'longitude': -90.0715, 'rating': 4.7, 'total_ratings': 120,
     'business_type': 'yoga studio', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Peaceful urban sanctuary. Ashtanga, anusara, vinyasa, pranayama, wellness workshops. $95/month unlimited. Mysore Ashtanga MWF.'},
    {'name': 'Free To Be Power Yoga', 'address': '725 Magazine St Floor 2, New Orleans, LA 70130',
     'latitude': 29.9441, 'longitude': -90.0712, 'rating': 4.9, 'total_ratings': 200,
     'business_type': 'yoga studio', 'city': 'New Orleans', 'state': 'LA',
     'bio': '#1 rated New Orleans yoga studio. Women-owned. Power yoga, hot yoga, restorative, HIIT. Eucalyptus towels.'},
    {'name': 'Swan River Yoga Mid-City Mandir', 'address': 'Canal Street, New Orleans, LA',
     'latitude': 29.9644, 'longitude': -90.0879, 'rating': 4.6, 'total_ratings': 85,
     'business_type': 'yoga studio', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Community yoga space since 2008. Mid-City institution. All levels welcome.'},
    {'name': 'Magnolia Yoga Studio', 'address': 'New Orleans, LA',
     'latitude': 29.9511, 'longitude': -90.0715, 'rating': 4.7, 'total_ratings': 60,
     'business_type': 'yoga studio', 'city': 'New Orleans', 'state': 'LA',
     'bio': "New Orleans' first Black-owned yoga studio. Heated and therapeutic classes for all."},
    {'name': 'Spyre', 'address': 'Prytania Street, New Orleans, LA',
     'latitude': 29.9270, 'longitude': -90.0890, 'rating': 4.7, 'total_ratings': 70,
     'business_type': 'wellness center', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Holistic wellness center. Yoga, HIIT, pilates, boxing, water aerobics. Historic setting, calm atmosphere.'},
    {'name': 'Sama Studio', 'address': 'New Orleans, LA',
     'latitude': 29.9511, 'longitude': -90.0715, 'rating': 4.8, 'total_ratings': 40,
     'business_type': 'meditation center', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Donation-based yoga, meditation, dharma, retreats. Virtual studio. Ancient wisdom for modern seekers.'},
    {'name': 'Theratique', 'address': 'Canal Street, Mid-City, New Orleans, LA',
     'latitude': 29.9596, 'longitude': -90.0835, 'rating': 4.8, 'total_ratings': 35,
     'business_type': 'mental health counselor', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Therapeutic boutique. Licensed counselors, Reiki, energy healing, telecounseling. Safe space for rest, relaxation, centering.'},
    {'name': 'Whole Foods Market Magazine', 'address': '5600 Magazine St, New Orleans, LA 70115',
     'latitude': 29.9182, 'longitude': -90.1026, 'rating': 4.3, 'total_ratings': 500,
     'business_type': 'organic grocery', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Full supplement section, organic produce, prepared foods. Uptown location.'},
    {'name': 'Whole Foods Market Broad', 'address': '300 N Broad St Suite 103, New Orleans, LA 70119',
     'latitude': 29.9626, 'longitude': -90.0819, 'rating': 4.2, 'total_ratings': 400,
     'business_type': 'organic grocery', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Mid-City location. Full supplement section, organic produce. Near Bayou St John.'},
    {'name': 'Rouses Market CBD', 'address': '701 Baronne St, New Orleans, LA 70113',
     'latitude': 29.9484, 'longitude': -90.0760, 'rating': 4.1, 'total_ratings': 350,
     'business_type': 'organic grocery', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Louisiana-owned. Strong organic/health section. CBD location near the Quarter.'},
    {'name': 'Island of Salvation Botanica', 'address': '2372 St Claude Ave Suite 100, New Orleans, LA 70117',
     'latitude': 29.9674, 'longitude': -90.0467, 'rating': 4.7, 'total_ratings': 55,
     'business_type': 'apothecary', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Spiritual botanica inside the Healing Center. Herbs, candles, ritual supplies. Deep NOLA spiritual wellness tradition.'},
    {'name': 'Downtown Fitness Center @ NOHC', 'address': '2372 St Claude Ave, New Orleans, LA 70117',
     'latitude': 29.9674, 'longitude': -90.0467, 'rating': 4.3, 'total_ratings': 65,
     'business_type': 'fitness gym', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Inside the Healing Center. Cybex/Nautilus equipment, free weights, group classes. Accepts SilverSneakers, PeoplesHealth, UnitedHealthCare.'},
    {'name': 'St. Roch Market', 'address': '2381 St Claude Ave, New Orleans, LA 70117',
     'latitude': 29.9678, 'longitude': -90.0468, 'rating': 4.3, 'total_ratings': 900,
     'business_type': 'health food store', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Across from Healing Center. Food hall with healthy options, juice bar, local vendors. NOLA food culture hub.'},
    {'name': 'Miss Annes Maypop Herb Shop', 'address': 'New Orleans, LA',
     'latitude': 29.9511, 'longitude': -90.0715, 'rating': 4.9, 'total_ratings': 30,
     'business_type': 'herb shop', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Curated herbal apothecary. Local herbs, tinctures, teas. Traditional New Orleans herbalism.'},
    {'name': 'Raw Republic', 'address': 'New Orleans, LA',
     'latitude': 29.9511, 'longitude': -90.0715, 'rating': 4.6, 'total_ratings': 80,
     'business_type': 'juice bar', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Cold pressed juices, smoothies, acai bowls, wellness shots. Clean fuel for NOLA.'},
    {'name': 'Hydrate Here', 'address': 'New Orleans, LA',
     'latitude': 29.9511, 'longitude': -90.0715, 'rating': 4.5, 'total_ratings': 70,
     'business_type': 'wellness center', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'IV hydration therapy, vitamin shots, immune boosts. Super immune with Dr. Sonny + vitamin D shot.'},
    {'name': 'Restorative Origins', 'address': 'New Orleans, LA',
     'latitude': 29.9511, 'longitude': -90.0715, 'rating': 4.8, 'total_ratings': 25,
     'business_type': 'holistic health', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Restorative wellness practice. Body-mind restoration and healing.'},
    {'name': 'Iridescence Healing', 'address': 'New Orleans, LA',
     'latitude': 29.9511, 'longitude': -90.0715, 'rating': 4.9, 'total_ratings': 20,
     'business_type': 'holistic health', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Energy healing and holistic wellness practice in New Orleans.'},
    {'name': 'NOLA Vibe Yoga', 'address': 'New Orleans, LA',
     'latitude': 29.9511, 'longitude': -90.0715, 'rating': 4.8, 'total_ratings': 55,
     'business_type': 'yoga studio', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Yoga with NOLA vibe. Community classes and workshops.'},
    {'name': 'Nola Yoga Loft', 'address': 'New Orleans, LA',
     'latitude': 29.9511, 'longitude': -90.0715, 'rating': 4.7, 'total_ratings': 45,
     'business_type': 'yoga studio', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Intimate yoga loft space. All levels welcome.'},
    {'name': 'Freret Street Yoga', 'address': 'Freret Street, New Orleans, LA',
     'latitude': 29.9380, 'longitude': -90.0960, 'rating': 4.6, 'total_ratings': 50,
     'business_type': 'yoga studio', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Neighborhood yoga on Freret Street. Accessible classes for the community.'},
    {'name': 'NOLA Family Acupuncture', 'address': 'New Orleans, LA',
     'latitude': 29.9511, 'longitude': -90.0715, 'rating': 4.8, 'total_ratings': 40,
     'business_type': 'acupuncture', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Family-friendly acupuncture practice. Traditional Chinese medicine for all ages.'},
    {'name': 'Whole Kingdom Wellness', 'address': 'New Orleans, LA',
     'latitude': 29.9511, 'longitude': -90.0715, 'rating': 4.7, 'total_ratings': 30,
     'business_type': 'holistic health', 'city': 'New Orleans', 'state': 'LA',
     'bio': 'Whole-body wellness approach. Nutrition, movement, mindset integration.'},
]

for loc in locations:
    loc['id'] = mid(loc['name'])
    loc['source'] = 'bleu_curated'
    loc['is_open'] = True

stored = sb_upsert('locations', locations)
print(f'  ✅ {stored} curated NOLA locations stored')

# ══════════════════════════════════════════════════════════
# NOLA-SPECIFIC EVENTS
# ══════════════════════════════════════════════════════════
print('\n🎪 Loading curated NOLA events...')
events = [
    {'title': 'NOHC Monthly Clothing Swap', 'description': 'Every 3rd Thursday 5-7PM at New Orleans Healing Center. Sustainable fashion, light refreshments, community vibes.',
     'category': 'Community', 'city': 'New Orleans', 'url': 'https://www.nohc.org/', 'source': 'bleu_curated'},
    {'title': 'Mantra Meditation @ Lambda Center', 'description': 'Free mantra meditation and spiritual talk. New Orleans Healing Center Suite 270.',
     'category': 'Meditation', 'city': 'New Orleans', 'url': 'https://www.nohc.org/', 'source': 'bleu_curated'},
    {'title': '2026 Yoga Challenge at Balance Yoga', 'description': 'Kickstart your yoga practice this year. 30 days unlimited for $48.',
     'category': 'Yoga', 'city': 'New Orleans', 'url': 'https://balanceyogawellness.com/', 'source': 'bleu_curated'},
    {'title': 'Mysore Ashtanga MWF @ Balance Yoga', 'description': 'Traditional Mysore-style Ashtanga practice. Monday, Wednesday, Friday 8:30-10am.',
     'category': 'Yoga', 'city': 'New Orleans', 'url': 'https://balanceyogawellness.com/', 'source': 'bleu_curated'},
    {'title': 'Wild Lotus Teacher Training 2025-26', 'description': 'Living Yoga Teacher Training program. Heart-centered teaching methodology. Applications open.',
     'category': 'Yoga', 'city': 'New Orleans', 'url': 'https://wildlotusyoga.com/', 'source': 'bleu_curated'},
    {'title': 'Freedom Apothecary Wellness Workshops', 'description': 'Herbal education, botanical mixing, farm-to-face skincare, community self-care events.',
     'category': 'Herbalism', 'city': 'New Orleans', 'url': 'https://travelnoire.com/wellness-space-new-orleans', 'source': 'bleu_curated'},
    {'title': 'Crescent City Farmers Market', 'description': 'Fresh local produce, sustainable goods. Multiple NOLA locations weekly.',
     'category': 'Nutrition', 'city': 'New Orleans', 'url': 'https://www.crescentcityfarmersmarket.org/', 'source': 'bleu_curated'},
    {'title': 'Kolaj Fest New Orleans 2026', 'description': 'Art, community, wellness intersection. June 10-14, 2026 at the Healing Center.',
     'category': 'Art + Wellness', 'city': 'New Orleans', 'url': 'https://kolajmagazine.com/', 'source': 'bleu_curated'},
    {'title': 'Sangha Fest — Yoga + Music + Community', 'description': 'Health, wellness, conscious community. Yoga, breathwork, music, meditation, movement, dance, nature.',
     'category': 'Festival', 'city': 'New Orleans', 'url': 'https://www.sanghafest.org', 'source': 'bleu_curated'},
    {'title': 'NOLA Vibe Community Yoga', 'description': 'Community-centered yoga classes with authentic New Orleans energy.',
     'category': 'Yoga', 'city': 'New Orleans', 'url': 'https://www.yelp.com/search?cflt=yoga&find_loc=New+Orleans,+LA', 'source': 'bleu_curated'},
]

for e in events:
    e['id'] = mid(e['title'])
    e['trust_score'] = 0

stored = sb_upsert('events', events)
print(f'  ✅ {stored} curated NOLA events stored')

print('\n' + '=' * 55)
print('🎺 SOUL DATA COMPLETE — NOLA is alive in the system')
print('=' * 55)
