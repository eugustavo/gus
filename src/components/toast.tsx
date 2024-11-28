import React, {
  useEffect,
  useRef,
  createContext,
  useState,
  useCallback,
  useContext,
  type ReactNode,
} from 'react'
import { Platform, View, Text, ActivityIndicator } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
  Easing,
  withSpring,
  cancelAnimation,
} from 'react-native-reanimated'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import { cssInterop } from 'nativewind'
import { Info, CircleX, CircleChevronDown } from 'lucide-react-native'

import { cn } from '@/lib/utils'

interface ToastOptions {
  id?: string
  title: string
  description?: string
  duration?: number
  className?: string
  classNameTitle?: string
  classNameDescription?: string
  classNameIcon?: string
}

interface ToastContextData {
  toast: {
    (options: ToastOptions): string
    info: (options: ToastOptions) => string
    success: (options: ToastOptions) => string
    error: (options: ToastOptions) => string
    loading: (options: ToastOptions) => string
    dismiss: (id: string) => void
    update: (id: string, data: Partial<ToastData>) => void
  }
}

interface ToastData {
  id: string
  title: string
  description?: string
  type: 'info' | 'success' | 'error' | 'loading'
  duration: number
  className?: string
  classNameTitle?: string
  classNameDescription?: string
  classNameIcon?: string
}

interface ToastContainerProps {
  messages: ToastData[]
  onDismiss: (id: string) => void
  pendingRemovals: Set<string>
  className?: string
  classNameTitle?: string
  classNameDescription?: string
  classNameIcon?: string
}

interface ToastProviderProps {
  children: ReactNode
}

interface ToastProps {
  title: string
  description?: string
  duration?: number
  onDismiss: (id: string) => void
  index: number
  id: string
  type: 'info' | 'success' | 'error' | 'loading'
  className?: string
  classNameTitle?: string
  classNameDescription?: string
  classNameIcon?: string
}

interface ToastIconProps {
  type: ToastProps['type']
  color: string
  className?: string
}

const ANIMATION_DURATION = 300
const INITIAL_POSITION = -100
const ANIMATION_BUFFER = 400
const ICON_SIZE = 20
const MAX_TOASTS = 3

function Toast({
  title,
  description,
  duration = 3000,
  onDismiss,
  index,
  id,
  type = 'info',
  isPendingRemoval,
  className,
  classNameTitle,
  classNameDescription,
  classNameIcon,
}: ToastProps & { isPendingRemoval: boolean }) {
  const translateY = useSharedValue(INITIAL_POSITION)
  const opacity = useSharedValue(0)
  const isAnimatingRef = useRef(false)
  const dismissTimeoutRef = useRef<NodeJS.Timeout>()

  const cleanup = useCallback(() => {
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current)
    }
    cancelAnimation(translateY)
    cancelAnimation(opacity)
  }, [translateY, opacity])

  const finishDismiss = useCallback(() => {
    cleanup()
    onDismiss(id)
  }, [id, onDismiss, cleanup])

  const handleDismiss = useCallback(() => {
    cleanup()

    translateY.value = withTiming(INITIAL_POSITION, {
      duration: ANIMATION_DURATION,
      easing: Easing.inOut(Easing.ease),
    })

    opacity.value = withTiming(
      0,
      {
        duration: ANIMATION_DURATION,
        easing: Easing.inOut(Easing.ease),
      },
      finished => {
        if (finished) {
          runOnJS(finishDismiss)()
        }
      }
    )
  }, [translateY, opacity, finishDismiss, cleanup])

  const gesture = Gesture.Pan()
    .enabled(true)
    .failOffsetY(20)
    .activeOffsetY(-10)
    .onStart(() => {
      'worklet'
      return true
    })
    .onUpdate(event => {
      'worklet'
      if (event.translationY < 0) {
        translateY.value = event.translationY
        opacity.value = 1 - Math.min(Math.abs(event.translationY) / 100, 1)
      }
    })
    .onEnd(event => {
      'worklet'
      if (event.translationY < -50) {
        runOnJS(handleDismiss)()
      } else {
        translateY.value = withSpring(0)
        opacity.value = withTiming(1)
      }
    })

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    }
  }, [])

  function getToastColors(type: ToastProps['type']) {
    switch (type) {
      case 'success':
        return {
          background: 'bg-green-900',
          border: 'border-green-800',
          title: 'text-green-100',
          description: 'text-green-200',
          icon: 'text-green-500',
        }
      case 'error':
        return {
          background: 'bg-red-900',
          border: 'border-red-800',
          title: 'text-red-100',
          description: 'text-red-200',
          icon: 'text-red-500',
        }
      case 'loading':
        return {
          background: 'bg-gray-900',
          border: 'border-gray-500',
          title: 'text-gray-100',
          description: 'text-gray-400',
          icon: 'text-gray-500',
        }
      default:
        return {
          background: 'bg-blue-900',
          border: 'border-blue-800',
          title: 'text-blue-100',
          description: 'text-blue-200',
          icon: 'text-blue-500',
        }
    }
  }

  function ToastIcon({ type, color, className }: ToastIconProps) {
    cssInterop(Info, {
      className: {
        target: 'style',
      },
    })

    cssInterop(CircleX, {
      className: {
        target: 'style',
      },
    })

    cssInterop(CircleChevronDown, {
      className: {
        target: 'style',
      },
    })

    switch (type) {
      case 'success':
        return (
          <CircleChevronDown
            size={ICON_SIZE}
            className={cn(color, className)}
          />
        )
      case 'error':
        return <CircleX size={ICON_SIZE} className={cn(color, className)} />
      case 'loading':
        return (
          <ActivityIndicator size="small" className={cn(color, className)} />
        )
      default:
        return <Info size={ICON_SIZE} className={cn(color, className)} />
    }
  }

  const colors = getToastColors(type)

  useEffect(() => {
    translateY.value = withSpring(0)
    opacity.value = withTiming(1, {
      duration: ANIMATION_DURATION,
      easing: Easing.ease,
    })

    if ((type !== 'loading' && duration > 0) || isPendingRemoval) {
      dismissTimeoutRef.current = setTimeout(
        () => {
          if (!isAnimatingRef.current) {
            handleDismiss()
          }
        },
        isPendingRemoval ? 0 : duration - ANIMATION_BUFFER
      )
    }

    return cleanup
  }, [
    type,
    duration,
    handleDismiss,
    cleanup,
    opacity,
    translateY,
    isPendingRemoval,
  ])

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        className={cn(
          `absolute left-4 right-4 p-4 rounded-lg border flex-row items-center ${colors.background} ${colors.border}`,
          className
        )}
        style={[
          animatedStyle,
          {
            top: 60 + index * 4,
            pointerEvents: 'box-none',
            zIndex: 1000 + index,
          },
        ]}
      >
        <View className="mr-3">
          <ToastIcon
            type={type}
            color={colors.icon}
            className={classNameIcon}
          />
        </View>

        <View className="flex-1">
          <Text
            className={cn(
              `font-medium text-md ${colors.title}`,
              classNameTitle
            )}
          >
            {title}
          </Text>

          {description && (
            <Text
              className={cn(
                `font-regular text-sm mt-1 ${colors.description}`,
                classNameDescription
              )}
            >
              {description}
            </Text>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  )
}

