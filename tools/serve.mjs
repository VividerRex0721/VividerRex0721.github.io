/* ============================================================
 * tools/serve.mjs —— 零依赖本地服务（仅用 Node 内置模块，无需 npm install）
 *
 * 用法：
 *   node tools/serve.mjs            启动服务（http://localhost:4321）
 *   node tools/serve.mjs --build    只重建文章索引后退出
 *   node tools/serve.mjs --port 8080 指定端口
 *
 * 功能：
 *   1. 静态文件服务（双击页面不可用的 fetch 在这里可用）
 *   2. 后台发文：POST /api/save  → 写入 articles/<slug>.md 并重建索引
 *   3. 删除文章：POST /api/delete → 删除 md 文件并重建索引
 *   4. 监听 articles/ 文件夹，扔进 .md 文件自动重建索引
 * ============================================================ */
import { createServer } from 'node:http';
import { readFile, writeFile, readdir, unlink, stat, mkdir } from 'node:fs/promises';
import { readFileSync, watch as watchDir } from 'node:fs';
import { join, resolve, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const ART_DIR = join(ROOT, 'articles');
const INDEX_JSON = join(ART_DIR, 'index.json');
const INDEX_BUNDLE = join(ART_DIR, 'index.bundle.js');
const BG_DIR = join(ROOT, 'assets', 'backgrounds');

const PORT = Number(process.argv.find((a) => a.startsWith('--port='))?.split('=')[1] || process.env.PORT || 4321);
const BUILD_ONLY = process.argv.includes('--build');

/* ---------------- 文章索引构建 ---------------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2', '.xml': 'application/xml; charset=utf-8',
};

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: text.trim() };
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
    }
    data[key] = val;
  }
  return { data, body: src(m, text) };
  function src(m, t) { return t.slice(m[0].length).trim(); }
}

function stripMarkdown(md) {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`~_\-|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readingTime(md) {
  const cjk = (md.match(/[\u4e00-\u9fa5]/g) || []).length;
  const words = (md.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9_]+/g) || []).length;
  return Math.max(1, Math.ceil(cjk / 300 + words / 200));
}

function siteMeta() {
  // 轻量读取 config.js 里的站点名、描述与线上地址（拿不到就用默认值）
  try {
    const src = readFileSync(join(ROOT, 'config.js'), 'utf8');
    const name = (src.match(/name:\s*'([^']*)'/) || [])[1] || '个人博客';
    const desc = (src.match(/description:\s*'([^']*)'/) || [])[1] || '个人博客';
    const baseUrl = (src.match(/baseUrl:\s*'([^']*)'/) || [])[1] || '';
    return { name, desc, baseUrl };
  } catch { return { name: '个人博客', desc: '个人博客', baseUrl: '' }; }
}

async function buildRss(articles) {
  const { name, desc, baseUrl } = siteMeta();
  /* 线上地址：config.js 的 baseUrl 优先，其次环境变量 BASE_URL，最后本地默认 */
  const siteUrl = baseUrl || process.env.BASE_URL || 'http://localhost:' + PORT;
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const pub = (d) => { const t = new Date(d); return isNaN(t) ? new Date().toUTCString() : t.toUTCString(); };
  const items = articles.filter((a) => !a.draft).map((a) =>
    '    <item>\n' +
    '      <title>' + esc(a.title) + '</title>\n' +
    '      <link>' + siteUrl + '/article.html?slug=' + a.slug + '</link>\n' +
    '      <guid>' + siteUrl + '/article.html?slug=' + a.slug + '</guid>\n' +
    '      <pubDate>' + pub(a.date) + '</pubDate>\n' +
    '      <description>' + esc(a.excerpt) + '</description>\n' +
    '    </item>').join('\n');
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0"><channel>\n' +
    '  <title>' + esc(name) + '</title>\n' +
    '  <link>' + siteUrl + '/</link>\n' +
    '  <description>' + esc(desc) + '</description>\n' +
    items + '\n</channel></rss>\n';
  await writeFile(join(ART_DIR, 'rss.xml'), xml, 'utf8');
}

