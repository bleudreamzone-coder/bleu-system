// BLEU Core Server — one route, one loop, SSE streaming, fallback guaranteed
const http = require('http');
const fs = require('fs');
const path = require('path');

const { computeState } = require('./core/state');
const { computeCIFromMessage } = require('./core/ci');
const { updateISI } = require('./core/isi');
const { buildSystemPrompt, getGreeting } = require('./core/alvai');
const { buildPassportUpdate, generateLoopEvents } = require('./core/eventLogger');

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const PORT = process.env.PORT || 3001;

const FALLBACKS = {
  sleep: "Your system is wired right now. Try magnesium glycinate 400mg tonight one hour before bed. Tell me what else is happening.",
  stress: "Your mind is running ahead of your body. Take one slow breath. Then tell me what started this.",
  pain: "Your body is signaling. Tell me where and how long.",
  mood: "I hear you. Stay with me. Tell me one thing that happened today.",
  recovery: "You're still here. That matters. Tell me where you are right now.",
  general: "I'm here. Tell me what's actually going on right now."
};

function getFallback(message) {
  const m = (message || '').toLowerCase();
  if (/sleep|tired|insomnia/.test(m)) return FALLBACKS.sleep;
  if (/anxious|anxiety|stress|panic/.test(m)) return FALLBACKS.stress;
  if (/pain|hurt|chronic/.test(m)) return FALLBACKS.pain;
  if (/sad|depressed|empty|hopeless/.test(m)) return FALLBACKS.mood;
  if (/recovery|sober|relapse/.test(m)) return FALLBACKS.recovery;
  return FALLBACKS.general;
}

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pn = url.pathname;

  if (req.method === 'OPTIONS') return json(res, 200, {});

  if (pn === '/health') {
    return json(res, 200, { status: 'ok', engine: 'bleu-core', hasKey: !!OPENAI_KEY });
  }

  // ═══ THE ONE ROUTE — /api/chat ═══
  if (pn === '/api/chat' && req.method === 'POST') {
    let b = '';
    req.on('data', c => b += c);
    req.on('end', () => { (async () => {
      try {
        const p = JSON.parse(b);
        if (!p.message?.trim()) return json(res, 400, { error: 'Message required' });

        const passport = p.passport || {};

        // ── GREETING CACHE — instant, zero API calls ──
        const greeting = getGreeting(p.message);
        if (greeting && (!p.mode || p.mode === 'general' || p.mode === 'alvai' || p.mode === 'home')) {
          res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' });
          res.write('data: ' + JSON.stringify({ text: greeting }) + '\n\n');
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }

        // ── THE LOOP: message → state → prompt → stream → fallback ──
        const state = computeState(p.message, passport);
        const ciResult = computeCIFromMessage(p.message, passport);
        const isiResult = updateISI(passport, state.isi);
        const prompt = buildSystemPrompt(state, passport);

        // Log events (fire and forget in production — just build them here)
        const events = generateLoopEvents(p.session || 'anon', p.user_id || null, p.message, state, ciResult, isiResult, '');
        const passportUpdate = buildPassportUpdate(state, ciResult, isiResult, p.message);

        if (!OPENAI_KEY) {
          // No API key — return fallback with state
          res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' });
          res.write('data: ' + JSON.stringify({ text: getFallback(p.message) }) + '\n\n');
          res.write('data: ' + JSON.stringify({ state, passportUpdate }) + '\n\n');
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }

        // ── OPENAI STREAMING ──
        const messages = [{ role: 'system', content: prompt }];
        if (p.history?.length) messages.push(...p.history.slice(-8));
        messages.push({ role: 'user', content: p.message });

        const ar = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 800, temperature: 1, stream: true })
        });

        if (!ar.ok) {
          const errText = await ar.text();
          console.error('OpenAI error:', ar.status, errText.substring(0, 300));
          res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' });
          res.write('data: ' + JSON.stringify({ text: getFallback(p.message) }) + '\n\n');
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' });

        const rd = ar.body.getReader(), dc = new TextDecoder();
        let buf = '', full = '';

        while (true) {
          const { done, value } = await rd.read();
          if (done) break;
          buf += dc.decode(value, { stream: true });
          const ls = buf.split('\n');
          buf = ls.pop() || '';
          for (const ln of ls) {
            if (!ln.startsWith('data: ')) continue;
            const d = ln.slice(6).trim();
            if (d === '[DONE]') continue;
            try {
              const j = JSON.parse(d);
              const t = j.choices?.[0]?.delta?.content;
              if (t) { full += t; res.write('data: ' + JSON.stringify({ text: t }) + '\n\n'); }
            } catch {}
          }
        }

        // Fallback if stream was empty
        if (!full) {
          full = getFallback(p.message);
          res.write('data: ' + JSON.stringify({ text: full }) + '\n\n');
        }

        // Send state metadata as final event before DONE
        res.write('data: ' + JSON.stringify({ state: { ci: state.ci, isi: state.isi, fusion: state.fusion, trajectory: state.trajectory, confidence_tier: state.confidence_tier, intent: state.intent } }) + '\n\n');
        res.write('data: [DONE]\n\n');
        res.end();

      } catch (e) {
        console.error('Chat error:', e.message);
        if (!res.headersSent) json(res, 500, { error: e.message });
        else { res.write('data: ' + JSON.stringify({ text: FALLBACKS.general }) + '\n\n'); res.write('data: [DONE]\n\n'); res.end(); }
      }
    })(); });
    return;
  }

  // ═══ STATIC FILES ═══
  if (pn === '/' || pn === '/index.html') {
    const headers = { 'Content-Type': 'text/html', 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };
    fs.readFile(path.join(__dirname, 'public', 'index.html'), (e, d) => {
      if (e) { res.writeHead(200, headers); res.end('<html><body><h1>bleu-core</h1></body></html>'); }
      else { res.writeHead(200, headers); res.end(d); }
    });
    return;
  }

  json(res, 404, { error: 'Not found' });
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.listen(PORT, () => {
  console.log('bleu-core running on port ' + PORT);
  console.log('  OpenAI: ' + (OPENAI_KEY ? 'loaded' : 'MISSING — fallback mode'));
});
