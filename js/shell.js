/* Launcher: home, about, settings, privacy. */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SDG_WHEN = t => ['Jan', 'Apr', 'Jul', 'Oct'][t % 4] + ' ' + (2026 + Math.floor(t / 4));
const GAMES = [
  { id: 'viksit', cls: 'g1', icon: '🇮🇳', path: 'games/viksit-2047/index.html', title: 'Viksit Bharat 2047', sub: 'Plan India\'s road to 2047', thumb: 'assets/thumbs/viksit-2047.jpg', badge: '✨ New edition',
    desc: 'Seven 3-year terms from 2026 to 2047. React to the news, drop coins on sectors and the national power grid, unlock specialisation hubs, and chase NITI Aayog\'s US$30 trillion aspiration with real 2026 data.',
    time: '20–30 min', turns: '7 terms', age: 'Ages 13+',
    learn: ['How growth, infrastructure, skills and energy reinforce each other', 'Why the evening peak, storage and grid lines make or break a clean grid', 'Trade-offs between public approval, debt and long-term investment', 'Reading real numbers: IMF, CEA, MNRE and NITI Aayog targets'],
    save: 'hrs_save_viksit_v2', best: 'hrs_best_viksit_v2',
    saveLabel: s => `${s.S.year}, term ${Math.min(s.S.term + 1, 7)} of 7`,
    bestLabel: b => `🏆 Best: <b>${esc(b.score)}</b>/100 · grade <b>${esc(b.grade)}</b>${b.title ? ` · ${esc(b.title)}` : ''}`,
    classic: { path: 'games/viksit-2047-classic/index.html', save: 'hrs_save_viksit_v1', label: 'The Planner\'s Desk' } },
  { id: 'sdg', cls: 'g2', icon: '🌍', path: 'games/sdg-2030/index.html', title: 'SDG 2030', sub: 'Heal the World', thumb: 'assets/thumbs/sdg-2030.jpg', badge: '✨ New edition',
    desc: 'One choice per season, 20 seasons to 2030. Pick one of three cards, watch a tiny planet heal or decay, and fill all 17 Sustainable Development Goals. Quick wins pay now, but their storms land later.',
    time: '5–8 min', turns: '20 seasons', age: 'Ages 10+',
    learn: ['The 17 Sustainable Development Goals, one coloured dot each', 'Short-term wins vs delayed consequences', 'Balancing money, happiness, the planet and peace', 'Why sustainable choices pay back over time'],
    save: 'hrs_save_sdg_v2', best: 'hrs_best_sdg_v2',
    saveLabel: s => `${SDG_WHEN(Math.min(s.S.turn, 19))}, season ${Math.min(s.S.turn + 1, 20)} of 20`,
    bestLabel: b => `🏆 Best: <b>${esc(b.score)}</b>/17 goals${b.title ? ` · ${esc(b.title)}` : ''}`,
    classic: { path: 'games/sdg-2030-classic/index.html', save: 'hrs_save_sdg_v1', label: 'Race to the Goals' } },
];

function renderGames() {
  $('#games').innerHTML = GAMES.map(g => {
    const save = HRS.store.get(g.save), best = HRS.store.get(g.best);
    const hasSave = save && save.S && !save.S.over;
    const cs = HRS.store.get(g.classic.save), classicSave = cs && cs.S && !cs.S.over;
    const bestHtml = best ? `<div class="best">${g.bestLabel(best)}</div>` : '<div class="best none">No score yet. Your first run awaits.</div>';
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
        <p class="classic"><a href="${g.classic.path}${classicSave ? '?continue=1' : ''}">🕰️ Classic edition: ${g.classic.label}${classicSave ? ' · continue saved game' : ''}</a></p>
      </div></article>`;
  }).join('');
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-new]'); if (!a) return;
  const g = GAMES.find(x => x.id === a.dataset.new); const save = HRS.store.get(g.save);
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
