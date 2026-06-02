// STATUS: DORMANT — Trust Packet v1.1 logging helper only; live Trust Packet v0 bridge is in server.js.
'use strict';

const crypto = require('node:crypto');

/**
 * Hash response text with SHA-256 without persisting the raw response text.
 * @param {string} text Raw response text held only in memory for hashing.
 * @returns {string} Lowercase SHA-256 hex digest.
 */
function hashResponse(text) {
  if (typeof text !== 'string') {
    throw new TypeError('response text must be a string');
  }
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

/**
 * Count whitespace-delimited words without persisting the raw response text.
 * @param {string} text Raw response text held only in memory for counting.
 * @returns {number} Count of non-empty whitespace-delimited tokens.
 */
function countWords(text) {
  if (typeof text !== 'string') {
    throw new TypeError('response text must be a string');
  }
  return text.split(/\s+/u).filter(Boolean).length;
}

/**
 * Return the SHA-256 hash and word count for response text; raw text is never persisted.
 * @param {string} text Raw response text held only in memory for hashing/counting.
 * @returns {{hash: string, word_count: number}} Hash/count pair safe for Trust Packet storage.
 */
function hashAndCount(text) {
  return {
    hash: hashResponse(text),
    word_count: countWords(text),
  };
}

module.exports = {
  hashResponse,
  countWords,
  hashAndCount,
};
