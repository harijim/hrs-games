/* Optimise Your Health: game content (English source text). © 2026 Harpreet Raj Singh.
   Two kinds of content live here and are kept apart on purpose:
   1. GAME RULES (PILLARS, HABITS, EVENTS, MODES): invented, simplified mechanics. Numbers are game points, not medical data.
   2. REAL FACTS (FACTS): short, labelled "Did you know" notes, each with a named public source and link, checked in Oct 2026.
   Hindi and Punjabi text lives in oyh-i18n.js under the same keys. */
'use strict';
(function (root) {
const OYH = root.OYH_DATA = {};

/* ---------- modes (real differences in length, pool, drains, hints, quizzes and content) ---------- */
OYH.MODES = {
  school: { e: '🎒', T: 6, m0: 5, energy: 12, drain: { slp: 1, str: 0.6, jnk: 0.3, scr: 0.6 }, preview: 'exact', quiz: [1, 4], quizOpts: 2, curveball: 0, floor: 45, decay: 1.5 },
  college: { e: '🎓', T: 8, m0: 6, energy: 13, drain: { slp: 1, str: 1, jnk: 0.3, scr: 0.6 }, preview: 'arrows', quiz: [2, 5], quizOpts: 3, curveball: 0, floor: 0, decay: 2 },
  adult: { e: '💼', T: 10, m0: 6, energy: 12, drain: { slp: 1, str: 1.5, jnk: 0.5, scr: 0.5 }, preview: 'hidden', quiz: [], quizOpts: 3, curveball: 0.4, floor: 0, decay: 2 },
};
OYH.MODE_TEXT = {
  school: { name: 'School', age: 'Ages 10–14', tag: 'Build happy habits. Clear hints, hard to fail.' },
  college: { name: 'College', age: 'Ages 15–22', tag: 'Exams, hostels, fests. Hidden costs and quick quizzes.' },
  adult: { name: 'Adult / Expert', age: 'Work + family', tag: 'Deadlines, family, curveballs. Effects compound. No hints.' },
};

/* ---------- calendar: each turn is one typical week from the next month, so a run shows the seasons ---------- */
OYH.MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Ayurveda's six ritus (approximate months): game flavour + the "seasonal & local food" bonus
OYH.RITU = [
  { id: 'shishir', months: [0, 1], e: '❄️', name: 'Shishir (late winter)' },
  { id: 'vasant', months: [2, 3], e: '🌸', name: 'Vasant (spring)' },
  { id: 'grishma', months: [4, 5], e: '☀️', name: 'Grishma (summer)' },
  { id: 'varsha', months: [6, 7], e: '🌧️', name: 'Varsha (monsoon)' },
  { id: 'sharad', months: [8, 9], e: '🍂', name: 'Sharad (autumn)' },
  { id: 'hemant', months: [10, 11], e: '🧣', name: 'Hemant (early winter)' },
];
OYH.RITU_TIP = {
  shishir: 'Tradition says: warm, nourishing meals and an oil massage suit the cold months.',
  vasant: 'Tradition says: lighter meals and more movement as spring arrives.',
  grishma: 'Tradition says: cooling, light food, plenty of water and rest in the midday heat.',
  varsha: 'Tradition says: warm, easily digestible food in the monsoon.',
  sharad: 'Tradition says: as the rains end, ease back into a regular routine.',
  hemant: 'Tradition says: appetite rises in early winter; enjoy wholesome, warm food.',
};

/* ---------- the six pillars ---------- */
OYH.PILLARS = [
  { id: 'body', e: '🌿', c: '#3f9d68', name: 'Body & natural living', short: 'Body' },
  { id: 'mind', e: '🧠', c: '#5b7fcf', name: 'Mind (IQ & focus)', short: 'Mind' },
  { id: 'heart', e: '❤️', c: '#e2706a', name: 'Heart (EQ & relationships)', short: 'Heart' },
  { id: 'spirit', e: '🕊️', c: '#9a84cf', name: 'Spirit & meaning (optional)', short: 'Spirit' },
  { id: 'work', e: '💼', c: '#2f969b', name: 'Work & balance', short: 'Work' },
  { id: 'fun', e: '🎉', c: '#eea63a', name: 'Fun & joy', short: 'Fun' },
];
OYH.VITALS = [
  { id: 'energy', e: '⚡', name: 'Energy' }, { id: 'mood', e: '😊', name: 'Mood' },
  { id: 'immunity', e: '🛡️', name: 'Immunity' }, { id: 'focus', e: '🎯', name: 'Focus' },
];
OYH.RES = [{ id: 'e', e: '⚡', name: 'Energy' }]; // one shared weekly pool (v4.1)
// hidden "life accumulators" (game mechanics): sleep debt, stress, convenience-food load, late screens, bond bank, fitness
OYH.ACC = { slp: 'Sleep debt', str: 'Stress', jnk: 'Junk-food load', scr: 'Late-night screens', bnd: 'Bond bank', fit: 'Fitness base' };

/* ---------- weekly habits (game rules). cost = ⚡ energy from the one shared weekly pool; fx: pillar / accumulator deltas.
   trad: Ayurveda / yoga tradition theme. modes: s c a ---------- */
const H = (id, p, e, cost, fx, modes, name, desc, extra) => Object.assign({ id, p, e, cost, fx, modes, name, desc }, extra || {});
OYH.HABITS = [
  H('sleep', 'body', '😴', 3, { slp: -3, body: 2, mind: 1 }, 'sca', 'Early to bed, early to rise', 'Lights out on time for a full night: kids 9–12 h, teens 8–10 h, adults 7+ h.', { noTax: 1 }),
  H('walk', 'body', '🚶', 2, { body: 3, fit: 1, fun: 1, str: -0.5 }, 'sca', 'Walk, cycle or play outside', 'Every bit of movement counts. Take the stairs, cycle to class, walk after dinner.'),
  H('sport', 'body', '🏸', 3, { body: 5, fit: 2, fun: 1, str: -1 }, 'sca', 'Sport or strength training', 'Badminton, kabaddi, the gym or a dance class. Needs good sleep to recover.', { intense: 1 }),
  H('thali', 'body', '🍛', 3, { body: 4, jnk: -2 }, 'sca', 'Home-cooked thali', 'Dal, sabzi, roti or rice, curd and salad: half the plate veggies and fruit.'),
  H('seasonal', 'body', '🥭', 2, { body: 2, jnk: -1 }, 'sca', 'Seasonal & local foods', 'What is fresh at the sabzi mandi this month. Bonus when it matches the season (ritucharya).', { trad: 1, season: 1 }),
  H('mindful', 'body', '🫗', 1, { body: 1, jnk: -1, spirit: 1 }, 'sca', 'Mindful eating & water', 'Eat slowly without screens and sip water through the day (warm, if you like, as tradition suggests).', { trad: 1 }),
  H('yoga', 'body', '🧘', 2, { body: 2, spirit: 2, str: -1.5, fit: 0.5 }, 'sca', 'Yoga & pranayama', 'Surya namaskar, a few asanas and slow breathing.', { trad: 1, noTax: 1 }),
  H('abhyanga', 'body', '🫙', 2, { spirit: 2, slp: -1, str: -1, body: 1 }, 'ca', 'Dinacharya: oil massage & warm bath', 'Abhyanga, the traditional self-massage with sesame, mustard or coconut oil, then a warm bath.', { trad: 1, noTax: 1 }),
  H('hygiene', 'body', '🧼', 1, { hyg: 1, body: 1 }, 'sca', 'Hygiene basics', 'Wash hands with soap, brush twice a day, keep nails short. Low effort, big payoff.'),
  H('nature', 'body', '🌳', 1, { spirit: 2, body: 1, str: -1, fun: 1 }, 'sca', 'Nature & sunlight time', 'A park, a terrace garden, a riverside bench. Phone stays in the pocket.'),
  H('checkup', 'body', '🩺', 3, { chk: 1, body: 1 }, 'sca', 'Preventive check-up', 'Kids & college: dental and eye check. Adults: blood pressure and blood sugar too.', { once: 1 }),
  H('herbs', 'body', '🍵', 1, { spirit: 1, fun: 1, slp: -0.5 }, 'sca', 'Kitchen-herb ritual', 'Tulsi-adrak chai, ajwain water or haldi doodh as a cosy wind-down. Comfort, not a cure.', { trad: 1, noTax: 1 }),
  H('study', 'mind', '📚', 4, { mind: 5, work: 2 }, 'sca', 'Deep learning block', 'Phone in another room, one subject, real concentration.'),
  H('read', 'mind', '📖', 2, { mind: 3, fun: 1 }, 'sca', 'Read, puzzle or learn a skill', 'A novel, chess, a coding tutorial, sudoku in the newspaper.'),
  H('curfew', 'mind', '📵', 1, { scr: -3, slp: -0.5, mind: 1 }, 'sca', 'Phone out of the bedroom', 'A screen curfew an hour before sleep. The memes will still be there tomorrow.', { noTax: 1 }),
  H('family', 'heart', '👨‍👩‍👧', 2, { heart: 4, bnd: 2 }, 'sca', 'Family meal or ritual', 'Dinner together, Sunday paratha breakfast, evening chai on the balcony.'),
  H('friend', 'heart', '🤗', 2, { heart: 3, fun: 2, bnd: 1 }, 'sca', 'Meet or call a friend', 'A real conversation, not just a sticker reply.'),
  H('help', 'heart', '🤝', 2, { heart: 2, spirit: 3 }, 'sca', 'Help someone / seva', 'Teach a neighbour\'s kid, volunteer, serve at a community kitchen.'),
  H('quiet', 'spirit', '🙏', 2, { spirit: 4, str: -2 }, 'sca', 'Quiet time', 'Prayer, meditation, gratitude or simple reflection. Any faith or none, whatever gives you calm.', { noTax: 1 }),
  H('gratitude', 'spirit', '📝', 1, { spirit: 2, heart: 1, str: -0.5 }, 'ca', 'Gratitude note before bed', 'Three good things from today. Even "the chai was perfect" counts.', { noTax: 1 }),
  H('work', 'work', '💼', 5, { work: 6, str: 0.5 }, 'sca', 'Focused work or homework', 'Get the important stuff done. Kids: homework and projects.'),
  H('overtime', 'work', '🌃', 4, { work: 8, slp: 2, str: 2 }, 'ca', 'Overtime / late-night cram', 'Feels productive tonight. Your future self may disagree.', { noTax: 1 }),
  H('chores', 'work', '🧹', 2, { work: 2, heart: 2 }, 'sca', 'Chores & helping at home', 'Laundry, dishes, sabzi shopping. Shared chores, shared peace.'),
  H('boundary', 'work', '🛑', 1, { str: -2, work: -1, heart: 1 }, 'ca', 'Log off on time', 'Notifications off after work. The email can wait until 10 a.m.', { noTax: 1 }),
  H('play', 'fun', '🎸', 2, { fun: 5, body: 1, str: -1 }, 'sca', 'Hobby or play', 'Music, dance, gully cricket, painting, cooking something new.'),
  H('series', 'fun', '🎬', 1, { fun: 3, scr: 1 }, 'sca', 'Movie or series night', 'One episode is a treat. Six is a lifestyle.', { noTax: 1 }),
  H('hangout', 'fun', '😂', 2, { fun: 3, heart: 2, str: -0.5 }, 'sca', 'Hang out & laugh', 'Chai, gossip, terrible jokes. Joy counts too.'),
];

/* ---------- event cards (humour + real-life trade-offs). Each choice: cost = ⚡ energy, fx now, l (later) = [{in: weeks, fx, m: message}].
   months: optional month numbers (0 = Jan) when the card fits the calendar. ---------- */
const C = (label, cost, fx, l) => ({ label, cost, fx, l: l || [] });
const E = (id, e, modes, months, title, text, choices, extra) => Object.assign({ id, e, modes, months, title, text, choices }, extra || {});
OYH.EVENTS = [
  E('monsoon', '☔', 'sca', [6, 7], 'Monsoon cancels your walk', 'The sky has opened like a pressure-cooker lid. Your evening walk is officially a swim.', [
    C('Indoor yoga and stretching', 2, { body: 2, spirit: 2, str: -1 }),
    C('Couch, chai and pakoras', 0, { fun: 3, jnk: 2 }),
    C('Bollywood dance with family', 2, { fun: 3, heart: 2, body: 2 })], { fact: 'ritucharya' }),
  E('diwali', '🪔', 'sca', [9, 10], 'Diwali: the mithai mountain', 'Every neighbour has sent a box. The kaju katli is making direct eye contact.', [
    C('Enjoy a few, share the rest', 1, { heart: 3, fun: 3, jnk: 1 }),
    C('It\'s festival! Eat everything', 0, { fun: 5, jnk: 4 }, [{ in: 1, fx: { en: -1, body: -2 }, m: 'sugarcrash' }]),
    C('Gift fruit and dry-fruit platters instead', 2, { heart: 3, body: 2, fun: 1 })], { fact: 'sugar' }),
  E('wedding', '💍', 'ca', [10, 11, 0, 1], 'Cousin\'s 3-day wedding', 'Sangeet till 2 a.m., haldi at 9. Your aunt asks when YOUR wedding is.', [
    C('All in: dance at every function', 6, { heart: 6, fun: 7, slp: 3, jnk: 1 }, [{ in: 1, fx: { en: -1 }, m: 'weddinghangover' }]),
    C('Key functions only, sleep in between', 3, { heart: 4, fun: 4 }),
    C('Skip it, cite a "deadline"', 0, { work: 3, heart: -4 }, [{ in: 2, fx: { heart: -2 }, m: 'familyremembers' }])]),
  E('exams', '📝', 'sc', [8, 11, 1, 2], 'Exams next week', 'The syllabus is 14 chapters. You have read the title page with great confidence.', [
    C('Steady revision and proper sleep', 4, { mind: 5, work: 4, slp: -1 }),
    C('All-nighter fuelled by chai', 4, { mind: 3, work: 5, slp: 4 }, [{ in: 1, fx: { mind: -3, at: -1 }, m: 'focuscrash' }]),
    C('Study group with friends', 4, { mind: 4, heart: 3, fun: 1 })], { fact: 'sleeplearn' }),
  E('deadline', '💻', 'a', null, 'Boss: "Small change, by EOD?"', 'It is 6:58 p.m. The "small change" has 14 sub-points and a pie chart.', [
    C('Overtime till midnight', 4, { work: 7, slp: 3, str: 3 }, [{ in: 2, fx: { body: -3 }, m: 'backache' }]),
    C('Negotiate: deliver tomorrow morning', 2, { work: 3, str: -1 }),
    C('Do 80% now, then family dinner', 3, { work: 3, heart: 3, str: 1 })], { fact: 'longhours' }),
  E('groupchat', '📱', 'sca', null, 'Group chat, 1 a.m.', '427 unread messages. Someone has started a poll on the best samosa in the city.', [
    C('Mute it and sleep', 1, { slp: -1, scr: -1 }),
    C('Scroll memes till 3 a.m.', 1, { fun: 3, scr: 3, slp: 2 }),
    C('One meme, then phone away', 1, { heart: 1, fun: 1, scr: -1 })], { fact: 'sleepadult' }),
  E('samosa', '☕', 'ca', null, 'Canteen: samosa o\'clock', 'Fresh samosas, sweet chai and the best gossip of the week.', [
    C('One samosa, one chai, great chat', 1, { fun: 2, heart: 2, jnk: 1 }),
    C('Make it a daily ritual', 1, { fun: 2, jnk: 3 }, [{ in: 2, fx: { body: -2, en: -1 }, m: 'samosacreep' }]),
    C('Fruit chaat and a walk', 2, { body: 2, jnk: -1, fun: 1 })], { fact: 'nin_upf' }),
  E('stairs', '🛗', 'sca', null, 'The lift is broken', 'The stairs called. They miss you.', [
    C('Take the stairs, cheerfully', 1, { body: 3, fit: 1 }),
    C('Wait 20 minutes for the repair', 1, { fun: -1 }),
    C('Stair race with a friend', 1, { body: 3, fun: 2, heart: 1 })], { fact: 'sitting' }),
  E('nani', '🥛', 'sca', [10, 11, 0, 1], 'Nani prescribes haldi doodh', 'You sneezed once. Nani has activated Full Ayurveda Mode.', [
    C('Drink it, early night', 1, { slp: -1, heart: 2, spirit: 1 }),
    C('Politely decline, nap instead', 1, { slp: -1 }),
    C('Learn her recipe', 2, { heart: 3, mind: 1, spirit: 1 })], { fact: 'turmeric' }),
  E('sneeze', '🤧', 'sca', [6, 7, 11, 0], 'The big sneeze', 'Your classmate or colleague sneezes like a thunderclap. Then shares his chips.', [
    C('Wash hands, keep distance', 1, { hyg: 1 }),
    C('Share the chips, it\'s friendship', 0, { heart: 1 }, [{ in: 1, fx: { sick: 1 }, m: 'caughtcold' }]),
    C('Suggest rest, open window', 1, { heart: 1, hyg: 1 })], { fact: 'hand' }),
  E('friendneed', '💬', 'sca', null, 'A friend needs to talk', 'It\'s 10 p.m. and they\'re not okay.', [
    C('Call and really listen', 3, { heart: 6, spirit: 2, slp: 1, bnd: 2 }, [{ in: 3, fx: { heart: 3, str: -2 }, m: 'friendreturns' }]),
    C('Send a heart emoji', 0, { heart: 1 }),
    C('Walk together tomorrow morning', 2, { heart: 5, body: 2, bnd: 1 })], { fact: 'lonely' }),
  E('sunday', '🌅', 'sca', null, 'A free Sunday morning', 'No alarms, no plans, no one asking for anything. Suspicious, but nice.', [
    C('Park walk in the morning sun', 2, { body: 3, spirit: 2, str: -1 }),
    C('Sleep till noon', 1, { slp: -2, fun: 1 }),
    C('Visit a quiet sacred place', 2, { spirit: 5, heart: 2, str: -1 })], { fact: 'nature' }),
  E('biryani', '🛵', 'ca', null, 'Midnight biryani: 60% off', 'The app knows you are awake. The app knows you are hungry.', [
    C('Order it', 0, { fun: 3, jnk: 3, slp: 1 }),
    C('Make a quick khichdi', 2, { body: 3, jnk: -1 }),
    C('Split one with flatmates', 0, { fun: 2, heart: 2, jnk: 1 })], { fact: 'salt' }),
  E('cricket', '🏏', 'sca', null, 'India vs Australia, final over', 'Six needed off two balls. Your heart rate is doing its own cardio.', [
    C('Watch and shout with family', 2, { fun: 5, heart: 3, slp: 1 }),
    C('Alone till 1 a.m., snacks', 1, { fun: 4, jnk: 1, slp: 2 }),
    C('Score updates only, sleep on time', 1, { slp: -1, fun: -1 })]),
  E('holi', '🎨', 'sca', [2], 'Holi: colours incoming', 'Your white kurta never stood a chance.', [
    C('Play with natural colours and friends', 2, { fun: 6, heart: 4 }),
    C('Hide indoors with the curtains shut', 0, { fun: -2 }),
    C('Play, then help clean up', 3, { fun: 4, heart: 4, spirit: 1 })]),
  E('parents', '🩺', 'a', null, 'Papa\'s BP machine: "Error"', 'He insists the machine is wrong. He also insists on extra salt.', [
    C('Book check-ups for both of you', 3, { heart: 3, chk: 1 }, [{ in: 2, fx: { str: -2, heart: 2 }, m: 'earlycatch' }]),
    C('"Next month, maybe"', 0, {}, [{ in: 2, fx: { str: 2 }, m: 'worry' }]),
    C('Buy a new one, laugh', 1, { fun: 1, heart: 1 })], { fact: 'htn' }),
  E('volcano', '🌋', 'a', null, 'Science project due tomorrow', 'It requires a working volcano. Nobody in the house owns baking soda.', [
    C('Build it together, late night', 3, { heart: 5, fun: 3, slp: 1 }),
    C('Order a ready-made one online', 1, { heart: -1, work: 1 }),
    C('Let them lead, you assist', 2, { heart: 4, mind: 2, fun: 2 })]),
  E('tiffin', '🍱', 's', null, 'Tiffin swap market', 'Your friend has aloo paratha. You have... cut fruit. Negotiations begin.', [
    C('Swap half and share both', 0, { fun: 2, heart: 2, body: 1 }),
    C('Eat your own dal-roti and fruit', 0, { body: 3 }),
    C('Skip lunch to play cricket', 1, { fun: 3, body: -2 }, [{ in: 1, fx: { en: -1 }, m: 'hungry' }])], { fact: 'fruitveg' }),
  E('cartoon', '📺', 's', null, 'Homework vs cartoons', 'The episode is 22 minutes. The homework is "just two pages". Both are lies.', [
    C('Homework first, then watch', 2, { work: 3, fun: 2 }),
    C('Watch three episodes', 1, { fun: 4, work: -3, scr: 1 }, [{ in: 1, fx: { str: 1, work: -1 }, m: 'teacher' }]),
    C('Homework on call with friend', 2, { work: 2, heart: 2 })]),
  E('cycle', '🚲', 's', null, 'A new bicycle!', 'It has gears, a bell and absolutely no brakes on your excitement.', [
    C('Cycle to school every day', 2, { body: 4, fun: 2, fit: 1 }),
    C('Wheelies for the colony', 1, { fun: 4, body: 1 }, [{ in: 1, fx: { body: -2 }, m: 'scraped' }]),
    C('Sunday rides with Papa or Mummy', 2, { body: 3, heart: 3 })], { fact: 'pa_kids' }),
  E('gamelevel', '🎮', 's', null, 'Just one more level…', 'It is 10:40 p.m. The boss fight is 90% done.', [
    C('Save the game and sleep', 1, { slp: -1 }),
    C('Play till late', 1, { fun: 3, slp: 2, scr: 2 }, [{ in: 1, fx: { mind: -2 }, m: 'sleepyclass' }]),
    C('Play with sibling, then stop', 1, { fun: 3, heart: 2 })], { fact: 'sleepteen' }),
  E('maggi', '🍜', 'c', null, '2 a.m. Maggi council', 'Five friends, one kettle, deep conversations about the meaning of life.', [
    C('Join in and laugh till late', 1, { fun: 4, heart: 3, slp: 2, jnk: 1 }),
    C('Go to bed', 1, { slp: -1 }),
    C('Fruit bowl, leave by 12:30', 2, { fun: 2, heart: 2 })]),
  E('internship', '📄', 'c', null, 'Unpaid internship "opportunity"', 'Requires passion, 60 hours a week and your own laptop.', [
    C('Accept: the CV will glow', 4, { work: 8, str: 3, fun: -3, slp: 2 }, [{ in: 2, fx: { str: 2, fun: -2 }, m: 'burnoutwhisper' }]),
    C('Negotiate part-time', 3, { work: 4, mind: 1 }),
    C('Decline; build a project you love', 2, { mind: 4, fun: 2, work: 2 })], { fact: 'burnout' }),
  E('fest', '🎸', 'c', [0, 1, 9], 'College fest: volunteer?', 'The fest needs an organiser. Free T-shirt included. Sleep not included.', [
    C('Organise it', 4, { work: 3, heart: 4, fun: 4, slp: 2 }),
    C('Attend the evenings only', 1, { fun: 4, heart: 2 }),
    C('Study in the empty library', 2, { mind: 3, work: 2, fun: -2 })]),
  E('heatwave', '🌡️', 'sca', [4, 5], 'Heatwave: 44°C', 'Even the pigeons are working from home.', [
    C('Walk at sunrise, nimbu paani after', 2, { body: 2, fit: 1 }),
    C('AC and series all day', 1, { fun: 2, body: -1, scr: 1 }),
    C('Afternoon rest, evening play', 1, { slp: -1, fun: 2 })], { fact: 'ritucharya' }),
  E('navratri', '💃', 'sca', [8, 9], 'Navratri garba nights', 'Nine nights of dandiya. Your calves have filed a complaint.', [
    C('Dance every single night', 4, { body: 4, fun: 5, heart: 3, slp: 2 }),
    C('Two nights, full energy', 2, { body: 2, fun: 3, heart: 2 }),
    C('Simple festival meals, prayers', 2, { spirit: 3, heart: 2 })]),
  E('dadi', '🫙', 'ca', [10, 11, 0], 'Dadi\'s Sunday oil massage', 'She has warmed the mustard oil. Resistance is futile.', [
    C('Accept champi, warm bath', 1, { spirit: 2, slp: -1, heart: 2 }),
    C('Too busy this week', 0, { work: 1 }),
    C('Foot massage for Dadi', 2, { heart: 4, spirit: 2 })], { fact: 'dinacharya' }),
  E('traffic', '🚗', 'a', null, '90 minutes stuck in traffic', 'Your inner pitta is fuming. Horns counted: 1,247.', [
    C('Audiobook or podcast', 1, { mind: 2, str: -1 }),
    C('Fume and honk back', 0, { str: 2 }),
    C('Call your parents', 1, { heart: 3 })]),
  E('promotion', '🎉', 'a', null, 'Promotion party!', 'Your manager is singing Kishore Kumar. Badly. Beautifully.', [
    C('Celebrate, leave at a sensible hour', 2, { fun: 4, heart: 2 }),
    C('Last one standing', 4, { fun: 5, slp: 3, jnk: 2 }, [{ in: 1, fx: { en: -2 }, m: 'partycrash' }]),
    C('Skip it, go home and rest', 0, { slp: -1, fun: -1, heart: -1 })]),
  E('dosha', '🌀', 'ca', null, '"Find your dosha!"', 'Result: you are 40% vata, 35% pitta and 25% chaos.', [
    C('Laugh, close the app', 1, { scr: -1, fun: 1 }),
    C('Take 12 more online quizzes', 1, { scr: 2, fun: 1 }),
    C('Read up on dinacharya', 2, { mind: 2, spirit: 1 })], { fact: 'tm' }),
  E('resolution', '🎯', 'ca', [0], 'January: the gym membership', 'You paid for 12 months. Statistically, you will go in January.', [
    C('Start small: three walks a week', 2, { body: 3, fit: 1 }),
    C('Two hours every day, starting now!', 5, { body: 5, fit: 1 }, [{ in: 2, fx: { body: -3, fun: -2 }, m: 'quitgym' }]),
    C('Find an exercise buddy', 2, { body: 3, heart: 2, fit: 1 })], { fact: 'pa_adult' }),
  E('relatives', '🧳', 'sca', null, 'Relatives arrive for "two days"', 'It has been nine days. Masi has reorganised your kitchen.', [
    C('Host warmly and cook together', 4, { heart: 5, fun: 2 }),
    C('Hide at work or the library', 1, { work: 3, heart: -3 }),
    C('Plan an outing all together', 3, { heart: 4, fun: 4, body: 1 })]),
  E('gurpurab', '🙏', 'sca', [10], 'Gurpurab langar seva', 'Volunteers are needed at the langar, and the kada prasad queue is long.', [
    C('Do seva for a few hours', 3, { spirit: 5, heart: 4 }),
    C('Enjoy langar with the family', 1, { heart: 3, spirit: 2 }),
    C('Skip it this year', 0, { work: 1 })]),
  E('eid', '🌙', 'sca', null, 'Eid sevaiyan invite', 'Your friend\'s ammi says "just one more plate" for the fourth time.', [
    C('Visit and celebrate', 1, { heart: 5, fun: 3, jnk: 1 }),
    C('Send wishes on WhatsApp', 0, { heart: 1 }),
    C('Go early, help cook', 3, { heart: 6, mind: 1 })]),
  E('christmas', '🎄', 'sca', [11], 'Secret Santa', 'You drew the one person whose name you can never remember.', [
    C('Handmade gift and a card', 2, { heart: 4, fun: 2 }),
    C('Panic-buy a mug', 0, { fun: 1 }),
    C('Join the carol singing too', 2, { heart: 3, fun: 4, spirit: 1 })]),
  E('worknight', '🌙', 'ca', null, 'Laptop in bed, 11:45 p.m.', 'You told yourself "just one email". That was 47 minutes ago.', [
    C('Close it. Tomorrow-you will handle it', 1, { slp: -1, str: -1, work: -1 }),
    C('Finish everything now', 3, { work: 4, slp: 2, str: 1, scr: 1 }),
    C('3-line plan, then sleep', 1, { work: 1, str: -1 })], { fact: 'sleepadult' }),
];

/* adult-mode curveballs: they change this week's pool (game rules) */
OYH.CURVEBALLS = [
  { id: 'maid', e: '🧺', pool: -1, fx: { str: 1 }, text: 'House help is on leave: chores eat 1 extra ⚡ energy.' },
  { id: 'powercut', e: '🕯️', pool: 0, fx: { slp: -1, scr: -1 }, text: 'Power cut all evening: forced early night, no screens.' },
  { id: 'ptm', e: '🏫', pool: -1, fx: { heart: 1 }, text: 'Parent-teacher meeting: 1 ⚡ energy booked, small Heart boost.' },
  { id: 'guests', e: '🚪', pool: -1, fx: { heart: 1, jnk: 1 }, text: 'Surprise guests: 1 ⚡ energy for hosting, extra snacks.' },
  { id: 'audit', e: '📊', pool: -1, fx: { str: 1, work: 1 }, text: 'Quarter-end audit: work takes 1 ⚡ energy.' },
  { id: 'bonus', e: '🎁', pool: 1, fx: { fun: 1 }, text: 'A calm, meeting-free week: +1 ⚡ energy.' },
];

/* delayed-consequence messages (game rules) */
OYH.LATER = {
  sugarcrash: '🍬 The mithai marathon caught up with you: sluggish week, 1 less Energy.',
  weddinghangover: '💤 Post-wedding recovery mode: 1 less Energy.',
  familyremembers: '👀 The family remembers you skipped the wedding. Awkward lunch.',
  focuscrash: '😵 The all-nighter bill arrived: Focus dipped, 1 less ⚡ energy.',
  backache: '🦴 Late nights at the laptop: your back has opinions now.',
  samosacreep: '🥟 The daily samosa habit is showing: energy sags a little.',
  caughtcold: '🤒 Shared chips, shared germs. You caught a cold.',
  friendreturns: '🤝 The friend you listened to shows up when you need them. Stress eases.',
  earlycatch: '✅ The check-up caught something early and simple to manage. Relief all round.',
  worry: '😟 Papa\'s BP is on your mind all week.',
  hungry: '🥪 Skipped lunch, cranky afternoon: 1 less Energy.',
  teacher: '📒 The teacher noticed the missing homework.',
  scraped: '🩹 One wheelie too many: scraped knee.',
  sleepyclass: '🥱 Yawning through first period: Mind dips.',
  burnoutwhisper: '🔥 The 60-hour weeks are wearing thin. Joy and calm are slipping.',
  partycrash: '😴 The party was great. The next week, less so: 2 less Energy.',
  quitgym: '🏳️ Two hours a day was too much: sore, fed up, quit.',
  injury: '🤕 Hard training on little sleep: a minor strain slows you down.',
  sick: '🤒 Low immunity caught up with you: a cold slows the week.',
  checkup: '🩺 Your check-up gave peace of mind and a clear baseline.',
};

/* ---------- REAL FACTS: "Did you know" notes, each with its named source (kept separate from the rules above) ---------- */
const F = (id, tag, modes, text, src, url, kind) => ({ id, tag, modes, text, src, url, kind: kind || 'fact' });
OYH.FACTS = [
  F('pa_adult', 'body', 'ca', 'WHO recommends at least 150–300 minutes of moderate-to-vigorous aerobic activity per week for all adults.', 'WHO Guidelines on physical activity and sedentary behaviour (2020)', 'https://www.who.int/news/item/25-11-2020-every-move-counts-towards-better-health-says-who'),
  F('pa_kids', 'body', 'sc', 'For children and teens, WHO recommends an average of 60 minutes of moderate-to-vigorous physical activity per day.', 'WHO Guidelines on physical activity and sedentary behaviour (2020)', 'https://www.who.int/news/item/25-11-2020-every-move-counts-towards-better-health-says-who'),
  F('inactive', 'body', 'sca', 'People who are insufficiently active have a 20% to 30% higher risk of death than people who are sufficiently active.', 'WHO fact sheet: Physical activity', 'https://www.who.int/news-room/fact-sheets/detail/physical-activity'),
  F('teens_inactive', 'body', 'sc', 'Worldwide, 81% of adolescents aged 11–17 do not meet WHO\'s physical activity recommendations.', 'WHO fact sheet: Physical activity', 'https://www.who.int/news-room/fact-sheets/detail/physical-activity'),
  F('sitting', 'body', 'sca', 'WHO says any amount of physical activity is better than none, all movement counts, and everyone should limit time spent sitting.', 'WHO fact sheet: Physical activity', 'https://www.who.int/news-room/fact-sheets/detail/physical-activity'),
  F('sugar', 'body', 'sca', 'WHO advises keeping free sugars below 10% of daily energy: about 50 g, or 12 level teaspoons, on a 2000-calorie day. Below 5% may bring extra benefits.', 'WHO fact sheet: Healthy diet', 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet'),
  F('salt', 'body', 'ca', 'WHO recommends adults eat less than 5 g of salt a day: just under a teaspoon.', 'WHO fact sheet: Salt reduction', 'https://www.who.int/news-room/fact-sheets/detail/salt-reduction'),
  F('fruitveg', 'body', 'sca', 'WHO says everyone older than 10 should aim for at least 400 g of fruit and vegetables a day.', 'WHO fact sheet: Healthy diet', 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet'),
  F('nin_plate', 'body', 'sca', 'ICMR-NIN\'s "My Plate for the Day" fills about half the daily plate with vegetables, greens, fruits, roots and tubers. The rest is mainly cereals and millets, then pulses, nuts and milk or curd.', 'ICMR-NIN Dietary Guidelines for Indians (2024)', 'https://www.nin.res.in/dietaryguidelines/pdfjs/locale/DGI_2024.pdf'),
  F('nin_burden', 'body', 'ca', 'ICMR-NIN estimates that 56.4% of India\'s total disease burden is due to unhealthy diets.', 'ICMR-NIN Dietary Guidelines for Indians (2024)', 'https://www.nin.res.in/dietaryguidelines/pdfjs/locale/DGI_2024.pdf'),
  F('nin_upf', 'body', 'sca', 'ICMR-NIN advises minimising ultra-processed and high fat, sugar and salt (HFSS) foods, and treats more than 25 g of sugar a day (on a 2000 kcal diet) as "high".', 'ICMR-NIN Dietary Guidelines for Indians (2024)', 'https://www.nin.res.in/dietaryguidelines/pdfjs/locale/DGI_2024.pdf'),
  F('spices', 'body', 'sca', 'ICMR-NIN notes that spices like turmeric, cumin, ginger, garlic, cinnamon, pepper and cloves are rich in antioxidants and can be part of a balanced diet.', 'ICMR-NIN Dietary Guidelines for Indians (2024)', 'https://www.nin.res.in/dietaryguidelines/pdfjs/locale/DGI_2024.pdf'),
  F('sleepadult', 'body', 'ca', 'The American Academy of Sleep Medicine and Sleep Research Society recommend that adults sleep 7 or more hours per night.', 'AASM & Sleep Research Society consensus (2015)', 'https://aasm.org/seven-or-more-hours-of-sleep-per-night-a-health-necessity-for-adults/'),
  F('sleepteen', 'body', 'sc', 'Teenagers aged 13–18 should regularly sleep 8 to 10 hours per 24 hours; children aged 6–12 need 9 to 12 hours.', 'American Academy of Sleep Medicine, pediatric consensus (2016)', 'https://aasm.org/recharge-with-sleep-pediatric-sleep-recommendations-promoting-optimal-health/'),
  F('sleeplearn', 'mind', 'sc', 'Regularly getting the recommended sleep is linked with better attention, behaviour, learning, memory and emotional regulation in children and teens.', 'American Academy of Sleep Medicine, pediatric consensus (2016)', 'https://aasm.org/recharge-with-sleep-pediatric-sleep-recommendations-promoting-optimal-health/'),
  F('hand', 'body', 'sca', 'WHO\'s handwashing technique with soap and water takes 40–60 seconds; an alcohol-based hand rub takes 20–30 seconds.', 'WHO: Hand hygiene, why, how & when', 'https://www.who.int/docs/default-source/patient-safety/how-to-handwash-poster.pdf'),
  F('oral', 'body', 'sca', 'WHO estimates oral diseases affect nearly 3.7 billion people. Free sugars, too little fluoride and not removing plaque by brushing all drive tooth decay.', 'WHO fact sheet: Oral health', 'https://www.who.int/news-room/fact-sheets/detail/oral-health'),
  F('htn', 'body', 'a', 'An estimated 1.4 billion adults aged 30–79 have high blood pressure, and about 44% don\'t know it. People may feel no symptoms; the only way to know is to get it checked.', 'WHO fact sheet: Hypertension', 'https://www.who.int/news-room/fact-sheets/detail/hypertension'),
  F('longhours', 'work', 'ca', 'WHO and ILO estimate that working 55 or more hours a week is linked to a 35% higher risk of stroke and a 17% higher risk of dying from heart disease, compared with 35–40 hours.', 'WHO & ILO (2021)', 'https://www.who.int/news/item/17-05-2021-long-working-hours-increasing-deaths-from-heart-disease-and-stroke-who-ilo'),
  F('burnout', 'work', 'ca', 'In ICD-11, WHO describes burn-out as an occupational phenomenon resulting from chronic workplace stress that has not been successfully managed. It is not classified as a medical condition.', 'WHO (2019)', 'https://www.who.int/news/item/28-05-2019-burn-out-an-occupational-phenomenon-international-classification-of-diseases'),
  F('lonely', 'heart', 'sca', 'WHO\'s Commission on Social Connection reports that 1 in 6 people worldwide is affected by loneliness, which is linked to an estimated 871,000 deaths a year.', 'WHO Commission on Social Connection (2025)', 'https://www.who.int/news/item/30-06-2025-social-connection-linked-to-improved-heath-and-reduced-risk-of-early-death'),
  F('connect', 'heart', 'sca', 'WHO suggests simple everyday steps against loneliness: reach out to a friend, put your phone away to be fully present, greet a neighbour, join a group or volunteer.', 'WHO Commission on Social Connection (2025)', 'https://www.who.int/news/item/30-06-2025-social-connection-linked-to-improved-heath-and-reduced-risk-of-early-death'),
  F('teen_mh', 'mind', 'sc', 'Globally, one in seven 10–19-year-olds experiences a mental disorder. Healthy sleep, regular exercise and learning to manage emotions all support mental well-being.', 'WHO fact sheet: Adolescent mental health', 'https://www.who.int/news-room/fact-sheets/detail/adolescent-mental-health'),
  F('nature', 'spirit', 'sca', 'In a study of nearly 20,000 people in England, those who spent at least 120 minutes a week in nature were more likely to report good health and well-being. It shows a link, not proof of cause.', 'White et al., Scientific Reports (2019)', 'https://www.nature.com/articles/s41598-019-44097-3'),
  F('yoga', 'spirit', 'sca', 'Studies suggest yoga may help with stress management, mental and emotional health, sleep and balance. For many conditions, the evidence is still limited.', 'US NCCIH: Yoga, effectiveness and safety', 'https://www.nccih.nih.gov/health/yoga-effectiveness-and-safety'),
  F('idy', 'spirit', 'sca', 'On 11 December 2014 the United Nations proclaimed 21 June as the International Day of Yoga (resolution 69/131).', 'United Nations: International Day of Yoga', 'https://www.un.org/en/observances/yoga-day'),
  F('tm', 'spirit', 'ca', 'In 2025 WHO adopted a Global Traditional Medicine Strategy (2025–2034) to strengthen the evidence, safety and regulation of traditional medicine. 170 of WHO\'s 194 Member States report its use.', 'WHO: Traditional medicine Q&A; WHA78 (2025)', 'https://www.who.int/news-room/questions-and-answers/item/traditional-medicine', 'trad'),
  F('dinacharya', 'body', 'sca', 'Ayurveda\'s dinacharya (daily routine), as described by CCRAS under India\'s Ministry of Ayush, includes waking early, drinking lukewarm water, cleaning the mouth, oil massage (abhyanga), exercise and regular sleep. It is a traditional wellness routine, not a treatment.', 'CCRAS, Ministry of Ayush: Dinacharya (daily regimen)', 'https://ccras.nic.in/dincharya-daily-regimen/', 'trad'),
  F('ritucharya', 'body', 'sca', 'Ayurveda\'s ritucharya adapts food and routine to the seasons. For the rainy season, CCRAS (Ministry of Ayush) guidance favours warm, easily digestible food.', 'CCRAS, Ministry of Ayush: Ayurveda-based diet & lifestyle guidelines', 'https://ccras.nic.in/wp-content/uploads/2024/06/CCRAS-Cardiac-Disorders.pdf', 'trad'),
  F('turmeric', 'body', 'sca', 'Haldi is a much-loved kitchen spice. NCCIH says there isn\'t enough evidence to conclude that turmeric or curcumin helps any health condition, and some concentrated curcumin supplements have been linked to liver damage.', 'US NCCIH: Turmeric', 'https://www.nccih.nih.gov/health/turmeric', 'trad'),
  F('interact', 'body', 'sca', 'Herbs and medicines can interact in harmful ways. If you take any medicine, talk to your doctor or a qualified practitioner before using herbal products.', 'US NCCIH: Turmeric; Ginger', 'https://www.nccih.nih.gov/health/turmeric', 'trad'),
  F('metals', 'body', 'a', 'NCCIH reports that some Ayurvedic preparations have been found to contain lead, mercury or arsenic. Use licensed products and consult a qualified practitioner.', 'US NCCIH: Ayurvedic medicine', 'https://www.nccih.nih.gov/health/ayurvedic-medicine-in-depth', 'trad'),
  F('ginger', 'body', 'a', 'Research suggests ginger may help with nausea and vomiting in pregnancy; for many other uses the evidence is uncertain.', 'US NCCIH: Ginger', 'https://www.nccih.nih.gov/health/ginger', 'trad'),
];
// which fact a habit points to when it was the week's main move
OYH.HABIT_FACT = { sleep: ['sleepadult', 'sleepteen'], walk: ['pa_adult', 'pa_kids', 'sitting'], sport: ['inactive', 'teens_inactive'], thali: ['nin_plate', 'fruitveg'], seasonal: ['ritucharya', 'spices'], mindful: ['nin_upf'], yoga: ['yoga', 'idy'], abhyanga: ['dinacharya'], hygiene: ['hand', 'oral'], nature: ['nature'], checkup: ['htn', 'oral'], herbs: ['turmeric', 'interact', 'spices'], study: ['sleeplearn'], curfew: ['sleepteen', 'sleepadult'], family: ['connect', 'lonely'], friend: ['lonely', 'connect'], help: ['connect'], quiet: ['teen_mh'], overtime: ['longhours', 'burnout'], boundary: ['burnout'], play: ['teen_mh'] };

/* ---------- quizzes (School: 2 options with a hint; College: 3 options). Answers come from the facts above ---------- */
OYH.QUIZ = [
  { id: 'q_pa_kids', modes: 'sc', q: 'WHO recommends how much daily activity for children and teens, on average?', o: ['60 minutes', '15 minutes', '3 hours'], a: 0, fact: 'pa_kids', hint: 'About one football match half… plus a bit.' },
  { id: 'q_sleep_teen', modes: 'sc', q: 'How much sleep do teenagers (13–18) need regularly?', o: ['8–10 hours', '5–6 hours', '12–14 hours'], a: 0, fact: 'sleepteen', hint: 'More than most adults.' },
  { id: 'q_hand', modes: 'sc', q: 'A proper WHO-style handwash with soap and water takes about…', o: ['40–60 seconds', '5 seconds', '5 minutes'], a: 0, fact: 'hand', hint: 'Longer than you think!' },
  { id: 'q_fruitveg', modes: 'sc', q: 'WHO: people over 10 should aim for at least how much fruit and veg a day?', o: ['400 g', '50 g', '2 kg'], a: 0, fact: 'fruitveg', hint: 'Roughly five handfuls.' },
  { id: 'q_plate', modes: 'sc', q: 'In ICMR-NIN\'s "My Plate for the Day", about how much of the plate is vegetables, greens and fruits?', o: ['About half', 'A tenth', 'None'], a: 0, fact: 'nin_plate', hint: 'Think of a colourful plate.' },
  { id: 'q_pa_adult', modes: 'c', q: 'WHO\'s weekly aerobic activity recommendation for adults is…', o: ['150–300 minutes', '30–60 minutes', '600–900 minutes'], a: 0, fact: 'pa_adult' },
  { id: 'q_sugar', modes: 'c', q: 'WHO advises keeping free sugars below what share of daily energy?', o: ['10%', '30%', '50%'], a: 0, fact: 'sugar' },
  { id: 'q_lonely', modes: 'c', q: 'According to WHO\'s 2025 report, how many people worldwide are affected by loneliness?', o: ['1 in 6', '1 in 100', '1 in 2'], a: 0, fact: 'lonely' },
  { id: 'q_burnout', modes: 'c', q: 'How does WHO\'s ICD-11 describe burn-out?', o: ['An occupational phenomenon', 'An infectious disease', 'A vitamin deficiency'], a: 0, fact: 'burnout' },
  { id: 'q_turmeric', modes: 'c', q: 'What does the evidence say about turmeric curing diseases?', o: ['Not enough evidence to conclude it helps any condition', 'Proven cure for colds', 'Replaces all medicines'], a: 0, fact: 'turmeric' },
];

/* end-of-run text (game) */
OYH.TITLES = [
  [90, '🌳', 'Banyan of balance'], [80, '🌻', 'Sunflower in full bloom'], [70, '🪷', 'Lotus on a steady pond'],
  [60, '☕', 'Chai-powered optimist'], [45, '🌱', 'Sprouting, keep watering'], [0, '🔋', 'Running on fumes (this time)'],
];
OYH.ARCH = { body: 'Natural athlete', mind: 'Curious scholar', heart: 'Warm-hearted connector', spirit: 'Calm sage', work: 'Steady achiever', fun: 'Joy spreader', balanced: 'All-rounder' };
OYH.TIPS = {
  body: 'Your Body pillar could use some love. You might try one short daily walk or a home-cooked thali a few times a week; small steps count.',
  mind: 'Your Mind pillar dipped. One focused, phone-free learning block a week and a regular bedtime can lift it.',
  heart: 'Heart felt a little lonely this run. A weekly family meal or a call to an old friend builds a buffer for stressful weeks.',
  spirit: 'Spirit is optional, but a few minutes of quiet time, prayer, reflection or nature gave other players a calm boost.',
  work: 'Work and studies fell behind. A couple of focused blocks (and logging off after) keeps life stable without burning out.',
  fun: 'Fun ran low. Play, hobbies and laughter are not extras; they keep the other pillars going.',
  slp: 'Sleep debt built up. A steady "early to bed" routine and a phone-free bedroom were the biggest levers in this game.',
  str: 'Stress stayed high. In the game, family rituals, quiet time, yoga and boundaries all eased it.',
  jnk: 'Convenience food piled up. Home-cooked, seasonal food lowered the junk load fastest.',
  scr: 'Late-night screens cost you Focus. Try the screen curfew habit next time.',
};
OYH.HELPED = {
  sleep: 'Early nights kept your energy and focus up.', walk: 'Daily movement quietly built your fitness base.', sport: 'Sport built strength and burned off stress.',
  thali: 'Home-cooked thalis kept the junk load low.', seasonal: 'Seasonal, local food fitted the ritu and fed your Body pillar.', mindful: 'Mindful eating helped tame the junk load.',
  yoga: 'Yoga and pranayama calmed stress and kept you supple.', abhyanga: 'Your dinacharya ritual helped you unwind.', hygiene: 'Hygiene basics protected your immunity.',
  nature: 'Nature time refreshed body and spirit.', checkup: 'A preventive check-up gave you peace of mind.', herbs: 'A cosy kitchen-herb ritual helped you wind down.',
  study: 'Deep learning blocks sharpened your mind.', read: 'Reading and puzzles kept your mind playful.', curfew: 'The screen curfew protected your sleep.',
  family: 'Family rituals built a buffer against stress.', friend: 'Friendships kept your heart full.', help: 'Helping others gave meaning to your weeks.',
  quiet: 'Quiet time gave you calm and resilience.', gratitude: 'Gratitude notes lifted your spirit.', work: 'Focused work kept life on track.',
  overtime: 'Overtime pushed work forward (at a price).', chores: 'Shared chores kept home harmonious.', boundary: 'Logging off on time protected your evenings.',
  play: 'Play and hobbies kept joy alive.', series: 'Movie nights were a nice treat.', hangout: 'Laughter with friends lifted your mood.',
};
})(typeof window !== 'undefined' ? window : globalThis);
