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
import { Text } from 'react-native'
import { Share } from 'react-native'
import { TouchableHighlight } from 'react-native'
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
  renderers,
} from 'react-native-popup-menu'
import colors from 'tailwindcss/colors'

export default function UserActionsMenu({ user }: { user: User }) {
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
        icon: (
          <FontAwesome6
            name="drumstick-bite"
            size={20}
            color={colors.gray[600]}
          />
        ),
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
          backgroundColor: `${colors.gray[500]}20`,
          borderRadius: 40,
        }}
      >
        <MaterialCommunityIcons
          size={24}
          name={`dots-vertical`}
          color={colors.gray[400]}
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
                color={colors.gray[600]}
              />
            ) : (
              action.icon
            )}
            <Text className="text-sm flex-grow">{action.name}</Text>
          </MenuOption>
        ))}
      </MenuOptions>
    </Menu>
  )
}
