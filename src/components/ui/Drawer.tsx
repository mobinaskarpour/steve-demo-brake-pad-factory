import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 420,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  width?: number
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-[var(--color-line)] bg-[var(--color-surface)]"
            style={{ width: `min(${width}px, 100vw)` }}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--color-line)] px-5 py-4">
              <div>
                <h3 className="text-[15px] font-medium text-[var(--color-ink)]">{title}</h3>
                {subtitle ? <p className="mt-1 text-[12px] text-[var(--color-ink-soft)]">{subtitle}</p> : null}
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[var(--color-ink-faint)] hover:bg-[var(--color-elevated)]">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}
