"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Calendar } from "lucide-react";

function LoanFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = searchParams.get("bookId");
  const bookTitle = searchParams.get("title");

  const [name, setName] = useState("");
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedName = localStorage.getItem("mini-library-username");
    if (savedName) setName(savedName);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookId || !name) return;

    setLoading(true);
    try {
      // Save name for next time
      localStorage.setItem("mini-library-username", name);

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + days);

      await runTransaction(db, async (transaction) => {
        const bookRef = doc(db, "books", bookId);
        const bookDoc = await transaction.get(bookRef);

        if (!bookDoc.exists()) {
          throw "Book does not exist!";
        }

        if (bookDoc.data().status !== "available") {
          throw "Book is already borrowed!";
        }

        const newLoanRef = doc(collection(db, "loans"));

        transaction.set(newLoanRef, {
          book_id: bookId,
          borrower_name: name,
          start_date: Timestamp.now(),
          due_date: Timestamp.fromDate(dueDate),
          returned: false,
        });

        transaction.update(bookRef, {
          status: "borrowed",
          current_loan_id: newLoanRef.id,
        });
      });

      alert("読書を楽しんでください！ 📖");
      router.push("/shelf");
    } catch (error) {
      console.error("Loan failed:", error);
      alert("貸出処理に失敗しました。他の人が借りた可能性があります。");
    } finally {
      setLoading(false);
    }
  };

  if (!bookId)
    return (
      <div className="text-center py-10">エラー：本が指定されていません。</div>
    );

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        本を借りる
      </h1>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            本のタイトル
          </label>
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {bookTitle}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              お名前
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="あなたの名前を入力"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              貸出期間
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDays(7)}
                className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-colors ${days === 7 ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}
              >
                <span className="font-bold">1週間</span>
                <span className="text-xs">おすすめ</span>
              </button>
              <button
                type="button"
                onClick={() => setDays(14)}
                className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-colors ${days === 14 ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}
              >
                <span className="font-bold">2週間</span>
                <span className="text-xs">最大</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
              <Calendar size={12} /> 返却予定日:{" "}
              {mounted
                ? new Date(Date.now() + days * 86400000).toLocaleDateString()
                : "--/--/--"}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition active:scale-95 disabled:opacity-70"
          >
            {loading ? "処理中..." : "確定して借りる"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoanPage() {
  return (
    <Suspense fallback={<div className="text-center py-10">読み込み中...</div>}>
      <LoanFormContent />
    </Suspense>
  );
}
