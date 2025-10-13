import { Link, router, Stack, usePathname } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import parseIncomingPath from '@/lib/parseIncomingPath'
import { useEffect } from 'react'

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
      <ThemedView style={styles.container}>
        <View className="mb-4">
          <ThemedText type="defaultSemiBold" className="text-sm">
            not found: {pathname}
          </ThemedText>
        </View>
        <ThemedText type="title">This screen doesn't exist</ThemedText>
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
      </ThemedView>
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
