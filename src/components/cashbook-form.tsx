import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { toast } from "sonner"
import { DialogFooter, DialogHeader, DialogTrigger } from './ui/dialog'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Schema definitions remain the same
const baseSchema = z.object({
  party_id: z.number().min(1, { message: 'Party is required' }),
  remarks: z.string().optional(),
  amount: z.number().min(0.01, { message: 'Amount must be greater than 0' }),
  voucher_type: z.enum(['receipt', 'payment']),
  created_at: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  })
})

const insertSchema = baseSchema.extend({
  type: z.literal('insert')
})

const updateSchema = baseSchema.extend({
  type: z.literal('update'),
  id: z.number()
})

const formSchema = z.discriminatedUnion('type', [insertSchema, updateSchema])

type FormData = z.infer<typeof formSchema>

interface CashbookFormProps {
  onSuccess: () => void
  initialData: {
    type: 'insert' | 'update'
    id?: number
    party_id?: number
    remarks?: string
    amount?: number
    voucher_type: 'receipt' | 'payment'
    created_at?: string
  }
  voucherType: 'receipt' | 'payment'
}

export function CashbookForm({ onSuccess, initialData, voucherType }: CashbookFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [parties, setParties] = useState<{ id: number; name: string }[]>([])
  const [isNewAccountDialogOpen, setIsNewAccountDialogOpen] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [open, setOpen] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: initialData.type,
      id: initialData.id,
      party_id: initialData.party_id || (voucherType === "receipt" ? 1 : 2),
      remarks: initialData.remarks || '',
      amount: initialData.amount || 0,
      voucher_type: initialData.voucher_type || voucherType,
      created_at: initialData.created_at || new Date().toISOString().split('T')[0]
    },
  })

  useEffect(() => {
    async function fetchParties() {
      const { data, error } = await supabase
        .from('accounts_master')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching parties:', error)
      } else {
        setParties(data || [])
      }
    }

    fetchParties()
  }, [])

  const handleCreateNewAccount = async () => {
    if (!newAccountName.trim()) {
      toast.error("Account name cannot be empty")
      return
    }

    setIsCreatingAccount(true)
    try {
      const { data, error } = await supabase
        .from('accounts_master')
        .insert({ name: newAccountName.trim() })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setParties(prev => [...prev, { id: data.id, name: data.name }])
        form.setValue('party_id', data.id)
        toast.success("Account created successfully")
        setIsNewAccountDialogOpen(false)
        setNewAccountName('')
      }
    } catch (error) {
      console.error('Error creating account:', error)
      toast.error("Failed to create account")
    } finally {
      setIsCreatingAccount(false)
    }
  }

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    try {
      if (data.type === 'update') {
        await supabase.from('cashbook').update(data).eq('id', data.id)
      } else {
        const { type, ...insertData } = data
        await supabase.from('cashbook').insert(insertData)
      }
      onSuccess()
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="created_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="party_id"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Party Name</FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? parties.find((party) => party.id === field.value)?.name
                        : "Select party"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Command>
                    <CommandInput placeholder="Search party..." />
                    <CommandEmpty>
                      No party found.
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => {
                          setNewAccountName('')
                          setIsNewAccountDialogOpen(true)
                          setOpen(false)
                        }}
                      >
                        Create New Account
                      </Button>
                    </CommandEmpty>
                    <CommandList>
                      {parties.map((party) => (
                        <CommandItem
                          key={party.id}
                          value={party.name}
                          onSelect={() => {
                            form.setValue("party_id", party.id)
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              party.id === field.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {party.name}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="remarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remarks</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter remarks (optional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="voucher_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Voucher Type</FormLabel>
              <FormControl>
                <Input type="text" {...field} readOnly />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting...' : form.getValues('type') === 'update' ? 'Update' : 'Submit'}
        </Button>
      </form>

      <Dialog open={isNewAccountDialogOpen} onOpenChange={setIsNewAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormItem>
              <FormLabel>Account Name</FormLabel>
              <FormControl>
                <Input
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Enter account name"
                />
              </FormControl>
            </FormItem>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewAccountDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateNewAccount}
              disabled={isCreatingAccount}
            >
              {isCreatingAccount ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  )
}

