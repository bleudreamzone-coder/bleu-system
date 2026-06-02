const crypto = require('node:crypto');

/**
 * Hash response text for privacy and storage efficiency.
 *
 * Raw response text is never persisted in the Trust Packet itself; only this
 * SHA-256 digest is retained as the audit anchor.
 *
 * @param {string} responseText - Citizen-facing response text to hash.
 * @returns {string} SHA-256 hex digest.
 */
function hashResponse(responseText) {
  return crypto.createHash('sha256').update(String(responseText ?? ''), 'utf8').digest('hex');
}

/**
 * Count response words using whitespace splitting with empty-token filtering.
 *
 * Raw response text is counted in memory only and is never persisted in the
 * Trust Packet itself.
 *
 * @param {string} responseText - Citizen-facing response text to count.
 * @returns {number} Integer word count.
 */
function countWords(responseText) {
  const trimmed = String(responseText ?? '').trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Hash and count response text for a privacy-preserving Trust Packet response.
 *
 * The raw response text is never persisted in the Trust Packet itself; only the
 * SHA-256 hash and word count are returned.
 *
 * @param {string} responseText - Citizen-facing response text to hash and count.
 * @returns {{hash: string, word_count: number}} Privacy-preserving response metadata.
 */
function hashAndCount(responseText) {
  return {
    hash: hashResponse(responseText),
    word_count: countWords(responseText),
  };
}

module.exports = {
  hashResponse,
  countWords,
  hashAndCount,
};
