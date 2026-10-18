/* Harpreet Raj Singh Games — shared runtime (settings, emoji, a11y, sound, haptics, saves, native bridge).
   © 2026 Harpreet Raj Singh. No data leaves the device. */
(function () {
'use strict';
const SCRIPT = document.currentScript;
const ROOT = new URL(SCRIPT && SCRIPT.src ? '../' : './', SCRIPT && SCRIPT.src ? SCRIPT.src : location.href); // www/ root (or page dir in single-file builds)
const SETTINGS_KEY = 'hrs_settings_v1';
const DEFAULTS = { sound: false, vibration: true, reduceMotion: null, textSize: 'normal', emoji: true };
const mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

/* ---------- storage ---------- */
const store = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} },
};
function settings() { return Object.assign({}, DEFAULTS, store.get(SETTINGS_KEY, {})); }
function setSetting(k, v) { const s = settings(); s[k] = v; store.set(SETTINGS_KEY, s); apply(); return s; }
function reduceMotion() { const s = settings(); return s.reduceMotion == null ? mq.matches : !!s.reduceMotion; }
const SCALE = { normal: 1, large: 1.15, xlarge: 1.3 };
function apply() {
  const s = settings(), h = document.documentElement;
  h.toggleAttribute('data-reduce-motion', reduceMotion());
  h.dataset.textSize = s.textSize;
  h.style.setProperty('--hrs-scale', SCALE[s.textSize] || 1);
}

/* ---------- sound (WebAudio, generated, no assets) ---------- */
let actx = null;
function ctx() { if (!actx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; actx = new C(); } if (actx.state === 'suspended') actx.resume(); return actx; }
function tone(c, t0, f, dur, type = 'sine', vol = 0.12, f2) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.02);
}
const SFX = {
  tap: (c, t) => tone(c, t, 660, 0.05, 'triangle', 0.06),
  select: (c, t) => { tone(c, t, 520, 0.06, 'triangle', 0.07); tone(c, t + 0.05, 780, 0.07, 'triangle', 0.06); },
  good: (c, t) => { tone(c, t, 523, 0.12, 'sine', 0.1); tone(c, t + 0.09, 659, 0.12, 'sine', 0.1); tone(c, t + 0.18, 784, 0.18, 'sine', 0.1); },
  bad: (c, t) => { tone(c, t, 330, 0.18, 'sawtooth', 0.05, 220); tone(c, t + 0.15, 247, 0.22, 'sawtooth', 0.045, 160); },
  event: (c, t) => { tone(c, t, 440, 0.1, 'square', 0.04); tone(c, t + 0.12, 440, 0.1, 'square', 0.04); tone(c, t + 0.24, 587, 0.16, 'square', 0.04); },
  whoosh: (c, t) => tone(c, t, 200, 0.35, 'sine', 0.08, 900),
  milestone: (c, t) => { [523, 659, 784, 1047].forEach((f, i) => tone(c, t + i * 0.08, f, 0.22, 'triangle', 0.09)); },
  end: (c, t) => { [392, 523, 659, 784, 1047].forEach((f, i) => tone(c, t + i * 0.12, f, 0.35, 'sine', 0.09)); },
};
function sfx(name) {
  if (!settings().sound || !SFX[name]) return;
  try { const c = ctx(); if (c) SFX[name](c, c.currentTime + 0.01); } catch (e) {}
}

