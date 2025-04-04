export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string; // Will store base64 image string
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: number;
  members: string[];
  photoURL?: string; // Will store base64 image string
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  paidFor: SplitDetail[];
  date: number;
  category: string;
  receipt?: string; // Will store base64 image string
  notes?: string;
  createdAt: number;
}

export interface SplitDetail {
  userId: string;
  amount: number;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  date: number;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: number;
}

export interface Balance {
  userId: string;
  amount: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}
