import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/pages/api/auth/[...nextauth]"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    },
    orderBy: { date: 'asc' },
  })

  return NextResponse.json(transactions)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { type, amount, description, date, category, isRecurring, recurringFrequency } = body

  const transaction = await prisma.transaction.create({
    data: {
      userId: session.user.id,
      type,
      amount: parseFloat(amount),
      description,
      date: new Date(date),
      category,
      isRecurring,
      recurringFrequency,
      creditCycle: body.creditCycle ? parseInt(body.creditCycle) : null,
    },
  })

  return NextResponse.json(transaction)
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { id, type, amount, description, date, category, isRecurring, recurringFrequency } = body

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      type,
      amount: parseFloat(amount),
      description,
      date: new Date(date),
      category,
      isRecurring,
      recurringFrequency,
      creditCycle: body.creditCycle ? parseInt(body.creditCycle) : null,
    },
  })

  return NextResponse.json(transaction)
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing transaction ID' }, { status: 400 })
  }

  await prisma.transaction.delete({
    where: { id },
  })

  return NextResponse.json({ message: 'Transaction deleted successfully' })
}

