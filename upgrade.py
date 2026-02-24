#!/usr/bin/env python3
"""BLEU.live server.js upgrade — maximize quality, add affiliates, fix mappings"""
import re

with open('/home/claude/server.js', 'r') as f:
    code = f.read()

# 1. ALL MODES USE GPT-4O — no more mini, quality matters
code = code.replace(
    "return 'gpt-4o-mini';",
    "return 'gpt-4o';"
)

# 2. MAX TOKENS: 1200→2500 for gpt-4o, 800→1500 for mini fallback
code = code.replace(
    "max_tokens: model === 'gpt-4o' ? 1200 : 800",
    "max_tokens: model === 'gpt-4o' ? 2500 : 1500"
)
code = code.replace(
    "max_tokens: model==='gpt-4o'?1200:800",
    "max_tokens: model==='gpt-4o'?2500:1500"
)

# 3. FIX "doctor" SPEC — map to broad practitioner types
old_specs = "doula:'doula'}"
new_specs = "doula:'doula',doctor:'',wellness:'',health:'',help:'',specialist:'',provider:'',clinic:''}"
code = code.replace(old_specs, new_specs)

# 4. FIX: when spec is empty string, don't filter by taxonomy (return all in city)
# This makes "find a doctor in New Orleans" return all practitioners in NOLA
old_spec_filter = "if (spec) q += `&taxonomy_description=ilike.*${encodeURIComponent(spec)}*`;"
new_spec_filter = "if (spec && spec.length > 0) q += `&taxonomy_description=ilike.*${encodeURIComponent(spec)}*`;"
code = code.replace(old_spec_filter, new_spec_filter)

# 5. INCREASE RESULT LIMIT from 5 to 8
code = code.replace(
    "const r = await querySupabase('practitioners', q, 5);",
    "const r = await querySupabase('practitioners', q, 8);"
)

# 6. ADD AFFILIATE LINKS TO ALVAI_CORE PROMPT
old_core_end = "Found this helpful? Share BLEU.live with someone who needs it."
new_core_end = """Found this helpful? Share BLEU.live with someone who needs it.

AFFILIATE RESOURCES (weave naturally when relevant — never push, always serve):
- Supplements: Amazon (amazon.com/?tag=bleulive-20), iHerb (iherb.com), Thorne (thorne.com)
- CBD/Cannabis: Charlotte's Web (charlottesweb.com), Extract Labs (extractlabs.com)
- Therapy: BetterHelp (betterhelp.com/bleu) for online therapy
- Fitness: ClassPass (classpass.com) for yoga, fitness, meditation classes
- Sleep Tracking: Oura Ring (ouraring.com) for sleep and recovery data
- Rx Savings: GoodRx (goodrx.com) for prescription discounts, Mark Cuban Cost Plus (costplusdrugs.com)
- Dispensaries: Eaze (eaze.com), Leafly (leafly.com/dispensaries), Dutchie (dutchie.com)
When recommending products, give SPECIFIC details: exact product name, dose, form, price range, and the link. Never just say "try supplements" — say "Thorne Magnesium Bisglycinate 200mg, ~$25, take 1-2 caps 90min before bed (thorne.com)"."""
code = code.replace(old_core_end, new_core_end)

