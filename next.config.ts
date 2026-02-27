import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 允许的开发域名
  allowedDevOrigins: ['*.dev.coze.site'],
  
  // 图片配置（本地图片使用，不需要远程模式）
  images: {
    unoptimized: true, // 禁用图片优化，使用Base64本地图片
  },
  
  // 静态导出配置
  output: 'export',
  
  // 导出目录
  distDir: 'out',
  
  // GitHub Pages 部署路径
  basePath: '/trxa',
  // assetPrefix: '/trxa', // 移除 assetPrefix，只保留 basePath
  
  // 确保所有 URL 以 / 结尾
  trailingSlash: true,
  
  // 修复按钮点击失效问题
  reactStrictMode: false, // 关闭严格模式，避免事件绑定被重复执行/取消
};

export default nextConfig;
