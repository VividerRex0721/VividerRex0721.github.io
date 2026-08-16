/* ============================================================
 * js/article.js —— 文章阅读页：渲染正文 / 目录 / 进度条 / 上下篇
 * ============================================================ */
(function () {
  'use strict';

  function currentSlug() {
    return new URLSearchParams(location.search).get('slug') || '';
  }

  function buildHead(a) {
    const tags = (a.tags || []).map((t) => '<span class="chip chip-tag">#' + esc(t) + '</span>').join('');
    const cover = a.cover
      ? '<div class="article-cover"><img src="' + esc(a.cover) + '" alt="' + esc(a.title) + '" loading="lazy"></div>'
      : '';
    return (
      '<header class="article-head">' +
      '<div class="article-tags">' + tags + '</div>' +
      '<h1 class="article-title grad-text">' + esc(a.title) + '</h1>' +
      '<div class="article-meta">' +
      '<span>📅 ' + esc(fmtDate(a.date)) + '</span>' +
      '<span>☕ ' + (a.readingTime || 1) + ' 分钟</span>' +
      (a.updated ? '<span>🔄 更新于 ' + esc(fmtDate(a.updated)) + '</span>' : '') +
      '</div></header>' + cover
    );
  }

  function buildNav(all, a) {
    const idx = all.findIndex((x) => x.slug === a.slug);
    const prev = idx > 0 ? all[idx - 1] : null;
    const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
    const box = document.getElementById('articleNav');
    if (!box) return;
    box.innerHTML =
      (prev
        ? '<a href="article.html?slug=' + encodeURIComponent(prev.slug) + '">' +
          '<div class="nav-label">← 上一篇</div><div class="nav-title">' + esc(prev.title) + '</div></a>'
        : '<a style="visibility:hidden;"></a>') +
      (next
        ? '<a class="next" href="article.html?slug=' + encodeURIComponent(next.slug) + '">' +
          '<div class="nav-label">下一篇 →</div><div class="nav-title">' + esc(next.title) + '</div></a>'
        : '<a class="next" style="visibility:hidden;"></a>');
  }

  function buildToc(toc) {
    const box = document.getElementById('tocBox');
    const list = document.getElementById('tocList');
    if (!box || !list) return;
    if (!toc.length) return;
    list.innerHTML = toc.map((h) =>
      '<li><a class="lv-' + h.level + '" href="#' + h.id + '">' + esc(h.text) + '</a></li>').join('');
    box.style.display = 'block';
  }

  function initProgress() {
    const bar = document.getElementById('readProgress');
    if (!bar) return;
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ================= 评论（点赞 / 回复 / 匿名） ================= */
  const isFile = location.protocol === 'file:';
  const likedKey = (slug) => 'dsh_liked_' + slug;

  function relTime(iso) {
    const t = new Date(iso);
    if (isNaN(t)) return '';
    const diff = (Date.now() - t.getTime()) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
    if (diff < 86400 * 7) return Math.floor(diff / 86400) + ' 天前';
    return fmtDate(iso);
  }

  function avatarHtml(c) {
    const first = (s, fb) => window.firstChar ? window.firstChar(s, fb) : (String(s || fb)[0] || fb);
    if (c.anonymous) {
      return '<span class="comment-avatar is-anon">匿</span>';
    }
    if (c.isAuthor) {
      return '<span class="comment-avatar is-author">' +
        esc(first(c.name, '我').toUpperCase()) + '</span>';
    }
    const colors = ['#4d7cf6', '#7c5cf0', '#0ea5e9', '#6366f1', '#38bdf8', '#14b8a6'];
    let h = 0;
    for (const ch of String(c.name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const color = colors[h % colors.length];
    return '<span class="comment-avatar" style="background:' + color + '">' +
      esc(first(c.name, '友').toUpperCase()) + '</span>';
  }

  function likedIds(slug) {
    try { return JSON.parse(localStorage.getItem(likedKey(slug)) || '[]'); } catch { return []; }
  }

  function commentActions(slug, c) {
    const liked = likedIds(slug).includes(c.id);
    return (
      '<div class="comment-actions-row">' +
      '<button class="comment-like' + (liked ? ' on' : '') + '" data-like="' + c.id + '" type="button">' +
      '<span class="like-heart">❤</span><span class="like-num">' + (c.likes || 0) + '</span></button>' +
      '<button class="comment-reply-btn" data-reply="' + c.id + '" type="button">回复</button>' +
      '</div>'
    );
  }

  function commentItemHtml(slug, c, isReply) {
    return (
      '<div class="comment-item' + (isReply ? ' is-reply' : '') + '" id="c-' + c.id + '">' +
      avatarHtml(c) +
      '<div class="comment-body">' +
      '<div class="comment-meta">' +
      '<span class="comment-name">' + esc(c.name || '匿名') + '</span>' +
      (c.isAuthor ? '<span class="comment-author-tag">作者</span>' : '') +
      (c.replyToName ? '<span class="comment-reply-to">回复 @' + esc(c.replyToName) + '</span>' : '') +
      '<span class="comment-time">' + esc(relTime(c.time)) + '</span>' +
      '</div>' +
      '<p class="comment-text">' + esc(c.content) + '</p>' +
      commentActions(slug, c) +
      '</div>' +
      (Array.isArray(c.replies) && c.replies.length
        ? '<div class="comment-replies">' + c.replies.map((r) => commentItemHtml(slug, r, true)).join('') + '</div>'
        : '') +
      '</div>'
    );
  }

  function renderComments(slug, list) {
    const box = document.getElementById('commentsList');
    const count = document.getElementById('commentCount');
    if (!box) return;
    const arr = Array.isArray(list) ? list : [];
    if (count) count.textContent = arr.length + ' 条';
    if (!arr.length) {
      box.innerHTML = '<p class="comments-empty">还没有评论，来说两句吧～</p>';
      return;
    }
    box.innerHTML = arr.map((c) => commentItemHtml(slug, c, false)).join('');
    bindCommentEvents(slug);
  }

  function bindCommentEvents(slug) {
    /* 点赞 */
    document.querySelectorAll('.comment-like').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        if (btn.classList.contains('on')) { toast('你已经点过赞啦', 'info'); return; }
        const id = btn.dataset.like;
        fetch('api/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, commentId: id }),
        })
          .then(async (r) => {
            const data = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(data.error || '点赞失败');
            const liked = likedIds(slug);
            liked.push(id);
            localStorage.setItem(likedKey(slug), JSON.stringify(liked));
            btn.classList.add('on');
            btn.querySelector('.like-num').textContent = data.likes;
          })
          .catch((err) => toast(err.message || '点赞失败', 'error'));
      });
    });

    /* 回复 */
    document.querySelectorAll('.comment-reply-btn').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const parentId = btn.dataset.reply;
        const parentEl = document.getElementById('c-' + parentId);
        if (!parentEl) return;
        let form = parentEl.querySelector('.comment-reply-form');
        if (form) {
          form.classList.toggle('open');
          if (form.classList.contains('open')) form.querySelector('.rContent').focus();
          return;
        }
        form = document.createElement('form');
        form.className = 'comment-reply-form open';
        form.innerHTML =
          '<div class="comment-form-fields">' +
          '<input type="text" class="rName" placeholder="你的昵称" maxlength="20">' +
          '<label class="comment-anon-opt"><input type="checkbox" class="rAnon"> 匿名</label>' +
          '</div>' +
          '<textarea class="rContent" placeholder="回复…（最多 500 字）" maxlength="500" rows="2"></textarea>' +
          '<div class="comment-actions"><span class="rTip"></span>' +
          '<button class="btn btn-primary btn-sm" type="submit">回复</button></div>';
        const repliesBox = parentEl.querySelector('.comment-replies') ||
          (() => { const d = document.createElement('div'); d.className = 'comment-replies'; parentEl.appendChild(d); return d; })();
        repliesBox.appendChild(form);

        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const name = form.querySelector('.rName').value.trim();
          const content = form.querySelector('.rContent').value.trim();
          const anonymous = form.querySelector('.rAnon').checked;
          const tip = form.querySelector('.rTip');
          if (!anonymous && !name) { tip.textContent = '请填写昵称'; return; }
          if (!content) { tip.textContent = '内容不能为空'; return; }
          tip.textContent = '正在提交…';
          fetch('api/comment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, name, content, anonymous, replyTo: parentId }),
          })
            .then(async (r) => {
              const data = await r.json().catch(() => ({}));
              if (!r.ok) throw new Error(data.error || '回复失败');
              toast('回复成功 🎉', 'success');
              return fetch('articles/comments/' + encodeURIComponent(slug) + '.json?t=' + Date.now());
            })
            .then((r) => r.json())
            .then((data) => renderComments(slug, data.comments))
            .catch((err) => { tip.textContent = err.message || '回复失败'; });
        });
        form.querySelector('.rContent').focus();
      });
    });
  }

  /* ================= giscus 评论（线上部署用，GitHub Discussions 驱动） ================= */
  function initGiscus(section) {
    const g = (window.SITE && window.SITE.giscus) || {};
    if (!(g.enabled && g.repo && g.repoId && g.category && g.categoryId)) return false;
    section.innerHTML =
      '<div class="comments-head"><h3 class="comments-title">💬 评论</h3>' +
      '<span class="comments-count">GitHub Discussions</span></div>' +
      '<div class="giscus-wrap"></div>';
    const s = document.createElement('script');
    s.src = 'https://giscus.app/client.js';
    s.async = true;
    s.crossOrigin = 'anonymous';
    const attrs = {
      'data-repo': g.repo,
      'data-repo-id': g.repoId,
      'data-category': g.category,
      'data-category-id': g.categoryId,
      'data-mapping': g.mapping || 'pathname',
      'data-strict': g.strict || '0',
      'data-reactions-enabled': g.reactionsEnabled || '1',
      'data-emit-metadata': '0',
      'data-input-position': g.inputPosition || 'top',
      'data-theme': g.theme || 'light',
      'data-lang': g.lang || 'zh-CN',
      'data-loading': 'lazy',
    };
    for (const k in attrs) s.setAttribute(k, attrs[k]);
    section.querySelector('.giscus-wrap').appendChild(s);
    return true;
  }

  function initComments(slug) {
    const section = document.getElementById('commentsSection');
    const form = document.getElementById('commentForm');
    if (!form) return;

    /* file:// 下无法提交与读取评论，给出提示 */
    if (isFile) {
      form.innerHTML = '<p class="comments-empty" style="margin:0;">💡 评论功能需要本地服务：在项目目录运行 <code style="font-family:var(--mono);">node tools/serve.mjs</code> 后访问即可使用</p>';
      return;
    }

    /* 纯静态托管（如 GitHub Pages）：配置了 giscus 则用它，否则降级为只读提示 */
    if (!window.isLocalServer()) {
      if (initGiscus(section)) return;
      document.body.classList.add('no-comment-api');
      form.innerHTML = '<p class="comments-empty" style="margin:0;">💡 线上评论尚未配置：在 config.js 的 <code style="font-family:var(--mono);">giscus</code> 里填入 categoryId 即可启用（GitHub Discussions 驱动，无需后端）。</p>';
      fetch('articles/comments/' + encodeURIComponent(slug) + '.json?t=' + Date.now())
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => renderComments(slug, data && data.comments))
        .catch(() => renderComments(slug, []));
      return;
    }

    /* 本地服务：内置评论（含点赞/回复/匿名） */
    const tip = document.getElementById('commentTip');

    /* 匿名勾选时禁用昵称输入 */
    const cName = document.getElementById('cName');
    const cAnon = document.getElementById('cAnon');
    const syncAnon = () => {
      cName.disabled = cAnon.checked;
      cName.placeholder = cAnon.checked ? '将以匿名身份发表' : '你的昵称 *';
    };
    cAnon.addEventListener('change', syncAnon);
    syncAnon();

    /* 加载已有评论 */
    fetch('articles/comments/' + encodeURIComponent(slug) + '.json?t=' + Date.now())
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => renderComments(slug, data && data.comments))
      .catch(() => renderComments(slug, []));

    /* 主表单提交 */
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = cName.value.trim();
      const content = document.getElementById('cContent').value.trim();
      const anonymous = cAnon.checked;
      if (!anonymous && !name) { tip.textContent = '请先填写昵称'; return; }
      if (!content) { tip.textContent = '评论内容不能为空'; return; }
      tip.textContent = '正在提交…';
      fetch('api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, name, content, anonymous }),
      })
        .then(async (r) => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(data.error || '提交失败');
          cName.value = '';
          document.getElementById('cContent').value = '';
          tip.textContent = '';
          toast('评论发表成功 🎉', 'success');
          return fetch('articles/comments/' + encodeURIComponent(slug) + '.json?t=' + Date.now());
        })
        .then((r) => r.json())
        .then((data) => renderComments(slug, data.comments))
        .catch((err) => { tip.textContent = err.message || '提交失败'; });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initProgress();
    loadArticles().then((data) => {
      const all = (data.articles || []).filter((a) => !a.draft);
      const slug = currentSlug();
      const a = all.find((x) => x.slug === slug) || null;
      const body = document.getElementById('articleBody');
      if (!a) {
        body.innerHTML =
          '<div class="empty-tip" style="padding:60px 0;">' +
          '<span class="big">🕳️</span>没有找到这篇文章<br><br>' +
          '<a class="btn btn-primary" href="articles.html">回到文章列表</a></div>';
        return;
      }
      const { html, toc } = MD.parseWithToc(a.content || '');
      document.title = a.title + ' · ' + ((window.SITE && window.SITE.name) || '个人博客');
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', a.excerpt || a.title);
      // OG 分享标签（微信/QQ 转发文章时展示标题摘要）
      const og = (sel, content) => {
        const el = document.querySelector(sel);
        if (el && content) el.setAttribute('content', content);
      };
      og('meta[property="og:title"]', a.title);
      og('meta[property="og:description"]', a.excerpt || a.title);
      og('meta[property="og:url"]', ((window.SITE && window.SITE.baseUrl) || '') + '/article.html?slug=' + encodeURIComponent(a.slug));
      og('meta[property="og:image"]', a.cover || ((window.SITE && window.SITE.background) || ''));
      body.innerHTML =
        buildHead(a) +
        '<div class="prose">' + html + '</div>' +
        '<hr style="margin:2.6em auto;"><div style="text-align:center;color:var(--muted-2);font-size:13.5px;">— 全文完，感谢阅读 —</div>';
      buildToc(toc);
      buildNav(all, a);
      initComments(slug);
    });
  });
})();
