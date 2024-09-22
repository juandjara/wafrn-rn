import { PostUser } from "@/lib/api/posts.types"
import { formatSmallAvatar, formatUserUrl } from "@/lib/formatters"
import { Link } from "expo-router"
import { useRef } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import { Image } from 'expo-image'
import { Menu, MenuOptions, MenuTrigger, renderers } from "react-native-popup-menu"
import colors from "tailwindcss/colors"

export default function ReactionDetailsMenu({ children, users, reaction, reactionName }: {
  children: React.ReactNode
  users: PostUser[]
  reaction: React.ReactNode
  reactionName?: string
}) {
  const menuRef = useRef<Menu>(null)
  return (
    <Menu
      ref={menuRef}
      renderer={renderers.Popover}
      rendererProps={{
        placement: 'auto',
        preferredPlacement: 'bottom',
        anchorStyle: {
          backgroundColor: colors.gray[900],
        }
      }}      
    >
      <MenuTrigger>{children}</MenuTrigger>
      <MenuOptions customStyles={{
        optionsContainer: {
          backgroundColor: colors.gray[900],
        },
      }}>
        <View className="p-2 pb-0">
          {reactionName && (
            <Text className="text-gray-300 text-xs">
              {reactionName}
            </Text>
          )}
          <View className="flex-row items-center gap-1">
            <Text className="text-gray-200 text-sm">{reaction}</Text>
            <Text className="text-gray-200 text-sm">by</Text>
          </View>
        </View>
        <ScrollView
          style={{ maxHeight: 200 }}
          className="bg-gray-900 rounded-lg m-2"
        >
          {users.map((user) => (
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
                  className="rounded-lg"
                  source={{ uri: formatSmallAvatar(user.avatar) }}
                  style={{ width: 24, height: 24 }}
                />
                <Text className="text-gray-200 flex-grow flex-shrink-0">
                  {formatUserUrl(user)}
                </Text>
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      </MenuOptions>
    </Menu>
  )
}
