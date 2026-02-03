const http = require('http');
const SB_URL = 'https://sqyzboesdpdussiwqpzk.supabase.co';
const SB_KEY = 'sb_secret__zYCYtWcOx9uKnIgRPPN4Q_PWkTOf96';
const CLAUDE_KEY = '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';

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  
  if (req.url === '/health') {
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({status:'ok'}));
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
        res.writeHead(200, {'Content-Type':'text/event-stream'});
        res.write('data: ' + JSON.stringify({type:'text',text:data.content[0].text}) + '\n\n');
        res.end();
      } catch(e) {
        res.writeHead(500);
        res.end(JSON.stringify({error:e.message}));
      }
    });
    return;
  }
  
  res.writeHead(404);
  res.end('Not found');
});

server.listen(3000, () => console.log('Alvai API running on port 3000'));
