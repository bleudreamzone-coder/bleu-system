const http = require('http');

const CLAUDE_KEY = process.env.CLAUDE_API_KEY || '';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  
  if (req.url === '/health') {
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({status:'ok', hasKey: !!CLAUDE_KEY}));
    return;
  }
  
  if (req.url === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { messages } = JSON.parse(body);
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
            system: 'You are Alvai, the Light That Learns. You help people find validated wellness practitioners, products, and information. Be warm, helpful, and concise.',
            messages: messages
          })
        });
        const data = await r.json();
        if (data.error) {
          res.writeHead(500, {'Content-Type':'application/json'});
          return res.end(JSON.stringify({error: data.error.message}));
        }
        res.writeHead(200, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({text: data.content[0].text}));
      } catch(e) {
        if (!res.headersSent) {
          res.writeHead(500, {'Content-Type':'application/json'});
          return res.end(JSON.stringify({error: e.message}));
        }
      }
    });
    return;
  }
  
  res.writeHead(404);
  res.end('Not found');
});

server.listen(process.env.PORT || 3000, () => console.log('Alvai running on port ' + (process.env.PORT || 3000)));
