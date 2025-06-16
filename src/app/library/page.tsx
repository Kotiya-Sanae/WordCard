import { WordList } from "@/components/library/WordList";

export default function LibraryPage() {
  return (
    <div>
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-center">我的词库</h1>
      </div>
      <div className="p-4">
        <WordList />
      </div>
    </div>
  );
}