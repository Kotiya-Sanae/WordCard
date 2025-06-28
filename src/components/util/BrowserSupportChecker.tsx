"use client";

import { useState, useEffect } from 'react';

export function BrowserSupportChecker() {
  const [isUnsupported, setIsUnsupported] = useState(false);

  useEffect(() => {
    // 使用更严格的、基于实际渲染结果的检测方法
    const testElement = document.createElement('div');
    const testColor = 'rgb(0, 123, 255)'; // 一个独特的颜色值
    const fallbackColor = 'rgb(255, 0, 0)';

    // 1. 为探针元素设置一个使用 CSS 变量的样式
    testElement.style.color = `var(--test-color, ${fallbackColor})`;
    
    // 2. 为 body 设置这个 CSS 变量的值
    document.body.style.setProperty('--test-color', testColor);
    
    // 3. 将探针元素添加到 DOM 中（但让它不可见）
    testElement.style.position = 'absolute';
    testElement.style.visibility = 'hidden';
    document.body.appendChild(testElement);
    
    // 4. 读取探针元素的最终计算颜色
    const computedColor = window.getComputedStyle(testElement).color;
    
    // 5. 清理
    document.body.removeChild(testElement);
    document.body.style.removeProperty('--test-color');

    // 6. 判断
    if (computedColor !== testColor) {
      // 如果计算出的颜色不是我们设置的变量值，说明浏览器不支持
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