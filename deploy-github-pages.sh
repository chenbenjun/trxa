#!/bin/bash

# GitHub Pages 部署脚本
# 用于将陶然小灶点餐系统部署到 GitHub Pages

set -e

echo "========================================"
echo "陶然小灶点餐系统 - GitHub Pages 部署"
echo "========================================"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否安装了 git
if ! command -v git &> /dev/null; then
    echo -e "${RED}错误: 未找到 git，请先安装 git${NC}"
    exit 1
fi

# 检查是否安装了 gh CLI（可选，但推荐）
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}提示: 建议安装 GitHub CLI (gh) 以获得更好的体验${NC}"
    echo -e "${YELLOW}安装地址: https://cli.github.com/${NC}"
    echo ""
fi

# 获取仓库名称
read -p "请输入你的GitHub用户名: " GITHUB_USERNAME
read -p "请输入仓库名称 (如: taoran-point-system): " REPO_NAME

REPO_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

echo ""
echo "========================================"
echo "部署信息："
echo "  用户名: ${GITHUB_USERNAME}"
echo "  仓库名: ${REPO_NAME}"
echo "  仓库地址: ${REPO_URL}"
echo "========================================"
echo ""

# 确认部署
read -p "确认部署？(y/n): " CONFIRM
if [[ $CONFIRM != "y" && $CONFIRM != "Y" ]]; then
    echo "已取消部署"
    exit 0
fi

echo ""
echo -e "${GREEN}开始部署...${NC}"
echo ""

# 切换到out目录
cd out || exit 1

# 初始化git仓库（如果还没有）
if [ ! -d .git ]; then
    echo "初始化Git仓库..."
    git init
    git branch -M main
else
    echo "Git仓库已存在"
fi

# 添加所有文件
echo "添加文件到Git..."
git add .

# 创建提交
echo "创建提交..."
git commit -m "Deploy to GitHub Pages - $(date '+%Y-%m-%d %H:%M:%S')" || true

# 检查是否已添加remote
if git remote get-url origin > /dev/null 2>&1; then
    echo "更新remote地址..."
    git remote set-url origin ${REPO_URL}
else
    echo "添加remote..."
    git remote add origin ${REPO_URL}
fi

# 推送到GitHub
echo ""
echo -e "${YELLOW}推送到GitHub...${NC}"
echo "如果提示输入密码，请输入GitHub Personal Access Token"
echo "获取Token: https://github.com/settings/tokens"
echo ""

git push -f origin main

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "访问地址: https://${GITHUB_USERNAME}.github.io/${REPO_NAME}/"
echo ""
echo "========================================"
echo "下一步操作："
echo "========================================"
echo ""
echo "1. 在浏览器访问上面的地址"
echo ""
echo "2. 配置GitHub Pages（如果还没有配置）："
echo "   - 进入仓库设置"
echo "   - 点击 'Pages' (左侧菜单)"
echo "   - Source 选择: Deploy from a branch"
echo "   - Branch 选择: main"
echo "   - Folder 选择: / (root)"
echo "   - 点击 Save"
echo ""
echo "3. 等待1-3分钟，GitHub会自动构建"
echo ""
echo "4. 在华为平板上访问该地址"
echo "5. 浏览器会提示安装PWA应用"
echo "6. 安装后即可离线使用"
echo ""
echo "========================================"
echo ""
