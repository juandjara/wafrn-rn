import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { Pressable, Text, View } from 'react-native'
import { useState } from 'react'
import { useCSSString } from '@/lib/cssVariables'
import BottomSheet from '../BottomSheet'
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
      description: isDraft
        ? 'Change privacy to Public and publish the woot'
        : 'Change privacy to Draft and save the woot',
      icon: (
        <MaterialCommunityIcons
          name={isDraft ? 'earth' : 'archive-edit-outline'}
          color={gray600}
          size={24}
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
      description:
        'Add the woot to a slow queue and the server will publish it when it has some alone time (min. 1 hour)',
      icon: (
        <MaterialCommunityIcons
          name="layers-outline"
          color={gray600}
          size={24}
        />
      ),
      action: () => {
        onPublish({ queuedPostPublishing: true })
      },
    },
    {
      name: 'Schedule post',
      description:
        'Schedule your woot to published at a certian date and time. This is checked in the server every 15 minutes so there might be some small delay in minutes',
      icon: <MaterialIcons name="schedule" color={gray600} size={24} />,
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
              <Pressable
                key={i}
                className="bg-white active:bg-gray-200 p-4 flex-row gap-4"
                onPress={() => {
                  setOpen(false)
                  opt.action()
                }}
              >
                {opt.icon}
                <View className="grow shrink mr-2">
                  <Text className="font-bold mb-1">{opt.name}</Text>
                  <Text>{opt.description}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </BottomSheet>
      )}
    </>
  )
}
