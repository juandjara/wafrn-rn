import { Post } from '@/lib/api/posts.types'
import { PrivacyLevel } from '@/lib/api/privacy'
import { useParsedToken } from '@/lib/contexts/AuthContext'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { Link } from 'expo-router'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import ReactionEmojiPicker from '../interactions/ReactionEmojiPicker'
import RewootButton from '../interactions/RewootButton'
import LikeButton from '../interactions/LikeButton'
import BookmarkButton from '../interactions/BookmarkButton'
import DeleteButton from '../interactions/DeleteButton'
import { interactionIconCn } from '@/lib/styles'

export default function InteractionRibbon({ post }: { post: Post }) {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const me = useParsedToken()
  const createdByMe = post.userId === me?.userId

  const canQuote =
    post.privacy === PrivacyLevel.PUBLIC ||
    post.privacy === PrivacyLevel.UNLISTED
  const canRewoot =
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
          <Link
            href={`/editor?type=reply&replyId=${post.id}`}
            accessibilityLabel="Reply"
            className="flex p-1.5 active:bg-gray-300/30 rounded-full"
          >
            <MaterialCommunityIcons name="reply" size={20} color="white" />
          </Link>
          {canQuote ? (
            <Link
              href={`/editor?type=quote&quoteId=${post.id}`}
              accessibilityLabel="Quote"
              className="flex p-1.5 active:bg-gray-300/30 rounded-full"
            >
              <MaterialCommunityIcons
                name="format-quote-close"
                size={20}
                color="white"
              />
            </Link>
          ) : null}
          {canRewoot ? <RewootButton post={post} /> : null}
          {!createdByMe ? <LikeButton post={post} /> : null}
          <BookmarkButton post={post} />
          {!createdByMe ? (
            <Pressable
              onPress={() => setEmojiPickerOpen(true)}
              accessibilityLabel="Add emoji reaction"
              className={interactionIconCn}
            >
              <MaterialIcons name="emoji-emotions" size={20} color="white" />
            </Pressable>
          ) : null}
          {createdByMe ? <DeleteButton post={post} /> : null}
        </View>
      </View>
    </>
  )
}
