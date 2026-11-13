import { cn } from '../../lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} />
}

export function ProfileCardSkeleton() {
  return (
    <div className="rounded-2xl p-3 flex items-center gap-3" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
      <Skeleton className="w-14 h-14 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  )
}