async function buildIndex() {
  const files = (await readdir(ART_DIR)).filter((f) => f.endsWith('.md'));
  const counts = await commentCounts();
  const articles = [];
  for (const f of files) {
    const slug = f.replace(/\.md$/, '');
    const text = await readFile(join(ART_DIR, f), 'utf8');
    const { data, body } = parseFrontmatter(text);
    const excerpt = data.excerpt || stripMarkdown(body).slice(0, 120) + (stripMarkdown(body).length > 120 ? '…' : '');
    articles.push({
      slug,
      title: data.title || slug,
      date: String(data.date || ''),
      updated: data.updated ? String(data.updated) : '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      excerpt,
      cover: data.cover || '',
      icon: data.icon || '',
      featured: !!data.featured,
      draft: !!data.draft,
      readingTime: readingTime(body),
      commentCount: counts[slug] || 0,
      content: body,
    });
  }
  articles.sort((a, b) => {
    if (a.draft !== b.draft) return a.draft ? 1 : -1; // 草稿排最后
    return String(b.date).localeCompare(String(a.date));
  });

  // 内容无变化时跳过索引写入（避免 写入→监听→重建 死循环）
  let changed = true;
  try {
    const prev = JSON.parse(await readFile(INDEX_JSON, 'utf8'));
    changed = JSON.stringify(prev.articles || []) !== JSON.stringify(articles);
  } catch { /* 首次构建 */ }

  if (changed) {
    const payload = { updated: new Date().toISOString(), articles };
    const json = JSON.stringify(payload, null, 2);
    await writeFile(INDEX_JSON, json, 'utf8');
    await writeFile(INDEX_BUNDLE, 'window.ARTICLES_DATA = ' + JSON.stringify(payload) + ';\n', 'utf8');
  }
  await buildRss(articles); // 始终重建，站点名/描述等变化也能及时生效
  return articles.length;
}

/* ---------------- 保存 / 删除 ---------------- */
function fmValue(v) {
  if (Array.isArray(v)) return '[' + v.map((x) => `"${x}"`).join(', ') + ']';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return `"${String(v).replace(/"/g, '\\"')}"`;
}

async function saveArticle(payload) {
  const slug = String(payload.slug || '').toLowerCase().trim();
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) throw new Error('别名只能包含小写字母、数字和连字符');
  const title = String(payload.title || '').trim();
  if (!title) throw new Error('标题不能为空');
  const content = String(payload.content || '').trim();
  if (!content) throw new Error('正文不能为空');

  const file = join(ART_DIR, slug + '.md');
  let updated = '';
  try {
    const old = await readFile(file, 'utf8');
    const oldData = parseFrontmatter(old).data;
    // 已有文章且日期未变 → 记录更新日期
    if (String(oldData.date || '') === String(payload.date || '')) {
      updated = new Date().toISOString().slice(0, 10);
    }
  } catch { /* 新文章 */ }

  const tags = Array.isArray(payload.tags) ? payload.tags.map(String).filter(Boolean) : [];
  const fm = [
    '---',
    'title: ' + fmValue(title),
    'date: ' + fmValue(String(payload.date || new Date().toISOString().slice(0, 10))),
    ...(updated ? ['updated: ' + fmValue(updated)] : []),
    'tags: ' + fmValue(tags),
    ...(payload.excerpt ? ['excerpt: ' + fmValue(String(payload.excerpt))] : []),
    ...(payload.cover ? ['cover: ' + fmValue(String(payload.cover))] : []),
    ...(payload.icon ? ['icon: ' + fmValue(String(payload.icon))] : []),
    'featured: ' + (payload.featured ? 'true' : 'false'),
    'draft: ' + (payload.draft ? 'true' : 'false'),
    '---',
    '',
  ].join('\n');
  await writeFile(file, fm + content.trimEnd() + '\n', 'utf8');
  return { ok: true, slug };
}

async function deleteArticle(slug) {
  if (!/^[a-z0-9-]{1,80}$/.test(String(slug))) throw new Error('非法的文章别名');
  const file = join(ART_DIR, String(slug) + '.md');
  await unlink(file);
  return { ok: true, slug };
}

/* ---------------- 后台访问口令（来自 config.js） ---------------- */
let adminToken = '';
try {
  const src = readFileSync(join(ROOT, 'config.js'), 'utf8');
  const m = src.match(/adminPassword:\s*'([^']*)'/);
  if (m && m[1]) adminToken = m[1];
} catch { /* 读取不到则不启用接口鉴权 */ }

function checkAuth(req, res) {
  if (!adminToken) return true; // 未设置密码则不校验
  const token = req.headers['x-admin-token'];
  if (token === adminToken) return true;
  send(res, 401, JSON.stringify({ error: '密码校验失败，请重新进入后台' }), 'application/json; charset=utf-8');
  return false;
}

/* ---------------- 评论：存储 + 防刷 ---------------- */
const COMMENT_DIR = join(ART_DIR, 'comments');
const commentRate = new Map(); // ip -> 上次提交时间
const likeSet = new Set();     // ip:slug:commentId -> 已点赞

function newCommentObj(payload) {
  const anonymous = !!payload.anonymous;
  const name = anonymous ? '匿名' : String(payload.name || '').trim().slice(0, 20);
  const content = String(payload.content || '').trim().slice(0, 500);
  if (!content) throw new Error('评论内容不能为空');
  if (content.length < 2) throw new Error('评论太短了');
  const authorName = siteMeta().name; // config.js 里的站长名字
  const isAuthor = !anonymous && !!authorName && name === authorName;
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    content,
    time: new Date().toISOString(),
    anonymous,
    isAuthor,
    likes: 0,
    replies: [],
  };
}

