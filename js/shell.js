/* Launcher: home, about, settings, privacy. */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// mirrors SDG2.when(t, mode) / MODES in games/sdg-2030 (v3 build): months per turn, start year, game length
const SDG_MODES = { kids: { e: '🎒', name: 'Kids', step: 6, y: 2026, T: 10 }, college: { e: '🎓', name: 'College', step: 3, y: 2027, T: 16 }, adults: { e: '💼', name: 'Adults', step: 3, y: 2026, T: 20 }, classic: { e: '🌍', name: '', step: 3, y: 2026, T: 20 } };
const SDG_WHEN = (t, m) => { const c = SDG_MODES[m] || SDG_MODES.classic, mo = t * c.step; return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][mo % 12] + ' ' + (c.y + Math.floor(mo / 12)); };
const sdgLabel = st => { const c = SDG_MODES[st.mode] || SDG_MODES.classic, T = st.T || c.T; return `${c.name ? c.e + ' ' + c.name + ' · ' : ''}${SDG_WHEN(Math.min(st.turn, T - 1), st.mode)}, ${st.mode === 'kids' ? 'turn' : 'season'} ${Math.min(st.turn + 1, T)} of ${T}`; };
const VB_MODES = { school: { e: '🎒', name: 'School' }, college: { e: '🎓', name: 'College' }, expert: { e: '💼', name: 'Expert' } };
const VB_BEST = { school: 'hrs_best_viksit_v3_school', college: 'hrs_best_viksit_v2', expert: 'hrs_best_viksit_v3_expert' };
const live = s => s && s.S && !s.S.over ? s : null;
// v3 save, or an unfinished v2 game that v3 will adopt on open (until imported or declined)
const viksitSave = () => live(HRS.store.get('hrs_save_viksit_v3')) || (s => s && s.t > (HRS.store.get('hrs_viksit_v2_imported') || 0) ? s : null)(live(HRS.store.get('hrs_save_viksit_v2')));
const SDG_BEST = { kids: 'hrs_best_sdg_v2_kids', college: 'hrs_best_sdg_v2', adults: 'hrs_best_sdg_v2_adults' };
const GAMES = [
  { id: 'viksit', cls: 'g1', icon: '🇮🇳', path: 'games/viksit-2047/index.html', title: 'Viksit Bharat 2047', sub: 'Plan India\'s road to 2047', thumb: 'assets/thumbs/viksit-2047.jpg', badge: '✨ New edition',
    desc: 'Pick your level: 🎒 School (5 friendly groups, a fact and quiz each term), 🎓 College (trade-offs, dilemmas, predict the numbers) or 💼 Expert (tight budgets, harsh shocks, a coalition to keep happy). Seven 3-year terms to 2047 with real 2026 data.',
    time: '15–30 min', turns: '3 levels · 7 terms', age: 'Ages 10+',
    learn: ['How growth, infrastructure, skills and energy reinforce each other', 'Why the evening peak, storage and grid lines make or break a clean grid', 'Trade-offs between public approval, debt and long-term investment', 'Reading real numbers: IMF, CEA, MNRE and NITI Aayog targets'],
    getSave: viksitSave,
    saveLabel: s => { const m = VB_MODES[s.S.mode] || VB_MODES.college; return `${m.e} ${m.name} · ${s.S.year}, term ${Math.min(s.S.term + 1, 7)} of 7`; },
    bestOf: () => Object.entries(VB_BEST).map(([m, k]) => [m, HRS.store.get(k)]).filter(x => x[1]),
    bestLabel: (b, all) => all.length > 1 || (all[0] && all[0][0] !== 'college')
      ? `🏆 Best: ${all.map(([m, x]) => `<span class="pm">${VB_MODES[m].e} ${VB_MODES[m].name} <b>${esc(x.score)}</b> ${esc(x.grade)}</span>`).join(' · ')}`
      : `🏆 Best: <b>${esc(b.score)}</b>/100 · grade <b>${esc(b.grade)}</b>${b.title ? ` · ${esc(b.title)}` : ''}`,
    editions: [{ path: 'games/viksit-2047-v2/index.html', save: 'hrs_save_viksit_v2', label: 'v2 edition' }, { path: 'games/viksit-2047-classic/index.html', save: 'hrs_save_viksit_v1', label: 'Classic: The Planner\'s Desk' }] },
  { id: 'sdg', cls: 'g2', icon: '🌍', path: 'games/sdg-2030/index.html', title: 'SDG 2030', sub: 'Heal the World', thumb: 'assets/thumbs/sdg-2030.jpg', badge: '✨ New edition',
    desc: 'Pick who\'s playing: 🎒 School Kids (10 turns, clear hints, can\'t fail), 🎓 College (16 seasons, hidden bills, quizzes and dilemmas) or 💼 Adults (20 seasons, elections, tipping points, no hints). One card per turn: watch a tiny planet heal or decay as you fill all 17 Sustainable Development Goals.',
    time: '4–10 min', turns: '3 modes · 10–20 turns', age: 'Ages 8+',
    learn: ['The 17 Sustainable Development Goals, one coloured dot each', 'Short-term wins vs delayed consequences', 'Balancing money, happiness, the planet and peace', 'Quick quizzes, feelings moments and ethical dilemmas'],
    save: 'hrs_save_sdg_v2', best: 'hrs_best_sdg_v2',
    saveLabel: s => sdgLabel(s.S),
    bestOf: () => Object.entries(SDG_BEST).map(([m, k]) => [m, HRS.store.get(k)]).filter(x => x[1]),
    bestLabel: (b, all) => all.length > 1 || (all[0] && all[0][0] !== 'college')
      ? `🏆 Best: ${all.map(([m, x]) => `<span class="pm">${SDG_MODES[m].e} ${SDG_MODES[m].name} <b>${esc(x.score)}</b>/17</span>`).join(' · ')}`
      : `🏆 Best: <b>${esc(b.score)}</b>/17 goals${b.title ? ` · ${esc(b.title)}` : ''}`,
    editions: [{ path: 'games/sdg-2030-classic/index.html', save: 'hrs_save_sdg_v1', label: 'Classic: Race to the Goals' }] },
];

