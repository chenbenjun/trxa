# GitHub Pages 部署完整指南

## 🎯 部署目标

将陶然小灶点餐系统部署到GitHub Pages，使其能够在鸿蒙OS 4.2的华为平板上作为PWA应用安装，支持完全离线运行。

## 📋 前置要求

### 1. GitHub账号
- 如果没有，访问 https://github.com 注册
- 免费账号即可

### 2. Git工具
- 下载安装：https://git-scm.com/downloads
- 安装时保持默认设置

### 3. GitHub Personal Access Token（必需）
创建步骤：
1. 登录GitHub
2. 点击右上角头像 → Settings
3. 左侧菜单选择 "Developer settings"
4. 点击 "Personal access tokens" → "Tokens (classic)"
5. 点击 "Generate new token" → "Generate new token (classic)"
6. 设置Token名称（如：gh-pages-deploy）
7. Expiration选择：No expiration（或选择一个较长时间）
8. 勾选权限：
   - ✅ `repo` (完整仓库访问权限)
   - ✅ `workflow` (工作流权限)
9. 点击 "Generate token"
10. **重要：** 复制并保存Token（只显示一次）

---

## 🚀 方法一：自动部署（推荐）

### Windows用户

1. **下载部署脚本**
   - 找到 `deploy-github-pages.bat` 文件
   - 确保它与 `out` 文件夹在同一目录

2. **运行脚本**
   - 双击 `deploy-github-pages.bat`
   - 按提示输入GitHub用户名和仓库名

3. **输入Token**
   - 推送时会提示输入密码
   - 将之前创建的Token粘贴进去
   - （不会显示字符，直接粘贴按回车）

4. **等待完成**
   - 脚本会自动完成所有步骤
   - 最后会显示访问地址

### Mac/Linux用户

1. **运行部署脚本**
   ```bash
   chmod +x deploy-github-pages.sh
   ./deploy-github-pages.sh
   ```

2. **按提示操作**
   - 输入GitHub用户名和仓库名
   - 输入Personal Access Token

---

## 🚀 方法二：手动部署

### 步骤1：在GitHub上创建仓库

1. 登录GitHub
2. 点击右上角 "+" → "New repository"
3. 填写信息：
   - Repository name: `taoran-point-system`（或其他名称）
   - Public 或 Private 都可以（PWA需要Public）
4. 点击 "Create repository"

### 步骤2：推送代码到GitHub

在命令行中执行：

```bash
# 进入out目录
cd out

# 初始化Git仓库
git init
git branch -M main

# 添加所有文件
git add .

# 提交
git commit -m "Initial deployment"

# 添加remote（替换YOUR_USERNAME和REPO_NAME）
git remote add origin https://github.com/YOUR_USERNAME/taoran-point-system.git

# 推送
git push -u origin main
```

**输入密码时，粘贴Personal Access Token**

### 步骤3：配置GitHub Pages

