import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Invoice {
  products: string
}

export function TopProducts({ data }: { data: Invoice[] }) {
  const allProducts = data.flatMap(item => JSON.parse(item.products))
  const productCounts = allProducts.reduce((acc: Record<string, number>, product: any) => {
    acc[product.name] = (acc[product.name] || 0) + product.quantity
    return acc
  }, {})

  const sortedProducts = Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="space-y-8">
      {sortedProducts.map(([name, count]) => (
        <div className="flex items-center" key={name}>
          <Avatar className="h-9 w-9">
            <AvatarFallback>{name[0]}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-sm text-muted-foreground">
              {count} units sold
            </p>
          </div>
          <div className="ml-auto font-medium">#{sortedProducts.indexOf([name, count]) + 1}</div>
        </div>
      ))}
    </div>
  )
}

