import Header, { HEADER_HEIGHT } from '@/components/Header'
import Loading from '@/components/Loading'
import {
  useCreateMfaMutation,
  useDeleteMfaMutation,
  useMfaDetails,
  useVerifyMfaMutation,
} from '@/lib/api/mfa'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import encodeQR from 'qr'
import { saveFileToGallery } from '@/lib/downloads'
import { cacheDirectory, writeAsStringAsync } from 'expo-file-system'
import { showToastSuccess } from '@/lib/interaction'
import { setStringAsync } from 'expo-clipboard'
import colors from 'tailwindcss/colors'
import { Image } from 'expo-image'

export default function MfaSettings() {
  const sx = useSafeAreaPadding()
  const [name, setName] = useState('')
  const [token, setToken] = useState('')
  const { data, isLoading, isFetching } = useMfaDetails()
  const mfas = data ?? []
  const createMutation = useCreateMfaMutation()
  const verifyMutation = useVerifyMfaMutation()
  const deleteMutation = useDeleteMfaMutation()

  const newMfa = createMutation.data
  const canCreate = createMutation.status === 'idle' && !!name
  const canVerify = verifyMutation.status === 'idle' && !!token

  const qrCodeSvg = useMemo(() => {
    if (newMfa?.qrString) {
      return encodeQR(newMfa.qrString, 'svg')
    }
    return null
  }, [newMfa])

  const qrCodeBase64 = useMemo(() => {
    if (qrCodeSvg) {
      return `data:image/svg+xml;base64,${btoa(qrCodeSvg)}`
    }
    return null
  }, [qrCodeSvg])

  async function downloadQrCode() {
    if (qrCodeSvg) {
      try {
        const filename = `qr-${newMfa!.name}.svg`
        const fileUri = `${cacheDirectory}${filename}`
        await writeAsStringAsync(fileUri, qrCodeSvg)
        await saveFileToGallery(fileUri)
        showToastSuccess('QR code downloaded')
      } catch (error) {
        console.error('Error downloading QR code', error)
      }
    } else {
      console.error('No QR code found')
    }
  }

  function createMfa() {
    createMutation.mutate({ type: 'totp', name })
    Keyboard.dismiss()
  }

  function verifyMfa() {
    if (newMfa?.id) {
      verifyMutation.mutate(
        {
          id: newMfa.id,
          token,
        },
        {
          onSettled: reset,
        },
      )
      Keyboard.dismiss()
    }
  }

  function reset() {
    setName('')
    setToken('')
    createMutation.reset()
    verifyMutation.reset()
  }

  return (
    <View style={{ ...sx, flex: 1, paddingTop: sx.paddingTop + HEADER_HEIGHT }}>
      <Header title="Multi-Factor Authentication" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: 12,
            paddingBottom: sx.paddingBottom + 20,
          }}
        >
          {isLoading && <Loading />}
          {!isLoading && mfas.length === 0 && (
            <View className="my-6 items-center justify-center">
              <Text className="text-gray-200 font-medium text-lg leading-6 flex-grow flex-shrink">
                No MFA methods configured.
              </Text>
            </View>
          )}
          {mfas.length > 0 && (
            <Text className="text-gray-200 mx-4 mt-2 text-sm">
              Existing MFA methods
            </Text>
          )}
          {mfas.map((mfa) => (
            <View
              key={mfa.id}
              className={clsx(
                'm-3 p-3 rounded-lg border border-gray-500 flex-row items-center',
                {
                  'opacity-50': isFetching || deleteMutation.isPending,
                },
              )}
            >
              <View className="flex-grow flex-shrink">
                <Text className="text-white">{mfa.name}</Text>
                <Text className="text-gray-400 text-sm">{mfa.type}</Text>
              </View>
              <Pressable
                aria-label="Delete"
                disabled={deleteMutation.isPending}
                className={clsx('rounded-full p-2', {
                  'active:bg-white/10': !deleteMutation.isPending,
                })}
                onPress={() => deleteMutation.mutate(mfa.id)}
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <MaterialIcons name="delete" size={24} color="white" />
                )}
              </Pressable>
            </View>
          ))}
          <View
            style={{
              marginTop: 8,
              height: StyleSheet.hairlineWidth,
              backgroundColor: colors.gray[500],
            }}
          />
          {newMfa ? (
            <View className="m-3">
              <Text className="text-white mt-3">
                1. To complete the setup of "{newMfa.name}", choose one of the
                following options for registering the MFA details in your
                authenticator app:
              </Text>
              <View className="py-3">
                {qrCodeBase64 && (
                  <View className="flex-row justify-center items-center bg-white mx-auto mb-2">
                    <Image
                      source={{ uri: qrCodeBase64 }}
                      style={{ width: 200, height: 200 }}
                    />
                  </View>
                )}
                <Pressable
                  className="bg-cyan-800 active:bg-cyan-700 px-4 py-2 rounded-lg flex-row justify-center items-center gap-2 my-2"
                  onPress={downloadQrCode}
                >
                  <MaterialCommunityIcons
                    name="download"
                    size={20}
                    color="white"
                  />
                  <Text className="text-white">Download QR code</Text>
                </Pressable>
                <Pressable
                  className="bg-cyan-800 active:bg-cyan-700 px-4 py-2 rounded-lg flex-row justify-center items-center gap-2 my-2"
                  onPress={() => {
                    setStringAsync(newMfa.secret).then(() => {
                      showToastSuccess('Secret code copied to clipboard')
                    })
                  }}
                >
                  <MaterialCommunityIcons
                    name="content-copy"
                    size={20}
                    color="white"
                  />
                  <Text className="text-white">Copy secret code</Text>
                </Pressable>
              </View>
              <Text className="text-white">
                2. Once you have registered your new MFA details in your
                authenticator app, enter the code generated by your
                authenticator app here to complete the setup.
              </Text>
              <View className="flex-row mt-4 mb-2">
                <TextInput
                  placeholder="Enter authenticator code"
                  value={token}
                  onChangeText={setToken}
                  className="flex-1 rounded-l-lg bg-gray-800 px-3 text-white"
                />
                <Pressable
                  disabled={!canVerify}
                  onPress={verifyMfa}
                  className={clsx(
                    'px-4 py-2 rounded-r-lg flex-row items-center gap-2',
                    {
                      'bg-gray-400/25 opacity-50': !canVerify,
                      'bg-cyan-800 active:bg-cyan-700': canVerify,
                    },
                  )}
                >
                  {verifyMutation.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color="white"
                    />
                  )}
                  <Text className="text-medium text-white">Verify</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
          {newMfa ? null : (
            <>
              <Text className="text-gray-200 mx-4 mt-6 text-sm">
                Create new MFA method
              </Text>
              <View
                className={clsx('flex-row mt-2 m-3', {
                  'opacity-50': !!newMfa,
                })}
              >
                <TextInput
                  placeholder="Name for new MFA method"
                  value={name}
                  onChangeText={setName}
                  readOnly={!!newMfa}
                  className="flex-1 rounded-l-lg bg-gray-800 px-3 text-white"
                />
                <Pressable
                  disabled={!canCreate}
                  onPress={createMfa}
                  className={clsx(
                    'px-4 py-2 rounded-r-lg flex-row items-center gap-2',
                    {
                      'bg-gray-400/25 opacity-50': !canCreate,
                      'bg-cyan-800 active:bg-cyan-700': canCreate,
                    },
                  )}
                >
                  {createMutation.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <MaterialCommunityIcons
                      name="text-box-plus-outline"
                      size={20}
                      color="white"
                    />
                  )}
                  <Text className="text-medium text-white">Create</Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