1. 进入仓库页面
2. 点击上方 "Settings" 标签
3. 左侧菜单点击 "Pages"
4. 在 "Build and deployment" 部分：
   - Source 选择：**Deploy from a branch**
   - Branch 选择：**main**
   - Folder 选择：**/** (root)
5. 点击 "Save"

### 步骤4：等待构建

- GitHub会自动构建
- 等待1-3分钟
- 刷新Pages页面，会显示访问地址

访问地址格式：
```
https://YOUR_USERNAME.github.io/taoran-point-system/
```

---

## 📱 在华为平板上安装PWA应用

### 步骤1：访问部署的地址

在华为平板的浏览器（华为浏览器或Chrome）中访问：
```
https://YOUR_USERNAME.github.io/taoran-point-system/
```

### 步骤2：安装PWA应用

**华为浏览器：**
1. 点击浏览器地址栏右侧的菜单（三个点）
2. 选择"添加到主屏幕"或"安装应用"
3. 确认安装

**Chrome浏览器：**
1. 点击浏览器地址栏右侧的菜单（三个点）
2. 选择"安装陶然小灶"或"添加到主屏幕"
3. 确认安装

### 步骤3：验证安装

安装成功后：
- ✅ 主屏幕会出现应用图标
- ✅ 打开应用后独立运行（没有浏览器地址栏）
- ✅ 可以关闭浏览器，应用仍能运行

---

## 🔄 PWA离线功能验证

### 验证Service Worker

1. 打开安装的PWA应用
2. 打开开发者工具（如果支持）
3. 进入 "Application" → "Service Workers"
4. 应该看到Service Worker已激活
5. 状态显示为 "Activated" 和 "Running"

### 验证离线功能

1. 打开应用，浏览几个页面
2. 关闭WiFi或移动数据
3. 刷新页面
4. ✅ 应该仍然可以正常访问

### 验证安装状态

1. 长按应用图标
2. 查看应用信息
3. 应该显示为"网站应用"或"PWA"

---

## ⚙️ 高级配置

### 自定义域名（可选）

如果你有自定义域名：

1. 在仓库的Pages设置中添加自定义域名
2. 在DNS服务商处添加CNAME记录
3. 等待DNS生效

### 自动部署（可选）

使用GitHub Actions自动部署：

1. 创建 `.github/workflows/deploy.yml`
2. 配置自动构建和部署
3. 每次推送代码时自动部署

---

## 🐛 常见问题解决

### 问题1：推送失败，提示认证错误

**解决方案：**
- 确认Personal Access Token正确
- 确认Token有 `repo` 权限
- 尝试删除本地缓存：
  ```bash
  git credential-manager erase https://github.com
  ```

### 问题2：GitHub Pages显示404

**解决方案：**
- 检查Pages配置是否正确（Source: Deploy from a branch, Branch: main, Folder: /）
- 等待1-3分钟，GitHub需要时间构建
- 检查仓库名称是否与URL一致

### 问题3：PWA无法安装

**解决方案：**
- 确保仓库是Public（PWA需要HTTPS）
- 确保manifest.json配置正确
- 确保Service Worker已注册
- 尝试清除浏览器缓存后重新访问

### 问题4：离线后无法使用

**解决方案：**
- 首次访问需要联网，让Service Worker缓存资源
- 检查Service Worker是否已激活
- 尝试重新安装应用
- 检查浏览器控制台是否有错误

### 问题5：华为平板上不提示安装

**解决方案：**
- 确保使用华为浏览器或Chrome
- 确保manifest.json可访问
- 尝试在浏览器地址栏输入 `chrome://apps`（Chrome）
- 检查浏览器设置中是否允许安装PWA

---

## 📊 部署检查清单

部署前检查：
- [ ] 已创建GitHub账号
- [ ] 已创建Personal Access Token
- [ ] 已安装Git工具
- [ ] 已准备好out文件夹

部署步骤：
- [ ] 创建GitHub仓库
- [ ] 推送代码到仓库
- [ ] 配置GitHub Pages
- [ ] 等待构建完成
- [ ] 测试访问地址

PWA安装验证：
- [ ] 在华为平板上访问
- [ ] 浏览器提示安装PWA
- [ ] 安装成功
- [ ] 主屏幕显示应用图标
- [ ] 可以离线访问
- [ ] 所有功能正常

---

## 🎉 部署成功后

### 访问地址示例：

```
https://yourname.github.io/taoran-point-system/
```

### 在华为平板上：

1. 访问上述地址
2. 浏览器会提示"安装陶然小灶"
3. 点击安装
4. 主屏幕会出现应用图标
5. 点击图标即可离线使用

### 离线使用：

- ✅ 关闭WiFi和移动数据
- ✅ 打开应用
- ✅ 所有功能正常
- ✅ 可以点餐、下单、打印

---

## 📞 技术支持

如果遇到问题：

1. 查看本指南的"常见问题解决"部分
2. 检查GitHub Pages构建日志
3. 查看浏览器控制台错误信息
4. 确认PWA配置正确

---

## 📝 总结

**部署时间：** 10-15分钟  
**难度：** ⭐⭐⭐（中等）  
**功能完整度：** 100%  
**离线支持：** ✅ 完全支持  
**PWA安装：** ✅ 支持

**现在就开始部署吧！** 🍜
