#!/bin/bash

# PWA 注入脚本
# 自动将 Service Worker 注册代码注入到 index.html

set -e

echo "正在注入 PWA Service Worker 代码..."

# 检查index.html是否存在
if [ ! -f "index.html" ]; then
    echo "错误: 未找到 index.html"
    exit 1
fi

# 创建备份
cp index.html index.html.bak

# 在 </head> 之前注入 SW 注册代码
python3 << 'PYTHON_SCRIPT'
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

sw_code = '''<script>
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker.register("/service-worker.js")
      .then(function(registration) {
        console.log("[PWA] Service Worker 注册成功");
      })
      .catch(function(error) {
        console.log("[PWA] Service Worker 注册失败:", error);
      });
  });
}
</script>'''

# 在 </head> 之前插入
content = content.replace('</head>', sw_code + '</head>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ PWA Service Worker 代码注入成功")
PYTHON_SCRIPT

echo "✓ 备份文件: index.html.bak"
echo ""
echo "现在 index.html 已包含 Service Worker 注册代码"
