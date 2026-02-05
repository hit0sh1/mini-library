"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Book } from "@/types";
import BookCard from "@/components/BookCard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScanLine, X } from "lucide-react";
import Scanner from "@/components/Scanner";

export default function ShelfPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const router = useRouter();

  const handleDetected = useCallback(
    async (code: string) => {
      setScanning(false);
      try {
        const bookDoc = await getDoc(doc(db, "books", code));
        if (bookDoc.exists()) {
          router.push(`/books/${code}`);
        } else {
          alert("その本は登録されていません。");
        }
      } catch (error) {
        console.error("Error checking book:", error);
        alert("エラーが発生しました。");
      }
    },
    [router],
  );

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScanning(true)}
            className="p-2 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700 transition-colors"
            title="バーコードで検索"
          >
            <ScanLine size={20} />
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {books.length} 冊
          </span>
        </div>
      </div>

      {scanning && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center">
          <button
            onClick={() => setScanning(false)}
            className="absolute top-6 right-6 p-3 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-md transition-colors"
          >
            <X size={24} />
          </button>
          <div className="w-full max-w-md px-4">
            <h2 className="text-white text-lg font-bold mb-4 text-center">
              バーコードを読み取ってください
            </h2>
            <div className="overflow-hidden rounded-2xl border-2 border-white/50 shadow-2xl">
              <Scanner onDetected={handleDetected} />
            </div>
          </div>
        </div>
      )}

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
