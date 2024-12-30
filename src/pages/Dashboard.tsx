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
import { PenIcon, PenLine, Trash2 } from 'lucide-react'

interface CashbookEntry {
  id: number
  party_name: string
  remarks: string
  amount: number
  voucher_type: 'receipt' | 'payment'
}

export default function Dashboard() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<CashbookEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isVoucherTypeDialogOpen, setIsVoucherTypeDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<CashbookEntry | null>(null)
  const [selectedVoucherType, setSelectedVoucherType] = useState<'receipt' | 'payment' | null>(null)

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
        .order('id', { ascending: false })
      
      if (error) throw error
      setEntries(data || [])
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
      <PageHeader>
        <PageHeaderHeading>Cashbook</PageHeaderHeading>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Cashbook Entries</CardTitle>
          <CardDescription>Manage your cashbook entries here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isVoucherTypeDialogOpen} onOpenChange={setIsVoucherTypeDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mb-4">Add New Entry</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Voucher Type</DialogTitle>
              </DialogHeader>
              <RadioGroup
                onValueChange={(value) => handleVoucherTypeSelection(value as 'receipt' | 'payment')}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="receipt" id="receipt" />
                  <Label htmlFor="receipt">Receipt</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="payment" id="payment" />
                  <Label htmlFor="payment">Payment</Label>
                </div>
              </RadioGroup>
            </DialogContent>
          </Dialog>
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
                  <TableHead>Voucher No</TableHead>
                  <TableHead>Party Name</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Voucher Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.id}</TableCell>
                    <TableCell>{entry.party_name}</TableCell>
                    <TableCell>{entry.remarks}</TableCell>
                    <TableCell>{entry.amount.toFixed(2)}</TableCell>
                    <TableCell>{entry.voucher_type.toUpperCase()}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="mr-2" onClick={() => setEditingEntry(entry)}>
                            <PenLine size={20} />
                          </Button>
                        </DialogTrigger>
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
                      <Button variant="destructive" onClick={() => deleteEntry(entry.id)}>
                        <Trash2 size={20}/>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}

