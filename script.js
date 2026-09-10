
'use strict';

const CONFIG = window.CONFIG || {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- UTILITAIRES ---------- */
const escapeHTML = (str = '') => {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
};

const formatDate = (d) => {
  try {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return ''; }
};

/* ---------- ANNÉE ---------- */
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- HEADER : effet scroll ---------- */
const header = $('#site-header');
const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 12);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- BURGER ---------- */
const burger = $('#burger');
burger?.addEventListener('click', () => {
  const open = header.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(open));
});
$$('.mobile-panel a').forEach(a =>
  a.addEventListener('click', () => {
    header.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  })
);

/* ---------- LIENS CONFIGURÉS ---------- */
if (CONFIG.WHATSAPP_NUMBER) {
  const waLink = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}`;
  ['wa-float', 'contact-whatsapp', 'footer-whatsapp'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.href = waLink; el.target = '_blank'; el.rel = 'noopener'; }
  });
}
if (CONFIG.CONTACT_EMAIL) {
  const mailLink = `mailto:${CONFIG.CONTACT_EMAIL}`;
  ['contact-email'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.href = mailLink;
  });
}

/* ---------- BOUTONS DE TÉLÉCHARGEMENT ---------- */
const btnAndroid = $('#btn-android');
if (btnAndroid) {
  if (CONFIG.ANDROID_APK_URL && CONFIG.ANDROID_APK_URL !== '#') {
    btnAndroid.href = CONFIG.ANDROID_APK_URL;
    btnAndroid.setAttribute('download', '');
  } else {
    btnAndroid.addEventListener('click', (e) => {
      e.preventDefault();
      alert("Le lien de téléchargement de l'APK n'est pas encore configuré.");
    });
  }
}

['btn-webapp', 'btn-ios', 'footer-webapp'].forEach(id => {
  const el = document.getElementById(id);
  if (el && CONFIG.WEB_APP_URL && CONFIG.WEB_APP_URL !== '#') {
    el.href = CONFIG.WEB_APP_URL;
    el.target = '_blank'; el.rel = 'noopener';
  }
});

const qrApk = $('#qr-apk');
if (qrApk && CONFIG.ANDROID_APK_URL && CONFIG.ANDROID_APK_URL !== '#') {
  qrApk.src = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(CONFIG.ANDROID_APK_URL)}`;
}

/* ---------- CONTACT FORM ---------- */
$('#contact-form')?.addEventListener('submit', function (e) {
  e.preventDefault();
  if (!CONFIG.CONTACT_EMAIL) return alert('Email de contact non configuré.');
  const nom = $('#f-nom').value.trim();
  const email = $('#f-email').value.trim();
  const section = $('#f-section').value;
  const message = $('#f-message').value.trim();
  if (!nom || !email || !message) return alert('Merci de remplir tous les champs.');
  const subject = encodeURIComponent(`[UJLoG Étudiants] Message de ${nom} — ${section}`);
  const body = encodeURIComponent(`Nom : ${nom}\nEmail : ${email}\nSection : ${section}\n\nMessage :\n${message}`);
  window.location.href = `mailto:${CONFIG.CONTACT_EMAIL}?subject=${subject}&body=${body}`;
});

/* ---------- TABS TÉLÉCHARGEMENT ---------- */
$$('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    $$('.tab-btn').forEach(b => {
      const active = b === btn;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
    });
    $$('.tab-content').forEach(c => c.classList.toggle('active', c.id === `tab-${tab}`));
  });
});

