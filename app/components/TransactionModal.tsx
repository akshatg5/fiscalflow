'use client'

import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Transaction } from '@prisma/client'

const schema = z.object({
  type: z.enum(['EXPENSE', 'INCOME']),
  amount: z.number().positive(),
  description: z.string().min(1),
  date: z.date(),
  category: z.string().min(1),
  isRecurring: z.boolean(),
  recurringFrequency: z.string().optional(),
})

type TransactionFormData = z.infer<typeof schema>

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (transaction: TransactionFormData) => void
  onDelete: (id: string) => void
  transaction: Transaction | null
  date: Date | null
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  transaction,
  date,
}) => {
  const { register, handleSubmit, control, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(schema),
    defaultValues: transaction || { date: date || new Date(), isRecurring: false },
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {transaction ? 'Edit Transaction' : 'Add Transaction'}
        </h2>
        <form onSubmit={handleSubmit(onSave)}>
          <div className="mb-4">
            <label className="block mb-2">Type</label>
            <select {...register('type')} className="w-full p-2 border rounded">
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-2">Amount</label>
            <input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} className="w-full p-2 border rounded" />
            {errors.amount && <p className="text-red-500">{errors.amount.message}</p>}
          </div>
          <div className="mb-4">
            <label className="block mb-2">Description</label>
            <input type="text" {...register('description')} className="w-full p-2 border rounded" />
            {errors.description && <p className="text-red-500">{errors.description.message}</p>}
          </div>
          <div className="mb-4">
            <label className="block mb-2">Date</label>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <input type="date" {...field} value={field.value.toISOString().substr(0, 10)} onChange={(e) => field.onChange(new Date(e.target.value))} className="w-full p-2 border rounded" />
              )}
            />
            {errors.date && <p className="text-red-500">{errors.date.message}</p>}
          </div>
          <div className="mb-4">
            <label className="block mb-2">Category</label>
            <input type="text" {...register('category')} className="w-full p-2 border rounded" />
            {errors.category && <p className="text-red-500">{errors.category.message}</p>}
          </div>
          <div className="mb-4">
            <label className="flex items-center">
              <input type="checkbox" {...register('isRecurring')} className="mr-2" />
              Is Recurring
            </label>
          </div>
          <div className="mb-4">
            <label className="block mb-2">Recurring Frequency</label>
            <input type="text" {...register('recurringFrequency')} className="w-full p-2 border rounded" />
          </div>
          <div className="flex justify-between">
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
              Save
            </button>
            {transaction && (
              <button type="button" onClick={() => onDelete(transaction.id)} className="bg-red-500 text-white px-4 py-2 rounded">
                Delete
              </button>
            )}
            <button type="button" onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TransactionModal

