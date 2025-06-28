"use client";

import { useState, useEffect } from 'react';

export function BrowserSupportChecker() {
  const [isUnsupported, setIsUnsupported] = useState(false);

  useEffect(() => {
    // 检测浏览器是否支持 CSS 变量
    const supportsCssVariables = window.CSS && window.CSS.supports && window.CSS.supports('--a', '0');
    if (!supportsCssVariables) {
      setIsUnsupported(true);
    }
  }, []);

  if (!isUnsupported) {
    return null;
  }

  // 如果浏览器不支持，则渲染一个提示遮罩层
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '20px',
        textAlign: 'center',
        color: '#333',
        fontFamily: 'sans-serif',
        lineHeight: '1.6',
      }}
    >
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>浏览器版本过低</h2>
        <p style={{ fontSize: '16px' }}>
          抱歉，我们检测到您的浏览器版本过旧，无法完全支持本应用所需的核心技术（主要是CSS Variables）。例如Via浏览器，使用这类浏览器会导致严重的样式丢失。
        </p>
        <p style={{ fontSize: '16px', marginTop: '8px' }}>
          为了获得最佳体验，请使用最新版本的 Chrome、Firefox、Safari 或 Edge 浏览器。
        </p>
      </div>
    </div>
  );
}