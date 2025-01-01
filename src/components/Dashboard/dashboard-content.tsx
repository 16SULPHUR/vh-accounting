'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SalesChart } from './sales-chart'
import { TopProducts } from './top-products'
import { RecentSales } from './recent-sales'
import { RevenueSummary } from './revenue-summary'
import { CustomerInsights } from './customer-insights'

interface Invoice {
  id: number
  date: string
  customerName: string
  customerNumber: string
  products: string
  total: number
  note: string
  cash: number
  upi: number
  credit: number
}

interface DashboardContentProps {
  initialData: Invoice[]
}

export function DashboardContent({ initialData }: DashboardContentProps) {
  const [timeFilter, setTimeFilter] = useState('today')
  const [data, setData] = useState<Invoice[]>(initialData)

  useEffect(() => {
    filterData('today')
  }, [initialData])

  // Function to filter data based on time period
  const filterData = (filter: string) => {
    const now = new Date()
    const filterDate = new Date()

    switch (filter) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0)
        break
      case '7days':
        filterDate.setDate(filterDate.getDate() - 7)
        break
      case '30days':
        filterDate.setDate(filterDate.getDate() - 30)
        break
      default:
        setData(initialData)
        return
    }

    const filteredData = initialData.filter(item => new Date(item.date) >= filterDate && new Date(item.date) <= now)
    setData(filteredData)
  }

  const handleFilterChange = (value: string) => {
    setTimeFilter(value)
    filterData(value)
  }

  // Calculate total sales
  const totalSales = data.reduce((sum, item) => sum + item.total, 0)

  // Calculate average sale
  const averageSale = totalSales / data.length || 0

  // Calculate total units sold
  const totalUnitsSold = data.reduce((sum, item) => {
    const products = JSON.parse(item.products)
    return sum + products.reduce((productSum: number, product: any) => productSum + product.quantity, 0)
  }, 0)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Select value={timeFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalSales.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Sale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{averageSale.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  +10.5% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUnitsSold}</div>
                <p className="text-xs text-muted-foreground">
                  +15.2% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.length}</div>
                <p className="text-xs text-muted-foreground">
                  +7.3% from last month
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <SalesChart data={data} />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>
                  Top 5 best selling products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TopProducts data={data} />
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>
                  You made {data.length} sales this period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentSales data={data} />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Revenue Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueSummary data={data} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Customer Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerInsights data={data} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

