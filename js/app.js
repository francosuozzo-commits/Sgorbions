function toggleLangDropdown() {
  const dd = document.getElementById('lang-dropdown');
  if (!dd) return;
  dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
  // Close on outside click
  if (dd.style.display === 'block') {
    setTimeout(() => {
      document.addEventListener('click', function closeLang(e) {
        if (!document.getElementById('lang-switcher').contains(e.target)) {
          dd.style.display = 'none';
          document.removeEventListener('click', closeLang);
        }
      });
    }, 10);
  }
}

function openAuth(tab) {
  document.getElementById('auth-modal').classList.remove('hidden');
  switchAuthTab(tab);
}
function switchAuthTab(tab) {
  document.getElementById('auth-login').style.display = tab === 'login' ? '' : 'none';
  document.getElementById('auth-register').style.display = tab === 'register' ? '' : 'none';
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  const title = document.querySelector('#auth-modal .modal-title');
  if (title) title.textContent = tab === 'login' ? 'Bentornato!' : 'Benvenuto!';
  const ae = document.getElementById('auth-error'); if (ae) ae.style.display = 'none';
  const re = document.getElementById('reg-error'); if (re) re.style.display = 'none';
}


// ============================================================
//  FIREBASE + CLOUDINARY CONFIG
// ============================================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAolDaSifZO5ja0hRyQ6016J4jouS3Qg94",
  authDomain: "sgorbions.firebaseapp.com",
  projectId: "sgorbions",
  storageBucket: "sgorbions.firebasestorage.app",
  messagingSenderId: "474693775672",
  appId: "1:474693775672:web:3a3fb031cb298ff52011cd"
};
const CLOUDINARY_CLOUD = 'ddpsge9d8';
const CLOUDINARY_PRESET = 'sgorbions';

// ============================================================
//  EMAILJS CONFIG
// ============================================================
const EMAILJS_SERVICE = 'service_of1bafg';
const EMAILJS_TEMPLATE = 'template_8wzcl48';
const EMAILJS_PUBLIC_KEY = 'fyd9m_foJOMkBXjX4';

function initEmailJS() {
  if (typeof emailjs !== 'undefined') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    console.log('EmailJS ready');
  }
}

async function sendEmail(toEmail, username, subject, messaggio) {
  // Log always, regardless of EmailJS outcome
  logEmail(toEmail, subject);
  if (typeof emailjs === 'undefined') { console.warn('EmailJS not loaded'); return; }
  try {
    await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
      email: toEmail,
      username: username,
      subject: subject,
      messaggio: messaggio
    });
    console.log('Email inviata a', toEmail);
  } catch(e) {
    console.error('Errore invio email', e);
  }
}

async function sendWelcomeEmail(user) {
  await sendEmail(
    user.email,
    user.username,
    'Benvenuto su figurinesgorbions.it! 👾',
    'Benvenuto nella community Sgorbions di figurinesgorbions.it!\n\nIl tuo account è stato creato con successo. Inizia subito a sfogliare il catalogo e a costruire la tua collezione!'
  );
  incrementEmailCounter(1);
}

async function sendReplyNotificationEmail(postAuthorId, postTitle, replyAuthor, replyText) {
  const users = getData('users', []);
  const postAuthor = users.find(u => u.id === postAuthorId);
  if (!postAuthor || !postAuthor.email) return;
  // Don't notify if replying to own post
  if (postAuthor.id === currentUser.id) return;
  await sendEmail(
    postAuthor.email,
    postAuthor.username,
    'Qualcuno ha risposto al tuo post! 💬',
    replyAuthor + ' ha risposto al tuo post "' + postTitle + '":\n\n"' + replyText + '"\n\nVai a vedere la risposta su figurinesgorbions.it'
  );
  incrementEmailCounter(1);
}

async function renderEmailLog() {
  const el = document.getElementById('admin-email-log');
  if (!el) return;
  el.innerHTML = '<p style="color:var(--muted);font-style:italic;">' + (currentLang === 'it' ? 'Caricamento...' : 'Loading...') + '</p>';
  try {
    const logs = await fsGetAll('email_log');
    logs.sort((a,b) => new Date(b.date) - new Date(a.date));
    if (!logs.length) { el.innerHTML = '<p style="color:var(--muted);font-style:italic;">' + (currentLang === 'it' ? 'Nessuna e-mail registrata.' : 'No emails recorded.') + '</p>'; return; }
    const display = logs.slice(0, 50);
    const note = logs.length > 50 ? `<p style="font-size:0.78rem;color:var(--muted);margin-bottom:0.5rem;">${currentLang === 'it' ? 'Mostrate le ultime 50 di ' + logs.length : 'Showing last 50 of ' + logs.length}</p>` : '';
    el.innerHTML = note + '<table class="data-table"><thead><tr><th>' + (currentLang === 'it' ? 'Data invio' : 'Sent date') + '</th><th>' + (currentLang === 'it' ? 'Destinatario' : 'Recipient') + '</th><th>' + (currentLang === 'it' ? 'Soggetto' : 'Subject') + '</th></tr></thead><tbody>' +
    display.map(e => '<tr><td style="white-space:nowrap;font-size:0.85rem;">' + new Date(e.date).toLocaleDateString('it-IT') + ' ' + new Date(e.date).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}) + '</td><td style="font-size:0.85rem;">' + e.to + '</td><td style="font-size:0.85rem;">' + e.subject + '</td></tr>').join('') +
    '</tbody></table>';
  } catch(err) { el.innerHTML = '<p style="color:var(--muted);">' + (currentLang === 'it' ? 'Errore caricamento log.' : 'Error loading log.') + '</p>'; }
}

function renderNewsletterUsers() {
  const el = document.getElementById('newsletter-users-list');
  if (!el) return;
  const users = getData('users', []).filter(u => !u.isAdmin && u.email);
  if (!users.length) { el.innerHTML = '<p style="color:var(--muted);font-size:0.88rem;">Nessun utente registrato.</p>'; return; }
  el.innerHTML = users.map(u => `
    <label style="display:flex;align-items:center;gap:0.6rem;cursor:pointer;font-size:0.9rem;">
      <input type="checkbox" class="newsletter-user-cb" data-id="${u.id}" data-email="${u.email}" data-username="${u.username}"
        style="width:16px;height:16px;cursor:pointer;">
      <span>${u.username}</span>
      <span style="color:var(--muted);font-size:0.8rem;">&lt;${u.email}&gt;</span>
    </label>`).join('');
}

function selectAllNewsletterUsers(select) {
  document.querySelectorAll('.newsletter-user-cb').forEach(cb => cb.checked = select);
}

async function sendNewsletterFromAdmin() {
  const subject = document.getElementById('newsletter-subject').value.trim();
  const body = document.getElementById('newsletter-body').value.trim();
  if (!subject || !body) { toast('Compila oggetto e messaggio', 'error'); return; }
  const selected = [...document.querySelectorAll('.newsletter-user-cb:checked')];
  if (!selected.length) { toast((currentLang === 'it' ? 'Seleziona almeno un utente' : 'Select at least one user'), 'error'); return; }
  if (!confirm((currentLang === 'it' ? 'Inviare la newsletter a ' : 'Send newsletter to ') + selected.length + (currentLang === 'it' ? ' utenti?' : ' users?'))) return;
  for (const cb of selected) {
    await sendEmail(cb.dataset.email, cb.dataset.username, subject, body);
  }
  await incrementEmailCounter(selected.length);
  toast((currentLang === 'it' ? 'Newsletter inviata a ' : 'Newsletter sent to ') + selected.length + (currentLang === 'it' ? ' utenti! 📧' : ' users! 📧'), 'success');
  document.getElementById('newsletter-subject').value = '';
  document.getElementById('newsletter-body').value = '';
}

async function sendNewsletterEmail(subject, messaggio) {
  const users = getData('users', []).filter(u => !u.isAdmin && u.email);
  for (const user of users) {
    await sendEmail(user.email, user.username, subject, messaggio);
  }
  toast((currentLang === 'it' ? 'Newsletter inviata a ' : 'Newsletter sent to ') + users.length + (currentLang === 'it' ? ' utenti!' : ' users!'), 'success');
}

// Firebase SDK (via CDN)
let db = null;
let fbApp = null;

const JS_VERSION = 'v3.81';
const CSS_VERSION = 'v4.13';

// ============================================================
//  NATIONALITY
// ============================================================
const COUNTRIES = [
  ['it','Italia'],['gb','Regno Unito'],['us','Stati Uniti'],['fr','Francia'],['de','Germania'],
  ['es','Spagna'],['pt','Portogallo'],['nl','Paesi Bassi'],['be','Belgio'],['ch','Svizzera'],
  ['at','Austria'],['pl','Polonia'],['cz','Repubblica Ceca'],['sk','Slovacchia'],['hu','Ungheria'],
  ['ro','Romania'],['bg','Bulgaria'],['hr','Croazia'],['si','Slovenia'],['rs','Serbia'],
  ['gr','Grecia'],['tr','Turchia'],['se','Svezia'],['no','Norvegia'],['dk','Danimarca'],
  ['fi','Finlandia'],['ie','Irlanda'],['lt','Lituania'],['lv','Lettonia'],['ee','Estonia'],
  ['br','Brasile'],['ar','Argentina'],['mx','Messico'],['co','Colombia'],['cl','Cile'],
  ['au','Australia'],['nz','Nuova Zelanda'],['jp','Giappone'],['cn','Cina'],['kr','Corea del Sud'],
  ['in','India'],['ru','Russia'],['ua','Ucraina'],['ca','Canada'],['za','Sudafrica'],
  ['eg','Egitto'],['ma','Marocco'],['ng','Nigeria'],['gh','Ghana'],['ke','Kenya'],
  ['ae','Emirati Arabi'],['sa','Arabia Saudita'],['il','Israele'],['sg','Singapore'],['th','Tailandia'],['cu','Cuba'],
];

function flagUrl(code) {
  return `https://flagcdn.com/w40/${code}.png`;
}

function cloudinaryUrl(url, opts = 'w_300,h_300,c_fit,q_auto,f_auto') {
  if (!url || !url.includes('cloudinary.com')) return url;
  // Insert transformation parameters after /upload/
  return url.replace('/upload/', `/upload/${opts}/`);
}

function filterNationalities() {
  const q = document.getElementById('reg-nationality-search').value.toLowerCase().trim();
  const dd = document.getElementById('nationality-dropdown');
  if (!q) { dd.style.display = 'none'; return; }
  const filtered = COUNTRIES.filter(([code, name]) => name.toLowerCase().includes(q));
  if (!filtered.length) { dd.style.display = 'none'; return; }
  dd.style.display = '';
  dd.innerHTML = filtered.map(([code, name]) =>
    `<div onclick="selectNationality('${code}','${name}')" style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background=''">
      <img src="${flagUrl(code)}" style="width:24px;height:16px;object-fit:cover;border-radius:2px;">
      <span style="font-size:0.9rem;">${name}</span>
    </div>`
  ).join('');
}

function selectNationality(code, name) {
  document.getElementById('reg-nationality-code').value = code;
  document.getElementById('reg-nationality-name').value = name;
  document.getElementById('reg-nationality-search').value = name;
  document.getElementById('nationality-dropdown').style.display = 'none';
  const preview = document.getElementById('reg-nationality-preview');
  preview.style.display = 'flex';
  preview.innerHTML = `<img src="${flagUrl(code)}" style="width:24px;height:16px;object-fit:cover;border-radius:2px;"> ${name}`;
}

function nationalityFlag(code, name) {
  if (!code) return '';
  return `<img src="${flagUrl(code)}" title="${name||''}" style="width:18px;height:12px;object-fit:cover;border-radius:2px;vertical-align:middle;margin-left:4px;">`;
}

function loadDemoData() {
  _cache.series = [
    { id: 's1', name: 'Serie 1 — Primavera', year: 1990, count: 30, desc: 'La prima serie di Sgorbions, con i personaggi più iconici.', order: 0, img: null },
    { id: 's2', name: 'Serie 2 — Estate', year: 1991, count: 25, desc: 'La seconda serie con nuovi personaggi grotteschi.', order: 1, img: null },
    { id: 's3', name: 'Serie 3 — Autunno', year: 1992, count: 20, desc: 'Terza serie con edizione limitata.', order: 2, img: null },
  ];
  _cache.figurines = [
    { id: 'f1', seriesId: 's1', section: 'figurines', number: 1, name: 'Vittorio Mortorio', desc: 'Il più famoso degli Sgorbions', score: 10 },
    { id: 'f2', seriesId: 's1', section: 'figurines', number: 2, name: 'Pamela Candela', desc: 'La principessa del moccio', score: 8 },
    { id: 'f3', seriesId: 's1', section: 'figurines', number: 3, name: 'Sgorbio Maximus', desc: 'Il re degli Sgorbions', score: 15 },
    { id: 'f4', seriesId: 's1', section: 'albums', number: 1, name: 'Album Serie 1', desc: 'Album ufficiale della prima serie', score: 20 },
    { id: 'f5', seriesId: 's2', section: 'figurines', number: 1, name: 'Slimeo', desc: 'Il principe del fango', score: 12 },
    { id: 'f6', seriesId: 's2', section: 'figurines', number: 2, name: 'Bavaglina', desc: 'La bavaglina vivente', score: 7 },
  ];
  _cache.posts = [
    { id: 'p1', type: 'question', title: 'Dove trovo la figurina #3?', body: 'Cerco da anni Sgorbio Maximus, qualcuno sa dove trovarla?', author: 'collezionista99', authorId: 'u1', date: new Date().toISOString(), comments: [
      { id: 'c1', author: 'admin', authorId: 'admin', isAdmin: true, text: 'Prova nei mercatini vintage!', date: new Date().toISOString() }
    ]},
    { id: 'p2', type: 'news', title: 'Trovato lotto raro al mercatino!', body: 'Ho trovato un lotto completo della Serie 1 in ottime condizioni.', author: 'sgorbionista', authorId: 'u2', date: new Date().toISOString(), comments: [] },
  ];
  _cache.users = [
    { id: 'admin', username: 'admin', email: 'admin@sgorbions.it', isAdmin: true, joined: new Date().toISOString() },
    { id: 'u1', username: 'collezionista99', email: 'test1@example.com', isAdmin: false, joined: new Date().toISOString(), nationalityCode: 'it', nationalityName: 'Italia' },
    { id: 'u2', username: 'sgorbionista', email: 'test2@example.com', isAdmin: false, joined: new Date().toISOString(), nationalityCode: 'fr', nationalityName: 'Francia' },
    { id: 'u3', username: 'slimecollector', email: 'test3@example.com', isAdmin: false, joined: new Date().toISOString(), nationalityCode: 'de', nationalityName: 'Germania' },
    { id: 'u4', username: 'sgorbio_fan', email: 'test4@example.com', isAdmin: false, joined: new Date().toISOString(), nationalityCode: 'es', nationalityName: 'Spagna' },
    { id: 'u5', username: 'moccio_king', email: 'test5@example.com', isAdmin: false, joined: new Date().toISOString(), nationalityCode: 'gb', nationalityName: 'Regno Unito' },
  ];
  // Simulate owned items for demo users (stored in localStorage)
  const demoOwned = {
    'u1': ['f1','f2','f3','f4'],   // collezionista99: 10+8+15+20 = 53 pt
    'u2': ['f1','f3','f5'],        // sgorbionista: 10+15+12 = 37 pt
    'u3': ['f2','f4','f6'],        // slimecollector: 8+20+7 = 35 pt
    'u4': ['f1','f6'],             // sgorbio_fan: 10+7 = 17 pt
    'u5': ['f5'],                  // moccio_king: 12 pt
  };
  Object.entries(demoOwned).forEach(([uid, ids]) => {
    localStorage.setItem('sgorbions_owned_' + uid, JSON.stringify(ids));
  });
  console.log('Demo data loaded');
}

async function initFirebase() {
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
  const { getFirestore, collection, doc, getDocs, getDoc, setDoc, addDoc, deleteDoc, updateDoc, onSnapshot, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
  fbApp = initializeApp(FIREBASE_CONFIG);
  db = getFirestore(fbApp);
  window._fb = { collection, doc, getDocs, getDoc, setDoc, addDoc, deleteDoc, updateDoc, onSnapshot, query, orderBy };
  console.log('Firebase ready');
  await loadAllData();
}

// ============================================================
//  CACHE (in-memory, replaces localStorage for shared data)
// ============================================================
let _cache = {
  series: [],
  figurines: [],
  posts: [],
  users: [],
  contact_messages: []
};

// Local-only (per-user) data still uses localStorage
const LOCAL = {
  get(k) { try { return JSON.parse(localStorage.getItem('sgorbions_' + k)) || null; } catch { return null; } },
  set(k,v) { localStorage.setItem('sgorbions_' + k, JSON.stringify(v)); }
};

function getData(k, def) {
  if (k.startsWith('owned_') || k === 'currentUser' || k === 'lang') {
    return LOCAL.get(k) || def;
  }
  return _cache[k] !== undefined ? _cache[k] : def;
}
function setData(k, v) {
  if (k.startsWith('owned_') || k === 'currentUser' || k === 'lang') {
    LOCAL.set(k, v);
    return;
  }
  _cache[k] = v;
}

// ============================================================
//  FIRESTORE HELPERS
// ============================================================
async function fsGetAll(collName) {
  if (!db) return [];
  try {
    const { collection, getDocs } = window._fb;
    const snap = await getDocs(collection(db, collName));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch(e) { console.error('fsGetAll', e); return []; }
}

async function fsSave(collName, item) {
  if (!db) return item;
  try {
    const { collection, doc, setDoc, addDoc } = window._fb;
    if (item.id) {
      const ref = doc(db, collName, item.id);
      await setDoc(ref, item, { merge: true });
      return item;
    } else {
      const ref = await addDoc(collection(db, collName), item);
      const saved = { ...item, id: ref.id };
      const { doc: docFn, setDoc: setDocFn } = window._fb;
      await setDocFn(docFn(db, collName, ref.id), saved);
      return saved;
    }
  } catch(e) { console.error('fsSave', e); return item; }
}

async function fsDelete(collName, id) {
  if (!db) return;
  try {
    const { doc, deleteDoc } = window._fb;
    await deleteDoc(doc(db, collName, id));
  } catch(e) { console.error('fsDelete', e); }
}

async function loadAllData() {
  showLoadingOverlay(true);
  try {
    _cache.series = await Promise.race([
      fsGetAll('series'),
      new Promise((_,reject) => setTimeout(() => reject(new Error('timeout')), 4000))
    ]);
    _cache.figurines = await fsGetAll('figurines');
    _cache.posts = await fsGetAll('posts');
    _cache.users = await fsGetAll('users');
    _cache.contact_messages = await fsGetAll('contact_messages');
    _cache.segnalazioni = await fsGetAll('segnalazioni');
    _cache.eventi = await fsGetAll('eventi');
    _cache.levels = await fsGetAll('levels');
    await loadAllOwnedFromFirebase();
    // seed admin if not present
    if (!_cache.users.find(u => u.username === 'admin')) {
      const adminUser = { id: 'admin', username: 'admin', email: 'admin@sgorbions.it', password: 'admin123', isAdmin: true, joined: new Date().toISOString() };
      await fsSave('users', adminUser);
      _cache.users.push(adminUser);
    }
  } catch(e) {
    console.warn('Firebase non disponibile, carico dati demo:', e.message);
    loadDemoData();
  }
  showLoadingOverlay(false);
  // Extra check: if still no data, load demo
  if (!_cache.series.length) loadDemoData();
  renderAll();
  updateNavUser();
}

function showLoadingOverlay(show) {
  let ov = document.getElementById('loading-overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'loading-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(14,10,26,0.92);z-index:9998;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;';
    ov.innerHTML = '<div style="font-family:var(--font-display);font-size:2rem;color:var(--accent);text-shadow:0 0 30px rgba(181,255,46,0.5);">SGORBIONS</div><div style="font-family:var(--font-ui);color:var(--muted);font-size:1rem;">Caricamento dati...</div><div style="width:200px;height:4px;background:var(--card2);border-radius:2px;overflow:hidden;"><div style="height:100%;background:linear-gradient(90deg,var(--accent3),var(--accent));animation:progress-anim 1.5s ease-in-out infinite;border-radius:2px;"></div></div><style>@keyframes progress-anim{0%{width:0%;margin-left:0}50%{width:70%;margin-left:0}100%{width:0%;margin-left:100%}}</style>';
    document.body.appendChild(ov);
  }
  ov.style.display = show ? 'flex' : 'none';
}

// ============================================================
//  CLOUDINARY UPLOAD
// ============================================================
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST', body: formData
  });
  const data = await res.json();
  if (data.secure_url) return data.secure_url;
  throw new Error('Upload failed');
}

