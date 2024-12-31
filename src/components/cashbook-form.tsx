import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'

// Define the base schema
const baseSchema = z.object({
  party_name: z.string().min(1, { message: 'Party name is required' }),
  remarks: z.string().optional(),
  amount: z.number().min(0.01, { message: 'Amount must be greater than 0' }),
  voucher_type: z.enum(['receipt', 'payment'])
})

// Define schema for inserting data (without id)
const insertSchema = baseSchema.extend({
  type: z.literal('insert')
})

// Define schema for updating data (with id)
const updateSchema = baseSchema.extend({
  type: z.literal('update'),
  id: z.number()
})

// Combine schemas using discriminated union
const formSchema = z.discriminatedUnion('type', [insertSchema, updateSchema])

type FormData = z.infer<typeof formSchema>

interface CashbookFormProps {
  onSuccess: () => void
  initialData: {
    type: 'insert' | 'update'
    id?: number
    party_name?: string
    remarks?: string
    amount?: number
    voucher_type: 'receipt' | 'payment'
  }
  voucherType: 'receipt' | 'payment'
}

export function CashbookForm({ onSuccess, initialData, voucherType }: CashbookFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: initialData.type,
      id: initialData.id,
      party_name: initialData.party_name || '',
      remarks: initialData.remarks || '',
      amount: initialData.amount || 0,
      voucher_type: initialData.voucher_type || voucherType
    },
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    try {
      if (data.type === 'update') {
        console.log('Updating data', data)
        await supabase.from('cashbook').update(data).eq('id', data.id)
      } else {
        console.log('Inserting data', data)
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
          name="party_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Party Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter party name" {...field} />
              </FormControl>
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
    </Form>
  )
}

