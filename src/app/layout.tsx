// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import ToastProvider from '@/providers/ToastProvider'

export const metadata: Metadata = {
  title: 'BareMinimum - Build Wealth',
  description: 'Track expenses and build wealth',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <ToastProvider />
        <header className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">💸 BareMinimum</h1>
                <p className="text-gray-600">Build wealth by eliminating waste</p>
              </div>
              <nav className="flex gap-6">
                <a href="/" className="text-sm font-medium text-gray-700 hover:text-gray-900">Dashboard</a>
                <a href="/add-expense" className="text-sm font-medium text-gray-700 hover:text-gray-900">Add Expense</a>
                <a href="/investments" className="text-sm font-medium text-gray-700 hover:text-gray-900">Investments</a>
                <a href="/analytics" className="text-sm font-medium text-gray-700 hover:text-gray-900">Analytics</a>
                <a href="/settings" className="text-sm font-medium text-gray-700 hover:text-gray-900">Settings</a>
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}