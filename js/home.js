/* ============================================================
 * js/home.js —— 首页逻辑：关于区 / 精选文章
 * 依赖：config.js、main.js、articles/index.bundle.js
 * ============================================================ */
(function () {
  'use strict';
  const S = window.SITE || {};

  function buildHeroChips() {
    const box = document.getElementById('heroChips');
    if (!box) return;
    const items = (S.roles || []).slice(0, 6);
    box.innerHTML = items.map((r) =>
      '<span class="hero-chip">✦ ' + esc(r) + '</span>').join('');
  }

  function buildAbout() {
    const name = document.getElementById('aboutName');
    if (name) name.textContent = S.name || '';
    const role = document.getElementById('aboutRole');
    if (role) role.textContent = (S.roles || []).join(' · ');
    const av = document.getElementById('aboutAvatar');
    if (av && S.avatar) av.src = S.avatar;

    const text = document.getElementById('aboutText');
    if (text) text.innerHTML = MD.parse(S.about || '');

    const socials = document.getElementById('aboutSocials');
    if (socials) {
      socials.innerHTML = (S.socials || []).filter((s) => s.url || s.qr).map((s) => {
        if (s.qr) {
          return '<button class="social-pill" type="button" data-qr="' + esc(s.qr) + '" data-qr-name="' +
            esc(s.name) + '" title="' + esc(s.name) + '">' + svgIcon(s.icon || 'link') + esc(s.name) + '</button>';
        }
        return '<a class="social-pill" href="' + esc(s.url) + '" target="_blank" rel="noopener" title="' +
          esc(s.name) + '">' + svgIcon(s.icon || 'link') + esc(s.name) + '</a>';
      }).join('');
      socials.querySelectorAll('[data-qr]').forEach((b) =>
        b.addEventListener('click', () => { if (window.showQr) window.showQr(b.dataset.qr, b.dataset.qrName); }));
    }

    const stats = document.getElementById('statsRow');
    if (stats) {
      stats.innerHTML = (S.stats || []).map((st) =>
        '<div class="stat-card glass reveal">' +
        '<div class="stat-num" data-count="' + st.value + '">0</div>' +
        '<div class="stat-label">' + esc(st.label) + '</div></div>').join('');
      // 动态渲染后再触发数字滚动（main.js 的 initCountUp 在 DOMContentLoaded 时已跑过，当时元素还不存在）
      if (window.initCountUp) window.initCountUp();
      // 卡片自带 reveal 显现效果，需补一次绑定（新逻辑会跳过已显现元素）
      if (window.initReveal) window.initReveal();
    }

    const skills = document.getElementById('skillList');
    if (skills) {
      skills.innerHTML = (S.skills || []).map((sk) =>
        '<div class="skill-item" data-skill-level="' + sk.level + '">' +
        '<div class="skill-top"><span>' + esc(sk.name) + '</span><span>' + sk.level + '%</span></div>' +
        '<div class="skill-bar"><div class="skill-fill"></div></div></div>').join('');
      // 同理：技能条在动态渲染后需要重新绑定视口触发
      if (window.initSkills) window.initSkills();
    }

    const interests = document.getElementById('interestChips');
    if (interests) {
      interests.innerHTML = (S.interests || []).map((t) =>
        '<span class="interest-chip">' + esc(t) + '</span>').join('');
    }
  }

  function svgIcon(name) {
    const ic = window.ICONS || {};
    return '<svg class="icon icon-sm" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      (ic[name] || ic.link) + '</svg>';
  }

  /* ---------- 实时时钟（主页，每秒更新） ---------- */
  function initClock() {
    const el = document.getElementById('heroClockText');
    if (!el) return;
    const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => {
      const d = new Date();
      el.innerHTML =
        d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日' +
        ' · 星期' + WEEK[d.getDay()] +
        ' · <span class="hero-clock-time">' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + '</span>';
    };
    tick();
    setInterval(tick, 1000);
  }

  function buildPosts() {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;
    loadArticles().then((data) => {
      const all = (data.articles || []).filter((a) => !a.draft);
      const featured = all.filter((a) => a.featured);
      const picks = (featured.length ? featured : all).slice(0, 3);
      if (!picks.length) {
        grid.innerHTML = '<div class="empty-tip"><span class="big">✍️</span>还没有文章，去后台写下第一篇吧！</div>';
        return;
      }
      grid.innerHTML = picks.map((a) => postCard(a)).join('');
      // 动态渲染的卡片需要重新绑定显现效果
      if (window.initReveal) window.initReveal();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    buildHeroChips();
    buildAbout();
    buildPosts();
    initClock();
  });
})();
