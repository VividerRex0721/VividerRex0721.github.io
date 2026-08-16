/* ============================================================
 * js/markdown.js —— 零依赖 Markdown 解析器
 * 用法：
 *   const { data, body } = MD.extractFrontmatter(text)   // 解析文章头部
 *   MD.parse(md)           -> html 字符串
 *   MD.parseWithToc(md)    -> { html, toc: [{level,id,text}] }
 *   MD.readingTime(md)     -> 分钟数
 * ============================================================ */
(function () {
  'use strict';

  const escapeHtml = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* ---------- 行内解析 ---------- */
  function inline(text) {
    text = escapeHtml(text);
    const codes = [];
    text = text.replace(/`([^`\n]+)`/g, (m, c) => {
      codes.push('<code class="inline-code">' + c + '</code>');
      return '\u0000' + (codes.length - 1) + '\u0000';
    });
    text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
      (m, alt, src, title) =>
        '<img src="' + src + '" alt="' + alt + '" loading="lazy"' +
        (title ? ' title="' + title + '"' : '') + '>');
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
      (m, t, url, title) => {
        const safe = /^(https?:|mailto:|tel:|\/|#)/.test(url);
        return '<a href="' + url + '"' + (safe ? '' : ' rel="nofollow"') +
          (title ? ' title="' + title + '"' : '') + '>' + t + '</a>';
      });
    text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    text = text.replace(/==([^=\n]+)==/g, '<mark>$1</mark>'); // ==高亮==
    text = text.replace(/\u0000(\d+)\u0000/g, (m, i) => codes[+i]);
    return text;
  }

  /* ---------- 标题 id（用于目录） ---------- */
  const slugify = (text) => {
    const base = text.toLowerCase().trim()
      .replace(/[^\w\u4e00-\u9fa5-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return base || 'sec';
  };

  /* ---------- 块级解析 ---------- */
  function parseBlocks(md) {
    const lines = md.replace(/\r\n?/g, '\n').split('\n');
    const out = [];
    const toc = [];
    const slugUsed = {};
    let i = 0;

    const push = (html) => { if (html) out.push(html); };
    const nextSlug = (text) => {
      let id = slugify(text);
      if (slugUsed[id]) { let n = 2; while (slugUsed[id + '-' + n]) n++; id = id + '-' + n; }
      slugUsed[id] = true;
      return id;
    };

    const isList = (l) => /^\s*(?:[-*+]|\d+[.)])\s+/.test(l) || /^\s*[-*+]\s+\[[ xX]\]/.test(l);
    const isTask = (l) => /^\s*[-*+]\s+\[[ xX]\]\s*/.test(l);
    const listMarker = (l) => (isTask(l) ? 'task' : /^\s*\d+[.)]/.test(l) ? 'ol' : 'ul');
    const itemText = (l) => {
      if (isTask(l)) return l.replace(/^\s*[-*+]\s+\[[ xX]\]\s*/, (m) => m);
      return l.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '');
    };
    const isChecked = (l) => /^\s*[-*+]\s+\[[xX]\]/.test(l);

    let list = null; // {type, items:[{text, checked, html}]}
    let quote = [];
    let para = [];
    let table = null;
    let fence = null;

    const flushPara = () => { if (para.length) { push('<p>' + inline(para.join('<br>')) + '</p>'); para = []; } };
    const flushList = () => {
      if (!list) return;
      if (list.type === 'task') {
        push('<ul class="task-list">' + list.items.map((it) =>
          '<li class="task-item' + (it.checked ? ' done' : '') + '"><input type="checkbox" disabled' +
          (it.checked ? ' checked' : '') + '><span>' + it.html + '</span></li>').join('') + '</ul>');
      } else if (list.type === 'ol') {
        push('<ol>' + list.items.map((it) => '<li>' + it.html + '</li>').join('') + '</ol>');
      } else {
        push('<ul>' + list.items.map((it) => '<li>' + it.html + '</li>').join('') + '</ul>');
      }
      list = null;
    };
    const flushQuote = () => {
      if (quote.length) { push('<blockquote>' + inline(quote.join('<br>')) + '</blockquote>'); quote = []; }
    };
    const flushTable = () => {
      if (!table) return;
      const [head, rows] = table;
      push('<div class="table-wrap"><table><thead><tr>' +
        head.map((h) => '<th>' + inline(h.trim()) + '</th>').join('') +
        '</tr></thead><tbody>' +
        rows.map((r) => '<tr>' + r.map((c) => '<td>' + inline(c.trim()) + '</td>').join('') + '</tr>').join('') +
        '</tbody></table></div>');
      table = null;
    };

    const splitRow = (line) => {
      let l = line.trim();
      if (l.startsWith('|')) l = l.slice(1);
      if (l.endsWith('|')) l = l.slice(0, -1);
      return l.split('|').map((c) => c.trim());
    };

    while (i < lines.length) {
      let line = lines[i];

      /* 代码围栏（支持 3+ 反引号/波浪线，外层更长时支持嵌套演示） */
      const fenceMatch = line.match(/^(\s*)(`{3,}|~{3,})\s*([\w+-]*)/);
      if (fenceMatch) {
        flushPara(); flushList(); flushQuote(); flushTable();
        const marker = fenceMatch[2];
        const lang = fenceMatch[3];
        const buf = [];
        const closeRe = new RegExp('^\\s*' + marker[0] + '{' + marker.length + ',}\\s*$');
        i++;
        while (i < lines.length && !closeRe.test(lines[i])) { buf.push(lines[i]); i++; }
        i++; // 跳过闭合围栏
        push('<pre><code' + (lang ? ' class="language-' + lang + '"' : '') + '>' +
          escapeHtml(buf.join('\n')) + '</code></pre>');
        continue;
      }

      /* 标题 */
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        flushPara(); flushList(); flushQuote(); flushTable();
        const level = h[1].length;
        const id = nextSlug(h[2].replace(/[*_`~]/g, ''));
        toc.push({ level, id, text: h[2].replace(/[*_`~]/g, '').trim() });
        push('<h' + level + ' id="' + id + '">' + inline(h[2]) + '</h' + level + '>');
        i++;
        continue;
      }

      /* 表格 */
      if (line.includes('|') && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes('-')) {
        flushPara(); flushList(); flushQuote();
        const head = splitRow(line);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].includes('|')) { rows.push(splitRow(lines[i])); i++; }
        table = [head, rows];
        flushTable();
        continue;
      }

      /* 分隔线 */
      if (/^\s*([-*_])\1{2,}\s*$/.test(line) && !isList(line)) {
        flushPara(); flushList(); flushQuote(); flushTable();
        push('<hr>');
        i++;
        continue;
      }

      /* 引用 */
      if (/^\s*>\s?/.test(line)) {
        flushPara(); flushList(); flushTable();
        quote.push(line.replace(/^\s*>\s?/, ''));
        i++;
        continue;
      }

      /* 列表 */
      if (isList(line)) {
        flushPara(); flushQuote(); flushTable();
        const type = listMarker(line);
        if (!list || list.type !== type) { flushList(); list = { type, items: [] }; }
        const isT = isTask(line);
        const raw = isT ? line.replace(/^\s*[-*+]\s+\[[ xX]\]\s*/, '') : itemText(line);
        list.items.push({ checked: isT && isChecked(line), html: inline(raw) });
        i++;
        continue;
      }
      flushList();

      /* 空行 */
      if (!line.trim()) { flushPara(); flushQuote(); flushTable(); i++; continue; }

      /* 普通段落（支持行尾两个空格换行） */
      para.push(line.replace(/ {2}$/, ''));
      i++;
    }
    flushPara(); flushList(); flushQuote(); flushTable();
    return { html: out.join('\n'), toc };
  }

  /* ---------- Frontmatter ---------- */
  function extractFrontmatter(text) {
    const src = String(text || '').replace(/^\uFEFF/, '');
    const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!m) return { data: {}, body: src.trim() };
    const data = {};
    for (const line of m[1].split(/\r?\n/)) {
      if (!line.trim() || line.trim().startsWith('#')) continue;
      const idx = line.indexOf(':');
      if (idx < 0) continue;
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if (/^\[.*\]$/.test(val)) {
        val = val.slice(1, -1).split(',').map((v) => v.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      } else if (/^["'].*["']$/.test(val)) {
        val = val.slice(1, -1);
      } else if (val === 'true' || val === 'false') {
        val = val === 'true';
      } else if (!isNaN(+val)) {
        val = +val;
      }
      data[key] = val;
    }
    return { data, body: src.slice(m[0].length).trim() };
  }

  function readingTime(md) {
    const cjk = (md.match(/[\u4e00-\u9fa5]/g) || []).length;
    const words = (md.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9_]+/g) || []).length;
    return Math.max(1, Math.ceil(cjk / 300 + words / 200));
  }

  function excerpt(md, max = 120) {
    const plain = md
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[#>*`~_\-|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return plain.length > max ? plain.slice(0, max) + '…' : plain;
  }

  window.MD = {
    parse: (md) => parseBlocks(md).html,
    parseWithToc: (md) => parseBlocks(md),
    extractFrontmatter,
    readingTime,
    excerpt,
  };
})();
