'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Book, FilePlus, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '首页', icon: Home },
  { href: '/library', label: '词库', icon: Book },
  { href: '/add', label: '添加', icon: FilePlus },
  { href: '/stats', label: '统计', icon: BarChart3 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 w-full max-w-md mx-auto bg-background border-t border-border">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const isActive = item.href === '/'
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-20 py-1 transition-colors duration-200 ease-in-out"
            >
              <item.icon
                className={cn(
                  'w-5 h-5 mb-1',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span
                className={cn(
                  'text-xs',
                  isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}