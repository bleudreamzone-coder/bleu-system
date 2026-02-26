#!/usr/bin/env python3
"""Home page: showstopper animations, text flow, scroll reveals, natural rhythm"""
import sys
FILE = "index.html"
with open(FILE, "r", encoding="utf-8") as f:
    html = f.read()
orig = len(html)

# ══════════════════════════════════════════════════════════
# ENHANCED HOME CSS — scroll reveals, text flow, card magic
# ══════════════════════════════════════════════════════════
HOME_CSS = """
/* ═══ HOME PAGE SHOWSTOPPER ═══ */

/* Base reveal - elements start invisible, appear on scroll */
.h-rise{opacity:0;transform:translateY(32px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
.h-rise.h-on{opacity:1;transform:translateY(0)}

/* Fade from left */
.h-left{opacity:0;transform:translateX(-30px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
.h-left.h-on{opacity:1;transform:translateX(0)}

/* Scale up */
.h-pop{opacity:0;transform:scale(.92);transition:opacity .6s cubic-bezier(.16,1,.3,1),transform .6s cubic-bezier(.16,1,.3,1)}
.h-pop.h-on{opacity:1;transform:scale(1)}

/* Card hover lift */
#p-home [onclick]{transition:all .4s cubic-bezier(.16,1,.3,1) !important}
#p-home [onclick]:hover{transform:translateY(-6px) !important;box-shadow:0 20px 60px rgba(0,0,0,.4),0 0 30px rgba(200,169,81,.06) !important}

/* Staggered grid entrance */
#p-home [onclick]:nth-child(1){transition-delay:.05s !important}
#p-home [onclick]:nth-child(2){transition-delay:.1s !important}
#p-home [onclick]:nth-child(3){transition-delay:.15s !important}
#p-home [onclick]:nth-child(4){transition-delay:.2s !important}
#p-home [onclick]:nth-child(5){transition-delay:.25s !important}
#p-home [onclick]:nth-child(6){transition-delay:.3s !important}
#p-home [onclick]:nth-child(7){transition-delay:.35s !important}
#p-home [onclick]:nth-child(8){transition-delay:.4s !important}
#p-home [onclick]:nth-child(9){transition-delay:.45s !important}

/* Hero text glow pulse */
.h-glow{animation:hGlow 4s ease-in-out infinite}
@keyframes hGlow{0%,100%{text-shadow:0 0 20px rgba(200,169,81,.08)}50%{text-shadow:0 0 50px rgba(200,169,81,.2),0 0 80px rgba(200,169,81,.06)}}

/* Subtle float for decorative elements */
.h-float{animation:hFloat 6s ease-in-out infinite}
@keyframes hFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}

/* Shimmer line */
.h-shimmer{position:relative;overflow:hidden}
.h-shimmer::after{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(200,169,81,.06),transparent);animation:hShimmer 4s ease-in-out infinite}
@keyframes hShimmer{0%{left:-100%}50%{left:100%}100%{left:100%}}

/* Divider fade-in */
#p-home .divider{opacity:0;transition:opacity 1s ease .3s}
#p-home .divider.h-on{opacity:1}

/* Tag pills bounce */
@keyframes hBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
#p-home [onclick]:hover span[style*="border-radius"]{animation:hBounce .4s ease}

/* Scrolling ticker for home */
.h-ticker-wrap{overflow:hidden;height:24px;position:relative;margin:12px 0}
.h-ticker{display:flex;animation:hTick 20s linear infinite}
.h-ticker span{white-space:nowrap;padding:0 32px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(200,169,81,.35);font-weight:600}
@keyframes hTick{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

/* Section breathing */
#p-home section{transition:all .5s ease}

/* Smooth border glow on cards */
@keyframes hBorderGlow{0%,100%{border-color:rgba(200,169,81,.08)}50%{border-color:rgba(200,169,81,.2)}}

/* Text reveal character by character illusion */
.h-typetext{overflow:hidden;white-space:nowrap;border-right:2px solid rgba(200,169,81,.4);animation:hType 3s steps(40) 1s forwards,hBlink .7s step-end infinite alternate}
@keyframes hType{from{width:0}to{width:100%}}
@keyframes hBlink{50%{border-color:transparent}}
"""

