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
  // CONFIG — edit once, applies to all seven seas
  // -------------------------------------------------------------------
  var CONFIG = {
    alvaiEndpoint:   '/api/chat',           // ALVAI backend (Supabase edge fn)
    budMode:         'ecsiq',               // mode flag for /ecsiq sea
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
      '/ecsiq':     '/ecsiq',
      '/why':       '/why',
      '/held':      '/held',
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
  // ALVAI + BUD — primary unifier
  // -------------------------------------------------------------------
  // Detect which sea we're on — the URL path tells us mode.
  function detectMode(){
    var p = window.location.pathname || '/';
    if (p.indexOf('/ecsiq') !== -1) return 'ecsiq';   // Bud
    if (p.indexOf('/support') !== -1) return 'therapy';
    if (p.indexOf('/supply') !== -1) return 'supply';
    if (p.indexOf('/learn') !== -1) return 'learn';
    if (p.indexOf('/local') !== -1) return 'local';
    if (p.indexOf('/why') !== -1) return 'why';
    return 'general';
  }

  window.sendPrompt = function(text){
    if (!text) return;
    var mode = detectMode();
    var payload = {
      message: text,
      mode: mode,
      timestamp: new Date().toISOString(),
      sea: mode
    };

    // Open ALVAI/Bud panel + post the message.
    // The actual chat panel UI lives in the main app shell (window.alvaiPanel).
    if (typeof window.alvaiPanel === 'object' && typeof window.alvaiPanel.send === 'function') {
      window.alvaiPanel.open();
      window.alvaiPanel.send(text, mode);
      return;
    }

    // Fallback: post to the API directly and dispatch a custom event the shell can listen for.
    fetch(CONFIG.alvaiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    }).then(function(r){ return r.json(); }).then(function(data){
      window.dispatchEvent(new CustomEvent('bleu:alvai-response', { detail: { input: text, response: data, mode: mode } }));
    }).catch(function(err){
      console.error('[bleu/prod] alvai error:', err);
      window.dispatchEvent(new CustomEvent('bleu:alvai-error', { detail: { input: text, error: err } }));
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
  console.log('[bleu/prod] hooks loaded · sea =', detectMode());
})();
