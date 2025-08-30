import { formatSmallAvatar, formatUserUrl } from '@/lib/formatters'
import BaseRibbon from './BaseRibbon'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export default function BlockRibbon({
  user,
  className,
  type = 'user',
}: {
  user: {
    id: string
    url: string
    avatar: string
  }
  className?: string
  type: 'user' | 'server'
}) {
  return (
    <BaseRibbon
      className={className}
      avatar={formatSmallAvatar(user.avatar)}
      name={formatUserUrl(user.url)}
      emojis={[]}
      link={`/user/${user.url}`}
      label="blocked"
      icon={
        <MaterialCommunityIcons
          className="mx-1"
          name={type === 'user' ? 'account-cancel-outline' : 'server-off'}
          color="white"
          size={24}
        />
      }
    />
  )
}
