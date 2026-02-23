#!/bin/bash
cd /workspaces/bleu-system || exit 1
git pull
echo "✦ BLEU TOTAL REPAIR v4.0 — STARTING"

# PART 1: SERVER — Stop fake data, add affiliates, expand cities
echo "═══ PART 1: SERVER FIXES ═══"
sed -i "/Never say .I recommend consulting/a\\
- CRITICAL DATA RULE: ONLY present practitioner names, phone numbers, and addresses that appear in [PRACTITIONER DATA] sections injected by the server. If NO practitioner data is provided, say 'I do not have matching practitioners in our verified database yet. Here are trusted search tools: psychologytoday.com, findtreatment.gov (SAMHSA), nami.org.' NEVER FABRICATE contact information.\\
- When recommending supplements or products, include purchase guidance. Say: 'You can find this on Amazon (search: [exact product name]) or iHerb for competitive pricing.'\\
- After helpful responses in any mode, end with: 'Found this helpful? Share BLEU.live with someone who needs it.'" server.js
sed -i "s/'new orleans','houston'/'new orleans','metairie','kenner','slidell','mandeville','covington','gretna','marrero','harvey','chalmette','laplace','hammond','houma','thibodaux','houston'/" server.js
sed -i 's/Claude-powered/Alvai-powered/g' index.html
echo "  ✓ Server fixes done"

# PART 2: ENHANCED CSS
echo "═══ PART 2: VISUAL CSS ═══"
sed -i '/<\/head>/i \
<style>\
.product-card{background:rgba(30,58,76,0.6);border:1px solid rgba(212,175,55,0.2);border-radius:12px;padding:16px;margin:8px 0;display:flex;gap:12px;align-items:center;transition:all 0.3s}\
.product-card:hover{border-color:rgba(212,175,55,0.5);transform:translateY(-2px)}\
.product-card img{width:80px;height:80px;border-radius:8px;object-fit:cover}\
.product-card .info{flex:1}\
.product-card .name{color:#d4af37;font-weight:600;font-size:15px}\
.product-card .desc{color:#a0b4c0;font-size:13px;margin:4px 0}\
.product-card .price{color:#4ecdc4;font-weight:700;font-size:16px}\
.buy-btn{background:linear-gradient(135deg,#d4af37,#b8962e);color:#0a1628;padding:8px 16px;border-radius:20px;font-weight:700;font-size:13px;text-decoration:none;display:inline-block;transition:all 0.3s;margin:4px}\
.buy-btn:hover{transform:scale(1.05);box-shadow:0 4px 15px rgba(212,175,55,0.3)}\
.practitioner-card{background:rgba(30,58,76,0.6);border:1px solid rgba(78,205,196,0.2);border-radius:12px;padding:16px;margin:8px 0;transition:all 0.3s}\
.practitioner-card:hover{border-color:rgba(78,205,196,0.5)}\
.video-card{background:rgba(30,58,76,0.6);border:1px solid rgba(212,175,55,0.15);border-radius:12px;overflow:hidden;transition:all 0.3s;cursor:pointer}\
.video-card:hover{border-color:rgba(212,175,55,0.4);transform:translateY(-2px)}\
.grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:16px 0}\
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0}\
@media(max-width:768px){.grid-2,.grid-3{grid-template-columns:1fr}}\
.stat-card{background:rgba(30,58,76,0.6);border:1px solid rgba(78,205,196,0.15);border-radius:12px;padding:20px;text-align:center}\
.stat-card .number{font-size:28px;font-weight:700;color:#4ecdc4}\
.stat-card .label{font-size:12px;color:#a0b4c0;text-transform:uppercase;letter-spacing:1px;margin-top:4px}\
.mission-card{background:rgba(30,58,76,0.6);border:1px solid rgba(212,175,55,0.15);border-radius:12px;padding:16px;display:flex;gap:12px;align-items:center;cursor:pointer;transition:all 0.3s;user-select:none}\
.mission-card:hover{border-color:rgba(212,175,55,0.4)}\
.mission-card.done{border-color:rgba(78,205,196,0.5)}\
.mission-card .check{width:28px;height:28px;border:2px solid rgba(212,175,55,0.4);border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.3s}\
.mission-card.done .check{background:#4ecdc4;border-color:#4ecdc4}\
.event-card{background:rgba(30,58,76,0.6);border-left:3px solid #d4af37;border-radius:0 12px 12px 0;padding:16px;margin:8px 0}\
.share-btn{background:none;border:1px solid rgba(212,175,55,0.3);color:#d4af37;padding:6px 14px;border-radius:20px;font-size:12px;cursor:pointer;transition:all 0.3s;margin-top:8px;display:inline-block}\
.share-btn:hover{background:rgba(212,175,55,0.1);border-color:#d4af37}\
.protocol-card{background:rgba(30,58,76,0.6);border:1px solid rgba(78,205,196,0.15);border-radius:12px;padding:20px;cursor:pointer;transition:all 0.3s}\
.protocol-card:hover{border-color:rgba(78,205,196,0.4);transform:translateY(-2px)}\
.trust-badge{display:inline-flex;align-items:center;gap:4px;background:rgba(78,205,196,0.1);border:1px solid rgba(78,205,196,0.3);border-radius:20px;padding:4px 10px;font-size:11px;color:#4ecdc4}\
.toast-msg{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#d4af37;color:#0a1628;padding:10px 20px;border-radius:20px;font-weight:600;z-index:9999;opacity:0;transition:opacity 0.3s}\
.toast-msg.show{opacity:1}\
</style>' index.html
echo "  ✓ CSS injected"