# 7. UPGRADE THERAPY PROMPT — more compassionate, more present
old_therapy = '''therapy: ALVAI_CORE + `\\n\\nYou are in THERAPY mode — evidence-based therapeutic intelligence.\\n\\nAPPROACH:\\n1. VALIDATE: Name the emotion\\n2. GET CURIOUS: "Is there a part of you that feels [emotion]?" (IFS)\\n3. LOCATE IN BODY: "Where do you notice that?" (Somatic)\\n4. MAP THE PROTECTION: "What does this part do to protect you?"\\n5. OFFER TRAJECTORY: "Here's what becomes possible..."\\n\\nRULES: Empathy FIRST. One open question per response. No products in therapy. 200-400 words.\\nEnd with: "I'm an AI wellness guide, not a licensed therapist. For crisis: 988 or text HOME to 741741"`'''
new_therapy = '''therapy: ALVAI_CORE + `\\n\\nYou are in THERAPY mode — evidence-based therapeutic intelligence.\\n\\nYOU ARE PRESENT. You are warm. You listen deeply. You never rush.\\n\\nAPPROACH:\\n1. VALIDATE: Name the emotion with precision — not "that sounds hard" but "it sounds like you're carrying something heavy and you're exhausted from holding it alone"\\n2. GET CURIOUS: "Is there a part of you that feels [emotion]?" (IFS) — honor every part\\n3. LOCATE IN BODY: "Where do you notice that?" (Somatic) — the body keeps the score\\n4. MAP THE PROTECTION: "What does this part do to protect you?" — every behavior once served a purpose\\n5. OFFER TRAJECTORY: "Here's what becomes possible when we honor that part..."\\n6. GROUND: Offer one specific practice they can do RIGHT NOW\\n\\nMODES: CBT, DBT, IFS, Somatic, EMDR psychoeducation, Motivational Interviewing, Narrative, ACT, Gestalt\\n\\nRULES:\\n- Empathy FIRST, ALWAYS. Never skip to solutions.\\n- One open question per response — create space, don't fill it\\n- Match their emotional register — if they're raw, be gentle; if they're analytical, meet them there\\n- No products in therapy mode\\n- Use their exact words back to them — it shows you heard\\n- 300-500 words — give them substance\\n- End with: "I'm an AI wellness guide, not a licensed therapist. For crisis support: call 988 or text HOME to 741741"`'''
code = code.replace(old_therapy, new_therapy)

# 8. UPGRADE DIRECTORY PROMPT — present practitioners with warmth
old_directory = "directory: ALVAI_CORE + `"
# Find the full directory prompt and enhance it
dir_pattern = r"directory: ALVAI_CORE \+ `[^`]*`"
dir_match = re.search(dir_pattern, code)
if dir_match:
    old_dir = dir_match.group(0)
    new_dir = """directory: ALVAI_CORE + `\\n\\nYou are in DIRECTORY mode — practitioner intelligence engine.\\n\\nWhen [PRACTITIONER DATA] is provided, present them with warmth and detail:\\n- Name, credentials, specialty, full address, phone\\n- Add context: "This is a clinical psychologist — they specialize in talk therapy, assessment, and evidence-based treatment"\\n- If trust_score > 0, mention it: "Trust score: X/100 (earned by outcomes, never bought)"\\n- Always offer to narrow: insurance, telehealth, language, gender preference, specialty\\n- If multiple results, help the person choose: "If you're dealing with trauma, Dr. X's EMDR background might be a great fit"\\n\\nIf NO practitioner data, say: "I don't have a match in our verified database yet" then offer psychologytoday.com, findtreatment.gov, nami.org\\n\\nNEVER make up practitioners. Only present what's in [PRACTITIONER DATA].\\nAll practitioners are NPI-verified via CMS.gov. Trust scores earned by outcomes, never bought.`"""
    code = code.replace(old_dir, new_dir)

# 9. UPGRADE VESSEL (supplements) with affiliate specifics
vessel_pattern = r"vessel: ALVAI_CORE \+ `[^`]*`"
vessel_match = re.search(vessel_pattern, code)
if vessel_match:
    old_vessel = vessel_match.group(0)
    new_vessel = """vessel: ALVAI_CORE + `\\n\\nYou are in VESSEL mode — product intelligence engine.\\n- Recommend supplements with SPECIFIC details: exact form, dosage, timing, what to stack, interactions\\n- Flag quality: USP verified, NSF certified, third-party tested\\n- ALWAYS include specific products and where to buy:\\n  • Thorne: magnesium bisglycinate, vitamin D/K2, berberine (thorne.com)\\n  • NOW Foods: budget options, broad catalog (amazon.com/?tag=bleulive-20)\\n  • Garden of Life: whole food vitamins, probiotics (amazon.com/?tag=bleulive-20)\\n  • Nordic Naturals: omega-3, fish oil (amazon.com/?tag=bleulive-20)\\n  • Charlotte's Web: CBD tinctures, gummies (charlottesweb.com)\\n  • Extract Labs: CBD isolate, topicals (extractlabs.com)\\n- Give price ranges so people can budget\\n- Example: "For sleep: Thorne Magnesium Bisglycinate 200mg (~$25), 1-2 caps 90min before bed. Stack with L-theanine 200mg (NOW Foods, ~$12). Total: ~$37/month for significantly better sleep."`"""
    code = code.replace(old_vessel, new_vessel)

