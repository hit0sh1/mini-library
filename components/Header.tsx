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
      </div>
    </header>
  );
};

export default Header;
