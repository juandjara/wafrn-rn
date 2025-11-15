import { PostUser } from '@/lib/api/posts.types'
import { formatUserUrl, formatSmallAvatar } from '@/lib/formatters'
import { Link } from 'expo-router'
import { useCallback, useRef } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { Image } from 'expo-image'
import {
  Menu,
  MenuOptions,
  MenuTrigger,
  renderers,
} from 'react-native-popup-menu'
import { useCSSVariable } from 'uniwind'

export default function ReactionDetailsMenu({
  children,
  users,
  reaction,
  reactionName,
  onLongPress,
}: {
  children: React.ReactNode
  users: PostUser[]
  reaction: React.ReactNode
  reactionName?: string
  onLongPress?: () => void
}) {
  const gray900 = useCSSVariable('--color-gray-900') as string
  const menuRef = useRef<Menu>(null)
  const renderItem = useCallback(
    ({ item: user }: { item: PostUser }) => (
      <Link
        asChild
        key={user.id}
        href={`/user/${user.url}`}
        onPress={() => {
          menuRef.current?.close()
        }}
      >
        <Pressable className="my-1 flex-row items-center gap-2">
          <Image
            source={{ uri: formatSmallAvatar(user.avatar) }}
            style={{ borderRadius: 8, width: 24, height: 24 }}
          />
          <Text className="text-gray-200 grow shrink-0">
            {formatUserUrl(user.url)}
          </Text>
        </Pressable>
      </Link>
    ),
    [],
  )

  return (
    <Menu
      ref={menuRef}
      renderer={renderers.Popover}
      rendererProps={{
        placement: 'auto',
        preferredPlacement: 'bottom',
        anchorStyle: {
          backgroundColor: gray900,
        },
      }}
    >
      <MenuTrigger onAlternativeAction={onLongPress}>{children}</MenuTrigger>
      <MenuOptions
        customStyles={{
          optionsContainer: {
            backgroundColor: gray900,
          },
        }}
      >
        <View className="p-2 pb-0">
          {reactionName && (
            <Text className="text-gray-300 text-xs">{reactionName}</Text>
          )}
          <View className="flex-row items-center gap-1">
            <Text className="text-gray-200 text-sm">{reaction}</Text>
            <Text className="text-gray-200 text-sm">by</Text>
          </View>
        </View>
        <FlatList
          data={users}
          renderItem={renderItem}
          style={{ maxHeight: 200 }}
          className="bg-gray-900 rounded-lg m-2"
          keyExtractor={(item) => item.id}
        />
      </MenuOptions>
    </Menu>
  )
}
