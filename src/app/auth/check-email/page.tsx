import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-2xl">请查收邮件</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            感谢您的注册！我们已经向您的邮箱发送了一封确认邮件，请点击邮件中的链接以激活您的账户。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}