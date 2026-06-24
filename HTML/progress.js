/* Mathe-2-Fortschritt & Bewertung.
   localStorage:
     "mathe2_progress" = { "<chapter>": { "m1": true } }                  (erledigt)
     "mathe2_ratings"  = { "<chapter>": { "m1": {r:"good", label:"M1: …"} } }  (Verständnis)
   - Chapter-Seite:  <body data-chapter="folgen" data-accent="#0d9488">
   - Startseite:     <div id="overall-progress"></div> + .card[data-chapter="…"]
*/
(function () {
  var KEY_DONE = 'mathe2_progress';
  var KEY_RATE = 'mathe2_ratings';

  var CHAPTERS = [
    { id: 'kombinatorik', title: 'Kombinatorik',            modules: 7, accent: '#1d4ed8', href: 'mathe_kombinatorik1.html' },
    { id: 'folgen',       title: 'Folgen',                  modules: 6, accent: '#0d9488', href: 'folgen3.html' },
    { id: 'reihen',       title: 'Reihen',                  modules: 6, accent: '#0d9488', href: 'reihen4.html' },
    { id: 'stetigkeit',   title: 'Grenzwerte & Stetigkeit', modules: 6, accent: '#0d9488', href: 'stetigkeit5.html' },
    { id: 'ableitung',    title: 'Ableitung',               modules: 7, accent: '#4f46e5', href: 'ableitung6.html' }
  ];

  // Reihenfolge in der Sidebar: zuerst das, was man nochmal ansehen sollte.
  var RATES = [
    { key: 'bad',  emoji: '😟', label: 'Gar nicht gut verstanden', head: '😟 Nochmal ansehen' },
    { key: 'mid',  emoji: '😐', label: 'Mittelmäßig verstanden',   head: '😐 Mittelmäßig' },
    { key: 'good', emoji: '😄', label: 'Gut verstanden',           head: '😄 Sitzt' }
  ];

  function jload(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } }
  function jsave(k, d) { try { localStorage.setItem(k, JSON.stringify(d)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function reg(id) { for (var i = 0; i < CHAPTERS.length; i++) if (CHAPTERS[i].id === id) return CHAPTERS[i]; return null; }

  /* ---- done ---- */
  function isDone(ch, m) { var d = jload(KEY_DONE); return !!(d[ch] && d[ch][m]); }
  function setDone(ch, m, v) {
    var d = jload(KEY_DONE); if (!d[ch]) d[ch] = {};
    if (v) d[ch][m] = true; else delete d[ch][m];
    if (!Object.keys(d[ch]).length) delete d[ch];
    jsave(KEY_DONE, d);
  }
  function doneCount(ch) { var d = jload(KEY_DONE); return d[ch] ? Object.keys(d[ch]).length : 0; }

  /* ---- ratings ---- */
  function getRate(ch, m) { var d = jload(KEY_RATE); return (d[ch] && d[ch][m]) ? d[ch][m] : null; }
  function setRate(ch, m, r, label) {
    var d = jload(KEY_RATE); if (!d[ch]) d[ch] = {};
    if (r) d[ch][m] = { r: r, label: label }; else delete d[ch][m];
    if (!Object.keys(d[ch]).length) delete d[ch];
    jsave(KEY_RATE, d);
  }
  function ratingsForChapter(ch) {
    var d = jload(KEY_RATE), out = []; if (!d[ch]) return out;
    Object.keys(d[ch]).forEach(function (m) { out.push({ id: m, r: d[ch][m].r, label: d[ch][m].label }); });
    return out;
  }
  function allRatings() {
    var d = jload(KEY_RATE), out = [];
    CHAPTERS.forEach(function (c) {
      if (!d[c.id]) return;
      Object.keys(d[c.id]).forEach(function (m) {
        out.push({ ch: c.id, chTitle: c.title, href: c.href, id: m, r: d[c.id][m].r, label: d[c.id][m].label });
      });
    });
    return out;
  }

  function setAccent(a) { document.documentElement.style.setProperty('--mp-accent', a || '#4f46e5'); }

  function injectCSS() {
    if (document.getElementById('mp-style')) return;
    var s = document.createElement('style'); s.id = 'mp-style';
    s.textContent =
      '.mp-bar{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin:0 0 18px;box-shadow:0 1px 5px rgba(16,35,63,.08)}' +
      '.mp-bar-head{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:.86rem;color:#1a2235;gap:10px}' +
      '.mp-pct{font-size:1.05rem;color:var(--mp-accent,#4f46e5)}' +
      '.mp-track{height:12px;background:#eef2f7;border-radius:8px;overflow:hidden;margin:9px 0 6px}' +
      '.mp-fill{height:100%;width:0;background:var(--mp-accent,#4f46e5);border-radius:8px;transition:width .4s ease}' +
      '.mp-sub{font-size:.76rem;color:#64748b;font-weight:600}' +
      '.mp-bar-overall{border:1.5px solid #c7d2fe;background:linear-gradient(180deg,#fff,#f4f6ff)}' +
      '.mp-reset{background:none;border:none;color:#94a3b8;font-size:.72rem;font-weight:700;cursor:pointer;text-decoration:underline;padding:0}' +
      '.mp-reset:hover{color:#dc2626}' +
      '.mp-mini{margin-top:12px}' +
      '.mp-mini-label{font-size:.72rem;font-weight:800;color:#475569;margin-bottom:5px}' +
      '.mp-mini-track{height:8px;background:#eef2f7;border-radius:6px;overflow:hidden}' +
      '.mp-mini-fill{height:100%;width:0;border-radius:6px;transition:width .4s ease}' +
      /* module footer (done + rating) */
      '.mod-footer{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-top:20px;padding-top:14px;border-top:1px dashed #cbd5e1}' +
      '.mod-rate{display:flex;align-items:center;gap:8px;flex-wrap:wrap}' +
      '.mod-rate-q{font-size:.78rem;font-weight:700;color:#64748b}' +
      '.rate-btns{display:inline-flex;gap:6px}' +
      '.rate{font-size:1.15rem;line-height:1;background:#f1f5f9;border:1.5px solid #e2e8f0;border-radius:10px;padding:5px 9px;cursor:pointer;filter:grayscale(.55);opacity:.7;transition:all .15s}' +
      '.rate:hover{filter:none;opacity:1;transform:translateY(-1px)}' +
      '.rate.sel{filter:none;opacity:1}' +
      '.rate.bad.sel{background:#fee2e2;border-color:#fca5a5}' +
      '.rate.mid.sel{background:#fef3c7;border-color:#fcd34d}' +
      '.rate.good.sel{background:#dcfce7;border-color:#86efac}' +
      '.modcheck{display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-size:.78rem;font-weight:700;color:#64748b;background:#fff;border:1.5px solid #cbd5e1;border-radius:20px;padding:6px 14px;margin:0;user-select:none;transition:all .15s}' +
      '.modcheck:hover{border-color:var(--mp-accent,#4f46e5);color:#334155}' +
      '.modcheck input{width:16px;height:16px;accent-color:var(--mp-accent,#4f46e5);cursor:pointer;margin:0}' +
      '.modcheck.done{background:#dcfce7;border-color:#86efac;color:#15803d}' +
      /* rating sidebar */
      '.rs-toggle{position:fixed;right:14px;bottom:16px;z-index:60;width:50px;height:50px;border-radius:50%;border:none;background:var(--mp-accent,#4f46e5);color:#fff;font-size:1.25rem;box-shadow:0 4px 14px rgba(0,0,0,.28);cursor:pointer}' +
      '.rs-badge{position:absolute;top:-3px;right:-3px;background:#dc2626;color:#fff;font-size:.62rem;font-weight:800;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 4px}' +
      '.rs-panel{position:fixed;top:60px;right:12px;width:240px;max-height:calc(100vh - 80px);overflow-y:auto;background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 8px 28px rgba(16,35,63,.18);padding:14px;z-index:59;transform:translateX(125%);transition:transform .3s ease}' +
      '.rs-panel.rs-open{transform:translateX(0)}' +
      '.rs-head{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:.85rem;color:#1a2235;margin-bottom:10px}' +
      '.rs-close{background:none;border:none;font-size:1.05rem;cursor:pointer;color:#94a3b8;line-height:1}' +
      '.rs-group{margin-bottom:12px}' +
      '.rs-gh{font-size:.74rem;font-weight:800;margin-bottom:5px}' +
      '.rs-group.bad .rs-gh{color:#dc2626}.rs-group.mid .rs-gh{color:#b45309}.rs-group.good .rs-gh{color:#15803d}' +
      '.rs-item{display:block;font-size:.76rem;color:#334155;text-decoration:none;padding:5px 8px;border-radius:7px;background:#f8fafc;margin-bottom:4px;border-left:3px solid #cbd5e1;cursor:pointer}' +
      '.rs-item:hover{background:#eef2f7}' +
      '.rs-group.bad .rs-item{border-left-color:#f87171}.rs-group.mid .rs-item{border-left-color:#fbbf24}.rs-group.good .rs-item{border-left-color:#4ade80}' +
      '.rs-item b{color:#1a2235}' +
      '.rs-empty{font-size:.74rem;color:#94a3b8;font-style:italic}' +
      '.rs-vbar{display:flex;height:14px;border-radius:7px;overflow:hidden;background:#eef2f7;margin:8px 0 5px}' +
      '.rs-vseg{height:100%}' +
      '.rs-vseg.good{background:#22c55e}.rs-vseg.mid{background:#f59e0b}.rs-vseg.bad{background:#ef4444}' +
      '.rs-vlegend{font-size:.72rem;color:#475569;font-weight:700;display:flex;gap:10px;flex-wrap:wrap}' +
      '.rs-vsub{font-size:.7rem;color:#94a3b8;margin-top:3px;margin-bottom:6px}' +
      '@media(min-width:1400px){.rs-panel{transform:none}.rs-toggle{display:none}.rs-close{display:none}}';
    document.head.appendChild(s);
  }

  function makeSidebar() {
    var panel = document.createElement('div'); panel.className = 'rs-panel';
    document.body.appendChild(panel);
    var toggle = document.createElement('button'); toggle.className = 'rs-toggle'; toggle.type = 'button';
    toggle.innerHTML = '📋<span class="rs-badge" style="display:none">0</span>';
    document.body.appendChild(toggle);
    toggle.addEventListener('click', function () { panel.classList.toggle('rs-open'); });
    return { panel: panel, badge: toggle.querySelector('.rs-badge') };
  }
  function setBadge(badge, n) { badge.textContent = n; badge.style.display = n ? 'flex' : 'none'; }

  function groupsHTML(rated, withChapter) {
    var html = '';
    RATES.forEach(function (R) {
      var items = rated.filter(function (x) { return x.r === R.key; });
      html += '<div class="rs-group ' + R.key + '"><div class="rs-gh">' + R.head + ' (' + items.length + ')</div>';
      if (items.length) {
        items.forEach(function (it) {
          var txt = withChapter ? '<b>' + esc(it.chTitle) + '</b> · ' + esc(it.label) : esc(it.label);
          if (withChapter) html += '<a class="rs-item" href="' + it.href + '#' + it.id + '">' + txt + '</a>';
          else html += '<a class="rs-item" data-jump="' + it.id + '">' + txt + '</a>';
        });
      } else html += '<div class="rs-empty">–</div>';
      html += '</div>';
    });
    return html;
  }

  /* ---------- Chapter page ---------- */
  function initChapter(chap, accent) {
    injectCSS(); setAccent(accent);
    var page = document.querySelector('.page'); if (!page) return;
    var mods = [].slice.call(document.querySelectorAll('.module'));
    var total = mods.length;
    var labelMap = {};
    [].slice.call(document.querySelectorAll('.tab')).forEach(function (t) {
      var m = t.getAttribute('data-m'); if (m) labelMap[m] = t.textContent.trim();
    });

    /* top progress bar (done) */
    var bar = document.createElement('div'); bar.className = 'mp-bar';
    bar.innerHTML =
      '<div class="mp-bar-head"><span>📊 Dein Fortschritt in diesem Thema</span><span class="mp-pct">0%</span></div>' +
      '<div class="mp-track"><div class="mp-fill"></div></div>' +
      '<div class="mp-sub"><span class="mp-sub-txt"></span> · <button class="mp-reset" type="button">zurücksetzen</button></div>';
    page.insertBefore(bar, page.firstChild);
    var fill = bar.querySelector('.mp-fill'), pctEl = bar.querySelector('.mp-pct'), subEl = bar.querySelector('.mp-sub-txt');
    var doneCtrls = [];
    function refresh() {
      var c = Math.min(doneCount(chap), total), pct = total ? Math.round(100 * c / total) : 0;
      fill.style.width = pct + '%'; pctEl.textContent = pct + '%'; subEl.textContent = c + ' / ' + total + ' Modulen erledigt';
    }
    function syncDone(ctrl) {
      var on = isDone(chap, ctrl.id);
      ctrl.cb.checked = on; ctrl.lab.classList.toggle('done', on);
      ctrl.txt.textContent = on ? 'Modul erledigt ✓' : 'Als erledigt markieren';
    }

    /* sidebar */
    var sb = makeSidebar();
    var rateCtrls = [];
    function renderPanel() {
      var rated = ratingsForChapter(chap);
      var html = '<div class="rs-head"><span>📋 Meine Bewertungen</span><button class="rs-close" title="schließen">✕</button></div>';
      if (!rated.length) html += '<div class="rs-empty">Bewerte die Module unten mit den Smileys 😟 😐 😄 – sie erscheinen dann hier sortiert.</div>';
      else html += groupsHTML(rated, false);
      sb.panel.innerHTML = html;
      var cl = sb.panel.querySelector('.rs-close'); if (cl) cl.addEventListener('click', function () { sb.panel.classList.remove('rs-open'); });
      [].slice.call(sb.panel.querySelectorAll('.rs-item[data-jump]')).forEach(function (a) {
        a.addEventListener('click', function () {
          var el = document.getElementById(a.getAttribute('data-jump'));
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          sb.panel.classList.remove('rs-open');
        });
      });
      setBadge(sb.badge, rated.filter(function (x) { return x.r === 'bad'; }).length);
    }

    /* per-module footer: rating smileys + done button */
    mods.forEach(function (mod) {
      var id = mod.id;
      var footer = document.createElement('div'); footer.className = 'mod-footer';

      var rateWrap = document.createElement('div'); rateWrap.className = 'mod-rate';
      rateWrap.innerHTML = '<span class="mod-rate-q">Wie gut verstanden?</span>';
      var btnBox = document.createElement('div'); btnBox.className = 'rate-btns';
      var cur = getRate(chap, id); cur = cur ? cur.r : null;
      var btns = [];
      RATES.forEach(function (R) {
        var b = document.createElement('button'); b.type = 'button';
        b.className = 'rate ' + R.key + (cur === R.key ? ' sel' : '');
        b.textContent = R.emoji; b.title = R.label;
        b.addEventListener('click', function () {
          var now = getRate(chap, id); now = now ? now.r : null;
          var nv = (now === R.key) ? null : R.key;
          setRate(chap, id, nv, labelMap[id] || id);
          btns.forEach(function (x) { x.classList.remove('sel'); });
          if (nv) b.classList.add('sel');
          renderPanel();
        });
        btns.push(b); btnBox.appendChild(b);
      });
      rateWrap.appendChild(btnBox); footer.appendChild(rateWrap);
      rateCtrls.push({ id: id, btns: btns });

      var lab = document.createElement('label'); lab.className = 'modcheck';
      var cb = document.createElement('input'); cb.type = 'checkbox'; var txt = document.createElement('span');
      lab.appendChild(cb); lab.appendChild(txt);
      var ctrl = { id: id, cb: cb, lab: lab, txt: txt }; doneCtrls.push(ctrl); syncDone(ctrl);
      cb.addEventListener('change', function () { setDone(chap, id, cb.checked); syncDone(ctrl); refresh(); });
      footer.appendChild(lab);

      mod.appendChild(footer);
    });

    bar.querySelector('.mp-reset').addEventListener('click', function () {
      doneCtrls.forEach(function (c) { setDone(chap, c.id, false); syncDone(c); }); refresh();
    });

    refresh(); renderPanel();

    window.addEventListener('storage', function (e) {
      if (e.key === KEY_DONE) { doneCtrls.forEach(syncDone); refresh(); }
      if (e.key === KEY_RATE) {
        rateCtrls.forEach(function (rc) {
          var cur = getRate(chap, rc.id); cur = cur ? cur.r : null;
          rc.btns.forEach(function (b) { b.classList.toggle('sel', b.classList.contains(cur)); });
        });
        renderPanel();
      }
    });
  }

  /* ---------- Home page ---------- */
  function initHome() {
    injectCSS(); setAccent('#4f46e5');

    var host = document.getElementById('overall-progress');
    if (host) {
      var d = 0, t = 0;
      CHAPTERS.forEach(function (c) { d += Math.min(doneCount(c.id), c.modules); t += c.modules; });
      var p = t ? Math.round(100 * d / t) : 0;
      host.className = 'mp-bar mp-bar-overall';
      host.innerHTML =
        '<div class="mp-bar-head"><span>🎯 Gesamtfortschritt</span><span class="mp-pct">' + p + '%</span></div>' +
        '<div class="mp-track"><div class="mp-fill" style="width:' + p + '%"></div></div>' +
        '<div class="mp-sub">' + d + ' / ' + t + ' Modulen über alle Themen mit Zusammenfassung erledigt</div>';
    }

    [].slice.call(document.querySelectorAll('.card[data-chapter]')).forEach(function (card) {
      var id = card.getAttribute('data-chapter'), r = reg(id); if (!r) return;
      var c = Math.min(doneCount(id), r.modules), pct = r.modules ? Math.round(100 * c / r.modules) : 0;
      var box = document.createElement('div'); box.className = 'mp-mini';
      box.innerHTML =
        '<div class="mp-mini-label">Fortschritt: ' + pct + '% (' + c + '/' + r.modules + ' Module)</div>' +
        '<div class="mp-mini-track"><div class="mp-mini-fill" style="width:' + pct + '%;background:' + r.accent + '"></div></div>';
      var btnRow = card.querySelector('.btn-row');
      if (btnRow) card.insertBefore(box, btnRow); else card.appendChild(box);
    });

    /* rating sidebar with Verstanden-Balken */
    var sb = makeSidebar();
    function renderHomePanel() {
      var all = allRatings();
      var g = all.filter(function (x) { return x.r === 'good'; }).length;
      var m = all.filter(function (x) { return x.r === 'mid'; }).length;
      var b = all.filter(function (x) { return x.r === 'bad'; }).length;
      var rated = g + m + b;
      var totalMods = CHAPTERS.reduce(function (s, c) { return s + c.modules; }, 0);
      var html = '<div class="rs-head"><span>📋 Verständnis-Übersicht</span><button class="rs-close" title="schließen">✕</button></div>';
      html += '<div class="rs-gh" style="color:#1a2235">Verstanden-Balken</div>';
      if (rated) {
        html += '<div class="rs-vbar">' +
          '<div class="rs-vseg good" style="width:' + (100 * g / rated) + '%"></div>' +
          '<div class="rs-vseg mid" style="width:' + (100 * m / rated) + '%"></div>' +
          '<div class="rs-vseg bad" style="width:' + (100 * b / rated) + '%"></div></div>' +
          '<div class="rs-vlegend"><span>😄 ' + Math.round(100 * g / rated) + '%</span>' +
          '<span>😐 ' + Math.round(100 * m / rated) + '%</span>' +
          '<span>😟 ' + Math.round(100 * b / rated) + '%</span></div>';
      } else {
        html += '<div class="rs-vbar"></div>';
      }
      html += '<div class="rs-vsub">' + rated + ' / ' + totalMods + ' Modulen bewertet</div>';
      if (rated) html += groupsHTML(all, true);
      else html += '<div class="rs-empty">Öffne ein Thema und bewerte die Module – die Übersicht erscheint dann hier.</div>';
      sb.panel.innerHTML = html;
      var cl = sb.panel.querySelector('.rs-close'); if (cl) cl.addEventListener('click', function () { sb.panel.classList.remove('rs-open'); });
      setBadge(sb.badge, b);
    }
    renderHomePanel();
    window.addEventListener('storage', function (e) { if (e.key === KEY_RATE) renderHomePanel(); });
  }

  function init() {
    var chap = document.body.getAttribute('data-chapter');
    if (chap) initChapter(chap, document.body.getAttribute('data-accent'));
    else if (document.getElementById('overall-progress')) initHome();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
