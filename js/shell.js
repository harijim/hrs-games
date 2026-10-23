/* Launcher: home, about, settings, privacy. */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const t = (k, v) => HRSI18N.t(k, v);
// mirrors SDG2.when(t, mode) / MODES in games/sdg-2030 (v3 build): months per turn, start year, game length
const mode = (e, key, extra) => Object.assign({ e, get name() { return key ? t(key) : ''; } }, extra);
const SDG_MODES = { kids: mode('🎒', 'm.kids', { step: 6, y: 2026, T: 10 }), college: mode('🎓', 'm.college', { step: 3, y: 2027, T: 16 }), adults: mode('💼', 'm.adults', { step: 3, y: 2026, T: 20 }), classic: mode('🌍', '', { step: 3, y: 2026, T: 20 }) };
const SDG_WHEN = (n, m) => { const c = SDG_MODES[m] || SDG_MODES.classic, mo = n * c.step; return t('months').split(' ')[mo % 12] + ' ' + (c.y + Math.floor(mo / 12)); };
const sdgLabel = st => { const c = SDG_MODES[st.mode] || SDG_MODES.classic, T = st.T || c.T; return `${c.name ? c.e + ' ' + c.name + ' · ' : ''}${SDG_WHEN(Math.min(st.turn, T - 1), st.mode)}, ${t(st.mode === 'kids' ? 'sdg.turn' : 'sdg.season', { n: Math.min(st.turn + 1, T), T })}`; };
const VB_MODES = { school: mode('🎒', 'm.school'), college: mode('🎓', 'm.college'), expert: mode('💼', 'm.expert') };
const VB_BEST = { school: 'hrs_best_viksit_v3_school', college: 'hrs_best_viksit_v2', expert: 'hrs_best_viksit_v3_expert' };
const live = s => s && s.S && !s.S.over ? s : null;
// Optimise Your Health (games/optimise-your-health): modes and best keys mirror oyh-data.js MODES / oyh-game.js bestKey
const OYH_MODES = { school: mode('🎒', 'm.school', { T: 6 }), college: mode('🎓', 'm.college', { T: 8 }), adult: mode('💼', 'm.adult', { T: 10 }) };
const OYH_BEST = { school: 'hrs_best_health_school', college: 'hrs_best_health_college', adult: 'hrs_best_health_adult' };
// Let's Optimise the World (games/lets-optimise-the-world): no mid-game save; its own store 'lotw.v1' records finished scenarios (completed: {s1..s5: date})
const LOTW_MODES = { done: mode('🌏', 'lotw.done') };
const lotwDone = () => { const st = HRS.store.get('lotw.v1'), n = st && st.completed ? Object.keys(st.completed).filter(k => /^s[1-5]$/.test(k)).length : 0; return n ? [['done', { score: n }]] : []; };
// v3 save, or an unfinished v2 game that v3 will adopt on open (until imported or declined)
const viksitSave = () => live(HRS.store.get('hrs_save_viksit_v3')) || (s => s && s.t > (HRS.store.get('hrs_viksit_v2_imported') || 0) ? s : null)(live(HRS.store.get('hrs_save_viksit_v2')));
const SDG_BEST = { kids: 'hrs_best_sdg_v2_kids', college: 'hrs_best_sdg_v2', adults: 'hrs_best_sdg_v2_adults' };
// card text is looked up at render time, so a language switch re-renders in place
const txt = p => ({ get title() { return t(p + '.title'); }, get sub() { return t(p + '.sub'); }, get badge() { return t(p + '.badge'); }, get desc() { return t(p + '.desc'); }, get time() { return t(p + '.time'); }, get turns() { return t(p + '.turns'); }, get age() { return t(p + '.age'); }, get learn() { return [1, 2, 3, 4].map(i => t(p + '.l' + i)); }, get empty() { return t(p + '.empty'); } });
// ===== js/shell.js: BRICS Bridges — Classic (0.3.0) =====
// BRICS Bridges — Classic (games/brics-bridges-classic): its own store 'brics_bridges_classic_v1' = { save, bestQ: {1..4: {school, college, expert}}, qDone, ... }.
// It writes plain localStorage JSON (not HRS.store), so it is read directly here. A finished quarter sets save:null.
const BB_KEY = 'brics_bridges_classic_v1';
const BB_MODES = { q1: mode('🛡️', 'bb.q1'), q2: mode('💡', 'bb.q2'), q3: mode('🤝', 'bb.q3'), q4: mode('🌱', 'bb.q4') };
const bbStore = () => { try { return JSON.parse(localStorage.getItem(BB_KEY) || 'null'); } catch (e) { return null; } };
const bbBest = () => { const bq = (bbStore() || {}).bestQ || {}; return [1, 2, 3, 4].filter(q => bq[q] && Object.keys(bq[q]).length).map(q => ['q' + q, { score: Math.max(...Object.values(bq[q])) }]); };

