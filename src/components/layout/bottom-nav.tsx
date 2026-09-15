'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/dates', label: 'Dates', icon: '💕' },
  { href: '/calendario', label: 'Calendario', icon: '📅' },
  { href: '/recuerdos', label: 'Recuerdos', icon: '📸' },
  { href: '/spark', label: 'Spark', icon: '✨' },
  { href: '/mood', label: 'Mood', icon: '😊' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-t border-pastel-pink-100">
      <div className="max-w-lg mx-auto px-2">
        <div className="flex justify-around items-center h-16">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`) ||
                  (item.href === '/dates' && pathname === '/planes') ||
                  (item.href === '/recuerdos' && pathname === '/camara');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-1 min-w-0 flex-col items-center justify-center px-1 py-1 rounded-lg transition-all',
                  isActive
                    ? 'bg-pastel-pink-100 text-gray-800'
                    : 'text-gray-500 hover:bg-gray-100'
                )}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-[9px] mt-0.5 truncate w-full text-center">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
