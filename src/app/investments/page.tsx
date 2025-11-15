// src/app/investments/page.tsx
import { investmentService } from '@/lib/supabase/investments'
import Link from 'next/link'

async function getInvestmentsData() {
  const testUserId = 'test-user-123'
  
  try {
    const [investments, portfolio] = await Promise.all([
      investmentService.getByUser(testUserId),
      investmentService.getPortfolioSummary(testUserId)
    ])

    return { investments, portfolio }
  } catch (error) {
    console.error('Error fetching investments:', error)
    return { investments: [], portfolio: null }
  }
}

export default async function Investments() {
  const { investments, portfolio } = await getInvestmentsData()

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Investment Portfolio</h1>
          <p className="text-gray-600">Track and manage your wealth-building assets</p>
        </div>
        <Link 
          href="/add-investment"
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          + Add Investment
        </Link>
      </div>

      {/* Portfolio Summary */}
      {portfolio && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border">
            <p className="text-sm text-gray-600 mb-1">Total Invested</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{portfolio.totalInvested.toLocaleString('en-IN')}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl border">
            <p className="text-sm text-gray-600 mb-1">Current Value</p>
            <p className="text-2xl font-bold text-blue-600">
              ₹{portfolio.totalCurrentValue.toLocaleString('en-IN')}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl border">
            <p className="text-sm text-gray-600 mb-1">Total Returns</p>
            <p className={`text-2xl font-bold ${
              portfolio.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ₹{portfolio.totalReturn.toLocaleString('en-IN')}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl border">
            <p className="text-sm text-gray-600 mb-1">Return %</p>
            <p className={`text-2xl font-bold ${
              portfolio.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {portfolio.returnPercentage.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Investments List */}
      <div className="bg-white rounded-xl border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Your Investments</h2>
        </div>
        
        <div className="divide-y">
          {investments.length > 0 ? (
            investments.map((investment) => (
              <div key={investment.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">📈</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{investment.name}</h3>
                      <p className="text-sm text-gray-500">{investment.type}</p>
                      <p className="text-xs text-gray-400">
                        Started {new Date(investment.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      ₹{investment.current_value.toLocaleString('en-IN')}
                    </div>
                    <div className="text-sm text-gray-500">
                      Invested: ₹{investment.amount.toLocaleString('en-IN')}
                    </div>
                    <div className={`text-sm ${
                      investment.current_value >= investment.amount ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Returns: {(((investment.current_value - investment.amount) / investment.amount) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📈</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No investments yet</h3>
              <p className="text-gray-500 mb-6">Start building your wealth by adding your first investment</p>
              <Link 
                href="/add-investment"
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                + Add Your First Investment
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}