/* ---------- REVEAL ON SCROLL ---------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
$$('.reveal').forEach(el => revealObserver.observe(el));

/* ---------- COMPTEURS ---------- */
let countersPlayed = false;
const animateCounters = () => {
  if (countersPlayed) return;
  countersPlayed = true;
  $$('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.dataset.suffix || '';
    const duration = 1100;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
};
const statRow = $('.stat-row');
if (statRow) {
  new IntersectionObserver(
    (e) => e.forEach(x => x.isIntersecting && animateCounters()),
    { threshold: 0.4 }
  ).observe(statRow);
}

/* ============================================================
   AVIS — SUPABASE
   Aucune persistance locale. Backend = seule source de vérité.
   ============================================================ */
const TABLE_AVIS = 'avis';
const STATUT_EN_ATTENTE = 'en_attente';
const STATUT_PUBLIE = 'publie';
const MAX_HOME = 5;

/* ---------- Accès client Supabase ---------- */
function getClient() {
  if (!window.SUPA) {
    console.error('[UJLoG] Client Supabase non initialisé.');
    return null;
  }
  return window.SUPA;
}

/* ---------- Lecture distante (avis publiés uniquement) ---------- */
async function fetchAvisPubliés() {
  const db = getClient();
  if (!db) throw new Error('Client Supabase indisponible');

  const { data, error } = await db
    .from(TABLE_AVIS)
    .select('id, nom, note, commentaire, created_at, statut')
    .eq('statut', STATUT_PUBLIE)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/* ---------- Rendu d'un avis (XSS échappé) ---------- */
function renderAvisItem(a) {
  const note = Math.max(1, Math.min(5, parseInt(a.note, 10) || 5));
  const stars = '★'.repeat(note) + '☆'.repeat(5 - note);
  return `
    <article class="avis-item">
      <header class="avis-header">
        <strong>${escapeHTML(a.nom)}</strong>
        <span class="avis-note" aria-label="${note} sur 5">${stars}</span>
        <time class="avis-date">${formatDate(a.created_at)}</time>
      </header>
      <p>${escapeHTML(a.commentaire)}</p>
    </article>`;
}

/* ---------- Section Accueil : 5 derniers avis ---------- */
async function renderAvisHome() {
  const container = $('#avis-container');
  if (!container) return;
  container.innerHTML = '<p class="avis-empty">Chargement des avis…</p>';

  try {
    const avis = await fetchAvisPubliés();
    if (!avis.length) {
      container.innerHTML = '<p class="avis-empty">Soyez le premier à partager votre expérience.</p>';
      return;
    }
    container.innerHTML = avis.slice(0, MAX_HOME).map(renderAvisItem).join('');
  } catch (err) {
    console.error('[UJLoG] Impossible de charger les avis :', err);
    container.innerHTML = '<p class="avis-empty">Impossible de charger les avis pour le moment. Vérifiez votre connexion.</p>';
  }
}

/* ---------- Statistiques (moyenne + distribution) ---------- */
function computeStats(avis) {
  const total = avis.length;
  const sum = avis.reduce((acc, a) => acc + (parseInt(a.note, 10) || 0), 0);
  const moyenne = total ? (sum / total) : 0;
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  avis.forEach(a => {
    const n = parseInt(a.note, 10);
    if (n >= 1 && n <= 5) distribution[n]++;
  });
  return { total, moyenne, distribution };
}

function renderStats(avis) {
  const target = $('#avis-stats');
  if (!target) return;

  if (!avis.length) {
    target.innerHTML = '<p class="avis-empty">Aucun avis publié pour le moment.</p>';
    return;
  }

  const { total, moyenne, distribution } = computeStats(avis);
  const noteArrondie = Math.round(moyenne * 10) / 10;
  const plein = Math.round(moyenne);
  const etoiles = '★'.repeat(plein) + '☆'.repeat(5 - plein);

  const bars = [5, 4, 3, 2, 1].map(n => {
    const count = distribution[n];
    const pct = total ? Math.round((count / total) * 100) : 0;
    return `
      <div class="stars-row">
        <span class="stars-label">${n} ★</span>
        <div class="stars-bar"><span style="width:${pct}%"></span></div>
        <span class="stars-count">${count}</span>
      </div>`;
  }).join('');

  target.innerHTML = `
    <div class="avis-stats-summary">
      <div class="avis-stats-average">
        <strong>${noteArrondie.toFixed(1)}</strong>
        <span class="avis-note">${etoiles}</span>
        <small>${total} avis</small>
      </div>
      <div class="avis-stats-bars">${bars}</div>
    </div>`;
}

/* ---------- Modale : tous les avis + filtres + tri ---------- */
async function renderAvisModal() {
  const container = $('#modal-avis-container');
  if (!container) return;
  container.innerHTML = '<p class="avis-empty">Chargement…</p>';

  const filter = $('#avis-filter')?.value || 'all';
  const sort = $('#avis-sort')?.value || 'recent';

  try {
    let avis = await fetchAvisPubliés();

    // Statistiques calculées à partir de TOUS les avis publiés
    renderStats(avis);

    // Filtre par nombre d'étoiles
    if (filter !== 'all') {
      avis = avis.filter(a => String(a.note) === filter);
    }

    // Tri
    avis.sort((a, b) => {
      const da = new Date(a.created_at).getTime() || 0;
      const db_ = new Date(b.created_at).getTime() || 0;
      switch (sort) {
        case 'ancien': return da - db_;
        case 'note_desc': return (b.note || 0) - (a.note || 0);
        case 'note_asc': return (a.note || 0) - (b.note || 0);
        case 'recent':
        default: return db_ - da;
      }
    });

    container.innerHTML = avis.length
      ? avis.map(renderAvisItem).join('')
      : '<p class="avis-empty">Aucun avis ne correspond à ce filtre.</p>';
  } catch (err) {
    console.error('[UJLoG] Erreur modale avis :', err);
    container.innerHTML = '<p class="avis-empty">Impossible de charger les avis.</p>';
  }
}

/* ---------- Ouverture / fermeture modale ---------- */
const modal = $('#modal-avis');
function openModal() {
  if (!modal) return;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  renderAvisModal();
}
function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = '';
}
$('#btn-all-avis')?.addEventListener('click', openModal);
$('.modal-close')?.addEventListener('click', closeModal);
modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal?.hidden) closeModal(); });
$('#avis-filter')?.addEventListener('change', renderAvisModal);
$('#avis-sort')?.addEventListener('change', renderAvisModal);

