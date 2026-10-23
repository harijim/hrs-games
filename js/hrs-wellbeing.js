/* Harpreet Raj Singh Games: shared wellbeing module (Good Engagement Design Charter, sections 1, 3 and 4).
   Daily play limit · gentle "Done for today" · break reminder · quiet hours · parent PIN panel ·
   kind streaks with rest days · real-world action log. Framework-free. No network calls. Data stays in localStorage.
   Works on its own or alongside js/hrs-common.js (uses HRS.lang, HRS.sfx, HRS.onBack, HRS.parseEmoji when present).
   © 2026 Harpreet Raj Singh. */
(function () {
'use strict';
const VERSION = '1.1.0';
const K = { cfg: 'hrs_wb_settings_v1', days: 'hrs_wb_days_v1', acts: 'hrs_wb_actions_v1', sess: 'hrs_wb_session_v1' };
const DEFAULTS = {
  limitChild: 20, limitStd: 30,              // minutes per day (0 = no limit)
  behChild: 'block', behStd: 'nudge',        // what happens at the limit: 'block' | 'nudge'
  breakChild: 25, breakStd: 25,              // break reminder after N minutes of continuous play (0 = off)
  quietOn: true, quietStart: '22:00', quietEnd: '06:00',
  schoolOn: false, schoolStart: '08:00', schoolEnd: '14:00', schoolDays: [1, 2, 3, 4, 5],
  quietBehChild: 'block', quietBehStd: 'nudge',
  restDays: 2,                               // gap days that never break a rhythm
  extra: {},                                 // { 'YYYY-MM-DD': minutes granted by a parent }
  pinHash: '', pinSalt: '',
};
const IDLE_MS = 120000, TICK_MS = 5000, NUDGE_SNOOZE_MIN = 10, BREAK_RESET_MS = 5 * 60000, KEEP_DAYS = 70;

/* ---------- storage (device only) ---------- */
const S = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} },
};
const cfg = () => { const raw = S.get(K.cfg, {}), c = Object.assign({}, DEFAULTS, raw);
  if (raw.breakMin != null && raw.breakChild == null) c.breakChild = c.breakStd = raw.breakMin;   // v1.0 settings
  return c; };
// choices offered in the panels (a stored value outside the list is added so nothing is lost)
const LIM_CHILD = [15, 20, 25, 30, 45, 60], LIM_STD = [15, 20, 25, 30, 45, 60, 0], BREAKS = [15, 20, 25, 30, 45, 60, 0];
function setCfg(patch) { const c = Object.assign(cfg(), patch); S.set(K.cfg, c); emit('settings', {}); return c; }

/* ---------- time (overridable for tests: ?wbNow=23:30 or ?wbNow=2026-10-23T23:30, _debug.setNow) ---------- */
let nowOverride = null, offset = 0;
try { const q = new URLSearchParams(location.search).get('wbNow'); if (q) nowOverride = /^\d\d:\d\d$/.test(q) ? (() => { const d = new Date(); const [h, m] = q.split(':'); d.setHours(+h, +m, 0, 0); return d; })() : new Date(q); } catch (e) {}
const T0 = Date.now();
function now() { return nowOverride ? new Date(nowOverride.getTime() + (Date.now() - T0) + offset) : new Date(Date.now() + offset); }
const pad = n => String(n).padStart(2, '0');
const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => dayKey(now());
const mins = hhmm => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0); };
const inWindow = (d, a, b) => { const t = d.getHours() * 60 + d.getMinutes(), A = mins(a), B = mins(b); return A <= B ? t >= A && t < B : t >= A || t < B; };
const dayDiff = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);

