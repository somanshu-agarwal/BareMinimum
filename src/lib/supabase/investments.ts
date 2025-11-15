// src/lib/supabase/investments.ts
import { supabase } from './client'
import type { Investment, InvestmentType, PortfolioSummary } from '@/types/investments'

export const investmentService = {
  async create(investment: Omit<Investment, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('investments')
      .insert([investment])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getByUser(userId: string) {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) throw error
    return data as Investment[]
  },

  async getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
    const investments = await this.getByUser(userId)
    
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0)
    const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.current_value, 0)
    const totalReturn = totalCurrentValue - totalInvested
    const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0

    const allocation: Record<InvestmentType, number> = {} as Record<InvestmentType, number>
    investments.forEach(inv => {
      allocation[inv.type] = (allocation[inv.type] || 0) + inv.amount
    })

    return {
      totalInvested,
      totalCurrentValue,
      totalReturn,
      returnPercentage,
      allocation
    }
  }
}