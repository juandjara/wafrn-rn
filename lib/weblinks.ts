import { BASE_URL } from "./config"
import { parse, useURL } from "expo-linking"
import { useMemo } from "react"

export function useWebLinkDetector() {
  const url = useURL()
  return useMemo(() => {
    if (!url) {
      return null
    }

    const { hostname, path } = parse(url)
    const isWafrnWeb = BASE_URL.includes(hostname || '')
    const mappedPath = isWafrnWeb && path && webPathToAppPath(path)

    return mappedPath || null
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
