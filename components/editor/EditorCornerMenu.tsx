import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { Pressable, View } from 'react-native'
import { clsx } from 'clsx'
import { useState } from 'react'
import { useCSSString } from '@/lib/cssVariables'
import BottomSheet from '../BottomSheet'
import MenuItem from '../MenuItem'
import { optionStyleBig } from '@/lib/styles'
import { CreatePostPayload } from '@/lib/api/posts'
import { PrivacyLevel } from '@/lib/api/privacy'
import SchedulePostModal from './SchedulePostModal'

export default function EditorCornerMenu({
  privacy,
  onPublish,
  canPublish,
}: {
  privacy: PrivacyLevel
  onPublish: (extra?: Partial<CreatePostPayload>) => void
  canPublish: boolean
}) {
  const gray600 = useCSSString('--color-gray-600')
  const [open, setOpen] = useState(false)
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
      <Pressable
        disabled={!canPublish}
        onPress={() => setOpen(true)}
        className={clsx(
          'h-10 border-l border-gray-400 p-2 px-1.5 my-2 rounded-r-full',
          {
            'bg-cyan-800': canPublish,
            'bg-gray-400/25 opacity-50': !canPublish,
          },
        )}
      >
        <MaterialCommunityIcons name="chevron-down" color="white" size={24} />
      </Pressable>

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
