/* ============================================================
 * js/main.js —— 全局公共逻辑：导航栏、页脚、动效
 * 依赖：config.js（window.SITE）
 * ============================================================ */
(function () {
  'use strict';
  const S = window.SITE || {};

  /* ---------- 图标库 ---------- */
  const ICONS = {
    github: '<path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.67.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/>',
    mail: '<path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>',
    rss: '<path d="M4 11a9 9 0 0 1 9 9h-2.5A6.5 6.5 0 0 0 4 13.5V11zm0 4a5 5 0 0 1 5 5H7a3 3 0 0 0-3-3v-2zm2.5 4.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM5 4a15 15 0 0 1 15 15h-2.5A12.5 12.5 0 0 0 5 6.5V4z"/>',
    x: '<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>',
    link: '<path d="M10.59 13.41c.41.39.41 1.03 0 1.42-.39.39-1.03.39-1.42 0a5.003 5.003 0 0 1 0-7.07l3.54-3.54a5.003 5.003 0 0 1 7.07 0 5.003 5.003 0 0 1 0 7.07l-1.49 1.49c.01-.82-.12-1.64-.4-2.42l.47-.48a2.982 2.982 0 0 0 0-4.24 2.982 2.982 0 0 0-4.24 0l-3.53 3.53a2.982 2.982 0 0 0 0 4.24zm2.82-4.24c-.39-.39-1.03-.39-1.42 0a1.003 1.003 0 0 0 0 1.42 5.003 5.003 0 0 1 0 7.07l-3.54 3.54a5.003 5.003 0 0 1-7.07 0 5.003 5.003 0 0 1 0-7.07l1.49-1.49c.01.82.12 1.64.4 2.42l-.47.48a2.982 2.982 0 0 0 0 4.24 2.982 2.982 0 0 0 4.24 0l3.53-3.53a2.982 2.982 0 0 0 0-4.24z"/>',
    juejin: '<path d="m12 14.316 7.454-5.88-2.022-1.625L12 11.1l-.004.003-5.432-4.288-2.02 1.624 7.452 5.88Zm0-7.247 2.89-2.298L12 2.453l-.004-.005-2.884 2.318 2.884 2.3Zm0 11.266-.005.002-9.975-7.87L0 12.088l.194.156 11.803 9.308 7.463-5.885L24 12.085l-2.023-1.624Z"/>',
    zhihu: '<path d="M5.721 0C2.251 0 0 2.25 0 5.719V18.28C0 21.751 2.252 24 5.721 24h12.56C21.751 24 24 21.75 24 18.281V5.72C24 2.249 21.75 0 18.281 0zm1.964 4.078c-.271.73-.5 1.434-.68 2.11h4.587c.545-.006.445 1.168.445 1.171H9.384a58.104 58.104 0 01-.112 3.797h2.712c.388.023.393 1.251.393 1.266H9.183a9.223 9.223 0 01-.408 2.102l.757-.604c.452.456 1.512 1.712 1.906 2.177.473.681.063 2.081.063 2.081l-2.794-3.382c-.653 2.518-1.845 3.607-1.845 3.607-.523.468-1.58.82-2.64.516 2.218-1.73 3.44-3.917 3.667-6.497H4.491c0-.015.197-1.243.806-1.266h2.71c.024-.32.086-3.254.086-3.797H6.598c-.136.406-.158.447-.268.753-.594 1.095-1.603 1.122-1.907 1.155.906-1.821 1.416-3.6 1.591-4.064.425-1.124 1.671-1.125 1.671-1.125zM13.078 6h6.377v11.33h-2.573l-2.184 1.373-.401-1.373h-1.219zm1.313 1.219v8.86h.623l.263.937 1.455-.938h1.456v-8.86z"/>',
    bilibili: '<path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373Z"/>',
    gitee: '<path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296Z"/>',
    arrow: '<path d="M4 12h16m0 0-6-6m6 6-6 6"/>',
  };
  window.ICONS = ICONS;
  const svg = (name, cls) =>
    '<svg class="' + (cls || 'icon') + '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    (ICONS[name] || ICONS.link) + '</svg>';

  /* ---------- 导航栏 ---------- */
  function buildNav() {
    const nav = document.querySelector('.navbar');
    if (!nav) return;
    const links = [
      { href: 'index.html', label: '首页', match: 'index' },
      { href: 'articles.html', label: '文章', match: 'articles' },
      { href: 'index.html#about', label: '关于', match: 'about' },
    ];
    const current = location.pathname.split('/').pop() || 'index.html';
    const navLinks = links.map((l) => {
      const active = l.match === 'about'
        ? (current === 'index.html' && location.hash === '#about')
        : current === l.href;
      return '<a class="nav-link' + (active ? ' active' : '') + '" href="' + l.href + '">' + l.label + '</a>';
    }).join('');
    nav.innerHTML =
      '<div class="nav-inner container">' +
      '<a class="nav-logo" href="index.html"><span class="nav-logo-mark">' + escapeHtml(S.logo || 'Y') + '</span></a>' +
      '<nav class="nav-links">' + navLinks + '</nav>' +
      '<button class="nav-burger" aria-label="菜单"><span></span><span></span><span></span></button>' +
      '</div>';
    const burger = nav.querySelector('.nav-burger');
    const linksEl = nav.querySelector('.nav-links');
    burger.addEventListener('click', () => {
      linksEl.classList.toggle('open');
      burger.classList.toggle('open');
    });
    linksEl.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => { linksEl.classList.remove('open'); burger.classList.remove('open'); }));

    /* 滚动状态 */
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 页脚 ---------- */
  function buildFooter() {
    const foot = document.querySelector('.footer');
    if (!foot) return;
    const socials = (S.socials || []).filter((s) => s.url).map((s) =>
      '<a class="footer-social" href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener" title="' +
      escapeHtml(s.name) + '">' + svg(s.icon || 'link') + '<span>' + escapeHtml(s.name) + '</span></a>').join('');
    foot.innerHTML =
      '<div class="container footer-grid">' +
      '<div class="footer-brand">' +
      '<span class="footer-logo">' + escapeHtml(S.logo || '') + '</span>' +
      '<p>' + escapeHtml(S.tagline || '') + '</p>' +
      '</div>' +
      '<div class="footer-socials">' + socials + '</div>' +
      '<p class="footer-copy">' + escapeHtml(S.footer || '') +
      (S.icp ? ' · <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">' + escapeHtml(S.icp) + '</a>' : '') +
      '</p></div>';
  }

  /* ---------- 首页文案填充 ---------- */
  function fillHero() {
    const name = document.querySelector('[data-hero-name]');
    if (name) name.textContent = S.name || '';
    const badge = document.querySelector('[data-hero-badge]');
    if (badge) badge.textContent = S.badge || '';
    const tag = document.querySelector('[data-hero-tagline]');
    if (tag) tag.textContent = S.tagline || '';
    if (name) { // 只在首页设置站点标题
      document.title = (S.name ? S.name + ' · ' : '') + (S.tagline || '个人博客');
    }
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', S.description || '');
    const kw = document.querySelector('meta[name="keywords"]');
    if (kw) kw.setAttribute('content', (S.keywords || []).join(','));
  }

  /* ---------- Hero 角色（静态展示） ---------- */
  function initHeroRoles() {
    const el = document.querySelector('[data-hero-roles]');
    if (!el) return;
    el.textContent = '我是一名 ' + (S.roles || []).join(' · ');
  }

  /* ---------- 滚动显现（共享单个 IntersectionObserver，动态渲染后可反复调用） ---------- */
  let revealIO = null;
  function initReveal() {
    const els = document.querySelectorAll('.reveal:not([data-revealed])');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => { e.classList.add('visible'); e.dataset.revealed = '1'; });
      return;
    }
    if (!revealIO) {
      revealIO = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('visible');
            en.target.dataset.revealed = '1';
            revealIO.unobserve(en.target);
          }
        });
      }, { threshold: 0.12 });
    }
    els.forEach((e, idx) => { e.style.transitionDelay = (idx % 6) * 60 + 'ms'; revealIO.observe(e); });
  }

  /* ---------- 统计数字（进入视口后滚动到目标值） ---------- */
  function initCountUp() {
    const els = document.querySelectorAll('[data-count]:not([data-counted])');
    if (!els.length) return;
    const run = (el) => {
      if (el.dataset.counted) return;
      el.dataset.counted = '1';
      const target = Number(el.dataset.count || 0);
      const dur = 900;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString();
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    els.forEach((el) => {
      if (el.dataset.countObserved) return;
      el.dataset.countObserved = '1';
      io.observe(el);
    });
  }

  /* ---------- 技能条（进入视口后填充宽度） ---------- */
  let skillIO = null;
  function initSkills() {
    const bars = document.querySelectorAll('[data-skill-level]:not([data-skill-done])');
    if (!bars.length) return;
    const fill = (bar) => {
      const f = bar.querySelector('.skill-fill');
      if (f) f.style.width = (+bar.dataset.skillLevel || 0) + '%';
      bar.dataset.skillDone = '1';
    };
    if (!('IntersectionObserver' in window)) { bars.forEach(fill); return; }
    if (!skillIO) {
      skillIO = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { fill(en.target); skillIO.unobserve(en.target); } });
      }, { threshold: 0.4 });
    }
    bars.forEach((bar) => {
      if (bar.dataset.skillObserved) return;
      bar.dataset.skillObserved = '1';
      skillIO.observe(bar);
    });
  }

  /* ---------- 回到顶部 ---------- */
  function initTop() {
    const btn = document.querySelector('.to-top');
    if (!btn) return;
    const onScroll = () => btn.classList.toggle('show', window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------- 背景图片 ----------
   * 优先用 config.js 的 S.background；留空时向本地服务探测
   * assets/backgrounds/ 文件夹里的第一张图片（静态托管无此接口则保持默认背景） */
  function initBackground() {
    const orbs = document.querySelector('.bg-orbs');
    if (!orbs) return;
    const apply = (src) => {
      if (!src) return;
      document.documentElement.style.setProperty('--bg-img', 'url("' + src + '")');
      document.body.classList.add('has-bg-image');
    };
    if (S.background) { apply(S.background); return; }
    if (location.protocol === 'file:') return; // 直开模式无法探测文件夹
    fetch('api/backgrounds')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && Array.isArray(d.files) && d.files.length) apply(d.files[0]); })
      .catch(() => { /* 静默失败：继续用默认背景 */ });
  }

  /* ---------- Toast ---------- */
  function toast(msg, type) {
    let box = document.querySelector('.toast-box');
    if (!box) { box = document.createElement('div'); box.className = 'toast-box'; document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast toast-' + (type || 'info');
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3100);
  }
  window.toast = toast;

  /* ---------- 工具 ---------- */
  const escapeHtml = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  window.esc = escapeHtml;

  const fmtDate = (d) => {
    const dt = new Date(d);
    if (isNaN(dt)) return String(d);
    return dt.getFullYear() + ' 年 ' + (dt.getMonth() + 1) + ' 月 ' + dt.getDate() + ' 日';
  };
  window.fmtDate = fmtDate;

  /* 是否运行在本地服务（评论/后台等依赖 Node 的功能只在本地可用） */
  const isLocalServer = () => {
    const host = location.hostname || '';
    return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '';
  };
  window.isLocalServer = isLocalServer;

  /* ---------- 文章封面渐变 ---------- */
  const COVERS = [
    'linear-gradient(135deg,#c7d2fe 0%,#e9d5ff 55%,#fbcfe8 100%)',
    'linear-gradient(135deg,#bae6fd 0%,#c7d2fe 55%,#ddd6fe 100%)',
    'linear-gradient(135deg,#fde68a 0%,#fbcfe8 55%,#fecdd3 100%)',
    'linear-gradient(135deg,#a7f3d0 0%,#a5f3fc 55%,#c7d2fe 100%)',
    'linear-gradient(135deg,#fed7aa 0%,#fbcfe8 55%,#e9d5ff 100%)',
    'linear-gradient(135deg,#fecdd3 0%,#fda4af 55%,#ddd6fe 100%)',
  ];
  const coverFor = (s) => {
    let h = 0;
    for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return COVERS[h % COVERS.length];
  };
  window.coverFor = coverFor;

  const coverIcon = (a) => (a.icon && String(a.icon).trim() ? a.icon.trim() : (a.title || '✦').slice(0, 1));
  window.coverIcon = coverIcon;

  /* ---------- 文章数据加载 ----------
   * 优先使用页面已加载的 index.bundle.js（同步、零网络请求）；
   * 仅当 bundle 缺失时兜底 fetch index.json（如未来不引入 bundle 的场景）。
   * 服务端重建索引时会同时写入 json 与 bundle，两者内容一致，所以直接读 bundle 即可。 */
  async function loadArticles() {
    if (window.ARTICLES_DATA && Array.isArray(window.ARTICLES_DATA.articles)) return window.ARTICLES_DATA;
    try {
      const res = await fetch('articles/index.json?t=' + Date.now());
      if (res.ok) return await res.json();
    } catch (e) { /* file:// 下 fetch 不可用，走兜底 */ }
    return { articles: [] };
  }
  window.loadArticles = loadArticles;

  /* ---------- 文章卡片 HTML ---------- */
  function postCard(a) {
    const tags = (a.tags || []).slice(0, 3).map((t) =>
      '<span class="chip chip-tag">' + esc(t) + '</span>').join('');
    return (
      '<article class="post-card reveal glass">' +
      '<a class="post-cover" style="background:' + coverFor(a.slug) + '" href="article.html?slug=' + encodeURIComponent(a.slug) + '">' +
      '<span class="post-cover-icon">' + esc(coverIcon(a)) + '</span>' +
      (a.featured ? '<span class="post-badge">⭐ 精选</span>' : '') +
      '</a>' +
      '<div class="post-body">' +
      '<div class="post-meta">' +
      '<span class="chip chip-date">' + svg('arrow', 'icon icon-xs') + esc(fmtDate(a.date)) + '</span>' +
      '<span class="post-readtime">☕ ' + (a.readingTime || 1) + ' 分钟</span>' +
      '<span class="post-readtime">💬 ' + (a.commentCount || 0) + '</span>' +
      '</div>' +
      '<h3 class="post-title"><a href="article.html?slug=' + encodeURIComponent(a.slug) + '">' + esc(a.title) + '</a></h3>' +
      '<p class="post-excerpt">' + esc(a.excerpt || '') + '</p>' +
      '<div class="post-foot">' + tags +
      '<a class="post-more" href="article.html?slug=' + encodeURIComponent(a.slug) + '">阅读全文 ' + svg('arrow', 'icon icon-xs') + '</a>' +
      '</div></div></article>'
    );
  }
  window.postCard = postCard;

  /* ---------- 初始化 ---------- */
  // 暴露给页面脚本复用（动态渲染后重新绑定显现 / 统计 / 技能条）
  window.initReveal = initReveal;
  window.initCountUp = initCountUp;
  window.initSkills = initSkills;

  document.addEventListener('DOMContentLoaded', () => {
    fillHero();
    buildNav();
    buildFooter();
    initHeroRoles();
    initReveal();
    initCountUp();
    initSkills();
    initTop();
    initBackground();
  });
})();