/* ---------- ENREGISTREMENT D'UN AVIS DANS SUPABASE ---------- */
$('#avis-form')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const form = this;
  const feedback = $('#avis-feedback');
  const submitBtn = form.querySelector('button[type="submit"]');

  const nom = $('#avis-nom').value.trim();
  const note = parseInt($('#avis-note').value, 10);
  const commentaire = $('#avis-message').value.trim();

  /* ----- Validation client ----- */
  if (!nom) {
    feedback.textContent = 'Merci d’indiquer votre nom.';
    feedback.style.color = '#e74c3c';
    return;
  }
  if (nom.length > 60) {
    feedback.textContent = 'Nom trop long (60 caractères maximum).';
    feedback.style.color = '#e74c3c';
    return;
  }
  if (!(note >= 1 && note <= 5)) {
    feedback.textContent = 'Veuillez choisir une note entre 1 et 5.';
    feedback.style.color = '#e74c3c';
    return;
  }
  if (!commentaire) {
    feedback.textContent = 'Merci d’écrire un commentaire.';
    feedback.style.color = '#e74c3c';
    return;
  }
  if (commentaire.length > 500) {
    feedback.textContent = 'Commentaire trop long (500 caractères maximum).';
    feedback.style.color = '#e74c3c';
    return;
  }

  const db = getClient();
  if (!db) {
    feedback.textContent = "Impossible d'envoyer votre avis pour le moment. Veuillez réessayer.";
    feedback.style.color = '#e74c3c';
    return;
  }

  /* ----- UI : bouton en attente ----- */
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.dataset.original = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi…';
  }
  feedback.textContent = '';
  feedback.style.color = '';

  try {
    /* ----- Insertion distante (statut forcé côté client ET côté serveur via RLS) ----- */
    const { error } = await db
      .from(TABLE_AVIS)
      .insert([{
        nom: nom.slice(0, 60),
        note: note,
        commentaire: commentaire.slice(0, 500),
        statut: STATUT_EN_ATTENTE
      }]);

    if (error) throw error;

    /* ----- Succès confirmé par Supabase ----- */
    feedback.textContent = 'Merci pour votre avis ! Il sera publié après validation.';
    feedback.style.color = 'var(--green-600)';
    form.reset();
    // On ne rafraîchit pas la liste : l'avis est "en_attente", donc invisible.
  } catch (err) {
    console.error('[UJLoG] Échec insertion Supabase :', err);
    let msg = "Impossible d'envoyer votre avis pour le moment. Veuillez réessayer.";
    if (err?.code === '42501' || /row-level security/i.test(err?.message || '')) {
      msg = "L'envoi a été refusé par le serveur. Contactez l'administrateur.";
    }
    feedback.textContent = msg;
    feedback.style.color = '#e74c3c';
    // AUCUN stockage local — l'avis n'est PAS enregistré dans le navigateur.
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = submitBtn.dataset.original || 'Envoyer mon avis';
    }
  }
});

/* ---------- Chargement initial des avis ---------- */
renderAvisHome();