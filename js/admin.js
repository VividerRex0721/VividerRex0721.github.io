/* ============================================================
 * js/admin.js —— 写作后台：文章管理 + Markdown 编辑器
 * 保存依赖本地服务 tools/serve.mjs 的 POST /api/save
 * ============================================================ */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);

  const state = { articles: [], editingSlug: null };
  const isFile = location.protocol === 'file:';
  const TOKEN_KEY = 'dsh_admin_token';

  /* ---------- 密码门 ---------- */
  function gate() {
    const gateEl = $('adminGate');
    const appEl = $('adminApp');
    if (!gateEl || !appEl) return;
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) { gateEl.style.display = 'none'; appEl.style.display = ''; return; }
    appEl.style.display = 'none';
    gateEl.style.display = 'flex';

    const tryUnlock = () => {
      const pwd = $('gatePassword').value;
      const expect = (window.SITE && window.SITE.adminPassword) || '';
      if (pwd === expect && expect) {
        sessionStorage.setItem(TOKEN_KEY, pwd);
        gateEl.style.display = 'none';
        appEl.style.display = '';
        $('gateErr').textContent = '';
      } else {
        $('gateErr').textContent = '密码不对，再试试～';
        $('gatePassword').value = '';
        $('gatePassword').focus();
      }
    };
    $('gateBtn').addEventListener('click', tryUnlock);
    $('gatePassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryUnlock(); });
    $('gatePassword').focus();
  }

  const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || '';

  function today() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  /* ---------- 提示 ---------- */
  function hint() {
    const h = $('fileHint');
    if (!h) return;
    if (isFile) {
      h.classList.add('show');
      h.innerHTML = '<strong>⚠️ 当前是直接打开文件的方式，后台保存功能不可用。</strong><br>' +
        '请先启动本地服务：在项目目录运行 <code>node tools/serve.mjs</code>，' +
        '然后访问 <a href="http://localhost:4321/admin.html" style="color:#92400e;font-weight:600;">http://localhost:4321/admin.html</a> 即可在线发文。';
      return;
    }
    if (!window.isLocalServer()) {
      h.classList.add('show');
      h.innerHTML = '<strong>⚠️ 当前是线上部署，后台「保存 / 删除」不可用（依赖本地 Node 服务）。</strong><br>' +
        '本地写作：运行 <code>node tools/serve.mjs</code> 后访问 <a href="http://localhost:4321/admin.html" style="color:#92400e;font-weight:600;">http://localhost:4321/admin.html</a>；' +
        '线上发文：在 <code>articles/</code> 写好 <code>.md</code> 后，本地跑一次 <code>node tools/serve.mjs --build</code> 重建索引，再推送部署即可。';
    }
  }

  /* ---------- 列表 ---------- */
  function renderList() {
    const list = $('articleList');
    if (!list) return;
    $('listCount').textContent = '(' + state.articles.length + ')';
    if (!state.articles.length) {
      list.innerHTML = '<li style="cursor:default;color:var(--muted-2);">还没有文章，点右上角「新建文章」开始吧 🚀</li>';
      return;
    }
    list.innerHTML = state.articles.map((a) =>
      '<li data-slug="' + esc(a.slug) + '" class="' + (a.slug === state.editingSlug ? 'on' : '') + '">' +
      '<span class="t">' + esc(a.title) + (a.draft ? ' <span class="draft-tag">草稿</span>' : '') + '</span>' +
      '<button class="del" type="button" title="删除" data-del="' + esc(a.slug) + '">' +
      '<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>' +
      '</button></li>').join('');

    list.querySelectorAll('li[data-slug]').forEach((li) => {
      li.addEventListener('click', (e) => {
        if (e.target.closest('[data-del]')) return;
        loadIntoForm(state.articles.find((a) => a.slug === li.dataset.slug));
      });
    });
    list.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const slug = btn.dataset.del;
        const a = state.articles.find((x) => x.slug === slug);
        if (!confirm('确定删除《' + (a ? a.title : slug) + '》吗？此操作不可恢复。')) return;
        deleteArticle(slug);
      });
    });
  }

  /* ---------- 表单填充 ---------- */
  function loadIntoForm(a) {
    state.editingSlug = a.slug;
    $('fTitle').value = a.title || '';
    $('fSlug').value = a.slug || '';
    $('fDate').value = a.date || today();
    $('fTags').value = (a.tags || []).join(', ');
    $('fExcerpt').value = a.excerpt || '';
    $('fFeatured').checked = !!a.featured;
    $('fDraft').checked = !!a.draft;
    $('fContent').value = a.content || '';
    $('saveState').textContent = '正在编辑：' + a.slug;
    renderList();
    updatePreview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    state.editingSlug = null;
    $('fTitle').value = '';
    $('fSlug').value = '';
    $('fDate').value = today();
    $('fTags').value = '';
    $('fExcerpt').value = '';
    $('fFeatured').checked = false;
    $('fDraft').checked = false;
    $('fContent').value = '';
    $('saveState').textContent = '新文章';
    renderList();
    updatePreview();
  }

  /* ---------- 实时预览 ---------- */
  function updatePreview() {
    const box = $('previewBox');
    if (!box) return;
    const md = $('fContent').value.trim();
    box.innerHTML = md
      ? '<div class="prose">' + MD.parse(md) + '</div>'
      : '<p class="preview-empty">⬅ 在左侧写 Markdown，这里实时预览</p>';
  }

  /* ---------- 保存 / 删除 ---------- */
  async function api(path, payload) {
    const headers = { 'Content-Type': 'application/json' };
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) headers['x-admin-token'] = token;
    const res = await fetch(path, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) { toast('密码校验失败，请重新进入后台', 'error'); sessionStorage.removeItem(TOKEN_KEY); location.reload(); }
    if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status));
    return data;
  }

  async function saveArticle(e) {
    e.preventDefault();
    const title = $('fTitle').value.trim();
    const content = $('fContent').value.trim();
    if (!title) { toast('请填写文章标题', 'error'); $('fTitle').focus(); return; }
    if (!content) { toast('正文不能为空', 'error'); $('fContent').focus(); return; }

    let slug = slugify($('fSlug').value.trim()) || slugify(title);
    if (!slug) slug = 'post-' + Date.now();

    const payload = {
      slug,
      title,
      date: $('fDate').value || today(),
      tags: $('fTags').value.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
      excerpt: $('fExcerpt').value.trim(),
      content,
      featured: $('fFeatured').checked,
      draft: $('fDraft').checked,
    };

    const btn = $('saveBtn');
    btn.disabled = true;
    btn.textContent = '保存中…';
    try {
      await api('api/save', payload);
      toast('已保存：' + title, 'success');
      await refreshList(payload.slug);
    } catch (err) {
      toast('保存失败：' + err.message, 'error');
      hint();
    } finally {
      btn.disabled = false;
      btn.textContent = '💾 保存文章';
    }
  }

  async function deleteArticle(slug) {
    try {
      await api('api/delete', { slug });
      toast('已删除：' + slug, 'success');
      if (state.editingSlug === slug) resetForm();
      await refreshList(null);
    } catch (err) {
      toast('删除失败：' + err.message, 'error');
      hint();
    }
  }

  async function refreshList(selectSlug) {
    try {
      const res = await fetch('articles/index.json?t=' + Date.now());
      const data = await res.json();
      state.articles = data.articles || [];
      renderList();
      if (selectSlug) {
        const a = state.articles.find((x) => x.slug === selectSlug);
        if (a) loadIntoForm(a);
      }
    } catch (err) {
      state.articles = (window.ARTICLES_DATA && window.ARTICLES_DATA.articles) || [];
      renderList();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    gate(); // 先过密码门，未解锁时编辑器不可见
    $('adminHint').textContent = isFile
      ? '直开模式下仅支持编辑预览；在线发文请启动本地服务（见下方提示）'
      : '保存后立即生效：写入 articles/*.md 并自动重建索引';
    $('fDate').value = today();
    $('editorForm').addEventListener('submit', saveArticle);
    $('newBtn').addEventListener('click', resetForm);
    $('fContent').addEventListener('input', updatePreview);
    $('fTitle').addEventListener('input', () => {
      if (!state.editingSlug && !$('fSlug').value.trim()) {
        $('fSlug').value = slugify($('fTitle').value);
      }
    });
    hint();
    refreshList(null);
  });
})();
