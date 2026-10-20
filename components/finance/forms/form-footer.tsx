'use client'

import { useState, type ReactNode } from 'react'
import { Trash2 } from 'lucide-react'

export function FormFooter({
  error,
  onDelete,
  deleteLabel = 'Delete',
  children,
}: {
  error?: string | null
  onDelete?: () => void
  deleteLabel?: string
  children: ReactNode
}) {
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="mt-2 border-t border-hairline pt-5">
      {error && (
        <p role="alert" className="mb-4 text-[13px] text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {onDelete ? (
          confirming ? (
            <span className="flex items-center gap-1 text-[13px]">
              <button type="button" onClick={onDelete} className="rounded-full px-3 py-1.5 font-medium text-destructive hover:bg-destructive/10">
                Yes, delete
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="rounded-full px-3 py-1.5 text-subtle hover:text-foreground">
                Keep
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-subtle transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" aria-hidden />
              {deleteLabel}
            </button>
          )
        ) : (
          <span />
        )}
        <div className="ml-auto flex items-center gap-2">{children}</div>
      </div>
    </div>
  )
}
