'use client';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-pastel-pink-100">
      <div className="px-4 py-3 max-w-lg mx-auto">
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        <p className="text-sm text-gray-500">
          Amanda 💕 Mau
        </p>
      </div>
    </header>
  );
}
