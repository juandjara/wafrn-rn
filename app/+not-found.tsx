import { Link, router, Stack, usePathname } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { ThemedText } from '@/components/ThemedText'
import parseIncomingPath from '@/lib/parseIncomingPath'
import { useEffect, useMemo } from 'react'
import { Colors } from '@/constants/Colors'

export default function NotFoundScreen() {
  const pathname = usePathname()
  const parsedPath = useMemo(() => parseIncomingPath(pathname), [pathname])

  // `parseIncomingPath` returns null when no rewrite rule was applied and
  // `parseIncomingPath(parseIncomingPath(x))` is always null,
  // so a rewritten path that 404s again does not continue the redirect chain
  useEffect(() => {
    if (parsedPath !== null) {
      router.replace(parsedPath)
    }
  }, [parsedPath])

  if (parsedPath !== null) {
    return (
      <>
        <Stack.Screen options={{ title: 'Wafrn' }} />
        <View
          style={[
            styles.container,
            { backgroundColor: Colors.dark.background },
          ]}
        >
          <ThemedText type="title">Opening link...</ThemedText>
        </View>
      </>
    )
  }

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