/* ---------- native bridge (Capacitor) ---------- */
const Cap = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() ? window.Capacitor : null;
const reg = name => { try { return Cap ? (window.capacitorExports ? capacitorExports.registerPlugin(name) : Cap.Plugins[name]) : null; } catch (e) { return null; } };
const NativeApp = reg('App'), NativeBrowser = reg('Browser'), NativeHaptics = reg('Haptics');
/* platform: iOS Safari has no Vibration API and installs via Share → Add to Home Screen */
const UA = navigator.userAgent || '';
const isIOS = /iPad|iPhone|iPod/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);
const isStandalone = navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
const isIOSSafari = isIOS && /Safari\//.test(UA) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|FBAN|FBAV|Instagram|Line\//.test(UA);
const canVibrate = () => !!NativeHaptics || (typeof navigator.vibrate === 'function' && !isIOS);
function buzz(kind = 'light') {
  if (!settings().vibration || !canVibrate()) return;
  if (!NativeHaptics && navigator.userActivation && !navigator.userActivation.hasBeenActive) return; // web: only after a user gesture
  try {
    if (NativeHaptics) { if (kind === 'success' || kind === 'warning' || kind === 'error') NativeHaptics.notification({ type: kind.toUpperCase() }); else NativeHaptics.impact({ style: kind === 'heavy' ? 'HEAVY' : kind === 'medium' ? 'MEDIUM' : 'LIGHT' }); return; }
    if (typeof navigator.vibrate === 'function') navigator.vibrate({ light: 10, medium: 20, heavy: 40, success: [15, 40, 15], warning: [30, 60, 30], error: [60, 40, 60] }[kind] || 10);
  } catch (e) {}
}
function openExternal(url) {
  if (NativeBrowser) { NativeBrowser.open({ url }); return; }
  window.open(url, '_blank', 'noopener');
}
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
  const href = a.getAttribute('href'); if (!/^https?:/i.test(href)) return;
  try { if (new URL(href).origin === location.origin) return; } catch (err) { return; }
  e.preventDefault(); openExternal(href);
}, true);

/* back button: handler stack; a handler returns true if it consumed the event */
const backStack = [];
function onBack(fn) { backStack.push(fn); return () => { const i = backStack.indexOf(fn); if (i >= 0) backStack.splice(i, 1); }; }
function handleBack() {
  for (let i = backStack.length - 1; i >= 0; i--) { try { if (backStack[i]()) return true; } catch (e) {} }
  return false;
}
if (NativeApp) {
  NativeApp.addListener('backButton', () => {
    if (handleBack()) return;
    if (/\/games\//.test(location.pathname)) { location.href = new URL('index.html', ROOT).href; return; }
    NativeApp.exitApp();
  });
}
function home() { location.href = new URL('index.html', ROOT).href; }

/* ---------- emoji (bundled Twemoji SVGs, CC-BY 4.0) ---------- */
const EMOJI_OPTS = { base: ROOT.href + 'assets/', folder: 'emoji', ext: '.svg', className: 'emoji' };
let emojiQueued = new Set(), emojiRaf = 0;
function parseEmoji(node) {
  if (!window.twemoji || !settings().emoji || !node) return;
  try { twemoji.parse(node, EMOJI_OPTS); } catch (e) {}
}
function startEmoji() {
  if (!window.twemoji || !settings().emoji) return;
  parseEmoji(document.body);
  new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type === 'characterData') { if (m.target.parentNode) emojiQueued.add(m.target.parentNode); }
      else m.addedNodes.forEach(n => { if (n.nodeType === 1 && n.tagName !== 'IMG') emojiQueued.add(n); else if (n.nodeType === 3 && n.parentNode) emojiQueued.add(n.parentNode); });
    }
    if (emojiQueued.size && !emojiRaf) emojiRaf = requestAnimationFrame(() => { emojiRaf = 0; const q = [...emojiQueued]; emojiQueued.clear(); q.forEach(n => n.isConnected && parseEmoji(n)); });
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
}

