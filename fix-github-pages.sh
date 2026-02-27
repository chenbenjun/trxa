#!/bin/bash

# 修复GitHub Pages的_next目录问题
# GitHub Pages对_next目录有特殊处理，需要重命名为其他名称

echo "🔧 开始修复GitHub Pages部署..."

cd out

# 将_next目录重命名为__next__
if [ -d "_next" ]; then
    echo "📦 重命名 _next 为 __next__"
    mv _next __next__
fi

# 更新index.html中的路径
if [ -f "index.html" ]; then
    echo "📝 更新 index.html 中的路径"
    sed -i 's|/_next/|/__next__/|g' index.html
fi

# 更新404.html中的路径
if [ -f "404.html" ]; then
    echo "📝 更新 404.html 中的路径"
    sed -i 's|/_next/|/__next__/|g' 404.html
fi

# 更新所有.txt文件中的路径
find . -name "*.txt" -type f -exec sed -i 's|/_next/|/__next__/|g' {} \;

echo "✅ 修复完成！"
echo "📦 _next 目录已重命名为 __next__"
echo "📝 所有文件中的路径引用已更新"
