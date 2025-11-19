import { Link, router, Stack, usePathname } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { ThemedText } from '@/components/ThemedText'
import parseIncomingPath from '@/lib/parseIncomingPath'
import { useEffect } from 'react'
import { Colors } from '@/constants/Colors'

export default function NotFoundScreen() {
  const pathname = usePathname()

  useEffect(() => {
    const parsedPath = parseIncomingPath(pathname)
    if (pathname !== parsedPath) {
      router.replace(parsedPath)
    }
  }, [pathname])

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View
        style={[styles.container, { backgroundColor: Colors.dark.background }]}
      >
        <View className="mb-4">
          <ThemedText type="defaultSemiBold" className="text-sm">
            not found: {pathname}
          </ThemedText>
        </View>
        <ThemedText type="title">This screen {"doesn't"} exist</ThemedText>
        <ThemedText type="default">yet</ThemedText>
        {router.canGoBack() ? (
          <Link href=".." style={styles.link}>
            <ThemedText type="link">Go back</ThemedText>
          </Link>
        ) : (
          <Link href="/" style={styles.link}>
            <ThemedText type="link">Go to home screen!</ThemedText>
          </Link>
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
})
