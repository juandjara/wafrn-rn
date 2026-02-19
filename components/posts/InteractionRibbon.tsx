import { Post } from '@/lib/api/posts.types'
import { PrivacyLevel } from '@/lib/api/privacy'
import { useParsedToken } from '@/lib/contexts/AuthContext'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { Link } from 'expo-router'
import { useState } from 'react'
import { Text, View } from 'react-native'
import ReactionEmojiPicker from '../interactions/ReactionEmojiPicker'
import RewootButton from '../interactions/RewootButton'
import LikeButton from '../interactions/LikeButton'
import BookmarkButton from '../interactions/BookmarkButton'
import DeleteButton from '../interactions/DeleteButton'
import { interactionIconCn } from '@/lib/styles'
import WigglyPressable from '../WigglyPressable'
import { clsx } from 'clsx'

export default function InteractionRibbon({ post }: { post: Post }) {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const me = useParsedToken()
  const createdByMe = post.userId === me?.userId

  const showQuote =
    post.privacy === PrivacyLevel.PUBLIC ||
    post.privacy === PrivacyLevel.UNLISTED
  const showRewoot =
    post.privacy !== PrivacyLevel.DIRECT_MESSAGE &&
    post.privacy !== PrivacyLevel.FOLLOWERS_ONLY

  return (
    <>
      {emojiPickerOpen && (
        <View className="absolute inset-0">
          <ReactionEmojiPicker post={post} onClose={setEmojiPickerOpen} />
        </View>
      )}
      <View
        id="interaction-ribbon"
        className="bg-indigo-950 items-center flex-row py-2 px-3"
      >
        {post.notes !== undefined ? (
          <Link id="notes" href={`/post/${post.id}`} asChild>
            <Text className="grow text-gray-200 text-sm active:bg-indigo-900/75 py-1 px-1 -mx-1 rounded-md">
              {post.notes} Notes
            </Text>
          </Link>
        ) : null}
        <View id="interactions" className="flex-row gap-3 shrink">
          <Link href={`/editor?type=reply&replyId=${post.id}`} asChild>
            <WigglyPressable
              disabled={!post.canReply}
              accessibilityLabel="Reply"
              className={clsx('flex p-1.5 active:bg-gray-300/30 rounded-full', {
                'opacity-50': !post.canReply,
              })}
            >
              <MaterialCommunityIcons name="reply" size={20} color="white" />
            </WigglyPressable>
          </Link>
          {showQuote ? (
            <Link href={`/editor?type=quote&quoteId=${post.id}`} asChild>
              <WigglyPressable
                disabled={!post.canQuote}
                accessibilityLabel="Quote"
                className={clsx(
                  'flex p-1.5 active:bg-gray-300/30 rounded-full',
                  {
                    'opacity-50': !post.canQuote,
                  },
                )}
              >
                <MaterialCommunityIcons
                  name="format-quote-close"
                  size={20}
                  color="white"
                />
              </WigglyPressable>
            </Link>
          ) : null}
          {showRewoot ? <RewootButton post={post} /> : null}
          {!createdByMe ? <LikeButton post={post} /> : null}
          <BookmarkButton post={post} />
          {!createdByMe ? (
            <WigglyPressable
              onPress={() => setEmojiPickerOpen(true)}
              accessibilityLabel="Add emoji reaction"
              className={interactionIconCn}
            >
              <MaterialIcons name="emoji-emotions" size={20} color="white" />
            </WigglyPressable>
          ) : null}
          {createdByMe ? (
            <>
              <Link href={`/editor?type=edit&editId=${post.id}`} asChild>
                <WigglyPressable
                  accessibilityLabel="Edit"
                  className={interactionIconCn}
                >
                  <MaterialCommunityIcons
                    name="pencil"
                    size={20}
                    color="white"
                  />
                </WigglyPressable>
              </Link>
              <DeleteButton post={post} />
            </>
          ) : null}
        </View>
      </View>
    </>
  )
}
