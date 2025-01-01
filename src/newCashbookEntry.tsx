import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, PageHeaderHeading } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import VoucherTypeDialog from '@/components/voucher-type-dialog'

export default function AddCashbookEntry() {
  const navigate = useNavigate()
  const [isVoucherTypeDialogOpen, setIsVoucherTypeDialogOpen] = useState(true)

  const handleVoucherTypeSelection = (type: 'receipt' | 'payment') => {
    console.log(type)
    setIsVoucherTypeDialogOpen(false)
    navigate(`/add-entry/${type}`)
  }

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Add Cashbook Entry</PageHeaderHeading>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Select Voucher Type</CardTitle>
        </CardHeader>
        <CardContent>
          <VoucherTypeDialog
            isOpen={isVoucherTypeDialogOpen}
            onOpenChange={setIsVoucherTypeDialogOpen}
            onSelect={handleVoucherTypeSelection}
          />
        </CardContent>
      </Card>
    </>
  )
}

