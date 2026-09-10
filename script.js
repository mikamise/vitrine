/* ==================== CONFIGURATION ==================== */
if (typeof CONFIG === 'undefined') {
  var CONFIG = {
    WHATSAPP_NUMBER: "2250594408458",
    ANDROID_APK_URL: "#",
    WEB_APP_URL: "#",
    CONTACT_EMAIL: "contact@example.com",
    JSONBIN_BIN_ID: "",
    JSONBIN_API_KEY: ""
  };
  console.warn("config.js non trouvé – utilisation des valeurs par défaut.");
}

document.getElementById('year').textContent = new Date().getFullYear();

/* ==================== MENU BURGER AVEC ANIMATION ==================== */
const burger = document.getElementById('burger');
const header = document.getElementById('site-header');
const mobilePanel = document.getElementById('mobile-panel');

burger.addEventListener('click', () => {
  const isOpen = header.classList.toggle('open');
  burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  // Animation du burger
  burger.classList.toggle('active');
});

// Fermeture du menu au clic sur un lien
document.querySelectorAll('.mobile-panel a').forEach(a => {
  a.addEventListener('click', () => {
    header.classList.remove('open');
    burger.classList.remove('active');
    burger.setAttribute('aria-expanded', 'false');
  });
});

/* ==================== WHATSAPP & EMAIL ==================== */
const waLink = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}`;
['wa-float', 'contact-whatsapp', 'footer-whatsapp', 'footer-whatsapp2'].forEach(id => {
  const el = document.getElementById(id);
  if (el) { el.href = waLink; el.target = "_blank"; el.rel = "noopener"; }
});

const mailLink = `mailto:${CONFIG.CONTACT_EMAIL}`;
['contact-email', 'footer-email'].forEach(id => {
  const el = document.getElementById(id);
  if (el) { el.href = mailLink; }
});

/* ==================== DOWNLOAD LINKS ==================== */
// Android : téléchargement direct
const btnAndroid = document.getElementById('btn-android');
if (btnAndroid && CONFIG.ANDROID_APK_URL && CONFIG.ANDROID_APK_URL !== "#") {
  btnAndroid.href = CONFIG.ANDROID_APK_URL;
  btnAndroid.setAttribute('download', '');
} else {
  btnAndroid.href = "#";
  btnAndroid.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Lien de téléchargement APK non configuré. Veuillez contacter l\'administrateur.');
  });
}

// Web App
document.getElementById('btn-webapp').href = CONFIG.WEB_APP_URL;
document.getElementById('footer-webapp').href = CONFIG.WEB_APP_URL;

/* ==================== CONTACT FORM ==================== */
document.getElementById('contact-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const nom = document.getElementById('f-nom').value;
  const email = document.getElementById('f-email').value;
  const section = document.getElementById('f-section').value;
  const message = document.getElementById('f-message').value;
  const subject = encodeURIComponent(`[UJLoG Étudiants] Message de ${nom} — ${section}`);
  const body = encodeURIComponent(`Nom : ${nom}\nEmail : ${email}\nSection : ${section}\n\nMessage :\n${message}`);
  window.location.href = `mailto:${CONFIG.CONTACT_EMAIL}?subject=${subject}&body=${body}`;
});

/* ==================== AVIS & SUGGESTIONS (JSONbin + localStorage) ==================== */
const STORAGE_KEY = 'ujlog_avis';

// Charger les avis depuis JSONbin
async function loadAvis() {
  if (!CONFIG.JSONBIN_BIN_ID || !CONFIG.JSONBIN_API_KEY) {
    console.warn('JSONbin non configuré – utilisation localStorage uniquement');
    return loadLocalAvis();
  }
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': CONFIG.JSONBIN_API_KEY }
    });
    if (!response.ok) throw new Error('Erreur JSONbin');
    const data = await response.json();
    return data.record || [];
  } catch (e) {
    console.warn('JSONbin non disponible, fallback localStorage', e);
    return loadLocalAvis();
  }
}

// Sauvegarder un avis dans JSONbin
async function saveAvis(avisData) {
  if (!CONFIG.JSONBIN_BIN_ID || !CONFIG.JSONBIN_API_KEY) {
    saveLocalAvis(avisData);
    return false;
  }
  const avis = await loadAvis();
  avis.push({ ...avisData, date: new Date().toISOString() });
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': CONFIG.JSONBIN_API_KEY
      },
      body: JSON.stringify(avis)
    });
    if (!response.ok) throw new Error('Erreur sauvegarde JSONbin');
    return true;
  } catch (e) {
    console.warn('Sauvegarde JSONbin échouée, fallback localStorage', e);
    saveLocalAvis(avisData);
    return false;
  }
}

function loadLocalAvis() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveLocalAvis(avisData) {
  const avis = loadLocalAvis();
  avis.push({ ...avisData, date: Date.now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(avis));
}

// Afficher les avis (5 premiers + bouton "Voir plus")
async function renderAvis(showAll = false) {
  const container = document.getElementById('avis-container');
  const avis = await loadAvis();
  const voirBtn = document.getElementById('voir-plus-avis');

  if (avis.length === 0) {
    container.innerHTML = `<p style="color:var(--ink-600);font-style:italic;">Aucun avis pour le moment. Soyez le premier à donner votre avis !</p>`;
    voirBtn.style.display = 'none';
    return;
  }

  const sorted = avis.slice().reverse();
  const displayCount = showAll ? sorted.length : Math.min(5, sorted.length);
  const toDisplay = sorted.slice(0, displayCount);

  container.innerHTML = toDisplay.map(a => `
    <div class="avis-item">
      <div class="avis-header">
        <strong>${escapeHTML(a.nom)}</strong>
        <span class="avis-note">${'⭐'.repeat(a.note)}</span>
        <span class="avis-date">${new Date(a.date).toLocaleDateString('fr-FR')}</span>
      </div>
      <p>${escapeHTML(a.message)}</p>
    </div>
  `).join('');

  // Afficher ou masquer le bouton "Voir plus"
  if (avis.length > 5 && !showAll) {
    voirBtn.style.display = 'flex';
    voirBtn.innerHTML = `<i class="fas fa-chevron-down"></i> Voir plus d'avis (${avis.length - 5} restants)`;
  } else if (showAll) {
    voirBtn.style.display = 'flex';
    voirBtn.innerHTML = `<i class="fas fa-chevron-up"></i> Réduire`;
  } else {
    voirBtn.style.display = 'none';
  }
}

