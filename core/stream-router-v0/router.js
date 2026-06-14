const crypto = require('crypto');
const { classifyCrisisPhrase } = require('../safety/canonical_crisis_patterns');

const STREAM_ROUTER_V0_ENDPOINT = '/api/chat/stream-router-v0';

const STREAM_TAXONOMY = Object.freeze({
  streams: [
    'safety',
    'care_transition',
    'serious_illness',
    'caregiver_support',
    'free_lane',
    'education_media',
    'honest_desert',
    'barrier_navigation',
    'general_support',
  ],
  surfaces: [
    'crisis_takeover',
    'soft_safety_question',
    'pharmacist_first_handoff',
    'practitioner_directory',
    'free_resource_lane',
    'education_card',
    'media_card',
    'honest_no_match',
    'human_follow_up',
  ],
});

const FALLBACK_MATRIX = Object.freeze({
  crisis_takeover: {
    fallback_surface: 'crisis_takeover',
    fallback_line: 'I cannot load extra surfaces right now. Use 988, 911, or local emergency support immediately.',
  },
  soft_safety_question: {
    fallback_surface: 'human_follow_up',
    fallback_line: 'I can still keep this safe: answer the safety check, then I can route this to a human owner.',
  },
  pharmacist_first_handoff: {
    fallback_surface: 'pharmacist_first_handoff',
    fallback_line: 'I could not load a routing surface. Use your discharge paperwork to call the pharmacist, clinic, or discharge team.',
  },
  practitioner_directory: {
    fallback_surface: 'human_follow_up',
    fallback_line: 'I could not load the directory surface. I can still keep this as a human follow-up route.',
  },
  free_resource_lane: {
    fallback_surface: 'free_resource_lane',
    fallback_line: 'I could not load media or cards. I can still give the free support path in plain text.',
  },
  education_card: {
    fallback_surface: 'education_card',
    fallback_line: 'I could not load an evidence card. I can still summarize the safe education path without pretending to have a source.',
  },
  media_card: {
    fallback_surface: 'education_card',
    fallback_line: 'I could not load media. I can still offer the text version and a human route if needed.',
  },
  honest_no_match: {
    fallback_surface: 'honest_no_match',
    fallback_line: 'I could not find a verified match. I should say that plainly and offer the next safe route.',
  },
  human_follow_up: {
    fallback_surface: 'human_follow_up',
    fallback_line: 'I could not load a surface. I can still route this to a human owner.',
  },
});

