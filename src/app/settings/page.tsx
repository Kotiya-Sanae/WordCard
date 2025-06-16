import Link from "next/link";
import { ChevronRight, Palette, Target, Info, Code } from "lucide-react";

const settingsItems = [
  {
    href: "/settings/appearance",
    icon: Palette,
    title: "外观设置",
    description: "调整应用主题、颜色等",
  },
  {
    href: "/settings/learning",
    icon: Target,
    title: "学习设置",
    description: "设定每日目标和复习计划",
  },
  {
    href: "/settings/about",
    icon: Info,
    title: "关于",
    description: "查看应用信息和版本号",
  },
  {
    href: "/settings/developer",
    icon: Code,
    title: "开发者模式",
    description: "用于测试和调试的工具",
  },
];

export default function SettingsPage() {
  return (
    <div className="p-4">
      <ul className="space-y-2">
        {settingsItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center justify-between p-4 rounded-lg hover:bg-muted"
            >
              <div className="flex items-center gap-4">
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}