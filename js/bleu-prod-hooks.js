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
  // sendPrompt — streams /api/chat via SSE into the panel, token by token
  // -------------------------------------------------------------------
  window.sendPrompt = function(text){
    if (!text) return;
    var mode = detectMode();
    var payload = { message: text, mode: mode, timestamp: new Date().toISOString() };

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
              if (typeof j.text === 'string' && j.text) {
                if (firstToken) { if (asst.contains(dots)) asst.removeChild(dots); firstToken = false; }
                full += j.text;
                asst.appendChild(document.createTextNode(j.text));
                _body.scrollTop = _body.scrollHeight;
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
  // AUTH — Google, Apple, email
  // -------------------------------------------------------------------
  window.authProvider = function(provider){
    if (provider === 'google')   { window.location.href = '/auth/google'; return; }
    if (provider === 'apple')    { window.location.href = '/auth/apple'; return; }
    if (provider === 'email')    { window.location.href = '/auth/email'; return; }
    console.warn('[bleu/prod] unknown auth provider:', provider);
  };

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
  window.addEventListener('load', function(){
    setTimeout(function(){
      var dead = [];
      var allowedAttrs = ['data-prompt','data-route','data-stripe','data-city','data-audience','data-mode','data-step','data-terp','data-system'];
      var allowedIds = ['signin','create-top','alvai-go','alvai-bar-go','bud-bar-go','floater-close','check-go','r-deeper','r-cite','check-ask','terps-ask-bud','city-change','city-modal-close','passport-yes','auth-google','auth-apple','modal-submit','slider'];
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
