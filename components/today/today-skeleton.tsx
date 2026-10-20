import { cn } from '@/lib/utils'

function Bone({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-full', className)} />
}

export function TodaySkeleton() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading your day">
      <span className="sr-only">Loading your day…</span>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
        <div>
          <Bone className="h-4 w-44" />
          <Bone className="mt-8 h-[52px] w-[70%] rounded-2xl sm:h-[72px] lg:h-[92px]" />
          <Bone className="mt-3 h-[52px] w-[55%] rounded-2xl sm:h-[72px] lg:h-[92px]" />
          <Bone className="mt-8 h-4 w-full max-w-md" />
          <Bone className="mt-3 h-4 w-3/4 max-w-sm" />
        </div>
        <div className="skeleton h-[184px] rounded-[28px]" />
      </div>
      <Bone className="mt-14 h-2 w-full" />

      <div className="mt-14 flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:gap-8">
        <div className="surface-strong rounded-[32px] p-8 lg:col-span-7">
          <Bone className="h-3 w-16" />
          <Bone className="mt-4 h-7 w-48 rounded-xl" />
          <div className="skeleton mt-8 h-[52px] rounded-2xl" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="mt-6 flex items-center gap-4">
              <Bone className="size-[22px]" />
              <div className="flex-1">
                <Bone className={cn('h-4', i % 2 ? 'w-1/2' : 'w-2/3')} />
                <Bone className="mt-2 h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-8 lg:col-span-5">
          <div className="px-2">
            <Bone className="h-3 w-16" />
            <Bone className="mt-4 h-7 w-36 rounded-xl" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="mt-7 flex gap-4">
                <Bone className="h-4 w-14" />
                <div className="flex-1">
                  <Bone className="h-4 w-3/4" />
                  <Bone className="mt-2 h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
          <div className="skeleton h-64 rounded-[28px]" />
        </div>
      </div>
    </div>
  )
}
