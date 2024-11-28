import { View } from 'react-native'

import { cn } from '@/lib/utils'

interface SeparatorProps {
  direction?: 'horizontal' | 'vertical'
  className?: string
}

export function Separator({
  direction = 'horizontal',
  className,
}: SeparatorProps) {
  return (
    <View
      className={cn(
        {
          'w-px h-full bg-gray-200': direction === 'vertical',
          'w-full h-px bg-gray-200': direction === 'horizontal',
        },
        className
      )}
    />
  )
}
