import {
  useBlockMutation,
  useFollowedUserFilterMutation,
  useMuteMutation,
  useServerBlockMutation,
} from '@/lib/api/mutes-and-blocks'
import { useSettings } from '@/lib/api/settings'
import { User, useRefetchUserDataMutation } from '@/lib/api/user'
import { useAuth, useParsedToken } from '@/lib/contexts/AuthContext'
import { optionStyleBig } from '@/lib/styles'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useMemo, useState } from 'react'
import { Alert, Share, TouchableOpacity } from 'react-native'
import { useCSSString } from '@/lib/cssVariables'
import MenuItem from '../MenuItem'
import BottomSheet from '../BottomSheet'
import ReportPostModal from '../posts/ReportPostModal'

export default function UserActionsMenu({ user }: { user: User }) {
  const gray400 = useCSSString('--color-gray-400')
  const gray500 = useCSSString('--color-gray-500')

  const { env } = useAuth()
  const me = useParsedToken()
  const isMe = me?.userId === user.id

  const muteMutation = useMuteMutation(user)
  const blockMutation = useBlockMutation(user)
  const serverBlockMutation = useServerBlockMutation(user)
  const refetchMutation = useRefetchUserDataMutation(user)
  const filterMutation = useFollowedUserFilterMutation(user)

  const { data: settings } = useSettings()
  const isFollowed =
    !!settings &&
    (settings.followedUsers.includes(user.id) ||
      settings.notAcceptedFollows.includes(user.id))

  const rewootsHidden = !!settings?.mutedRewoots?.includes(user.id)
  const quotesHidden = !!settings?.mutedQuotes?.includes(user.id)
  const repliesHidden = !!settings?.hiddenReplies?.includes(user.id)

  const [open, setOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  const options = useMemo(
    () =>
      [
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
          name: `${rewootsHidden ? 'Unhide' : 'Hide'} rewoots`,
          icon: rewootsHidden ? ('repeat' as const) : ('repeat-off' as const),
          disabled: filterMutation.isPending,
          action: () =>
            filterMutation.mutate({ filter: 'rewoots', hidden: rewootsHidden }),
          hidden: isMe || !isFollowed,
        },
        {
          name: `${quotesHidden ? 'Unhide' : 'Hide'} quotes`,
          icon: quotesHidden
            ? ('format-quote-open' as const)
            : ('format-quote-open-outline' as const),
          disabled: filterMutation.isPending,
          action: () =>
            filterMutation.mutate({ filter: 'quotes', hidden: quotesHidden }),
          hidden: isMe || !isFollowed,
        },
        {
          name: `${repliesHidden ? 'Unhide' : 'Hide'} replies`,
          icon: repliesHidden ? ('reply' as const) : ('reply-outline' as const),
          disabled: filterMutation.isPending,
          action: () =>
            filterMutation.mutate({ filter: 'replies', hidden: repliesHidden }),
          hidden: isMe || !isFollowed,
        },
        {
          name: `${user.muted ? 'Unmute' : 'Mute'} user`,
          icon: 'account-off-outline' as const,
          disabled: isMe || muteMutation.isPending,
          action: () =>
            Alert.alert(
              `${user.muted ? 'Unmute' : 'Mute'} user`,
              user.muted
                ? 'Posts and replies by this user will be shown again.'
                : 'Hide posts and replies by this user. They will still be able to interact with your posts.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: user.muted ? 'Unmute' : 'Mute',
                  style: user.muted ? 'default' : 'destructive',
                  onPress: () => muteMutation.mutate(user.muted),
                },
              ],
              { cancelable: true },
            ),
        },
        {
          name: `${user.blocked ? 'Unblock' : 'Block'} user`,
          icon: 'account-off' as const,
          disabled: isMe || blockMutation.isPending,
          action: () =>
            Alert.alert(
              `${user.blocked ? 'Unblock' : 'Block'} user`,
              user.blocked
                ? 'Posts and replies by this user, and replies mentioning this user, will be shown again. They will be able to interact with your posts.'
                : 'Hide posts and replies by this user, and posts and replies mentioning this user. They will not be able to interact with your posts.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: user.blocked ? 'Unblock' : 'Block',
                  style: user.blocked ? 'default' : 'destructive',
                  onPress: () => blockMutation.mutate(user.blocked),
                },
              ],
              { cancelable: true },
            ),
        },
        {
          name: `${user.serverBlocked ? 'Unblock' : 'Block'} server`,
          icon: 'server-off' as const,
          disabled: isMe || user.isBskyPrimary || serverBlockMutation.isPending,
          action: () =>
            Alert.alert(
              `${user.serverBlocked ? 'Unblock' : 'Block'} server`,
              user.serverBlocked
                ? 'This will not restore the follows lost when the server was blocked, but users from this server will be able to interact with you again.'
                : 'You will unfollow everyone on this server and all your followers from this server will stop following you. You will not see future posts from this server, and its users will not see your future posts.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: user.serverBlocked ? 'Unblock' : 'Block',
                  style: user.serverBlocked ? 'default' : 'destructive',
                  onPress: () => serverBlockMutation.mutate(user.serverBlocked),
                },
              ],
              { cancelable: true },
            ),
        },
        {
          name: 'Report user',
          icon: 'alert-outline' as const,
          action: () => setReportOpen(true),
          hidden: isMe,
        },
        {
          name: 'Refetch remote user data',
          icon: 'cloud-refresh-outline' as const,
          disabled: refetchMutation.isPending,
          action: () => refetchMutation.mutate(),
          hidden: !user.url.startsWith('@'),
        },
      ].filter((m) => !m.hidden),
    [
      user,
      env,
      isMe,
      muteMutation,
      blockMutation,
      serverBlockMutation,
      refetchMutation,
      filterMutation,
      isFollowed,
      rewootsHidden,
      quotesHidden,
      repliesHidden,
    ],
  )

  return (
    <>
      <TouchableOpacity
        accessibilityLabel="User actions"
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
      <ReportPostModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        user={user}
      />
    </>
  )
}
