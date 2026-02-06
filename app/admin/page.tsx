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
  where,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Book, Loan, Review } from "@/types";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Trash2,
  ScanLine,
  X,
  Search,
  PlusCircle,
  Star,
  ChevronDown,
} from "lucide-react";

export default function AdminPage() {
  const [scanning, setScanning] = useState(false);
  const [isbn, setIsbn] = useState("");
  const [scannedBook, setScannedBook] = useState<Partial<Book> | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowedBooks, setBorrowedBooks] = useState<(Loan & { book: Book })[]>(
    [],
  );
  const [reviews, setReviews] = useState<(Review & { book: Book })[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    books: true,
    borrowed: true,
    reviews: true,
  });
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

  const fetchBorrowedBooks = useCallback(async () => {
    try {
      const q = query(collection(db, "loans"), where("returned", "==", false));
      const snapshot = await getDocs(q);

      const borrowedData = [];
      for (const d of snapshot.docs) {
        const loan = { id: d.id, ...d.data() } as Loan;
        const bookSnap = await getDoc(doc(db, "books", loan.book_id));
        if (bookSnap.exists()) {
          borrowedData.push({
            ...loan,
            book: { id: bookSnap.id, ...bookSnap.data() } as Book,
          });
        }
      }
      setBorrowedBooks(borrowedData);
    } catch (error) {
      console.error("Error fetching borrowed books:", error);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      const q = query(collection(db, "reviews"), orderBy("created_at", "desc"));
      const snapshot = await getDocs(q);

      const reviewsData = [];
      for (const d of snapshot.docs) {
        const review = { id: d.id, ...d.data() } as Review;
        const bookSnap = await getDoc(doc(db, "books", review.book_id));
        if (bookSnap.exists()) {
          reviewsData.push({
            ...review,
            book: { id: bookSnap.id, ...bookSnap.data() } as Book,
          });
        }
      }
      setReviews(reviewsData);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchBooks();
      fetchBorrowedBooks();
      fetchReviews();
    }
  }, [fetchBooks, fetchBorrowedBooks, fetchReviews, isAuthorized]);

  const fetchBookInfo = async (code: string) => {
    const cleanedCode = code.trim();
    if (!cleanedCode) return;

    setSearching(true);
    setScanError(null);
    setIsAlreadyRegistered(false);

    try {
      // First, check if already in the library
      const { getDoc, doc: getDocRef } = await import("firebase/firestore");
      const existingDoc = await getDoc(getDocRef(db, "books", cleanedCode));

      if (existingDoc.exists()) {
        setScanError(`この本は既に登録されています (ISBN: ${cleanedCode})。`);
        return;
      }

      const info = await getBookByISBN(cleanedCode);
      if (info) {
        setScannedBook({
          id: cleanedCode,
          ...info,
          status: "available",
        });
        setScanning(false);
      } else {
        setScanError(
          `ISBN「${cleanedCode}」に該当する書籍が見つかりませんでした。Google Books上の不備か、ISBN以外のバーコードをスキャンした可能性があります。`,
        );
      }
    } catch (error) {
      console.error("Error fetching book info:", error);
      setScanError("データの取得中にエラーが発生しました。");
    } finally {
      setSearching(false);
    }
  };

  const handleDetected = useCallback(
    async (code: string) => {
      if (searching || loading) return;

      if (code.startsWith("978") || code.startsWith("979")) {
        setIsbn(code);
        await fetchBookInfo(code);
      } else {
        // Ignore other barcodes but show a hint
        console.log("[Admin] Ignoring non-ISBN barcode:", code);
        setScanError(
          "それは本体価格などのコードです。上段の「978...」から始まるバーコードをスキャンしてください。",
        );
      }
    },
    [searching, loading],
  );

  const handleRegister = async () => {
    if (!scannedBook || !scannedBook.id) return;

    try {
      setLoading(true);
      await setDoc(doc(db, "books", scannedBook.id), scannedBook);
      alert("本を登録しました！");
      setScannedBook(null);
      setIsbn("");
      fetchBooks(); // Refresh list
    } catch (error) {
      console.error("Error registering book:", error);
      alert("登録に失敗しました。");
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

  const handleDeleteReview = async (
    reviewId: string,
    bookTitle: string,
    reviewerName: string,
  ) => {
    if (
      !window.confirm(
        `${reviewerName} さんの「${bookTitle}」へのレビューを削除してもよろしいですか？`,
      )
    )
      return;

    try {
      setLoading(true);
      await deleteDoc(doc(db, "reviews", reviewId));
      fetchReviews(); // Refresh list
      alert("レビューを削除しました。");
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("削除に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: "books" | "borrowed" | "reviews") => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsAuthorized(true);
        setAuthError("");
      } else {
        setAuthError("パスワードが正しくありません。");
      }
    } catch (error) {
      console.error("Login error:", error);
      setAuthError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
          管理者ログイン
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            placeholder="パスワードを入力"
            className="w-full border dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setAuthError("");
            }}
            required
            autoFocus
          />
          {authError && (
            <p className="text-red-500 text-sm font-medium animate-in fade-in slide-in-from-top-1">
              {authError}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold shadow hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "認証中..." : "ログイン"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          管理画面
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
            <PlusCircle size={18} />
          </div>
          <h2 className="font-bold text-lg">蔵書を新しく登録する</h2>
        </div>

        <button
          onClick={() => {
            setScanError(null);
            setScanning(true);
          }}
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <ScanLine size={20} />
          バーコードをスキャン
        </button>

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
                    : scanError?.includes("既に登録")
                      ? "登録済みの本です"
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

        <div className="relative flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800"></div>
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            または手動入力
          </span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800"></div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="ISBN番号を入力 (例: 978...)"
              className="w-full border dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-3 py-3 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500"
              value={isbn}
              onChange={(e) => {
                setIsbn(e.target.value);
                setScanError(null);
              }}
            />
          </div>
          <button
            onClick={() => fetchBookInfo(isbn)}
            disabled={!isbn || searching}
            className="bg-gray-900 dark:bg-gray-800 text-white px-6 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {searching ? "..." : "取得"}
          </button>
        </div>

        {scanError && !scanning && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl">
            <p className="text-red-600 dark:text-red-400 text-xs font-medium leading-relaxed">
              {scanError}
            </p>
          </div>
        )}
      </div>

      {scannedBook && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border-2 border-indigo-500/20 animate-in fade-in zoom-in duration-300">
          <div className="flex gap-5">
            {scannedBook.thumbnail && (
              <div className="relative w-24 h-32 flex-shrink-0 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
                <Image
                  src={scannedBook.thumbnail}
                  alt="Cover"
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 flex flex-col justify-center">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 leading-tight text-lg">
                {scannedBook.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {scannedBook.author}
              </p>
              <div className="mt-3 inline-flex items-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded uppercase tracking-wider">
                ISBN: {scannedBook.id}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setScannedBook(null)}
              className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              キャンセル
            </button>
            <button
              onClick={handleRegister}
              disabled={loading}
              className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "登録中..." : "この本を登録する"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
        <h2
          onClick={() => toggleSection("books")}
          className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -m-2 p-2 rounded-lg transition-colors"
        >
          <ChevronDown
            size={20}
            className={`transition-transform ${expandedSections.books ? "" : "-rotate-90"}`}
          />
          <span>登録済みの本</span>
          <span className="text-sm font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/80 px-2 py-0.5 rounded-full min-w-[2.5rem] text-center">
            {books.length}
          </span>
        </h2>
        {expandedSections.books && (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {books.map((book) => (
              <div
                key={book.id}
                className="py-4 flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {book.thumbnail && (
                    <div className="relative w-12 h-16 flex-shrink-0 bg-gray-50 dark:bg-gray-800 rounded overflow-hidden shadow-sm">
                      <Image
                        src={book.thumbnail}
                        alt={book.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                      {book.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {book.author}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(book.id, book.title)}
                  disabled={loading}
                  className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                  title="削除"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {books.length === 0 && (
              <p className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm italic">
                登録されている本はありません。
              </p>
            )}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
        <h2
          onClick={() => toggleSection("borrowed")}
          className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -m-2 p-2 rounded-lg transition-colors"
        >
          <ChevronDown
            size={20}
            className={`transition-transform ${expandedSections.borrowed ? "" : "-rotate-90"}`}
          />
          <span>貸出中の本</span>
          <span className="text-sm font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/80 px-2 py-0.5 rounded-full min-w-[2.5rem] text-center">
            {borrowedBooks.length}
          </span>
        </h2>
        {expandedSections.borrowed && (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {borrowedBooks.map((loan) => {
              const dueDate = loan.due_date.toDate();
              const startDate = loan.start_date.toDate();
              const today = new Date();
              const isOverdue = dueDate < today;
              const daysRemaining = Math.ceil(
                (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
              );

              return (
                <div
                  key={loan.id}
                  className="py-4 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {loan.book.thumbnail && (
                      <div className="relative w-12 h-16 flex-shrink-0 bg-gray-50 dark:bg-gray-800 rounded overflow-hidden shadow-sm">
                        <Image
                          src={loan.book.thumbnail}
                          alt={loan.book.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                        {loan.book.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {loan.book.author}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">借りた人:</span>{" "}
                          {loan.borrower_name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">貸出日:</span>{" "}
                          {startDate.toLocaleDateString("ja-JP")}
                        </p>
                        <p
                          className={`text-xs font-medium ${isOverdue ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"}`}
                        >
                          <span className="font-medium">返却期限:</span>{" "}
                          {dueDate.toLocaleDateString("ja-JP")}
                          {isOverdue ? (
                            <span className="ml-2 text-red-600 dark:text-red-400">
                              (期限切れ)
                            </span>
                          ) : (
                            <span className="ml-2 text-gray-500 dark:text-gray-400">
                              (残り{daysRemaining}日)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {borrowedBooks.length === 0 && (
              <p className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm italic">
                現在貸出中の本はありません。
              </p>
            )}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
        <h2
          onClick={() => toggleSection("reviews")}
          className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -m-2 p-2 rounded-lg transition-colors"
        >
          <ChevronDown
            size={20}
            className={`transition-transform ${expandedSections.reviews ? "" : "-rotate-90"}`}
          />
          <span>レビュー管理</span>
          <span className="text-sm font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/80 px-2 py-0.5 rounded-full min-w-[2.5rem] text-center">
            {reviews.length}
          </span>
        </h2>
        {expandedSections.reviews && (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {reviews.map((review) => {
              const postedDate = review.created_at.toDate();

              return (
                <div
                  key={review.id}
                  className="py-4 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                        {review.book.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={
                              i < review.rating
                                ? "text-yellow-500"
                                : "text-gray-300 dark:text-gray-600"
                            }
                            fill={i < review.rating ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {review.reviewer_name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {review.comment}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {postedDate.toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleDeleteReview(
                        review.id,
                        review.book.title,
                        review.reviewer_name,
                      )
                    }
                    disabled={loading}
                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all flex-shrink-0"
                    title="削除"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
            {reviews.length === 0 && (
              <p className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm italic">
                レビューはまだありません。
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
