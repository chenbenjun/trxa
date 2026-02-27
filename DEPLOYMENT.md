# 陶然小灶点餐系统 - PWA部署指南

## 概述

本系统已配置为PWA（Progressive Web App），可以安装到华为平板（鸿蒙OS 4.2）上离线使用，无需云端或本地服务器。

## 部署步骤

### 方案一：GitHub Pages部署（推荐）

#### 1. 准备工作

确保你已安装以下工具：
- Git
- Node.js (18+)

#### 2. 创建GitHub仓库

```bash
# 在GitHub上创建一个新仓库（例如：taoran-order-system）

# 克隆到本地
git clone https://github.com/你的用户名/taoran-order-system.git
cd taoran-order-system

# 复制构建产物
cp -r /workspace/projects/.next/.next/* ./
cp -r /workspace/projects/public ./
cp -r /workspace/projects/package.json ./
cp -r /workspace/projects/node_modules ./.next/static/ 2>/dev/null || true
```

#### 3. 配置GitHub Pages

在仓库设置中：
1. 进入 **Settings** -> **Pages**
2. 选择 **Source** 为 `GitHub Actions` 或 `Deploy from a branch`
3. 选择 `main` 分支和 `/(root)` 目录
4. 保存

#### 4. 创建workflows配置文件

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm run build

      - name: Export
        run: pnpm run export

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

#### 5. 提交并推送

```bash
git add .
git commit -m "Initial PWA deployment"
git push origin main
```

#### 6. 获取HTTPS链接

等待几分钟后，访问：
```
https://你的用户名.github.io/taoran-order-system/
```

GitHub Pages会自动提供HTTPS支持，这是鸿蒙OS 4.2识别PWA的必要条件。

---

### 方案二：Vercel部署（更简单）

#### 1. 创建Vercel账号

访问 [vercel.com](https://vercel.com) 并注册

#### 2. 导入项目

```bash
# 安装Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
cd /workspace/projects
vercel
```

按照提示操作，Vercel会自动提供HTTPS链接。

#### 3. 获取链接

部署完成后，你会得到类似这样的链接：
```
https://taoran-order-system.vercel.app
```

---

### 方案三：Netlify部署

#### 1. 登录Netlify

访问 [netlify.com](https://netlify.com) 并注册

#### 2. 拖拽部署

1. 将 `/workspace/projects` 文件夹拖拽到Netlify
2. Netlify会自动检测Next.js项目
3. 配置构建命令：`pnpm run build`
4. 配置发布目录：`.next`

#### 3. 获取HTTPS链接

Netlify会自动提供HTTPS支持。

---

## PWA验证

### 1. 检查manifest.json

访问 `https://你的域名/manifest.json`，应该能看到JSON配置。

### 2. 检查Service Worker

打开浏览器开发者工具（F12）：
- Application -> Service Workers
- 确认Service Worker已注册并运行

### 3. 测试离线功能

1. 在线访问应用
2. 断开网络
3. 刷新页面
4. 应该仍能正常访问（显示离线内容）

---

## 华为平板安装步骤

详细说明请参考 `README_HARMONY.md`

---

## 注意事项

### 1. HTTPS要求

**鸿蒙OS 4.2 要求PWA必须使用HTTPS链接才能识别和安装。**

GitHub Pages、Vercel、Netlify都提供免费HTTPS。

### 2. 域名配置（可选）

如果你有自己的域名：
1. 在域名DNS设置中添加CNAME记录
2. 指向你的GitHub Pages/Vercel/Netlify地址
3. 确保HTTPS证书自动更新

### 3. 图片API路由

本系统使用了以下API路由，部署后需要确保这些路由正常工作：
- `/api/dish-image` - 菜品图片服务
- `/api/convert-images` - 图片转换
- `/api/print` - 打印服务
- `/api/upload-image` - 图片上传

### 4. 数据存储

PWA使用localStorage存储数据，包括：
- 菜品列表
- 订单记录
- 购物车
- 自定义设置

这些数据都保存在平板本地，**不会同步到云端**。

---

## 更新部署

当你需要更新应用时：

```bash
# 1. 修改代码
cd /workspace/projects

# 2. 重新构建
pnpm run build

# 3. 提交到Git
git add .
git commit -m "Update features"
git push origin main

# 4. 等待自动部署完成（GitHub Pages/Vercel/Netlify会自动部署）

# 5. 在平板上刷新页面，Service Worker会自动更新
```

---

## 故障排除

### Service Worker无法注册

检查：
1. 是否使用HTTPS
2. `public/` 目录下是否有 `sw.js` 文件
3. `manifest.json` 是否在 `public/` 目录

### 无法安装到主屏幕

检查：
1. manifest.json 配置是否正确
2. 图标文件是否存在（icon-192.png, icon-512.png）
3. 是否使用HTTPS
4. 浏览器是否支持PWA（推荐使用华为浏览器或Chrome）

### 离线无法使用

检查：
1. Service Worker是否正确注册
2. 是否首次在在线环境下访问过（需要缓存资源）
3. 检查浏览器控制台是否有错误

---

## 技术支持

如遇到问题，请检查：
1. 浏览器控制台（F12 -> Console）
2. Service Worker状态（F12 -> Application -> Service Workers）
3. 网络请求（F12 -> Network）

---

## 构建产物说明

构建完成后，主要文件位于：
- `.next/` - Next.js构建产物
- `public/` - 静态资源（图标、manifest.json等）
- `public/sw.js` - Service Worker（自动生成）

部署时需要上传整个项目文件夹，或使用构建工具导出静态文件。

---

**祝部署顺利！**
