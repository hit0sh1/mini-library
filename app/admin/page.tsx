"use client";

import { useState, useCallback, useEffect } from "react";
import Scanner from "@/components/Scanner";
import { getBookByISBN } from "@/lib/googleBooks";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Book } from "@/types";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2 } from "lucide-react";

export default function AdminPage() {
  const [scanning, setScanning] = useState(false);
  const [isbn, setIsbn] = useState("");
  const [scannedBook, setScannedBook] = useState<Partial<Book> | null>(null);
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const router = useRouter();

  const fetchBooks = useCallback(async () => {
    try {
      const q = query(collection(db, "books"), orderBy("title"));
      const snapshot = await getDocs(q);
      const booksData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Book,
      );
      setBooks(booksData);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleDetected = useCallback(async (code: string) => {
    setScanning(false);
    setIsbn(code);
    await fetchBookInfo(code);
  }, []);

  const fetchBookInfo = async (code: string) => {
    setLoading(true);
    const info = await getBookByISBN(code);
    if (info) {
      setScannedBook({
        id: code,
        ...info,
        status: "available",
      });
    } else {
      alert("Book not found!");
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!scannedBook || !scannedBook.id) return;

    try {
      setLoading(true);
      await setDoc(doc(db, "books", scannedBook.id), scannedBook);
      alert("Book registered successfully!");
      setScannedBook(null);
      setIsbn("");
      fetchBooks(); // Refresh list
    } catch (error) {
      console.error("Error registering book:", error);
      alert("Failed to register book.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookId: string, title: string) => {
    if (!window.confirm(`「${title}」を削除してもよろしいですか？`)) return;

    try {
      setLoading(true);
      await deleteDoc(doc(db, "books", bookId));
      fetchBooks(); // Refresh list
    } catch (error) {
      console.error("Error deleting book:", error);
      alert("削除に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          管理画面
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
        <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100">
          蔵書を新しく登録する
        </h2>

        {scanning ? (
          <div>
            <Scanner onDetected={handleDetected} />
            <button
              onClick={() => setScanning(false)}
              className="mt-4 w-full py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium"
            >
              スキャンを中止
            </button>
          </div>
        ) : (
          <button
            onClick={() => setScanning(true)}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium shadow-md hover:bg-indigo-700 transition-colors"
          >
            バーコードを読み取る
          </button>
        )}

        <div className="relative flex items-center gap-2 mt-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            または手動入力
          </span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="ISBN番号を入力"
            className="flex-1 border dark:border-gray-700 bg-white dark:bg-gray-800 p-2 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
          />
          <button
            onClick={() => fetchBookInfo(isbn)}
            disabled={!isbn || loading}
            className="bg-gray-800 text-white px-4 rounded-lg text-sm disabled:opacity-50"
          >
            取得
          </button>
        </div>
      </div>

      {scannedBook && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-indigo-100 dark:border-indigo-900/50">
          <div className="flex gap-4">
            {scannedBook.thumbnail && (
              <div className="relative w-20 h-28 flex-shrink-0 bg-gray-50 dark:bg-gray-800 rounded overflow-hidden">
                <Image
                  src={scannedBook.thumbnail}
                  alt="Cover"
                  fill
                  className="object-cover rounded shadow-sm"
                />
              </div>
            )}
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 leading-tight">
                {scannedBook.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {scannedBook.author}
              </p>
            </div>
          </div>
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full mt-4 py-3 bg-green-600 text-white rounded-lg font-bold shadow-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? "登録中..." : "この本を登録する"}
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
        <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100">
          登録済みの本 ({books.length})
        </h2>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {books.map((book) => (
            <div
              key={book.id}
              className="py-3 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                {book.thumbnail && (
                  <div className="relative w-10 h-14 flex-shrink-0 bg-gray-50 dark:bg-gray-800 rounded overflow-hidden">
                    <Image
                      src={book.thumbnail}
                      alt={book.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                    {book.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {book.author}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(book.id, book.title)}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                title="削除"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {books.length === 0 && (
            <p className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
              登録されている本はありません。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
