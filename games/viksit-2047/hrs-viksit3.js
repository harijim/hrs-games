/* Viksit Bharat 2047 (v3: School / College / Expert levels): app layer for Harpreet Raj Singh Games.
   Autosave/resume (also adopts a v2 save once), per-level best score, sound & haptics, dialog semantics, back button, glossary.
   Loaded after the game script and shares its global scope. Game design and content are unchanged. */
'use strict';
(function () {
const SAVE_KEY = 'hrs_save_viksit_v3', V2_SAVE = 'hrs_save_viksit_v2', V2_IMPORTED = 'hrs_viksit_v2_imported';
// best per level (scores are only comparable within a level); College shares the v2 record, since it is the same model
const bestKey = m => m === 'school' || m === 'expert' ? 'hrs_best_viksit_v3_' + m : 'hrs_best_viksit_v2';
const BEST_KEY = bestKey('college');
const ALL_EVENTS = () => [...EVENTS, ...SCHOOL_EVENTS, ...DILEMMAS, DISCOM_CRISIS];
const UI = { restoring: false, beforeIdx: -1, counted: false };
const hubIds = a => (a || []).map(h => h.id), hubObjs = a => (a || []).map(id => HUBS.find(h => h.id === id)).filter(Boolean);
const msObjs = a => (a || []).map(id => MILESTONES.find(m => m.id === id)).filter(Boolean);

/* ---------- save / resume (S holds a few object references; store ids instead) ---------- */
function save() {
  if (!S || UI.restoring || phase === 'intro' || phase === 'end') return;
  const o = Object.assign({}, S, { cfg: undefined, event: S.event ? S.event.id : null, newMs: S.newMs.map(m => m.id), missedMs: S.missedMs.map(m => m.id), newHubs: hubIds(S.newHubs), lostHubs: hubIds(S.lostHubs) });
  HRS.store.set(SAVE_KEY, { v: 3, t: Date.now(), phase, mode: S.mode, beforeIdx: UI.beforeIdx, S: o });
}
let saveQ = 0; const queueSave = () => { clearTimeout(saveQ); saveQ = setTimeout(save, 0); };
function restore(rec) {
  const s = rec.S;
  s.event = s.event ? ALL_EVENTS().find(e => e.id === s.event) || null : null;
  s.newMs = msObjs(s.newMs); s.missedMs = msObjs(s.missedMs); s.newHubs = hubObjs(s.newHubs); s.lostHubs = hubObjs(s.lostHubs);
  return normState(s);  // fills v3 fields (mode defaults to College for v2 saves) and re-links cfg
}
function recordBest() {
  if (UI.counted) return; UI.counted = true;
  const key = bestKey(S.mode), r = scoreGame(S), b = HRS.store.get(key);
  const rec = { score: Math.round(r.total), grade: r.grade, title: S.lostMandate ? 'Voted out in ' + S.year : r.title, mode: S.mode, seed: S.seed, date: new Date().toISOString().slice(0, 10), plays: ((b && b.plays) || 0) + 1 };
  HRS.store.set(key, !b || rec.score > b.score ? rec : Object.assign(b, { plays: rec.plays }));
}
window.HRSViksit3 = { save, SAVE_KEY, BEST_KEY, bestKey, UI };

/* ---------- wrap game flow (global function declarations are re-assignable) ---------- */
const _showEvent = showEvent;
showEvent = function () { _showEvent(); HRS.sfx('event'); HRS.announce('Breaking news: ' + S.event.t); queueSave(); };
const _showPlan = showPlan;
showPlan = function () { _showPlan(); queueSave(); };
const _enactTerm = enactTerm;
enactTerm = function (s) { HRS.sfx('whoosh'); HRS.buzz('medium'); return _enactTerm(s); };
const _showResult = showResult;
showResult = function (a) {
  UI.beforeIdx = S.history.indexOf(a); _showResult(a);
  if (S.newMs.length || S.newHubs.length) { HRS.sfx('milestone'); HRS.buzz('success'); } else HRS.sfx('good');
  if (S.over) recordBest();
  queueSave();
};
const _showEnd = showEnd;
showEnd = function () { recordBest(); _showEnd(); HRS.sfx('end'); HRS.buzz('success'); HRS.store.del(SAVE_KEY); };
const _startGame = startGame;
startGame = function (seed, skipIntro, mode) { UI.counted = false; UI.beforeIdx = -1; _startGame(seed, skipIntro, mode); queueSave(); };
const _toast = toast;
toast = function (msg, bad, ms) { _toast(msg, bad, ms); if (bad) { HRS.sfx('bad'); HRS.buzz('warning'); } HRS.announce(String(msg).replace(/<[^>]+>/g, '')); };

/* glossary inside the game's own Help sheet (plain-language jargon, national scope) */
const GLOSSARY = [
  ['Grid adequacy', 'Whether supply covers demand at the tightest moment (evening peak, midday, or over the whole year). 100%+ means the lights stay on.'],
  ['Evening peak', 'The daily demand peak after sunset, when solar output has fallen but ACs and lights are on.'],
  ['Firm capacity', 'Power you can count on when needed: coal, gas, nuclear, hydro and storage. Solar is not firm after sunset; wind only partly.'],
  ['Curtailment', 'Solar or wind power that is wasted because the grid can\'t carry or store it.'],
  ['Storage (BESS / pumped hydro)', 'Batteries and pumped-storage hydro move cheap midday solar to the evening peak.'],
  ['Transmission / grid lines', 'High-voltage lines that carry renewable power from sunny and windy zones to cities.'],
  ['Discom', 'Distribution company: the utility that delivers power to homes and farms and collects the bills.'],
  ['AT&C losses', 'Aggregate Technical & Commercial losses: power lost in wires or never billed and paid for. Lower is better.'],
  ['ACS–ARR gap', 'Average Cost of Supply minus Average Revenue Realised, in ₹ per kWh. A positive gap means discoms lose money on each unit.'],
  ['Tariff stance', 'How electricity is priced: cheap (subsidised), fair, or cost-true. Cheap power is popular but strains discoms.'],
  ['GW, GWh, BU', 'GW measures power at an instant; GWh measures energy over time; BU (billion units) = billion kWh of annual energy.'],
  ['Non-fossil capacity', 'Solar, wind, hydro, bio-power and nuclear: sources that don\'t burn coal, oil or gas.'],
  ['Emissions intensity', 'Greenhouse gas emitted per unit of GDP. Cutting it means growing while polluting less per rupee.'],
  ['NDC', 'Nationally Determined Contribution: India\'s climate pledge under the Paris Agreement.'],
  ['GDP & per capita', 'Gross Domestic Product: the value of everything the economy produces in a year. Per capita = per person.'],
  ['NITI Aayog', 'The Government of India\'s policy think tank. Its Viksit Bharat @2047 paper aims for a US$30 trillion economy and US$18,000 per capita income.'],
  ['Debt % of GDP', 'Government debt relative to the size of the economy. High debt costs interest and can slow growth.'],
  ['GER', 'Gross Enrolment Ratio in higher education: students enrolled per 100 people of college age. NEP 2020 aims for 50 by 2035.'],
  ['IMR', 'Infant Mortality Rate: deaths of babies under one year per 1,000 live births.'],
  ['Hubs', 'Game mechanic: keep funding a combination of sectors and a hub switches on, boosting growth and your final score.'],
  ['Lag', 'Years before an investment pays off in the game (skills ~4, grid lines ~3, nuclear ~6).'],
];
const _helpSheet = helpSheet;
helpSheet = function () {
  _helpSheet();
  const row = $('sheetBody').querySelector('.row2');
  if (row && !kid()) row.insertAdjacentHTML('beforebegin', `<details class="x"><summary>📖 Glossary</summary><div><dl class="hrs-gloss">${GLOSSARY.map(([t, d]) => `<dt>${t}</dt><dd>${d}</dd>`).join('')}</dl></div></details>`);
  $('sheetBody').insertAdjacentHTML('beforeend', `<div class="hrs-links"><a href="../../index.html">🏠 All games</a><a href="../viksit-2047/">✨ Newest edition</a><a href="../viksit-2047-v2/">v2 edition</a><a href="../viksit-2047-classic/">Classic edition</a><a href="../../about.html">About &amp; disclaimers</a><a href="../../privacy.html">Privacy</a></div>
  <p class="mut center" style="font-size:.78rem">Educational simulation, not a forecast. Not affiliated with or endorsed by the Government of India.</p>`);
};

/* ---------- sound/haptics for taps; save after every move (registered after the game's own handlers) ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('button,.tile,.pcard'); if (!t) return;
  if (t.dataset.choice !== undefined) { HRS.sfx('select'); HRS.buzz('light'); }
  else if (t.dataset.k || t.dataset.b) { HRS.sfx('tap'); HRS.buzz('light'); }
  else if (t.classList.contains('pcard') || t.dataset.tariff) { HRS.sfx('select'); HRS.buzz('light'); }
  else if (t.id === 'nextBtn' || t.id === 'startBtn' || t.classList.contains('mode')) HRS.sfx('tap');
  queueSave();
});
document.addEventListener('keydown', queueSave);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
window.addEventListener('pagehide', save);

/* ---------- a11y: bottom sheet is a dialog; source triggers are keyboard-reachable; back button ---------- */
HRS.dialog({ overlay: $('sheet'), box: $('sheetCard'), isOpen: () => !$('sheet').classList.contains('hidden'), isDismissible: () => true, close: () => closeSheet() });
HRS.clickables('span.src[data-tip],.kpi[data-tip]', () => 'Show source');
HRS.onBack(() => { if (!$('tip').classList.contains('hidden')) { hideTip(); return true; } return false; });
$('confetti').setAttribute('aria-hidden', 'true');

/* ---------- boot ---------- */
const qs = new URLSearchParams(location.search);
if (qs.get('new')) { HRS.store.del(SAVE_KEY); const v2 = HRS.store.get(V2_SAVE); if (v2 && v2.t) HRS.store.set(V2_IMPORTED, v2.t); } // a v2 game is not re-offered after New (the v2 edition keeps it)
let rec = !qs.get('new') && !qs.get('seed') && !qs.get('mode') ? HRS.store.get(SAVE_KEY) : null;
if (!rec && !qs.get('new') && !qs.get('seed') && !qs.get('mode')) { // adopt an unfinished v2 game once (the v2 edition keeps its copy)
  const v2 = HRS.store.get(V2_SAVE);
  if (v2 && v2.v === 2 && v2.S && !v2.S.over && v2.t > (HRS.store.get(V2_IMPORTED) || 0)) { rec = v2; HRS.store.set(V2_IMPORTED, v2.t); }
}
if (rec && (rec.v === 3 || rec.v === 2) && rec.S) {
  try {
    UI.restoring = true;
    S = restore(rec); lastStat = {}; coached = true; UI.beforeIdx = rec.beforeIdx;
    ['sv-gdp', 'sv-adq', 'sv-nf', 'sv-ap', 'hYear'].forEach(id => { if ($(id)) delete $(id)._v; });
    renderTop(false);
    if (rec.phase === 'event' && S.event) _showEvent();
    else if (rec.phase === 'result' && S.history[rec.beforeIdx]) _showResult(S.history[rec.beforeIdx]);
    else if (S.over) _showEnd();
    else _showPlan();
    UI.restoring = false;
    _toast(`💾 Welcome back! ${S.cfg.i} ${S.cfg.n} game restored: ${S.year}, term ${Math.min(S.term + 1, NTERMS)} of ${NTERMS}.`);
    if (rec.v === 2) save();
  } catch (err) { console.warn('save restore failed', err); UI.restoring = false; HRS.store.del(SAVE_KEY); startGame(); }
} else {
  startGame(qs.get('seed') ? +qs.get('seed') : undefined, qs.has('play'), qs.get('mode') || undefined);
}
})();