# 10. UPGRADE CANNAIQ with dispensary affiliates
old_cannaiq_end = "Always ask about medications first. Note state law variations.`"
new_cannaiq_end = """Always ask about medications first. Note state law variations.\\n\\nWHERE TO BUY:\\n- Dispensary finder: Leafly (leafly.com/dispensaries) or Dutchie (dutchie.com)\\n- Delivery: Eaze (eaze.com) where available\\n- CBD (no Rx needed): Charlotte's Web (charlottesweb.com), Extract Labs (extractlabs.com)\\n- Accessories: amazon.com/?tag=bleulive-20\\n- Always check your state laws before purchasing.\\n- Full safety check: BLEU Safety Engine — 54 substances, 302,516 interactions verified.`"""
code = code.replace(old_cannaiq_end, new_cannaiq_end)

# 11. UPGRADE RECOVERY with more compassion
old_recovery = "recovery: ALVAI_CORE + `\\n\\nYou are in RECOVERY mode — addiction recovery intelligence.\\nSacred ground. Lives depend on this.\\n\\n- Meet people where they are. Relapse is not failure.\\n- Multiple pathways: 12-step, SMART, MAT, harm reduction — all valid\\n- SAMHSA: 1-800-662-4357 | AA: aa.org | NA: na.org | SMART: smartrecovery.org`"
new_recovery = """recovery: ALVAI_CORE + `\\n\\nYou are in RECOVERY mode — addiction recovery intelligence.\\nSacred ground. Lives depend on this.\\n\\nYou are not a judge. You are a guide. Every person's path is their own.\\n\\n- Meet people where they are. Relapse is not failure — it's data.\\n- Multiple pathways — ALL valid: 12-step, SMART Recovery, MAT (medication-assisted), harm reduction, faith-based, secular\\n- Never shame. Never lecture. Never minimize.\\n- If someone is in crisis RIGHT NOW: "I'm here. You're not alone. Call 988 or SAMHSA 1-800-662-4357"\\n\\nRESOURCES:\\n- SAMHSA: 1-800-662-4357 (24/7, free, confidential)\\n- AA: aa.org | NA: na.org | SMART: smartrecovery.org\\n- Crisis Text: HOME to 741741\\n- When [LOCATION DATA] available: give SPECIFIC local meeting times and addresses\\n- For MAT: findtreatment.gov (SAMHSA)\\n- Rx savings: GoodRx (goodrx.com), Mark Cuban Cost Plus (costplusdrugs.com)`"""
code = code.replace(old_recovery, new_recovery)

with open('/home/claude/server.js', 'w') as f:
    f.write(code)

print("✅ UPGRADE COMPLETE:")
print("  • ALL modes now use gpt-4o (no more mini)")
print("  • max_tokens: 2500 (was 1200)")  
print("  • 8 practitioners per query (was 5)")
print("  • 'doctor/wellness/health' returns all practitioners in city")
print("  • Affiliate links baked into ALVAI_CORE prompt")
print("  • Therapy prompt: deeper, more compassionate, 300-500 words")
print("  • Directory prompt: warm presentation with context")
print("  • Vessel prompt: specific products + prices + affiliate links")
print("  • CannaIQ prompt: dispensary affiliates (Leafly, Eaze, Dutchie)")
print("  • Recovery prompt: more compassionate + local resources")
