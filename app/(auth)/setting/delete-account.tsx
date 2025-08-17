import Header, { HEADER_HEIGHT } from '@/components/Header'
import { useDeleteAccountMutation } from '@/lib/api/user'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { useState } from 'react'
import { Button, Text, TextInput, View } from 'react-native'
import colors from 'tailwindcss/colors'

export default function DeleteAccount() {
  const sx = useSafeAreaPadding()
  const [password, setPassword] = useState('')
  const deleteAccountMutation = useDeleteAccountMutation()

  return (
    <View style={{ ...sx, flex: 1, paddingTop: sx.paddingTop + HEADER_HEIGHT }}>
      <Header title="Delete my account" />
      <View className="p-4">
        <Text className="text-white">
          If you are sure you want to delete your account, please type your
          password in the field below.
        </Text>
        <Text className="text-white pt-4">
          Your account will be deactivated and you will be logged out. All your
          data will be deleted in the next 24 hours.
        </Text>
        <TextInput
          secureTextEntry
          autoCapitalize="none"
          placeholder="Password"
          className="p-3 my-6 border border-gray-500 rounded placeholder:text-gray-400"
          value={password}
          onChangeText={setPassword}
        />
        <Button
          disabled={!password || deleteAccountMutation.isPending}
          title={
            deleteAccountMutation.isPending
              ? 'Deleting...'
              : 'Delete my account'
          }
          color={colors.red[700]}
          onPress={() => deleteAccountMutation.mutate(password)}
        />
      </View>
    </View>
  )
}