const GAMES = [
  Object.defineProperties({ id: 'viksit', cls: 'g1', icon: '🇮🇳', path: 'games/viksit-2047/index.html', thumb: 'assets/thumbs/viksit-2047.jpg',
    getSave: viksitSave,
    saveLabel: s => { const m = VB_MODES[s.S.mode] || VB_MODES.college; return `${m.e} ${m.name} · ${t('vb.save', { year: s.S.year, n: Math.min(s.S.term + 1, 7) })}`; },
    bestOf: () => Object.entries(VB_BEST).map(([m, k]) => [m, HRS.store.get(k)]).filter(x => x[1]), modes: VB_MODES, max: 100,
    editions: [{ path: 'games/viksit-2047-v2/index.html', save: 'hrs_save_viksit_v2', get label() { return t('vb.ed.v2'); } }, { path: 'games/viksit-2047-classic/index.html', save: 'hrs_save_viksit_v1', get label() { return t('vb.ed.c'); } }] }, Object.getOwnPropertyDescriptors(txt('vb'))),
  Object.defineProperties({ id: 'sdg', cls: 'g2', icon: '🌍', path: 'games/sdg-2030/index.html', thumb: 'assets/thumbs/sdg-2030.jpg',
    save: 'hrs_save_sdg_v2', best: 'hrs_best_sdg_v2',
    saveLabel: s => sdgLabel(s.S),
    bestOf: () => Object.entries(SDG_BEST).map(([m, k]) => [m, HRS.store.get(k)]).filter(x => x[1]), modes: SDG_MODES, max: 17,
    editions: [{ path: 'games/sdg-2030-classic/index.html', save: 'hrs_save_sdg_v1', get label() { return t('sdg.ed.c'); } }] }, Object.getOwnPropertyDescriptors(txt('sdg'))),
  Object.defineProperties({ id: 'health', cls: 'g3', icon: '🌿', path: 'games/optimise-your-health/index.html', thumb: 'assets/thumbs/optimise-your-health.jpg',
    save: 'hrs_save_health_v1',
    saveLabel: s => { const m = OYH_MODES[s.S.mode] || OYH_MODES.school, T = s.S.T || m.T; return `${m.e} ${m.name} · ${t('oyh.save', { n: Math.min(s.S.week + 1, T), T })}`; },
    bestOf: () => Object.entries(OYH_BEST).map(([m, k]) => [m, HRS.store.get(k)]).filter(x => x[1]), modes: OYH_MODES, max: 100,
    editions: [] }, Object.getOwnPropertyDescriptors(txt('oyh'))),
  Object.defineProperties({ id: 'lotw', cls: 'g4', icon: '🌏', path: 'games/lets-optimise-the-world/index.html', thumb: 'assets/thumbs/lets-optimise-the-world.jpg',
    getSave: () => null, saveLabel: () => '',
    bestOf: lotwDone, modes: LOTW_MODES, max: 5,
    editions: [] }, Object.getOwnPropertyDescriptors(txt('lotw'))),
  Object.defineProperties({ id: 'bricsb', cls: 'g5', icon: '🌉', path: 'games/brics-bridges-classic/index.html', thumb: 'assets/thumbs/brics-bridges-classic.jpg',
    getSave: () => { const st = bbStore(); return st && st.save ? { S: st.save } : null; },
    saveLabel: s => { const q = s.S.quarter || 1; return `${BB_MODES['q' + q].e} ${BB_MODES['q' + q].name} · ${t('bb.save', { n: Math.min(s.S.turn + 1, s.S.turns || 3), T: s.S.turns || 3 })}`; },
    bestOf: bbBest, modes: BB_MODES, max: 100,
    editions: [] }, Object.getOwnPropertyDescriptors(txt('bb'))),
];

