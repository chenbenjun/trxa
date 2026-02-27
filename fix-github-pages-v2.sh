#!/bin/bash

# 更彻底的修复：将所有静态资源移动到static目录
# 避免GitHub Pages对特殊目录名的处理

echo "🔧 开始彻底修复GitHub Pages部署..."

cd out

# 创建static目录
mkdir -p static

# 移动__next__目录到static
if [ -d "__next__" ]; then
    echo "📦 移动 __next__ 到 static/"
    mv __next__ static/
fi

# 移动其他静态资源到static
for file in icon-*.png favicon.ico; do
    if [ -f "$file" ]; then
        echo "📦 移动 $file 到 static/"
        mv "$file" static/
    fi
done

# 移动uploads到static
if [ -d "uploads" ]; then
    echo "📦 移动 uploads 到 static/"
    mv uploads static/
fi

# 移动service-worker.js和sw-register.js到static
for file in service-worker.js sw-register.js manifest.json; do
    if [ -f "$file" ]; then
        echo "📦 移动 $file 到 static/"
        mv "$file" static/
    fi
done

# 更新index.html中的路径
if [ -f "index.html" ]; then
    echo "📝 更新 index.html 中的路径"
    # 更新CSS路径
    sed -i 's|/trxa/__next__/|/trxa/static/|g' index.html
    # 更新JS路径
    sed -i 's|/trxa/__next__/|/trxa/static/|g' index.html
    # 更新图标路径
    sed -i 's|/trxa/icon-|/trxa/static/icon-|g' index.html
    sed -i 's|/trxa/favicon.ico|/trxa/static/favicon.ico|g' index.html
    # 更新service worker路径
    sed -i 's|/trxa/service-worker.js|/trxa/static/service-worker.js|g' index.html
    sed -i 's|/trxa/sw-register.js|/trxa/static/sw-register.js|g' index.html
    # 更新manifest路径
    sed -i 's|/trxa/manifest.json|/trxa/static/manifest.json|g' index.html
fi

# 更新404.html中的路径
if [ -f "404.html" ]; then
    echo "📝 更新 404.html 中的路径"
    sed -i 's|/trxa/__next__/|/trxa/static/|g' 404.html
    sed -i 's|/trxa/icon-|/trxa/static/icon-|g' 404.html
    sed -i 's|/trxa/favicon.ico|/trxa/static/favicon.ico|g' 404.html
fi

# 更新所有.txt文件中的路径
find . -name "*.txt" -type f -exec sed -i 's|/trxa/__next__/|/trxa/static/|g' {} \;

# 更新manifest.json中的路径
if [ -f "static/manifest.json" ]; then
    echo "📝 更新 manifest.json 中的路径"
    sed -i 's|"/trxa/|"/trxa/static/|g' static/manifest.json
    sed -i 's|"/trxa/static/"|"/trxa/static/|g' static/manifest.json
fi

# 更新service-worker.js中的路径
if [ -f "static/service-worker.js" ]; then
    echo "📝 更新 service-worker.js 中的路径"
    sed -i "s|'/trxa/|'/trxa/static/|g" static/service-worker.js
    sed -i "s|'/trxa/static/'|'/trxa/static/|g" static/service-worker.js
fi

echo "✅ 修复完成！"
echo "📦 所有静态资源已移动到 static/ 目录"
echo "📝 所有文件中的路径引用已更新"
