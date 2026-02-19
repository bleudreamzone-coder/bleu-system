import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
const CK=Deno.env.get('CLAUDE_API_KEY'),SU=Deno.env.get('SUPABASE_URL'),SS=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const sb=createClient(SU,SS)
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}
const SYS="You are ALVAI, the AI partner inside BLEU, The Longevity Operating System. Powered by Claude Opus, Anthropic's most advanced intelligence.\nYou are not a chatbot. You are a genuine thinking partner for anyone navigating their health, wellness, and longevity. You reason deeply, care about outcomes, and never waste time with filler.\nABOUT BLEU: Built by Bleu Michael Garner, 127-year healing lineage, 9.2M patient lives, 27 years wellness + cannabis medicine. President: Dr. Felicia Stoler, DCN, MS, RDN, FACSM (TLC host, Columbia + Rutgers). 12-Shield Trust System (patent pending). New Orleans.\nYOUR VOICE: Brilliant, warm, direct. Explain the WHY. Keep paragraphs to 2-3 sentences. Never say Great question or I'd be happy to help. Start with substance. Sound like someone the user would trust with their health over coffee.\nTRUST SCORES (0-99): Credential tier (MD/DO=35, PharmD/PhD=30, NP/PA=25, RN/LCSW=18) + NPI verified(+15) + Active license(+12) + Board certified(+8) + Phone(+5) + Address(+5) + Specialty(+5) + Telehealth(+3) + Accepting patients(+3). Always explain context.\n12 SHIELDS: Body(Movement,Nutrition,Sleep,Recovery) Mind(Mindset,Purpose,Learning,Creativity) Connection(Community,Relationships,Environment,Legacy). Connect every answer.\nTABS: Directory, Vessel, Learn, Cities, Events (40-Day Reset Feb 18-Mar 29), Community, CannaIQ, Validate, Passport, Story. Guide users naturally.\nAFFILIATES: Amazon tag=bleu-live-20, iHerb rcode=BLEU. Bare URLs on own line.\nDRUG INTERACTIONS: Go full depth. Enzymes, mechanisms, severity, timing. CBD inhibits CYP2D6,CYP3A4,CYP2C19. St Johns Wort induces CYP3A4. Grapefruit inhibits CYP3A4. Turmeric inhibits CYP2D6. Magnesium chelates antibiotics. Fish oil mild antiplatelet.\nRED FLAGS: Gently note urgency. Never panic. These symptoms warrant prompt evaluation.\nFORMAT: **Bold** key terms. Numbered lists. End with NEXT STEP: specific action.\nNEVER: Diagnose. Tell someone to stop meds. Be generic when you have data. Hallucinate. Say I dont have access when data is in the prompt.\nYou are the most advanced AI in wellness. Act like it."

