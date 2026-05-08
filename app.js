// app.js — CinéScope : logique principale
import {
  fbRegister, fbLogin, fbLogout, fbOnAuth,
  fbGetProfile, fbSaveProfile,
  fbGetFilms, fbAddFilm, fbDeleteFilm, fbBulkAddFilms,
  fbGetWatchlist, fbAddToWatchlist, fbRemoveFromWatchlist,
  fbGetAliceFilms, fbAddAliceFilm, fbDeleteAliceFilm
} from "./firebase.js";

// ─── ÉTAT GLOBAL ───────────────────────────────────────────────────────────────
const State = {
  user:        null,
  profile:     null,
  films:       [],       // Adrien's watched films
  watchlist:   [],       // À voir
  aliceFilms:  [],       // Alice's watched films
  viewer:      "adrien", // "adrien", "alice", or "both"
  aliceAddStar: 0,
  addStar:     0,
  wizard: {
    who:    "solo",
    moods:  [],
    dur:    150,
    epoch:  "all",
    extras: []
  }
};

// ─── UTILS ─────────────────────────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }
function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $(`screen-${name}`).classList.add("active");
}
function toast(msg, type = "ok") {
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
function starsHtml(n, max = 5) {
  return "★".repeat(n) + "☆".repeat(max - n);
}
function fmtDur(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${m}` : `${h}h`;
}
function getAPIKey() {
  return localStorage.getItem("cinescope_apikey") || (State.profile && State.profile.groqKey) || "";
}
function getTMDBKey() {
  // First check localStorage, then profile
  return localStorage.getItem("cinescope_tmdbkey") || (State.profile && State.profile.tmdbKey) || "";
}
async function tmdbSearch(title, year) {
  const key = getTMDBKey();
  if (!key) return null;
  try {
    const q = encodeURIComponent(title);
    // Try with year first (en-US for best poster coverage)
    let url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${q}&year=${year}&language=en-US`;
    let res = await fetch(url);
    let data = await res.json();
    if (data.results && data.results.length > 0) return data.results[0];
    // Fallback without year
    url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${q}&language=en-US`;
    res = await fetch(url);
    data = await res.json();
    if (data.results && data.results.length > 0) return data.results[0];
  } catch(e) { console.error("TMDB search error:", e); }
  return null;
}
async function fetchPoster(title, year) {
  const movie = await tmdbSearch(title, year);
  if (movie && movie.poster_path) return `https://image.tmdb.org/t/p/w342${movie.poster_path}`;
  return null;
}
async function fetchBackdrop(title, year) {
  const movie = await tmdbSearch(title, year);
  if (movie && movie.backdrop_path) return `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`;
  if (movie && movie.poster_path) return `https://image.tmdb.org/t/p/w780${movie.poster_path}`;
  return null;
}

// ─── AUTH ──────────────────────────────────────────────────────────────────────
window.Auth = {
  showRegister() {
    $("auth-login").style.display    = "none";
    $("auth-register").style.display = "block";
  },
  showLogin() {
    $("auth-register").style.display = "none";
    $("auth-login").style.display    = "block";
  },
  async login() {
    const email    = $("auth-email").value.trim();
    const password = $("auth-password").value;
    $("auth-error").textContent = "";
    try {
      await fbLogin(email, password);
    } catch (e) {
      $("auth-error").textContent = "Email ou mot de passe incorrect.";
    }
  },
  async register() {
    const email      = $("reg-email").value.trim();
    const password   = $("reg-password").value;
    const letterboxd = $("reg-letterboxd").value.trim();
    $("reg-error").textContent = "";
    if (password.length < 6) { $("reg-error").textContent = "Mot de passe trop court (6 car. min)."; return; }
    try {
      await fbRegister(email, password, letterboxd);
    } catch (e) {
      $("reg-error").textContent = "Cet email est déjà utilisé.";
    }
  },
  async logout() {
    await fbLogout();
    State.user    = null;
    State.profile = null;
    State.films   = [];
    showScreen("auth");
  }
};

// ─── ONBOARDING ────────────────────────────────────────────────────────────────
window.Onboard = {
  next(step) {
    document.querySelectorAll(".onboard-step").forEach(s => s.style.display = "none");
    $(`ob-${step}`).style.display = "block";
  },
  async finish() {
    const platforms = [...document.querySelectorAll("#ob-platforms .plat-btn.active")].map(b => b.dataset.p);
    const genres    = [...document.querySelectorAll("#ob-genres .genre-btn.active")].map(b => b.dataset.g);
    const gfGenres  = [...document.querySelectorAll("#ob-gf-genres .genre-btn.active")].map(b => b.dataset.g);
    await fbSaveProfile(State.user.uid, { platforms, genres, gfGenres, onboarded: true });
    State.profile = { ...State.profile, platforms, genres, gfGenres, onboarded: true };
    Settings.syncUI();
    showScreen("app");
    Nav.goto("reco");
  }
};
// Toggle générique pour les grilles de boutons
document.querySelectorAll(".plat-btn, .genre-btn").forEach(btn => {
  btn.addEventListener("click", () => btn.classList.toggle("active"));
});

// ─── HERO ─────────────────────────────────────────────────────────────────────
window.Hero = {
  data: null,
  async show(film) {
    Hero.data = film;
    const section = $("hero-section");
    if (!section) return;
    section.style.display = "block";
    $("wizard-container").style.display = "none";
    $("hero-title").textContent = film.title;
    $("hero-meta").textContent = `${film.year} · ${film.genre} · ${film.platform}`;
    // Load backdrop
    const backdrop = await fetchBackdrop(film.title, film.year);
    const wrap = $("hero-img-wrap");
    if (backdrop) {
      wrap.innerHTML = `<img src="${backdrop}" alt="${film.title}" class="hero-img">`;
    } else {
      wrap.innerHTML = `<div class="hero-placeholder">🎬</div>`;
    }
  },
  open() {
    if (Hero.data) {
      $("reco-results").style.display = "block";
      $("hero-section").style.display = "none";
    }
  }
};

// ─── NAVIGATION ────────────────────────────────────────────────────────────────
window.Nav = {
  goto(page, btn) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const pageEl = $("page-" + page);
    if (pageEl) pageEl.classList.add("active");
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    else { const nb = document.querySelector('.nav-btn[data-page="' + page + '"]'); if (nb) nb.classList.add("active"); }
    if (page === "films") Films.render();
    if (page === "settings") Settings.syncUI();
    if (page === "watchlist") Watchlist.render();
    if (page === "alice") { Alice.render(); Alice.updateStats(); }
  },
  updateForViewer(viewer) {
    // Everyone sees the same tabs — just different data
    // Hide the "Alice" dedicated tab — it's now integrated
    const navAlice = document.querySelector('.nav-btn[data-page="alice"]');
    if (navAlice) navAlice.style.display = "none";
    // Update Films tab label based on viewer
    const filmsSpan = document.querySelector('.nav-btn[data-page="films"] span');
    if (filmsSpan) filmsSpan.textContent = "Films";
  }
};

