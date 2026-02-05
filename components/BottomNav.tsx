"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Library, RotateCcw, Settings } from "lucide-react";

const BottomNav = () => {
  const pathname = usePathname();

  const navItems = [
    {
      label: "本棚",
      href: "/shelf",
      icon: Library,
    },
    {
      label: "返却",
      href: "/return",
      icon: RotateCcw,
    },
    {
      label: "管理",
      href: "/admin",
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe">
      <div className="max-w-md mx-auto flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
