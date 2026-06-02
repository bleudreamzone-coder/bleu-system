'use strict';

const crypto = require('node:crypto');
const { getShadowConfig } = require('./shadow_config');

function logShadowError(error) {
  try {
    const message = error && error.stack ? error.stack : String(error);
    console.error(`[SHADOW] ${message}`);
  } catch (_ignored) {
    // Refusal 18: even logging failures cannot break production.
  }
}

function asArrayFromRegistry(registry) {
  try {
    const agents = registry && registry.agents;
    if (!agents) return [];
    if (agents instanceof Map) return Array.from(agents.values());
    if (Array.isArray(agents)) return agents;
    if (typeof agents === 'object') return Object.values(agents);
  } catch (error) {
    logShadowError(error);
  }
  return [];
}

function shouldSample(config, randomFn) {
  try {
    if (!config.enabled || config.sampleRate <= 0) return false;
    if (config.sampleRate >= 1) return true;
    return randomFn() < config.sampleRate;
  } catch (error) {
    logShadowError(error);
    return false;
  }
}

function hashNullable(value) {
  if (value === undefined || value === null) return null;
  return `sha256:${crypto.createHash('sha256').update(String(value)).digest('hex')}`;
}

function hashSessionId(value) {
  if (typeof value !== 'string' || value.length === 0) return 'sha256:unknown-session';
  if (/^sha256:[a-f0-9]{64}$/i.test(value)) return value;
  return hashNullable(value);
}

function normalizeAgentId(agent, index) {
  if (agent && typeof agent === 'object' && typeof agent.id === 'string' && agent.id.length > 0) return agent.id;
  return `shadow-agent-${index + 1}`;
}

function buildObservation(agent, index, requestContext, startedAt, errors) {
  const now = new Date();
  return {
    observation_id: crypto.randomUUID(),
    session_id: hashSessionId(requestContext.sessionId),
    timestamp: now.toISOString(),
    candidate_agent_id: normalizeAgentId(agent, index),
    candidate_decision: null,
    candidate_trust_packet: null,
    live_response_hash: hashNullable(requestContext.liveResponse || requestContext.liveResponseText || requestContext.responseText),
    shadow_response_hash: null,
    parity_match: null,
    latency_ms: Math.max(0, Date.now() - startedAt),
    errors,
    td_010_compliance: {
      pii_hashed: true,
      plaintext_email_stored: false,
      plaintext_phone_stored: false,
    },
  };
}

/**
 * Create a dormant shadow runner for future parallel agent observation.
 *
 * The returned runner never throws from observe(), flush(), or isEnabled(). Any
 * internal error is swallowed and logged with the [SHADOW] prefix so shadow
 * infrastructure cannot break production traffic under Refusal 18.
 *
 * @param {Object} [config={}] Shadow runner dependencies and overrides.
 * @param {Object} [config.registry] Future adapter registry containing candidate agents.
 * @param {Object} [config.env] Optional environment map for configuration reads.
 * @param {Function} [config.random] Optional random number source for sample-rate tests.
 * @param {Object} [config.supabase] Optional Supabase client used only when sink is supabase.
 * @returns {{observe: (requestContext: Object) => Promise<Array<Object>>, flush: () => Promise<number>, isEnabled: () => boolean}} Safe shadow runner facade.
 */
function createShadowRunner(config = {}) {
  const safeConfig = config && typeof config === 'object' && !Array.isArray(config) ? config : {};
  const pending = [];
  const randomFn = typeof safeConfig.random === 'function' ? safeConfig.random : Math.random;

  function currentConfig() {
    try {
      return getShadowConfig(safeConfig.env || process.env);
    } catch (error) {
      logShadowError(error);
      return Object.freeze({ enabled: false, sink: 'stdout', sampleRate: 0 });
    }
  }

  return Object.freeze({
    /**
     * Report whether the shadow runner is explicitly enabled by environment.
     *
     * @returns {boolean} True only when SHADOW_RUNNER_ENABLED is truthy.
     */
    isEnabled() {
      try {
        return currentConfig().enabled === true;
      } catch (error) {
        logShadowError(error);
        return false;
      }
    },

    /**
     * Observe a chat request snapshot in parallel without changing production behavior.
     *
     * @param {Object} requestContext Snapshot of the live request/response path.
     * @returns {Promise<Array<Object>>} ShadowObservation records, or [] when dormant/unregistered.
     */
    async observe(requestContext) {
      try {
        const cfg = currentConfig();
        if (!shouldSample(cfg, randomFn)) return [];

        const ctx = requestContext && typeof requestContext === 'object' && !Array.isArray(requestContext)
          ? requestContext
          : {};
        const agents = asArrayFromRegistry(safeConfig.registry);
        if (agents.length === 0) return [];

        const startedAt = Date.now();
        const observations = agents.map((agent, index) => buildObservation(agent, index, ctx, startedAt, []));
        pending.push(...observations);
        return observations;
      } catch (error) {
        logShadowError(error);
        return [];
      }
    },

    /**
     * Flush buffered shadow observations to the configured sink.
     *
     * Stdout is a development sink. Supabase writes are attempted only when a
     * client is injected; otherwise observations stay dormant and errors are swallowed.
     *
     * @returns {Promise<number>} Number of observations successfully flushed.
     */
    async flush() {
      try {
        if (pending.length === 0) return 0;
        const cfg = currentConfig();
        const batch = pending.splice(0, pending.length);

        if (cfg.sink === 'supabase') {
          const client = safeConfig.supabase;
          if (client && typeof client.from === 'function') {
            const result = await client.from('shadow_observations').insert(batch);
            if (result && result.error) throw result.error;
            return batch.length;
          }
          logShadowError(new Error('Supabase sink selected without injected client'));
          return 0;
        }

        console.log(JSON.stringify({ type: 'shadow_observations', observations: batch }));
        return batch.length;
      } catch (error) {
        logShadowError(error);
        return 0;
      }
    },
  });
}

module.exports = { createShadowRunner };
