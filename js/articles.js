/* ============================================================
 * js/articles.js —— 文章列表页：搜索 + 标签筛选
 * ============================================================ */
(function () {
  'use strict';
  const state = { all: [], keyword: '', tag: '全部' };

  function allTags() {
    const set = new Set();
    state.all.forEach((a) => (a.tags || []).forEach((t) => set.add(t)));
    return [...set].sort();
  }

  function renderFilters() {
    const box = document.getElementById('tagFilters');
    if (!box) return;
    const tags = ['全部', ...allTags()];
    box.innerHTML = tags.map((t) =>
      '<button class="tag-filter' + (t === state.tag ? ' on' : '') + '" data-tag="' + esc(t) + '">' +
      (t === '全部' ? '✦ ' : '#') + esc(t) + '</button>').join('');
    box.querySelectorAll('.tag-filter').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.tag = btn.dataset.tag;
        renderFilters();
        renderList();
      });
    });
  }

  function filtered() {
    const kw = state.keyword.trim().toLowerCase();
    return state.all.filter((a) => {
      if (state.tag !== '全部' && !(a.tags || []).includes(state.tag)) return false;
      if (!kw) return true;
      const hay = (a.title + ' ' + (a.excerpt || '') + ' ' + (a.tags || []).join(' ') + ' ' + (a.content || '')).toLowerCase();
      return hay.includes(kw);
    });
  }

  function renderList() {
    const grid = document.getElementById('postsGrid');
    const empty = document.getElementById('emptyTip');
    if (!grid) return;
    const list = filtered();
    empty.style.display = list.length ? 'none' : 'block';
    grid.innerHTML = list.map((a) => postCard(a)).join('');
    if (window.initReveal) window.initReveal();
  }

  function renderCount() {
    const sub = document.getElementById('listSub');
    if (sub) sub.textContent = '共 ' + state.all.length + ' 篇 · 全部可见，直接点击阅读';
  }

  document.addEventListener('DOMContentLoaded', () => {
    const S = window.SITE || {};
    if (S.name) document.title = '文章 · ' + S.name;
    const input = document.getElementById('searchInput');
    if (input) {
      let timer = null;
      let composing = false; // 中文输入法组词中不触发搜索
      const doSearch = () => {
        clearTimeout(timer);
        timer = setTimeout(() => { state.keyword = input.value; renderList(); }, 180);
      };
      input.addEventListener('compositionstart', () => { composing = true; });
      input.addEventListener('compositionend', () => { composing = false; doSearch(); });
      input.addEventListener('input', () => { if (!composing) doSearch(); });
    }
    loadArticles().then((data) => {
      state.all = (data.articles || []).filter((a) => !a.draft);
      renderCount();
      renderFilters();
      renderList();
    });
  });
})();
