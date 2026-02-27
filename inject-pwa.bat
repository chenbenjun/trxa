@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 正在注入 PWA Service Worker 代码...

REM 检查index.html是否存在
if not exist index.html (
    echo 错误: 未找到 index.html
    pause
    exit /b 1
)

REM 创建备份
copy index.html index.html.bak >nul

REM 注入 Service Worker 注册代码
REM 在 </head> 之前注入
powershell -Command "(Get-Content index.html -Raw) -replace '</head>', '<script>if (\"serviceWorker\" in navigator) { window.addEventListener(\"load\", function() { navigator.serviceWorker.register(\"/service-worker.js\").then(function(registration) { console.log(\"[PWA] Service Worker 注册成功\"); }).catch(function(error) { console.log(\"[PWA] Service Worker 注册失败:\", error); }); }); }</script></head>' | Set-Content index.html"

echo ✓ PWA Service Worker 代码注入完成
echo ✓ 备份文件: index.html.bak
echo.
echo 现在 index.html 已包含 Service Worker 注册代码

pause
