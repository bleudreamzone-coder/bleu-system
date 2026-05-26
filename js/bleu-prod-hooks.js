/* =========================================================================
   bleu.live — PRODUCTION HOOKS · v1
   Single shared file. Every sea includes this once.
   Drop into /public/js/bleu-prod-hooks.js and add to each HTML before </body>:
     <script src="/js/bleu-prod-hooks.js" defer></script>

   Wires: sendPrompt, routeTo, startStripeCheckout, authProvider
   Created: 2026-05-09 · Bleu Garner / Dr. Felicia Stoler, DCN
   ========================================================================= */
(function(){
  'use strict';

  // -------------------------------------------------------------------
  // CONFIG — edit once, applies to all five tabs
  // -------------------------------------------------------------------
  var CONFIG = {
    alvaiEndpoint:   '/api/chat',           // ALVAI backend (Supabase edge fn)
    // Stripe public key is injected at build/runtime. Server exposes it at
    // /api/config (or window.__BLEU_STRIPE_PK__ from a server-rendered tag).
    // Never hardcode the live key in the repo.
    stripePublicKey: (typeof window !== 'undefined' && window.__BLEU_STRIPE_PK__) || null,
    stripeAccount:   'acct_1ShZN7K4cATmIFbo',
    routes: {
      '/':          '/',
      '/local':     '/local',
      '/support':   '/support',
      '/learn':     '/learn',
      '/supply':    '/supply',
      '/account':   '/account',
      '/signin':    '/auth/signin',
      '/create-account': '/auth/create',
      '/affiliate-disclosure': '/legal/affiliate-disclosure',
      '/privacy':   '/legal/privacy',
      // 333 HERO pages already deployed in dist/
      '/sleep':     '/sleep',
      '/anxiety':   '/anxiety',
      '/gut':       '/gut'
    },
    stripePrices: {
      sleep:     'price_1TEKQmK4cATmIFbokmkYg47S', //  $49 / mo
      stress:    'price_1TEKS6K4cATmIFbo1OW7BeCW', //  $45 / mo
      longevity: 'price_1TEKSWK4cATmIFbojDTEJng9', //  $69 / mo
      gut:       'price_1TEKSsK4cATmIFbouxOBHtwQ'  //  $55 / mo
    }
  };

  // -------------------------------------------------------------------
  // ALVAI — primary unifier
  // -------------------------------------------------------------------
  // Detect which tab we're on — the URL path tells us mode.
  function detectMode(){
    var p = window.location.pathname || '/';
    if (p.indexOf('/support') !== -1) return 'therapy';
    if (p.indexOf('/supply') !== -1) return 'supply';
    if (p.indexOf('/learn') !== -1) return 'learn';
    if (p.indexOf('/local') !== -1) return 'local';
    return 'general';
  }

  // Display label for the panel header — uses the URL slug (HOME, LOCAL, SUPPORT, ...)
  // rather than the AI mode name (general, therapy, ...) so the reader sees what they expect.
  function detectTabLabel(){
    var p = window.location.pathname || '/';
    if (p.indexOf('/local') !== -1) return 'local';
    if (p.indexOf('/support') !== -1) return 'support';
    if (p.indexOf('/supply') !== -1) return 'supply';
    if (p.indexOf('/learn') !== -1) return 'learn';
    return 'home';
  }

  // -------------------------------------------------------------------
  // CHAT PANEL — light, paper-toned, inheriting the bleu.live design language.
  // Tokens match index.html:44-50: --ink #181714, --ink-soft #4b4942,
  // --ink-faint #807a6f, --ink-whisper #a8a299, cream-warm #f4ecd9,
  // --gold #c9a227, --purple #4B1E82, fonts Fraunces (italic 300/400) + Inter.
  // Reference patterns:
  //   passport-strip (index.html:294-302) — gold-touched paper card, radius 18
  //   bh-opening     (index.html:207-214) — italic Fraunces 300, --ink body
  //   bh-context     (index.html:107-110) — small caps Inter, .16em, gold dot
  //   bh-input + bh-input-go (index.html:239-263) — pill input, ink/cream send circle
  //   bh-chip        (index.html:269-282) — cream pill, ink-soft text
  // -------------------------------------------------------------------
  var _panel = null, _body = null, _input = null, _modeLabel = null, _welcomeShown = false;
  var REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = 'cubic-bezier(.4,0,.2,1)';
  var TRANS = REDUCED_MOTION ? 'none' : ('opacity .18s ' + EASE + ',transform .18s ' + EASE);

  // Send arrow — verbatim copy of the SVG in index.html:817-818 (.bh-input-go)
  var SEND_SVG = '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">'
               + '<path d="M7 12V2M7 2L2 7M7 2L12 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
               + '</svg>';

  function ensurePlaceholderStyle(){
    if (document.getElementById('bleu-alvai-placeholder-style')) return;
    var s = document.createElement('style');
    s.id = 'bleu-alvai-placeholder-style';
    s.textContent = '#bleu-alvai-panel input::placeholder{color:#5a554a;font-style:italic;font-weight:300;opacity:1;}'
                  + '#bleu-alvai-panel ::-webkit-scrollbar{width:6px;height:6px}'
                  + '#bleu-alvai-panel ::-webkit-scrollbar-thumb{background:rgba(128,122,111,.25);border-radius:6px}';
    document.head.appendChild(s);
  }

  function ensurePanel(){
    if (_panel) return _panel;
    ensurePlaceholderStyle();

    var isMobile = window.matchMedia && window.matchMedia('(max-width:540px)').matches;

    var p = document.createElement('div');
    p.id = 'bleu-alvai-panel';
    p.setAttribute('role', 'dialog');
    p.setAttribute('aria-label', 'Alvai chat');
    p.style.cssText = (isMobile
      ? 'box-sizing:border-box;position:fixed;left:0;right:0;bottom:0;width:100%;max-width:100vw;height:78vh;max-height:78vh;border-radius:18px 18px 0 0;'
      : 'box-sizing:border-box;position:fixed;right:20px;bottom:20px;width:min(400px,calc(100vw - 40px));height:min(600px,calc(100vh - 40px));border-radius:18px;'
    ) + [
      'background:linear-gradient(135deg,rgba(255,250,241,.94),rgba(244,236,217,.66))',
      'backdrop-filter:blur(20px) saturate(180%)',
      '-webkit-backdrop-filter:blur(20px) saturate(180%)',
      'border:0.5px solid rgba(201,162,39,.35)',
      'box-shadow:0 18px 48px -24px rgba(15,28,46,.18),0 14px 32px -24px rgba(201,162,39,.28)',
      'display:flex','flex-direction:column',
      "font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
      'color:#181714','z-index:9999',
      'opacity:0','transform:translateY(8px)','pointer-events:none',
      'transition:' + TRANS, ''
    ].join(';');

    if (isMobile) {
      var handleWrap = document.createElement('div');
      handleWrap.style.cssText = 'flex:0 0 auto;padding:10px 0 4px;display:flex;justify-content:center;';
      var handle = document.createElement('div');
      handle.style.cssText = 'width:40px;height:4px;border-radius:999px;background:rgba(0,0,0,.15);';
      handleWrap.appendChild(handle);
      p.appendChild(handleWrap);
    }

    // HEADER
    var hdr = document.createElement('div');
    hdr.style.cssText = 'flex:0 0 auto;padding:16px 20px 14px;border-bottom:0.5px solid rgba(232,220,192,.6);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;';
    var hdrLeft = document.createElement('div');
    var title = document.createElement('div');
    title.style.cssText = "font-family:'Fraunces',Georgia,serif;font-style:italic;font-weight:300;font-size:18px;letter-spacing:-.005em;color:#181714;line-height:1.2;";
    title.textContent = 'Alvai';
    var subRow = document.createElement('div');
    subRow.style.cssText = 'display:inline-flex;align-items:center;margin-top:5px;';
    var sub = document.createElement('span');
    sub.style.cssText = 'font-size:10px;font-weight:400;text-transform:uppercase;letter-spacing:.16em;color:#a8a299;';
    sub.textContent = detectTabLabel();
    _modeLabel = sub;
    subRow.appendChild(sub);
    hdrLeft.appendChild(title); hdrLeft.appendChild(subRow);

    var close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close Alvai');
    close.style.cssText = 'background:transparent;border:0;color:#807a6f;font-size:22px;line-height:1;cursor:pointer;padding:4px 10px;border-radius:999px;transition:.2s ease;';
    close.textContent = '×';
    close.addEventListener('mouseenter', function(){ close.style.color = '#181714'; close.style.background = 'rgba(232,220,192,.5)'; });
    close.addEventListener('mouseleave', function(){ close.style.color = '#807a6f'; close.style.background = 'transparent'; });
    close.addEventListener('click', closePanel);
    hdr.appendChild(hdrLeft); hdr.appendChild(close);

    // BODY
    var body = document.createElement('div');
    body.id = 'bleu-alvai-body';
    body.style.cssText = 'flex:1 1 auto;overflow-y:auto;padding:14px 20px;display:flex;flex-direction:column;gap:14px;';

    // FOOTER (input pill + send circle, matching .bh-input + .bh-input-go)
    var foot = document.createElement('div');
    foot.style.cssText = 'flex:0 0 auto;padding:12px 16px 16px;border-top:0.5px solid rgba(232,220,192,.6);position:relative;';
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;';
    var input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'ask alvai…';
    input.setAttribute('aria-label', 'Message Alvai');
    input.style.cssText = [
      'width:100%','padding:12px 46px 12px 18px',
      'border:0.5px solid rgba(232,220,192,.85)','border-radius:999px',
      'background:#fefcf7',
      "font:14.5px/1.5 'Inter',-apple-system,sans-serif",'color:#181714',
      'outline:none','transition:.4s cubic-bezier(.2,.8,.3,1)',
      'box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 8px 20px -16px rgba(15,28,46,.15)',''
    ].join(';');
    input.addEventListener('focus', function(){
      input.style.borderColor = 'rgba(56,120,224,.45)';
      input.style.boxShadow = '0 0 0 4px rgba(56,120,224,.07),0 1px 0 rgba(255,255,255,.7) inset,0 12px 28px -16px rgba(56,120,224,.18)';
    });
    input.addEventListener('blur', function(){
      input.style.borderColor = 'rgba(232,220,192,.85)';
      input.style.boxShadow = '0 1px 0 rgba(255,255,255,.6) inset,0 8px 20px -16px rgba(15,28,46,.15)';
    });
    function submitFromPanel(){
      var v = (input.value || '').trim();
      if (!v) return;
      input.value = '';
      window.sendPrompt(v);
    }
    input.addEventListener('keydown', function(e){
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitFromPanel(); }
    });

    var send = document.createElement('button');
    send.type = 'button';
    send.setAttribute('aria-label', 'Send to Alvai');
    send.style.cssText = 'position:absolute;right:8px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:#181714;color:#faf6ee;display:flex;align-items:center;justify-content:center;border:0;cursor:pointer;transition:.4s ease;';
    send.innerHTML = SEND_SVG;
    send.addEventListener('mouseenter', function(){ send.style.background = '#4B1E82'; send.style.transform = 'translateY(-50%) scale(1.06)'; });
    send.addEventListener('mouseleave', function(){ send.style.background = '#181714'; send.style.transform = 'translateY(-50%) scale(1)'; });
    send.addEventListener('click', submitFromPanel);
    wrap.appendChild(input); wrap.appendChild(send);
    foot.appendChild(wrap);

    p.appendChild(hdr); p.appendChild(body); p.appendChild(foot);
    document.body.appendChild(p);

    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && _panel && _panel.style.opacity === '1') closePanel();
    });

    _panel = p; _body = body; _input = input;
    return p;
  }

  function ensureWelcome(){
    if (_welcomeShown) return;
    _welcomeShown = true;
    var w = document.createElement('div');
    w.style.cssText = "font-family:'Fraunces',Georgia,serif;font-style:italic;font-weight:300;font-size:15.5px;line-height:1.55;color:#4b4942;padding:6px 0 14px;border-bottom:0.5px solid rgba(232,220,192,.5);";
    w.textContent = "I'm here. What's going on?";
    _body.appendChild(w);
  }

  function openPanel(){
    var p = ensurePanel();
    if (_modeLabel) _modeLabel.textContent = detectTabLabel();
    ensureWelcome();
    requestAnimationFrame(function(){
      p.style.transform = 'translateY(0)';
      p.style.opacity = '1';
      p.style.pointerEvents = 'auto';
      setTimeout(function(){ if (_input) try { _input.focus(); } catch(e){} }, 200);
    });
  }

  function closePanel(){
    if (!_panel) return;
    _panel.style.transform = 'translateY(8px)';
    _panel.style.opacity = '0';
    _panel.style.pointerEvents = 'none';
  }

  function addUserBubble(text){
    var b = document.createElement('div');
    b.style.cssText = [
      'align-self:flex-end','max-width:86%','padding:9px 14px',
      'background:rgba(255,250,241,.55)',
      'border:0.5px solid rgba(232,220,192,.6)',
      'border-radius:16px 16px 4px 16px',
      "font:14.5px/1.5 'Inter',-apple-system,sans-serif",'color:#4b4942',
      'white-space:pre-wrap','word-wrap:break-word',''
    ].join(';');
    b.textContent = text;
    _body.appendChild(b);
    _body.scrollTop = _body.scrollHeight;
  }

  function createAssistantSlot(){
    var slot = document.createElement('div');
    slot.setAttribute('aria-live', 'polite');
    slot.style.cssText = [
      'align-self:stretch','max-width:100%','padding:2px 0 2px 14px',
      'border-left:2px solid rgba(75,30,130,.20)',
      "font:15px/1.65 'Inter',-apple-system,sans-serif",'color:#181714',
      'white-space:pre-wrap','word-wrap:break-word',''
    ].join(';');
    var dots = document.createElement('span');
    dots.textContent = '…';
    dots.style.cssText = 'opacity:.5;';
    slot.appendChild(dots);
    _body.appendChild(slot);
    _body.scrollTop = _body.scrollHeight;
    return { slot: slot, dots: dots };
  }

  function addErrorText(text){
    var b = document.createElement('div');
    b.style.cssText = [
      'align-self:stretch','padding:2px 0 2px 14px',
      'border-left:2px solid rgba(128,122,111,.22)',
      "font-family:'Fraunces',Georgia,serif",'font-style:italic','font-weight:300',
      'font-size:14.5px','line-height:1.5','color:#807a6f',
      'white-space:pre-wrap','word-wrap:break-word',''
    ].join(';');
    b.textContent = text;
    _body.appendChild(b);
    _body.scrollTop = _body.scrollHeight;
  }

  // -------------------------------------------------------------------
  // COMMERCE — inline product cards (Mission 2.5)
  // -------------------------------------------------------------------
  // Stable per-browser session id. No client session source existed before;
  // this is the canonical one, reused for chat + plan so audit/plan correlate.
  function getSessionId(){
    try {
      var k = 'bleu:session_id', v = localStorage.getItem(k);
      if (!v) {
        v = (window.crypto && crypto.randomUUID)
          ? crypto.randomUUID()
          : ('s-' + Date.now() + '-' + Math.random().toString(36).slice(2));
        localStorage.setItem(k, v);
      }
      return v;
    } catch (e) { return 's-' + Date.now(); }
  }
  window.getSessionId = getSessionId;

  function ensureCardStyle(){
    if (document.getElementById('bleu-card-style')) return;
    var s = document.createElement('style');
    s.id = 'bleu-card-style';
    s.textContent =
      '.bleu-card{max-width:340px;margin:10px 0 10px 14px;padding:14px;border-radius:12px;background:#fbfaf7;border:1px solid rgba(75,30,130,.12);border-left:3px solid #C9A84C;font:14px/1.5 \'Inter\',-apple-system,sans-serif;color:#181714}'
    + '.bleu-card--rail-A{border-left-color:#C9A84C}'
    + '.bleu-card--rail-B{border-left-color:#7CCBA2}'
    + '.bleu-card--rail-C{border-left-color:#2E75B6}'
    + '.bleu-card__name{font-weight:600;font-size:15px}'
    + '.bleu-card__desc{font-size:13px;opacity:.8;margin:5px 0}'
    + '.bleu-card__signoff{font-size:11px;color:#9a7b1e;margin:5px 0;letter-spacing:.04em}'
    + '.bleu-card__safety{font-size:11px;color:#b5651d;margin:5px 0}'
    + '.bleu-card__btn{margin-top:9px;padding:7px 16px;border:1px solid #4b1e82;background:#4b1e82;color:#fff;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600}'
    + '.bleu-card__btn:disabled{opacity:.55;cursor:default}'
    + '.bleu-card__added{font-size:12px;color:#2e7d32;margin-top:6px}'
    + '@media (max-width:480px){.bleu-card{max-width:calc(100% - 28px)}}';
    document.head.appendChild(s);
  }

  // Build cards with createElement only — never innerHTML with server data.
  function renderCardsBelowMessage(cards){
    ensureCardStyle();
    for (var i = 0; i < cards.length; i++){
      var c = cards[i] || {};
      var card = document.createElement('div');
      card.className = 'bleu-card bleu-card--rail-' + (c.rail || 'A');

      var name = document.createElement('div');
      name.className = 'bleu-card__name';
      name.textContent = c.name || '';
      card.appendChild(name);

      if (c.description){
        var desc = document.createElement('div');
        desc.className = 'bleu-card__desc';
        desc.textContent = c.description;
        card.appendChild(desc);
      }
      if (c.felicia_signoff){
        var so = document.createElement('div');
        so.className = 'bleu-card__signoff';
        so.textContent = '✓ Reviewed by Dr. Stoler';
        card.appendChild(so);
      }
      if (c.safety_badge){
        var sb = document.createElement('div');
        sb.className = 'bleu-card__safety';
        sb.textContent = c.safety_badge;
        card.appendChild(sb);
      }
      var btn = document.createElement('button');
      btn.className = 'bleu-card__btn';
      btn.setAttribute('data-sku', c.sku || '');
      btn.textContent = c.button_label || 'Add to Cart';
      (function(sku, b){ b.addEventListener('click', function(){ window.addToPlan(sku, b); }); })(c.sku, btn);
      card.appendChild(btn);

      _body.appendChild(card);
    }
    _body.scrollTop = _body.scrollHeight;
  }

  // POST sku to the active plan. On success: confirm inline, disable button,
  // bump the Your Cart badge (badge arrives in Mission 2.7 — guarded).
  window.addToPlan = function(sku, btn){
    if (!sku) return;
    fetch('/api/plan/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: getSessionId(), sku: sku })
    }).then(function(r){ return r.json(); }).then(function(d){
      if (d && d.ok){
        if (btn){
          btn.disabled = true;
          var note = document.createElement('div');
          note.className = 'bleu-card__added';
          note.textContent = 'Added to cart';
          if (btn.parentNode) btn.parentNode.appendChild(note);
        }
        if (typeof setCartCount === 'function' && d.items_count != null) setCartCount(d.items_count);
        window.dispatchEvent(new CustomEvent('bleu:plan-updated', { detail: { sku: sku, items_count: d.items_count, total_cents: d.total_cents } }));
      } else {
        console.error('[bleu/prod] addToPlan failed', d);
      }
    }).catch(function(e){ console.error('[bleu/prod] addToPlan error', e); });
  };

  // Engagement chips ("Tell me more", "Compare options") post as a new turn.
  window.sendFollowupToAlvai = function(text){
    if (text && typeof window.sendPrompt === 'function') window.sendPrompt(text);
  };

  // -------------------------------------------------------------------
  // YOUR CART drawer + Checkout routing (Mission 2.7)
  // Built in JS (createElement) rather than static index.html markup —
  // same IDs the badge already targets, works wherever the hooks load.
  // -------------------------------------------------------------------
  function ensureCartStyle(){
    if (document.getElementById('bleu-cart-style')) return;
    var s = document.createElement('style'); s.id = 'bleu-cart-style';
    s.textContent =
      '#bleu-your-plan-badge{position:fixed;top:20px;right:20px;z-index:10000;display:flex;align-items:center;gap:7px;background:#1F4E79;color:#f4efe6;border:none;border-radius:22px;height:44px;padding:0 17px;cursor:pointer;font:600 14px Inter,-apple-system,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.15)}'
    + '#bleu-your-plan-badge[hidden]{display:none}'
    + '#bleu-your-plan-count{min-width:18px;text-align:center;background:rgba(255,255,255,.18);border-radius:10px;padding:0 6px}'
    + '.bleu-cart-drawer{position:fixed;top:0;right:0;bottom:0;width:420px;max-width:100vw;background:#fbfaf7;border-left:1px solid rgba(75,30,130,.12);transform:translateX(100%);transition:transform 240ms ease;z-index:10001;color:#181714;display:flex;flex-direction:column;font:14px/1.5 Inter,-apple-system,sans-serif}'
    + '.bleu-cart-drawer[aria-hidden="false"]{transform:translateX(0)}'
    + '.bleu-cart__header{padding:18px 22px;border-bottom:1px solid rgba(75,30,130,.10);display:flex;justify-content:space-between;align-items:center}'
    + '.bleu-cart__header h2{margin:0;font:600 17px Inter,sans-serif}'
    + '.bleu-cart__close{background:none;border:none;font-size:20px;cursor:pointer;color:#807a6f;line-height:1}'
    + '.bleu-cart__items{flex:1;overflow-y:auto;padding:14px 22px;list-style:none;margin:0}'
    + '.bleu-cart__items li{padding:12px 0;border-bottom:1px solid rgba(75,30,130,.06);display:flex;justify-content:space-between;align-items:flex-start;gap:10px}'
    + '.bleu-cart__rm{background:none;border:none;color:#b5651d;cursor:pointer;font-size:12px;flex:none}'
    + '.bleu-cart__footer{padding:18px 22px;border-top:1px solid rgba(75,30,130,.10)}'
    + '.bleu-cart__total{font-size:14px;opacity:.75;margin-bottom:12px}'
    + '.bleu-cart__checkout{width:100%;padding:13px;background:#C9A84C;color:#0a0a0c;border:none;border-radius:8px;font:600 15px Inter,sans-serif;cursor:pointer}'
    + '.bleu-cart__checkout:disabled{opacity:.5;cursor:default}'
    + '.bleu-cart__disclosure{margin-top:10px;font-size:11px;opacity:.7;line-height:1.4}'
    + '@media(max-width:480px){.bleu-cart-drawer{width:100vw}}';
    document.head.appendChild(s);
  }

  function ensureCartDrawer(){
    if (document.getElementById('bleu-your-plan-drawer')) return;
    ensureCartStyle();

    var badge = document.createElement('button');
    badge.id = 'bleu-your-plan-badge';
    badge.setAttribute('aria-label', 'Open Your Cart');
    badge.hidden = true;
    var bl = document.createElement('span'); bl.textContent = 'Cart'; badge.appendChild(bl);
    var cnt = document.createElement('span'); cnt.id = 'bleu-your-plan-count'; cnt.textContent = '0'; badge.appendChild(cnt);
    badge.addEventListener('click', openYourCartDrawer);
    document.body.appendChild(badge);

    var drawer = document.createElement('aside');
    drawer.id = 'bleu-your-plan-drawer'; drawer.className = 'bleu-cart-drawer'; drawer.setAttribute('aria-hidden', 'true');
    var hdr = document.createElement('div'); hdr.className = 'bleu-cart__header';
    var h2 = document.createElement('h2'); h2.textContent = 'Your Cart'; hdr.appendChild(h2);
    var close = document.createElement('button'); close.id = 'bleu-your-plan-close'; close.className = 'bleu-cart__close'; close.setAttribute('aria-label', 'Close'); close.textContent = '✕';
    close.addEventListener('click', closeYourCartDrawer); hdr.appendChild(close);
    drawer.appendChild(hdr);
    var ul = document.createElement('ul'); ul.id = 'bleu-your-plan-items'; ul.className = 'bleu-cart__items'; drawer.appendChild(ul);
    var ftr = document.createElement('div'); ftr.className = 'bleu-cart__footer';
    var tot = document.createElement('div'); tot.id = 'bleu-your-plan-total'; tot.className = 'bleu-cart__total'; ftr.appendChild(tot);
    var co = document.createElement('button'); co.id = 'bleu-your-plan-continue'; co.className = 'bleu-cart__checkout'; co.textContent = 'Checkout';
    co.addEventListener('click', continueCheckout); ftr.appendChild(co);
    var disc = document.createElement('p'); disc.id = 'bleu-your-plan-disclosure'; disc.className = 'bleu-cart__disclosure'; ftr.appendChild(disc);
    drawer.appendChild(ftr);
    document.body.appendChild(drawer);
  }

  function setCartCount(n){
    ensureCartDrawer();
    var cnt = document.getElementById('bleu-your-plan-count');
    var badge = document.getElementById('bleu-your-plan-badge');
    if (cnt) cnt.textContent = String(n);
    if (badge) badge.hidden = !(n > 0);
  }
  window.setCartCount = setCartCount;

  function openYourCartDrawer(){
    ensureCartDrawer();
    fetch('/api/plan/get?session_id=' + encodeURIComponent(getSessionId()))
      .then(function(r){ return r.json(); })
      .then(function(d){
        var plan = d && d.plan;
        var ul = document.getElementById('bleu-your-plan-items');
        var tot = document.getElementById('bleu-your-plan-total');
        var disc = document.getElementById('bleu-your-plan-disclosure');
        var co = document.getElementById('bleu-your-plan-continue');
        ul.textContent = '';
        if (!plan || !plan.items || !plan.items.length) {
          var empty = document.createElement('li'); empty.style.opacity = '.55'; empty.textContent = 'Your cart is empty.'; ul.appendChild(empty);
          tot.textContent = ''; disc.textContent = ''; if (co) co.disabled = true;
          setCartCount(0);
        } else {
          if (co) co.disabled = false;
          plan.items.forEach(function(item){
            var li = document.createElement('li');
            var left = document.createElement('div');
            var nm = document.createElement('div'); nm.textContent = item.name || item.sku; left.appendChild(nm);
            if (item.monthly && item.price_cents) {
              var pr = document.createElement('div'); pr.style.cssText = 'font-size:12px;opacity:.6'; pr.textContent = '$' + (item.price_cents / 100).toFixed(2) + '/mo'; left.appendChild(pr);
            }
            li.appendChild(left);
            var rm = document.createElement('button'); rm.className = 'bleu-cart__rm'; rm.textContent = 'Remove';
            (function(sku){ rm.addEventListener('click', function(){ removeFromCart(sku); }); })(item.sku);
            li.appendChild(rm);
            ul.appendChild(li);
          });
          tot.textContent = plan.total_cents > 0 ? ('Total: $' + (plan.total_cents / 100).toFixed(2) + '/mo') : '';
          var hasC = plan.items.some(function(i){ return i.rail === 'C'; });
          disc.textContent = hasC ? 'Items marked for Amazon will open on Amazon. BLEU earns a small commission on Amazon purchases (tag bleulive20-20).' : '';
          setCartCount(plan.items.length);
        }
        document.getElementById('bleu-your-plan-drawer').setAttribute('aria-hidden', 'false');
      })
      .catch(function(e){ console.error('[bleu/prod] open cart error', e); });
  }
  window.openYourCartDrawer = openYourCartDrawer;

  function closeYourCartDrawer(){
    var d = document.getElementById('bleu-your-plan-drawer'); if (d) d.setAttribute('aria-hidden', 'true');
  }

  function removeFromCart(sku){
    fetch('/api/plan/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: getSessionId(), sku: sku }) })
      .then(function(r){ return r.json(); })
      .then(function(d){ if (d && d.ok) { setCartCount(d.items_count); openYourCartDrawer(); } })
      .catch(function(e){ console.error('[bleu/prod] remove error', e); });
  }

  function continueCheckout(){
    fetch('/api/plan/continue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: getSessionId() }) })
      .then(function(r){ return r.json().then(function(d){ return { status: r.status, d: d }; }); })
      .then(function(res){
        if (res.status === 503) { alert('Checkout is paused right now. Please try again shortly.'); return; }
        var d = res.d;
        if (!d || !d.ok) { alert('Checkout failed: ' + ((d && d.error) || 'unknown')); return; }
        var hasA = d.rail_a_items && d.rail_a_items.length > 0;
        var hasC = d.rail_c_items && d.rail_c_items.length > 0;
        if (hasA && hasC) {
          var first = confirm('Your cart has BLEU plans AND Amazon items. Start with your BLEU plan first?');
          if (first) continueRailA(d.rail_a_items); else continueRailC(d.rail_c_items);
          return;
        }
        if (hasA) { continueRailA(d.rail_a_items); return; }
        if (hasC) { continueRailC(d.rail_c_items); return; }
        alert('Nothing to check out.');
      })
      .catch(function(e){ console.error('[bleu/prod] checkout error', e); alert('Checkout error. Try again.'); });
  }

  // Rail A — BLEU-owned plan → Stripe. (Multi-item Rail A uses the first item's
  // price for now; Stripe multi-line cart is a future enhancement.)
  function continueRailA(items){
    var item = items[0];
    fetch('/api/stripe/create-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ price_id: item.stripe_price_id, key: item.sku }) })
      .then(function(r){ return r.json().then(function(d){ return { status: r.status, d: d }; }); })
      .then(function(res){
        if (res.status === 503) { alert('Checkout is paused right now. Please try again shortly.'); return; }
        if (res.d && res.d.url) { window.location.href = res.d.url; } else { alert('Checkout setup failed.'); }
      })
      .catch(function(e){ console.error('[bleu/prod] stripe error', e); });
  }

  // Rail C — Amazon affiliate. Disclosure required BEFORE opening.
  function continueRailC(items){
    var ok = confirm('These items will open on Amazon. BLEU earns a small commission on Amazon purchases (tag bleulive20-20). Continue?');
    if (!ok) return;
    items.forEach(function(item){ if (item.amazon_url) window.open(item.amazon_url, '_blank', 'noopener'); });
  }

  // -------------------------------------------------------------------
  // sendPrompt — streams /api/chat via SSE into the panel, token by token
  // -------------------------------------------------------------------
  window.sendPrompt = function(text){
    if (!text) return;
    var mode = detectMode();
    var payload = { message: text, mode: mode, session_id: getSessionId(), timestamp: new Date().toISOString() };

    // Backwards compatibility: if a sea or shell defines window.alvaiPanel, hand off.
    if (typeof window.alvaiPanel === 'object' && typeof window.alvaiPanel.send === 'function') {
      window.alvaiPanel.open();
      window.alvaiPanel.send(text, mode);
      return;
    }

    ensurePanel(); openPanel();
    addUserBubble(text);
    var asstSlot = createAssistantSlot();
    var asst = asstSlot.slot, dots = asstSlot.dots;

    var full = '';
    fetch(CONFIG.alvaiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    }).then(function(r){
      if (!r.ok || !r.body) {
        return r.text().then(function(t){ throw new Error('HTTP ' + r.status + ': ' + (t || 'no body')); });
      }
      var reader = r.body.getReader();
      var decoder = new TextDecoder('utf-8');
      var buffer = '';
      var firstToken = true;

      function pump(){
        return reader.read().then(function(chunk){
          if (chunk.done) {
            if (asst.contains(dots)) asst.removeChild(dots);
            window.dispatchEvent(new CustomEvent('bleu:alvai-response', { detail: { input: text, response: { text: full }, mode: mode } }));
            return;
          }
          buffer += decoder.decode(chunk.value, { stream: true });
          var lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (var i = 0; i < lines.length; i++) {
            var ln = lines[i];
            if (ln.indexOf('data: ') !== 0) continue;
            var data = ln.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              var j = JSON.parse(data);
              if (j.suppressCommerce) {
                window.dispatchEvent(new CustomEvent('bleu:alvai-suppress-commerce', { detail: { mode: mode } }));
                continue;
              }
              if (j.cards && Array.isArray(j.cards) && j.cards.length > 0) {
                if (firstToken && asst.contains(dots)) { asst.removeChild(dots); firstToken = false; }
                try { renderCardsBelowMessage(j.cards); } catch (e) { console.error('[CARDS_RENDER_FAIL]', e); }
                continue;
              }
              if (typeof j.text === 'string' && j.text) {
                if (firstToken) { if (asst.contains(dots)) asst.removeChild(dots); firstToken = false; }
                // Only auto-scroll if the user is already pinned to the bottom.
                // If they scrolled up to re-read the start of the response, leave them there.
                var atBottom = (_body.scrollHeight - _body.scrollTop - _body.clientHeight) <= 40;
                full += j.text;
                asst.appendChild(document.createTextNode(j.text));
                if (atBottom) _body.scrollTop = _body.scrollHeight;
                window.dispatchEvent(new CustomEvent('bleu:alvai-token', { detail: { token: j.text, full: full, mode: mode } }));
              }
            } catch (e) { /* skip malformed line */ }
          }
          return pump();
        });
      }
      return pump();
    }).catch(function(err){
      console.error('[bleu/prod] alvai error:', err);
      if (asst.contains(dots)) asst.removeChild(dots);
      if (!full) {
        if (asst.parentNode) asst.parentNode.removeChild(asst);
        addErrorText('Alvai got quiet. Try again, or tell me a different way.');
      }
      window.dispatchEvent(new CustomEvent('bleu:alvai-error', { detail: { input: text, error: (err && err.message) ? err.message : String(err) } }));
    });
  };

  // -------------------------------------------------------------------
  // ROUTING — internal SPA navigation
  // -------------------------------------------------------------------
  window.routeTo = function(path){
    if (!path) return;
    var resolved = CONFIG.routes[path] || path;
    // If app shell has a router, use it. Otherwise hard nav.
    if (typeof window.appRouter === 'object' && typeof window.appRouter.push === 'function') {
      window.appRouter.push(resolved);
    } else {
      window.location.href = resolved;
    }
  };

  // -------------------------------------------------------------------
  // STRIPE — protocol bundle checkouts
  // -------------------------------------------------------------------
  window.startStripeCheckout = function(key){
    var priceId = CONFIG.stripePrices[key];
    if (!priceId) {
      console.error('[bleu/prod] unknown stripe key:', key);
      window.sendPrompt('Help me start the ' + key + ' protocol — the stripe checkout did not find that key.');
      return;
    }
    // Server-side checkout session creation (preferred, avoids client price ID exposure issues).
    fetch('/api/stripe/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price_id: priceId, key: key }),
      credentials: 'include'
    }).then(function(r){ return r.json(); }).then(function(data){
      if (data && data.url) {
        window.location.href = data.url;
      } else if (data && data.sessionId && window.Stripe) {
        if (!CONFIG.stripePublicKey) {
          console.error('[bleu/prod] stripe public key not injected. Set window.__BLEU_STRIPE_PK__ from server, or have /api/stripe/create-session return {url} instead of {sessionId}.');
          window.sendPrompt('I want to start the ' + key + ' protocol — checkout is not configured. Help me get on the list.');
          return;
        }
        var stripe = window.Stripe(CONFIG.stripePublicKey);
        stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else {
        console.error('[bleu/prod] stripe session error:', data);
      }
    }).catch(function(err){
      console.error('[bleu/prod] stripe error:', err);
      window.sendPrompt('I want to start the ' + key + ' protocol — the checkout had an error.');
    });
  };

  // -------------------------------------------------------------------
  // AUTH — Google, Apple, email (magic-link)
  // -------------------------------------------------------------------
  // Mission 7.5: passwordless magic-link is wired but INERT until AUTH_LIVE is
  // flipped (after manual end-to-end smoke). Until then 'email' keeps its prior
  // behavior. This is the canonical magic-link UI + verify handler — the old
  // index.html inline copy was removed so only ONE verify-on-load runs (a second
  // POST would 401 after the token is consumed).
  var AUTH_LIVE = true;    // magic-link live (flipped Day-80 after smoke 25/25)

  window.authProvider = function(provider){
    if (provider === 'google')   { window.location.href = '/auth/google'; return; }
    if (provider === 'apple')    { window.location.href = '/auth/apple'; return; }
    if (provider === 'email')    {
      if (AUTH_LIVE) { window.requestMagicLink(); return; }
      window.location.href = '/auth/email'; return;
    }
    console.warn('[bleu/prod] unknown auth provider:', provider);
  };

  // Opens a minimal sign-in modal → POST /api/auth/magic-link. No enumeration:
  // identical confirmation regardless of whether the email is registered.
  window.requestMagicLink = function(){
    if (document.getElementById('bleu-signin-overlay')) return;
    var ov = document.createElement('div');
    ov.id = 'bleu-signin-overlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;';
    ov.innerHTML =
      '<div style="background:#fff;color:#1a1a1a;max-width:360px;width:90%;padding:24px;border-radius:14px;font:15px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;">'
      + '<h3 style="margin:0 0 8px;font-size:18px;">Sign in to BLEU</h3>'
      + '<p style="margin:0 0 16px;color:#555;font-size:14px;">We’ll email you a secure sign-in link.</p>'
      + '<input id="bleu-signin-email" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" style="width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #ccc;border-radius:8px;font-size:15px;margin-bottom:12px;">'
      + '<button id="bleu-signin-send" style="width:100%;padding:11px;border:0;border-radius:8px;background:#C9A84C;color:#1a1a1a;font-weight:600;font-size:15px;cursor:pointer;">Email me a sign-in link</button>'
      + '<button id="bleu-signin-close" style="width:100%;padding:8px;margin-top:8px;border:0;background:none;color:#888;font-size:13px;cursor:pointer;">Cancel</button>'
      + '<p id="bleu-signin-msg" style="margin:12px 0 0;font-size:13px;color:#2D8A7A;display:none;"></p></div>';
    document.body.appendChild(ov);
    var close = function(){ ov.remove(); };
    ov.addEventListener('click', function(e){ if (e.target === ov) close(); });
    document.getElementById('bleu-signin-close').addEventListener('click', close);
    document.getElementById('bleu-signin-send').addEventListener('click', function(){
      var email = (document.getElementById('bleu-signin-email').value || '').trim();
      var msg = document.getElementById('bleu-signin-msg');
      fetch('/api/auth/magic-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email }) })
        .finally(function(){ msg.style.display = 'block'; msg.textContent = 'If that email exists in our system, a sign-in link is on the way.'; });
    });
  };

  // Verify-on-load: ?verify=<token> → POST /api/auth/verify. Token never logged.
  window.addEventListener('load', function(){
    if (!AUTH_LIVE) return;
    var token = new URLSearchParams(window.location.search).get('verify');
    if (!token) return;
    fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token }) })
      .then(function(r){
        history.replaceState({}, document.title, location.pathname);
        if (r.status === 200) { location.assign('/?signed_in=1'); }
        else { console.warn('[bleu/prod] sign-in link expired or already used'); }
      }).catch(function(){});
  });

  // -------------------------------------------------------------------
  // CITY — Local sea passport context
  // -------------------------------------------------------------------
  window.setUserCity = function(city, state){
    try {
      localStorage.setItem('bleu:city', city || '');
      localStorage.setItem('bleu:state', state || '');
    } catch (e) { /* private mode */ }
    window.dispatchEvent(new CustomEvent('bleu:city-changed', { detail: { city: city, state: state } }));
  };
  window.getUserCity = function(){
    try {
      return { city: localStorage.getItem('bleu:city') || null, state: localStorage.getItem('bleu:state') || null };
    } catch (e) { return { city: null, state: null }; }
  };
  window.lookupNearby = function(category, city){
    // Wires to wellness_businesses + wellness_events Supabase tables.
    return fetch('/api/local/nearby?cat=' + encodeURIComponent(category) + '&city=' + encodeURIComponent(city || ''), {
      credentials: 'include'
    }).then(function(r){ return r.json(); });
  };

  // -------------------------------------------------------------------
  // UNIFICATION SAFETY NET — final dead-surface watchdog
  // -------------------------------------------------------------------
  // Build the cart drawer and restore the badge count for returning sessions.
  window.addEventListener('load', function(){
    try {
      ensureCartDrawer();
      fetch('/api/plan/get?session_id=' + encodeURIComponent(getSessionId()))
        .then(function(r){ return r.json(); })
        .then(function(d){ if (d && d.plan && d.plan.items) setCartCount(d.plan.items.length); })
        .catch(function(){});
    } catch (e) { console.error('[bleu/prod] cart init', e); }
  });

  window.addEventListener('load', function(){
    setTimeout(function(){
      var dead = [];
      var allowedAttrs = ['data-prompt','data-route','data-stripe','data-city','data-audience','data-mode','data-step','data-terp','data-system'];
      var allowedIds = ['signin','create-top','alvai-go','alvai-bar-go','bud-bar-go','floater-close','check-go','r-deeper','r-cite','check-ask','terps-ask-bud','city-change','city-modal-close','passport-yes','auth-google','auth-apple','modal-submit','slider','bleu-your-plan-badge','bleu-your-plan-close','bleu-your-plan-continue'];
      document.querySelectorAll('button, [role="button"]').forEach(function(node){
        for (var i = 0; i < allowedAttrs.length; i++) if (node.hasAttribute(allowedAttrs[i])) return;
        if (node.id && allowedIds.indexOf(node.id) >= 0) return;
        if (node.classList.contains('bh-numeral') && node.classList.contains('active')) return;
        if (node.classList.contains('bh-sea') && node.classList.contains('current')) return;
        if (node.getAttribute('aria-current') === 'page') return;
        dead.push(node);
      });
      if (dead.length) {
        console.warn('[bleu/prod] dead surfaces:', dead.length, 'elements ship without a wired handler. Alvai is the unifier — every button must work.');
        console.warn(dead);
      } else {
        console.log('[bleu/prod] ✓ all interactive surfaces wired. Alvai unifier confirmed.');
      }
    }, 1500);
  });

  // -------------------------------------------------------------------
  // MARK PRODUCTION READY
  // -------------------------------------------------------------------
  window.bleuProdHooks = { version: '1.0.0', date: '2026-05-09', mode: detectMode() };
  console.log('[bleu/prod] hooks loaded · tab =', detectMode());
})();
