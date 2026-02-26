#!/usr/bin/env python3
"""Fix: Enterprise tab blank because ent-reveal opacity:0 never triggers"""
FILE = "index.html"
with open(FILE, "r", encoding="utf-8") as f:
    html = f.read()

# Fix 1: Make ent-reveal visible by default, animate on scroll instead
# Replace the CSS rule that hides everything
html = html.replace(
    '.ent-reveal{opacity:0;transform:translateY(30px);transition:all 0.8s cubic-bezier(.16,1,.3,1)}',
    '.ent-reveal{opacity:1;transform:translateY(0);transition:all 0.8s cubic-bezier(.16,1,.3,1)}'
)

# Fix 2: Also hook into go() to re-trigger observer when enterprise tab opens
ENT_HOOK = """<script>
(function(){
  var og=window.go;
  if(og){window.go=function(t){og(t);if(t==='enterprise'){
    setTimeout(function(){
      document.querySelectorAll('.ent-reveal').forEach(function(el){el.classList.add('visible')});
      document.querySelectorAll('.ent-count').forEach(function(el){
        if(el.dataset.counted)return;el.dataset.counted='1';
        var target=parseInt(el.dataset.target),start=Date.now();
        (function tick(){var p=Math.min((Date.now()-start)/2000,1);el.textContent=Math.round(target*(1-Math.pow(1-p,3))).toLocaleString();if(p<1)requestAnimationFrame(tick)})();
      });
      if(typeof entToggle==='function')entToggle(true);
      if(typeof entSetPhase==='function')entSetPhase(0);
      if(typeof entCalcBiz==='function')entCalcBiz();
      if(typeof entCalcCity==='function')entCalcCity();
    },150);
  }}}
})();
</script>"""

if 'enterprise-tab-hook' not in html:
    html = html.replace('</body>', '<!-- enterprise-tab-hook -->' + ENT_HOOK + '\n</body>', 1)

print(f"Size: {len(html):,}")
print("ent-reveal default visible:", '.ent-reveal{opacity:1' in html)
print("Tab hook added:", 'enterprise-tab-hook' in html)

with open(FILE, "w", encoding="utf-8") as f:
    f.write(html)
print("DONE - deploy now")