const SEEN_BEST = 'hrs_seen_best'; // launcher-only: which best records were already celebrated
const chipBest = (g, all) => all.map(([m, x]) => `<span class="pm">${g.modes[m].e} ${g.modes[m].name} <b>${esc(x.score)}</b>/${g.max}${x.grade ? ' ' + esc(x.grade) : ''}</span>`).join('');
function renderGames() {
  const seen = HRS.store.get(SEEN_BEST), sig = {}, fresh = [];
  $('#games').innerHTML = GAMES.map((g, i) => {
    const save = g.getSave ? g.getSave() : HRS.store.get(g.save), all = g.bestOf();
    const hasSave = save && save.S && !save.S.over;
    all.forEach(([m, x]) => { const k = g.id + ':' + m, v = JSON.stringify(x); sig[k] = v; if (seen && seen[k] !== v) fresh.push(g.id); });
    const isNew = fresh.includes(g.id);
    const bestHtml = all.length ? `<div class="best" aria-label="${t('card.bestAria')}"><span class="tro" aria-hidden="true">🏆</span>${isNew ? `<span class="nb">✨ ${t('card.newBest')}</span>` : ''}${chipBest(g, all)}</div>`
      : `<div class="best none">${g.empty}</div>`;
    return `<article class="game ${g.cls}" aria-labelledby="t-${g.id}" style="--i:${i}" data-game="${g.id}">
      <div class="hero-c"><span class="band" aria-hidden="true"></span><span class="ico" aria-hidden="true"><span>${g.icon}</span></span>${g.thumb ? `<img class="thumb" src="${g.thumb}" alt="" width="74" height="150" ${g.id === "viksit" ? "fetchpriority=\"high\"" : "loading=\"lazy\""}>` : ''}
        <span class="newb">${g.badge}</span><h2 id="t-${g.id}">${g.title}</h2><p class="sub">${g.sub}</p>
        <div class="meta"><span class="chip">⏱️ ${g.time}</span><span class="chip">👤 ${g.age}</span></div></div>
      <div class="body">
        ${bestHtml}
        <div class="actions">
          ${hasSave ? `<a class="btn cont" href="${g.path}?continue=1"><span class="bt1">⏯ ${t('card.continue')}</span> <span class="sr-meta">${esc(g.saveLabel(save))}</span></a>` : ''}
          <a class="btn ${hasSave ? 'ghost' : 'play'}" href="${g.path}?new=1" data-new="${g.id}">${hasSave ? '↻ ' + t('card.new') : '<span class="play-ico" aria-hidden="true">▶</span> ' + t('card.play')}</a>
        </div>
        <div class="more-row">
          <details class="more"><summary>ⓘ ${t('card.about')}</summary><div class="in"><p class="desc">${g.desc}</p><div class="learn"><h3>${t('card.learn')}</h3><ul>${g.learn.map(l => `<li>${l}</li>`).join('')}</ul></div><div class="meta"><span class="chip">🔁 ${g.turns}</span><span class="chip">⏱️ ${g.time}</span><span class="chip">👤 ${g.age}</span></div></div></details>
          ${g.editions.length ? '' : '<!-- no earlier editions -->'}${!g.editions.length ? '' : `<details class="eds"><summary>${t('card.eds')}</summary><div class="in"><p class="classic">${g.editions.map(ed => { const sv = live(HRS.store.get(ed.save)); return `<a href="${ed.path}${sv ? '?continue=1' : ''}">${ed.label}${sv ? ` <span class="sv">· ${t('card.contSaved')}</span>` : ''}</a>`; }).join('')}</p></div></details>`}
        </div>
      </div></article>`;
  }).join('');
  HRS.store.set(SEEN_BEST, sig);
  [...new Set(fresh)].forEach((id, k) => setTimeout(() => celebrate(document.querySelector(`.game[data-game="${id}"]`)), 450 + k * 300));
}
/* a small confetti burst on a card (skipped entirely with reduced motion) */
const PALETTE = { lotw: ['#18c76a', '#3df58a', '#2a7de1', '#4da3ff', '#ffc23d', '#ffffff'], health: ['#3f9d68', '#2f969b', '#5b7fcf', '#9a84cf', '#e2706a', '#eea63a'], viksit: ['#ff9933', '#ffb45c', '#138808', '#22a35a', '#f5c542', '#ffffff'], sdg: ['#e5243b', '#dda63a', '#4c9f38', '#26bde2', '#fcc30b', '#dd1367', '#fd6925', '#0a97d9'] };
function celebrate(card) {
  if (!card) return;
  HRS.buzz('success'); HRS.sfx('milestone'); HRS.announce(t('card.newBestSr'));
  if (HRS.reduceMotion()) return;
  const box = document.createElement('div'); box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
  const pal = PALETTE[card.dataset.game] || PALETTE.sdg;
  for (let n = 0; n < 40; n++) {
    const i = document.createElement('i'), a = Math.random() * Math.PI * 2, r = 90 + Math.random() * 170;
    i.style.cssText = `--c:${pal[n % pal.length]};--x:${Math.cos(a) * r}px;--y:${Math.sin(a) * r * .8 + 120}px;--r:${(Math.random() * 720 - 360) | 0}deg;--d:${(Math.random() * 120) | 0}ms`;
    box.appendChild(i);
  }
  card.appendChild(box); setTimeout(() => box.remove(), 1900);
}
/* tactile cards: tilt toward the pointer (mouse/pen hover), press-scale on touch; light haptic on buttons */
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
document.addEventListener('pointermove', e => {
  if (!finePointer || HRS.reduceMotion()) return;
  const c = e.target.closest && e.target.closest('.game'); document.querySelectorAll('.game').forEach(x => { if (x !== c) { x.style.removeProperty('--rx'); x.style.removeProperty('--ry'); } });
  if (!c) return; const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
  c.style.setProperty('--rx', (-py * 5).toFixed(2) + 'deg'); c.style.setProperty('--ry', (px * 6).toFixed(2) + 'deg');
}, { passive: true });
document.addEventListener('pointerleave', () => document.querySelectorAll('.game').forEach(x => { x.style.removeProperty('--rx'); x.style.removeProperty('--ry'); }));
document.addEventListener('pointerdown', e => {
  const b = e.target.closest && e.target.closest('.btn,.ib,.classic a,summary'); if (b) HRS.buzz('light');
  const c = e.target.closest && e.target.closest('.game'); if (c && !HRS.reduceMotion()) { c.classList.add('pressed'); const up = () => { c.classList.remove('pressed'); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); }; addEventListener('pointerup', up); addEventListener('pointercancel', up); }
}, { passive: true });
document.addEventListener('toggle', e => { if (e.target.matches && e.target.matches('.game details') && e.target.open) e.target.closest('.game').querySelectorAll('details').forEach(d => { if (d !== e.target) d.open = false; }); }, true);
/* greeting by time of day */
function greet() {
  const h = new Date().getHours(), [k, e] = h < 5 ? ['night', '🦉'] : h < 12 ? ['morning', '☀️'] : h < 17 ? ['afternoon', '🌤️'] : h < 22 ? ['evening', '🌆'] : ['night', '🌙'];
  $('#greet').textContent = t('greet.' + k); $('#greetE').textContent = e;
}
greet();
window.addEventListener('hrs-lang-change', () => { greet(); if (cur === 'home') renderGames(); const r = (location.hash || '#').slice(1); if (r && r !== 'home') document.title = t('title.' + (r === 'settings' ? 'settings' : ROUTES.includes(r) ? r : 'about')) + ' · Harpreet Raj Singh Games'; });
document.addEventListener('click', e => {
  const a = e.target.closest('[data-new]'); if (!a) return;
  const g = GAMES.find(x => x.id === a.dataset.new); const save = g.getSave ? g.getSave() : HRS.store.get(g.save);
  if (save && save.S && !save.S.over) {
    e.preventDefault();
    confirmDlg(t('dlg.newT'), esc(t('dlg.newP', { title: g.title, label: g.saveLabel(save) })), t('dlg.newOk'), () => { location.href = a.href; });
  }
});