// Gestion du bouton "Voir plus"
let showAllAvis = false;
document.getElementById('voir-plus-avis').addEventListener('click', function () {
  showAllAvis = !showAllAvis;
  renderAvis(showAllAvis);
  // Scroll vers le début de la liste
  document.querySelector('.avis-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Gestion du formulaire d'avis
document.getElementById('avis-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const nom = document.getElementById('avis-nom').value.trim();
  const note = parseInt(document.getElementById('avis-note').value, 10);
  const message = document.getElementById('avis-message').value.trim();

  if (!nom || !message) {
    document.getElementById('avis-feedback').textContent = 'Veuillez remplir tous les champs.';
    document.getElementById('avis-feedback').style.color = '#e74c3c';
    return;
  }

  const saved = await saveAvis({ nom, note, message });
  renderAvis(showAllAvis);
  const feedback = document.getElementById('avis-feedback');
  feedback.textContent = saved ? 'Merci ! Votre avis a été enregistré en ligne.' : 'Merci ! Votre avis a été enregistré localement (mode hors-ligne).';
  feedback.style.color = 'var(--green-600)';
  this.reset();
});

// Charger les avis au démarrage
renderAvis(false);

/* ==================== SCROLL REVEAL ==================== */
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

/* ==================== ANIMATED COUNTERS ==================== */
const counters = document.querySelectorAll('[data-count]');
let countersPlayed = false;
function playCounters() {
  if (countersPlayed) return;
  countersPlayed = true;
  counters.forEach(el => {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1100;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}
const statRow = document.querySelector('.stat-row');
if (statRow) {
  const statIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) playCounters(); });
  }, { threshold: 0.4 });
  statIo.observe(statRow);
}

/* ==================== QR CODE APK ==================== */
const qrApk = document.getElementById('qr-apk');
if (qrApk && CONFIG.ANDROID_APK_URL && CONFIG.ANDROID_APK_URL !== "#") {
  qrApk.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(CONFIG.ANDROID_APK_URL)}`;
}