// /src/js/auth.js — HappyDate Auth (Supabase v2, production‑ready)
// Ініціалізація, onAuthStateChange, оновлення UI, guard, API: window.auth

let supabase = null;
(async () => {
  try {
    // Прод-шлях (за бажанням зроби alias /js/supabaseClient.js → /src/js/supabaseClient.js)
    ({ supabase } = await import('/js/supabaseClient.js'));
  } catch {
    ({ supabase } = await import('/src/js/supabaseClient.js'));
  }
  if (!supabase) throw new Error('[auth] Не вдалося завантажити Supabase client.');
  await initAuth();
})();

// ─── helpers DOM/UI ────────────────────────────────────────────────────────────
const $  = (s, r=document) => r.querySelector(s);
function show(el){ el && el.classList.remove('hidden'); }
function hide(el){ el && el.classList.add('hidden'); }
function setAttr(el,k,v){ el && el.setAttribute(k,v); }

function avatarFallback(email) {
  const seed = encodeURIComponent(email || 'guest');
  return `https://api.dicebear.com/8.x/fun-emoji/svg?seed=${seed}`;
}

function toast(msg, type='info'){
  try {
    const el = document.createElement('div');
    el.textContent = msg;
    el.setAttribute('role','status'); el.setAttribute('aria-live','polite');
    el.style.cssText = `position:fixed;top:16px;right:16px;z-index:9999;padding:10px 12px;
      border-radius:12px;color:#fff;background:${type==='error'?'#dc2626':type==='ok'?'#16a34a':'#111827'};
      box-shadow:0 10px 25px rgba(0,0,0,.15);font-weight:600`;
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), 2400);
  } catch {}
}

// ─── state ────────────────────────────────────────────────────────────────────
let currentUser = null;
let authReadyResolve; const authReady = new Promise(r=>authReadyResolve=r);

// ─── init ─────────────────────────────────────────────────────────────────────
async function initAuth(){
  const { data: { session } } = await supabase.auth.getSession();
  currentUser = session?.user || null;

  updateUserUI();

  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    updateUserUI();
    if (requiresAuth() && !currentUser) redirectToLogin();
  });

  if (requiresAuth() && !currentUser) { redirectToLogin(); return; }

  wireUiHandlers();

  authReadyResolve();
  document.dispatchEvent(new CustomEvent('happydate:authReady', { detail: { user: currentUser } }));
}

// ─── guard ────────────────────────────────────────────────────────────────────
function requiresAuth(){
  const meta = document.querySelector('meta[name="auth"]');
  if (meta && (meta.getAttribute('content')||'').toLowerCase()==='required') return true;
  return (document.body.getAttribute('data-auth')||'').toLowerCase() === 'required';
}
function redirectToLogin(){
  const returnTo = encodeURIComponent(location.pathname + location.search + location.hash);
  location.replace(`/pages/login.html?returnTo=${returnTo}`);
}

// ─── UI update ────────────────────────────────────────────────────────────────
function updateUserUI(){
  const loginLink   = $('#login-link');
  const registerLink= $('#register-link');
  const avatarLink  = $('#user-avatar-link');
  const avatarImg   = $('#user-avatar');
  const logoutBtn   = $('#logout-btn');

  const logoutMob   = $('#logout-btn-mobile');
  const loginMob    = $('#login-link-mobile');
  const regMob      = $('#register-link-mobile');
  const dashMob     = $('#dashboard-link-mobile');

  if (currentUser) {
    hide(loginLink); hide(registerLink);
    hide(loginMob); hide(regMob);
    show(avatarLink); show(logoutBtn); show(logoutMob); show(dashMob);

    const email = currentUser.email || '';
    const photoUrl = currentUser.user_metadata?.avatar_url || avatarImg?.getAttribute('data-photo') || avatarFallback(email);
    if (avatarImg) { avatarImg.src = photoUrl; setAttr(avatarImg,'alt', email ? `Profil: ${email}` : 'Profil użytkownika'); }
  } else {
    show(loginLink); show(registerLink);
    show(loginMob); show(regMob);
    hide(avatarLink); hide(logoutBtn); hide(logoutMob); hide(dashMob);
  }
}

// ─── UI actions ───────────────────────────────────────────────────────────────
function wireUiHandlers(){
  $('#logout-btn')?.addEventListener('click', signOut);
  $('#logout-btn-mobile')?.addEventListener('click', signOut);
}

// ─── public API ───────────────────────────────────────────────────────────────
async function getUser(){ const { data } = await supabase.auth.getUser(); return data?.user || null; }
async function getSession(){ const { data } = await supabase.auth.getSession(); return data?.session || null; }
async function waitForAuthReady(){ return authReady; }
async function requireAuth(opts={ redirect:true }){ const { redirect=true } = opts; const u = await getUser(); if (!u && redirect) redirectToLogin(); return u; }

async function signInWithProvider(provider='google', options={}){
  const redirectTo = options.redirectTo || `${location.origin}/pages/profile.html`;
  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
  if (error) { toast('Не вдалося розпочати логін через OAuth.', 'error'); throw error; }
}

async function signOut(){
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    toast('Вихід виконано ✔', 'ok');
  } catch (e) {
    console.error(e); toast('Помилка виходу', 'error');
  }
}

window.auth = {
  supabase: () => supabase,
  getUser, getSession, waitForAuthReady, requireAuth,
  signInWithProvider, signOut, updateUserUI,
};

// ─── handle ?returnTo після логіну ────────────────────────────────────────────
(function handleReturnTo(){
  const rt = new URLSearchParams(location.search).get('returnTo');
  if (!rt) return;
  document.addEventListener('happydate:authReady', async () => {
    const u = await getUser(); if (u) { try { location.replace(rt); } catch { location.href = rt; } }
  });
})();
