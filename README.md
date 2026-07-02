# H5 电子名片页

为「温州豪仕文具有限公司 · 洪金焦」生成的移动端名片展示页，支持一键拨号、复制微信号、导航到公司、扫码关注、客户留言收集。

## 页面功能

- 顶部名片：姓名 / 职位 / 公司
- 一键拨号：`13868501517`
- 复制微信号：`13868501517`（与手机号相同）
- 公众号类型：订阅号
- 通知方式：企业微信群机器人
- 导航到公司：默认使用高德地图搜索
- 扫码关注：微信公众号、小红书、微信号二维码
- 客户留言：收集姓名、手机号、留言，提交后持久化并通知

## 文件说明

```
h5-card/
├── index.html          # 名片页面（纯静态，可单独部署）
├── server.js           # Node.js 后端服务（无第三方依赖）
├── .env.example        # 环境变量示例
├── README.md           # 本说明
├── assets/             # 图片素材
│   ├── wechat-official.png   # 微信公众号二维码
│   ├── xiaohongshu.png       # 小红书二维码
│   └── wechat-id.png         # 微信号（图片）
└── data/               # 运行时生成的客户留言数据
    └── submissions.json
```

## 本地运行

### 方式一：前后端一体（推荐快速体验）

```bash
cd h5-card
node server.js
```

访问 http://localhost:3000

提交的客户留言会保存在 `data/submissions.json`，本地访问 http://localhost:3000/api/leads 可查看列表。

### 方式二：仅预览静态页面

用任意静态服务器打开 `index.html` 即可，例如：

```bash
cd h5-card
python3 -m http.server 8080
```

> 注意：静态预览时「提交留言」需要配置 `CONFIG.apiEndpoint` 指向实际后端地址。

## 部署方案

### 前端静态托管（免费）

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- 腾讯云 COS / 阿里云 OSS（按量计费，小流量几乎免费）

部署时只需上传 `index.html` + `assets/` 目录。

### 后端部署（免费方案）

| 平台 | 说明 |
|------|------|
| Render | 免费 Web Service，有休眠，适合低频访问 |
| Railway | 免费额度，休眠机制类似 Render |
| 阿里云函数计算 / 腾讯云 SCF | 按调用次数计费，小流量免费额度够用 |
| Cloudflare Workers | 完全免费额度高，但需改写成 Worker 脚本 |

将 `server.js` 部署到 Render/Railway 后，把前端 `CONFIG.apiEndpoint` 改为后端地址即可。

### 企业微信通知配置（推荐）

1. 在企业微信 PC 端打开任意内部群
2. 点击右上角「群机器人」->「添加机器人」
3. 复制 Webhook 地址
4. 在部署平台设置环境变量：
   - `NOTIFY_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxx`
   - `NOTIFY_WEBHOOK_TYPE=wecom`

客户提交留言后，机器人会自动在群里发通知。

## 微信公众号接入（订阅号）

1. 将页面部署到可访问的 HTTPS 域名（订阅号要求配置「JS 接口安全域名」时使用 HTTPS）
2. 登录微信公众平台：互动管理 -> 自定义菜单 / 自动回复
3. 菜单位置添加子菜单，类型选「跳转网页」，填入页面链接
4. 或者在「关键词回复」中设置自动回复，用户发关键词后返回链接
5. 订阅号不支持网页授权静默获取用户信息，但客户主动填写手机号不受影响

## 确认结论

| 项目 | 决定 |
|------|------|
| 复制微信号 | `13868501517`（与手机同号） |
| 公众号类型 | 订阅号 |
| 通知方式 | 企业微信群机器人 |
| 微信号文字 | 已配置 |
