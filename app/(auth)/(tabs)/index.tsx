import { useAuth } from "@/lib/contexts/AuthContext";
import { router, Stack } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { ThemedView } from '@/components/ThemedView'
import { useCurrentUser } from "@/lib/api/user";
import { formatSmallAvatar } from "@/lib/formatters";
import Dashboard from "@/components/dashboard/Dashboard";
import { DashboardMode } from "@/lib/api/dashboard";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from "react-native-popup-menu";
import { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import colors from "tailwindcss/colors";
import { cssInterop } from 'nativewind'
import { Image } from 'expo-image'

cssInterop(Image, { className: "style" })

const MODES = [
  DashboardMode.FEED,
  DashboardMode.LOCAL,
  DashboardMode.FEDERATED,
] as const
const MODE_LABELS = {
  [DashboardMode.FEED]: 'Feed',
  [DashboardMode.LOCAL]: 'Local',
  [DashboardMode.FEDERATED]: 'Federated',
} as const
const MODE_ICONS = {
  [DashboardMode.FEED]: 'home-variant-outline',
  [DashboardMode.LOCAL]: 'server',
  [DashboardMode.FEDERATED]: 'earth',
} as const

type PublicDashboardMode = Exclude<DashboardMode, DashboardMode.PRIVATE>

export default function Index() {
  const { setToken } = useAuth()
  const { data: user } = useCurrentUser()
  const [mode, setMode] = useState<PublicDashboardMode>(DashboardMode.FEED)

  function logout() {
    setToken(null)
  }

  return (
    <ThemedView className="flex-1">
      <Stack.Screen
        options={{
          headerTitle: () => null,
          headerLeft: () => {
            return (
              <Menu onSelect={setMode}>
                <MenuTrigger style={{ marginLeft: 8 }}>
                  <View className="flex-row items-center">
                    <Image
                      className="ml-1 mr-3"
                      style={{ width: 32, height: 32 }}
                      source={{ uri: 'https://app.wafrn.net/assets/logo_w.png' }}
                    />
                    <View className="flex-row gap-2 items-center rounded-full bg-slate-800 pl-2 pr-1 py-1">
                      <MaterialCommunityIcons name={MODE_ICONS[mode]} size={20} color='white' />
                      <Text className="text-white font-semibold text-lg">
                        {MODE_LABELS[mode]}
                      </Text>
                      <MaterialCommunityIcons className="" name='chevron-down' color={colors.gray[400]} size={24} />
                    </View>
                  </View>
                </MenuTrigger>
                <MenuOptions customStyles={{
                  optionsContainer: {
                    transformOrigin: 'top left',
                    marginTop: 42,
                    marginLeft: 52,
                    borderRadius: 8,
                  },
                }}>
                  {MODES.map((m, i) => (
                    <MenuOption
                      key={m}
                      value={m}
                      style={{
                        padding: 12,
                        borderTopWidth: i > 0 ? 1 : 0,
                        borderTopColor: colors.gray[200],
                        flexDirection: 'row',
                        gap: 12,
                      }}
                    >
                      <MaterialCommunityIcons name={MODE_ICONS[m]} size={20} color='black' />
                      <Text className="text-sm flex-grow">{MODE_LABELS[m]}</Text>
                      {mode === m && (
                        <MaterialCommunityIcons name='check' size={20} color='black' />
                      )}
                    </MenuOption>
                  ))}
                </MenuOptions>
              </Menu>
            )
          },
          headerRight: () => {
            if (!user) return undefined
            return (
              <Menu>
                <MenuTrigger style={{ marginRight: 8 }} customStyles={{ TriggerTouchableComponent: TouchableOpacity }}>
                  <Image
                    className="rounded-full"
                    source={{ uri: formatSmallAvatar(user.avatar) }}
                    style={{ width: 40, height: 40 }}
                  />
                </MenuTrigger>
                <MenuOptions customStyles={{
                  optionsContainer: {
                    transformOrigin: 'top right',
                    marginTop: 48,
                    borderRadius: 8,
                  },
                }}>
                  <MenuOption
                    text='My profile'
                    onSelect={() => router.push(`/user/${user.url}`)}
                    style={{
                      padding: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.gray[200],
                    }}
                  />
                  <MenuOption
                    text='Sign out'
                    onSelect={logout}
                    style={{
                      padding: 12,
                    }}
                  />
                </MenuOptions>
              </Menu>
            )
          }
        }}
      />
      <Dashboard mode={mode} />
    </ThemedView>
  )  
}
