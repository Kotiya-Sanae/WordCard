import { login, signup } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Card className="w-full max-w-sm">
        <form>
          <CardHeader>
            <CardTitle className="text-2xl">登录/注册</CardTitle>
            <CardDescription>
              输入您的邮箱和密码以登录。如果还未注册，输入您要注册的邮箱和设置的密码，点击注册
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="me@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              formAction={login}
              className="w-full !bg-teal-500 text-white hover:!bg-teal-600"
            >
              登录
            </Button>
            <Button formAction={signup} className="w-full" variant="outline">
              注册
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}