// ─── WIZARD ────────────────────────────────────────────────────────────────────
window.Wizard = {
  setWho(who, el) {
    State.wizard.who = who;
    document.querySelectorAll(".who-card").forEach(c => c.classList.remove("active"));
    el.classList.add("active");
  },
  toggleMood(el) {
    const mood = el.dataset.mood;
    el.classList.toggle("active");
    if (el.classList.contains("active")) State.wizard.moods.push(mood);
    else State.wizard.moods = State.wizard.moods.filter(m => m !== mood);
  },
  updateDur(val) {
    State.wizard.dur = +val;
    $("dur-val").textContent = fmtDur(+val);
  },
  toggleChip(el, group) {
    if (group === "epoch") {
      document.querySelectorAll("#epoch-chips .chip").forEach(c => c.classList.remove("active"));
      el.classList.add("active");
      State.wizard.epoch = el.dataset.v;
    } else {
      el.classList.toggle("active");
      const v = el.dataset.v;
      if (el.classList.contains("active")) State.wizard.extras.push(v);
      else State.wizard.extras = State.wizard.extras.filter(e => e !== v);
    }
  },
  goTo(n) {
    document.querySelectorAll(".wstep").forEach(s => s.classList.remove("active"));
    $(`ws-${n}`).classList.add("active");
    document.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("active", i === n - 1));
  },
  reset() {
    State.wizard = { who: "solo", moods: [], dur: 150, epoch: "all", extras: [] };
    document.querySelectorAll(".mood-card, .chip").forEach(el => el.classList.remove("active"));
    document.querySelector(".who-card").classList.add("active");
    document.querySelector("#epoch-chips .chip").classList.add("active");
    $("dur-slider").value = 150;
    $("dur-val").textContent = "2h30";
    $("wizard-container").style.display = "block";
    $("reco-results").style.display     = "none";
    $("film-detail").style.display      = "none";
    $("hero-section").style.display     = "none";
    if (window.RecoActions) RecoActions._queue = [];
    this.goTo(1);
  },
  async launch() {
    $("wizard-container").style.display = "none";
    $("reco-loading").style.display     = "block";
    $("reco-results").style.display     = "none";

    const msgs = [
      "Analyse de ton historique Letterboxd…",
      "Croisement avec tes genres préférés…",
      "Vérification des plateformes disponibles…",
      "Génération des recommandations IA…"
    ];
    let i = 0;
    const bar = $("loading-bar");
    const msg = $("loading-msg");
    bar.style.width = "0%";
    const iv = setInterval(() => {
      i++;
      bar.style.width = (i / msgs.length * 100) + "%";
      if (msgs[i]) msg.textContent = msgs[i];
    }, 700);

    const recos = await AI.getRecos();
    clearInterval(iv);
    bar.style.width = "100%";
    await new Promise(r => setTimeout(r, 300));

    $("reco-loading").style.display = "none";
    $("reco-results").style.display = "block";
    Reco.render(recos);
  }
};

