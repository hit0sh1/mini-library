import React from "react";
import { Book } from "@/types";
import { BadgeCheck, Ban, Clock } from "lucide-react";
import Image from "next/image";

interface BookCardProps {
  book: Book;
  onClick?: () => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onClick }) => {
  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-800"
      onClick={onClick}
    >
      <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-800">
        {book.thumbnail ? (
          <Image
            src={book.thumbnail}
            alt={book.title}
            fill
            className="object-contain p-2"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            画像なし
          </div>
        )}
        <div className="absolute top-2 right-2">
          {book.status === "available" ? (
            <span className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium shadow-sm">
              <BadgeCheck size={12} /> 貸出可能
            </span>
          ) : (
            <span className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium shadow-sm">
              <Ban size={12} /> 貸出中
            </span>
          )}
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 line-clamp-1">
          {book.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
          {book.author}
        </p>
      </div>
    </div>
  );
};

export default BookCard;