/* ---------- language (en / hi / pa), shared key with hrs-common.js ---------- */
const STR = {
en: {
  doneTitle: 'Done for today', doneGo: 'Now go do it for real.',
  limitChild: 'You have played {n} minutes today. That is today’s playtime. Your game is saved. See you tomorrow!',
  limitStd: 'You have played {n} minutes today, your daily playtime. Your game is saved.',
  keep: 'Play {n} more minutes', closeGame: 'Close the game', parentAdd: 'Parent: add 15 minutes',
  breakTitle: 'Time for a short break?', breakBody: 'You have been playing for {n} minutes. Stand up, stretch and drink some water. Your game will wait right here.',
  breakOk: 'Take a break', breakKeep: 'Keep playing', restTitle: 'Enjoy your break',
  restBody: 'Look at something far away, roll your shoulders, get a glass of water. Come back whenever you are ready.', back: 'I’m back',
  quietTitle: 'Quiet hours', quietNight: 'It is {t}. Quiet hours run from {a} to {b}. Sleep helps you learn and remember. The game will be here tomorrow.',
  quietSchool: 'It is school time. The game will be here after school.', quietKeep: 'Play a little anyway',
  parentTitle: 'For parents and carers', parentsLink: 'For parents',
  pinSetTitle: 'Set a parent PIN', pinSetBody: 'Choose a 4 to 6 digit PIN. It is stored only on this device, as a scrambled code.',
  pinEnter: 'Enter the parent PIN', pinAgain: 'Enter it again', pinMismatch: 'The PINs do not match. Please try again.',
  pinWrong: 'That PIN is not right.', pinWait: 'Too many tries. Please wait {n} seconds.', pinShort: 'Please use 4 to 6 digits.',
  pinForgot: 'Forgot the PIN? Clearing this site’s data in the browser settings resets it (it also deletes game saves).',
  ok: 'OK', cancel: 'Cancel', save: 'Save', close: 'Close', saved: 'Saved',
  limChild: 'Daily limit', limStd: 'Daily limit', off: 'Off', minN: '{n} min', grpChild: 'School level (children)', grpStd: 'College and Expert (teens and adults)',
  behChild: 'At the limit', behStd: 'At the limit', behBlock: 'Stop play for today', behNudge: 'Gentle reminder only',
  breakMin: 'Break reminder after', quietOn: 'Quiet hours', from: 'From', to: 'To',
  schoolOn: 'School hours (Monday to Friday)', quietBehChild: 'In quiet hours', quietBehStd: 'In quiet hours', hoursTitle: 'Quiet hours and school hours (everyone on this device)',
  myTitle: 'My limits and breaks', myIntro: 'Gentle reminders for College and Expert players. You can change them yourself; they are stored only on this device.',
  myLocked: 'A parent or carer has set these limits to stop play. Only they can change them, in the parent panel.', myLimit: 'Remind me after (per day)', limitsLink: 'Limits and breaks',
  todayUsed: 'Played today: {n} min', resetToday: 'Reset today’s time', add15: 'Add 15 minutes today', changePin: 'Change PIN',
  forget: 'Delete all wellbeing data on this device', forgetSure: 'Delete playtime, rhythm, actions, settings and the PIN from this device?',
  privacy: 'Everything here is stored only on this device. Nothing is sent anywhere.',
  last14: 'You played on {n} of the last 14 days. Rest days are part of the plan.',
  rhythm: '{n}-day rhythm 🌱 Rest days never break it.', welcome: 'Welcome back! A fresh start today 🌱', firstDay: 'Day one of your rhythm 🌱',
  fuTitle: 'Did you manage it?', fuBody: 'Last time you planned:', fuYes: 'Yes, I did it!', fuNo: 'Not yet, and that’s okay',
  fuYesMsg: 'Wonderful! That is the real win 🌱', pick: 'Pick up to 3 things to try in real life today:', doneBtn: 'Done for today',
  actsWeek: 'Real-world actions this week: {n}', left: '{n} min left today', noLimit: 'No daily limit set',
},
hi: {
  doneTitle: 'आज के लिए बस', doneGo: 'अब इसे असल ज़िंदगी में करके देखें।',
  limitChild: 'आज आपने {n} मिनट खेला। आज का खेलने का समय पूरा हुआ। आपका गेम सेव है। कल मिलते हैं!',
  limitStd: 'आज आपने {n} मिनट खेला, यह आपका दैनिक समय है। आपका गेम सेव है।',
  keep: '{n} मिनट और खेलें', closeGame: 'गेम बंद करें', parentAdd: 'अभिभावक: 15 मिनट जोड़ें',
  breakTitle: 'थोड़ा ब्रेक लें?', breakBody: 'आप {n} मिनट से खेल रहे हैं। उठिए, स्ट्रेच कीजिए, पानी पीजिए। आपका गेम यहीं इंतज़ार करेगा।',
  breakOk: 'ब्रेक लें', breakKeep: 'खेलते रहें', restTitle: 'ब्रेक का आनंद लें',
  restBody: 'दूर किसी चीज़ को देखें, कंधे घुमाएँ, एक गिलास पानी पिएँ। जब तैयार हों, लौट आएँ।', back: 'मैं लौट आया/आई',
  quietTitle: 'शांत समय', quietNight: 'अभी {t} बजे हैं। शांत समय {a} से {b} तक है। नींद सीखने और याद रखने में मदद करती है। गेम कल भी यहीं रहेगा।',
  quietSchool: 'अभी स्कूल का समय है। गेम स्कूल के बाद यहीं मिलेगा।', quietKeep: 'फिर भी थोड़ा खेलें',
  parentTitle: 'अभिभावकों और देखभाल करने वालों के लिए', parentsLink: 'अभिभावकों के लिए',
  pinSetTitle: 'अभिभावक PIN बनाएँ', pinSetBody: '4 से 6 अंकों का PIN चुनें। यह केवल इसी डिवाइस पर, कूट रूप में रहता है।',
  pinEnter: 'अभिभावक PIN डालें', pinAgain: 'इसे फिर से डालें', pinMismatch: 'PIN मेल नहीं खाते। फिर से कोशिश करें।',
  pinWrong: 'यह PIN सही नहीं है।', pinWait: 'बहुत ज़्यादा कोशिशें। कृपया {n} सेकंड रुकें।', pinShort: 'कृपया 4 से 6 अंक डालें।',
  pinForgot: 'PIN भूल गए? ब्राउज़र सेटिंग्स में इस साइट का डेटा साफ़ करने से यह रीसेट हो जाता है (गेम सेव भी मिट जाएँगे)।',
  ok: 'ठीक है', cancel: 'रद्द करें', save: 'सेव करें', close: 'बंद करें', saved: 'सेव हो गया',
  limChild: 'दैनिक सीमा', limStd: 'दैनिक सीमा', zeroOff: '0 = कोई सीमा नहीं',
  behStd: 'सीमा पूरी होने पर', behBlock: 'आज के लिए खेल रोकें', behNudge: 'सिर्फ़ हल्का रिमाइंडर',
  breakMin: 'ब्रेक रिमाइंडर इतने समय बाद', quietOn: 'शांत समय', from: 'से', to: 'तक',
  schoolOn: 'स्कूल का समय (सोमवार से शुक्रवार)', quietBehStd: 'शांत समय में',
  todayUsed: 'आज खेला: {n} मिनट', resetToday: 'आज का समय रीसेट करें', add15: 'आज 15 मिनट जोड़ें', changePin: 'PIN बदलें',
  forget: 'इस डिवाइस से सारा वेलबीइंग डेटा मिटाएँ', forgetSure: 'खेलने का समय, लय, काम, सेटिंग्स और PIN इस डिवाइस से मिटा दें?',
  privacy: 'यहाँ की हर जानकारी केवल इसी डिवाइस पर रहती है। कुछ भी कहीं नहीं भेजा जाता।',
  last14: 'पिछले 14 में से {n} दिन आपने खेला। आराम के दिन भी योजना का हिस्सा हैं।',
  rhythm: '{n} दिन की लय 🌱 आराम के दिन इसे कभी नहीं तोड़ते।', welcome: 'फिर से स्वागत है! आज नई शुरुआत 🌱', firstDay: 'आपकी लय का पहला दिन 🌱',
  fuTitle: 'क्या आप कर पाए?', fuBody: 'पिछली बार आपने तय किया था:', fuYes: 'हाँ, कर लिया!', fuNo: 'अभी नहीं, कोई बात नहीं',
  fuYesMsg: 'बहुत बढ़िया! असली जीत यही है 🌱', pick: 'आज असल ज़िंदगी में आज़माने के लिए 3 तक काम चुनें:', doneBtn: 'आज के लिए बस',
  actsWeek: 'इस हफ़्ते असल ज़िंदगी के काम: {n}', left: 'आज {n} मिनट बाकी', noLimit: 'कोई दैनिक सीमा तय नहीं',
  off: 'बंद',
  minN: '{n} मिनट',
  grpChild: 'स्कूल स्तर (बच्चे)',
  grpStd: 'कॉलेज और एक्सपर्ट (किशोर और वयस्क)',
  behChild: 'सीमा पूरी होने पर',
  quietBehChild: 'शांत समय में',
  hoursTitle: 'शांत समय और स्कूल का समय (इस डिवाइस पर सभी के लिए)',
  myTitle: 'मेरी सीमाएँ और ब्रेक',
  myIntro: 'कॉलेज और एक्सपर्ट खिलाड़ियों के लिए हल्के रिमाइंडर। आप इन्हें ख़ुद बदल सकते हैं; ये सिर्फ़ इसी डिवाइस पर रहते हैं।',
  myLocked: 'माता-पिता या अभिभावक ने इन सीमाओं पर खेल रोकना चुना है। इन्हें सिर्फ़ वही अभिभावक पैनल में बदल सकते हैं।',
  myLimit: 'मुझे याद दिलाएँ (प्रति दिन) इतने समय बाद',
  limitsLink: 'सीमाएँ और ब्रेक',
},
pa: {
  doneTitle: 'ਅੱਜ ਲਈ ਬੱਸ', doneGo: 'ਹੁਣ ਇਸ ਨੂੰ ਅਸਲ ਜ਼ਿੰਦਗੀ ਵਿੱਚ ਕਰਕੇ ਵੇਖੋ।',
  limitChild: 'ਅੱਜ ਤੁਸੀਂ {n} ਮਿੰਟ ਖੇਡਿਆ। ਅੱਜ ਦਾ ਖੇਡਣ ਦਾ ਸਮਾਂ ਪੂਰਾ ਹੋਇਆ। ਤੁਹਾਡੀ ਗੇਮ ਸੇਵ ਹੈ। ਕੱਲ੍ਹ ਮਿਲਦੇ ਹਾਂ!',
  limitStd: 'ਅੱਜ ਤੁਸੀਂ {n} ਮਿੰਟ ਖੇਡਿਆ, ਇਹ ਤੁਹਾਡਾ ਰੋਜ਼ਾਨਾ ਸਮਾਂ ਹੈ। ਤੁਹਾਡੀ ਗੇਮ ਸੇਵ ਹੈ।',
  keep: '{n} ਮਿੰਟ ਹੋਰ ਖੇਡੋ', closeGame: 'ਗੇਮ ਬੰਦ ਕਰੋ', parentAdd: 'ਮਾਪੇ: 15 ਮਿੰਟ ਜੋੜੋ',
  breakTitle: 'ਥੋੜ੍ਹਾ ਆਰਾਮ ਕਰੀਏ?', breakBody: 'ਤੁਸੀਂ {n} ਮਿੰਟ ਤੋਂ ਖੇਡ ਰਹੇ ਹੋ। ਉੱਠੋ, ਸਰੀਰ ਖਿੱਚੋ, ਪਾਣੀ ਪੀਓ। ਤੁਹਾਡੀ ਗੇਮ ਇੱਥੇ ਹੀ ਉਡੀਕ ਕਰੇਗੀ।',
  breakOk: 'ਆਰਾਮ ਕਰੋ', breakKeep: 'ਖੇਡਦੇ ਰਹੋ', restTitle: 'ਆਰਾਮ ਦਾ ਆਨੰਦ ਲਓ',
  restBody: 'ਦੂਰ ਕਿਸੇ ਚੀਜ਼ ਨੂੰ ਵੇਖੋ, ਮੋਢੇ ਘੁਮਾਓ, ਇੱਕ ਗਲਾਸ ਪਾਣੀ ਪੀਓ। ਜਦੋਂ ਤਿਆਰ ਹੋਵੋ, ਵਾਪਸ ਆ ਜਾਓ।', back: 'ਮੈਂ ਵਾਪਸ ਆ ਗਿਆ/ਗਈ',
  quietTitle: 'ਸ਼ਾਂਤ ਸਮਾਂ', quietNight: 'ਹੁਣ {t} ਵੱਜੇ ਹਨ। ਸ਼ਾਂਤ ਸਮਾਂ {a} ਤੋਂ {b} ਤੱਕ ਹੈ। ਨੀਂਦ ਸਿੱਖਣ ਅਤੇ ਯਾਦ ਰੱਖਣ ਵਿੱਚ ਮਦਦ ਕਰਦੀ ਹੈ। ਗੇਮ ਕੱਲ੍ਹ ਵੀ ਇੱਥੇ ਹੋਵੇਗੀ।',
  quietSchool: 'ਹੁਣ ਸਕੂਲ ਦਾ ਸਮਾਂ ਹੈ। ਗੇਮ ਸਕੂਲ ਤੋਂ ਬਾਅਦ ਇੱਥੇ ਮਿਲੇਗੀ।', quietKeep: 'ਫਿਰ ਵੀ ਥੋੜ੍ਹਾ ਖੇਡੋ',
  parentTitle: 'ਮਾਪਿਆਂ ਅਤੇ ਦੇਖਭਾਲ ਕਰਨ ਵਾਲਿਆਂ ਲਈ', parentsLink: 'ਮਾਪਿਆਂ ਲਈ',
  pinSetTitle: 'ਮਾਪਿਆਂ ਦਾ PIN ਬਣਾਓ', pinSetBody: '4 ਤੋਂ 6 ਅੰਕਾਂ ਦਾ PIN ਚੁਣੋ। ਇਹ ਸਿਰਫ਼ ਇਸੇ ਡਿਵਾਈਸ ਉੱਤੇ, ਕੋਡ ਰੂਪ ਵਿੱਚ ਰਹਿੰਦਾ ਹੈ।',
  pinEnter: 'ਮਾਪਿਆਂ ਦਾ PIN ਪਾਓ', pinAgain: 'ਇਸ ਨੂੰ ਦੁਬਾਰਾ ਪਾਓ', pinMismatch: 'PIN ਮੇਲ ਨਹੀਂ ਖਾਂਦੇ। ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
  pinWrong: 'ਇਹ PIN ਸਹੀ ਨਹੀਂ ਹੈ।', pinWait: 'ਬਹੁਤ ਵਾਰ ਕੋਸ਼ਿਸ਼ ਹੋਈ। ਕਿਰਪਾ ਕਰਕੇ {n} ਸਕਿੰਟ ਰੁਕੋ।', pinShort: 'ਕਿਰਪਾ ਕਰਕੇ 4 ਤੋਂ 6 ਅੰਕ ਪਾਓ।',
  pinForgot: 'PIN ਭੁੱਲ ਗਏ? ਬ੍ਰਾਊਜ਼ਰ ਸੈਟਿੰਗਾਂ ਵਿੱਚ ਇਸ ਸਾਈਟ ਦਾ ਡਾਟਾ ਸਾਫ਼ ਕਰਨ ਨਾਲ ਇਹ ਰੀਸੈਟ ਹੋ ਜਾਂਦਾ ਹੈ (ਗੇਮ ਸੇਵ ਵੀ ਮਿਟ ਜਾਣਗੇ)।',
  ok: 'ਠੀਕ ਹੈ', cancel: 'ਰੱਦ ਕਰੋ', save: 'ਸੇਵ ਕਰੋ', close: 'ਬੰਦ ਕਰੋ', saved: 'ਸੇਵ ਹੋ ਗਿਆ',
  limChild: 'ਰੋਜ਼ਾਨਾ ਸੀਮਾ', limStd: 'ਰੋਜ਼ਾਨਾ ਸੀਮਾ', zeroOff: '0 = ਕੋਈ ਸੀਮਾ ਨਹੀਂ',
  behStd: 'ਸੀਮਾ ਪੂਰੀ ਹੋਣ ’ਤੇ', behBlock: 'ਅੱਜ ਲਈ ਖੇਡ ਰੋਕੋ', behNudge: 'ਸਿਰਫ਼ ਹਲਕੀ ਯਾਦ-ਦਹਾਨੀ',
  breakMin: 'ਆਰਾਮ ਦੀ ਯਾਦ-ਦਹਾਨੀ ਇੰਨੇ ਸਮੇਂ ਬਾਅਦ', quietOn: 'ਸ਼ਾਂਤ ਸਮਾਂ', from: 'ਤੋਂ', to: 'ਤੱਕ',
  schoolOn: 'ਸਕੂਲ ਦਾ ਸਮਾਂ (ਸੋਮਵਾਰ ਤੋਂ ਸ਼ੁੱਕਰਵਾਰ)', quietBehStd: 'ਸ਼ਾਂਤ ਸਮੇਂ ਵਿੱਚ',
  todayUsed: 'ਅੱਜ ਖੇਡਿਆ: {n} ਮਿੰਟ', resetToday: 'ਅੱਜ ਦਾ ਸਮਾਂ ਰੀਸੈਟ ਕਰੋ', add15: 'ਅੱਜ 15 ਮਿੰਟ ਜੋੜੋ', changePin: 'PIN ਬਦਲੋ',
  forget: 'ਇਸ ਡਿਵਾਈਸ ਤੋਂ ਸਾਰਾ ਵੈੱਲਬੀਇੰਗ ਡਾਟਾ ਮਿਟਾਓ', forgetSure: 'ਖੇਡਣ ਦਾ ਸਮਾਂ, ਲੈਅ, ਕੰਮ, ਸੈਟਿੰਗਾਂ ਅਤੇ PIN ਇਸ ਡਿਵਾਈਸ ਤੋਂ ਮਿਟਾ ਦੇਈਏ?',
  privacy: 'ਇੱਥੇ ਦੀ ਹਰ ਜਾਣਕਾਰੀ ਸਿਰਫ਼ ਇਸੇ ਡਿਵਾਈਸ ਉੱਤੇ ਰਹਿੰਦੀ ਹੈ। ਕੁਝ ਵੀ ਕਿਤੇ ਨਹੀਂ ਭੇਜਿਆ ਜਾਂਦਾ।',
  last14: 'ਪਿਛਲੇ 14 ਵਿੱਚੋਂ {n} ਦਿਨ ਤੁਸੀਂ ਖੇਡਿਆ। ਆਰਾਮ ਦੇ ਦਿਨ ਵੀ ਯੋਜਨਾ ਦਾ ਹਿੱਸਾ ਹਨ।',
  rhythm: '{n} ਦਿਨਾਂ ਦੀ ਲੈਅ 🌱 ਆਰਾਮ ਦੇ ਦਿਨ ਇਸ ਨੂੰ ਕਦੇ ਨਹੀਂ ਤੋੜਦੇ।', welcome: 'ਮੁੜ ਜੀ ਆਇਆਂ ਨੂੰ! ਅੱਜ ਨਵੀਂ ਸ਼ੁਰੂਆਤ 🌱', firstDay: 'ਤੁਹਾਡੀ ਲੈਅ ਦਾ ਪਹਿਲਾ ਦਿਨ 🌱',
  fuTitle: 'ਕੀ ਤੁਸੀਂ ਕਰ ਸਕੇ?', fuBody: 'ਪਿਛਲੀ ਵਾਰ ਤੁਸੀਂ ਤੈਅ ਕੀਤਾ ਸੀ:', fuYes: 'ਹਾਂ, ਕਰ ਲਿਆ!', fuNo: 'ਹਾਲੇ ਨਹੀਂ, ਕੋਈ ਗੱਲ ਨਹੀਂ',
  fuYesMsg: 'ਬਹੁਤ ਵਧੀਆ! ਅਸਲ ਜਿੱਤ ਇਹੀ ਹੈ 🌱', pick: 'ਅੱਜ ਅਸਲ ਜ਼ਿੰਦਗੀ ਵਿੱਚ ਅਜ਼ਮਾਉਣ ਲਈ 3 ਤੱਕ ਕੰਮ ਚੁਣੋ:', doneBtn: 'ਅੱਜ ਲਈ ਬੱਸ',
  actsWeek: 'ਇਸ ਹਫ਼ਤੇ ਅਸਲ ਜ਼ਿੰਦਗੀ ਦੇ ਕੰਮ: {n}', left: 'ਅੱਜ {n} ਮਿੰਟ ਬਾਕੀ', noLimit: 'ਕੋਈ ਰੋਜ਼ਾਨਾ ਸੀਮਾ ਤੈਅ ਨਹੀਂ',
  off: 'ਬੰਦ',
  minN: '{n} ਮਿੰਟ',
  grpChild: 'ਸਕੂਲ ਪੱਧਰ (ਬੱਚੇ)',
  grpStd: 'ਕਾਲਜ ਅਤੇ ਐਕਸਪਰਟ (ਨੌਜਵਾਨ ਅਤੇ ਬਾਲਗ)',
  behChild: 'ਸੀਮਾ ਪੂਰੀ ਹੋਣ ’ਤੇ',
  quietBehChild: 'ਸ਼ਾਂਤ ਸਮੇਂ ਵਿੱਚ',
  hoursTitle: 'ਸ਼ਾਂਤ ਸਮਾਂ ਅਤੇ ਸਕੂਲ ਦਾ ਸਮਾਂ (ਇਸ ਡਿਵਾਈਸ ’ਤੇ ਸਾਰਿਆਂ ਲਈ)',
  myTitle: 'ਮੇਰੀਆਂ ਸੀਮਾਵਾਂ ਅਤੇ ਆਰਾਮ',
  myIntro: 'ਕਾਲਜ ਅਤੇ ਐਕਸਪਰਟ ਖਿਡਾਰੀਆਂ ਲਈ ਹਲਕੀਆਂ ਯਾਦ-ਦਹਾਨੀਆਂ। ਤੁਸੀਂ ਇਹਨਾਂ ਨੂੰ ਆਪ ਬਦਲ ਸਕਦੇ ਹੋ; ਇਹ ਸਿਰਫ਼ ਇਸੇ ਡਿਵਾਈਸ ’ਤੇ ਰਹਿੰਦੀਆਂ ਹਨ।',
  myLocked: 'ਮਾਪਿਆਂ ਜਾਂ ਸਰਪ੍ਰਸਤ ਨੇ ਇਹਨਾਂ ਸੀਮਾਵਾਂ ’ਤੇ ਖੇਡ ਰੋਕਣਾ ਚੁਣਿਆ ਹੈ। ਇਹਨਾਂ ਨੂੰ ਸਿਰਫ਼ ਉਹੀ ਮਾਪਿਆਂ ਵਾਲੇ ਪੈਨਲ ਵਿੱਚ ਬਦਲ ਸਕਦੇ ਹਨ।',
  myLimit: 'ਮੈਨੂੰ ਯਾਦ ਕਰਾਓ (ਹਰ ਦਿਨ) ਇੰਨੇ ਸਮੇਂ ਬਾਅਦ',
  limitsLink: 'ਸੀਮਾਵਾਂ ਅਤੇ ਆਰਾਮ',
},
};
// Default language set for HRS games. A game can pass its own set (init({ langs })) and/or its own
// current-language function (init({ getLang })); extra languages are added with addStrings() (see hrs-wellbeing-langs.js).
const LANGS = ['en', 'hi', 'pa'], RTL = ['ar', 'fa', 'ur', 'he'];
const langSet = () => (st.opts && st.opts.langs) || LANGS;
function lang() {
  const ok = l => l && langSet().includes(l) && STR[l];
  if (st.opts && st.opts.getLang) { const l = st.opts.getLang(); return ok(l) ? l : 'en'; }
  if (window.HRS && HRS.lang) { const l = HRS.lang(); if (ok(l)) return l; }
  let l = null; try { l = localStorage.getItem('hrs-lang'); } catch (e) {}
  if (ok(l)) return l;
  const n = (navigator.language || 'en').slice(0, 2).toLowerCase(); return ok(n) ? n : 'en';
}
function addStrings(l, obj) { STR[l] = Object.assign(STR[l] || {}, obj); }
const isRtl = () => RTL.includes(lang());
function t(k, vars) { const l = lang(); let s = (STR[l] && STR[l][k]) || STR.en[k] || k; if (vars) for (const v in vars) s = s.split('{' + v + '}').join(vars[v]); return s; }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- state ---------- */
const st = { gameId: 'hrs', profile: 'college', started: false, paused: false, lastInput: Date.now(), sessionSec: 0, hiddenAt: 0,
  breakShown: false, snoozeUntilSec: 0, quietSnoozeUntil: 0, opts: {}, timer: 0, lastQuietCheck: 0 };
