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
      if (searching || scanError) return;

      const cleanedCode = code.trim();
      // Only process ISBNs
      if (cleanedCode.startsWith("978") || cleanedCode.startsWith("979")) {
        setSearching(true);
        setScanError(null);
        try {
          console.log("[ShelfPage] Checking book with ID:", cleanedCode);
          const bookDoc = await getDoc(doc(db, "books", cleanedCode));

          if (bookDoc.exists()) {
            console.log("[ShelfPage] Book found! Redirecting...");
            router.push(`/books/${cleanedCode}`);
          } else {
            console.warn("[ShelfPage] Book NOT found for code:", cleanedCode);
            setSearching(false);
            setScanError(`この本はまだ本棚に登録されていません。`);
          }
        } catch (error) {
          console.error("[ShelfPage] Error checking book:", error);
          setSearching(false);
          setScanError("通信エラーが発生しました。");
        }
      } else {
        // Hint for wrong barcode
        setScanError(
          "それは本体価格などのコードです。上段の「978...」から始まるバーコードをスキャンしてください。",
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
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overscroll-none touch-none">
          <button
            onClick={() => {
              setScanning(false);
              setScanError(null);
            }}
            className="absolute top-8 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-xl transition-all active:scale-90 z-[110]"
          >
            <X size={28} />
          </button>

          <div className="w-full max-w-md px-4 flex flex-col items-center">
            <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-500">
              <h2 className="text-white text-xl font-bold mb-2">
                {searching
                  ? "Google Booksで検索中..."
                  : scanError?.includes("登録されていません")
                    ? "未登録の本です"
                    : scanError
                      ? "エラーが発生しました"
                      : "バーコード(ISBN)を読み取る"}
              </h2>
              <p className="text-white/50 text-xs">
                枠内の赤い線をバーコードに合わせてください
              </p>
            </div>

            <div className="relative w-full aspect-[3/4] overflow-hidden rounded-3xl border border-white/20 shadow-2xl bg-gray-900">
              {!scanError && <Scanner onDetected={handleDetected} />}
              {(searching || scanError) && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 backdrop-blur-md p-8 text-center">
                  {searching ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500/30 border-t-indigo-500"></div>
                      <p className="text-white/80 font-bold animate-pulse">
                        情報を照合中
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-4 bg-red-500/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-red-400">
                        <X size={32} />
                      </div>
                      <p className="text-white font-medium text-sm leading-relaxed">
                        {scanError}
                      </p>
                      <button
                        onClick={() => setScanError(null)}
                        className="w-full py-4 bg-white text-black rounded-2xl font-bold shadow-xl hover:bg-gray-100 transition-all active:scale-[0.98]"
                      >
                        もう一度スキャンする
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="text-white/40 text-[10px] mt-10 text-center max-w-[280px] leading-relaxed">
              日本の書籍は2つバーコードが並んでいます。
              <br />
              <span className="text-indigo-400 font-bold">
                上段（978から始まるコード）
              </span>
              のみを枠内に入れてください。
            </p>
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
