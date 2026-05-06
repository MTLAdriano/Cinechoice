// app.js — CinéScope : logique principale
import {
  fbRegister, fbLogin, fbLogout, fbOnAuth,
  fbGetProfile, fbSaveProfile,
  fbGetFilms, fbAddFilm, fbDeleteFilm, fbBulkAddFilms
} from "./firebase.js";

// ─── ÉTAT GLOBAL ───────────────────────────────────────────────────────────────
const State = {
  user:     null,
  profile:  null,
  films:    [],
  addStar:  0,
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
  return localStorage.getItem("cinescope_apikey") || "";
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

// ─── NAVIGATION ────────────────────────────────────────────────────────────────
window.Nav = {
  goto(page, btn) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    $(`page-${page}`).classList.add("active");
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    else document.querySelector(`.nav-btn[data-page="${page}"]`)?.classList.add("active");
    if (page === "films") Films.render();
    if (page === "settings") Settings.syncUI();
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

// ─── AI (CLAUDE) ───────────────────────────────────────────────────────────────
window.AI = {
  async getRecos(extra = "") {
    const apiKey = getAPIKey();
    if (!apiKey) {
      toast("Ajoute ta clé API Claude dans Profil → Clé API.", "warn");
      return AI.fallbackRecos();
    }

    const w = State.wizard;
    const p = State.profile || {};
    const seenTitles = State.films.map(f => f.title).join(", ") || "aucun encore";
    const topRated   = State.films.filter(f => f.rating >= 4).map(f => `${f.title} (${f.rating}★)`).slice(0, 15).join(", ") || "aucun encore";

    const ADRIEN_TOP = [
      "12 Angry Men (5★)", "Parasite (5★)", "Whiplash (5★)", "Taxi Driver (5★)",
      "The Godfather (5★)", "In the Mood for Love (5★)", "The Lord of the Rings: The Two Towers (5★)",
      "Good Will Hunting (4.5★)", "Past Lives (4.5★)", "The Matrix (4.5★)",
      "Dead Poets Society (4.5★)", "The Grand Budapest Hotel (4.5★)", "The Dark Knight (4.5★)",
      "Mulholland Drive (4.5★)", "All of Us Strangers (4.5★)", "The Elephant Man (4.5★)",
      "Scarface (4.5★)", "Million Dollar Baby (4.5★)", "Gran Torino (4.5★)",
      "Se7en (4.5★)", "Gladiator (4.5★)", "GoodFellas (4.5★)", "Incendies (4.5★)",
      "Le Bonheur (4.5★)", "The Good the Bad and the Ugly (4.5★)", "The Blues Brothers (4.5★)",
      "La La Land (4.5★)", "Le Samouraï (4.5★)", "The Umbrellas of Cherbourg (4.5★)"
    ].join(", ");

    const ADRIEN_HATES = [
      "Glass Onion (1★)", "Wonder Woman 1984 (1★)", "Fifty Shades of Grey (1★)",
      "Fifty Shades Darker (1★)", "Mean Girls (1.5★)", "Black Widow (1.5★)",
      "Star Wars Rise of Skywalker (1.5★)", "Presidents (0.5★)"
    ].join(", ");

    const prompt = `Tu es un expert en cinéma qui recommande des films à Adrien (AdrianoB23_ sur Letterboxd).

PROFIL RÉEL D'ADRIEN (extrait de son vrai historique Letterboxd) :

Films qu'il adore (4.5-5★) : ${ADRIEN_TOP}

Films qu'il déteste (à ne JAMAIS imiter) : ${ADRIEN_HATES}

PATTERNS IDENTIFIÉS :
- AIME : drames intenses et psychologiques, thrillers cérébraux, grands classiques (Kubrick, Scorsese, Coppola, Lynch), cinéma d'auteur français (Varda, Demy, Melville), épopées ambitieuses (LOTR), films qui demandent de la réflexion, biopics solides, polars, films de gangsters, westerns
- N'AIME PAS : MCU en général (notes systématiquement basses 1.5-2★), comédies légères françaises bas de gamme, suites sans substance, films trop commerciaux

CONTEXTE CE SOIR :
- Mode : ${w.who === "couple" ? "en couple avec sa copine" : "seul"}
- Ambiance : ${w.moods.length ? w.moods.join(", ") : "peu importe"}
- Durée max : ${fmtDur(w.dur)}
- Époque : ${w.epoch}
- Envies : ${w.extras.length ? w.extras.join(", ") : "aucune"}
- Plateformes : ${(p.platforms || []).join(", ") || "Netflix, Prime Video, Canal+, Disney+, Apple TV+, OCS"}
${w.who === "couple" ? "- Copine aime : drames romantiques, feel-good, comédies accessibles — trouver le bon compromis" : ""}
- Films déjà vus (NE PAS recommander) : ${seenTitles.length > 800 ? seenTitles.substring(0, 800) + "..." : seenTitles}
${extra ? `- Demande spéciale : ${extra}` : ""}

RÈGLES :
1. Ne JAMAIS recommander un film déjà vu
2. Toujours justifier en citant un film qu'il a aimé ("Comme tu as adoré Whiplash..." ou "Dans la lignée de Parasite...")
3. Jamais de MCU sauf demande explicite
4. En mode couple : équilibrer ses goûts pointus avec quelque chose d'accessible pour deux

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
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model:      "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages:   [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      const text = data.content.map(c => c.text || "").join("").trim();
      return JSON.parse(text);
    } catch (e) {
      console.error("Claude API error:", e);
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
  render(recos) {
    Reco.current = recos;
    const w = State.wizard;
    $("results-meta").innerHTML =
      `<span class="meta-tag">${w.who === "couple" ? "En couple" : "Solo"}</span>` +
      (w.moods.length ? w.moods.map(m => `<span class="meta-tag">${m}</span>`).join("") : "") +
      `<span class="meta-tag">Max ${fmtDur(w.dur)}</span>`;

    $("reco-list").innerHTML = recos.map((f, i) => `
      <div class="reco-card" onclick="Detail.open(${i})">
        <div class="reco-card-inner">
          <div class="reco-card-main">
            <div class="reco-title">${f.title} <span class="reco-year">${f.year}</span></div>
            <div class="reco-meta">
              <span class="reco-genre">${f.genre}</span>
              <span class="reco-sep">·</span>
              <span>${fmtDur(f.duration)}</span>
              <span class="reco-sep">·</span>
              <span class="reco-platform">${f.platform}</span>
            </div>
            <div class="reco-hook">${f.hook}</div>
          </div>
          <div class="reco-card-right">
            <div class="compat-score">${f.compatScore}<span class="compat-pct">%</span></div>
            <div class="compat-label">compatibilité</div>
            <div class="reco-arrow">→</div>
          </div>
        </div>
      </div>`).join("");
  }
};

// ─── DETAIL ────────────────────────────────────────────────────────────────────
window.Detail = {
  open(i) {
    const f = Reco.current[i];
    if (!f) return;
    const trailerUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(f.trailerQuery)}`;
    $("detail-content").innerHTML = `
      <div class="detail-hero">
        <div class="detail-title">${f.title}</div>
        <div class="detail-subtitle">${f.year} · ${fmtDur(f.duration)} · ${f.director || ""}</div>
        <div class="detail-meta-row">
          <span class="badge-genre">${f.genre}</span>
          <span class="badge-platform">${f.platform}</span>
          <span class="badge-rating">★ ${f.rating?.toFixed(1) || "—"}</span>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-label">Pourquoi ce film pour toi</div>
        <p class="detail-why">${f.why}</p>
      </div>

      <div class="detail-section">
        <div class="detail-label">Synopsis</div>
        <p class="detail-text">${f.synopsis}</p>
      </div>

      ${f.cast?.length ? `
      <div class="detail-section">
        <div class="detail-label">Avec</div>
        <div class="cast-row">${f.cast.map(a => `<span class="cast-tag">${a}</span>`).join("")}</div>
      </div>` : ""}

      <div class="detail-section">
        <div class="detail-label">Bande-annonce</div>
        <a href="${trailerUrl}" target="_blank" class="trailer-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Voir la bande-annonce sur YouTube
        </a>
      </div>

      <div class="detail-section">
        <div class="detail-label">Compatibilité</div>
        <div class="compat-bar-wrap">
          <div class="compat-bar-fill" style="width:${f.compatScore}%"></div>
        </div>
        <div class="compat-bar-label">${f.compatScore}% avec ton profil${State.wizard.who === "couple" ? " (et celui de ta copine)" : ""}</div>
      </div>

      <button class="btn-full btn-accent" style="margin-top:1.5rem" onclick="Films.markWatched('${f.title.replace(/'/g,"\\'")}', ${f.year})">
        ✓ Marquer comme vu
      </button>
    `;
    $("film-detail").style.display  = "block";
    $("reco-results").style.display = "none";
    $("detail-content").scrollTop = 0;
    window.scrollTo(0, 0);
  },
  close() {
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

  filter(q) {
    const filtered = State.films.filter(f => f.title.toLowerCase().includes(q.toLowerCase()));
    Films.renderList(filtered);
  },

  render() {
    Films.renderList(State.films);
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
    $("stat-total").textContent = State.films.length;
    const rated = State.films.filter(f => f.rating > 0);
    const avg   = rated.length ? rated.reduce((s, f) => s + f.rating, 0) / rated.length : 0;
    $("stat-avg").textContent = avg ? avg.toFixed(1) + "★" : "—";
    $("stat-fav").textContent = State.films.filter(f => f.rating >= 4).length;
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
    const id = await fbAddFilm(State.user.uid, { title, year, rating: State.addStar });
    State.films.unshift({ id, title, year, rating: State.addStar });
    Films.render();
    $("new-title").value = "";
    $("new-year").value  = "";
    Films.hideAddForm();
    toast("Film ajouté !");
  },

  async markWatched(title, year) {
    if (State.films.find(f => f.title.toLowerCase() === title.toLowerCase())) {
      toast("Déjà dans ta liste !", "warn");
      return;
    }
    const id = await fbAddFilm(State.user.uid, { title, year: String(year), rating: 0 });
    State.films.unshift({ id, title, year: String(year), rating: 0 });
    Films.updateStats();
    toast(`"${title}" ajouté à ta liste. Pense à lui mettre une note !`);
    Detail.close();
  },

  async remove(id) {
    await fbDeleteFilm(State.user.uid, id);
    State.films = State.films.filter(f => f.id !== id);
    Films.render();
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
      const nameIdx   = header.findIndex(h => h.includes("name"));
      const yearIdx   = header.findIndex(h => h.includes("year"));
      const ratingIdx = header.findIndex(h => h.includes("rating"));

      const toAdd = [];
      for (let i = 1; i < lines.length; i++) {
        // CSV simple — gère les virgules dans les titres (entre guillemets)
        const cols  = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        const clean = cols.map(c => c.replace(/^"|"$/g, "").trim());
        const title = clean[nameIdx];
        if (!title) continue;
        if (State.films.find(f => f.title.toLowerCase() === title.toLowerCase())) continue;
        const year   = clean[yearIdx] || "";
        const raw    = parseFloat(clean[ratingIdx]);
        const rating = isNaN(raw) ? 0 : Math.round(raw);
        toAdd.push({ title, year, rating });
      }

      if (!toAdd.length) { $("import-status").textContent = "Aucun nouveau film trouvé."; return; }
      await fbBulkAddFilms(State.user.uid, toAdd);
      State.films = await fbGetFilms(State.user.uid);
      Films.render();
      $("import-status").textContent = `✓ ${toAdd.length} films importés !`;
      setTimeout(() => $("import-status").textContent = "", 4000);
      toast(`${toAdd.length} films importés depuis Letterboxd !`);
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
    // Email
    $("user-email-display").textContent = State.user?.email || "";
    // API key
    $("api-key-input").value = getAPIKey() ? "••••••••••••••••" : "";
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

  saveAPIKey() {
    const val = $("api-key-input").value.trim();
    if (val && !val.startsWith("•")) {
      localStorage.setItem("cinescope_apikey", val);
      toast("Clé API sauvegardée !");
      $("api-key-input").value = "••••••••••••••••";
    }
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

  await Films.load();
  Settings.syncUI();
  showScreen("app");
  Nav.goto("reco");
});
