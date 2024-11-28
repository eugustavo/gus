import { createContext, useContext, useState } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  type TextProps,
  type TouchableOpacityProps,
} from 'react-native'

import { cn } from '@/lib/utils'

interface AlertDialogProps {
  children: React.ReactNode
}

interface AlertDialogTriggerProps extends TouchableOpacityProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogTextProps extends TextProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogContentProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogContextProps {
  open: boolean
  setOpen: (value: boolean) => void
}

interface AlertDialogFooterProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogActionProps extends TouchableOpacityProps {
  children: React.ReactNode
  onAction: () => void
  className?: string
}

const AlertDialogContext = createContext<AlertDialogContextProps>(
  {} as AlertDialogContextProps
)

function AlertDialog({ children }: AlertDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <AlertDialogContext.Provider
      value={{
        open,
        setOpen,
      }}
    >
      {children}
    </AlertDialogContext.Provider>
  )
}

function Trigger({ children, className, ...props }: AlertDialogTriggerProps) {
  const { setOpen } = useContext(AlertDialogContext)

  return (
    <TouchableOpacity
      className={cn('py-4 px-6 bg-zinc-200 rounded-md', className)}
      onPress={() => setOpen(true)}
      {...props}
    >
      {children}
    </TouchableOpacity>
  )
}

function Content({ children, className }: AlertDialogContentProps) {
  const { open, setOpen } = useContext(AlertDialogContext)

  return (
    <Modal
      visible={open}
      animationType="fade"
      onRequestClose={() => setOpen(false)}
      transparent
    >
      <View className="flex-1 items-center justify-center px-4">
        <View
          className={cn(
            'w-full shadow-md bg-zinc-900 rounded-md p-4 border border-zinc-700/70',
            className
          )}
        >
          {children}
        </View>
      </View>
    </Modal>
  )
}

function ContentTitle({ children, className, ...props }: AlertDialogTextProps) {
  return (
    <Text
      className={cn('text-lg font-bold text-zinc-200', className)}
      {...props}
    >
      {children}
    </Text>
  )
}

function ContentDescription({
  children,
  className,
  ...props
}: AlertDialogTextProps) {
  return (
    <Text className={cn('text-zinc-400 mt-1', className)} {...props}>
      {children}
    </Text>
  )
}

function Footer({ children, className }: AlertDialogFooterProps) {
  return (
    <View
      className={cn(
        'flex-row w-full items-center justify-end gap-4 mt-6',
        className
      )}
    >
      {children}
    </View>
  )
}

function ActionCancel({
  children,
  className,
  onAction,
  ...props
}: AlertDialogActionProps) {
  const { setOpen } = useContext(AlertDialogContext)

  return (
    <TouchableOpacity
      className={cn(
        'bg-transparent border border-zinc-700 rounded-md px-4 py-2',
        className
      )}
      onPress={() => {
        onAction()
        setOpen(false)
      }}
      {...props}
    >
      <Text className="text-zinc-200">{children}</Text>
    </TouchableOpacity>
  )
}

function ActionConfirm({
  children,
  className,
  onAction,
}: AlertDialogActionProps) {
  const { setOpen } = useContext(AlertDialogContext)

  return (
    <TouchableOpacity
      className={cn('bg-zinc-100 rounded-md px-4 py-2', className)}
      onPress={() => {
        onAction()
        setOpen(false)
      }}
    >
      <Text className="text-zinc-900">{children}</Text>
    </TouchableOpacity>
  )
}

AlertDialog.Trigger = Trigger
AlertDialog.Content = Content
AlertDialog.ContentTitle = ContentTitle
AlertDialog.ContentDescription = ContentDescription
AlertDialog.Footer = Footer
AlertDialog.ActionCancel = ActionCancel
AlertDialog.ActionConfirm = ActionConfirm

export { AlertDialog }
