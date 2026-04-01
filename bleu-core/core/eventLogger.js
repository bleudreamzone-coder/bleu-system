// Event Logger — 10 canonical event types
// Logs session data for CI/ISI research pipeline

const EVENT_TYPES = {
  SESSION_START: 'session_start',
  MESSAGE_SENT: 'message_sent',
  RESPONSE_RECEIVED: 'response_received',
  STATE_COMPUTED: 'state_computed',
  CI_RECORDED: 'ci_recorded',
  ISI_UPDATED: 'isi_updated',
  TRAJECTORY_SHIFTED: 'trajectory_shifted',
  BIFURCATION_DETECTED: 'bifurcation_detected',
  CRISIS_FLAGGED: 'crisis_flagged',
  SESSION_END: 'session_end'
};

function logSession(eventType, data) {
  return {
    event: eventType,
    ts: Date.now(),
    iso: new Date().toISOString(),
    session_id: data.session_id || null,
    user_id: data.user_id || null,
    payload: data.payload || {}
  };
}

// Build passport update object from state + CI result
// This is what gets written to Supabase profiles after each response
function buildPassportUpdate(state, ciResult, isiResult, message) {
  const update = {
    last_active: new Date().toISOString(),
    last_intent: state.intent,
    last_ci: state.ci,
    last_fusion: state.fusion,
    last_confidence_tier: state.confidence_tier,
    last_trajectory: state.trajectory
  };

  // CI history append
  if (ciResult) {
    update.ci_latest = ciResult.ci;
    update.ci_p = ciResult.p;
    update.ci_b = ciResult.b;
    update.ci_i = ciResult.i;
    update.ci_n = ciResult.n;
  }

  // ISI update
  if (isiResult) {
    update.isi = isiResult.isi;
    update.isi_velocity = isiResult.isi_velocity;
    update.isi_trend = isiResult.isi_trend;
    update.isi_sessions = isiResult.isi_sessions;
  }

  // Crisis flag
  if (state.is_crisis) {
    update.crisis_flagged = true;
    update.crisis_at = new Date().toISOString();
    update.crisis_message = (message || '').substring(0, 200);
  }

  // Bifurcation
  if (state.bifurcation_active) {
    update.bifurcation_detected = true;
    update.bifurcation_at = new Date().toISOString();
    update.bifurcation_probability = state.bifurcation_probability;
  }

  return update;
}

// Generate events for a complete loop cycle
function generateLoopEvents(sessionId, userId, message, state, ciResult, isiResult, responseText) {
  const events = [];
  const base = { session_id: sessionId, user_id: userId };

  events.push(logSession(EVENT_TYPES.MESSAGE_SENT, { ...base, payload: { message: (message || '').substring(0, 500), intent: state.intent } }));
  events.push(logSession(EVENT_TYPES.STATE_COMPUTED, { ...base, payload: { ci: state.ci, isi: state.isi, fusion: state.fusion, confidence_tier: state.confidence_tier, trajectory: state.trajectory } }));
  events.push(logSession(EVENT_TYPES.CI_RECORDED, { ...base, payload: ciResult || {} }));

  if (isiResult) events.push(logSession(EVENT_TYPES.ISI_UPDATED, { ...base, payload: isiResult }));
  if (state.is_crisis) events.push(logSession(EVENT_TYPES.CRISIS_FLAGGED, { ...base, payload: { message: (message || '').substring(0, 200) } }));
  if (state.bifurcation_active) events.push(logSession(EVENT_TYPES.BIFURCATION_DETECTED, { ...base, payload: { probability: state.bifurcation_probability } }));

  events.push(logSession(EVENT_TYPES.RESPONSE_RECEIVED, { ...base, payload: { length: (responseText || '').length, truncated: (responseText || '').substring(0, 100) } }));

  return events;
}

module.exports = { EVENT_TYPES, logSession, buildPassportUpdate, generateLoopEvents };
