import Skeleton from './ui/Skeleton'

export default function ProductCardSkeleton() {
  return (
    <div className="rounded-card overflow-hidden border-2 border-gray-200 bg-white">
      <Skeleton className="w-full h-36" />
      <div className="p-3 space-y-2">
        <Skeleton className="w-full h-3.5" />
        <Skeleton className="w-2/3 h-3.5" />
        <Skeleton className="w-20 h-4" />
        <div className="flex items-center justify-between pt-0.5">
          <Skeleton className="w-20 h-4 rounded-full" />
          <Skeleton className="w-14 h-4 rounded-full" />
        </div>
      </div>
    </div>
  )
}
