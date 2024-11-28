import { Text, View, type TextProps } from 'react-native'

import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
}

interface BadgeTextProps extends TextProps {
  children: React.ReactNode
  className?: string
}

function Badge({ children, className }: BadgeProps) {
  return (
    <View className={cn('bg-zinc-950 px-2 py-1 rounded-lg', className)}>
      {children}
    </View>
  )
}

function Title({ children, className, ...props }: BadgeTextProps) {
  return (
    <Text
      className={cn('text-sm text-zinc-200 font-regular', className)}
      {...props}
    >
      {children}
    </Text>
  )
}

Badge.Title = Title

export { Badge }
