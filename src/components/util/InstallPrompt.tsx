'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Share, PlusCircle } from 'lucide-react'

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // 检查是否在 iOS 设备上运行
    const runningOnIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(runningOnIOS)

    // 检查应用是否以独立模式运行 (即已安装)
    const runningInStandalone = window.matchMedia(
      '(display-mode: standalone)'
    ).matches
    setIsStandalone(runningInStandalone)
  }, [])

  // 如果应用已安装，或用户未使用iOS设备，则不显示此提示。
  // 非iOS的现代浏览器会自动处理安装提示。
  if (isStandalone || !isIOS) {
    return null
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>安装应用到主屏幕</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            为了获得最佳体验，请将此应用添加到您的主屏幕以享受离线访问和全屏模式。
          </p>
          <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
            <p className="text-sm font-medium">
              点击浏览器底部的“分享”图标
              <Share className="inline-block mx-1 h-4 w-4" />
              ，然后在菜单中选择“添加到主屏幕”
              <PlusCircle className="inline-block ml-1 h-4 w-4" />
              。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}