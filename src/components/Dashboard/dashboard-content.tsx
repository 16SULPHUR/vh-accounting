'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SalesChart } from './sales-chart'
import { TopProducts } from './top-products'
import { RecentSales } from './recent-sales'
import { RevenueSummary } from './revenue-summary'
import { CustomerInsights } from './customer-insights'
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { ProductAnalytics } from './product-analytics'
import { supabase } from '@/lib/supabase'

export interface Invoice {
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

export interface Product {
  id: string;
  name: string;
  cost: number;
  sellingPrice: number;
  supplier: string; // Add supplier field
}

export interface Supplier {
  id: string;
  name: string;
  code: number;
}

export function DashboardContent({ initialData }: DashboardContentProps) {
  const [timeFilter, setTimeFilter] = useState('today')
  const [data, setData] = useState<Invoice[]>(initialData)
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  })
  const [allproducts, setAllProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [shouldRefresh, setShouldRefresh] = useState(0);

  // Add a function to refresh products
  const refreshProducts = async () => {
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("id, name, cost, sellingPrice, supplier");

    if (productsError) {
      console.error("Error fetching products:", productsError);
    } else {
      setAllProducts(productsData);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, cost, sellingPrice, supplier");

      const { data: suppliersData, error: suppliersError } = await supabase
        .from("suppliers")
        .select("id, name, code");

      if (productsError) {
        console.error("Error fetching products:", productsError);
      } else {
        setAllProducts(productsData);
      }

      if (suppliersError) {
        console.error("Error fetching suppliers:", suppliersError);
      } else {
        setSuppliers(suppliersData);
      }
    };

    fetchData();
  }, []);

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

      case 'yesterday':
        filterDate.setDate(filterDate.getDate() - 1)
        filterDate.setHours(0, 0, 0, 0)
        now.setDate(now.getDate() - 1)
        now.setHours(23, 59, 59, 999)
        break

      case 'thisWeek':
        const firstDayOfWeek = now.getDate() - now.getDay()
        filterDate.setDate(firstDayOfWeek)
        filterDate.setHours(0, 0, 0, 0)
        break

      case 'thisMonth':
        filterDate.setDate(1)
        filterDate.setHours(0, 0, 0, 0)
        break

      case '7days':
        filterDate.setDate(filterDate.getDate() - 7)
        break

      case '30days':
        filterDate.setDate(filterDate.getDate() - 30)
        break

      case 'lastMonth':
        filterDate.setMonth(filterDate.getMonth() - 1)
        filterDate.setDate(1)
        filterDate.setHours(0, 0, 0, 0)
        now.setDate(0) // Last day of previous month
        now.setHours(23, 59, 59, 999)
        break

      case 'lastQuarter':
        const quarter = Math.floor(now.getMonth() / 3)
        filterDate.setMonth(quarter * 3 - 3)
        filterDate.setDate(1)
        filterDate.setHours(0, 0, 0, 0)
        now.setMonth(quarter * 3)
        now.setDate(0)
        now.setHours(23, 59, 59, 999)
        break

      case 'custom':
        if (dateRange.from && dateRange.to) {
          const fromDate = new Date(dateRange.from)
          const toDate = new Date(dateRange.to)
          toDate.setHours(23, 59, 59, 999) // Set to end of day

          const filteredData = initialData.filter(item => {
            const itemDate = new Date(item.date)
            return itemDate >= fromDate && itemDate <= toDate
          })
          setData(filteredData)
          return
        }
        break

      default:
        setData(initialData)
        return
    }

    const filteredData = initialData.filter(item => {
      const itemDate = new Date(item.date)
      return itemDate >= filterDate && itemDate <= now
    })
    setData(filteredData)
  }

  const handleFilterChange = (value: string) => {
    setTimeFilter(value)
    if (value !== 'custom') {
      setDateRange({ from: '', to: '' })
      filterData(value)
    }
  }

  const handleDateChange = (field: 'from' | 'to', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }))
  }

  const handleApplyDateRange = () => {
    if (dateRange.from && dateRange.to) {
      filterData('custom')
    }
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
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="lastQuarter">Last Quarter</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {timeFilter === 'custom' && (
            <div className="flex items-center space-x-2">
              <div className="flex flex-col">
                <label htmlFor="from-date" className="text-sm mb-1">From</label>
                <input
                  type="date"
                  id="from-date"
                  value={dateRange.from}
                  onChange={(e) => handleDateChange('from', e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm text-black"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="to-date" className="text-sm mb-1">To</label>
                <input
                  type="date"
                  id="to-date"
                  value={dateRange.to}
                  onChange={(e) => handleDateChange('to', e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm text-black"
                />
              </div>
              <Button
                onClick={handleApplyDateRange}
                className="mt-6"
                disabled={!dateRange.from || !dateRange.to}
              >
                Apply
              </Button>
            </div>
          )}
        </div>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="products">Profit Analysis</TabsTrigger>
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
            {/* Add more analytics components here */}
          </div>
        </TabsContent>
        <TabsContent value="products" className="space-y-4">
          <ProductAnalytics
            data={data}
            products={allproducts}
            suppliers={suppliers}
            onProductAdded={refreshProducts}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
