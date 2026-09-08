import { Platform, Pressable, Text, View } from 'react-native'
import BottomSheet from '../BottomSheet'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useState } from 'react'
import { clsx } from 'clsx'
import { useCSSString } from '@/lib/cssVariables'
import DateTimePicker from '@react-native-community/datetimepicker'
import { CreatePostPayload } from '@/lib/api/posts'

const ONE_DAY = 24 * 60 * 60 * 1000

export default function SchedulePostModal({
  open,
  setOpen,
  onPublish,
}: {
  open: boolean
  setOpen: (flag: boolean) => void
  onPublish: (extra?: Partial<CreatePostPayload>) => void
}) {
  const gray600 = useCSSString('--color-gray-600')
  const [datepickerOpen, setdatepickerOpen] = useState<'date' | 'time' | null>(
    null,
  )
  const now = Date.now()
  const today = new Date(now)
  const [datetime, setDatetime] = useState(now + ONE_DAY)
  const dateIsValid = datetime > now

  function schedule() {
    onPublish({
      publishAt: datetime,
    })
  }

  return (
    <>
      {datepickerOpen && (
        <DateTimePicker
          is24Hour
          mode={datepickerOpen}
          value={new Date(datetime)}
          minimumDate={today}
          onChange={(ev) => {
            setdatepickerOpen(null)
            if (ev.type === 'set') {
              setDatetime(ev.nativeEvent.timestamp)
            }
          }}
        />
      )}
      <BottomSheet className="bg-indigo-950" open={open} setOpen={setOpen}>
        <Text className="text-white px-3 py-1 my-1">
          Select the date your woot will be published
        </Text>
        {Platform.OS === 'web' ? (
          <View className="my-2 mx-3 p-2 border rounded-md border-gray-500">
            <input
              style={{ color: '#333' }}
              type="datetime-local"
              value={datetime.toString()}
              onChange={(ev) => {
                setDatetime(Date.parse(ev.target.value))
              }}
            />
          </View>
        ) : (
          <View className="mb-6 mt-3 px-3 flex-row items-center gap-4">
            <View className="grow">
              <Text className="text-sm text-gray-400">Date:</Text>
              <Pressable
                onPress={() => setdatepickerOpen('date')}
                className="flex-row items-center gap-1 rounded-lg border border-gray-500 p-2"
              >
                <Text className="grow text-gray-300">
                  {new Date(datetime).toLocaleDateString()}
                </Text>
                <MaterialCommunityIcons
                  name="calendar"
                  color={gray600}
                  size={20}
                />
              </Pressable>
            </View>
            <View className="grow">
              <Text className="text-sm text-gray-400">Time:</Text>
              <Pressable
                onPress={() => setdatepickerOpen('time')}
                className="flex-row items-center gap-1 rounded-lg border border-gray-500 p-2"
              >
                <Text className="grow text-gray-300">
                  {new Date(datetime).toLocaleTimeString()}
                </Text>
                <MaterialCommunityIcons
                  name="clock-outline"
                  color={gray600}
                  size={20}
                />
              </Pressable>
            </View>
          </View>
        )}
        <Pressable
          disabled={!dateIsValid}
          onPress={schedule}
          className={clsx(
            'bg-sky-700 active:opacity-75 py-2 px-3 mx-3 mb-3 rounded-lg flex-row items-center justify-center gap-3',
            {
              'opacity-50': !dateIsValid,
            },
          )}
        >
          <Text className="text-white text-lg">Schedule</Text>
          <MaterialCommunityIcons
            name="clock-outline"
            color="white"
            size={24}
          />
        </Pressable>
      </BottomSheet>
    </>
  )
}
