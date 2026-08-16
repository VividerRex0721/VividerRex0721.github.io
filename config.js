/* ============================================================
 * 站点全局配置 —— 想改哪里改哪里，整个网站都会跟着变
 * 头像：把图片放到 assets/ 里，然后改 avatar 路径即可
 * ============================================================ */
window.SITE = {
  /* ---------- 基本信息 ---------- */
  name: 'Noctis',                        // 你的名字 / 昵称（评论区用它评论会自动标记「作者」）
  logo: 'N',                             // 导航栏 Logo 显示的文字
  roles: ['写作者', '前端开发者', '咖啡爱好者'], // 首页展示的身份（静态展示）
  badge: '欢迎来到我的小站',                    // 首页顶部「上标签框」文案（DeepSeek 式胶囊标签）
  tagline: '把想法写成文字，把代码做成作品，把生活过成喜欢的样子。',
  description: '一个收集灵感、记录成长、分享代码与生活的个人网站。',
  keywords: ['博客', '个人网站', '技术', '生活', '随笔'],

  /* ---------- 写作后台 ----------
   * adminPassword：访问 admin.html 的密码（别人不知道地址也进不来）
   * 默认 admin123，上线前务必改成你自己的！保存接口也会校验同一密码
   */
  adminPassword: 'admin123',

  /* ---------- 关于我 ---------- */
  avatar: 'assets/avatar.svg',
  about: [
    '你好呀，欢迎来到我的小站 👋',
    '我在这里记录日常思考、技术踩坑与生活碎片。喜欢把复杂的事情讲清楚，也享受把想法变成代码的瞬间。',
    '这个网站是纯静态的——没有框架、没有构建工具，只有 HTML、CSS 和一点点 JavaScript，双击 index.html 就能打开。',
  ].join('\n\n'),
  stats: [
    { label: '文章', value: 3 },
    { label: '项目', value: 12 },
    { label: '读者', value: 2333 },
  ],
  skills: [
    { name: '前端开发', level: 85 },
    { name: '写作表达', level: 90 },
    { name: '产品设计', level: 72 },
    { name: '摄影', level: 60 },
  ],
  interests: ['写作', '代码', '咖啡', '摄影', '旅行', '阅读', '开源', '音乐'],

  /* ---------- 社交链接（icon 支持: github / mail / rss / x / link / juejin / zhihu / bilibili / gitee / douyin / qq） ----------
   * url：普通跳转链接；qr：点击弹窗显示二维码（图片放 assets/qrcodes/ 文件夹）
   * url / qr 都留空则不显示
   */
  socials: [
    { name: 'GitHub', icon: 'github', url: 'https://github.com/VividerRex0721' },
    { name: '哔哩哔哩', icon: 'bilibili', url: 'https://space.bilibili.com/520552483' },
    { name: '抖音', icon: 'douyin', qr: 'assets/qrcodes/douyin.png' }, // 点开弹二维码；图片放 assets/qrcodes/
    { name: 'QQ', icon: 'qq', qr: 'assets/qrcodes/qq.png' },          // 点开弹二维码；图片放 assets/qrcodes/
    { name: 'X', icon: 'x', url: 'https://x.com/JingyuWang76858' },
    { name: '掘金', icon: 'juejin', url: '' },        // 技术文章：https://juejin.cn/user/你的ID
    { name: 'Gitee', icon: 'gitee', url: '' },        // 码云：https://gitee.com/你的ID
  ],

  /* ---------- 部署 ----------
   * baseUrl：部署到 GitHub Pages 等线上地址后填这里（影响 RSS 里的文章链接）
   * 例：'https://你的用户名.github.io' 或 'https://你的用户名.github.io/blog'
   * 留空则本地构建时用 http://localhost:4321
   */
  baseUrl: 'https://VividerRex0721.github.io',

  /* ---------- 背景图片 ----------
   * 把照片放进 assets/backgrounds/ 文件夹，再在这里填路径即可全站生效
   * 留空 '' 时：本地服务会自动使用该文件夹里的第一张图片；直开模式用默认渐变背景
   * 提示：背景图建议压到 1680px 宽、300KB 左右，加载更快（可用工具压缩后放入）
   * 例：background: 'assets/backgrounds/my-photo.jpg'
   */
  background: 'assets/backgrounds/glacier.jpg',

  /* ---------- giscus 评论（线上部署用，GitHub Discussions 驱动，无需后端） ----------
   * 本地开发时仍用内置评论；线上访问自动切换为 giscus。
   * 启用步骤（只需做一次）：
   *   1. 仓库 Settings → Features 勾选 Discussions
   *   2. 安装 giscus App：https://github.com/apps/giscus（选这个仓库）
   *   3. 打开 https://giscus.app → 选仓库与分类 → 把生成的 categoryId 填到下面（repoId 已填好）
   * 填好 categoryId 后重新构建并推送即可生效。
   */
  giscus: {
    enabled: true,
    repo: 'VividerRex0721/VividerRex0721.github.io',
    repoId: 'R_kgDOJ91eQw',
    category: 'General',
    categoryId: 'DIC_kwDOJ91eQ84DDeZA',
    mapping: 'pathname',
    reactionsEnabled: '1',
    inputPosition: 'top',
    lang: 'zh-CN',
  },

  /* ---------- 页脚 ---------- */
  footer: '用 ❤️ 与 ☕ 制作 · 纯静态零依赖',
  icp: '', // 备案号，可留空
};
