import { Text, TouchableOpacity, View } from 'react-native'
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu'
import { Image } from 'expo-image'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { DashboardMode } from '@/lib/api/dashboard'
import {
  getPrivateOptionValue,
  PrivateOptionNames,
  useSettings,
} from '@/lib/api/settings'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useCSSVariable, useResolveClassNames } from 'uniwind'

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
  const menuCnFirst = useResolveClassNames('flex-row p-3 gap-3')
  const menuCn = useResolveClassNames(
    'flex-row border-t border-gray-200 p-3 gap-3',
  )
  const gray400 = useCSSVariable('--color-gray-400') as string
  const { env } = useAuth()
  const { data: settings } = useSettings()
  const forceClassicLogo = getPrivateOptionValue(
    settings?.options || [],
    PrivateOptionNames.ForceClassicLogo,
  )
  const logoUrl = forceClassicLogo
    ? `${env?.BASE_URL}/assets/classicLogo.png`
    : `${env?.BASE_URL}/assets/logo_w.png`

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
          useResolveClassNames('ml-1 mr-3'),
          { width: forceClassicLogo ? 64 : 32, height: 32 },
        ]}
      />
      <View className="flex-row gap-2 items-center rounded-full bg-slate-800 px-2 py-1">
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
              color="white"
            />
            {mode === m ? (
              <Text className="text-white font-semibold text-lg">
                {MODE_LABELS[m]}
              </Text>
            ) : null}
            {i < MODES.length - 1 && (
              <View className="ml-px h-6 border-l border-l-gray-400" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  // return (
  //   <Menu onSelect={setMode}>
  //     <MenuTrigger>
  //       <View className="flex-row items-center">
  //         {__DEV__ && (
  //           <MaterialCommunityIcons
  //             name="cog"
  //             size={20}
  //             color="black"
  //             className="mr-1 absolute bottom-0 left-5 z-20"
  //           />
  //         )}
  //         <Image
  //           source={{ uri: logoUrl }}
  //           style={[
  //             useResolveClassNames('ml-1 mr-3'),
  //             { width: forceClassicLogo ? 64 : 32, height: 32 },
  //           ]}
  //         />
  //         <View className="flex-row gap-2 items-center rounded-full bg-slate-800 pl-2 pr-1 py-1">
  //           <MaterialCommunityIcons
  //             name={MODE_ICONS[mode]}
  //             size={20}
  //             color="white"
  //           />
  //           <Text className="text-white font-semibold text-lg">
  //             {MODE_LABELS[mode]}
  //           </Text>
  //           <MaterialCommunityIcons
  //             className=""
  //             name="chevron-down"
  //             color={gray400}
  //             size={24}
  //           />
  //         </View>
  //       </View>
  //     </MenuTrigger>
  //     <MenuOptions
  //       customStyles={{
  //         optionsContainer: {
  //           transformOrigin: 'top left',
  //           marginTop: 42,
  //           marginLeft: 52,
  //           borderRadius: 8,
  //         },
  //       }}
  //     >
  //       {MODES.map((m, i) => (
  //         <MenuOption key={m} value={m} style={i > 0 ? menuCn : menuCnFirst}>
  //           <MaterialCommunityIcons
  //             name={MODE_ICONS[m]}
  //             size={20}
  //             color="black"
  //           />
  //           <Text className="text-sm flex-grow">{MODE_LABELS[m]}</Text>
  //           {mode === m && (
  //             <MaterialCommunityIcons name="check" size={20} color="black" />
  //           )}
  //         </MenuOption>
  //       ))}
  //     </MenuOptions>
  //   </Menu>
  // )
}
