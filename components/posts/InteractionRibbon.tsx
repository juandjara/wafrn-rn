import { Post } from "@/lib/api/posts.types";
import { PrivacyLevel } from "@/lib/api/privacy";
import { BASE_URL } from "@/lib/config";
import { useParsedToken } from "@/lib/contexts/AuthContext";
import { AntDesign, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, Share, Text, View } from "react-native";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from "react-native-popup-menu";
import colors from "tailwindcss/colors";
import EmojiPicker, { Emoji } from "../EmojiPicker";
import { optionStyle } from "@/lib/styles";
import { useDashboardContext } from "@/lib/contexts/DashboardContext";
import AnimatedIcon from "./AnimatedIcon";
import { useSharedValue, withSpring } from "react-native-reanimated";
import { useLikeMutation } from "@/lib/interaction";
import { useEmojiReactMutation } from "@/lib/api/emojis";
import { useDeleteMutation } from "@/lib/api/posts";

export default function InteractionRibbon({ post, orientation = 'horizontal' }: {
  post: Post
  orientation?: 'horizontal' | 'vertical'
}) {
  const me = useParsedToken()
  const context = useDashboardContext()
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)

  const isLiked = context.likes.some((like) => like.postId === post.id && like.userId === me?.userId)
  const liked = useSharedValue(isLiked ? 1 : 0)
  if (isLiked !== Boolean(Math.round(liked.value))) {
    liked.value = isLiked ? 1 : 0
  }

  const isRewooted = (context.rewootIds || []).includes(post.id)
  const rewooted = useSharedValue(isRewooted ? 1 : 0)
  if (isRewooted !== Boolean(Math.round(rewooted.value))) {
    rewooted.value = isRewooted ? 1 : 0
  }

  const likeMutation = useLikeMutation(post)
  const emojiReactMutation = useEmojiReactMutation(post)
  const deleteMutation = useDeleteMutation(post)

  const { mainOptions, secondaryOptions } = useMemo(() => {
    const createdByMe = post.userId === me?.userId
    const iconColor = orientation === 'vertical' ? 'black' : 'white'

    const mainOptions = [
      {
        action: () => {},
        label: 'Reply',
        icon: <MaterialCommunityIcons name="reply" size={20} color={iconColor} />,
        enabled: true
      },
      {
        action: () => {},
        label: 'Quote',
        icon: <MaterialIcons name="format-quote" size={20} color={iconColor} />,
        enabled: post.privacy === PrivacyLevel.PUBLIC || post.privacy === PrivacyLevel.UNLISTED
      },
      {
        action: () => {
          rewooted.value = withSpring(isRewooted ? 0 : 1)
        },
        label: isRewooted ? 'Undo Rewoot' : 'Rewoot',
        icon: (
          <AnimatedIcon
            animValue={rewooted}
            icon={<AntDesign name="retweet" size={20} color={iconColor} />}
            iconActive={<AntDesign name="retweet" size={20} color={colors.green[500]} />}
          />
        ),
        enabled: post.privacy !== PrivacyLevel.DIRECT_MESSAGE && post.privacy !== PrivacyLevel.FOLLOWERS_ONLY
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
            icon={<MaterialCommunityIcons name="heart-outline" size={20} color={iconColor} />}
            iconActive={<MaterialCommunityIcons name="heart" size={20} color={colors.red[500]} />}
          />
        ),
        enabled: !createdByMe
      },
      {
        action: () => {
          setEmojiPickerOpen(true)
        },
        label: 'React with an emoji',
        icon: <MaterialIcons name="emoji-emotions" size={20} color={iconColor} />,
        disabled: emojiReactMutation.isPending,
        enabled: !createdByMe
      }
    ]
      .filter((opt) => opt.enabled)
      .map((opt) => ({
        ...opt,
        disabled: opt.disabled || deleteMutation.isPending,
      }))

    const secondaryOptions = [
      {
        action: () => {
          Share.share({
            message: `${BASE_URL}/fediverse/post/${post.id}`,
          })
        },
        icon: <MaterialCommunityIcons name='share-variant' size={20} />,
        label: 'Share wafrn link',
        enabled: true,
        disabled: false,
      },
      {
        action: () => {
          Share.share({
            message: post.remotePostId!,
          })
        },
        icon: <MaterialCommunityIcons name='share-variant-outline' size={20} />,
        label: 'Share remote link',
        enabled: !!post.remotePostId
      },
      {
        action: () => {
          router.navigate(post.remotePostId!)
        },
        icon: <MaterialCommunityIcons name='open-in-new' size={20} />,
        label: 'Open remote post',
        enabled: !!post.remotePostId
      },
      {
        action: () => {
          router.navigate(`/report/${post.id}`)
        },
        icon: <MaterialIcons name='report-problem' size={20} />,
        label: 'Report',
        enabled: true,
      },
      {
        action: () => {
          // TODO launch confirmation dialog and run mute mutation
        },
        icon: <MaterialCommunityIcons name='bell-off' size={20} />,
        label: 'Silence post',
        enabled: createdByMe,
      },
      {
        action: () => {
          // TODO open editor with context
        },
        icon: <MaterialCommunityIcons name='pencil' size={20} />,
        label: 'Edit',
        enabled: createdByMe && post.privacy === PrivacyLevel.INSTANCE_ONLY,
      },
      {
        action: () => {
          Alert.alert('Delete post', 'Are you sure you want to delete this post?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => {
              deleteMutation.mutate()
            } }
          ], { cancelable: true })
          // TODO launch confirmation dialog and run delete mutation
        },
        icon: <MaterialCommunityIcons name='delete-outline' size={20} />,
        label: 'Delete woot',
        enabled: createdByMe,
      }
    ]
      .filter((opt) => opt.enabled)
      .map((opt) => ({
        ...opt,
        disabled: opt.disabled || deleteMutation.isPending,
      }))

    if (orientation === 'vertical') {
      return {
        mainOptions: [],
        secondaryOptions: mainOptions.concat(secondaryOptions)
      }
    } else {
      return {
        mainOptions,
        secondaryOptions
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    orientation,
    post,
    me,
    isRewooted,
    isLiked,
    likeMutation,
    emojiReactMutation,
    deleteMutation,
  ])

  function onPickEmoji(emoji: Emoji) {
    setEmojiPickerOpen(false)
    emojiReactMutation.mutate(emoji.content || emoji.name)
  }

  if (orientation === 'vertical') {
    return (
      <>
        <EmojiPicker open={emojiPickerOpen} setOpen={setEmojiPickerOpen} onPick={onPickEmoji} />
        <Menu style={{
          margin: 6,
          borderRadius: 8,
          backgroundColor: colors.indigo[950]
        }}>
          <MenuTrigger style={{ padding: 6 }}>
            <MaterialCommunityIcons
              size={20}
              name={`dots-${orientation}`}
              color={colors.gray[300]}
              style={{ opacity: 0.75 }}
            />
          </MenuTrigger>
          <MenuOptions customStyles={{
            optionsContainer: {
              transformOrigin: 'top right',
              borderRadius: 8,
            },
          }}>
            {secondaryOptions.map((option, i) => (
              <MenuOption
                key={i}
                value={option.label}
                style={{
                  ...optionStyle(i),
                  opacity: option.disabled ? 0.75 : 1
                }}
                onSelect={option.action}
              >
                {option.icon}
                <Text className="text-sm flex-grow">{option.label}</Text>
              </MenuOption>
            ))}
          </MenuOptions>
        </Menu>
      </>
    )
  }

  return (
    <>
      <EmojiPicker open={emojiPickerOpen} setOpen={setEmojiPickerOpen} onPick={onPickEmoji} />
      <View id='interaction-ribbon' className="bg-indigo-950 items-center flex-row py-2 px-3">
        {post.notes !== undefined ? (
          <Link id='notes' href={`/post/${post.id}`} asChild>
            <Text className="flex-grow text-gray-200 text-sm active:bg-indigo-900/75 py-1 px-1 -mx-1 rounded-md">
              {post.notes} Notes
            </Text>
          </Link>
        ) : null}
        <View id='interactions' className="flex-row gap-3">
          {mainOptions.map((opt) => (
            <Pressable
              key={opt.label}
              onPress={opt.action}
              className="p-1.5 active:bg-gray-300/30 rounded-full relative"
              style={{
                opacity: opt.disabled ? 0.5 : 1
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