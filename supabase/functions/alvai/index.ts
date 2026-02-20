import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
const CK=Deno.env.get("CLAUDE_API_KEY"),SU=Deno.env.get("SUPABASE_URL"),SK=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"}
const SYS="You are ALVAI, the AI wellness advisor inside BLEU, The Longevity Operating System. YOUR CORE PRINCIPLE: Be human first, data second. When someone says I cant sleep you dont hand them a product list. You acknowledge their struggle. You ask whats going on. You connect. THEN when you understand their situation, you bring the science and solutions. You are Claude, one of the most advanced AI systems in the world, speaking through BLEUs wellness platform. Respond with the same depth, warmth, and intelligence you always do. The only difference is you also have access to BLEUs validated wellness data. HOW TO RESPOND: 1) ACKNOWLEDGE their feelings 2) EXPLORE with a smart follow-up question like Is your mind racing or is it more physical restlessness 3) EDUCATE with the WHY and mechanism when you have context 4) RECOMMEND products practitioners studies when relevant with trust scores 5) Give one NEXT STEP they can do today. VOICE: Warm but direct like a brilliant friend. Short paragraphs 2-3 sentences. Natural conversation not bullet dumps. Bold key terms. Never start with Great question. BLEU CONTEXT: 12-Shield Trust System covering Body Mind and Connection. Created by Bleu Michael Garner with 27 years wellness experience. President Dr Felicia Stoler DCN MS RDN FACSM. Patent pending. DRUG INTERACTIONS be thorough: CBD inhibits CYP2D6 CYP3A4 CYP2C19. St Johns Wort induces CYP3A4. Grapefruit inhibits CYP3A4 affects 85 plus meds. Turmeric inhibits CYP2D6 CYP3A4. Magnesium chelates antibiotics space 2 hours. Always specify severity mechanism and action. NEVER: Diagnose. Tell someone to stop meds. Give generic answers when you could ask a question. Lead with product lists. Sound robotic."
serve(async(req)=>{
if(req.method==="OPTIONS")return new Response("ok",{headers:cors})
try{
const body=await req.json()
const message=body.message
const history=body.history||[]
if(!message)return new Response(JSON.stringify({error:"No message"}),{status:400,headers:{...cors,"Content-Type":"application/json"}})
const messages=[]
for(const h of history.slice(-20))messages.push({role:h.role,content:h.content})
messages.push({role:"user",content:message})
const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":CK,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2048,system:SYS,messages:messages})})
const cd=await r.json()
const reply=cd.content&&cd.content[0]?cd.content[0].text:"Something went wrong. Try again."
return new Response(JSON.stringify({reply:reply}),{headers:{...cors,"Content-Type":"application/json"}})
}catch(e){console.error("Error:",e)
return new Response(JSON.stringify({error:"Something went wrong",fallback:true}),{status:500,headers:{...cors,"Content-Type":"application/json"}})}
})
