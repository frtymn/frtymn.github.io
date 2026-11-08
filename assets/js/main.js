/*
  frtymn.github.io — progressive enhancements.
  The page is fully readable without this script; it adds:
  1. theme toggle, 2. mobile menu, 3. nav state, 4. GitHub repository list.
*/
(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------- 1. Theme ---------- */
  var themeBtn = document.querySelector('.theme-toggle');
  var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var themeMeta = document.querySelectorAll('meta[name="theme-color"]');

  function storedTheme() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  }

  function resolvedTheme() {
    var t = root.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return mql && mql.matches ? 'dark' : 'light';
  }

  function syncTheme() {
    var t = resolvedTheme();
    root.setAttribute('data-theme-resolved', t);
    if (themeBtn) {
      themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }
    // Keep the browser UI colour in step with an explicit choice.
    for (var i = 0; i < themeMeta.length; i++) {
      themeMeta[i].setAttribute('content', t === 'dark' ? '#0a0a0a' : '#fafafa');
      themeMeta[i].removeAttribute('media');
    }
  }

  if (themeBtn) {
    themeBtn.hidden = false;
    themeBtn.addEventListener('click', function () {
      var next = resolvedTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      syncTheme();
    });
  }
  if (mql) {
    var onScheme = function () { if (!storedTheme()) syncTheme(); };
    if (mql.addEventListener) mql.addEventListener('change', onScheme);
    else if (mql.addListener) mql.addListener(onScheme);
  }
  syncTheme();

  /* ---------- 2. Mobile menu ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var panel = document.getElementById('nav-panel');
  var menuLabel = menuBtn && menuBtn.querySelector('.menu-btn-label');

  function setMenu(open) {
    if (!menuBtn || !panel) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-open', open);
    if (menuLabel) menuLabel.textContent = open ? 'Close' : 'Menu';
  }

  if (menuBtn && panel) {
    menuBtn.hidden = false;
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        menuBtn.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (menuBtn.getAttribute('aria-expanded') === 'true' &&
          !panel.contains(e.target) && !menuBtn.contains(e.target)) {
        setMenu(false);
      }
    });
    // Reset when growing past the mobile breakpoint.
    var desktop = window.matchMedia('(min-width: 768px)');
    var onDesktop = function () { if (desktop.matches) setMenu(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onDesktop);
    else if (desktop.addListener) desktop.addListener(onDesktop);
  }

  /* ---------- 3. Header shadow + current section ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    var links = {};
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(function (a) {
      links[a.getAttribute('href').slice(1)] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        Object.keys(links).forEach(function (id) { links[id].removeAttribute('aria-current'); });
        var link = links[entry.target.id];
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* ---------- Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- 4. GitHub repositories ----------
     One unauthenticated request to the public API (60 req/hour per IP),
     cached in localStorage for 6 hours. No token is used or needed.
     Repositories already present as curated cards (data-repo) are skipped,
     as are forks and archived repositories. Failures leave the page as-is. */
  var GH_USER = 'frtymn';
  var CACHE_KEY = 'gh-repos-v1';
  var CACHE_TTL = 6 * 60 * 60 * 1000;
  var grid = document.getElementById('project-grid');
  var moreCard = document.getElementById('more-card');
  var status = document.getElementById('projects-status');

  function readCache() {
    try {
      var c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (c && Date.now() - c.t < CACHE_TTL && Array.isArray(c.d)) return c.d;
    } catch (e) {}
    return null;
  }
  function writeCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: data })); } catch (e) {}
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function safeUrl(u) {
    try {
      var url = new URL(u);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
    } catch (e) { return null; }
  }

  function externalLink(href, label, srText) {
    var a = el('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.appendChild(document.createTextNode(label));
    var sr = el('span', 'visually-hidden', srText);
    a.appendChild(sr);
    var arrow = el('span', null, ' ↗');
    arrow.setAttribute('aria-hidden', 'true');
    a.appendChild(arrow);
    return a;
  }

  function repoCard(r) {
    var card = el('article', 'card project');
    card.setAttribute('data-repo', r.name);

    var icon = el('div', 'project-icon');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></svg>';
    icon.appendChild(el('span', null, GH_USER + '/' + r.name));
    card.appendChild(icon);

    var body = el('div', 'project-body');
    var meta = el('div', 'project-meta');
    var st = el('span', 'status is-neutral');
    var dot = el('span', 'status-dot');
    dot.setAttribute('aria-hidden', 'true');
    st.appendChild(dot);
    st.appendChild(document.createTextNode('Public repository'));
    meta.appendChild(st);
    if (r.pushed_at) {
      var d = new Date(r.pushed_at);
      if (!isNaN(d)) meta.appendChild(el('span', 'project-date', 'Updated ' + d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })));
    }
    body.appendChild(meta);
    body.appendChild(el('h3', 'project-title', r.name));
    body.appendChild(el('p', 'project-desc', r.description || 'No description has been added to this repository yet.'));

    if (r.language) {
      var tags = el('ul', 'tags');
      tags.appendChild(el('li', null, r.language));
      body.appendChild(tags);
    }

    var linksWrap = el('div', 'project-links');
    var src = safeUrl(r.html_url);
    if (src) linksWrap.appendChild(externalLink(src, 'Source', ' code for ' + r.name + ' (opens in a new tab)'));
    var live = r.homepage && safeUrl(r.homepage);
    if (live) linksWrap.appendChild(externalLink(live, 'Live site', ' for ' + r.name + ' (opens in a new tab)'));
    body.appendChild(linksWrap);

    card.appendChild(body);
    return card;
  }

  function render(repos) {
    if (!grid || !moreCard) return;
    var listed = {};
    grid.querySelectorAll('[data-repo]').forEach(function (n) { listed[n.getAttribute('data-repo').toLowerCase()] = true; });
    var extra = repos.filter(function (r) {
      return r && !r.fork && !r.archived && !r.private && !listed[String(r.name).toLowerCase()];
    });
    extra.forEach(function (r) { grid.insertBefore(repoCard(r), moreCard); });
    if (extra.length && status) {
      status.textContent = extra.length + (extra.length === 1 ? ' repository' : ' repositories') + ' added from GitHub.';
    }
  }

  function loadRepos() {
    if (!grid || !window.fetch) return;
    var cached = readCache();
    if (cached) { render(cached); return; }
    fetch('https://api.github.com/users/' + GH_USER + '/repos?per_page=100&sort=pushed', {
      headers: { Accept: 'application/vnd.github+json' }
    })
      .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(function (data) {
        if (!Array.isArray(data)) return;
        var slim = data.map(function (r) {
          return { name: r.name, description: r.description, language: r.language, html_url: r.html_url,
                   homepage: r.homepage, pushed_at: r.pushed_at, fork: r.fork, archived: r.archived, private: r.private };
        });
        writeCache(slim);
        render(slim);
      })
      .catch(function () { /* Curated cards remain; nothing else to do. */ });
  }

  // Defer the network request until the browser is idle.
  if ('requestIdleCallback' in window) requestIdleCallback(loadRepos, { timeout: 3000 });
  else setTimeout(loadRepos, 1200);
})();
