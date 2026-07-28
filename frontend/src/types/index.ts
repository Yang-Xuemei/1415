export type TransactionType = 'income' | 'expense';

export interface UserProfile {
  id: string;
  username: string;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  date: string;
  type: TransactionType;
  category_id: string;
  note: string | null;
  created_at: string;
  updated_at: string;
  categories?: Category;
}

export interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface CategorySummary {
  category_id: string;
  category_name: string;
  total: number;
  percentage: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
