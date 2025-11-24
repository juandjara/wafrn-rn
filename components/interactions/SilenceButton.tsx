import { Post } from '@/lib/api/posts.types'
import { ViewStyle, Alert } from 'react-native'
import MenuItem from '../MenuItem'
import { useSilenceMutation } from '@/lib/api/mutes-and-blocks'
import { useSettings } from '@/lib/api/settings'

export default function SilenceButton({
  post,
  style,
  onPress,
}: {
  post: Post
  style: ViewStyle
  onPress?: () => void
}) {
  const { data: settings } = useSettings()
  const isSilenced = !!settings?.silencedPosts.includes(post.id)
  const silenceMutation = useSilenceMutation(post)

  function silenceAction() {
    Alert.alert(
      `${isSilenced ? 'Uns' : 'S'}ilence post`,
      `All notifications for this post (including replies) will be ${
        isSilenced ? 'un' : ''
      }silenced. Are you sure you want to do this?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Silence',
          style: 'destructive',
          onPress: () => silenceMutation.mutate(isSilenced),
        },
      ],
      { cancelable: true },
    )
    onPress?.()
  }

  return (
    <MenuItem
      icon={isSilenced ? 'bell-outline' : 'bell-off'}
      action={silenceAction}
      label={`${isSilenced ? 'Uns' : 'S'}ilence post`}
      disabled={silenceMutation.isPending}
      style={style}
    />
  )
}
