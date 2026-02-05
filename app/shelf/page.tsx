"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Book } from "@/types";
import BookCard from "@/components/BookCard";
import Link from "next/link";

export default function ShelfPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const q = query(collection(db, "books"), orderBy("title")); // Simple sort by title
        const querySnapshot = await getDocs(q);
        const booksData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Book[];
        setBooks(booksData);
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          みんなの本棚
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {books.length} 冊
        </span>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          <p>まだ本が登録されていません。</p>
          <Link
            href="/admin"
            className="text-indigo-600 dark:text-indigo-400 underline mt-2 inline-block"
          >
            本を登録しますか？
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {books.map((book) => (
            <Link key={book.id} href={`/books/${book.id}`}>
              <BookCard book={book} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