function renderGames() {
  $('#games').innerHTML = GAMES.map(g => {
    const save = g.getSave ? g.getSave() : HRS.store.get(g.save), all = g.bestOf ? g.bestOf() : null, best = all ? (all.length ? all[0][1] : null) : HRS.store.get(g.best);
    const hasSave = save && save.S && !save.S.over;
    const bestHtml = best ? `<div class="best">${g.bestLabel(best, all)}</div>` : '<div class="best none">No score yet. Your first run awaits.</div>';
    return `<article class="game ${g.cls}" aria-labelledby="t-${g.id}">
      <div class="banner"><span class="ico" aria-hidden="true">${g.icon}</span><div class="bt"><span class="newb">${g.badge}</span><h2 id="t-${g.id}">${g.title}</h2><p>${g.sub}</p></div>${g.thumb ? `<img class="thumb" src="${g.thumb}" alt="" width="60" height="120" loading="lazy">` : ''}</div>
      <div class="body">
        <p class="desc">${g.desc}</p>
        <div class="meta"><span class="chip">⏱️ ${g.time}</span><span class="chip">🔁 ${g.turns}</span><span class="chip">👤 ${g.age}</span><span class="chip">✈️ Works offline</span></div>
        <div class="learn"><h3>You'll learn</h3><ul>${g.learn.map(l => `<li>${l}</li>`).join('')}</ul></div>
        ${bestHtml}
        <div class="actions">
          ${hasSave ? `<a class="btn cont" href="${g.path}?continue=1">⏯ Continue <span class="sr-meta">(${esc(g.saveLabel(save))})</span></a>` : ''}
          <a class="btn ${hasSave ? 'ghost' : ''}" href="${g.path}?new=1" data-new="${g.id}">▶ ${hasSave ? 'New game' : 'Play'}</a>
        </div>
        <p class="classic">🕰️ Earlier editions: ${g.editions.map(ed => { const sv = live(HRS.store.get(ed.save)); return `<a href="${ed.path}${sv ? '?continue=1' : ''}">${ed.label}${sv ? ' · continue saved game' : ''}</a>`; }).join(' · ')}</p>
      </div></article>`;
  }).join('');
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-new]'); if (!a) return;
  const g = GAMES.find(x => x.id === a.dataset.new); const save = g.getSave ? g.getSave() : HRS.store.get(g.save);
  if (save && save.S && !save.S.over) {
    e.preventDefault();
    confirmDlg('Start a new game?', `You have a saved ${g.title} game (${esc(g.saveLabel(save))}). Starting a new game will replace it.`, 'Start new game', () => { location.href = a.href; });
  }
});