/* small accessible confirm dialog */
let dlgPrev = null;
function confirmDlg(title, text, okLabel, onOk) {
  dlgPrev = document.activeElement;
  $('#dlgBox').innerHTML = `<h2 id="dlgT">${title}</h2><p>${text}</p><div class="row-btns"><button class="btn ghost" id="dlgNo">${t('dlg.cancel')}</button><button class="btn" id="dlgOk">${okLabel}</button></div>`;
  $('#dlg').classList.remove('hidden'); $('#dlgNo').focus();
  $('#dlgNo').onclick = closeDlg; $('#dlgOk').onclick = () => { closeDlg(); onOk(); };
}
function closeDlg() { $('#dlg').classList.add('hidden'); if (dlgPrev) dlgPrev.focus(); }
HRS.dialog({ overlay: $('#dlg'), box: $('#dlgBox'), isOpen: () => !$('#dlg').classList.contains('hidden'), isDismissible: () => true, close: closeDlg });

/* routing: home / about / privacy are pages; settings is a bottom sheet over home */
const ROUTES = ['home', 'about', 'privacy'];
const HOME_TITLE = document.title; // SEO title from <head> (tools/seo.js)
const wrap = $('#page-settings'), sheet = $('#sheet');
let cur = null;
function route() {
  const r = (location.hash || '#').slice(1) || 'home';
  const page = ROUTES.includes(r) ? r : (r === 'disclaimers' || r === 'whats-new') ? 'about' : 'home';
  const changed = page !== cur; cur = page;
  ROUTES.forEach(p => { const el = $('#page-' + p); el.hidden = p !== page; if (changed && p === page) { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; } });
  document.querySelectorAll('[data-route]').forEach(a => { const on = a.dataset.route === (r === 'settings' ? 'settings' : page); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (page === 'home' && changed) renderGames();
  if (r === 'settings') openSheet(); else if (!wrap.hidden) shutSheet();
  document.title = page === 'home' && r !== 'settings' ? HOME_TITLE : t('title.' + (r === 'settings' ? 'settings' : page)) + ' · Harpreet Raj Singh Games';
  if (route.started && changed) { const h = $('#page-' + page).querySelector('h1'); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); window.scrollTo(0, 0); }
  route.started = true;
  if (r === 'disclaimers' || r === 'whats-new') { $('#' + r).scrollIntoView(); if (r === 'whats-new') { HRS.store.set(SEEN_VER, VER); newDot(); } }
}
/* sheet */
let shutT = 0;
function openSheet() {
  clearTimeout(shutT); loadSettings();
  if (!wrap.hidden && wrap.classList.contains('open')) return;
  wrap.hidden = false; wrap.style.removeProperty('--drag'); requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
  document.body.style.overflow = 'hidden';
}
function shutSheet() {
  wrap.classList.remove('open', 'dragging'); sheet.style.removeProperty('--drag'); document.body.style.overflow = '';
  clearTimeout(shutT); shutT = setTimeout(() => { wrap.hidden = true; }, HRS.reduceMotion() ? 0 : 320);
}
function closeSheet() { if ((location.hash || '') === '#settings') location.hash = ''; else shutSheet(); }
wrap.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeSheet));
HRS.dialog({ overlay: wrap, box: sheet, isOpen: () => !wrap.hidden && wrap.classList.contains('open'), isDismissible: () => true, close: closeSheet });
// swipe down on the handle / header to dismiss
(function drag() {
  let y0 = null, dy = 0;
  const start = e => { if (e.target.closest('button')) return; y0 = e.clientY; dy = 0; wrap.classList.add('dragging'); };
  const move = e => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); sheet.style.setProperty('--drag', dy + 'px'); };
  const end = () => { if (y0 == null) return; y0 = null; wrap.classList.remove('dragging'); sheet.style.removeProperty('--drag'); if (dy > 90) { HRS.buzz('light'); closeSheet(); } };
  [$('#grab'), sheet.querySelector('.sheet-h')].forEach(h => { h.addEventListener('pointerdown', start); });
  addEventListener('pointermove', move, { passive: true }); addEventListener('pointerup', end); addEventListener('pointercancel', end);
})();
/* "What's new" dot until the 1.3 notes are opened */
const VER = ($('#ver') || {}).textContent || '', SEEN_VER = 'hrs_seen_whatsnew';
function newDot() { $('#newBtn .dot').hidden = HRS.store.get(SEEN_VER) === VER; }
newDot();
window.addEventListener('hashchange', route);
HRS.onBack(() => { if ((location.hash || '#') !== '#' && location.hash !== '#home') { location.hash = ''; return true; } return false; });

