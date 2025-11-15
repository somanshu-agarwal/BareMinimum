// src/types/database.ts
export type Expense = {
  id: string
  user_id: string
  amount: number
  category: string
  payment_method: string
  merchant: string | null
  description: string | null
  date: string
  created_at: string
}

export type DashboardStats = {
  totalSpent: number
  monthlyBudget: number
  monthlyIncome: number
  savingsRate: number
  actualSavings: number
  topCategories: { category: string; amount: number }[]
  recentExpenses: Expense[]
  portfolio: any
}