// src/app/page.tsx
import { expenseService } from '@/lib/supabase/client'
import { DashboardStats } from '@/types/database'

async function getDashboardData(): Promise<DashboardStats> {
  const testUserId = 'test-user-123'
  
  try {
    const expenses = await expenseService.getByUser(testUserId)
    const currentMonth = new Date().toISOString().slice(0, 7)
    
    const monthlyExpenses = expenses.filter(expense => 
      expense.date.startsWith(currentMonth)
    )

    const totalSpent = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const monthlyBudget = 50000
    
    const categoryMap = new Map()
    monthlyExpenses.forEach(expense => {
      const current = categoryMap.get(expense.category) || 0
      categoryMap.set(expense.category, current + expense.amount)
    })
    
    const topCategories = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    const savingsRate = monthlyBudget > 0 ? 
      Math.max(0, ((monthlyBudget - totalSpent) / monthlyBudget) * 100) : 0

    return {
      totalSpent,
      monthlyBudget,
      savingsRate,
      topCategories,
      recentExpenses: expenses.slice(0, 10)
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return {
      totalSpent: 0,
      monthlyBudget: 50000,
      savingsRate: 100,
      topCategories: [],
      recentExpenses: []
    }
  }
}

export default async function Dashboard() {
  const stats = await getDashboardData()
  const budgetUsage = (stats.totalSpent / stats.monthlyBudget) * 100
  const isOverBudget = stats.totalSpent > stats.monthlyBudget
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Financial Dashboard
        </h2>
        <p className="text-gray-600">
          {new Date().toLocaleDateString('en-IN', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </p>
      </section>

      {/* BUDGET ALERTS - SCARE FACTOR */}
      {isOverBudget && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">🚨</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-red-800">
                Budget Exceeded!
              </h3>
              <p className="text-red-700">
                You've spent ₹{(stats.totalSpent - stats.monthlyBudget).toLocaleString('en-IN')} over your monthly budget
              </p>
            </div>
          </div>
        </div>
      )}

      {budgetUsage >= 80 && !isOverBudget && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-yellow-800">
                Budget Warning
              </h3>
              <p className="text-yellow-700">
                You've used {budgetUsage.toFixed(0)}% of your monthly budget
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Monthly Spending"
          value={stats.totalSpent}
          format="currency"
          trend={isOverBudget ? 'danger' : budgetUsage >= 80 ? 'warning' : 'safe'}
          subtitle={`Budget: ₹${stats.monthlyBudget.toLocaleString('en-IN')}`}
        />
        
        <StatCard
          title="Savings Rate"
          value={stats.savingsRate}
          format="percentage"
          trend={stats.savingsRate > 20 ? 'positive' : 'warning'}
          subtitle="of monthly budget"
        />
        
        <StatCard
          title="Budget Used"
          value={budgetUsage}
          format="percentage"
          trend={isOverBudget ? 'danger' : budgetUsage >= 80 ? 'warning' : 'safe'}
          subtitle={`₹${stats.totalSpent.toLocaleString('en-IN')} / ₹${stats.monthlyBudget.toLocaleString('en-IN')}`}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Expenses */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Recent Expenses</h3>
            <span className="text-sm text-gray-500">
              {stats.recentExpenses.length} transactions
            </span>
          </div>
          
          <div className="space-y-4">
            {stats.recentExpenses.length > 0 ? (
              stats.recentExpenses.map((expense) => (
                <ExpenseItem key={expense.id} expense={expense} />
              ))
            ) : (
              <EmptyState 
                message="No expenses yet"
                action={{ label: 'Add your first expense', href: '/add-expense' }}
              />
            )}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Top Categories</h3>
          
          <div className="space-y-4">
            {stats.topCategories.length > 0 ? (
              stats.topCategories.map((category, index) => (
                <CategoryItem 
                  key={category.category} 
                  category={category} 
                  rank={index + 1}
                />
              ))
            ) : (
              <EmptyState 
                message="No spending data"
                action={{ label: 'Start tracking', href: '/add-expense' }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  )
}

// Keep all the same component functions from previous version:
// StatCard, ExpenseItem, CategoryItem, EmptyState, QuickActions
// (They work perfectly, no changes needed)

function StatCard({ 
  title, 
  value, 
  format, 
  trend, 
  subtitle 
}: {
  title: string
  value: number
  format: 'currency' | 'percentage'
  trend: 'positive' | 'warning' | 'danger' | 'safe'
  subtitle: string
}) {
  const formatValue = (val: number, fmt: string) => {
    if (fmt === 'currency') {
      return `₹${val.toLocaleString('en-IN')}`
    }
    if (fmt === 'percentage') {
      return `${val.toFixed(1)}%`
    }
    return val.toString()
  }

  const trendColors = {
    positive: 'text-green-600',
    warning: 'text-yellow-600', 
    danger: 'text-red-600',
    safe: 'text-blue-600'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${trendColors[trend]} mb-2`}>
        {formatValue(value, format)}
      </p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  )
}

function ExpenseItem({ expense }: { expense: any }) {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <span className="text-lg">{expense.category.split(' ')[0]}</span>
        </div>
        <div>
          <p className="font-medium text-gray-900">{expense.merchant || 'No merchant'}</p>
          <p className="text-sm text-gray-500">
            {new Date(expense.date).toLocaleDateString('en-IN')} • {expense.category}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900">₹{expense.amount.toLocaleString('en-IN')}</p>
        <p className="text-sm text-gray-500 capitalize">{expense.payment_method.toLowerCase()}</p>
      </div>
    </div>
  )
}

function CategoryItem({ category, rank }: { category: any; rank: number }) {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold
          ${rank === 1 ? 'bg-yellow-500' : 
            rank === 2 ? 'bg-gray-400' : 
            rank === 3 ? 'bg-amber-700' : 'bg-gray-300'}`}
        >
          {rank}
        </div>
        <div>
          <p className="font-medium text-gray-900">{category.category}</p>
        </div>
      </div>
      <p className="font-semibold text-gray-900">
        ₹{category.amount.toLocaleString('en-IN')}
      </p>
    </div>
  )
}

function EmptyState({ message, action }: { message: string; action: { label: string; href: string } }) {
  return (
    <div className="text-center py-8">
      <div className="text-gray-400 text-4xl mb-3">📊</div>
      <p className="text-gray-500 mb-4">{message}</p>
      <a 
        href={action.href}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        {action.label}
      </a>
    </div>
  )
}

function QuickActions() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold mb-2">Ready to optimize?</h3>
          <p className="text-blue-100">Track your expenses and build wealth faster</p>
        </div>
        <div className="flex gap-4">
          <a 
            href="/add-expense"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            ➕ Add Expense
          </a>
          <button className="bg-transparent border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
            📊 View Analytics
          </button>
        </div>
      </div>
    </div>
  )
}