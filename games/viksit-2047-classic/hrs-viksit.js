/* Viksit Bharat 2047: app layer (autosave/resume, tutorial, glossary, sources, a11y, sound).
   Loaded after the original game script; shares its global scope. Game design and content unchanged. */
'use strict';
(function () {
const SAVE_KEY = 'hrs_save_viksit_v1', BEST_KEY = 'hrs_best_viksit_v1', TUT_KEY = 'hrs_tut_viksit_done';
const UI = { phase: 'event', beforeIdx: -1, tourPending: false, restoring: false };
const ALL_EVENTS = () => [...EVENTS, DISCOM_CRISIS];

/* ---------- modal semantics ---------- */
const _modal = modal;
modal = function (html, dismiss) {
  _modal((dismiss ? '<button type="button" class="mclose" data-close aria-label="Close">✕</button>' : '') + html);
  $('mcard').dataset.dismiss = dismiss ? '1' : '';
};
HRS.dialog({ overlay: $('modal'), box: $('mcard'), isOpen: () => !$('modal').classList.contains('hidden'),
  isDismissible: () => $('mcard').dataset.dismiss === '1', close: () => closeModal() });
document.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModal(); });

/* ---------- save / resume ---------- */
function save() {
  if (!S || UI.restoring || UI.phase === 'over') return;
  const o = Object.assign({}, S, { event: S.event ? S.event.id : null, newMs: S.newMs.map(m => m.id), missedMs: S.missedMs.map(m => m.id) });
  HRS.store.set(SAVE_KEY, { v: 1, t: Date.now(), phase: UI.phase, beforeIdx: UI.beforeIdx, tourPending: UI.tourPending, S: o });
}
let saveQ = 0; const queueSave = () => { clearTimeout(saveQ); saveQ = setTimeout(save, 0); };
function restore(rec) {
  const s = rec.S;
  s.event = s.event ? ALL_EVENTS().find(e => e.id === s.event) || null : null;
  const ms = id => MILESTONES.find(m => m.id === id);
  s.newMs = (s.newMs || []).map(ms).filter(Boolean); s.missedMs = (s.missedMs || []).map(ms).filter(Boolean);
  return s;
}
window.HRSViksit = { save, SAVE_KEY, BEST_KEY, TUT_KEY, UI };

/* ---------- wrap game flow (function declarations are global & re-assignable) ---------- */
const _showEvent = showEvent;
showEvent = function () {
  UI.phase = 'event'; _showEvent(); HRS.sfx('event'); queueSave();
  HRS.announce('Breaking news: ' + S.event.t);
};
const _enactTerm = enactTerm;
enactTerm = function (s) { HRS.sfx('whoosh'); HRS.buzz('medium'); return _enactTerm(s); };
const _reportCard = reportCard;
reportCard = function (before) {
  UI.phase = 'report'; UI.beforeIdx = S.history.indexOf(before);
  _reportCard(before);
  if (S.over) recordBest();
  queueSave();
};
function recordBest() {
  const r = scoreGame(S), b = HRS.store.get(BEST_KEY);
  const rec = { score: Math.round(r.total), grade: r.grade, title: S.lostMandate ? 'Voted out in ' + S.year : r.title, seed: S.seed, date: new Date().toISOString().slice(0, 10), plays: ((b && b.plays) || 0) + (UI.counted ? 0 : 1) };
  UI.counted = true;
  if (!b || rec.score > b.score) HRS.store.set(BEST_KEY, rec); else HRS.store.set(BEST_KEY, Object.assign(b, { plays: rec.plays }));
}
const _endScreen = endScreen;
endScreen = function () {
  UI.phase = 'over'; recordBest();
  _endScreen();
  $('mcard').dataset.dismiss = '1';
  $('mcard').insertAdjacentHTML('afterbegin', '<button type="button" class="mclose" data-close aria-label="Close verdict">✕</button>');
  $('mcard').insertAdjacentHTML('beforeend', '<p class="muted" style="text-align:center">Closed this by mistake? Tap <b>“Game over: see the verdict”</b> on the Plan tab to view it again.</p>');
  HRS.sfx('end'); HRS.buzz('success');
  HRS.store.del(SAVE_KEY);
};
const _renderPlan = renderPlan;
renderPlan = function () {
  _renderPlan();
  document.querySelectorAll('.pcard').forEach(c => c.setAttribute('aria-pressed', c.classList.contains('sel') ? 'true' : 'false'));
  const sel = document.querySelector('#tariffRadios input:checked'); document.querySelectorAll('#tariffRadios label').forEach(l => l.classList.toggle('sel', l.contains(sel)));
};
const _showTab = showTab;
showTab = function (name) {
  _showTab(name);
  document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === name ? 'true' : 'false'));
};
const _startGame = startGame;
startGame = function (seed) {
  UI.counted = false; UI.phase = 'event';
  if (!HRS.store.get(TUT_KEY)) { _startGame(seed); closeModal(); showIntro(); return; }
  _startGame(seed); queueSave();
};

