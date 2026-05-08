/* CinéChoice — Dark Emerald Netflix-like */
:root {
  --bg:        #0a0f0a;
  --bg2:       #111811;
  --bg3:       #1a241a;
  --border:    #1e2e1e;
  --text:      #f0f7f0;
  --text2:     #8ab48a;
  --text3:     #4a6e4a;
  --accent:    #1db954;
  --accent2:   #17a349;
  --accent-dim:#0d3d21;
  --danger:    #e05050;
  --radius:    10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
}

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased}

/* SCREENS */
.screen{display:none;min-height:100vh}
.screen.active{display:flex;flex-direction:column}

/* AUTH */
#screen-auth{align-items:center;justify-content:center;padding:2rem 1rem;background:radial-gradient(ellipse at top,#0d2e1a 0%,var(--bg) 60%)}
.auth-wrap{width:100%;max-width:360px}
.auth-logo{display:flex;align-items:center;gap:12px;margin-bottom:.5rem}
.logo-icon{font-size:32px;color:var(--accent)}
.logo-text{font-size:24px;font-weight:600;letter-spacing:-.03em;color:var(--text)}
.auth-sub{color:var(--text2);font-size:14px;margin-bottom:2rem}
.field-group{margin-bottom:14px}
.field-group label{display:block;font-size:12px;color:var(--text2);margin-bottom:6px;letter-spacing:.04em;font-weight:500}
input[type="email"],input[type="password"],input[type="text"]{width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:11px 14px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color .15s}
input:focus{border-color:var(--accent)}
input::placeholder{color:var(--text3)}
.auth-error{font-size:13px;color:var(--danger);margin-bottom:10px;min-height:20px}

