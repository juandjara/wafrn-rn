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
import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { encodeQR } from 'qr'
import { saveFileToGallery } from '@/lib/downloads'
import { File, Paths } from 'expo-file-system'
import { setStringAsync } from 'expo-clipboard'
import { Image } from 'expo-image'
import { useToasts } from '@/lib/toasts'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useMutation } from '@tanstack/react-query'

export default function MfaSettings() {
  const sx = useSafeAreaPadding()
  const [name, setName] = useState('')
  const [token, setToken] = useState('')
  const { data, isLoading, isFetching } = useMfaDetails()
  const mfas = data ?? []
  const createMutation = useCreateMfaMutation()
  const verifyMutation = useVerifyMfaMutation()
  const deleteMutation = useDeleteMfaMutation()
  const { showToastSuccess, showToastError } = useToasts()

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

  const downloadMutation = useMutation({
    mutationKey: ['download-qr'],
    mutationFn: async () => {
      if (qrCodeSvg && newMfa?.name) {
        const filename = `qr-${newMfa.name}.svg`
        const file = new File(Paths.cache, filename)
        file.write(qrCodeSvg)
        await saveFileToGallery(file.uri)
      }
    },
    onSuccess: () => showToastSuccess('QR code downloaded to your gallery'),
    onError: (error) => {
      console.error('Error downloading QR code', error)
      showToastError('Failed to download QR code')
    },
  })

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
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: sx.paddingBottom + 20,
        }}
      >
        {isLoading && <Loading />}
        {!isLoading && mfas.length === 0 && (
          <View className="my-6 items-center justify-center">
            <Text className="text-gray-200 font-medium text-lg leading-6 grow shrink">
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
            <View className="grow shrink">
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
        <View className="h-hairline mt-0 bg-gray-500" />
        {newMfa ? (
          <View className="m-3">
            <Text className="text-white mt-3">
              1. To complete the setup of {`"${newMfa.name}"`}, choose one of
              the following options for registering the MFA details in your
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
                onPress={() => downloadMutation.mutate()}
              >
                {downloadMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <MaterialCommunityIcons
                    name="download"
                    size={20}
                    color="white"
                  />
                )}
                <Text className="text-white">
                  {downloadMutation.isPending
                    ? 'Downloading...'
                    : 'Download QR code'}
                </Text>
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
              authenticator app, enter the code generated by your authenticator
              app here to complete the setup.
            </Text>
            <View className="relative mt-4 mb-2">
              <TextInput
                placeholder="Enter authenticator code"
                value={token}
                onChangeText={setToken}
                className="rounded-lg p-3 pr-32 text-white border border-gray-600"
              />
              <Pressable
                disabled={!canVerify}
                onPress={verifyMfa}
                className={clsx(
                  'absolute top-0.5 right-0.5 mt-[3px] mr-[3px] px-4 py-2 rounded-md flex-row items-center gap-2',
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
              className={clsx('relative mt-2 m-3', {
                'opacity-50': !!newMfa,
              })}
            >
              <TextInput
                placeholder="Name for new MFA method"
                value={name}
                onChangeText={setName}
                readOnly={!!newMfa}
                className="rounded-lg p-3 pr-32 text-white border border-gray-600"
              />
              <Pressable
                disabled={!canCreate}
                onPress={createMfa}
                className={clsx(
                  'absolute top-1 right-1 mr-px px-4 py-2 mt-px rounded-md flex-row items-center gap-2',
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
      </KeyboardAwareScrollView>
    </View>
  )
}
