'use client'

import { Settings, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import Link from "next/link";
import { type User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/app/login/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarSelector } from "./AvatarSelector";

interface HeaderProps {
  title: string;
  user: User | null;
}

export function Header({ title, user }: HeaderProps) {
  return (
    <header className="p-4 border-b flex justify-between items-center">
      <h1 className="text-xl font-bold">{title}</h1>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <Settings className="w-5 h-5" />
          </Link>
        </Button>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={user.user_metadata.avatar_url || ''} 
                    alt={user.email || 'User avatar'}
                  />
                  <AvatarFallback>
                    {user.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <AvatarSelector>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  更换头像
                </DropdownMenuItem>
              </AvatarSelector>
              <DropdownMenuSeparator />
              <form action={logout}>
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full text-left">
                    登出
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}