/* Our Compass: linking a parent's and a child's device.
   Everything is scrambled (AES-GCM, Web Crypto) on the device before it is uploaded, with a random key
   that only the family's linked devices have. The server (Firebase project ste-owner) only ever stores
   scrambled text in documents whose names are made from that key, so nobody can find or read them. */
(function () {
  'use strict';
  const FB = 'https://www.gstatic.com/firebasejs/12.19.0/';
  const CONFIG = {
    apiKey: 'AIzaSyAZZEit4XKY2BXEEAaeodyCLqnq2t4Zei4',
    authDomain: 'ste-owner.firebaseapp.com',
    projectId: 'ste-owner',
    storageBucket: 'ste-owner.firebasestorage.app',
    messagingSenderId: '829458613758',
    appId: '1:829458613758:web:4e620c438e6cfcf526acaf',
  };
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = bytes => { let s = ''; bytes.forEach(b => { s += String.fromCharCode(b); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const unb64 = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); };
  const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  const sha = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));

  /* ---------- keys and scrambling ---------- */
  const newKey = () => b64(crypto.getRandomValues(new Uint8Array(32)));
  const keyCache = {};
  function aes(raw) { return keyCache[raw] = keyCache[raw] || crypto.subtle.importKey('raw', unb64(raw), 'AES-GCM', false, ['encrypt', 'decrypt']); }
  async function lock(raw, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aes(raw), enc.encode(JSON.stringify(obj))));
    const all = new Uint8Array(12 + ct.length); all.set(iv); all.set(ct, 12);
    return '1.' + b64(all);
  }
  async function unlock(raw, text) {
    const all = unb64(String(text).replace(/^1\./, ''));
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.slice(0, 12) }, await aes(raw), all.slice(12));
    return JSON.parse(dec.decode(pt));
  }
  // The two "boxes" for one linked child: p = parent to child, c = child to parent
  const boxId = (raw, which) => sha('our-compass|' + raw + '|' + which);

  /* ---------- short codes for typing in (8 letters, easy to read: no 0/O, 1/I/L, 2/Z, 5/S, 8/B) ---------- */
  const ABC = 'ACDEFHJKMNPRTUVWXY34679';
  const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), b => ABC[b % ABC.length]).join('');
  const cleanCode = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  async function codeKey(code) {
    const base = await crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode('our-compass-pair'), iterations: 150000, hash: 'SHA-256' }, base, 256);
    return b64(new Uint8Array(bits));
  }

  /* ---------- the server ---------- */
  let fbP = null;
  function fb() {
    if (!fbP) fbP = (async () => {
      const [appM, authM, fsM] = await Promise.all([import(FB + 'firebase-app.js'), import(FB + 'firebase-auth.js'), import(FB + 'firebase-firestore.js')]);
      const app = appM.getApps().find(a => a.name === 'our-compass-sync') || appM.initializeApp(CONFIG, 'our-compass-sync');
      const auth = authM.getAuth(app), db = fsM.getFirestore(app);
      await auth.authStateReady();
      if (!auth.currentUser) await authM.signInAnonymously(auth);
      return { fsM, db };
    })().catch(e => { fbP = null; throw e; });
    return fbP;
  }
  const real = {
    async get(col, id) { const { fsM, db } = await fb(); const s = await fsM.getDoc(fsM.doc(db, col, id)); return s.exists() ? s.data() : null; },
    async put(col, id, data) { const { fsM, db } = await fb(); const d = Object.assign({}, data); if (col === 'ocSync') d.at = fsM.serverTimestamp(); if (d.exp) d.exp = fsM.Timestamp.fromMillis(d.exp); await fsM.setDoc(fsM.doc(db, col, id), d); },
    async del(col, id) { const { fsM, db } = await fb(); await fsM.deleteDoc(fsM.doc(db, col, id)); },
    watch(col, id, cb, onErr) {
      let stop = null, dead = false;
      fb().then(({ fsM, db }) => { if (dead) return; stop = fsM.onSnapshot(fsM.doc(db, col, id), s => cb(s.exists() ? s.data() : null), e => onErr && onErr(e)); }).catch(e => onErr && onErr(e));
      return () => { dead = true; if (stop) stop(); };
    }
  };
  // Pretend server for testing on this computer (?mock): a shared localStorage entry, seen by every tab
  const MK = 'oc_mock_server';
  const mread = () => { try { return JSON.parse(localStorage.getItem(MK) || '{}'); } catch (e) { return {}; } };
  const mock = {
    async get(col, id) { const v = mread()[col + '/' + id]; if (v && v.exp && v.exp < Date.now()) return null; return v || null; },
    async put(col, id, data) { const m = mread(); m[col + '/' + id] = Object.assign({}, data, { at: Date.now() }); localStorage.setItem(MK, JSON.stringify(m)); fire(); },
    async del(col, id) { const m = mread(); delete m[col + '/' + id]; localStorage.setItem(MK, JSON.stringify(m)); fire(); },
    watch(col, id, cb) {
      let last;
      const look = () => { const v = mread()[col + '/' + id] || null, s = JSON.stringify(v); if (s !== last) { last = s; cb(v); } };
      const on = e => { if (!e || e.key === MK || e.type === 'oc-mock') look(); };
      window.addEventListener('storage', on); window.addEventListener('oc-mock', on); setTimeout(look, 0);
      return () => { window.removeEventListener('storage', on); window.removeEventListener('oc-mock', on); };
    }
  };
  function fire() { setTimeout(() => window.dispatchEvent(new Event('oc-mock')), 0); }
  const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const S = LOCAL && new URLSearchParams(location.search).has('mock') ? mock : real;

  window.OC_SYNC = {
    newKey, newCode, cleanCode, lock, unlock, mock: S === mock,
    // A child's box: read, write (scrambled), delete, and watch for changes
    async read(raw, which) { const d = await S.get('ocSync', await boxId(raw, which)); return d && d.d ? unlock(raw, d.d) : null; },
    async write(raw, which, obj) { const d = await lock(raw, obj); if (d.length > 700000) throw new Error('too-big'); await S.put('ocSync', await boxId(raw, which), { d }); },
    async remove(raw, which) { await S.del('ocSync', await boxId(raw, which)); },
    watch(raw, which, cb, onErr) {
      let stop = null, dead = false;
      boxId(raw, which).then(id => {
        if (dead) return;
        stop = S.watch('ocSync', id, async d => {
          if (!d || !d.d) return cb(null, false);
          try { cb(await unlock(raw, d.d), true); } catch (e) { onErr && onErr(e); }
        }, onErr);
      });
      return () => { dead = true; if (stop) stop(); };
    },
    // Short-code pairing: the family key waits on the server for 15 minutes, scrambled with the code itself
    async offer(code, info) { const id = await sha('our-compass-pair|' + code); await S.put('ocPair', id, { d: await lock(await codeKey(code), info), exp: Date.now() + 15 * 60000 }); },
    async claim(code) {
      const id = await sha('our-compass-pair|' + code);
      let d = null; try { d = await S.get('ocPair', id); } catch (e) { if (!/permission/i.test(String(e && (e.code || e.message)))) throw e; }
      if (!d || !d.d) return null;
      const info = await unlock(await codeKey(code), d.d);
      S.del('ocPair', id).catch(() => {});
      return info;
    },
    async cancelOffer(code) { try { await S.del('ocPair', await sha('our-compass-pair|' + code)); } catch (e) {} }
  };
})();
