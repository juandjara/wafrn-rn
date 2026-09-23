import Button from '@/components/Button'
import Header, { useHeaderInset } from '@/components/Header'
import Loading from '@/components/Loading'
import ModalSignIn from '@/components/ModalSignIn'
import { useAccounts, useCurrentUser } from '@/lib/api/user'
import { formatUserUrl } from '@/lib/formatters'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { CONTENT_MAX_WIDTH } from '@/lib/styles'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { clsx } from 'clsx'
import { Image } from 'expo-image'
import { useState } from 'react'
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useCSSString } from '@/lib/cssVariables'
// import SaveButton from '@/components/settings/SaveButton'
// import { Collapsible } from '@/components/Collapsible'

type AccountMap = Record<
  string,
  {
    main: boolean
    shorthand: string
  }
>

export default function AccountSwitcherSettings() {
  const sx = useSafeAreaPadding()
  const headerInset = useHeaderInset()
  const { data: me } = useCurrentUser()
  const {
    accounts,
    loading,
    addAccount,
    editAccounts,
    removeAccount,
    selectAccount,
    removeAll,
  } = useAccounts()
  const [showLogin, setShowLogin] = useState(false)
  const [editMode, setEditMode] = useState(false)

  function buildAccountMap(acc: typeof accounts) {
    return Object.fromEntries(
      acc.map((a) => [
        a.id,
        {
          main: a.main ?? false,
          shorthand: a.shorthand ?? '',
        },
      ]),
    )
  }

  const [_form, setForm] = useState<AccountMap | null>(null)
  const form = _form ?? buildAccountMap(accounts)

  const gray200 = useCSSString('--color-gray-200')
  const indigo400 = useCSSString('--color-indigo-400')

  const gray700 = useCSSString('--color-gray-700')
  const cyan900 = useCSSString('--color-cyan-900')
  const cyan600 = useCSSString('--color-cyan-600')
  const gray300 = useCSSString('--color-gray-300')

  function toggleMain(id: string) {
    const newForm = {} as AccountMap
    for (const account of accounts) {
      const entry = form[account.id]
      newForm[account.id] = {
        ...entry,
        main: id === account.id ? !entry?.main : false,
      }
    }
    setForm(newForm)
  }
  function updateShorthand(id: string, shorthand: string) {
    setForm({
      ...form,
      [id]: {
        ...form[id],
        shorthand,
      },
    })
  }

  function onLoginComplete(token: string, instance: string) {
    setShowLogin(false)
    addAccount(token, instance)
  }

  function confirmRemoveAll() {
    Alert.alert(
      'Delete all saved accounts',
      'Are you sure you want to delete all saved accounts? The account you are current logged in will not be deleted but if you want to login to any other account you will have to enter the credentials again',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: removeAll },
      ],
    )
  }

  function handleSave() {
    editAccounts(form)
    setEditMode(false)
  }

  return (
    <View
      style={{
        ...sx,
        flex: 1,
        position: 'relative',
        paddingTop: headerInset,
      }}
    >
      <Header
        title="Account Switcher"
        // right={
        //   editMode ? (
        //     <SaveButton isPending={loading} onPress={handleSave} />
        //   ) : (
        //     <Pressable
        //       className="p-1.5 rounded-full active:bg-gray-300/30"
        //       accessibilityLabel="Enter edit mode"
        //       onPress={() => setEditMode(true)}
        //     >
        //       <MaterialCommunityIcons name="pencil" color="white" size={20} />
        //     </Pressable>
        //   )
        // }
      />
      {loading && (
        <View className="absolute top-0 left-0 right-0">
          <Loading />
        </View>
      )}
      <View className="flex-row gap-2 items-center mb-2">
        <Text className="text-white px-4 text-sm grow">
          Click an account to switch
        </Text>
        <Pressable
          className={clsx(
            'flex-row items-center gap-2 active:bg-white/10 rounded-lg p-2',
            { 'opacity-50': accounts.length === 0 },
          )}
          onPress={confirmRemoveAll}
          disabled={accounts.length === 0}
        >
          <Text className="text-indigo-300 text-sm">Delete all</Text>
          <MaterialCommunityIcons
            name="delete-outline"
            size={20}
            color={indigo400}
          />
        </Pressable>
      </View>
      <ScrollView className="p-2">
        {/* <Collapsible title="How does this work?" className="mb-4">
          <Text className="text-white">
            Here you can toggle one of your accounts as{' '}
            <Text className="italic">Main</Text> and configure the editor
            shorthand for each account. A <Text className="italic">Main</Text>{' '}
            label will show next to the url in account pickers.
          </Text>
          <Text>{'\n'}</Text>
          <Text className="text-white">
            For the editor shorthand, each account can have assigned{' '}
            <Text className="font-bold">a prefix</Text> that, when typed at the
            start of writing any woot, reply or quote, will make the editor
            instantly switch to that account. This prefix can be any text or
            unicode emoji
          </Text>
        </Collapsible> */}
        {accounts.map((acc, index) => (
          <View key={acc.id}>
            <Pressable
              className="flex-row px-2 mb-3 gap-3 items-center bg-blue-950/50 rounded-2xl"
              disabled={acc.id === me?.id}
              onPress={() => selectAccount(index)}
            >
              <View className="relative my-1.5 rounded-xl bg-gray-100 shrink-0">
                <Image
                  source={{ uri: acc.avatar }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                  }}
                />
                {acc?.avatar ? null : (
                  <Text className="absolute inset-0 font-medium text-center uppercase z-10 text-2xl p-2">
                    {acc.url.substring(0, 1)}
                  </Text>
                )}
              </View>
              <Text className="text-white text-base flex-1">
                {formatUserUrl(acc.url)}
                {/* {acc.main ? (
                  <Text className="italic text-sm text-gray-300"> Main</Text>
                ) : null} */}
              </Text>
              <TouchableOpacity
                className="p-2 rounded-full"
                disabled={acc.id === me?.id}
                accessibilityLabel="Delete account"
                onPress={() => {
                  Alert.alert(
                    'Delete account',
                    `Do you want to remove ${formatUserUrl(acc.url)} from the account switcher?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Switch', onPress: () => removeAccount(acc.id) },
                    ],
                  )
                }}
              >
                <MaterialCommunityIcons
                  name={acc.id === me?.id ? 'check' : 'trash-can-outline'}
                  size={24}
                  color={gray200}
                />
              </TouchableOpacity>
            </Pressable>
            {editMode ? (
              <View className="flex-row items-center mb-3">
                <TextInput
                  value={form[acc.id]?.shorthand ?? ''}
                  onChangeText={(text) => updateShorthand(acc.id, text)}
                  placeholder="Editor shorthand"
                  placeholderTextColorClassName="accent-gray-500"
                  className="flex-1 p-2 rounded-lg text-white border border-gray-600"
                />
                <Pressable
                  className="flex-1 flex-row items-center gap-4 px-4 py-2 active:bg-white/10"
                  onPress={() => toggleMain(acc.id)}
                >
                  <Text className="text-white text-base">Main</Text>
                  <Switch
                    value={!!form[acc.id]?.main}
                    onValueChange={() => toggleMain(acc.id)}
                    trackColor={{ false: gray700, true: cyan900 }}
                    thumbColor={form[acc.id]?.main ? cyan600 : gray300}
                  />
                </Pressable>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
      <View className="my-4">
        <View className="px-4">
          <Button
            text={
              <>
                <MaterialCommunityIcons name="plus" size={20} color="white" />
                <Text>Add account</Text>
              </>
            }
            onPress={() => setShowLogin(true)}
          />
        </View>
        <Modal
          visible={showLogin}
          onRequestClose={() => setShowLogin(false)}
          animationType="slide"
          transparent
        >
          <Pressable
            className="bg-black/50 flex-1 max-h-40"
            onPress={() => setShowLogin(false)}
          />
          <View className="flex-1 bg-black/50">
            <View
              className="flex-1 w-full"
              style={{ maxWidth: CONTENT_MAX_WIDTH, marginHorizontal: 'auto' }}
            >
              <ModalSignIn onLoginComplete={onLoginComplete} />
            </View>
          </View>
        </Modal>
      </View>
    </View>
  )
}
