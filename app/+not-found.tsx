import { parse, useURL } from 'expo-linking'
import { Link, router, Stack, usePathname } from 'expo-router'
import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import { BASE_URL } from '@/lib/config'
import webPathToAppPath from '@/lib/webPathToAppPath'

export default function NotFoundScreen() {
  console.log(`not found: ${usePathname()}`)
  const url = useURL()

  useEffect(() => {
    if (!url) {
      return
    }

    const { hostname, path } = parse(url)
    const isWafrnWeb = BASE_URL.includes(hostname || '')
    const mappedPath = isWafrnWeb && path && webPathToAppPath(path)

    if (mappedPath) {
      router.push(mappedPath)
    }
  }, [url])

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={styles.container}>
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
