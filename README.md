# ✦ 个人博客 · 纯静态简洁版

一个 **零依赖** 的个人博客网站：没有框架、没有构建工具、不需要 `npm install`，一个文件夹就是一个网站。

- 🎨 **浅蓝 DeepSeek 风格主题**：浅蓝白底、品牌蓝强调色、衬线标题、DeepSeek 式上标签框与暖光背景（多角度柔光 + 光带 + 细网格纹理）
- 📝 **两种发文方式**：网页后台在线写作 / 直接把 `.md` 文件丢进 `articles/`
- 💬 **访客评论**：阅读页直接评论（支持**回复楼中楼、点赞、匿名发表**），数据存本地 `articles/comments/<slug>.json`，带频率限制与重复点赞防刷。用 `config.js` 里 `name` 字段的昵称评论会自动标记 **作者** 徽章
- 🔍 **完整阅读体验**：搜索、标签筛选、阅读目录、阅读进度条、上下篇导航
- 🚀 **极速部署**：纯静态文件，任何托管平台（GitHub Pages / Vercel / 服务器）都能跑

---

## 🚀 快速开始

### 方式一：双击打开（最简单）

直接双击 `index.html`，网站就能看。文章数据来自 `articles/index.bundle.js`。

> ⚠️ 直开模式下**后台发文不可用**（浏览器安全限制），请用方式二发文。

### 方式二：本地服务（推荐，功能完整）

```bash
node tools/serve.mjs
```

启动后访问：

| 页面 | 地址 |
| --- | --- |
| 网站首页 | http://localhost:4321/ |
| 文章列表 | http://localhost:4321/articles.html |
| 写作后台 | http://localhost:4321/admin.html（需密码，见下） |

指定端口：`node tools/serve.mjs --port 8080`

### 🔒 关于写作后台

- 导航栏**不显示**发文入口，访客看不到也进不来
- 直接访问 `admin.html` 需要输入密码（默认 `admin123`，在 `config.js` 的 `adminPassword` 修改，**上线前务必改掉**）
- 本地服务的保存/删除接口同样校验该密码，未带密码直接调 API 会被拒绝（401）

---

## 📝 如何发表文章

### 方式 A：网页后台发文 ✍️

1. 启动本地服务，打开 `http://localhost:4321/admin.html`
2. 点击「新建文章」，填写标题、标签，在正文里用 Markdown 写作（右侧实时预览）
3. 点击「保存」→ 自动写入 `articles/<别名>.md` 并更新索引，**立即生效**

支持的功能：
- 草稿模式（保存但不对外显示）
- 精选文章（显示在首页）
- 在线编辑 / 删除已有文章

### 方式 B：直接丢 Markdown 文件 📄

把写好的 `.md` 文件丢进 `articles/` 文件夹，文件头部按下面的格式写元信息：

```markdown
---
title: 文章标题
date: 2024-01-01
tags: [技术, 随笔]
excerpt: 可选，不写会自动截取正文前 120 字
icon: 🚀          # 可选，列表封面显示的大图标
cover: 图片地址    # 可选，文章顶部大图
featured: false    # true 则显示在首页精选
draft: false       # true 则为草稿，不对外显示
---

正文从这里开始，支持完整 Markdown 语法……
```

- 本地服务运行时：丢进去 **自动刷新**（自动重建索引）
- 直开模式：跑一次 `node tools/serve.mjs --build` 手动刷新

---

## 🎨 如何自定义

所有个性化配置都在 **`config.js`**，改一处全站生效：

```js
window.SITE = {
  name: '你的名字',        // 网站各处显示的名字
  logo: 'Y',              // 导航栏 Logo
  roles: ['写作者', ...],  // 首页展示的身份（静态展示）
  about: '...',           // 关于我（支持 Markdown）
  avatar: 'assets/avatar.svg', // 头像（放自己的照片到 assets/ 替换即可）
  background: '',         // 背景图：往 assets/backgrounds/ 放照片，留空自动用第一张
  skills: [...],          // 技能与熟练度
  socials: [...],         // 社交链接
  ...
};
```

其他可改：
- `styles.css` 顶部 `:root` 变量 —— 主题色、圆角、阴影全在这
- `assets/favicon.svg` —— 浏览器标签页图标

---

## 📁 目录结构

