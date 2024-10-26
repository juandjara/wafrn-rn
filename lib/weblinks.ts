import { router } from "expo-router"
import { BASE_URL } from "./config"
import { parse, useURL } from "expo-linking"
import { useEffect } from "react"

export function useWebLinkDetector() {
  const url = useURL()

  useEffect(() => {
    if (!url) {
      return
    }

    const { hostname, path } = parse(url)
    const isWafrnWeb = BASE_URL.includes(hostname || '')
    const mappedPath = isWafrnWeb && path && webPathToAppPath(path)

    if (mappedPath) {
      router.replace(mappedPath)
    }
  }, [url])
}

// transform a web url to a native url
export default function webPathToAppPath(webPath: string) {
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
