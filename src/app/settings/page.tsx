// src/app/settings/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function Settings() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [income, setIncome] = useState('85000')
  const [wealthGoal, setWealthGoal] = useState('50000000') // 5Cr
  const [targetAge, setTargetAge] = useState('40')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // In a real app, save to database
    // For now, just show success
    setTimeout(() => {
      toast.success('Settings saved successfully!')
      setLoading(false)
      router.push('/')
    }, 1000)
  }

  const monthlySavings = parseInt(income) - 50000 // Assuming 50k expenses
  const yearsToGoal = monthlySavings > 0 ? Math.ceil(parseInt(wealthGoal) / (monthlySavings * 12)) : 0

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg border">
      <h1 className="text-2xl font-bold mb-6">Financial Settings</h1>
      
      <form onSubmit={handleSave} className="space-y-6">
        {/* Monthly Income */}
        <div>
          <label className="block text-sm font-medium mb-2">Monthly Income (₹)</label>
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="85000"
          />
          <p className="text-sm text-gray-500 mt-1">
            Used to calculate your real savings rate
          </p>
        </div>

        {/* Wealth Goal */}
        <div>
          <label className="block text-sm font-medium mb-2">Wealth Goal (₹)</label>
          <input
            type="number"
            value={wealthGoal}
            onChange={(e) => setWealthGoal(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="50000000"
          />
          <p className="text-sm text-gray-500 mt-1">
            Your target net worth (e.g., 5 Crore = 5,00,00,000)
          </p>
        </div>

        {/* Target Age */}
        <div>
          <label className="block text-sm font-medium mb-2">Target Age</label>
          <input
            type="number"
            value={targetAge}
            onChange={(e) => setTargetAge(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="40"
          />
          <p className="text-sm text-gray-500 mt-1">
            Age by which you want to achieve your wealth goal
          </p>
        </div>

        {/* Financial Health Check */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Financial Health Check</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Monthly Savings Potential:</span>
              <span className="font-semibold">
                ₹{monthlySavings.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Years to Goal:</span>
              <span className="font-semibold">
                {yearsToGoal} years
              </span>
            </div>
            <div className="flex justify-between">
              <span>Required Annual Return:</span>
              <span className="font-semibold">
                {yearsToGoal > 0 ? (Math.pow(parseInt(wealthGoal) / (monthlySavings * 12 * yearsToGoal), 1/yearsToGoal) - 1 * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
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
            disabled={loading}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}