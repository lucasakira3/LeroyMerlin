import Card from './ui/Card'
import Skeleton from './ui/Skeleton'

export default function ProductCardSkeleton() {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-stretch">
        <div className="bg-lm-green/5 px-3 py-3 flex flex-col items-center justify-center min-w-[64px] gap-1.5">
          <Skeleton className="w-8 h-2.5" />
          <Skeleton className="w-6 h-2.5" />
        </div>
        <div className="flex-1 px-4 py-3 space-y-2">
          <Skeleton className="w-16 h-2" />
          <Skeleton className="w-3/4 h-3.5" />
          <Skeleton className="w-20 h-3" />
          <Skeleton className="w-24 h-4" />
          <div className="flex items-center justify-between pt-0.5">
            <Skeleton className="w-20 h-4 rounded-full" />
            <Skeleton className="w-14 h-4 rounded-full" />
          </div>
        </div>
      </div>
    </Card>
  )
}
