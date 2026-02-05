"use client";

import Link from "next/link";
import { Library, User, ScanLine } from "lucide-react";
import { usePathname } from "next/navigation";

const Header = () => {
  const pathname = usePathname();
  const isAdmin = pathname.includes("admin");

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-indigo-600"
        >
          <Library size={24} />
          <span className="text-lg">みんなの本棚</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/shelf"
            className={`p-2 rounded-full ${pathname === "/shelf" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-400"}`}
          >
            <Library size={20} />
          </Link>
          <Link
            href="/return"
            className={`p-2 rounded-full ${pathname === "/return" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-400"}`}
          >
            <ScanLine size={20} />
          </Link>
          <Link
            href="/admin"
            className={`p-2 rounded-full ${isAdmin ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-400"}`}
          >
            <User size={20} />
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
