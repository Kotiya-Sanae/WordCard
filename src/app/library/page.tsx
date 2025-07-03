import { WordList } from "@/components/library/WordList";
import { Header } from "@/components/layout/Header";

export default function LibraryPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="我的词库" />
      <div className="flex-1 p-4 overflow-y-auto">
        <WordList />
      </div>
    </div>
  );
}