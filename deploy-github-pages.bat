@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo 陶然小灶点餐系统 - GitHub Pages 部署
echo ========================================
echo.

REM 检查是否安装了 git
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 git，请先安装 git
    echo 下载地址: https://git-scm.com/downloads
    pause
    exit /b 1
)

REM 获取用户输入
set /p GITHUB_USERNAME=请输入你的GitHub用户名:
set /p REPO_NAME=请输入仓库名称 (如: taoran-point-system):

set REPO_URL=https://github.com/%GITHUB_USERNAME%/%REPO_NAME%.git

echo.
echo ========================================
echo 部署信息：
echo   用户名: %GITHUB_USERNAME%
echo   仓库名: %REPO_NAME%
echo   仓库地址: %REPO_URL%
echo ========================================
echo.

REM 确认部署
set /p CONFIRM=确认部署？^(y/n^):
if /i not "%CONFIRM%"=="y" (
    echo 已取消部署
    pause
    exit /b 0
)

echo.
echo [开始部署...
echo.

REM 切换到out目录
cd out
if %errorlevel% neq 0 (
    echo [错误] 无法进入out目录
    pause
    exit /b 1
)

REM 初始化git仓库（如果还没有）
if not exist .git (
    echo [初始化Git仓库...
    git init
    git branch -M main
) else (
    echo [Git仓库已存在
)

REM 添加所有文件
echo [添加文件到Git...
git add .

REM 创建提交
echo [创建提交...
git commit -m "Deploy to GitHub Pages - %date% %time%" || (
    echo [警告] 没有新的更改需要提交
)

REM 检查是否已添加remote
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo [添加remote...
    git remote add origin %REPO_URL%
) else (
    echo [更新remote地址...
    git remote set-url origin %REPO_URL%
)

REM 推送到GitHub
echo.
echo [推送到GitHub...
echo 如果提示输入密码，请输入GitHub Personal Access Token
echo 获取Token: https://github.com/settings/tokens
echo.

git push -f origin main

if %errorlevel% neq 0 (
    echo.
    echo [错误] 推送失败，请检查：
    echo 1. 仓库名称是否正确
    echo 2. Personal Access Token是否有权限
    echo 3. 网络连接是否正常
    pause
    exit /b 1
)

echo.
echo ========================================
echo [部署完成！
echo ========================================
echo.
echo 访问地址: https://%GITHUB_USERNAME%.github.io/%REPO_NAME%/
echo.
echo ========================================
echo 下一步操作：
echo ========================================
echo.
echo 1. 在浏览器访问上面的地址
echo.
echo 2. 配置GitHub Pages（如果还没有配置）：
echo    - 进入仓库设置
echo    - 点击 'Pages' (左侧菜单)
echo    - Source 选择: Deploy from a branch
echo    - Branch 选择: main
echo    - Folder 选择: / (root)
echo    - 点击 Save
echo.
echo 3. 等待1-3分钟，GitHub会自动构建
echo.
echo 4. 在华为平板上访问该地址
echo 5. 浏览器会提示安装PWA应用
echo 6. 安装后即可离线使用
echo.
echo ========================================
echo.

pause
