import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import packageJson from "../../../../package.json";

export default function AboutPage() {
  const version = packageJson.version;

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>关于 WordCard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            一个使用现代Web技术构建的、功能强大的单词卡片应用。
          </p>
          <div className="flex justify-between pt-2">
            <span>版本号</span>
            <span className="font-mono">{version}</span>
          </div>
          <div className="flex justify-between">
            <span>开发者</span>
            <span>Roo</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}