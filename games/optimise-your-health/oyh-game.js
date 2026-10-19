/* Optimise Your Health: engine, UI and HRS app layer. © 2026 Harpreet Raj Singh.
   Engine = pure state transitions on S (seeded, saveable JSON). UI = render(S). App layer = autosave, best score, language, a11y. */
'use strict';
(function () {
const D = window.OYH_DATA, TR = window.OYH_I18N || {};
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = v => Math.round(v * 10) / 10;
const HAS_HRS = !!window.HRS;
const store = HAS_HRS ? HRS.store : { get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };
const sfx = n => HAS_HRS && HRS.sfx(n), buzz = n => { if (HAS_HRS) return HRS.buzz(n); try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate({ light: 10, medium: 20, success: [15, 40, 15], warning: [30, 60, 30] }[n] || 10); } catch (e) {} }, announce = m => HAS_HRS && HRS.announce(String(m).replace(/<[^>]+>/g, ''));
const RM = () => HAS_HRS ? HRS.reduceMotion() : matchMedia('(prefers-reduced-motion: reduce)').matches;
const QS = new URLSearchParams(location.search), FAST = QS.has('fast');

/* ================= i18n: English from the data + UI table; हिन्दी / ਪੰਜਾਬੀ from oyh-i18n.js ================= */
const LANGS = ['en', 'hi', 'pa'], LANG_LABEL = { en: 'English', hi: 'हिन्दी', pa: 'ਪੰਜਾਬੀ' };
const EN = {
  'ui.brand': 'Optimise Your Health', 'ui.title': 'Optimise Your Health', 'ui.sub': 'for a long, healthy and fun life',
  'ui.pitch': 'Spend one shared pool of ⚡ energy across six pillars of life. No single right answer: any steady, joyful balance can win.',
  'ui.loop1': 'Event', 'ui.loop2': 'Plan your week', 'ui.loop3': 'See the ripple', 'ui.pick': 'Who\'s playing?',
  'ui.cont': 'Continue', 'ui.how': 'How to play', 'ui.new': 'New game', 'ui.best': 'Best', 'ui.weeks': '{n} weeks', 'ui.last': 'Last played',
  'ui.disc': 'Educational game, not medical advice. It never diagnoses or prescribes. For health concerns, see a qualified doctor.',
  'ui.by': 'A game by <b>Harpreet Raj Singh</b>™ · SDG 3: Good Health and Well-being',
  'ui.week': 'Week {n} of {T}', 'ui.wkShort': 'Wk {n}/{T}', 'ui.thisWeek': 'This week', 'ui.season': 'Season',
  'ui.vitals': 'Next-day readout', 'ui.pillars': 'Your six pillars', 'ui.pool': 'Left this week',
  'ui.choose': 'How do you respond?', 'ui.cantAfford': 'Not enough left', 'ui.letPass': 'Let it pass (do nothing)',
  'ui.plan': 'Plan the rest of your week', 'ui.planHint': 'Tap habits to spend what you have left. Unused points are simply rest.',
  'ui.all': 'All', 'ui.endWeek': 'End week', 'ui.next': 'Next week', 'ui.finish': 'See my report card', 'ui.change': 'Change',
  'ui.youChose': 'You chose', 'ui.recap': 'Week {n} recap', 'ui.ripples': 'Ripples this week', 'ui.later': 'Something from earlier caught up',
  'ui.gameFx': 'Game effects', 'ui.dyk': 'Did you know?', 'ui.realFact': 'Real fact', 'ui.tradNote': 'Tradition note', 'ui.source': 'Source',
  'ui.pointsNote': 'Pillar, vital and pool numbers are simplified game points, not medical measurements.',
  'ui.tired': '😴 Tired tax: sleep debt is high, so most habits cost +1 ⚡ this week.',
  'ui.snappy': '😣 Stress tax: you feel scattered, so Mind and Heart habits cost +1 ⚡.',
  'ui.later?': '⏳ may have a later effect', 'ui.once': 'once per game', 'ui.done': 'done',
  'ui.curve': 'Curveball', 'ui.quiz': 'Quick quiz', 'ui.quizSub': 'From the facts you have seen. A right answer gives +1 ⚡ next week.',
  'ui.right': 'Correct! +1 ⚡ next week.', 'ui.wrong': 'Not quite. The answer: {a}.', 'ui.hint': 'Hint', 'ui.skip': 'Skip',
  'ui.report': 'Report card', 'ui.score': 'Long-life wellbeing score', 'ui.outOf': 'out of 100', 'ui.balance': 'Pillar balance',
  'ui.helped': 'What helped', 'ui.tips': 'Gentle tips for next time', 'ui.facts': 'Facts you discovered', 'ui.noHelped': 'Try building a habit two or more weeks in a row; repeated habits count here.',
  'ui.keepGoing': 'Your balance held up well. Keep enjoying what works for you.', 'ui.newBest': 'New best!', 'ui.prevBest': 'Your best: {s}',
  'ui.again': 'Play again', 'ui.otherMode': 'Change mode', 'ui.allGames': 'All games', 'ui.sustain': 'Sustainability',
  'ui.archetype': 'Your style: {a}', 'ui.optional': 'optional', 'ui.welcome': '💾 Welcome back! {m}, week {n} of {T}.',
  'ui.newConfirm': 'Start a new game?', 'ui.newConfirmP': 'Your saved game ({l}) will be replaced.', 'ui.cancel': 'Cancel', 'ui.startNew': 'Start new',
  'ui.close': 'Close', 'ui.language': 'Language', 'ui.home': 'Home: all games', 'ui.help': 'How to play',
  'ui.coachE': 'Each week starts with an event. Pick a response: it costs ⚡ energy from this week\'s pool.',
  'ui.coachP': 'Now spend what is left on habits. Pillars affect each other: poor sleep makes habits cost more, family time buffers stress, overtime drains sleep.',
  'ui.gotIt': 'Got it',
  'ui.helpH1': 'How to play', 'ui.help1': '<b>1. Event.</b> Life throws a card at you: a festival, an exam, a deadline. Choose how to respond.',
  'ui.help2': '<b>2. Plan.</b> Spend the rest of your ⚡ energy on habits across six pillars.',
  'ui.help3': '<b>3. Ripple.</b> See next-day energy, mood, immunity and focus. Some effects arrive weeks later.',
  'ui.help4': '<b>4. Report card.</b> Any steady, joyful balance can score well. Spirit is optional but gives a calm bonus.',
  'ui.helpH2': 'How the pillars interact (game rules)',
  'ui.helpI': '<li>Sleep debt makes most habits cost more Energy and lowers Focus.</li><li>Family and friends build a "bond bank" that buffers stress.</li><li>Overtime and late-night screens borrow from sleep.</li><li>Festive feasts are fun, with a possible energy dip next week.</li><li>Movement builds a fitness base that pays back slowly.</li><li>High stress drags down Mind, Heart, Fun and even Work.</li>',
  'ui.helpH3': 'Modes', 'ui.helpH4': 'Ayurveda, herbs and tradition',
  'ui.helpTrad': 'The game includes traditional Indian wellness practices such as dinacharya (daily routine), ritucharya (seasonal routine), yoga and pranayama, oil massage and kitchen herbs. They are shown as a <b>traditional system of wellness practices</b>, with sources from the Ministry of Ayush (CCRAS), WHO and the US NCCIH. Where scientific evidence is limited, the game says so. Herbs are never shown as cures.',
  'ui.helpHerb': '🌿 <b>Herbs can interact with medicines.</b> If you take any medicine, are pregnant or have a health condition, ask a doctor or qualified practitioner before using herbal products. Never replace doctors, medicines or check-ups with home remedies.',
  'ui.helpH5': 'Real facts vs game rules', 'ui.helpSep': 'Blue "Did you know?" notes are real facts with a named source. Everything else (pillar points, costs, interactions, scores) is a simplified game model, not a medical prediction.',
  'ui.helpH6': 'Disclaimer', 'ui.helpDisc': 'Optimise Your Health is an educational game. It is <b>not medical advice</b> and does not diagnose, treat or prescribe. Always consult a qualified health professional about your own health. Not affiliated with WHO, ICMR-NIN, the Ministry of Ayush or any other body cited.',
  'ui.helpH7': 'Sources', 'ui.helpH8': 'Ayurveda words', 'ui.gloss': '<dt>Dinacharya</dt><dd>Daily routine: waking early, cleansing, oil massage, exercise, regular meals and sleep.</dd><dt>Ritucharya</dt><dd>Adjusting food and routine to the six seasons (ritus).</dd><dt>Abhyanga</dt><dd>Traditional oil self-massage.</dd><dt>Pranayama</dt><dd>Yogic breathing practices.</dd><dt>Dosha (vata, pitta, kapha)</dt><dd>Ayurveda\'s traditional concept of body-mind types. Used here only for light humour; online "dosha quizzes" are not a diagnosis.</dd>',
  'ui.keys': 'Keyboard: 1–3 pick a response, Enter continues.',
  'n.tired': '😴 Sleep debt is high: next week most habits cost +1 ⚡ and Focus suffers.',
  'n.buffer': '🤝 Your bond bank absorbed some of this week\'s stress.',
  'n.spirit': '🕊️ Calm bonus: a strong Spirit pillar softened stress this week.',
  'n.burnout': '🔥 Stress is very high. Mind, Heart and Work are all feeling it.',
  'n.screens': '📱 Late-night screens are eating into sleep and Focus.',
  'n.junk': '🍟 Convenience food is piling up and dragging Energy down.',
  'n.fit': '💪 Your fitness base is paying off: steady Energy.',
  'n.season': '🥭 Seasonal food bonus: in tune with {r}.',
  'n.sickRisk': '🤧 Low immunity: a cold is more likely next week.',
  'n.injuryRisk': '⚠️ Hard training on little sleep risks a strain.',
  'n.rested': '🌙 Well rested: next week you have more ⚡ Energy.',
  'n.lowE': '🪫 Low energy readout: next week you have less ⚡.',
  'n.quiet': '🍃 A quiet week. Unused points became rest.',
  'acc.slp': '😴 sleep debt', 'acc.str': '😣 stress', 'acc.jnk': '🍟 junk load', 'acc.scr': '📱 screens', 'acc.bnd': '🤝 bond', 'acc.fit': '💪 fitness', 'acc.hyg': '🧼 hygiene', 'acc.chk': '🩺 check-up', 'acc.en': '⚡ next week', 'acc.at': '⚡ next week', 'acc.sick': '🤒 cold risk',
  'g.Ap': 'A+', 'g.A': 'A', 'g.B': 'B', 'g.C': 'C', 'g.D': 'D', 'g.E': 'Try again',
  'ui.monthsLong': 'January February March April May June July August September October November December',
};
// v3: short, visual-first copy (long explanations stay in the help sheet)
Object.assign(EN, {
  'ui.disc1': 'Not medical advice', 'ui.allGames': 'All games', 'ui.about': 'About', 'ui.privacy': 'Privacy',
  'ui.story': 'Tap for the story', 'ui.pickOne': 'Pick one', 'ui.go': 'Choose', 'ui.info': 'More info',
  'ui.suggest': 'Suggested', 'ui.undo': 'Undo', 'ui.add': 'Add', 'ui.remove': 'Remove', 'ui.basketEmpty': 'Tap habits to plan',
  'ui.drag': 'Drag ⚡ onto a habit', 'ui.noSugg': 'Nothing more fits this week', 'ui.planS': 'Your week plan',
  'ui.streak': '{n}-week growth streak!', 'ui.bloom': 'Your plant is in bloom!', 'ui.wb': 'Wellbeing', 'ui.hudTap': 'Tap for details',
  'ui.recapS': 'Week {n}', 'ui.tipsS': 'Tips', 'ui.noHelped2': 'Repeat a habit to see it here',
  'ui.pillarsS': 'Pillars', 'ui.vitalsS': 'Vitals', 'ui.sustainS': 'Sustain',
  'ui.cm.e1': 'Life happens', 'ui.cm.e2': 'Tap, then tap again or swipe → to choose', 'ui.cm.e3': 'Grow all six leaves',
  'ui.cm.p1': 'Pick a pillar', 'ui.cm.p2': 'Tap to add', 'ui.cm.p3': 'Or try a suggested plan',
  'ui.next1': 'Next', 'ui.skipTour': 'Skip', 'ui.tourAgain': 'Show the tips again',
  'hbs.sleep': 'Early to bed', 'hbs.walk': 'Walk & play', 'hbs.sport': 'Sport', 'hbs.thali': 'Home thali', 'hbs.seasonal': 'Seasonal food',
  'hbs.mindful': 'Mindful eating', 'hbs.yoga': 'Yoga & breath', 'hbs.abhyanga': 'Oil massage', 'hbs.hygiene': 'Hygiene', 'hbs.nature': 'Nature time',
  'hbs.checkup': 'Check-up', 'hbs.herbs': 'Kitchen herbs', 'hbs.study': 'Deep study', 'hbs.read': 'Read & learn', 'hbs.curfew': 'Phone out',
  'hbs.family': 'Family meal', 'hbs.friend': 'Friend time', 'hbs.help': 'Seva', 'hbs.quiet': 'Quiet time', 'hbs.gratitude': 'Gratitude',
  'hbs.work': 'Focused work', 'hbs.overtime': 'Overtime', 'hbs.chores': 'Chores', 'hbs.boundary': 'Log off', 'hbs.play': 'Hobby & play',
  'hbs.series': 'Movie night', 'hbs.hangout': 'Hang out',
});
/* v4: short labels for choices, one-line facts, new UI words */
Object.assign(EN, {"evs.monsoon.c0":"Indoor yoga",
  "evs.monsoon.c1":"Chai & pakoras",
  "evs.monsoon.c2":"Family dance",
  "evs.diwali.c0":"Eat a few, share",
  "evs.diwali.c1":"Eat everything",
  "evs.diwali.c2":"Gift fruit",
  "evs.wedding.c0":"Dance at all",
  "evs.wedding.c1":"Key functions only",
  "evs.wedding.c2":"Skip it",
  "evs.exams.c0":"Revise, sleep well",
  "evs.exams.c1":"All-nighter",
  "evs.exams.c2":"Study group",
  "evs.deadline.c0":"Work till midnight",
  "evs.deadline.c1":"Deliver tomorrow",
  "evs.deadline.c2":"80%, then dinner",
  "evs.groupchat.c0":"Mute, sleep",
  "evs.groupchat.c1":"Scroll till 3",
  "evs.groupchat.c2":"One meme, stop",
  "evs.samosa.c0":"One samosa, chat",
  "evs.samosa.c1":"Daily ritual",
  "evs.samosa.c2":"Fruit chaat, walk",
  "evs.stairs.c0":"Take the stairs",
  "evs.stairs.c1":"Wait 20 minutes",
  "evs.stairs.c2":"Stair race",
  "evs.nani.c0":"Drink, sleep early",
  "evs.nani.c1":"Decline, nap",
  "evs.nani.c2":"Learn her recipe",
  "evs.sneeze.c0":"Wash hands",
  "evs.sneeze.c1":"Share the chips",
  "evs.sneeze.c2":"Rest, open window",
  "evs.friendneed.c0":"Call and listen",
  "evs.friendneed.c1":"Send ❤️",
  "evs.friendneed.c2":"Walk tomorrow",
  "evs.sunday.c0":"Park walk",
  "evs.sunday.c1":"Sleep till noon",
  "evs.sunday.c2":"Quiet sacred place",
  "evs.biryani.c0":"Order it",
  "evs.biryani.c1":"Quick khichdi",
  "evs.biryani.c2":"Split one",
  "evs.cricket.c0":"Watch with family",
  "evs.cricket.c1":"Alone till 1 a.m.",
  "evs.cricket.c2":"Scores, then sleep",
  "evs.holi.c0":"Natural colours",
  "evs.holi.c1":"Hide indoors",
  "evs.holi.c2":"Play, then clean",
  "evs.parents.c0":"Book check-ups",
  "evs.parents.c1":"\"Next month\"",
  "evs.parents.c2":"Buy a new one",
  "evs.volcano.c0":"Build it, late",
  "evs.volcano.c1":"Order one online",
  "evs.volcano.c2":"Let them lead",
  "evs.tiffin.c0":"Swap and share",
  "evs.tiffin.c1":"Own dal-roti",
  "evs.tiffin.c2":"Skip lunch, play",
  "evs.cartoon.c0":"Homework first",
  "evs.cartoon.c1":"Three episodes",
  "evs.cartoon.c2":"Homework with friend",
  "evs.cycle.c0":"Cycle to school",
  "evs.cycle.c1":"Wheelies!",
  "evs.cycle.c2":"Sunday family rides",
  "evs.gamelevel.c0":"Save and sleep",
  "evs.gamelevel.c1":"Play till late",
  "evs.gamelevel.c2":"Play with sibling",
  "evs.maggi.c0":"Join till late",
  "evs.maggi.c1":"Go to bed",
  "evs.maggi.c2":"Fruit, leave early",
  "evs.internship.c0":"Accept it",
  "evs.internship.c1":"Ask for part-time",
  "evs.internship.c2":"Own project",
  "evs.fest.c0":"Organise it",
  "evs.fest.c1":"Evenings only",
  "evs.fest.c2":"Quiet library",
  "evs.heatwave.c0":"Sunrise walk",
  "evs.heatwave.c1":"AC and series",
  "evs.heatwave.c2":"Rest, evening play",
  "evs.navratri.c0":"Every night",
  "evs.navratri.c1":"Two nights",
  "evs.navratri.c2":"Meals and prayers",
  "evs.dadi.c0":"Accept champi",
  "evs.dadi.c1":"Too busy",
  "evs.dadi.c2":"Massage her feet",
  "evs.traffic.c0":"Podcast",
  "evs.traffic.c1":"Honk back",
  "evs.traffic.c2":"Call parents",
  "evs.promotion.c0":"Leave on time",
  "evs.promotion.c1":"Last one standing",
  "evs.promotion.c2":"Home and rest",
  "evs.dosha.c0":"Laugh, close it",
  "evs.dosha.c1":"12 more quizzes",
  "evs.dosha.c2":"Read on dinacharya",
  "evs.resolution.c0":"Three walks weekly",
  "evs.resolution.c1":"Two hours daily!",
  "evs.resolution.c2":"Exercise buddy",
  "evs.relatives.c0":"Cook together",
  "evs.relatives.c1":"Hide at work",
  "evs.relatives.c2":"Family outing",
  "evs.gurpurab.c0":"Do seva",
  "evs.gurpurab.c1":"Langar with family",
  "evs.gurpurab.c2":"Skip this year",
  "evs.eid.c0":"Visit, celebrate",
  "evs.eid.c1":"WhatsApp wishes",
  "evs.eid.c2":"Go early, cook",
  "evs.christmas.c0":"Handmade gift",
  "evs.christmas.c1":"Panic-buy a mug",
  "evs.christmas.c2":"Sing carols",
  "evs.worknight.c0":"Close the laptop",
  "evs.worknight.c1":"Finish it all",
  "evs.worknight.c2":"3-line plan, sleep",
  "fas.pa_adult":"WHO: adults, 150–300 active minutes a week.",
  "fas.pa_kids":"WHO: kids and teens, 60 active minutes a day on average.",
  "fas.inactive":"Too little activity: 20–30% higher risk of death.",
  "fas.teens_inactive":"81% of teens worldwide don't move enough.",
  "fas.sitting":"Any movement beats none. Sit less.",
  "fas.sugar":"WHO: keep free sugars below 10% of daily energy.",
  "fas.salt":"WHO: adults, under 5 g of salt a day.",
  "fas.fruitveg":"WHO: 400 g+ fruit and veg a day, age 10+.",
  "fas.nin_plate":"ICMR-NIN: half your plate veg, greens and fruit.",
  "fas.nin_burden":"ICMR-NIN: unhealthy diets drive 56.4% of India's disease burden.",
  "fas.nin_upf":"ICMR-NIN: minimise ultra-processed, high fat-sugar-salt foods.",
  "fas.spices":"Spices like turmeric and cumin are rich in antioxidants.",
  "fas.sleepadult":"Adults: 7 or more hours of sleep a night.",
  "fas.sleepteen":"Teens 13–18: 8–10 hours of sleep a day.",
  "fas.sleeplearn":"Enough sleep is linked to better attention and learning.",
  "fas.hand":"Good handwashing with soap takes 40–60 seconds.",
  "fas.oral":"Oral diseases affect nearly 3.7 billion people.",
  "fas.htn":"High BP often has no symptoms. Get it checked.",
  "fas.longhours":"55+ work hours a week: 35% higher stroke risk.",
  "fas.burnout":"WHO: burn-out is an occupational phenomenon, not a medical condition.",
  "fas.lonely":"Loneliness affects 1 in 6 people worldwide.",
  "fas.connect":"Against loneliness: call a friend, put the phone away.",
  "fas.teen_mh":"1 in 7 people aged 10–19 has a mental disorder.",
  "fas.nature":"120+ nature minutes a week: linked to better well-being.",
  "fas.yoga":"Yoga may help stress and sleep; evidence is still limited.",
  "fas.idy":"21 June is the UN's International Day of Yoga.",
  "fas.tm":"WHO has a 2025–2034 strategy for traditional medicine.",
  "fas.dinacharya":"Dinacharya: a traditional daily routine, not a treatment.",
  "fas.ritucharya":"Ritucharya: adapt food and routine to the season.",
  "fas.turmeric":"Not enough evidence that turmeric helps any condition.",
  "fas.interact":"Herbs can interact with medicines. Ask your doctor first.",
  "fas.metals":"Some Ayurvedic products contained lead or mercury. Use licensed ones.",
  "fas.ginger":"Ginger may ease pregnancy nausea; other uses are uncertain.",
  "ui.more4":"More habits",
  "ui.done4":"Done",
  "ui.next4":"Next",
  "ui.src4":"Source",
  "ui.quiz4":"Quiz?",
  "ui.energyL":"Energy left: {n} of {T}",
  "ui.details":"Details",
  "ui.plantH":"Your plant",
  "ui.plantS":"Your plant, wellbeing {n}. Tap for details",
  "ui.fx4":"What it changed",
  "ui.cost4":"Costs {n} energy",
  "ui.picked":"Picked",
  "ui.notEnough":"Not enough energy",
  "ui.h4a":"<b>1. Event.</b> Life throws a card at you. Tap how you respond; you then see what it changed.",
  "ui.h4b":"<b>2. Plan.</b> Tap habits until your ⚡ energy runs out. The dots on a habit are its cost; it is greyed out only when it costs more than you have left. Sleep debt and stress make some habits cost more, and tiredness or illness shrinks next week's energy. Tap again to remove. <i>More habits</i> shows all of them.",
  "ui.h4c":"<b>3. Grow.</b> Your plant shows your wellbeing. Tap the small plant at the top any time to see your six pillars and next-day vitals. Some effects arrive weeks later.",
  "ui.h4d":"<b>4. Report card.</b> Any steady, joyful balance can score well. Spirit is optional but gives a calm bonus.",
  "hbs.sleep":"Early sleep"});
// data strings into the English table under stable keys
(function registerEn() {
  const put = (k, v) => { if (v != null) EN[k] = v; };
  for (const [m, x] of Object.entries(D.MODE_TEXT)) { put(`mode.${m}.name`, x.name); put(`mode.${m}.age`, x.age); put(`mode.${m}.tag`, x.tag); }
  D.PILLARS.forEach(p => { put(`p.${p.id}`, p.name); put(`ps.${p.id}`, p.short); });
  D.VITALS.forEach(v => put(`v.${v.id}`, v.name)); D.RES.forEach(r => put(`r.${r.id}`, r.name));
  D.RITU.forEach(r => put(`ritu.${r.id}`, r.name)); for (const [k, v] of Object.entries(D.RITU_TIP)) put(`rtip.${k}`, v);
  D.HABITS.forEach(h => { put(`hb.${h.id}.n`, h.name); put(`hb.${h.id}.d`, h.desc); });
  D.EVENTS.forEach(e => { put(`ev.${e.id}.t`, e.title); put(`ev.${e.id}.x`, e.text); e.choices.forEach((c, i) => put(`ev.${e.id}.c${i}`, c.label)); });
  D.CURVEBALLS.forEach(c => put(`cb.${c.id}`, c.text)); for (const [k, v] of Object.entries(D.LATER)) put(`lt.${k}`, v);
  D.FACTS.forEach(f => put(`fa.${f.id}`, f.text));
  D.QUIZ.forEach(q => { put(`q.${q.id}.q`, q.q); q.o.forEach((o, i) => put(`q.${q.id}.o${i}`, o)); put(`q.${q.id}.h`, q.hint); });
  D.TITLES.forEach((x, i) => put(`ti.${i}`, x[2])); for (const [k, v] of Object.entries(D.ARCH)) put(`ar.${k}`, v);
  for (const [k, v] of Object.entries(D.TIPS)) put(`tip.${k}`, v); for (const [k, v] of Object.entries(D.HELPED)) put(`hp.${k}`, v);
})();
let LANG = 'en';
function t(k, p) { let s = (TR[LANG] && TR[LANG][k]); if (s == null) s = EN[k]; if (s == null) s = k; if (p) s = s.replace(/\{(\w+)\}/g, (m, n) => p[n] != null ? p[n] : m); return s; }
const monthName = m => t('ui.monthsLong').split(' ')[m % 12];
const IN_APP = !!window.HRS_GAMES;
function readLang() { let l = null; try { l = HAS_HRS ? HRS.lang() : localStorage.getItem('hrs-lang'); } catch (e) {} l = String(l || '').replace(/"/g, '').slice(0, 2); return LANGS.includes(l) ? l : 'en'; }

/* ================= engine ================= */
const PIDS = D.PILLARS.map(p => p.id), CORE = ['body', 'mind', 'heart', 'work', 'fun'];
const ACCS = ['slp', 'str', 'jnk', 'scr', 'bnd', 'fit'];
const K = 1.5; // habit/event pillar points multiplier (game tuning)
const ENERGY_DIV = 20, FOCUS_DIV = 22, POOL_MIN = 6, POOL_MAX = 26; // one-pool tuning (v4.1)
const HAB = Object.fromEntries(D.HABITS.map(h => [h.id, h])), EVT = Object.fromEntries(D.EVENTS.map(e => [e.id, e]));
const FACT = Object.fromEntries(D.FACTS.map(f => [f.id, f])), QZ = Object.fromEntries(D.QUIZ.map(q => [q.id, q]));
const MCODE = { school: 's', college: 'c', adult: 'a' };
const inMode = (x, m) => (x.modes || 'sca').includes(MCODE[m]);
const START = {
  school: { p: { body: 55, mind: 55, heart: 55, spirit: 50, work: 55, fun: 60 }, a: { slp: 1, str: 1, jnk: 1, scr: 1, bnd: 3, fit: 2 } },
  college: { p: { body: 52, mind: 55, heart: 50, spirit: 45, work: 50, fun: 58 }, a: { slp: 3, str: 3, jnk: 2, scr: 3, bnd: 2, fit: 2 } },
  adult: { p: { body: 48, mind: 55, heart: 50, spirit: 45, work: 60, fun: 45 }, a: { slp: 3, str: 4, jnk: 3, scr: 2, bnd: 2, fit: 1 } },
};
function rnd(S) { let x = S.rs = (S.rs + 0x6D2B79F5) | 0; x = Math.imul(x ^ x >>> 15, x | 1); x ^= x + Math.imul(x ^ x >>> 7, x | 61); return ((x ^ x >>> 14) >>> 0) / 4294967296; }
const ritOf = m => D.RITU.find(r => r.months.includes(m % 12));
const monthOf = S => (D.MODES[S.mode].m0 + S.week) % 12;
function newGame(mode, seed) {
  const M = D.MODES[mode], st = START[mode];
  const S = { v: 1, mode, seed: seed >>> 0, rs: seed >>> 0, week: 0, T: M.T, phase: 'event', over: false,
    p: { ...st.p }, a: { ...st.a }, vit: {}, pool: {}, base: {}, next: { e: 0, a: 0, t: 0 }, used: [], event: null, choice: null, plan: [],
    queue: [], counts: {}, factsSeen: [], quizAsked: [], flags: {}, hist: [], last: null, quiz: null, curve: null, sick: 0 };
  computeVitals(S, 0); S.hist.push(snap(S)); startWeek(S); return S;
}
const snap = S => ({ w: S.week, p: { ...S.p }, vit: { ...S.vit }, a: { ...S.a } });
function startWeek(S) {
  const M = D.MODES[S.mode];
  // delayed consequences due this week land first (they can change this week's pool)
  const due = S.queue.filter(q => q.due <= S.week); S.queue = S.queue.filter(q => q.due > S.week);
  S.sick = 0; S.dueMsgs = [];
  due.forEach(q => { const dp = {}, da = {}, ex = {}; addFx(dp, da, q.fx, 1, ex);
    for (const k in dp) S.p[k] = r1(clamp(S.p[k] + dp[k], 0, 100)); for (const k in da) S.a[k] = r1(clamp(S.a[k] + da[k], 0, 10));
    S.next.e += ex.en || 0; S.next.a += ex.at || 0; if (ex.sick) { S.sick = 1; S.next.e -= 2; } S.dueMsgs.push(q.m); });
  if (due.length) computeVitals(S, 0);
  // ONE shared weekly ⚡ energy pool: next-day energy and focus, fatigue, illness, quiz bonuses and curveballs all land here
  let pool = M.energy + Math.round((S.vit.energy - 55) / ENERGY_DIV) + Math.round((S.vit.focus - 55) / FOCUS_DIV);
  pool += (S.next.e || 0) + (S.next.a || 0) + (S.next.t || 0); S.next = { e: 0, a: 0, t: 0 };
  S.curve = null;
  if (M.curveball && S.week > 0 && rnd(S) < M.curveball) { const c = D.CURVEBALLS[Math.floor(rnd(S) * D.CURVEBALLS.length)]; S.curve = c.id; pool += c.pool || 0; }
  pool = clamp(pool, POOL_MIN, POOL_MAX);
  S.pool = { e: pool }; S.base = { e: pool };
  // draw an event: unused, right mode; cards that fit this month are 4x likelier
  const m = monthOf(S);
  let cands = D.EVENTS.filter(e => inMode(e, S.mode) && !S.used.includes(e.id) && (!e.months || e.months.includes(m)));
  if (!cands.length) cands = D.EVENTS.filter(e => inMode(e, S.mode) && !e.months);
  const w = cands.map(e => e.months ? 4 : 1), tot = w.reduce((a, b) => a + b, 0); let r = rnd(S) * tot, pick = cands[0];
  for (let i = 0; i < cands.length; i++) { r -= w[i]; if (r <= 0) { pick = cands[i]; break; } }
  S.event = pick.id; S.used.push(pick.id); S.choice = null; S.plan = []; S.phase = 'event'; S.last = null; S.quiz = null;
}
const afford = (pool, c) => pool.e >= c;
const spend = (pool, c, s = 1) => { pool.e -= s * c; };
// pillar interactions expressed through the one pool: sleep debt and stress make habits cost more ⚡
function habitCost(S, h) {
  let c = h.cost;
  if (S.a.slp >= 5 && !h.noTax) c += 1;
  if (S.a.str >= 7 && (h.p === 'mind' || h.p === 'heart')) c += 1;
  return c;
}
function chooseEvent(S, i) {
  const e = EVT[S.event]; if (S.phase !== 'event') return false;
  if (i === -1) { S.choice = -1; S.phase = 'plan'; return true; }
  const c = e.choices[i]; if (!c || !afford(S.pool, c.cost)) return false;
  spend(S.pool, c.cost); S.choice = i; S.phase = 'plan'; return true;
}
function unchoose(S) {
  if (S.phase !== 'plan') return;
  S.plan.forEach(id => spend(S.pool, habitCost(S, HAB[id]), -1)); S.plan = [];
  if (S.choice >= 0) spend(S.pool, EVT[S.event].choices[S.choice].cost, -1);
  S.choice = null; S.phase = 'event';
}
const habitsFor = S => D.HABITS.filter(h => inMode(h, S.mode));
const habitLocked = (S, h) => h.once && S.flags['once_' + h.id];
function toggleHabit(S, id) {
  if (S.phase !== 'plan') return false; const h = HAB[id]; if (!h || !inMode(h, S.mode)) return false;
  const c = habitCost(S, h), at = S.plan.indexOf(id);
  if (at >= 0) { S.plan.splice(at, 1); spend(S.pool, c, -1); return true; }
  if (habitLocked(S, h) || !afford(S.pool, c)) return false;
  S.plan.push(id); spend(S.pool, c); return true;
}
function computeVitals(S, hyg) {
  const p = S.p, a = S.a, sick = S.sick ? 1 : 0;
  S.vit = {
    energy: Math.round(clamp(32 + p.body * 0.4 + a.fit * 2 - a.slp * 3 - a.jnk * 1.5 - sick * 15, 5, 100)),
    mood: Math.round(clamp(24 + p.fun * 0.3 + p.heart * 0.25 + p.spirit * 0.12 + p.body * 0.08 - a.str * 3 - a.slp * 1.2, 5, 100)),
    immunity: Math.round(clamp(42 + p.body * 0.3 + hyg * 8 + a.fit - a.slp * 2.2 - a.str * 1.8 - sick * 10, 5, 100)),
    focus: Math.round(clamp(36 + p.mind * 0.4 + p.spirit * 0.05 - a.slp * 3 - a.scr * 2 - Math.max(0, a.str - 4) * 2.5, 5, 100)),
  };
}
function addFx(dp, da, fx, mult, extra) {
  for (const k in fx) {
    const v = fx[k];
    if (PIDS.includes(k)) dp[k] = (dp[k] || 0) + v * mult;
    else if (ACCS.includes(k)) da[k] = (da[k] || 0) + v;
    else extra[k] = (extra[k] || 0) + v;
  }
}
function endWeek(S) {
  if (S.phase !== 'plan') return null;
  const M = D.MODES[S.mode], e = EVT[S.event], m = monthOf(S), rit = ritOf(m);
  const dp = {}, da = {}, ex = {}, notes = [], laters = [];
  const before = { p: { ...S.p }, vit: { ...S.vit }, a: { ...S.a } };
  const ch = S.choice >= 0 ? e.choices[S.choice] : null;
  if (ch) { addFx(dp, da, ch.fx, K, ex); ch.l.forEach(l => S.queue.push({ due: S.week + l.in, fx: l.fx, m: l.m })); }
  const plan = S.plan.map(id => HAB[id]);
  plan.forEach(h => { addFx(dp, da, h.fx, K, ex); S.counts[h.id] = (S.counts[h.id] || 0) + 1; if (h.once) S.flags['once_' + h.id] = 1; });
  if (S.plan.includes('seasonal')) { dp.body = (dp.body || 0) + 1.5; da.jnk = (da.jnk || 0) - 0.5; notes.push(['n.season', { r: t('ritu.' + rit.id) }]); }
  // background drains (life happens): sleep debt, screens, stress, convenience creep
  const has = id => S.plan.includes(id);
  da.slp = (da.slp || 0) + M.drain.slp * (has('sleep') ? 0.5 : 1);
  if (!has('curfew')) da.scr = (da.scr || 0) + M.drain.scr;
  if (!has('thali') && !has('seasonal') && !has('mindful')) da.jnk = (da.jnk || 0) + M.drain.jnk;
  da.bnd = (da.bnd || 0) - 0.6;
  if (!has('walk') && !has('sport') && !has('yoga')) da.fit = (da.fit || 0) - 0.5;
  // stress: gains are buffered by the bond bank (family/friends) and a strong Spirit pillar
  let gain = M.drain.str + Math.max(0, da.str || 0), relief = Math.min(0, da.str || 0);
  const buf = Math.min(0.45, S.a.bnd / 20) + (S.p.spirit >= 60 ? 0.15 : 0);
  if (S.a.bnd >= 4 && gain >= 2) notes.push(['n.buffer']);
  if (S.p.spirit >= 60 && gain >= 1.5) notes.push(['n.spirit']);
  da.str = gain * (1 - buf) + relief;
  for (const k of ACCS) S.a[k] = r1(clamp(S.a[k] + (da[k] || 0), 0, 10));
  // pillar upkeep: uninvested pillars fade (Spirit, being optional, fades slowly)
  // gains taper near the top (diminishing returns), so no pillar maxes out from one habit
  for (const k of PIDS) { const d = dp[k] || 0; S.p[k] += d > 0 ? d * clamp((110 - S.p[k]) / 60, 0.25, 1) : d; if (d <= 0) S.p[k] -= M.decay * (k === 'spirit' ? 0.5 : 1); }
  const a = S.a, p = S.p;
  p.body += a.fit * 0.4 - a.slp * 0.35 - a.jnk * 0.35;
  p.mind += -a.slp * 0.3 - a.scr * 0.25 - Math.max(0, a.str - 5) * 0.5;
  p.heart += a.bnd * 0.2 - Math.max(0, a.str - 6) * 0.4;
  p.work += -Math.max(0, a.str - 7) * 0.7 - a.slp * 0.2;
  p.fun += -Math.max(0, a.str - 6) * 0.4;
  p.spirit += -a.scr * 0.1;
  for (const k of PIDS) p[k] = r1(clamp(p[k], 0, 100));
  S.next.e += ex.en || 0; S.next.a += ex.at || 0;
  // check-up: peace of mind now, fewer surprise colds later (game rule)
  if (ex.chk && !S.flags.chk) { S.flags.chk = 1; S.queue.push({ due: S.week + 1, fx: { str: -1 }, m: 'checkup' }); }
  const hyg = (ex.hyg || 0) > 0 ? 1 : 0;
  computeVitals(S, hyg);
  // risks for next week (seeded)
  if (plan.some(h => h.intense) && a.slp >= 6) { notes.push(['n.injuryRisk']); if (rnd(S) < 0.45) S.queue.push({ due: S.week + 1, fx: { body: -3, en: -1 }, m: 'injury' }); }
  if (S.vit.immunity < 40 && !S.queue.some(q => q.m === 'caughtcold' || q.m === 'sick')) {
    let pr = 0.3 + ([6, 7, 11, 0].includes(m) ? 0.15 : 0); if (hyg) pr /= 2; if (S.flags.chk) pr *= 0.8;
    notes.push(['n.sickRisk']); if (rnd(S) < pr) S.queue.push({ due: S.week + 1, fx: { sick: 1, body: -2 }, m: 'sick' });
  }
  if (a.slp >= 5) notes.push(['n.tired']);
  if (a.str >= 8) notes.push(['n.burnout']);
  if (a.scr >= 6) notes.push(['n.screens']);
  if (a.jnk >= 6) notes.push(['n.junk']);
  if (a.fit >= 5) notes.push(['n.fit']);
  if (S.vit.energy >= 70) notes.push(['n.rested']); else if (S.vit.energy < 40) notes.push(['n.lowE']);
  if (!S.plan.length) notes.push(['n.quiet']);
  // one real fact for this week, chosen to fit what happened
  const fact = pickFact(S, e, plan);
  if (fact) S.factsSeen.push(fact);
  S.hist.push(snap(S));
  // quiz after this week's result? (School / College)
  if (M.quiz.includes(S.week)) S.quiz = makeQuiz(S);
  S.last = { before, notes: dedupe(notes).slice(0, 4), laters, fact, choice: S.choice, plan: S.plan.slice(), curve: S.curve };
  S.phase = 'result';
  return S.last;
}
const dedupe = arr => { const seen = new Set(); return arr.filter(n => { const k = n[0]; if (seen.has(k)) return false; seen.add(k); return true; }); };
function pickFact(S, e, plan) {
  const ok = id => FACT[id] && inMode(FACT[id], S.mode) && !S.factsSeen.includes(id);
  const cands = [];
  if (S.a.slp >= 5) cands.push('sleepadult', 'sleepteen');
  if (e.fact) cands.push(e.fact);
  plan.forEach(h => (D.HABIT_FACT[h.id] || []).forEach(f => cands.push(f)));
  if (plan.some(h => h.trad)) cands.push('interact');
  if (S.a.jnk >= 5) cands.push('nin_upf', 'sugar', 'salt', 'nin_burden');
  if (S.a.str >= 6) cands.push('longhours', 'burnout', 'teen_mh');
  const pick = cands.filter(ok);
  if (pick.length) return pick[Math.floor(rnd(S) * Math.min(pick.length, 3))];
  const rest = D.FACTS.filter(f => ok(f.id)); return rest.length ? rest[Math.floor(rnd(S) * rest.length)].id : null;
}
function makeQuiz(S) {
  const M = D.MODES[S.mode];
  let qs = D.QUIZ.filter(q => inMode(q, S.mode) && !S.quizAsked.includes(q.id));
  const seen = qs.filter(q => S.factsSeen.includes(q.fact)); if (seen.length) qs = seen;
  if (!qs.length) return null;
  const q = qs[Math.floor(rnd(S) * qs.length)]; S.quizAsked.push(q.id);
  let idx = [0, 1, 2].slice(0, q.o.length);
  if (M.quizOpts === 2) idx = [0, 1 + Math.floor(rnd(S) * (q.o.length - 1))];
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd(S) * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return { id: q.id, opts: idx, ans: null };
}
function answerQuiz(S, i) {
  if (!S.quiz || S.quiz.ans != null) return null;
  S.quiz.ans = i; const ok = S.quiz.opts[i] === 0;
  if (ok) { S.next.a += 1; S.p.mind = clamp(S.p.mind + 2, 0, 100); }
  if (!S.factsSeen.includes(QZ[S.quiz.id].fact)) S.factsSeen.push(QZ[S.quiz.id].fact);
  return ok;
}
function nextWeek(S) {
  if (S.phase !== 'result') return;
  S.week++;
  if (S.week >= S.T) { S.phase = 'end'; S.over = true; S.result = score(S); return; }
  startWeek(S);
}
const util = p => 100 * Math.sqrt(clamp((p - 10) / 80, 0, 1));
function score(S) {
  const M = D.MODES[S.mode], a = S.a, p = S.p;
  const pillarScore = CORE.reduce((s, k) => s + util(p[k]), 0) / CORE.length;
  const hv = S.hist.slice(1); const vitScore = hv.length ? hv.reduce((s, h) => s + (h.vit.energy + h.vit.mood + h.vit.immunity + h.vit.focus) / 4, 0) / hv.length : 50;
  const sustain = clamp(100 - (a.slp * 7 + a.str * 6 + a.jnk * 3 + a.scr * 3), 0, 100);
  const spiritBonus = clamp((p.spirit - 55) / 10, 0, 4);
  let total = Math.round(clamp(0.5 * pillarScore + 0.3 * vitScore + 0.2 * sustain + spiritBonus, 0, 100));
  total = Math.max(total, M.floor);
  const grade = total >= 90 ? 'Ap' : total >= 80 ? 'A' : total >= 70 ? 'B' : total >= 60 ? 'C' : total >= 45 ? 'D' : 'E';
  const ti = D.TITLES.findIndex(x => total >= x[0]);
  const vals = PIDS.map(k => p[k]), mx = Math.max(...CORE.map(k => p[k])), mn = Math.min(...CORE.map(k => p[k]));
  const top = PIDS.reduce((b, k) => p[k] > p[b] ? k : b, 'body');
  const arch = mx - mn < 15 && mn >= 50 ? 'balanced' : top;
  const helped = Object.entries(S.counts).filter(([, n]) => n >= 2).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([id]) => id);
  const tips = [];
  const weakest = PIDS.filter(k => k !== 'spirit').reduce((b, k) => p[k] < p[b] ? k : b, 'body');
  if (p[weakest] < 55) tips.push(weakest);
  [['slp', 4], ['str', 5], ['jnk', 4], ['scr', 4]].forEach(([k, lim]) => { if (a[k] >= lim) tips.push(k); });
  if (p.spirit < 40 && tips.length < 3) tips.push('spirit');
  return { total, grade, ti, arch, pillarScore: Math.round(pillarScore), vitScore: Math.round(vitScore), sustain: Math.round(sustain), helped, tips: tips.slice(0, 3), vals };
}
window.OYH_EN = EN;
window.OYH = { newGame, startWeek, chooseEvent, unchoose, toggleHabit, endWeek, answerQuiz, nextWeek, score, habitCost, habitsFor, afford, D };

/* ================= UI (v4: one thing + one action per screen; depth stays in the engine) ================= */
let S = null, mode = null, busy = false, storyOpen = false, picks = null, sheetKind = null, endOpen = false, revealT = 0, revealGo = null;
const pill = id => D.PILLARS.find(p => p.id === id);
const ACC_GOOD_NEG = { slp: 1, str: 1, jnk: 1, scr: 1 };
const EMO = /^\p{Extended_Pictographic}/u;
const splitE = (s, dflt) => { const m = String(s).match(/^(\S+)\s+(.*)$/s); return m && EMO.test(m[1]) ? [m[1], m[2]] : [dflt, String(s)]; };
const accE = k => splitE(t('acc.' + k), '•')[0], accL = k => splitE(t('acc.' + k), '')[1];
const PM = () => D.MODES[S.mode].preview;
const srs = s => `<span class="sr">${esc(s)}</span>`;
const csum = c => c; // costs are one ⚡ number since v4.1
const poolN = () => S.pool.e, baseN = () => S.base.e;
/* effect chips (shown only after a choice is made) */
function fxViz(fx, pm) {
  const out = []; if (fx.at) { fx = { ...fx, en: (fx.en || 0) + fx.at }; delete fx.at; }
  for (const k in fx) {
    const v = fx[k]; if (!v) continue;
    if (PIDS.includes(k)) {
      const P = pill(k), up = v > 0, n = Math.round(Math.abs(v) * K);
      const mag = pm === 'exact' ? (up ? '+' : '−') + n : up ? (v >= 4 ? '▲▲' : '▲') : (v <= -3 ? '▼▼' : '▼');
      out.push(`<span class="pd ${up ? 'up' : 'dn'}" style="--c:${P.c}"><i aria-hidden="true">${P.e}</i><b aria-hidden="true">${mag}</b>${srs(t('ps.' + k) + ' ' + mag)}</span>`);
    } else if (t('acc.' + k) !== 'acc.' + k) {
      const good = ACC_GOOD_NEG[k] ? v < 0 : v > 0, ar = v > 0 ? '▲' : '▼';
      out.push(`<span class="ad ${good ? 'up' : 'dn'}"><i aria-hidden="true">${accE(k)}</i><b aria-hidden="true">${ar}</b>${srs(accL(k) + ' ' + ar)}</span>`);
    }
  }
  return out.join('');
}
function ring(v, color) { const C2 = 2 * Math.PI * 16; return `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16" class="rt"/><circle cx="20" cy="20" r="16" class="rv" style="stroke:${color};stroke-dasharray:${(C2 * v / 100).toFixed(1)} ${C2.toFixed(1)}"/></svg>`; }
const VCOL = v => v >= 65 ? '#2f9a6e' : v >= 45 ? '#eea63a' : '#e0674f';
/* ---------- the wellbeing plant: stem height = overall wellbeing, one leaf per pillar, flower blooms when thriving ---------- */
const LEAF = [[-1, 92], [1, 80], [-1, 68], [1, 56], [-1, 44], [1, 33]];
function wellbeing(st) { const core = PIDS.filter(k => k !== 'spirit'); return clamp(Math.round(core.reduce((a, k) => a + st.p[k], 0) / core.length * 0.55 + D.VITALS.reduce((a, v) => a + st.vit[v.id], 0) / D.VITALS.length * 0.45), 0, 100); }
function plantSvg(cls, uid) {
  uid = uid || cls;
  const leaves = D.PILLARS.map((p, i) => { const [sd, y] = LEAF[i];
    return `<g class="lf" data-p="${p.id}" style="transform-origin:50px ${y}px"><path d="M50 ${y}c${sd * 8} -12 ${sd * 24} -14 ${sd * 32} -8c${-sd * 6} 12 ${-sd * 20} 16 ${-sd * 32} 8z" fill="${p.c}"/><path d="M50 ${y}c${sd * 10} -5 ${sd * 18} -7 ${sd * 26} -7" stroke="rgba(255,255,255,.55)" stroke-width="1.2" fill="none" stroke-linecap="round"/></g>`; }).join('');
  const petals = Array.from({ length: 6 }, (_, i) => `<ellipse cx="50" cy="13" rx="5" ry="9" transform="rotate(${i * 60} 50 22)" fill="url(#pt-${uid})"/>`).join('');
  return `<svg class="plant ${cls || ''}" viewBox="0 0 100 130" aria-hidden="true"><defs><linearGradient id="pt-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7c55c"/><stop offset="1" stop-color="#ef7b5f"/></linearGradient><linearGradient id="pot-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e88c6d"/><stop offset="1" stop-color="#c9644a"/></linearGradient></defs>
    <ellipse cx="50" cy="126" rx="26" ry="3" fill="rgba(29,42,38,.08)"/>
    <g class="grow"><g class="sway"><path class="stem" d="M50 108C48 86 53 60 50 24" stroke="#3f8f5f" stroke-width="3.2" fill="none" stroke-linecap="round"/>${leaves}<g class="flower">${petals}<circle cx="50" cy="22" r="5.5" fill="#fff4d6"/></g><circle class="bud" cx="50" cy="23" r="4.2" fill="#9ccf8a"/></g></g>
    <path class="pot" d="M30 106h40l-5 20H35z" fill="url(#pot-${uid})"/><rect class="pot" x="27" y="102" width="46" height="7" rx="3.5" fill="#d9775a"/></svg>`;
}
function setPlant(svg, st) {
  if (!svg || !st) return; const w = wellbeing(st);
  svg.style.setProperty('--g', (0.5 + w / 200).toFixed(3));
  svg.querySelectorAll('.lf').forEach(l => l.style.setProperty('--s', (0.25 + clamp(st.p[l.dataset.p], 0, 100) / 100 * 0.95).toFixed(3)));
  svg.classList.toggle('bloom', w >= 66); svg.classList.toggle('budding', w >= 48 && w < 66); svg.classList.toggle('wilt', w < 35);
  svg.setAttribute('data-w', w);
}
/* ---------- header: home, thin progress bar, small plant (tap = pillar sheet), help ---------- */
function topbar() {
  const wk = $('#wk'), pb = $('#plantBtn'), playing = S && S.phase !== 'end' && !$('#scr-play').hidden;
  if (playing) { const done = S.week + (S.phase === 'result' ? 1 : S.phase === 'plan' ? 0.6 : 0.25);
    wk.hidden = false; wk.innerHTML = `<i style="width:${(done / S.T * 100).toFixed(1)}%"></i>`;
    wk.setAttribute('role', 'progressbar'); wk.setAttribute('aria-valuemin', '0'); wk.setAttribute('aria-valuemax', S.T); wk.setAttribute('aria-valuenow', S.week + 1);
    wk.setAttribute('aria-label', `${t('ui.week', { n: S.week + 1, T: S.T })}, ${monthName(monthOf(S))}`); }
  else wk.hidden = true;
  if (playing && S.phase !== 'result') { pb.hidden = false; if (!pb.querySelector('.plant')) pb.innerHTML = plantSvg('mini', 'mn'); setPlant(pb.querySelector('.plant'), S); pb.setAttribute('aria-label', t('ui.plantS', { n: wellbeing(S) })); }
  else pb.hidden = true;
  $('#helpBtn').setAttribute('aria-label', t('ui.help')); $('#homeBtn').setAttribute('aria-label', t('ui.home'));
  document.title = t('ui.title') + (LANG === 'en' ? ' | Educational game by Harpreet Raj Singh' : ' · Harpreet Raj Singh Games');
}
function show(id) { ['#scr-title', '#scr-play', '#scr-end'].forEach(s => $(s).hidden = s !== id); window.scrollTo(0, 0); }
function focusH() { const h = document.querySelector('main section:not([hidden]) h1, main section:not([hidden]) h2'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
function langPicker() {
  if (IN_APP) return '';
  return `<div class="langs" role="radiogroup" aria-label="${esc(t('ui.language'))}">${LANGS.map(l => `<button type="button" role="radio" class="lang" data-lang="${l}" lang="${l}" aria-checked="${LANG === l}">${LANG_LABEL[l]}</button>`).join('')}</div>`;
}
function fitDock() { const d = $('#dock'); document.body.style.setProperty('--dockH', (d.innerHTML ? d.offsetHeight : 0) + 'px'); }
function setDock(html) { $('#dock').innerHTML = html; fitDock(); }
function tipChips(list, cls) {
  if (!list.length) return '';
  return `<div class="tipsw ${cls || ''}"><div class="tips">${list.map(([id, e, txt, c]) => `<button type="button" class="tchip" data-tip="${esc(id)}" data-text="${esc(txt)}" aria-expanded="false" aria-label="${esc(txt)}"${c ? ` style="--c:${c}"` : ''}><span aria-hidden="true">${e}</span></button>`).join('')}</div><p class="tipbub" role="status" hidden></p></div>`;
}
function toggleTip(btn) {
  const w = btn.closest('.tipsw'), bub = w.querySelector('.tipbub'), on = btn.getAttribute('aria-expanded') !== 'true';
  w.querySelectorAll('.tchip').forEach(b => b.setAttribute('aria-expanded', 'false'));
  btn.setAttribute('aria-expanded', String(on)); bub.hidden = !on; bub.textContent = on ? btn.dataset.text : ''; sfx('tap'); buzz('light');
}
/* ---------- title: plant, name, three mode tiles; tagline + disclaimer as one small line ---------- */
const SAVE_KEY = 'hrs_save_health_v1', TUT_KEY = 'hrs_tut_health_v4', LAST_MODE = 'hrs_health_mode';
const bestKey = m => 'hrs_best_health_' + m;
const tut = k => !!(store.get(TUT_KEY) || {})[k], tutDone = k => { const d = store.get(TUT_KEY) || {}; if (!d[k]) { d[k] = 1; store.set(TUT_KEY, d); } };
function migrate(st) { const one = o => o && typeof o === 'object' && ('t' in o || 'a' in o) ? { e: (o.t || 0) + (o.e || 0) + (o.a || 0) } : o; st.pool = one(st.pool); st.base = one(st.base); return st; }
function loadSave() { const r = store.get(SAVE_KEY); return r && r.v === 1 && r.S && !r.S.over && D.MODES[r.S.mode] ? (migrate(r.S), r) : null; }
const saveLabel = st => `${D.MODES[st.mode].e} ${t('mode.' + st.mode + '.name')} · ${t('ui.week', { n: Math.min(st.week + 1, st.T), T: st.T })}`;
const discLine = () => `<details class="disc"><summary>⚕️ ${esc(t('ui.disc1'))} <span class="mut" aria-hidden="true">ⓘ</span></summary><p>${esc(t('ui.disc'))}</p></details>`;
const footLinks = () => `<div class="tlinks"><a href="../../index.html">🏠 ${esc(t('ui.allGames'))}</a><a href="../../about.html">${esc(t('ui.about'))}</a><a href="../../privacy.html">${esc(t('ui.privacy'))}</a></div><p class="credit">${t('ui.by')}</p>`;
function renderTitle() {
  const sv = loadSave(), last = store.get(LAST_MODE);
  $('#scr-title').innerHTML = `${langPicker()}
   <div class="hero">${plantSvg('title-plant')}</div>
   <h1>${esc(t('ui.title'))}</h1>
   ${sv ? `<button class="cta cont" id="contBtn">⏯ ${esc(t('ui.cont'))}<span class="sr"> · ${esc(saveLabel(sv.S))}</span></button>` : ''}
   <div class="modes" role="group" aria-label="${esc(t('ui.pick'))}">${Object.keys(D.MODES).map(m => { const b = store.get(bestKey(m)), nm = t('mode.' + m + '.name'), ag = t('mode.' + m + '.age'), wk = t('ui.weeks', { n: D.MODES[m].T });
     return `<button class="mode${last === m ? ' last' : ''}" data-mode="${m}" aria-label="${esc(nm)}, ${esc(ag)}, ${esc(wk)}${b ? `, ${esc(t('ui.best'))} ${b.score}` : ''}"><span class="me" aria-hidden="true">${D.MODES[m].e}</span><b aria-hidden="true">${esc(nm)}</b>${b ? `<span class="mb" aria-hidden="true">🏆${b.score}</span>` : ''}</button>`; }).join('')}</div>
   <details class="disc tline"><summary>${esc(t('ui.sub'))} · ⚕️ ${esc(t('ui.disc1'))} <span class="mut" aria-hidden="true">ⓘ</span></summary><p>${esc(t('ui.disc'))}</p><p class="credit">${t('ui.by')}</p></details>`;
  show('#scr-title'); setDock(''); topbar();
  const tp = $('#scr-title .plant'); if (tp) { tp.style.setProperty('--g', '1'); tp.querySelectorAll('.lf').forEach((l, i) => l.style.setProperty('--s', [1, .9, .95, .8, .85, .75][i])); tp.classList.add('bloom'); }
}
/* ---------- event: big scene, short title, 2-3 big choices (label only); effects revealed after choosing ---------- */
function renderEvent() {
  const e = EVT[S.event], anyOk = e.choices.some(c => afford(S.pool, c.cost)), hint = !tut('e');
  $('#stage').innerHTML = `<article class="ev" aria-labelledby="evT">
      <button type="button" class="scene" id="storyBtn" aria-expanded="${storyOpen}" aria-controls="evStory" aria-label="${esc(t('ui.story'))}"><span class="orb o1" aria-hidden="true"></span><span class="orb o2" aria-hidden="true"></span><span class="ee" aria-hidden="true">${e.e}</span><span class="story" id="evStory" ${storyOpen ? '' : 'hidden'}>${esc(t('ev.' + e.id + '.x'))}</span></button>
      <h2 id="evT">${esc(t('ev.' + e.id + '.t'))}</h2>
      <div class="choices" role="group" aria-labelledby="evT">${e.choices.map((c, i) => { const ok = afford(S.pool, c.cost), n = csum(c.cost);
        return `<button type="button" class="choice" data-choice="${i}" ${ok ? '' : 'disabled'}><span>${esc(t('evs.' + e.id + '.c' + i))}</span>${n ? `<span class="cost" aria-hidden="true">⚡${n}</span>${srs(t('ui.cost4', { n }))}` : ''}${hint && i === 0 ? '<span class="hint4" aria-hidden="true">👆</span>' : ''}</button>`; }).join('')}
      ${anyOk ? '' : `<button type="button" class="choice" data-choice="-1"><span>${esc(t('ui.letPass'))}</span></button>`}</div></article>`;
  setDock('');
}
function commitChoice(i) {
  if (busy || S.phase !== 'event') return;
  const e = EVT[S.event], c = i >= 0 ? e.choices[i] : null;
  if (!chooseEvent(S, i)) { buzz('warning'); return; }
  tutDone('e'); storyOpen = false; picks = null; sfx('select'); buzz('medium'); save();
  const fx = c ? fxViz(c.fx, PM()) : '';
  const go = () => { clearTimeout(revealT); revealGo = null; busy = false; renderPlay(); focusH(); };
  if (!fx || FAST) return go();
  busy = true; revealGo = go; document.querySelectorAll('.hint4').forEach(h => h.remove());
  const b = document.querySelector(`[data-choice="${i}"]`); if (b) b.classList.add('picked');
  document.querySelectorAll('.choice').forEach(x => { if (x !== b) x.classList.add('away'); });
  const sc = $('#storyBtn'), rv = document.createElement('div'); rv.className = 'reveal'; rv.setAttribute('role', 'status'); rv.innerHTML = `<span class="sr">${esc(t('ui.fx4'))}: </span>${fx}`;
  if (sc) { const st = $('#evStory'); if (st) st.hidden = true; sc.appendChild(rv); }
  revealT = setTimeout(go, RM() ? 1600 : 1300);
}
/* ---------- plan: one energy meter + 4 big suggested habit tiles; everything else behind "More habits" ---------- */
function canAdd(id) { const h = HAB[id]; return !!h && !S.plan.includes(id) && !habitLocked(S, h) && afford(S.pool, habitCost(S, h)); }
function rankHabits() {
  const g = S.p, sc = h => { let s = 0; for (const k in h.fx) { const v = h.fx[k];
      if (PIDS.includes(k)) s += v > 0 ? v * (100 - g[k]) / 45 * (k === 'spirit' ? 0.7 : 1) : v * 1.4;
      else if (k === 'slp') s += -v * (0.4 + S.a.slp * 0.25); else if (k === 'str') s += -v * (0.3 + S.a.str * 0.2);
      else if (k === 'jnk' || k === 'scr') s += -v * (0.2 + S.a[k] * 0.15); else if (k === 'bnd' || k === 'fit') s += v * 0.5; }
    return s - csum(habitCost(S, h)) * 0.4; };
  const list = habitsFor(S).filter(h => !habitLocked(S, h) && afford(S.pool, habitCost(S, h))).map(h => [h, sc(h)]).sort((a, b) => b[1] - a[1]);
  const out = [], seen = {};
  list.forEach(([h]) => { if (out.length < 4 && !seen[h.p]) { out.push(h.id); seen[h.p] = 1; } });
  list.forEach(([h]) => { if (out.length < 4 && !out.includes(h.id)) out.push(h.id); });
  return out;
}
function meterHtml() { const n = poolN(), T = Math.max(baseN(), n);
  return `<div class="meter" role="img" aria-label="${esc(t('ui.energyL', { n, T }))}"><span class="mi" aria-hidden="true">⚡</span><span class="seg" aria-hidden="true">${Array.from({ length: T }, (_, j) => `<i class="${j < n ? 'on' : ''}"></i>`).join('')}</span><b aria-hidden="true">${n}</b></div>`; }
function tileHtml(id, hint) {
  const h = HAB[id], on = S.plan.includes(id), c = habitCost(S, h), lock = habitLocked(S, h), ok = on || (!lock && afford(S.pool, c)), n = csum(c);
  return `<button type="button" class="tile${on ? ' on' : ''}" data-habit="${id}" aria-pressed="${on}" ${ok ? '' : 'aria-disabled="true"'} style="--c:${pill(h.p).c}"><span class="te" aria-hidden="true">${h.e}</span><b>${esc(t('hbs.' + id))}</b><span class="dots" aria-hidden="true">${'<i></i>'.repeat(n)}</span><span class="tick" aria-hidden="true">✓</span>${srs(t('ui.cost4', { n }) + (lock ? '. ' + t('ui.done') : !ok ? '. ' + t('ui.notEnough') : ''))}${hint ? '<span class="hint4" aria-hidden="true">👆</span>' : ''}</button>`;
}
function renderPlan() {
  if (!picks) picks = rankHabits();
  const extra = S.plan.filter(id => !picks.includes(id)).length, hint = !tut('p');
  $('#stage').innerHTML = `<h2 class="sr" id="planT">${esc(t('ui.planS'))}</h2>
    ${meterHtml()}
    <div class="grid4" role="group" aria-labelledby="planT">${picks.map((id, i) => tileHtml(id, hint && i === 0)).join('')}</div>
    <button type="button" class="ghost morebtn" id="moreBtn" aria-haspopup="dialog">＋ ${esc(t('ui.more4'))}${extra ? ` <span class="badge" aria-label="${extra}">${extra}</span>` : ''}</button>`;
  setDock(`<button class="cta" id="endBtn">${esc(t('ui.done4'))} ▶</button>`);
}
function doToggle(id) {
  const was = S.plan.includes(id);
  if (!toggleHabit(S, id)) { buzz('warning'); sfx('bad'); document.querySelectorAll(`[data-habit="${id}"]`).forEach(b => { b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); }); announce(t('ui.notEnough')); return false; }
  tutDone('p'); sfx(was ? 'tap' : 'select'); buzz('light'); save();
  const inSheet = sheetKind === 'more'; renderPlan(); if (inSheet) openMore(true); topbar();
  const f = document.querySelector(inSheet ? `#sheetCard [data-habit="${id}"]` : `#stage [data-habit="${id}"]`); if (f) f.focus({ preventScroll: true });
  if (!was) floatFx(id);
  announce((was ? t('ui.remove') : t('ui.add')) + ': ' + t('hb.' + id + '.n') + '. ' + t('ui.energyL', { n: poolN(), T: baseN() }));
  return true;
}
/* ---------- sheets: More habits, plant details, quiz, help ---------- */
function openSheet(kind, html, label) { sheetKind = kind; const c = $('#sheetCard'); c.innerHTML = html; $('#sheet').setAttribute('aria-labelledby', label); $('#sheet').classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
function openMore(keep) {
  const y = keep ? $('#sheetCard').scrollTop : 0;
  openSheet('more', `<div class="sh"><h2 id="moreT">${esc(t('ui.more4'))}</h2><button class="x" id="sheetX" aria-label="${esc(t('ui.close'))}">✕</button></div>${meterHtml()}
    <div class="grid4 all" role="group" aria-labelledby="moreT">${habitsFor(S).filter(h => S.plan.includes(h.id) || !habitLocked(S, h)).map(h => tileHtml(h.id)).join('')}</div>
    <button class="cta sheetcta" id="sheetDone">${esc(t('ui.done4'))} ✓</button>`, 'moreT');
  $('#sheetCard').scrollTop = y;
}
function openPlant() {
  const st = S, g = wellbeing(st);
  openSheet('plant', `<div class="sh"><h2 id="plantT">${esc(t('ui.plantH'))}</h2><button class="x" id="sheetX" aria-label="${esc(t('ui.close'))}">✕</button></div>
    <div class="psheet">${plantSvg('pl-plant', 'ps')}<p class="wbn">🌱 ${g}<span class="sr"> ${esc(t('ui.wb'))}</span></p>
    <h3>${esc(t('ui.pillars'))}</h3>${D.PILLARS.map(p => { const v = Math.round(st.p[p.id]); return `<div class="prow" style="--c:${p.c}"><span aria-hidden="true">${p.e}</span><span>${esc(t('ps.' + p.id))}</span><span class="pbar" aria-hidden="true"><i style="width:${v}%"></i></span><b>${v}</b></div>`; }).join('')}
    <h3>${esc(t('ui.vitals'))}</h3>${D.VITALS.map(v => { const x = st.vit[v.id]; return `<div class="prow" style="--c:${VCOL(x)}"><span aria-hidden="true">${v.e}</span><span>${esc(t('v.' + v.id))}</span><span class="pbar" aria-hidden="true"><i style="width:${x}%"></i></span><b>${x}</b></div>`; }).join('')}
    <p class="tiny mut">${esc(t('ui.pointsNote'))}</p></div>`, 'plantT');
  setPlant($('#sheetCard .plant'), st);
}
function openQuiz() {
  const q = S.quiz, Q = q && QZ[q.id]; if (!Q) return;
  openSheet('quiz', `<div class="sh"><h2 id="quizT">❓ ${esc(t('ui.quiz'))} <span class="tk" aria-hidden="true">+1 ⚡</span></h2><button class="x" id="sheetX" aria-label="${esc(t('ui.close'))}">✕</button></div>
    <p class="qq">${esc(t('q.' + Q.id + '.q'))}</p>
    <div class="qo">${q.opts.map((o, i) => `<button type="button" data-quiz="${i}" class="${q.ans != null ? (o === 0 ? 'ok' : i === q.ans ? 'bad' : '') : ''}" ${q.ans != null ? 'disabled' : ''}>${esc(t('q.' + Q.id + '.o' + o))}</button>`).join('')}</div>
    ${q.ans == null && S.mode === 'school' && Q.hint ? `<details class="qhint"><summary>💡 ${esc(t('ui.hint'))}</summary>${esc(t('q.' + Q.id + '.h'))}</details>` : ''}
    ${q.ans != null ? `<p class="qr ${q.opts[q.ans] === 0 ? 'ok' : 'bad'}" role="status">${esc(q.opts[q.ans] === 0 ? t('ui.right') : t('ui.wrong', { a: t('q.' + Q.id + '.o0') }))}</p><button class="cta" id="sheetDone">${esc(t('ui.done4'))} ✓</button>` : ''}`, 'quizT');
}
/* ---------- result: the plant grows + one big number + one short fact line ---------- */
function factCard(id) {
  const f = FACT[id]; if (!f) return '';
  const trad = f.kind === 'trad';
  return `<aside class="fact${trad ? ' trad' : ''}" aria-label="${esc(t('ui.dyk'))}"><span class="fi" aria-hidden="true">${trad ? '🌿' : '📘'}</span><div class="fb"><span class="lbl">${esc(trad ? t('ui.tradNote') : t('ui.realFact'))}</span><p>${esc(t('fa.' + id))}</p><a class="srcchip" href="${f.url}" target="_blank" rel="noopener"><span aria-hidden="true">🔗</span> ${esc(f.src)}</a></div></aside>`;
}
function renderResult() {
  const L = S.last, w0 = wellbeing(L.before), w1 = wellbeing(S), dw = w1 - w0, f = L.fact && FACT[L.fact], q = S.quiz && QZ[S.quiz.id] ? S.quiz : null;
  const st = S.streak || 0;
  $('#stage').innerHTML = `<h2 class="sr" id="resT">${esc(t('ui.recapS', { n: S.week + 1 }))}</h2>
    <div class="rplant">${plantSvg('res-plant', 'rp')}</div>
    <div class="bignum ${dw >= 0 ? 'up' : 'dn'}" role="img" aria-label="${esc(t('ui.wb'))} ${w1} (${dw >= 0 ? '+' : '−'}${Math.abs(dw)})${st >= 2 ? ', ' + esc(t('ui.streak', { n: st })) : ''}"><b id="wbN" aria-hidden="true">${w1}</b><em aria-hidden="true">${dw >= 0 ? '▲' : '▼'}${Math.abs(dw)}</em>${st >= 2 ? `<span class="stk" aria-hidden="true">🔥${st}</span>` : ''}</div>
    ${f ? `<p class="fline${f.kind === 'trad' ? ' trad' : ''}"><span aria-hidden="true">${f.kind === 'trad' ? '🌿' : '📘'}</span> <span class="ft">${esc(t('fas.' + L.fact))}</span> <a class="src" href="${f.url}" target="_blank" rel="noopener" title="${esc(f.src)}" aria-label="${esc(t('ui.src4'))}: ${esc(f.src)}">${esc(t('ui.src4'))} ↗</a></p>` : ''}
    ${q ? (q.ans == null ? `<button type="button" class="quizc" id="quizBtn" aria-haspopup="dialog">❓ ${esc(t('ui.quiz4'))}</button>` : `<span class="quizc done" role="img" aria-label="${esc(q.opts[q.ans] === 0 ? t('ui.right') : t('ui.wrong', { a: t('q.' + q.id + '.o0') }))}">${q.opts[q.ans] === 0 ? '✓ ⚡' : '✗'}</span>`) : ''}`;
  const last = S.week + 1 >= S.T;
  setDock(`<button class="cta${last ? ' green' : ''}" id="nextBtn">${esc(last ? t('ui.report') : t('ui.next4'))} ▶</button>`);
  const rp = $('#stage .res-plant');
  if (RM() || FAST) setPlant(rp, S); else { setPlant(rp, { p: L.before.p, vit: L.before.vit }); requestAnimationFrame(() => setTimeout(() => setPlant(rp, S), 260)); countUp($('#wbN'), w1, w0); }
}
function hideToast() { const el = $('#toast'); if (el) el.classList.remove('on'); }
function renderPlay() {
  hideToast(); show('#scr-play');
  const sp = $('#scr-play'); sp.dataset.v = S.phase;
  const st = $('#stage'); st.classList.remove('enter'); void st.offsetWidth; st.classList.add('enter');
  if (S.phase === 'event') renderEvent(); else if (S.phase === 'plan') renderPlan(); else if (S.phase === 'result') renderResult();
  topbar();
}
/* ---------- report card: big plant, score, one line of style, 2 buttons; everything else behind Details ---------- */
function radar(vals) {
  const n = 6, cx = 110, cy = 110, R = 76, pt = (i, r) => [cx + r * Math.sin(2 * Math.PI * i / n), cy - r * Math.cos(2 * Math.PI * i / n)];
  const grid = [0.25, 0.5, 0.75, 1].map(f => `<polygon points="${Array.from({ length: n }, (_, i) => pt(i, R * f).join(',')).join(' ')}" class="rg"/>`).join('');
  const shape = vals.map((v, i) => pt(i, R * v / 100).join(',')).join(' ');
  const labels = D.PILLARS.map((p, i) => { const [x, y] = pt(i, R + 22); return `<span class="rl" style="left:${(x / 2.2).toFixed(1)}%;top:${(y / 2.2).toFixed(1)}%;--c:${p.c}" aria-hidden="true">${p.e}<b>${Math.round(vals[i])}</b></span>`; }).join('');
  const dots = vals.map((v, i) => { const [x, y] = pt(i, R * v / 100); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="${D.PILLARS[i].c}"/>`; }).join('');
  return `<div class="radar"><svg viewBox="0 0 220 220" role="img" aria-label="${esc(t('ui.balance'))}: ${D.PILLARS.map((p, i) => t('ps.' + p.id) + ' ' + Math.round(vals[i])).join(', ')}">${grid}<polygon points="${shape}" class="rs"/>${dots}</svg>${labels}</div>`;
}
let endInfo = null;
function finishRecord() {
  const r = S.result, key = bestKey(S.mode), b = store.get(key), plays = ((b && b.plays) || 0) + 1;
  const rec = { score: r.total, grade: r.grade === 'E' ? '' : EN['g.' + r.grade], gk: r.grade, title: EN['ti.' + r.ti], mode: S.mode, date: new Date().toISOString().slice(0, 10), plays, seed: S.seed };
  const isBest = !b || r.total > b.score;
  store.set(key, isBest ? rec : Object.assign(b, { plays }));
  store.del(SAVE_KEY);
  endInfo = { isBest, prev: b ? b.score : null };
}
function renderEnd(keepFocus) {
  const r = S.result || (S.result = score(S)), [, emo] = D.TITLES[r.ti];
  if (!endInfo) endInfo = { isBest: false, prev: (store.get(bestKey(S.mode)) || {}).score };
  const C2 = 2 * Math.PI * 52, ring2 = `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="rt"/><circle cx="60" cy="60" r="52" class="rv" style="stroke-dasharray:${(C2 * r.total / 100).toFixed(1)} ${C2.toFixed(1)}"/></svg>`;
  const helped = r.helped.map(id => ['h' + id, `${HAB[id].e}<small>×${S.counts[id]}</small>`, t('hp.' + id), pill(HAB[id].p).c]);
  $('#scr-end').innerHTML = `<div class="end-hero">${plantSvg('end-plant')}<div class="score-ring">${ring2}<div class="sv"><b id="scoreN" aria-hidden="true">${r.total}</b><small aria-hidden="true">/100</small></div><span class="grade" aria-hidden="true">${esc(t('g.' + r.grade))}</span>${endInfo.isBest ? '<span class="nbx" aria-hidden="true">✨</span>' : ''}</div></div>
    <h1 class="etitle">${emo} ${esc(t('ti.' + r.ti))}</h1>
    <p class="sr">${esc(t('ui.report'))}. ${esc(t('ui.score'))}: ${r.total} ${esc(t('ui.outOf'))}, ${esc(t('g.' + r.grade))}${endInfo.isBest ? '. ' + esc(t('ui.newBest')) : ''}</p>
    <div class="endbtns"><button class="cta" id="againBtn">↻ ${esc(t('ui.again'))}</button><button class="ghost" id="detailsBtn" aria-expanded="${endOpen}" aria-controls="endMore">${esc(t('ui.details'))} ${endOpen ? '▴' : '▾'}</button></div>
    <div id="endMore" ${endOpen ? '' : 'hidden'}>
      <div class="echips">${endInfo.isBest ? `<span class="chip nb">✨ ${esc(t('ui.newBest'))}</span>` : endInfo.prev != null ? `<span class="chip">🏆 ${esc(t('ui.prevBest', { s: endInfo.prev }))}</span>` : ''}<span class="chip arch">${esc(t('ar.' + r.arch))}</span></div>
      <div class="card bal">${radar(r.vals)}<div class="subs"><span title="${esc(t('ui.pillars'))}"><i aria-hidden="true">🏛️</i><b>${r.pillarScore}</b><small>${esc(t('ui.pillarsS'))}</small></span><span title="${esc(t('ui.vitals'))}"><i aria-hidden="true">💓</i><b>${r.vitScore}</b><small>${esc(t('ui.vitalsS'))}</small></span><span title="${esc(t('ui.sustain'))}"><i aria-hidden="true">♻️</i><b>${r.sustain}</b><small>${esc(t('ui.sustainS'))}</small></span></div></div>
      <div class="card helped"><h2>✅ ${esc(t('ui.helped'))}</h2>${helped.length ? tipChips(helped, 'big') : `<div class="empty"><span class="ei" aria-hidden="true">🌱</span><p>${esc(t('ui.noHelped2'))}</p></div>`}</div>
      ${r.tips.length ? `<details class="card more"><summary><h2>💡 ${esc(t('ui.tipsS'))} <small>${r.tips.length}</small></h2></summary><ul>${r.tips.map(k => `<li>${esc(t('tip.' + k))}</li>`).join('')}</ul></details>` : ''}
      <details class="card more"><summary><h2>📘 ${esc(t('ui.facts'))} <small>${S.factsSeen.length}</small></h2></summary>${S.factsSeen.map(factCard).join('')}</details>
      <button class="ghost" id="otherBtn">${esc(t('ui.otherMode'))}</button>
      ${discLine()}${footLinks()}
    </div>`;
  hideToast(); setDock(''); show('#scr-end'); topbar();
  setPlant($('#scr-end .plant'), S); if (!keepFocus) countUp($('#scoreN'), r.total); else $('#scoreN').textContent = r.total;
  if (!keepFocus && !RM() && !FAST && (endInfo.isBest || r.total >= 60)) setTimeout(confetti, 350);
}
function floatFx(id) {
  if (RM() || FAST || !S.plan.includes(id)) return; const b = document.querySelector(`#sheet:not(.hidden) [data-habit="${id}"]`) || document.querySelector(`#stage [data-habit="${id}"]`); if (!b) return;
  const h = HAB[id], r = b.getBoundingClientRect(), f = document.createElement('div'); f.className = 'floaty'; f.setAttribute('aria-hidden', 'true');
  f.textContent = Object.keys(h.fx).filter(k => PIDS.includes(k) && h.fx[k] > 0).map(k => pill(k).e).join('') + ' +'; f.style.left = (r.left + r.width / 2 - 24) + 'px'; f.style.top = (r.top + window.scrollY) + 'px';
  document.body.appendChild(f); setTimeout(() => f.remove(), 950);
}
function countUp(el, to, from = 0) { if (!el) return; if (RM() || FAST) { el.textContent = to; return; } const t0 = performance.now(), d = 900; const step = n => { const k = Math.min(1, (n - t0) / d); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
function confetti(n = 46) {
  if (RM() || FAST) return;
  const box = document.createElement('div'); box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
  const pal = D.PILLARS.map(p => p.c).concat(['#f7c55c', '#ef7b5f']);
  for (let j = 0; j < n; j++) { const i = document.createElement('i'), a = Math.random() * Math.PI * 2, r = 90 + Math.random() * 180; i.style.cssText = `--c:${pal[j % pal.length]};--x:${Math.cos(a) * r}px;--y:${Math.sin(a) * r * .8 + 140}px;--r:${(Math.random() * 720 - 360) | 0}deg;--d:${(Math.random() * 140) | 0}ms`; box.appendChild(i); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 2000);
}
/* ---------- help sheet: every explanation, sources and the full disclaimer live here ---------- */
function openHelp() {
  const srcs = [...new Map(D.FACTS.map(f => [f.src, f.url])).entries()];
  openSheet('help', `<div class="sh"><h2 id="helpT">${esc(t('ui.helpH1'))}</h2><button class="x" id="sheetX" aria-label="${esc(t('ui.close'))}">✕</button></div>
    ${IN_APP ? '' : `<div class="panel"><h3>${esc(t('ui.language'))}</h3>${langPicker()}</div>`}
    <div class="panel"><p>${t('ui.h4a')}</p><p>${t('ui.h4b')}</p><p>${t('ui.h4c')}</p><p>${t('ui.h4d')}</p></div>
    <div class="panel"><h3>${esc(t('ui.helpH2'))}</h3><ul>${t('ui.helpI')}</ul></div>
    <div class="panel"><h3>${esc(t('ui.helpH3'))}</h3><ul>${Object.keys(D.MODES).map(m => `<li><b>${D.MODES[m].e} ${esc(t('mode.' + m + '.name'))}</b> (${esc(t('mode.' + m + '.age'))}, ${esc(t('ui.weeks', { n: D.MODES[m].T }))}): ${esc(t('mode.' + m + '.tag'))}</li>`).join('')}</ul></div>
    <div class="panel"><h3>🌿 ${esc(t('ui.helpH4'))}</h3><p>${t('ui.helpTrad')}</p><p class="warn">${t('ui.helpHerb')}</p><details><summary>${esc(t('ui.season'))}</summary><ul>${D.RITU.map(r => `<li>${r.e} <b>${esc(t('ritu.' + r.id))}</b>: ${esc(t('rtip.' + r.id))}</li>`).join('')}</ul></details><details><summary>${esc(t('ui.helpH8'))}</summary><dl class="gloss">${t('ui.gloss')}</dl></details></div>
    <div class="panel"><h3>📘 ${esc(t('ui.helpH5'))}</h3><p>${esc(t('ui.helpSep'))}</p><p>${esc(t('ui.pointsNote'))}</p></div>
    <div class="panel"><h3>⚕️ ${esc(t('ui.helpH6'))}</h3><p>${t('ui.helpDisc')}</p></div>
    <details class="panel"><summary><h3>${esc(t('ui.helpH7'))}</h3></summary><ul class="srcs">${srcs.map(([s, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(s)}</a></li>`).join('')}</ul></details>
    <div class="hrs-links"><a href="../../index.html">🏠 ${esc(t('ui.allGames'))}</a><a href="../../about.html">${esc(t('ui.about'))}</a><a href="../../privacy.html">${esc(t('ui.privacy'))}</a></div><p class="credit">${t('ui.by')}</p>`, 'helpT');
}
function closeHelp() { const k = sheetKind; sheetKind = null; $('#sheet').classList.add('hidden'); document.body.style.overflow = ''; if (k === 'quiz' && S && S.phase === 'result') { renderResult(); const n = $('#nextBtn'); if (n) n.focus({ preventScroll: true }); } else if (k === 'more') { const m = $('#moreBtn'); if (m) m.focus({ preventScroll: true }); } else if (k === 'plant') $('#plantBtn').focus({ preventScroll: true }); }
function confirmNew(onOk) {
  const r = loadSave(); if (!r) return onOk();
  openSheet('confirm', `<div class="sh"><h2 id="cnT">${esc(t('ui.newConfirm'))}</h2></div><p>${esc(t('ui.newConfirmP', { l: saveLabel(r.S) }))}</p><div class="endbtns"><button class="ghost" id="cnNo">${esc(t('ui.cancel'))}</button><button class="cta" id="cnYes">${esc(t('ui.startNew'))}</button></div>`, 'cnT');
  $('#cnNo').onclick = closeHelp; $('#cnYes').onclick = () => { closeHelp(); store.del(SAVE_KEY); onOk(); };
}

/* ================= app layer: flow, autosave, events ================= */
function save() { if (S && !S.over) store.set(SAVE_KEY, { v: 1, t: Date.now(), S }); }
function resetUi() { storyOpen = false; picks = null; endOpen = false; }
function start(m, seed) {
  mode = m; store.set(LAST_MODE, m); endInfo = null; resetUi();
  S = newGame(m, seed != null ? seed : (Date.now() ^ (Math.random() * 1e9)) >>> 0); S.streak = 0;
  save(); sfx('event'); renderPlay(); focusH(); announce(t('ev.' + S.event + '.t'));
}
function resume(rec) {
  S = rec.S; mode = S.mode; endInfo = null; resetUi(); renderPlay(); focusH();
  toast(t('ui.welcome', { m: t('mode.' + S.mode + '.name'), n: S.week + 1, T: S.T }));
}
let toastT = 0;
function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 1600); announce(msg); }
function act(fn) { if (busy) return; fn(); }
function doEndWeek() {
  const w0 = wellbeing(S), r = endWeek(S); if (!r) return;
  const w1 = wellbeing(S); S.streak = w1 >= w0 ? (S.streak || 0) + 1 : 0;
  save(); const good = w1 >= w0; sfx(good ? 'good' : 'bad'); buzz(good ? 'success' : 'warning'); renderPlay(); focusH(); announce(t('ui.recapS', { n: S.week + 1 }) + '. ' + t('ui.wb') + ' ' + w1);
  if (w1 >= 66 && w0 < 66 && !S.flags.bloom) { S.flags.bloom = 1; save(); toast('🌸 ' + t('ui.bloom')); confetti(30); }
  else if (S.streak >= 3 && S.streak % 3 === 0) confetti(24);
}
document.addEventListener('click', e => {
  if (revealGo && e.target.closest('#scr-play')) { e.preventDefault(); return revealGo(); }
  const el = e.target.closest('button,[data-lang]'); if (!el) return;
  if (el.dataset.lang) { if (HAS_HRS) HRS.setLang(el.dataset.lang); else { try { localStorage.setItem('hrs-lang', el.dataset.lang); } catch (x) {} } setLang(el.dataset.lang); return; }
  if (el.dataset.tip) return toggleTip(el);
  if (el.dataset.mode) return act(() => { sfx('select'); buzz('light'); confirmNew(() => start(el.dataset.mode)); });
  if (el.id === 'contBtn') { const r = loadSave(); return r ? resume(r) : renderTitle(); }
  if (el.id === 'helpBtn') { sfx('tap'); return openHelp(); }
  if (el.id === 'sheetX' || el.id === 'sheetDone') return closeHelp();
  if (!S) return;
  if (el.id === 'plantBtn') { sfx('tap'); buzz('light'); return openPlant(); }
  if (el.id === 'storyBtn') { if (busy) return; storyOpen = !storyOpen; sfx('tap'); buzz('light'); $('#evStory').hidden = !storyOpen; el.setAttribute('aria-expanded', storyOpen); return; }
  if (el.dataset.choice !== undefined && S.phase === 'event') { if (el.disabled) return; return commitChoice(+el.dataset.choice); }
  if (el.dataset.habit) return doToggle(el.dataset.habit);
  if (el.id === 'moreBtn') { sfx('tap'); return openMore(); }
  if (el.id === 'endBtn') return act(doEndWeek);
  if (el.id === 'quizBtn') { sfx('tap'); return openQuiz(); }
  if (el.dataset.quiz !== undefined) { const ok = answerQuiz(S, +el.dataset.quiz); if (ok == null) return; sfx(ok ? 'milestone' : 'bad'); buzz(ok ? 'success' : 'warning'); save(); openQuiz(); const d = $('#sheetDone'); if (d) d.focus({ preventScroll: true }); if (ok) confetti(18); return; }
  if (el.id === 'nextBtn') return act(() => { nextWeek(S); resetUi(); if (S.phase === 'end') { finishRecord(); sfx('end'); buzz('success'); renderEnd(); focusH(); return; } save(); sfx('event'); renderPlay(); focusH(); announce(t('ev.' + S.event + '.t')); });
  if (el.id === 'againBtn') return start(S.mode);
  if (el.id === 'detailsBtn') { endOpen = !endOpen; sfx('tap'); renderEnd(true); $('#detailsBtn').focus({ preventScroll: true }); return; }
  if (el.id === 'otherBtn') { S = null; renderTitle(); focusH(); return; }
});
document.addEventListener('keydown', e => {
  if (!$('#sheet').classList.contains('hidden')) { if (e.key === 'Escape') closeHelp(); return; }
  if (!S || e.target.closest('input,select,textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
  if (revealGo && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); return revealGo(); }
  if (S.phase === 'event' && /^[1-3]$/.test(e.key)) { const b = document.querySelector(`[data-choice="${+e.key - 1}"]`); if (b && !b.disabled) { e.preventDefault(); commitChoice(+e.key - 1); } }
  else if (S.phase === 'plan' && /^[1-4]$/.test(e.key) && $('#scr-end').hidden) { const b = document.querySelectorAll('#stage .tile')[+e.key - 1]; if (b) { e.preventDefault(); doToggle(b.dataset.habit); } }
  else if (e.key === 'Enter' && (document.activeElement === document.body || /^H[12]$/.test(document.activeElement.tagName))) { const b = $('#endBtn') || $('#nextBtn'); if (b) { e.preventDefault(); b.click(); } }
});
$('#sheet').addEventListener('click', e => { if (e.target === $('#sheet')) closeHelp(); });
window.addEventListener('resize', fitDock);
if (window.ResizeObserver) new ResizeObserver(fitDock).observe(document.getElementById('dock'));
if (HAS_HRS) {
  HRS.dialog({ overlay: $('#sheet'), box: $('#sheetCard'), isOpen: () => !$('#sheet').classList.contains('hidden'), isDismissible: () => true, close: closeHelp });
  HRS.onBack(() => { if (S && !$('#scr-play').hidden) { save(); return false; } return false; });
}
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
window.addEventListener('pagehide', save);
/* language */
function rerender() {
  document.documentElement.lang = LANG;
  const k = sheetKind;
  if (!S || !$('#scr-title').hidden) renderTitle(); else if (S.phase === 'end') renderEnd(true); else renderPlay();
  if (k === 'help') openHelp(); else if (k === 'plant' && S) openPlant(); else if (k === 'more' && S && S.phase === 'plan') openMore(true); else if (k === 'quiz' && S) openQuiz();
}
function setLang(l) { l = LANGS.includes(l) ? l : 'en'; if (l === LANG && document.documentElement.lang === l) return; LANG = l; rerender(); }
window.addEventListener('hrs-lang-change', e => setLang(e.detail && e.detail.lang));
window.addEventListener('storage', e => { if (e.key === 'hrs-lang') setLang(String(e.newValue || 'en').replace(/"/g, '')); });

/* test hooks */
window.__oyh = { get S() { return S; }, get phase() { return S ? S.phase : 'title'; }, get view() { return $('#scr-end').hidden ? ($('#scr-play').hidden ? 'title' : $('#scr-play').dataset.v) : 'end'; }, start, choose: i => commitChoice(i), get picks() { return picks; }, t, get lang() { return LANG; }, setLang, SAVE_KEY, bestKey, TUT_KEY, loadSave, wellbeing: () => S && wellbeing(S), cost: id => S && habitCost(S, HAB[id]) };

/* boot */
LANG = readLang(); document.documentElement.lang = LANG;
if (FAST) document.documentElement.classList.add('fast');
if (QS.get('new')) store.del(SAVE_KEY);
if (QS.has('notour')) store.set(TUT_KEY, { e: 1, p: 1 });
const qm = QS.get('mode');
if (qm && D.MODES[qm]) start(qm, QS.get('seed') ? +QS.get('seed') : undefined);
else if (QS.get('continue') && loadSave()) resume(loadSave());
else { renderTitle(); }
})();