// ─── AI (GROQ / LLAMA) ──────────────────────────────────────────────────────────
window.AI = {
  async getRecos(extra = "") {
    const apiKey = getAPIKey();
    if (!apiKey) {
      toast("Ajoute ta clé API Groq dans Profil → Clé API.", "warn");
      return AI.fallbackRecos();
    }

    const w = State.wizard;
    const p = State.profile || {};
    const seenTitles = State.films.map(f => f.title).join(", ") || "aucun encore";
    const topRated   = State.films.filter(f => f.rating >= 4).map(f => `${f.title} (${f.rating}★)`).slice(0, 15).join(", ") || "aucun encore";

    // Build dynamic ratings from Firebase
    const allRated   = State.films.filter(f => f.rating > 0).sort((a,b) => b.rating - a.rating);
    const loved      = allRated.filter(f => f.rating >= 4.5).map(f => `${f.title} (${f.rating}★)`).join(", ");
    const liked      = allRated.filter(f => f.rating >= 3.5 && f.rating < 4.5).map(f => `${f.title} (${f.rating}★)`).slice(0, 30).join(", ");
    const disliked   = allRated.filter(f => f.rating <= 2).map(f => `${f.title} (${f.rating}★)`).join(", ");
    const allSeen    = State.films.map(f => f.title).join(", ");

    // Fallback hardcoded if Firebase empty
    const topFallback = "12 Angry Men (5★), Parasite (5★), Whiplash (5★), Taxi Driver (5★), The Godfather (5★), In the Mood for Love (5★), Good Will Hunting (4.5★), Past Lives (4.5★), The Dark Knight (4.5★), Mulholland Drive (4.5★), Se7en (4.5★), GoodFellas (4.5★), Incendies (4.5★), La La Land (4.5★)";
    const hatesFallback = "Glass Onion (1★), Wonder Woman 1984 (1★), Fifty Shades of Grey (1★), Mean Girls (1.5★), Black Widow (1.5★)";

    const prompt = `Tu es un expert en cinéma qui recommande des films à Adrien (AdrianoB23_ sur Letterboxd).

HISTORIQUE COMPLET D'ADRIEN (ses vraies notes Letterboxd) :

Films adorés (4.5-5★) : ${loved || topFallback}

Films appréciés (3.5-4★) : ${liked || "non disponible"}

Films détestés (≤2★, à ne JAMAIS recommander de similaires) : ${disliked || hatesFallback}

PATTERNS DÉDUITS DE SES NOTES :
- AIME : drames intenses et psychologiques, thrillers cérébraux, grands classiques (Kubrick, Scorsese, Coppola, Lynch, Kurosawa), cinéma d'auteur français (Varda, Demy, Melville), épopées ambitieuses (LOTR), biopics solides, polars, films de gangsters, westerns, films qui demandent de la réflexion
- N'AIME PAS : MCU en général, comédies légères françaises bas de gamme, suites sans substance, films trop commerciaux sans profondeur

CONTEXTE CE SOIR :
- Mode : ${w.who === "chaton" ? "avec chaton (sa copine)" : "seul"}
- Ambiance souhaitée : ${w.moods.length ? w.moods.join(", ") : "peu importe"}
- Durée max : ${fmtDur(w.dur)}
- Époque : ${w.epoch}
- Envies particulières : ${w.extras.length ? w.extras.join(", ") : "aucune"}
- Plateformes disponibles : ${(p.platforms || []).join(", ") || "Netflix, Prime Video, Canal+, Disney+, Apple TV+, OCS"}
${w.who === "chaton" ? "- Profil copine : aime les drames romantiques, feel-good, comédies accessibles — trouver le bon compromis pour deux" : ""}
- Tous les films déjà vus (NE PAS recommander) : ${allSeen.length > 1000 ? allSeen.substring(0, 1000) + "..." : allSeen}
${extra ? `- Demande spéciale : ${extra}` : ""}

RÈGLES ABSOLUES :
1. Ne JAMAIS recommander un film déjà vu par Adrien
2. Toujours justifier en citant un film qu'il a aimé ("Comme tu as adoré Whiplash..." ou "Dans la lignée de Parasite...")
3. Jamais de MCU sauf demande explicite
4. En mode couple : équilibrer ses goûts pointus avec quelque chose d'accessible pour deux
5. Le score de compatibilité doit refléter réellement ses goûts (pas juste mettre 90+ partout)
6. PRIME VIDEO : uniquement les films inclus dans l'abonnement Prime de base (pas location/achat). En cas de doute, indiquer Netflix ou Canal+ à la place.
7. Ne JAMAIS recommander un film présent dans la liste des films déjà vus

Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks), tableau de 3 objets :
[
  {
    "title": "Titre exact du film",
    "year": 2019,
    "duration": 125,
    "genre": "Thriller, Drame",
    "platform": "Netflix",
    "hook": "Une phrase d'accroche percutante de 15 mots max",
    "why": "Explication personnalisée en 2-3 phrases basée sur les goûts de l'utilisateur",
    "synopsis": "Synopsis complet de 4-5 phrases",
    "director": "Réalisateur",
    "cast": ["Acteur 1", "Acteur 2", "Acteur 3"],
    "trailerQuery": "Titre film année trailer youtube",
    "rating": 4.2,
    "compatScore": 92
  }
]`;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.8,
          max_tokens: 2000,
          messages: [
            {
              role: "system",
              content: "Tu es un expert en cinéma. Tu réponds UNIQUEMENT avec du JSON valide, sans markdown, sans backticks, sans texte avant ou après."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });
      const data = await res.json();
      if (data.error) {
        console.error("Groq error:", JSON.stringify(data.error));
        throw new Error(data.error.message);
      }
      let text = data.choices[0].message.content.trim();
      text = text.replace(/```json|```/g, "").trim();
      if (text.startsWith("{")) text = "[" + text + "]";
      return JSON.parse(text);
    } catch (e) {
      console.error("Groq API error:", e);
      toast("Erreur API — affichage de suggestions par défaut.", "warn");
      return AI.fallbackRecos();
    }
  },

  fallbackRecos() {
    return [
      { title: "Prisoners", year: 2013, duration: 153, genre: "Thriller, Drame", platform: "Netflix",
        hook: "Deux fillettes disparaissent. Un père prêt à tout.", why: "Denis Villeneuve au sommet de son art.",
        synopsis: "Keller Dover est confronté à l'enlèvement de sa fille...", director: "Denis Villeneuve",
        cast: ["Hugh Jackman", "Jake Gyllenhaal"], trailerQuery: "Prisoners 2013 trailer", rating: 4.5, compatScore: 94 },
      { title: "Knives Out", year: 2019, duration: 130, genre: "Thriller, Comédie", platform: "Netflix",
        hook: "Un meurtre parfait. Un détective imparfait.", why: "Whodunit moderne, accessible et brillant.",
        synopsis: "La mort du patriarche Harlan Thrombey...", director: "Rian Johnson",
        cast: ["Daniel Craig", "Ana de Armas"], trailerQuery: "Knives Out 2019 trailer", rating: 4.3, compatScore: 88 },
      { title: "The Grand Budapest Hotel", year: 2014, duration: 99, genre: "Comédie, Aventure", platform: "Disney+",
        hook: "L'hôtel le plus élégant des Alpes. Le portier le plus excentrique d'Europe.", why: "Wes Anderson à son meilleur.",
        synopsis: "Le concierge légendaire d'un grand hôtel...", director: "Wes Anderson",
        cast: ["Ralph Fiennes", "Tony Revolori"], trailerQuery: "Grand Budapest Hotel trailer", rating: 4.2, compatScore: 85 }
    ];
  },

  async moreRecos() {
    $("reco-list").innerHTML = `<div class="loading-inline">Génération de nouvelles suggestions…</div>`;
    const recos = await AI.getRecos("Propose des films différents des précédents.");
    Reco.render(recos);
  }
};

