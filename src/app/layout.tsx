import type { Metadata, Viewport } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: '陶然小灶 - 点菜系统',
  description: '陶然小灶餐厅智能点菜系统，纯离线单机版',
  keywords: ['点菜系统', '餐厅点餐', '陶然小灶'],
  authors: [{ name: '陶然小灶' }],
  generator: 'Coze Code',
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/trxa/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="陶然小灶" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#DC2626" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/trxa/manifest.json" />
        <link rel="apple-touch-icon" href="/trxa/icon-192.png" />
      </head>
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        {children}
        <script dangerouslySetInnerHTML={{
          __html: `
            // 注册 Service Worker
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/trxa/service-worker.js')
                  .then(function(registration) {
                    console.log('Service Worker 注册成功:', registration.scope);
                  })
                  .catch(function(error) {
                    console.log('Service Worker 注册失败:', error);
                  });
              });
            }
          `
        }} />
      </body>
    </html>
    </html>
  );
}