```
├── index.html          # 首页（Hero / 关于 / 精选）
├── articles.html       # 文章列表（搜索 + 标签）
├── article.html        # 文章阅读页（目录 + 进度条）
├── admin.html          # 写作后台
├── styles.css          # 全部样式（玻璃拟态主题）
├── config.js           # 站点配置（改这里！）
├── js/
│   ├── main.js         # 公共逻辑与动效
│   ├── markdown.js     # 零依赖 Markdown 解析器
│   ├── home.js         # 首页逻辑
│   ├── articles.js     # 列表页逻辑
│   ├── article.js      # 阅读页逻辑
│   └── admin.js        # 后台逻辑
├── articles/           # 文章目录（.md 文件 + 自动生成的索引）
├── assets/             # 头像、图标等资源
│   └── backgrounds/    # 背景照片：放进去刷新即全站生效（自动用第一张）
└── tools/
    └── serve.mjs       # 零依赖本地服务（预览/发文/自动重建）
```

---

## ☁️ 部署到线上（GitHub Pages 图文步骤）

纯静态网站，整个文件夹就能跑。以 **GitHub Pages** 为例：

**① 建仓库**：在 GitHub 新建仓库，两种方式任选：

| 仓库名 | 你的网址 |
| --- | --- |
| `你的用户名.github.io`（推荐，主站） | `https://你的用户名.github.io/` |
| 任意名字（如 `blog`，项目页） | `https://你的用户名.github.io/blog/` |

**② 本地准备**（发布前必做）：

```bash
node tools/serve.mjs --build   # 重建文章索引（articles/index.json + index.bundle.js + rss.xml）
```

然后把 `config.js` 里的 `baseUrl` 填成你的线上地址（影响 RSS 里的链接）：
`baseUrl: 'https://你的用户名.github.io'`（项目页则带上仓库名），
再跑一次 `--build` 重新生成 RSS。之后重新填回去或留空都不影响。

> 背景照片：线上没有 `/api/backgrounds` 自动探测接口，想让冰川图做背景，
> 请在 `config.js` 把 `background` 显式填成 `'assets/backgrounds/图片名.jpg'`。

**③ 推送**：

```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库.git
git push -u origin main
```

**④ 开启 Pages**：仓库 → **Settings → Pages** → Source 选 **Deploy from a branch** → 分支 `main`、目录 `/ (root)` → Save。等一两分钟，访问你的网址即可。

**⑤ 以后发新文章**：

```bash
# 本地写好 articles/xxx.md → 重建索引 → 推送
node tools/serve.mjs --build
git add . && git commit -m "新文章" && git push
```

> ⚠️ **线上能做什么、不能做什么**
> - ✅ 阅读、搜索、标签、目录、进度条、背景图（需显式配置）、RSS —— 全部正常
> - ✅ **线上评论**：已内置 **giscus**（GitHub Discussions 驱动、免费、无后端）。
>   启用只需三步（一次性）：
>   1. 仓库 **Settings → Features** 勾选 **Discussions**
>   2. 安装 giscus App：<https://github.com/apps/giscus>（选择你的仓库）
>   3. 打开 <https://giscus.app> 选仓库与分类，把生成的 `categoryId` 填进 `config.js` 的 `giscus.categoryId`
>   填好后重新构建推送即生效；本地开发仍用内置评论（点赞/回复/匿名）
> - ❌ **内置评论的后端（点赞/回复/匿名）、后台在线写作** —— 依赖本地 Node 服务，
>   线上自动降级为提示。发文请走「本地写 md → `--build` → 推送」
> - `.nojekyll` 文件已内置，GitHub Pages 会原样托管 md 文件，不会被 Jekyll 干扰

**Vercel / Netlify**：拖拽整个文件夹即可，注意同步设置 `baseUrl` 后再跑一次 `--build`。
**自己的服务器**：Nginx 指向项目目录即可。

> 部署后记得先把 `config.js` 换成你的真实信息，删掉示例文章。

---

## 🧰 支持的 Markdown 语法

| 语法 | 效果 |
| --- | --- |
| `# 标题` | 自动生成目录 |
| `**加粗**` `*斜体*` `~~删除~~` `==高亮==` | 文字强调 |
| `` `行内代码` `` | 代码样式 |
| ```` ```python ```` | 代码块（语法高亮类名） |
| `- [x] 任务` | 任务清单 |
| `> 引用` | 引用块 |
| `\| 表 \| 格 \|` | 表格 |
| `---` | 分割线 |
| `[文字](链接)` / `![](图片)` | 链接与图片 |

---

## 🛠️ 常见问题

**Q：双击 index.html 打不开图片/样式？**
正常，直开模式功能受限。建议用 `node tools/serve.mjs`。

**Q：后台保存失败？**
确认是通过 `http://localhost:4321` 访问的后台，而不是直接双击 admin.html。

**Q：丢进 articles 文件夹的文章没出现？**
本地服务运行时是自动的；否则手动执行 `node tools/serve.mjs --build`。

---

用 ❤️ 与 ☕ 制作 · 祝写作愉快 ✨