/* save after every move: registered after the game's own handlers, so it runs after them */
document.addEventListener('click', e => {
  const t = e.target.closest('button,.pcard,[data-tip],[data-open]'); if (!t) return;
  if (t.dataset.choice !== undefined) { UI.phase = 'plan'; HRS.sfx('select'); HRS.buzz('light'); if (UI.tourPending) { UI.tourPending = false; setTimeout(runTour, 250); } }
  else if (t.dataset.k || t.dataset.b) { HRS.sfx('tap'); HRS.buzz('light'); }
  else if (t.classList.contains('pcard')) { HRS.sfx('select'); HRS.buzz('light'); }
  else if (t.id === 'nextBtn') HRS.sfx('tap');
  if (t.dataset.open === 'sources') showSources();
  else if (t.dataset.open === 'glossary' || t.id === 'glossBtn') showGlossary();
  else if (t.dataset.open === 'tutorial') { showTab('plan'); runTour(); }
  queueSave();
});
document.addEventListener('change', queueSave);
document.addEventListener('keydown', e => { if (e.key === 'Escape') hideTip(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
window.addEventListener('pagehide', save);

/* ---------- a11y: keyboard-reachable cards & source triggers, tabs, header height ---------- */
HRS.clickables('.pcard,[data-tip]', el => el.classList.contains('pcard') ? null : el.classList.contains('kpi') ? null : 'Show source');
document.querySelectorAll('.tabs button').forEach(b => { b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', b.classList.contains('on') ? 'true' : 'false'); b.setAttribute('aria-controls', 'tab-' + b.dataset.tab); });
document.querySelectorAll('.tab').forEach(t => t.setAttribute('role', 'tabpanel'));
const hdr = document.querySelector('header');
const setH = () => document.documentElement.style.setProperty('--hdrH', (getComputedStyle(hdr).position === 'sticky' ? hdr.offsetHeight : 0) + 'px');
if (window.ResizeObserver) new ResizeObserver(setH).observe(hdr); setH(); window.addEventListener('resize', setH);
HRS.onBack(() => { if (!$('tip').classList.contains('hidden')) { hideTip(); return true; } return false; });

/* ---------- Sources page (built from the game's own cited FACTS) ---------- */
const SRC_TITLES = { gdp: 'GDP', pc: 'GDP per capita & income thresholds', growth: 'Real GDP growth', debt: 'Public debt', niti: 'Viksit Bharat @2047 aspiration', nf: 'Non-fossil capacity', t500: '500 GW non-fossil target', cap: 'Installed capacity', peak: 'Peak demand & projections', atc: 'AT&C losses', gap: 'ACS–ARR gap', storage: 'Battery & pumped storage', coalgen: 'Coal share of generation', energy: 'Energy requirement', nuc: 'Nuclear target', ndc: 'Climate pledges (NDC)', ger: 'Higher-education GER', imr: 'Infant mortality & life expectancy', internet: 'Internet subscribers', food: 'Foodgrain production', punjab: 'Punjab power demand', tx: 'Transmission plan', powerdesk: 'Power desk levers', gov: 'Governance index', approval: 'Public approval', farm: 'Farm income index' };
function showSources() {
  const real = Object.entries(FACTS).filter(([, f]) => f.u), game = Object.entries(FACTS).filter(([, f]) => !f.u);
  const li = ([k, f]) => `<li><b>${SRC_TITLES[k] || k}</b>: ${f.t}<div class="s">Source: ${f.u ? `<a href="${f.u}" target="_blank" rel="noopener">${f.s}</a>` : f.s}</div></li>`;
  modal(`<h2>🔗 Sources</h2><p class="muted">Baselines are real (mostly mid-2026) and cited below. All future dynamics, costs, lags and scores are invented game mechanics, simplified for play. This is an educational simulation, not a forecast. It is not affiliated with or endorsed by the Government of India or any agency listed.</p>
  <h3>Real-world baselines &amp; official targets</h3><ol class="srclist">${real.map(li).join('')}</ol>
  <h3>Game constructs</h3><ul class="srclist">${game.map(li).join('')}</ul>
  <button class="btn" data-close>Close</button>`, true);
}

/* ---------- Glossary ---------- */
const GLOSSARY = [
  ['AT&C losses', 'Aggregate Technical & Commercial losses: the share of electricity that is lost in wires or never billed and paid for. Lower is better.'],
  ['ACS–ARR gap', 'Average Cost of Supply minus Average Revenue Realised, in ₹ per kWh. A positive gap means discoms lose money on each unit they sell.'],
  ['Discom', 'Distribution company: the utility that delivers power to homes and farms and collects the bills.'],
  ['Genco', 'Generation company: the owner of the power plants that sells electricity to discoms.'],
  ['Grid adequacy', 'Whether available supply covers demand at the tightest moment (evening peak, midday, or over the whole year). 100%+ means the lights stay on.'],
  ['Firm capacity', 'Power you can count on when needed. Coal and nuclear are firm; solar is not firm after sunset; wind only partly.'],
  ['Evening peak', 'The daily demand peak after sunset, when solar output has fallen but ACs and lights are on.'],
  ['Curtailment', 'Solar or wind power that is wasted because the grid can\'t carry or store it.'],
  ['Storage (BESS / pumped hydro)', 'Battery Energy Storage Systems and pumped-storage hydro move cheap midday solar to the evening peak.'],
  ['Transmission / green corridors', 'High-voltage lines that carry renewable power from sunny and windy zones to cities.'],
  ['GW, GWh, BU', 'GW (gigawatt) measures power capacity at an instant. GWh measures energy over time. BU (billion units) = billion kWh = TWh of annual energy.'],
  ['Non-fossil capacity', 'Solar, wind, hydro, bio-power and nuclear: power sources that don\'t burn coal, oil or gas.'],
  ['ToD tariff', 'Time-of-Day pricing: cheaper power at sunny noon, pricier in the evening, nudging demand to shift.'],
  ['RDSS', 'Revamped Distribution Sector Scheme: India\'s programme to cut discom losses (target 12–15% AT&C) and close the ACS–ARR gap.'],
  ['NDC', 'Nationally Determined Contribution: India\'s climate pledge under the Paris Agreement (emissions intensity cuts, non-fossil share, net zero by 2070).'],
  ['Emissions intensity', 'Greenhouse gas emitted per unit of GDP. Cutting it means growing while polluting less per rupee.'],
  ['GDP & per capita', 'Gross Domestic Product: the value of everything the economy produces in a year. Per capita = per person.'],
  ['Real growth', 'GDP growth after removing inflation.'],
  ['NITI Aayog', 'The Government of India\'s policy think tank. Its Viksit Bharat @2047 paper aims for a US$30 trillion economy and US$18,000 per capita income.'],
  ['UMIC / high income', 'World Bank income groups based on income per person. India is lower-middle income today.'],
  ['Debt % of GDP', 'Government debt relative to the size of the economy. High debt costs interest and can slow growth.'],
  ['GER', 'Gross Enrolment Ratio in higher education: students enrolled per 100 people of college age (18–23). NEP 2020 aims for 50 by 2035.'],
  ['IMR', 'Infant Mortality Rate: deaths of babies under one year per 1,000 live births.'],
  ['PLI', 'Production-Linked Incentive: payments to manufacturers tied to how much they produce in India.'],
  ['DPI', 'Digital Public Infrastructure: open digital rails such as Aadhaar, UPI and data exchanges.'],
  ['Lag', 'Years before an investment pays off in the game (education ~4, transmission ~3, nuclear ~6).'],
  ['Diminishing returns', 'Each extra budget point adds a little less than the one before: 8 points is not twice as good as 4.'],
  ['Synergy', 'A bonus when systems reinforce each other, e.g. infrastructure plus reliable power supercharges industry.'],
];
function showGlossary() {
  modal(`<h2>📖 Glossary</h2><p class="muted">Plain-language meanings of the terms used in this game.</p><dl class="gloss">${GLOSSARY.map(([t, d]) => `<dt>${t}</dt><dd>${d}</dd>`).join('')}</dl><button class="btn" data-close>Close</button>`, true);
}

/* ---------- Onboarding: intro + guided first term ---------- */
function showIntro() {
  modal(`<div class="big">🇮🇳</div><h2>Welcome, Planner</h2>
  <p>It's 2026. You are India's national planner, and you have <b>seven 3-year terms</b> to steer the country towards a developed <b>Viksit Bharat by 2047</b>.</p>
  <ul class="notes"><li>📰 Each term opens with a <b>news event</b>. Pick a response.</li><li>💰 Spend your <b>budget points</b> on sectors and power.</li><li>▶ <b>Enact</b> to fast-forward 3 years and see the report card.</li></ul>
  <p class="muted">Baselines are real 2026 figures; the future is a game. Keep public approval above 20%!</p>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn saf" id="tutStart" autofocus>🎓 Guide me through the first term</button><button class="btn sec" id="tutSkip">Skip tutorial</button></div>`);
  $('tutStart').onclick = () => { UI.tourPending = true; closeModal(); showEvent(); };
  $('tutSkip').onclick = () => { HRS.store.set(TUT_KEY, 1); closeModal(); showEvent(); };
}
function runTour() {
  showTab('plan');
  HRS.tour([
    { title: 'Your scoreboard', el: '#kpis', text: 'These cards track India\'s economy, power grid, climate and politics. The coloured bars show progress towards 2047 yardsticks. Tap any card (or ⓘ) to see the real-world source.' },
    { title: 'Your budget', el: '#budgetBox', text: 'Each term you get development points per year. Spend them all; unspent points are wasted. The budget grows as GDP grows.' },
    { title: 'National sectors', el: '#sectorRows', text: 'Use <b>+</b> and <b>−</b> to fund 8 sectors. Each shows its <b>lag</b> (years before it pays off). Returns diminish, so spread your bets.' },
    { title: 'Energy & power', el: '.power-group', text: 'Six levers drive the grid: solar & wind, storage, transmission, discom reform, nuclear and thermal. Watch out for the evening peak: solar sets at 6:30 pm.' },
    { title: 'Tariff stance', el: '#tariffRadios', text: 'Subsidised power is popular but strains discom finances; cost-reflective tariffs heal discoms but cost approval.' },
    { title: 'Policy card', el: '#policyCards', text: 'Pick at most one bold policy per term. Each card shows its upsides (green) and costs (red).' },
    { title: 'Borrowing', el: '[data-b="1"]', text: 'Need more points? Borrow, but debt above ~85% of GDP drags growth.' },
    { title: 'Cabinet secretary\'s brief', el: '#advisorPanel', text: 'Your adviser flags problems: shortfalls, curtailment, discom stress, slipping targets. Read it before you enact.' },
    { title: 'Enact the plan', el: '#enactBtn', text: 'When the budget is fully spent, tap <b>Enact</b> to simulate 3 years. You\'ll get a report card and milestone celebrations.' },
    { title: 'Explore the desks', el: '#tabs', text: '<b>Power Desk</b> shows the grid in detail, <b>Charts</b> your trajectory, <b>2047 Targets</b> the yardsticks. The 📖 button explains jargon such as AT&C or ACS–ARR gap.' },
  ], { label: 'Guided first term', onDone: () => { HRS.store.set(TUT_KEY, 1); queueSave(); } });
}

/* ---------- boot ---------- */
const qs = new URLSearchParams(location.search);
if (qs.get('new')) HRS.store.del(SAVE_KEY);
const rec = !qs.get('new') && !qs.get('seed') ? HRS.store.get(SAVE_KEY) : null;
if (rec && rec.v === 1 && rec.S) {
  try {
    UI.restoring = true;
    S = restore(rec); lastKpi = {}; ['charts', 'powerCharts'].forEach(id => { $(id).dataset.built = ''; });
    UI.phase = rec.phase; UI.beforeIdx = rec.beforeIdx; UI.tourPending = !!rec.tourPending;
    renderAll(false);
    UI.restoring = false;
    if (rec.phase === 'event' && S.event) showEvent();
    else if (rec.phase === 'report' && rec.beforeIdx >= 0 && S.history[rec.beforeIdx]) reportCard(S.history[rec.beforeIdx]);
    else if (S.over) endScreen();
    toast(`💾 Welcome back! Your game was restored (${S.year}, term ${Math.min(S.term + 1, NTERMS)} of ${NTERMS}).`);
  } catch (err) { console.warn('save restore failed', err); UI.restoring = false; HRS.store.del(SAVE_KEY); startGame(); }
} else {
  startGame(qs.get('seed') ? +qs.get('seed') : undefined);
}
})();
