import { NextRequest, NextResponse } from "next/server"

const MONOBANK_ACCOUNT = process.env.MONOBANK_ACCOUNT
const MONOBANK_API_URL = `https://api.monobank.ua/personal/statement/${MONOBANK_ACCOUNT}`
const RATE_LIMIT = 60 // seconds

// Store the last request timestamp and response
let lastRequestTime = 0
let lastResponse: any = null
let lastResponseTime: number | null = null

export async function GET(request: NextRequest) {
  const token = process.env.MONOBANK_API_TOKEN

  if (!token) {
    return NextResponse.json(
      { error: "Monobank API token is not configured" },
      { status: 500 }
    )
  }

  // Check rate limit
  const now = Date.now()
  const timeSinceLastRequest = (now - lastRequestTime) / 1000

  if (timeSinceLastRequest < RATE_LIMIT) {
    // If we have cached data, return it with a flag
    if (lastResponse) {
      return NextResponse.json({
        data: lastResponse,
        cached: true,
        lastUpdated: lastResponseTime,
        retryAfter: Math.ceil(RATE_LIMIT - timeSinceLastRequest)
      })
    }

    return NextResponse.json(
      { 
        error: "Rate limit exceeded",
        retryAfter: Math.ceil(RATE_LIMIT - timeSinceLastRequest)
      },
      { status: 429 }
    )
  }

  try {
    // Get transactions for the last 30 days
    const from = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60
    const to = Math.floor(Date.now() / 1000)

    const response = await fetch(
      `${MONOBANK_API_URL}/${from}/${to}`,
      {
        headers: {
          "X-Token": token,
        },
      }
    )

    if (!response.ok) {
      // If the request fails but we have cached data, return it
      if (lastResponse) {
        return NextResponse.json({
          data: lastResponse,
          cached: true,
          lastUpdated: lastResponseTime,
          error: `Monobank API error: ${response.statusText}`
        })
      }
      throw new Error(`Monobank API error: ${response.statusText}`)
    }

    const data = await response.json()
    lastRequestTime = now
    lastResponse = data
    lastResponseTime = now


    return NextResponse.json({
      data,
      cached: false,
      lastUpdated: now
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    
    // If we have cached data, return it with the error
    if (lastResponse) {
      return NextResponse.json({
        data: lastResponse,
        cached: true,
        lastUpdated: lastResponseTime,
        error: "Failed to fetch new transactions"
      })
    }

    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    )
  }
} 