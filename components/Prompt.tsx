import { useState } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInputProps,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import colors from 'tailwindcss/colors'
import clsx from 'clsx'

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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable className="bg-black/50 flex-grow" onPress={handleClose} />
        <View className="bg-indigo-950">
          <ScrollView>
            <View className="p-4 pb-0 flex-row items-center justify-between">
              <View className="flex-row flex-wrap flex-grow flex-shrink">
                <Text className="text-white">{title}</Text>
                {message && (
                  <Text className="text-gray-300 text-sm mt-1">{message}</Text>
                )}
              </View>
              <Pressable className="flex-shrink-0" onPress={handleClose}>
                <MaterialCommunityIcons name="close" size={24} color="white" />
              </Pressable>
            </View>

            <TextInput
              id="password"
              placeholder={inputProps?.placeholder}
              multiline={!isPassword}
              numberOfLines={isPassword ? 1 : 4}
              textAlignVertical={isPassword ? 'center' : 'top'}
              placeholderTextColor={colors.gray[400]}
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
                <MaterialCommunityIcons
                  name="send"
                  size={20}
                  color={colors.cyan[200]}
                />
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