/* BUTTONS */
.btn-full{width:100%;background:var(--accent);color:#fff;border:none;border-radius:var(--radius);padding:13px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:background .15s;margin-bottom:10px}
.btn-full:hover{background:var(--accent2)}
.btn-full.btn-accent{background:var(--accent);color:#fff}
.btn-text{background:none;border:none;color:var(--text2);font-size:13px;cursor:pointer;width:100%;text-align:center;padding:6px;font-family:'DM Sans',sans-serif}
.btn-text:hover{color:var(--accent)}
.btn-text-sm{background:none;border:none;color:var(--text2);font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif}
.btn-text-sm:hover{color:var(--accent)}
.btn-sec{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:11px 18px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;transition:all .15s;white-space:nowrap}
.btn-sec:hover{border-color:var(--accent);color:var(--accent)}
.btn-sec-full{width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:13px;color:var(--text2);font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;transition:all .15s}
.btn-sec-full:hover{border-color:var(--accent);color:var(--accent)}
.btn-sm{background:var(--accent-dim);border:1px solid var(--accent);border-radius:8px;padding:7px 14px;color:var(--accent);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s}
.btn-sm:hover{background:var(--accent);color:#fff}
.btn-ghost{background:none;border:1px solid var(--border);color:var(--text2)}
.btn-ghost:hover{background:var(--bg3);color:var(--text);border-color:var(--border)}
.btn-icon{background:none;border:none;color:var(--text2);cursor:pointer;padding:6px;display:flex;align-items:center;justify-content:center;border-radius:8px;transition:all .15s}
.btn-icon:hover{background:var(--bg3);color:var(--accent)}
.btn-danger{width:100%;background:none;border:1px solid var(--danger);border-radius:var(--radius);padding:11px;color:var(--danger);font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;transition:background .15s}
.btn-danger:hover{background:var(--danger);color:#fff}

/* ONBOARDING */
#screen-onboarding{align-items:center;justify-content:center;padding:2rem 1rem;background:radial-gradient(ellipse at top,#0d2e1a 0%,var(--bg) 60%)}
.onboard-wrap{width:100%;max-width:480px}
.ob-head{margin-bottom:1.5rem}
.ob-num{font-size:12px;color:var(--accent);letter-spacing:.08em;display:block;margin-bottom:8px;font-weight:500}
.ob-head h2{font-size:22px;font-weight:600;margin-bottom:6px}
.ob-head p{color:var(--text2);font-size:14px}
.platform-grid,.genre-grid{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:1.5rem}
.plat-btn,.genre-btn{padding:8px 14px;border:1px solid var(--border);border-radius:20px;font-size:13px;cursor:pointer;color:var(--text2);background:var(--bg3);transition:all .15s;user-select:none}
.plat-btn:hover,.genre-btn:hover{border-color:var(--accent);color:var(--accent)}
.plat-btn.active,.genre-btn.active{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:500}

/* APP */
#screen-app{flex-direction:column;padding-bottom:64px}
.page{display:none;padding:0 1rem;max-width:540px;margin:0 auto;width:100%}
.page.active{display:block}
.page-header{display:flex;align-items:center;justify-content:space-between;padding:1rem 0;position:sticky;top:0;background:var(--bg);z-index:10;border-bottom:1px solid var(--border);margin-bottom:1.25rem}
.logo-sm{font-size:15px;font-weight:600;letter-spacing:-.01em;color:var(--accent)}

/* BOTTOM NAV */
.bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:var(--bg2);border-top:1px solid var(--border);display:flex;z-index:100}
.nav-btn{flex:1;background:none;border:none;color:var(--text3);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-family:'DM Sans',sans-serif;font-size:11px;transition:color .15s}
.nav-btn.active{color:var(--accent)}
.nav-btn:hover:not(.active){color:var(--text2)}

/* HERO */
.hero{position:relative;width:100%;height:240px;border-radius:var(--radius-xl);overflow:hidden;margin-bottom:1.5rem;cursor:pointer}
.hero-img{width:100%;height:100%;object-fit:cover;display:block}
.hero-gradient{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.92) 0%,rgba(0,0,0,.3) 50%,transparent 100%)}
.hero-content{position:absolute;bottom:0;left:0;right:0;padding:1.25rem}
.hero-badge{display:inline-block;background:var(--accent);color:#fff;font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;margin-bottom:8px;letter-spacing:.04em}
.hero-title{font-size:22px;font-weight:700;letter-spacing:-.02em;margin-bottom:4px;line-height:1.2}
.hero-meta{font-size:12px;color:rgba(255,255,255,.7);margin-bottom:12px}
.hero-btn{display:inline-flex;align-items:center;gap:6px;background:var(--accent);color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .15s}
.hero-btn:hover{background:var(--accent2)}
.hero-placeholder{width:100%;height:100%;background:linear-gradient(135deg,var(--bg3),var(--bg2));display:flex;align-items:center;justify-content:center;font-size:48px}

/* WIZARD */
#wizard-container{padding-top:1rem}
.wizard-body{min-height:50vh}
.wstep{display:none;animation:fadeUp .2s ease}
.wstep.active{display:block}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.wstep-title{font-size:20px;font-weight:600;margin-bottom:6px;letter-spacing:-.02em}
.wstep-sub{font-size:13px;color:var(--text2);margin-bottom:1.25rem}

.who-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1.25rem;margin-top:1.25rem}
.who-card{border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.5rem 1rem;text-align:center;cursor:pointer;transition:all .15s;background:var(--bg2)}
.who-card:hover{border-color:var(--accent)}
.who-card.active{border-color:var(--accent);background:var(--accent-dim)}
.who-icon{font-size:28px;margin-bottom:8px;color:var(--text3)}
.who-card.active .who-icon{color:var(--accent)}
.who-label{font-size:14px;font-weight:500}

.mood-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:1.25rem;margin-top:1rem}
.mood-card{border:1px solid var(--border);border-radius:var(--radius);padding:14px 8px;text-align:center;cursor:pointer;transition:all .15s;background:var(--bg2)}
.mood-card:hover{border-color:var(--accent)}
.mood-card.active{border-color:var(--accent);background:var(--accent-dim)}
.mood-icon{font-size:18px;color:var(--text3);margin-bottom:6px}
.mood-card.active .mood-icon{color:var(--accent)}
.mood-label{font-size:13px;font-weight:500;margin-bottom:2px}
.mood-sub{font-size:11px;color:var(--text2)}

.pref-section{margin-bottom:1.25rem}
.pref-label{font-size:12px;color:var(--text2);letter-spacing:.04em;display:block;margin-bottom:10px;font-weight:500}
.slider-row{display:flex;align-items:center;gap:12px}
.slider-side{font-size:12px;color:var(--text3);white-space:nowrap}
input[type="range"]{flex:1;-webkit-appearance:none;height:4px;background:var(--bg3);border-radius:2px;outline:none}
input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:var(--accent);cursor:pointer}

.chips{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:1.25rem}
.chip{padding:6px 13px;border:1px solid var(--border);border-radius:20px;font-size:13px;color:var(--text2);background:var(--bg2);cursor:pointer;transition:all .15s;user-select:none}
.chip:hover{border-color:var(--accent);color:var(--accent)}
.chip.active{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:500}

