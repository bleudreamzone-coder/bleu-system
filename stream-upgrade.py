#!/usr/bin/env python3
"""
BLEU ALVAI STREAMING UPGRADE
Run in codespace: python3 stream-upgrade.py
Does 2 things:
  1. Patches index.html with streaming chat() that renders Claude word-by-word
  2. Writes the streaming edge function for deployment
"""
import os, re

# ═══════════════════════════════════════════════
# PART 1: PATCH INDEX.HTML WITH STREAMING CHAT
# ═══════════════════════════════════════════════
print("═══ PATCHING INDEX.HTML WITH STREAMING CHAT ═══")

with open('index.html', 'r') as f:
    code = f.read()

# The new streaming chat system — replaces everything from chat() through alvaiLocal()
STREAM_CHAT = """// ═══ ALVAI STREAMING CHAT — REAL-TIME CLAUDE ═══
var ALVAI_URL=SB+'/functions/v1/alvai';
var chatHistory=[],isThinking=false;

// Markdown → HTML formatter
function fmtR(t){
  // Markdown links [text](url)
  t=t.replace(/\\[([^\\]]+)\\]\\((https?:\\/\\/[^\\s\\)]+)\\)/g,function(_,x,u){
    var s='color:var(--teal);text-decoration:underline';
    if(u.match(/iherb/i))s='color:var(--sage);text-decoration:underline';
    if(u.match(/pubmed/i))s='color:var(--gold);text-decoration:underline';
    if(u.match(/youtube/i))s='color:var(--ember);text-decoration:underline';
    return '<a href="'+u+'" target="_blank" style="'+s+'">'+x+'</a>';
  });
  // Bare URLs
  t=t.replace(/(^|[\\s>])(https?:\\/\\/[^\\s<\\)]+)/g,function(_,p,u){
    var l='Link';
    if(u.match(/iherb/i))l='Shop iHerb';
    else if(u.match(/amazon/i))l='Shop Amazon';
    else if(u.match(/pubmed/i))l='View Study';
    else if(u.match(/youtube/i))l='Watch';
    else if(u.match(/bleu\\.live/i))l='Visit';
    var s='color:var(--teal);text-decoration:underline';
    if(u.match(/iherb/i))s='color:var(--sage);text-decoration:underline';
    if(u.match(/pubmed/i))s='color:var(--gold);text-decoration:underline';
    return p+'<a href="'+u+'" target="_blank" style="'+s+'">'+l+' \\u2192</a>';
  });
  // Bold
  t=t.replace(/\\*\\*(.+?)\\*\\*/g,'<strong style="color:var(--cream)">$1</strong>');
  // Headers
  t=t.replace(/^###\\s+(.+)$/gm,'<div style="font-family:var(--fm);font-size:11px;color:var(--gold);letter-spacing:1px;margin:14px 0 6px;text-transform:uppercase">$1</div>');
  t=t.replace(/^##\\s+(.+)$/gm,'<div style="font-size:15px;font-weight:600;color:var(--cream);margin:16px 0 8px">$1</div>');
  // Numbered lists
  t=t.replace(/^(\\d+)\\.\\s+(.+)$/gm,'<div style="margin:4px 0;padding-left:8px"><span style="color:var(--gold);font-weight:600">$1.</span> $2</div>');
  // Bullet points
  t=t.replace(/^[-\\u2022]\\s+(.+)$/gm,'<div style="margin:3px 0;padding-left:12px"><span style="color:var(--teal)">\\u25c6</span> $1</div>');
  // NEXT STEP badge
  t=t.replace(/NEXT STEP:/g,'<span style="font-family:var(--fm);font-size:9px;color:var(--gold);letter-spacing:1.5px;background:rgba(200,169,110,.08);padding:3px 8px;border-radius:4px">NEXT STEP</span>');
  // Trust scores
  t=t.replace(/Trust:\\s*(\\d+)\\/99/g,'<span style="color:var(--teal);font-weight:600">Trust: $1/99</span>');
  // Line breaks
  t=t.replace(/\\n/g,'<br>');
  t=t.replace(/(<br>){3,}/g,'<br><br>');
  return t;
}

// ═══ THE MAIN EVENT: STREAMING CHAT ═══
async function chat(){
  var inp=document.getElementById('ch-in'),m=inp.value.trim();
  if(!m||isThinking)return;
  inp.value='';isThinking=true;
  addMsg('me',m);
  chatHistory.push({role:'user',content:m});

  var box=document.getElementById('ch-msgs');

  // Remove old typing indicators
  document.querySelectorAll('.alvai-typing').forEach(function(t){t.remove()});

  // Create the AI bubble that we'll stream into
  var wrap=document.createElement('div');
  wrap.style.cssText='display:flex;margin-bottom:16px';
  var bub=document.createElement('div');
  bub.className='bub ai';
  bub.style.cssText='max-width:85%;padding:14px 18px;font-size:13.5px;line-height:1.6';
  // Cursor blink while streaming
  bub.innerHTML='<span class="alvai-cursor" style="display:inline-block;width:2px;height:14px;background:var(--gold);animation:pulse 0.8s ease-in-out infinite;vertical-align:middle"></span>';
  wrap.appendChild(bub);
  box.appendChild(wrap);
  box.scrollTop=box.scrollHeight;

  var fullText='';

  try{
    var resp=await fetch(ALVAI_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':SK,'Authorization':'Bearer '+SK},
      body:JSON.stringify({message:m,history:chatHistory.slice(-12),stream:true})
    });

    // Check if we got SSE stream or JSON fallback
    var ct=resp.headers.get('content-type')||'';

    if(ct.includes('text/event-stream')){
      // ═══ REAL STREAMING — token by token ═══
      var reader=resp.body.getReader();
      var decoder=new TextDecoder();
      var buffer='';

      while(true){
        var chunk=await reader.read();
        if(chunk.done)break;
        buffer+=decoder.decode(chunk.value,{stream:true});
        var lines=buffer.split('\\n');
        buffer=lines.pop()||'';

        for(var li=0;li<lines.length;li++){
          var line=lines[li];
          if(line.startsWith('data: ')){
            try{
              var ev=JSON.parse(line.slice(6));
              if(ev.t){
                fullText+=ev.t;
                // Re-render with formatting every few tokens for performance
                bub.innerHTML=fmtR(fullText)+'<span class="alvai-cursor" style="display:inline-block;width:2px;height:14px;background:var(--gold);animation:pulse 0.8s ease-in-out infinite;vertical-align:middle"></span>';
                box.scrollTop=box.scrollHeight;
              }
              if(ev.done){
                // Final render — remove cursor
                bub.innerHTML=fmtR(fullText);
                box.scrollTop=box.scrollHeight;
              }
              if(ev.error){
                bub.innerHTML=fmtR(fullText||'Connection interrupted. Try again.');
              }
            }catch(e){}
          }
        }
      }

      // Clean final render
      if(fullText){
        bub.innerHTML=fmtR(fullText);
        chatHistory.push({role:'assistant',content:fullText});
        if(chatHistory.length>20)chatHistory=chatHistory.slice(-20);
      }

    }else{
      // ═══ JSON FALLBACK (non-streaming) ═══
      var data=await resp.json();
      if(data.reply){
        fullText=data.reply;
        bub.innerHTML=fmtR(fullText);
        chatHistory.push({role:'assistant',content:fullText});
        if(chatHistory.length>20)chatHistory=chatHistory.slice(-20);
      }else{
        bub.innerHTML=alvaiLocal(m);
      }
    }

  }catch(err){
    console.error('Alvai stream:',err);
    bub.innerHTML=alvaiLocal(m);
  }

  box.scrollTop=box.scrollHeight;
  isThinking=false;
}

// Local fallback if edge function unreachable
function alvaiLocal(q){
  var lo=q.toLowerCase();
  if(lo.match(/doctor|practitioner|find|therapist/)){
    var o='Top practitioners:\\n\\n';
    P.slice(0,3).forEach(function(p,i){o+=(i+1)+'. '+gf(p,['full_name','name'],'Provider')+' — '+gf(p,['taxonomy_description','specialty'],'Healthcare')+'\\n'});
    return fmtR(o+'\\nSee Directory tab for full list.');
  }
  if(lo.match(/supplement|vitamin|sleep|energy|stress|gut|pain/)){
    var o='Top products:\\n\\n';
    picks.slice(0,4).forEach(function(p,i){o+=(i+1)+'. '+p.n+' (Score: '+p.sc+')\\n'});
    return fmtR(o);
  }
  return fmtR('Ask me about supplements, practitioners, drug interactions, or the 40-Day Reset.\\n\\nTry: **What supplements help with sleep?** or **Find me a therapist**');
}
"""

