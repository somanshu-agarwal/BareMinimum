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
      <body>
        <ToastProvider />
        <header className="border-b border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">💸 BareMinimum</h1>
            <p className="text-gray-600">Build wealth by eliminating waste</p>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}