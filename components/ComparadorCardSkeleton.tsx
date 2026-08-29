import Card from './ui/Card'
import Skeleton from './ui/Skeleton'

export default function ComparadorCardSkeleton() {
  return (
    <Card className="flex-1 min-w-[220px] space-y-3">
      <Skeleton className="w-full h-28" />
      <Skeleton className="w-full h-4" />
      <Skeleton className="w-1/2 h-4" />
      <Skeleton className="w-20 h-6" />
      <div className="flex gap-1.5">
        <Skeleton className="w-16 h-5 rounded-full" />
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>
      <Skeleton className="w-full h-9 rounded-lg" />
    </Card>
  )
}