const isChild = () => st.profile === 'school' || st.profile === 'child';
function emit(type, detail) { try { window.dispatchEvent(new CustomEvent('hrs-wellbeing', { detail: Object.assign({ type }, detail) })); } catch (e) {} if (st.opts.onEvent) try { st.opts.onEvent(type, detail || {}); } catch (e) {} }
function sfx(n) { if (window.HRS && HRS.sfx) try { HRS.sfx(n); } catch (e) {} }

/* ---------- playtime ---------- */
function days() { return S.get(K.days, {}); }
function prune(d) { const keys = Object.keys(d).sort(); const cut = dayKey(new Date(now().getTime() - KEEP_DAYS * 864e5)); keys.forEach(k => { if (k < cut) delete d[k]; }); return d; }
function addSeconds(sec) {
  const d = days(), k = today(); const e = d[k] || (d[k] = { sec: 0, games: {} });
  e.sec += sec; e.games[st.gameId] = (e.games[st.gameId] || 0) + sec; S.set(K.days, prune(d));
}
function markPlayed() { const d = days(), k = today(); if (!d[k]) { d[k] = { sec: 0, games: {} }; S.set(K.days, prune(d)); } }
function secondsToday() { const e = days()[today()]; return e ? e.sec : 0; }
function minutesToday() { return Math.floor(secondsToday() / 60); }
function breakMinutes() { const c = cfg(); return +(isChild() ? c.breakChild : c.breakStd) || 0; }
function limitMin() { const c = cfg(); const base = isChild() ? +c.limitChild : +c.limitStd; if (!base) return 0; return base + (+(c.extra || {})[today()] || 0); }
function minutesLeft() { const L = limitMin(); return L ? Math.max(0, L - minutesToday()) : Infinity; }
function quietState() {
  const c = cfg(), d = now();
  if (c.quietOn && inWindow(d, c.quietStart, c.quietEnd)) return 'night';
  if (c.schoolOn && (c.schoolDays || []).includes(d.getDay()) && inWindow(d, c.schoolStart, c.schoolEnd)) return 'school';
  return '';
}
function canPlay() {
  const q = quietState(), c = cfg();
  if (q && (isChild() ? c.quietBehChild : c.quietBehStd) === 'block' && Date.now() > st.quietSnoozeUntil) return { ok: false, reason: 'quiet', quiet: q };
  const L = limitMin();
  if (L && minutesToday() >= L && (isChild() ? c.behChild : c.behStd) === 'block') return { ok: false, reason: 'limit' };
  return { ok: true, quiet: q, minutesLeft: minutesLeft() };
}

