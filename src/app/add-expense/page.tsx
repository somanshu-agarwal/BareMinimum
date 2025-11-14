// app/add-expense/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddExpense() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    paymentMethod: 'UPI',
    merchant: '',
    description: ''
  })

  const categories = [
    '🥦 Groceries', '🍔 Food Delivery', '🚗 Transportation', 
    '💡 Bills', '🏠 Rent', '📈 Investments', '💰 Savings',
    '🎮 Entertainment', '👕 Personal', '🏥 Health', '✈️ Travel'
  ]

  const paymentMethods = ['UPI', 'Cash', 'Netbanking', 'Card']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For now, just go back to dashboard
    // We'll add Supabase integration next
    router.push('/')
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg border border-gray-200">
      <h1 className="text-2xl font-bold mb-6">Add Expense</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (₹)
          </label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Category - Tapping Friendly! */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setFormData({...formData, category})}
                className={`p-3 border rounded-lg text-center text-sm ${
                  formData.category === category 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method - Also Tapping Friendly */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setFormData({...formData, paymentMethod: method})}
                className={`p-3 border rounded-lg text-center ${
                  formData.paymentMethod === method 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Merchant */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Merchant (e.g., Blinkit, Zomato)
          </label>
          <input
            type="text"
            value={formData.merchant}
            onChange={(e) => setFormData({...formData, merchant: e.target.value})}
            placeholder="Where did you spend?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="What was this for?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Add Expense
          </button>
        </div>
      </form>
    </div>
  )
}