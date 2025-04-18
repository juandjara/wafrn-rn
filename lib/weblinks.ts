/** transform a web pathname to a native pathname */
export default function webPathToAppPath(webPath: string) {
  if (webPath.startsWith('/')) {
    webPath = webPath.replace('/', '')
  }

  if (webPath.startsWith('fediverse/')) {
    webPath = webPath.replace('fediverse/', '')
  }

  if (webPath.startsWith('blog/')) {
    const user = webPath.replace('blog/', '')
    return `/user/${user}`
  }
  if (webPath.startsWith('post/')) {
    const postId = webPath.replace('post/', '')
    return `/post/${postId}`
  }
  if (webPath.startsWith('dashboard/search/')) {
    const q = webPath.replace('dashboard/search/', '')
    return `/search?q=${q}`
  }
  return '/'
}
