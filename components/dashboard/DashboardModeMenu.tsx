import { Text, TouchableOpacity, View } from 'react-native'
import { Image } from 'expo-image'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { DashboardMode } from '@/lib/api/dashboard'
import {
  getPrivateOptionValue,
  PrivateOptionNames,
  useSettings,
} from '@/lib/api/settings'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useResolveClassNames } from 'uniwind'

const MODES = [
  DashboardMode.FEED,
  DashboardMode.LOCAL,
  DashboardMode.FEDERATED,
] as const

const MODE_LABELS = {
  [DashboardMode.FEED]: 'Home',
  [DashboardMode.LOCAL]: 'Local',
  [DashboardMode.FEDERATED]: 'Wafrn & Friends',
} as const
const MODE_ICONS = {
  [DashboardMode.FEED]: 'home-variant-outline',
  [DashboardMode.LOCAL]: 'server',
  [DashboardMode.FEDERATED]: 'earth',
} as const

export type PublicDashboardMode =
  | DashboardMode.FEED
  | DashboardMode.LOCAL
  | DashboardMode.FEDERATED

export default function DashboardModeMenu({
  mode,
  setMode,
}: {
  mode: PublicDashboardMode
  setMode: (mode: PublicDashboardMode) => void
}) {
  const { env } = useAuth()
  const { data: settings } = useSettings()
  const forceClassicLogo = getPrivateOptionValue(
    settings?.options || [],
    PrivateOptionNames.ForceClassicLogo,
  )
  const logoUrl = forceClassicLogo
    ? `${env?.BASE_URL}/assets/classicLogo.png`
    : `${env?.BASE_URL}/assets/logo_w.png`

  const baseCn = useResolveClassNames('text-gray-400 py-1.5')
  const borderCn = useResolveClassNames('pl-2 border-l border-l-gray-600')
  const selectedCn = useResolveClassNames('text-white')

  return (
    <View className="flex-row items-center">
      {__DEV__ && (
        <MaterialCommunityIcons
          name="cog"
          size={20}
          color="black"
          className="mr-1 absolute bottom-0 left-5 z-20"
        />
      )}
      <Image
        source={{ uri: logoUrl }}
        style={[
          useResolveClassNames('ml-2 mr-4'),
          { width: forceClassicLogo ? 64 : 32, height: 32 },
        ]}
      />
      <View className="flex-row gap-2 items-center rounded-full bg-slate-800 px-2">
        {MODES.map((m, i) => (
          <TouchableOpacity
            key={m}
            onPress={() => setMode(m)}
            className="flex-row items-center gap-2"
            aria-label={`Show ${MODE_LABELS[m]} feed`}
          >
            <MaterialCommunityIcons
              name={MODE_ICONS[m]}
              size={24}
              style={[
                baseCn,
                i > 0 ? borderCn : undefined,
                mode === m ? selectedCn : undefined,
              ]}
            />
            {mode === m ? (
              <Text className="text-white font-semibold text-lg pr-1">
                {MODE_LABELS[m]}
              </Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}
