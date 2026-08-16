# 📱 二维码图片文件夹

这里放社交账号的**二维码图片**，点击网站上的「抖音 / QQ」按钮会弹出显示。

## 怎么用

1. 在抖音 App / QQ 里生成你的账号二维码，截图保存为图片
2. 把图片放进本文件夹，**文件名用英文**，例如 `douyin.png`、`qq.png`
3. 在 `config.js` 的 `socials` 里把对应项的 `qr` 指向这个文件：

```js
{ name: '抖音', icon: 'douyin', qr: 'assets/qrcodes/douyin.png' },
{ name: 'QQ',   icon: 'qq',     qr: 'assets/qrcodes/qq.png' },
```

- 支持格式：`png / jpg / jpeg / gif / webp`
- 建议图片正方形、**400×400 以上**，展示更清晰
- 图片没放进来时，弹窗会提示"二维码图片还没放进来"，不影响其他功能
