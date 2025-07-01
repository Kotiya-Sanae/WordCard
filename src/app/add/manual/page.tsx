import { AddWordForm } from "@/components/add/AddWordForm";

export default function AddWordPage() {
  return (
    <div>
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-center">添加新单词</h1>
      </div>
      <AddWordForm />
    </div>
  );
}