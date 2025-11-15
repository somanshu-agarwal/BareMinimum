// src/types/investments.ts
export type InvestmentType = 
  | 'Equity Stocks' 
  | 'Mutual Funds & SIP'
  | 'NPS (Tier 1)'
  | 'NPS (Tier 2)'
  | 'EPF'
  | 'PPF'
  | 'Fixed Deposit'
  | 'Recurring Deposit'
  | 'Gold/Commodities'
  | 'Crypto/Digital'

export interface Investment {
  id: string
  user_id: string
  type: InvestmentType
  name: string
  amount: number
  current_value: number
  date: string
  expected_return: number
  notes?: string
  created_at: string
}

export interface PortfolioSummary {
  totalInvested: number
  totalCurrentValue: number
  totalReturn: number
  returnPercentage: number
  allocation: Record<InvestmentType, number>
}