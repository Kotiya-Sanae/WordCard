import { DailyProgress } from "@/components/home/DailyProgress";
import { FlashcardPlayer } from "@/components/home/FlashcardPlayer";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col h-full">
      <Header title="Vocabulary" user={user} />
      <DailyProgress />

      {/* Flashcard Player */}
      <div className="flex-1 flex items-center justify-center">
        <FlashcardPlayer />
      </div>
    </div>
  );
}
