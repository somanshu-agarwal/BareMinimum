// src/app/add-expense/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { ExpenseSchema, type ExpenseFormData } from '@/lib/validation'

const CATEGORIES = [
  '🥦 Groceries', '🍔 Food Delivery', '🚗 Transportation', 
  '💡 Bills', '🏠 Rent', '📈 Investments', '💰 Savings',
  '🎮 Entertainment', '👕 Personal', '🏥 Health', '✈️ Travel',
  '❓ Miscellaneous'
] as const

const PAYMENT_METHODS = ['UPI', 'Cash', 'Netbanking', 'Card'] as const

export default function AddExpense() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    amount: '',
    category: '',
    paymentMethod: 'UPI' as const,
    merchant: '',
    description: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validate form data
    const validationResult = ExpenseSchema.safeParse({
      amount: parseFloat(form.amount),
      category: form.category,
      paymentMethod: form.paymentMethod,
      merchant: form.merchant || undefined,
      description: form.description || undefined
    })

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {}
      validationResult.error.issues.forEach(issue => {
        fieldErrors[issue.path[0]] = issue.message
      })
      setErrors(fieldErrors)
      toast.error('Please fix the errors in the form')
      return
    }

    setLoading(true)
    const toastId = toast.loading('Adding expense...')
    
    try {
      const testUserId = 'test-user-123'
      const expenseData = validationResult.data

      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          user_id: testUserId,
          amount: expenseData.amount,
          category: expenseData.category,
          payment_method: expenseData.paymentMethod,
          merchant: expenseData.merchant || null,
          description: expenseData.description || null,
          date: new Date().toISOString()
        }])
        .select()

      if (error) throw error

      toast.success('Expense added successfully!', { id: toastId })
      
      // Reset form
      setForm({
        amount: '',
        category: '',
        paymentMethod: 'UPI',
        merchant: '',
        description: ''
      })
      
      // Redirect with cache invalidation
      setTimeout(() => {
        router.push('/')
        router.refresh() // Refresh server components
      }, 1000)

    } catch (error: any) {
      console.error('Error adding expense:', error)
      toast.error(`Failed to add expense: ${error.message}`, { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  const updateForm = (updates: Partial<typeof form>) => {
    setForm(prev => ({ ...prev, ...updates }))
    // Clear errors when user starts typing
    if (Object.keys(errors).length > 0) {
      setErrors({})
    }
  }

  const autoSuggestCategory = (merchant: string) => {
    const m = merchant.toLowerCase()
    if (m.includes('blinkit')) return '🥦 Groceries'
    if (m.includes('zomato') || m.includes('swiggy')) return '🍔 Food Delivery'
    if (m.includes('uber') || m.includes('ola')) return '🚗 Transportation'
    return ''
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg border">
      <h1 className="text-2xl font-bold mb-6">Add Expense</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-1">Amount (₹)</label>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => updateForm({ amount: e.target.value })}
            placeholder="0.00"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
            required
          />
          {errors.amount && (
            <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Category {form.category && `· ${form.category.replace(/[^a-zA-Z\s]/g, '')}`}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => updateForm({ category: cat })}
                className={`p-3 border rounded-lg text-sm transition-colors ${
                  form.category === cat 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">{errors.category}</p>
          )}
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium mb-2">Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => updateForm({ paymentMethod: method })}
                className={`p-3 border rounded-lg transition-colors ${
                  form.paymentMethod === method 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Merchant */}
        <div>
          <label className="block text-sm font-medium mb-1">Merchant</label>
          <input
            type="text"
            value={form.merchant}
            onChange={(e) => {
              const merchant = e.target.value
              const category = autoSuggestCategory(merchant) || form.category
              updateForm({ merchant, category })
            }}
            placeholder="Blinkit, Zomato, etc."
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.merchant ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {errors.merchant && (
            <p className="text-red-500 text-sm mt-1">{errors.merchant}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description (Optional)</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => updateForm({ description: e.target.value })}
            placeholder="What was this for?"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !form.amount || !form.category}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Adding...' : 'Add Expense'}
          </button>
        </div>
      </form>
    </div>
  )
}