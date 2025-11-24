import {
  useBlockMutation,
  useMuteMutation,
  useServerBlockMutation,
} from '@/lib/api/mutes-and-blocks'
import { User } from '@/lib/api/user'
import { useAuth, useParsedToken } from '@/lib/contexts/AuthContext'
import { useBiteUserMutation } from '@/lib/interaction'
import { optionStyleBig } from '@/lib/styles'
import { FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons'
import { useMemo, useState } from 'react'
import { Share, TouchableOpacity } from 'react-native'
import { useCSSVariable } from 'uniwind'
import MenuItem from '../MenuItem'
import BottomSheet from '../BottomSheet'

export default function UserActionsMenu({ user }: { user: User }) {
  const gray400 = useCSSVariable('--color-gray-400') as string
  const gray500 = useCSSVariable('--color-gray-500') as string
  const gray600 = useCSSVariable('--color-gray-600') as string

  const { env } = useAuth()
  const me = useParsedToken()
  const isMe = me?.userId === user.id

  const muteMutation = useMuteMutation(user)
  const blockMutation = useBlockMutation(user)
  const serverBlockMutation = useServerBlockMutation(user)
  const biteMutation = useBiteUserMutation()

  const [open, setOpen] = useState(false)

  const options = useMemo(
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
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{
          padding: 6,
          backgroundColor: `${gray500}20`,
          borderRadius: 40,
        }}
      >
        <MaterialCommunityIcons
          size={20}
          name={`dots-vertical`}
          color={gray400}
          style={{ opacity: 0.75 }}
        />
      </TouchableOpacity>
      <BottomSheet open={open} setOpen={setOpen}>
        {options.map((option, i) => (
          <MenuItem
            key={i}
            label={option.name}
            action={() => {
              option.action()
              setOpen(false)
            }}
            icon={option.icon}
            disabled={option.disabled}
            style={optionStyleBig(i)}
          />
        ))}
      </BottomSheet>
    </>
  )
}
