import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { PageHeader, PageHeaderHeading } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CashbookForm } from "@/components/cashbook-form"
import { supabase } from '@/lib/supabase'
import { LoginForm } from '@/components/login-form'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronRight, MoreVertical, PenLine, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import VoucherTypeDialog from '@/components/voucher-type-dialog'

interface CashbookEntry {
  id: number
  created_at: string
  party_name: string
  remarks: string
  amount: number
  voucher_type: 'receipt' | 'payment'
}

interface DailyEntries {
  date: string
  entries: CashbookEntry[]
  openingBalance: number
  closingBalance: number
  totalReceipt: number
  totalPayment: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const [dailyEntries, setDailyEntries] = useState<DailyEntries[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isVoucherTypeDialogOpen, setIsVoucherTypeDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<CashbookEntry | null>(null)
  const [selectedVoucherType, setSelectedVoucherType] = useState<'receipt' | 'payment' | null>(null)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user) {
      fetchEntries()
    }
  }, [user])

  useEffect(() => {
    if (!isAddDialogOpen) {
      setEditingEntry(null)
    }
  }, [isAddDialogOpen])

  async function fetchEntries() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('cashbook')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      const entriesByDate: { [key: string]: CashbookEntry[] } = {}
      data?.forEach(entry => {
        const date = format(parseISO(entry.created_at), 'yyyy-MM-dd')
        if (!entriesByDate[date]) {
          entriesByDate[date] = []
        }
        entriesByDate[date].push(entry)
      })

      let runningBalance = 0
      const dailyEntriesArray: DailyEntries[] = Object.entries(entriesByDate)
        .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
        .map(([date, entries]) => {
          const openingBalance = runningBalance
          const totalReceipt = entries.reduce((total, entry) =>
            entry.voucher_type === 'receipt' ? total + entry.amount : total, 0)
          const totalPayment = entries.reduce((total, entry) =>
            entry.voucher_type === 'payment' ? total + entry.amount : total, 0)
          const closingBalance = openingBalance + totalReceipt - totalPayment
          runningBalance = closingBalance
          return { date, entries, openingBalance, closingBalance, totalReceipt, totalPayment }
        })

      setDailyEntries(dailyEntriesArray)
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function deleteEntry(id: number) {
    try {
      await supabase.from('cashbook').delete().eq('id', id)
      fetchEntries()
    } catch (error) {
      console.error('Error deleting entry:', error)
    }
  }

  function handleVoucherTypeSelection(type: 'receipt' | 'payment') {
    setSelectedVoucherType(type)
    setIsVoucherTypeDialogOpen(false)
    setIsAddDialogOpen(true)
  }



  function toggleDateExpansion(date: string) {
    setExpandedDates(prev => {
      const newSet = new Set(prev)
      if (newSet.has(date)) {
        newSet.delete(date)
      } else {
        newSet.add(date)
      }
      return newSet
    })
  }

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>Log in to access the Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* <PageHeader className="pb-8">
        <PageHeaderHeading className="text-3xl font-bold tracking-tight">Cashbook</PageHeaderHeading>
      </PageHeader> */}
      <Card className="shadow-none mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-3xl font-bold tracking-tight">Cashbook</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Manage your cashbook entries here.</CardDescription>
        </CardHeader>
        <CardContent>
          <VoucherTypeDialog
            isOpen={isVoucherTypeDialogOpen}
            onOpenChange={setIsVoucherTypeDialogOpen}
            onSelect={(value) => handleVoucherTypeSelection(value as 'receipt' | 'payment')}
          />
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Cashbook Entry</DialogTitle>
              </DialogHeader>
              <CashbookForm
                onSuccess={() => {
                  setIsAddDialogOpen(false)
                  fetchEntries()
                }}
                initialData={{
                  type: 'insert',
                  voucher_type: selectedVoucherType!
                }}
                voucherType={selectedVoucherType!}
              />
            </DialogContent>
          </Dialog>
          {isLoading ? (
            <p>Loading entries...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>V. No</TableHead>
                  <TableHead>Party Name</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className='font-mono text-lg'>
                {dailyEntries.map(({ date, entries, openingBalance, closingBalance, totalReceipt, totalPayment }, index) => {
                  const isExpanded = expandedDates.has(date)
                  const cashSalesEntries = entries.filter(entry => entry.party_name === 'CASH SALES')
                  const otherEntries = entries.filter(entry => entry.party_name !== 'CASH SALES')
                  let runningBalance = openingBalance

                  // Calculate the total effect of cash sales on the balance
                  const cashSalesTotal = cashSalesEntries.reduce((sum, entry) =>
                    sum + (entry.voucher_type === 'receipt' ? entry.amount : -entry.amount), 0
                  )

                  return (
                    <>
                      {index === 0 && (
                        <TableRow className="border-t-2 border-primary">
                          <TableCell colSpan={4} className="font-semibold">Opening Balance</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell colSpan={2}>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(openingBalance)}</TableCell>
                        </TableRow>
                      )}
                      {cashSalesEntries.length > 0 && (
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleDateExpansion(date)}
                        >
                          <TableCell>
                            <span className="inline-flex items-center">
                              {isExpanded ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                              {format(parseISO(date), 'dd/MM/yy')}
                            </span>
                          </TableCell>
                          <TableCell colSpan={3}>Cash Sales ({cashSalesEntries.length} entries)</TableCell>
                          <TableCell>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(cashSalesEntries.reduce((sum, entry) => sum + (entry.voucher_type === 'receipt' ? entry.amount : 0), 0))}</TableCell>
                          <TableCell>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(cashSalesEntries.reduce((sum, entry) => sum + (entry.voucher_type === 'payment' ? entry.amount : 0), 0))}</TableCell>
                          <TableCell>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(runningBalance + cashSalesTotal)}</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      )}
                      {isExpanded && cashSalesEntries.map(entry => {
                        if (entry.voucher_type === 'receipt') {
                          runningBalance += entry.amount
                        } else {
                          runningBalance -= entry.amount
                        }
                        return (
                          <TableRow key={entry.id} className="bg-muted/50">
                            <TableCell>{format(new Date(entry.created_at), 'dd/MM/yy')}</TableCell>
                            <TableCell>{entry.id}</TableCell>
                            <TableCell>{entry.party_name}</TableCell>
                            <TableCell>{entry.remarks}</TableCell>
                            <TableCell>{entry.voucher_type === 'receipt' ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(entry.amount) : '-'}</TableCell>
                            <TableCell>{entry.voucher_type === 'payment' ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(entry.amount) : '-'}</TableCell>
                            <TableCell>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(runningBalance)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onSelect={() => setEditingEntry(entry)}>
                                    <PenLine className="mr-2 h-4 w-4" />
                                    <span>Edit</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => deleteEntry(entry.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {otherEntries.map(entry => {
                        // For non-cash-sales entries, always calculate balance including the total cash sales effect
                        const currentBalance = runningBalance + (isExpanded ? 0 : cashSalesTotal)
                        if (entry.voucher_type === 'receipt') {
                          runningBalance = currentBalance + entry.amount
                        } else {
                          runningBalance = currentBalance - entry.amount
                        }
                        return (
                          <TableRow key={entry.id}>
                            <TableCell>{format(new Date(entry.created_at), 'dd/MM/yy')}</TableCell>
                            <TableCell>{entry.id}</TableCell>
                            <TableCell>{entry.party_name}</TableCell>
                            <TableCell>{entry.remarks}</TableCell>
                            <TableCell>{entry.voucher_type === 'receipt' ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(entry.amount) : '-'}</TableCell>
                            <TableCell>{entry.voucher_type === 'payment' ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(entry.amount) : '-'}</TableCell>
                            <TableCell>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(runningBalance)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onSelect={() => setEditingEntry(entry)}>
                                    <PenLine className="mr-2 h-4 w-4" />
                                    <span>Edit</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => deleteEntry(entry.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      <TableRow className="border-t-2 border-primary">
                        <TableCell colSpan={4} className="font-semibold">Closing Balance ({format(parseISO(date), 'dd/MM/yy')})</TableCell>
                        <TableCell>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalReceipt)}</TableCell>
                        <TableCell>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalPayment)}</TableCell>
                        <TableCell colSpan={2}>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(closingBalance)}</TableCell>
                      </TableRow>
                      {index < dailyEntries.length - 1 && (
                        <TableRow className="h-2">
                          <TableCell colSpan={8} />
                        </TableRow>
                      )}
                    </>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Cashbook Entry</DialogTitle>
          </DialogHeader>
          {editingEntry && (
            <CashbookForm
              initialData={{
                ...editingEntry,
                type: 'update'
              }}
              onSuccess={() => {
                setEditingEntry(null)
                fetchEntries()
              }}
              voucherType={editingEntry.voucher_type}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

