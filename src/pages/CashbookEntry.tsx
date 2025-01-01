import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader, PageHeaderHeading } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CashbookForm } from "@/components/cashbook-form"

export default function CashbookEntryForm() {
  const { voucherType } = useParams<{ voucherType: 'receipt' | 'payment' }>()
  const navigate = useNavigate()

  if (!voucherType || (voucherType !== 'receipt' && voucherType !== 'payment')) {
    navigate('/add-entry')
    return null
  }

  const handleFormSuccess = () => {
    navigate('/')
  }

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Add {voucherType === 'receipt' ? 'Receipt' : 'Payment'}</PageHeaderHeading>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>New Cashbook Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <CashbookForm
            onSuccess={handleFormSuccess}
            initialData={{
              type: 'insert',
              voucher_type: voucherType
            }}
            voucherType={voucherType}
          />
        </CardContent>
      </Card>
    </>
  )
}

