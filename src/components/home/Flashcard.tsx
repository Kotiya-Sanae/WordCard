"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCw, Volume2, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

// 这是一个临时的Props类型，后续会从数据库类型生成
interface FlashcardProps {
  word: string;
  phonetics: string[];
  definitions: string[];
  examples: string[];
}

export function Flashcard({ word, phonetics, definitions, examples }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="w-full max-w-sm mx-auto perspective-1200">
      <div
        className={cn(
          "relative w-full h-[400px] transition-transform duration-500 preserve-3d",
          isFlipped && "rotate-y-180"
        )}
      >
        {/* 卡片正面 */}
        <Card className="absolute w-full h-full backface-hidden flex flex-col justify-center items-center p-6">
          <CardHeader className="w-full text-center">
            <h2 className="text-4xl font-bold text-card-foreground">{word}</h2>
            {phonetics.map((p, i) => (
              <p key={i} className="text-muted-foreground mt-2">{p}</p>
            ))}
          </CardHeader>
          <CardContent className="flex items-center justify-center space-x-3">
            <Button variant="outline" size="icon">
              <Volume2 className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon">
              <Bookmark className="w-5 h-5" />
            </Button>
          </CardContent>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4"
            onClick={handleFlip}
          >
            <RotateCw className="w-5 h-5 text-muted-foreground" />
          </Button>
        </Card>

        {/* 卡片背面 */}
        <Card className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col p-6 overflow-y-auto">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">释义</h3>
            {definitions.map((d, i) => (
              <p key={i} className="text-base text-muted-foreground mb-1">{d}</p>
            ))}
            
            {examples.length > 0 && (
              <>
                <h3 className="font-semibold text-lg mt-4 mb-2">例句</h3>
                {examples.map((e, i) => (
                  <p key={i} className="italic text-base leading-relaxed text-muted-foreground mb-1">{e}</p>
                ))}
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4"
            onClick={handleFlip}
          >
            <RotateCw className="w-5 h-5 text-muted-foreground" />
          </Button>
        </Card>
      </div>
    </div>
  );
}