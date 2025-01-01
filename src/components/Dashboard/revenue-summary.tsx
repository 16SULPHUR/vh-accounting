'use client'

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ReactNode } from 'react'

interface Invoice {
  cash: number
  upi: number
  credit: number
}

export function RevenueSummary({ data }: { data: Invoice[] }) {
  const totalCash = data.reduce((sum, item) => sum + item.cash, 0)
  const totalUPI = data.reduce((sum, item) => sum + item.upi, 0)
  const totalCredit = data.reduce((sum, item) => sum + item.credit, 0)

  const chartData = [
    { name: 'Cash', value: totalCash },
    { name: 'UPI', value: totalUPI },
    { name: 'Credit', value: totalCredit },
  ]

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28']

  return (
    <ChartContainer
      config={{
        Cash: {
          label: "Cash",
          color: COLORS[0],
        },
        UPI: {
          label: "UPI",
          color: COLORS[1],
        },
        Credit: {
          label: "Credit",
          color: COLORS[2],
        },
      }}
      className="h-[300px]"
    >
      <>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4">
          {chartData.map((entry, index) => (
            <div key={`legend-${index}`} className="flex items-center mt-2">
              <div className="w-4 h-4 mr-2" style={{ backgroundColor: COLORS[index] }}></div>
              <span>{entry.name}: ₹{entry.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </>
    </ChartContainer>
  )
}

