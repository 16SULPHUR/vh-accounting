'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface Invoice {
  customerName: string
  total: number
}

export function CustomerInsights({ data }: { data: Invoice[] }) {
  const customerPurchases = data.reduce((acc: any, sale) => {
    if (!acc[sale.customerName]) {
      acc[sale.customerName] = { totalPurchases: 0, totalAmount: 0 }
    }
    acc[sale.customerName].totalPurchases++
    acc[sale.customerName].totalAmount += sale.total
    return acc
  }, {})

  const chartData = Object.entries(customerPurchases)
    .map(([name, data]: [string, any]) => ({
      name,
      purchases: data.totalPurchases,
      amount: data.totalAmount
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)

  return (
    <ChartContainer
      config={{
        purchases: {
          label: "Purchases",
          color: "hsl(var(--chart-1))",
        },
        amount: {
          label: "Amount",
          color: "hsl(var(--chart-2))",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar yAxisId="left" dataKey="purchases" fill="#fc0303" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="amount" fill="#fcba03" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

