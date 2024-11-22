"use client"

import React, { useState, useEffect, useMemo } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import { Transaction } from "@prisma/client"
import TransactionModal from "./TransactionModal"
import { Card } from "@/components/ui/card"
import { AlertCircle, ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CalendarProps {
  initialTransactions: Transaction[]
}

const Calendar: React.FC<CalendarProps> = ({ initialTransactions }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate monthly totals
  const monthlyTotals = useMemo(() => {
    const income = transactions.reduce((sum, t) => 
      t.type === 'INCOME' ? sum + t.amount : sum, 0
    )
    const expenses = transactions.reduce((sum, t) => 
      t.type === 'EXPENSE' ? sum + t.amount : sum, 0
    )
    return { income, expenses, balance: income - expenses }
  }, [transactions])

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/transactions")
      const data = await res.json()
      setTransactions(data)
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
    }
  }

  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.date)
    setIsModalOpen(true)
  }

  const handleEventClick = (arg: any) => {
    setSelectedTransaction(arg.event.extendedProps as Transaction)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedTransaction(null)
    setSelectedDate(null)
  }

  const handleSaveTransaction = async (transaction: Partial<Transaction>) => {
    try {
      if (selectedTransaction) {
        await fetch("/api/transactions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...transaction, id: selectedTransaction.id }),
        })
      } else {
        await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transaction),
        })
      }
      await fetchTransactions()
      handleCloseModal()
    } catch (error) {
      console.error("Failed to save transaction:", error)
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    try {
      await fetch(`/api/transactions?id=${id}`, { method: "DELETE" })
      await fetchTransactions()
      handleCloseModal()
    } catch (error) {
      console.error("Failed to delete transaction:", error)
    }
  }

  const events = transactions.map((transaction) => ({
    title: `${transaction.type}  ${transaction.type === 'EXPENSE' ? '🔴' : '🟢'} ${formatCurrency(transaction.amount)}`,
    date: transaction.date,
    extendedProps: transaction,
    backgroundColor: transaction.type === 'EXPENSE' ? '#ef4444' : '#10b981',
    borderColor: 'transparent',
    textColor: transaction.type === 'EXPENSE' ? '#ef4444' : '#10b981',
    className: 'transaction-event',
  }))

  return (
    <Card className="p-4">
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-green-50">
          <div>
            <p className="text-sm text-green-600">Total Income</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(monthlyTotals.income)}</p>
          </div>
          <ArrowUpIcon className="h-8 w-8 text-green-500" />
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg bg-red-50">
          <div>
            <p className="text-sm text-red-600">Total Expenses</p>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(monthlyTotals.expenses)}</p>
          </div>
          <ArrowDownIcon className="h-8 w-8 text-red-500" />
        </div>
        <div className={`flex items-center justify-between p-4 rounded-lg ${
          monthlyTotals.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'
        }`}>
          <div>
            <p className={`text-sm ${
              monthlyTotals.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`}>Balance</p>
            <p className={`text-2xl font-bold ${
              monthlyTotals.balance >= 0 ? 'text-blue-700' : 'text-orange-700'
            }`}>{formatCurrency(monthlyTotals.balance)}</p>
          </div>
          {monthlyTotals.balance < 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="h-8 w-8 text-orange-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Warning: Negative balance</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div className="w-full cursor-pointer max-w-6xl mx-auto">
        <style jsx global>{`
          .transaction-event {
            font-weight: 500;
            padding: 2px 4px;
            margin: 1px 0;
            border-radius: 4px;
          }
          .fc-event-title {
            padding: 0 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .fc-day-today {
            background-color: rgba(59, 130, 246, 0.05) !important;
          }
          .fc-day:hover {
            background-color: rgba(59, 130, 246, 0.05);
          }
          .fc-event-time {
          display : none
          }
        `}</style>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          aspectRatio={1.5}
          height="auto"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth'
          }}
          buttonText={{
            today: 'Today'
          }}
        />
      </div>

      {isModalOpen && (
        <TransactionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveTransaction}
          onDelete={handleDeleteTransaction}
          transaction={selectedTransaction}
          date={selectedDate}
        />
      )}
    </Card>
  )
}

export default Calendar

