import { Post } from "@/lib/api/posts.types";
import { PrivacyLevel } from "@/lib/api/privacy";
import { BASE_URL } from "@/lib/config";
import { useParsedToken } from "@/lib/contexts/AuthContext";
import { AntDesign, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Share, Text, View } from "react-native";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from "react-native-popup-menu";
import colors from "tailwindcss/colors";
import EmojiPicker from "../EmojiPicker";

const optionStyle = (i: number) => ({
  padding: 12,
  borderTopWidth: i > 0 ? 1 : 0,
  borderTopColor: colors.gray[200],
  flexDirection: 'row' as const,
  gap: 12,
})

export default function InteractionRibbon({ post, orientation = 'horizontal' }: {
  post: Post
  orientation?: 'horizontal' | 'vertical'
}) {
  const me = useParsedToken()
  const createdByMe = post.userId === me?.userId
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)

  const { mainOptions, collapsedOptions } = useMemo(() => {
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
        action: () => {},
        label: 'Rewoot',
        icon: <AntDesign name="retweet" size={20} color={iconColor} />,
        enabled: post.privacy !== PrivacyLevel.DIRECT_MESSAGE && post.privacy !== PrivacyLevel.FOLLOWERS_ONLY
      },
      {
        action: () => {},
        label: 'Like',
        icon: <MaterialCommunityIcons name="heart" size={20} color={iconColor} />,
        enabled: !createdByMe
      },
      {
        action: () => {
          setEmojiPickerOpen(true)
        },
        label: 'React with an emoji',
        icon: <MaterialIcons name="emoji-emotions" size={20} color={iconColor} />,
        enabled: !createdByMe
      }
    ].filter((opt) => opt.enabled)
    const collapsedOptions = [
      {
        action: () => {
          Share.share({
            message: `${BASE_URL}/fediverse/post/${post.id}`,
          })
        },
        icon: <MaterialCommunityIcons name='share-variant' size={20} />,
        label: 'Share wafrn link',
        enabled: true,
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
          // TODO launch confirmation dialog and run delete mutation
        },
        icon: <MaterialCommunityIcons name='delete-outline' size={20} />,
        label: 'Delete woot',
        enabled: createdByMe,
      }
    ].filter((opt) => opt.enabled)

    if (orientation === 'vertical') {
      return {
        mainOptions: [],
        collapsedOptions: mainOptions.concat(collapsedOptions)
      }
    } else {
      return {
        mainOptions,
        collapsedOptions
      }
    }
  }, [orientation, post, createdByMe])

  function onPickEmoji() {
    setEmojiPickerOpen(false)
    // TODO run emoji reaction mutation
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
            {collapsedOptions.map((option, i) => (
              <MenuOption
                key={i}
                value={option.label}
                style={optionStyle(i)}
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
            <Pressable key={opt.label} onPress={opt.action} className="p-1.5 active:bg-gray-300/30 rounded-full">
              {opt.icon}
            </Pressable>
          ))}
        </View>
      </View>
    </>
  )
}