import Button from '@/components/Button'
import InstanceProvider from '@/components/InstanceProvider'
import { Colors } from '@/constants/Colors'
import { useAccountActivateMutation } from '@/lib/api/user'
import { useAuth } from '@/lib/contexts/AuthContext'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Image } from 'expo-image'
import { Link, useLocalSearchParams } from 'expo-router'
import { Text, View, ScrollView } from 'react-native'

export default function ActivateScreen() {
  const sx = useSafeAreaPadding()
  const { status, instance, setInstance } = useAuth()
  const { code, email } = useLocalSearchParams<{
    code: string
    email: string
  }>()

  const mutation = useAccountActivateMutation()

  function activateAccount() {
    if (!mutation.isPending) {
      mutation.mutate({ code, email })
    }
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
          savedInstance={instance}
          setSavedInstance={setInstance}
          envStatus={status}
        >
          <View className="pt-12 pb-6">
            {mutation.isError ? (
              <Text className="text-red-200 leading-relaxed">
                Something went wrong! Try again in a few minutes and if it does
                not work please send an email to the administrator of the server
              </Text>
            ) : mutation.isSuccess ? (
              <View>
                <Text className="text-green-100 leading-relaxed">
                  Your account was activated! Now, for the last step, an admin
                  must approve your registration manually. This can take some
                  time depending on timezone differences, so please be patient.
                  You will receive another email when your account is approved.
                </Text>
                <Link href="/sign-in" className="text-blue-500 my-2">
                  Back to login
                </Link>
              </View>
            ) : (
              <Button
                text="Activate Account"
                onPress={activateAccount}
                disabled={mutation.isPending}
              />
            )}
          </View>
        </InstanceProvider>
      </ScrollView>
    </View>
  )
}
