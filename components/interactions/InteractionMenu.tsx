import { useState } from 'react'
import { View, TouchableOpacity, Share } from 'react-native'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { useCSSVariable } from 'uniwind'
import BottomShhet from '../BottomSheet'
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
  const gray300 = useCSSVariable('--color-gray-300') as string
  const gray600 = useCSSVariable('--color-gray-600') as string
  const [modalOpen, setModalOpen] = useState<'emojis' | 'report' | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const { env } = useAuth()
  const remoteUrl = getRemotePostUrl(post)
  const wafrnUrl = `${env?.BASE_URL}/fediverse/post/${post.id}`

  const me = useParsedToken()
  const createdByMe = post.userId === me?.userId

  const showQuote =
    post.privacy === PrivacyLevel.PUBLIC ||
    post.privacy === PrivacyLevel.UNLISTED
  const showRewoot =
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
        onPress={() => setMenuOpen(true)}
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
      <BottomShhet open={menuOpen} setOpen={setMenuOpen}>
        <MenuItem
          label="Reply"
          action={() => {
            router.navigate(`/editor?type=reply&replyId=${post.id}`)
            setMenuOpen(false)
          }}
          disabled={!post.canReply}
          icon={'reply'}
          style={optionStyleBig(0)}
        />
        {showQuote ? (
          <MenuItem
            label="Quote"
            action={() => {
              router.navigate(`/editor?type=quote&quoteId=${post.id}`)
              setMenuOpen(false)
            }}
            disabled={!post.canQuote}
            icon={'format-quote-close'}
            style={optionStyleBig(1)}
          />
        ) : null}
        {showRewoot ? (
          <RewootButton
            post={post}
            long
            style={optionStyleBig(1)}
            onPress={() => setMenuOpen(false)}
          />
        ) : null}
        {!createdByMe ? (
          <LikeButton
            post={post}
            long
            style={optionStyleBig(1)}
            onPress={() => setMenuOpen(false)}
          />
        ) : null}
        <BookmarkButton
          post={post}
          long
          style={optionStyleBig(1)}
          onPress={() => setMenuOpen(false)}
        />
        {!createdByMe ? (
          <MenuItem
            label="Add emoji reaction"
            action={() => {
              setModalOpen('emojis')
              setMenuOpen(false)
            }}
            icon={
              <MaterialIcons name="emoji-emotions" size={20} color={gray600} />
            }
            style={optionStyleBig(1)}
          />
        ) : null}
        {createdByMe ? (
          <>
            <MenuItem
              icon={'pencil'}
              action={() => {
                router.navigate(`/editor?type=edit&editId=${post.id}`)
                setMenuOpen(false)
              }}
              label="Edit"
              style={optionStyleBig(1)}
            />
            <DeleteButton
              post={post}
              long
              style={optionStyleBig(1)}
              onPress={() => setMenuOpen(false)}
            />
          </>
        ) : null}
        {/* --- SECONDARY --- */}
        {!createdByMe ? (
          <BiteButton
            post={post}
            style={optionStyleBig(1)}
            onPress={() => setMenuOpen(false)}
          />
        ) : null}
        <CollapseButton
          post={post}
          style={optionStyleBig(1)}
          onPress={() => setMenuOpen(false)}
        />
        <MenuItem
          icon="share-variant"
          action={() => {
            Share.share({ message: wafrnUrl })
            setMenuOpen(false)
          }}
          label="Share wafrn link"
          style={optionStyleBig(1)}
        />
        {remoteUrl ? (
          <>
            <MenuItem
              icon="share-variant-outline"
              action={() => {
                Share.share({ message: remoteUrl })
                setMenuOpen(false)
              }}
              label="Share remote link"
              style={optionStyleBig(1)}
            />
            <MenuItem
              icon="open-in-new"
              action={() => {
                router.navigate(remoteUrl)
                setMenuOpen(false)
              }}
              label={
                remoteUrl?.startsWith(BSKY_URL)
                  ? 'Open in Bluesky'
                  : 'Open remote post'
              }
              style={optionStyleBig(1)}
            />
          </>
        ) : null}
        <MenuItem
          icon="content-copy"
          action={() => {
            copyPostText()
            setMenuOpen(false)
          }}
          label="Copy post text"
          style={optionStyleBig(1)}
        />
        <MenuItem
          icon="alert-box-outline"
          action={() => {
            setModalOpen('report')
            setMenuOpen(false)
          }}
          label="Report"
          style={optionStyleBig(1)}
        />
        {createdByMe ? (
          <SilenceButton
            post={post}
            style={optionStyleBig(1)}
            onPress={() => setMenuOpen(false)}
          />
        ) : null}
      </BottomShhet>
    </>
  )
}