# Strategy: find old chat function, replace it
lines = code.split('\n')
new_lines = []
i = 0
replaced = False
skip_until_addmsg = False

while i < len(lines):
    line = lines[i]

    # Detect old chat function (sync or async)
    if ('function chat()' in line or 'async function chat()' in line) and 'alvaiLocal' not in line:
        # Skip everything until we hit addMsg or esc function
        while i < len(lines):
            if ('function addMsg(' in lines[i] or 'function esc(' in lines[i]):
                break
            # Also stop at alvaiLocal end if it exists
            i += 1

        # Also skip alvaiLocal if it follows
        # Insert new streaming code
        new_lines.append(STREAM_CHAT)
        new_lines.append('')
        replaced = True
        continue

    # Remove duplicate ALVAI_URL declarations
    if 'var ALVAI_URL=' in line and 'sqyzboesdpdussiwqpzk' in line:
        while i < len(lines):
            if '</script>' in lines[i]:
                i += 1
                break
            i += 1
        continue

    # Remove old fmtReply/fmtR if defined elsewhere
    if ('function fmtReply(' in line or 'function fmtR(' in line) and replaced:
        # Skip to end of function
        brace = 0
        while i < len(lines):
            brace += lines[i].count('{') - lines[i].count('}')
            i += 1
            if brace <= 0:
                break
        continue

    # Remove old alvaiLocal if it exists outside our block
    if 'function alvaiLocal(' in line and replaced:
        brace = 0
        while i < len(lines):
            brace += lines[i].count('{') - lines[i].count('}')
            i += 1
            if brace <= 0:
                break
        continue

    # Remove old alvaiThink
    if 'function alvaiThink(' in line or 'alvaiThink' in line and 'function' in line:
        brace = 0
        while i < len(lines):
            brace += lines[i].count('{') - lines[i].count('}')
            i += 1
            if brace <= 0:
                break
        continue

    # Remove old chatHistory/isThinking declarations (we define them in our block)
    if line.strip().startswith('var chatHistory=') or line.strip().startswith('var isThinking='):
        i += 1
        continue

    new_lines.append(line)
    i += 1

