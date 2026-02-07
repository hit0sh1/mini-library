import { Timestamp } from "firebase/firestore";

export interface Book {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
  description?: string;
  donor_comment?: string;
  status: 'available' | 'borrowed';
  current_loan_id?: string;
}

export interface Loan {
  id: string;
  book_id: string;
  borrower_name: string;
  start_date: Timestamp;
  due_date: Timestamp;
  returned: boolean;
}

export interface Review {
  id: string;
  book_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: Timestamp;
}
