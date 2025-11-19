import {
  useBlockMutation,
  useMuteMutation,
  useServerBlockMutation,
} from '@/lib/api/mutes-and-blocks'
import { User } from '@/lib/api/user'
import { useAuth, useParsedToken } from '@/lib/contexts/AuthContext'
import { useBiteUserMutation } from '@/lib/interaction'
import { optionStyle } from '@/lib/styles'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons'
import { useMemo } from 'react'
import { Text, Share, TouchableHighlight } from 'react-native'
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
  renderers,
} from 'react-native-popup-menu'
import { useCSSVariable } from 'uniwind'

export default function UserActionsMenu({ user }: { user: User }) {
  const gray400 = useCSSVariable('--color-gray-400') as string
  const gray500 = useCSSVariable('--color-gray-500') as string
  const gray600 = useCSSVariable('--color-gray-600') as string
  const sx = useSafeAreaPadding()
  const { env } = useAuth()
  const me = useParsedToken()
  const isMe = me?.userId === user.id
  const muteMutation = useMuteMutation(user)
  const blockMutation = useBlockMutation(user)
  const serverBlockMutation = useServerBlockMutation(user)
  const biteMutation = useBiteUserMutation()
  const actions = useMemo(
    () => [
      {
        name: 'Share user',
        icon: 'share-variant' as const,
        action: () =>
          user &&
          Share.share({
            message: user.remoteId ?? `${env?.BASE_URL}/blog/${user.url}`,
          }),
      },
      {
        name: 'Bite user',
        icon: <FontAwesome6 name="drumstick-bite" size={20} color={gray600} />,
        disabled: isMe || biteMutation.isPending,
        action: () => biteMutation.mutate(user.id),
      },
      {
        name: `${user.muted ? 'Unmute' : 'Mute'} user`,
        icon: 'volume-off' as const,
        disabled: isMe || muteMutation.isPending,
        action: () => muteMutation.mutate(user.muted),
      },
      {
        name: `${user.blocked ? 'Unblock' : 'Block'} user`,
        icon: 'account-cancel-outline' as const,
        disabled: isMe || blockMutation.isPending,
        action: () => blockMutation.mutate(user.blocked),
      },
      {
        name: `${user.serverBlocked ? 'Unblock' : 'Block'} server`,
        icon: 'server-off' as const,
        disabled: isMe || serverBlockMutation.isPending,
        action: () => serverBlockMutation.mutate(user.serverBlocked),
      },
    ],
    [
      gray600,
      user,
      env,
      isMe,
      muteMutation,
      blockMutation,
      serverBlockMutation,
      biteMutation,
    ],
  )

  return (
    <Menu renderer={renderers.SlideInMenu}>
      <MenuTrigger
        style={{
          padding: 6,
          backgroundColor: `${gray500}20`,
          borderRadius: 40,
        }}
      >
        <MaterialCommunityIcons
          size={24}
          name={`dots-vertical`}
          color={gray400}
        />
      </MenuTrigger>
      <MenuOptions
        customStyles={{
          OptionTouchableComponent: TouchableHighlight,
          optionsContainer: {
            paddingBottom: sx.paddingBottom,
            borderRadius: 16,
          },
        }}
      >
        {actions.map((action, i) => (
          <MenuOption
            key={i}
            disabled={action.disabled}
            style={{
              ...optionStyle(i),
              padding: 16,
              gap: 16,
              opacity: action.disabled ? 0.5 : 1,
            }}
            onSelect={action.action}
          >
            {typeof action.icon === 'string' ? (
              <MaterialCommunityIcons
                name={action.icon}
                size={20}
                color={gray600}
              />
            ) : (
              action.icon
            )}
            <Text className="text-sm grow">{action.name}</Text>
          </MenuOption>
        ))}
      </MenuOptions>
    </Menu>
  )
}