# PART 3: SHARE ENGINE + ENGAGEMENT JS
echo "═══ PART 3: SHARE ENGINE ═══"
sed -i '/<\/body>/i \
<script>\
function shareInsight(t){const s=t.substring(0,200)+"... Discover wellness at BLEU.live";if(navigator.share){navigator.share({title:"BLEU.live",text:s,url:"https://bleu.live"}).catch(()=>{});}else{navigator.clipboard.writeText(s).then(()=>{showToast("Copied! Share it");});}}\
function showToast(m){let t=document.createElement("div");t.className="toast-msg show";t.textContent=m;document.body.appendChild(t);setTimeout(()=>{t.remove();},2500);}\
const chatObs=new MutationObserver((muts)=>{muts.forEach((m)=>{m.addedNodes.forEach((n)=>{if(n.nodeType!==1)return;const msgs=[...n.querySelectorAll?n.querySelectorAll(".alvai-msg,.assistant,.bot-msg,.ai-msg"):[]];if(n.classList&&(n.classList.contains("alvai-msg")||n.classList.contains("assistant")||n.classList.contains("bot-msg")))msgs.push(n);msgs.forEach((el)=>{if(!el.querySelector(".share-btn")){const b=document.createElement("button");b.className="share-btn";b.textContent="Share this insight";b.onclick=()=>shareInsight(el.textContent);el.appendChild(b);}});});});});\
document.querySelectorAll(".chat-messages,.chat-box,.messages").forEach(el=>chatObs.observe(el,{childList:true,subtree:true}));\
document.addEventListener("click",(e)=>{const c=e.target.closest&&e.target.closest(".mission-card");if(c){c.classList.toggle("done");showToast(c.classList.contains("done")?"Mission complete!":"Unchecked");}});\
</script>' index.html
echo "  ✓ Share engine added"

# PART 4: PLATFORM STATS
echo "═══ PART 4: STATS ═══"
sed -i 's|HOW TRUST SCORES WORK|THE PLATFORM IN NUMBERS</p><div class="grid-3" style="margin:20px auto;max-width:800px"><div class="stat-card"><div class="number">253,938</div><div class="label">Verified Practitioners</div></div><div class="stat-card"><div class="number">1,101</div><div class="label">Reviewed Products</div></div><div class="stat-card"><div class="number">22</div><div class="label">Therapy \&amp; Recovery Modes</div></div></div><div class="grid-3" style="margin:20px auto;max-width:800px"><div class="stat-card"><div class="number">54</div><div class="label">Substances Tracked</div></div><div class="stat-card"><div class="number">24/7</div><div class="label">Always Available</div></div><div class="stat-card"><div class="number">$0</div><div class="label">To Start</div></div></div><p style="text-align:center;margin-top:30px;font-size:13px;letter-spacing:2px;color:rgba(212,175,55,0.6)">HOW TRUST SCORES WORK|' index.html
echo "  ✓ Stats added"

# PART 5: META TAGS
echo "═══ PART 5: META TAGS ═══"
sed -i '/<head>/a \
<meta property="og:title" content="BLEU.live — The Longevity Operating System">\
<meta property="og:description" content="AI-powered wellness. Therapy, recovery, cannabis intelligence, and 253,938 verified practitioners.">\
<meta property="og:url" content="https://bleu.live">\
<meta name="twitter:card" content="summary_large_image">\
<meta name="description" content="BLEU.live — AI wellness with therapy, recovery, cannabis intelligence, drug interactions, 253K practitioners. Free.">\
<meta name="keywords" content="wellness,therapy,recovery,cannabis,CBD,mental health,anxiety,depression,addiction,supplements,practitioners">' index.html
echo "  ✓ Meta tags added"

# PART 6: DEPLOY
echo "═══ DEPLOYING ═══"
git add -A
git commit -m "BLEU v4.0 TOTAL REPAIR — share engine, stats, meta, fake data fix, cities, CSS"
git push

echo ""
echo "✦ DONE. Hard refresh bleu.live (Cmd+Shift+R)"
echo "✦ Railway auto-deploys server in ~60s"
