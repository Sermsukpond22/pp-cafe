import { cn } from '@/lib/utils'

interface Props {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children }: Props) {
  return (
    <div className={cn('bg-white rounded-2xl shadow-sm p-4', className)}>
      {children}
    </div>
  )
}
