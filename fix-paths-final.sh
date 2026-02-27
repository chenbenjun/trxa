#!/bin/bash

# 修复路径引用 - 添加/trxa/前缀
echo "🔧 开始修复路径引用..."

cd out

# 移动静态资源到static目录
mkdir -p static

# 移动_next目录到static
if [ -d "_next" ]; then
    echo "📦 移动 _next 到 static/"
    mv _next static/
fi

# 移动其他静态资源
for file in icon-*.png favicon.ico; do
    if [ -f "$file" ]; then
        echo "📦 移动 $file 到 static/"
        mv "$file" static/
    fi
done

if [ -d "uploads" ]; then
    echo "📦 移动 uploads 到 static/"
    mv uploads static/
fi

for file in service-worker.js sw-register.js manifest.json; do
    if [ -f "$file" ]; then
        echo "📦 移动 $file 到 static/"
        mv "$file" static/
    fi
done

# 更新index.html中的路径 - 只添加/trxa前缀
if [ -f "index.html" ]; then
    echo "📝 更新 index.html 中的路径"
    sed -i 's|"/_next/|"/trxa/static/_next/|g' index.html
    sed -i 's|href="icon-|href="/trxa/static/icon-|g' index.html
    sed -i 's|href="favicon.ico|href="/trxa/static/favicon.ico|g' index.html
    sed -i 's|src="service-worker.js"|src="/trxa/static/service-worker.js"|g' index.html
    sed -i 's|src="sw-register.js"|src="/trxa/static/sw-register.js"|g' index.html
    sed -i 's|href="manifest.json"|href="/trxa/static/manifest.json"|g' index.html
fi

# 更新404.html
if [ -f "404.html" ]; then
    echo "📝 更新 404.html 中的路径"
    sed -i 's|"/_next/|"/trxa/static/_next/|g' 404.html
    sed -i 's|href="icon-|href="/trxa/static/icon-|g' 404.html
    sed -i 's|href="favicon.ico|href="/trxa/static/favicon.ico|g' 404.html
fi

# 更新manifest.json
if [ -f "static/manifest.json" ]; then
    echo "📝 更新 manifest.json 中的路径"
    sed -i 's|"/|"/trxa/|g' static/manifest.json
    sed -i 's|"/trxa/static/"|"/trxa/static/|g' static/manifest.json
fi

# 更新service-worker.js
if [ -f "static/service-worker.js" ]; then
    echo "📝 更新 service-worker.js 中的路径"
    sed -i "s|'/|'/trxa/|g" static/service-worker.js
    sed -i "s|'/trxa/'|'/trxa/'|g" static/service-worker.js
fi

# 添加.nojekyll
touch .nojekyll

echo "✅ 修复完成！"
echo "📦 所有路径已添加 /trxa/ 前缀"
