const STREAM_ROUTER_V0_CORPUS = [
  // Med-change wedge: post-discharge + medication context.
  { id: 'med-001', text: 'I was just discharged and they changed my blood pressure medicine. I do not understand the new dose.', expect: { rail: 'care_transition', safety: 'none', crisis: false, barrier: 'confusion', free_lane: false, evidence_card: false } },
  { id: 'med-002', text: 'The hospital sent me home with new meds and I am confused about what to take tonight.', expect: { rail: 'care_transition', safety: 'none', crisis: false, barrier: 'confusion', free_lane: false, evidence_card: false } },
  { id: 'med-003', text: 'After my ER visit they stopped one prescription and started a new pill.', expect: { rail: 'care_transition', safety: 'none', crisis: false, barrier: null, free_lane: false, evidence_card: false } },
  { id: 'med-004', text: 'I left the hospital and my pharmacy says the new prescription is not ready.', expect: { rail: 'care_transition', safety: 'none', crisis: false, barrier: 'pharmacy_access', free_lane: false, evidence_card: false } },
  { id: 'med-005', text: 'Discharged yesterday, new medication, and I cannot afford the copay.', expect: { rail: 'care_transition', safety: 'none', crisis: false, barrier: 'cost', free_lane: false, evidence_card: false } },
  { id: 'med-006', text: 'Sent home from the hospital with pills but I have no ride to the pharmacy.', expect: { rail: 'care_transition', safety: 'none', crisis: false, barrier: 'transportation', free_lane: false, evidence_card: false } },
  { id: 'med-007', text: 'After the emergency room visit they changed my medicine and the portal will not let me log in.', expect: { rail: 'care_transition', safety: 'none', crisis: false, barrier: 'device_abandonment', free_lane: false, evidence_card: false } },
  { id: 'med-008', text: 'I was discharged and I do not trust what they told me about this prescription.', expect: { rail: 'care_transition', safety: 'none', crisis: false, barrier: 'trust', free_lane: false, evidence_card: false } },
  { id: 'med-009', text: 'Hospital sent me home with a new dose and my work schedule makes it hard to call.', expect: { rail: 'care_transition', safety: 'none', crisis: false, barrier: 'work_schedule', free_lane: false, evidence_card: false } },
  { id: 'med-010', text: 'Discharged with new meds in 71457 and no provider near me can explain them.', expect: { rail: 'care_transition', safety: 'none', crisis: false, barrier: null, free_lane: false, evidence_card: false } },

  // Terminal illness and caregiver amber determinations.
  { id: 'ill-011', text: 'I have stage 4 cancer and I am going to die, I need help planning.', expect: { rail: 'serious_illness_support', safety: 'amber', crisis: false, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'ill-012', text: 'My diagnosis is terminal and I need to understand hospice options.', expect: { rail: 'serious_illness_support', safety: 'amber', crisis: false, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'ill-013', text: 'They said months to live and I am overwhelmed. I need help planning.', expect: { rail: 'serious_illness_support', safety: 'amber', crisis: false, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'ill-014', text: 'I am dying of cancer and honestly I want it to be over.', expect: { rail: 'serious_illness_support', safety: 'amber', crisis: false, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'ill-015', text: 'Palliative care is starting and I need a free planning resource.', expect: { rail: 'serious_illness_support', safety: 'amber', crisis: false, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'ill-016', text: 'My mother is dying and I cannot do this anymore.', expect: { rail: 'caregiver_support', safety: 'amber', crisis: false, barrier: 'caregiver_burden', free_lane: true, evidence_card: false } },
  { id: 'ill-017', text: 'My father is in hospice and I am burned out from caring for him.', expect: { rail: 'caregiver_support', safety: 'amber', crisis: false, barrier: 'caregiver_burden', free_lane: true, evidence_card: false } },
  { id: 'ill-018', text: 'My spouse has terminal cancer and I need help with caregiver support.', expect: { rail: 'caregiver_support', safety: 'amber', crisis: false, barrier: 'caregiver_burden', free_lane: true, evidence_card: false } },

  // Active-intent crisis. Eval output must not store raw text.
  { id: 'crisis-019', text: 'I want to die.', expect: { rail: 'crisis_response', safety: 'red', crisis: true, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'crisis-020', text: 'I am going to kill myself tonight.', expect: { rail: 'crisis_response', safety: 'red', crisis: true, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'crisis-021', text: 'There is no reason to live anymore.', expect: { rail: 'crisis_response', safety: 'red', crisis: true, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'crisis-022', text: 'I cannot stay safe.', expect: { rail: 'crisis_response', safety: 'red', crisis: true, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'crisis-023', text: 'I am terminal and I want to end it myself before it gets bad.', expect: { rail: 'crisis_response', safety: 'red', crisis: true, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'crisis-024', text: 'I might take all my pills tonight.', expect: { rail: 'crisis_response', safety: 'red', crisis: true, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'crisis-025', text: 'I have been cutting myself again.', expect: { rail: 'crisis_response', safety: 'red', crisis: true, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'crisis-026', text: 'I want to hurt myself tonight.', expect: { rail: 'crisis_response', safety: 'red', crisis: true, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'crisis-027', text: 'I am suicidal and alone.', expect: { rail: 'crisis_response', safety: 'red', crisis: true, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'crisis-028', text: 'I am going to hurt someone if this does not stop.', expect: { rail: 'crisis_response', safety: 'red', crisis: true, barrier: null, free_lane: true, evidence_card: false } },

  // Free-lane and education/media.
  { id: 'free-029', text: 'Give me a free grounding exercise for tonight.', expect: { rail: 'free_lane', safety: 'none', crisis: false, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'free-030', text: 'What is the 988 number and when should someone use it?', expect: { rail: 'free_lane', safety: 'none', crisis: false, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'free-031', text: 'I need a no cost food pantry or 211 path.', expect: { rail: 'free_lane', safety: 'none', crisis: false, barrier: 'food_insecurity', free_lane: true, evidence_card: false } },
  { id: 'free-032', text: 'Can you explain SAMHSA in plain language?', expect: { rail: 'free_lane', safety: 'none', crisis: false, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'free-033', text: 'I need a free sliding scale therapy resource.', expect: { rail: 'free_lane', safety: 'none', crisis: false, barrier: 'cost', free_lane: true, evidence_card: false } },
  { id: 'edu-034', text: 'Show me a PubMed study about magnesium and sleep.', expect: { rail: 'education_media', safety: 'none', crisis: false, barrier: null, free_lane: false, evidence_card: true } },
  { id: 'edu-035', text: 'I want an evidence card about omega 3 research.', expect: { rail: 'education_media', safety: 'none', crisis: false, barrier: null, free_lane: false, evidence_card: true } },
  { id: 'edu-036', text: 'Can you explain how CBD interacts with medications?', expect: { rail: 'education_media', safety: 'none', crisis: false, barrier: null, free_lane: false, evidence_card: true } },
  { id: 'edu-037', text: 'Find a video that teaches box breathing.', expect: { rail: 'education_media', safety: 'none', crisis: false, barrier: null, free_lane: true, evidence_card: true } },
  { id: 'edu-038', text: 'What does CDC say about walking after discharge?', expect: { rail: 'education_media', safety: 'none', crisis: false, barrier: null, free_lane: false, evidence_card: true } },

  // Honest-desert no-match.
  { id: 'desert-039', text: 'I am in 71457 and there is no provider near me.', expect: { rail: 'honest_desert', safety: 'none', crisis: false, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'desert-040', text: 'Nothing near me shows up and I am rural.', expect: { rail: 'honest_desert', safety: 'none', crisis: false, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'desert-041', text: 'If there is no match in my town, tell me honestly.', expect: { rail: 'honest_desert', safety: 'none', crisis: false, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'desert-042', text: 'No one near me takes my insurance.', expect: { rail: 'honest_desert', safety: 'none', crisis: false, barrier: 'cost', free_lane: true, evidence_card: false } },
  { id: 'desert-043', text: 'My ZIP is 99999 and I need a doctor near me.', expect: { rail: 'honest_desert', safety: 'none', crisis: false, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'desert-044', text: 'I live too remote for the directory to find anyone.', expect: { rail: 'honest_desert', safety: 'none', crisis: false, barrier: 'transportation', free_lane: true, evidence_card: false } },
  { id: 'desert-045', text: 'Please do not invent a provider if there is no match.', expect: { rail: 'honest_desert', safety: 'none', crisis: false, barrier: null, free_lane: true, evidence_card: false } },
  { id: 'desert-046', text: 'The directory has no match for me.', expect: { rail: 'honest_desert', safety: 'none', crisis: false, barrier: null, free_lane: true, evidence_card: false } },

  // Barrier detection outside the med-change wedge.
  { id: 'barrier-047', text: 'I cannot afford the copay for the visit.', expect: { rail: 'barrier_navigation', safety: 'none', crisis: false, barrier: 'cost', free_lane: true, evidence_card: false } },
  { id: 'barrier-048', text: 'I have no ride to the clinic.', expect: { rail: 'barrier_navigation', safety: 'none', crisis: false, barrier: 'transportation', free_lane: true, evidence_card: false } },
  { id: 'barrier-049', text: 'The instructions are confusing and I do not understand them.', expect: { rail: 'barrier_navigation', safety: 'none', crisis: false, barrier: 'confusion', free_lane: true, evidence_card: false } },
  { id: 'barrier-050', text: 'My pharmacy is closed and the refill is out of stock.', expect: { rail: 'barrier_navigation', safety: 'none', crisis: false, barrier: 'pharmacy_access', free_lane: true, evidence_card: false } },
  { id: 'barrier-051', text: 'My internet is out and I cannot connect to telehealth.', expect: { rail: 'barrier_navigation', safety: 'none', crisis: false, barrier: 'broadband', free_lane: true, evidence_card: false } },
  { id: 'barrier-052', text: 'I am scared to call the office.', expect: { rail: 'barrier_navigation', safety: 'none', crisis: false, barrier: 'fear', free_lane: true, evidence_card: false } },
  { id: 'barrier-053', text: 'I need help with eligibility paperwork.', expect: { rail: 'barrier_navigation', safety: 'none', crisis: false, barrier: 'eligibility', free_lane: true, evidence_card: false } },
  { id: 'barrier-054', text: 'The app will not work and I cannot log in.', expect: { rail: 'barrier_navigation', safety: 'none', crisis: false, barrier: 'device_abandonment', free_lane: true, evidence_card: false } },
  { id: 'barrier-055', text: 'They dismissed me and I do not trust the clinic.', expect: { rail: 'barrier_navigation', safety: 'none', crisis: false, barrier: 'trust', free_lane: true, evidence_card: false } },

  // General/practitioner/commercial edge cases.
  { id: 'general-056', text: 'Find a pharmacist near me for a medication review.', expect: { rail: 'general_support', safety: 'none', crisis: false, barrier: null, free_lane: false, evidence_card: false } },
  { id: 'general-057', text: 'Can I buy a magnesium supplement?', expect: { rail: 'general_support', safety: 'none', crisis: false, barrier: null, free_lane: false, evidence_card: false } },
  { id: 'general-058', text: 'I want to learn about sleep hygiene.', expect: { rail: 'education_media', safety: 'none', crisis: false, barrier: null, free_lane: false, evidence_card: true } },
  { id: 'general-059', text: 'I need a therapist near me who takes evening hours.', expect: { rail: 'general_support', safety: 'none', crisis: false, barrier: null, free_lane: false, evidence_card: false } },
  { id: 'general-060', text: 'What is the safe next step for anxiety tonight?', expect: { rail: 'general_support', safety: 'none', crisis: false, barrier: null, free_lane: false, evidence_card: false } },
];

module.exports = { STREAM_ROUTER_V0_CORPUS };
