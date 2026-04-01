// CI — Coherence Index
// Locked formula: (p*0.30)+(b*0.25)+(i*0.25)+(n*0.20)

const clamp = v => Math.max(0, Math.min(100, v || 0));

function detectFusion(text) {
  if (!text || typeof text !== 'string') return 50;
  const m = text.toLowerCase();
  if (m.split(/\s+/).length < 3) return 50;

  const fusion = [
    /\bi am (broken|worthless|hopeless|nothing|stupid|failure|lost|done|weak|damaged|useless|pathetic)/i,
    /\bi('m| am) (always|never|forever) /i,
    /\bi('m| am) (a |an )(mess|wreck|disaster|burden|problem|loser|addict|alcoholic)/i,
    /\bi('m| am) not (enough|worthy|good|capable|strong|smart)/i,
    /\bi will (never|always) (be|feel|have|get|find)/i,
    /\bno one (can|will|would|could) /i,
    /\beveryone (leaves|hates|thinks|knows)/i,
    /\bthere('s| is) no (point|hope|way|use|reason)/i
  ];
  const separation = [
    /\bi feel (like|as if|that|so|very|really|pretty|kind of|somewhat)/i,
    /\bi('m| am) (feeling|noticing|experiencing|going through|dealing with|working on|trying|learning)/i,
    /\bi (notice|sense|observe|recognize|realize|understand|see that)/i,
    /\bpart of me (feels|thinks|wants|knows|believes)/i,
    /\bright now i/i,
    /\blately i('ve| have) (been|felt|noticed)/i,
    /\bi('m| am) (starting to|beginning to|learning to)/i
  ];

  let fHits = 0, sHits = 0;
  for (const p of fusion) if (p.test(m)) fHits++;
  for (const p of separation) if (p.test(m)) sHits++;
  return clamp(50 + (fHits - sHits) * 15);
}

function scoreI(text) {
  return Math.round((100 - detectFusion(text)) * 100) / 100;
}

function scoreN(text) {
  if (!text) return 50;
  const m = text.toLowerCase();
  let score = 50;
  if (/what can i|how do i|i want to|plan|goal|next step|future|build|improve|change/i.test(m)) score += 15;
  if (/nothing works|too late|can't|give up|no point|hopeless|why bother|what's the use/i.test(m)) score -= 15;
  if (/i tried|i learned|i realized|i noticed|last time/i.test(m)) score += 10;
  if (/always been|never going to|just the way|born this way/i.test(m)) score -= 10;
  return clamp(score);
}

function computeCI(p, b, i, n) {
  return Math.round(((clamp(p) * 0.30) + (clamp(b) * 0.25) + (clamp(i) * 0.25) + (clamp(n) * 0.20)) * 100) / 100;
}

function computeCIFromMessage(text, passport) {
  const sleep = /sleep|insomnia|tired|exhausted/i.test(text) ? 30 : 70;
  const energy = /fatigue|drained|no energy|lethargic/i.test(text) ? 25 : 65;
  const pScore = (sleep + energy) / 2;
  const bScore = passport && passport.conversations_count > 3 ? 60 : 50;
  const iVal = scoreI(text);
  const nVal = scoreN(text);
  return {
    ci: computeCI(pScore, bScore, iVal, nVal),
    p: pScore, b: bScore, i: iVal, n: nVal,
    fusion: detectFusion(text)
  };
}

module.exports = { computeCI, detectFusion, scoreI, scoreN, computeCIFromMessage };
