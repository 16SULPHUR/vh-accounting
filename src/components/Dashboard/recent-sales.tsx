import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Invoice {
  id: number
  date: string
  customerName: string
  total: number
}

export function RecentSales({ data }: { data: Invoice[] }) {
  const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  return (
    <div className="space-y-8">
      {sortedData.map((sale) => (
        <div className="flex items-center" key={sale.id}>
          <Avatar className="h-9 w-9">
            <AvatarFallback>{sale.customerName[0]}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{sale.customerName}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(sale.date).toLocaleDateString()}
            </p>
          </div>
          <div className="ml-auto font-medium">₹{sale.total.toFixed(2)}</div>
        </div>
      ))}
    </div>
  )
}