// ─── RECO RENDER ───────────────────────────────────────────────────────────────
window.Reco = {
  current: [],
  async render(recos) {
    Reco.current = recos;
    const w = State.wizard;
    $("results-meta").innerHTML =
      '<span class="meta-tag">' + (w.who === "chaton" ? "Avec chaton 🐱" : "Solo") + '</span>' +
      (w.moods.length ? w.moods.map(m => '<span class="meta-tag">' + m + '</span>').join("") : "") +
      '<span class="meta-tag">Max ' + fmtDur(w.dur) + '</span>';

    const list = $("reco-list");
    list.innerHTML = "";
    recos.forEach((f, i) => {
      const card = document.createElement("div");
      card.className = "reco-card";
      card.id = "reco-card-" + i;

      // Clickable inner
      const inner = document.createElement("div");
      inner.className = "reco-card-inner";
      inner.style.cursor = "pointer";
      inner.addEventListener("click", () => Detail.open(i));
      inner.innerHTML =
        '<div class="reco-poster" id="poster-wrap-' + i + '"><div class="reco-poster-placeholder">🎬</div></div>' +
        '<div class="reco-card-main">' +
          '<div>' +
            '<div class="reco-title">' + f.title + ' <span class="reco-year">' + f.year + '</span></div>' +
            '<div class="reco-meta-row">' +
              '<span>' + f.genre + '</span><span class="reco-sep">·</span>' +
              '<span>' + fmtDur(f.duration) + '</span><span class="reco-sep">·</span>' +
              '<span class="reco-platform">' + f.platform + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="reco-hook">' + f.hook + '</div>' +
        '</div>' +
        '<div class="reco-card-right">' +
          '<div class="compat-score">' + f.compatScore + '<span class="compat-pct">%</span></div>' +
          '<div class="compat-label">match</div>' +
        '</div>';

      // Action bar
      const actions = document.createElement("div");
      actions.className = "reco-card-actions";

      const skipBtn = document.createElement("button");
      skipBtn.className = "rca-btn rca-skip";
      skipBtn.title = "Pas intéressé";
      skipBtn.innerHTML = "✕ Pas intéressé";
      skipBtn.addEventListener("click", () => RecoActions.skip(i));

      const saveBtn = document.createElement("button");
      saveBtn.className = "rca-btn rca-save";
      saveBtn.id = "save-btn-" + i;
      saveBtn.title = "À voir plus tard";
      saveBtn.innerHTML = "🔖 À voir";
      saveBtn.addEventListener("click", () => RecoActions.save(i, saveBtn));

      const openBtn = document.createElement("button");
      openBtn.className = "rca-btn rca-open";
      openBtn.title = "Voir détail";
      openBtn.innerHTML = "Détail →";
      openBtn.addEventListener("click", () => Detail.open(i));

      actions.appendChild(skipBtn);
      actions.appendChild(saveBtn);
      actions.appendChild(openBtn);
      card.appendChild(inner);
      card.appendChild(actions);
      list.appendChild(card);
    });

    // Prefetch extra recos in background
    setTimeout(() => RecoActions._prefetch(), 2000);

    // Load posters async
    recos.forEach(async (f, i) => {
      const poster = await fetchPoster(f.title, f.year);
      const wrap = document.getElementById("poster-wrap-" + i);
      if (wrap && poster) {
        const img = document.createElement("img");
        img.src = poster;
        img.alt = f.title;
        img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block";
        wrap.innerHTML = "";
        wrap.appendChild(img);
      }
    });

    // Hero backdrop
    const heroSection = $("hero-section");
    if (heroSection && recos[0]) {
      heroSection.style.display = "block";
      $("hero-title").textContent = recos[0].title;
      $("hero-meta").textContent = recos[0].year + " · " + recos[0].genre + " · " + recos[0].platform;
      const backdrop = await fetchBackdrop(recos[0].title, recos[0].year);
      const wrap = $("hero-img-wrap");
      if (wrap) {
        if (backdrop) {
          wrap.innerHTML = '<img src="' + backdrop + '" alt="' + recos[0].title + '" class="hero-img">';
        } else {
          wrap.innerHTML = '<div class="hero-placeholder">🎬</div>';
        }
      }
    }
  }
};

