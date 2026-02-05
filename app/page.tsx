import Link from "next/link";
import { BookOpen, Clock, Heart } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-10">
      <div className="text-center space-y-4">
        <div className="bg-indigo-100 dark:bg-indigo-900/30 w-20 h-20 mx-auto rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
          <BookOpen size={40} />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
          わずか{" "}
          <span className="text-indigo-600 dark:text-indigo-400">
            6分間の読書
          </span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto text-lg leading-relaxed">
          6分間の読書で、ストレスを
          <br className="sm:hidden" />
          <span className="font-bold text-gray-900 dark:text-gray-100">
            68%軽減
          </span>
          できると言われています。
        </p>
        <p className="text-indigo-600 dark:text-indigo-400 font-bold text-xl">
          少しだけ、本を開いてみませんか？
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full text-green-600 dark:text-green-400">
            <Heart size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 dark:text-gray-200">
              ストレス解消
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              音楽や散歩よりも効果的
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-blue-600 dark:text-blue-400">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 dark:text-gray-200">
              隙間時間に
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              たった6分でリフレッシュ
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-xs pt-4">
        <Link
          href="/shelf"
          className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl text-center shadow-lg transition-transform transform active:scale-95"
        >
          本棚を見る
        </Link>
        <p className="mt-4 text-center text-gray-400 text-sm">
          会員登録は不要です
        </p>
      </div>
    </div>
  );
}
