import { useState, useEffect } from 'react'
import { getDashboardContext, dedupePosts } from './api/dashboard'
import { DashboardData } from './api/posts.types'
import { Settings } from './api/settings'
import { DashboardContextData } from './contexts/DashboardContext'
import { FeedItem, getFeedData } from './feeds'

type ProccessedContext = {
  context: DashboardContextData | null
  feed: FeedItem[]
}

const EMPTY_ARRAY = [] as never[]

export default function useContextProcessor({
  pages = EMPTY_ARRAY,
  settings,
}: {
  pages?: DashboardData[]
  settings?: Settings
}) {
  const [result, setResult] = useState<ProccessedContext>({
    context: null,
    feed: [],
  })

  useEffect(() => {
    let handle: number
    if (settings && pages.length > 0) {
      handle = requestIdleCallback(() => {
        const context = getDashboardContext(pages, settings)
        const posts = dedupePosts(pages)
        const feed = getFeedData(context, posts, settings)
        setResult({ context, feed })
      })
    }
    return () => {
      if (handle) {
        cancelIdleCallback(handle)
      }
    }
  }, [pages, settings])

  return result
}