// ─── DETAIL ────────────────────────────────────────────────────────────────────
window.Detail = {
  markStarVal: 0,
  async open(i) {
    const f = Reco.current[i];
    if (!f) return;
    const trailerUrl = "https://www.youtube.com/results?search_query=" + encodeURIComponent(f.trailerQuery);
    const chatonLabel = State.wizard.who === "chaton" ? " (et chaton 🐱)" : "";
    const safeTitle = f.title.replace(/'/g, "\\'");

    $("detail-content").innerHTML =
      '<div class="detail-backdrop">' +
        '<div id="detail-backdrop-el" class="detail-backdrop-placeholder">🎬</div>' +
        '<div class="detail-backdrop-gradient"></div>' +
        '<div class="detail-header-overlay">' +
          '<button class="btn-icon" onclick="Detail.close()" style="background:rgba(247,242,234,.9);border-radius:50%;width:36px;height:36px">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="detail-body">' +
        '<div class="detail-poster-row">' +
          '<div class="detail-poster" id="detail-poster-el">' +
            '<div class="detail-poster-placeholder">🎬</div>' +
          '</div>' +
          '<div class="detail-title-block">' +
            '<div class="detail-title">' + f.title + '</div>' +
            '<div class="detail-subtitle">' + f.year + ' · ' + fmtDur(f.duration) + ' · ' + (f.director || "") + '</div>' +
            '<div class="detail-meta-row">' +
              '<span class="badge-genre">' + f.genre + '</span>' +
              '<span class="badge-platform">' + f.platform + '</span>' +
              '<span class="badge-rating">★ ' + (f.rating ? f.rating.toFixed(1) : "—") + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="detail-section">' +
          '<div class="detail-label">Pourquoi ce film pour toi</div>' +
          '<p class="detail-why">' + f.why + '</p>' +
        '</div>' +
        '<div class="detail-section">' +
          '<div class="detail-label">Synopsis</div>' +
          '<p class="detail-text">' + f.synopsis + '</p>' +
        '</div>' +
        (f.cast && f.cast.length ?
          '<div class="detail-section">' +
            '<div class="detail-label">Avec</div>' +
            '<div class="cast-row">' + f.cast.map(a => '<span class="cast-tag">' + a + '</span>').join("") + '</div>' +
          '</div>' : "") +
        '<div class="detail-section">' +
          '<div class="detail-label">Bande-annonce</div>' +
          '<a href="' + trailerUrl + '" target="_blank" class="trailer-btn">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
            ' Voir sur YouTube' +
          '</a>' +
        '</div>' +
        '<div class="detail-section">' +
          '<div class="detail-label">Compatibilité</div>' +
          '<div class="compat-bar-wrap"><div class="compat-bar-fill" style="width:' + f.compatScore + '%"></div></div>' +
          '<div class="compat-bar-label">' + f.compatScore + '% avec ton profil' + chatonLabel + '</div>' +
        '</div>' +
        '<div class="detail-section" style="background:var(--bg2);padding:14px;border-radius:var(--radius);border:1.5px solid var(--border)">' +
          '<div class="detail-label" style="margin-bottom:10px">Tu l\'as déjà vu ? Note-le !</div>' +
          '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
            '<div style="display:flex;gap:4px" id="mark-stars">' +
              '<span class="star-btn" onclick="Detail.setMarkStar(1)">★</span>' +
              '<span class="star-btn" onclick="Detail.setMarkStar(2)">★</span>' +
              '<span class="star-btn" onclick="Detail.setMarkStar(3)">★</span>' +
              '<span class="star-btn" onclick="Detail.setMarkStar(4)">★</span>' +
              '<span class="star-btn" onclick="Detail.setMarkStar(5)">★</span>' +
            '</div>' +
            '<button class="btn-sm" onclick="Films.markWatched(\'' + safeTitle + '\', ' + f.year + ', Detail.markStarVal)">✓ Enregistrer</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    $("film-detail").style.display  = "block";
    $("reco-results").style.display = "none";
    $("hero-section").style.display = "none";
    window.scrollTo(0, 0);

    // Load images async
    const [poster, backdrop] = await Promise.all([
      fetchPoster(f.title, f.year),
      fetchBackdrop(f.title, f.year)
    ]);
    const posterEl = document.getElementById("detail-poster-el");
    if (posterEl && poster) {
      posterEl.innerHTML = '<img src="' + poster + '" alt="' + f.title + '" style="width:100%;height:100%;object-fit:cover;display:block">';
    }
    const backdropEl = document.getElementById("detail-backdrop-el");
    if (backdropEl && backdrop) {
      backdropEl.outerHTML = '<img src="' + backdrop + '" alt="' + f.title + '" style="width:100%;height:100%;object-fit:cover;display:block">';
    }
  },
  setMarkStar(n) {
    Detail.markStarVal = n;
    document.querySelectorAll("#mark-stars .star-btn").forEach((s, i) => s.classList.toggle("lit", i < n));
  },
  close() {
    Detail.markStarVal = 0;
    $("film-detail").style.display  = "none";
    $("reco-results").style.display = "block";
  }
};

// ─── FILMS ─────────────────────────────────────────────────────────────────────
window.Films = {
  async load() {
    if (!State.user) return;
    State.films = await fbGetFilms(State.user.uid);
    Films.render();
    Films.updateStats();
  },
  currentList() {
    // Return the right film list based on active viewer
    if (State.viewer === "alice") return State.aliceFilms;
    if (State.viewer === "both") {
      // Merge both lists, deduplicated by title
      const combined = [...State.films];
      State.aliceFilms.forEach(af => {
        if (!combined.find(f => f.title.toLowerCase() === af.title.toLowerCase())) combined.push(af);
      });
      return combined;
    }
    return State.films;
  },
  async addForCurrentViewer(title, year, rating) {
    if (State.viewer === "alice") {
      await Alice.add(title, year, rating);
    } else {
      const id = await fbAddFilm(State.user.uid, { title, year, rating });
      State.films.unshift({ id, title, year, rating });
      Films.render();
      Films.updateStats();
      toast("Film ajouté !");
    }
  },

  filter(q) {
    const filtered = Films.currentList().filter(f => f.title.toLowerCase().includes(q.toLowerCase()));
    Films.renderList(filtered);
  },

  render() {
    Films.renderList(Films.currentList());
    Films.updateStats();
  },

  renderList(list) {
    const el = $("film-list");
    if (!list.length) {
      el.innerHTML = `<p class="empty-state">Aucun film enregistré.<br>Importe ton CSV Letterboxd ou ajoute manuellement.</p>`;
      return;
    }
    el.innerHTML = list.map(f => `
      <div class="film-row">
        <div class="film-info">
          <div class="film-title">${f.title}</div>
          <div class="film-year">${f.year || ""}</div>
        </div>
        <div class="film-row-right">
          <div class="film-stars">${starsHtml(f.rating || 0)}</div>
          <button class="del-btn" onclick="Films.remove('${f.id}')" aria-label="Supprimer">✕</button>
        </div>
      </div>`).join("");
  },

  updateStats() {
    const list = Films.currentList();
    $("stat-total").textContent = list.length;
    const rated = list.filter(f => f.rating > 0);
    const avg = rated.length ? rated.reduce((s, f) => s + f.rating, 0) / rated.length : 0;
    $("stat-avg").textContent = avg ? avg.toFixed(1) + "★" : "—";
    $("stat-fav").textContent = list.filter(f => f.rating >= 4).length;
  },

  showAddForm()  { $("add-form").style.display = "flex"; $("new-title").focus(); },
  hideAddForm()  { $("add-form").style.display = "none"; State.addStar = 0; Films.clearStars(); },

  setStar(n) {
    State.addStar = n;
    document.querySelectorAll(".star-btn").forEach((b, i) => b.classList.toggle("lit", i < n));
  },
  clearStars() {
    document.querySelectorAll(".star-btn").forEach(b => b.classList.remove("lit"));
  },

  async add() {
    const title = $("new-title").value.trim();
    const year  = $("new-year").value.trim();
    if (!title) return;
    if (State.viewer === "alice") {
      await Alice.add(title, year, State.addStar);
    } else {
      const id = await fbAddFilm(State.user.uid, { title, year, rating: State.addStar });
      State.films.unshift({ id, title, year, rating: State.addStar });
    }
    Films.render();
    Films.updateStats();
    $("new-title").value = "";
    $("new-year").value  = "";
    Films.hideAddForm();
    toast("Film ajouté !");
  },

  async markWatched(title, year, rating = 0) {
    const list = State.viewer === "alice" ? State.aliceFilms : State.films;
    if (list.find(f => f.title.toLowerCase() === title.toLowerCase())) {
      toast("Déjà dans ta liste !", "warn"); return;
    }
    if (State.viewer === "alice") {
      await Alice.add(title, String(year), rating || 0);
    } else {
      const id = await fbAddFilm(State.user.uid, { title, year: String(year), rating: rating || 0 });
      State.films.unshift({ id, title, year: String(year), rating: rating || 0 });
      Films.updateStats();
    }
    const ratingTxt = rating ? " avec " + rating + "★" : "";
    toast('"' + title + '" ajouté' + ratingTxt + ' !');
    Detail.close();
  },

  async remove(id) {
    if (State.viewer === "alice") {
      await fbDeleteAliceFilm(State.user.uid, id);
      State.aliceFilms = State.aliceFilms.filter(f => f.id !== id);
    } else {
      await fbDeleteFilm(State.user.uid, id);
      State.films = State.films.filter(f => f.id !== id);
    }
    Films.render();
    Films.updateStats();
    toast("Film supprimé.");
  },

  importCSV(input) {
    const file = input.files[0];
    if (!file) return;
    $("import-status").textContent = "Import en cours…";
    const reader = new FileReader();
    reader.onload = async (e) => {
      const lines  = e.target.result.split("\n");
      const header = lines[0].toLowerCase().split(",");
      const nameIdx   = header.findIndex(h => h.trim().includes("name"));
      const yearIdx   = header.findIndex(h => h.trim().includes("year"));
      const ratingIdx = header.findIndex(h => h.trim() === "rating");

      const toAdd = [];
      for (let i = 1; i < lines.length; i++) {
        const cols  = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        const clean = cols.map(c => c.replace(/^"|"$/g, "").trim());
        const title = clean[nameIdx];
        if (!title) continue;
        if (State.films.find(f => f.title.toLowerCase() === title.toLowerCase())) continue;
        const year   = clean[yearIdx] || "";
        // ratings.csv uses 0.5-5 scale, watched.csv has no rating
        const raw    = ratingIdx >= 0 ? parseFloat(clean[ratingIdx]) : 0;
        const rating = isNaN(raw) ? 0 : raw; // keep decimal (e.g. 4.5)
        toAdd.push({ title, year, rating });
      }

      if (!toAdd.length) { $("import-status").textContent = "Aucun nouveau film trouvé."; return; }
      if (State.viewer === "alice") {
        for (const f of toAdd) await fbAddAliceFilm(State.user.uid, f);
        State.aliceFilms = await fbGetAliceFilms(State.user.uid);
      } else {
        await fbBulkAddFilms(State.user.uid, toAdd);
        State.films = await fbGetFilms(State.user.uid);
      }
      Films.render();
      Films.updateStats();
      $("import-status").textContent = "✓ " + toAdd.length + " films importés !";
      setTimeout(() => $("import-status").textContent = "", 4000);
      toast(toAdd.length + " films importés depuis Letterboxd !");
    };
    reader.readAsText(file);
  }
};

// ─── SETTINGS ──────────────────────────────────────────────────────────────────
window.Settings = {
  syncUI() {
    const p = State.profile || {};
    // Plateformes
    document.querySelectorAll("#settings-platforms .plat-btn").forEach(btn => {
      btn.classList.toggle("active", (p.platforms || []).includes(btn.dataset.p));
    });
    // Genres
    document.querySelectorAll("#settings-genres .genre-btn").forEach(btn => {
      btn.classList.toggle("active", (p.genres || []).includes(btn.dataset.g));
    });
    // GF
    document.querySelectorAll("#settings-gf .genre-btn").forEach(btn => {
      btn.classList.toggle("active", (p.gfGenres || []).includes(btn.dataset.g));
    });
    $("user-email-display").textContent = State.user?.email || "";
    if (State.profile && State.profile.groqKey) {
      localStorage.setItem("cinescope_apikey", State.profile.groqKey);
    }
    $("api-key-input").value = getAPIKey() ? "••••••••••••••••" : "";
    // Load TMDB key from Firebase into localStorage
    if (State.profile && State.profile.tmdbKey) {
      localStorage.setItem("cinescope_tmdbkey", State.profile.tmdbKey);
    }
    const tmdbEl = $("tmdb-key-input");
    if (tmdbEl) tmdbEl.value = getTMDBKey() ? "••••••••••••••••" : "";
  },

  async savePlatforms() {
    const platforms = [...document.querySelectorAll("#settings-platforms .plat-btn.active")].map(b => b.dataset.p);
    await fbSaveProfile(State.user.uid, { platforms });
    State.profile.platforms = platforms;
    toast("Plateformes sauvegardées !");
  },

  async saveGenres() {
    const genres = [...document.querySelectorAll("#settings-genres .genre-btn.active")].map(b => b.dataset.g);
    await fbSaveProfile(State.user.uid, { genres });
    State.profile.genres = genres;
    toast("Genres sauvegardés !");
  },

  async saveGF() {
    const gfGenres = [...document.querySelectorAll("#settings-gf .genre-btn.active")].map(b => b.dataset.g);
    await fbSaveProfile(State.user.uid, { gfGenres });
    State.profile.gfGenres = gfGenres;
    toast("Profil de ta copine sauvegardé !");
  },

  async saveAPIKey() {
    const val = $("api-key-input").value.trim();
    if (val && !val.startsWith("•")) {
      localStorage.setItem("cinescope_apikey", val);
      await fbSaveProfile(State.user.uid, { groqKey: val });
      if (State.profile) State.profile.groqKey = val;
      toast("Clé API Groq sauvegardée !");
      $("api-key-input").value = "••••••••••••••••";
    }
  },
  async saveTMDBKey() {
    const input = $("tmdb-key-input");
    if (!input) return;
    const val = input.value.trim();
    if (!val || val.startsWith("•")) { toast("Entre une clé TMDB valide.", "warn"); return; }
    // Save to both localStorage and Firebase
    localStorage.setItem("cinescope_tmdbkey", val);
    await fbSaveProfile(State.user.uid, { tmdbKey: val });
    if (State.profile) State.profile.tmdbKey = val;
    toast("Clé TMDB sauvegardée ✓");
    input.value = "••••••••••••••••";
  }
};

// ─── VIEWER SELECTION ─────────────────────────────────────────────────────────
window.Viewer = {
  set(v) {
    State.viewer = v;
    // Update wizard who
    if (v === "both") {
      State.wizard.who = "chaton";
      document.querySelectorAll(".who-card").forEach(c => c.classList.remove("active"));
      const chatonCard = document.getElementById("who-chaton");
      if (chatonCard) chatonCard.classList.add("active");
    } else {
      State.wizard.who = "solo";
      document.querySelectorAll(".who-card").forEach(c => c.classList.remove("active"));
      const soloCard = document.getElementById("who-solo");
      if (soloCard) soloCard.classList.add("active");
    }
    showScreen("app");
    Nav.goto("reco");
    // Update greeting
    const greet = $("viewer-greeting");
    if (greet) {
      if (v === "adrien") greet.textContent = "◈ Bonsoir Adrien";
      else if (v === "alice") greet.textContent = "🐱 Bonsoir Alice";
      else greet.textContent = "◈ Bonsoir vous deux";
    }
    // Update nav for this viewer
    Nav.updateForViewer(v);
  }
};

// ─── RECO ACTIONS ─────────────────────────────────────────────────────────────
window.RecoActions = {
  // Queue of extra recos fetched in background
  _queue: [],
  async _prefetch() {
    if (RecoActions._queue.length > 0) return;
    try {
      const extras = await AI.getRecos("Propose 3 films différents des précédents, variés.");
      RecoActions._queue.push(...extras);
    } catch(e) {}
  },

  async _replaceCard(i, action) {
    const card = document.getElementById("reco-card-" + i);
    if (!card) return;

    // Animate out
    card.style.transition = "all .25s ease";
    card.style.opacity = "0";
    card.style.transform = "translateX(" + (action === "skip" ? "-" : "") + "30px)";

    // Prefetch if queue empty
    RecoActions._prefetch();

    await new Promise(r => setTimeout(r, 250));

    // Get next film from queue
    const next = RecoActions._queue.shift();
    if (!next) {
      card.remove();
      // Check if list is empty
      if ($("reco-list") && $("reco-list").children.length === 0) {
        $("reco-list").innerHTML = '<p class="empty-state" style="padding:2rem;text-align:center">Plus de suggestions !<br><button class="btn-sm" style="margin-top:12px" onclick="Wizard.reset()">Nouvelle recherche</button></p>';
      }
      return;
    }

    // Add to Reco.current
    Reco.current[i] = next;

    // Build new card content
    const inner = card.querySelector(".reco-card-inner");
    const posterWrap = card.querySelector(".reco-poster");
    if (posterWrap) {
      posterWrap.id = "poster-wrap-" + i;
      posterWrap.innerHTML = '<div class="reco-poster-placeholder">🎬</div>';
    }
    const titleEl = card.querySelector(".reco-title");
    if (titleEl) titleEl.innerHTML = next.title + ' <span class="reco-year">' + next.year + '</span>';
    const metaEl = card.querySelector(".reco-meta-row");
    if (metaEl) metaEl.innerHTML =
      '<span>' + next.genre + '</span><span class="reco-sep">·</span>' +
      '<span>' + fmtDur(next.duration) + '</span><span class="reco-sep">·</span>' +
      '<span class="reco-platform">' + next.platform + '</span>';
    const hookEl = card.querySelector(".reco-hook");
    if (hookEl) hookEl.textContent = next.hook;
    const scoreEl = card.querySelector(".compat-score");
    if (scoreEl) scoreEl.innerHTML = next.compatScore + '<span class="compat-pct">%</span>';

    // Animate in
    card.style.opacity = "0";
    card.style.transform = "translateX(30px)";
    card.style.transition = "all .25s ease";
    await new Promise(r => setTimeout(r, 20));
    card.style.opacity = "1";
    card.style.transform = "translateX(0)";

    // Reset save button
    const saveBtn = card.querySelector(".rca-save");
    if (saveBtn) { saveBtn.innerHTML = "🔖 À voir"; saveBtn.disabled = false; saveBtn.style.color = ""; }

    // Load new poster
    fetchPoster(next.title, next.year).then(poster => {
      const wrap = document.getElementById("poster-wrap-" + i);
      if (wrap && poster) {
        const img = document.createElement("img");
        img.src = poster;
        img.alt = next.title;
        img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block";
        wrap.innerHTML = "";
        wrap.appendChild(img);
      }
    });
  },

  async skip(i) {
    toast("Film ignoré");
    await RecoActions._replaceCard(i, "skip");
  },

  async save(i, btn) {
    const f = Reco.current[i];
    if (!f) return;
    Watchlist.add({ title: f.title, year: f.year, genre: f.genre, platform: f.platform });
    if (btn) { btn.innerHTML = "✓ Ajouté"; btn.style.color = "var(--accent)"; btn.disabled = true; }
    // Slide out and replace after short delay
    setTimeout(() => RecoActions._replaceCard(i, "save"), 600);
  }
};

// ─── WATCHLIST ─────────────────────────────────────────────────────────────────
window.Watchlist = {
  async load() {
    if (!State.user) return;
    State.watchlist = await fbGetWatchlist(State.user.uid);
    // Alice's watchlist stored separately in profile
    State.aliceWatchlist = State.profile && State.profile.aliceWatchlist ? State.profile.aliceWatchlist : [];
    Watchlist.render();
  },
  currentList() {
    if (State.viewer === "alice") return State.aliceWatchlist || [];
    return State.watchlist;
  },
  async add(film) {
    // Check not already in watchlist
    if (State.watchlist.find(f => f.title.toLowerCase() === film.title.toLowerCase())) {
      toast('"' + film.title + '" est déjà dans ta liste !', "warn");
      return;
    }
    const id = await fbAddToWatchlist(State.user.uid, film);
    State.watchlist.unshift({ id, ...film });
    Watchlist.render();
    toast('🔖 Ajouté à ta liste !');
  },
  async remove(id) {
    await fbRemoveFromWatchlist(State.user.uid, id);
    State.watchlist = State.watchlist.filter(f => f.id !== id);
    Watchlist.render();
    toast('Retiré de ta liste.');
  },
  async markWatched(film) {
    await Films.markWatched(film.title, film.year, 0);
    await Watchlist.remove(film.id);
  },
  async markWatchedById(id) {
    const film = State.watchlist.find(f => f.id === id);
    if (film) await Watchlist.markWatched(film);
  },
  render() {
    const el = $("watchlist-grid");
    if (!el) return;
    const wlList = Watchlist.currentList();
    const countEl = $("watchlist-count");
    if (countEl) countEl.textContent = wlList.length;
    if (!wlList.length) {
      el.innerHTML = '<p class="empty-state">Ta liste est vide.<br>Ajoute des films depuis les recommandations !</p>';
      return;
    }
    el.innerHTML = "";
    wlList.forEach(f => {
      const badge = document.createElement("div");
      badge.className = "wl-badge";
      badge.id = "wl-" + f.id;
      const posterDiv = document.createElement("div");
      posterDiv.className = "wl-poster";
      posterDiv.id = "wl-poster-" + f.id;
      posterDiv.innerHTML = '<div class="wl-poster-placeholder">🎬</div>';
      const info = document.createElement("div");
      info.className = "wl-info";
      info.innerHTML = '<div class="wl-title">' + f.title + '</div><div class="wl-year">' + (f.year||"") + (f.platform?" · "+f.platform:"") + '</div>';
      const actions = document.createElement("div");
      actions.className = "wl-actions";
      const seenBtn = document.createElement("button");
      seenBtn.className = "wl-btn wl-seen";
      seenBtn.title = "Marquer vu";
      seenBtn.textContent = "✓";
      seenBtn.addEventListener("click", () => Watchlist.markWatchedById(f.id));
      const delBtn = document.createElement("button");
      delBtn.className = "wl-btn wl-del";
      delBtn.title = "Retirer";
      delBtn.textContent = "✕";
      delBtn.addEventListener("click", () => Watchlist.remove(f.id));
      actions.appendChild(seenBtn);
      actions.appendChild(delBtn);
      badge.appendChild(posterDiv);
      badge.appendChild(info);
      badge.appendChild(actions);
      el.appendChild(badge);
      fetchPoster(f.title, f.year).then(poster => {
        const wrap = document.getElementById("wl-poster-" + f.id);
        if (wrap && poster) wrap.innerHTML = '<img src="' + poster + '" alt="' + f.title + '" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:8px">';
      });
    });
  }
};

// ─── ALICE ─────────────────────────────────────────────────────────────────────
window.Alice = {
  async load() {
    if (!State.user) return;
    State.aliceFilms = await fbGetAliceFilms(State.user.uid);
    Alice.render();
  },
  async add(title, year, rating) {
    if (State.aliceFilms.find(f => f.title.toLowerCase() === title.toLowerCase())) {
      toast("Déjà dans la liste d'Alice !", "warn"); return;
    }
    const id = await fbAddAliceFilm(State.user.uid, { title, year, rating: rating || 0 });
    State.aliceFilms.unshift({ id, title, year, rating: rating || 0 });
    Alice.render();
    Alice.updateStats();
  },
  async remove(id) {
    await fbDeleteAliceFilm(State.user.uid, id);
    State.aliceFilms = State.aliceFilms.filter(f => f.id !== id);
    Alice.render();
    Alice.updateStats();
  },
  setStar(n) {
    State.aliceAddStar = n;
    document.querySelectorAll("#alice-star-input .star-btn").forEach((b, i) => b.classList.toggle("lit", i < n));
  },
  render() {
    const el = $("alice-film-list");
    if (!el) return;
    if (!State.aliceFilms.length) {
      el.innerHTML = "<p class=\"empty-state\">Aucun film d'Alice.<br>Importe son CSV Letterboxd.</p>";
      return;
    }
    el.innerHTML = "";
    State.aliceFilms.forEach(f => {
      const row = document.createElement("div");
      row.className = "film-row";
      const info = document.createElement("div");
      info.className = "film-info";
      info.innerHTML = '<div class="film-title">' + f.title + '</div><div class="film-year">' + (f.year||"") + '</div>';
      const right = document.createElement("div");
      right.className = "film-row-right";
      const stars = document.createElement("div");
      stars.className = "film-stars";
      stars.textContent = starsHtml(f.rating || 0);
      const del = document.createElement("button");
      del.className = "del-btn";
      del.textContent = "✕";
      del.addEventListener("click", () => Alice.remove(f.id));
      right.appendChild(stars);
      right.appendChild(del);
      row.appendChild(info);
      row.appendChild(right);
      el.appendChild(row);
    });
  },
  updateStats() {
    const el = $("alice-stat-total");
    if (el) el.textContent = State.aliceFilms.length;
    const rated = State.aliceFilms.filter(f => f.rating > 0);
    const avg = rated.length ? rated.reduce((s, f) => s + f.rating, 0) / rated.length : 0;
    const avgEl = $("alice-stat-avg");
    if (avgEl) avgEl.textContent = avg ? avg.toFixed(1) + "★" : "—";
    const favEl = $("alice-stat-fav");
    if (favEl) favEl.textContent = State.aliceFilms.filter(f => f.rating >= 4).length;
  },
  importCSV(input) {
    const file = input.files[0];
    if (!file) return;
    $("alice-import-status").textContent = "Import en cours…";
    const reader = new FileReader();
    reader.onload = async (e) => {
      const lines = e.target.result.split("\n");
      const header = lines[0].toLowerCase().split(",");
      const nameIdx = header.findIndex(h => h.trim().includes("name"));
      const yearIdx = header.findIndex(h => h.trim().includes("year"));
      const ratingIdx = header.findIndex(h => h.trim() === "rating");
      const toAdd = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        const clean = cols.map(c => c.replace(/^"|"$/g, "").trim());
        const title = clean[nameIdx];
        if (!title) continue;
        if (State.aliceFilms.find(f => f.title.toLowerCase() === title.toLowerCase())) continue;
        const year = clean[yearIdx] || "";
        const raw = ratingIdx >= 0 ? parseFloat(clean[ratingIdx]) : 0;
        const rating = isNaN(raw) ? 0 : raw;
        toAdd.push({ title, year, rating });
      }
      if (!toAdd.length) { $("alice-import-status").textContent = "Aucun nouveau film."; return; }
      for (const f of toAdd) await fbAddAliceFilm(State.user.uid, f);
      State.aliceFilms = await fbGetAliceFilms(State.user.uid);
      Alice.render();
      Alice.updateStats();
      $("alice-import-status").textContent = "✓ " + toAdd.length + " films importés !";
      setTimeout(() => $("alice-import-status").textContent = "", 4000);
    };
    reader.readAsText(file);
  }
};

// ─── BOOT ──────────────────────────────────────────────────────────────────────
fbOnAuth(async (user) => {
  if (!user) {
    showScreen("auth");
    return;
  }
  State.user    = user;
  State.profile = await fbGetProfile(user.uid);

  if (!State.profile?.onboarded) {
    showScreen("onboarding");
    return;
  }

  // Load all data in parallel
  await Promise.all([
    Films.load(),
    Watchlist.load(),
    Alice.load()
  ]);

  // Load TMDB key from Firebase
  if (State.profile && State.profile.tmdbKey) {
    localStorage.setItem("cinescope_tmdbkey", State.profile.tmdbKey);
  }

  Settings.syncUI();

  // Show viewer selector
  showScreen("viewer-select");
});
