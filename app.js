/* Our Compass: everything is saved on this phone only (localStorage). Nothing is sent anywhere,
   apart from anonymous usage counts (ste-owner.js) and feedback the user chooses to send. */
(function () {
  'use strict';
  const C = window.OC_CONTENT;
  const $ = id => document.getElementById(id);
  const app = $('app'), layer = $('layer');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const clone = o => JSON.parse(JSON.stringify(o));
  const pad = n => String(n).padStart(2, '0');
  const dkey = t => { const d = new Date(t); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const today = () => dkey(Date.now());
  const day = t => new Date(t).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const time = t => new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const hourName = h => (h % 12 || 12) + (h < 12 ? 'am' : 'pm');
  const localInput = t => { const d = new Date(t); return dkey(t) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };

  /* ---------- Owner usage numbers: counts only, never names, notes or diary words ---------- */
  function ste(f, ...a) { try { if (window.STE && window.STE[f]) window.STE[f](...a); } catch (e) {} }
  let played = false;
  const used = what => { if (!played) { played = true; ste('track', 'play'); } ste('detail', what); };

  /* ---------- Saved data ---------- */
  const KEY = 'oc_data_v1';
  function newKid(name, emoji, age) {
    age = age || 'middle';
    return {
      id: uid(), name: name || '', emoji: emoji || '🦊', age, theme: 'plain', hard: [], tools: defaultTools(age),
      readAloud: false, sounds: true, calmer: false, grown: age === 'teen', big: false, easy: false,
      calm: clone(C.CALM_IDEAS), plan: clone(C.PLAN_STEPS), cards: [],
      checkins: [], battery: [], diary: [], notes: [], stories: [],
      reward: { goals: [], target: 10, treat: '', stars: [], rounds: [] },
      ft: { first: null, then: null, firstDone: false },
      today: { name: 'Morning', items: clone(C.TODAY_PRESETS.Morning), done: [], day: '' },
      custom: { scenarios: [], rules: [] },
      passport: { likes: '', helps: '', upsets: '', overwhelm: '', talk: '', sense: {}, senseNote: {}, showPlan: true }
    };
  }
  function defaultTools(age) { const t = {}; C.TOOLS.forEach(x => { t[x.id] = x.on.includes(age); }); return t; }
  function fixKid(k) {
    const b = newKid(k.name, k.emoji, k.age);
    for (const key in b) {
      if (k[key] === undefined || typeof k[key] !== typeof b[key] || Array.isArray(b[key]) !== Array.isArray(k[key])) k[key] = b[key];
      else if (b[key] && typeof b[key] === 'object' && !Array.isArray(b[key])) for (const s in b[key]) if (k[key][s] === undefined) k[key][s] = b[key][s];
    }
    return k;
  }
  function load() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v && Array.isArray(v.kids)) { v.kids = v.kids.filter(k => k && k.id).map(fixKid); v.pro = v.pro || ''; v.timer = v.timer || null; return v; }
    } catch (e) {}
    return { v: 1, setupDone: false, pro: '', kids: [], cur: '', timer: null };
  }
  let D = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { toast('This phone\'s storage is full, so that wasn\'t saved.'); } }
  const K = () => D.kids.find(k => k.id === D.cur) || D.kids[0];
  const teen = k => k.age === 'teen' || k.grown;
  const toolName = (t, k) => teen(k) ? t.teen : t.name;
  const toolById = id => C.TOOLS.find(t => t.id === id);

  /* ---------- View state ---------- */
  let V = 'home', ST = {}, W = null, lockUntil = 0;
  const BACK = { checkin2: 'checkin', scenario: 'scenarios', scEdit: 'scenarios', ruleEdit: 'rules', story: 'stories', storyEdit: 'stories', diaryForm: 'grown' };

  /* ---------- Look ---------- */
  let lexend = false;
  function applyLook() {
    const k = K(), b = document.body;
    b.className = '';
    if (k) {
      b.classList.add('th-' + k.theme, 'age-' + k.age);
      if (k.grown) b.classList.add('grown');
      if (k.big) b.classList.add('big');
      if (k.calmer) b.classList.add('calmer');
      if (k.easy) {
        b.classList.add('easy');
        if (!lexend) { lexend = true; const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700&display=swap'; document.head.appendChild(l); }
      }
    }
    const kb = $('kidBtn');
    kb.classList.toggle('hidden', !k || V === 'setup');
    if (k) kb.innerHTML = '<b>' + esc(k.emoji) + '</b><span>' + esc(k.name) + '</span>' + (D.kids.length > 1 ? ' ▾' : '');
    $('nav').classList.toggle('hidden', V === 'setup');
    document.querySelectorAll('#nav button').forEach(n => n.classList.toggle('on', n.dataset.v === navOf(V)));
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = getComputedStyle(b).getPropertyValue('--brand').trim() || '#2f5968';
  }
  const navOf = v => v === 'passport' ? 'passport' : (['grown', 'diaryForm', 'lock'].includes(v) ? 'grown' : 'home');

  /* ---------- Rendering ---------- */
  let breathT = null;
  function render() {
    if (!D.setupDone || !D.kids.length || W) { if (!W) W = { step: 0, kid: newKid(), adding: false }; V = 'setup'; }
    if (breathT) { clearInterval(breathT); breathT = null; }
    applyLook();
    const f = VIEWS[V] || VIEWS.home;
    app.innerHTML = f(K());
    if (V === 'calm') startBreathing();
    if (V === 'timer') timerPaint();
  }
  function go(v, keepState) {
    if (!keepState) ST = { ptab: ST.ptab };
    const wasHome = V === 'home';
    V = v; render(); window.scrollTo(0, 0);
    if (wasHome && v !== 'home') { try { history.pushState({ oc: 1 }, ''); } catch (e) {} }
    if (VIEWS[v] && toolById(v)) used('tool-' + v);
  }
  window.addEventListener('popstate', () => {
    if (layer.innerHTML) { closeLayer(); try { history.pushState({ oc: 1 }, ''); } catch (e) {} return; }
    if (V === 'setup' || V === 'home') return;
    const to = BACK[V] || 'home';
    V = to; render();
    if (to !== 'home') { try { history.pushState({ oc: 1 }, ''); } catch (e) {} }
  });

  /* ---------- Little helpers for building screens ---------- */
  const card = (inner, cls) => '<div class="card ' + (cls || '') + '">' + inner + '</div>';
  const backBtn = (to, label) => '<button class="ghost" data-a="nav" data-v="' + to + '">‹ ' + esc(label || 'Back') + '</button>';
  const canSpeak = () => 'speechSynthesis' in window && typeof SpeechSynthesisUtterance === 'function';
  const sayBtn = (k, text) => k && k.readAloud && canSpeak() ? '<button class="say small" data-a="say" data-v="' + esc(text) + '">🔊 Read it</button>' : '';
  const chipList = (items, chosen, act, extra) => '<div class="chips">' + items.map(x => '<button class="chip' + (chosen.includes(x) ? ' on' : '') + '" data-a="' + act + '" data-v="' + esc(x) + '"' + (extra || '') + '>' + esc(x) + '</button>').join('') + '</div>';
  const sw = (label, path, on, sub) => '<label class="switch"><span>' + esc(label) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span><input type="checkbox" data-f="' + path + '" data-rr' + (on ? ' checked' : '') + '></label>';
  const disclaimer = '<p class="note">Our Compass supports, but doesn\'t replace, a speech and language therapist, occupational therapist, psychologist, GP or CAMHS. It doesn\'t diagnose anything.</p>';
  const logo = '<div class="ste-logo-wrapper"><img src="ste-logo.png" alt="Created By The Spectrum Tech Engine" class="ste-logo-img"></div>';

  function say(text) {
    if (!canSpeak()) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = speechSynthesis.getVoices().find(x => /en-(GB|IE)/i.test(x.lang)) || speechSynthesis.getVoices().find(x => /^en/i.test(x.lang));
      if (v) u.voice = v;
      u.rate = 0.92; speechSynthesis.speak(u);
    } catch (e) {}
  }
  let actx = null;
  function chime() {
    const k = K(); if (!k || !k.sounds) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      [523.25, 659.25, 783.99].forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * 0.18;
        o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18, t + 0.03); g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
        o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 1);
      });
    } catch (e) {}
  }
  let toastT = null;
  function toast(msg, undo) {
    document.querySelectorAll('.toast').forEach(x => x.remove());
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
    t.innerHTML = '<span></span>'; t.firstChild.textContent = msg;
    if (undo) { const b = document.createElement('button'); b.textContent = 'Undo'; b.onclick = () => { undo(); t.remove(); }; t.appendChild(b); }
    document.body.appendChild(t); clearTimeout(toastT); toastT = setTimeout(() => t.remove(), undo ? 8000 : 3000);
  }
  function sheet(html) { layer.innerHTML = '<div class="sheet" data-a="closeLayer"><div data-stop>' + html + '</div></div>'; }
  function closeLayer() { layer.innerHTML = ''; try { speechSynthesis.cancel(); } catch (e) {} }
  function printHTML(html) { $('print').innerHTML = html; setTimeout(() => window.print(), 50); }

  /* ---------- Grown-ups' lock: a times-table sum, just to stop little fingers ---------- */
  const unlocked = () => Date.now() < lockUntil;
  function requireGrown(fn) {
    if (unlocked()) { lockUntil = Date.now() + 10 * 60000; fn(); return; }
    closeLayer();
    const a = 3 + Math.floor(Math.random() * 7), b = 3 + Math.floor(Math.random() * 7);
    ST = { after: fn, sum: [a, b], ptab: ST.ptab, from: V }; V = 'lock'; render();
    setTimeout(() => { const i = $('lockIn'); if (i) i.focus(); }, 50);
  }

  /* ---------- Tool order: age defaults, lifted by "what's hardest" ---------- */
  function orderedTools(k) {
    return C.TOOLS.map((t, i) => {
      let s = i;
      k.hard.forEach(h => { const H = C.HARD.find(x => x[0] === h); if (H) { const j = H[2].indexOf(t.id); if (j >= 0) s -= 20 - j * 3; } });
      return { t, s };
    }).filter(x => k.tools[x.t.id]).sort((a, b) => a.s - b.s).map(x => x.t);
  }
  const hardTags = k => { const s = new Set(); k.hard.forEach(h => { const H = C.HARD.find(x => x[0] === h); if (H) H[3].forEach(t => s.add(t)); }); return s; };
  function orderedBy(list, k) {
    const tags = hardTags(k);
    return list.filter(x => !x.ages || x.ages.includes(k.age))
      .map((x, i) => ({ x, s: i - (x.tags && x.tags.some(t => tags.has(t)) ? 1000 : 0) })).sort((a, b) => a.s - b.s).map(o => o.x);
  }
  const allScenarios = k => k.custom.scenarios.map(s => Object.assign({ mine: true }, s)).concat(orderedBy(C.SCENARIOS, k));
  const allRules = k => k.custom.rules.map(s => Object.assign({ mine: true }, s)).concat(orderedBy(C.RULES, k));

  /* =====================================================================
     SCREENS
     ===================================================================== */
  const VIEWS = {};

  /* ---------- First-time setup ---------- */
  VIEWS.setup = function () {
    const w = W, k = w.kid;
    const steps = w.adding ? [1, 2, 3, 5] : [0, 1, 2, 3, 4, 5];
    const n = steps.indexOf(w.step) + 1, of = steps.length;
    const head = w.step > 0 && w.step < 5 ? '<p class="muted">Step ' + (n - (w.adding ? 0 : 1)) + ' of ' + (of - (w.adding ? 1 : 2)) + '</p>' : '';
    const nav = (next, label) => '<div class="row" style="margin-top:14px">' + (w.step > (w.adding ? 1 : 0) ? '<button class="light no-grow" data-a="wBack">Back</button>' : (w.adding ? '<button class="light no-grow" data-a="wCancel">Cancel</button>' : '')) + '<button data-a="' + next + '">' + esc(label || 'Next') + '</button></div>';
    if (w.step === 0) return card('<h2>👋 Welcome to Our Compass</h2><p class="hello" style="font-size:1.15em">You know your child best. This is here to help.</p>' +
      '<p>Our Compass is a free, private toolkit for autistic children and their families:</p><ul>' +
      '<li><b>For your child:</b> a colour check-in, calm corner, first/then board, timer, quick cards, everyday "what would you do?" moments, and more.</li>' +
      '<li><b>For you:</b> a diary of tricky and good moments, patterns to spot, a calm plan for when it gets too much, and a summary to print or share.</li>' +
      '<li><b>Together:</b> an "All about me" passport to share with school or grandparents.</li></ul>' +
      '<p class="ok">🔒 Everything stays on this phone. No accounts, nothing uploaded.</p>' + disclaimer +
      '<p class="muted">Setting up takes about a minute. You can change everything later.</p>' + nav('wNext', 'Let\'s start'));
    if (w.step === 1) return card(head + '<h2>Who is it for?</h2>' +
      '<label class="lab" for="wName">First name or nickname</label><input type="text" id="wName" maxlength="24" data-f="w.name" value="' + esc(k.name) + '" placeholder="e.g. Sam">' +
      '<label class="lab">Pick a picture</label><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(56px,1fr))">' + C.EMOJIS.map(e => '<button class="pick' + (k.emoji === e ? ' on' : '') + '" data-a="wEmoji" data-v="' + e + '" aria-label="' + e + '"><b>' + e + '</b></button>').join('') + '</div>' +
      '<label class="lab">Age group</label><p class="muted">This sets the look, the words, and which tools show first.</p><div class="grid" style="grid-template-columns:repeat(3,1fr)">' +
      Object.entries(C.AGES).map(([id, a]) => '<button class="pick' + (k.age === id ? ' on' : '') + '" data-a="wAge" data-v="' + id + '"><b>' + ({ little: '🧸', middle: '🎒', teen: '🎧' })[id] + '</b>' + a.label + '<small>' + a.sub + '</small></button>').join('') + '</div>' +
      '<p id="wErr" class="muted" role="status"></p>' + nav('wNext'));
    if (w.step === 2) return card(head + '<h2>What\'s hardest right now?</h2><p class="muted">Tick any that fit. The tools and stories that match go to the top. Change this any time.</p>' +
      '<div class="chips">' + C.HARD.map(h => '<button class="chip' + (k.hard.includes(h[0]) ? ' on' : '') + '" data-a="wHard" data-v="' + h[0] + '">' + esc(h[1]) + '</button>').join('') + '</div>' + nav('wNext'));
    if (w.step === 3) return card(head + '<h2>Make it ' + esc(k.name || 'theirs') + '\'s</h2><label class="lab">Theme, from their interests</label>' +
      '<div class="grid" style="grid-template-columns:repeat(4,1fr)">' + Object.entries(C.THEMES).map(([id, t]) => '<button class="pick' + (k.theme === id ? ' on' : '') + '" data-a="wTheme" data-v="' + id + '"><b>' + t.emoji + '</b>' + t.label + '</button>').join('') + '</div>' +
      '<div style="margin-top:12px">' + lookSwitches(k, 'w.') + '</div>' + nav('wNext'));
    if (w.step === 4) return card(head + '<h2>Anyone helping you? (optional)</h2><p class="muted">For example a speech and language therapist, psychologist or teacher. Their name is only shown on the summary you print or share.</p>' +
      '<input type="text" maxlength="60" data-f="d.pro" value="' + esc(D.pro) + '" placeholder="e.g. Dr Byrne, CAMHS">' + nav('wNext'));
    return card('<h2>🎉 All set for ' + esc(k.name) + '!</h2><p>Everything can be changed later in <b>Grown-ups → Settings</b>, including which tools show.</p>' +
      '<p class="muted">The grown-ups\' area is behind a simple sum, like 7 × 6. It\'s not a password, just enough to stop little fingers.</p>' +
      '<div class="row" style="margin-top:14px"><button class="light" data-a="wAnother">+ Add another child</button><button data-a="wDone">Start</button></div>');
  };
  function lookSwitches(k, p) {
    return sw('Read it aloud', p + 'readAloud', k.readAloud, canSpeak() ? 'A 🔊 button on cards and stories' : 'Not available on this phone or in the Android app yet') +
      sw('Sounds', p + 'sounds', k.sounds, 'Gentle chime for stars and timers') +
      sw('Calmer animations', p + 'calmer', k.calmer, 'Slower, softer movement') +
      sw('Grown-up look', p + 'grown', k.grown, 'Plainer, less playful, good for teens') +
      sw('Bigger text', p + 'big', k.big) +
      sw('Easy-read font', p + 'easy', k.easy, 'Dyslexia-friendly, with more space between letters');
  }

  /* ---------- Home ---------- */
  VIEWS.home = function (k) {
    const th = C.THEMES[k.theme];
    let h = th.deco.length ? '<div class="deco" aria-hidden="true">' + th.deco.join('') + '</div>' : '';
    h += '<p class="hello">' + (k.age === 'little' ? 'Hi ' + esc(k.name) + '! 👋' : 'Hi ' + esc(k.name)) + '</p>';
    if (D.timer) h += timerBanner();
    if (k.tools.checkin) h += card('<div class="row" style="margin-bottom:8px"><h2 style="margin:0">' + (k.age === 'little' ? 'How do you feel?' : 'How are you feeling?') + '</h2>' + '<span class="no-grow">' + sayBtn(k, 'How do you feel? Blue, green, yellow or red?') + '</span></div><div class="colours mini">' +
      C.COLOURS.map(c => '<button class="colour" style="background:' + c.hex + '" data-a="checkin" data-v="' + c.id + '">' + esc(k.age === 'little' ? c.little : c.word) + '</button>').join('') + '</div>');
    const tools = orderedTools(k).filter(t => t.id !== 'checkin' || !k.tools.checkin);
    h += '<div class="grid">' + orderedTools(k).filter(t => t.id !== 'checkin').map(t => '<button class="tile" data-a="nav" data-v="' + t.id + '"><b>' + t.emoji + '</b>' + esc(toolName(t, k)) + (k.age !== 'little' ? '<small>' + esc(t.desc) + '</small>' : '') + '</button>').join('') +
      '<button class="tile" data-a="nav" data-v="passport"><b>🪪</b>All about me' + (k.age !== 'little' ? '<small>What helps me, to share</small>' : '') + '</button></div>';
    if (!tools.length) h += '<p class="muted">All the tools are switched off. A grown-up can switch them on in Settings.</p>';
    return h + '<div style="margin-top:16px">' + disclaimer + '</div>' + logo;
  };

  /* ---------- Colour check-in ---------- */
  VIEWS.checkin = function (k) {
    return backBtn('home', 'Home') + card('<div class="row"><h2 style="margin:0">' + (k.age === 'little' ? 'How do you feel?' : 'How are you feeling?') + '</h2><span class="no-grow">' + sayBtn(k, 'How do you feel? Pick a colour.') + '</span></div>' +
      '<p class="muted">Pick the colour that fits. Every colour is OK.</p><div class="colours">' +
      C.COLOURS.map(c => '<button class="colour" style="background:' + c.hex + '" data-a="checkin" data-v="' + c.id + '">' + esc(k.age === 'little' ? c.little : c.name + ': ' + c.word) + (k.age !== 'little' ? '<small>' + esc(c.sub) + '</small>' : '') + '</button>').join('') + '</div>');
  };
  VIEWS.checkin2 = function (k) {
    const e = k.checkins[ST.ci]; if (!e) return VIEWS.checkin(k);
    const c = C.COLOURS.find(x => x.id === e.c);
    const msg = { blue: 'Feeling low is OK. Go gently.', green: 'Lovely. Enjoy it!', yellow: 'Feeling wobbly is OK. Something here might help.', red: 'Everything feels like too much. That\'s OK. Let\'s get calmer.' }[e.c];
    let h = '<div class="card" style="background:' + c.soft + ';border-color:' + c.hex + '"><h2 style="color:' + c.hex + '">' + esc(k.age === 'little' ? c.little : c.name + ': ' + c.word) + '</h2><p>' + esc(msg) + '</p>' + sayBtn(k, msg) + '</div>';
    if (k.calm[e.c] && k.calm[e.c].length) h += card('<h2>' + (e.c === 'green' ? 'Ideas' : 'Things that might help') + '</h2>' +
      k.calm[e.c].map(i => '<button class="opt' + (e.idea === i ? ' open good' : '') + '" data-a="idea" data-v="' + esc(i) + '">' + (e.idea === i ? '✅ ' : '') + esc(i) + '</button>').join('') +
      (e.idea ? '<p class="ok">Good plan 👍</p>' : ''));
    if (k.age !== 'little' && e.c !== 'green') h += card('<h2>Where do you feel it?</h2><p class="muted">Optional. Noticing body clues early can help next time.</p>' + chipList(C.BODY_CLUES, e.body || [], 'bodyClue'));
    if (k.age === 'little' && (e.c === 'red' || e.c === 'yellow')) h += '<p class="note">You can show this screen to a grown-up.</p>';
    return backBtn('home', 'Home') + h + '<div class="row">' + (k.tools.calm ? '<button class="light" data-a="nav" data-v="calm">🫧 Calm corner</button>' : '') + '<button data-a="nav" data-v="home">Done</button></div>';
  };

  /* ---------- Calm corner ---------- */
  VIEWS.calm = function (k) {
    const pace = ST.pace || 4;
    return backBtn('home', 'Home') + card('<h2>' + (teen(k) ? 'Breathe' : 'Calm corner') + '</h2><p class="muted">Follow the circle. Breathe in as it grows, out as it shrinks.</p>' +
      '<div class="breathe" id="breathe" style="--pace:' + pace + 's"><div class="ball"></div><div class="txt" id="breatheTxt">Get ready…</div></div>' +
      '<p class="muted" style="text-align:center" id="breathCount" aria-live="polite"></p>' +
      '<div class="row" style="justify-content:center"><span class="muted no-grow">Speed:</span>' + [[4, 'Quicker'], [5, 'Medium'], [6, 'Slower']].map(([v, l]) => '<button class="chip no-grow' + (pace === v ? ' on' : '') + '" data-a="pace" data-v="' + v + '">' + l + '</button>').join('') + '</div>');
  };
  function startBreathing() {
    const box = $('breathe'), txt = $('breatheTxt'), cnt = $('breathCount'); if (!box) return;
    const pace = (ST.pace || 4) * 1000; let phase = 0, n = 0;
    const step = () => {
      if (!document.body.contains(box)) { clearInterval(breathT); breathT = null; return; }
      phase = 1 - phase;
      box.classList.toggle('in', phase === 1); box.classList.toggle('out', phase === 0);
      txt.textContent = phase === 1 ? 'Breathe in…' : 'Breathe out…';
      if (phase === 0) { n++; cnt.textContent = n + (n === 1 ? ' breath' : ' breaths'); }
    };
    setTimeout(step, 600); breathT = setInterval(step, pace);
    used('calm-breathing');
  }

  /* ---------- Show a card ---------- */
  VIEWS.cards = function (k) {
    const all = C.CARDS.concat(k.cards.map(c => Object.assign({ mine: true, bg: '#2f5968' }, c)));
    return backBtn('home', 'Home') + card('<h2>' + esc(toolName(toolById('cards'), k)) + '</h2><p class="muted">Tap a card to show it big. Hold the phone up so others can read it.</p><div class="grid">' +
      all.map((c, i) => '<button class="tile" style="background:' + c.bg + ';color:#fff;border:0" data-a="bigCard" data-v="' + i + '"><b>' + esc(c.e) + '</b>' + esc(c.t) + '</button>').join('') + '</div>') +
      card('<h2>Make your own card</h2><div class="row"><input type="text" maxlength="60" data-f="s.cardText" placeholder="e.g. I need my fidget"><button class="no-grow" data-a="addCard">Add</button></div>' +
        (k.cards.length ? '<ul class="list" style="margin-top:8px">' + k.cards.map((c, i) => '<li><span class="grow">' + esc(c.e + ' ' + c.t) + '</span><button class="small light" data-a="delCard" data-v="' + i + '">Remove</button></li>').join('') + '</ul>' : ''));
  };

  /* ---------- Star chart / goals ---------- */
  VIEWS.reward = function (k) {
    const r = k.reward, name = toolName(toolById('reward'), k);
    if (ST.rEdit) {
      const g = ST.rg;
      return backBtn('reward', 'Back') + card('<h2>Choose goals together</h2><p class="muted">1 to 3 goals, in positive words: what to do, not what to stop. For example "Tell someone when it\'s too loud", "Try one new food a week".</p>' +
        [0, 1, 2].map(i => '<label class="lab">Goal ' + (i + 1) + (i ? ' (optional)' : '') + '</label><input type="text" maxlength="80" data-f="s.rg.' + i + '" value="' + esc(g[i] || '') + '">').join('') +
        '<label class="lab">How many stars for the treat?</label><div class="chips">' + [5, 10, 15, 20].map(n => '<button class="chip' + (ST.rt === n ? ' on' : '') + '" data-a="rTarget" data-v="' + n + '">' + n + '</button>').join('') + '</div>' +
        '<label class="lab">The treat</label><input type="text" maxlength="80" data-f="s.rTreat" value="' + esc(ST.rTreat || '') + '" placeholder="e.g. Trip to the cinema">' +
        '<div class="row" style="margin-top:14px"><button data-a="rSave">Save</button></div>');
    }
    const got = r.stars.length, full = got >= r.target && r.goals.length;
    let h = backBtn('home', 'Home');
    if (!r.goals.length) return h + card('<h2>' + esc(name) + '</h2><p>No goals yet. Pick 1 to 3 goals together, then earn stars towards a treat.</p><button data-a="rEdit">Choose goals (grown-up)</button>');
    h += card('<h2>' + esc(name) + '</h2><ul class="list">' + r.goals.map(g => '<li><span style="font-size:22px">🎯</span><span class="grow name">' + esc(g.text) + '</span><span class="muted no-grow">' + r.stars.filter(s => s.g === g.id).length + ' ⭐</span></li>').join('') + '</ul>' +
      '<div class="stars" aria-label="' + got + ' of ' + r.target + ' stars">' + Array.from({ length: r.target }, (_, i) => '<span class="' + (i < got ? 'on' : '') + '">' + (i < got ? '⭐' : '') + '</span>').join('') + '</div>' +
      '<p><b>' + got + ' of ' + r.target + '</b> stars' + (r.treat ? ' towards: <b>' + esc(r.treat) + '</b>' : '') + '</p>' +
      (full ? '<div class="ok" style="text-align:center;font-size:1.2em">🎉 You did it! Treat time' + (r.treat ? ': ' + esc(r.treat) : '') + '!</div><div class="row" style="margin-top:10px"><button data-a="rNew">Start a new chart (grown-up)</button></div>'
        : '<div class="row"><button data-a="addStar">⭐ Add a star (grown-up)</button></div>') +
      '<p class="muted" style="margin-top:10px">Stars are never taken away.' + (r.rounds.length ? ' Treats earned so far: ' + r.rounds.length + '.' : '') + '</p>' +
      '<button class="ghost" data-a="rEdit">Change goals or treat</button>');
    return h;
  };

  /* ---------- First / then ---------- */
  VIEWS.firstthen = function (k) {
    const f = k.ft;
    const slot = (w, s) => '<button class="slot' + (w === 'first' && f.firstDone ? ' done' : '') + (w === 'then' && f.firstDone ? ' now' : '') + (w === 'first' && !f.firstDone && f.first ? ' now' : '') + '" data-a="ftPick" data-v="' + w + '"><span class="lbl">' + (w === 'first' ? 'First' : 'Then') + '</span>' +
      (s ? '<b>' + esc(s[0]) + '</b>' + esc(s[1]) + (w === 'first' && f.firstDone ? ' ✓' : '') : '<b>➕</b><span class="muted">Tap to choose</span>') + '</button>';
    const words = f.first && f.then ? 'First ' + f.first[1] + ', then ' + f.then[1] : '';
    return backBtn('home', 'Home') + card('<div class="row"><h2 style="margin:0">First / then</h2><span class="no-grow">' + (words ? sayBtn(k, words) : '') + '</span></div>' +
      '<div class="ft" style="margin-top:10px">' + slot('first', f.first) + '<div class="arrow">➜</div>' + slot('then', f.then) + '</div>' +
      (f.firstDone && f.then ? '<p class="ok" style="margin-top:12px;text-align:center">Now: ' + esc(f.then[0] + ' ' + f.then[1]) + '</p>' : '') +
      '<div class="row" style="margin-top:12px">' + (f.first ? '<button class="light" data-a="ftDone">' + (f.firstDone ? 'Undo ✓' : '✓ First is done') + '</button>' : '') +
      (k.tools.timer ? '<button class="light" data-a="nav" data-v="timer">⏳ Timer</button>' : '') + '<button class="light" data-a="ftClear">Clear</button></div>');
  };
  function ftSheet(w) {
    sheet('<h2>' + (w === 'first' ? 'First…' : 'Then…') + '</h2><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(86px,1fr))">' +
      C.FT_PRESETS.map((p, i) => '<button class="pick" data-a="ftSet" data-v="' + i + '"><b>' + p[0] + '</b>' + esc(p[1]) + '</button>').join('') + '</div>' +
      '<label class="lab">Or type your own</label><div class="row"><input type="text" id="ftOwn" maxlength="40" placeholder="e.g. Visit Granny"><button class="no-grow" data-a="ftOwn">Use</button></div>');
    ST.ftPick = w;
  }

  /* ---------- Timer ---------- */
  function timerLeft() { return D.timer ? Math.max(0, D.timer.end - Date.now()) : 0; }
  function leftWords(ms) { if (ms <= 0) return 'Time\'s up'; if (ms < 60000) return Math.ceil(ms / 1000) + ' seconds'; const m = Math.ceil(ms / 60000); return m + (m === 1 ? ' minute' : ' minutes'); }
  function timerBanner() {
    const ms = timerLeft();
    return '<button class="opt" data-a="nav" data-v="timer" style="border-color:var(--brand)">⏳ <b id="tBan">' + esc(ms ? leftWords(ms) + ' until ' + D.timer.label : 'Time for: ' + D.timer.label) + '</b></button>';
  }
  VIEWS.timer = function (k) {
    let h = backBtn('home', 'Home');
    if (D.timer) {
      const ms = timerLeft();
      if (ms > 0) return h + card('<h2 id="tHead" style="text-align:center">' + esc(leftWords(ms)) + ' until ' + esc(D.timer.label) + '</h2>' +
        '<div class="pie" id="tPie"><div id="tTxt"></div></div><div class="row" style="margin-top:8px"><button class="light" data-a="tAdd">+1 minute</button><button class="light" data-a="tStop">Stop timer</button></div>' + sayBtn(k, leftWords(ms) + ' until ' + D.timer.label));
      return h + card('<div style="text-align:center"><div style="font-size:64px">⏰</div><h2>Time for: ' + esc(D.timer.label) + '</h2>' + sayBtn(k, 'Time for ' + D.timer.label) + '<div class="row" style="margin-top:10px"><button data-a="tStop">OK</button></div></div>');
    }
    const lab = ST.tLabel || C.TIMER_FOR[0];
    return h + card('<h2>Visual timer</h2><p class="muted">Shows how long is left, so the next thing isn\'t a surprise.</p><label class="lab">Until…</label>' +
      '<div class="chips">' + C.TIMER_FOR.map(t => '<button class="chip' + (lab === t ? ' on' : '') + '" data-a="tLabel" data-v="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div>' +
      '<input type="text" maxlength="40" data-f="s.tLabel" placeholder="Or type your own" value="' + (C.TIMER_FOR.includes(lab) ? '' : esc(lab)) + '">' +
      '<label class="lab">How long?</label><div class="grid" style="grid-template-columns:repeat(4,1fr)">' + [1, 2, 3, 5, 10, 15, 20, 30].map(m => '<button class="pick" data-a="tStart" data-v="' + m + '"><b style="font-size:22px">' + m + '</b>min</button>').join('') + '</div>' +
      '<p class="muted" style="margin-top:10px">Keep the app open: phones don\'t allow alarms from this app.</p>');
  };
  function timerPaint() {
    const pie = $('tPie'); if (!pie || !D.timer) return;
    const ms = timerLeft(), frac = D.timer.total ? ms / D.timer.total : 0;
    pie.style.background = 'conic-gradient(var(--brand2) ' + Math.round(frac * 360) + 'deg, var(--tint) 0)';
    $('tTxt').textContent = ms < 60000 ? Math.ceil(ms / 1000) + 's' : Math.ceil(ms / 60000) + ' min';
    const hd = $('tHead'); if (hd) hd.textContent = leftWords(ms) + ' until ' + D.timer.label;
  }
  setInterval(() => {
    if (!D.timer) return;
    const ms = timerLeft();
    if (ms <= 0 && !D.timer.rang) {
      D.timer.rang = true; save(); chime(); try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {}
      if (V === 'timer' || V === 'home') render();
      else toast('⏰ Time for: ' + D.timer.label);
      return;
    }
    if (V === 'timer') timerPaint();
    const b = $('tBan'); if (b) b.textContent = ms ? leftWords(ms) + ' until ' + D.timer.label : 'Time for: ' + D.timer.label;
  }, 1000);

  /* ---------- Today list ---------- */
  VIEWS.today = function (k) {
    const t = k.today;
    if (t.day !== today()) { t.day = today(); t.done = []; save(); }
    if (ST.tdEdit) return backBtn('today', 'Back') + card('<h2>Change the list</h2><p class="muted">Start from a ready-made list:</p><div class="row">' +
      Object.keys(C.TODAY_PRESETS).map(n => '<button class="light" data-a="tdPreset" data-v="' + esc(n) + '">' + esc(n) + '</button>').join('') + '</div>' +
      '<label class="lab">List name</label><input type="text" maxlength="30" data-f="k.today.name" value="' + esc(t.name) + '">' +
      '<ul class="list" style="margin-top:8px">' + t.items.map((it, i) => '<li><span style="font-size:24px">' + esc(it[0]) + '</span><span class="grow">' + esc(it[1]) + '</span><button class="small light" data-a="tdUp" data-v="' + i + '" aria-label="Move up">↑</button><button class="small light" data-a="tdDel" data-v="' + i + '">Remove</button></li>').join('') + '</ul>' +
      '<label class="lab">Add a step</label><div class="row"><input type="text" maxlength="40" data-f="s.tdNew" placeholder="e.g. Feed the cat"><button class="no-grow" data-a="tdAdd">Add</button></div>' +
      '<div class="row" style="margin-top:12px"><button data-a="tdEditDone">Done</button></div>');
    const all = t.items.length && t.done.length >= t.items.length;
    return backBtn('home', 'Home') + card('<div class="row"><h2 style="margin:0">' + esc(t.name || 'Today') + '</h2><span class="no-grow">' + sayBtn(k, t.items.map(i => i[1]).join('. ')) + '</span></div>' +
      (t.items.length ? t.items.map((it, i) => { const d = t.done.includes(i); return '<button class="opt' + (d ? ' open good' : '') + '" data-a="tdTick" data-v="' + i + '" style="font-size:1.05em' + (d ? ';opacity:.7' : '') + '">' + (d ? '✅' : '⬜') + ' ' + esc(it[0]) + ' ' + esc(it[1]) + '</button>'; }).join('') : '<p class="muted">No steps yet.</p>') +
      (all ? '<p class="ok" style="text-align:center;font-size:1.15em">🎉 All done!</p>' : '') +
      '<button class="ghost" data-a="tdEdit">✏️ Change the list</button>');
  };

  /* ---------- Coming up (stories for new or worrying things) ---------- */
  function sleeps(date) {
    if (!date) return '';
    const a = new Date(date + 'T12:00'), b = new Date(today() + 'T12:00'), n = Math.round((a - b) / 86400000);
    if (n < 0) return 'Done';
    if (n === 0) return 'Today!';
    if (n === 1) return 'Tomorrow (1 sleep)';
    return n + ' sleeps to go';
  }
  VIEWS.stories = function (k) {
    const list = k.stories.slice().sort((a, b) => (a.date || '9') < (b.date || '9') ? -1 : 1);
    const up = list.filter(s => sleeps(s.date) !== 'Done'), past = list.filter(s => sleeps(s.date) === 'Done');
    const row = s => '<li><span style="font-size:30px">' + esc(s.emoji || '📖') + '</span><div class="grow"><div class="name">' + esc(s.title) + '</div><div class="muted">' + esc(sleeps(s.date) || 'No date') + '</div></div><button class="small" data-a="storyOpen" data-v="' + s.id + '">Read</button></li>';
    return backBtn('home', 'Home') + card('<h2>Coming up</h2><p class="muted">Short stories about new or worrying things, so you know what to expect.</p>' +
      (up.length ? '<ul class="list">' + up.map(row).join('') + '</ul>' : '<p>Nothing coming up yet.</p>') +
      '<div class="row" style="margin-top:10px"><button class="light" data-a="storyNew">✏️ Write a story (grown-up)</button></div>') +
      (past.length ? card('<h2>Already happened</h2><ul class="list">' + past.map(row).join('') + '</ul>') : '');
  };
  VIEWS.story = function (k) {
    const s = k.stories.find(x => x.id === ST.story); if (!s) return VIEWS.stories(k);
    const n = ST.sstep || 0, last = n >= s.steps.length;
    const text = last ? 'The end. ' + (sleeps(s.date) && sleeps(s.date) !== 'Done' ? sleeps(s.date) + '.' : '') : s.steps[n];
    return backBtn('stories', 'Coming up') + card('<h2>' + esc((s.emoji || '📖') + ' ' + s.title) + '</h2>' + (s.date ? '<p class="muted">' + esc(new Date(s.date + 'T12:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })) + ' · ' + esc(sleeps(s.date)) + '</p>' : '') +
      '<div class="story-step">' + (last ? '🎉<br>' : '') + esc(text) + '</div><p class="muted" style="text-align:center">' + (last ? '' : 'Page ' + (n + 1) + ' of ' + s.steps.length) + '</p>' +
      '<div style="text-align:center">' + sayBtn(k, text) + '</div>' +
      '<div class="row" style="margin-top:10px"><button class="light" data-a="sPrev"' + (n ? '' : ' disabled') + '>‹ Back</button>' + (last ? '<button data-a="sPrev" data-v="restart">Read again</button>' : '<button data-a="sNext">Next ›</button>') + '</div>') +
      '<div class="row"><button class="ghost no-grow" data-a="storyEdit" data-v="' + s.id + '">✏️ Change (grown-up)</button></div>';
  };
  VIEWS.storyEdit = function () {
    const s = ST.se;
    return backBtn('stories', 'Cancel') + card('<h2>' + (s.id ? 'Change the story' : 'Write a story') + '</h2>' +
      '<p class="muted">Keep it short, true and calm. Say what will happen, what they\'ll see and hear, what they can do if it feels too much, and what comes after.</p>' +
      '<label class="lab">What is it?</label><input type="text" maxlength="60" data-f="s.se.title" value="' + esc(s.title) + '" placeholder="e.g. Going to the dentist">' +
      '<label class="lab">Picture</label><div class="chips">' + ['📖', '🦷', '🏫', '✈️', '🏥', '💇', '🎂', '🏠', '🚌', '🏊', '🐶', '👶'].map(e => '<button class="chip' + (s.emoji === e ? ' on' : '') + '" data-a="seEmoji" data-v="' + e + '">' + e + '</button>').join('') + '</div>' +
      '<label class="lab">When? (optional, for the countdown)</label><input type="date" data-f="s.se.date" value="' + esc(s.date || '') + '">' +
      '<label class="lab">The story: one page per line</label><textarea data-f="s.se.text" style="min-height:200px" placeholder="On Tuesday I am going to the dentist.&#10;The waiting room has chairs and magazines. It might be a bit noisy.&#10;The dentist will ask me to open my mouth wide and count my teeth.&#10;If it feels too much, I can hold up my hand and they will stop.&#10;After the dentist, we will go home and I can play my game.">' + esc(s.text) + '</textarea>' +
      '<div class="row" style="margin-top:12px">' + (s.id ? '<button class="light no-grow" data-a="storyDel">Delete</button>' : '') + '<button data-a="storySave">Save</button></div>');
  };

  /* ---------- What would you do? ---------- */
  VIEWS.scenarios = function (k) {
    const list = allScenarios(k);
    return backBtn('home', 'Home') + card('<h2>What would you do?</h2><p class="muted">Everyday moments. There are no wrong answers: tap each choice to see how other people might feel.</p><ul class="list">' +
      list.map(s => '<li><div class="grow"><div class="name">' + esc(s.title) + (s.mine ? ' <span class="tag">✏️ Ours</span>' : '') + '</div></div><button class="small light" data-a="scOpen" data-v="' + esc(s.id) + '">Open</button></li>').join('') + '</ul>' +
      '<div class="row" style="margin-top:10px"><button class="light" data-a="scNew">✏️ Write your own (grown-up)</button></div>');
  };
  VIEWS.scenario = function (k) {
    const list = allScenarios(k), i = list.findIndex(s => s.id === ST.sc), s = list[i]; if (!s) return VIEWS.scenarios(k);
    const open = ST.open || [];
    let h = '<div class="row"><h2 style="margin:0">' + esc(s.title) + '</h2><span class="no-grow">' + sayBtn(k, s.text) + '</span></div><p style="font-size:1.08em">' + esc(s.text) + '</p><p class="muted">What could you do? Tap each one.</p>';
    s.options.forEach((o, j) => {
      const on = open.includes(j);
      h += '<button class="opt' + (on ? ' open' + (o.good ? ' good' : '') : '') + '" data-a="scOpt" data-v="' + j + '">' + esc(o.t) + '</button>';
      if (on) h += '<div class="how' + (o.good ? ' good' : '') + '">' + (o.good ? '🌱 <b>Often goes well.</b> ' : '💭 ') + esc(o.how) + ' ' + sayBtn(k, o.how) + '</div>';
    });
    if (s.tip && open.length) h += '<p class="note" style="margin-top:10px">💡 ' + esc(s.tip) + '</p>';
    const next = list[(i + 1) % list.length];
    return backBtn('scenarios', 'All moments') + card(h) + '<div class="row">' + (s.mine ? '<button class="light" data-a="scEdit" data-v="' + esc(s.id) + '">✏️ Change (grown-up)</button>' : '') + '<button data-a="scOpen" data-v="' + esc(next.id) + '">Next one ›</button></div>';
  };
  VIEWS.scEdit = function () {
    const s = ST.se;
    return backBtn('scenarios', 'Cancel') + card('<h2>' + (s.id ? 'Change your moment' : 'Write your own moment') + '</h2><p class="muted">Use something that really happens, like a sibling\'s friend visiting, or a trip to the hairdresser. For each choice, say kindly how other people might feel.</p>' +
      '<label class="lab">Short title</label><input type="text" maxlength="60" data-f="s.se.title" value="' + esc(s.title) + '" placeholder="e.g. Granny\'s birthday">' +
      '<label class="lab">What happens</label><textarea maxlength="300" data-f="s.se.text">' + esc(s.text) + '</textarea>' +
      [0, 1, 2].map(i => '<h3>Choice ' + (i + 1) + (i === 2 ? ' (optional)' : '') + '</h3><input type="text" maxlength="120" data-f="s.se.o.' + i + '.t" value="' + esc(s.o[i].t) + '" placeholder="What they might do">' +
        '<textarea maxlength="300" style="margin-top:6px;min-height:60px" data-f="s.se.o.' + i + '.how" placeholder="How others might feel">' + esc(s.o[i].how) + '</textarea>' +
        '<label class="chk"><input type="checkbox" data-f="s.se.o.' + i + '.good"' + (s.o[i].good ? ' checked' : '') + '> Often goes well</label>').join('') +
      '<label class="lab">A helpful thought (optional)</label><input type="text" maxlength="200" data-f="s.se.tip" value="' + esc(s.tip) + '">' +
      '<div class="row" style="margin-top:12px">' + (s.id ? '<button class="light no-grow" data-a="scDel">Delete</button>' : '') + '<button data-a="scSave">Save</button></div>');
  };

  /* ---------- Hidden rules ---------- */
  VIEWS.rules = function (k) {
    return backBtn('home', 'Home') + card('<h2>' + esc(toolName(toolById('rules'), k)) + '</h2><p class="muted">Things lots of people expect without saying. You don\'t have to follow them all. It just helps to know they\'re there.</p>') +
      allRules(k).map(r => card('<h3 style="margin-top:0">' + esc(r.title) + (r.mine ? ' <span class="tag">✏️ Ours</span>' : '') + '</h3><p>' + esc(r.text) + '</p><div class="row">' + sayBtn(k, r.title + '. ' + r.text) + (r.mine ? '<button class="small light no-grow" data-a="ruleDel" data-v="' + esc(r.id) + '">Delete (grown-up)</button>' : '') + '</div>')).join('') +
      '<div class="row"><button class="light" data-a="ruleNew">✏️ Write your own (grown-up)</button></div>';
  };
  VIEWS.ruleEdit = function () {
    return backBtn('rules', 'Cancel') + card('<h2>Write a hidden rule</h2><label class="lab">Title</label><input type="text" maxlength="60" data-f="s.se.title" placeholder="e.g. At Granny\'s house">' +
      '<label class="lab">The rule, kindly explained</label><textarea maxlength="300" data-f="s.se.text" placeholder="e.g. Granny likes shoes off at the door. She feels happy when we remember."></textarea><div class="row" style="margin-top:12px"><button data-a="ruleSave">Save</button></div>');
  };

  /* ---------- Social battery ---------- */
  const cells = v => '<span class="cells' + (v <= 1 ? (v === 0 ? ' em' : ' lo') : '') + '">' + [0, 1, 2, 3].map(i => '<i class="' + (i < v ? 'f' : '') + '"></i>').join('') + '</span>';
  VIEWS.battery = function (k) {
    const last = k.battery[0], todayList = k.battery.filter(b => dkey(b.t) === today());
    const pick = ST.bat != null ? C.BATTERY.find(b => b.v === ST.bat) : null;
    return backBtn('home', 'Home') + card('<h2>Social battery</h2><p class="muted">How much energy is left for people and noise?</p><div class="battery">' +
      C.BATTERY.map(b => '<button class="' + (ST.bat === b.v ? 'on' : '') + '" data-a="bat" data-v="' + b.v + '">' + cells(b.v) + '<b>' + b.label + '</b></button>').join('') + '</div>' +
      (pick ? '<p class="ok" style="margin-top:12px">' + esc(pick.tip) + '</p>' + sayBtn(k, pick.tip) + (pick.v <= 2 ? '<h3>Ways to recharge</h3><div class="chips">' + C.RECHARGE.map(r => '<span class="chip">' + esc(r) + '</span>').join('') + '</div>' : '') : '') +
      (todayList.length ? '<p class="muted" style="margin-top:10px">Today: ' + todayList.slice().reverse().map(b => time(b.t) + ' ' + C.BATTERY.find(x => x.v === b.v).label).join(' · ') + '</p>' : (last ? '<p class="muted" style="margin-top:10px">Last time: ' + esc(day(last.t)) + ', ' + C.BATTERY.find(x => x.v === last.v).label + '</p>' : '')));
  };

  /* ---------- My wins ---------- */
  VIEWS.wins = function (k) {
    const wins = k.diary.filter(e => e.type === 'good' && !e.hideKid).slice(0, 60);
    return backBtn('home', 'Home') + card('<h2>🏆 My wins</h2><p class="muted">Good moments to remember. Grown-ups can add them too.</p><div class="row"><input type="text" maxlength="120" data-f="s.win" placeholder="Something that went well"><button class="no-grow" data-a="addWin">Add</button></div>') +
      (wins.length ? wins.map(e => card('<div class="row"><span class="no-grow" style="font-size:26px">⭐</span><div><div class="name"><b>' + esc([].concat(e.good || []).join(', ') || e.what || e.note) + '</b></div>' +
        ((e.good || []).length && (e.note || e.what) ? '<p>' + esc(e.note || e.what) + '</p>' : '') + '<p class="muted">' + esc(day(e.t)) + '</p></div></div>')).join('') : '<p class="muted">No wins saved yet. They\'ll show up here.</p>');
  };

  /* ---------- My notes (private) ---------- */
  VIEWS.notes = function (k) {
    return backBtn('home', 'Home') + card('<h2>📓 My notes</h2><p class="muted">Just for you. They aren\'t shown in the grown-ups\' area or in any summary. (Anyone who opens this screen on this phone could read them, though.)</p>' +
      '<textarea data-f="s.note" maxlength="2000" placeholder="Write anything…"></textarea><div class="row" style="margin-top:8px"><button data-a="addNote">Save note</button></div>') +
      k.notes.map((n, i) => card('<p class="muted">' + esc(day(n.t) + ', ' + time(n.t)) + '</p><p class="entry"><span class="what">' + esc(n.text) + '</span></p><button class="small light" data-a="delNote" data-v="' + i + '">Delete</button>')).join('');
  };

  /* ---------- All about me (passport) ---------- */
  const PASS = [['likes', 'Things I love'], ['helps', 'What helps me'], ['upsets', 'What I find hard or upsetting'], ['overwhelm', 'How you can tell it\'s getting too much'], ['talk', 'How I communicate, and how to talk to me']];
  const PASS_HINT = { likes: 'e.g. dinosaurs, Minecraft, swimming, my dog Biscuit', helps: 'e.g. warnings before changes, a quiet corner, my headphones, clear short instructions', upsets: 'e.g. surprise changes, loud hand dryers, being touched without warning', overwhelm: 'e.g. I go quiet, cover my ears, repeat words, pace about', talk: 'e.g. I may not look at you but I am listening. Give me time to answer. Say exactly what you mean.' };
  VIEWS.passport = function (k) {
    const p = k.passport;
    if (ST.pEdit) return card('<h2>✏️ All about ' + esc(k.name) + '</h2><p class="muted">Fill this in together if you can. Write it as "I", in their words.</p>' +
      PASS.map(([id, l]) => '<label class="lab">' + esc(l) + '</label><textarea maxlength="600" data-f="k.passport.' + id + '" placeholder="' + esc(PASS_HINT[id]) + '">' + esc(p[id]) + '</textarea>').join('') +
      '<h3>My senses</h3>' + C.SENSES.map(([id, e, l]) => '<label class="lab">' + e + ' ' + esc(l) + '</label><div class="row"><select data-f="k.passport.sense.' + id + '" class="no-grow" style="width:auto">' + C.SENSE_LEVELS.map(([v, t]) => '<option value="' + v + '"' + ((p.sense[id] || '') === v ? ' selected' : '') + '>' + t + '</option>').join('') + '</select>' +
        '<input type="text" maxlength="120" data-f="k.passport.senseNote.' + id + '" value="' + esc(p.senseNote[id] || '') + '" placeholder="Notes"></div>').join('') +
      '<label class="chk" style="margin-top:14px"><input type="checkbox" data-f="k.passport.showPlan"' + (p.showPlan ? ' checked' : '') + '> Include "When it gets too much" (the calm plan from the grown-ups\' area)</label>' +
      '<div class="row" style="margin-top:12px"><button data-a="pDone">Done</button></div>');
    const filled = PASS.some(([id]) => p[id].trim()) || Object.values(p.sense).some(Boolean);
    let h = card(passportHtml(k, true) + (filled ? '' : '<p class="muted">Nothing filled in yet.</p>') + '<div class="row" style="margin-top:12px"><button data-a="pEdit">✏️ Fill in / change</button></div>');
    if (filled) h += card('<h2>Share it</h2><p class="muted">For teachers, childminders, grandparents, clubs or a new doctor.</p><div class="row"><button class="light" data-a="pQR">📱 QR code</button><button class="light" data-a="pShare">📤 Send as text</button><button class="light" data-a="pPrint">🖨️ Print</button></div>');
    return h;
  };
  function passportHtml(k, onScreen) {
    const p = k.passport;
    let h = '<h2>' + esc(k.emoji) + ' All about ' + esc(k.name) + '</h2>';
    PASS.forEach(([id, l]) => { if (p[id].trim()) h += '<h3>' + esc(l) + '</h3><p style="white-space:pre-wrap">' + esc(p[id]) + '</p>'; });
    const ss = C.SENSES.filter(([id]) => p.sense[id] || (p.senseNote[id] || '').trim());
    if (ss.length) h += '<h3>My senses</h3><ul class="list">' + ss.map(([id, e, l]) => '<li><span>' + e + '</span><div class="grow"><b>' + esc(l) + ':</b> ' + esc((C.SENSE_LEVELS.find(x => x[0] === p.sense[id]) || ['', ''])[1]) + (p.senseNote[id] ? (p.sense[id] ? '. ' : '') + esc(p.senseNote[id]) : '') + '</div></li>').join('') + '</ul>';
    if (p.showPlan && k.plan.length) h += '<h3>When it gets too much</h3><ol>' + k.plan.map(s => '<li>' + esc(s) + '</li>').join('') + '</ol>';
    if (!onScreen) h += '<p class="muted" style="margin-top:10px">Made with Our Compass, ' + esc(new Date().toLocaleDateString()) + '.</p>';
    return h;
  }
  function passportText(k) {
    const p = k.passport, L = ['All about ' + k.name, ''];
    PASS.forEach(([id, l]) => { if (p[id].trim()) L.push(l + ':', p[id].trim(), ''); });
    const ss = C.SENSES.filter(([id]) => p.sense[id] || (p.senseNote[id] || '').trim());
    if (ss.length) { L.push('My senses:'); ss.forEach(([id, , l]) => L.push('- ' + l + ': ' + [(C.SENSE_LEVELS.find(x => x[0] === p.sense[id]) || ['', ''])[1], p.senseNote[id]].filter(Boolean).join('. '))); L.push(''); }
    if (p.showPlan && k.plan.length) { L.push('When it gets too much:'); k.plan.forEach((s, i) => L.push((i + 1) + '. ' + s)); }
    return L.join('\n').trim();
  }
  // The QR holds the passport itself, packed into the link after "#". The part after # never leaves the phone that scans it.
  async function passportLink(k) {
    const p = k.passport;
    const data = { n: k.name, e: k.emoji, l: p.likes, h: p.helps, u: p.upsets, o: p.overwhelm, c: p.talk,
      s: C.SENSES.filter(([id]) => p.sense[id] || p.senseNote[id]).map(([id]) => [id, p.sense[id] || '', p.senseNote[id] || '']),
      p: p.showPlan ? k.plan : [] };
    const json = JSON.stringify(data);
    let packed = 'u' + b64url(new TextEncoder().encode(json));
    if (window.CompressionStream) {
      try {
        const buf = await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer();
        packed = 'z' + b64url(new Uint8Array(buf));
      } catch (e) {}
    }
    return new URL('passport.html', location.href).href.split('#')[0] + '#' + packed;
  }
  function b64url(bytes) { let s = ''; bytes.forEach(b => { s += String.fromCharCode(b); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }

  /* ---------- "When it gets too much" calm card (no lock: it's needed fast) ---------- */
  function crisis(k) {
    const steps = k.plan.length ? k.plan : C.PLAN_STEPS, n = Math.min(ST.cstep || 0, steps.length - 1);
    layer.innerHTML = '<div class="crisis"><div class="row"><span class="muted no-grow" style="color:#b9c4c9">Step ' + (n + 1) + ' of ' + steps.length + '</span><button class="light no-grow" data-a="crisisClose" style="margin-left:auto">Close</button></div>' +
      '<div class="step">' + esc(steps[n]) + '</div><p style="text-align:center;color:#b9c4c9">Breathe slowly yourself too.</p>' +
      '<div class="row"><button class="light" data-a="cStep" data-v="-1"' + (n ? '' : ' disabled') + '>‹ Back</button><button data-a="cStep" data-v="1" style="background:#5b7d8a"' + (n >= steps.length - 1 ? ' disabled' : '') + '>Next ›</button></div></div>';
  }

  /* ---------- Grown-ups' lock screen ---------- */
  VIEWS.lock = function () {
    const [a, b] = ST.sum || [7, 6];
    return card('<h2>🔒 Grown-ups only</h2><p>To open, answer: <b style="font-size:1.3em">' + a + ' × ' + b + '</b></p>' +
      '<form id="lockForm" class="row" autocomplete="off"><input id="lockIn" type="text" inputmode="numeric" maxlength="3" aria-label="Answer"><button class="no-grow" type="submit">Open</button></form><p id="lockMsg" class="muted" role="status"></p>' +
      '<p class="muted">Not a password: just enough to stop little fingers.</p>') +
      '<div class="row"><button class="light" data-a="crisis">🆘 It\'s too much right now</button><button class="light" data-a="nav" data-v="home">Back to ' + esc(K().name) + '\'s side</button></div>';
  };

  /* ---------- Grown-ups' area ---------- */
  const PTABS = [['diary', '📝 Diary'], ['patterns', '🔍 Patterns'], ['summary', '📄 Summary'], ['plan', '🆘 Too-much plan'], ['settings', '⚙️ Settings']];
  VIEWS.grown = function (k) {
    if (!unlocked()) { setTimeout(() => requireGrown(() => go('grown', true)), 0); return ''; }
    const t = ST.ptab || 'diary';
    return '<div class="row" style="margin-bottom:10px"><b class="no-grow">👪 Grown-ups: ' + esc(k.emoji + ' ' + k.name) + '</b><span></span><button class="small light no-grow" data-a="crisis">🆘 Too much now</button><button class="small light no-grow" data-a="lockNow" aria-label="Lock">🔒</button></div>' +
      '<div class="tabs" role="tablist">' + PTABS.map(([id, l]) => '<button role="tab" aria-selected="' + (t === id) + '" class="' + (t === id ? 'on' : '') + '" data-a="ptab" data-v="' + id + '">' + l + '</button>').join('') + '</div>' +
      ({ diary: gDiary, patterns: gPatterns, summary: gSummary, plan: gPlan, settings: gSettings }[t])(k);
  };

  /* Diary */
  const tickEmoji = id => (C.TICKS.find(t => t[0] === id) || ['', ''])[1];
  function gDiary(k) {
    const f = ST.filter || 'all';
    const list = k.diary.filter(e => f === 'all' || e.type === f).slice(0, 150);
    return card('<h2>Diary</h2><p class="muted">Jot down tricky moments and good ones. A few words is plenty. Patterns show up after a week or two.</p>' +
      '<div class="row"><button data-a="dNew" data-v="tricky">🌧️ Tricky moment</button><button data-a="dNew" data-v="good" style="background:var(--good)">⭐ Good moment</button></div>') +
      card('<div class="chips">' + [['all', 'All'], ['tricky', 'Tricky'], ['good', 'Good']].map(([v, l]) => '<button class="chip' + (f === v ? ' on' : '') + '" data-a="dFilter" data-v="' + v + '">' + l + '</button>').join('') + '</div>' +
        (list.length ? '<ul class="list">' + list.map(e => '<li class="entry"><span style="font-size:24px">' + (e.type === 'good' ? '⭐' : '🌧️') + '</span><div class="grow">' +
          '<div class="muted">' + esc(day(e.t) + ', ' + time(e.t)) + (e.size ? ' · ' + esc(e.size) : '') + ' ' + (e.ticks || []).map(tickEmoji).join(' ') + (e.by === 'child' ? ' · added by ' + esc(k.name) : '') + '</div>' +
          (e.type === 'tricky' ? ((e.before || []).length || e.beforeNote ? '<div><b>Before:</b> ' + esc([].concat(e.before || [], e.beforeNote ? [e.beforeNote] : []).join(', ')) + '</div>' : '') + (e.what ? '<div class="what"><b>What happened:</b> ' + esc(e.what) + '</div>' : '') +
            ((e.helped || []).length || e.after ? '<div><b>After / what helped:</b> ' + esc([].concat(e.helped || [], e.after ? [e.after] : []).join(', ')) + '</div>' : '')
            : '<div><b>' + esc([].concat(e.good || []).join(', ')) + '</b>' + (e.note || e.what ? ' ' + esc(e.note || e.what) : '') + '</div>') +
          '</div><button class="small light" data-a="dDel" data-v="' + e.id + '" aria-label="Delete">🗑️</button></li>').join('') + '</ul>' : '<p class="muted">Nothing here yet.</p>'));
  }
  VIEWS.diaryForm = function (k) {
    const F = ST.F; if (!F) return VIEWS.grown(k);
    const tricky = F.type === 'tricky';
    let h = '<h2>' + (tricky ? '🌧️ Tricky moment' : '⭐ Good moment') + '</h2>' +
      '<label class="lab">When</label><input type="datetime-local" data-f="f.when" value="' + esc(F.when) + '">';
    if (tricky) {
      h += '<label class="lab">Before: what was going on?</label>' + chipList(C.BEFORE, F.before, 'fChip', ' data-k="before"') + '<input type="text" maxlength="200" data-f="f.beforeNote" value="' + esc(F.beforeNote) + '" placeholder="Anything else (optional)">' +
        '<label class="lab">What happened</label><textarea maxlength="800" data-f="f.what" placeholder="A few words is fine">' + esc(F.what) + '</textarea>' +
        '<label class="lab">How big was it?</label><div class="chips">' + C.SIZES.map(([v, l]) => '<button class="chip' + (F.size === v ? ' on' : '') + '" data-a="fSize" data-v="' + v + '">' + l + '</button>').join('') + '</div>' +
        '<label class="lab">After: what helped?</label>' + chipList(C.HELPED, F.helped, 'fChip', ' data-k="helped"') + '<input type="text" maxlength="300" data-f="f.after" value="' + esc(F.after) + '" placeholder="What happened after (optional)">';
    } else {
      h += '<label class="lab">What went well?</label>' + chipList(C.GOOD, F.good, 'fChip', ' data-k="good"') + '<textarea maxlength="600" data-f="f.note" placeholder="Tell it in your own words (optional)">' + esc(F.note) + '</textarea>' +
        '<label class="chk"><input type="checkbox" data-f="f.showKid"' + (F.showKid ? ' checked' : '') + '> Show it in ' + esc(k.name) + '\'s "My wins"</label>';
    }
    h += '<label class="lab">Anything else today?</label><div class="chips">' + C.TICKS.map(([id, e, l]) => '<button class="chip' + (F.ticks.includes(id) ? ' on' : '') + '" data-a="fTick" data-v="' + id + '">' + e + ' ' + esc(l) + '</button>').join('') + '</div>' +
      '<div class="row" style="margin-top:14px"><button class="light no-grow" data-a="nav" data-v="grown">Cancel</button><button data-a="dSave">Save</button></div>';
    return card(h);
  };

  /* Patterns: things that happened together, not causes */
  const BUCKETS = [[6, 9, 'early morning (6 to 9am)'], [9, 12, 'morning (9am to 12)'], [12, 15, 'early afternoon (12 to 3pm)'], [15, 18, 'late afternoon (3 to 6pm)'], [18, 21, 'evening (6 to 9pm)'], [21, 30, 'night (after 9pm)']];
  const bucketOf = h => BUCKETS.findIndex(b => (h < 6 ? h + 24 : h) >= b[0] && (h < 6 ? h + 24 : h) < b[1]);
  const isWeekday = t => { const d = new Date(t).getDay(); return d > 0 && d < 6; };
  const times = r => (Math.round(r * 10) / 10).toString().replace(/\.0$/, '');
  function findPatterns(k) {
    const tricky = k.diary.filter(e => e.type === 'tricky'), good = k.diary.filter(e => e.type === 'good');
    const out = { lines: [], few: tricky.length < 4, tricky: tricky.length, good: good.length };
    // Day by day
    const days = {};
    const dayOf = t => { const key = dkey(t); return days[key] = days[key] || { t, tricky: 0, ticks: new Set(), diary: 0 }; };
    k.diary.forEach(e => { const d = dayOf(e.t); d.diary++; if (e.type === 'tricky') d.tricky++; (e.ticks || []).forEach(x => { if (x !== 'hungry') d.ticks.add(x); }); });
    k.checkins.forEach(c => dayOf(c.t)); k.battery.forEach(b => dayOf(b.t));
    const all = Object.values(days);
    all.forEach(d => { if (!d.diary && isWeekday(d.t)) d.ticks.add('school'); });
    if (!out.few) {
      const PH = { sleep: 'after a bad night\'s sleep', bigday: 'with a big day (trip, visitors, change of plan)', unwell: 'when unwell', school: 'on school days' };
      for (const id of ['sleep', 'bigday', 'unwell', 'school']) {
        const yes = all.filter(d => d.ticks.has(id)), no = all.filter(d => !d.ticks.has(id));
        if (yes.length < 2 || no.length < 2) continue;
        const ny = yes.reduce((s, d) => s + d.tricky, 0), nn = no.reduce((s, d) => s + d.tricky, 0);
        const ry = ny / yes.length, rn = nn / no.length;
        if (ny >= 3 && ry >= rn * 1.5) out.lines.push(rn > 0 ? 'About <b>' + times(ry / rn) + '× more</b> tricky moments ' + PH[id] + ' (' + times(ry) + ' a day, compared with ' + times(rn) + ').' : 'So far, every tricky moment has been ' + PH[id] + ' (' + ny + ' of ' + ny + ').');
        else if (id === 'school' && nn >= 3 && rn >= ry * 1.5) out.lines.push('About <b>' + times(ry > 0 ? rn / ry : rn) + '× more</b> tricky moments on days without school (weekends and holidays).');
      }
      const hungry = tricky.filter(e => (e.ticks || []).includes('hungry')).length;
      if (hungry >= 2 && hungry / tricky.length >= 0.25) out.lines.push('<b>' + hungry + ' of ' + tricky.length + '</b> tricky moments happened when hungry.');
      // Time of day
      const bc = BUCKETS.map(() => []);
      tricky.forEach(e => { const b = bucketOf(new Date(e.t).getHours()); if (b >= 0) bc[b].push(e); });
      const top = bc.map((l, i) => [i, l]).sort((a, b) => b[1].length - a[1].length)[0];
      if (top && top[1].length >= 3 && top[1].length / tricky.length >= 0.4) {
        const hrs = top[1].map(e => new Date(e.t).getHours() + new Date(e.t).getMinutes() / 60).sort((a, b) => a - b), mid = Math.round(hrs[Math.floor(hrs.length / 2)]) % 24;
        const sch = top[1].filter(e => (e.ticks || []).includes('school')).length;
        out.lines.push('Mostly ' + (sch / top[1].length >= 0.7 ? 'on <b>school days</b>, ' : '') + 'in the <b>' + BUCKETS[top[0]][2] + '</b>, around ' + hourName(mid) + ' (' + top[1].length + ' of ' + tricky.length + ').');
      }
      if (tricky.length >= 7) {
        const wd = [0, 0, 0, 0, 0, 0, 0]; tricky.forEach(e => wd[new Date(e.t).getDay()]++);
        const m = Math.max(...wd), i = wd.indexOf(m);
        if (m >= 3 && m / tricky.length >= 0.3) out.lines.push('<b>' + new Date(2024, 0, 7 + i).toLocaleDateString(undefined, { weekday: 'long' }) + 's</b> come up most (' + m + ' of ' + tricky.length + ').');
      }
      const now = Date.now(), d14 = 14 * 86400000;
      const fourWeeks = k.diary.some(e => now - e.t >= 2 * d14);
      const a = tricky.filter(e => now - e.t < d14).length, b = tricky.filter(e => now - e.t >= d14 && now - e.t < 2 * d14).length;
      if (!fourWeeks) { /* not enough history to compare fortnights */ }
      else if (a + b >= 5 && b && a <= b * 0.66) out.lines.push('Fewer tricky moments in the last 2 weeks (' + a + ') than the 2 weeks before (' + b + '). 🌱');
      else if (a + b >= 5 && a >= Math.max(b, 1) * 1.5) out.lines.push('More tricky moments in the last 2 weeks (' + a + ') than the 2 weeks before (' + b + '). Worth thinking about what has changed.');
    }
    const count = (list, key) => { const c = {}; list.forEach(e => (e[key] || []).forEach(x => { c[x] = (c[x] || 0) + 1; })); return Object.entries(c).filter(x => x[1] >= 2).sort((a, b) => b[1] - a[1]).slice(0, 4); };
    out.before = count(tricky, 'before'); out.helped = count(tricky, 'helped'); out.goods = count(good, 'good');
    // Check-ins and battery, last 30 days
    const month = Date.now() - 30 * 86400000;
    out.ci = {}; C.COLOURS.forEach(c => { out.ci[c.id] = 0; });
    k.checkins.filter(c => c.t > month).forEach(c => { out.ci[c.c] = (out.ci[c.c] || 0) + 1; });
    out.ciTotal = Object.values(out.ci).reduce((s, n) => s + n, 0);
    const reds = k.checkins.filter(c => c.t > month && c.c === 'red');
    if (reds.length >= 3) {
      const bc = BUCKETS.map(() => 0); reds.forEach(c => { const b = bucketOf(new Date(c.t).getHours()); if (b >= 0) bc[b]++; });
      const m = Math.max(...bc); if (m / reds.length >= 0.4) out.redWhen = 'Red ("too much") check-ins are most often in the ' + BUCKETS[bc.indexOf(m)][2] + ' (' + m + ' of ' + reds.length + ').';
    }
    const bat = k.battery.filter(b => b.t > month);
    if (bat.length >= 4) {
      const s = BUCKETS.map(() => [0, 0]); bat.forEach(b => { const i = bucketOf(new Date(b.t).getHours()); if (i >= 0) { s[i][0] += b.v; s[i][1]++; } });
      const avg = s.map((x, i) => [i, x[1] ? x[0] / x[1] : 9, x[1]]).filter(x => x[2] >= 2).sort((a, b) => a[1] - b[1]);
      if (avg.length >= 2 && avg[0][1] < avg[avg.length - 1][1]) out.batWhen = 'Social battery is usually lowest in the ' + BUCKETS[avg[0][0]][2] + '.';
    }
    return out;
  }
  function patternsHtml(k, forPrint) {
    const p = findPatterns(k);
    let h = '';
    if (p.few) h += '<p class="muted">After 4 or more tricky moments in the diary, patterns will show here. Adding good moments and check-ins makes them more accurate.</p>';
    else if (p.lines.length) h += '<ul>' + p.lines.map(l => '<li>' + l + '</li>').join('') + '</ul>';
    else h += '<p class="muted">No clear patterns yet. Keep going: it often takes a few weeks.</p>';
    if (p.before.length) h += '<h3>Often going on before</h3><p>' + p.before.map(([x, n]) => esc(x) + ' (' + n + ')').join(', ') + '</p>';
    if (p.helped.length) h += '<h3>What seemed to help</h3><p>' + p.helped.map(([x, n]) => esc(x) + ' (' + n + ')').join(', ') + '</p>';
    if (p.ciTotal) {
      h += '<h3>Check-ins, last 30 days (' + p.ciTotal + ')</h3><div class="stack">' + C.COLOURS.map(c => p.ci[c.id] ? '<i style="background:' + c.hex + ';width:' + (100 * p.ci[c.id] / p.ciTotal) + '%"></i>' : '').join('') + '</div>' +
        '<p class="muted">' + C.COLOURS.map(c => c.name + ' ' + p.ci[c.id]).join(' · ') + '</p>';
      if (p.redWhen) h += '<p>' + esc(p.redWhen) + '</p>';
    }
    if (p.batWhen) h += '<p>🔋 ' + esc(p.batWhen) + '</p>';
    if (p.good) h += '<h3>Good moments</h3><p>' + p.good + ' saved' + (p.goods.length ? ': ' + p.goods.map(([x, n]) => esc(x) + ' (' + n + ')').join(', ') : '') + '.</p>';
    if (!forPrint) h += '<p class="note" style="margin-top:10px">These are things that happened together, not proof of what causes what. They\'re useful to talk through with a professional.</p>';
    return h;
  }
  function gPatterns(k) { return card('<h2>🔍 Patterns for ' + esc(k.name) + '</h2>' + patternsHtml(k)); }

  /* Summary to print or share */
  function summaryHtml(k, o) {
    const since = o.days ? Date.now() - o.days * 86400000 : 0;
    const tricky = k.diary.filter(e => e.type === 'tricky' && e.t >= since), good = k.diary.filter(e => e.type === 'good' && e.t >= since);
    let h = '<div class="card"><h2>Summary for ' + esc(k.name) + '</h2><p class="muted">Age group: ' + esc(C.AGES[k.age].label + ' (' + C.AGES[k.age].sub + ')') + ' · ' + (o.days ? 'Last ' + o.days + ' days' : 'Everything saved') + ' · Made ' + esc(new Date().toLocaleDateString()) + '</p>';
    if (D.pro.trim()) h += '<p><b>Prepared for:</b> ' + esc(D.pro.trim()) + '</p>';
    h += '<p class="muted">Written by a parent or carer from their own notes, using Our Compass. Not a medical record.</p>';
    h += '<h3>At a glance</h3><p>' + tricky.length + ' tricky moments and ' + good.length + ' good moments noted.' + (k.hard.length ? ' Hardest right now: ' + esc(k.hard.map(id => (C.HARD.find(x => x[0] === id) || ['', id])[1]).join(', ')) + '.' : '') + '</p>';
    h += '<h3>Patterns</h3>' + patternsHtml(k, true);
    if (o.diary && tricky.length) h += '<h3>Recent tricky moments</h3><ul>' + tricky.slice(0, 15).map(e => '<li><b>' + esc(day(e.t) + ', ' + time(e.t)) + '</b>' + (e.size ? ' (' + esc(e.size) + ')' : '') +
      ((e.before || []).length || e.beforeNote ? '. Before: ' + esc([].concat(e.before || [], e.beforeNote ? [e.beforeNote] : []).join(', ')) : '') + (e.what ? '. What happened: ' + esc(e.what) : '') +
      ((e.helped || []).length || e.after ? '. After: ' + esc([].concat(e.helped || [], e.after ? [e.after] : []).join(', ')) : '') + ((e.ticks || []).length ? '. Also: ' + esc(e.ticks.map(t => (C.TICKS.find(x => x[0] === t) || ['', '', t])[2]).join(', ')) : '') + '</li>').join('') + '</ul>';
    if (o.diary && good.length) h += '<h3>Recent good moments</h3><ul>' + good.slice(0, 10).map(e => '<li><b>' + esc(day(e.t)) + '</b>: ' + esc([].concat(e.good || [], e.note || e.what ? [e.note || e.what] : []).join('. ')) + '</li>').join('') + '</ul>';
    if (o.passport) h += '<div style="margin-top:14px">' + passportHtml(Object.assign({}, k, { passport: Object.assign({}, k.passport, { showPlan: o.plan }) }), true).replace('<h2>', '<h3 style="font-size:1.1em">').replace('</h2>', '</h3>') + '</div>';
    else if (o.plan) h += '<h3>When it gets too much</h3><ol>' + k.plan.map(s => '<li>' + esc(s) + '</li>').join('') + '</ol>';
    return h + '</div>';
  }
  function summaryText(k, o) {
    const el = document.createElement('div'); el.innerHTML = summaryHtml(k, o).replace(/<\/(h2|h3|p|li|div)>/g, '\n').replace(/<li>/g, '- ').replace(/<br>/g, '\n');
    return el.textContent.replace(/\n{3,}/g, '\n\n').trim();
  }
  function gSummary(k) {
    const o = ST.sum2 = ST.sum2 || { days: 30, diary: true, passport: true, plan: true };
    return card('<h2>📄 Summary for a doctor, therapist or school</h2><p class="muted">Choose what to include. ' + (D.pro.trim() ? 'Shows "Prepared for: ' + esc(D.pro.trim()) + '".' : 'You can add a professional\'s name in Settings.') + ' ' + esc(k.name) + '\'s private notes are never included.</p>' +
      '<div class="chips">' + [[30, 'Last 30 days'], [90, 'Last 3 months'], [0, 'Everything']].map(([v, l]) => '<button class="chip' + (o.days === v ? ' on' : '') + '" data-a="sumDays" data-v="' + v + '">' + l + '</button>').join('') + '</div>' +
      [['diary', 'Diary entries'], ['passport', 'All about me'], ['plan', 'When it gets too much plan']].map(([id, l]) => '<label class="chk"><input type="checkbox" data-f="s.sum2.' + id + '" data-rr' + (o[id] ? ' checked' : '') + '> ' + l + '</label>').join('') +
      '<div class="row" style="margin-top:10px"><button data-a="sumPrint">🖨️ Print / save PDF</button><button class="light" data-a="sumShare">📤 Share as text</button></div>') +
      summaryHtml(k, o);
  }

  /* Too-much plan */
  function gPlan(k) {
    return card('<h2>🆘 When it gets too much</h2><p class="muted">A calm, step-by-step card to follow during a meltdown, one step at a time. It\'s also on the lock screen, so nobody needs to do a sum in a hurry. Change the steps to fit ' + esc(k.name) + ': one step per line.</p>' +
      '<textarea data-f="kl.plan" style="min-height:230px">' + esc(k.plan.join('\n')) + '</textarea>' +
      '<div class="row" style="margin-top:10px"><button data-a="crisis">Show the calm card</button><button class="light" data-a="planReset">Use the suggested steps</button></div>' +
      '<p class="muted" style="margin-top:8px">It\'s shared in "All about me" too, if you leave that switched on.</p>');
  }

  /* Settings */
  function gSettings(k) {
    let h = card('<h2>Children</h2><ul class="list">' + D.kids.map(x => '<li><span style="font-size:28px">' + esc(x.emoji) + '</span><div class="grow"><div class="name">' + esc(x.name) + '</div><div class="muted">' + esc(C.AGES[x.age].label) + '</div></div>' +
      (x.id === k.id ? '<span class="tag no-grow">Showing now</span>' : '<button class="small light" data-a="switchKid" data-v="' + x.id + '">Switch</button>') + '</li>').join('') + '</ul>' +
      '<div class="row" style="margin-top:8px"><button class="light" data-a="addKid">+ Add a child</button></div>');
    h += card('<h2>' + esc(k.name) + '</h2><label class="lab">Name</label><input type="text" maxlength="24" data-f="k.name" value="' + esc(k.name) + '">' +
      '<label class="lab">Picture</label><div class="chips">' + C.EMOJIS.map(e => '<button class="chip' + (k.emoji === e ? ' on' : '') + '" data-a="kEmoji" data-v="' + e + '">' + e + '</button>').join('') + '</div>' +
      '<label class="lab">Age group</label><div class="chips">' + Object.entries(C.AGES).map(([id, a]) => '<button class="chip' + (k.age === id ? ' on' : '') + '" data-a="kAge" data-v="' + id + '">' + a.label + ' (' + a.sub + ')</button>').join('') + '</div>' +
      '<label class="lab">Theme</label><div class="chips">' + Object.entries(C.THEMES).map(([id, t]) => '<button class="chip' + (k.theme === id ? ' on' : '') + '" data-a="kTheme" data-v="' + id + '">' + t.emoji + ' ' + t.label + '</button>').join('') + '</div>' +
      '<label class="lab">What\'s hardest right now?</label><div class="chips">' + C.HARD.map(x => '<button class="chip' + (k.hard.includes(x[0]) ? ' on' : '') + '" data-a="kHard" data-v="' + x[0] + '">' + esc(x[1]) + '</button>').join('') + '</div>' +
      '<h3>Look and sound</h3>' + lookSwitches(k, 'k.'));
    h += card('<h2>Tools</h2><p class="muted">Switch off anything that isn\'t useful right now. Nothing is deleted.</p>' +
      C.TOOLS.map(t => sw(t.emoji + ' ' + toolName(t, k), 'k.tools.' + t.id, k.tools[t.id], t.desc)).join('') +
      '<div class="row" style="margin-top:8px"><button class="light" data-a="toolsDefault">Use the usual tools for this age</button></div>');
    h += card('<h2>Calm ideas for each colour</h2><p class="muted">Shown after a check-in. Choose them together: one idea per line.</p>' +
      C.COLOURS.map(c => '<label class="lab" style="color:' + c.hex + '">' + c.name + ': ' + c.word + '</label><textarea data-f="kl.calm.' + c.id + '">' + esc(k.calm[c.id].join('\n')) + '</textarea>').join(''));
    h += card('<h2>Family</h2><label class="lab">Professional\'s name (optional)</label><p class="muted">Only shown on the printed or shared summary.</p><input type="text" maxlength="60" data-f="d.pro" value="' + esc(D.pro) + '" placeholder="e.g. Dr Byrne, CAMHS">');
    h += card('<h2>💾 Backup, and sharing with another parent or carer</h2><p class="muted">Everything lives only on this phone. Save a backup now and then. To share with another parent or carer, send them the backup file and they load it in Our Compass on their phone. (The website and the Android app keep separate copies.)</p>' +
      '<div class="row"><button class="light" data-a="backup">Save backup</button><button class="light" data-a="restore">Load backup</button></div><input type="file" id="restoreIn" accept=".json,application/json" class="hidden"><p id="backupMsg" class="muted" role="status"></p>');
    h += card('<h2>💬 Is this useful?</h2><p class="muted">Tell the maker what helps, what doesn\'t, or what\'s missing. Please don\'t include your child\'s name.</p><button class="light" data-a="feedback">Send feedback</button>');
    h += card('<h2>About</h2>' + disclaimer + '<p><a href="privacy.html">Privacy: everything stays on this phone</a></p>' +
      '<div class="row" style="margin-top:10px"><button class="light" data-a="lockNow">🔒 Lock the grown-ups\' area</button><button class="light" data-a="delKid" style="color:#a2453d">Remove ' + esc(k.name) + '</button></div>');
    return h + logo;
  }

  /* =====================================================================
     ACTIONS
     ===================================================================== */
  const ACT = {
    nav: v => { if (v === 'grown') return requireGrown(() => go('grown')); if (v === 'passport') used('passport'); go(v); },
    kids: () => {
      sheet('<h2>Who\'s using it?</h2><ul class="list">' + D.kids.map(x => '<li><span style="font-size:30px">' + esc(x.emoji) + '</span><span class="grow name">' + esc(x.name) + '</span>' + (x.id === D.cur ? '<span class="tag">Now</span>' : '<button class="small" data-a="switchKid" data-v="' + x.id + '">Switch</button>') + '</li>').join('') + '</ul>' +
        '<div class="row" style="margin-top:10px"><button class="light" data-a="addKid">+ Add a child (grown-up)</button></div>');
    },
    switchKid: v => { D.cur = v; save(); closeLayer(); ST = { ptab: ST.ptab }; render(); toast('Showing ' + K().name); },
    addKid: () => requireGrown(() => { closeLayer(); W = { step: 1, kid: newKid(), adding: true }; render(); }),
    closeLayer: (v, el, e) => { if (el.classList.contains('sheet') && e.target.closest('[data-stop]')) return; closeLayer(); },
    say: v => say(v),

    /* setup */
    wNext: () => {
      const k = W.kid;
      if (W.step === 1) { if (!k.name.trim()) { $('wErr').textContent = 'Please type a name or nickname.'; return; } k.name = k.name.trim(); }
      if (W.step === 3 && !D.kids.includes(k)) { D.kids.push(k); D.cur = k.id; save(); }
      if (W.step === 3 && W.adding) { W.step = 5; } else W.step++;
      render(); window.scrollTo(0, 0);
    },
    wBack: () => { W.step = W.step === 5 && W.adding ? 3 : W.step - 1; render(); },
    wCancel: () => { W = null; if (unlocked()) { V = 'grown'; ST.ptab = 'settings'; } else V = 'home'; render(); },
    wEmoji: v => { W.kid.emoji = v; render(); },
    wAge: v => { const k = W.kid; k.age = v; k.tools = defaultTools(v); k.grown = v === 'teen'; render(); },
    wHard: v => { const k = W.kid; k.hard = k.hard.includes(v) ? k.hard.filter(x => x !== v) : k.hard.concat(v); render(); },
    wTheme: v => { W.kid.theme = v; render(); },
    wAnother: () => { D.setupDone = true; save(); W = { step: 1, kid: newKid(), adding: true, more: true }; render(); },
    wDone: () => { const wasAdding = W.adding; D.setupDone = true; W = null; save(); used(wasAdding ? 'child-added' : 'setup-done'); V = 'home'; render(); window.scrollTo(0, 0); },

    /* check-in */
    checkin: v => { const k = K(); k.checkins.unshift({ t: Date.now(), c: v, body: [], idea: '' }); save(); used('checkin-' + v); ST = { ci: 0 }; V = 'checkin2'; render(); window.scrollTo(0, 0); try { history.pushState({ oc: 1 }, ''); } catch (e) {} },
    idea: v => { const e = K().checkins[ST.ci]; if (e) { e.idea = v; save(); render(); } },
    bodyClue: v => { const e = K().checkins[ST.ci]; if (!e) return; e.body = e.body || []; e.body = e.body.includes(v) ? e.body.filter(x => x !== v) : e.body.concat(v); save(); render(); },
    pace: v => { ST.pace = +v; render(); },

    /* cards */
    bigCard: v => {
      const k = K(), all = C.CARDS.concat(k.cards.map(c => Object.assign({ bg: '#2f5968' }, c))), c = all[+v]; if (!c) return;
      used('card-shown');
      layer.innerHTML = '<div class="overlay" style="background:' + c.bg + '" data-a="closeLayer"><div class="emo">' + esc(c.e) + '</div><div class="big">' + esc(c.t) + '</div>' +
        (k.readAloud && canSpeak() ? '<button class="light" style="margin-top:28px" data-a="say" data-v="' + esc(c.t) + '">🔊 Say it</button>' : '') + '<p style="opacity:.8;margin-top:28px">Tap anywhere to close</p></div>';
    },
    addCard: () => { const t = (ST.cardText || '').trim(); if (!t) return; K().cards.push({ e: '💬', t: t.slice(0, 60) }); ST.cardText = ''; save(); render(); },
    delCard: v => { K().cards.splice(+v, 1); save(); render(); },

    /* stars */
    rEdit: () => requireGrown(() => { const r = K().reward; V = 'reward'; ST = { rEdit: true, rg: r.goals.map(g => g.text), rt: r.target, rTreat: r.treat }; render(); }),
    rTarget: v => { ST.rt = +v; render(); },
    rSave: () => {
      const r = K().reward, texts = (ST.rg || []).map(x => (x || '').trim()).filter(Boolean).slice(0, 3);
      if (!texts.length) { toast('Add at least one goal.'); return; }
      r.goals = texts.map(t => (r.goals.find(g => g.text === t) || { id: uid(), text: t })); r.target = ST.rt || 10; r.treat = (ST.rTreat || '').trim().slice(0, 80);
      save(); ST = {}; render();
    },
    addStar: () => requireGrown(() => {
      V = 'reward'; ST = {};
      const r = K().reward;
      if (r.goals.length === 1) return ACT.starFor(r.goals[0].id);
      render();
      sheet('<h2>Star for which goal?</h2>' + r.goals.map(g => '<button class="opt" data-a="starFor" data-v="' + g.id + '">🎯 ' + esc(g.text) + '</button>').join(''));
    }),
    starFor: v => {
      const r = K().reward, s = { t: Date.now(), g: v }; r.stars.push(s); save(); closeLayer(); render(); chime(); used('star-added');
      toast('⭐ Star added!', () => { r.stars = r.stars.filter(x => x !== s); save(); render(); });
    },
    rNew: () => requireGrown(() => { const r = K().reward; r.rounds.push({ t: Date.now(), treat: r.treat, stars: r.stars.length }); r.stars = []; save(); V = 'reward'; ST = {}; render(); }),

    /* first / then */
    ftPick: v => ftSheet(v),
    ftSet: v => { const p = C.FT_PRESETS[+v]; K().ft[ST.ftPick] = [p[0], p[1]]; if (ST.ftPick === 'first') K().ft.firstDone = false; save(); closeLayer(); render(); },
    ftOwn: () => { const t = ($('ftOwn').value || '').trim(); if (!t) return; K().ft[ST.ftPick] = ['⭐', t.slice(0, 40)]; save(); closeLayer(); render(); },
    ftDone: () => { const f = K().ft; f.firstDone = !f.firstDone; save(); render(); if (f.firstDone) chime(); },
    ftClear: () => { K().ft = { first: null, then: null, firstDone: false }; save(); render(); },

    /* timer */
    tLabel: v => { ST.tLabel = v; render(); },
    tStart: v => { const m = +v, label = (ST.tLabel || C.TIMER_FOR[0]).trim() || 'the next thing'; D.timer = { end: Date.now() + m * 60000, total: m * 60000, label, rang: false }; save(); used('timer-started'); render(); },
    tAdd: () => { if (!D.timer) return; D.timer.end += 60000; D.timer.total += 60000; save(); render(); },
    tStop: () => { D.timer = null; save(); render(); },

    /* today list */
    tdTick: v => { const t = K().today, i = +v; t.done = t.done.includes(i) ? t.done.filter(x => x !== i) : t.done.concat(i); save(); render(); if (t.done.length === t.items.length) chime(); },
    tdEdit: () => { ST.tdEdit = true; render(); },
    tdEditDone: () => { ST.tdEdit = false; render(); },
    tdPreset: v => { const t = K().today; t.name = v; t.items = clone(C.TODAY_PRESETS[v]); t.done = []; save(); render(); },
    tdDel: v => { const t = K().today; t.items.splice(+v, 1); t.done = []; save(); render(); },
    tdUp: v => { const t = K().today, i = +v; if (i > 0) { [t.items[i - 1], t.items[i]] = [t.items[i], t.items[i - 1]]; t.done = []; save(); render(); } },
    tdAdd: () => { const x = (ST.tdNew || '').trim(); if (!x) return; K().today.items.push(['▫️', x.slice(0, 40)]); ST.tdNew = ''; save(); render(); },

    /* stories */
    storyOpen: v => { ST = { story: v, sstep: 0 }; V = 'story'; render(); window.scrollTo(0, 0); used('story-read'); },
    sNext: () => { ST.sstep = (ST.sstep || 0) + 1; render(); },
    sPrev: v => { ST.sstep = v === 'restart' ? 0 : Math.max(0, (ST.sstep || 0) - 1); render(); },
    storyNew: () => requireGrown(() => { ST = { se: { title: '', emoji: '📖', date: '', text: '' } }; V = 'storyEdit'; render(); }),
    storyEdit: v => requireGrown(() => { const s = K().stories.find(x => x.id === v); if (!s) return go('stories'); ST = { se: { id: s.id, title: s.title, emoji: s.emoji, date: s.date, text: s.steps.join('\n') } }; V = 'storyEdit'; render(); }),
    seEmoji: v => { ST.se.emoji = v; render(); },
    storySave: () => {
      const s = ST.se, steps = (s.text || '').split('\n').map(x => x.trim()).filter(Boolean).slice(0, 30);
      if (!s.title.trim() || !steps.length) { toast('Add a title and at least one line of story.'); return; }
      const k = K(), obj = { id: s.id || uid(), title: s.title.trim().slice(0, 60), emoji: s.emoji, date: s.date || '', steps };
      const i = k.stories.findIndex(x => x.id === obj.id); if (i >= 0) k.stories[i] = obj; else k.stories.push(obj);
      save(); used('story-written'); go('stories');
    },
    storyDel: () => { if (!confirm('Delete this story?')) return; const k = K(); k.stories = k.stories.filter(x => x.id !== ST.se.id); save(); go('stories'); },

    /* scenarios */
    scOpen: v => { ST = { sc: v, open: [] }; V = 'scenario'; render(); window.scrollTo(0, 0); used('scenario-opened'); },
    scOpt: v => { const i = +v; ST.open = ST.open || []; if (!ST.open.includes(i)) ST.open.push(i); else ST.open = ST.open.filter(x => x !== i); render(); },
    scNew: () => requireGrown(() => { ST = { se: { title: '', text: '', tip: '', o: [{ t: '', how: '', good: false }, { t: '', how: '', good: false }, { t: '', how: '', good: false }] } }; V = 'scEdit'; render(); }),
    scEdit: v => requireGrown(() => {
      const s = K().custom.scenarios.find(x => x.id === v); if (!s) return go('scenarios');
      const o = [0, 1, 2].map(i => s.options[i] ? Object.assign({}, s.options[i]) : { t: '', how: '', good: false });
      ST = { se: { id: s.id, title: s.title, text: s.text, tip: s.tip || '', o } }; V = 'scEdit'; render();
    }),
    scSave: () => {
      const s = ST.se, opts = s.o.filter(o => o.t.trim()).map(o => ({ t: o.t.trim(), how: o.how.trim() || 'Have a think about how the other person might feel.', good: !!o.good }));
      if (!s.title.trim() || !s.text.trim() || opts.length < 2) { toast('Add a title, what happens, and at least 2 choices.'); return; }
      const k = K(), obj = { id: s.id || 'c' + uid(), title: s.title.trim(), text: s.text.trim(), tip: (s.tip || '').trim(), options: opts };
      const i = k.custom.scenarios.findIndex(x => x.id === obj.id); if (i >= 0) k.custom.scenarios[i] = obj; else k.custom.scenarios.unshift(obj);
      save(); used('scenario-written'); go('scenarios');
    },
    scDel: () => { if (!confirm('Delete this moment?')) return; const k = K(); k.custom.scenarios = k.custom.scenarios.filter(x => x.id !== ST.se.id); save(); go('scenarios'); },

    /* rules */
    ruleNew: () => requireGrown(() => { ST = { se: { title: '', text: '' } }; V = 'ruleEdit'; render(); }),
    ruleSave: () => { const s = ST.se; if (!s.title.trim() || !s.text.trim()) { toast('Add a title and the rule.'); return; } K().custom.rules.unshift({ id: 'r' + uid(), title: s.title.trim(), text: s.text.trim() }); save(); go('rules'); },
    ruleDel: v => requireGrown(() => { if (!confirm('Delete this rule?')) return go('rules'); const k = K(); k.custom.rules = k.custom.rules.filter(x => x.id !== v); save(); go('rules'); }),

    /* battery, wins, notes */
    bat: v => { K().battery.unshift({ t: Date.now(), v: +v }); save(); used('battery'); ST.bat = +v; render(); },
    addWin: () => { const t = (ST.win || '').trim(); if (!t) return; K().diary.unshift({ id: uid(), t: Date.now(), type: 'good', by: 'child', good: [], note: t.slice(0, 120), ticks: [] }); ST.win = ''; save(); chime(); used('win-added'); render(); },
    addNote: () => { const t = (ST.note || '').trim(); if (!t) return; K().notes.unshift({ t: Date.now(), text: t.slice(0, 2000) }); ST.note = ''; save(); render(); },
    delNote: v => { if (!confirm('Delete this note?')) return; K().notes.splice(+v, 1); save(); render(); },

    /* passport */
    pEdit: () => { ST.pEdit = true; render(); window.scrollTo(0, 0); },
    pDone: () => { ST.pEdit = false; render(); window.scrollTo(0, 0); },
    pPrint: () => { used('passport-print'); printHTML('<div class="card">' + passportHtml(K(), false) + '</div>'); },
    pShare: async () => {
      const text = passportText(K()); used('passport-share');
      try { if (navigator.share) { await navigator.share({ title: 'All about ' + K().name, text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(text); toast('Copied. Paste it into a message or email.'); } catch (e) { alert(text); }
    },
    pQR: async () => {
      sheet('<h2>📱 QR code</h2><p class="muted">Making the code…</p>');
      try {
        const url = await passportLink(K());
        if (!window.qrcode) await loadScript('https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js');
        if (url.length > 2900) { sheet('<h2>Too long for a QR code</h2><p>The passport has too much writing to fit. Shorten some answers, or use <b>Send as text</b> instead.</p><button data-a="closeLayer">OK</button>'); return; }
        const qr = window.qrcode(0, 'L'); qr.addData(url); qr.make();
        ST.qrUrl = url; used('passport-qr');
        sheet('<h2>📱 Scan to see ' + esc(K().name) + '\'s passport</h2><div style="background:#fff;padding:12px;border-radius:12px;max-width:340px;margin:0 auto">' + qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }) + '</div>' +
          '<p class="muted">The passport is packed inside the code itself. Nothing is uploaded, and the person scanning just needs their phone camera.</p>' +
          '<div class="row"><button class="light" data-a="qrCopy">Copy link</button><button data-a="closeLayer">Done</button></div>');
      } catch (e) { sheet('<h2>Couldn\'t make the QR code</h2><p>It needs the internet the first time. Try again, or use <b>Send as text</b>.</p><button data-a="closeLayer">OK</button>'); }
    },
    qrCopy: async () => { try { await navigator.clipboard.writeText(ST.qrUrl); toast('Link copied.'); } catch (e) { prompt('Copy this link:', ST.qrUrl); } },

    /* crisis card */
    crisis: () => { ST.cstep = 0; crisis(K()); used('too-much-card'); },
    cStep: v => { ST.cstep = Math.max(0, (ST.cstep || 0) + +v); crisis(K()); },
    crisisClose: () => closeLayer(),

    /* grown-ups */
    lockNow: () => { lockUntil = 0; go('home'); toast('Grown-ups\' area locked.'); },
    ptab: v => { ST = { ptab: v }; lockUntil = Date.now() + 10 * 60000; render(); window.scrollTo(0, 0); },
    dFilter: v => { ST.filter = v; render(); },
    dNew: v => {
      const now = Date.now();
      ST = { ptab: 'diary', F: { type: v, when: localInput(now), before: [], beforeNote: '', what: '', size: v === 'tricky' ? 'medium' : '', helped: [], after: '', good: [], note: '', showKid: true, ticks: isWeekday(now) ? ['school'] : [] } };
      V = 'diaryForm'; render(); window.scrollTo(0, 0);
    },
    fChip: (v, el) => { const key = el.dataset.k, F = ST.F; F[key] = F[key].includes(v) ? F[key].filter(x => x !== v) : F[key].concat(v); render(); },
    fSize: v => { ST.F.size = v; render(); },
    fTick: v => { const F = ST.F; F.ticks = F.ticks.includes(v) ? F.ticks.filter(x => x !== v) : F.ticks.concat(v); render(); },
    dSave: () => {
      const F = ST.F, t = new Date(F.when).getTime() || Date.now();
      const e = { id: uid(), t, type: F.type, ticks: F.ticks.slice() };
      if (F.type === 'tricky') Object.assign(e, { before: F.before, beforeNote: F.beforeNote.trim(), what: F.what.trim(), size: F.size, helped: F.helped, after: F.after.trim() });
      else { if (!F.good.length && !F.note.trim()) { toast('Pick or write what went well.'); return; } Object.assign(e, { good: F.good, note: F.note.trim(), hideKid: !F.showKid }); }
      const k = K(); k.diary.push(e); k.diary.sort((a, b) => b.t - a.t); save(); used('diary-' + F.type);
      ST = { ptab: 'diary' }; V = 'grown'; render(); toast('Saved.');
    },
    dDel: v => { if (!confirm('Delete this diary entry?')) return; const k = K(); k.diary = k.diary.filter(e => e.id !== v); save(); render(); },
    sumDays: v => { ST.sum2.days = +v; render(); },
    sumPrint: () => { used('summary-print'); printHTML(summaryHtml(K(), ST.sum2)); },
    sumShare: async () => {
      const text = summaryText(K(), ST.sum2); used('summary-share');
      try { if (navigator.share) { await navigator.share({ title: 'Summary for ' + K().name, text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(text); toast('Summary copied. Paste it into a message or email.'); } catch (e) { alert(text); }
    },
    planReset: () => { if (!confirm('Replace your steps with the suggested ones?')) return; K().plan = clone(C.PLAN_STEPS); save(); render(); },
    kEmoji: v => { K().emoji = v; save(); render(); },
    kAge: v => { K().age = v; save(); render(); toast('Tip: "Use the usual tools for this age" is under Tools.'); },
    kTheme: v => { K().theme = v; save(); render(); },
    kHard: v => { const k = K(); k.hard = k.hard.includes(v) ? k.hard.filter(x => x !== v) : k.hard.concat(v); save(); render(); },
    toolsDefault: () => { const k = K(); k.tools = defaultTools(k.age); save(); render(); },
    feedback: () => { if (window.STE && window.STE.feedback) { used('feedback-opened'); window.STE.feedback(); } else toast('Feedback needs the internet. Please try again later.'); },
    delKid: () => {
      const k = K();
      if (!confirm('Remove ' + k.name + ' and all their diary entries, check-ins and notes from this phone? This can\'t be undone. Save a backup first if you\'re not sure.')) return;
      D.kids = D.kids.filter(x => x !== k); D.cur = D.kids[0] ? D.kids[0].id : '';
      if (!D.kids.length) { D.setupDone = false; W = { step: 1, kid: newKid(), adding: false }; }
      save(); ST = { ptab: 'settings' }; render();
    },
    backup: async () => {
      const name = 'our-compass-backup-' + today() + '.json';
      const blob = new Blob([JSON.stringify({ app: 'our-compass', saved: Date.now(), data: D })], { type: 'application/json' });
      used('backup-saved');
      try {
        const file = new File([blob], name, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Our Compass backup' }); $('backupMsg').textContent = 'Backup ready. Keep it somewhere safe, like your email or Google Drive.'; return; }
      } catch (e) { if (e && e.name === 'AbortError') return; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
      $('backupMsg').textContent = 'Backup saved to your downloads.';
    },
    restore: () => $('restoreIn').click(),
    restoreAll: () => { const v = ST.pending; if (!v) return; D = v; D.kids = D.kids.map(fixKid); D.setupDone = !!D.kids.length; if (!D.kids.find(k => k.id === D.cur)) D.cur = D.kids[0] ? D.kids[0].id : ''; save(); closeLayer(); ST = { ptab: 'settings' }; render(); toast('Backup loaded.'); },
    restoreMerge: () => {
      const v = ST.pending; if (!v) return;
      v.kids.forEach(k => { k = fixKid(k); const i = D.kids.findIndex(x => x.id === k.id); if (i >= 0) D.kids[i] = k; else D.kids.push(k); });
      if (!D.pro && v.pro) D.pro = v.pro;
      save(); closeLayer(); ST = { ptab: 'settings' }; render(); toast('Children added or updated.');
    }
  };

  /* ---------- Events ---------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-a]'); if (!el) return;
    const fn = ACT[el.dataset.a]; if (!fn) return;
    if (el.tagName === 'A') e.preventDefault();
    fn(el.dataset.v, el, e);
  });
  // Typing and switches save straight away. Prefixes: k. this child, kl. this child (lines to a list), d. family, w. setup, s. screen, f. diary form
  function setPath(root, path, val) {
    const parts = path.split('.'); let o = root;
    for (let i = 0; i < parts.length - 1; i++) { const p = parts[i]; if (o[p] == null) o[p] = /^\d+$/.test(parts[i + 1]) ? [] : {}; o = o[p]; }
    o[parts[parts.length - 1]] = val;
  }
  function onField(e) {
    const el = e.target.closest('[data-f]'); if (!el) return;
    const f = el.dataset.f, dot = f.indexOf('.'), pre = f.slice(0, dot), path = f.slice(dot + 1);
    let val = el.type === 'checkbox' ? el.checked : el.value;
    if (pre === 'kl') val = String(val).split('\n').map(x => x.trim()).filter(Boolean).slice(0, 20);
    const root = { k: K(), kl: K(), d: D, w: W && W.kid, s: ST, f: ST.F }[pre]; if (!root) return;
    if (pre === 'k' && path === 'name') val = val.slice(0, 24);
    setPath(root, path, val);
    if (pre === 'k' || pre === 'kl' || pre === 'd') save();
    if (pre === 'k' && path === 'name') applyLook();
    if (e.type === 'change' && el.hasAttribute('data-rr')) render();
  }
  document.addEventListener('input', e => { if (e.target.type !== 'checkbox') onField(e); });
  document.addEventListener('change', e => {
    if (e.target.id === 'restoreIn') return restoreFile(e.target);
    if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') onField(e);
  });
  document.addEventListener('submit', e => {
    if (e.target.id !== 'lockForm') return;
    e.preventDefault();
    const [a, b] = ST.sum || [0, 0], ans = parseInt($('lockIn').value, 10);
    if (ans === a * b) { lockUntil = Date.now() + 10 * 60000; const fn = ST.after; ST = { ptab: ST.ptab }; if (fn) fn(); else go('grown'); }
    else { $('lockMsg').textContent = 'Not quite. Try again.'; $('lockIn').value = ''; $('lockIn').focus(); }
  });
  async function restoreFile(input) {
    const file = input.files[0]; input.value = ''; if (!file) return;
    try {
      const v = JSON.parse(await file.text());
      if (!v || v.app !== 'our-compass' || !v.data || !Array.isArray(v.data.kids)) throw new Error('bad');
      ST.pending = v.data;
      sheet('<h2>Load backup from ' + esc(new Date(v.saved).toLocaleDateString()) + '?</h2><p>It has: ' + esc(v.data.kids.map(k => k.emoji + ' ' + k.name).join(', ')) + '</p>' +
        '<button class="opt" data-a="restoreMerge"><b>Add or update these children</b><br><span class="muted">Keeps any other children already on this phone.</span></button>' +
        '<button class="opt" data-a="restoreAll"><b>Replace everything on this phone</b><br><span class="muted">This phone ends up exactly like the backup.</span></button>' +
        '<button class="light" data-a="closeLayer" style="width:100%">Cancel</button>');
    } catch (e) { const m = $('backupMsg'); if (m) m.textContent = 'That file isn\'t an Our Compass backup.'; }
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && layer.innerHTML) closeLayer(); });

  /* ---------- Start ---------- */
  if (D.kids.length && !D.kids.find(k => k.id === D.cur)) D.cur = D.kids[0].id;
  render();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  // localhost-only test hook
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__oc = { get D() { return D; }, findPatterns: () => findPatterns(K()), passportLink: () => passportLink(K()), render, go, unlock: () => { lockUntil = Date.now() + 600000; } };
})();
