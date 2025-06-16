"use client";

import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function AppearancePage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">外观</h2>
      <div className="space-y-2">
        <Label>主题模式</Label>
        <RadioGroup defaultValue={theme} onValueChange={setTheme} className="pt-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="light" id="light" />
            <Label htmlFor="light">亮色</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dark" id="dark" />
            <Label htmlFor="dark">暗色</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="system" id="system" />
            <Label htmlFor="system">跟随系统</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}