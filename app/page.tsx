"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Transaction {
  id: string
  time: number
  description: string
  mcc: number
  hold: boolean
  amount: number
  operationAmount: number
  currencyCode: number
  commissionRate: number
  cashbackAmount: number
  balance: number
  comment: string
  receiptId: string
  invoiceId: string
  counterEdrpou: string
  counterIban: string
}

interface ApiResponse {
  data: Transaction[]
  cached: boolean
  lastUpdated: number
  error?: string
  retryAfter?: number
}

const COOLDOWN_TIME = 60 // seconds

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const [isCached, setIsCached] = useState(false)

  const currentBalance = transactions.length > 0 ? transactions[0].balance / 100 : 0

  const fetchTransactions = async () => {
    if (cooldown > 0) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/transactions")
      const data: ApiResponse = await response.json()

      if (!response.ok && !data.cached) {
        if (response.status === 429) {
          setCooldown(data.retryAfter || COOLDOWN_TIME)
          throw new Error(`Перевищено ліміт запитів. Спробуйте через ${data.retryAfter} секунд.`)
        }
        throw new Error(data.error || "Помилка отримання транзакцій")
      }

      setTransactions(data.data)
      setLastUpdateTime(new Date(data.lastUpdated))
      setIsCached(data.cached)
      
      if (data.cached) {
        setCooldown(data.retryAfter || COOLDOWN_TIME)
      } else {
        setError("")
        setCooldown(COOLDOWN_TIME)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Сталася помилка")
    } finally {
      setLoading(false)
    }
  }

  // Fetch transactions when component mounts
  useEffect(() => {
    fetchTransactions()
  }, [])

  // Handle cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldown])

  return (
    <main className="container mx-auto p-4">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">Транзакції Monobank</h1>
            {transactions.length > 0 && (
              <p className="text-2xl font-semibold mt-2">
                Баланс: <span className="text-green-500">{currentBalance.toLocaleString('uk-UA')} ₴</span>
              </p>
            )}
          </div>
          {lastUpdateTime && (
            <p className="text-sm text-muted-foreground">
              Останнє оновлення: {format(lastUpdateTime, "PPpp", { locale: uk })}
            </p>
          )}
        </div>
        <div className="flex gap-4 items-center">
          <Button 
            onClick={fetchTransactions} 
            disabled={loading || cooldown > 0}
            className="relative"
          >
            {loading ? "Завантаження..." : cooldown > 0 ? `Оновити через ${cooldown}с` : "Оновити транзакції"}
            {cooldown > 0 && (
              <div 
                className="absolute bottom-0 left-0 h-1 bg-primary/20 transition-all duration-1000"
                style={{ width: `${(cooldown / COOLDOWN_TIME) * 100}%` }}
              />
            )}
          </Button>
        </div>
        {error && (
          <p className={`mt-2 ${isCached ? "text-yellow-500" : "text-red-500"}`}>
            {error}
          </p>
        )}
      </div>

      <div className="grid gap-4">
        {transactions.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                {loading ? "Завантаження транзакцій..." : "Транзакції не знайдено"}
              </p>
            </CardContent>
          </Card>
        ) : (
          transactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <span>{transaction.description}</span>
                  <span className={transaction.amount > 0 ? "text-green-500" : "text-red-500"}>
                    {transaction.amount / 100} ₴
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>Дата: {format(transaction.time * 1000, "PPpp", { locale: uk })}</div>
                  <div>Баланс: {transaction.balance / 100} ₴</div>
                  {transaction.cashbackAmount > 0 && (
                    <div>Кешбек: {transaction.cashbackAmount / 100} ₴</div>
                  )}
                  {transaction.comment && <div>Коментар: {transaction.comment}</div>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </main>
  )
} 