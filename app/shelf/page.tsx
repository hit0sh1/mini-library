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
  const [searching, setSearching] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const router = useRouter();

  const handleDetected = useCallback(
    async (code: string) => {
      console.log("[ShelfPage] handleDetected called with:", code);
      if (!code || searching || scanError) {
        console.log(
          "[ShelfPage] skipping: code is empty, searching, or error exists",
          { code, searching, scanError },
        );
        return;
      }

      setSearching(true);
      setScanError(null);
      try {
        const cleanedCode = code.trim();
        console.log("[ShelfPage] Fetching book with ID:", cleanedCode);
        const bookDoc = await getDoc(doc(db, "books", cleanedCode));

        if (bookDoc.exists()) {
          console.log("[ShelfPage] Book found! Redirecting...");
          router.push(`/books/${cleanedCode}`);
          // Next.js handles navigation. We don't close manually here to avoid flicker.
        } else {
          console.warn("[ShelfPage] Book NOT found for code:", cleanedCode);
          setSearching(false);
          setScanError(`「${cleanedCode}」は本棚に登録されていません。`);
        }
      } catch (error) {
        console.error("[ShelfPage] Error checking book:", error);
        setSearching(false);
        setScanError(
          "書籍の確認中にエラーが発生しました。通信状況を確認してください。",
        );
      }
    },
    [router, searching, scanError],
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          みんなの本棚
        </h1>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
          {books.length} 冊
        </span>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-gray-900 p-5 rounded-2xl shadow-sm border border-indigo-100/50 dark:border-indigo-900/30 space-y-4">
        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
            <ScanLine size={18} />
          </div>
          <h2 className="font-bold text-sm">本をスキャンして詳細を表示</h2>
        </div>
        <button
          onClick={() => {
            setScanError(null);
            setScanning(true);
          }}
          className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <ScanLine size={20} />
          バーコードをスキャン
        </button>
      </div>

      {scanning && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center">
          <button
            onClick={() => {
              setScanning(false);
              setScanError(null);
            }}
            className="absolute top-6 right-6 p-3 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-md transition-colors"
          >
            <X size={24} />
          </button>
          <div className="w-full max-w-md px-4 flex flex-col items-center">
            <h2 className="text-white text-lg font-bold mb-4 text-center">
              {searching
                ? "詳細を確認中..."
                : scanError
                  ? scanError.includes("登録されていません")
                    ? "該当の本は登録されていません"
                    : "エラーが発生しました"
                  : "バーコードを読み取ってください"}
            </h2>
            <div className="relative w-full overflow-hidden rounded-2xl border-2 border-white/50 shadow-2xl">
              {!scanError && <Scanner onDetected={handleDetected} />}
              {(searching || scanError) && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 backdrop-blur-sm p-6 text-center">
                  {searching ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-white font-medium">{scanError}</p>
                      <button
                        onClick={() => setScanError(null)}
                        className="px-6 py-2 bg-white text-black rounded-full font-bold text-sm shadow-lg hover:bg-gray-100 transition-colors"
                      >
                        再試行
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {searching && (
              <div className="mt-4 px-4 py-2 bg-indigo-600/80 backdrop-blur-md rounded-lg border border-white/20 animate-pulse text-center">
                <p className="text-white text-sm font-bold">検索中...</p>
              </div>
            )}
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
        <div className="grid grid-cols-3 gap-3">
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
