'use strict';

const VALID_SINKS = new Set(['stdout', 'supabase']);

function readBoolean(value) {
  if (value === undefined || value === null || value === '') return false;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function readSampleRate(value) {
  if (value === undefined || value === null || value === '') return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(1, Math.max(0, parsed));
}

/**
 * Read dormant-by-default shadow runner configuration from environment variables.
 *
 * Production activation requires Captain to manually set these variables in the
 * Render dashboard after Dr. Felicia signs off on the first agent boundary:
 * SHADOW_RUNNER_ENABLED, SHADOW_RUNNER_SINK, and SHADOW_RUNNER_SAMPLE_RATE.
 * The default sample rate is 0.0 so the runner remains off unless explicitly
 * enabled and sampled upward.
 *
 * @param {NodeJS.ProcessEnv} [env=process.env] Environment source for tests or runtime.
 * @returns {{enabled: boolean, sink: 'stdout'|'supabase', sampleRate: number}} Safe shadow configuration.
 */
function getShadowConfig(env = process.env) {
  const source = env && typeof env === 'object' ? env : {};
  const sink = VALID_SINKS.has(source.SHADOW_RUNNER_SINK) ? source.SHADOW_RUNNER_SINK : 'stdout';

  return Object.freeze({
    enabled: readBoolean(source.SHADOW_RUNNER_ENABLED),
    sink,
    sampleRate: readSampleRate(source.SHADOW_RUNNER_SAMPLE_RATE),
  });
}

module.exports = { getShadowConfig };