// ============================================================
//  I18N
// ============================================================
const i18n = {
  en: {
    'nav.home':'Home','nav.catalog':'Catalog','nav.blog':'Blog','nav.wantlist':'My missing list','nav.classifica':'🏆 Ranking','nav.contact':'Contacts',
'profile.anon':'Appear anonymous in the ranking',
'classifica.anonInfo':'Want to stay private? You can <a href="#" onclick="showPage(\'profile\');return false;" style="color:var(--accent);">set your profile as anonymous</a> — your name will be hidden from other collectors.','nav.onlineSince':'| Online since 24.06.2026','profile.changeNat':'✏️ Change nationality','profile.changePwd':'🔑 Change password','profile.myInfo':'✏️ My info','profile.changePwd.title':'🔑 Change password','profile.changeNat.title':'Change nationality','admin.segnalazioni':'🔔 Comments','admin.eventi':'🔔 Events','admin.punteggi':'🏆 Scores','admin.risorse':'🗄️ Resources',
'admin.levels.heading':'🏆 User levels','admin.levels.desc':'Define levels based on score. Each level activates from its minimum score upward.',
'admin.risorse.title':'🗄️ Resources','admin.email.thisMonth':'Emails sent this month','admin.email.plan':'Free EmailJS plan: 200 emails/month (resets on the 1st of each month).',
'admin.email.fix':'Fix counter:','admin.save':'Save',
'admin.firebase.plan':'Free plan (Spark): 1 GB storage, 50,000 reads/day, 20,000 writes/day.',
'admin.firebase.docs':'total documents',
'admin.cloudinary.plan':'Free plan: 25 credits/month (storage + transformations + bandwidth).',
'admin.cloudinary.link':'For updated details go to <a href="https://console.cloudinary.com" target="_blank" style="color:var(--accent);">console.cloudinary.com</a>.',
'admin.eventi.title':'System events','admin.segnalazioni.title':'User comments','admin.eventi.markRead':'✓ Mark all as read',
'admin.user.save':'Save changes','admin.user.reset':'🔑 Reset password','admin.user.delete':'🗑️ Delete user',
'admin.user.joined':'Member since','admin.user.lastlogin':'Last login','admin.user.level':'Level',
'admin.user.nome':'First name','admin.user.cognome':'Last name','admin.user.sesso':'Gender','admin.user.anni':'Years collecting',
'admin.user.role':'User type','admin.user.collector':'Collector','admin.user.admin':'Admin',
'form.username':'Username','form.email':'E-mail','contact.title':'Contact <span class=\'hi\'>the administrator</span>',
'contact.intro':'Found a rare piece not listed on the site?<br>Want more information about Sgorbions?<br>Want to contribute to the site?<br>Want to report an error?<br>Or just want to compliment the admin?<br><br>For any of these, send us a message!',
'form.name':'Name','contact.email.ph':'your@email.com','contact.context':'Question context','contact.message':'Question (or message)','contact.send':'Send message 🚀',
'contact.info':'Contact information','contact.responseTime':'Average response time','contact.responseDesc':'Usually within a few hours','newsletter.title':'Send Newsletter','newsletter.subject':'Subject','newsletter.subject.ph':'e.g. New series added!','newsletter.body':'Message body','newsletter.body.ph':'Write the message for selected users...','newsletter.recipients':'Recipients','newsletter.selectAll':'Select all','newsletter.deselectAll':'Deselect all','newsletter.send':'📧 Send to selected users','newsletter.log':'Latest emails sent','classifica.best':'Best collectors ranking','classifica.levels':'Sgorbions Collector Levels','admin.levels.addEdit':'Add / edit level','admin.levels.nameIt':'Name (IT)','admin.levels.nameEn':'Name (EN)','admin.levels.minScore':'Min. score','admin.levels.save':'Save level','hero.tagline':'Made with 💚 by collectors, for collectors.','profile.saved':'✅ Information saved!','banner.wip':'🚧   WEBSITE UNDER CONSTRUCTION   🚧',
    'nav.login':'Login','nav.register':'Registrati','nav.logout':'Logout',
    'hero.eyebrow':'🇮🇹 Italy\'s Wildest 90s Collectibles',
    'hero.sub':'Collector\'s Universe','hero.myvsTotal':'Mine / Total','hero.challenge':'Challenge others','hero.challengeDesc':'Challenge other collectors to see who has the biggest collection. You can also choose to appear anonymously.','hero.desc':'The definitive unofficial database dedicated to the legendary Italian sticker series from the \'90s.',
    'hero.nota':'<strong style="color:var(--accent);">NOTE:</strong><br><br>This site is purely dedicated to collecting and sharing information among collectors. It is not a sales site. Its sole purpose is to connect collectors from around the world, help them find material they don\'t own, and meet other collectors to trade with.<br><br>The information on this site reflects the knowledge of the administrator and does not claim to be official.','hero.cta1':'Explore the Sgorbions catalog!','hero.cta2':'Start collecting Sgorbions',
    'hero.stat1':'Series','hero.stat2':'Stickers','hero.stat3':'Collectors',
    'home.featured.eyebrow':'Featured Series','home.featured.title':'Explore the Slime World','home.featured.sub':'Every series carefully documented with original artwork, descriptions and rarity info.',
    'home.featured.btn':'View All Series →',
    'home.how.eyebrow':'How It Works','home.how.title':'Your Collection, Organized',
    'how.1.title':'Browse the Catalog','how.1.desc':'Explore all Sgorbions series and stickers, complete with photos and descriptions.',
    'how.2.title':'Mark Your Stickers','how.2.desc':'Toggle which stickers you own and track your completion percentage per series.',
    'how.3.title':'Connect & Ask','how.3.desc':'Post questions and get answers from the owner and fellow collectors.',
    'how.4.title':'Your Profile','how.4.desc':'View your profile info and decide what to share with other collectors.','how.4.desc':'Vedi le informazioni del tuo profilo e decidi quali vuoi condividere con gli altri collezionisti.',
    'catalog.title':'The Catalog','catalog.sub':'All Sgorbions series ever released','catalog.addseries':'+ Add Series','catalog.search':'Search series...','catalog.empty':'No series yet. Admin can add them!',
    'back':'Back to Catalog','catalog.stickers':'Stickers','catalog.albums':'Albums','catalog.extras':'Extra Material','catalog.sections':'Sections','catalog.loading':'loading...','catalog.haveall':'✅ Have it all','catalog.havenone':'❌ Have nothing','catalog.bulkscore':'⭐ Series score','catalog.add':'+ Add','catalog.itemsearch':'Search stickers...','catalog.tableview':'📋 Table view','detail.owned':'Owned','detail.addfig':'+ Add Sticker',
    'blog.title':'Q&A & Blog','blog.sub':'Ask questions, share news and discoveries','blog.post':'+ New question / News','blog.empty':'No posts yet. Start the conversation!',
    'contact.eyebrow':'Get In Touch','contact.title':"Contatta l'amministratore",'contact.sub':'Have a rare find? Want to contribute? Drop a message!',
    'contact.info.title':"Let's talk Sgorbions",'contact.email':'Email','contact.location':'Location','contact.location.val':'Italy 🇮🇹','contact.resp':'Response Time','contact.resp.val':'Usually within 24–48 hours',
    'form.name':'Your Name','form.name.ph':'Sgorbio Fan','form.email':'E-mail','form.subject':'Contesto della domanda','form.subject.ph':'I found a rare Sgorbio!','form.message':'Domanda (o messaggio)','form.message.ph':'Tell me everything...','form.send':'Invia messaggio 🚀',
    'form.username':'Username','form.password':'Password',
    'form.series.name':'Series Name','form.series.year':'Year','form.series.count':'Number of Stickers','form.series.desc':'Description','form.series.desc.it':'Description (Italian)','form.series.cover':'Cover Image',
    'form.click':'Click to upload','form.drag':'or drag and drop',
    'form.fig.number':'Number','form.fig.name':'Name','form.fig.desc':'Description','form.fig.image':'Image',
    'form.post.type':'Post Type','form.post.title':'Title','form.post.body':'Content','form.post.question':'❓ Question','form.post.news':'📢 News / Discovery',
    'form.reply.placeholder':'Write a reply...','comment.admin':'Owner','comment.login':'Log in to reply',
    'auth.title':'Welcome Back','auth.login':'Login','auth.register':'Registrati','auth.login.btn':'Sign In','auth.reg.btn':'Create Account',
    'modal.bulkscore.title':'⭐ Series Score','modal.bulkscore.desc':'Assign the same score to all items in the current section. You can edit individual scores later.','modal.bulkscore.label':'Score per item','modal.bulkscore.apply':'Apply to all','contact.q1':'Want to know more about Sgorbions?','contact.q2':'Want to report an error?','contact.q3':'Or just want to compliment the admin?','contact.cta':'For any of these, send us a message!','contact.context':'Question context','contact.message':'Question (or message)','contact.send':'Send message 🚀','wantlist.desc':'Here are the stickers you need to complete your Sgorbions collection','wantlist.export':'Export my list','modal.figdetail.title':'Sticker detail','modal.segnala.send':'Submit report','profile.anni':'Years collecting Sgorbions','profile.sliderHint':'Try moving the slider! 👆','pwd.current':'Current password','pwd.resetDesc':'Enter your email address. We will send you a temporary password.','modal.series.title':'Add new series','modal.series.edit':'Edit series','modal.series.save':'Save series','form.series.hasSizes':'Stickers with different sizes','form.series.hasSubseries':'Has subseries','form.series.hasVariations':'Has variations','form.series.descPlaceholder':'Describe this series...','form.fig.subseries':'Subseries','form.fig.subseriesHint':'If present, replaces the number','form.fig.size':'Size','form.fig.variations':'Number of existing variations','form.fig.variationsHint':'Number printed on the back of the sticker (default: 1)','form.fig.score':'Score','form.fig.scoreHint':'Points assigned to whoever owns this item','form.fig.descPlaceholder':'Describe this sticker...',
    'modal.fig.title':'Add Sticker','modal.fig.save':'Save Sticker',
    'modal.post.title':'New Post','modal.post.save':'Publish post',
    'profile.title':'My Profile','profile.owned':'Stickers Owned','profile.series':'Series Tracked','profile.collection':'My Collection',
    'admin.title':'Admin Panel','admin.series':'Series','admin.figurines':'Figurines','admin.blog':'Blog','admin.contacts':'Messages','admin.users':'Users',
    'admin.series.title':'Manage Series','admin.figurines.title':'Manage Stickers','admin.blog.title':'Manage Q&A / Blog','admin.contacts.title':'Contact Messages','admin.users.title':'Registered Users',
    'footer.desc':'The unofficial fan database dedicated to the legendary Italian figurine collection from the early 1990s. Made with 💚 by collectors, for collectors.',
    'footer.nav':'Navigation','footer.account':'Account','footer.copy':'© 2026 figurinesgorbions.it — Unofficial fan site.',
    'owned.toggle':'I own this','owned.yes':'✓ Owned'
  },
  it: {
    'catalog.stickers':'Figurine','catalog.albums':'Album','catalog.extras':'Altro Materiale','catalog.sections':'Sezioni','catalog.loading':'caricamento...','catalog.haveall':'✅ Ho tutto','catalog.havenone':'❌ Non ho niente','catalog.bulkscore':'⭐ Punteggio serie','catalog.add':'+ Aggiungi','catalog.itemsearch':'Cerca figurine...','catalog.tableview':'📋 Vista tabellare','nav.home':'Home','nav.catalog':'Catalogo','nav.blog':'Blog','nav.wantlist':'Mancoliste','nav.classifica':'🏆 Classifica','nav.contact':'Contatti',
'profile.anon':'Appari anonimo in classifica',
'classifica.anonInfo':'Vuoi restare riservato? Puoi <a href="#" onclick="showPage(\'profile\');return false;" style="color:var(--accent);">impostare il tuo profilo come anonimo</a> — il tuo nome sarà nascosto agli altri collezionisti.','nav.onlineSince':'| Online dal 24.06.2026','profile.changeNat':'✏️ Cambia nazionalità','profile.changePwd':'🔑 Cambia password','profile.myInfo':'✏️ Le mie info','profile.changePwd.title':'🔑 Cambia password','profile.changeNat.title':'Cambia nazionalità','admin.segnalazioni':'🔔 Segnalazioni','admin.eventi':'🔔 Eventi','admin.punteggi':'🏆 Punteggi','admin.risorse':'🗄️ Risorse',
'admin.levels.heading':'🏆 Livelli utente','admin.levels.desc':'Definisci i livelli in base al punteggio. Ogni livello si attiva dal punteggio minimo indicato in su.',
'admin.risorse.title':'🗄️ Risorse','admin.email.thisMonth':'Email inviate questo mese','admin.email.plan':'Piano gratuito EmailJS: 200 email/mese (si azzera il 1° di ogni mese).',
'admin.email.fix':'Correggi contatore:','admin.save':'Salva',
'admin.firebase.plan':'Piano gratuito (Spark): 1 GB storage, 50.000 letture/giorno, 20.000 scritture/giorno.',
'admin.firebase.docs':'documenti totali',
'admin.cloudinary.plan':'Piano gratuito: 25 crediti/mese (storage + trasformazioni + banda).',
'admin.cloudinary.link':'Per il dettaglio aggiornato vai su <a href="https://console.cloudinary.com" target="_blank" style="color:var(--accent);">console.cloudinary.com</a>.',
'admin.eventi.title':'Eventi di sistema','admin.segnalazioni.title':'Segnalazioni utenti','admin.eventi.markRead':'✓ Segna tutte come lette',
'admin.user.save':'Salva modifiche','admin.user.reset':'🔑 Reset password','admin.user.delete':'🗑️ Elimina utente',
'admin.user.joined':'Iscritto dal','admin.user.lastlogin':'Ultima login','admin.user.level':'Livello',
'admin.user.nome':'Nome','admin.user.cognome':'Cognome','admin.user.sesso':'Sesso','admin.user.anni':'Anni di collezionismo',
'admin.user.role':'Tipologia di utente','admin.user.collector':'Collezionista','admin.user.admin':'Admin',
'form.username':'Username','form.email':'E-mail','contact.title':'Contatta <span class=\'hi\'>l\'amministratore</span>',
'contact.intro':'Hai trovato qualche pezzo raro che non è censito nel sito?<br>Vuoi avere altre informazioni sugli Sgorbions?<br>Vuoi contribuire al mantenimento del sito?<br>Vuoi segnalare un errore?<br>O vuoi semplicemente fare i complimenti all\'amministratore?<br><br>Per una qualsiasi di queste cose, inviaci un messaggio!',
'form.name':'Nome','contact.email.ph':'la-tua@e-mail.com','contact.context':'Contesto della domanda','contact.message':'Domanda (o messaggio)','contact.send':'Invia messaggio 🚀',
'contact.info':'Informazioni di contatto','contact.responseTime':'Tempo di risposta medio','contact.responseDesc':'Di solito in poche ore','newsletter.title':'Invia Newsletter','newsletter.subject':'Oggetto','newsletter.subject.ph':'es. Nuova serie aggiunta!','newsletter.body':'Corpo del messaggio','newsletter.body.ph':'Scrivi il messaggio per gli utenti selezionati...','newsletter.recipients':'Destinatari','newsletter.selectAll':'Seleziona tutti','newsletter.deselectAll':'Deseleziona tutti','newsletter.send':'📧 Invia agli utenti selezionati','newsletter.log':'Ultime e-mail inviate','classifica.best':'Classifica dei migliori collezionisti','classifica.levels':'Livelli di Collezionista Sgorbions','admin.levels.addEdit':'Aggiungi / modifica livello','admin.levels.nameIt':'Nome (IT)','admin.levels.nameEn':'Nome (EN)','admin.levels.minScore':'Punteggio minimo','admin.levels.save':'Salva livello','hero.tagline':'Fatto con 💚 da collezionisti, per collezionisti.','profile.saved':'✅ Informazioni salvate!','banner.wip':'🚧   SITO WEB IN COSTRUZIONE   🚧',
    'nav.login':'Accedi','nav.register':'Registrati','nav.logout':'Esci',
    'hero.eyebrow':'🇮🇹 Le Figurine Più Orribili degli Anni \'90',
    'hero.sub':'L\'Universo dei Collezionisti','hero.myvsTotal':'Le mie / Totale','hero.challenge':'Sfida gli altri','hero.challengeDesc':'Sfida gli altri collezionisti a chi ha la collezione più grande. Puoi anche scegliere di apparire in modo anonimo.','hero.desc':'Il database non ufficiale definitivo dedicato alla leggendaria serie italiana degli anni \'90.',
    'hero.nota':'<strong style="color:var(--accent);">NOTA:</strong><br><br>Questo sito ha un puro scopo di collezionismo e scambio di informazioni tra collezionisti. Non è un sito di vendita. Il puro scopo del sito è mettere i collezionisti di tutto il mondo in contatto tra loro, oltre che consentire loro di cercare materiale non in loro possesso, e trovare altri collezionisti con cui fare scambi.<br><br>Le informazioni contenute in questo sito rappresentano la conoscenza dell\'amministratore, e non pretendono di essere un\'informazione ufficiale.','hero.cta1':'Esplora il catalogo Sgorbions!','hero.cta2':'Inizia a collezionare gli Sgorbions',
    'hero.stat1':'Serie','hero.stat2':'Figurine','hero.stat3':'Collezionisti',
    'home.featured.eyebrow':'Serie in Evidenza','home.featured.title':'Esplora il Mondo del Moccio','home.featured.sub':'Ogni serie accuratamente documentata con illustrazioni originali, descrizioni e info sulla rarità.',
    'home.featured.btn':'Vedi Tutte le Serie →',
    'home.how.eyebrow':'Come Funziona','home.how.title':'La Tua Collezione, Organizzata',
    'how.1.title':'Sfoglia il Catalogo','how.1.desc':'Esplora tutte le serie di Sgorbions con foto e descrizioni complete.',
    'how.2.title':'Segna le Tue Figurine','how.2.desc':'Indica quali figurine hai e traccia la percentuale di completamento per ogni serie.',
    'how.3.title':'Connettiti e Chiedi','how.3.desc':"Fai domande e ricevi risposte dall'amministratore e dagli altri collezionisti.",
    'how.4.title':'Il Tuo Profilo','how.4.desc':'Vedi le informazioni del tuo profilo e decidi quali vuoi condividere con gli altri collezionisti.',
    'catalog.title':'Il Catalogo','catalog.sub':'Tutte le serie di Sgorbions mai pubblicate','catalog.addseries':'+ Aggiungi Serie','catalog.search':'Cerca serie...','catalog.empty':'Nessuna serie ancora. L\'admin può aggiungerle!',
    'back':'Torna al Catalogo','detail.owned':'In mio possesso','detail.addfig':'+ Aggiungi Figurina',
    'blog.title':'Blog / D&R','blog.sub':'Fai domande, condividi novità e scoperte','blog.post':'+ Nuova domanda / Notizia','blog.empty':'Nessun post ancora. Inizia la conversazione!',
    'contact.eyebrow':'Mettiti in Contatto','contact.title':"Contatta l'amministratore",'contact.sub':'Hai trovato un pezzo raro? Vuoi contribuire? Scrivici!',
    'contact.info.title':'Parliamo di Sgorbions','contact.email':'Email','contact.location':'Posizione','contact.location.val':'Italia 🇮🇹','contact.resp':'Tempo di risposta','contact.resp.val':'Di solito entro 24–48 ore',
    'form.name':'Il Tuo Nome','form.name.ph':'Fan degli Sgorbions','form.email':'Indirizzo E-mail','form.subject':'Oggetto','form.subject.ph':'Ho trovato uno Sgorbio raro!','form.message':'Messaggio','form.message.ph':'Dimmi tutto...','form.send':'Invia messaggio 🚀',
    'form.username':'Nome utente','form.password':'Password',
    'form.series.name':'Nome della Serie','form.series.year':'Anno','form.series.count':'Numero di Figurine','form.series.desc':'Descrizione','form.series.desc.it':'Descrizione (Italiano)','form.series.cover':'Immagine di Copertina',
    'form.click':'Clicca per caricare','form.drag':'o trascina e rilascia',
    'form.fig.number':'Numero','form.fig.name':'Nome','form.fig.desc':'Descrizione','form.fig.image':'Immagine',
    'form.post.type':'Tipo di Post','form.post.title':'Titolo','form.post.body':'Contenuto','form.post.question':'❓ Domanda','form.post.news':'📢 Notizia / Scoperta',
    'form.reply.placeholder':'Scrivi una risposta...','comment.admin':'Amministratore','comment.login':'Accedi per rispondere',
    'auth.title':'Bentornato','auth.login':'Accedi','auth.register':'Registrati','auth.login.btn':'Entra','auth.reg.btn':'Conferma registrazione',
    'modal.bulkscore.title':'⭐ Punteggio Serie','modal.bulkscore.desc':'Assegna lo stesso punteggio a tutti gli oggetti della sezione corrente. Potrai modificare i singoli punteggi in seguito.','modal.bulkscore.label':'Punteggio per ogni oggetto','modal.bulkscore.apply':'Applica a tutti','contact.q1':'Vuoi avere altre informazioni sugli Sgorbions?','contact.q2':'Vuoi segnalare un errore?','contact.q3':'O vuoi semplicemente fare i complimenti all\'amministratore?','contact.cta':'Per una qualsiasi di queste cose, inviaci un messaggio!','contact.context':'Contesto della domanda','contact.message':'Domanda (o messaggio)','contact.send':'Invia messaggio 🚀','wantlist.desc':'Ecco le figurine che ti mancano per completare la tua collezione Sgorbions','wantlist.export':'Esporta la mia lista','modal.figdetail.title':'Dettaglio figurina','modal.segnala.send':'Invia segnalazione','profile.anni':'Anni di collezionismo Sgorbions','profile.sliderHint':'Prova a spostare il cursore! 👆','pwd.current':'Password attuale','pwd.resetDesc':'Inserisci il tuo indirizzo e-mail. Ti invieremo una password temporanea.','modal.series.title':'Aggiungi nuova serie','modal.series.edit':'Modifica serie','modal.series.save':'Salva serie','form.series.hasSizes':'Figurine con taglie differenti','form.series.hasSubseries':'Ha sottoserie','form.series.hasVariations':'Ha variazioni','form.series.descPlaceholder':'Descrivi questa serie...','form.fig.subseries':'Sottoserie','form.fig.subseriesHint':'Se presente, sostituisce il numero','form.fig.size':'Taglia','form.fig.variations':'Numero di variazioni esistenti','form.fig.variationsHint':'Numero stampato sul retro della figurina (default: 1)','form.fig.score':'Punteggio','form.fig.scoreHint':'Punti assegnati a chi possiede questo oggetto','form.fig.descPlaceholder':'Descrivi questa figurina...',
    'modal.fig.title':'Aggiungi Figurina','modal.fig.save':'Salva figurina',
    'modal.post.title':'Nuovo Post','modal.post.save':'Pubblica Post',
    'profile.title':'Il Mio Profilo','profile.owned':'Figurine Possedute','profile.series':'Serie Tracciate','profile.collection':'La Mia Collezione',
    'admin.title':'Pannello Admin','admin.series':'Serie','admin.figurines':'Figurine','admin.blog':'Blog','admin.contacts':'Messaggi','admin.users':'Utenti',
    'admin.series.title':'Gestisci Serie','admin.figurines.title':'Gestisci Figurine','admin.blog.title':'Gestisci D&R / Blog','admin.contacts.title':'Messaggi Ricevuti','admin.users.title':'Utenti Registrati',
    'footer.desc':'Il database fan non ufficiale dedicato alla leggendaria collezione di figurine italiana degli anni \'90. Fatto con 💚 da collezionisti, per collezionisti.',
    'footer.nav':'Navigazione','footer.account':'Account','footer.copy':'© 2026 figurinesgorbions.it — Sito fan non ufficiale.',
    'owned.toggle':'Ce l\'ho','owned.yes':'✓ Ce l\'ho'
  }
};

let currentLang = LOCAL.get('lang') || 'en';

function t(key) { return (i18n[currentLang] || i18n.en)[key] || (i18n.en)[key] || key; }

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}

function setLang(lang, byUser = false) {
  currentLang = lang;
  LOCAL.set('lang', lang);
  if (byUser && currentUser) LOCAL.set('lang_set_by_user_' + currentUser.id, true);
  // Update flag button
  const btn = document.getElementById('lang-current-btn');
  if (btn) {
    const flags = { en: 'gb', it: 'it' };
    btn.style.backgroundImage = 'url(https://flagcdn.com/w40/' + (flags[lang] || 'gb') + '.png)';
  }
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', (lang === 'en' && b.textContent === '🇬🇧') || (lang === 'it' && b.textContent === '🇮🇹'));
  });
  const eyebrow = document.getElementById('classifica-eyebrow');
  if (eyebrow) eyebrow.textContent = lang === 'it' ? 'Migliori Collezionisti' : 'Top Collectors';
  applyI18n();
  renderAll();
}

// ============================================================
//  APP STATE
// ============================================================
let currentUser = LOCAL.get('currentUser') || null;
let currentSeriesId = null;
let editingSeriesImg = null;
let editingFigImg = null;


// Admin seeding is handled in loadAllData() after Firebase is ready

// ============================================================
//  NAVIGATION
// ============================================================
function showAdminTab(tab) {
  // Show page-profile but hide profile content, show only admin panel
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const profilePage = document.getElementById('page-profile');
  if (profilePage) profilePage.classList.add('active');
  const sd = document.getElementById('series-detail');
  if (sd) sd.style.display = 'none';
  // Hide profile content, show admin panel
  const profileContent = document.getElementById('profile-content');
  if (profileContent) profileContent.style.display = 'none';
  const panel = document.getElementById('admin-panel');
  if (panel) panel.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  adminTab(tab);
}

