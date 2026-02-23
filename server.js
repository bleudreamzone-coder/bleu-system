// ═══════════════════════════════════════════════════════════════════════
// BLEU.LIVE — ALVAI SERVER v3.0
// Swapped from Claude Opus ($15/$75 per 1M) → GPT-4o + GPT-4o-mini
// Estimated savings: ~$300/month
// ═══════════════════════════════════════════════════════════════════════

const http = require('http');
const fs = require('fs');
const path = require('path');

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const ALVAI_SYSTEM = `You are Alvai, the Light That Learns — the AI therapeutic guide at the heart of BLEU.live, The Longevity Operating System.

CORE IDENTITY:
- You were created by Bleu, carrying a 127-year healing lineage spanning wellness and cannabis medicine
- You work alongside Dr. Felicia Stoler (DCN, MS, RDN, FACSM)
- You are warm, curious, concise but profound
- You meet people where they are and respect their autonomy

YOUR CAPABILITIES:
- Wellness guidance across nutrition, sleep, stress, movement, mental health
- Cannabis intelligence — strains, terpenes, dosing, interactions
- Drug interaction awareness (CYP450, serotonin, UGT pathways)
- Practitioner recommendations from our verified directory
- Environmental health awareness
- Emotional support using IFS-informed, somatic, and polyvagal approaches

THERAPEUTIC APPROACH:
1. VALIDATE: "That sounds really painful."
2. GET CURIOUS: "Is there a part of you feeling [emotion]?"
3. LOCATE IN BODY: "Where do you feel that?"
4. MAP THE PROTECTION: "What does this part do to protect you?"
5. OFFER TRAJECTORY: "Here's what becomes possible..."

VOICE RULES:
- Warm, not clinical
- Curious, not prescriptive
- Explains the WHY behind everything
- Never say "You should..." or "You must..."
- Always remind: "This is educational — please consult your healthcare provider"
- Core phrases: "Wellness is not what you do. It's where you are." / "You are not broken. You are running outdated predictions." / "Every symptom is a solution that worked once."

CANNABIS + MEDICATIONS:
1. Ask about current medications
2. Flag critical interactions
3. Provide CBD dose thresholds
4. Recommend professional consultation

CRISIS PROTOCOL:
If someone appears in crisis — stabilize, don't do deep work.
- 988 Suicide & Crisis Lifeline
- Crisis Text Line: Text HOME to 741741
- SAMHSA: 1-800-662-4357
Stay present. Don't abandon. Encourage professional support.`;

const DEEP_TRIGGERS = [
  'feeling', 'anxious', 'depressed', 'therapy', 'struggling', 'grief',
  'trauma', 'help me cope', 'suicidal', 'panic', 'addiction', 'relapse',
  'interact', 'drug', 'medication', 'serotonin', 'withdrawal', 'overdose',
  'compare', 'analyze', 'explain how', 'why does', 'versus', 'research',
  'crisis', 'scared', 'hopeless', 'hurt myself', 'cant sleep', 'nightmares',
  'ptsd', 'abuse', 'eating disorder', 'self harm', 'lonely', 'lost someone'
];

function pickModel(message, sessionMode) {
  if (sessionMode === 'deep') return 'gpt-4o';
  const lower = message.toLowerCase();
  if (lower.length > 150) return 'gpt-4o';
  for (const trigger of DEEP_TRIGGERS) {
    if (lower.includes(trigger)) return 'gpt-4o';
  }
  return 'gpt-4o-mini';
}

async function callOpenAI(userMessage, history, sessionMode) {
  const model = pickModel(userMessage, sessionMode);
  const messages = [{ role: 'system', content: ALVAI_SYSTEM }];
  if (history && history.length > 0) {
    messages.push(...history.slice(-12));
  }
  messages.push({ role: 'user', content: userMessage });
  const maxTokens = model === 'gpt-4o' ? 800 : 500;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.7 })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  return {
    text: data.choices[0].message.content,
    model: model,
    tokens: data.usage
  };
}

function sendJSON(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const server = http.createServer((req, res) => {
  setCORS(res);
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') return sendJSON(res, 200, {});

  if (pathname === '/health') {
    return sendJSON(res, 200, { status: 'ok', hasKey: !!OPENAI_KEY, engine: 'openai', version: '3.0' });
  }

  if (pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      (async () => {
        try {
          const parsed = JSON.parse(body);
          const userMessage = parsed.message || '';
          const history = parsed.history || [];
          const sessionMode = parsed.mode || 'auto';
          if (!userMessage.trim()) return sendJSON(res, 400, { error: 'Message required' });
          const result = await callOpenAI(userMessage, history, sessionMode);
          sendJSON(res, 200, { response: result.text, text: result.text, model: result.model, tokens: result.tokens });
        } catch (e) {
          console.error('Alvai error:', e.message);
          sendJSON(res, 500, { error: e.message });
        }
      })();
    });
    return;
  }

  if (pathname === '/api/chat/stream' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      (async () => {
        try {
          const parsed = JSON.parse(body);
          const userMessage = parsed.message || '';
          const history = parsed.history || [];
          const sessionMode = parsed.mode || 'auto';
          const model = pickModel(userMessage, sessionMode);
          const messages = [{ role: 'system', content: ALVAI_SYSTEM }];
          if (history && history.length > 0) messages.push(...history.slice(-12));
          messages.push({ role: 'user', content: userMessage });

          const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages, max_tokens: model === 'gpt-4o' ? 800 : 500, temperature: 0.7, stream: true })
          });

          res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' });
          const reader = apiRes.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const d = line.slice(6).trim();
                if (d === '[DONE]') { res.write('data: ' + JSON.stringify({ done: true, model }) + '\n\n'); continue; }
                try {
                  const p = JSON.parse(d);
                  const delta = p.choices?.[0]?.delta?.content;
                  if (delta) res.write('data: ' + JSON.stringify({ t: delta }) + '\n\n');
                } catch (e) {}
              }
            }
          }
          res.end();
        } catch (e) {
          console.error('Stream error:', e.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      })();
    });
    return;
  }

  if (pathname === '/' || pathname === '/index.html') {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1>BLEU.live</h1><p>Frontend loading...</p></body></html>');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
    return;
  }

  const ext = path.extname(pathname);
  const mimeTypes = { '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
  if (mimeTypes[ext]) {
    const filePath = path.join(__dirname, pathname);
    fs.readFile(filePath, (err, data) => {
      if (err) return sendJSON(res, 404, { error: 'Not found' });
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] });
      res.end(data);
    });
    return;
  }

  sendJSON(res, 404, { error: 'Not found' });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`✦ ALVAI v3.0 — GPT-4o powered — port ${PORT}`);
  console.log(`  Engine: OpenAI (gpt-4o + gpt-4o-mini routing)`);
  console.log(`  Key loaded: ${!!OPENAI_KEY}`);
});