/* ---------- accessibility helpers ---------- */
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
/* make non-button clickables keyboard reachable (role=button, Enter/Space) */
function clickables(selector, labelFn) {
  const fix = root => (root.querySelectorAll ? root.querySelectorAll(selector) : []).forEach(el => {
    if (el.tagName === 'BUTTON' || el.tagName === 'A') return;
    if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
    if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
    if (labelFn && !el.hasAttribute('aria-label')) { const l = labelFn(el); if (l) el.setAttribute('aria-label', l); }
  });
  fix(document);
  new MutationObserver(() => fix(document)).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches(selector) && e.target.tagName !== 'BUTTON') { e.preventDefault(); e.stopPropagation(); e.target.click(); }
  }, true);
}
/* tap/keyboard popover for title= hints (hover-only tooltips don't exist on touch) */
let pop = null;
function hidePopover() { if (pop) { pop.remove(); pop = null; } }
function showPopover(el, text) {
  hidePopover(); pop = document.createElement('div'); pop.className = 'hrs-pop'; pop.setAttribute('role', 'tooltip'); pop.textContent = text;
  document.body.appendChild(pop); parseEmoji(pop);
  const r = el.getBoundingClientRect(), w = Math.min(300, innerWidth - 16); pop.style.maxWidth = w + 'px';
  const x = Math.max(8, Math.min(innerWidth - pop.offsetWidth - 8, r.left + r.width / 2 - pop.offsetWidth / 2));
  let y = r.bottom + 8; if (y + pop.offsetHeight > innerHeight - 8) y = Math.max(8, r.top - pop.offsetHeight - 8);
  pop.style.left = x + 'px'; pop.style.top = y + 'px';
}
function titlePopovers(scopeSel) {
  const prep = () => document.querySelectorAll(`${scopeSel} [title]:not(button):not(a):not(svg):not([data-hrs-tip])`).forEach(el => {
    el.dataset.hrsTip = el.getAttribute('title'); el.removeAttribute('title');
    if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
    el.setAttribute('aria-label', (el.getAttribute('aria-label') || el.textContent.trim().slice(0, 60)) + '. ' + el.dataset.hrsTip);
    el.classList.add('hrs-has-tip');
  });
  prep(); new MutationObserver(prep).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', e => {
    if (pop && pop.contains(e.target)) return;
    const el = e.target.closest && e.target.closest('[data-hrs-tip]');
    if (el && !e.target.closest('button,a')) { if (pop && pop._for === el) { hidePopover(); return; } showPopover(el, el.dataset.hrsTip); pop._for = el; return; }
    hidePopover();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && pop) { hidePopover(); e.stopPropagation(); return; }
    const el = e.target.closest && e.target.closest('[data-hrs-tip]');
    if (el && e.target === el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); showPopover(el, el.dataset.hrsTip); pop._for = el; }
  }, true);
  window.addEventListener('scroll', hidePopover, { passive: true });
}
/* dialog semantics, focus management, focus trap, Esc. isDismissible() decides if Esc/back may close. */
function dialog({ overlay, box, isOpen, isDismissible, close }) {
  overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true');
  let prev = null, wasOpen = false;
  const sync = () => {
    const open = isOpen();
    if (open) {
      const h = box.querySelector('h2,h1'); if (h) { if (!h.id) h.id = 'hrs-dlg-title'; overlay.setAttribute('aria-labelledby', h.id); }
      if (!wasOpen) prev = document.activeElement;
      if (!box.contains(document.activeElement)) { const f = box.querySelector('[autofocus]') || box.querySelector(FOCUSABLE); (f || box).focus({ preventScroll: true }); if (!f) box.tabIndex = -1; }
    } else if (wasOpen && prev && prev.isConnected) { try { prev.focus({ preventScroll: true }); } catch (e) {} }
    wasOpen = open;
  };
  new MutationObserver(() => requestAnimationFrame(sync)).observe(overlay, { attributes: true, attributeFilter: ['class', 'style'], childList: true, subtree: true });
  document.addEventListener('keydown', e => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { if (isDismissible()) { e.preventDefault(); close(); } return; }
    if (e.key === 'Tab') {
      const f = [...box.querySelectorAll(FOCUSABLE)].filter(x => x.offsetParent !== null); if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  onBack(() => { if (!isOpen()) return false; if (isDismissible()) { close(); return true; } return true; /* swallow: must choose */ });
}
/* simple toast-free live region for screen readers */
let live = null;
function announce(msg) { if (!live) { live = document.createElement('div'); live.className = 'hrs-sr'; live.setAttribute('aria-live', 'polite'); document.body.appendChild(live); } live.textContent = ''; setTimeout(() => live.textContent = msg, 30); }

/* ---------- guided tour (coach marks) ---------- */
function tour(steps, { onDone, label = 'Tutorial' } = {}) {
  let i = 0;
  const ov = document.createElement('div'); ov.className = 'hrs-tour'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', label);
  ov.innerHTML = '<div class="hrs-tour-hole"></div><div class="hrs-tour-box" tabindex="-1"></div>';
  document.body.appendChild(ov);
  const hole = ov.firstChild, box = ov.lastChild;
  const offBack = onBack(() => { finish(); return true; });
  let raf = 0; const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; place(); }); };
  function finish() { ov.remove(); offBack(); document.removeEventListener('keydown', key, true); window.removeEventListener('resize', place); window.removeEventListener('scroll', onScroll); onDone && onDone(); }
  function key(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(); }
    else if (e.key === 'Tab') { const f = [...box.querySelectorAll('button')]; const a = f.indexOf(document.activeElement); e.preventDefault(); f[(a + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
    else e.stopPropagation();
  }
  document.addEventListener('keydown', key, true);
  function place() {
    const s = steps[i]; const el = s.el ? (typeof s.el === 'string' ? document.querySelector(s.el) : s.el) : null;
    const vis = el && el.getBoundingClientRect().width > 0;
    if (vis) {
      const r = el.getBoundingClientRect(), pad = 6;
      hole.style.cssText = `display:block;left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px`;
      const bh = box.offsetHeight, below = r.bottom + 14 + bh < innerHeight;
      box.style.top = (below ? Math.min(innerHeight - bh - 8, r.bottom + 14) : Math.max(8, r.top - bh - 14)) + 'px';
      if (!below && r.top - bh - 14 < 8) box.style.top = Math.max(8, innerHeight - bh - 8) + 'px';
    } else { hole.style.cssText = 'display:none'; box.style.top = Math.max(8, (innerHeight - box.offsetHeight) / 2) + 'px'; }
    ov.classList.toggle('dim', !vis);
  }
  function show() {
    const s = steps[i]; const el = s.el ? (typeof s.el === 'string' ? document.querySelector(s.el) : s.el) : null;
    if (s.before) s.before();
    box.innerHTML = `<div class="hrs-tour-step">${label} · ${i + 1}/${steps.length}</div><h3>${s.title}</h3><p>${s.text}</p>
      <div class="hrs-tour-btns"><button type="button" class="hrs-btn ghost" data-t="skip">Skip tutorial</button><span style="flex:1"></span>${i ? '<button type="button" class="hrs-btn ghost" data-t="back">Back</button>' : ''}<button type="button" class="hrs-btn" data-t="next">${i === steps.length - 1 ? 'Let\'s play!' : 'Next'}</button></div>`;
    parseEmoji(box);
    box.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { sfx('tap'); const t = b.dataset.t; if (t === 'skip') finish(); else if (t === 'back') { i--; show(); } else if (i === steps.length - 1) finish(); else { i++; show(); } });
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' });
    setTimeout(place, reduceMotion() ? 0 : 350); place();
    box.querySelector('[data-t="next"]').focus({ preventScroll: true });
    announce(steps[i].title);
  }
  window.addEventListener('resize', place); window.addEventListener('scroll', onScroll, { passive: true });
  show();
  return { finish };
}

