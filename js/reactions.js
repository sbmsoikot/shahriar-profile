/**
 * reactions.js — Emoji reactions with Firebase Realtime Database
 *
 * SETUP (one-time, ~5 minutes):
 * ──────────────────────────────────────────────────────────────
 * 1. Go to https://console.firebase.google.com
 *    Create a project → name it (e.g. "sbm-website")
 *
 * 2. Add a web app → copy the firebaseConfig object
 *    Paste the values into FIREBASE_CONFIG below
 *
 * 3. In the Firebase console → Build → Realtime Database
 *    Create database → Start in TEST mode (or use the rules below)
 *
 * 4. Set database rules (Rules tab) to allow public read + write:
 *    {
 *      "rules": {
 *        "reactions": {
 *          ".read": true,
 *          "$post": {
 *            "$emoji": {
 *              ".write": true,
 *              ".validate": "newData.isNumber() && newData.val() >= 0"
 *            }
 *          }
 *        }
 *      }
 *    }
 *
 * 5. Save. Reactions are now live. ✓
 * ──────────────────────────────────────────────────────────────
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDwNVPSDKV7c_rlMZz7JukDqW5_QHKoO7E",
  authDomain: "personal-website-9dbfd.firebaseapp.com",
  // databaseURL is REQUIRED for Realtime Database — copy it from:
  // Firebase Console → Realtime Database → copy the URL at the top (ends in .firebaseio.com)
  databaseURL: "https://personal-website-9dbfd-default-rtdb.firebaseio.com",
  projectId: "personal-website-9dbfd",
  storageBucket: "personal-website-9dbfd.firebasestorage.app",
  messagingSenderId: "905996519056",
  appId: "1:905996519056:web:c4c5a32b6d8023e3a33a15",
  measurementId: "G-8ZKPR7N4ZC"
};

const EMOJIS = [
  { key: 'heart', label: '❤️', title: 'Loved it' },
  { key: 'bulb',  label: '💡', title: 'Insightful' },
  { key: 'fire',  label: '🔥', title: 'Fire' },
  { key: 'mind',  label: '🤯', title: 'Mind blown' },
];

const FIREBASE_VERSION = '10.12.0';
let _db = null;
let _dbOps = null;
let _firebaseReady = false;

/* ── Local reaction state (localStorage) ──────────────── */
function getLocal(postId) {
  try { return JSON.parse(localStorage.getItem('rxn_' + postId) || '{}'); }
  catch { return {}; }
}
function setLocal(postId, key, active) {
  const s = getLocal(postId);
  if (active) s[key] = 1; else delete s[key];
  try { localStorage.setItem('rxn_' + postId, JSON.stringify(s)); }
  catch {}
}

/* ── Firebase init (lazy, non-blocking) ───────────────── */
async function ensureFirebase() {
  if (_firebaseReady) return true;
  if (!FIREBASE_CONFIG.databaseURL || FIREBASE_CONFIG.databaseURL.includes('REPLACE')) {
    console.warn('[reactions] databaseURL not set — running in local-only mode.');
    return false;
  }

  try {
    const base = 'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION;
    const [appMod, dbMod] = await Promise.all([
      import(base + '/firebase-app.js'),
      import(base + '/firebase-database.js'),
    ]);
    const { initializeApp, getApps, getApp } = appMod;
    const { getDatabase, ref, runTransaction, onValue } = dbMod;

    // Re-use existing app if already initialized (e.g. homepage loaded first)
    const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
    // Always pass databaseURL explicitly — required for Realtime Database
    _db = getDatabase(app, FIREBASE_CONFIG.databaseURL);
    _dbOps = { ref, runTransaction, onValue };
    _firebaseReady = true;
    return true;
  } catch (err) {
    console.warn('[reactions] Firebase unavailable — running in local-only mode.', err.message);
    return false;
  }
}

/* ── Render reaction buttons ──────────────────────────── */
function renderButtons(container, postId) {
  const local = getLocal(postId);
  container.innerHTML = EMOJIS.map(e => `
    <button
      class="rxn-btn${local[e.key] ? ' on' : ''}"
      data-key="${e.key}"
      title="${e.title}"
      aria-pressed="${local[e.key] ? 'true' : 'false'}"
    >
      <span class="rxn-emoji" aria-hidden="true">${e.label}</span>
      <span class="rxn-n" id="rxn-${postId}-${e.key}">—</span>
    </button>
  `).join('');
}

/* ── Subscribe to live counts ─────────────────────────── */
function subscribeToFirebase(postId) {
  const { ref, onValue } = _dbOps;
  EMOJIS.forEach(e => {
    const el = document.getElementById('rxn-' + postId + '-' + e.key);
    if (!el) return;
    onValue(ref(_db, 'reactions/' + postId + '/' + e.key), snap => {
      el.textContent = snap.val() ?? 0;
    });
  });
}

/* ── Handle a reaction click ──────────────────────────── */
async function handleClick(container, postId, btn) {
  const key = btn.dataset.key;
  if (!key) return;

  const wasOn = btn.classList.contains('on');
  const delta = wasOn ? -1 : 1;

  // Optimistic UI update
  btn.classList.toggle('on', !wasOn);
  btn.setAttribute('aria-pressed', (!wasOn).toString());
  btn.classList.add('pop');
  btn.addEventListener('animationend', () => btn.classList.remove('pop'), { once: true });
  setLocal(postId, key, !wasOn);

  // If Firebase available, sync
  if (_firebaseReady && _dbOps) {
    const { ref, runTransaction } = _dbOps;
    try {
      await runTransaction(ref(_db, 'reactions/' + postId + '/' + key), current => {
        return Math.max(0, (current || 0) + delta);
      });
    } catch (err) {
      // Revert optimistic update on failure
      btn.classList.toggle('on', wasOn);
      btn.setAttribute('aria-pressed', wasOn.toString());
      setLocal(postId, key, wasOn);
      console.warn('[reactions] Write failed:', err);
    }
  } else {
    // Local-only: update displayed count from localStorage tally
    const countEl = document.getElementById('rxn-' + postId + '-' + key);
    if (countEl) {
      const cur = parseInt(countEl.textContent, 10) || 0;
      countEl.textContent = Math.max(0, cur + delta);
    }
  }
}

/* ── Public: mount reactions on a container ───────────── */
export async function initReactions(container) {
  const postId = container.dataset.post;
  if (!postId) return;

  renderButtons(container, postId);

  // Click handler (before Firebase resolves — works in local mode)
  container.addEventListener('click', e => {
    const btn = e.target.closest('.rxn-btn');
    if (btn) handleClick(container, postId, btn);
  });

  // Try to go live
  const ok = await ensureFirebase();
  if (ok) {
    subscribeToFirebase(postId);
  } else {
    // Show zeros instead of dashes when offline
    EMOJIS.forEach(e => {
      const el = document.getElementById('rxn-' + postId + '-' + e.key);
      if (el && el.textContent === '—') el.textContent = '0';
    });
  }
}
