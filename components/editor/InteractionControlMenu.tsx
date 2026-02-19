import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Pressable, Switch, Text, View } from 'react-native'
import BottomSheet from '../BottomSheet'
import { useState } from 'react'
import { useCSSVariable } from 'uniwind'
import { InteractionControl } from '@/lib/api/posts.types'

type InteractionOption =
  | 'anyone'
  | 'none'
  | 'followers'
  | 'following'
  | 'mentioned'

export type InteractionControlChange = {
  interactionControl: InteractionControl
  canQuote: boolean
}

export default function InteractionControlMenu({
  onChange,
}: {
  onChange: (p: InteractionControlChange) => void
}) {
  const [open, setOpen] = useState(false)

  const gray700 = useCSSVariable('--color-gray-700') as string
  const cyan900 = useCSSVariable('--color-cyan-900') as string
  const cyan600 = useCSSVariable('--color-cyan-600') as string
  const gray300 = useCSSVariable('--color-gray-300') as string

  const [canQuote, setCanQuote] = useState(true)
  const [interactionOptions, setInteractionOptions] = useState<
    InteractionOption[]
  >(['anyone'])

  const isInteractionControlModified =
    interactionOptions.join() !== 'anyone' || !canQuote

  function isSelected(opt: InteractionOption) {
    return interactionOptions.includes(opt)
  }

  function toggleSelection(opt: 'followers' | 'following' | 'mentioned') {
    setInteractionOptions((prev) => {
      const fprev = prev.filter((o) => o !== 'anyone' && o !== 'none')
      if (fprev.includes(opt)) {
        if (fprev.length === 1) {
          return ['anyone']
        }
        return fprev.filter((o) => o !== opt)
      }
      return fprev.concat(opt)
    })
    handleChange()
  }

  function handleInteractionOption(opt: InteractionOption) {
    setInteractionOptions([opt])
    handleChange()
  }

  function handleQuoteChange(flag: boolean) {
    setCanQuote(flag)
    handleChange()
  }

  function getInteractionControl() {
    if (interactionOptions.includes('anyone')) {
      return InteractionControl.Anyone
    }
    if (interactionOptions.includes('none')) {
      return InteractionControl.NoOne
    }
    if (
      interactionOptions.includes('mentioned') &&
      interactionOptions.includes('followers') &&
      interactionOptions.includes('following')
    ) {
      return InteractionControl.FollowersFollowersAndMentioned
    }
    if (
      interactionOptions.includes('following') &&
      interactionOptions.includes('mentioned')
    ) {
      return InteractionControl.FollowingAndMentioned
    }
    if (
      interactionOptions.includes('followers') &&
      interactionOptions.includes('mentioned')
    ) {
      return InteractionControl.FollowersAndMentioned
    }
    if (
      interactionOptions.includes('followers') &&
      interactionOptions.includes('following')
    ) {
      return InteractionControl.FollowersAndFollowing
    }
    if (interactionOptions.includes('followers')) {
      return InteractionControl.Followers
    }
    if (interactionOptions.includes('following')) {
      return InteractionControl.Following
    }
    if (interactionOptions.includes('mentioned')) {
      return InteractionControl.MentionedUsersOnly
    }
    // if no option is found in the array (weird, but ok) default to no interaction control (Avoid bugs > protect feature)
    return InteractionControl.Anyone
  }

  function handleChange() {
    const interactionControl = getInteractionControl()
    onChange({ interactionControl, canQuote })
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(!open)}
        className="active:bg-white/50 bg-white/15 p-2 rounded-full"
      >
        <MaterialCommunityIcons
          name={
            isInteractionControlModified ? 'lock-outline' : 'lock-off-outline'
          }
          color="white"
          size={24}
        />
      </Pressable>
      <BottomSheet className="bg-indigo-950" open={open} setOpen={setOpen}>
        <View className="px-4 py-3">
          <Text className="text-white mb-3">
            Who can interact with this post?
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => handleInteractionOption('anyone')}
              className="grow flex-row items-center gap-2 p-3 rounded-lg bg-indigo-800/25 active:bg-white/10"
            >
              <MaterialCommunityIcons
                name={
                  isSelected('anyone') ? 'radiobox-marked' : 'radiobox-blank'
                }
                color={isSelected('anyone') ? cyan600 : gray300}
                size={24}
              />
              <Text className="text-white">Anyone</Text>
            </Pressable>
            <Pressable
              onPress={() => handleInteractionOption('none')}
              className="grow flex-row items-center gap-2 p-3 rounded-lg bg-indigo-800/25 active:bg-white/10"
            >
              <MaterialCommunityIcons
                name={isSelected('none') ? 'radiobox-marked' : 'radiobox-blank'}
                color={isSelected('none') ? cyan600 : gray300}
                size={24}
              />
              <Text className="text-white">No one</Text>
            </Pressable>
          </View>
          <View className="py-3 gap-3">
            <Pressable
              onPress={() => toggleSelection('followers')}
              className="grow flex-row items-center gap-3 p-3 rounded-lg bg-indigo-800/25 active:bg-white/10"
            >
              <MaterialCommunityIcons
                name={
                  isSelected('followers')
                    ? 'checkbox-marked'
                    : 'checkbox-blank-outline'
                }
                size={24}
                color={isSelected('followers') ? cyan600 : gray300}
              />
              <Text className="text-white">Your followers</Text>
            </Pressable>
            <Pressable
              onPress={() => toggleSelection('following')}
              className="grow flex-row items-center gap-3 p-3 rounded-lg bg-indigo-800/25 active:bg-white/10"
            >
              <MaterialCommunityIcons
                name={
                  isSelected('following')
                    ? 'checkbox-marked'
                    : 'checkbox-blank-outline'
                }
                color={isSelected('following') ? cyan600 : gray300}
                size={24}
              />
              <Text className="text-white">People you follow</Text>
            </Pressable>
            <Pressable
              onPress={() => toggleSelection('mentioned')}
              className="grow flex-row items-center gap-3 p-3 rounded-lg bg-indigo-800/25 active:bg-white/10"
            >
              <MaterialCommunityIcons
                name={
                  isSelected('mentioned')
                    ? 'checkbox-marked'
                    : 'checkbox-blank-outline'
                }
                color={isSelected('mentioned') ? cyan600 : gray300}
                size={24}
              />
              <Text className="text-white">People mentioned in this post</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => handleQuoteChange(!canQuote)}
            className="flex-row items-center gap-3 py-2 rounded-lg px-3 active:bg-white/10"
          >
            <MaterialCommunityIcons
              name="format-quote-close-outline"
              color="white"
              size={24}
            />
            <Text className="text-white grow shrink">Allow quotes</Text>
            <Switch
              value={canQuote}
              onValueChange={handleQuoteChange}
              trackColor={{ false: gray700, true: cyan900 }}
              thumbColor={canQuote ? cyan600 : gray300}
            />
          </Pressable>
        </View>
      </BottomSheet>
    </>
  )
}