code = '\n'.join(new_lines)

# Fix pulse animation if broken
if '@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}' in code:
    code = code.replace(
        '@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}',
        '@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}'
    )

# Ensure proper HTML closing
if not code.rstrip().endswith('</html>'):
    if '</body>' not in code:
        code = code.rstrip() + '\n</script>\n</body>\n</html>\n'
    elif '</html>' not in code:
        code = code.rstrip() + '\n</html>\n'

with open('index.html', 'w') as f:
    f.write(code)

# Verify
with open('index.html', 'r') as f:
    v = f.read()

print(f"✅ Lines: {v.count(chr(10))}")
print(f"✅ fmtR defined: {'function fmtR(' in v}")
print(f"✅ async chat: {'async function chat' in v}")
print(f"✅ ReadableStream: {'reader.read' in v or 'getReader' in v}")
print(f"✅ SSE parsing: {'text/event-stream' in v}")
print(f"✅ Cursor animation: {'alvai-cursor' in v}")
print(f"✅ alvaiThink removed: {'alvaiThink' not in v}")
print(f"✅ </html>: {v.rstrip().endswith('</html>')}")
if replaced:
    print("✅ Old chat() replaced with streaming version")
else:
    print("⚠️  chat() not found — may need manual check")

# ═══════════════════════════════════════════════
# PART 2: WRITE STREAMING EDGE FUNCTION
# ═══════════════════════════════════════════════
print("\n═══ WRITING STREAMING EDGE FUNCTION ═══")
os.makedirs('supabase/functions/alvai', exist_ok=True)

