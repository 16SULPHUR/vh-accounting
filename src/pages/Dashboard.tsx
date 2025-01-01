import { Suspense, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DashboardContent } from '@/components/Dashboard/dashboard-content'

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

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getInvoices() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .order('date', { ascending: false });

        if (error) {
          throw error;
        }

        setInvoices(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
        console.error('Error fetching invoices:', err);
      } finally {
        setIsLoading(false);
      }
    }

    getInvoices();
  }, []);

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (isLoading) {
    return <div className="p-4">Loading invoices...</div>;
  }

  return <DashboardContent initialData={invoices} />;
}