'use client';

import { Card } from '@/components/ui/card';

interface SectionIntroProps {
  emoji: string;
  title: string;
  children: React.ReactNode;
}

export function SectionIntro({ emoji, title, children }: SectionIntroProps) {
  return (
    <Card className="p-4 bg-gradient-to-r from-pastel-pink-50 to-pastel-blue-50">
      <h3 className="font-semibold mb-1 flex items-center gap-2">
        <span>{emoji}</span>
        <span>{title}</span>
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed">{children}</p>
    </Card>
  );
}
