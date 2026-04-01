// CI — Coherence Index
// Locked formula: (p*0.30)+(b*0.25)+(i*0.25)+(n*0.20)
// p = physiological, b = behavioral, i = identity, n = narrative

function computeCI(p, b, i, n) {
  const raw = (p * 0.30) + (b * 0.25) + (i * 0.25) + (n * 0.20);
  return Math.round(Math.max(0, Math.min(100, raw)) * 100) / 100;
}

// Fusion detection — "I am" = identity fusion (high fragility)
// "I feel" = healthy separation (low fusion)
// Returns 0-100 where 100 = maximum fusion (maximum fragility)
function detectFusion(text) {
  if (!text || typeof text !== 'string') return 50;
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).length;
  if (words < 3) return 50;

  // Identity fusion markers — "I am [negative]" fuses identity with state
  const fusionPatterns = [
    /\bi am (broken|worthless|hopeless|nothing|stupid|failure|lost|done|weak|damaged|trash|garbage|useless|pathetic|disgusting)/i,
    /\bi('m| am) (always|never|forever) /i,
    /\bi('m| am) (a |an )(mess|wreck|disaster|burden|problem|loser|addict|alcoholic|fat|ugly)/i,
    /\bi('m| am) not (enough|worthy|good|capable|strong|smart)/i,
    /\bi will (never|always) (be|feel|have|get|find)/i,
    /\bno one (can|will|would|could) /i,
    /\beveryone (leaves|hates|thinks|knows)/i,
    /\bthere('s| is) no (point|hope|way|use|reason)/i
  ];

  // Separation markers — "I feel" separates identity from state
  const separationPatterns = [
    /\bi feel (like|as if|that|so|very|really|pretty|kind of|somewhat)/i,
    /\bi('m| am) (feeling|noticing|experiencing|going through|dealing with|working on|trying|learning)/i,
    /\bi (notice|sense|observe|recognize|realize|understand|see that)/i,
    /\bpart of me (feels|thinks|wants|knows|believes)/i,
    /\bright now i/i,
    /\blately i('ve| have) (been|felt|noticed)/i,
    /\bi('m| am) (starting to|beginning to|learning to)/i
  ];

  let fusionHits = 0;
  let separationHits = 0;

  for (const p of fusionPatterns) {
    if (p.test(lower)) fusionHits++;
  }
  for (const p of separationPatterns) {
    if (p.test(lower)) separationHits++;
  }

  // Base 50, move toward 0 (healthy) or 100 (fused) based on hits
  const net = fusionHits - separationHits;
  const shift = net * 15; // each net hit shifts 15 points
  return Math.max(0, Math.min(100, 50 + shift));
}

// Score I (identity coherence) from text — inverse of fusion
// High fusion = low identity coherence, low fusion = high identity coherence
function scoreI(text) {
  const fusion = detectFusion(text);
  // Convert: 0 fusion = 100 coherence, 100 fusion = 0 coherence
  return Math.round((100 - fusion) * 100) / 100;
}

module.exports = { computeCI, detectFusion, scoreI };
