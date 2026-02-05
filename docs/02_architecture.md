# アーキテクチャ設計

## 1. 技術スタック
- **Frontend**: Next.js (React)
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **Backend/DB**: Firebase Firestore
- **Hosting**: Vercel
- **Barcode Engine**: @ericblade/quagga2
- **External API**: Google Books API

## 2. システム構成図


## 3. 構成のポイント
- **Vercel + Firebase**: 高速なフロントエンド配信とスケーラブルなリアルタイムDBの組み合わせ。
- **PWA Strategy**: `@ducanh2912/next-pwa` を使用し、Service Workerによるオフライン対応とアセットキャッシュを実現。