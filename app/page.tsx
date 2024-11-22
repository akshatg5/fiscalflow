import { getServerSession } from "next-auth/next"
import { authOptions } from "@/pages/api/auth/[...nextauth]"
import prisma from "@/lib/prisma"
import Calendar from './components/Calendar'
import { redirect } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { AlertCircleIcon } from "lucide-react"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session?.user) session.user = session.user as { id: string, name?: string | null, email?: string | null, image?: string | null }

  if (!session) {
    redirect('/api/auth/signin')
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user?.id || '' },
    orderBy: { date: 'asc' },
  })

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-10">
      <div className="flex justify-between space-x-8">
      <h1 className="text-4xl font-bold mb-8">Expense Tracker Calendar</h1>
      <Card className="flex px-4 py-4 mb-2 space-x-2 ml-5 items-center">
          <AlertCircleIcon color="red" width={15} height={15}/>
          <div>
          <p className="text-xs">
          Click on any date to record an expense or income.
          </p>
          <p className="text-xs">
          Click on an existing transaction to edit it.
          </p>
          </div>
        </Card>
      </div>
      <Calendar initialTransactions={transactions} />
    </main>
  )
}

