import { Text, TouchableOpacity, View, ViewStyle } from 'react-native'
import { Image } from 'expo-image'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { DashboardMode } from '@/lib/api/dashboard'
import {
  getPrivateOptionValue,
  PrivateOptionNames,
  useSettings,
} from '@/lib/api/settings'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useCSSString } from '@/lib/cssVariables'
import { useSmallScreenCheck } from '@/lib/styles'
import { clsx } from 'clsx'

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

  const isSmallScreen = useSmallScreenCheck()
  const white = useCSSString('--color-white')
  const gray400 = useCSSString('--color-gray-400')
  const gray600 = useCSSString('--color-gray-600')
  const baseStyles: ViewStyle = { paddingVertical: 6 }
  const borderStyles: ViewStyle = {
    paddingVertical: 6,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: gray600,
  }

  return (
    <View className="flex-row items-center">
      {isSmallScreen ? (
        <>
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
            style={{
              width: forceClassicLogo ? 64 : 32,
              height: 32,
              marginLeft: 4,
              marginRight: 8,
            }}
          />
        </>
      ) : null}

      <View
        className={clsx(
          'flex-row gap-2 items-center bg-slate-800 px-2',
          isSmallScreen ? 'rounded-full' : 'rounded-lg -mx-2',
        )}
      >
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
              style={i > 0 ? borderStyles : baseStyles}
              color={mode === m ? white : gray400}
            />
            {mode === m || !isSmallScreen ? (
              <Text
                className={clsx(
                  'font-semibold text-base pr-1',
                  mode === m ? 'text-white' : 'text-gray-400',
                )}
              >
                {MODE_LABELS[m]}
              </Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}