async function readCommentsFile(slug) {
  const file = join(COMMENT_DIR, slug + '.json');
  let data = { slug, comments: [] };
  try {
    data = JSON.parse((await readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
  } catch { /* 首次评论 */ }
  if (!Array.isArray(data.comments)) data.comments = [];
  return { file, data };
}

async function addComment(payload, ip) {
  const slug = String(payload.slug || '').replace(/[^a-z0-9-]/g, '').slice(0, 80);
  if (!slug) throw new Error('缺少文章标识');
  if (!payload.anonymous && !String(payload.name || '').trim()) throw new Error('请填写昵称');

  ip = ip || 'x';
  const now = Date.now();
  if (commentRate.get(ip) && now - commentRate.get(ip) < 30 * 1000) {
    throw new Error('评论太频繁了，请 30 秒后再试');
  }
  commentRate.set(ip, now);

  await mkdir(COMMENT_DIR, { recursive: true });
  const { file, data } = await readCommentsFile(slug);
  const comment = newCommentObj(payload);

  const replyTo = String(payload.replyTo || '');
  if (replyTo) {
    const parent = data.comments.find((c) => c.id === replyTo);
    if (!parent) throw new Error('要回复的评论不存在');
    if (!Array.isArray(parent.replies)) parent.replies = [];
    comment.replyToName = parent.name;
    parent.replies.push(comment);
  } else {
    data.comments.push(comment);
  }

  await writeFile(file, JSON.stringify(data, null, 2), 'utf8');
  return { ok: true };
}

async function likeComment(payload, ip) {
  const slug = String(payload.slug || '').replace(/[^a-z0-9-]/g, '').slice(0, 80);
  const commentId = String(payload.commentId || '');
  if (!slug || !commentId) throw new Error('参数不完整');

  const { file, data } = await readCommentsFile(slug);
  let target = null;
  for (const c of data.comments) {
    if (c.id === commentId) { target = c; break; }
    if (Array.isArray(c.replies)) {
      const r = c.replies.find((x) => x.id === commentId);
      if (r) { target = r; break; }
    }
  }
  if (!target) throw new Error('评论不存在');

  const key = (ip || 'x') + ':' + slug + ':' + commentId;
  if (!likeSet.has(key)) {
    likeSet.add(key);
    target.likes = (target.likes || 0) + 1;
    await writeFile(file, JSON.stringify(data, null, 2), 'utf8');
  }
  return { ok: true, likes: target.likes || 0 };
}

async function commentCounts() {
  const counts = {};
  try {
    for (const f of await readdir(COMMENT_DIR)) {
      if (!f.endsWith('.json')) continue;
      try {
        const data = JSON.parse(await readFile(join(COMMENT_DIR, f), 'utf8'));
        counts[f.replace(/\.json$/, '')] = Array.isArray(data.comments) ? data.comments.length : 0;
      } catch { /* 忽略损坏文件 */ }
    }
  } catch { /* 无评论目录 */ }
  return counts;
}

/* 评论变化后只刷新受影响文章的评论数，避免每次评论都全量重建索引 */
async function refreshCommentCount(slug) {
  try {
    const payload = JSON.parse(await readFile(INDEX_JSON, 'utf8'));
    const counts = await commentCounts();
    let changed = false;
    for (const a of payload.articles || []) {
      const c = counts[a.slug] || 0;
      if (a.commentCount !== c) { a.commentCount = c; changed = true; }
    }
    if (!changed) return;
    const json = JSON.stringify(payload, null, 2);
    await writeFile(INDEX_JSON, json, 'utf8');
    await writeFile(INDEX_BUNDLE, 'window.ARTICLES_DATA = ' + JSON.stringify(payload) + ';\n', 'utf8');
  } catch { /* 索引缺失时跳过，下一次构建会补齐 */ }
}

/* ---------------- HTTP 服务 ---------------- */
function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname; // 原始路径，静态文件分支再做安全解码

  /* API */
  if (req.method === 'POST' && pathname === '/api/save') {
    if (!checkAuth(req, res)) return;
    try {
      const chunks = [];
      let size = 0;
      for await (const c of req) { size += c.length; if (size > 8 * 1024 * 1024) throw new Error('内容超过 8MB 限制'); chunks.push(c); }
      const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const r = await saveArticle(payload);
      await buildIndex();
      send(res, 200, JSON.stringify(r), 'application/json; charset=utf-8');
    } catch (err) {
      send(res, 400, JSON.stringify({ error: err.message }), 'application/json; charset=utf-8');
    }
    return;
  }

  if (req.method === 'POST' && pathname === '/api/delete') {
    if (!checkAuth(req, res)) return;
    try {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      await deleteArticle(payload.slug);
      await buildIndex();
      send(res, 200, JSON.stringify({ ok: true }), 'application/json; charset=utf-8');
    } catch (err) {
      send(res, 400, JSON.stringify({ error: err.message }), 'application/json; charset=utf-8');
    }
    return;
  }

  /* 访客评论：无需登录，做基本校验与频率限制 */
  if (req.method === 'POST' && pathname === '/api/comment') {
    try {
      const chunks = [];
      let size = 0;
      for await (const c of req) { size += c.length; if (size > 64 * 1024) throw new Error('评论内容过长'); chunks.push(c); }
      const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      await addComment(payload, req.socket.remoteAddress);
      await refreshCommentCount(payload.slug); // 只更新受影响文章的评论数
      send(res, 200, JSON.stringify({ ok: true }), 'application/json; charset=utf-8');
    } catch (err) {
      send(res, 400, JSON.stringify({ error: err.message }), 'application/json; charset=utf-8');
    }
    return;
  }

  /* 点赞：同 IP 对同一评论只能点一次 */
  if (req.method === 'POST' && pathname === '/api/like') {
    try {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const r = await likeComment(payload, req.socket.remoteAddress);
      send(res, 200, JSON.stringify(r), 'application/json; charset=utf-8');
    } catch (err) {
      send(res, 400, JSON.stringify({ error: err.message }), 'application/json; charset=utf-8');
    }
    return;
  }

  /* 背景图片探测：列出 assets/backgrounds/ 里的图片（前端据此自动套用第一张） */
  if (req.method === 'GET' && pathname === '/api/backgrounds') {
    try {
      const files = (await readdir(BG_DIR))
        .filter((f) => /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(f))
        .sort();
      send(res, 200, JSON.stringify({ files: files.map((f) => 'assets/backgrounds/' + f) }), 'application/json; charset=utf-8');
    } catch {
      send(res, 200, JSON.stringify({ files: [] }), 'application/json; charset=utf-8');
    }
    return;
  }

  /* 静态文件 */
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'Method Not Allowed');
    return;
  }
  let filePath;
  try {
    filePath = decodeURIComponent(pathname);
  } catch {
    send(res, 400, 'Bad Request');
    return;
  }
  filePath = filePath === '/' ? '/index.html' : filePath;
  const full = resolve(join(ROOT, filePath));
  if (!full.startsWith(ROOT)) { send(res, 403, 'Forbidden'); return; }
  try {
    const info = await stat(full);
    if (info.isDirectory()) { send(res, 403, 'Forbidden'); return; }
    /* ETag：基于修改时间与大小，配合 Cache-Control: no-cache 每次轻量校验
     * 内容没变时返回 304（几乎零流量），文件一变立即拿到新内容，开发/部署都友好 */
    const etag = '"' + Math.round(info.mtimeMs).toString(36) + '-' + info.size.toString(36) + '"';
    const headers = { ETag: etag, 'Cache-Control': 'no-cache' };
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, headers);
      res.end();
      return;
    }
    const data = await readFile(full);
    const type = MIME[extname(full).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, Object.assign({ 'Content-Type': type }, headers));
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    send(res, 404, '404 Not Found');
  }
});

