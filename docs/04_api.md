# API設計

## 1. 外部API連携 (Google Books API)
- **Endpoint**: `https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}`
- **用途**: ISBNスキャン後の書籍メタデータ（タイトル、著者、画像）取得。

## 2. フロントエンド処理 (Client-side SDK)
Firebase SDKを使い、以下の処理を直接実行（セキュリティルールで制御）。
- `getBookList`: `books` 全件取得（本棚表示）。
- `requestBorrow`: `loans` への追加 ＋ `books` のstatus更新（トランザクション処理）。
- `returnBook`: `loans` の更新 ＋ `reviews` への追加。

## 3. 管理者API (Serverless Functions / Next.js API Routes)
- `deleteBook`: 特定のシークレットキーを持つリクエストのみ、Firestoreのドキュメントを削除。