/* ---------- service worker (offline) ---------- */

/* ---------- language (shared with the games) ----------
   Key 'hrs-lang' holds a plain string: 'en' | 'hi' | 'pa' (default from navigator.language, then persisted).
   Changes fire window event 'hrs-lang-change' ({ detail: { lang, prev } }) in this page, and the same event
   is re-fired in other open pages from the 'storage' event. A game declares the languages its own text supports
   with <meta name="hrs-langs" content="en,hi,pa"> or window.HRS_GAME_LANGS = [...]; otherwise English only. */
const LANG_KEY = 'hrs-lang', LANGS = ['en', 'hi', 'pa'];
const LANG_NAMES = { en: 'English', hi: 'हिन्दी', pa: 'ਪੰਜਾਬੀ' };
function detectLang() { const n = [].concat(navigator.languages || [], navigator.language || []).map(x => String(x).toLowerCase()); for (const x of n) { const b = x.split('-')[0]; if (LANGS.includes(b)) return b; } return 'en'; }
function lang() { let l = null; try { l = localStorage.getItem(LANG_KEY); } catch (e) {} if (!LANGS.includes(l)) { l = detectLang(); try { localStorage.setItem(LANG_KEY, l); } catch (e) {} } return l; }
const IS_GAME = /\/games\//.test(location.pathname);
function gameLangs() { const m = document.querySelector('meta[name="hrs-langs"]'); const v = window.HRS_GAME_LANGS || (m ? m.content.split(',') : ['en']); return v.map(x => String(x).trim()).filter(Boolean); }
function applyLang() {
  const l = lang(), h = document.documentElement; h.dataset.hrsLang = l;
  if (IS_GAME) { const ok = gameLangs().includes(l); h.dataset.hrsLangOk = ok ? '1' : '0'; if (ok) h.lang = l; }
}
function setLang(l) {
  if (!LANGS.includes(l)) return; const prev = lang(); try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
  applyLang(); if (prev !== l) window.dispatchEvent(new CustomEvent('hrs-lang-change', { detail: { lang: l, prev } }));
}
window.addEventListener('storage', e => { if (e.key === LANG_KEY) { applyLang(); window.dispatchEvent(new CustomEvent('hrs-lang-change', { detail: { lang: lang(), prev: e.oldValue } })); } });
/* our in-game overlay (home button, help links) speaks the app language even when the game text is English */
const OV = {
  'All games': { hi: 'सभी गेम', pa: 'ਸਾਰੀਆਂ ਗੇਮਾਂ' }, 'Classic edition': { hi: 'क्लासिक संस्करण', pa: 'ਕਲਾਸਿਕ ਐਡੀਸ਼ਨ' }, 'Classic': { hi: 'क्लासिक', pa: 'ਕਲਾਸਿਕ' },
  'v2 edition': { hi: 'v2 संस्करण', pa: 'v2 ਐਡੀਸ਼ਨ' }, 'Newest edition': { hi: 'नया संस्करण', pa: 'ਨਵਾਂ ਐਡੀਸ਼ਨ' }, 'About': { hi: 'परिचय', pa: 'ਜਾਣ-ਪਛਾਣ' },
  'About & disclaimers': { hi: 'परिचय और अस्वीकरण', pa: 'ਜਾਣ-ਪਛਾਣ ਅਤੇ ਬੇਦਾਅਵਾ' }, 'Privacy': { hi: 'गोपनीयता', pa: 'ਪਰਦੇਦਾਰੀ' },
  note: { en: 'Game text in English for now', hi: 'गेम का पाठ अभी अंग्रेज़ी में है', pa: 'ਗੇਮ ਦਾ ਪਾਠ ਹਾਲੇ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਹੈ' },
  home: { en: 'All games', hi: 'सभी गेम', pa: 'ਸਾਰੀਆਂ ਗੇਮਾਂ' },
};
const ovT = (k, l) => (OV[k] && OV[k][l]) || (OV[k] && OV[k].en) || k;
const ovOrig = new WeakMap();
function translateOverlay(root) {
  if (!IS_GAME) return; const l = lang();
  (root || document).querySelectorAll('.hrs-links a, .tlinks a').forEach(a => {
    const tn = [...a.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).sort((x, y) => y.textContent.length - x.textContent.length)[0]; if (!tn) return;
    // the English label is kept on the link itself, so it survives emoji parsing replacing text nodes
    if (!a.dataset.hrsEn) a.dataset.hrsEn = tn.textContent;
    const en = a.dataset.hrsEn, key = en.trim(), lead = en.match(/^\s*/)[0], want = l === 'en' || !OV[key] ? en : lead + OV[key][l];
    if (tn.textContent !== want) tn.textContent = want;
    if (l !== 'en') a.lang = l; else a.removeAttribute('lang');
  });
  document.querySelectorAll('a.hrs-home').forEach(a => { if (!a.dataset.enLabel) a.dataset.enLabel = a.getAttribute('aria-label') || ''; a.setAttribute('aria-label', l === 'en' ? a.dataset.enLabel || ovT('home', 'en') : ovT('home', l)); });
  const ok = gameLangs().includes(l);
  (root || document).querySelectorAll('.hrs-links, .tlinks').forEach(c => {
    let n = c.nextElementSibling && c.nextElementSibling.classList.contains('hrs-lang-note') ? c.nextElementSibling : null;
    if (ok) { if (n) n.remove(); return; }
    if (!n) { n = document.createElement('p'); n.className = 'hrs-lang-note'; c.after(n); }
    n.lang = l; n.textContent = '🌐 ' + ovT('note', l);
  });
}
let noteShown = false;
function langToast() {
  if (!IS_GAME || noteShown) return; const l = lang(); if (l === 'en' || gameLangs().includes(l)) return;
  let k = 'hrs-lang-note:' + location.pathname + ':' + l; try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1'); } catch (e) {}
  noteShown = true; const t = document.createElement('div'); t.className = 'hrs-toast'; t.lang = l; t.setAttribute('role', 'status'); t.textContent = '🌐 ' + ovT('note', l);
  document.body.appendChild(t); requestAnimationFrame(() => t.classList.add('on')); setTimeout(() => { t.classList.remove('on'); setTimeout(() => t.remove(), 400); }, 3800);
}
// SEO: in English the page keeps the description written for search engines (games may set their own per language)
const MD = document.querySelector('meta[name="description"]'), MD0 = MD && MD.getAttribute('content');
if (IS_GAME && MD) new MutationObserver(() => { if (lang() === 'en' && MD.getAttribute('content') !== MD0) MD.setAttribute('content', MD0); }).observe(MD, { attributes: true, attributeFilter: ['content'] });
function startLang() {
  translateOverlay(); langToast();
  let q = 0; // re-run when link rows are added or rewritten (e.g. emoji parsing); our own edits are characterData only
  if (IS_GAME) new MutationObserver(ms => { if (!q && ms.some(m => (m.target.closest && m.target.closest('.hrs-links, .tlinks')) || [...m.addedNodes].some(n => n.nodeType === 1 && (n.matches('.hrs-links, .tlinks') || n.querySelector('.hrs-links, .tlinks'))))) q = requestAnimationFrame(() => { q = 0; translateOverlay(); }); }).observe(document.body, { childList: true, subtree: true });
}
window.addEventListener('hrs-lang-change', () => { translateOverlay(); noteShown = false; langToast(); });

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !Cap) {
  window.addEventListener('load', () => navigator.serviceWorker.register(new URL('sw.js', ROOT).href, { scope: ROOT.href }).catch(() => {}));
}

apply(); applyLang();
document.documentElement.classList.toggle('hrs-ios', isIOS); document.documentElement.classList.toggle('hrs-standalone', isStandalone);
if (mq.addEventListener) mq.addEventListener('change', apply);
window.addEventListener('storage', e => { if (e.key === SETTINGS_KEY) apply(); });
document.addEventListener('DOMContentLoaded', startEmoji); document.addEventListener('DOMContentLoaded', startLang);

window.HRS = { lang, setLang, LANGS, LANG_NAMES, gameLangs, translateOverlay, ROOT, store, settings, setSetting, reduceMotion, apply, sfx, buzz, openExternal, onBack, handleBack, home, parseEmoji, clickables, titlePopovers, showPopover, hidePopover, dialog, announce, tour, isNative: !!Cap, isIOS, isIOSSafari, isStandalone, canVibrate };
})();
