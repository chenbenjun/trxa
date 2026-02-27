# 陶然小灶点餐系统 - GitHub Pages 部署指南

## 📱 PWA版本已就绪！

您的点餐系统已成功打包为PWA版本，包含完整的离线功能和Service Worker。

---

## 🚀 自动部署到GitHub Pages（推荐）

### 方式一：使用一键部署脚本

#### Windows用户：
```batch
deploy-to-github.bat
```

#### Mac/Linux用户：
```bash
chmod +x deploy-to-github.sh
./deploy-to-github.sh
```

脚本会自动完成以下操作：
1. 初始化Git仓库
2. 添加所有文件
3. 提交代码
4. 推送到GitHub

---

## 📋 手动部署步骤

如果自动脚本失败，请按照以下步骤手动部署：

### 步骤1：创建GitHub仓库

1. 访问 https://github.com/new
2. 仓库名称：`taoran-point-system-pwa`
3. 设置为**公开（Public）**仓库
4. **不**添加README、.gitignore或license
5. 点击"Create repository"

### 步骤2：获取Personal Access Token

1. 访问 https://github.com/settings/tokens
2. 点击"Generate new token" → "Generate new token (classic)"
3. 设置名称：`taoran-deploy`
4. 选择权限：
   - ✅ `repo` (完整仓库访问权限)
5. 生成后**复制Token**（只会显示一次）

### 步骤3：更新deploy-to-github.sh中的Token

打开 `deploy-to-github.sh` 文件，找到以下行：

```bash
GITHUB_TOKEN="your_github_token_here"
```

将 `your_github_token_here` 替换为您刚才复制的Token。

### 步骤4：执行部署脚本

```bash
cd /workspace/projects/out
git init
git add .
git commit -m "Deploy PWA - $(date '+%Y-%m-%d %H:%M:%S')"
git branch -M main

# 使用Token推送
git remote add origin https://YOUR_TOKEN@github.com/chenbenjun/taoran-point-system-pwa.git
git push -u origin main
```

---

## ⚙️ 配置GitHub Pages

### 步骤1：启用GitHub Pages

1. 访问仓库：https://github.com/chenbenjun/taoran-point-system-pwa
2. 点击 **Settings** 标签
3. 在左侧菜单找到 **Pages**
4. 配置如下：
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/ (root)`
5. 点击 **Save**

### 步骤2：等待部署完成

- GitHub会自动开始部署
- 通常需要1-3分钟
- 部署成功后，会在 **Pages** 设置页面看到访问地址

### 步骤3：访问您的PWA应用

部署成功后，访问地址：
```
https://chenbenjun.github.io/taoran-point-system-pwa/
```

---

## 📱 在华为平板上安装PWA

### 方法1：直接安装

1. 在华为平板浏览器中打开：`https://chenbenjun.github.io/taoran-point-system-pwa/`
2. 点击浏览器菜单（三个点）
3. 选择"添加到主屏幕"或"安装应用"
4. 确认安装

### 方法2：通过菜单添加

1. 打开应用
2. 进入浏览器设置
3. 找到"添加到主屏幕"选项
4. 选择应用图标和名称
5. 确认添加

---

## ✅ PWA功能验证

### 1. 离线功能测试
1. 首次访问时，Service Worker会自动安装
2. 等待缓存完成（可在开发者工具的Application → Service Workers中查看）
3. 开启飞行模式
4. 刷新页面，应用应该仍然可以正常使用

### 2. 桌面图标
- 安装后，主屏幕会出现"陶然小灶"图标
- 点击图标可独立打开应用
- 应用会以全屏模式运行（无浏览器地址栏）

### 3. 横竖屏支持
- 应用支持横屏和竖屏自动切换
- 在平板上使用时，横屏体验更佳

---

## 🎨 自定义配置

### 更换应用图标

修改 `out/manifest.json` 中的图标路径，或替换以下文件：
- `out/icon-192.png` (192x192)
- `out/icon-512.png` (512x512)
- `out/icon-maskable-192.png` (192x192, 可遮罩)
- `out/icon-maskable-512.png` (512x512, 可遮罩)

### 修改应用名称

在 `out/manifest.json` 中修改：
```json
{
  "name": "陶然小灶",
  "short_name": "陶然点餐"
}
```

---

## 🔍 故障排除

### 问题1：GitHub Pages 404错误

**解决方案**：
- 确保仓库设置为公开（Public）
- 检查Pages配置是否正确（Branch: main, Folder: /）
- 等待3-5分钟后刷新

### 问题2：PWA无法安装

**解决方案**：
- 确保使用HTTPS访问
- 清除浏览器缓存后重试
- 在Chrome DevTools中检查Application → Manifest是否正确加载

### 问题3：离线功能不工作

**解决方案**：
- 打开Chrome DevTools → Application → Service Workers
- 检查Service Worker是否已激活
- 点击"Update on reload"强制更新
- 在Application → Cache Storage中查看缓存内容

---

## 📦 已打包的文件位置

所有部署文件已在 `out/` 目录中准备就绪：
```
/workspace/projects/out/
├── index.html          # 主页面
├── manifest.json       # PWA配置
├── service-worker.js   # 离线缓存脚本
├── sw-register.js      # Service Worker注册脚本
├── _next/              # Next.js构建产物
└── icon-*.png          # 应用图标
```

---

## 🎉 完成！

一旦部署完成，您就可以：
1. 在任何支持PWA的设备上安装应用
2. 完全离线使用所有功能
3. 享受类似原生应用的体验

如有问题，请检查 **故障排除** 部分或联系技术支持。
