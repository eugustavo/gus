import { createContext, useContext, useState } from 'react'
import {
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  View,
  FlatList,
  type TouchableOpacityProps,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { cssInterop } from 'nativewind'

import { cn } from '@/lib/utils'
import { ChevronDown, X } from 'lucide-react-native'

const ICON_SIZE = 20
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

cssInterop(ChevronDown, {
  className: {
    target: 'style',
  },
})

cssInterop(X, {
  className: {
    target: 'style',
  },
})

interface SelectProps {
  children: React.ReactNode
  onChange: (value: string) => void
}

interface SelectTriggerProps extends TouchableOpacityProps {
  children: React.ReactNode
  className?: string
}

interface SelectValueProps {
  placeholder?: string
  className?: string
}

interface SelectContentProps {
  title?: string
  description?: string
  className?: string
  children: React.ReactNode
}

interface SelectOptionProps {
  options: Array<{
    label: string
    value: string
  }>
  className?: string
}

interface SelectContextProps {
  visible: boolean
  setVisible: (value: boolean) => void
  blurIntensity: Animated.Value
  selectedOption: string
  handleVisibleOptions: () => void
  handleCloseOptions: () => void
  handleSelectOption: (data: { label: string; value: string }) => void
}

const SelectContext = createContext<SelectContextProps>(
  {} as SelectContextProps
)

function Select({ children, onChange }: SelectProps) {
  const [visible, setVisible] = useState(false)
  const [selectedOption, setSelectedOption] = useState('')

  const blurIntensity = useState(new Animated.Value(0))[0]

  function handleVisibleOptions() {
    setVisible(true)

    Animated.timing(blurIntensity, {
      toValue: 20,
      duration: 300,
      delay: 200,
      useNativeDriver: false,
    }).start()
  }

  function handleCloseOptions() {
    Animated.timing(blurIntensity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setVisible(false)
    })
  }

  function handleSelectOption(data: { label: string; value: string }) {
    onChange(data.value)
    setSelectedOption(data.label)

    Animated.timing(blurIntensity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setVisible(false)
    })
  }

  return (
    <SelectContext.Provider
      value={{
        visible,
        setVisible,
        blurIntensity,
        handleVisibleOptions,
        handleCloseOptions,
        handleSelectOption,
        selectedOption,
      }}
    >
      {children}
    </SelectContext.Provider>
  )
}

function Trigger({ children, className, ...props }: SelectTriggerProps) {
  const { handleVisibleOptions } = useContext(SelectContext)

  return (
    <TouchableOpacity
      className={cn(
        'flex-row w-full h-12 border border-zinc-400 rounded-md items-center justify-between px-2',
        className
      )}
      activeOpacity={0.7}
      onPress={handleVisibleOptions}
      {...props}
    >
      {children}
    </TouchableOpacity>
  )
}

function Value({ placeholder, className }: SelectValueProps) {
  const { selectedOption } = useContext(SelectContext)

  return (
    <>
      <Text className={cn('text-zinc-200', className)} numberOfLines={1}>
        {selectedOption || placeholder}
      </Text>

      <ChevronDown size={ICON_SIZE} className="text-zinc-300" />
    </>
  )
}

function Content({
  title,
  className,
  description,
  children,
}: SelectContentProps) {
  const { visible, blurIntensity, handleCloseOptions } =
    useContext(SelectContext)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCloseOptions}
    >
      <AnimatedBlurView
        intensity={blurIntensity}
        className="flex-1 absolute w-full h-full"
      />

      <View className="flex-1 flex-col justify-end">
        <View
          className={cn(
            'max-h-[50%] bg-zinc-950 rounded-t-2xl py-2 px-4 pb-12 shadow-lg',
            className
          )}
        >
          <View className="flex-row justify-between items-center pt-5">
            <Text
              className="text-zinc-200 font-medium text-xl"
              numberOfLines={1}
            >
              {title}
            </Text>

            <TouchableOpacity activeOpacity={0.7} onPress={handleCloseOptions}>
              <X size={ICON_SIZE} className="text-zinc-300" />
            </TouchableOpacity>
          </View>

          {description && (
            <Text className="text-zinc-500 font-regular leading-6">
              {description}
            </Text>
          )}

          {children}
        </View>
      </View>
    </Modal>
  )
}

function Options({ options, className }: SelectOptionProps) {
  const { handleSelectOption } = useContext(SelectContext)

  return (
    <FlatList
      data={options}
      keyExtractor={item => item.value}
      className={cn('mt-4', className)}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleSelectOption(item)}
          >
            <Text className="font-normal text-zinc-200 text-lg">
              {item.label}
            </Text>
          </TouchableOpacity>

          <View className="h-px my-2 bg-zinc-800" />
        </View>
      )}
    />
  )
}

Select.Trigger = Trigger
Select.Value = Value
Select.Content = Content
Select.Options = Options

export { Select }
