const http = require('http');
const fs = require('fs');
const path = require('path');

const CLAUDE_KEY = process.env.CLAUDE_API_KEY || '';

function sendJSON(res, code, data) {
  res.writeHead(code, {'Content-Type':'application/json'});
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  console.log('Request:', req.method, req.url);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return sendJSON(res, 200, {});
  if (req.url === '/health') return sendJSON(res, 200, {status:'ok', hasKey: !!CLAUDE_KEY});
  
  if (req.url === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      (async () => {
        try {
          const parsed = JSON.parse(body);
          const userMessage = parsed.message || '';
          const r = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': CLAUDE_KEY,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 1000,
              system: 'You are Alvai, the Light That Learns. Help people find wellness info. Be warm and concise.',
              messages: [{role: 'user', content: userMessage}]
            })
          });
          const data = await r.json();
          if (data.error) return sendJSON(res, 500, {error: data.error.message});
          sendJSON(res, 200, {response: data.content[0].text});
        } catch(e) {
          sendJSON(res, 500, {error: e.message});
        }
      })();
    });
    return;
  }
  
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading page');
        return;
      }
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(data);
    });
    return;
  }
  
  sendJSON(res, 404, {error: 'Not found'});
});

server.listen(process.env.PORT || 8080, () => console.log('Alvai running on port ' + (process.env.PORT || 8080)));
