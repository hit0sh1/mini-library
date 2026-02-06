"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Book, Review, Loan } from "@/types";
import {
  BadgeCheck,
  Ban,
  Star,
  User,
  CalendarDays,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

export default function BookDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedName = localStorage.getItem("mini-library-username");
    if (savedName) {
      setReviewerName(savedName);
    }
  }, []);

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "books", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const bookData = { id: docSnap.id, ...docSnap.data() } as Book;
          setBook(bookData);

          // Fetch loan details if borrowed
          if (bookData.status === "borrowed" && bookData.current_loan_id) {
            const loanRef = doc(db, "loans", bookData.current_loan_id);
            const loanSnap = await getDoc(loanRef);
            if (loanSnap.exists()) {
              setLoan({ id: loanSnap.id, ...loanSnap.data() } as Loan);
            }
          }
        }

        // Fetch reviews
        const q = query(
          collection(db, "reviews"),
          where("book_id", "==", id),
          orderBy("created_at", "desc"),
        );
        const reviewSnap = await getDocs(q);
        const reviewsData = reviewSnap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Review,
        );
        setReviews(reviewsData);
      } catch (error) {
        console.error("Error fetching book:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !comment.trim()) {
      alert("お名前と感想を入力してください。");
      return;
    }

    setSubmitting(true);
    try {
      // Save name to localStorage
      localStorage.setItem("mini-library-username", reviewerName);

      // Create review
      await addDoc(collection(db, "reviews"), {
        book_id: id,
        reviewer_name: reviewerName,
        rating,
        comment,
        created_at: Timestamp.now(),
      });

      // Refresh reviews
      const q = query(
        collection(db, "reviews"),
        where("book_id", "==", id),
        orderBy("created_at", "desc"),
      );
      const reviewSnap = await getDocs(q);
      const reviewsData = reviewSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Review,
      );
      setReviews(reviewsData);

      // Reset form
      setComment("");
      setRating(5);
      alert("感想を投稿しました！ありがとうございます。");
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("感想の投稿に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!book) return <div className="text-center py-10">Book not found.</div>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
      >
        <ChevronLeft
          size={20}
          className="group-hover:-translate-x-0.5 transition-transform"
        />
        本棚に戻る
      </button>
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-6">
        <div className="relative w-full md:w-32 h-48 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          {book.thumbnail && (
            <Image
              src={book.thumbnail}
              alt={book.title}
              fill
              className="object-contain"
            />
          )}
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex flex-col gap-2">
            <div>
              {book.status === "available" ? (
                <span className="inline-flex bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-[10px] sm:text-xs px-2 py-0.5 rounded-full items-center gap-1 font-bold whitespace-nowrap uppercase tracking-wider">
                  <BadgeCheck size={12} /> 貸出可能
                </span>
              ) : (
                <span className="inline-flex bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-[10px] sm:text-xs px-2 py-0.5 rounded-full items-center gap-1 font-bold whitespace-nowrap uppercase tracking-wider">
                  <Ban size={12} /> 貸出中
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              {book.title}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            {book.author}
          </p>
          {book.donor_comment && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg text-sm text-indigo-800 dark:text-indigo-300 mt-2">
              <span className="font-bold block text-xs uppercase tracking-wider mb-1">
                寄贈者のコメント
              </span>
              "{book.donor_comment}"
            </div>
          )}

          {book.status === "borrowed" && loan && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-800 dark:text-red-300 mt-2 border border-red-100 dark:border-red-900/40">
              <div className="flex items-center gap-2 mb-1">
                <User size={14} className="text-red-500" />
                <span className="font-bold">
                  {loan.borrower_name} さんが借用中
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays size={14} className="text-red-500" />
                <span>
                  返却予定: {loan.due_date.toDate().toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          <div className="pt-4">
            {book.status === "available" ? (
              <Link
                href={`/loan?bookId=${book.id}&title=${encodeURIComponent(book.title)}`}
                className="block w-full text-center py-3 bg-indigo-600 text-white rounded-lg font-bold shadow hover:bg-indigo-700 transition"
              >
                本を借りる
              </Link>
            ) : (
              <button
                disabled
                className="w-full py-3 bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg font-bold cursor-not-allowed"
              >
                現在貸出中
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100">
          みんなの感想
        </h2>
        {reviews.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            感想はまだありません。
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-1 text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < review.rating ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                    <User size={10} />
                    <span>{review.reviewer_name || "匿名"} さん</span>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        )}

        {mounted && (
          <form onSubmit={handleReviewSubmit} className="mt-6 space-y-4">
            <h3 className="font-bold text-md text-gray-800 dark:text-gray-100">
              感想を書く
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                評価
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      size={28}
                      className={
                        star <= rating
                          ? "text-yellow-500"
                          : "text-gray-300 dark:text-gray-600"
                      }
                      fill={star <= rating ? "currentColor" : "none"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                お名前（部署名＋フルネーム）
              </label>
              <input
                type="text"
                required
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="例：開発部 山田太郎"
              />
              <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500">
                ※誰が書いたか分かるよう、部署名と氏名を併記してください。
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                感想
              </label>
              <textarea
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                placeholder="この本を読んだ感想を書いてください..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !reviewerName.trim() || !comment.trim()}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "投稿中..." : "感想を投稿"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
