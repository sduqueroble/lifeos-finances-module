import { cn } from '@/lib/utils'
import type { Scenario } from '@/lib/today/types'

const OPTIONS: { value: Scenario; label: string }[] = [
  { value: 'populated', label: 'Full day' },
  { value: 'empty', label: 'Fresh start' },
  { value: 'complete', label: 'All done' },
  { value: 'loading', label: 'Loading' },
]

export function ScenarioSwitcher({ value, onChange }: { value: Scenario; onChange: (s: Scenario) => void }) {
  return <PreviewSwitcher options={OPTIONS} value={value} onChange={onChange} />
}

export function PreviewSwitcher<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div
      role="group"
      aria-label="Preview state"
      className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-surface/80 p-1 shadow-[inset_0_0_0_1px_var(--hairline)] backdrop-blur"
    >
      <span className="hidden pl-3 pr-2 text-[10px] font-medium uppercase tracking-[0.18em] text-subtle sm:inline">
        Preview
      </span>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors',
            value === o.value ? 'bg-foreground/[0.09] text-foreground' : 'text-subtle hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
