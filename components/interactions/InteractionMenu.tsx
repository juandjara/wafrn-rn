import { useRef, useState } from 'react'
import { View, TouchableOpacity, Share } from 'react-native'
import { TrueSheet } from '@lodev09/react-native-true-sheet'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { useCSSVariable } from 'uniwind'
import ScrollingBottomShhet from '../ScrollingBottomSheet'
import MenuItem from '../MenuItem'
import { router } from 'expo-router'
import { type Post } from '@/lib/api/posts.types'
import { optionStyleBig } from '@/lib/styles'
import { PrivacyLevel } from '@/lib/api/privacy'
import RewootButton from './RewootButton'
import LikeButton from './LikeButton'
import BookmarkButton from './BookmarkButton'
import ReactionEmojiPicker from './ReactionEmojiPicker'
import DeleteButton from './DeleteButton'
import BiteButton from './BiteButton'
import CollapseButton from './ColllapseButton'
import { getRemotePostUrl } from '@/lib/api/posts'
import { useAuth, useParsedToken } from '@/lib/contexts/AuthContext'
import { useToasts } from '@/lib/toasts'
import * as Clipboard from 'expo-clipboard'
import { DomUtils, parseDocument } from 'htmlparser2'
import { BSKY_URL } from '@/lib/api/html'
import SilenceButton from './SilenceButton'
import ReportPostModal from '../posts/ReportPostModal'

export default function InteractionMenu({ post }: { post: Post }) {
  const sheetRef = useRef<TrueSheet>(null)
  const gray300 = useCSSVariable('--color-gray-300') as string
  const gray600 = useCSSVariable('--color-gray-600') as string
  const [modalOpen, setModalOpen] = useState<'emojis' | 'report' | null>(null)

  const { env } = useAuth()
  const remoteUrl = getRemotePostUrl(post)
  const wafrnUrl = `${env?.BASE_URL}/fediverse/post/${post.id}`

  const me = useParsedToken()
  const createdByMe = post.userId === me?.userId

  const canQuote =
    post.privacy === PrivacyLevel.PUBLIC ||
    post.privacy === PrivacyLevel.UNLISTED
  const canRewoot =
    post.privacy !== PrivacyLevel.DIRECT_MESSAGE &&
    post.privacy !== PrivacyLevel.FOLLOWERS_ONLY

  const { showToastSuccess, showToastError } = useToasts()

  async function copyPostText() {
    try {
      await Clipboard.setStringAsync(
        DomUtils.textContent(
          parseDocument(post.content.replaceAll('<br>', '\n')),
        ),
      )
      showToastSuccess('Link copied!')
    } catch (err) {
      showToastError('Cannot copy link')
      console.error('Cannot copy link', String(err))
    }
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => sheetRef.current?.present()}
        className="py-3 px-2 rounded-lg"
      >
        <MaterialCommunityIcons
          size={20}
          name={`dots-vertical`}
          color={gray300}
          style={{ opacity: 0.75 }}
        />
      </TouchableOpacity>
      <View className="absolute inset-0">
        {modalOpen === 'emojis' ? (
          <ReactionEmojiPicker post={post} onClose={() => setModalOpen(null)} />
        ) : null}
        {modalOpen === 'report' ? (
          <ReportPostModal
            open
            post={post}
            onClose={() => setModalOpen(null)}
          />
        ) : null}
      </View>
      <ScrollingBottomShhet sheetRef={sheetRef}>
        <MenuItem
          label="Reply"
          action={() =>
            router.navigate(`/editor?type=reply&replyId=${post.id}`)
          }
          icon={'reply'}
          style={optionStyleBig(0)}
          sheetRef={sheetRef}
        />
        {canQuote ? (
          <MenuItem
            label="Quote"
            action={() =>
              router.navigate(`/editor?type=quote&quoteId=${post.id}`)
            }
            icon={'format-quote-close'}
            style={optionStyleBig(1)}
            sheetRef={sheetRef}
          />
        ) : null}
        {canRewoot ? (
          <RewootButton
            post={post}
            long
            style={optionStyleBig(1)}
            sheetRef={sheetRef}
          />
        ) : null}
        {!createdByMe ? (
          <LikeButton
            post={post}
            long
            style={optionStyleBig(1)}
            sheetRef={sheetRef}
          />
        ) : null}
        <BookmarkButton post={post} long style={optionStyleBig(1)} />
        {!createdByMe ? (
          <MenuItem
            label="Add emoji reaction"
            action={() => setModalOpen('emojis')}
            icon={
              <MaterialIcons name="emoji-emotions" size={20} color={gray600} />
            }
            style={optionStyleBig(1)}
            sheetRef={sheetRef}
          />
        ) : null}
        {createdByMe ? (
          <DeleteButton
            post={post}
            long
            style={optionStyleBig(1)}
            sheetRef={sheetRef}
          />
        ) : null}
        {/* --- SECONDARY --- */}
        {!createdByMe ? (
          <BiteButton
            post={post}
            style={optionStyleBig(1)}
            sheetRef={sheetRef}
          />
        ) : null}
        <CollapseButton
          post={post}
          style={optionStyleBig(1)}
          sheetRef={sheetRef}
        />
        <MenuItem
          icon="share-variant"
          action={() => Share.share({ message: wafrnUrl })}
          label="Share wafrn link"
          style={optionStyleBig(1)}
          sheetRef={sheetRef}
        />
        {remoteUrl ? (
          <>
            <MenuItem
              icon="share-variant-outline"
              action={() => Share.share({ message: remoteUrl })}
              label="Share remote link"
              style={optionStyleBig(1)}
              sheetRef={sheetRef}
            />
            <MenuItem
              icon="open-in-new"
              action={() => router.navigate(remoteUrl)}
              label={
                remoteUrl?.startsWith(BSKY_URL)
                  ? 'Open in Bluesky'
                  : 'Open remote post'
              }
              style={optionStyleBig(1)}
              sheetRef={sheetRef}
            />
          </>
        ) : null}
        <MenuItem
          icon="content-copy"
          action={copyPostText}
          label="Copy post text"
          style={optionStyleBig(1)}
          sheetRef={sheetRef}
        />
        <MenuItem
          icon="alert-box-outline"
          action={() => setModalOpen('report')}
          label="Report"
          style={optionStyleBig(1)}
          sheetRef={sheetRef}
        />
        {createdByMe ? (
          <>
            <SilenceButton
              post={post}
              style={optionStyleBig(1)}
              sheetRef={sheetRef}
            />
            <MenuItem
              icon={'pencil'}
              action={() =>
                router.navigate(`/editor?type=edit&editId=${post.id}`)
              }
              label="Edit"
              style={optionStyleBig(1)}
              sheetRef={sheetRef}
            />
          </>
        ) : null}
      </ScrollingBottomShhet>
    </>
  )
}
