// ============================================================
//  UJLoG ÉTUDIANTS — MODÈLE DE CONFIGURATION
//  1. Copiez ce fichier en `config.js`
//  2. Remplacez VOTRE_SUPABASE_URL et VOTRE_SUPABASE_ANON_KEY
//  3. Ne commitez JAMAIS `config.js` (déjà dans .gitignore)
// ============================================================

const CONFIG = {
  // ----- Contact -----
  WHATSAPP_NUMBER: "2250594408458",
  CONTACT_EMAIL: "arnauddossa21@gmail.com",

  // ----- Liens de l'application -----
  ANDROID_APK_URL: "https://exemple.com/mon-app.apk",
  WEB_APP_URL: "https://exemple.com/",

  // ----- Supabase (stockage des avis) -----
  // ⚠️  Utilisez UNIQUEMENT la clé "anon" publique.
  //     N'utilisez JAMAIS la clé "service_role" dans le frontend.
  SUPABASE_URL: "VOTRE_SUPABASE_URL",
  SUPABASE_ANON_KEY: "VOTRE_SUPABASE_ANON_KEY"
};