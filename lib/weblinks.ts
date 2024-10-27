import { BASE_URL } from "./config"
import { getInitialURL, parse } from "expo-linking"
import { useEffect, useState } from "react"

export function useWebLinkDetector() {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const handleUrl = async () => {
      const initialUrl = await getInitialURL()
      if (isMounted) {
        setUrl(webUrlToAppUrl(initialUrl))
      }
    }
    handleUrl()

    return () => {
      isMounted = false
    }
  }, [])

  return url
}

// transform a web url to a native url
export default function webUrlToAppUrl(webUrl: string | null) {
  if (!webUrl) {
    return null
  }

  const { hostname, path } = parse(webUrl)
  const isWafrnWeb = BASE_URL.includes(hostname || '')
  const webPath = isWafrnWeb && path

  if (!webPath) {
    return null
  }

  if (webPath.startsWith('blog/')) {
    const user = webPath.replace('blog/', '')
    return `/user/${user}`
  }
  if (webPath.startsWith('post/') || webPath.startsWith('fediverse/post/')) {
    const postId = webPath.replace('fediverse/post/', '').replace('post/', '')
    return `/post/${postId}`
  }
  if (webPath.startsWith('dashboard/search/')) {
    const q = webPath.replace('dashboard/search/', '')
    return `/search/${q}`
  }
  return '/'
}
