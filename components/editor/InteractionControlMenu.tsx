import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Pressable } from 'react-native'
import BottomSheet from '../BottomSheet'
import { useState } from 'react'
import { InteractionControl } from '@/lib/api/posts.types'
import { clsx } from 'clsx'
import InteractionControlPicker from '../InteractionControlPicker'
import { InteractionControlChange } from '@/lib/interactionControl'

export default function InteractionControlMenu({
  canReply,
  canQuote,
  onChange,
  disabled,
}: {
  canReply: InteractionControl
  canQuote: boolean
  onChange: (p: InteractionControlChange) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)

  const isInteractionControlModified =
    (canReply !== InteractionControl.Anyone &&
      canReply !== InteractionControl.SameAsOp) ||
    !canQuote

  return (
    <>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityLabel={`Interaction Control: ${isInteractionControlModified ? 'Restricted' : 'Open'}`}
        disabled={disabled}
        className={clsx('active:bg-white/50 bg-white/15 p-2 rounded-full', {
          'opacity-50 pointer-events-none': disabled,
        })}
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
        <InteractionControlPicker
          title="Who can interact with this post?"
          canReply={canReply}
          canQuote={canQuote}
          onChange={onChange}
        />
      </BottomSheet>
    </>
  )
}
