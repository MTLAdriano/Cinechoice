# ◈ CinéScope

Application de recommandation de films personnalisée — synchro multi-appareils via Firebase, IA via Claude.

---

## 🚀 Déploiement en 3 étapes

### Étape 1 — Firebase

1. Va sur [console.firebase.google.com](https://console.firebase.google.com)
2. Crée un projet → **Ajouter une app Web**
3. Copie la config et colle-la dans `firebase.js` (section `firebaseConfig`)
4. Active **Authentication** → E-mail/Mot de passe
5. Active **Firestore Database** → mode Production
6. Dans Firestore → **Règles**, colle ceci :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /films/{filmId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### Étape 2 — GitHub Pages

```bash
# 1. Crée un repo GitHub (ex: cinescope)
# 2. Clone ou initialise
git init
git add .
git commit -m "Initial CinéScope"
git remote add origin https://github.com/MTLAdriano/cinescope.git
git push -u origin main

# 3. Active GitHub Pages
# GitHub → Settings → Pages → Source: main branch → root /
# Ton app sera dispo sur : https://MTLAdriano.github.io/cinescope/
```

### Étape 3 — Clé API Claude

1. Va sur [console.anthropic.com](https://console.anthropic.com)
2. Crée une clé API
3. Dans l'app → Profil → **Clé API Claude** → colle ta clé
4. La clé est stockée localement sur chaque appareil (jamais dans Firebase)

---

## 📁 Structure du projet

```
cinescope/
├── index.html   — Structure HTML, écrans, navigation
├── app.js       — Logique : Auth, Wizard, IA, Films, Settings
├── firebase.js  — SDK Firebase (Auth + Firestore)
├── style.css    — Thème sombre, responsive
└── README.md
```

---

## ✨ Fonctionnalités

- **Wizard de soir** — 4 questions (solo/couple, ambiance, durée, envies)
- **Recommandations IA** — Claude analyse ton historique + profil + plateforme
- **Fiches détaillées** — synopsis, casting, lien trailer YouTube, score de compatibilité
- **Import Letterboxd** — dépose ton `watched.csv` pour importer tout ton historique
- **Synchro Firebase** — identique sur téléphone, tablette, ordi
- **Profil copine** — ses genres sont pris en compte en mode couple
- **Mode hors-ligne partiel** — suggestions de secours si pas de clé API

---

## 🔄 Mettre à jour l'app

```bash
git add .
git commit -m "Mise à jour"
git push
```
GitHub Pages se met à jour automatiquement en ~1 minute.

---

## 🔒 Sécurité

- Les mots de passe sont gérés par Firebase Auth (jamais stockés)
- La clé API Claude est stockée dans `localStorage` (jamais envoyée à Firebase)
- Les données Firestore sont isolées par utilisateur (règles strictes)