/* ---------------- 监听 & 启动 ---------------- */
async function start() {
  const count = await buildIndex();
  console.log(`✓ 已构建文章索引：${count} 篇文章 → articles/index.json`);
  if (BUILD_ONLY) return;

  try {
    let timer = null;
    const watcher = watchDir(ART_DIR, (eventType, filename) => {
      // 只对 .md 变化重建；null 文件名时靠内容比对兜底
      if (filename && !filename.endsWith('.md')) return;
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          const n = await buildIndex();
          console.log(`✓ 检测到文件变化，索引已重建（${n} 篇）`);
        } catch (err) { console.error('✗ 重建索引失败：', err.message); }
      }, 300);
    });
    watcher.on('error', (err) => console.warn('（监听出错：' + err.message + '）'));
  } catch (err) {
    console.warn('（无法监听文件夹：' + err.message + '）');
  }

  server.listen(PORT, () => {
    console.log('');
    console.log('  ✦  个人博客本地服务已启动  ✦');
    console.log('  ──────────────────────────────');
    console.log(`  网站首页   http://localhost:${PORT}/`);
    console.log(`  文章列表   http://localhost:${PORT}/articles.html`);
    console.log(`  写作后台   http://localhost:${PORT}/admin.html`);
    console.log('  ──────────────────────────────');
    console.log('  发文方式：后台网页保存 或 直接往 articles/ 丢 .md 文件');
    console.log('  停止服务：按 Ctrl+C');
    console.log('');
  });
}

start().catch((err) => {
  console.error('启动失败：', err);
  process.exit(1);
});
