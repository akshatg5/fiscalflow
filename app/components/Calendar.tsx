"use client";

import React, { useState, useEffect, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Transaction } from "@prisma/client";
import TransactionModal from "./TransactionModal";
import { Card } from "@/components/ui/card";
import { AlertCircle, ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CalendarProps {
  initialTransactions: Transaction[];
}

const Calendar: React.FC<CalendarProps> = ({ initialTransactions }) => {
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [dayTransactions, setDayTransactions] = useState<Transaction[]>([]);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [balanceToDate, setbalanceToDate] = useState(0);

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate monthly totals
  const monthlyTotals = useMemo(() => {
    const now = new Date();
    const income = transactions.reduce(
      (sum, t) => (t.type === "INCOME" ? sum + t.amount : sum),
      0
    );
    const expenses = transactions.reduce(
      (sum, t) => (t.type === "EXPENSE" ? sum + t.amount : sum),
      0
    );
    const balanceToDate = transactions.reduce((sum, t) => {
      const transactionDate = new Date(t.date);
      if (transactionDate <= now) {
        return t.type === "INCOME" ? sum + t.amount : sum - t.amount;
      }
      return sum;
    }, 0);
    const pendingIncome = transactions.reduce((sum, t) => {
      const transactionDate = new Date(t.date);
      if (t.type === "INCOME" && t.creditCycle && transactionDate > now) {
        const dueDate = new Date(
          transactionDate.getTime() + t.creditCycle * 24 * 60 * 60 * 1000
        );
        if (dueDate <= now) {
          return sum + t.amount;
        }
      }
      return sum;
    }, 0);
    setbalanceToDate(balanceToDate);
    return {
      income,
      expenses,
      balance: income - expenses,
      balanceToDate,
      pendingIncome,
    };
  }, [transactions]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      setTransactions(data);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  };

  const handleDateClick = (arg: any) => {
    const clickedDate = arg.date;
    const transactionsOnDay = transactions.filter(
      (t) => new Date(t.date).toDateString() === clickedDate.toDateString()
    );
    if (transactionsOnDay.length > 0) {
      setDayTransactions(transactionsOnDay);
      setIsDayModalOpen(true);
    } else {
      setSelectedDate(clickedDate);
      setIsModalOpen(true);
    }
  };

  const handleEventClick = (arg: any) => {
    setSelectedTransaction(arg.event.extendedProps as Transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
    setSelectedDate(null);
  };

  const handleOpenTransactionModal = (transaction: Transaction | null) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
    setIsDayModalOpen(false);
  };

  const handleSaveTransaction = async (transaction: Partial<Transaction>) => {
    try {
      if (selectedTransaction) {
        await fetch("/api/transactions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...transaction, id: selectedTransaction.id }),
        });
      } else {
        await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transaction),
        });
      }
      await fetchTransactions();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save transaction:", error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
      await fetchTransactions();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  };

  const events = transactions.map((transaction) => ({
    title: `${transaction.type === "EXPENSE" ? "🔴" : "🟢"} ${formatCurrency(
      transaction.amount
    )}`,
    date: transaction.date,
    extendedProps: transaction,
    backgroundColor: "transparent",
    borderColor: "transparent",
    textColor: transaction.type === "EXPENSE" ? "#ef4444" : "#10b981",
    className: "transaction-event",
  }));

  return (
    <Card className="p-4">
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-green-50">
          <div>
            <p className="text-sm text-green-600">Total Income</p>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(monthlyTotals.income)}
            </p>
          </div>
          <ArrowUpIcon className="h-8 w-8 text-green-500" />
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg bg-red-50">
          <div>
            <p className="text-sm text-red-600">Total Expenses</p>
            <p className="text-2xl font-bold text-red-700">
              {formatCurrency(monthlyTotals.expenses)}
            </p>
          </div>
          <ArrowDownIcon className="h-8 w-8 text-red-500" />
        </div>
        <div
          className={`flex items-center justify-between p-4 rounded-lg ${
            monthlyTotals.balance >= 0 ? "bg-blue-50" : "bg-orange-50"
          }`}
        >
          <div>
            <p
              className={`text-sm ${
                monthlyTotals.balance >= 0 ? "text-blue-600" : "text-orange-600"
              }`}
            >
              Balance
            </p>
            <p
              className={`text-2xl font-bold ${
                monthlyTotals.balance >= 0 ? "text-blue-700" : "text-orange-700"
              }`}
            >
              {formatCurrency(monthlyTotals.balance)}
            </p>
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
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50">
          <div>
            <p className="text-sm text-blue-600">Balance to Date</p>
            <p className="text-2xl font-bold text-blue-700">
              {formatCurrency(monthlyTotals.balanceToDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg bg-purple-50">
          <div>
            <p className="text-sm text-purple-600">Pending Income</p>
            <p className="text-2xl font-bold text-purple-700">
              {formatCurrency(monthlyTotals.pendingIncome)}
            </p>
          </div>
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
            display: none;
          }
          .fc-day-today .fc-daygrid-day-number::after {
            content: attr(data-balance);
            display: block;
            font-size: 0.75rem;
            color: #3b82f6;
            margin-top: 2px;
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
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth",
          }}
          buttonText={{
            today: "Today",
          }}
          dayCellClassNames={(arg) => {
            const isToday =
              arg.date.toDateString() === new Date().toDateString();
            return isToday ? "bg-blue-50 font-bold" : "";
          }}
          dayCellDidMount={(arg) => {
            const isToday =
              arg.date.toDateString() === new Date().toDateString();
            if (isToday && arg.el) {
              const dayNum = arg.el.querySelector(".fc-daygrid-day-number");
              if (dayNum) {
                dayNum.setAttribute(
                  "data-balance",
                  `Balance: ${formatCurrency(balanceToDate)}`
                );
              }
            }
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

      <Dialog open={isDayModalOpen} onOpenChange={setIsDayModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dayTransactions.length > 0
                ? `Transactions on ${new Date(
                    dayTransactions[0].date
                  ).toLocaleDateString()}`
                : "Transactions"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {dayTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex justify-between items-center p-2 border rounded cursor-pointer hover:bg-gray-100"
                onClick={() => handleOpenTransactionModal(transaction)}
              >
                <div>
                  <p className="font-semibold">{transaction.description}</p>
                  <p className="text-sm text-gray-500">
                    {transaction.category}
                  </p>
                </div>
                <p
                  className={`font-bold ${
                    transaction.type === "EXPENSE"
                      ? "text-red-500"
                      : "text-green-500"
                  }`}
                >
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            ))}
            <button
              className="w-full bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => handleOpenTransactionModal(null)}
            >
              Add New Transaction
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default Calendar;