function extractNames(msg){
  var stop=new Set(['the','tell','me','about','find','show','who','is','what','how','can','do','i','my','a','an','in','for','and','or','to','of','with','on','at','from','this','that','it','be','are','was','has','have','not','but','all','so','if','no','yes','get','help','need','want','like','know','look','would','could','should','new','orleans','nola','doctor','therapist','practitioner','provider','directory','dr','md','please','really','also','just','more','out','best','top','good','great','near','here','there','some','any','very','today','now','right','well','much','been','will','your','their','our','than','other','into','them','only','even','back','after','think','most','made','over','still','own','take','why','dont','does','did','safe'])
  var words=msg.split(/\s+/),names=[]
  for(var i=0;i<words.length;i++){
    if(words[i].match(/^dr\.?$/i))continue
    var w=words[i].replace(/[^a-zA-Z'\-]/g,'')
    if(w.length<2||stop.has(w.toLowerCase()))continue
    if(w[0]===w[0].toUpperCase()&&w[0]!==w[0].toLowerCase()){
      var full=w,j=i+1
      while(j<words.length){
        var nx=words[j].replace(/[^a-zA-Z'\-]/g,'')
        if(nx.length>=2&&nx[0]===nx[0].toUpperCase()&&!stop.has(nx.toLowerCase())){full+=' '+nx;j++}else break
      }
      if(full.length>2)names.push(full);i=j-1
    }
  }
  return names
}

function fmtP(data){
  return data.map(function(p,i){
    var badge=p.validated&&p.license_status==='active'?'VERIFIED':p.validated?'NPI CONFIRMED':'LISTED'
    return(i+1)+'. '+p.full_name+(p.credential?', '+p.credential:'')+' | '+badge+' | Tier '+(p.credential_tier||0)+'/5 | Trust: '+p.trust_score+'/99 | '+(p.taxonomy_description||'Healthcare')+' | '+(p.city||'')+', '+(p.state||'')+' | Phone: '+(p.phone||'N/A')+(p.telehealth?' | Telehealth':'')+(p.accepting_patients?' | Accepting patients':'')+(p.board_certified?' | Board Certified':'')
  }).join('\n')
}

async function fetchCtx(message){
  var lo=message.toLowerCase(),names=extractNames(message),ctx=[],q=[]

  q.push((async function(){
    try{
      var res=await sb.from('symptom_specialist_map').select('*')
      var maps=res.data
      if(!maps)return
      for(var r=0;r<maps.length;r++){
        var row=maps[r]
        var terms=[row.symptom].concat(row.symptom_aliases||[])
        var found=false
        for(var t=0;t<terms.length;t++){if(lo.includes(terms[t].toLowerCase())){found=true;break}}
        if(!found)continue
        ctx.push('\nSYMPTOM: "'+row.symptom+'" - '+(row.description||'')+' | Shield: '+row.shield+' | Urgency: '+row.urgency_level+'/3')
        ctx.push('Route to: '+[row.primary_specialist].concat(row.secondary_specialists||[]).join(', '))
        var flags=(row.red_flags||[]).filter(function(f){return lo.includes(f.toLowerCase().split(' ')[0])})
        if(flags.length)ctx.push('RED FLAGS: '+flags.join(', '))
        try{
          var specs=[row.primary_specialist].concat(row.secondary_specialists||[]).slice(0,2)
          var results=await Promise.all(specs.map(function(spec){
            return sb.from('practitioners').select('full_name,credential,credential_tier,taxonomy_description,city,state,trust_score,phone,validated,license_status,telehealth,accepting_patients,board_certified').ilike('taxonomy_description','%'+spec.split(' ')[0]+'%').eq('is_active',true).order('trust_score',{ascending:false}).limit(4)
          }))
          var all=[]
          for(var x=0;x<results.length;x++){if(results[x].data)all=all.concat(results[x].data)}
          all.sort(function(a,b){return b.trust_score-a.trust_score})
          all=all.slice(0,6)
          if(all.length)ctx.push('\nMATCHED SPECIALISTS:\n'+fmtP(all))
        }catch(e){console.error('spec:',e)}
        break
      }
    }catch(e){console.error('symptom:',e)}
  })())

  for(var n=0;n<names.slice(0,3).length;n++){
    var name=names[n]
    q.push(sb.from('practitioners').select('full_name,credential,credential_tier,taxonomy_description,city,state,trust_score,phone,npi,validated,license_status,board_certified,telehealth,accepting_patients,gender').or('full_name.ilike.%'+name+'%').eq('is_active',true).order('trust_score',{ascending:false}).limit(5).then(function(res){
      if(res.data&&res.data.length)ctx.push('\nFOUND "'+name+'":\n'+fmtP(res.data))
      else ctx.push('\nNo practitioner named "'+name+'" found. 1800+ verified providers. Try searching by specialty or browse Directory.')
    }).catch(function(e){console.error('name:',e)}))
  }

  if(lo.match(/doctor|practitioner|provider|therapist|find|directory|who can help|recommend|best|show me|list/)&&names.length===0){
    q.push(sb.from('practitioners').select('full_name,credential,credential_tier,taxonomy_description,city,state,trust_score,phone,validated,license_status,telehealth,board_certified').eq('is_active',true).order('trust_score',{ascending:false}).limit(6).then(function(res){
      if(res.data&&res.data.length)ctx.push('\nTOP PRACTITIONERS:\n'+fmtP(res.data))
    }).catch(function(e){console.error('browse:',e)}))
  }

  if(lo.match(/supplement|product|buy|take|stack|vitamin|magnesium|omega|creatine|ashwa|probio|melatonin|recommend|what should|morning|night|routine|best for|vessel/)){
    var cat=lo.match(/sleep|energy|stress|anxiety|gut|digest|pain|inflam|immune|brain|focus|mood|joint|skin|heart|weight|muscle|recovery|cbd|omega|magnesium|vitamin|probio/)
    var pq=cat?sb.from('products').select('name,brand,category,trust_score,affiliate_url,description').or('category.ilike.%'+cat[0]+'%,name.ilike.%'+cat[0]+'%,description.ilike.%'+cat[0]+'%').order('trust_score',{ascending:false}).limit(6):sb.from('products').select('name,brand,category,trust_score,affiliate_url').order('trust_score',{ascending:false}).limit(6)
    q.push(pq.then(function(res){
      if(res.data&&res.data.length)ctx.push('\nPRODUCTS'+(cat?' ('+cat[0]+')':'')+': \n'+res.data.map(function(p,i){return(i+1)+'. '+p.name+' by '+(p.brand||'N/A')+' | Trust: '+p.trust_score+'/99 | '+(p.category||'')+(p.affiliate_url?'\n   BUY: '+p.affiliate_url:'')}).join('\n'))
    }).catch(function(e){console.error('products:',e)}))
  }

  if(lo.match(/study|research|evidence|pubmed|science|clinical|trial|journal/)){
    q.push(sb.from('pubmed_studies').select('title,journal,pub_date,url').limit(6).then(function(res){
      if(res.data&&res.data.length)ctx.push('\nRESEARCH:\n'+res.data.map(function(s,i){return(i+1)+'. "'+s.title+'" - '+(s.journal||'')+' ('+(s.pub_date||'')+') '+(s.url||'')}).join('\n'))
    }).catch(function(e){console.error('research:',e)}))
  }

  if(lo.match(/video|watch|youtube|huberman|attia|patrick|podcast/)){
    q.push(sb.from('youtube_videos').select('title,channel,url').limit(5).then(function(res){
      if(res.data&&res.data.length)ctx.push('\nVIDEOS:\n'+res.data.map(function(v,i){return(i+1)+'. "'+v.title+'" - '+(v.channel||'')+' | '+(v.url||'')}).join('\n'))
    }).catch(function(e){console.error('videos:',e)}))
  }

  if(lo.match(/drug|interact|cbd.*with|thc.*with|ssri|blood thin|statin|warfarin|zoloft|lexapro|medication|mixing|combine|safe to take|cyp|validate/))ctx.push('\nINTERACTION MODE - Full depth. Enzymes mechanisms severity timing.')
  if(lo.match(/reset|40.?day|mardi|sober|ash wednesday|lent|detox|alcohol free/))ctx.push('\nTHE LIVE RESET - 40-day challenge Feb 18-Mar 29 2026. Ochsner Alcohol Free for 40. CA Sober venues NOLA. neworleans.bleu.live')
  if(lo.match(/database|how many|total|stats|about bleu|what is bleu|what is alvai|who are you/)){
    q.push(sb.from('practitioners').select('*',{count:'exact',head:true}).eq('is_active',true).then(function(res){
      ctx.push('\nBLEU: '+(res.count||'1800+')+' verified practitioners. NPI-checked. 10-factor trust scores. 21 symptom mappings. Drug interaction engine. New Orleans expanding to 24 cities.')
    }).catch(function(e){console.error('stats:',e)}))
  }

  await Promise.all(q)
  return ctx
}

serve(async function(req){
  if(req.method==='OPTIONS')return new Response(null,{headers:cors})
  try{
    var body=await req.json()
    var message=body.message,history=body.history||[],stream=body.stream!==false
    if(!message)return new Response(JSON.stringify({error:'No message'}),{status:400,headers:Object.assign({},cors,{'Content-Type':'application/json'})})

    var ctx=await fetchCtx(message)
    var msgs=history.slice(-10).map(function(h){return{role:h.role,content:h.content}})
    var userContent=ctx.length>0?message+'\n\n[LIVE DATA FROM BLEU DATABASE - REAL VERIFIED DATA. USE IT.]\n'+ctx.join('\n'):message
    msgs.push({role:'user',content:userContent})

    var isDeep=!!message.toLowerCase().match(/interact|drug|compare|analyze|explain|how does|why|versus|research/)||message.length>120

    var cr=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':CK,'anthropic-version':'2023-06-01'},
      body:JSON.stringify({model:'claude-opus-4-20250514',max_tokens:isDeep?2000:1200,system:SYS,messages:msgs,stream:stream})
    })

    if(!cr.ok){
      console.error('Opus:',cr.status,await cr.text())
      return new Response(JSON.stringify({error:'AI unavailable',fallback:true}),{status:502,headers:Object.assign({},cors,{'Content-Type':'application/json'})})
    }

    if(stream){
      var ts=new TransformStream()
      var w=ts.writable.getWriter(),enc=new TextEncoder()
      ;(async function(){
        try{
          var r=cr.body.getReader(),dec=new TextDecoder(),buf=''
          while(true){
            var chunk=await r.read()
            if(chunk.done)break
            buf+=dec.decode(chunk.value,{stream:true})
            var ls=buf.split('\n');buf=ls.pop()||''
            for(var i=0;i<ls.length;i++){
              var l=ls[i]
              if(l.startsWith('data: ')){
                var d=l.slice(6).trim()
                if(d==='[DONE]')continue
                try{
                  var p=JSON.parse(d)
                  if(p.type==='content_block_delta'&&p.delta&&p.delta.type==='text_delta')await w.write(enc.encode('data: '+JSON.stringify({t:p.delta.text})+'\n\n'))
                  if(p.type==='message_stop')await w.write(enc.encode('data: '+JSON.stringify({done:true})+'\n\n'))
                }catch(e){}
              }
            }
          }
          await w.write(enc.encode('data: '+JSON.stringify({done:true})+'\n\n'))
          await w.close()
        }catch(e){console.error(e);try{await w.close()}catch(x){}}
      })()
      return new Response(ts.readable,{headers:Object.assign({},cors,{'Content-Type':'text/event-stream','Cache-Control':'no-cache'})})
    }else{
      var cd=await cr.json()
      return new Response(JSON.stringify({reply:cd.content&&cd.content[0]?cd.content[0].text:'Try again.'}),{headers:Object.assign({},cors,{'Content-Type':'application/json'})})
    }
  }catch(e){
    console.error('Alvai:',e)
    return new Response(JSON.stringify({error:'Error',fallback:true}),{status:500,headers:Object.assign({},cors,{'Content-Type':'application/json'})})
  }
})
