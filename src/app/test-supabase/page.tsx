// src/app/test-supabase/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSupabase() {
  const [status, setStatus] = useState('Testing...')

  const testConnection = async () => {
    try {
      setStatus('Testing Supabase connection...')
      
      // Test basic query
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .limit(1)

      if (error) {
        setStatus(`Error: ${error.message}`)
        console.error('Full error:', error)
      } else {
        setStatus(`Success! Found ${data?.length || 0} transactions`)
      }
    } catch (error: any) {
      setStatus(`Exception: ${error.message}`)
      console.error('Test error:', error)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Supabase Test</h1>
      <button 
        onClick={testConnection}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-4"
      >
        Test Connection
      </button>
      <p className="text-gray-700">{status}</p>
    </div>
  )
}