# ══════════════════════════════════════════════════════════
# HOME JS — scroll observer, stagger, counter, ticker init
# ══════════════════════════════════════════════════════════
HOME_JS = r"""
// ═══ HOME PAGE SHOWSTOPPER JS ═══
(function(){
  // Scroll reveal observer
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        // Small delay for natural rhythm
        var d=parseInt(e.target.dataset.hdelay||'0');
        setTimeout(function(){e.target.classList.add('h-on')},d);
        obs.unobserve(e.target);
      }
    });
  },{threshold:0.08,rootMargin:'0px 0px -40px 0px'});

  function initHome(){
    var hp=document.getElementById('p-home');
    if(!hp||hp.offsetParent===null)return;

    // ── Animate all clickable cards ──
    var cards=hp.querySelectorAll('[onclick]');
    cards.forEach(function(c,i){
      if(c.classList.contains('h-rise'))return;
      c.classList.add('h-rise');
      c.dataset.hdelay=String(i*70);
      obs.observe(c);
    });

    // ── Animate headings with left-slide ──
    var headings=hp.querySelectorAll('h1,h2');
    headings.forEach(function(h,i){
      if(h.closest('[onclick]')||h.classList.contains('h-left'))return;
      h.classList.add('h-left');
      h.dataset.hdelay=String(i*100);
      obs.observe(h);
    });

    // ── Animate paragraphs with rise ──
    var paras=hp.querySelectorAll('p');
    paras.forEach(function(p,i){
      if(p.closest('[onclick]')||p.classList.contains('h-rise'))return;
      p.classList.add('h-rise');
      p.dataset.hdelay=String(100+i*80);
      obs.observe(p);
    });

    // ── Animate h3 inside cards — pop effect ──
    var h3s=hp.querySelectorAll('[onclick] h3');
    h3s.forEach(function(h){
      if(h.classList.contains('h-pop'))return;
      h.classList.add('h-pop');
      obs.observe(h);
    });

    // ── Dividers ──
    var dividers=hp.querySelectorAll('.divider');
    dividers.forEach(function(d){
      if(!d.classList.contains('h-rise')){d.classList.add('h-rise');obs.observe(d)}
    });

    // ── Add glow to main hero heading ──
    var hero=hp.querySelector('h1');
    if(hero&&!hero.classList.contains('h-glow')){hero.classList.add('h-glow')}

    // ── Add shimmer to first card or prominent element ──
    if(cards.length>0&&!cards[0].classList.contains('h-shimmer')){
      cards[0].classList.add('h-shimmer');
    }

    // ── Inject scrolling ticker if not exists ──
    if(!hp.querySelector('.h-ticker-wrap')){
      var firstDiv=hp.querySelector('.divider');
      if(firstDiv){
        var ticker=document.createElement('div');
        ticker.className='h-ticker-wrap';
        ticker.innerHTML='<div class="h-ticker"><span>525,965 Verified Records</span><span>247 Federal Data Sources</span><span>22 AI Modes</span><span>15 Intelligence Systems</span><span>Patent Pending</span><span>Dr. Felicia Stoler</span><span>Born in New Orleans</span><span>525,965 Verified Records</span><span>247 Federal Data Sources</span><span>22 AI Modes</span><span>15 Intelligence Systems</span><span>Patent Pending</span><span>Dr. Felicia Stoler</span><span>Born in New Orleans</span></div>';
        firstDiv.parentNode.insertBefore(ticker,firstDiv);
      }
    }

    // ── Animate any stat numbers ──
    hp.querySelectorAll('[data-count]').forEach(function(el){
      if(el.dataset.counted)return;
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(!e.isIntersecting)return;
          el.dataset.counted='1';
          var target=parseInt(el.dataset.count),s=Date.now();
          (function tick(){
            var p=Math.min((Date.now()-s)/2000,1);
            el.textContent=Math.round(target*(1-Math.pow(1-p,3))).toLocaleString();
            if(p<1)requestAnimationFrame(tick);
          })();
          io.unobserve(el);
        });
      },{threshold:.3});
      io.observe(el);
    });
  }

  // Run on load
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){setTimeout(initHome,200)});
  }else{
    setTimeout(initHome,200);
  }

  // Re-run when home tab clicked
  var origGo=window.go;
  if(origGo){
    window.go=function(tab){
      origGo(tab);
      if(tab==='home'){
        // Reset animations so they replay
        var hp=document.getElementById('p-home');
        if(hp){
          hp.querySelectorAll('.h-on').forEach(function(el){el.classList.remove('h-on')});
          setTimeout(initHome,150);
        }
      }
    };
  }
})();
"""

# ══════════════════════════════════════════════════════════
# INJECT
# ══════════════════════════════════════════════════════════
changes = 0

# Remove old home animation CSS/JS if present
for old in ['HOME PAGE ANIMATIONS', 'home-card-animate', 'initHomeAnimations', '.home-reveal']:
    if old in html:
        # Find the style/script block containing it
        for tag_open, tag_close in [('<style>', '</style>'), ('<script>', '</script>')]:
            pos = html.find(old)
            while pos > 0:
                so = html.rfind(tag_open, 0, pos)
                sc = html.find(tag_close, pos)
                if so > 0 and sc > 0 and (sc - so) < 5000:
                    # Only remove if this block is primarily about home animations
                    block = html[so:sc+len(tag_close)]
                    if 'HOME PAGE' in block or 'initHomeAnimations' in block or '.home-reveal' in block:
                        html = html[:so] + html[sc+len(tag_close):]
                        print(f"  Removed old block containing: {old}")
                        break
                pos = html.find(old, pos + 10)
                if pos < 0:
                    break

# Inject new CSS
if 'HOME PAGE SHOWSTOPPER' not in html:
    html = html.replace('</head>', '<style>' + HOME_CSS + '</style>\n</head>', 1)
    changes += 1
    print("  CSS injected")

# Inject new JS
if 'HOME PAGE SHOWSTOPPER JS' not in html:
    html = html.replace('</body>', '<script>' + HOME_JS + '</script>\n</body>', 1)
    changes += 1
    print("  JS injected")

# ══════════════════════════════════════════════════════════
# VALIDATE
# ══════════════════════════════════════════════════════════
checks = {
    'Rise animation': '.h-rise' in html,
    'Left slide': '.h-left' in html,
    'Pop effect': '.h-pop' in html,
    'Card hover lift': '#p-home [onclick]' in html,
    'Stagger delays': 'nth-child(9)' in html,
    'Glow pulse': 'hGlow' in html,
    'Float': 'hFloat' in html,
    'Shimmer': 'hShimmer' in html,
    'Ticker CSS': 'h-ticker' in html,
    'Ticker inject': 'h-ticker-wrap' in html,
    'Scroll observer': 'IntersectionObserver' in html,
    'Tab re-init': "tab==='home'" in html,
    'Stagger JS': 'hdelay' in html,
}
ok = sum(checks.values())
for k,v in checks.items():
    print(f"  {'Y' if v else 'N'} {k}")
print(f"\n  {ok}/{len(checks)} | Changes: {changes} | Size: {orig:,} -> {len(html):,}")

with open(FILE, "w", encoding="utf-8") as f:
    f.write(html)

if ok == len(checks):
    print("\n  SHOWSTOPPER READY - deploy now")