EDGE = r'''import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
const CK=Deno.env.get('CLAUDE_API_KEY')!,SU=Deno.env.get('SUPABASE_URL')!,SS=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}
const SYS=`You are ALVAI — the AI brain of BLEU, The Longevity Operating System.
VOICE: Warm, wise, direct. Talk like a trusted mentor with access to medical databases. Never clinical. Never robotic. Explain the WHY. Short paragraphs — 2-3 sentences max.
IDENTITY: Created by Bleu Michael Garner — 27 years wellness + cannabis medicine, 9.2M patient lives. President: Dr. Felicia Stoler, DCN, MS, RDN, FACSM (TLC host, Columbia + Rutgers). Backed by the 12-Shield Trust System (patent pending).
YOUR DATA: NPI-verified practitioners with trust scores, FDA-checked supplements with affiliate links (Amazon tag=bleu-live-20, iHerb rcode=BLEU), PubMed studies, YouTube videos from Huberman/Attia/Patrick, 40-Day Reset events (Feb 18-Mar 29 2026).
RULES: 1) Name actual products with trust scores. Put buy URLs as bare links NOT markdown. Example: Shop on iHerb: https://iherb.com/pr/product?rcode=BLEU 2) Name actual practitioners from data 3) For drug interactions be THOROUGH — CYP450 enzymes, mechanisms, severity 4) Connect to 12 Shields: Body(Movement,Nutrition,Sleep,Recovery) Mind(Mindset,Purpose,Learning,Creativity) Connection(Community,Relationships,Environment,Legacy) 5) End with NEXT STEP 6) Never diagnose. Never tell someone to stop meds.
FORMAT: **bold** for key terms. Numbered lists for rankings. Bare URLs on own lines.
DRUGS: CBD inhibits CYP2D6,CYP3A4,CYP2C19. St Johns Wort induces CYP3A4. Grapefruit inhibits CYP3A4. Turmeric inhibits CYP2D6. Magnesium chelates antibiotics. Fish oil mild antiplatelet.
NEVER: Diagnose. Tell someone to stop meds. Make claims without evidence. Be generic when you have data.`

serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response(null,{headers:cors})
  try{
    const{message,history=[],stream=true}=await req.json()
    if(!message)return new Response(JSON.stringify({error:'No message'}),{status:400,headers:{...cors,'Content-Type':'application/json'}})
    const sb=createClient(SU,SS),lo=message.toLowerCase(),ctx:string[]=[]

    const[pc,prc,sc,vc]=await Promise.all([
      sb.from('practitioners').select('*',{count:'exact',head:true}),
      sb.from('products').select('*',{count:'exact',head:true}),
      sb.from('pubmed_studies').select('*',{count:'exact',head:true}),
      sb.from('youtube_videos').select('*',{count:'exact',head:true})
    ])
    ctx.push(`DATABASE: ${pc.count||200} practitioners, ${prc.count||146} products, ${sc.count||70} studies, ${vc.count||24} videos`)

    if(lo.match(/doctor|practitioner|provider|therapist|find|help|who|match|chiropract|psych|counsel|dentist|nurse|dietitian|specialist|anxiety|stress|depress|back|spine|gut|skin|heart/)){
      const{data:pr}=await sb.from('practitioners').select('full_name,city,state,taxonomy_description,trust_score,phone,credential').order('trust_score',{ascending:false}).limit(10)
      if(pr?.length)ctx.push('\nTOP PRACTITIONERS:\n'+pr.map((p:any,i:number)=>`${i+1}. ${p.full_name}${p.credential?', '+p.credential:''} — ${p.taxonomy_description||'Healthcare'} | ${p.city}, ${p.state} | Trust: ${p.trust_score}/99 | ${p.phone||''}`).join('\n'))
    }
    if(lo.match(/supplement|product|buy|take|stack|vitamin|magnesium|omega|creatine|ashwa|probio|melatonin|recommend|sleep|energy|stress|gut|pain|weight|what should|morning|night|routine/)){
      const{data:pd}=await sb.from('products').select('name,brand,category,trust_score,affiliate_url').order('trust_score',{ascending:false}).limit(12)
      if(pd?.length)ctx.push('\nTOP PRODUCTS:\n'+pd.map((p:any,i:number)=>`${i+1}. ${p.name} by ${p.brand||''} | Trust: ${p.trust_score}/99${p.affiliate_url?' | BUY: '+p.affiliate_url:''}`).join('\n'))
    }
    if(lo.match(/study|research|evidence|pubmed|science|proof|clinical|trial/)){
      const{data:st}=await sb.from('pubmed_studies').select('title,journal,pub_date,url').limit(8)
      if(st?.length)ctx.push('\nSTUDIES:\n'+st.map((s:any,i:number)=>`${i+1}. "${s.title}" — ${s.journal||''} (${s.pub_date||''}) ${s.url||''}`).join('\n'))
    }
    if(lo.match(/video|watch|learn|youtube|huberman|attia|patrick|podcast/)){
      const{data:vi}=await sb.from('youtube_videos').select('title,channel,url').limit(6)
      if(vi?.length)ctx.push('\nVIDEOS:\n'+vi.map((v:any,i:number)=>`${i+1}. "${v.title}" — ${v.channel||''} | ${v.url||''}`).join('\n'))
    }
    if(lo.match(/drug|interact|cbd|thc|cannabis|ssri|blood thin|statin|warfarin|zoloft|lexapro|medication/))ctx.push('\nDRUG INTERACTION MODE — Be thorough. CYP450. Severity.')
    if(lo.match(/reset|40|mardi|sober|event|february|march|challenge/))ctx.push('\n40-DAY RESET (Feb 18-Mar 29): Kickoff, Yoga, Meal Prep, Sleep Class, 5K, Celebration. neworleans.bleu.live')

    const msgs:any[]=[]
    for(const h of history.slice(-12))msgs.push({role:h.role,content:h.content})
    msgs.push({role:'user',content:ctx.length>1?message+'\n\n[LIVE DATA]\n'+ctx.join('\n'):message})

    if(stream){
      const cr=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':CK,'anthropic-version':'2023-06-01'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1500,system:SYS,messages:msgs,stream:true})
      })
      if(!cr.ok){console.error('Claude:',cr.status);return new Response(JSON.stringify({error:'AI unavailable',fallback:true}),{status:502,headers:{...cors,'Content-Type':'application/json'}})}

      const{readable,writable}=new TransformStream()
      const w=writable.getWriter(),enc=new TextEncoder()

      ;(async()=>{
        try{
          const r=cr.body!.getReader(),dec=new TextDecoder()
          let buf=''
          while(true){
            const{done,value}=await r.read()
            if(done)break
            buf+=dec.decode(value,{stream:true})
            const ls=buf.split('\n');buf=ls.pop()||''
            for(const l of ls){
              if(l.startsWith('data: ')){
                const d=l.slice(6).trim()
                if(d==='[DONE]')continue
                try{
                  const p=JSON.parse(d)
                  if(p.type==='content_block_delta'&&p.delta?.type==='text_delta')
                    await w.write(enc.encode(`data: ${JSON.stringify({t:p.delta.text})}\n\n`))
                  if(p.type==='message_stop')
                    await w.write(enc.encode(`data: ${JSON.stringify({done:true})}\n\n`))
                }catch(_){}
              }
            }
          }
          await w.write(enc.encode(`data: ${JSON.stringify({done:true})}\n\n`))
          await w.close()
        }catch(e){console.error(e);try{await w.close()}catch(_){}}
      })()

      return new Response(readable,{headers:{...cors,'Content-Type':'text/event-stream','Cache-Control':'no-cache'}})
    }else{
      const cr=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':CK,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1500,system:SYS,messages:msgs})})
      if(!cr.ok)return new Response(JSON.stringify({error:'AI unavailable',fallback:true}),{status:502,headers:{...cors,'Content-Type':'application/json'}})
      const cd=await cr.json(),reply=cd.content?.[0]?.text||'Try again.'
      return new Response(JSON.stringify({reply}),{headers:{...cors,'Content-Type':'application/json'}})
    }
  }catch(e){console.error(e);return new Response(JSON.stringify({error:'Error',fallback:true}),{status:500,headers:{...cors,'Content-Type':'application/json'}})}
})
'''

with open('supabase/functions/alvai/index.ts', 'w') as f:
    f.write(EDGE)
print("✅ Streaming edge function written to supabase/functions/alvai/index.ts")

print("\n" + "═" * 50)
print("═══ STREAMING UPGRADE COMPLETE ═══")
print("═" * 50)
print()
print("DEPLOY IN 3 STEPS:")
print()
print("  1. Deploy streaming edge function:")
print("     supabase functions deploy alvai --no-verify-jwt")
print()
print("  2. Push index.html live:")
print("     git add -A && git commit -m 'Streaming Alvai v3' && git push origin main --force")
print()
print("  3. Hard refresh bleu.live (Cmd+Shift+R)")
print()
print("WHAT CHANGED:")
print("  • Edge function now sends SSE stream (token by token)")
print("  • Frontend reads stream with ReadableStream API")
print("  • Chat bubble fills in real-time like ChatGPT/Claude")
print("  • Gold cursor blinks while streaming")
print("  • Markdown formatted live as tokens arrive")
print("  • Falls back to JSON if streaming fails")
