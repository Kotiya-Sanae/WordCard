'use client'

import { Settings, User as UserIcon, ArrowLeft } from "lucide-react";
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
import { useRouter } from "next/navigation";

interface HeaderProps {
  title?: string;
  user?: User | null;
  showBackButton?: boolean;
  showLogo?: boolean;
  children?: React.ReactNode;
}

export function Header({
  title,
  user,
  showBackButton = false,
  showLogo = false,
  children,
}: HeaderProps) {
  const router = useRouter();

  return (
    <header className="relative p-4 border-b flex items-center justify-between h-16">
      {/* Left Section */}
      <div className="flex items-center gap-2">
        {showBackButton && (
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        {showLogo && (
          <Link href="/" className="text-xl font-bold">
            WordCard
          </Link>
        )}
      </div>

      {/* Center Section */}
      {title && (
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-bold">
          {title}
        </h1>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {children}
      </div>
    </header>
  );
}