function showPage(page) {
  const protectedPages = ['catalog', 'blog', 'classifica', 'wantlist', 'profile', 'newsletter'];
  if (protectedPages.includes(page) && !currentUser) {
    openAuth('login');
    return;
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('series-detail').style.display = 'none';
  const el = document.getElementById('page-' + page);
  if (el) { el.classList.add('active'); }
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (page === 'catalog') renderCatalog();
  if (page === 'blog') renderBlog();
  if (page === 'profile') {
    const pc = document.getElementById('profile-content');
    if (pc) pc.style.display = '';
    const ap = document.getElementById('admin-panel');
    if (ap) ap.style.display = currentUser?.isAdmin ? 'block' : 'none';
    renderProfile();
  }
  if (page === 'home') { renderHomeStats(); renderHomeSeries(); }
  if (page === 'wantlist') renderWantlist();
  if (page === 'newsletter') { renderNewsletterUsers(); renderEmailLog(); }
  if (page === 'classifica') renderClassifica();
  if (page === 'admin') adminTab('series');
  initReveal();
}

// ============================================================
//  AUTH
// ============================================================
// openAuth moved to top
async function doLogin() {
  const u = document.getElementById('login-username').value.trim();
  const p = document.getElementById('login-password').value;
  const authErr = document.getElementById('auth-error');
  if (authErr) authErr.style.display = 'none';
  if (!u || !p) { if (authErr) { authErr.style.display = ''; authErr.textContent = 'Inserisci username e password'; return; } toast('Inserisci username e password', 'error'); return; }
  // Se Firebase non ha ancora caricato gli utenti, ricarica
  if (!_cache.users || _cache.users.length === 0) {
    toast('Connessione in corso...', 'success');
    _cache.users = await fsGetAll('users');
  }
  const users = getData('users', []);
  const user = users.find(x => x.username === u && x.password === p);
  if (!user) { const ae = document.getElementById('auth-error'); if (ae) { ae.style.display = ''; ae.textContent = 'Username o password errati'; } else toast('Username o password errati', 'error'); return; }
  user.lastLogin = new Date().toISOString();
  currentUser = user;
  LOCAL.set('currentUser', user);
  // Set language based on nationality only if user hasn't explicitly set a language
  if (!LOCAL.get('lang_set_by_user_' + user.id)) {
    const lang = (user.nationalityCode === 'it') ? 'it' : 'en';
    setLang(lang);
    applyTranslations();
  }
  fsSave('users', user);
  if (!user.isAdmin) logEvent('login', 'Login effettuato da: ' + user.username, { read: true });
  await loadAllOwnedFromFirebase();
  closeModal('auth-modal');
  updateNavUser();
  showProfileInviteIfNeeded();
  const welcomeEl = document.getElementById('hero-welcome-msg');
  if (welcomeEl) {
    welcomeEl.style.display = '';
    welcomeEl.textContent = 'Bentornato, ' + user.username + '! 👾';
    setTimeout(() => { welcomeEl.style.display = 'none'; }, 4000);
  }
}
async function doRegister() {
  const u = document.getElementById('reg-username').value.trim();
  const e = document.getElementById('reg-email').value.trim();
  const p = document.getElementById('reg-password').value;
  const regErr = document.getElementById('reg-error');
  if (regErr) regErr.style.display = 'none';
  if (!u || !e || !p) { if (regErr) { regErr.style.display = ''; regErr.textContent = 'Compila tutti i campi'; return; } toast((currentLang === 'it' ? 'Compila tutti i campi' : 'Please fill in all fields'), 'error'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { if (regErr) { regErr.style.display = ''; regErr.textContent = 'Inserisci un indirizzo e-mail valido'; return; } toast('Inserisci un indirizzo e-mail valido', 'error'); return; }
  if (p.length < 6) { const re = document.getElementById('reg-error'); if (re) { re.style.display = ''; re.textContent = 'La password deve avere almeno 6 caratteri'; return; } toast('La password deve avere almeno 6 caratteri', 'error'); return; }
  let users = getData('users', []);
  if (users.find(x => x.username === u)) { const re = document.getElementById('reg-error'); if (re) { re.style.display = ''; re.textContent = 'Nome utente già in uso'; return; } toast('Nome utente già in uso', 'error'); return; }
  const natCode = document.getElementById('reg-nationality-code')?.value || '';
  const natName = document.getElementById('reg-nationality-name')?.value || '';
  const newUser = { id: Date.now().toString(), username: u, email: e, password: p, isAdmin: false, joined: new Date().toISOString(), nationalityCode: natCode, nationalityName: natName };
  const saved = await fsSave('users', newUser);
  _cache.users.push(saved);
  currentUser = saved;
  LOCAL.set('currentUser', saved);
  closeModal('auth-modal');
  updateNavUser();
  sendWelcomeEmail(saved);
  const welcomeEl2 = document.getElementById('hero-welcome-msg');
  if (welcomeEl2) {
    welcomeEl2.style.display = '';
    welcomeEl2.textContent = 'Benvenuto nella famiglia Sgorbions, ' + u + '! 🎉';
    setTimeout(() => { welcomeEl2.style.display = 'none'; }, 4000);
  }
  // Set language based on nationality at first registration
  if (!LOCAL.get('lang_set_by_user_' + saved.id)) {
    const lang = (saved.nationalityCode === 'it') ? 'it' : 'en';
    setLang(lang);
    applyTranslations();
  }
  logEvent('new_user', 'Nuovo utente registrato: ' + u);
  showProfileInviteIfNeeded();
}
// ============================================================
//  PROFILE INFO
// ============================================================
function showProfileInviteIfNeeded() {
  if (!currentUser) return;
  const hasInfo = currentUser.nome || currentUser.cognome || currentUser.eta || currentUser.sesso || currentUser.anniCollezionismo;
  if (!hasInfo) {
    setTimeout(() => {
      // Clear fields before showing
      document.getElementById('invite-nome').value = '';
      document.getElementById('invite-cognome').value = '';
      document.getElementById('invite-eta').value = '';
      document.getElementById('invite-sesso').value = '';
      document.getElementById('invite-anni').value = '';
      // Show login buttons (Dopo / Salva e continua)
      document.getElementById('invite-modal-btns-login').style.display = 'flex';
      document.getElementById('invite-modal-btns-profile').style.display = 'none';
      document.getElementById('profile-invite-modal').classList.remove('hidden');
    }, 1500);
  }
}

function openProfileInfoModal() {
  document.getElementById('invite-nome').value = currentUser.nome || '';
  document.getElementById('invite-cognome').value = currentUser.cognome || '';
  document.getElementById('invite-eta').value = currentUser.eta || '';
  document.getElementById('invite-sesso').value = currentUser.sesso || '';
  document.getElementById('invite-anni').value = currentUser.anniCollezionismo || '';
  // Show profile buttons, hide login buttons
  document.getElementById('invite-modal-btns-login').style.display = 'none';
  document.getElementById('invite-modal-btns-profile').style.display = 'flex';
  document.getElementById('profile-invite-modal').classList.remove('hidden');
}

async function saveProfileInvite() {
  const nome = document.getElementById('invite-nome').value.trim();
  const cognome = document.getElementById('invite-cognome').value.trim();
  const eta = document.getElementById('invite-eta').value;
  const sesso = document.getElementById('invite-sesso').value;
  const anniCollezionismo = document.getElementById('invite-anni').value;

  currentUser = { ...currentUser, nome, cognome, eta: eta ? +eta : null, sesso, anniCollezionismo: anniCollezionismo ? +anniCollezionismo : null };
  LOCAL.set('currentUser', currentUser);

  const users = getData('users', []);
  const idx = users.findIndex(u => u.id === currentUser.id);
  if (idx >= 0) {
    users[idx] = { ...users[idx], nome, cognome, eta: eta ? +eta : null, sesso, anniCollezionismo: anniCollezionismo ? +anniCollezionismo : null };
    _cache.users = users;
    await fsSave('users', users[idx]);
  }

  closeModal('profile-invite-modal');
  const msg = document.getElementById('profile-save-msg');
  if (msg) {
    msg.style.display = '';
    setTimeout(() => { msg.style.display = 'none'; }, 3000);
  }
}

// ============================================================
//  CHANGE PASSWORD
// ============================================================
function openDemoToggleModal() {
  // Reset demo toggle state
  const btn = document.getElementById('demo-toggle-btn');
  if (btn) {
    btn.classList.remove('on');
    btn._on = false;
    const label = document.getElementById('demo-toggle-label');
    if (label) label.style.color = 'var(--muted)';
  }
  document.getElementById('demo-toggle-modal').classList.remove('hidden');
}

function toggleDemoBtn() {
  const btn = document.getElementById('demo-toggle-btn');
  const label = document.getElementById('demo-toggle-label');
  if (!btn) return;
  btn._on = !btn._on;
  btn.classList.toggle('on', btn._on);
  if (label) label.style.color = btn._on ? '#4db8ff' : 'var(--muted)';
}

function openChangePwdModal() {
  document.getElementById('change-pwd-current').value = '';
  document.getElementById('change-pwd-new').value = '';
  document.getElementById('change-pwd-confirm').value = '';
  const fb = document.getElementById('change-pwd-feedback');
  fb.style.display = 'none';
  document.getElementById('change-pwd-modal').classList.remove('hidden');
}

async function doChangePassword() {
  const current = document.getElementById('change-pwd-current').value;
  const newPwd = document.getElementById('change-pwd-new').value;
  const confirm = document.getElementById('change-pwd-confirm').value;
  const fb = document.getElementById('change-pwd-feedback');

  const showError = (msg) => {
    fb.style.cssText = 'display:block;background:rgba(255,100,100,0.1);border:1px solid rgba(255,100,100,0.3);color:#ff6464;padding:0.6rem 1rem;border-radius:8px;font-size:0.88rem;';
    fb.textContent = msg;
  };

  if (!current || !newPwd || !confirm) { showError('Compila tutti i campi.'); return; }
  if (currentUser.password !== current) { showError('La password attuale non è corretta.'); return; }
  if (newPwd.length < 6) { showError('La nuova password deve essere di almeno 6 caratteri.'); return; }
  if (newPwd !== confirm) { showError('Le due password non corrispondono.'); return; }

  currentUser.password = newPwd;
  currentUser.mustChangePassword = false;
  LOCAL.set('currentUser', currentUser);

  const users = getData('users', []);
  const idx = users.findIndex(u => u.id === currentUser.id);
  if (idx >= 0) {
    users[idx].password = newPwd;
    users[idx].mustChangePassword = false;
    _cache.users = users;
    await fsSave('users', users[idx]);
  }

  fb.style.cssText = 'display:block;background:rgba(181,255,46,0.1);border:1px solid rgba(181,255,46,0.2);color:var(--accent);padding:0.6rem 1rem;border-radius:8px;font-size:0.88rem;';
  fb.textContent = '✅ Password aggiornata con successo!';
  setTimeout(() => closeModal('change-pwd-modal'), 1500);
}

// ============================================================
//  RESET PASSWORD
// ============================================================
function openResetModal() {
  closeModal('auth-modal');
  document.getElementById('reset-email-input').value = '';
  const fb = document.getElementById('reset-pwd-feedback');
  fb.style.display = 'none';
  document.getElementById('reset-pwd-modal').classList.remove('hidden');
}

function generateTempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

async function doResetPassword() {
  const email = document.getElementById('reset-email-input').value.trim();
  const fb = document.getElementById('reset-pwd-feedback');
  const btn = document.querySelector('#reset-pwd-modal .btn-primary');

  if (!email) { 
    fb.style.cssText = 'display:block;background:rgba(255,100,100,0.1);border:1px solid rgba(255,100,100,0.3);color:#ff6464;padding:0.6rem 1rem;border-radius:8px;font-size:0.88rem;';
    fb.textContent = 'Inserisci il tuo indirizzo e-mail.';
    return; 
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fb.style.cssText = 'display:block;background:rgba(255,100,100,0.1);border:1px solid rgba(255,100,100,0.3);color:#ff6464;padding:0.6rem 1rem;border-radius:8px;font-size:0.88rem;';
    fb.textContent = 'Inserisci un indirizzo e-mail valido.';
    return;
  }

  // Find user by email
  const users = getData('users', []);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  // Always show success message (security: don't reveal if email exists)
  fb.style.cssText = 'display:block;background:rgba(181,255,46,0.1);border:1px solid rgba(181,255,46,0.2);color:var(--accent);padding:0.6rem 1rem;border-radius:8px;font-size:0.88rem;';
  fb.textContent = '✅ Se l\'indirizzo è registrato, riceverai una password temporanea via e-mail.';
  if (btn) btn.disabled = true;

  if (user) {
    const tempPwd = generateTempPassword();
    // Save temp password to user
    user.password = tempPwd;
    user.mustChangePassword = true;
    const allUsers = getData('users', []);
    const idx = allUsers.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      allUsers[idx] = user;
      _cache.users = allUsers;
      await fsSave('users', user);
    }
    // Send email
    await sendEmail(
      user.email,
      user.username,
      'Reset password — Sgorbions Collector',
      'Hai richiesto il reset della password.\n\nLa tua password temporanea è: ' + tempPwd + '\n\nAccedi con questa password e cambiala subito dal tuo profilo.'
    );
    incrementEmailCounter(1);
    // Log event
    logEvent('reset_pwd', 'Reset password richiesto per: ' + user.username);
  }

  setTimeout(() => {
    closeModal('reset-pwd-modal');
    if (btn) btn.disabled = false;
  }, 3000);
}

function logout() {
  currentUser = null;
  LOCAL.set('currentUser', null);
  updateNavUser();
  updateOwnedCounter();
  showPage('home');
  const welcomeEl = document.getElementById('hero-welcome-msg');
  if (welcomeEl) {
    welcomeEl.style.display = '';
    welcomeEl.textContent = currentLang === 'it' ? 'Arrivederci! A presto 👋' : 'Logged out. See you soon! 👋';
    setTimeout(() => { welcomeEl.style.display = 'none'; }, 4000);
  }
}
function updateNavUser() {
  const guestNav = document.getElementById('guest-nav');
  const userNav = document.getElementById('user-nav');
  const addSeriesBtn = document.getElementById('admin-add-series-btn');
  const wantlistLink = document.getElementById('nav-wantlist');
  const btnCollect = document.getElementById('btn-start-collecting');
  if (currentUser) {
    guestNav.style.display = 'none';
    userNav.style.display = 'flex';
    if (wantlistLink) wantlistLink.style.display = '';
    ['nav-catalog','nav-blog','nav-classifica'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = ''; });
    const nlBtn = document.getElementById('nav-newsletter-btn');
    if (nlBtn) nlBtn.style.display = currentUser.isAdmin ? '' : 'none';
    if (btnCollect) btnCollect.style.display = 'none';
    const homeContent = document.getElementById('home-logged-in-content');
    if (homeContent) homeContent.style.display = '';
    const heroStats = document.getElementById('hero-stats');
    if (heroStats) heroStats.style.display = '';
    if (document.getElementById('btn-explore-catalog')) document.getElementById('btn-explore-catalog').style.display = '';
    document.getElementById('nav-username').textContent = currentUser.username + (currentUser.isAdmin ? ' 👑' : '');
    const bellBtn = document.getElementById('nav-bell-btn');
    if (bellBtn) {
      bellBtn.style.display = currentUser.isAdmin ? '' : 'none';
      updateBellBadge();
    }
    const jsVerWrap = document.getElementById('nav-js-version-wrap');
    if (jsVerWrap) jsVerWrap.style.display = currentUser.isAdmin ? '' : 'none';
    const navAvatar = document.getElementById('nav-avatar');
    // Always reset first
    navAvatar.style.backgroundImage = '';
    navAvatar.style.backgroundSize = '';
    navAvatar.style.backgroundPosition = '';
    navAvatar.textContent = '';
    if (currentUser.avatar) {
      navAvatar.style.backgroundImage = 'url(' + currentUser.avatar + ')';
      navAvatar.style.backgroundSize = 'cover';
      navAvatar.style.backgroundPosition = 'center';
    } else {
      navAvatar.textContent = currentUser.username[0].toUpperCase();
    }
    if (addSeriesBtn) addSeriesBtn.style.display = currentUser.isAdmin ? '' : 'none';
  } else {
    guestNav.style.display = 'flex';
    userNav.style.display = 'none';
    if (addSeriesBtn) addSeriesBtn.style.display = 'none';
    if (wantlistLink) wantlistLink.style.display = 'none';
    const nlBtn2 = document.getElementById('nav-newsletter-btn');
    if (nlBtn2) nlBtn2.style.display = 'none';
    if (btnCollect) btnCollect.style.display = '';
    const homeContent2 = document.getElementById('home-logged-in-content');
    if (homeContent2) homeContent2.style.display = 'none';
    const bellBtn2 = document.getElementById('nav-bell-btn');
    if (bellBtn2) bellBtn2.style.display = 'none';
    ['nav-catalog','nav-blog','nav-classifica'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
    const heroStats2 = document.getElementById('hero-stats');
    if (heroStats2) heroStats2.style.display = 'none';
    if (document.getElementById('btn-explore-catalog')) document.getElementById('btn-explore-catalog').style.display = 'none';
  }
}
updateNavUser();

// ============================================================
//  SERIES
// ============================================================
function openAddSeriesModal(seriesId) {
  if (!currentUser?.isAdmin) { toast((currentLang === 'it' ? 'Solo per admin' : 'Admin only'), 'error'); return; }
  document.getElementById('edit-series-id').value = seriesId || '';
  document.getElementById('series-modal-title').textContent = seriesId ? t('modal.series.edit') : t('modal.series.title');
  document.getElementById('series-img-preview').style.display = 'none';
  editingSeriesImg = null;
  if (seriesId) {
    const s = getData('series', []).find(x => x.id === seriesId);
    if (s) {
      document.getElementById('series-name-input').value = s.name;
      document.getElementById('series-year-input').value = s.year;
      document.getElementById('series-count-input').value = s.count;
      document.getElementById('series-desc-input').value = s.desc;

      if (s.img) { const pr = document.getElementById('series-img-preview'); pr.src = s.img; pr.style.display = 'block'; editingSeriesImg = s.img; }
    }
  } else {
    ['series-name-input','series-year-input','series-count-input','series-desc-input'].forEach(id => document.getElementById(id).value = '');
  }
  // Show admin-only series fields
  ['series-has-sizes-input','series-has-subseries-input','series-has-variations-input'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.closest('.form-group') ? el.closest('.form-group').style.display = currentUser?.isAdmin ? '' : 'none' : el.style.display = currentUser?.isAdmin ? '' : 'none';
  });
  const hasSizesGroup = document.getElementById('series-has-sizes-input')?.closest('.form-group');
  if (hasSizesGroup) hasSizesGroup.style.display = currentUser?.isAdmin ? '' : 'none';
  const hasSubseriesGroup = document.getElementById('series-has-subseries-group');
  if (hasSubseriesGroup) hasSubseriesGroup.style.display = currentUser?.isAdmin ? '' : 'none';
  const hasVariationsGroup = document.getElementById('series-has-variations-input')?.closest('.form-group');
  if (hasVariationsGroup) hasVariationsGroup.style.display = currentUser?.isAdmin ? '' : 'none';
  document.getElementById('add-series-modal').classList.remove('hidden');
}
function handleSeriesImg(e) {
  const file = e.target.files[0]; if (!file) return;
  editingSeriesImgFile = file;
  const reader = new FileReader();
  reader.onload = ev => {
    const pr = document.getElementById('series-img-preview');
    pr.src = ev.target.result; pr.style.display = 'block';
  };
  reader.readAsDataURL(file);
}
let editingSeriesImgFile = null;
async function saveSeries() {
  const name = document.getElementById('series-name-input').value.trim();
  const year = document.getElementById('series-year-input').value;
  const hasSizes = document.getElementById('series-has-sizes-input').checked;
  const hasSubseries = document.getElementById('series-has-subseries-input').checked;
  const hasVariations = document.getElementById('series-has-variations-input')?.checked || false;
  const count = document.getElementById('series-count-input').value;
  const desc = document.getElementById('series-desc-input').value.trim();
  const descIt = desc; // same description for both languages
  if (!name || !year) { toast((currentLang === 'it' ? 'Nome e anno sono obbligatori' : 'Name and year are required'), 'error'); return; }
  const fb = document.getElementById('series-save-feedback');
  const btn = document.querySelector('#add-series-modal .btn-primary');
  if (fb) { fb.style.display = ''; fb.textContent = (currentLang === 'it' ? '⏳ Salvataggio in corso...' : '⏳ Saving...'); }
  if (btn) btn.disabled = true;
  let imgUrl = editingSeriesImg || null;
  if (editingSeriesImgFile) {
    try { imgUrl = await uploadToCloudinary(editingSeriesImgFile); }
    catch(e) { toast((currentLang === 'it' ? 'Errore nel caricamento immagine' : 'Image upload error'), 'error'); return; }
  }
  let series = getData('series', []);
  const editId = document.getElementById('edit-series-id').value;
  if (editId) {
    const idx = series.findIndex(x => x.id === editId);
    if (idx >= 0) {
      series[idx] = { ...series[idx], name, year: +year, count: +count, desc, descIt, img: imgUrl || series[idx].img, hasSizes, hasSubseries, hasVariations };
      await fsSave('series', series[idx]);
      _cache.series = series;
    }
  } else {
    const newS = { name, year: +year, count: +count||0, desc, descIt, img: imgUrl, hasSizes, hasSubseries, hasVariations, created: new Date().toISOString() };
    const saved = await fsSave('series', newS);
    _cache.series.push(saved);
  }
  editingSeriesImgFile = null;
  if (fb) { fb.textContent = (currentLang === 'it' ? '✅ Serie salvata!' : '✅ Series saved!'); }
  if (btn) btn.disabled = false;
  setTimeout(() => {
    closeModal('add-series-modal');
    if (fb) { fb.style.display = 'none'; fb.textContent = ''; }
  }, 1000);
  renderCatalog(); renderHomeSeries(); renderHomeStats();
}
async function deleteSeries(id) {
  if (!confirm('Delete this series and all its figurines?')) return;
  await fsDelete('series', id);
  _cache.series = _cache.series.filter(x => x.id !== id);
  const figsToDelete = _cache.figurines.filter(x => x.seriesId === id);
  for (const f of figsToDelete) await fsDelete('figurines', f.id);
  _cache.figurines = _cache.figurines.filter(x => x.seriesId !== id);
  renderCatalog(); renderHomeSeries(); renderHomeStats(); renderAdminSeries();
  toast((currentLang === 'it' ? 'Serie eliminata' : 'Series deleted'), 'success');
}

function renderCatalog() {
  const grid = document.getElementById('catalog-grid');
  let series = getData('series', []);
  series = series.sort((a,b) => (a.order ?? 9999) - (b.order ?? 9999));
  const q = (document.getElementById('series-search')?.value || '').toLowerCase();
  if (q) series = series.filter(s => s.name.toLowerCase().includes(q) || (s.desc||'').toLowerCase().includes(q));
  if (!series.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🎴</div><p class="empty-title">${t('catalog.empty')}</p></div>`;
    return;
  }
  grid.innerHTML = series.map(s => seriesCardHTML(s)).join('');
}

function seriesCardHTML(s) {
  const figs = getData('figurines', []).filter(f => f.seriesId === s.id);
  const desc = currentLang === 'it' && s.descIt ? s.descIt : s.desc;
  // Calculate mode score (most common score > 0)
  let modeScoreHTML = '';
  const scoredFigs = figs.filter(f => f.score && f.score > 0);
  if (scoredFigs.length) {
    const freq = {};
    scoredFigs.forEach(f => { freq[f.score] = (freq[f.score] || 0) + 1; });
    const modeScore = Object.entries(freq).sort((a,b) => b[1]-a[1])[0][0];
    modeScoreHTML = `<span style="font-size:0.78rem;color:var(--accent);font-family:var(--font-ui);">⭐ ${modeScore} pt</span>`;
  }
  return `<div class="card" onclick="openSeriesDetail('${s.id}')">
    <div class="card-img-placeholder">
      ${s.img ? `<img src="${cloudinaryUrl(s.img, 'w_400,h_400,c_fit,q_auto,f_auto')}" style="width:100%;height:100%;object-fit:contain;position:absolute;top:0;left:0;padding:8px;">` : '🎴'}
    </div>
    <div class="card-body">
      <span class="card-tag">${s.year || ''}</span>
      <div class="card-title">${s.name}</div>
      <div class="card-desc">${(desc||'').substring(0,90)}${(desc||'').length>90?'…':''}</div>
      <div class="card-meta">
        <span class="card-badge">${figs.length} ${currentLang === 'it' ? 'figurine' : 'stickers'}</span>
        ${modeScoreHTML}
      </div>
    </div>
  </div>`;
}

function renderHomeSeries() {
  const grid = document.getElementById('home-series-grid');
  if (!grid) return;
  const series = getData('series', []).slice(0, 3);
  if (!series.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🎴</div><p class="empty-title">${t('catalog.empty')}</p></div>`;
    return;
  }
  grid.innerHTML = series.map(s => seriesCardHTML(s)).join('');
}

// ============================================================
//  SERIES DETAIL
// ============================================================
let currentSection = null; // 'figurines' | 'albums' | 'extras'
let currentItemPage = 1;
const ITEMS_PER_PAGE = 42;

function getSectionLabel(section) {
  const it = { figurines: 'Figurine', albums: 'Album', extras: 'Altro Materiale' };
  const en = { figurines: 'Stickers', albums: 'Albums', extras: 'Extra Material' };
  return (currentLang === 'it' ? it : en)[section] || section;
}
function getSectionLabelSingular(section) {
  const it = { figurines: 'figurina', albums: 'album', extras: 'oggetto' };
  const en = { figurines: 'sticker', albums: 'album', extras: 'item' };
  return (currentLang === 'it' ? it : en)[section] || section;
}
const SECTION_ICONS = { figurines: '&#129535;', albums: '&#128210;', extras: '&#127873;' };
const SECTION_IMAGES = {
  figurines: 'data:image/avif;base64,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',
  albums: 'data:image/avif;base64,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',
  extras: 'data:image/webp;base64,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'
};

function openSeriesDetail(seriesId) {
  currentSeriesId = seriesId;
  currentSection = null;
  const s = getData('series', []).find(x => x.id === seriesId);
  if (!s) return;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const det = document.getElementById('series-detail');
  det.style.display = 'block';
  const desc = currentLang === 'it' && s.descIt ? s.descIt : s.desc;
  document.getElementById('detail-name').textContent = s.name;
  document.getElementById('detail-year').textContent = s.year;
  document.getElementById('detail-desc').textContent = desc || '';
  const cover = document.getElementById('detail-cover');
  cover.innerHTML = s.img ? '<img src="' + cloudinaryUrl(s.img, 'w_200,h_200,c_fit,q_auto,f_auto') + '">' : '<span>&#127924;</span>';
  // show selector, hide items section
  document.getElementById('section-selector').style.display = '';
  document.getElementById('items-section').style.display = 'none';
  // set section images
  ['figurines','albums','extras'].forEach(sec => {
    const img = document.getElementById('sec-img-' + sec);
    if (img && SECTION_IMAGES[sec]) img.src = SECTION_IMAGES[sec];
  });
  // update counts
  updateSectionCounts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateSectionCounts() {
  ['figurines','albums','extras'].forEach(sec => {
    const items = getData('figurines', []).filter(f => f.seriesId === currentSeriesId && f.section === sec);
    const el = document.getElementById('count-' + sec);
    if (el) el.textContent = items.length + (currentLang === 'it' ? ' oggetti' : ' items');
  });
}

function openSeriesSection(section) {
  currentSection = section;
  const si = document.getElementById('items-search'); if (si) { si.value = ''; si.placeholder = currentLang === 'it' ? 'Cerca figurine...' : 'Search stickers...'; }
  currentItemPage = 1;
  bulkEditActive = false;
  const bulkView = document.getElementById('bulk-edit-view');
  if (bulkView) bulkView.innerHTML = '';
  const btn = document.getElementById('bulk-edit-toggle-btn');
  if (btn) btn.textContent = currentLang === 'it' ? '📋 Vista tabellare' : '📋 Table view';
  document.getElementById('section-selector').style.display = 'none';
  document.getElementById('items-section').style.display = '';
  document.getElementById('items-section-title').textContent = getSectionLabel(section);
  document.getElementById('admin-add-item-btn').style.display = currentUser?.isAdmin ? '' : 'none';
  // Show bulk score button only for figurines section
  const bulkScoreBtn = document.querySelector('#admin-add-item-btn .btn-secondary');
  if (bulkScoreBtn) bulkScoreBtn.style.display = section === 'figurines' ? '' : 'none';
  // Rename add button based on section
  const addBtn = document.querySelector('#admin-add-item-btn .btn-primary');
  const addLabels = { figurines: currentLang === 'it' ? '+ Aggiungi figurina' : '+ Add sticker', albums: currentLang === 'it' ? '+ Aggiungi album' : '+ Add album', extras: currentLang === 'it' ? '+ Aggiungi' : '+ Add' };
  if (addBtn) addBtn.textContent = addLabels[section] || (currentLang === 'it' ? '+ Aggiungi' : '+ Add');
  renderItems();
  // Show WIP banner if less than 50% of stickers have photos
  const wipBanner = document.getElementById('wip-photos-banner');
  const wipMsg = document.getElementById('wip-photos-msg');
  if (wipBanner && wipMsg && section === 'figurines') {
    const figs = getData('figurines', []).filter(f => f.seriesId === currentSeriesId && f.section === 'figurines');
    const withPhoto = figs.filter(f => f.img).length;
    const pct = figs.length ? withPhoto / figs.length : 1;
    if (pct < 0.5 && figs.length > 0) {
      wipMsg.textContent = currentLang === 'it'
        ? 'Sito ancora in allestimento: le foto delle figurine saranno inserite prossimamente.'
        : 'Site still being set up: sticker photos will be added soon.';
      wipBanner.style.display = '';
    } else {
      wipBanner.style.display = 'none';
    }
  } else if (wipBanner) {
    wipBanner.style.display = 'none';
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeItemsSection() {
  document.getElementById('items-section').style.display = 'none';
  document.getElementById('section-selector').style.display = '';
  currentSection = null;
  updateSectionCounts();
}

function closeSeriesDetail() {
  // Reset bulk edit state
  bulkEditActive = false;
  const bulkView = document.getElementById('bulk-edit-view');
  if (bulkView) { bulkView.style.display = 'none'; bulkView.innerHTML = ''; }
  const bulkBtn = document.getElementById('bulk-edit-toggle-btn');
  if (bulkBtn) bulkBtn.textContent = (currentLang === 'it' ? '📋 Vista tabellare' : '📋 Table view');
  const grid = document.getElementById('items-grid');
  if (grid) grid.style.display = 'grid';

  document.getElementById('series-detail').style.display = 'none';
  document.getElementById('page-catalog').classList.add('active');
  currentSeriesId = null;
  currentSection = null;
}

// ============================================================
//  ITEMS (figurines/albums/extras unified)
// ============================================================
function openAddItemModal(itemId) {
  if (!currentUser?.isAdmin) { toast((currentLang === 'it' ? 'Solo per admin' : 'Admin only'), 'error'); return; }
  document.getElementById('edit-fig-id').value = itemId || '';
  const label = getSectionLabel(currentSection) || (currentLang === 'it' ? 'Oggetto' : 'Item');
  const labelSingular = getSectionLabelSingular(currentSection);
  document.getElementById('fig-modal-title').textContent = itemId ? (currentLang === 'it' ? 'Modifica ' : 'Edit ') + labelSingular : (currentLang === 'it' ? 'Aggiungi ' : 'Add ') + labelSingular;
  document.getElementById('fig-img-preview').style.display = 'none';
  editingFigImg = null;
  editingFigImgFileSave = null;
  if (itemId) {
    const f = getData('figurines', []).find(x => x.id === itemId);
    if (f) {
      document.getElementById('fig-number-input').value = f.number || '';
      document.getElementById('fig-name-input').value = f.name;
      document.getElementById('fig-desc-input').value = f.desc || '';
      document.getElementById('fig-score-input').value = f.score || 0;
      document.getElementById('fig-subseries-input').value = f.subseries || '';
      document.getElementById('fig-size-input').value = f.size || '';
      document.getElementById('fig-back-input').value = f.backNumber || 1;
      if (f.img) { const pr = document.getElementById('fig-img-preview'); pr.src = f.img; pr.style.display = 'block'; editingFigImg = f.img; }
    }
  } else {
    ['fig-number-input','fig-name-input','fig-desc-input','fig-subseries-input','fig-size-input'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('fig-score-input').value = 0;
    document.getElementById('fig-back-input').value = 1;
  }
  // Show/hide conditional fields based on series flags
  const _ser = getData('series', []).find(s => s.id === currentSeriesId);
  const sizeGroup = document.getElementById('fig-size-group');
  if (sizeGroup) sizeGroup.style.display = _ser?.hasSizes ? '' : 'none';
  const subseriesGroup = document.getElementById('fig-subseries-group');
  if (subseriesGroup) subseriesGroup.style.display = _ser?.hasSubseries ? '' : 'none';
  const backGroup = document.getElementById('fig-back-group');
  if (backGroup) backGroup.style.display = _ser?.hasVariations ? '' : 'none';
  document.getElementById('add-fig-modal').classList.remove('hidden');
}

// keep openAddFigModal as alias for admin panel
function openAddFigModal(figId) { openAddItemModal(figId); }

function getOwned() {
  const uid = currentUser?.id || 'guest';
  // Use cached Firebase data if available, fallback to localStorage
  if (_cache.ownedMap && _cache.ownedMap[uid]) return _cache.ownedMap[uid];
  return LOCAL.get('owned_' + uid) || [];
}
function toggleOwned(figId) {
  if (!currentUser) { openAuth('register'); return; }
  let owned = getOwned();
  if (owned.includes(figId)) owned = owned.filter(x => x !== figId);
  else owned.push(figId);
  // Save to cache, localStorage, and Firebase
  if (!_cache.ownedMap) _cache.ownedMap = {};
  _cache.ownedMap[currentUser.id] = owned;
  if (!_cache.ownedMap) _cache.ownedMap = {};
  _cache.ownedMap[currentUser.id] = owned;
  LOCAL.set('owned_' + currentUser.id, owned);
  saveOwnedToFirebase(currentUser.id, owned);
  saveOwnedToFirebase(currentUser.id, owned);
  renderItems(); renderProfile();
}

async function saveOwnedToFirebase(userId, owned) {
  try {
    await fsSave('owned', { id: userId, userId, owned });
  } catch(e) { console.error('saveOwned error', e); }
}

async function loadAllOwnedFromFirebase() {
  try {
    const allOwned = await fsGetAll('owned');
    if (!_cache.ownedMap) _cache.ownedMap = {};
    for (const doc of allOwned) {
      _cache.ownedMap[doc.userId] = doc.owned || [];
    }
    // Migrate current user's localStorage data to Firebase if not yet saved
    if (currentUser) {
      const localOwned = LOCAL.get('owned_' + currentUser.id);
      if (localOwned && localOwned.length > 0 && !allOwned.find(d => d.userId === currentUser.id)) {
        _cache.ownedMap[currentUser.id] = localOwned;
        await saveOwnedToFirebase(currentUser.id, localOwned);
      }
    }
  } catch(e) { console.error('loadAllOwned error', e); }
}

function renderItems() {
  const grid = document.getElementById('items-grid');
  if (!currentSeriesId || !grid || !currentSection) return;
  const searchQ = (document.getElementById('items-search')?.value || '').toLowerCase().trim();
  if (searchQ) currentItemPage = 1;
  const allItems = getData('figurines', []).filter(f => {
    if (f.seriesId !== currentSeriesId || f.section !== currentSection) return false;
    if (!searchQ) return true;
    return (f.name||'').toLowerCase().includes(searchQ) || String(f.number||'').includes(searchQ) || (f.subseries||'').toLowerCase().includes(searchQ);
  }).sort((a,b) => { if (!a.number && !b.number) return (a.subseries||'').localeCompare(b.subseries||''); if (!a.number) return 1; if (!b.number) return -1; return a.number - b.number; });
  const owned = getOwned();
  const pw = document.getElementById('detail-progress-wrap');
  // Show bulk owned buttons only for figurines section when logged in
  const bulkBtns = document.getElementById('bulk-owned-btns');
  if (bulkBtns) bulkBtns.style.display = (currentUser && currentSection === 'figurines' && allItems.length) ? 'flex' : 'none';

  if (currentUser && allItems.length) {
    pw.style.display = '';
    const ownedCount = allItems.filter(f => owned.includes(f.id)).length;
    const pct = Math.round(ownedCount / allItems.length * 100);
    document.getElementById('detail-progress-label').textContent = ownedCount + ' / ' + allItems.length;
    document.getElementById('detail-progress-fill').style.width = pct + '%';
  } else { pw.style.display = 'none'; }
  if (!allItems.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">&#128230;</div><p class="empty-title">${currentLang === 'it' ? 'Nessun oggetto ancora!' : 'Nothing here yet!'}</p>${currentUser?.isAdmin ? '<button class="btn-primary" onclick="openAddItemModal()" style="margin-top:1rem;">+ ' + (currentLang === 'it' ? 'Aggiungi' : 'Add') + '</button>' : ''}</div>`;
    document.getElementById('items-pagination').innerHTML = '';
    return;
  }
  // Pagination
  const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);
  if (currentItemPage > totalPages) currentItemPage = totalPages;
  const start = (currentItemPage - 1) * ITEMS_PER_PAGE;
  const items = allItems.slice(start, start + ITEMS_PER_PAGE);
  // Pagination controls (top)
  const paginationTop = document.getElementById('items-pagination-top');
  const totalPagesTop = Math.ceil(allItems.length / ITEMS_PER_PAGE);
  function paginationHTML(cur, tot, total) {
    if (tot <= 1) return '';
    return `<div style="display:flex;align-items:center;justify-content:center;gap:1rem;margin-bottom:1rem;flex-wrap:wrap;">
      <button onclick="changeItemPage(${cur - 1})" ${cur === 1 ? 'disabled style="opacity:0.3;"' : ''} class="btn-secondary" style="padding:0.4rem 1rem;">◀ ${currentLang === 'it' ? 'Precedente' : 'Previous'}</button>
      <span style="font-family:var(--font-ui);color:var(--muted);font-size:0.9rem;">${currentLang === 'it' ? 'Pagina' : 'Page'} ${cur} ${currentLang === 'it' ? 'di' : 'of'} ${tot} &nbsp;|&nbsp; ${total} ${currentLang === 'it' ? 'oggetti' : 'items'}</span>
      <button onclick="changeItemPage(${cur + 1})" ${cur === tot ? 'disabled style="opacity:0.3;"' : ''} class="btn-secondary" style="padding:0.4rem 1rem;">${currentLang === 'it' ? 'Successiva' : 'Next'} ▶</button>
    </div>`;
  }
  if (paginationTop) paginationTop.innerHTML = paginationHTML(currentItemPage, totalPagesTop, allItems.length);

  grid.innerHTML = items.map(f => {
    const isOwned = owned.includes(f.id);
    const icon = SECTION_ICONS[currentSection];
    const imgHTML = f.img ? `<img src="${cloudinaryUrl(f.img)}" style="width:100%;height:100%;object-fit:contain;position:absolute;top:0;left:0;border-radius:0;padding:4px;">` : `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:8px;text-align:center;"><span style="font-size:1.5rem;">${icon}</span><span style="font-size:0.6rem;color:var(--muted);line-height:1.2;">Foto non ancora disponibile</span></div>`;
    const ownedBadge = isOwned ? `<div class="fig-owned-badge">${t('owned.yes')}</div>` : '';
    const adminBtns = currentUser?.isAdmin ? `<div style="position:absolute;top:8px;left:8px;display:flex;gap:4px;"><button class="tbl-btn tbl-btn-edit" onclick="event.stopPropagation();openAddItemModal('${f.id}')">&#9998;</button><button class="tbl-btn tbl-btn-del" onclick="event.stopPropagation();deleteFigurine('${f.id}')">&#10005;</button></div>` : '';
    const reportBtn = currentUser && !currentUser.isAdmin ? `<button onclick="event.stopPropagation();openSegnalazioneModal('${f.id}')" title="Segnala qualcosa all'amministratore per questa figurina" style="font-size:0.65rem;padding:1px 6px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:var(--muted);cursor:pointer;">🚩</button>` : '';
    const descHTML = f.desc ? `<div style="font-size:0.78rem;color:var(--muted);margin-top:4px;">${f.desc.substring(0,60)}${f.desc.length>60?'...':''}</div>` : '';
    const scoreHTML = (f.score && f.score > 0) ? `<div style="font-size:0.78rem;color:var(--accent);margin-top:4px;">⭐ ${f.score} pt</div>` : '';
    const sizeHTML = f.size ? `<div style="font-size:0.78rem;color:var(--muted);margin-top:2px;">📏 ${f.size}</div>` : '';
    const figLabel = f.subseries ? `[${f.subseries}]` : (f.number ? `#${f.number}` : '');
    return `<div class="fig-card" onclick="openFigDetail('${f.id}')" style="cursor:pointer;">
      <div class="fig-img-placeholder" style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:3rem;background:linear-gradient(135deg,var(--bg2),var(--card2));position:relative;">
        ${imgHTML}${ownedBadge}${adminBtns}
      </div>
      <div class="fig-body">
        <div class="fig-number" style="font-size:1rem;">${figLabel}</div>
        <div class="fig-name">${f.name}</div>
        ${descHTML}
        ${sizeHTML}
        <div style="display:flex;align-items:center;gap:0.5rem;">${scoreHTML}${reportBtn}</div>
        <div class="fig-toggle">
          <span class="toggle-label">${t('owned.toggle')}</span>
          <button class="toggle-btn-blue ${isOwned?'on':''}" onclick="event.stopPropagation();toggleOwned('${f.id}')"></button>
        </div>
      </div>
    </div>`;
  }).join('');

  // Render pagination controls (bottom)
  const paginationEl = document.getElementById('items-pagination');
  if (paginationEl) {
    paginationEl.innerHTML = paginationHTML(currentItemPage, Math.ceil(allItems.length / ITEMS_PER_PAGE), allItems.length);
    paginationEl.style.marginTop = '1.5rem';
  }
}

function changeItemPage(page) {
  const allItems = getData('figurines', []).filter(f => f.seriesId === currentSeriesId && f.section === currentSection);
  const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);
  if (page < 1 || page > totalPages) return;
  currentItemPage = page;
  renderItems();
  // Show WIP banner if less than 50% of stickers have photos
  const wipBanner = document.getElementById('wip-photos-banner');
  const wipMsg = document.getElementById('wip-photos-msg');
  if (wipBanner && wipMsg && section === 'figurines') {
    const figs = getData('figurines', []).filter(f => f.seriesId === currentSeriesId && f.section === 'figurines');
    const withPhoto = figs.filter(f => f.img).length;
    const pct = figs.length ? withPhoto / figs.length : 1;
    if (pct < 0.5 && figs.length > 0) {
      wipMsg.textContent = currentLang === 'it'
        ? 'Sito ancora in allestimento: le foto delle figurine saranno inserite prossimamente.'
        : 'Site still being set up: sticker photos will be added soon.';
      wipBanner.style.display = '';
    } else {
      wipBanner.style.display = 'none';
    }
  } else if (wipBanner) {
    wipBanner.style.display = 'none';
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// renderFigurines kept as alias for admin panel compatibility
function renderFigurines() { if (currentSection) renderItems(); }

let editingFigImgFileSave = null;
function handleFigImg(e) {
  const file = e.target.files[0]; if (!file) return;
  editingFigImgFileSave = file;
  const reader = new FileReader();
  reader.onload = ev => {
    const pr = document.getElementById('fig-img-preview');
    pr.src = ev.target.result; pr.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

async function saveFigurine() {
  const number = document.getElementById('fig-number-input').value;
  const name = document.getElementById('fig-name-input').value.trim();
  const desc = document.getElementById('fig-desc-input').value.trim();
  const score = parseInt(document.getElementById('fig-score-input').value) || 0;
  const subseries = document.getElementById('fig-subseries-input')?.value.trim() || '';
  const size = document.getElementById('fig-size-input')?.value.trim() || '';
  const backNumber = parseInt(document.getElementById('fig-back-input')?.value) || 1;
  if (!name || !number) { toast((currentLang === 'it' ? 'Numero e nome sono obbligatori' : 'Number and name are required'), 'error'); return; }
  toast((currentLang === 'it' ? 'Salvataggio...' : 'Saving...'), 'success');
  let imgUrl = editingFigImg || null;
  if (editingFigImgFileSave) {
    try { imgUrl = await uploadToCloudinary(editingFigImgFileSave); }
    catch(e) { toast((currentLang === 'it' ? 'Caricamento immagine fallito' : 'Image upload failed'), 'error'); return; }
  }
  let figs = getData('figurines', []);
  const editId = document.getElementById('edit-fig-id').value;
  if (editId) {
    const idx = figs.findIndex(x => x.id === editId);
    if (idx >= 0) {
      figs[idx] = { ...figs[idx], number: number ? +number : null, name, desc, score, subseries, size, backNumber, img: imgUrl || figs[idx].img };
      await fsSave('figurines', figs[idx]);
      _cache.figurines = figs;
    }
  } else {
    const newF = { seriesId: currentSeriesId, section: currentSection || 'figurines', number: number ? +number : null, name, desc, score, subseries, size, backNumber, img: imgUrl || null };
    const saved = await fsSave('figurines', newF);
    _cache.figurines.push(saved);
  }
  editingFigImgFileSave = null;
  closeModal('add-fig-modal');
  renderItems(); renderHomeStats(); updateSectionCounts();
  toast((currentLang === 'it' ? 'Salvato! 🧟' : 'Saved! 🧟'), 'success');
}

async function deleteFigurine(id) {
  if (!confirm('Eliminare questo oggetto?')) return;
  await fsDelete('figurines', id);
  _cache.figurines = _cache.figurines.filter(x => x.id !== id);
  renderItems(); renderHomeStats(); updateSectionCounts();
  toast('Eliminato', 'success');
}

// ============================================================
//  BLOG / Q&A
// ============================================================
function openPostModal() {
  if (!currentUser) { openAuth('login'); return; }
  ['post-title-input','post-body-input'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('post-modal').classList.remove('hidden');
}
async function savePost() {
  const type = document.getElementById('post-type').value;
  const title = document.getElementById('post-title-input').value.trim();
  const body = document.getElementById('post-body-input').value.trim();
  if (!title) { toast('Il titolo è obbligatorio', 'error'); return; }
  const newPost = { type, title, body, author: currentUser.username, authorId: currentUser.id, date: new Date().toISOString(), comments: [] };
  const saved = await fsSave('posts', newPost);
  _cache.posts.unshift(saved);
  closeModal('post-modal');
  renderBlog();
  toast('Post pubblicato! 💬', 'success');
  logEvent('new_post', 'Nuovo post nel blog: ' + title);
}

async function submitComment(postId) {
  if (!currentUser) { openAuth('login'); return; }
  const textarea = document.getElementById('reply-input-' + postId);
  const text = textarea ? textarea.value.trim() : '';
  if (!text) { toast('Please write something first', 'error'); return; }
  const idx = _cache.posts.findIndex(p => p.id === postId);
  if (idx < 0) return;
  if (!_cache.posts[idx].comments) _cache.posts[idx].comments = [];
  _cache.posts[idx].comments.push({
    id: Date.now().toString(),
    author: currentUser.username,
    authorId: currentUser.id,
    isAdmin: !!currentUser.isAdmin,
    text,
    date: new Date().toISOString()
  });
  await fsSave('posts', _cache.posts[idx]);
  sendReplyNotificationEmail(_cache.posts[idx].authorId, _cache.posts[idx].title, currentUser.username, text);
  renderBlog();
  toast('Risposta inviata! ✅', 'success');
}

async function deleteComment(postId, commentId) {
  if (!currentUser) return;
  const idx = _cache.posts.findIndex(p => p.id === postId);
  if (idx < 0) return;
  const c = _cache.posts[idx].comments.find(c => c.id === commentId);
  if (!c) return;
  if (!currentUser.isAdmin && c.authorId !== currentUser.id) { toast('Non autorizzato', 'error'); return; }
  _cache.posts[idx].comments = _cache.posts[idx].comments.filter(c => c.id !== commentId);
  await fsSave('posts', _cache.posts[idx]);
  renderBlog();
  toast('Commento eliminato', 'success');
}

async function deletePost(id) {
  if (!currentUser?.isAdmin) { toast((currentLang === 'it' ? 'Solo per admin' : 'Admin only'), 'error'); return; }
  if (!confirm('Delete this post?')) return;
  await fsDelete('posts', id);
  _cache.posts = _cache.posts.filter(p => p.id !== id);
  renderBlog();
  toast((currentLang === 'it' ? 'Post eliminato' : 'Post deleted'), 'success');
}

function renderBlog() {
  const list = document.getElementById('blog-list');
  // migrate old posts that used single reply field
  let posts = getData('posts', []);
  let migrated = false;
  posts = posts.map(p => {
    if (!p.comments) {
      p.comments = [];
      if (p.reply && p.reply.text) {
        p.comments.push({ id: 'migrated', author: 'admin', authorId: 'admin', isAdmin: true, text: p.reply.text, date: p.reply.date || p.date });
        delete p.reply;
        migrated = true;
      }
    }
    return p;
  });
  if (migrated) setData('posts', posts);

  if (!posts.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">💬</div><p class="empty-title">${t('blog.empty')}</p></div>`;
    return;
  }

  list.innerHTML = posts.map(p => {
    const badgeClass = p.type === 'question' ? 'badge-question' : 'badge-news';
    const badgeLabel = p.type === 'question' ? '❓ ' + (currentLang==='it'?'Domanda':'Question') : '📢 ' + (currentLang==='it'?'Notizia':'News');
    const dateStr = new Date(p.date).toLocaleDateString(currentLang === 'it' ? 'it-IT' : 'en-GB', { year:'numeric', month:'short', day:'numeric' });
    const comments = p.comments || [];
    const commentCount = comments.length;

    // render comments
    const commentsHTML = comments.map(c => {
      const cDate = new Date(c.date).toLocaleDateString(currentLang==='it'?'it-IT':'en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
      const canDel = currentUser && (currentUser.isAdmin || currentUser.id === c.authorId);
      return `<div class="comment">
        <div class="comment-avatar ${c.isAdmin ? 'is-admin' : ''}">${c.author[0].toUpperCase()}</div>
        <div class="comment-bubble ${c.isAdmin ? 'is-admin' : ''}">
          <div class="comment-header">
            <span class="comment-author">@${c.author}</span>${(()=>{ const u = getData("users",[]).find(x=>x.id===c.authorId); return u?.nationalityCode ? `<img src="https://flagcdn.com/w40/${u.nationalityCode}.png" title="${u.nationalityName||''}" style="width:18px;height:12px;object-fit:cover;border-radius:2px;vertical-align:middle;">` : ""; })()}
            ${c.isAdmin ? `<span class="comment-admin-badge">👑 ${t('comment.admin')}</span>` : ''}
            <span class="comment-date">${cDate}</span>
            ${canDel ? `<button class="comment-del-btn" onclick="deleteComment('${p.id}','${c.id}')" title="Delete">✕</button>` : ''}
          </div>
          <div class="comment-text">${c.text.replace(/\n/g,'<br>')}</div>
        </div>
      </div>`;
    }).join('');

    // reply box
    const replyBoxHTML = currentUser
      ? `<div class="reply-box">
          <div class="reply-box-avatar ${currentUser.isAdmin?'is-admin':''}">${currentUser.username[0].toUpperCase()}</div>
          <textarea class="reply-textarea" id="reply-input-${p.id}" placeholder="Scrivi una risposta..."
            onkeydown="if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){submitComment('${p.id}');event.preventDefault();}" rows="1"></textarea>
          <button class="reply-send-btn" type="button" onclick="event.preventDefault();submitComment('${p.id}')" title="Invia">↑</button>
        </div>`
      : `<div style="margin-top:0.75rem;font-size:0.82rem;color:var(--muted);">
          <a style="color:var(--accent3);cursor:pointer;text-decoration:none;" onclick="openAuth('login')">${t('comment.login')}</a>
        </div>`;

    return `<div class="blog-card">
      <div class="blog-meta">
        <span class="blog-author">@${p.author}</span>
        <span class="blog-date">${dateStr}</span>
        <span class="blog-type-badge ${badgeClass}">${badgeLabel}</span>
        ${currentUser?.isAdmin ? `<button class="tbl-btn tbl-btn-del" style="margin-left:auto;" onclick="deletePost('${p.id}')">${currentLang === 'it' ? "Cancella" : "Delete"}</button>` : ''}
      </div>
      <div class="blog-title">${p.title}</div>
      ${p.body ? `<div class="blog-excerpt">${p.body}</div>` : ''}
      <div class="comments-section">
        ${commentsHTML}
        ${replyBoxHTML}
        ${commentCount > 0 ? `<div style="font-size:0.75rem;color:var(--muted);margin-top:0.5rem;padding-top:0.5rem;">💬 ${commentCount} ${commentCount===1?(currentLang==='it'?'risposta':'reply'):(currentLang==='it'?'risposte':'replies')}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

// ============================================================
//  CONTACT
// ============================================================
async function sendContact() {
  const name = document.getElementById('contact-name').value.trim();
  const email = document.getElementById('contact-email').value.trim();
  const subject = document.getElementById('contact-subject').value.trim();
  const message = document.getElementById('contact-message').value.trim();
  if (!name || !email || !message) { toast('Please fill in name, email and message', 'error'); return; }
  const msg = { name, email, subject, message, date: new Date().toISOString(), read: false };
  const saved = await fsSave('contact_messages', msg);
  _cache.contact_messages.unshift(saved);
  ['contact-name','contact-email','contact-subject','contact-message'].forEach(id => document.getElementById(id).value = '');
  toast('Message sent! We\'ll get back to you soon 📩', 'success');
}

// ============================================================
//  PROFILE
// ============================================================
async function saveAnonSetting() {
  if (!currentUser) return;
  const cb = document.getElementById('profile-anon-toggle');
  const enabling = cb?.checked || false;
  const L = currentLang === 'it';
  const msg = enabling
    ? (L ? `Attivando l'anonimato, il tuo nome sarà "Collezionista Anonimo". Gli altri non potranno identificarti, ma vedrai sempre la tua posizione.\n\nConfermi?`
         : `By enabling anonymity, your name becomes "Anonymous Collector". Others won't identify you, but you'll still see your own position.\n\nConfirm?`)
    : (L ? `Disattivando l'anonimato, il tuo nome e avatar torneranno visibili a tutti.\n\nConfermi?`
         : `By disabling anonymity, your name and avatar will be visible to everyone again.\n\nConfirm?`);
  if (!confirm(msg)) {
    cb.checked = !enabling; // revert
    return;
  }
  currentUser.isAnonymous = enabling;
  LOCAL.set('currentUser', currentUser);
  await fsSave('users', currentUser);
  toast(L
    ? (enabling ? '🕵️ Profilo anonimo attivato' : 'Profilo pubblico ripristinato')
    : (enabling ? '🕵️ Anonymous profile enabled' : 'Public profile restored'), 'success');
}

function renderProfile() {
  if (!currentUser) { showPage('home'); return; }
  document.getElementById('profile-username').textContent = currentUser.username + (currentUser.isAdmin ? ' 👑' : '');
  document.getElementById('profile-email').textContent = currentUser.email;
  // Show warning if user must change password
  const mustChangeBanner = document.getElementById('must-change-pwd-banner');
  if (mustChangeBanner) mustChangeBanner.style.display = currentUser.mustChangePassword ? '' : 'none';
  const natDisplay = document.getElementById('profile-nationality-display');
  if (natDisplay) {
    if (currentUser.nationalityCode) {
      natDisplay.innerHTML = `<img src="${flagUrl(currentUser.nationalityCode)}" style="width:20px;height:14px;object-fit:cover;border-radius:2px;vertical-align:middle;"> ${currentUser.nationalityName || ''}`;
    } else {
      natDisplay.textContent = (currentLang === 'it' ? 'Nessuna nazionalità impostata' : 'No nationality set');
    }
  }
  const avatarText = document.getElementById('profile-avatar-text');
  const profileAvatar = document.getElementById('profile-avatar');
  // Always reset first
  profileAvatar.style.backgroundImage = '';
  profileAvatar.style.backgroundSize = '';
  profileAvatar.style.backgroundPosition = '';
  if (currentUser.avatar) {
    if (avatarText) avatarText.style.display = 'none';
    profileAvatar.style.backgroundImage = 'url(' + currentUser.avatar + ')';
    profileAvatar.style.backgroundSize = 'cover';
    profileAvatar.style.backgroundPosition = 'center';
  } else {
    if (avatarText) { avatarText.style.display = ''; avatarText.textContent = currentUser.username[0].toUpperCase(); }
  }
  const allFigs = getData('figurines', []);
  const owned = getOwned();
  const ownedFigs = allFigs.filter(f => owned.includes(f.id));
  document.getElementById('profile-owned').textContent = ownedFigs.length;
  const seriesIds = [...new Set(ownedFigs.map(f => f.seriesId))];
  document.getElementById('profile-series-count').textContent = seriesIds.length;
  document.getElementById('admin-panel').style.display = currentUser.isAdmin ? '' : 'none';
  if (currentUser.isAdmin) { adminTab('series'); }
  renderMyCollection(ownedFigs);
}

function renderMyCollection(ownedFigs) {
  const el = document.getElementById('my-collection-list');
  if (!el) return; // section removed
  const series = getData('series', []);
  if (!ownedFigs.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">😢</div><p class="empty-title">${currentLang === 'it' ? "Nessuna figurina ancora!" : "No stickers yet!"}</p><p class="empty-sub">${currentLang === 'it' ? "Sfoglia il catalogo e segna le figurine che possiedi." : "Browse the catalog and mark the stickers you own."}</p></div>`;
    return;
  }
  const bySeries = {};
  ownedFigs.forEach(f => {
    if (!bySeries[f.seriesId]) bySeries[f.seriesId] = [];
    bySeries[f.seriesId].push(f);
  });
  el.innerHTML = Object.entries(bySeries).map(([sId, figs]) => {
    const s = series.find(x => x.id === sId);
    const allSeriesFigs = getData('figurines', []).filter(f => f.seriesId === sId);
    return `<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.25rem;margin-bottom:1rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
        <span style="font-family:var(--font-ui);font-size:1.1rem;">${s ? s.name : 'Unknown Series'}</span>
        <span class="card-badge">${figs.length} / ${allSeriesFigs.length}</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(figs.length/allSeriesFigs.length*100)}%"></div></div>
      <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-top:0.75rem;">
        ${figs.sort((a,b)=>a.number-b.number).map(f=>`<span style="background:rgba(181,255,46,0.08);border:1px solid rgba(181,255,46,0.2);color:var(--accent);font-size:0.78rem;padding:2px 8px;border-radius:12px;">#${String(f.number).padStart(2,'0')} ${f.name}</span>`).join('')}
      </div>
    </div>`;
  }).join('');
}

// ============================================================
//  ADMIN
// ============================================================
function adminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(b => {
    const t = b.getAttribute('onclick')?.match(/adminTab\('(\w+)'\)/)?.[1];
    b.classList.toggle('active', t === tab);
  });
  document.querySelectorAll('.admin-section').forEach(s => {
    s.classList.remove('active');
    s.style.display = '';
  });
  const tabEl = document.getElementById('admin-' + tab);
  if (tabEl) { tabEl.classList.add('active'); }
  if (tab === 'series') renderAdminSeries();
  if (tab === 'figurines') renderAdminFigs();
  if (tab === 'blog') renderAdminBlog();
  if (tab === 'contacts') renderAdminContacts();
  if (tab === 'users') renderAdminUsers();
  if (tab === 'segnalazioni') renderAdminSegnalazioni();
  if (tab === 'eventi') renderAdminEventi();
  if (tab === 'risorse') renderAdminRisorse();
  if (tab === 'punteggi') renderAdminPunteggi();
}
function renderAdminSeries() {
  const el = document.getElementById('admin-series-table');
  const series = getData('series', []).slice().sort((a,b) => (a.order ?? 9999) - (b.order ?? 9999));
  if (!series.length) { el.innerHTML = '<p style="color:var(--muted);">' + (currentLang === 'it' ? 'Nessuna serie ancora.' : 'No series yet.') + '</p>'; return; }
  el.innerHTML = `
    <p style="font-size:0.82rem;color:var(--muted);margin-bottom:0.25rem;">${(currentLang === 'it') ? "Usa le frecce per cambiare l'ordine" : 'Use the arrows to change the order'}</p>
    <p style="font-size:0.82rem;color:var(--muted);margin-bottom:0.75rem;">${({L}) ? 'Per eliminare una serie, cancellare prima tutto il suo contenuto.' : 'To delete a series, first delete all its content.'}</p>
    <table class="data-table compact"><thead><tr><th>${currentLang==='it'?'Ordine':'Order'}</th><th>${currentLang==="it"?"Nome":"Name"}</th><th>${currentLang==="it"?"Anno":"Year"}</th><th>${currentLang==="it"?"Figurine":"Stickers"}</th><th>${currentLang==="it"?"Azioni":"Actions"}</th></tr></thead><tbody>
    ${series.map((s, idx) => {
      const figs = getData('figurines',[]).filter(f=>f.seriesId===s.id).length;
      return `<tr>
        <td style="white-space:nowrap;">
          <button class="tbl-btn tbl-btn-edit" onclick="moveSeriesUp(${idx})" ${idx===0?'disabled style="opacity:0.3;"':''}>▲</button>
          <button class="tbl-btn tbl-btn-edit" onclick="moveSeriesDown(${idx})" ${idx===series.length-1?'disabled style="opacity:0.3;"':''}>▼</button>
        </td>
        <td>${s.name}</td><td>${s.year}</td><td>${figs}</td><td>
        <button class="tbl-btn tbl-btn-edit" onclick="openAddSeriesModal('${s.id}')">${currentLang === 'it' ? 'Modifica' : 'Edit'}</button>
        ${(() => {
          const figCount = (_cache.figurines || getData('figurines',[])).filter(f => f.seriesId === s.id).length;
          return figCount === 0
            ? `<button class="tbl-btn tbl-btn-del" onclick="deleteSeries('${s.id}')" title="Elimina serie">${currentLang === 'it' ? 'Cancella' : 'Delete'}</button>`
            : '';
        })()}
      </td></tr>`;
    }).join('')}</tbody></table>`;
}

async function moveSeriesUp(idx) {
  let series = getData('series', []);
  if (idx === 0) return;
  [series[idx-1], series[idx]] = [series[idx], series[idx-1]];
  await saveSeriesOrder(series.map(s => s.id));
  renderAdminSeries();
}

async function moveSeriesDown(idx) {
  let series = getData('series', []);
  if (idx === series.length - 1) return;
  [series[idx], series[idx+1]] = [series[idx+1], series[idx]];
  await saveSeriesOrder(series.map(s => s.id));
  renderAdminSeries();
}

function initSeriesDragSort() {
  const tbody = document.querySelector('#sortable-series-table tbody');
  if (!tbody) return;
  let dragSrc = null;

  tbody.querySelectorAll('tr').forEach(row => {
    row.setAttribute('draggable', 'true');

    row.addEventListener('dragstart', function(e) {
      dragSrc = this;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', this.dataset.id);
      setTimeout(() => this.style.opacity = '0.4', 0);
    });

    row.addEventListener('dragend', function() {
      this.style.opacity = '1';
      tbody.querySelectorAll('tr').forEach(r => r.style.borderTop = '');
    });

    row.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      tbody.querySelectorAll('tr').forEach(r => r.style.borderTop = '');
      if (this !== dragSrc) this.style.borderTop = '2px solid var(--accent)';
      return false;
    });

    row.addEventListener('dragleave', function() {
      this.style.borderTop = '';
    });

    row.addEventListener('drop', function(e) {
      e.stopPropagation();
      e.preventDefault();
      this.style.borderTop = '';
      if (dragSrc === this) return false;
      const allRows = [...tbody.querySelectorAll('tr')];
      const fromIdx = allRows.indexOf(dragSrc);
      const toIdx = allRows.indexOf(this);
      if (fromIdx < toIdx) tbody.insertBefore(dragSrc, this.nextSibling);
      else tbody.insertBefore(dragSrc, this);
      const newOrder = [...tbody.querySelectorAll('tr')].map(r => r.dataset.id);
      saveSeriesOrder(newOrder);
      return false;
    });
  });
}

async function saveSeriesOrder(newOrder) {
  let series = getData('series', []);
  const ordered = newOrder.map(id => series.find(s => s.id === id)).filter(Boolean);
  // save order index to each series
  for (let i = 0; i < ordered.length; i++) {
    ordered[i].order = i;
    await fsSave('series', ordered[i]);
  }
  _cache.series = ordered;
  renderCatalog(); renderHomeSeries();
  toast((currentLang === 'it' ? 'Ordine salvato! ✅' : 'Order saved! ✅'), 'success');
}
function renderAdminFigs() {
  const el = document.getElementById('admin-figs-table');
  const figs = getData('figurines', []);
  const series = getData('series', []);
  if (!figs.length) { el.innerHTML = '<p style="color:var(--muted);">' + (currentLang === 'it' ? 'Nessuna figurina ancora.' : 'No stickers yet.') + '</p>'; return; }
  el.innerHTML = `<table class="data-table"><thead><tr><th>#</th><th>${currentLang==="it"?"Nome":"Name"}</th><th>${currentLang==="it"?"Serie":"Series"}</th><th>${currentLang==="it"?"Azioni":"Actions"}</th></tr></thead><tbody>
    ${figs.map(f => {
      const s = series.find(x => x.id === f.seriesId);
      return `<tr><td>${f.number}</td><td>${f.name}</td><td>${s?s.name:'-'}</td><td>
        <button class="tbl-btn tbl-btn-edit" onclick="currentSeriesId='${f.seriesId}';openAddFigModal('${f.id}')">${currentLang === 'it' ? 'Modifica' : 'Edit'}</button>
        <button class="tbl-btn tbl-btn-del" onclick="deleteFigurine('${f.id}')">${currentLang === 'it' ? 'Cancella' : 'Delete'}</button>
      </td></tr>`;
    }).join('')}</tbody></table>`;
}
function renderAdminBlog() {
  const el = document.getElementById('admin-blog-list');
  const posts = getData('posts', []);
  if (!posts.length) { el.innerHTML = '<p style="color:var(--muted);">' + (currentLang === 'it' ? 'Nessun post ancora.' : 'No posts yet.') + '</p>'; return; }
  el.innerHTML = posts.map(p => {
    const comments = p.comments || [];
    return `<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:1rem;margin-bottom:0.75rem;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.5rem;">
        <div><strong style="font-family:var(--font-ui);">${p.title}</strong> <span style="font-size:0.78rem;color:var(--muted);">by @${p.author}</span></div>
        <button class="tbl-btn tbl-btn-del" onclick="deletePost('${p.id}')">${(currentLang === 'it') ? 'Cancella' : 'Delete'}</button>
      </div>
      <div style="font-size:0.82rem;color:var(--muted);margin-top:0.5rem;">💬 ${comments.length} ${comments.length===1?'reply':'replies'}</div>
    </div>`;
  }).join('');
}
function renderAdminContacts() {
  const el = document.getElementById('admin-contacts-list');
  const msgs = getData('contact_messages', []);
  if (!msgs.length) { el.innerHTML = '<p style="color:var(--muted);">No messages yet.</p>'; return; }
  el.innerHTML = msgs.map(m => `<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:1rem 1.25rem;margin-bottom:0.75rem;">
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.5rem;">
      <strong style="font-family:var(--font-ui);">${m.name} <span style="font-size:0.8rem;color:var(--muted);font-family:var(--font-body);">&lt;${m.email}&gt;</span></strong>
      <span style="font-size:0.78rem;color:var(--muted);">${new Date(m.date).toLocaleDateString()}</span>
    </div>
    ${m.subject ? `<div style="font-size:0.88rem;color:var(--accent3);margin-bottom:0.4rem;">Re: ${m.subject}</div>` : ''}
    <div style="font-size:0.88rem;color:var(--muted);">${m.message}</div>
  </div>`).join('');
}
let _usersSort = { col: 'username', dir: 1 };

function sortAdminUsers(col) {
  if (_usersSort.col === col) _usersSort.dir *= -1;
  else { _usersSort.col = col; _usersSort.dir = 1; }
  renderAdminUsers();
}

function renderAdminUsers() {
  const el = document.getElementById('admin-users-table');
  let users = [...getData('users', [])];
  const { col, dir } = _usersSort;
  users.sort((a, b) => {
    let va, vb;
    if (col === 'username') { va = a.username.toLowerCase(); vb = b.username.toLowerCase(); }
    else if (col === 'email') { va = a.email.toLowerCase(); vb = b.email.toLowerCase(); }
    else if (col === 'lastLogin') { va = a.lastLogin || ''; vb = b.lastLogin || ''; }
    else if (col === 'joined') { va = a.joined || ''; vb = b.joined || ''; }
    else if (col === 'role') { va = a.isAdmin ? 0 : 1; vb = b.isAdmin ? 0 : 1; }
    else { va = ''; vb = ''; }
    return va < vb ? -dir : va > vb ? dir : 0;
  });
  const arrow = (c) => _usersSort.col === c ? (_usersSort.dir === 1 ? ' ↑' : ' ↓') : '';
  el.innerHTML = `<table class="data-table compact"><thead><tr>
    <th style="cursor:pointer;" onclick="sortAdminUsers('username')">Username${arrow('username')}</th>
    <th style="cursor:pointer;" onclick="sortAdminUsers('email')">E-mail${arrow('email')}</th>
    <th style="cursor:pointer;" onclick="sortAdminUsers('role')">${(currentLang === 'it') ? 'Livello' : 'Level'}${arrow('role')}</th>
    <th style="cursor:pointer;" onclick="sortAdminUsers('lastLogin')">${(currentLang === 'it') ? 'Ultima login' : 'Last login'}${arrow('lastLogin')}</th>
    <th style="cursor:pointer;" onclick="sortAdminUsers('joined')">${(currentLang === 'it') ? 'Iscritto dal' : 'Member since'}${arrow('joined')}</th>
    <th>${(currentLang === 'it') ? 'Azioni' : 'Actions'}</th></tr></thead><tbody>
    ${users.map(u => `<tr>
      <td style="display:flex;align-items:center;gap:0.6rem;">
        <div style="width:32px;height:32px;border-radius:50%;flex-shrink:0;background:${u.avatar ? 'url(' + u.avatar + ') center/cover' : 'var(--card2)'};border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:0.8rem;color:var(--muted);">${u.avatar ? '' : u.username[0].toUpperCase()}</div>
        ${u.username}${u.isAdmin?'<span class="admin-badge">ADMIN</span>':''}${u.nationalityCode ? '<img src="'+flagUrl(u.nationalityCode)+'" title="'+(u.nationalityName||'')+'" style="width:18px;height:12px;object-fit:cover;border-radius:2px;margin-left:4px;">' : ''}
      </td>
      <td>${u.email}</td>
      <td>${u.isAdmin?'Admin':(currentLang==='it'?'Collezionista':'Collector')}</td>
      <td style="font-size:0.82rem;">${u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('it-IT') + ' ' + new Date(u.lastLogin).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}) : '<span style="color:var(--muted);font-style:italic;">mai</span>'}</td>
      <td>${new Date(u.joined).toLocaleDateString()}</td>
      <td><button class="tbl-btn tbl-btn-edit" onclick="openEditUserModal('${u.id}')">Visualizza</button></td>
    </tr>`).join('')}
  </tbody></table>`;
}

let pendingNatCode = '';
let pendingNatName = '';

function openNationalityModal() {
  if (!currentUser) return;
  pendingNatCode = currentUser.nationalityCode || '';
  pendingNatName = currentUser.nationalityName || '';
  document.getElementById('profile-nationality-search').value = pendingNatName;
  document.getElementById('nationality-dropdown-2').style.display = 'none';
  const preview = document.getElementById('profile-nationality-preview-2');
  if (pendingNatCode) {
    preview.style.display = 'flex';
    preview.innerHTML = `<img src="${flagUrl(pendingNatCode)}" style="width:24px;height:16px;object-fit:cover;border-radius:2px;"> ${pendingNatName}`;
  } else {
    preview.style.display = 'none';
  }
  document.getElementById('nationality-modal').classList.remove('hidden');
}

function filterNationalities2() {
  const q = document.getElementById('profile-nationality-search').value.toLowerCase().trim();
  const dd = document.getElementById('nationality-dropdown-2');
  if (!q) { dd.style.display = 'none'; return; }
  const filtered = COUNTRIES.filter(([code, name]) => name.toLowerCase().includes(q));
  if (!filtered.length) { dd.style.display = 'none'; return; }
  dd.style.display = '';
  dd.innerHTML = filtered.map(([code, name]) =>
    `<div onclick="selectNationality2('${code}','${name}')" style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;" onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background=''">
      <img src="${flagUrl(code)}" style="width:24px;height:16px;object-fit:cover;border-radius:2px;">
      <span style="font-size:0.9rem;">${name}</span>
    </div>`
  ).join('');
}

function selectNationality2(code, name) {
  pendingNatCode = code;
  pendingNatName = name;
  document.getElementById('profile-nationality-search').value = name;
  document.getElementById('nationality-dropdown-2').style.display = 'none';
  const preview = document.getElementById('profile-nationality-preview-2');
  preview.style.display = 'flex';
  preview.innerHTML = `<img src="${flagUrl(code)}" style="width:24px;height:16px;object-fit:cover;border-radius:2px;"> ${name}`;
}

async function saveNationality() {
  if (!currentUser) return;
  currentUser.nationalityCode = pendingNatCode;
  currentUser.nationalityName = pendingNatName;
  LOCAL.set('currentUser', currentUser);
  const users = getData('users', []);
  const idx = users.findIndex(u => u.id === currentUser.id);
  if (idx >= 0) {
    users[idx].nationalityCode = pendingNatCode;
    users[idx].nationalityName = pendingNatName;
    _cache.users = users;
    await fsSave('users', users[idx]);
  }
  closeModal('nationality-modal');
  renderProfile();
  toast('Nazionalità aggiornata! 🌍', 'success');
}

// ============================================================
//  PUNTEGGI / LIVELLI
// ============================================================
function getUserLevel(score) {
  const levels = getData('levels', []).sort((a,b) => b.minScore - a.minScore);
  for (const lv of levels) {
    if (score >= lv.minScore) return lv;
  }
  return null;
}

function renderAdminPunteggi() {
  const el = document.getElementById('admin-levels-list');
  if (!el) return;
  const levels = getData('levels', []).sort((a,b) => a.minScore - b.minScore);
  if (!levels.length) {
    el.innerHTML = '<p style="color:var(--muted);font-style:italic;">Nessun livello definito ancora.</p>';
    return;
  }
  el.innerHTML = `<table class="data-table compact"><thead><tr>
    <th>${(currentLang === 'it') ? 'Nome livello' : 'Level name'}</th><th>${(currentLang === 'it') ? 'Punteggio minimo' : 'Min. score'}</th><th></th>
  </tr></thead><tbody>
  ${levels.map(lv => `<tr>
    <td><strong>${lv.name}</strong>${lv.nameEn ? ' / ' + lv.nameEn : ''}</td>
    <td>${lv.minScore.toLocaleString('it-IT')} pt</td>
    <td>
      <button class="tbl-btn tbl-btn-edit" onclick="editLevel('${lv.id}')">${(currentLang === 'it') ? 'Modifica' : 'Edit'}</button>
      <button class="tbl-btn tbl-btn-del" onclick="deleteLevel('${lv.id}')">${(currentLang === 'it') ? 'Elimina' : 'Delete'}</button>
    </td>
  </tr>`).join('')}
  </tbody></table>`;
}

function editLevel(id) {
  const lv = getData('levels', []).find(l => l.id === id);
  if (!lv) return;
  document.getElementById('level-edit-id').value = id;
  document.getElementById('level-name-input').value = lv.name;
  document.getElementById('level-name-en-input').value = lv.nameEn || '';
  document.getElementById('level-score-input').value = lv.minScore;
}

async function saveLevel() {
  const name = document.getElementById('level-name-input').value.trim();
  const nameEn = document.getElementById('level-name-en-input')?.value.trim() || '';
  const minScore = parseInt(document.getElementById('level-score-input').value);
  const editId = document.getElementById('level-edit-id').value;
  if (!name || isNaN(minScore)) { toast((currentLang === 'it' ? 'Compila nome e punteggio minimo' : 'Fill in name and minimum score'), 'error'); return; }

  let levels = getData('levels', []);
  if (editId) {
    const idx = levels.findIndex(l => l.id === editId);
    if (idx >= 0) {
      levels[idx] = { ...levels[idx], name, nameEn, minScore };
      await fsSave('levels', levels[idx]);
    }
  } else {
    const newLevel = { name, nameEn, minScore };
    const saved = await fsSave('levels', newLevel);
    levels.push(saved);
  }
  _cache.levels = levels;
  document.getElementById('level-edit-id').value = '';
  document.getElementById('level-name-input').value = '';
  document.getElementById('level-name-en-input').value = '';
  document.getElementById('level-score-input').value = '';
  renderAdminPunteggi();
  toast((currentLang === 'it' ? 'Livello salvato!' : 'Level saved!'), 'success');
}

async function deleteLevel(id) {
  if (!confirm(currentLang === 'it' ? 'Eliminare questo livello?' : 'Delete this level?')) return;
  let levels = getData('levels', []);
  levels = levels.filter(l => l.id !== id);
  _cache.levels = levels;
  await fsDelete('levels', id);
  renderAdminPunteggi();
}

// ============================================================
//  RISORSE
// ============================================================
async function saveEmailCounter() {
  const val = parseInt(document.getElementById('email-count-edit').value);
  if (isNaN(val) || val < 0) { toast('Valore non valido', 'error'); return; }
  await fsSave('email_stats', { id: 'monthly', count: val });
  toast('Contatore aggiornato!', 'success');
  renderAdminRisorse();
}

async function renderAdminRisorse() {
  // Email counter — reads from same source as Mail tab
  try {
    const now = new Date();
    const monthKey = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
    const { doc, getDoc } = window._fb;
    const ref = doc(db, 'email_stats', 'counter');
    let count = 0;
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        count = (data.months && data.months[monthKey]) || 0;
      }
    } catch(e) {}
    const pct = Math.min(Math.round(count / 200 * 100), 100);
    const color = pct >= 90 ? '#ff4444' : pct >= 70 ? '#ffb400' : 'var(--accent)';
    const el = document.getElementById('email-count-display');
    if (el) el.textContent = count;
    const editEl = document.getElementById('email-count-edit');
    if (editEl) editEl.value = count;
    const label = document.getElementById('email-count-label');
    if (label) label.textContent = count + ' / 200';
    const pctEl = document.getElementById('email-count-pct');
    if (pctEl) pctEl.textContent = pct + '%';
    const bar = document.getElementById('email-count-bar');
    if (bar) { bar.style.width = pct + '%'; bar.style.background = color; }
  } catch(e) { console.error('Email stats error', e); }

  // Firebase doc count
  try {
    const collections = ['users', 'figurines', 'series', 'posts', 'segnalazioni', 'eventi'];
    let total = 0;
    for (const col of collections) {
      const docs = await fsGetAll(col);
      total += docs.length;
    }
    const el = document.getElementById('firebase-docs-count');
    if (el) el.textContent = total.toLocaleString('it-IT');
  } catch(e) { console.error('Firebase stats error', e); }
}

// ============================================================
//  EVENTI
// ============================================================
async function logEvent(type, description, extra = {}) {
  const event = {
    type,
    description,
    date: new Date().toISOString(),
    read: false,
    ...extra
  };
  try {
    const saved = await fsSave('eventi', event);
    if (!_cache.eventi) _cache.eventi = [];
    _cache.eventi.push(saved);
    updateBellBadge();
  } catch(e) { console.error('logEvent error:', e); }
}

function renderAdminEventi() {
  const el = document.getElementById('admin-eventi-table');
  if (!el) return;
  const eventi = (_cache.eventi || []).sort((a,b) => new Date(b.date) - new Date(a.date));
  if (!eventi.length) {
    el.innerHTML = '<p style="color:var(--muted);">Nessun evento ancora.</p>';
    return;
  }
  const typeIcon = { 'new_user': '👤', 'new_post': '📝', 'reset_pwd': '🔑', 'login': '🔓' };
  const noBellEvTypes = ['login'];
  el.innerHTML = `<table class="data-table compact"><thead><tr>
    <th>${(currentLang === 'it') ? 'Data' : 'Date'}</th><th>${(currentLang === 'it') ? 'Tipo' : 'Type'}</th><th>${(currentLang === 'it') ? 'Descrizione' : 'Description'}</th><th></th>
  </tr></thead><tbody>
  ${eventi.map(e => `<tr style="${e.read ? '' : 'background:rgba(181,255,46,0.05);'}">
    <td style="white-space:nowrap;font-size:0.82rem;">${new Date(e.date).toLocaleDateString('it-IT')} ${new Date(e.date).toLocaleTimeString('it-IT', {hour:'2-digit',minute:'2-digit'})}</td>
    <td>${typeIcon[e.type] || '📌'}</td>
    <td>${e.description}</td>
    <td><button class="tbl-btn tbl-btn-edit" onclick="markEventRead('${e.id}')">${e.read ? '✓' : 'Segna letto'}</button></td>
  </tr>`).join('')}
  </tbody></table>`;
}

async function markEventRead(id) {
  const idx = (_cache.eventi || []).findIndex(e => e.id === id);
  if (idx < 0) return;
  _cache.eventi[idx].read = true;
  await fsSave('eventi', _cache.eventi[idx]);
  updateBellBadge();
  renderAdminEventi();
}

// ============================================================
//  SEGNALAZIONI
// ============================================================
function updateBellBadge() {
  const badge = document.getElementById('nav-bell-badge');
  if (!badge) return;
  const segnalazioni = _cache.segnalazioni || [];
  const eventi = _cache.eventi || [];
  const noBellTypes = ['login'];
  const unread = segnalazioni.filter(s => !s.read).length + eventi.filter(e => !e.read && !noBellTypes.includes(e.type)).length;
  if (unread > 0) {
    badge.style.display = '';
    badge.textContent = unread > 9 ? '9+' : unread;
  } else {
    badge.style.display = 'none';
  }
}

function openFigDetail(figId) {
  const allFigs = getData('figurines', []);
  const f = allFigs.find(x => x.id === figId);
  if (!f) return;
  const owned = getOwned();
  const isOwned = owned.includes(f.id);
  const isAdmin = currentUser?.isAdmin;

  // Title
  const titleEl = document.getElementById('fig-detail-title');
  if (titleEl) titleEl.textContent = f.name;

  // Build content
  const rows = [];

  // Sottoserie - show only if populated (admin sees it always in edit modal, not here)
  if (f.subseries) {
    rows.push(`<div class="detail-row"><span class="detail-label">${(currentLang === 'it' ? 'Sottoserie' : 'Subseries')}</span><span class="detail-value">${f.subseries}</span></div>`);
  }

  // Numero
  if (f.number || isAdmin) {
    rows.push(`<div class="detail-row"><span class="detail-label">N.</span><span class="detail-value">${f.number ? String(f.number) : '<span style="color:var(--muted);font-style:italic;">' + (currentLang === 'it' ? 'non numerata' : 'unnumbered') + '</span>'}</span></div>`);
  }

  // Nome
  rows.push(`<div class="detail-row"><span class="detail-label">${(currentLang === 'it' ? 'Nome' : 'Name')}</span><span class="detail-value">${f.name}</span></div>`);

  // Punteggio
  if (f.score > 0 || isAdmin) {
    rows.push(`<div class="detail-row"><span class="detail-label">${currentLang === 'it' ? 'Punteggio' : 'Score'}</span><span class="detail-value">${f.score > 0 ? '⭐ ' + f.score + ' pt' : '<span style="color:var(--muted);font-style:italic;">' + (currentLang === 'it' ? 'non assegnato' : 'not assigned') + '</span>'}</span></div>`);
  }

  // Taglia (only for series with hasSizes)
  const figSeries = getData('series', []).find(s => s.id === f.seriesId);
  if (figSeries?.hasSizes || (isAdmin && figSeries?.hasSizes)) {
    if (f.size || isAdmin) {
      rows.push(`<div class="detail-row"><span class="detail-label">${(currentLang === 'it' ? 'Taglia' : 'Size')}</span><span class="detail-value">${f.size || '<span style="color:var(--muted);font-style:italic;">' + (currentLang === 'it' ? 'non impostata' : 'not set') + '</span>'}</span></div>`);
    }
  }

  // Numero di variazioni esistenti - always show (default 1)
  rows.push(`<div class="detail-row"><span class="detail-label">${(currentLang === 'it' ? 'Variazioni' : 'Variations')}</span><span class="detail-value">${f.backNumber || 1}</span></div>`);

  // Foto (shown in separate right column)
  const photoEl = document.getElementById('fig-detail-photo');
  if (photoEl) {
    photoEl.innerHTML = f.img ? `<img src="${cloudinaryUrl(f.img, 'w_300,h_300,c_fit,q_auto,f_auto')}" style="width:160px;height:100%;object-fit:contain;border-radius:8px;background:var(--card2);padding:4px;">` : '<div style="width:160px;background:var(--card2);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:0.75rem;text-align:center;padding:8px;flex:1;">Foto non ancora disponibile</div>';
  }

  // Ce l'ho toggle
  if (currentUser) {
    rows.push(`<div class="detail-row" style="align-items:center;">
      <span class="detail-label">${currentLang === 'it' ? "Ce l'ho" : 'I own this'}</span>
      <button class="toggle-btn-blue ${isOwned ? 'on' : ''}" id="fig-detail-toggle" onclick="toggleOwnedFromDetail('${f.id}')"></button>
    </div>`);
  }

  // Bottom buttons
  if (isAdmin) {
    rows.push(`<div style="margin-top:1rem;display:flex;gap:0.5rem;justify-content:flex-end;">
      <button onclick="editItemFromDetail('${f.id}')" style="font-size:0.82rem;padding:4px 12px;border-radius:8px;border:1px solid var(--accent);background:transparent;color:var(--accent);cursor:pointer;">✏️ ${(currentLang === 'it') ? 'Modifica' : 'Edit'}</button>
      <button onclick="deleteItemFromDetail('${f.id}')" style="font-size:0.82rem;padding:4px 12px;border-radius:8px;border:1px solid #ff6464;background:transparent;color:#ff6464;cursor:pointer;">🗑️ ${(currentLang === 'it') ? 'Elimina' : 'Delete'}</button>
    </div>`);
  } else if (currentUser) {
    rows.push(`<div style="margin-top:1rem;text-align:right;">
      <button onclick="closeModal('fig-detail-modal');openSegnalazioneModal('${f.id}')" style="font-size:0.82rem;padding:4px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:var(--muted);cursor:pointer;">🚩 ${currentLang === 'it' ? 'Segnala errore' : 'Report error'}</button>
    </div>`);
  }

  document.getElementById('fig-detail-content').innerHTML = rows.join('');
  document.getElementById('fig-detail-modal').classList.remove('hidden');
}

function editItemFromDetail(itemId) {
  const item = getData('figurines', []).find(x => x.id === itemId);
  if (!item) return;
  currentSection = item.section;
  currentSeriesId = item.seriesId;
  closeModal('fig-detail-modal');
  openAddItemModal(itemId);
}

async function deleteItemFromDetail(itemId) {
  if (!confirm(currentLang === 'it' ? 'Eliminare questa figurina?' : 'Delete this sticker?')) return;
  await fsDelete('figurines', itemId);
  _cache.figurines = (_cache.figurines || []).filter(x => x.id !== itemId);
  closeModal('fig-detail-modal');
  renderItems();
  toast(currentLang === 'it' ? 'Eliminata! 🗑️' : 'Deleted! 🗑️', 'success');
}

function toggleOwnedFromDetail(figId) {
  toggleOwned(figId);
  const owned = getOwned();
  // Update toggle button in modal
  const btn = document.getElementById('fig-detail-toggle');
  if (btn) btn.className = 'toggle-btn-blue ' + (owned.includes(figId) ? 'on' : '');
  // Update the card in the grid without closing the modal
  const card = document.querySelector(`.fig-card[onclick*="${figId}"]`);
  if (card) {
    const toggleBtn = card.querySelector('.toggle-btn-blue');
    if (toggleBtn) toggleBtn.className = 'toggle-btn-blue ' + (owned.includes(figId) ? 'on' : '');
    const badge = card.querySelector('.owned-badge');
    if (badge) badge.style.display = owned.includes(figId) ? '' : 'none';
  }
  // Update progress bar
  const allFigs = (_cache.figurines || getData('figurines',[])).filter(f => f.seriesId === currentSeriesId && f.section === currentSection);
  const ownedCount = allFigs.filter(f => owned.includes(f.id)).length;
  const pct = Math.round(ownedCount / allFigs.length * 100);
  const label = document.getElementById('detail-progress-label');
  const fill = document.getElementById('detail-progress-fill');
  if (label) label.textContent = ownedCount + ' / ' + allFigs.length;
  if (fill) fill.style.width = pct + '%';
}

function openSegnalazioneModal(figId) {
  if (!currentUser) { openAuth('login'); return; }
  document.getElementById('segnalazione-fig-id').value = figId;
  document.getElementById('segnalazione-commento').value = '';
  const fb = document.getElementById('segnalazione-feedback');
  fb.style.display = 'none';
  document.getElementById('segnalazione-modal').classList.remove('hidden');
}

async function inviaSegnalazione() {
  const figId = document.getElementById('segnalazione-fig-id').value;
  const commento = document.getElementById('segnalazione-commento').value.trim();
  if (!commento) { toast('Inserisci un commento', 'error'); return; }
  const allFigs = getData('figurines', []);
  const fig = allFigs.find(f => f.id === figId);
  const series = getData('series', []);
  const serie = fig ? series.find(s => s.id === fig.seriesId) : null;
  const segnalazione = {
    figId,
    figName: fig ? fig.name : 'Sconosciuta',
    figNumber: fig ? fig.number : null,
    serieName: serie ? serie.name : 'Sconosciuta',
    userId: currentUser.id,
    username: currentUser.username,
    commento,
    date: new Date().toISOString(),
    read: false
  };
  const saved = await fsSave('segnalazioni', segnalazione);
  if (!_cache.segnalazioni) _cache.segnalazioni = [];
  _cache.segnalazioni.push(saved);
  const fb = document.getElementById('segnalazione-feedback');
  fb.style.display = '';
  fb.style.cssText = 'display:block;background:rgba(181,255,46,0.1);border:1px solid rgba(181,255,46,0.2);color:var(--accent);padding:0.6rem;border-radius:8px;font-size:0.88rem;margin-bottom:0.75rem;';
  fb.textContent = '✅ Segnalazione inviata! Grazie.';
  setTimeout(() => closeModal('segnalazione-modal'), 1500);
  updateBellBadge();
}

function renderAdminSegnalazioni() {
  const el = document.getElementById('admin-segnalazioni-table');
  const segnalazioni = (_cache.segnalazioni || []).sort((a,b) => new Date(b.date) - new Date(a.date));
  if (!segnalazioni.length) {
    el.innerHTML = '<p style="color:var(--muted);">' + (currentLang === 'it' ? 'Nessuna segnalazione ancora.' : 'No comments yet.') + '</p>';
    return;
  }
  el.innerHTML = `<table class="data-table compact"><thead><tr>
    <th>${(currentLang === 'it') ? 'Data' : 'Date'}</th><th>${(currentLang === 'it') ? 'Utente' : 'User'}</th><th>${(currentLang === 'it') ? 'Figurina' : 'Sticker'}</th><th>${(currentLang === 'it') ? 'Commento' : 'Comment'}</th><th></th>
  </tr></thead><tbody>
  ${segnalazioni.map(s => `<tr style="${s.read ? '' : 'background:rgba(181,255,46,0.05);'}">
    <td style="white-space:nowrap;font-size:0.82rem;">${new Date(s.date).toLocaleDateString('it-IT')}</td>
    <td style="display:flex;align-items:center;gap:6px;">${s.username}${(() => { const u = getData('users',[]).find(x=>x.id===s.userId); return u?.nationalityCode ? `<img src="https://flagcdn.com/w40/${u.nationalityCode}.png" title="${u.nationalityName||''}" style="width:18px;height:12px;object-fit:cover;border-radius:2px;">` : ''; })()}</td>
    <td style="font-size:0.82rem;">${s.serieName}<br><span style="color:var(--muted);">${s.figNumber ? '#'+s.figNumber+' ' : ''}${s.figName}</span></td>
    <td>${s.commento}</td>
    <td style="display:flex;gap:0.4rem;"><button class="tbl-btn tbl-btn-edit" onclick="markSegnalazioneRead('${s.id}')">${s.read ? '✓' : (currentLang === 'it' ? 'Segna letta' : 'Mark read')}</button><button class="tbl-btn tbl-btn-del" onclick="deleteSegnalazione('${s.id}')">${(currentLang === 'it') ? 'Elimina' : 'Delete'}</button></td>
  </tr>`).join('')}
  </tbody></table>`;
}

async function deleteSegnalazione(id) {
  if (!confirm(currentLang === 'it' ? 'Eliminare questa segnalazione?' : 'Delete this comment?')) return;
  await fsDelete('segnalazioni', id);
  _cache.segnalazioni = (_cache.segnalazioni || []).filter(s => s.id !== id);
  updateBellBadge();
  renderAdminSegnalazioni();
  toast(currentLang === 'it' ? 'Segnalazione eliminata' : 'Comment deleted', 'success');
}

async function markSegnalazioneRead(id) {
  const idx = _cache.segnalazioni.findIndex(s => s.id === id);
  if (idx < 0) return;
  _cache.segnalazioni[idx].read = true;
  await fsSave('segnalazioni', _cache.segnalazioni[idx]);
  updateBellBadge();
  renderAdminSegnalazioni();
}

async function markAllSegnalazioniRead() {
  for (const s of _cache.segnalazioni.filter(s => !s.read)) {
    s.read = true;
    await fsSave('segnalazioni', s);
  }
  updateBellBadge();
  renderAdminSegnalazioni();
  toast((currentLang === 'it' ? 'Tutte le segnalazioni segnate come lette' : 'All reports marked as read'), 'success');
}

function openViewUserModal(userId) {
  const user = getData('users', []).find(u => u.id === userId);
  if (!user) return;
  const joined = user.joined ? new Date(user.joined).toLocaleDateString('it-IT') : '—';
  const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('it-IT') + ' ' + new Date(user.lastLogin).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}) : 'mai';
  const role = user.isAdmin ? 'Admin' : 'Collezionista';
  const flag = user.nationalityCode ? `<img src="${flagUrl(user.nationalityCode)}" style="width:20px;height:14px;object-fit:cover;border-radius:2px;vertical-align:middle;margin-left:4px;">` : '';

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;';
  modal.innerHTML = `
    <div class="modal" style="max-width:600px;width:95%;">
      <div class="modal-header">
        <h2 class="modal-title">👤 ${user.username}</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
      <div style="display:grid;gap:0.75rem;">
        <div class="detail-row"><span class="detail-label">Username</span><span class="detail-value">${user.username} ${flag}</span></div>
        <div class="detail-row"><span class="detail-label">E-mail</span><span class="detail-value">${user.email}</span></div>
        <div class="detail-row"><span class="detail-label">Tipologia</span><span class="detail-value">${role}</span></div>
        <div class="detail-row"><span class="detail-label">Iscritto dal</span><span class="detail-value">${joined}</span></div>
        <div class="detail-row"><span class="detail-label">Ultima login</span><span class="detail-value">${lastLogin}</span></div>
        <div class="detail-row"><span class="detail-label">Nome</span><span class="detail-value">${[user.nome, user.cognome].filter(Boolean).join(' ') || '—'}</span></div>
        <div class="detail-row"><span class="detail-label">Età</span><span class="detail-value">${user.eta ? user.eta + ' anni' : '—'}</span></div>
        <div class="detail-row"><span class="detail-label">Sesso</span><span class="detail-value">${user.sesso === 'M' ? 'Maschio' : user.sesso === 'F' ? 'Femmina' : user.sesso === 'A' ? 'Non specificato' : '—'}</span></div>
        <div class="detail-row"><span class="detail-label">Anni collezione</span><span class="detail-value">${user.anniCollezionismo || '—'}</span></div>
      </div>
    </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

async function deleteUserFromModal() {
  const userId = document.getElementById('edit-user-id').value;
  const users = getData('users', []);
  const user = users.find(u => u.id === userId);
  if (!user) return;
  if (!confirm('Eliminare definitivamente l\'utente ' + user.username + '?')) return;
  await deleteUser(userId);
  closeModal('edit-user-modal');
}

function openEditUserModal(userId) {
  const user = getData('users', []).find(u => u.id === userId);
  if (!user) return;
  document.getElementById('edit-user-id').value = userId;
  document.getElementById('edit-user-username').value = user.username;
  document.getElementById('edit-user-email').value = user.email;
  document.getElementById('edit-user-role').value = user.isAdmin ? 'admin' : 'collector';
  // Update modal title
  const titleEl = document.getElementById('edit-user-modal-title');
  if (titleEl) titleEl.textContent = '👤 ' + user.username;

  // Read-only fields
  const joinedEl = document.getElementById('edit-user-joined');
  if (joinedEl) joinedEl.textContent = user.joined ? new Date(user.joined).toLocaleDateString('it-IT') : '—';
  const lastLoginEl = document.getElementById('edit-user-lastlogin');
  if (lastLoginEl) lastLoginEl.textContent = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('it-IT') + ' ' + new Date(user.lastLogin).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}) : 'mai';
  const nomeEl = document.getElementById('edit-user-nome');
  if (nomeEl) nomeEl.textContent = user.nome || '—';
  const cognomeEl = document.getElementById('edit-user-cognome');
  if (cognomeEl) cognomeEl.textContent = user.cognome || '—';
  const etaEl = document.getElementById('edit-user-eta');
  if (etaEl) etaEl.textContent = user.eta ? user.eta + ' anni' : '—';
  const sessoEl = document.getElementById('edit-user-sesso');
  if (sessoEl) sessoEl.textContent = user.sesso === 'M' ? 'Maschio' : user.sesso === 'F' ? 'Femmina' : user.sesso === 'A' ? 'Non specificato' : '—';
  const anniEl = document.getElementById('edit-user-anni');
  if (anniEl) anniEl.textContent = user.anniCollezionismo || '—';
  const levelEl = document.getElementById('edit-user-level');
  if (levelEl) {
    const owned = (_cache.ownedMap && _cache.ownedMap[user.id]) || [];
    const allFigs = getData('figurines', []);
    const score = allFigs.filter(f => owned.includes(f.id)).reduce((s, f) => s + (f.score || 0), 0);
    // Ensure levels are loaded
    if (!_cache.levels || !_cache.levels.length) {
      fsGetAll('levels').then(lvs => {
        _cache.levels = lvs;
        const lv = getUserLevel(score);
        levelEl.textContent = lv ? lv.name + ' (' + score.toLocaleString('it-IT') + ' pt)' : '— (' + score.toLocaleString('it-IT') + ' pt)';
      });
    } else {
      const lv = getUserLevel(score);
      levelEl.textContent = lv ? lv.name + ' (' + score.toLocaleString('it-IT') + ' pt)' : '— (' + score.toLocaleString('it-IT') + ' pt)';
    }
  }
  const deleteBtn = document.getElementById('edit-user-delete-btn');
  if (deleteBtn) deleteBtn.style.display = user.isAdmin ? 'none' : 'block';
  document.getElementById('edit-user-modal').classList.remove('hidden');
}

async function adminResetPassword() {
  const userId = document.getElementById('edit-user-id').value;
  const users = getData('users', []);
  const user = users.find(u => u.id === userId);
  if (!user) return;
  if (!confirm('Resettare la password di ' + user.username + '? Verrà inviata una password temporanea via e-mail.')) return;

  const tempPwd = generateTempPassword();
  user.password = tempPwd;
  user.mustChangePassword = true;
  const idx = users.findIndex(u => u.id === userId);
  if (idx >= 0) {
    users[idx] = user;
    _cache.users = users;
    await fsSave('users', user);
  }

  await sendEmail(
    user.email,
    user.username,
    'Reset password — Sgorbions Collector',
    'La tua password è stata reimpostata dall\'amministratore.\n\nLa tua nuova password temporanea è: ' + tempPwd + '\n\nAccedi con questa password e cambiala subito dal tuo profilo.'
  );
  incrementEmailCounter(1);
  logEvent('reset_pwd', 'Reset password effettuato da admin per: ' + user.username);

  const fb = document.getElementById('admin-reset-pwd-feedback');
  if (fb) {
    fb.style.cssText = 'display:block;background:rgba(181,255,46,0.1);border:1px solid rgba(181,255,46,0.2);color:var(--accent);padding:0.6rem 1rem;border-radius:8px;font-size:0.88rem;margin-top:0.5rem;';
    fb.textContent = '✅ Password temporanea inviata a ' + user.email;
  }
}

async function saveEditUser() {
  const userId = document.getElementById('edit-user-id').value;
  const username = document.getElementById('edit-user-username').value.trim();
  const email = document.getElementById('edit-user-email').value.trim();
  const isAdmin = document.getElementById('edit-user-role').value === 'admin';
  if (!username || !email) { toast((currentLang === 'it' ? 'Compila tutti i campi' : 'Please fill in all fields'), 'error'); return; }
  const users = getData('users', []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx < 0) return;
  users[idx].username = username;
  users[idx].email = email;
  await fsSave('users', users[idx]);
  _cache.users = users;
  closeModal('edit-user-modal');
  renderAdminUsers();
  toast('Utente aggiornato!', 'success');
}

async function deleteUser(userId) {
  await fsDelete('users', userId);
  _cache.users = _cache.users.filter(u => u.id !== userId);
  renderAdminUsers();
  toast(currentLang === 'it' ? 'Utente eliminato' : 'User deleted', 'success');
}

// ============================================================
//  STATS
// ============================================================
function animateCount(el, target) {
  let current = 0;
  const step = Math.ceil(target / 30);
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(interval);
  }, 40);
}
function renderHomeStats() {
  const series = getData('series', []);
  const figs = getData('figurines', []);
  const users = getData('users', []).filter(u => !u.isAdmin);
  animateCount(document.getElementById('stat-series'), series.length);
  animateCount(document.getElementById('stat-figs'), figs.length);
  animateCount(document.getElementById('stat-users'), users.length);
  updateOwnedCounter();
}

function updateOwnedCounter() {
  const figs = getData('figurines', []);
  const owned = getOwned();
  const ownedCount = figs.filter(f => owned.includes(f.id)).length;
  const total = figs.length;

  // Hero stat
  const wrap = document.getElementById('stat-owned-wrap');
  const heroEl = document.getElementById('stat-owned-hero');
  if (wrap && heroEl) {
    if (currentUser) {
      wrap.style.display = '';
      heroEl.textContent = ownedCount + ' / ' + total;
    } else {
      wrap.style.display = 'none';
    }
  }

  // Navbar counter
  const navEl = document.getElementById('nav-owned-counter');
  if (navEl) {
    if (currentUser) {
      navEl.style.display = '';
      navEl.textContent = (currentLang === 'it' ? 'Mie figurine: ' : 'My stickers: ') + ownedCount + ' / ' + total;
    } else {
      navEl.style.display = 'none';
    }
  }

  // Profile stats
  const profileOwned = document.getElementById('profile-owned');
  if (profileOwned) profileOwned.textContent = ownedCount + ' / ' + total;
}

// ============================================================
//  MODAL HELPERS
// ============================================================
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
const NO_CLICK_CLOSE = ['auth-modal', 'change-pwd-modal', 'reset-pwd-modal', 'profile-invite-modal', 'add-series-modal', 'add-fig-modal'];
document.querySelectorAll('.modal-overlay').forEach(m => {
  if (!NO_CLICK_CLOSE.includes(m.id)) {
    m.addEventListener('click', e => { if (e.target === m) m.classList.add('hidden'); });
  }
});

// ============================================================
//  TOAST
// ============================================================
function toast(msg, type = 'success') {
  const tc = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ============================================================
//  PARTICLES
// ============================================================
function createParticles() {
  const container = document.getElementById('particles');
  const colors = ['#b5ff2e','#ff6b1a','#c84bff','#2effb5'];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 80 + 20;
    p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;background:${colors[Math.floor(Math.random()*colors.length)]};animation-duration:${Math.random()*20+15}s;animation-delay:-${Math.random()*20}s;`;
    container.appendChild(p);
  }
}
createParticles();

// ============================================================
//  SCROLL REVEAL
// ============================================================
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => { el.classList.remove('visible'); obs.observe(el); });
}

// ============================================================
//  RENDER ALL
// ============================================================
function renderAll() {
  applyI18n();
  renderHomeSeries();
  renderHomeStats();

  // Re-render active page
  if (document.getElementById('page-catalog')?.classList.contains('active')) renderCatalog();
  if (document.getElementById('page-blog')?.classList.contains('active')) renderBlog();
  if (document.getElementById('page-classifica')?.classList.contains('active')) renderClassifica();
  if (document.getElementById('page-wantlist')?.classList.contains('active')) renderWantlist();
  if (document.getElementById('page-newsletter')?.classList.contains('active')) { renderNewsletterUsers(); renderEmailLog(); }

  // Re-render items section if open
  if (document.getElementById('items-section')?.style.display !== 'none') {
    const titleEl = document.getElementById('items-section-title');
    if (titleEl && currentSection) titleEl.textContent = getSectionLabel(currentSection);
    renderItems();
    // Re-trigger WIP banner
    if (currentSection && currentSeriesId) {
      const figs = getData('figurines', []).filter(f => f.seriesId === currentSeriesId && f.section === 'figurines');
      const pct = figs.length ? figs.filter(f => f.img).length / figs.length : 1;
      const wipBanner = document.getElementById('wip-photos-banner');
      const wipMsg = document.getElementById('wip-photos-msg');
      if (wipBanner && wipMsg) {
        if (currentSection === 'figurines' && pct < 0.5 && figs.length > 0) {
          wipMsg.textContent = currentLang === 'it'
            ? 'Sito ancora in allestimento: le foto delle figurine saranno inserite prossimamente.'
            : 'Site still being set up: sticker photos will be added soon.';
          wipBanner.style.display = '';
        } else {
          wipBanner.style.display = 'none';
        }
      }
    }
  }

  // Re-render admin if open
  if (document.getElementById('admin-panel')?.style.display === 'block') {
    const activeTab = document.querySelector('.admin-tab.active');
    if (activeTab) {
      const tab = activeTab.getAttribute('onclick')?.match(/adminTab\('(\w+)'\)/)?.[1];
      if (tab) adminTab(tab);
    }
  }

  if (document.getElementById('page-profile')?.classList.contains('active')) renderProfile();
}

// ============================================================
//  EMAIL COUNTER
// ============================================================
async function logEmail(toEmail, subject) {
  try {
    await fsSave('email_log', {
      to: toEmail,
      subject: subject,
      date: new Date().toISOString()
    });
    // Keep only latest 200 in Firebase
    try {
      const allLogs = await fsGetAll('email_log');
      if (allLogs.length > 200) {
        allLogs.sort((a,b) => new Date(a.date) - new Date(b.date));
        const toDelete = allLogs.slice(0, allLogs.length - 200);
        for (const log of toDelete) await fsDelete('email_log', log.id);
      }
    } catch(e) { console.error('email_log trim error', e); }
    // Refresh log if Mail tab is open
    if (typeof renderEmailLog === 'function') {
      const mailTab = document.getElementById('admin-email-log');
      if (mailTab && mailTab.offsetParent !== null) renderEmailLog();
    }
  } catch(e) { console.error('logEmail error', e); }
}

async function incrementEmailCounter(count) {
  try {
    const now = new Date();
    const monthKey = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
    // Get current stats from Firebase
    const { doc, getDoc, setDoc } = window._fb;
    const ref = doc(db, 'email_stats', 'counter');
    let data = { total: 0, months: {} };
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) data = snap.data();
    } catch(e) {}
    data.total = (data.total || 0) + count;
    if (!data.months) data.months = {};
    data.months[monthKey] = (data.months[monthKey] || 0) + count;
    await setDoc(ref, data);
    renderEmailCounter(data, monthKey);
  } catch(e) { console.error('Email counter error', e); }
}

async function manualFixCounter() {
  const val = parseInt(document.getElementById('fix-counter-input').value);
  if (isNaN(val) || val < 0) { toast('Inserisci un numero valido', 'error'); return; }
  if (!confirm('Impostare il contatore mensile a ' + val + '?')) return;
  const now = new Date();
  const monthKey = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
  const { doc, getDoc, setDoc } = window._fb;
  const ref = doc(db, 'email_stats', 'counter');
  let data = { total: 0, months: {} };
  try { const snap = await getDoc(ref); if (snap.exists()) data = snap.data(); } catch(e) {}
  const diff = val - (data.months?.[monthKey] || 0);
  data.months[monthKey] = val;
  data.total = Math.max(0, (data.total || 0) + diff);
  await setDoc(ref, data);
  renderEmailCounter(data, monthKey);
  toast('Contatore aggiornato a ' + val, 'success');
}

async function fixEmailCounter() {
  // One-time fix to align counter with EmailJS real count
  const now = new Date();
  const monthKey = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
  const { doc, setDoc } = window._fb;
  const ref = doc(db, 'email_stats', 'counter');
  await setDoc(ref, { total: 9, months: { [monthKey]: 9 } });
  renderEmailCounter({ total: 9, months: { [monthKey]: 9 } }, monthKey);
  toast('Contatore aggiornato a 9', 'success');
}

async function loadEmailCounter() {
  try {
    const { doc, getDoc } = window._fb;
    const ref = doc(db, 'email_stats', 'counter');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const now = new Date();
      const monthKey = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
      renderEmailCounter(snap.data(), monthKey);
    } else {
      renderEmailCounter({ total: 0, months: {} }, '');
    }
  } catch(e) { console.error('Load counter error', e); }
}

function renderEmailCounter(data, monthKey) {
  const monthEl = document.getElementById('email-count-month');
  const totalEl = document.getElementById('email-count-total');
  if (monthEl) monthEl.textContent = (data.months?.[monthKey] || 0) + ' / 200';
  if (totalEl) totalEl.textContent = data.total || 0;
}

// ============================================================
//  AVATAR UPLOAD
// ============================================================
async function uploadAvatar(e) {
  const file = e.target.files[0];
  if (!file) return;
  toast((currentLang === 'it' ? 'Caricamento avatar...' : 'Uploading avatar...'), 'success');
  try {
    const url = await uploadToCloudinary(file);
    // Update user in cache and localStorage
    currentUser.avatar = url;
    LOCAL.set('currentUser', currentUser);
    // Update in Firebase
    let users = getData('users', []);
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx >= 0) {
      users[idx].avatar = url;
      _cache.users = users;
      await fsSave('users', users[idx]);
    }
    updateNavUser();
    renderProfile();
    toast('Avatar aggiornato! 🎉', 'success');
  } catch(e) {
    toast((currentLang === 'it' ? 'Errore nel caricamento' : 'Upload error'), 'error');
  }
}

// ============================================================
//  BULK OWNED
// ============================================================
async function setAllOwned(ownAll) {
  if (!currentUser) return;
  const items = getData('figurines', []).filter(f => f.seriesId === currentSeriesId && f.section === 'figurines');
  if (!items.length) return;
  const msg = ownAll ? (currentLang === 'it' ? 'Segnare tutti gli oggetti come posseduti?' : 'Mark all items as owned?') : (currentLang === 'it' ? 'Rimuovere tutti gli oggetti dalla tua collezione?' : 'Remove all items from your collection?');
  if (!confirm(msg)) return;
  let owned = getOwned();
  if (ownAll) {
    items.forEach(f => { if (!owned.includes(f.id)) owned.push(f.id); });
  } else {
    const ids = items.map(f => f.id);
    owned = owned.filter(id => !ids.includes(id));
  }
  if (!_cache.ownedMap) _cache.ownedMap = {};
  _cache.ownedMap[currentUser.id] = owned;
  LOCAL.set('owned_' + currentUser.id, owned);
  saveOwnedToFirebase(currentUser.id, owned);
  renderItems();
  updateOwnedCounter();
  const setAllMsgEl = document.getElementById('set-all-msg');
  if (setAllMsgEl) {
    setAllMsgEl.textContent = ownAll ? (currentLang === 'it' ? '✅ Tutti aggiunti!' : '✅ All added!') : (currentLang === 'it' ? '❌ Tutti rimossi!' : '❌ All removed!');
    setAllMsgEl.style.display = '';
    setTimeout(() => { setAllMsgEl.style.display = 'none'; }, 3000);
  }
}

// ============================================================
//  BULK EDIT VIEW
// ============================================================
let bulkEditActive = false;

function toggleBulkEditView() {
  bulkEditActive = !bulkEditActive;
  const grid = document.getElementById('items-grid');
  const pagination = document.getElementById('items-pagination');
  const paginationTop = document.getElementById('items-pagination-top');
  const bulkView = document.getElementById('bulk-edit-view');
  const btn = document.getElementById('bulk-edit-toggle-btn');

  if (bulkEditActive) {
    if (grid) grid.style.display = 'none';
    if (pagination) pagination.style.display = 'none';
    if (paginationTop) paginationTop.style.display = 'none';
    if (bulkView) bulkView.style.display = '';
    if (btn) btn.textContent = '🔲 Vista griglia';
    renderBulkEditView();
  } else {
    if (grid) grid.style.display = 'grid';
    if (pagination) pagination.style.display = '';
    if (paginationTop) paginationTop.style.display = '';
    if (bulkView) { bulkView.style.display = 'none'; bulkView.innerHTML = ''; }
    if (btn) btn.textContent = currentLang === 'it' ? '📋 Vista tabellare' : '📋 Table view';
  }
}

function renderBulkEditView() {
  const bulkView = document.getElementById('bulk-edit-view');
  if (!bulkView) return;
  const currentSeries = getData('series', []).find(s => s.id === currentSeriesId);
  const currentSeriesHasSizes = currentSeries?.hasSizes || false;
  const currentSeriesHasSubseries = currentSeries?.hasSubseries || false;
  const allItems = (_cache.figurines || getData('figurines', []))
    .filter(f => f.seriesId === currentSeriesId && f.section === currentSection)
    .sort((a,b) => { if (!a.number && !b.number) return (a.subseries||'').localeCompare(b.subseries||''); if (!a.number) return 1; if (!b.number) return -1; return a.number - b.number; });

  if (!allItems.length) { bulkView.innerHTML = `<p style="color:var(--muted);">${currentLang === 'it' ? 'Nessun oggetto ancora.' : 'Nothing here yet.'}</p>`; return; }

  bulkView.innerHTML = `
    <p style="font-size:0.8rem;color:var(--muted);margin-bottom:0.75rem;">${(currentLang === 'it') ? 'Modifica direttamente nelle celle. Le modifiche vengono salvate automaticamente.' : 'Edit directly in the cells. Changes are saved automatically.'}</p>
    <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
      <thead>
        <tr style="background:var(--card2);">
          ${currentSeriesHasSubseries ? '<th style="padding:8px;text-align:left;border-bottom:1px solid var(--border);color:var(--muted);">Sottoserie</th>' : ''}
          <th style="padding:8px;text-align:left;border-bottom:1px solid var(--border);color:var(--muted);">N.</th>
          <th style="padding:8px;text-align:left;border-bottom:1px solid var(--border);color:var(--muted);">Nome</th>
          <th style="padding:8px;text-align:left;border-bottom:1px solid var(--border);color:var(--muted);">${(currentLang === 'it') ? 'Punteggio' : 'Score'}</th>
          ${currentSeriesHasSizes ? '<th style="padding:8px;text-align:left;border-bottom:1px solid var(--border);color:var(--muted);">Taglia</th>' : ''}
          <th style="padding:8px;text-align:left;border-bottom:1px solid var(--border);color:var(--muted);">N. variazioni</th>
          <th style="padding:8px;text-align:left;border-bottom:1px solid var(--border);color:var(--muted);">Azioni</th>
        </tr>
      </thead>
      <tbody>
        ${allItems.map(f => `<tr id="bulk-row-${f.id}" style="border-bottom:1px solid var(--border);">
          ${currentSeriesHasSubseries ? '<td style="padding:4px;"><input data-field="subseries" data-id="'+f.id+'" value="'+(f.subseries||'')+'" style="width:90px;background:var(--card);border:1px solid var(--border);color:var(--text);padding:3px 6px;border-radius:4px;font-size:0.8rem;" onchange="saveBulkCell(this)"></td>' : ''}
          <td style="padding:4px;"><input data-field="number" data-id="${f.id}" value="${f.number||''}" type="number" style="width:60px;background:var(--card);border:1px solid var(--border);color:var(--text);padding:3px 6px;border-radius:4px;font-size:0.8rem;" onchange="saveBulkCell(this)"></td>
          <td style="padding:4px;"><input data-field="name" data-id="${f.id}" value="${f.name||''}" style="width:180px;background:var(--card);border:1px solid var(--border);color:var(--text);padding:3px 6px;border-radius:4px;font-size:0.8rem;" onchange="saveBulkCell(this)"></td>
          <td style="padding:4px;"><input data-field="score" data-id="${f.id}" value="${f.score||0}" type="number" style="width:60px;background:var(--card);border:1px solid var(--border);color:var(--text);padding:3px 6px;border-radius:4px;font-size:0.8rem;" onchange="saveBulkCell(this)"></td>
          ${currentSeriesHasSizes ? '<td style="padding:4px;"><input data-field="size" data-id="'+f.id+'" value="'+(f.size||'')+'" style="width:80px;background:var(--card);border:1px solid var(--border);color:var(--text);padding:3px 6px;border-radius:4px;font-size:0.8rem;" onchange="saveBulkCell(this)"></td>' : ''}
          <td style="padding:4px;"><input data-field="backNumber" data-id="${f.id}" value="${f.backNumber||1}" type="number" style="width:60px;background:var(--card);border:1px solid var(--border);color:var(--text);padding:3px 6px;border-radius:4px;font-size:0.8rem;" onchange="saveBulkCell(this)"></td>
          <td style="padding:4px;"><button class="tbl-btn tbl-btn-del" onclick="deleteFigurine('${f.id}')">✕</button></td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

async function saveBulkCell(input) {
  const figId = input.dataset.id;
  const field = input.dataset.field;
  let value = input.value.trim();

  // Type conversion
  if (field === 'number' || field === 'backNumber') value = value ? parseInt(value) : null;
  if (field === 'score') value = parseInt(value) || 0;

  const figs = getData('figurines', []);
  const idx = figs.findIndex(f => f.id === figId);
  if (idx < 0) return;
  figs[idx][field] = value;
  _cache.figurines = figs;
  await fsSave('figurines', figs[idx]);

  // Visual feedback
  input.style.borderColor = 'var(--accent)';
  setTimeout(() => { input.style.borderColor = 'var(--border)'; }, 800);
}

// ============================================================
//  BULK SCORE
// ============================================================
function openBulkScoreModal() {
  if (!currentUser?.isAdmin) return;
  document.getElementById('bulk-score-input').value = '';
  document.getElementById('bulk-score-modal').classList.remove('hidden');
}

async function saveBulkScore() {
  const score = parseInt(document.getElementById('bulk-score-input').value);
  if (isNaN(score) || score < 0) { toast('Inserisci un punteggio valido', 'error'); return; }
  const items = getData('figurines', []).filter(f => f.seriesId === currentSeriesId && f.section === currentSection);
  if (!items.length) { toast(currentLang === 'it' ? 'Nessun oggetto in questa sezione' : 'No items in this section', 'error'); return; }
  if (!confirm('Assegnare ' + score + ' punti a tutti i ' + items.length + ' oggetti di questa sezione?')) return;
  const fb = document.getElementById('bulk-score-feedback');
  const btn = document.querySelector('#bulk-score-modal .btn-primary');
  if (btn) btn.disabled = true;
  if (fb) { fb.style.display = ''; fb.textContent = (currentLang === 'it' ? '⏳ Salvataggio in corso...' : '⏳ Saving...') + ' 0 / ' + items.length; }
  let saved = 0;
  for (const item of items) {
    item.score = score;
    await fsSave('figurines', item);
    saved++;
    if (fb) fb.textContent = (currentLang === 'it' ? '⏳ Salvataggio in corso...' : '⏳ Saving...') + ' ' + saved + ' / ' + items.length;
  }
  _cache.figurines = getData('figurines', []).map(f => {
    if (f.seriesId === currentSeriesId && f.section === currentSection) f.score = score;
    return f;
  });
  if (fb) fb.textContent = currentLang === 'it' ? '✅ Punteggio assegnato a ' + items.length + ' oggetti!' : '✅ Score assigned to ' + items.length + ' items!';
  if (btn) btn.disabled = false;
  renderItems();
  setTimeout(() => {
    closeModal('bulk-score-modal');
    if (fb) { fb.style.display = 'none'; fb.textContent = ''; }
  }, 1000);
}

// ============================================================
//  CLASSIFICA
// ============================================================
async function renderClassifica() {
  const el = document.getElementById('classifica-list');
  if (!el) return;
  el.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><p class="empty-title">' + (currentLang === 'it' ? 'Caricamento...' : 'Loading...') + '</p></div>';
  // Show anon info banner for logged-in non-admin users
  const anonBanner = document.getElementById('classifica-anon-banner');
  if (anonBanner) anonBanner.style.display = (currentUser && !currentUser.isAdmin) ? '' : 'none';

  // Render levels table on the right
  const levelsEl = document.getElementById('classifica-levels-table');
  if (levelsEl) {
    const levels = getData('levels', []).sort((a,b) => a.minScore - b.minScore);
    if (levels.length) {
      levelsEl.innerHTML = '<table class="data-table"><thead><tr><th>' + (currentLang === 'it' ? 'Livello' : 'Level') + '</th><th>' + (currentLang === 'it' ? 'Da' : 'From') + '</th></tr></thead><tbody>' +
        levels.map(lv => '<tr><td><strong>' + ((currentLang !== 'it' && lv.nameEn) ? lv.nameEn : lv.name) + '</strong></td><td>' + lv.minScore.toLocaleString('it-IT') + ' pt</td></tr>').join('') +
        '</tbody></table>';
    } else {
      levelsEl.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;font-style:italic;">' + (currentLang === 'it' ? 'Nessun livello definito.' : 'No levels defined.') + '</p>';
    }
  }

  const users = getData('users', []).filter(u => !u.isAdmin);
  const allFigs = getData('figurines', []);

  // Calculate score for each user
  const ranking = [];
  for (const user of users) {
    const owned = (_cache.ownedMap && _cache.ownedMap[user.id]) || LOCAL.get('owned_' + user.id) || [];
    const ownedFigs = allFigs.filter(f => owned.includes(f.id));
    const score = ownedFigs.reduce((sum, f) => sum + (f.score || 0), 0);
    const countFigurines = ownedFigs.filter(f => f.section === 'figurines' || !f.section).length;
    const countAlbums = ownedFigs.filter(f => f.section === 'albums').length;
    const countExtras = ownedFigs.filter(f => f.section === 'extras').length;
    ranking.push({ user, score, countFigurines, countAlbums, countExtras });
  }

  ranking.sort((a, b) => b.score - a.score);

  if (!ranking.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">👤</div><p class="empty-title">' + (currentLang === 'it' ? 'Nessun collezionista ancora!' : 'No collectors yet!') + '</p></div>';
    return;
  }

  const medals = ['🥇', '🥈', '🥉', '🏅', '🏅', '🏅', '🏅', '🏅', '🏅', '🏅'];
  const trophies = [
    '<span style="font-size:2rem;">🏆</span>',
    '<span style="font-size:2rem;filter:grayscale(1) brightness(1.8);">🏆</span>',
    '<span style="font-size:2rem;filter:sepia(1) saturate(0.5) brightness(0.8);">🏆</span>'
  ];

  // Count anon users for stable numbering
  let anonCount = 0;
  el.innerHTML = ranking.map((entry, idx) => {
    const { user, score, countFigurines, countAlbums, countExtras } = entry;
    const position = idx + 1;
    const medal = position <= 10 ? medals[idx] : '';
    const isTop3 = position <= 3;
    const isMe = currentUser && user.id === currentUser.id;
    const isAnon = user.isAnonymous && !currentUser?.isAdmin && !isMe;
    if (user.isAnonymous && !isMe) anonCount++;
    const myAnonIdx = isMe && user.isAnonymous ? ranking.slice(0, idx+1).filter(e => e.user.isAnonymous).length : 0;

    const displayName = isAnon
      ? (currentLang === 'it' ? 'Collezionista Anonimo ' + anonCount : 'Anonymous Collector ' + anonCount)
      : user.username;
    const avatarHTML = user.avatar
      ? `<div style="width:40px;height:40px;border-radius:50%;background:url('${user.avatar}') center/cover;border:2px solid ${isTop3 ? 'var(--accent)' : 'var(--border)'};flex-shrink:0;"></div>`
      : `<div style="width:40px;height:40px;border-radius:50%;background:var(--card2);border:2px solid ${isTop3 ? 'var(--accent)' : 'var(--border)'};display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:var(--muted);flex-shrink:0;">${user.username[0].toUpperCase()}</div>`;
    const displayAvatar = isAnon
      ? `<div style="width:40px;height:40px;border-radius:50%;background:var(--card2);border:2px solid ${isTop3 ? 'var(--accent)' : 'var(--border)'};display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">🕵️</div>`
      : avatarHTML;
    const adminNote = user.isAnonymous && currentUser?.isAdmin ? ' <span style="font-size:0.75rem;opacity:0.6;">🕵️ ${user.username}</span>' : '';
    const meNote = isMe && user.isAnonymous
      ? ` <span style="font-size:0.78rem;color:#ffb400;font-family:var(--font-ui);">${currentLang === 'it' ? '(tu — anonimo 🕵️)' : '(you — anonymous 🕵️)'}</span>`
      : isMe ? ` <span style="font-size:0.78rem;color:var(--accent);font-family:var(--font-ui);">${currentLang === 'it' ? '(tu)' : '(you)'}</span>` : '';
    const rowBg = isMe
      ? (isTop3 ? 'rgba(181,255,46,0.1)' : 'rgba(181,255,46,0.04)')
      : (isTop3 ? 'rgba(181,255,46,0.05)' : 'var(--card)');
    const rowBorder = isMe
      ? 'rgba(181,255,46,0.5)'
      : (isTop3 ? 'rgba(181,255,46,0.2)' : 'var(--border)');

    return `<div style="background:${rowBg};border:1px solid ${rowBorder};border-radius:var(--radius-lg);padding:0.4rem 1rem;margin-bottom:0.3rem;display:flex;align-items:center;gap:1rem;">
      <div style="font-size:1.1rem;width:40px;text-align:center;flex-shrink:0;font-family:var(--font-ui);color:${isTop3 ? 'var(--accent)' : 'var(--muted)'};">#${position}</div>
      ${displayAvatar}
      <div style="flex:1;">
        <div style="font-family:var(--font-ui);font-size:1.15rem;color:var(--text);display:flex;align-items:center;gap:6px;flex-wrap:wrap;">${displayName}${adminNote}${meNote}${!isAnon && user.nationalityCode ? `<img src="https://flagcdn.com/w40/${user.nationalityCode}.png" title="${user.nationalityName||''}" style="width:22px;height:15px;object-fit:cover;border-radius:2px;">` : ''}${!isAnon ? `<span style="font-size:0.92rem;color:var(--muted);font-family:var(--font-body);font-weight:400;">(${(currentLang === 'it') ? 'utente dal' : 'member since'} ${user.joined ? new Date(user.joined).toLocaleDateString((currentLang === 'it') ? 'it-IT' : 'en-GB') : '—'})</span>` : ''}</div>
        <div style="font-size:0.82rem;color:var(--muted);margin-top:2px;">${countFigurines} ${(currentLang === 'it') ? 'figurine' : 'stickers'} · ${countAlbums} album · ${countExtras} ${(currentLang === 'it') ? 'altri articoli' : 'extras'}</div>
      </div>
      <div style="display:flex;align-items:center;gap:0.75rem;">
        <div style="text-align:center;">
          <div style="font-family:var(--font-ui);font-size:1.1rem;color:var(--accent);">${score.toLocaleString('it-IT')} pt</div>
          ${(() => { const lv = getUserLevel(score); if (!lv) return ''; const lvName = (currentLang !== 'it' && lv.nameEn) ? lv.nameEn : lv.name; return `<div style="font-size:0.72rem;color:var(--accent);opacity:0.8;font-family:var(--font-ui);">🏅 ${lvName}</div>`; })()}
        </div>
        ${isTop3 ? trophies[idx] : (medal ? `<span style="font-size:1.5rem;">${medal}</span>` : '')}
      </div>
    </div>`;
  }).join('');
}

// ============================================================
//  WANTLIST
// ============================================================
// Wantlist display mode per group: 'both' | 'numbers' | 'names'
const wantlistMode = {};

function toggleWantlistMode(key, mode) {
  wantlistMode[key] = mode;
  renderWantlist();
}

function renderWantlist() {
  if (!currentUser) { showPage('home'); return; }
  const el = document.getElementById('wantlist-content');
  const allFigs = getData('figurines', []);
  const owned = getOwned();
  const missing = allFigs.filter(f => !owned.includes(f.id));
  const series = getData('series', []);

  if (!missing.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🎉</div><p class="empty-title">' + (currentLang === 'it' ? 'Complimenti! Hai tutto!' : 'Congrats! You have it all!') + '</p><p class="empty-sub">' + (currentLang === 'it' ? 'Non ti manca nessuna figurina.' : 'You are not missing any sticker.') + '</p></div>';
    return;
  }

  const bySeries = {};
  missing.forEach(f => {
    if (!bySeries[f.seriesId]) bySeries[f.seriesId] = [];
    bySeries[f.seriesId].push(f);
  });

  const sectionLabels = { figurines: 'Figurine', albums: 'Album', extras: 'Altro Materiale' };

  const sortedEntries = Object.entries(bySeries).sort(([aId], [bId]) => {
    const aS = series.find(x => x.id === aId);
    const bS = series.find(x => x.id === bId);
    return (aS?.order ?? 9999) - (bS?.order ?? 9999);
  });

  el.innerHTML = sortedEntries.map(([sId, figs]) => {
    const s = series.find(x => x.id === sId);
    const allSeriesFigs = allFigs.filter(f => f.seriesId === sId);
    const ownedCount = allSeriesFigs.length - figs.length;
    const bySection = {};
    figs.forEach(f => {
      const sec = f.section || 'figurines';
      if (!bySection[sec]) bySection[sec] = [];
      bySection[sec].push(f);
    });

    return `<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.5rem;margin-bottom:1.5rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem;">
        <span style="font-family:var(--font-display);font-size:1.4rem;">${s ? s.name : 'Serie sconosciuta'}</span>
        <span class="card-badge">${figs.length} ${currentLang === 'it' ? 'mancanti su' : 'missing out of'} ${allSeriesFigs.length}</span>
      </div>
      <div class="progress-bar" style="margin-bottom:1rem;"><div class="progress-fill" style="width:${Math.round(ownedCount/allSeriesFigs.length*100)}%"></div></div>
      ${Object.entries(bySection).map(([sec, items]) => {
        const groupKey = sId + '_' + sec;
        const mode = wantlistMode[groupKey] || 'both';
        const hasNumbers = items.some(f => f.number);
        const hasNames = true;
        const modeSelector = `
          <div style="display:flex;gap:0.5rem;margin-bottom:0.5rem;align-items:center;flex-wrap:wrap;">
            <span style="font-family:var(--font-ui);font-size:0.85rem;color:var(--accent3);">${sectionLabels[sec] || sec}</span>
            <div style="margin-left:auto;display:flex;gap:0.35rem;">
              ${hasNumbers ? `<button onclick="toggleWantlistMode('${groupKey}','numbers')" style="font-size:0.72rem;padding:2px 8px;border-radius:8px;border:1px solid var(--border);background:${mode==='numbers'?'var(--accent3)':'var(--card2)'};color:${mode==='numbers'?'#fff':'var(--muted)'};cursor:pointer;">Solo numeri</button>` : ''}
              <button onclick="toggleWantlistMode('${groupKey}','names')" style="font-size:0.72rem;padding:2px 8px;border-radius:8px;border:1px solid var(--border);background:${mode==='names'?'var(--accent3)':'var(--card2)'};color:${mode==='names'?'#fff':'var(--muted)'};cursor:pointer;">Solo nomi</button>
              <button onclick="toggleWantlistMode('${groupKey}','both')" style="font-size:0.72rem;padding:2px 8px;border-radius:8px;border:1px solid var(--border);background:${mode==='both'?'var(--accent3)':'var(--card2)'};color:${mode==='both'?'#fff':'var(--muted)'};cursor:pointer;">Numeri e nomi</button>
            </div>
          </div>`;
        // If all items in this section are missing, show a simple message
        const allSectionFigs = allFigs.filter(f => f.seriesId === sId && f.section === sec);
        if (items.length === allSectionFigs.length) {
          return `<div style="margin-bottom:0.75rem;">${modeSelector}<div style="color:var(--muted);font-size:0.88rem;font-style:italic;">Ti manca tutta la serie</div></div>`;
        }
        const sorted = items.sort((a,b) => (a.number||0) - (b.number||0));
        const chips = sorted.map(f => {
          let label = '';
          if (mode === 'numbers') label = f.number ? '#' + f.number : (f.subseries ? '['+f.subseries+']' : f.name);
          else if (mode === 'names') label = f.name;
          else label = (f.number ? '#' + f.number + ' ' : (f.subseries ? '['+f.subseries+'] ' : '')) + f.name;
          return `<span style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:var(--text);font-size:0.78rem;padding:2px 8px;border-radius:12px;">${label}</span>`;
        }).join('');
        return `<div style="margin-bottom:0.75rem;">${modeSelector}<div style="display:flex;flex-wrap:wrap;gap:0.4rem;">${chips}</div></div>`;
      }).join('')}
    </div>`;
  }).join('');
}

async function exportOwnedList() {
  if (!currentUser) return;
  const allFigs = getData('figurines', []);
  const owned = getOwned();
  const ownedFigs = allFigs.filter(f => owned.includes(f.id));
  const series = getData('series', []);
  const sectionLabels = { figurines: 'Figurine', albums: 'Album', extras: 'Altro Materiale' };

  const rows = [['Serie', 'Tipo di oggetto', 'Sottoserie', 'Numero', 'Nome']];

  const bySeries = {};
  ownedFigs.forEach(f => {
    if (!bySeries[f.seriesId]) bySeries[f.seriesId] = [];
    bySeries[f.seriesId].push(f);
  });

  const sortedEntries = Object.entries(bySeries).sort(([aId], [bId]) => {
    const aS = series.find(x => x.id === aId);
    const bS = series.find(x => x.id === bId);
    return (aS?.order ?? 9999) - (bS?.order ?? 9999);
  });

  sortedEntries.forEach(([sId, figs]) => {
    const s = series.find(x => x.id === sId);
    const sName = s ? s.name : 'Serie sconosciuta';
    figs.sort((a,b) => (a.number||0) - (b.number||0)).forEach(f => {
      rows.push([
        sName,
        sectionLabels[f.section] || 'Figurine',
        f.subseries || '',
        f.number ? String(f.number) : '',
        f.name
      ]);
    });
  });

  try {
    const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx/xlsx.mjs');
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 8 }, { wch: 35 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'La mia lista');
    XLSX.writeFile(wb, 'mia_lista_' + currentUser.username + '_' + new Date().toLocaleDateString('it-IT').replace(/\//g,'-') + '.xlsx');
    toast('Lista esportata in Excel! 📊', 'success');
  } catch(e) {
    console.error('SheetJS error:', e);
    toast('Errore esportazione', 'error');
  }
}

async function exportWantlist() {
  if (!currentUser) return;
  const allFigs = getData('figurines', []);
  const owned = getOwned();
  const missing = allFigs.filter(f => !owned.includes(f.id));
  const series = getData('series', []);
  const sectionLabels = { figurines: 'Figurine', albums: 'Album', extras: 'Altro Materiale' };

  const rows = [['Serie', 'Tipo di oggetto', 'Sottoserie', 'Numero', 'Nome']];

  const bySeries = {};
  missing.forEach(f => {
    if (!bySeries[f.seriesId]) bySeries[f.seriesId] = [];
    bySeries[f.seriesId].push(f);
  });

  const sortedEntries = Object.entries(bySeries).sort(([aId], [bId]) => {
    const aS = series.find(x => x.id === aId);
    const bS = series.find(x => x.id === bId);
    return (aS?.order ?? 9999) - (bS?.order ?? 9999);
  });

  sortedEntries.forEach(([sId, figs]) => {
    const s = series.find(x => x.id === sId);
    const sName = s ? s.name : 'Serie sconosciuta';
    figs.sort((a,b) => (a.number||0) - (b.number||0)).forEach(f => {
      rows.push([
        sName,
        sectionLabels[f.section] || 'Figurine',
        f.subseries || '',
        f.number ? String(f.number) : '',
        f.name
      ]);
    });
  });

  // Load SheetJS and generate real .xlsx
  try {
    const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx/xlsx.mjs');
    const ws = XLSX.utils.aoa_to_sheet(rows);
    // Set column widths
    ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 8 }, { wch: 35 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mancolista');
    XLSX.writeFile(wb, 'mancolista_' + currentUser.username + '_' + new Date().toLocaleDateString('it-IT').replace(/\//g,'-') + '.xlsx');
    toast('Mancolista esportata in Excel! 📊', 'success');
  } catch(e) {
    console.error('SheetJS error:', e);
    toast('Errore esportazione', 'error');
  }
}

// ============================================================
//  INIT
// ============================================================
applyI18n();
setLang(currentLang);
initReveal();
// Start Firebase — loads all data then renders
initEmailJS();
// Show JS+CSS version in navbar
const jsVerEl = document.getElementById('nav-js-version');
if (jsVerEl) jsVerEl.textContent = JS_VERSION;
const cssVerEl = document.getElementById('nav-css-version');
if (cssVerEl) cssVerEl.textContent = CSS_VERSION;
initFirebase().catch(e => {
  console.warn('Firebase non disponibile, uso dati demo:', e.message);
  loadDemoData();
  showLoadingOverlay(false);
  renderAll();
  updateNavUser();
});

// keyboard close modals
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'));
  }
});
