"use client";

import { useState, useEffect } from 'react';

export function BrowserSupportChecker() {
  const [isUnsupported, setIsUnsupported] = useState(false);

  useEffect(() => {
    // 最终的、基于 CSS 变量备用值 (fallback) 的检测方法
    if (typeof window !== 'undefined' && window.CSS) {
      // 使用一个独特的颜色值作为备用值
      const testColor = 'rgb(1, 2, 3)';
      
      // 检测浏览器是否能正确处理 var() 的备用值
      // CSS.supports('color', 'var(--a, red)') 会在所有现代浏览器中返回 true，
      // 但我们需要检测的是渲染引擎是否真的应用了它。
      const testElement = document.createElement('div');
      testElement.style.color = `var(--this-variable-does-not-exist, ${testColor})`;
      
      // 必须将元素添加到 DOM 中才能获取到 getComputedStyle
      testElement.style.position = 'absolute';
      testElement.style.visibility = 'hidden';
      document.body.appendChild(testElement);
      
      const computedColor = window.getComputedStyle(testElement).color;
      
      document.body.removeChild(testElement);

      // 如果计算出的颜色不是我们设置的备用值，说明浏览器不支持
      if (computedColor !== testColor) {
        setIsUnsupported(true);
      }
    } else {
      // 如果连 window.CSS 都不支持，那肯定是老旧浏览器
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
          抱歉，我们检测到您的浏览器版本过旧，无法完全支持本应用所需的核心技术。
        </p>
        <p style={{ fontSize: '16px', marginTop: '8px' }}>
          为了获得最佳体验，请使用最新版本的 Chrome、Firefox、Safari 或 Edge 浏览器。
        </p>
      </div>
    </div>
  );
}