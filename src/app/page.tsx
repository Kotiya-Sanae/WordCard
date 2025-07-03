import { DailyProgress } from "@/components/home/DailyProgress";
import { FlashcardPlayer } from "@/components/home/FlashcardPlayer";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings } from "lucide-react";
import { UserMenu } from "@/components/layout/UserMenu";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col h-full">
      <Header showLogo>
        <ThemeToggle />
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <Settings className="w-5 h-5" />
          </Link>
        </Button>
        {user && <UserMenu user={user} />}
      </Header>
      <DailyProgress />

      {/* Flashcard Player */}
      <div className="flex-1 flex items-center justify-center">
        <FlashcardPlayer />
      </div>
    </div>
  );
}
