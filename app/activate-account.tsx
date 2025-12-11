import Button from '@/components/Button'
import InstanceProvider from '@/components/InstanceProvider'
import { Colors } from '@/constants/Colors'
import { SAVED_INSTANCE_KEY } from '@/lib/api/auth'
import { useAccountActivateMutation } from '@/lib/api/user'
import { useAuth } from '@/lib/contexts/AuthContext'
import useAsyncStorage from '@/lib/useLocalStorage'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Image } from 'expo-image'
import { useLocalSearchParams } from 'expo-router'
import { Text, View, ScrollView } from 'react-native'

export default function ActivateScreen() {
  const sx = useSafeAreaPadding()
  const { envStatus } = useAuth()
  const { code, email } = useLocalSearchParams<{
    code: string
    email: string
  }>()
  const { value: savedInstance, setValue: setSavedInstance } =
    useAsyncStorage<string>(SAVED_INSTANCE_KEY)

  const mutation = useAccountActivateMutation()

  function activateAccount() {
    mutation.mutate({ code, email })
  }

  return (
    <View
      className="flex-1 mx-4"
      style={{
        ...sx,
        backgroundColor: Colors.dark.background,
      }}
    >
      <ScrollView>
        <Image
          source={require('@/assets/images/logo_w.png')}
          style={{
            marginTop: 48,
            width: 120,
            height: 120,
            alignSelf: 'center',
          }}
        />
        <Text className="text-white text-center pt-6 pb-12">
          Hi! We are glad to have you here 😄
        </Text>
        <InstanceProvider
          savedInstance={savedInstance}
          setSavedInstance={setSavedInstance}
          envStatus={envStatus}
        >
          <View className="pt-12 pb-6">
            {mutation.isError ? (
              <Text className="text-red-200 leading-relaxed">
                Something went wrong! Try again in a few minutes and if it does
                not work please send an email to the administrator of the server
              </Text>
            ) : mutation.isSuccess ? (
              <Text className="text-green-100 leading-relaxed">
                Your account was activated! Now, for the last step, an admin
                must approve your registration manually. This can take some time
                depending on timezone differences, so please be patient. You
                will receive another email when your account is approved.
              </Text>
            ) : (
              <Button
                text="Activate Account"
                onPress={activateAccount}
                disabled={!savedInstance || mutation.isPending}
              />
            )}
          </View>
        </InstanceProvider>
      </ScrollView>
    </View>
  )
}
