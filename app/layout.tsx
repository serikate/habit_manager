import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { HabitCompletionProvider } from '@/components/providers/HabitCompletionProvider'
import { LevelUpProvider } from '@/components/providers/LevelUpProvider'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: '習慣化×タスク管理アプリ',
  description: 'タスク管理と習慣化を組み合わせたアプリケーション',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className="light" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <HabitCompletionProvider>
            <LevelUpProvider>
              {children}
            </LevelUpProvider>
          </HabitCompletionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