/* ---------- rhythm (kind streaks) ---------- */
function rhythm() {
  const d = days(), td = today(), c = cfg(), played = Object.keys(d).filter(k => k <= td).sort().reverse();
  const last14 = played.filter(k => dayDiff(k, td) < 14).length;
  let run = 0, prev = played[0];
  for (const k of played) { if (dayDiff(k, prev) > c.restDays + 1) break; run++; prev = k; }
  // a run that ended long ago is not "current": show a fresh start, never a loss
  if (played.length && dayDiff(played[0], td) > c.restDays + 1) run = 0;
  const fresh = (run <= 1) && played.length > (run === 1 ? 1 : 0);
  return { last14, run, fresh, playedToday: !!d[td] };
}
function rhythmText() { const r = rhythm(); const a = []; if (r.run > 1) a.push(t('rhythm', { n: r.run })); else if (r.fresh) a.push(t('welcome')); else if (r.run === 1) a.push(t('firstDay')); a.push(t('last14', { n: r.last14 })); return a; }

/* ---------- real-world actions ---------- */
function acts() { return S.get(K.acts, []); }
function planActions(list) {
  const a = acts(), td = today();
  list.forEach(x => { if (!a.some(y => y.date === td && y.id === x.id)) a.push({ date: td, game: st.gameId, id: x.id, label: x.label, status: 'planned' }); });
  S.set(K.acts, a.filter(x => dayDiff(x.date, td) < KEEP_DAYS)); emit('actions', {});
}
function pendingFollowUps() { const td = today(); return acts().filter(x => x.status === 'planned' && x.date < td && dayDiff(x.date, td) <= 3); }
function resolveAction(date, id, status) { const a = acts(); a.forEach(x => { if (x.date === date && x.id === id) { x.status = status; x.resolved = today(); } }); S.set(K.acts, a); }
function actionsThisWeek() { const td = today(); return acts().filter(x => x.status === 'done' && dayDiff(x.resolved || x.date, td) < 7).length; }