.step-nav{display:flex;gap:10px;margin-top:1.5rem}
.wiz-dots{display:flex;justify-content:center;gap:8px;padding:1.5rem 0 .5rem}
.dot{width:6px;height:6px;border-radius:50%;background:var(--border);cursor:pointer;transition:background .15s}
.dot.active{background:var(--accent)}

/* LOADING */
.loading-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:70vh;gap:1rem}
.loading-logo{font-size:48px;color:var(--accent);animation:pulse 1.5s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.loading-msg{font-size:14px;color:var(--text2)}
.loading-track{width:200px;height:3px;background:var(--bg3);border-radius:2px;overflow:hidden}
.loading-bar{height:100%;background:var(--accent);border-radius:2px;width:0;transition:width .6s ease}
.loading-inline{text-align:center;padding:2rem;color:var(--text2);font-size:14px}

/* RESULTS META */
.results-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
.results-title{font-size:17px;font-weight:600}
.results-meta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:1rem}
.meta-tag{font-size:12px;padding:4px 10px;border-radius:20px;background:var(--bg3);border:1px solid var(--border);color:var(--text2)}

/* RECO CARDS — Netflix list style */
.reco-list{display:flex;flex-direction:column;gap:12px;margin-bottom:1rem}
.reco-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-lg);cursor:pointer;transition:all .2s;overflow:hidden}
.reco-card:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:0 8px 32px rgba(29,185,84,.15)}
.reco-card-inner{display:flex;align-items:stretch;gap:0}
.reco-poster{width:90px;height:130px;flex-shrink:0;position:relative;overflow:hidden}
.reco-poster img{width:100%;height:100%;object-fit:cover;display:block}
.reco-poster-placeholder{width:100%;height:100%;background:linear-gradient(135deg,var(--bg3),var(--bg2));display:flex;align-items:center;justify-content:center;font-size:32px;color:var(--text3)}
.reco-card-main{flex:1;padding:14px 14px 14px 12px;min-width:0;display:flex;flex-direction:column;justify-content:space-between}
.reco-title{font-size:15px;font-weight:600;margin-bottom:3px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.reco-year{font-size:13px;font-weight:400;color:var(--text2)}
.reco-meta-row{font-size:12px;color:var(--text2);display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px}
.reco-sep{color:var(--text3)}
.reco-platform{color:var(--accent);font-weight:500}
.reco-hook{font-size:12px;color:var(--text2);line-height:1.4;font-style:italic;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.reco-card-right{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:14px 12px;border-left:1px solid var(--border);min-width:58px}
.compat-score{font-size:20px;font-weight:700;color:var(--accent);line-height:1}
.compat-pct{font-size:11px;color:var(--text3)}
.compat-label{font-size:9px;color:var(--text3);text-align:center;line-height:1.3}
.reco-arrow{font-size:14px;color:var(--text3);margin-top:6px}
.results-footer{padding:.5rem 0 1.5rem}

/* DETAIL */
#film-detail{position:absolute;top:0;left:0;right:0;background:var(--bg);padding:0;max-width:540px;margin:0 auto;z-index:50;min-height:100vh}
.detail-backdrop{width:100%;height:220px;position:relative;overflow:hidden}
.detail-backdrop img{width:100%;height:100%;object-fit:cover;display:block;filter:brightness(.5)}
.detail-backdrop-gradient{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.2) 0%,var(--bg) 100%)}
.detail-backdrop-placeholder{width:100%;height:100%;background:linear-gradient(135deg,var(--bg3),var(--bg2));display:flex;align-items:center;justify-content:center;font-size:64px}
.detail-header-overlay{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:1rem}
.detail-body{padding:0 1rem 2rem}
.detail-poster-row{display:flex;gap:14px;align-items:flex-end;margin-top:-60px;margin-bottom:1rem;position:relative;z-index:2}
.detail-poster{width:90px;height:130px;border-radius:10px;overflow:hidden;border:2px solid var(--border);flex-shrink:0;box-shadow:0 8px 24px rgba(0,0,0,.5)}
.detail-poster img{width:100%;height:100%;object-fit:cover;display:block}
.detail-poster-placeholder{width:100%;height:100%;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:32px}
.detail-title-block{flex:1;padding-bottom:4px}
.detail-title{font-size:20px;font-weight:700;letter-spacing:-.02em;margin-bottom:4px;color:var(--text)}
.detail-subtitle{font-size:12px;color:var(--text2);margin-bottom:8px}
.detail-meta-row{display:flex;flex-wrap:wrap;gap:6px}
.badge-genre{background:var(--bg3);border:1px solid var(--border);padding:3px 9px;border-radius:20px;font-size:11px;color:var(--text2)}
.badge-platform{background:var(--accent-dim);border:1px solid var(--accent);padding:3px 9px;border-radius:20px;font-size:11px;color:var(--accent);font-weight:500}
.badge-rating{background:var(--bg3);border:1px solid var(--border);padding:3px 9px;border-radius:20px;font-size:11px;color:var(--text)}
.detail-section{margin-bottom:1.5rem}
.detail-label{font-size:11px;color:var(--text3);letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px;font-weight:500}
.detail-why{font-size:14px;color:var(--text);line-height:1.6;padding:12px 14px;background:var(--accent-dim);border-radius:var(--radius);border-left:3px solid var(--accent)}
.detail-text{font-size:14px;color:var(--text2);line-height:1.7}
.cast-row{display:flex;flex-wrap:wrap;gap:7px}
.cast-tag{background:var(--bg3);border:1px solid var(--border);padding:5px 12px;border-radius:20px;font-size:13px;color:var(--text2)}
.trailer-btn{display:inline-flex;align-items:center;gap:8px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:11px 16px;font-size:14px;color:var(--text);text-decoration:none;transition:all .15s}
.trailer-btn:hover{border-color:var(--accent);color:var(--accent)}
.compat-bar-wrap{height:6px;background:var(--bg3);border-radius:4px;overflow:hidden;margin-bottom:6px}
.compat-bar-fill{height:100%;background:var(--accent);border-radius:4px;transition:width 1s ease}
.compat-bar-label{font-size:12px;color:var(--text2)}

