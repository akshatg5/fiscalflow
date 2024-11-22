import './globals.css'
import { Inter } from 'next/font/google'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/pages/api/auth/[...nextauth]"
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Expense Tracker Calendar',
  description: 'Track your expenses and income with a calendar view',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-bold">FiscalFlow</Link>
            <div>
              {session ? (
                <>
                  <span className="mr-4">Welcome, {session.user?.name}</span>
                  <Link href="/api/auth/signout" className="bg-red-500 text-white px-4 py-2 rounded">Sign out</Link>
                </>
              ) : (
                <Link href="/api/auth/signin" className="bg-blue-500 text-white px-4 py-2 rounded">Sign in</Link>
              )}
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}

