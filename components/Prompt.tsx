import { useState } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  TextInputProps,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { clsx } from 'clsx'
import { useCSSVariable } from 'uniwind'
import { KeyboardStickyView } from 'react-native-keyboard-controller'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'

interface PromptProps {
  visible: boolean
  title?: string
  message?: string
  cancelText?: string
  confirmText?: string
  onConfirm?: (text: string) => void
  onClose?: () => void
  inputProps?: TextInputProps
}

export default function Prompt({
  visible = false,
  title = 'Prompt',
  message = '',
  cancelText = 'Cancel',
  confirmText = 'OK',
  onConfirm,
  onClose,
  inputProps,
}: PromptProps) {
  const [inputText, setInputText] = useState(inputProps?.defaultValue || '')
  const isPassword = inputProps?.secureTextEntry
  const cyan200 = useCSSVariable('--color-cyan-200') as string
  const sx = useSafeAreaPadding()

  function handleConfirm() {
    onConfirm?.(inputText)
    onClose?.()
  }

  function handleClose() {
    onClose?.()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable className="bg-black/50 grow" onPress={handleClose} />
      <KeyboardStickyView
        offset={{
          opened: sx.paddingBottom,
        }}
      >
        <ScrollView
          className="bg-indigo-950"
          style={{
            paddingBottom: sx.paddingBottom,
          }}
        >
          <View className="p-4 pb-0 flex-row items-center justify-between">
            <View className="flex-row flex-wrap grow shrink">
              <Text className="text-white">{title}</Text>
              {message && (
                <Text className="text-gray-300 text-sm mt-1">{message}</Text>
              )}
            </View>
            <Pressable className="shrink-0" onPress={handleClose}>
              <MaterialCommunityIcons name="close" size={24} color="white" />
            </Pressable>
          </View>

          <TextInput
            id="password"
            placeholder={inputProps?.placeholder}
            multiline={!isPassword}
            numberOfLines={isPassword ? 1 : 4}
            textAlignVertical={isPassword ? 'center' : 'top'}
            placeholderTextColorClassName="accent-gray-400"
            className={clsx('bg-gray-900 text-white m-4 p-4 rounded-lg', {
              'min-h-[100px]': !isPassword,
            })}
            value={inputText}
            onChangeText={setInputText}
            secureTextEntry={inputProps?.secureTextEntry}
            keyboardType={inputProps?.keyboardType}
            autoCapitalize={isPassword ? 'none' : 'sentences'}
            autoCorrect={!isPassword}
            autoFocus
          />
          <View className="flex-row gap-3 mx-4 mb-4">
            <Pressable
              onPress={handleClose}
              className={clsx(
                'flex-1 py-2 px-3 rounded-lg text-center flex-row items-center justify-center',
                {
                  'bg-gray-700/50 active:bg-gray-700/75': true,
                },
              )}
            >
              <Text className="text-gray-300 text-lg">{cancelText}</Text>
            </Pressable>

            <Pressable
              disabled={!inputText}
              onPress={handleConfirm}
              className={clsx(
                'flex-1 py-2 px-3 rounded-lg text-center flex-row items-center justify-center gap-3',
                {
                  'bg-cyan-500/25 active:bg-cyan-500/50': inputText,
                  'bg-gray-700/50 opacity-50': !inputText,
                },
              )}
            >
              <Text className="text-cyan-200 text-lg">{confirmText}</Text>
              <MaterialCommunityIcons name="send" size={20} color={cyan200} />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardStickyView>
    </Modal>
  )
}
