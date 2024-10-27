import { Link, router, Stack, useFocusEffect, useUnstableGlobalHref } from 'expo-router'
import { StyleSheet } from 'react-native'
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import { useWebLinkDetector } from '@/lib/weblinks'

export default function NotFoundScreen() {
  const href = useUnstableGlobalHref()
  console.log(`not found: ${href}`)

  const weblink = useWebLinkDetector()
  useFocusEffect(() => {
    if (weblink) {
      router.replace(weblink)
    }
  })

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="defaultSemiBold" className='mb-2'>{href}</ThemedText>
        <ThemedText type="title">
          This screen doesn't exist
        </ThemedText>
        <ThemedText type='default'>yet</ThemedText>
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