/* ---------- overlay UI ---------- */
let root = null, box = null, prevFocus = null, dismiss = null, offBack = null;
const FOC = 'button:not([disabled]),input:not([disabled]),select,[tabindex]:not([tabindex="-1"])';
function ensureRoot() {
  if (root) return;
  root = document.createElement('div'); root.className = 'hrswb'; root.hidden = true;
  root.innerHTML = '<div class="hrswb-box" role="dialog" aria-modal="true" tabindex="-1"></div>';
  document.body.appendChild(root); box = root.firstChild;
  root.addEventListener('click', e => { if (e.target === root && dismiss) close(); });
  document.addEventListener('keydown', e => {
    if (root.hidden) return;
    if (e.key === 'Escape' && dismiss) { e.preventDefault(); close(); }
    if (e.key === 'Tab') { const f = [...box.querySelectorAll(FOC)].filter(x => x.offsetParent !== null); if (!f.length) return; const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
  }, true);
}
function open(html, { dismissible = false, onClose = null, kind = '' } = {}) {
  ensureRoot(); const wasOpen = !root.hidden;
  if (!wasOpen) prevFocus = document.activeElement;
  box.className = 'hrswb-box' + (kind ? ' hrswb-' + kind : ''); box.lang = lang(); box.dir = isRtl() ? 'rtl' : 'ltr'; root.dir = box.dir; box.innerHTML = html;
  const h = box.querySelector('h2'); if (h) { h.id = 'hrswb-h'; box.setAttribute('aria-labelledby', 'hrswb-h'); }
  dismiss = dismissible ? (onClose || (() => {})) : null;
  root.hidden = false; document.documentElement.classList.add('hrswb-open');
  if (window.HRS && HRS.parseEmoji) try { HRS.parseEmoji(box); } catch (e) {}
  if (!offBack && window.HRS && HRS.onBack) offBack = HRS.onBack(() => { if (root.hidden) return false; if (dismiss) close(); return true; });
  const f = box.querySelector('[autofocus]') || box.querySelector(FOC); (f || box).focus({ preventScroll: true });
  if (!wasOpen) { st.paused = true; emit('pause', {}); }
}
function close() {
  if (!root || root.hidden) return; const cb = dismiss; dismiss = null; root.hidden = true; box.innerHTML = '';
  document.documentElement.classList.remove('hrswb-open'); if (offBack) { offBack(); offBack = null; }
  st.paused = false; st.lastInput = Date.now(); emit('resume', {});
  if (prevFocus && prevFocus.isConnected) try { prevFocus.focus({ preventScroll: true }); } catch (e) {}
  if (cb) cb();
}
const btn = (id, label, cls = '') => `<button type="button" class="hrswb-btn ${cls}" data-a="${id}">${esc(label)}</button>`;
function on(map) { box.querySelectorAll('[data-a]').forEach(b => { b.onclick = () => { sfx('tap'); const f = map[b.dataset.a]; if (f) f(b); }; }); }
const isOpen = () => !!root && !root.hidden;

function exitGame() { if (window.HRS && HRS.home) { try { HRS.home(); return; } catch (e) {} } if (st.opts.onExit) st.opts.onExit(); }

function showLimit() {
  const c = cfg(), child = isChild(), beh = child ? c.behChild : c.behStd, n = minutesToday();
  emit('limit', { minutes: n });
  const html = `<div class="hrswb-icon" aria-hidden="true">🌅</div><h2>${esc(t('doneTitle'))}</h2>
    <p>${esc(t(child ? 'limitChild' : 'limitStd', { n }))}</p><p class="hrswb-strong">${esc(t('doneGo'))}</p>
    <ul class="hrswb-notes">${rhythmText().map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    <div class="hrswb-row">${beh === 'nudge' ? btn('keep', t('keep', { n: NUDGE_SNOOZE_MIN }), 'ghost') : ''}${btn('parent', t('parentAdd'), 'ghost')}${btn('exit', t('closeGame'))}</div>`;
  open(html, { kind: 'limit' });
  on({ keep: () => { st.snoozeUntilSec = secondsToday() + NUDGE_SNOOZE_MIN * 60; close(); },
       parent: () => askPin(() => { grantExtra(15); close(); }, showLimit),
       exit: () => { exitGame(); } });
}
function showBreak() {
  st.breakShown = true; emit('break', { minutes: Math.round(st.sessionSec / 60) });
  open(`<div class="hrswb-icon" aria-hidden="true">🧘</div><h2>${esc(t('breakTitle'))}</h2><p>${esc(t('breakBody', { n: Math.round(st.sessionSec / 60) }))}</p>
    <div class="hrswb-row">${btn('keep', t('breakKeep'), 'ghost')}${btn('rest', t('breakOk'))}</div>`, { dismissible: true, kind: 'break' });
  on({ keep: close, rest: () => {
    open(`<div class="hrswb-icon" aria-hidden="true">🌿</div><h2>${esc(t('restTitle'))}</h2><p>${esc(t('restBody'))}</p><div class="hrswb-row">${btn('back', t('back'))}</div>`, { kind: 'break' });
    st.sessionSec = 0; st.breakShown = false; on({ back: close }); } });
}
function showQuiet(q) {
  const c = cfg(), d = now(), child = isChild(), beh = child ? c.quietBehChild : c.quietBehStd;
  emit('quiet', { quiet: q });
  const body = q === 'school' ? t('quietSchool') : t('quietNight', { t: `${pad(d.getHours())}:${pad(d.getMinutes())}`, a: c.quietStart, b: c.quietEnd });
  open(`<div class="hrswb-icon" aria-hidden="true">${q === 'school' ? '🏫' : '🌙'}</div><h2>${esc(t('quietTitle'))}</h2><p>${esc(body)}</p>
    <div class="hrswb-row">${beh === 'nudge' ? btn('keep', t('quietKeep'), 'ghost') : btn('parent', t('parentsLink'), 'ghost')}${btn('exit', t('closeGame'))}</div>`, { kind: 'quiet' });
  on({ keep: () => { st.quietSnoozeUntil = Date.now() + 15 * 60000; close(); },
       parent: () => askPin(() => { st.quietSnoozeUntil = Date.now() + 30 * 60000; close(); }, () => showQuiet(q)), exit: exitGame });
}
function grantExtra(m) { const c = cfg(); const ex = Object.assign({}, c.extra); const k = today(); ex[k] = (+ex[k] || 0) + m; Object.keys(ex).forEach(x => { if (x < k) delete ex[x]; }); setCfg({ extra: ex }); }

/* ---------- PIN (salted SHA-256 via Web Crypto; FNV fallback) ---------- */
async function hash(pin, salt) {
  const s = salt + ':' + pin;
  try { if (window.crypto && crypto.subtle) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return 's:' + [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); } } catch (e) {}
  let h = 0x811c9dc5; for (let i = 0; i < 2000; i++) for (const ch of s + i) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return 'f:' + h.toString(16);
}
let fails = 0, lockUntil = 0;
function pinField(label) { return `<label class="hrswb-lbl">${esc(label)}<input class="hrswb-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" autofocus></label>`; }
function askPin(onOk, onCancel) {
  const c = cfg();
  if (!c.pinHash) return setPin(onOk, onCancel);
  open(`<h2>${esc(t('pinEnter'))}</h2>${pinField(t('pinEnter'))}<p class="hrswb-msg" role="alert"></p><p class="hrswb-small">${esc(t('pinForgot'))}</p>
    <div class="hrswb-row">${btn('cancel', t('cancel'), 'ghost')}${btn('ok', t('ok'))}</div>`, { dismissible: true, onClose: onCancel, kind: 'pin' });
  const inp = box.querySelector('input'), msg = box.querySelector('.hrswb-msg');
  const go = async () => {
    if (Date.now() < lockUntil) { msg.textContent = t('pinWait', { n: Math.ceil((lockUntil - Date.now()) / 1000) }); return; }
    if (await hash(inp.value, c.pinSalt) === c.pinHash) { fails = 0; dismiss = null; onOk(); return; }
    fails++; if (fails >= 5) { lockUntil = Date.now() + 30000; fails = 0; msg.textContent = t('pinWait', { n: 30 }); } else msg.textContent = t('pinWrong');
    inp.value = ''; inp.focus();
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  on({ cancel: () => { dismiss = null; close(); onCancel && onCancel(); }, ok: go });
}
function setPin(onOk, onCancel) {
  open(`<h2>${esc(t('pinSetTitle'))}</h2><p>${esc(t('pinSetBody'))}</p>${pinField(t('pinEnter'))}
    <label class="hrswb-lbl">${esc(t('pinAgain'))}<input class="hrswb-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off"></label>
    <p class="hrswb-msg" role="alert"></p><div class="hrswb-row">${btn('cancel', t('cancel'), 'ghost')}${btn('ok', t('save'))}</div>`, { dismissible: true, onClose: onCancel, kind: 'pin' });
  const [a, b] = box.querySelectorAll('input'), msg = box.querySelector('.hrswb-msg');
  const go = async () => {
    if (!/^\d{4,6}$/.test(a.value)) { msg.textContent = t('pinShort'); return; }
    if (a.value !== b.value) { msg.textContent = t('pinMismatch'); b.value = ''; b.focus(); return; }
    const salt = Math.random().toString(36).slice(2) + Date.now().toString(36);
    setCfg({ pinSalt: salt, pinHash: await hash(a.value, salt) }); dismiss = null; onOk();
  };
  b.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  on({ cancel: () => { dismiss = null; close(); onCancel && onCancel(); }, ok: go });
}

/* ---------- parent panel ---------- */
function openParentPanel() { askPin(renderPanel, null); }
const minsLbl = n => +n ? t('minN', { n }) : t('off');
function selN(k, v, list, disabled) { const l = list.includes(+v) ? list : list.concat(+v).sort((a, b) => (a || 1e9) - (b || 1e9));
  return `<select data-k="${k}" data-num="1" ${disabled ? 'disabled' : ''}>${l.map(n => `<option value="${n}" ${+v === n ? 'selected' : ''}>${esc(minsLbl(n))}</option>`).join('')}</select>`; }
function selB(k, v) { return `<select data-k="${k}"><option value="nudge" ${v === 'nudge' ? 'selected' : ''}>${esc(t('behNudge'))}</option><option value="block" ${v === 'block' ? 'selected' : ''}>${esc(t('behBlock'))}</option></select>`; }
function readForm() { const p = {}; box.querySelectorAll('[data-k]:not([disabled])').forEach(i => { const k = i.dataset.k;
  p[k] = i.type === 'checkbox' ? i.checked : i.dataset.num ? Math.max(0, Math.min(600, Math.round(+i.value || 0))) : i.value; }); return p; }
function usageLine() { return `${esc(t('todayUsed', { n: minutesToday() }))} · ${esc(isFinite(minutesLeft()) ? t('left', { n: minutesLeft() }) : t('noLimit'))}`; }
function renderPanel(note) {
  const c = cfg(), time = (k, v) => `<input type="time" data-k="${k}" value="${esc(v)}">`, chk = (k, v) => `<input type="checkbox" data-k="${k}" ${v ? 'checked' : ''}>`;
  open(`<h2>${esc(t('parentTitle'))}</h2><p class="hrswb-small">${esc(t('privacy'))}</p>
    <div class="hrswb-form">
      <fieldset class="hrswb-grp"><legend>🎒 ${esc(t('grpChild'))}</legend>
        <label>${esc(t('limChild'))}${selN('limitChild', c.limitChild, LIM_CHILD)}</label>
        <label>${esc(t('behChild'))}${selB('behChild', c.behChild)}</label>
        <label>${esc(t('breakMin'))}${selN('breakChild', c.breakChild, BREAKS)}</label>
        <label>${esc(t('quietBehChild'))}${selB('quietBehChild', c.quietBehChild)}</label></fieldset>
      <fieldset class="hrswb-grp"><legend>🎓 ${esc(t('grpStd'))}</legend>
        <label>${esc(t('limStd'))}${selN('limitStd', c.limitStd, LIM_STD)}</label>
        <label>${esc(t('behStd'))}${selB('behStd', c.behStd)}</label>
        <label>${esc(t('breakMin'))}${selN('breakStd', c.breakStd, BREAKS)}</label>
        <label>${esc(t('quietBehStd'))}${selB('quietBehStd', c.quietBehStd)}</label></fieldset>
      <p class="hrswb-sub">${esc(t('hoursTitle'))}</p>
      <fieldset><legend><label class="hrswb-inline">${chk('quietOn', c.quietOn)} ${esc(t('quietOn'))}</label></legend>
        <label class="hrswb-inline">${esc(t('from'))} ${time('quietStart', c.quietStart)}</label> <label class="hrswb-inline">${esc(t('to'))} ${time('quietEnd', c.quietEnd)}</label></fieldset>
      <fieldset><legend><label class="hrswb-inline">${chk('schoolOn', c.schoolOn)} ${esc(t('schoolOn'))}</label></legend>
        <label class="hrswb-inline">${esc(t('from'))} ${time('schoolStart', c.schoolStart)}</label> <label class="hrswb-inline">${esc(t('to'))} ${time('schoolEnd', c.schoolEnd)}</label></fieldset>
    </div>
    <p class="hrswb-strong">${usageLine()}</p>
    <p class="hrswb-msg" role="status">${note ? esc(note) : ''}</p>
    <div class="hrswb-row hrswb-wrap">${btn('add', t('add15'), 'ghost')}${btn('reset', t('resetToday'), 'ghost')}${btn('pin', t('changePin'), 'ghost')}${btn('forget', t('forget'), 'ghost danger')}</div>
    <div class="hrswb-row">${btn('close', t('close'), 'ghost')}${btn('save', t('save'))}</div>`, { dismissible: true, kind: 'panel' });
  on({ save: () => { setCfg(readForm()); st.snoozeUntilSec = 0; renderPanel(t('saved')); }, close,
    add: () => { grantExtra(15); renderPanel(t('saved')); },
    reset: () => { const d = days(); if (d[today()]) { d[today()].sec = 0; d[today()].games = {}; S.set(K.days, d); } st.sessionSec = 0; st.snoozeUntilSec = 0; renderPanel(t('saved')); },
    pin: () => setPin(() => renderPanel(t('saved')), renderPanel),
    forget: () => { if (confirm(t('forgetSure'))) { forgetAll(); close(); } } });
}
/* College/Expert players set their own gentle reminders without a PIN (unless a parent chose "stop play").
   School-level limits always need the parent PIN. */
function openMySettings() { if (isChild()) return openParentPanel(); renderMine(); }
function renderMine(note) {
  const c = cfg(), locked = c.behStd === 'block';
  open(`<div class="hrswb-icon" aria-hidden="true">⏱️</div><h2>${esc(t('myTitle'))}</h2><p class="hrswb-small">${esc(t(locked ? 'myLocked' : 'myIntro'))}</p>
    <div class="hrswb-form"><label>${esc(t('myLimit'))}${selN('limitStd', c.limitStd, LIM_STD, locked)}</label>
      <label>${esc(t('breakMin'))}${selN('breakStd', c.breakStd, BREAKS, locked)}</label></div>
    <p class="hrswb-strong">${usageLine()}</p><p class="hrswb-msg" role="status">${note ? esc(note) : ''}</p>
    <div class="hrswb-row">${btn('parent', t('parentsLink'), 'ghost')}${btn('close', t('close'), 'ghost')}${locked ? '' : btn('save', t('save'))}</div>`, { dismissible: true, kind: 'mine' });
  on({ save: () => { setCfg(readForm()); st.snoozeUntilSec = 0; st.breakShown = false; renderMine(t('saved')); }, close, parent: openParentPanel });
}
function langChanged() { if (!isOpen()) return; if (box.classList.contains('hrswb-panel')) renderPanel(); else if (box.classList.contains('hrswb-mine')) renderMine(); else { box.lang = lang(); box.dir = root.dir = isRtl() ? 'rtl' : 'ltr'; } }
function limitsButton(label) { const b = document.createElement('button'); b.type = 'button'; b.className = 'hrswb-link'; b.textContent = label || t('limitsLink'); b.onclick = openMySettings; return b; }
function forgetAll() { Object.values(K).forEach(S.del); st.sessionSec = 0; st.snoozeUntilSec = 0; emit('forget', {}); }

/* ---------- done for today / follow-up ---------- */
function doneForToday({ title, lines = [], actions = [], onClose } = {}) {
  const chosen = new Set();
  const html = `<div class="hrswb-icon" aria-hidden="true">🌅</div><h2>${esc(title || t('doneTitle'))}</h2>
    ${lines.map(l => `<p>${esc(l)}</p>`).join('')}<p class="hrswb-strong">${esc(t('doneGo'))}</p>
    ${actions.length ? `<p>${esc(t('pick'))}</p><div class="hrswb-acts">${actions.map(a => `<button type="button" class="hrswb-act" aria-pressed="false" data-id="${esc(a.id)}">${esc(a.label)}</button>`).join('')}</div>` : ''}
    <ul class="hrswb-notes">${rhythmText().map(x => `<li>${esc(x)}</li>`).join('')}<li>${esc(t('actsWeek', { n: actionsThisWeek() }))}</li></ul>
    <div class="hrswb-row">${btn('done', t('doneBtn'))}</div>`;
  open(html, { kind: 'done' });
  box.querySelectorAll('.hrswb-act').forEach(b => b.onclick = () => {
    const id = b.dataset.id; if (chosen.has(id)) chosen.delete(id); else if (chosen.size < 3) chosen.add(id);
    box.querySelectorAll('.hrswb-act').forEach(x => x.setAttribute('aria-pressed', chosen.has(x.dataset.id) ? 'true' : 'false')); sfx('tap');
  });
  on({ done: () => { planActions(actions.filter(a => chosen.has(a.id))); emit('done', { chosen: [...chosen] }); close(); onClose && onClose([...chosen]); } });
}
function showFollowUp(onDone) {
  const p = pendingFollowUps(); if (!p.length) { onDone && onDone(); return false; }
  const x = p[0];
  open(`<div class="hrswb-icon" aria-hidden="true">🌱</div><h2>${esc(t('fuTitle'))}</h2><p>${esc(t('fuBody'))}</p><p class="hrswb-strong">${esc(x.label)}</p><p class="hrswb-msg" role="status"></p>
    <div class="hrswb-row">${btn('no', t('fuNo'), 'ghost')}${btn('yes', t('fuYes'))}</div>`, { dismissible: true, onClose: onDone, kind: 'fu' });
  on({ yes: () => { resolveAction(x.date, x.id, 'done'); sfx('good'); box.querySelector('.hrswb-msg').textContent = t('fuYesMsg'); setTimeout(() => { dismiss = null; close(); showFollowUp(onDone); }, 1100); },
       no: () => { resolveAction(x.date, x.id, 'notyet'); dismiss = null; close(); showFollowUp(onDone); } });
  return true;
}

/* ---------- ticking ---------- */
function tick() {
  if (!st.started || st.paused || document.visibilityState === 'hidden') return;
  if (Date.now() - st.lastInput > IDLE_MS) return;
  addSeconds(TICK_MS / 1000); st.sessionSec += TICK_MS / 1000;
  check();
}
function check() {
  if (isOpen()) return;
  const q = quietState(), c0 = cfg();
  if (q && Date.now() > st.quietSnoozeUntil) { showQuiet(q); return; }
  const L = limitMin();
  const nudge = (isChild() ? c0.behChild : c0.behStd) === 'nudge';
  if (L && minutesToday() >= L && !(nudge && secondsToday() < st.snoozeUntilSec)) { showLimit(); return; }
  const bm = breakMinutes(); if (bm && !st.breakShown && st.sessionSec >= bm * 60) showBreak();
}
function bindActivity() {
  const mark = () => { st.lastInput = Date.now(); };
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(e => addEventListener(e, mark, { passive: true, capture: true }));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') st.hiddenAt = Date.now();
    else { if (st.hiddenAt && Date.now() - st.hiddenAt > BREAK_RESET_MS) { st.sessionSec = 0; st.breakShown = false; } st.hiddenAt = 0; mark(); if (st.started) check(); }
  });
  addEventListener('hrs-lang-change', langChanged);
}