/* settings */
function loadSettings() {
  const s = HRS.settings();
  $('#s-sound').checked = !!s.sound; $('#s-vibration').checked = !!s.vibration && HRS.canVibrate(); $('#s-emoji').checked = s.emoji !== false;
  $('#s-motion').value = s.reduceMotion == null ? 'system' : s.reduceMotion ? 'on' : 'off';
  $('#s-text').value = s.textSize || 'normal';
  syncTheme();
}
/* appearance: Light (default) / Dark / Auto, a segmented radio group */
function syncTheme() { const t = HRS.themePref(); document.querySelectorAll('[data-theme-pick]').forEach(b => { const on = b.dataset.themePick === t; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; }); }
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-theme-pick]'); if (!b) return; HRS.setSetting('theme', b.dataset.themePick); HRS.buzz('light'); syncTheme(); });
$('#themeSeg').addEventListener('keydown', e => { const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return; e.preventDefault(); const bs = [...e.currentTarget.querySelectorAll('button')], i = (bs.indexOf(document.activeElement) + d + bs.length) % bs.length; bs[i].click(); bs[i].focus(); });
window.addEventListener('storage', e => { if (e.key === 'hrs_settings_v1') syncTheme(); });
syncTheme();
$('#s-sound').onchange = e => { HRS.setSetting('sound', e.target.checked); if (e.target.checked) HRS.sfx('good'); };
$('#s-vibration').onchange = e => { HRS.setSetting('vibration', e.target.checked); if (e.target.checked) HRS.buzz('medium'); };
$('#s-emoji').onchange = e => { HRS.setSetting('emoji', e.target.checked); location.reload(); };
$('#s-motion').onchange = e => HRS.setSetting('reduceMotion', e.target.value === 'system' ? null : e.target.value === 'on');
$('#s-text').onchange = e => HRS.setSetting('textSize', e.target.value);
$('#t-sound').onclick = () => { if (!HRS.settings().sound) { $('#dataMsg').textContent = ''; HRS.setSetting('sound', true); $('#s-sound').checked = true; } HRS.sfx('milestone'); };
$('#t-vib').onclick = () => HRS.buzz('success');
const DATA_KEY = /^(hrs_(save|best|tut)_|hrs_viksit_v2_imported$|hrs_seen_best$|sdg2030_best_v1$|sdg2030v2_(best|seen)|lotw\.v1$|brics_bridges_classic_v1$|brics_bridges_v1$|brics-lang$)/; // lotw.v1: Let's Optimise the World's own record (days played, finished scenarios, chosen actions, its settings)
const TUT_KEY = /^(hrs_tut_|sdg2030v2_seen)/;
const keys = re => { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (re.test(k)) out.push(k); } } catch (e) {} return out; };
$('#resetTut').onclick = () => { keys(TUT_KEY).forEach(HRS.store.del); $('#dataMsg').textContent = t('msg.tut'); };
$('#wipe').onclick = () => confirmDlg(t('dlg.delT'), t('dlg.delP'), t('dlg.delOk'), () => {
  keys(DATA_KEY).forEach(HRS.store.del);
  $('#dataMsg').textContent = t('msg.deleted'); renderGames();
});
/* iOS Safari install hint: only in Safari on iPhone/iPad, only when not already installed; dismissible (re-shows after 30 days) */
(function iosHint() {
  const d = HRS.store.get('hrs_ios_hint_dismissed');
  const show = HRS.isIOSSafari && !HRS.isStandalone && !HRS.isNative && !(d && Date.now() - d < 30 * 864e5);
  $('#iosHint').hidden = !show;
  $('#iosHintX').onclick = () => { HRS.store.set('hrs_ios_hint_dismissed', Date.now()); $('#iosHint').hidden = true; };
})();
/* vibration: unsupported on iOS browsers */
if (!HRS.canVibrate()) {
  const row = $('#s-vibration').closest('.set'); row.classList.add('unsupported');
  $('#s-vibration').disabled = true; $('#t-vib').disabled = true;
  const old = row.querySelector('small'), sm = document.createElement('small'), k = HRS.isIOS ? 'vib.ios' : 'vib.no'; sm.dataset.i18n = k; sm.textContent = HRSI18N.D[k].en; old.replaceWith(sm); HRSI18N.apply(row);
}
/* gentle depth on scroll: ambient light drifts slower than the page, screenshots float a little; frosted bar gets a hairline */
(function depth() {
  let raf = 0; const top = $('.top'), art = $('.bg-art');
  const run = () => { raf = 0; const y = scrollY; top.classList.toggle('scrolled', y > 4);
    if (HRS.reduceMotion()) { art.style.removeProperty('--par'); document.querySelectorAll('.thumb').forEach(t => t.style.removeProperty('--py')); return; }
    art.style.setProperty('--par', (-y * 0.06).toFixed(1) + 'px');
    const H = innerHeight; document.querySelectorAll('.game').forEach(g => { const r = g.getBoundingClientRect(); if (r.bottom < 0 || r.top > H) return; const k = ((r.top + r.height / 2) - H / 2) / H; const th = g.querySelector('.thumb'); if (th) th.style.setProperty('--py', (k * 14).toFixed(1) + 'px'); }); };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(run); }, { passive: true }); addEventListener('resize', run); run();
})();
route();
})();
