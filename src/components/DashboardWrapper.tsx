// import Dashboard, { getInvoices } from '@/pages/Dashboard'
import { useEffect, useState } from 'react'

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

export function DashboardWrapper() {
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    async function fetchInvoices() {
    //   const data = await getInvoices()
    //   setInvoices(data)
    }
    fetchInvoices()
  }, [])

//   return <Dashboard initialData={invoices} />
}

