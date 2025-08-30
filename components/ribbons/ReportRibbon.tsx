import BaseRibbon from './BaseRibbon'
import { formatSmallAvatar, formatUserUrl } from '@/lib/formatters'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export default function ReportRibbon({
  user,
  className,
}: {
  user: {
    id: string
    url: string
    avatar: string
  }
  className?: string
}) {
  return (
    <BaseRibbon
      className={className}
      avatar={formatSmallAvatar(user.avatar)}
      name={formatUserUrl(user.url)}
      emojis={[]}
      link={`/user/${user.url}`}
      label="reported"
      icon={
        <MaterialCommunityIcons
          className="mx-1"
          name="alert-box-outline"
          color="white"
          size={24}
        />
      }
    />
  )
}
