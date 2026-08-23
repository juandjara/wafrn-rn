import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Pressable, Switch, Text, View } from 'react-native'
import { useCSSString } from '@/lib/cssVariables'
import { InteractionControl } from '@/lib/api/posts.types'
import {
  interactionControlToOptions,
  interactionOptionsToControl,
  INTERACTION_OPTION_LABELS,
  InteractionControlChange,
  InteractionOption,
} from '@/lib/interactionControl'

export default function InteractionControlPicker({
  title,
  canReply,
  canQuote,
  onChange,
}: {
  title: string
  canReply: InteractionControl
  canQuote: boolean
  onChange: (p: InteractionControlChange) => void
}) {
  const gray700 = useCSSString('--color-gray-700')
  const cyan900 = useCSSString('--color-cyan-900')
  const cyan600 = useCSSString('--color-cyan-600')
  const gray300 = useCSSString('--color-gray-300')

  const interactionOptions = interactionControlToOptions(canReply)

  function isSelected(opt: InteractionOption) {
    return interactionOptions.includes(opt)
  }

  function toggleSelection(opt: 'followers' | 'following' | 'mentioned') {
    let newOptions: InteractionOption[]
    const prev = interactionOptions.filter(
      (o) => o !== 'anyone' && o !== 'none',
    )
    if (prev.includes(opt)) {
      if (prev.length === 1) {
        newOptions = ['anyone']
      } else {
        newOptions = prev.filter((o) => o !== opt)
      }
    } else {
      newOptions = prev.concat(opt)
    }
    onChange({
      canQuote,
      interactionControl: interactionOptionsToControl(newOptions),
    })
  }

  function handleInteractionOption(opt: InteractionOption) {
    onChange({
      canQuote,
      interactionControl: interactionOptionsToControl([opt]),
    })
  }

  function handleQuoteChange(flag: boolean) {
    onChange({
      canQuote: flag,
      interactionControl: canReply,
    })
  }

  return (
    <View className="px-4 py-3">
      <Text className="text-white mb-3">{title}</Text>
      <Text className="text-white mb-3 text-xs">
        In this moment, only Bluesky, GoToSocial and Wafrn support this feature.
        Unwanted replies will be hidden from threads and notifications and only
        displayed in the &quot;Unauthorized Notifications&quot; screen but they
        might be visible from other places
      </Text>
      <View className="flex-row gap-3">
        <Pressable
          onPress={() => handleInteractionOption('anyone')}
          className="grow flex-row items-center gap-2 p-3 rounded-lg bg-indigo-800/25 active:bg-white/10"
        >
          <MaterialCommunityIcons
            name={isSelected('anyone') ? 'radiobox-marked' : 'radiobox-blank'}
            color={isSelected('anyone') ? cyan600 : gray300}
            size={24}
          />
          <Text className="text-white">{INTERACTION_OPTION_LABELS.anyone}</Text>
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
          <Text className="text-white">{INTERACTION_OPTION_LABELS.none}</Text>
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
          <Text className="text-white">
            {INTERACTION_OPTION_LABELS.followers}
          </Text>
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
          <Text className="text-white">
            {INTERACTION_OPTION_LABELS.following}
          </Text>
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
  )
}
