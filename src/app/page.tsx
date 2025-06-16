import { FlashcardPlayer } from "@/components/home/FlashcardPlayer";
import { Header } from "@/components/layout/Header";
import { DailyProgress } from "@/components/home/DailyProgress";

export default function HomePage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Vocabulary" />
      <DailyProgress />

      {/* Flashcard Player */}
      <div className="flex-1 flex items-center justify-center">
        <FlashcardPlayer />
      </div>
    </div>
  );
}
