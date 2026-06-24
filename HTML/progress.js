/* Mathe-2-Fortschritt: Module pro Thema abhaken, Balken pro Thema + Gesamtbalken.
   Gespeichert in localStorage unter "mathe2_progress":
   { "<chapterId>": { "m1": true, "m3": true }, ... }
   - Chapter-Seite:  <body data-chapter="folgen" data-accent="#0d9488">
   - Startseite:     ein <div id="overall-progress"></div> + .card[data-chapter="..."]
*/
(function () {
  var KEY = 'mathe2_progress';

  // Registry aller Themen mit eigener Modul-Zusammenfassung (für den Gesamtbalken).
  var CHAPTERS = [
    { id: 'kombinatorik', modules: 7, accent: '#1d4ed8' },
    { id: 'folgen',       modules: 6, accent: '#0d9488' },
    { id: 'reihen',       modules: 6, accent: '#0d9488' },
    { id: 'stetigkeit',   modules: 6, accent: '#0d9488' },
    { id: 'ableitung',    modules: 7, accent: '#4f46e5' }
  ];

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function isDone(ch, m) { var d = load(); return !!(d[ch] && d[ch][m]); }
  function setDone(ch, m, v) {
    var d = load(); if (!d[ch]) d[ch] = {};
    if (v) d[ch][m] = true; else delete d[ch][m];
    if (!Object.keys(d[ch]).length) delete d[ch];
    save(d);
  }
  function count(ch) { var d = load(); return d[ch] ? Object.keys(d[ch]).length : 0; }
  function reg(id) { for (var i = 0; i < CHAPTERS.length; i++) if (CHAPTERS[i].id === id) return CHAPTERS[i]; return null; }

  function injectCSS() {
    if (document.getElementById('mp-style')) return;
    var s = document.createElement('style');
    s.id = 'mp-style';
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
      '.modcheck{display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-size:.78rem;font-weight:700;color:#64748b;background:#fff;border:1.5px solid #cbd5e1;border-radius:20px;padding:6px 14px;margin:0 0 14px;user-select:none;transition:all .15s}' +
      '.modcheck:hover{border-color:var(--mp-accent,#4f46e5);color:#334155}' +
      '.modcheck input{width:16px;height:16px;accent-color:var(--mp-accent,#4f46e5);cursor:pointer;margin:0}' +
      '.modcheck.done{background:#dcfce7;border-color:#86efac;color:#15803d}' +
      '.mp-mini{margin-top:12px}' +
      '.mp-mini-label{font-size:.72rem;font-weight:800;color:#475569;margin-bottom:5px}' +
      '.mp-mini-track{height:8px;background:#eef2f7;border-radius:6px;overflow:hidden}' +
      '.mp-mini-fill{height:100%;width:0;border-radius:6px;transition:width .4s ease}';
    document.head.appendChild(s);
  }

  function setAccent(accent) {
    document.documentElement.style.setProperty('--mp-accent', accent || '#4f46e5');
  }

  /* ---------- Chapter page ---------- */
  function initChapter(chap, accent) {
    injectCSS();
    setAccent(accent);
    var page = document.querySelector('.page');
    if (!page) return;
    var mods = [].slice.call(document.querySelectorAll('.module'));
    var total = mods.length;

    var bar = document.createElement('div');
    bar.className = 'mp-bar';
    bar.innerHTML =
      '<div class="mp-bar-head"><span>📊 Dein Fortschritt in diesem Thema</span><span class="mp-pct">0%</span></div>' +
      '<div class="mp-track"><div class="mp-fill"></div></div>' +
      '<div class="mp-sub"><span class="mp-sub-txt"></span> · <button class="mp-reset" type="button">zurücksetzen</button></div>';
    page.insertBefore(bar, page.firstChild);
    var fill = bar.querySelector('.mp-fill'),
        pctEl = bar.querySelector('.mp-pct'),
        subEl = bar.querySelector('.mp-sub-txt');

    var controls = [];

    function refresh() {
      var c = Math.min(count(chap), total);
      var pct = total ? Math.round(100 * c / total) : 0;
      fill.style.width = pct + '%';
      pctEl.textContent = pct + '%';
      subEl.textContent = c + ' / ' + total + ' Modulen erledigt';
    }

    function syncControl(ctrl) {
      var on = isDone(chap, ctrl.id);
      ctrl.cb.checked = on;
      ctrl.lab.classList.toggle('done', on);
      ctrl.txt.textContent = on ? 'Modul erledigt ✓' : 'Als erledigt markieren';
    }

    mods.forEach(function (mod) {
      var id = mod.id;
      var anchor = mod.querySelector('.subtitle') || mod.querySelector('h2');
      var lab = document.createElement('label');
      lab.className = 'modcheck';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      var txt = document.createElement('span');
      lab.appendChild(cb);
      lab.appendChild(txt);
      var ctrl = { id: id, cb: cb, lab: lab, txt: txt };
      controls.push(ctrl);
      syncControl(ctrl);
      cb.addEventListener('change', function () {
        setDone(chap, id, cb.checked);
        syncControl(ctrl);
        refresh();
      });
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(lab, anchor.nextSibling);
      else mod.insertBefore(lab, mod.firstChild);
    });

    bar.querySelector('.mp-reset').addEventListener('click', function () {
      controls.forEach(function (c) { setDone(chap, c.id, false); syncControl(c); });
      refresh();
    });

    refresh();

    // Über mehrere Tabs synchron halten
    window.addEventListener('storage', function (e) {
      if (e.key === KEY) { controls.forEach(syncControl); refresh(); }
    });
  }

  /* ---------- Home page ---------- */
  function initHome() {
    injectCSS();
    setAccent('#4f46e5');

    var host = document.getElementById('overall-progress');
    if (host) {
      var d = 0, t = 0;
      CHAPTERS.forEach(function (c) { d += Math.min(count(c.id), c.modules); t += c.modules; });
      var p = t ? Math.round(100 * d / t) : 0;
      host.className = 'mp-bar mp-bar-overall';
      host.innerHTML =
        '<div class="mp-bar-head"><span>🎯 Gesamtfortschritt</span><span class="mp-pct">' + p + '%</span></div>' +
        '<div class="mp-track"><div class="mp-fill" style="width:' + p + '%"></div></div>' +
        '<div class="mp-sub">' + d + ' / ' + t + ' Modulen über alle Themen mit Zusammenfassung erledigt</div>';
    }

    [].slice.call(document.querySelectorAll('.card[data-chapter]')).forEach(function (card) {
      var id = card.getAttribute('data-chapter');
      var r = reg(id);
      if (!r) return;
      var c = Math.min(count(id), r.modules);
      var pct = r.modules ? Math.round(100 * c / r.modules) : 0;
      var box = document.createElement('div');
      box.className = 'mp-mini';
      box.innerHTML =
        '<div class="mp-mini-label">Fortschritt: ' + pct + '% (' + c + '/' + r.modules + ' Module)</div>' +
        '<div class="mp-mini-track"><div class="mp-mini-fill" style="width:' + pct + '%;background:' + r.accent + '"></div></div>';
      var btnRow = card.querySelector('.btn-row');
      if (btnRow) card.insertBefore(box, btnRow); else card.appendChild(box);
    });
  }

  function init() {
    var chap = document.body.getAttribute('data-chapter');
    if (chap) initChapter(chap, document.body.getAttribute('data-accent'));
    else if (document.getElementById('overall-progress')) initHome();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