/* FILMS PAGE */
.stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:1rem}
.stat-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center}
.stat-n{font-size:22px;font-weight:600;color:var(--accent)}
.stat-l{font-size:11px;color:var(--text3);margin-top:2px}
.search-bar{display:flex;align-items:center;gap:8px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:0 12px;margin-bottom:10px;color:var(--text3)}
.search-bar:focus-within{border-color:var(--accent)}
.search-bar input{flex:1;background:none;border:none;padding:10px 4px;font-size:14px;color:var(--text)}
.search-bar input:focus{outline:none}
.import-zone{display:flex;align-items:center;gap:12px;background:var(--accent-dim);border:1px dashed var(--accent);border-radius:var(--radius);padding:14px;margin-bottom:10px;cursor:pointer;transition:all .15s;color:var(--accent)}
.import-zone:hover{background:#0d3d21cc}
.import-title{font-size:13px;font-weight:500;color:var(--accent)}
.import-sub{font-size:11px;color:var(--text2);margin-top:2px}
#import-status{font-size:12px;color:var(--accent);margin-left:auto;font-weight:500}
.add-form{display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:12px;margin-bottom:10px}
.add-input{background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-size:14px;color:var(--text);font-family:'DM Sans',sans-serif;outline:none;transition:border-color .15s}
.add-input:focus{border-color:var(--accent)}
.star-input{display:flex;gap:4px}
.star-btn{font-size:18px;cursor:pointer;color:var(--border);transition:color .1s;line-height:1}
.star-btn.lit{color:var(--accent)}
.film-list{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden}
.film-row{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-bottom:1px solid var(--border);transition:background .1s}
.film-row:last-child{border-bottom:none}
.film-row:hover{background:var(--bg3)}
.film-info{flex:1;min-width:0}
.film-title{font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.film-year{font-size:12px;color:var(--text3)}
.film-row-right{display:flex;align-items:center;gap:10px}
.film-stars{font-size:13px;color:var(--accent);letter-spacing:1px}
.del-btn{background:none;border:none;cursor:pointer;color:var(--text3);font-size:13px;padding:2px 4px}
.del-btn:hover{color:var(--danger)}
.empty-state{font-size:14px;color:var(--text3);text-align:center;padding:2.5rem 1rem;line-height:1.8}

/* SETTINGS */
.settings-section{margin-bottom:1.5rem;padding-bottom:1.5rem;border-bottom:1px solid var(--border)}
.settings-title{font-size:14px;font-weight:500;margin-bottom:12px;color:var(--text)}

/* TOAST */
.toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--bg3);border:1px solid var(--accent);border-radius:var(--radius);padding:10px 18px;font-size:13px;color:var(--text);z-index:1000;white-space:nowrap;animation:toastIn .2s ease;box-shadow:0 4px 20px rgba(29,185,84,.2)}
.toast-warn{border-color:var(--danger);color:var(--danger)}
@keyframes toastIn{from{opacity:0;bottom:60px}to{opacity:1;bottom:80px}}

@media(min-width:600px){
  #page-reco,#page-films,#page-settings{padding:0 1.5rem}
}
