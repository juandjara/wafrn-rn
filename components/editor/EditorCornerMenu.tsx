import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { View } from 'react-native'
import { useState } from 'react'
import { useCSSString } from '@/lib/cssVariables'
import BottomSheet from '../BottomSheet'
import MenuItem from '../MenuItem'
import { optionStyleBig } from '@/lib/styles'
import { CreatePostPayload } from '@/lib/api/posts'
import { PrivacyLevel } from '@/lib/api/privacy'
import SchedulePostModal from './SchedulePostModal'

export default function EditorCornerMenu({
  open,
  setOpen,
  privacy,
  onPublish,
}: {
  open: boolean
  setOpen: (flag: boolean) => void
  privacy: PrivacyLevel
  onPublish: (extra?: Partial<CreatePostPayload>) => void
}) {
  const gray600 = useCSSString('--color-gray-600')
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const isDraft = privacy === PrivacyLevel.DRAFT

  const options = [
    {
      name: isDraft ? 'Make draft public' : 'Save as draft',
      icon: (
        <MaterialCommunityIcons
          name={isDraft ? 'earth' : 'archive-edit-outline'}
          color={gray600}
          size={20}
        />
      ),
      action: () => {
        onPublish({
          privacy: isDraft ? PrivacyLevel.PUBLIC : PrivacyLevel.DRAFT,
        })
      },
    },
    {
      name: 'Add to queue',
      icon: (
        <MaterialCommunityIcons
          name="layers-outline"
          color={gray600}
          size={20}
        />
      ),
      action: () => {
        onPublish({ queuedPostPublishing: true })
      },
    },
    {
      name: 'Schedule post',
      icon: <MaterialIcons name="schedule" color={gray600} size={20} />,
      action: () => {
        setScheduleModalOpen(true)
      },
    },
  ]

  return (
    <>
      {scheduleModalOpen && (
        <SchedulePostModal
          onPublish={onPublish}
          open={scheduleModalOpen}
          setOpen={setScheduleModalOpen}
        />
      )}
      {open && (
        <BottomSheet open setOpen={setOpen}>
          <View>
            {options.map((opt, i) => (
              <MenuItem
                key={i}
                action={() => {
                  setOpen(false)
                  opt.action()
                }}
                icon={opt.icon}
                label={opt.name}
                style={optionStyleBig(i)}
              />
            ))}
          </View>
        </BottomSheet>
      )}
    </>
  )
}