/* ---------- public API ---------- */
let inited = false;
function init(opts = {}) {
  st.opts = opts; st.gameId = opts.gameId || st.gameId; if (opts.profile) st.profile = opts.profile;
  try { const q = new URLSearchParams(location.search); if (q.get('wbBreakSec')) setCfg({ breakChild: +q.get('wbBreakSec') / 60, breakStd: +q.get('wbBreakSec') / 60 }); } catch (e) {}
  if (!inited) { inited = true; bindActivity(); }
  return API;
}
function start() {
  ensureRoot(); markPlayed(); st.started = true; st.lastInput = Date.now();
  if (!st.timer) st.timer = setInterval(tick, TICK_MS);
  const g = canPlay();
  if (!g.ok) { if (g.reason === 'quiet') showQuiet(g.quiet); else showLimit(); return false; }
  if (g.quiet && Date.now() > st.quietSnoozeUntil) { showQuiet(g.quiet); return true; }
  return true;
}
function setProfile(p) { st.profile = p; if (st.started) check(); }
function parentButton(label) { const b = document.createElement('button'); b.type = 'button'; b.className = 'hrswb-link'; b.textContent = label || t('parentsLink'); b.onclick = openParentPanel; return b; }
function status() { return { minutesToday: minutesToday(), minutesLeft: minutesLeft(), limit: limitMin(), quiet: quietState(), rhythm: rhythm(), actionsThisWeek: actionsThisWeek(), sessionMin: Math.round(st.sessionSec / 60), profile: st.profile }; }

const API = { VERSION, init, start, setProfile, canPlay, status, rhythm, rhythmText, minutesToday, minutesLeft,
  doneForToday, showFollowUp, pendingFollowUps, planActions, actionsThisWeek, openParentPanel, parentButton, openMySettings, limitsButton, addStrings, langChanged, isRtl,
  settings: cfg, t, lang, close, LANGS, RTL, breakMinutes, isOpen, forgetAll, STR,
  _debug: { addMinutes(m) { addSeconds(m * 60); st.sessionSec += m * 60; check(); }, setNow(d) { nowOverride = d ? new Date(d) : null; }, shift(ms) { offset += ms; }, check, showBreak, showLimit, showQuiet, state: st } };
window.HRSWellbeing = API;
if (window.HRS) window.HRS.wellbeing = API;
})();
