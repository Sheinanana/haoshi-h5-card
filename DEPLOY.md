# 温州豪仕文具 H5 电子名片 - 部署上线

## 项目结构

```
h5-card/
├── index.html          # 名片页面（纯静态）
├── server.js           # Node.js 后端（接收留言、推送通知）
├── .env.example        # 环境变量模板
├── README.md           # 项目说明
├── data/
│   └── submissions.json # 留言数据存储
└── assets/
    ├── avatar.jpg           # 头像
    ├── wechat-official.png  # 公众号二维码
    ├── xiaohongshu.png      # 小红书二维码
    └── wechat-id.png        # 微信号二维码
```

## 部署方案对比

| 方案 | 费用 | 难度 | 推荐度 | 说明 |
|------|------|------|--------|------|
| **Vercel** | 免费 | 极低 | ⭐⭐⭐⭐⭐ | 静态页+Serverless，一键部署 |
| **Netlify** | 免费 | 极低 | ⭐⭐⭐⭐⭐ | 静态页+Functions，类似Vercel |
| **Cloudflare Pages** | 免费 | 低 | ⭐⭐⭐⭐ | 全球CDN，国内速度一般 |
| **GitHub Pages** | 免费 | 极低 | ⭐⭐⭐ | 纯静态，无后端 |
| **腾讯云云开发** | 免费额度 | 中 | ⭐⭐⭐⭐ | 微信生态原生支持 |
| **阿里云ECS/轻量** | 付费 | 中 | ⭐⭐⭐ | 完全自主控制 |
| **自有服务器** | 已付费 | 中 | ⭐⭐⭐ | 如果你有现成的 |

## 推荐方案：Vercel（免费+最简单）

### 步骤1：准备代码

```bash
# 1. 确保你在项目目录
cd h5-card

# 2. 初始化Git仓库（如果还没有）
git init
git add .
git commit -m "init h5 card"

# 3. 在GitHub创建仓库，然后推送
git remote add origin https://github.com/你的用户名/haoshi-h5-card.git
git branch -M main
git push -u origin main
```

### 步骤2：部署到Vercel

1. 访问 https://vercel.com
2. 用GitHub账号登录
3. 点击 "Add New Project"
4. 选择 `haoshi-h5-card` 仓库
5. 点击 "Deploy"
6. 等待1-2分钟，获得公网链接如 `https://haoshi-h5-card.vercel.app`

### 步骤3：配置环境变量（可选）

在Vercel Dashboard → Project Settings → Environment Variables 添加：

```
WECOM_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=你的机器人key
```

### 步骤4：更新前端API地址

部署后，修改 `index.html` 中的 `CONFIG.apiEndpoint`：

```javascript
const CONFIG = {
  // ...其他配置
  apiEndpoint: 'https://haoshi-h5-card.vercel.app/api/submit',  // 改为你的Vercel域名
};
```

然后重新提交代码，Vercel会自动重新部署。

## 备选方案：Netlify

步骤类似：
1. 访问 https://netlify.com
2. 用GitHub登录
3. "Add new site" → "Import an existing project"
4. 选择仓库，点击 "Deploy site"

## 纯静态方案（无后端）

如果你只需要展示名片，不需要收集客户手机号：

1. 把 `index.html` 和 `assets/` 文件夹打包
2. 上传到任何静态托管：GitHub Pages / 腾讯云COS / 阿里云OSS
3. 获得公网链接即可

> ⚠️ 纯静态方案无法收集客户留言，只能展示。

## 部署后的检查清单

- [ ] 访问公网链接，页面正常显示
- [ ] 头像、二维码图片正常加载
- [ ] 点击"一键拨号"能唤起拨号
- [ ] 点击"复制微信号"提示成功
- [ ] 点击"导航到公司"跳转地图
- [ ] 填写手机号提交，后端收到数据
- [ ] 企业微信群收到通知（如果配置了webhook）

## 域名绑定（可选）

Vercel/Netlify都支持自定义域名：
1. 在Dashboard → Domains 添加你的域名
2. 在域名DNS添加CNAME记录指向平台提供的地址
3. 等待DNS生效（通常几分钟到几小时）

## 需要帮助？

告诉我你选择的方案，我可以给出更详细的步骤。