/* small accessible confirm dialog */
let dlgPrev = null;
function confirmDlg(title, text, okLabel, onOk) {
  dlgPrev = document.activeElement;
  $('#dlgBox').innerHTML = `<h2 id="dlgT">${title}</h2><p>${text}</p><div class="row-btns"><button class="btn ghost" id="dlgNo">Cancel</button><button class="btn" id="dlgOk">${okLabel}</button></div>`;
  $('#dlg').classList.remove('hidden'); $('#dlgNo').focus();
  $('#dlgNo').onclick = closeDlg; $('#dlgOk').onclick = () => { closeDlg(); onOk(); };
}
function closeDlg() { $('#dlg').classList.add('hidden'); if (dlgPrev) dlgPrev.focus(); }
HRS.dialog({ overlay: $('#dlg'), box: $('#dlgBox'), isOpen: () => !$('#dlg').classList.contains('hidden'), isDismissible: () => true, close: closeDlg });

/* routing */
const ROUTES = ['home', 'about', 'settings', 'privacy'];
const HOME_TITLE = document.title; // SEO title from <head> (tools/seo.js)
function route() {
  const r = (location.hash || '#').slice(1) || 'home', page = ROUTES.includes(r) ? r : (r === 'disclaimers' ? 'about' : 'home');
  ROUTES.forEach(p => { $('#page-' + p).hidden = p !== page; });
  document.querySelectorAll('[data-route]').forEach(a => { if (a.dataset.route === page) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (page === 'home') renderGames();
  if (page === 'settings') loadSettings();
  document.title = page === 'home' ? HOME_TITLE : page[0].toUpperCase() + page.slice(1) + ' · Harpreet Raj Singh Games';
  if (route.started) { $('#page-' + page).querySelector('h1').setAttribute('tabindex', '-1'); $('#page-' + page).querySelector('h1').focus(); window.scrollTo(0, 0); }
  route.started = true;
  if (r === 'disclaimers') $('#disclaimers').scrollIntoView();
}
window.addEventListener('hashchange', route);
HRS.onBack(() => { if ((location.hash || '#') !== '#' && location.hash !== '#home') { location.hash = ''; return true; } return false; });

/* settings */
function loadSettings() {
  const s = HRS.settings();
  $('#s-sound').checked = !!s.sound; $('#s-vibration').checked = !!s.vibration && HRS.canVibrate(); $('#s-emoji').checked = s.emoji !== false;
  $('#s-motion').value = s.reduceMotion == null ? 'system' : s.reduceMotion ? 'on' : 'off';
  $('#s-text').value = s.textSize || 'normal';
}
$('#s-sound').onchange = e => { HRS.setSetting('sound', e.target.checked); if (e.target.checked) HRS.sfx('good'); };
$('#s-vibration').onchange = e => { HRS.setSetting('vibration', e.target.checked); if (e.target.checked) HRS.buzz('medium'); };
$('#s-emoji').onchange = e => { HRS.setSetting('emoji', e.target.checked); location.reload(); };
$('#s-motion').onchange = e => HRS.setSetting('reduceMotion', e.target.value === 'system' ? null : e.target.value === 'on');
$('#s-text').onchange = e => HRS.setSetting('textSize', e.target.value);
$('#t-sound').onclick = () => { if (!HRS.settings().sound) { $('#dataMsg').textContent = ''; HRS.setSetting('sound', true); $('#s-sound').checked = true; } HRS.sfx('milestone'); };
$('#t-vib').onclick = () => HRS.buzz('success');
$('#resetTut').onclick = () => { ['hrs_tut_viksit_done', 'hrs_tut_sdg_done'].forEach(HRS.store.del); $('#dataMsg').textContent = 'Tutorials will show again the next time you start each game.'; };
$('#wipe').onclick = () => confirmDlg('Delete saves & scores?', 'This removes in-progress games, best scores and tutorial progress from this device. Settings are kept. This cannot be undone.', 'Delete', () => {
  ['hrs_save_viksit_v1', 'hrs_save_sdg_v1', 'hrs_best_viksit_v1', 'sdg2030_best_v1', 'hrs_tut_viksit_done', 'hrs_tut_sdg_done'].forEach(HRS.store.del);
  $('#dataMsg').textContent = 'Deleted. Your device holds no game data now.';
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
  row.querySelector('small').textContent = HRS.isIOS ? 'Not available on iPhone/iPad browsers (Apple does not allow web vibration).' : 'Not supported on this device or browser.';
}
route();
})();
