# データベース設計 (Firestore)

## 1. `books` コレクション (蔵書データ)
| フィールド名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | string | ドキュメントID (ISBN推奨) |
| title | string | 書名 |
| author | string | 著者名 |
| thumbnail | string | 表紙画像URL |
| donor_comment| string | 寄贈者のコメント |
| status | string | 'available' or 'borrowed' |
| current_loan_id| string | 現在の貸出ID (紐付け用) |

## 2. `loans` コレクション (貸出履歴)
| フィールド名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | string | ドキュメントID |
| book_id | string | 対象本のID |
| borrower_name | string | 借用者名 (LocalStorageから取得) |
| start_date | timestamp| 貸出開始日 |
| due_date | timestamp| 返却予定日 |
| returned | boolean | 返却済みフラグ |

## 3. `reviews` コレクション
| フィールド名 | 型 | 説明 |
| :--- | :--- | :--- |
| book_id | string | 対象本のID |
| rating | number | 1-5の評価 |
| comment | string | 感想 |
| created_at | timestamp| 投稿日時 |