function ToastContainer({
  messages,
  onDismiss,
  pendingRemovals,
}: ToastContainerProps) {
  return (
    <View
      className="absolute left-0 right-0"
      style={{
        top: Platform.OS === 'ios' ? 0 : -15,
        zIndex: 999,
        position: 'absolute',
        left: 0,
        right: 0,
        pointerEvents: 'box-none',
      }}
    >
      {messages.map((toast, index) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          duration={toast.duration}
          type={toast.type}
          onDismiss={onDismiss}
          index={index}
          isPendingRemoval={pendingRemovals.has(toast.id)}
          className={toast.className}
          classNameTitle={toast.classNameTitle}
          classNameDescription={toast.classNameDescription}
          classNameIcon={toast.classNameIcon}
        />
      ))}
    </View>
  )
}

const ToastContext = createContext<ToastContextData | undefined>(undefined)

export function ToastProvider({ children }: ToastProviderProps) {
  const [messages, setMessages] = useState<ToastData[]>([])
  const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(new Set())

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const removeToast = useCallback((id: string) => {
    setPendingRemovals(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setMessages(state => state.filter(msg => msg.id !== id))
  }, [])

  const dismissToast = useCallback((id: string) => {
    setPendingRemovals(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const updateToast = useCallback((id: string, data: Partial<ToastData>) => {
    setMessages(state =>
      state.map(msg => (msg.id === id ? { ...msg, ...data } : msg))
    )
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const addToast = useCallback((options: Partial<ToastData>) => {
    const toastData = {
      ...options,
      id: options.id || generateId(),
    } as ToastData

    setPendingRemovals(prev => {
      const next = new Set(prev)
      next.delete(toastData.id)
      return next
    })

    setMessages(state => {
      if (toastData.id && state.some(msg => msg.id === toastData.id)) {
        return state.map(msg => (msg.id === toastData.id ? toastData : msg))
      }

      const newState = [...state, toastData]
      return newState.slice(-MAX_TOASTS)
    })

    return toastData.id
  }, [])

  const toast = useCallback(
    (data: ToastOptions) => {
      return addToast({ ...data, type: 'info' })
    },
    [addToast]
  ) as ToastContextData['toast']

  toast.info = useCallback(
    (data: ToastOptions) => {
      return addToast({ ...data, type: 'info' })
    },
    [addToast]
  )

  toast.success = useCallback(
    (data: ToastOptions) => {
      return addToast({ ...data, type: 'success' })
    },
    [addToast]
  )

  toast.error = useCallback(
    (data: ToastOptions) => {
      return addToast({ ...data, type: 'error' })
    },
    [addToast]
  )

  toast.loading = useCallback(
    (data: ToastOptions) => {
      return addToast({ ...data, type: 'loading', duration: 0 })
    },
    [addToast]
  )

  toast.dismiss = useCallback(
    (id: string) => {
      dismissToast(id)
    },
    [dismissToast]
  )

  toast.update = useCallback(
    (id: string, data: Partial<ToastData>) => {
      updateToast(id, data)
    },
    [updateToast]
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      <ToastContainer
        messages={messages}
        onDismiss={removeToast}
        pendingRemovals={pendingRemovals}
      />
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}
