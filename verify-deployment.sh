#!/bin/bash

# 验证GitHub Pages部署
echo "🔍 验证GitHub Pages部署..."
echo ""

BASE_URL="https://chenbenjun.github.io/trxa"

# 测试HTML
echo "📄 测试主页面..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 主页面正常 ($HTTP_CODE)"
else
    echo "❌ 主页面失败 ($HTTP_CODE)"
fi

# 测试CSS
echo "🎨 测试CSS文件..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/static/__next__/static/chunks/d4c83ec1db9ee3b3.css")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ CSS文件正常 ($HTTP_CODE)"
else
    echo "❌ CSS文件失败 ($HTTP_CODE)"
fi

# 测试JS
echo "📜 测试JS文件..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/static/__next__/static/chunks/3809cb8fb1694439.js")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ JS文件正常 ($HTTP_CODE)"
else
    echo "❌ JS文件失败 ($HTTP_CODE)"
fi

# 测试图标
echo "🖼️  测试图标..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/static/icon-192.png")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 图标正常 ($HTTP_CODE)"
else
    echo "❌ 图标失败 ($HTTP_CODE)"
fi

# 测试PWA manifest
echo "📱 测试PWA Manifest..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/static/manifest.json")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ PWA Manifest正常 ($HTTP_CODE)"
else
    echo "❌ PWA Manifest失败 ($HTTP_CODE)"
fi

# 测试Service Worker
echo "🔄 测试Service Worker..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/static/service-worker.js")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Service Worker正常 ($HTTP_CODE)"
else
    echo "❌ Service Worker失败 ($HTTP_CODE)"
fi

# 测试图片
echo "🍜 测试菜品图片..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/static/uploads/dish-1771778709296-ewzc0hh.png")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 菜品图片正常 ($HTTP_CODE)"
else
    echo "❌ 菜品图片失败 ($HTTP_CODE)"
fi

echo ""
echo "🎉 验证完成！"
echo "🌐 访问地址：$BASE_URL"