const BARRIER_RULES = Object.freeze([
  { type: 'transportation', confidence: 0.88, re: /\b(no ride|need a ride|transport|transportation|bus|car broke|too far|too remote|can't get there|cannot get there)\b/i },
  { type: 'food_insecurity', confidence: 0.82, re: /\b(food|groceries|hungry|snap|pantry|eat this week)\b/i },
  { type: 'cost', confidence: 0.89, re: /\b(afford|copay|co-pay|cost|expensive|money|insurance|uninsured|bill|sliding scale)\b/i },
  { type: 'work_schedule', confidence: 0.8, re: /\b(work schedule|shift|can't leave work|cannot leave work|boss)\b/i },
  { type: 'confusion', confidence: 0.84, re: /\b(confused|confusing|don't understand|do not understand|new dose|instructions|what do i take)\b/i },
  { type: 'pharmacy_access', confidence: 0.86, re: /\b(pharmacy closed|pharmacy won't|pharmacy will not|prescription (?:is )?not ready|refill|out of stock)\b/i },
  { type: 'fear', confidence: 0.8, re: /\b(scared|afraid|fear|worried to call|embarrassed)\b/i },
  { type: 'caregiver_burden', confidence: 0.85, re: /\b(caregiver|caring for|taking care of|burned out|burnt out|exhausted from caring|mother is dying|father is dying|spouse has terminal|spouse is terminal)\b/i },
  { type: 'broadband', confidence: 0.83, re: /\b(internet|wifi|wi-fi|broadband|can't connect|cannot connect|no signal)\b/i },
  { type: 'eligibility', confidence: 0.8, re: /\b(qualify|eligible|eligibility|paperwork|forms|application)\b/i },
  { type: 'device_abandonment', confidence: 0.78, re: /\b(app won't|app will not|device|phone won't|portal|login problem|can't log in|cannot log in)\b/i },
  { type: 'trust', confidence: 0.79, re: /\b(don't trust|do not trust|lied to me|they never listen|dismissed)\b/i },
]);

const DISCHARGE_CONTEXT_RE = /\b(discharge(?:d|s|ing)?|after (?:my |the )?(?:hospital|er|emergency room) visit|sent home from (?:the )?(?:hospital|er|emergency room)|left (?:the )?(?:hospital|er|emergency room)|hospital sent me home)\b/i;
const MEDICATION_CONTEXT_RE = /\b(medicine|medicines|medication|medications|meds|prescription|prescriptions|pill|pills|dose|dosage|new medicine|new med|changed my meds|changed my medicine|started me on|stopped my meds|stopped my medicine|blood pressure medicine)\b/i;
const FREE_LANE_RE = /\b(988|samhsa|211|free|no cost|breathing|grounding|hotline|food pantry|sliding scale|call or text)\b/i;
const MEDIA_EDUCATION_RE = /\b(study|research|pubmed|cdc|article|video|learn|explain|evidence|education|how does)\b/i;
const HONEST_DESERT_RE = /\b(no provider|no match|nothing near me|rural|too remote|71457|99999|00000|no one near)\b/i;
const FREE_RESOURCE_FIRST_RE = /\b(988|samhsa|211|free|no cost|food pantry|sliding scale|hotline|call or text)\b/i;
const PRACTITIONER_RE = /\b(provider|doctor|clinician|therapist|pharmacist|dietitian|practitioner|near me)\b/i;
const PRODUCT_RE = /\b(product|supplement|buy|shop|amazon|fullscript|protocol)\b/i;

function streamRouterV0Enabled(env = process.env) {
  return String(env.STREAM_ROUTER_V0_ENABLED || '').toLowerCase() === 'true';
}

function fingerprint(message) {
  return crypto.createHash('sha256').update(String(message || '')).digest('hex').slice(0, 16);
}

function classifyBarrier(message) {
  const rule = BARRIER_RULES.find((r) => r.re.test(String(message || '')));
  return rule ? { barrier_type: rule.type, barrier_confidence: rule.confidence, user_confirmed: true } : null;
}

function detectSignals(message) {
  const msg = String(message || '');
  const signals = [];
  if (DISCHARGE_CONTEXT_RE.test(msg) && MEDICATION_CONTEXT_RE.test(msg)) signals.push('post_discharge_medication_change');
  if (FREE_LANE_RE.test(msg)) signals.push('free_lane');
  if (MEDIA_EDUCATION_RE.test(msg)) signals.push('education_media');
  if (HONEST_DESERT_RE.test(msg)) signals.push('honest_desert');
  if (PRACTITIONER_RE.test(msg)) signals.push('practitioner_request');
  if (PRODUCT_RE.test(msg)) signals.push('commerce_surface_request');
  const barrier = classifyBarrier(msg);
  if (barrier) signals.push(`barrier:${barrier.barrier_type}`);
  return signals;
}

function routeFor({ message, safety, barrier, signals }) {
  const msg = String(message || '');
  if (safety.risk === 'red') {
    return {
      route_id: 'stream_router_v0_crisis_takeover',
      rail: 'crisis_response',
      primary_surface: 'crisis_takeover',
      packet_complete: true,
      free_lane_open: true,
      evidence_card_allowed: false,
      commerce_allowed: false,
      source_registry_refs: ['988_lifeline', 'samhsa_national_helpline', 'crisis_text_line'],
      no_named_resource_without_registry_ref: true,
      no_match_reason: null,
    };
  }
  if (safety.classification === 'serious_illness' && !(barrier && barrier.barrier_type === 'caregiver_burden')) {
    return {
      route_id: 'stream_router_v0_serious_illness_soft_safety',
      rail: 'serious_illness_support',
      primary_surface: 'soft_safety_question',
      packet_complete: true,
      free_lane_open: true,
      evidence_card_allowed: false,
      commerce_allowed: false,
      source_registry_refs: ['serious_illness_clinical_determination', 'human_follow_up_queue'],
      no_named_resource_without_registry_ref: true,
      no_match_reason: null,
    };
  }
  if (safety.classification === 'caregiver_overload' || (safety.risk === 'amber' && barrier && barrier.barrier_type === 'caregiver_burden')) {
    return {
      route_id: 'stream_router_v0_caregiver_soft_safety',
      rail: 'caregiver_support',
      primary_surface: 'soft_safety_question',
      packet_complete: true,
      free_lane_open: true,
      evidence_card_allowed: false,
      commerce_allowed: false,
      source_registry_refs: ['caregiver_support_lane', 'human_follow_up_queue'],
      no_named_resource_without_registry_ref: true,
      no_match_reason: null,
    };
  }
  if (signals.includes('post_discharge_medication_change')) {
    return {
      route_id: 'stream_router_v0_med_change_pharmacist_first',
      rail: 'care_transition',
      primary_surface: 'pharmacist_first_handoff',
      packet_complete: true,
      free_lane_open: false,
      evidence_card_allowed: false,
      commerce_allowed: false,
      source_registry_refs: ['catalyst_event_record_gate', 'zips_within_radius', 'pharmacist_first_bias'],
      no_named_resource_without_registry_ref: true,
      no_match_reason: null,
    };
  }
  if (signals.includes('honest_desert')) {
    return {
      route_id: 'stream_router_v0_honest_desert_no_match',
      rail: 'honest_desert',
      primary_surface: 'honest_no_match',
      packet_complete: true,
      free_lane_open: true,
      evidence_card_allowed: false,
      commerce_allowed: false,
      source_registry_refs: ['no_match_policy', 'human_follow_up_queue'],
      no_named_resource_without_registry_ref: true,
      no_match_reason: 'verified_no_match_or_sparse_area',
    };
  }
  if (FREE_RESOURCE_FIRST_RE.test(msg)) {
    return {
      route_id: 'stream_router_v0_free_lane',
      rail: 'free_lane',
      primary_surface: 'free_resource_lane',
      packet_complete: true,
      free_lane_open: true,
      evidence_card_allowed: false,
      commerce_allowed: false,
      source_registry_refs: ['free_resource_registry'],
      no_named_resource_without_registry_ref: true,
      no_match_reason: null,
    };
  }
  if (barrier) {
    return {
      route_id: `stream_router_v0_barrier_${barrier.barrier_type}`,
      rail: 'barrier_navigation',
      primary_surface: 'human_follow_up',
      packet_complete: true,
      free_lane_open: true,
      evidence_card_allowed: false,
      commerce_allowed: false,
      source_registry_refs: ['barrier_ledger_taxonomy', 'human_follow_up_queue'],
      no_named_resource_without_registry_ref: true,
      no_match_reason: null,
    };
  }
  if (signals.includes('education_media')) {
    return {
      route_id: 'stream_router_v0_education_media',
      rail: 'education_media',
      primary_surface: /\b(video|media)\b/i.test(msg) ? 'media_card' : 'education_card',
      packet_complete: true,
      free_lane_open: FREE_LANE_RE.test(msg),
      evidence_card_allowed: true,
      commerce_allowed: !PRODUCT_RE.test(msg),
      source_registry_refs: ['pubmed_or_cdc_evidence_registry'],
      no_named_resource_without_registry_ref: true,
      no_match_reason: null,
    };
  }
  if (signals.includes('free_lane')) {
    return {
      route_id: 'stream_router_v0_free_lane',
      rail: 'free_lane',
      primary_surface: 'free_resource_lane',
      packet_complete: true,
      free_lane_open: true,
      evidence_card_allowed: false,
      commerce_allowed: false,
      source_registry_refs: ['free_resource_registry'],
      no_named_resource_without_registry_ref: true,
      no_match_reason: null,
    };
  }
  if (signals.includes('practitioner_request')) {
    return {
      route_id: 'stream_router_v0_practitioner_directory',
      rail: 'general_support',
      primary_surface: 'practitioner_directory',
      packet_complete: true,
      free_lane_open: false,
      evidence_card_allowed: false,
      commerce_allowed: false,
      source_registry_refs: ['npi_registry', 'provider_directory'],
      no_named_resource_without_registry_ref: true,
      no_match_reason: null,
    };
  }
  return {
    route_id: 'stream_router_v0_general_support',
    rail: 'general_support',
    primary_surface: 'education_card',
    packet_complete: true,
    free_lane_open: false,
    evidence_card_allowed: false,
    commerce_allowed: !PRODUCT_RE.test(msg),
    source_registry_refs: ['general_support_policy'],
    no_named_resource_without_registry_ref: true,
    no_match_reason: null,
  };
}

function humanSlaFor(route, safety) {
  if (safety.risk === 'red') return { required: true, target: 'immediate', owner: 'crisis_resource_takeover' };
  if (safety.risk === 'amber') return { required: true, target: 'same_day', owner: 'care_desk' };
  if (route.rail === 'care_transition') return { required: false, target: 'within_2_days_if_consent', owner: 'care_transition' };
  if (route.rail === 'barrier_navigation') return { required: true, target: 'next_business_day', owner: 'navigator' };
  return { required: false, target: null, owner: null };
}

function commerceVerdictFor(route, safety) {
  if (safety.risk === 'red') return { allowed: false, reason: 'crisis_red' };
  if (safety.risk === 'amber') return { allowed: false, reason: 'amber_safety' };
  if (route.rail === 'care_transition') return { allowed: false, reason: 'pharmacist_first' };
  if (route.primary_surface === 'free_resource_lane') return { allowed: false, reason: 'free_lane_first' };
  if (route.primary_surface === 'honest_no_match') return { allowed: false, reason: 'no_verified_match' };
  return { allowed: !!route.commerce_allowed, reason: route.commerce_allowed ? 'allowed_by_router_v0' : 'blocked_by_router_v0' };
}

function buildOutcomeDecisionRecord(input = {}) {
  const message = String(input.message || '');
  const safetyVerdict = classifyCrisisPhrase(message, { terminalIllnessRuleEnabled: true });
  const barrier = classifyBarrier(message);
  const signals = detectSignals(message);
  const route = routeFor({ message, safety: safetyVerdict, barrier, signals });
  const commerce_verdict = commerceVerdictFor(route, safetyVerdict);

  return {
    signal: {
      schema: 'StreamRouterSignal.v0',
      endpoint: STREAM_ROUTER_V0_ENDPOINT,
      message_fingerprint: fingerprint(message),
      message_length: message.length,
      raw_text_stored: false,
      detected_signals: signals,
      stream_taxonomy: STREAM_TAXONOMY.streams,
      surface_taxonomy: STREAM_TAXONOMY.surfaces,
    },
    safety: {
      risk: safetyVerdict.risk,
      classification: safetyVerdict.classification,
      crisis_takeover: safetyVerdict.crisis_takeover,
      soft_safety_question_required: safetyVerdict.soft_safety_question_required,
      staff_action_required: safetyVerdict.staff_action_required,
      commerce_allowed: safetyVerdict.commerce_allowed,
      matched_basis: safetyVerdict.matched,
    },
    barrier: barrier ? {
      barrier_type: barrier.barrier_type,
      barrier_confidence: barrier.barrier_confidence,
      user_confirmed: barrier.user_confirmed,
      aggregate_allowed: false,
    } : {
      barrier_type: null,
      barrier_confidence: null,
      user_confirmed: false,
      aggregate_allowed: false,
    },
    route: {
      ...route,
      commerce_allowed: commerce_verdict.allowed,
      surface_fallback: FALLBACK_MATRIX[route.primary_surface] || FALLBACK_MATRIX.human_follow_up,
      fabrication_guard: 'no_named_entity_without_registry_ref',
      fabricated_named_resource: false,
    },
    return: {
      commit_required: route.rail === 'care_transition' || safetyVerdict.risk === 'amber' || barrier,
      proof_event: route.rail === 'care_transition' ? 'catalyst_event_required_before_guidance' : 'test_only_no_write',
      follow_up_window: route.rail === 'care_transition' ? '2_days' : safetyVerdict.risk === 'amber' ? '1_day' : null,
      live_write_allowed: false,
    },
    decision_rights: {
      model: 'draft_support_only',
      bleu_router: 'final_route_selection',
      human: 'override_and_close_loop',
      crisis: 'deterministic_takeover_before_model',
    },
    outcome_ontology: {
      primary_outcome: route.rail,
      completion_signal: route.rail === 'care_transition' ? 'reached_pharmacist_or_discharge_team' : 'next_step_completed',
      not_success_metric: 'engagement_or_message_count',
    },
    denominator_tags: [
      `rail:${route.rail}`,
      `safety:${safetyVerdict.risk}`,
      barrier ? `barrier:${barrier.barrier_type}` : 'barrier:none',
    ],
    source_registry_refs: route.source_registry_refs,
    surface_fallback_matrix: FALLBACK_MATRIX,
    human_sla: humanSlaFor(route, safetyVerdict),
    confidence_basis: {
      method: 'deterministic_rule_eval_v0',
      evidence: ['regex_signal_taxonomy', 'canonical_crisis_classifier', 'barrier_taxonomy'],
      hidden_model_used: false,
    },
    commerce_verdict,
  };
}

function routePacketIsComplete(record) {
  const objects = ['signal', 'safety', 'barrier', 'route', 'return'];
  const hardening = [
    'decision_rights',
    'outcome_ontology',
    'denominator_tags',
    'source_registry_refs',
    'surface_fallback_matrix',
    'human_sla',
    'confidence_basis',
    'commerce_verdict',
  ];
  return objects.every((key) => record && record[key] && typeof record[key] === 'object')
    && hardening.every((key) => Object.prototype.hasOwnProperty.call(record, key))
    && !!(record.route && record.route.packet_complete)
    && !!(record.route && record.route.route_id && record.route.rail && record.route.primary_surface);
}

async function handleStreamRouterV0Endpoint(req, res, opts = {}) {
  const env = opts.env || process.env;
  if (!streamRouterV0Enabled(env)) {
    res.statusCode = 404;
    res.setHeader && res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }
  const body = opts.body || {};
  const record = buildOutcomeDecisionRecord(body);
  res.statusCode = 200;
  res.setHeader && res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ endpoint: STREAM_ROUTER_V0_ENDPOINT, outcome_decision_record: record }));
}

module.exports = {
  STREAM_ROUTER_V0_ENDPOINT,
  STREAM_TAXONOMY,
  FALLBACK_MATRIX,
  streamRouterV0Enabled,
  classifyBarrier,
  detectSignals,
  buildOutcomeDecisionRecord,
  routePacketIsComplete,
  handleStreamRouterV0Endpoint,
};
