import Card from './ui/Card'
import Skeleton from './ui/Skeleton'

export default function CartItemSkeleton() {
  return (
    <Card padding="sm" className="flex items-center gap-3">
      <Skeleton className="w-14 h-14 rounded-lg flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="w-3/4 h-4" />
        <Skeleton className="w-1/3 h-3" />
      </div>
      <Skeleton className="w-16 h-5 flex-shrink-0" />
    </Card>
  )
}
