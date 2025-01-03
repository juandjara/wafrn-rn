import { Text, View } from "react-native"
import { Menu, MenuOption, MenuOptions, MenuTrigger } from "react-native-popup-menu"
import { Image } from 'expo-image'
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { DashboardMode } from "@/lib/api/dashboard"
import colors from "tailwindcss/colors"
import { getPrivateOptionValue, PrivateOptionNames, useSettings } from "@/lib/api/settings"
import { useAuth } from "@/lib/contexts/AuthContext"

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

export type PublicDashboardMode = Exclude<DashboardMode, DashboardMode.PRIVATE | DashboardMode.MUTED_POSTS>

export default function DashboardModeMenu({
  mode, setMode
}: {
  mode: PublicDashboardMode
  setMode: (mode: PublicDashboardMode) => void
}) {
  const { env } = useAuth()
  const { data: settings } = useSettings()
  const forceClassicLogo = getPrivateOptionValue(settings?.options || [], PrivateOptionNames.ForceClassicLogo)
  const logoUrl = forceClassicLogo ? `${env?.BASE_URL}/assets/classicLogo.png` : `${env?.BASE_URL}/assets/logo_w.png`

  return (
    <Menu onSelect={setMode}>
      <MenuTrigger>
        <View className="flex-row items-center">
          <Image
            className="ml-1 mr-3"
            style={{ width: forceClassicLogo ? 64 : 32, height: 32 }}
            source={{ uri: logoUrl }}
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
}
