"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  runTransaction,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Book, Loan } from "@/types";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

export default function ReturnPage() {
  const [loans, setLoans] = useState<(Loan & { book: Book })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("");
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const name = localStorage.getItem("mini-library-username");
    if (!name) {
      setLoading(false);
      return;
    }
    setUserName(name);

    const fetchData = async () => {
      try {
        const { getDoc, doc: getDocRef } = await import("firebase/firestore");
        const q = query(
          collection(db, "loans"),
          where("borrower_name", "==", name),
          where("returned", "==", false),
        );
        const snapshot = await getDocs(q);

        const loanData = [];
        for (const d of snapshot.docs) {
          const loan = { id: d.id, ...d.data() } as Loan;
          const bookSnap = await getDoc(getDocRef(db, "books", loan.book_id));
          if (bookSnap.exists()) {
            loanData.push({
              ...loan,
              book: { id: bookSnap.id, ...bookSnap.data() } as Book,
            });
          }
        }
        setLoans(loanData);
      } catch (error) {
        console.error("Error fetching loans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId) return;
    const loan = loans.find((l) => l.id === selectedLoanId);
    if (!loan) return;

    setSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const loanRef = doc(db, "loans", loan.id);
        const bookRef = doc(db, "books", loan.book_id);

        transaction.update(loanRef, { returned: true });
        transaction.update(bookRef, {
          status: "available",
          current_loan_id: null,
        });

        const reviewRef = doc(collection(db, "reviews"));
        transaction.set(reviewRef, {
          book_id: loan.book_id,
          reviewer_name: loan.borrower_name,
          rating,
          comment,
          created_at: Timestamp.now(),
        });
      });

      alert("本を返却しました。感想をありがとうございます！");
      router.push("/shelf");
    } catch (err) {
      console.error(err);
      alert("返却処理にエラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) {
    return <div className="p-10 text-center">読み込み中...</div>;
  }

  if (loading) {
    return <div className="p-10 text-center">貸出状況を確認中...</div>;
  }

  if (loans.length === 0) {
    return (
      <div className="p-6 md:p-10 text-center flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 break-keep">
          現在、借りている本は
          <br className="md:hidden" />
          ありません
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 break-keep">
          本棚から新しい本を
          <br className="md:hidden" />
          探してみませんか？
        </p>
        {userName && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-6 bg-gray-50 dark:bg-gray-800/50 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-800">
            ログイン名: {userName}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        本を返却する
      </h1>

      {!selectedLoanId ? (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            返却する本を選択してください：
          </p>
          {loans.map((loan) => (
            <div
              key={loan.id}
              onClick={() => setSelectedLoanId(loan.id)}
              className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-600 transition-colors"
            >
              <h3 className="font-bold text-gray-900 dark:text-gray-100">
                {loan.book.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                返却予定日:{" "}
                {loan.due_date?.toDate().toLocaleDateString() || "--/--/--"}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <form
          onSubmit={handleReturn}
          className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-5"
        >
          <div className="pb-2 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-tight">
              {loans.find((l) => l.id === selectedLoanId)?.book.title}
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              この本の感想を入力して返却を完了してください
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              感想と評価
            </label>
            <div className="flex gap-2 justify-center mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`focus:outline-none transition-transform active:scale-125 ${star <= rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                >
                  <Star
                    size={32}
                    fill={star <= rating ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>
            <textarea
              className="w-full border dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
              rows={3}
              placeholder="この本を読んでどう思いましたか？"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold shadow hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "返却中..." : "返却して感想を投稿"}
          </button>
        </form>
      )}
    </div>
  );
}
