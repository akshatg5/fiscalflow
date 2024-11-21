'use client'

import React, { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Transaction } from '@prisma/client'
import TransactionModal from './TransactionModal'

interface CalendarProps {
  initialTransactions: Transaction[]
}

const Calendar: React.FC<CalendarProps> = ({ initialTransactions }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    const res = await fetch('/api/transactions')
    const data = await res.json()
    setTransactions(data)
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
    if (selectedTransaction) {
      // Update existing transaction
      await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...transaction, id: selectedTransaction.id }),
      })
    } else {
      // Create new transaction
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      })
    }
    fetchTransactions()
    handleCloseModal()
  }

  const handleDeleteTransaction = async (id: string) => {
    await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
    fetchTransactions()
    handleCloseModal()
  }

  const events = transactions.map(transaction => ({
    title: `${transaction.type}: $${transaction.amount}`,
    date: transaction.date,
    extendedProps: transaction,
    backgroundColor: transaction.type === 'EXPENSE' ? '#f87171' : '#34d399',
  }))

  return (
    <div>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
      />
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
    </div>
  )
}

export default Calendar

