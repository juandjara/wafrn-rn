import { Post } from '@/lib/api/posts.types'
import { PrivacyLevel } from '@/lib/api/privacy'
import { useAuth, useParsedToken } from '@/lib/contexts/AuthContext'
import {
  AntDesign,
  FontAwesome6,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons'
import { Link, router, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Pressable,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import EmojiPicker, { Emoji } from '../EmojiPicker'
import { optionStyleBig } from '@/lib/styles'
import { useDashboardContext } from '@/lib/contexts/DashboardContext'
import AnimatedIcon from './AnimatedIcon'
import { useSharedValue, withSpring } from 'react-native-reanimated'
import {
  useBitePostMutation,
  useBookmarkMutation,
  useLikeMutation,
} from '@/lib/interaction'
import { useEmojiReactMutation } from '@/lib/api/emojis'
import {
  getRemotePostUrl,
  useDeleteMutation,
  useRewootMutation,
} from '@/lib/api/posts'
import { useSilenceMutation } from '@/lib/api/mutes-and-blocks'
import { useSettings } from '@/lib/api/settings'
import ReportPostModal from './ReportPostModal'
import { toggleCollapsed, usePostLayout } from '@/lib/store'
import { BSKY_URL } from '@/lib/api/html'
import * as Clipboard from 'expo-clipboard'
import { DomUtils, parseDocument } from 'htmlparser2'
import { useCSSVariable } from 'uniwind'
import { useToasts } from '@/lib/toasts'
import { TrueSheet } from '@lodev09/react-native-true-sheet'
import ScrollingBottomShhet from '../ScrollingBottomSheet'
import MenuItem from '../MenuItem'

export default function InteractionRibbon({
  post,
  orientation = 'horizontal',
}: {
  post: Post
  orientation?: 'horizontal' | 'vertical'
}) {
  const green500 = useCSSVariable('--color-green-500') as string
  const red500 = useCSSVariable('--color-red-500') as string
  const gray300 = useCSSVariable('--color-gray-300') as string

  const { postid } = useLocalSearchParams()
  const me = useParsedToken()
  const { env } = useAuth()
  const context = useDashboardContext()
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const { data: settings } = useSettings()
  const isSilenced = !!settings?.silencedPosts.includes(post.id)

  const { isLiked, isRewooted, isBookmarked, myReactions } = useMemo(() => {
    const myReactions = context.emojiRelations.postEmojiReactions.filter(
      (p) => p.userId === me?.userId && p.postId === post.id,
    )
    const isLiked = context.likes.some(
      (like) => like.postId === post.id && like.userId === me?.userId,
    )
    const isRewooted = (context.rewootIds || []).includes(post.id)
    const isBookmarked = (context.bookmarks || []).some(
      (b) => b.postId === post.id && b.userId === me?.userId,
    )
    return { isLiked, isRewooted, myReactions, isBookmarked }
  }, [context, post.id, me?.userId])

  const layout = usePostLayout(post.id)
  const collapsed = layout.collapsed ?? false

  const liked = useSharedValue(isLiked ? 1 : 0)
  const rewooted = useSharedValue(isRewooted ? 1 : 0)

  useEffect(() => {
    const isLiked = context.likes.some(
      (like) => like.postId === post.id && like.userId === me?.userId,
    )
    const isRewooted = (context.rewootIds || []).includes(post.id)
    liked.set(isLiked ? 1 : 0)
    rewooted.set(isRewooted ? 1 : 0)
    // ignore update on 'liked' and 'rewooted'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, post.id, me?.userId])

  const { showToastSuccess, showToastError } = useToasts()

  const likeMutation = useLikeMutation(post)
  const rewootMutation = useRewootMutation(post)
  const emojiReactMutation = useEmojiReactMutation(post)
  const deleteMutation = useDeleteMutation(post)
  const silenceMutation = useSilenceMutation(post)
  const bookmarkMutation = useBookmarkMutation(post)
  const biteMutation = useBitePostMutation()

  const { mainOptions, secondaryOptions } = useMemo(() => {
    const createdByMe = post.userId === me?.userId
    const iconColor = orientation === 'vertical' ? 'black' : 'white'

    const mainOptions = [
      {
        action: () => {
          router.navigate(`/editor?type=reply&replyId=${post.id}`)
        },
        label: 'Reply',
        icon: (
          <MaterialCommunityIcons name="reply" size={20} color={iconColor} />
        ),
        enabled: true,
      },
      {
        action: () => {
          router.navigate(`/editor?type=quote&quoteId=${post.id}`)
        },
        label: 'Quote',
        icon: <MaterialIcons name="format-quote" size={20} color={iconColor} />,
        enabled:
          post.privacy === PrivacyLevel.PUBLIC ||
          post.privacy === PrivacyLevel.UNLISTED,
      },
      {
        action: () => {
          rewooted.value = withSpring(isRewooted ? 0 : 1)
          if (!rewootMutation.isPending) {
            rewootMutation.mutate(isRewooted)
          }
        },
        label: isRewooted ? 'Undo Rewoot' : 'Rewoot',
        icon: (
          <AnimatedIcon
            animValue={rewooted}
            icon={<AntDesign name="retweet" size={20} color={iconColor} />}
            iconActive={<AntDesign name="retweet" size={20} color={green500} />}
          />
        ),
        disabled: rewootMutation.isPending,
        enabled:
          post.privacy !== PrivacyLevel.DIRECT_MESSAGE &&
          post.privacy !== PrivacyLevel.FOLLOWERS_ONLY,
      },
      {
        action: () => {
          liked.value = withSpring(isLiked ? 0 : 1)
          if (!likeMutation.isPending) {
            likeMutation.mutate(isLiked)
          }
        },
        disabled: likeMutation.isPending,
        label: isLiked ? 'Undo Like' : 'Like',
        icon: (
          <AnimatedIcon
            animValue={liked}
            icon={
              <MaterialCommunityIcons
                name="heart-outline"
                size={20}
                color={iconColor}
              />
            }
            iconActive={
              <MaterialCommunityIcons name="heart" size={20} color={red500} />
            }
          />
        ),
        enabled: !createdByMe,
      },
      {
        action: () => {
          bookmarkMutation.mutate(isBookmarked)
        },
        disabled: bookmarkMutation.isPending,
        label: isBookmarked ? 'Unbookmark' : 'Bookmark',
        icon: (
          <MaterialCommunityIcons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={iconColor}
          />
        ),
        enabled: true,
      },
      {
        action: () => {
          setEmojiPickerOpen(true)
        },
        label: 'React with an emoji',
        icon: (
          <MaterialIcons name="emoji-emotions" size={20} color={iconColor} />
        ),
        disabled: emojiReactMutation.isPending,
        enabled: !createdByMe,
      },
      {
        action: () => {
          Alert.alert(
            'Delete post',
            'Are you sure you want to delete this post?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  deleteMutation.mutate(undefined, {
                    onSuccess: () => {
                      // if we are on the post detail route for the exact post we just deleted, go back
                      if (post.id === postid) {
                        if (router.canGoBack()) {
                          router.back()
                        }
                      }
                    },
                  })
                },
              },
            ],
            { cancelable: true },
          )
        },
        icon: (
          <MaterialCommunityIcons
            name="delete-outline"
            size={20}
            color={iconColor}
          />
        ),
        label: 'Delete woot',
        enabled: createdByMe,
      },
    ]
      .filter((opt) => opt.enabled)
      .map((opt) => ({
        ...opt,
        disabled: opt.disabled || deleteMutation.isPending,
      }))

    const remoteUrl = getRemotePostUrl(post)
    const secondaryOptions = [
      {
        action: () => biteMutation.mutate(post.id),
        label: 'Bite post',
        icon: <FontAwesome6 name="drumstick-bite" size={20} />,
        enabled: !createdByMe && !biteMutation.isPending,
      },
      {
        action: () => toggleCollapsed(post.id, !collapsed),
        icon: <MaterialCommunityIcons name="arrow-collapse" size={20} />,
        label: collapsed ? 'Expand' : 'Collapse',
        enabled: true,
      },
      {
        action: () => {
          Share.share({
            message: `${env?.BASE_URL}/fediverse/post/${post.id}`,
          })
        },
        icon: <MaterialCommunityIcons name="share-variant" size={20} />,
        label: 'Share wafrn link',
        enabled: true,
        disabled: false,
      },
      {
        action: () => {
          Share.share({
            message: remoteUrl!,
          })
        },
        icon: <MaterialCommunityIcons name="share-variant-outline" size={20} />,
        label: 'Share remote link',
        enabled: !!remoteUrl,
      },
      {
        action: () => {
          router.navigate(remoteUrl!)
        },
        icon: <MaterialCommunityIcons name="open-in-new" size={20} />,
        label: remoteUrl?.startsWith(BSKY_URL)
          ? 'Open in Bluesky'
          : 'Open remote post',
        enabled: !!remoteUrl,
      },
      {
        action: async () => {
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
        },
        icon: <MaterialCommunityIcons name="content-copy" size={20} />,
        label: 'Copy post text',
        enabled: true,
      },
      {
        action: () => {
          setReportModalOpen(true)
        },
        icon: <MaterialCommunityIcons name="alert-box-outline" size={20} />,
        label: 'Report',
        enabled: true,
      },
      {
        action: () => {
          Alert.alert(
            `${isSilenced ? 'Uns' : 'S'}ilence post`,
            `All notifications for this post (including replies) will be ${
              isSilenced ? 'un' : ''
            }silenced. Are you sure you want to do this?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Silence',
                style: 'destructive',
                onPress: () => silenceMutation.mutate(isSilenced),
              },
            ],
            { cancelable: true },
          )
        },
        icon: (
          <MaterialCommunityIcons
            name={isSilenced ? 'bell-outline' : 'bell-off'}
            size={20}
          />
        ),
        label: `${isSilenced ? 'Uns' : 'S'}ilence post`,
        enabled: createdByMe,
        disabled: silenceMutation.isPending,
      },
      {
        action: () => {
          router.navigate(`/editor?type=edit&editId=${post.id}`)
        },
        icon: <MaterialCommunityIcons name="pencil" size={20} />,
        label: 'Edit',
        enabled: createdByMe,
      },
    ]
      .filter((opt) => opt.enabled)
      .map((opt) => ({
        ...opt,
        disabled: opt.disabled || deleteMutation.isPending,
      }))

    if (orientation === 'vertical') {
      return {
        mainOptions: [],
        secondaryOptions: mainOptions.concat(secondaryOptions),
      }
    } else {
      return {
        mainOptions,
        secondaryOptions,
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    orientation,
    post,
    me,
    isRewooted,
    isLiked,
    isSilenced,
    likeMutation,
    rewootMutation,
    emojiReactMutation,
    deleteMutation,
    silenceMutation,
  ])

  const sheetRef = useRef<TrueSheet>(null)

  function onPickEmoji(emoji: Emoji) {
    setEmojiPickerOpen(false)

    const haveIReacted = myReactions.some(
      (r) => r.emojiId === emoji.id || r.content === emoji.content,
    )
    emojiReactMutation.mutate({
      post,
      emojiName: emoji.content || emoji.name,
      undo: haveIReacted,
    })
  }

  if (orientation === 'vertical') {
    return (
      <>
        {reportModalOpen && (
          <View className="absolute inset-0">
            <ReportPostModal
              post={post}
              open={reportModalOpen}
              onClose={() => setReportModalOpen(false)}
            />
          </View>
        )}
        {emojiPickerOpen && (
          <View className="absolute inset-0">
            <EmojiPicker
              open={emojiPickerOpen}
              setOpen={setEmojiPickerOpen}
              onPick={onPickEmoji}
              reactions={myReactions}
            />
          </View>
        )}
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
        <ScrollingBottomShhet sheetRef={sheetRef}>
          {secondaryOptions.map((option, i) => (
            <MenuItem
              key={i}
              label={option.label}
              action={option.action}
              icon={option.icon}
              sheetRef={sheetRef}
              disabled={option.disabled}
              style={optionStyleBig(i)}
            />
          ))}
        </ScrollingBottomShhet>
      </>
    )
  }

  return (
    <>
      {emojiPickerOpen && (
        <View className="absolute inset-0">
          <EmojiPicker
            open={emojiPickerOpen}
            setOpen={setEmojiPickerOpen}
            onPick={onPickEmoji}
            reactions={myReactions}
          />
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
        <View id="interactions" className="flex-row gap-3">
          {mainOptions.map((opt) => (
            <Pressable
              key={opt.label}
              onPress={opt.action}
              className="p-1.5 active:bg-gray-300/30 rounded-full relative"
              style={{
                opacity: opt.disabled ? 0.5 : 1,
              }}
            >
              {opt.icon}
            </Pressable>
          ))}
        </View>
      </View>
    </>
  )
}
